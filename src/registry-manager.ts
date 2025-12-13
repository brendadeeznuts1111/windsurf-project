/**
 * @fileoverview Registry Manager for Bun Private Registry System
 * @description Unified registry management across all endpoints and providers
 * @author Bun Registry Team
 * @version 1.0.0
 * @since 2025
 *
 * This registry manager provides a unified interface for managing multiple
 * registry endpoints including private scoped registries, public registries,
 * and cloud-based artifact repositories.
 *
 * Registries Managed:
 * - HB47 Mega Registry (internal://hb47)
 * - Local Registry (http://localhost:4873)
 * - npm Registry (https://registry.npmjs.org)
 * - Azure Artifacts (https://pkgs.dev.azure.com/brendawill2233)
 * - Team-scoped private registries (@core-team/*, @feature-team/*, etc.)
 */

import { Database } from 'bun:sqlite';

// Registry types and interfaces
export interface RegistryEndpoint {
  id: string;
  name: string;
  url: string;
  type: 'internal' | 'local' | 'public' | 'cloud';
  status: 'connected' | 'offline' | 'error';
  packageCount: number;
  lastSync: string | null;
  authRequired: boolean;
  scopes?: string[];
}

export interface PackageInfo {
  name: string;
  version: string;
  scope?: string;
  registry: string;
  maintainers: string[];
  publishedAt: string;
  size: number;
  dependencies: Record<string, string>;
}

export interface RegistryStats {
  totalRegistries: number;
  connectedRegistries: number;
  totalPackages: number;
  lastSyncTime: string;
  registryHealth: Record<string, 'healthy' | 'degraded' | 'offline'>;
}

/**
 * Unified Registry Manager
 * Manages all registry endpoints and provides unified package operations
 */
export class RegistryManager {
  private db: Database;
  private registries: Map<string, RegistryEndpoint> = new Map();

  constructor(dbPath: string = 'registry.db') {
    this.db = new Database(dbPath);
    this.initializeDatabase();
    this.initializeRegistries();
  }

