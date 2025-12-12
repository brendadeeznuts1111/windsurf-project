#!/usr/bin/env bun

/**
 * 🔒 Spawn Security Validator
 *
 * Validates spawn operations for security compliance.
 * Implements tool whitelisting, environment sanitization, and resource controls.
 */

import { spawn as bunSpawn, type SpawnOptions } from 'bun';

export interface SpawnSecurityConfig {
  validation: {
    enabled: boolean;
    validateToolsOnStartup: boolean;
    auditAllSpawns: boolean;
    blocklistEnvVars: string[];
  };
  sanitization: {
    allowedEnvVars: string[];
    sanitizePath: boolean;
    restrictWorkingDirectory: boolean;
  };
  resourceLimits: {
    maxConcurrentSpawns: number;
    maxTotalSpawnsPerHour: number;
    maxMemoryPerSpawnMB: number;
    maxCpuTimePerSpawnSeconds: number;
  };
  audit: {
    enabled: boolean;
    logFile: string;
    maxLogSizeMB: number;
    retentionDays: number;
  };
}

export interface SpawnValidationRequest {
  tool: string;
  args: string[];
  options: Partial<SpawnOptions>;
  workerId?: string;
}

export interface SpawnValidationResult {
  allowed: boolean;
  reason?: string;
  warnings: string[];
  sanitizedOptions?: Partial<SpawnOptions>;
}

export interface SecurityAuditEntry {
  timestamp: number;
  workerId?: string;
  tool: string;
  args: string[];
  allowed: boolean;
  reason?: string;
  warnings: string[];
  ipAddress?: string;
  userId?: string;
}

/**
 * Spawn Security Validator
 * Ensures all spawn operations meet security requirements
 */
export class SpawnSecurityValidator {
  private config: SpawnSecurityConfig;
  private auditLog: SecurityAuditEntry[] = [];
  private activeSpawns = new Set<string>();
  private spawnCounts = new Map<string, number[]>();

  constructor(config: SpawnSecurityConfig) {
    this.config = config;
  }

  /**
   * Initialize the security validator
   */
  async initialize(): Promise<void> {
    console.log('🔒 Initializing Spawn Security Validator');

    if (this.config.validation.validateToolsOnStartup) {
      await this.validateToolAvailability();
    }

    if (this.config.audit.enabled) {
      await this.initializeAuditLog();
    }

    console.log('✅ Spawn Security Validator initialized');
  }

  /**
   * Validate a spawn operation
   */
  async validateSpawn(request: SpawnValidationRequest): Promise<SpawnValidationResult> {
    const warnings: string[] = [];

    // 1. Tool validation
    const toolValidation = this.validateTool(request.tool);
    if (!toolValidation.allowed) {
      await this.auditSpawn(request, false, toolValidation.reason, warnings);
      return {
        allowed: false,
        reason: toolValidation.reason,
        warnings,
      };
    }

    // 2. Arguments validation
    const argsValidation = this.validateArguments(request.tool, request.args);
    warnings.push(...argsValidation.warnings);

    // 3. Options validation
    const optionsValidation = this.validateOptions(request.options);
    warnings.push(...optionsValidation.warnings);

    // 4. Resource limits check
    const resourceCheck = this.checkResourceLimits(request.workerId || 'unknown');
    if (!resourceCheck.allowed) {
      await this.auditSpawn(request, false, resourceCheck.reason, warnings);
      return {
        allowed: false,
        reason: resourceCheck.reason,
        warnings,
      };
    }

    // 5. Sanitize options
    const sanitizedOptions = this.sanitizeOptions(request.options);

    // 6. Audit successful validation
    await this.auditSpawn(request, true, undefined, warnings);

    return {
      allowed: true,
      warnings,
      sanitizedOptions,
    };
  }

