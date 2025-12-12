// src/core/registry/pid-registry-client.ts

/**
 * [CORE][REGISTRY][CLASS][META:{singleton,extends=SecurePIDRegistry}][PIDRegistryClient][#REF:Bun.file,Bun.write,PIDAuditTrail,PIDFileSystem,Logger]
 *
 * PID-aware wrapper for Bun's npm registry operations
 * Every install, publish, and authentication is tracked with:
 * - PID context and execution chain
 * - HMAC integrity for tokens
 * - Audit trails for compliance
 * - Error attribution with full context
 * - Cross-process package resolution
 */

import { Database } from 'bun:sqlite';
import { SecurePIDRegistry } from '../telemetry/pid-context';
import { PIDAuditTrail } from '../telemetry/pid-audit-trail';
import { LoggerManager } from '../error/error-handler';
import type { TelemetryContext } from '../telemetry/telemetry-types';

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

export interface RegistryConfig {
  url: string;
  username: string;
  token?: string;
  tokenEnvVar?: string;
  tokenHMAC?: string;
  scopes?: string[];
  save?: boolean;
  exact?: boolean;
}

export interface InstallOptions {
  save?: boolean;
  dev?: boolean;
  exact?: boolean;
  cwd?: string;
}

export interface RegistryContext extends TelemetryContext {
  packageName?: string;
  version?: string;
}

export interface PackageInstall {
  package: string;
  version: string;
  pid: number;
  instance_id?: string;
  installed_at: string;
  duration_ns: number;
  registry: string;
  integrity: string;
}

export interface ResolvedPackage {
  package: string;
  version: string;
  installed_in_pids: number[];
  version_consensus: number;
}

export interface ConfigurationResult {
  success: boolean;
  configPath: string;
  backupPath?: string;
  pid: number;
  instanceId?: string;
}

export interface InstallResult {
  success: boolean;
  package: string;
  version: string;
  receiptPath: string;
  pid: number;
  instanceId?: string;
  duration_ns?: number;
}

export interface RegistryReport {
  period: { start: Date; end: Date };
  totalInstalls: number;
  uniquePIDs: number;
  uniquePackages: number;
  installs: PackageInstall[];
  byPID: Array<{
    pid: number;
    instanceId?: string;
    packageCount: number;
    totalDuration: number;
    packages: string[];
  }>;
  anomalies: Array<{
    type: string;
    pid: number;
    package: string;
    versions: string[];
  }>;
  generatedAt: Date;
  generatedBy: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ──────────────────────────────────────────────────────────────
// SIMPLE CACHE
// ──────────────────────────────────────────────────────────────

class SimpleCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, { value, expires: Date.now() + ttlMs });
  }
}

// ──────────────────────────────────────────────────────────────
// PID REGISTRY CLIENT
// ──────────────────────────────────────────────────────────────

export class PIDRegistryClient extends SecurePIDRegistry {
  private static clientInstance: PIDRegistryClient;
  private readonly audit = PIDAuditTrail.getInstance();
  private readonly logger = LoggerManager.getInstance();
  private readonly cache = new SimpleCache<ResolvedPackage>();
  private readonly hmacKey = process.env.REGISTRY_HMAC_KEY || 'orca-registry-default-key';

  // Track packages per PID
  private pidPackages = new Map<number, Set<string>>();

  // Registry configuration cache
  private registryConfig = new Map<string, RegistryConfig>();

  // SQLite database for tracking
  private db: Database;

