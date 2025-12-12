/**
 * @fileoverview Database Migration System
 * @description Enterprise-grade migration system for PostgreSQL databases
 * @version 1.0.0
 * @since 2025-01-01
 *
 * EX032: Database Migration System
 * Provides version control for database schema changes with rollback support,
 * dependency management, and automated migration execution
 */

import { BunDatabase, DatabaseClient } from './bun-database';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

// Migration interfaces
export interface Migration {
  id: string;
  name: string;
  up: (db: DatabaseClient) => Promise<void>;
  down: (db: DatabaseClient) => Promise<void>;
  dependencies?: string[];
  checksum: string;
  created_at: Date;
}

export interface MigrationRecord {
  id: string;
  name: string;
  checksum: string;
  executed_at: Date;
  execution_time_ms: number;
  success: boolean;
  error_message?: string;
}

export interface MigrationConfig {
  migrationsTable: string;
  migrationsPath: string;
  schemaVersion?: string;
  allowOutOfOrder?: boolean;
  validateChecksums?: boolean;
  backupBeforeMigration?: boolean;
}

export interface MigrationResult {
  success: boolean;
  executedMigrations: MigrationRecord[];
  failedMigrations: MigrationRecord[];
  totalDuration: number;
  error?: string;
}

/**
 * Database Migration Manager
 */
export class MigrationManager {
  private db: BunDatabase;
  private config: Required<MigrationConfig>;
  private migrations = new Map<string, Migration>();

  constructor(db: BunDatabase, config: MigrationConfig = {}) {
    this.db = db;
    this.config = {
      migrationsTable: 'schema_migrations',
      migrationsPath: './migrations',
      schemaVersion: '1.0.0',
      allowOutOfOrder: false,
      validateChecksums: true,
      backupBeforeMigration: true,
      ...config
    };
  }

  /**
   * Initialize migration system
   */
  async initialize(): Promise<void> {
    await this.createMigrationsTable();
    await this.loadMigrations();
  }