  private initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS registries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        auth_required BOOLEAN DEFAULT false,
        scopes TEXT, -- JSON array of scopes
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        scope TEXT,
        registry_id TEXT NOT NULL,
        maintainers TEXT, -- JSON array
        published_at DATETIME,
        size_bytes INTEGER,
        dependencies TEXT, -- JSON object
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registry_id) REFERENCES registries(id)
      );

      CREATE TABLE IF NOT EXISTS registry_sync (
        registry_id TEXT PRIMARY KEY,
        last_sync DATETIME,
        package_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'unknown',
        error_message TEXT,
        FOREIGN KEY (registry_id) REFERENCES registries(id)
      );
    `);
  }

  private initializeRegistries() {
    // HB47 Mega Registry (internal)
    this.addRegistry({
      id: 'hb47-mega',
      name: 'HB47 Mega Registry',
      url: 'internal://hb47',
      type: 'internal',
      status: 'connected',
      packageCount: 0,
      lastSync: new Date().toISOString(),
      authRequired: false,
      scopes: ['@odds-protocol/*', '@windsurf/*']
    });

    // Local Registry
    this.addRegistry({
      id: 'local-registry',
      name: 'Local Registry',
      url: 'http://localhost:4873',
      type: 'local',
      status: 'offline',
      packageCount: 0,
      lastSync: null,
      authRequired: false,
      scopes: ['@local/*']
    });

    // npm Registry
    this.addRegistry({
      id: 'npm-registry',
      name: 'npm Registry',
      url: 'https://registry.npmjs.org',
      type: 'public',
      status: 'connected',
      packageCount: 0,
      lastSync: null,
      authRequired: false,
      scopes: ['*']
    });

    // Azure Artifacts
    this.addRegistry({
      id: 'azure-artifacts',
      name: 'Azure Artifacts',
      url: 'https://pkgs.dev.azure.com/brendawill2233',
      type: 'cloud',
      status: 'connected',
      packageCount: 0,
      lastSync: null,
      authRequired: true,
      scopes: ['@brendawill2233/*']
    });

    // Team-scoped private registries
    this.addRegistry({
      id: 'core-team-registry',
      name: 'Core Team Private Registry',
      url: 'https://registry.windsurf.bun.sh',
      type: 'cloud',
      status: 'connected',
      packageCount: 0,
      lastSync: new Date().toISOString(),
      authRequired: true,
      scopes: ['@core-team/*']
    });

    this.addRegistry({
      id: 'feature-team-registry',
      name: 'Feature Team Private Registry',
      url: 'https://registry.windsurf.bun.sh',
      type: 'cloud',
      status: 'connected',
      packageCount: 0,
      lastSync: new Date().toISOString(),
      authRequired: true,
      scopes: ['@feature-team/*']
    });

    this.addRegistry({
      id: 'qa-team-registry',
      name: 'QA Team Private Registry',
      url: 'https://registry.windsurf.bun.sh',
      type: 'cloud',
      status: 'connected',
      packageCount: 0,
      lastSync: new Date().toISOString(),
      authRequired: true,
      scopes: ['@qa-team/*']
    });

    this.addRegistry({
      id: 'benchmarks-registry',
      name: 'Benchmarks Private Registry',
      url: 'https://registry.windsurf.bun.sh',
      type: 'cloud',
      status: 'connected',
      packageCount: 0,
      lastSync: new Date().toISOString(),
      authRequired: true,
      scopes: ['@benchmarks/*']
    });

    // Documentation registry for catalog items
    this.addRegistry({
      id: 'docs-registry',
      name: 'Documentation Registry',
      url: 'https://registry.windsurf.bun.sh',
      type: 'cloud',
      status: 'connected',
      packageCount: 0,
      lastSync: new Date().toISOString(),
      authRequired: true,
      scopes: ['@docs/*']
    });
  }

  /**
   * Add a registry to the manager
   */
  addRegistry(registry: RegistryEndpoint) {
    this.registries.set(registry.id, registry);

    // Persist to database
    this.db.prepare(`
      INSERT OR REPLACE INTO registries (id, name, url, type, auth_required, scopes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      registry.id,
      registry.name,
      registry.url,
      registry.type,
      registry.authRequired ? 1 : 0,
      JSON.stringify(registry.scopes || [])
    );
  }

  /**
   * Get all registries
   */
  getAllRegistries(): RegistryEndpoint[] {
    return Array.from(this.registries.values());
  }

  /**
   * Get registry by ID
   */
  getRegistry(id: string): RegistryEndpoint | undefined {
    return this.registries.get(id);
  }

  /**
   * Get registries by type
   */
  getRegistriesByType(type: RegistryEndpoint['type']): RegistryEndpoint[] {
    return this.getAllRegistries().filter(r => r.type === type);
  }

  /**
   * Get registries that support a specific scope
   */
  getRegistriesForScope(scope: string): RegistryEndpoint[] {
    return this.getAllRegistries().filter(r =>
      r.scopes?.some(s => s === scope || s === '*' || scope.startsWith(s.replace('/*', '/')))
    );
  }

  /**
   * Check registry health
   */
  async checkRegistryHealth(registryId: string): Promise<'healthy' | 'degraded' | 'offline'> {
    const registry = this.getRegistry(registryId);
    if (!registry) return 'offline';

    try {
      if (registry.type === 'internal') {
        // Internal registries are always healthy
        return 'healthy';
      }

      // For external registries, try to ping
      const response = await fetch(`${registry.url}/-/ping`, {
        signal: AbortSignal.timeout(5000)
      });

      return response.ok ? 'healthy' : 'degraded';
    } catch {
      return 'offline';
    }
  }

  /**
   * Get comprehensive registry statistics
   */
  async getRegistryStats(): Promise<RegistryStats> {
    const registries = this.getAllRegistries();
    const healthChecks = await Promise.all(
      registries.map(r => this.checkRegistryHealth(r.id))
    );

    const registryHealth: Record<string, 'healthy' | 'degraded' | 'offline'> = {};
    registries.forEach((r, i) => {
      registryHealth[r.id] = healthChecks[i];
    });

    const connectedRegistries = healthChecks.filter(h => h === 'healthy').length;
    const totalPackages = registries.reduce((sum, r) => sum + r.packageCount, 0);

    return {
      totalRegistries: registries.length,
      connectedRegistries,
      totalPackages,
      lastSyncTime: new Date().toISOString(),
      registryHealth
    };
  }

  /**
   * Search packages across all registries
   */
  async searchPackages(query: string, scope?: string): Promise<PackageInfo[]> {
    const registries = scope ? this.getRegistriesForScope(scope) : this.getAllRegistries();

    const results: PackageInfo[] = [];

    for (const registry of registries) {
      try {
        // Search in database first
        const dbResults = this.db.prepare(`
          SELECT * FROM packages
          WHERE registry_id = ? AND (name LIKE ? OR name LIKE ?)
          ORDER BY published_at DESC
          LIMIT 10
        `).all(registry.id, `%${query}%`, `%${scope ? scope.replace('*', '') : ''}%${query}%`) as any[];

        results.push(...dbResults.map(row => ({
          name: row.name,
          version: row.version,
          scope: row.scope,
          registry: registry.name,
          maintainers: JSON.parse(row.maintainers || '[]'),
          publishedAt: row.published_at,
          size: row.size_bytes,
          dependencies: JSON.parse(row.dependencies || '{}')
        })));
      } catch (error) {
        console.warn(`Failed to search registry ${registry.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Publish package to appropriate registry
   */
  async publishPackage(packageName: string, version: string, registryId?: string): Promise<boolean> {
    let targetRegistry: RegistryEndpoint | undefined;

    if (registryId) {
      targetRegistry = this.getRegistry(registryId);
    } else {
      // Auto-detect registry based on package scope
      const scope = packageName.startsWith('@') ? packageName.split('/')[0] + '/*' : '*';
      const candidates = this.getRegistriesForScope(scope);
      targetRegistry = candidates.find(r => r.authRequired) || candidates[0];
    }

    if (!targetRegistry) {
      throw new Error(`No suitable registry found for package ${packageName}`);
    }

    // Here you would implement actual publishing logic
    // For now, just log and return success
    console.log(`Publishing ${packageName}@${version} to ${targetRegistry.name}`);

    // Update package count
    targetRegistry.packageCount++;

    return true;
  }

  /**
   * Install package from appropriate registry
   */
  async installPackage(packageName: string, version?: string): Promise<PackageInfo | null> {
    const scope = packageName.startsWith('@') ? packageName.split('/')[0] + '/*' : '*';
    const registries = this.getRegistriesForScope(scope);

    for (const registry of registries) {
      try {
        // Check if package exists in this registry
        const pkg = this.db.prepare(`
          SELECT * FROM packages
          WHERE registry_id = ? AND name = ? AND version = ?
        `).get(registry.id, packageName, version || 'latest') as any;

        if (pkg) {
          return {
            name: pkg.name,
            version: pkg.version,
            scope: pkg.scope,
            registry: registry.name,
            maintainers: JSON.parse(pkg.maintainers || '[]'),
            publishedAt: pkg.published_at,
            size: pkg.size_bytes,
            dependencies: JSON.parse(pkg.dependencies || '{}')
          };
        }
      } catch (error) {
        console.warn(`Failed to check registry ${registry.id}:`, error);
      }
    }

    return null;
  }

  /**
   * Sync registry data
   */
  async syncRegistry(registryId: string): Promise<void> {
    const registry = this.getRegistry(registryId);
    if (!registry) return;

    try {
      // Update sync status
      this.db.prepare(`
        INSERT OR REPLACE INTO registry_sync (registry_id, last_sync, status)
        VALUES (?, ?, ?)
      `).run(registryId, new Date().toISOString(), 'syncing');

      // Here you would implement actual sync logic
      // For demo, just update the timestamp
      registry.lastSync = new Date().toISOString();

      this.db.prepare(`
        UPDATE registry_sync
        SET last_sync = ?, status = ?, package_count = ?
        WHERE registry_id = ?
      `).run(registry.lastSync, 'completed', registry.packageCount, registryId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.db.prepare(`
        UPDATE registry_sync
        SET status = ?, error_message = ?
        WHERE registry_id = ?
      `).run('error', errorMessage, registryId);
      throw error;
    }
  }

  /**
   * Get registry endpoints summary
   */
  getRegistryEndpoints(): Array<{ path: string; method: string; description: string }> {
    return [
      { path: '/api/orca/registries', method: 'GET', description: 'List all registries' },
      { path: '/api/orca/packages', method: 'GET', description: 'List packages from registries' },
      { path: '/api/orca/stats', method: 'GET', description: 'Registry statistics' },
      { path: '/api/orca/endpoints', method: 'GET', description: 'Registry API endpoints' },
      { path: '/api/orca/releases', method: 'GET', description: 'Package releases' },
      { path: '/api/azure/work-items', method: 'GET', description: 'Azure DevOps work items' },
      { path: '/api/azure/pipelines', method: 'GET', description: 'Azure DevOps pipelines' },
      { path: '/api/azure/prs', method: 'GET', description: 'Azure DevOps pull requests' },
      { path: '/api/azure/project-stats', method: 'GET', description: 'Azure project statistics' }
    ];
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

// Export singleton instance
export const registryManager = new RegistryManager();

// Types are exported at the top of the file