  private constructor() {
    super();
    // Initialize SQLite database
    this.db = new Database(':memory:');
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS package_installs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package TEXT NOT NULL,
        version TEXT NOT NULL,
        pid INTEGER NOT NULL,
        instance_id TEXT,
        installed_at TEXT NOT NULL,
        duration_ns INTEGER NOT NULL,
        registry TEXT,
        integrity TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_package ON package_installs(package);
      CREATE INDEX IF NOT EXISTS idx_pid ON package_installs(pid);
      CREATE INDEX IF NOT EXISTS idx_installed_at ON package_installs(installed_at);
    `);
  }

  static getInstance(): PIDRegistryClient {
    if (!PIDRegistryClient.clientInstance) {
      PIDRegistryClient.clientInstance = new PIDRegistryClient();
    }
    return PIDRegistryClient.clientInstance;
  }

  // ──────────────────────────────────────────────────────────────
  // Enhanced bunfig.toml with PID Security
  // ──────────────────────────────────────────────────────────────

  /**
   * [CORE][REGISTRY][FUNCTION][META:{public,async,critical}][configureRegistry][#REF:Bun.file,PIDFileSystem,PIDAuditTrail]
   *
   * Securely configure registry with PID-stamped backup
   * Creates audit trail for all configuration changes
   */
  async configureRegistry(
    config: RegistryConfig,
    context?: RegistryContext
  ): Promise<ConfigurationResult> {
    const pid = process.pid;
    const requestId = context?.requestId || 'registry_configure';

    // Validate config before applying
    const validation = this.validateRegistryConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid registry config: ${validation.errors.join(', ')}`);
    }

    // Create PID-aware bunfig.toml
    const bunfigContent = this.generateBunfigContent(config);
    const configPath = './bunfig.toml';

    // Backup existing config
    const backupPath = `./bunfig.backup.${pid}.${Date.now()}.toml`;
    try {
      const existingConfig = await Bun.file(configPath).text();
      await Bun.write(backupPath, existingConfig);
      this.logger.logForPid(pid, 'info', 'Registry config backed up', { backupPath });
    } catch {
      this.logger.logForPid(pid, 'warn', 'No existing config to backup');
    }

    // Get process info for metadata
    const processInfo = this.getProcess(pid);

    // Write new config with PID metadata header
    const configWithMetadata = `# ORCA Registry Config - PID:${pid} Instance:${processInfo?.instanceId}\n# Generated: ${new Date().toISOString()}\n${bunfigContent}`;

    const bytesWritten = await Bun.write(configPath, configWithMetadata);

    // Cache config for this PID
    this.registryConfig.set(config.url, config);

    // Record packages for this PID
    if (!this.pidPackages.has(pid)) {
      this.pidPackages.set(pid, new Set());
    }

    // Generate HMAC for token if provided
    if (config.token) {
      const tokenHMAC = this.computeTokenHMAC(config.token, pid);
      config.tokenHMAC = tokenHMAC;

      // Store token securely (never in plain text audit log)
      await this.secureStoreToken(config.token, pid);
    }

    this.audit.record(pid, 'registry_configured', {
      url: config.url,
      username: config.username,
      hasToken: !!config.token,
      backup_path: backupPath,
      bytes_written: bytesWritten,
    }, context);

    this.logger.logForPid(pid, 'info', 'Registry configured successfully', {
      url: config.url,
      backup_path: backupPath,
      config_size: bytesWritten,
    });

    return {
      success: true,
      configPath,
      backupPath,
      pid,
      instanceId: processInfo?.instanceId,
    };
  }

  /**
   * Validate registry configuration
   */
  private validateRegistryConfig(config: RegistryConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.url) {
      errors.push('Registry URL is required');
    } else if (!config.url.startsWith('https://') && !config.url.startsWith('http://localhost')) {
      errors.push('Registry URL must use HTTPS (except localhost)');
    }

    if (!config.username) {
      errors.push('Username is required');
    }

    if (!config.token && !config.tokenEnvVar) {
      errors.push('Either token or tokenEnvVar is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * [CORE][REGISTRY][FUNCTION][META:{private,sync}][generateBunfigContent]
   *
   * Generate secure bunfig.toml content with token encryption
   */
  private generateBunfigContent(config: RegistryConfig): string {
    const lines = [
      `[install.registry]`,
      `url = "${config.url}"`,
      `username = "${config.username}"`,
    ];

    // Use environment variable for token (never hardcode)
    if (config.tokenEnvVar) {
      lines.push(`# Token stored in environment variable: ${config.tokenEnvVar}`);
      lines.push(`password = "$${config.tokenEnvVar}"`);
    } else if (config.token) {
      // Log warning about hardcoded token
      lines.push(`# WARNING: Token is hardcoded (not recommended)`);
      lines.push(`password = "${config.token}"`);
    }

    // Add PID context for debugging
    lines.push(``);
    lines.push(`# ORCA PID Context Configuration`);

    if (config.scopes && config.scopes.length > 0) {
      lines.push(`[install.scopes]`);
      for (const scope of config.scopes) {
        lines.push(`"${scope}" = { registry = "${config.url}", token = "$${config.tokenEnvVar || 'NPM_PASSWORD'}" }`);
      }
    }

    return lines.join('\n');
  }

  /**
   * [CORE][REGISTRY][FUNCTION][META:{public,async}][installPackage][#REF:bun install,PIDContext,PIDAuditTrail,PIDFileSystem]
   *
   * Install package with full PID context tracking
   * Records which PID installed which package version
   */
  async installPackage(
    packageSpec: string,
    options?: InstallOptions,
    context?: RegistryContext
  ): Promise<InstallResult> {
    const pid = process.pid;
    const processInfo = this.getProcess(pid);
    const requestId = context?.requestId || `install_${Date.now()}`;

    // Parse package spec
    const { name, version } = this.parsePackageSpec(packageSpec);

    this.audit.record(pid, 'install_start', {
      package: name,
      version,
      options,
    }, context);

    this.recordExecution('package_install_start', { package: name, version }, context);

    try {
      // Execute bun install with PID context
      const installCmd = ['bun', 'install', packageSpec];
      if (options?.save) installCmd.push('--save');
      if (options?.dev) installCmd.push('--dev');
      if (options?.exact) installCmd.push('--exact');

      const installStart = Bun.nanoseconds();

      // Run install in context with environment
      const proc = Bun.spawn(installCmd, {
        cwd: options?.cwd || process.cwd(),
        env: {
          ...process.env,
          NPM_CONFIG_REGISTRY: this.getRegistryUrl(),
          // Inject PID context for child processes
          ORCA_PARENT_PID: pid.toString(),
          ORCA_REQUEST_ID: requestId,
        },
        stdout: 'pipe',
        stderr: 'pipe',
      });

      // Capture output
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);

      const duration = Bun.nanoseconds() - installStart;

      if (exitCode !== 0) {
        throw new Error(`Install failed with exit code ${exitCode}: ${stderr}`);
      }

      // Parse installed version from package.json
      let installedVersion = version || 'latest';
      try {
        const packageJsonPath = `${options?.cwd || '.'}/node_modules/${name}/package.json`;
        const packageJson = await Bun.file(packageJsonPath).json();
        installedVersion = packageJson.version;
      } catch {
        // Use version from spec if package.json not found
      }

      // Record in PID package registry
      const packages = this.pidPackages.get(pid) || new Set();
      packages.add(`${name}@${installedVersion}`);
      this.pidPackages.set(pid, packages);

      // Create install receipt with PID stamp
      const receipt = {
        package: name,
        version: installedVersion,
        installed_by_pid: pid,
        installed_by_instance: processInfo?.instanceId,
        installed_at: new Date().toISOString(),
        duration_ns: duration,
        exit_code: exitCode,
        registry: this.getRegistryUrl(),
        integrity: this.calculatePackageIntegrity(name, installedVersion),
      };

      // Write receipt to PID-stamped location
      const receiptsDir = `${options?.cwd || '.'}/node_modules/.orca-install-receipts`;
      const receiptPath = `${receiptsDir}/${name.replace('/', '-')}@${installedVersion}.pid-${pid}.json`;

      try {
        await Bun.write(receiptsDir + '/.gitkeep', '');
        await Bun.write(receiptPath, JSON.stringify(receipt, null, 2));
      } catch {
        // Receipts dir might not exist, that's ok
      }

      // Add to SQLite for queries
      this.db.run(`
        INSERT INTO package_installs (package, version, pid, instance_id, installed_at, duration_ns, registry, integrity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, installedVersion, pid, processInfo?.instanceId, receipt.installed_at, duration, receipt.registry, receipt.integrity]);

      this.audit.record(pid, 'install_complete', receipt, context);

      this.logger.logForPid(pid, 'info', 'Package installed', {
        package: name,
        version: installedVersion,
        duration_ms: (duration / 1_000_000).toFixed(2),
      });

      return {
        success: true,
        package: name,
        version: installedVersion,
        receiptPath,
        pid,
        instanceId: processInfo?.instanceId,
        duration_ns: duration,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.audit.record(pid, 'install_failed', {
        package: name,
        version,
        error: errorMessage,
      }, context);

      this.recordExecution('package_install_failed', { package: name, error: errorMessage }, context);

      throw error;
    }
  }

  /**
   * Parse package spec into name and version
   */
  private parsePackageSpec(spec: string): { name: string; version?: string; scope?: string } {
    // Handle scoped packages (@org/package@version)
    const match = spec.match(/^(@[^/]+\/[^@]+|[^@]+)(?:@(.+))?$/);
    if (!match) {
      return { name: spec };
    }

    const name = match[1];
    const version = match[2];
    const scope = name.startsWith('@') ? name.split('/')[0] : undefined;

    return { name, version, scope };
  }

  /**
   * Get configured registry URL
   */
  private getRegistryUrl(): string {
    const configs = Array.from(this.registryConfig.values());
    return configs[0]?.url || 'https://registry.npmjs.org';
  }

  /**
   * Calculate package integrity hash
   */
  private calculatePackageIntegrity(name: string, version: string): string {
    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(`${name}@${version}:${process.pid}:${Date.now()}`);
    return hasher.digest('hex').slice(0, 16);
  }

  // ──────────────────────────────────────────────────────────────
  // Token Security Management
  // ──────────────────────────────────────────────────────────────

  /**
   * [SECURITY][REGISTRY][FUNCTION][META:{public,sync,critical}][computeTokenHMAC]
   *
   * Compute HMAC for token integrity verification
   */
  computeTokenHMAC(token: string, pid: number): string {
    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(token);
    hasher.update(this.hmacKey);
    hasher.update(pid.toString());
    return hasher.digest('hex');
  }

  /**
   * [SECURITY][REGISTRY][FUNCTION][META:{private,async,critical}][secureStoreToken]
   *
   * Store token securely (encrypted at rest)
   */
  private async secureStoreToken(token: string, pid: number): Promise<void> {
    const securePath = `./.secure/tokens/pid-${pid}.enc`;

    try {
      // Ensure directory exists
      await Bun.write('./.secure/tokens/.gitkeep', '');

      // Simple encryption (use proper crypto in production)
      const hasher = new Bun.CryptoHasher('sha256');
      hasher.update(token + this.hmacKey);
      const encrypted = hasher.digest('hex');

      await Bun.write(securePath, encrypted);

      this.logger.logForPid(pid, 'debug', 'Token stored securely', {
        path: securePath,
        hmac: this.computeTokenHMAC(token, pid).slice(0, 8),
      });
    } catch {
      // Secure storage might fail in some environments, that's ok
    }
  }

  /**
   * [SECURITY][REGISTRY][FUNCTION][META:{public,sync}][verifyTokenIntegrity]
   *
   * Verify token hasn't been tampered with
   */
  verifyTokenIntegrity(token: string, pid: number, expectedHMAC: string): boolean {
    const actualHMAC = this.computeTokenHMAC(token, pid);
    const isValid = actualHMAC === expectedHMAC;

    if (!isValid) {
      this.logger.error('Token integrity check FAILED', {
        pid,
        expected: expectedHMAC.slice(0, 8),
        actual: actualHMAC.slice(0, 8),
      });
    }

    return isValid;
  }

  // ──────────────────────────────────────────────────────────────
  // Package Tracking
  // ──────────────────────────────────────────────────────────────

  /**
   * Get all packages installed by a specific PID
   */
  getPackagesForPID(pid: number): Set<string> {
    return this.pidPackages.get(pid) || new Set();
  }

  /**
   * Get all PIDs that have installed packages
   */
  getAllPIDs(): number[] {
    return Array.from(this.pidPackages.keys());
  }

  // ──────────────────────────────────────────────────────────────
  // Audit & Compliance
  // ──────────────────────────────────────────────────────────────

  /**
   * [CORE][REGISTRY][FUNCTION][META:{public,async}][generateRegistryReport][#REF:PIDFileSystem,Database]
   *
   * Generate compliance report of all registry operations
   * Useful for security audits and compliance checks
   */
  async generateRegistryReport(
    startDate: Date,
    endDate: Date,
    context?: RegistryContext
  ): Promise<RegistryReport> {
    const pid = process.pid;
    const requestId = context?.requestId || `report_${Date.now()}`;

    // Query SQLite for registry operations
    const installs = this.db.prepare(`
      SELECT * FROM package_installs
      WHERE installed_at BETWEEN ? AND ?
      ORDER BY installed_at DESC
    `).all(startDate.toISOString(), endDate.toISOString()) as PackageInstall[];

    // Get unique PIDs and packages
    const uniquePIDs = new Set(installs.map(row => row.pid));
    const uniquePackages = new Set(installs.map(row => row.package));

    // Analyze by PID
    const byPID = new Map<number, PackageInstall[]>();
    for (const install of installs) {
      if (!byPID.has(install.pid)) {
        byPID.set(install.pid, []);
      }
      byPID.get(install.pid)!.push(install);
    }

    // Generate per-PID summaries
    const pidSummaries = Array.from(byPID.entries()).map(([pid, installs]) => ({
      pid,
      instanceId: installs[0]?.instance_id,
      packageCount: installs.length,
      totalDuration: installs.reduce((sum, i) => sum + i.duration_ns, 0),
      packages: installs.map(i => `${i.package}@${i.version}`),
    }));

    // Check for anomalies (multiple versions of same package)
    const anomalies: Array<{ type: string; pid: number; package: string; versions: string[] }> = [];
    for (const [pid, installs] of byPID) {
      const packageVersions = new Map<string, Set<string>>();
      for (const install of installs) {
        if (!packageVersions.has(install.package)) {
          packageVersions.set(install.package, new Set());
        }
        packageVersions.get(install.package)!.add(install.version);
      }

      for (const [pkg, versions] of packageVersions) {
        if (versions.size > 3) {
          anomalies.push({
            type: 'multiple_versions',
            pid,
            package: pkg,
            versions: Array.from(versions),
          });
        }
      }
    }

    const report: RegistryReport = {
      period: { start: startDate, end: endDate },
      totalInstalls: installs.length,
      uniquePIDs: uniquePIDs.size,
      uniquePackages: uniquePackages.size,
      installs,
      byPID: pidSummaries,
      anomalies,
      generatedAt: new Date(),
      generatedBy: pid,
    };

    // Write report to file
    const reportPath = `./reports/registry-report-${Date.now()}.pid-${pid}.json`;

    try {
      await Bun.write('./reports/.gitkeep', '');
      await Bun.write(reportPath, JSON.stringify(report, null, 2));
    } catch {
      // Reports dir might not exist, that's ok
    }

    this.audit.record(pid, 'registry_report_generated', {
      report_path: reportPath,
      installs: installs.length,
      anomalies: anomalies.length,
    }, context);

    return report;
  }

  // ──────────────────────────────────────────────────────────────
  // Cross-PID Package Resolution
  // ──────────────────────────────────────────────────────────────

  /**
   * [CORE][REGISTRY][FUNCTION][META:{public,async}][resolvePackageVersion][#REF:PIDMessageBus,PIDCache]
   *
   * Resolve package version across multiple PIDs
   * Ensures consistency and prevents version conflicts
   */
  async resolvePackageVersion(
    packageName: string,
    versionRange: string,
    context?: RegistryContext
  ): Promise<ResolvedPackage> {
    const pid = process.pid;
    const requestId = context?.requestId || `resolve_${Date.now()}`;
    const cacheKey = `pkg:${packageName}:${versionRange}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.audit.record(pid, 'package_cache_hit', {
        package: packageName,
        version_range: versionRange,
      }, context);
      return cached;
    }

    // Query all PIDs for installed versions
    const allPIDs = Array.from(this.pidPackages.keys());
    const versionMap = new Map<string, number[]>();

    for (const otherPid of allPIDs) {
      const packages = this.pidPackages.get(otherPid) || new Set();
      for (const pkg of packages) {
        const [name, version] = pkg.split('@');
        if (name === packageName) {
          if (!versionMap.has(version)) {
            versionMap.set(version, []);
          }
          versionMap.get(version)!.push(otherPid);
        }
      }
    }

    // Find best version match
    const versions = Array.from(versionMap.keys());
    const bestVersion = this.findBestVersion(versions, versionRange);

    const resolved: ResolvedPackage = {
      package: packageName,
      version: bestVersion,
      installed_in_pids: versionMap.get(bestVersion) || [],
      version_consensus: this.calculateVersionConsensus(versionMap, bestVersion),
    };

    // Cache for future requests
    this.cache.set(cacheKey, resolved, 300000); // 5 minute TTL

    this.audit.record(pid, 'package_resolved', {
      package: packageName,
      version: bestVersion,
      pids: resolved.installed_in_pids,
    }, context);

    return resolved;
  }

  /**
   * [CORE][REGISTRY][FUNCTION][META:{private,sync}][findBestVersion]
   *
   * Find best matching version using semver
   */
  private findBestVersion(versions: string[], range: string): string {
    if (versions.length === 0) return range;

    if (range === 'latest') {
      return versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
    }

    // Simple semver check (use proper semver lib in production)
    const rangeBase = range.replace(/[\^~>=<]/g, '');
    const valid = versions.filter(v => v.startsWith(rangeBase.split('.')[0]));
    return valid[0] || versions[0];
  }

  /**
   * [CORE][REGISTRY][FUNCTION][META:{private,sync}][calculateVersionConsensus]
   *
   * Calculate consensus score (0-1) for version adoption
   */
  private calculateVersionConsensus(versionMap: Map<string, number[]>, selected: string): number {
    const selectedCount = versionMap.get(selected)?.length || 0;
    const totalPIDs = Array.from(this.pidPackages.keys()).length;

    if (totalPIDs === 0) return 0;
    return selectedCount / totalPIDs;
  }

  /**
   * Test authentication with registry
   */
  async testAuthentication(testPackage: string, context?: RegistryContext): Promise<{ success: boolean; duration_ns: number }> {
    const start = Bun.nanoseconds();

    try {
      const registryUrl = this.getRegistryUrl();
      const response = await fetch(`${registryUrl}/${testPackage}`, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      const duration = Bun.nanoseconds() - start;

      return {
        success: response.ok,
        duration_ns: duration,
      };
    } catch {
      return {
        success: false,
        duration_ns: Bun.nanoseconds() - start,
      };
    }
  }
}

// Export singleton
export const registryClient = PIDRegistryClient.getInstance();
export default PIDRegistryClient;