  /**
   * Create migrations tracking table
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.config.migrationsTable} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        schema_version VARCHAR(50),
        created_by VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS idx_migrations_executed_at
      ON ${this.config.migrationsTable}(executed_at);

      CREATE INDEX IF NOT EXISTS idx_migrations_success
      ON ${this.config.migrationsTable}(success);
    `;

    await this.db.query(createTableSQL);
  }

  /**
   * Load migrations from filesystem
   */
  private async loadMigrations(): Promise<void> {
    try {
      const files = await readdir(this.config.migrationsPath);
      const migrationFiles = files
        .filter(file => extname(file) === '.ts' || extname(file) === '.js')
        .sort(); // Sort by filename for consistent ordering

      for (const file of migrationFiles) {
        const filePath = join(this.config.migrationsPath, file);
        const migrationModule = await import(filePath);

        if (migrationModule.default && typeof migrationModule.default === 'object') {
          const migration = migrationModule.default as Omit<Migration, 'id' | 'checksum' | 'created_at'>;

          // Generate migration ID from filename
          const id = file.replace(/\.(ts|js)$/, '');
          const checksum = await this.calculateChecksum(filePath);

          this.migrations.set(id, {
            ...migration,
            id,
            checksum,
            created_at: new Date()
          });
        }
      }

      console.log(`📦 Loaded ${this.migrations.size} migrations`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`⚠️ Migrations directory not found: ${this.config.migrationsPath}`);
        console.warn('Create the directory and add migration files to enable migrations');
      } else {
        throw error;
      }
    }
  }

  /**
   * Calculate checksum for migration file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const content = await readFile(filePath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.db.query(
      `SELECT * FROM ${this.config.migrationsTable} ORDER BY executed_at ASC`
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      checksum: row.checksum,
      executed_at: new Date(row.executed_at),
      execution_time_ms: row.execution_time_ms,
      success: row.success,
      error_message: row.error_message
    }));
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const executedIds = new Set((await this.getExecutedMigrations()).map(m => m.id));
    const pending: Migration[] = [];

    for (const [id, migration] of this.migrations) {
      if (!executedIds.has(id)) {
        // Check dependencies
        const dependenciesMet = migration.dependencies?.every(dep => executedIds.has(dep)) ?? true;

        if (dependenciesMet) {
          pending.push(migration);
        }
      }
    }

    return pending.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }

  /**
   * Validate migration checksums
   */
  async validateChecksums(): Promise<{ valid: boolean; mismatches: string[] }> {
    const executedMigrations = await this.getExecutedMigrations();
    const mismatches: string[] = [];

    for (const executed of executedMigrations) {
      const currentMigration = this.migrations.get(executed.id);

      if (currentMigration) {
        if (currentMigration.checksum !== executed.checksum) {
          mismatches.push(`${executed.id}: checksum mismatch`);
        }
      } else {
        mismatches.push(`${executed.id}: migration file not found`);
      }
    }

    return {
      valid: mismatches.length === 0,
      mismatches
    };
  }

  /**
   * Run pending migrations
   */
  async migrate(options: { dryRun?: boolean; targetVersion?: string } = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      executedMigrations: [],
      failedMigrations: [],
      totalDuration: 0
    };

    try {
      // Validate checksums if enabled
      if (this.config.validateChecksums) {
        const checksumValidation = await this.validateChecksums();
        if (!checksumValidation.valid) {
          throw new Error(`Migration checksum validation failed: ${checksumValidation.mismatches.join(', ')}`);
        }
      }

      // Get pending migrations
      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return result;
      }

      console.log(`🚀 Running ${pendingMigrations.length} migrations...`);

      // Execute migrations in transaction
      await this.db.transaction(async (client) => {
        for (const migration of pendingMigrations) {
          const migrationStartTime = Date.now();

          try {
            console.log(`📋 Executing migration: ${migration.id} - ${migration.name}`);

            if (!options.dryRun) {
              // Execute migration
              await migration.up(client);

              // Record successful execution
              const executionTime = Date.now() - migrationStartTime;
              await this.recordMigrationExecution(migration, executionTime, true);

              result.executedMigrations.push({
                id: migration.id,
                name: migration.name,
                checksum: migration.checksum,
                executed_at: new Date(),
                execution_time_ms: executionTime,
                success: true
              });

              console.log(`✅ Migration ${migration.id} completed in ${executionTime}ms`);
            } else {
              console.log(`🔍 Dry run: ${migration.id} would be executed`);
            }
          } catch (error: any) {
            const executionTime = Date.now() - migrationStartTime;

            result.success = false;
            result.failedMigrations.push({
              id: migration.id,
              name: migration.name,
              checksum: migration.checksum,
              executed_at: new Date(),
              execution_time_ms: executionTime,
              success: false,
              error_message: error.message
            });

            if (!options.dryRun) {
              // Record failed execution
              await this.recordMigrationExecution(migration, executionTime, false, error.message);
            }

            console.error(`❌ Migration ${migration.id} failed: ${error.message}`);

            // Stop on first failure
            throw error;
          }
        }
      });

      result.totalDuration = Date.now() - startTime;
      console.log(`✅ Migration completed in ${result.totalDuration}ms`);

    } catch (error: any) {
      result.success = false;
      result.error = error.message;
      result.totalDuration = Date.now() - startTime;
      console.error(`❌ Migration failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Rollback migrations
   */
  async rollback(options: { steps?: number; targetMigration?: string; dryRun?: boolean } = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      executedMigrations: [],
      failedMigrations: [],
      totalDuration: 0
    };

    try {
      const executedMigrations = await this.getExecutedMigrations();

      if (executedMigrations.length === 0) {
        console.log('ℹ️ No migrations to rollback');
        return result;
      }

      // Determine which migrations to rollback
      let migrationsToRollback: MigrationRecord[];

      if (options.targetMigration) {
        const targetIndex = executedMigrations.findIndex(m => m.id === options.targetMigration);
        if (targetIndex === -1) {
          throw new Error(`Target migration not found: ${options.targetMigration}`);
        }
        migrationsToRollback = executedMigrations.slice(targetIndex + 1).reverse();
      } else {
        const steps = options.steps || 1;
        migrationsToRollback = executedMigrations.slice(-steps).reverse();
      }

      if (migrationsToRollback.length === 0) {
        console.log('ℹ️ No migrations match rollback criteria');
        return result;
      }

      console.log(`🔄 Rolling back ${migrationsToRollback.length} migrations...`);

      // Execute rollbacks in transaction
      await this.db.transaction(async (client) => {
        for (const migrationRecord of migrationsToRollback) {
          const migration = this.migrations.get(migrationRecord.id);

          if (!migration) {
            throw new Error(`Migration ${migrationRecord.id} not found in loaded migrations`);
          }

          const rollbackStartTime = Date.now();

          try {
            console.log(`📋 Rolling back migration: ${migration.id} - ${migration.name}`);

            if (!options.dryRun) {
              // Execute rollback
              await migration.down(client);

              // Remove migration record
              await this.db.query(
                `DELETE FROM ${this.config.migrationsTable} WHERE id = $1`,
                [migration.id]
              );

              result.executedMigrations.push({
                id: migration.id,
                name: migration.name,
                checksum: migration.checksum,
                executed_at: new Date(),
                execution_time_ms: Date.now() - rollbackStartTime,
                success: true
              });

              console.log(`✅ Rollback ${migration.id} completed`);
            } else {
              console.log(`🔍 Dry run: ${migration.id} would be rolled back`);
            }
          } catch (error: any) {
            const executionTime = Date.now() - rollbackStartTime;

            result.success = false;
            result.failedMigrations.push({
              id: migration.id,
              name: migration.name,
              checksum: migration.checksum,
              executed_at: new Date(),
              execution_time_ms: executionTime,
              success: false,
              error_message: error.message
            });

            console.error(`❌ Rollback ${migration.id} failed: ${error.message}`);
            throw error;
          }
        }
      });

      result.totalDuration = Date.now() - startTime;
      console.log(`✅ Rollback completed in ${result.totalDuration}ms`);

    } catch (error: any) {
      result.success = false;
      result.error = error.message;
      result.totalDuration = Date.now() - startTime;
      console.error(`❌ Rollback failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Record migration execution
   */
  private async recordMigrationExecution(
    migration: Migration,
    executionTime: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO ${this.config.migrationsTable}
       (id, name, checksum, execution_time_ms, success, error_message, schema_version, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        migration.id,
        migration.name,
        migration.checksum,
        executionTime,
        success,
        errorMessage || null,
        this.config.schemaVersion,
        process.env.USER || 'system'
      ]
    );
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    totalMigrations: number;
    executedMigrations: number;
    pendingMigrations: number;
    lastMigration?: MigrationRecord;
    checksumValidation?: { valid: boolean; mismatches: string[] };
  }> {
    const executedMigrations = await this.getExecutedMigrations();
    const pendingMigrations = await this.getPendingMigrations();

    let checksumValidation;
    if (this.config.validateChecksums) {
      checksumValidation = await this.validateChecksums();
    }

    return {
      totalMigrations: this.migrations.size,
      executedMigrations: executedMigrations.length,
      pendingMigrations: pendingMigrations.length,
      lastMigration: executedMigrations[executedMigrations.length - 1],
      checksumValidation
    };
  }

  /**
   * Create a new migration file
   */
  async createMigration(name: string, template: 'basic' | 'advanced' = 'basic'): Promise<string> {
    const timestamp = Date.now();
    const id = `${timestamp}_${name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    const filename = `${id}.ts`;

    let content: string;

    if (template === 'basic') {
      content = `import { Migration } from '../database-migration-system';

export default {
  name: '${name}',
  dependencies: [], // Add migration IDs this migration depends on

  up: async (db) => {
    // Add your migration logic here
    await db.query(\`
      -- Example: Create a new table
      CREATE TABLE IF NOT EXISTS new_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \`);
  },

  down: async (db) => {
    // Add your rollback logic here
    await db.query('DROP TABLE IF EXISTS new_table');
  }
} satisfies Migration;
`;
    } else {
      content = `import { Migration } from '../database-migration-system';

export default {
  name: '${name}',
  dependencies: [], // Add migration IDs this migration depends on

  up: async (db) => {
    // Migration logic with proper error handling and validation
    const client = await db.connect();

    try {
      // Create indexes if needed
      await client.query(\`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_example_name
        ON example_table (name)
      \`);

      // Add new columns
      const hasColumn = await client.query(\`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'example_table' AND column_name = 'new_column'
        )
      \`);

      if (!hasColumn.rows[0].exists) {
        await client.query(\`
          ALTER TABLE example_table
          ADD COLUMN new_column VARCHAR(255),
          ADD COLUMN metadata JSONB DEFAULT '{}'
        \`);
      }

      // Update existing data
      await client.query(\`
        UPDATE example_table
        SET new_column = 'default_value'
        WHERE new_column IS NULL
      \`);

      // Add constraints
      await client.query(\`
        ALTER TABLE example_table
        ADD CONSTRAINT chk_new_column_length
        CHECK (length(new_column) > 0)
      \`);

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (db) => {
    // Comprehensive rollback logic
    const client = await db.connect();

    try {
      // Remove constraints
      await client.query(\`
        ALTER TABLE example_table
        DROP CONSTRAINT IF EXISTS chk_new_column_length
      \`);

      // Remove columns
      await client.query(\`
        ALTER TABLE example_table
        DROP COLUMN IF EXISTS new_column,
        DROP COLUMN IF EXISTS metadata
      \`);

      // Drop indexes
      await client.query(\`
        DROP INDEX IF EXISTS idx_example_name
      \`);

    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
} satisfies Migration;
`;
    }

    const filePath = join(this.config.migrationsPath, filename);
    await Bun.write(filePath, content);

    console.log(`📄 Created migration: ${filename}`);
    return filename;
  }
}

// ===== MIGRATION TEMPLATES =====

/**
 * Create a basic table migration
 */
export function createTableMigration(tableName: string, columns: string[]): Migration {
  const columnDefs = columns.join(',\n    ');

  return {
    name: `create_${tableName}_table`,
    up: async (db) => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          ${columnDefs},
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    },
    down: async (db) => {
      await db.query(`DROP TABLE IF EXISTS ${tableName}`);
    }
  };
}

/**
 * Create an index migration
 */
export function createIndexMigration(tableName: string, columnName: string, indexType: 'btree' | 'hash' | 'gin' | 'gist' = 'btree'): Migration {
  const indexName = `idx_${tableName}_${columnName}`;

  return {
    name: `create_index_${tableName}_${columnName}`,
    up: async (db) => {
      await db.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
        ON ${tableName} USING ${indexType} (${columnName})
      `);
    },
    down: async (db) => {
      await db.query(`DROP INDEX IF EXISTS ${indexName}`);
    }
  };
}

/**
 * Create a column migration
 */
export function addColumnMigration(tableName: string, columnName: string, columnType: string, defaultValue?: string): Migration {
  return {
    name: `add_column_${tableName}_${columnName}`,
    up: async (db) => {
      const defaultClause = defaultValue ? ` DEFAULT ${defaultValue}` : '';
      await db.query(`
        ALTER TABLE ${tableName}
        ADD COLUMN IF NOT EXISTS ${columnName} ${columnType}${defaultClause}
      `);
    },
    down: async (db) => {
      await db.query(`
        ALTER TABLE ${tableName}
        DROP COLUMN IF EXISTS ${columnName}
      `);
    }
  };
}

// ===== CLI INTERFACE =====

export interface MigrationCommandOptions {
  config?: MigrationConfig;
  dryRun?: boolean;
  steps?: number;
  target?: string;
  name?: string;
  template?: 'basic' | 'advanced';
}

/**
 * CLI command handler for migrations
 */
export class MigrationCLI {
  private manager: MigrationManager;

  constructor(db: BunDatabase, config?: MigrationConfig) {
    this.manager = new MigrationManager(db, config);
  }

  async initialize(): Promise<void> {
    await this.manager.initialize();
  }

  async status(): Promise<void> {
    const status = await this.manager.getStatus();

    console.log('📊 Migration Status');
    console.log('==================');
    console.log(`Total Migrations: ${status.totalMigrations}`);
    console.log(`Executed: ${status.executedMigrations}`);
    console.log(`Pending: ${status.pendingMigrations}`);

    if (status.lastMigration) {
      console.log(`Last Migration: ${status.lastMigration.id} (${status.lastMigration.executed_at.toISOString()})`);
    }

    if (status.checksumValidation) {
      if (status.checksumValidation.valid) {
        console.log('✅ Checksum validation: PASSED');
      } else {
        console.log('❌ Checksum validation: FAILED');
        status.checksumValidation.mismatches.forEach(mismatch => {
          console.log(`  - ${mismatch}`);
        });
      }
    }
  }

  async migrate(options: MigrationCommandOptions = {}): Promise<void> {
    const result = await this.manager.migrate({
      dryRun: options.dryRun,
      targetVersion: options.target
    });

    if (result.success) {
      console.log(`✅ Migration completed successfully`);
      console.log(`Executed: ${result.executedMigrations.length} migrations`);
      console.log(`Total time: ${result.totalDuration}ms`);
    } else {
      console.log(`❌ Migration failed`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
      console.log(`Failed migrations: ${result.failedMigrations.length}`);
      process.exit(1);
    }
  }

  async rollback(options: MigrationCommandOptions = {}): Promise<void> {
    const result = await this.manager.rollback({
      steps: options.steps,
      targetMigration: options.target,
      dryRun: options.dryRun
    });

    if (result.success) {
      console.log(`✅ Rollback completed successfully`);
      console.log(`Rolled back: ${result.executedMigrations.length} migrations`);
      console.log(`Total time: ${result.totalDuration}ms`);
    } else {
      console.log(`❌ Rollback failed`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
      process.exit(1);
    }
  }

  async create(options: MigrationCommandOptions): Promise<void> {
    if (!options.name) {
      console.error('❌ Migration name is required');
      process.exit(1);
    }

    const filename = await this.manager.createMigration(
      options.name,
      options.template || 'basic'
    );

    console.log(`📄 Created migration: ${filename}`);
  }

  async pending(): Promise<void> {
    const pending = await this.manager.getPendingMigrations();

    if (pending.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log('📋 Pending Migrations:');
    console.log('=====================');

    pending.forEach((migration, index) => {
      console.log(`${index + 1}. ${migration.id} - ${migration.name}`);
      if (migration.dependencies && migration.dependencies.length > 0) {
        console.log(`   Dependencies: ${migration.dependencies.join(', ')}`);
      }
    });
  }
}

// Export types
export type { MigrationConfig, MigrationResult, MigrationCommandOptions };