  /**
   * Get security audit log
   */
  getAuditLog(limit: number = 100): SecurityAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    totalValidations: number;
    blockedSpawns: number;
    activeSpawns: number;
    warningsCount: number;
    recentBlocks: SecurityAuditEntry[];
  } {
    const blockedSpawns = this.auditLog.filter(entry => !entry.allowed).length;
    const warningsCount = this.auditLog.reduce((sum, entry) => sum + entry.warnings.length, 0);
    const recentBlocks = this.auditLog
      .filter(entry => !entry.allowed)
      .slice(-10);

    return {
      totalValidations: this.auditLog.length,
      blockedSpawns,
      activeSpawns: this.activeSpawns.size,
      warningsCount,
      recentBlocks,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async validateToolAvailability(): Promise<void> {
    // This would check if whitelisted tools are actually available
    // For now, we'll skip actual tool checking in the example
    console.log('   • Tool availability validation skipped (would check PATH)');
  }

  private async initializeAuditLog(): Promise<void> {
    try {
      // In a real implementation, this would load existing audit log
      console.log(`   • Audit logging enabled: ${this.config.audit.logFile}`);
    } catch (error) {
      console.warn(`⚠️ Failed to initialize audit log: ${error}`);
    }
  }

  private validateTool(tool: string): { allowed: boolean; reason?: string } {
    // This is a placeholder - in real implementation, this would check
    // against a comprehensive whitelist based on the worker's allowed tools
    const commonSafeTools = ['jq', 'curl', 'grep', 'sort', 'awk', 'cat', 'head', 'tail'];

    if (!commonSafeTools.includes(tool)) {
      return {
        allowed: false,
        reason: `Tool '${tool}' not in security whitelist`,
      };
    }

    return { allowed: true };
  }

  private validateArguments(tool: string, args: string[]): { warnings: string[] } {
    const warnings: string[] = [];

    // Check for dangerous argument patterns
    for (const arg of args) {
      // Check for shell injection attempts
      if (arg.includes(';') || arg.includes('|') || arg.includes('&')) {
        warnings.push(`Potentially dangerous argument detected: '${arg}'`);
      }

      // Check for path traversal
      if (arg.includes('../') || arg.includes('..\\')) {
        warnings.push(`Path traversal attempt detected: '${arg}'`);
      }

      // Check for command substitution
      if (arg.includes('$(') || arg.includes('`')) {
        warnings.push(`Command substitution detected: '${arg}'`);
      }
    }

    // Tool-specific validation
    if (tool === 'curl' && args.some(arg => arg.startsWith('-X') && !['GET', 'POST', 'PUT', 'DELETE'].includes(args[args.indexOf(arg) + 1]))) {
      warnings.push('Non-standard HTTP method used with curl');
    }

    return { warnings };
  }

  private validateOptions(options: Partial<SpawnOptions>): { warnings: string[] } {
    const warnings: string[] = [];

    // Check timeout
    if (options.timeout && options.timeout > 300000) { // 5 minutes
      warnings.push(`Very long timeout: ${options.timeout}ms`);
    }

    // Check buffer size
    if (options.maxBuffer && options.maxBuffer > 100 * 1024 * 1024) { // 100MB
      warnings.push(`Large buffer size: ${options.maxBuffer} bytes`);
    }

    // Check environment variables
    if (options.env) {
      const dangerousVars = ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'DYLD_LIBRARY_PATH'];
      for (const dangerousVar of dangerousVars) {
        if (options.env[dangerousVar]) {
          warnings.push(`Dangerous environment variable set: ${dangerousVar}`);
        }
      }
    }

    // Check working directory
    if (options.cwd) {
      const allowedDirs = ['/tmp', '/var/tmp', '/app', '/etc'];
      const isAllowed = allowedDirs.some(dir => options.cwd!.startsWith(dir));
      if (!isAllowed) {
        warnings.push(`Working directory not in allowed paths: ${options.cwd}`);
      }
    }

    return { warnings };
  }

  private checkResourceLimits(workerId: string): { allowed: boolean; reason?: string } {
    // Check concurrent spawns
    if (this.activeSpawns.size >= this.config.resourceLimits.maxConcurrentSpawns) {
      return {
        allowed: false,
        reason: `Maximum concurrent spawns exceeded (${this.config.resourceLimits.maxConcurrentSpawns})`,
      };
    }

    // Check hourly rate limit
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const workerSpawns = this.spawnCounts.get(workerId) || [];
    const recentSpawns = workerSpawns.filter(time => time > hourAgo);

    if (recentSpawns.length >= this.config.resourceLimits.maxTotalSpawnsPerHour) {
      return {
        allowed: false,
        reason: `Hourly spawn limit exceeded for worker ${workerId}`,
      };
    }

    return { allowed: true };
  }

  private sanitizeOptions(options: Partial<SpawnOptions>): Partial<SpawnOptions> {
    const sanitized: Partial<SpawnOptions> = { ...options };

    // Sanitize environment variables
    if (options.env) {
      sanitized.env = {};
      const allowedPatterns = this.config.sanitization.allowedEnvVars;

      for (const [key, value] of Object.entries(options.env)) {
        const isAllowed = allowedPatterns.some(pattern =>
          pattern.includes('*') ? key.startsWith(pattern.slice(0, -1)) : key === pattern
        );

        if (isAllowed) {
          sanitized.env![key] = value;
        }
      }

      // Remove blocked variables
      for (const blockedVar of this.config.validation.blocklistEnvVars) {
        delete sanitized.env![blockedVar];
      }
    }

    // Sanitize PATH if requested
    if (this.config.sanitization.sanitizePath && sanitized.env?.PATH) {
      sanitized.env.PATH = this.sanitizePath(sanitized.env.PATH);
    }

    return sanitized;
  }

  private sanitizePath(pathVar: string): string {
    // Remove potentially dangerous directories from PATH
    const dangerousDirs = ['/usr/local/sbin', '/sbin', '/usr/sbin'];
    const pathDirs = pathVar.split(':');

    const safeDirs = pathDirs.filter(dir =>
      !dangerousDirs.some(dangerous => dir.includes(dangerous))
    );

    return safeDirs.join(':');
  }

  private async auditSpawn(
    request: SpawnValidationRequest,
    allowed: boolean,
    reason?: string,
    warnings: string[] = []
  ): Promise<void> {
    if (!this.config.audit.enabled) return;

    const entry: SecurityAuditEntry = {
      timestamp: Date.now(),
      workerId: request.workerId,
      tool: request.tool,
      args: [...request.args], // Clone to prevent mutation
      allowed,
      reason,
      warnings: [...warnings],
    };

    this.auditLog.push(entry);

    // Clean old entries
    this.cleanAuditLog();

    // Track spawn counts for rate limiting
    if (request.workerId) {
      const spawns = this.spawnCounts.get(request.workerId) || [];
      spawns.push(entry.timestamp);
      this.spawnCounts.set(request.workerId, spawns);
    }

    // Track active spawns
    if (allowed) {
      const spawnId = `${request.workerId || 'unknown'}-${request.tool}-${entry.timestamp}`;
      this.activeSpawns.add(spawnId);

      // Remove from active when spawn completes (simplified)
      setTimeout(() => {
        this.activeSpawns.delete(spawnId);
      }, 30000); // Assume 30s max execution
    }
  }

  private cleanAuditLog(): void {
    const retentionMs = this.config.audit.retentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoffTime);

    // Also clean spawn counts
    const hourAgo = Date.now() - (60 * 60 * 1000);
    for (const [workerId, spawns] of this.spawnCounts.entries()) {
      const recentSpawns = spawns.filter(time => time > hourAgo);
      if (recentSpawns.length === 0) {
        this.spawnCounts.delete(workerId);
      } else {
        this.spawnCounts.set(workerId, recentSpawns);
      }
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a default security configuration
 */
export function createDefaultSecurityConfig(): SpawnSecurityConfig {
  return {
    validation: {
      enabled: true,
      validateToolsOnStartup: true,
      auditAllSpawns: true,
      blocklistEnvVars: [
        'LD_PRELOAD',
        'LD_LIBRARY_PATH',
        'DYLD_LIBRARY_PATH',
        'DYLD_INSERT_LIBRARIES',
      ],
    },
    sanitization: {
      allowedEnvVars: [
        'PATH', 'HOME', 'USER', 'SHELL', 'LANG',
        'LC_*', 'TZ', 'TMPDIR',
      ],
      sanitizePath: true,
      restrictWorkingDirectory: true,
    },
    resourceLimits: {
      maxConcurrentSpawns: 5,
      maxTotalSpawnsPerHour: 1000,
      maxMemoryPerSpawnMB: 100,
      maxCpuTimePerSpawnSeconds: 60,
    },
    audit: {
      enabled: true,
      logFile: '/var/log/spawn-security-audit.log',
      maxLogSizeMB: 100,
      retentionDays: 30,
    },
  };
}

/**
 * Create a security validator with default configuration
 */
export function createSecurityValidator(): SpawnSecurityValidator {
  return new SpawnSecurityValidator(createDefaultSecurityConfig());
}