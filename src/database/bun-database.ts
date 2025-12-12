/**
 * @fileoverview Unified Database Abstraction Layer
 * @description Enterprise-grade database abstraction supporting PostgreSQL and Redis
 * @version 1.0.0
 * @since 2025-01-01
 *
 * EX031: Unified Database Abstraction Layer
 * Provides consistent API across PostgreSQL and Redis with connection pooling,
 * query building, migrations, and cross-database operations
 */

import { BunPostgres, PostgresConfig } from './bun-postgres';
import { BunRedis, RedisConfig } from './bun-redis';
import { EventEmitter } from 'node:events';

// Database types
export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  REDIS = 'redis'
}

// Query builder interfaces
interface WhereClause {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'NOT IN';
  value: any;
}

interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

interface QueryOptions {
  select?: string[];
  where?: WhereClause[];
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
  groupBy?: string[];
  having?: WhereClause[];
}

interface InsertData {
  [key: string]: any;
}

interface UpdateData {
  [key: string]: any;
}

// Migration interfaces
interface Migration {
  id: string;
  name: string;
  up: (db: DatabaseClient) => Promise<void>;
  down: (db: DatabaseClient) => Promise<void>;
  timestamp: number;
}

interface MigrationRecord {
  id: string;
  name: string;
  executed_at: Date;
  checksum: string;
}

// Cache interfaces
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
}

interface CacheEntry {
  value: any;
  expiresAt: number;
  metadata: {
    createdAt: number;
    hits: number;
    lastAccessed: number;
  };
}

/**
 * Unified Database Configuration
 */
export interface DatabaseConfig {
  type: DatabaseType;
  postgresql?: PostgresConfig;
  redis?: RedisConfig;
  cache?: {
    enabled: boolean;
    redis?: RedisConfig;
    defaultTtl: number;
  };
  migrations?: {
    enabled: boolean;
    tableName: string;
  };
}

/**
 * Database Client Interface
 */
export interface DatabaseClient {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
  getStats(): any;

  // Query operations
  query(sql: string, params?: any[]): Promise<any>;
  find(table: string, options?: QueryOptions): Promise<any[]>;
  findOne(table: string, conditions: Record<string, any>): Promise<any>;
  insert(table: string, data: InsertData | InsertData[]): Promise<any>;
  update(table: string, data: UpdateData, conditions: Record<string, any>): Promise<number>;
  delete(table: string, conditions: Record<string, any>): Promise<number>;
  count(table: string, conditions?: Record<string, any>): Promise<number>;

  // Transaction support
  transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T>;

  // Cache operations (Redis-backed)
  cache?: {
    get(key: string): Promise<any>;
    set(key: string, value: any, options?: CacheOptions): Promise<void>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<boolean>;
    clear(): Promise<void>;
    getStats(): Promise<any>;
  };

  // Pub/Sub operations (Redis-backed)
  pubsub?: {
    publish(channel: string, message: any): Promise<number>;
    subscribe(channel: string, callback: (message: any) => void): void;
    unsubscribe(channel: string, callback?: (message: any) => void): void;
  };
}

/**
 * Unified Database Abstraction Layer
 */
export class BunDatabase implements DatabaseClient {
  private config: DatabaseConfig;
  private postgresql?: BunPostgres;
  private redis?: BunRedis;
  private cacheRedis?: BunRedis;
  private eventEmitter = new EventEmitter();
  private connected = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializeClients();
  }

  /**
   * Initialize database clients based on configuration
   */
  private initializeClients(): void {
    if (this.config.type === DatabaseType.POSTGRESQL && this.config.postgresql) {
      this.postgresql = new BunPostgres(this.config.postgresql);
    }

    if (this.config.type === DatabaseType.REDIS && this.config.redis) {
      this.redis = new BunRedis(this.config.redis);
    }

    // Initialize cache Redis if different from main Redis
    if (this.config.cache?.enabled) {
      if (this.config.cache.redis) {
        this.cacheRedis = new BunRedis(this.config.cache.redis);
      } else if (this.redis) {
        this.cacheRedis = this.redis;
      }
    }
  }

  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      if (this.postgresql) {
        // PostgreSQL connection is lazy, no explicit connect needed
        await this.postgresql.healthCheck();
      }

      if (this.redis) {
        await this.redis.healthCheck();
      }

      if (this.cacheRedis && this.cacheRedis !== this.redis) {
        await this.cacheRedis.healthCheck();
      }

      this.connected = true;
      this.eventEmitter.emit('connected');

      // Run migrations if enabled
      if (this.config.migrations?.enabled) {
        await this.runMigrations();
      }
    } catch (error) {
      this.eventEmitter.emit('connectionError', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;

    try {
      if (this.postgresql) {
        await this.postgresql.close();
      }

      if (this.redis) {
        await this.redis.close();
      }

      if (this.cacheRedis && this.cacheRedis !== this.redis) {
        await this.cacheRedis.close();
      }

      this.connected = false;
      this.eventEmitter.emit('disconnected');
    } catch (error) {
      this.eventEmitter.emit('disconnectionError', error);
      throw error;
    }
  }

  /**
   * Health check for the database
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.postgresql) {
        return await this.postgresql.healthCheck();
      }

      if (this.redis) {
        return await this.redis.healthCheck();
      }

      return false;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  getStats(): any {
    const stats: any = {
      type: this.config.type,
      connected: this.connected
    };

    if (this.postgresql) {
      stats.postgresql = this.postgresql.getStats();
    }

    if (this.redis) {
      stats.redis = this.redis.getStats();
    }

    if (this.cacheRedis && this.cacheRedis !== this.redis) {
      stats.cache = this.cacheRedis.getStats();
    }

    return stats;
  }

  /**
   * Execute raw SQL query (PostgreSQL only)
   */
  async query(sql: string, params?: any[]): Promise<any> {
    this.ensureConnected();

    if (!this.postgresql) {
      throw new Error('PostgreSQL client not configured');
    }

    // Handle both single param and array of params
    const queryParams = Array.isArray(params) ? params : (params ? [params] : []);
    return this.postgresql.query(sql, queryParams);
  }

  /**
   * Find records with query builder (PostgreSQL only)
   */
  async find(table: string, options: QueryOptions = {}): Promise<any[]> {
    this.ensureConnected();

    if (!this.postgresql) {
      throw new Error('PostgreSQL client not configured');
    }

    const { sql, params } = this.buildSelectQuery(table, options);
    const result = await this.postgresql.query(sql, params);
    return result.rows;
  }

  /**
   * Find single record (PostgreSQL only)
   */
  async findOne(table: string, conditions: Record<string, any>): Promise<any> {
    const results = await this.find(table, {
      where: Object.entries(conditions).map(([column, value]) => ({
        column,
        operator: '=',
        value
      })),
      limit: 1
    });

    return results[0] || null;
  }

  /**
   * Insert records (PostgreSQL only)
   */
  async insert(table: string, data: InsertData | InsertData[]): Promise<any> {
    this.ensureConnected();

    if (!this.postgresql) {
      throw new Error('PostgreSQL client not configured');
    }

    const records = Array.isArray(data) ? data : [data];
    const { sql, params } = this.buildInsertQuery(table, records);
    const result = await this.postgresql.query(sql, params);

    return result;
  }

  /**
   * Update records (PostgreSQL only)
   */
  async update(table: string, data: UpdateData, conditions: Record<string, any>): Promise<number> {
    this.ensureConnected();

    if (!this.postgresql) {
      throw new Error('PostgreSQL client not configured');
    }

    const { sql, params } = this.buildUpdateQuery(table, data, conditions);
    const result = await this.postgresql.query(sql, params);

    return result.rowCount;
  }

  /**
   * Delete records (PostgreSQL only)
   */
  async delete(table: string, conditions: Record<string, any>): Promise<number> {
    this.ensureConnected();

    if (!this.postgresql) {
      throw new Error('PostgreSQL client not configured');
    }

    const { sql, params } = this.buildDeleteQuery(table, conditions);
    const result = await this.postgresql.query(sql, params);

    return result.rowCount;
  }

  /**
   * Count records (PostgreSQL only)
   */
  async count(table: string, conditions?: Record<string, any>): Promise<number> {
    this.ensureConnected();

    if (!this.postgresql) {
      throw new Error('PostgreSQL client not configured');
    }

    const whereClause = conditions ? Object.entries(conditions).map(([column, value]) => ({
      column,
      operator: '=',
      value
    })) : [];

    const { sql, params } = this.buildSelectQuery(table, {
      select: ['COUNT(*) as count'],
      where: whereClause
    });

    const result = await this.postgresql.query(sql, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Execute transaction (PostgreSQL only)
   */
  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    this.ensureConnected();

    if (!this.postgresql) {
      throw new Error('PostgreSQL client not configured');
    }

    return this.postgresql.transaction(async (pgClient) => {
      const txClient = new TransactionClient(this, pgClient);
      return callback(txClient);
    });
  }

  /**
   * Cache operations (Redis-backed)
   */
  get cache(): DatabaseClient['cache'] | undefined {
    if (!this.cacheRedis || !this.config.cache?.enabled) return undefined;

    return {
      get: async (key: string) => {
        const cacheKey = this.buildCacheKey(key);
        const cached = await this.cacheRedis!.get(cacheKey);

        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (entry.expiresAt > Date.now()) {
            entry.metadata.hits++;
            entry.metadata.lastAccessed = Date.now();
            await this.cacheRedis!.set(cacheKey, JSON.stringify(entry));
            return entry.value;
          } else {
            await this.cacheRedis!.del(cacheKey);
          }
        }

        return null;
      },

      set: async (key: string, value: any, options: CacheOptions = {}) => {
        const cacheKey = this.buildCacheKey(key);
        const ttl = options.ttl || this.config.cache!.defaultTtl;
        const entry: CacheEntry = {
          value,
          expiresAt: Date.now() + (ttl * 1000),
          metadata: {
            createdAt: Date.now(),
            hits: 0,
            lastAccessed: Date.now()
          }
        };

        await this.cacheRedis!.set(cacheKey, JSON.stringify(entry), { ex: ttl });
      },

      del: async (key: string) => {
        const cacheKey = this.buildCacheKey(key);
        const result = await this.cacheRedis!.del(cacheKey);
        return result > 0;
      },

      exists: async (key: string) => {
        const cacheKey = this.buildCacheKey(key);
        const result = await this.cacheRedis!.exists(cacheKey);
        return result > 0;
      },

      expire: async (key: string, ttl: number) => {
        const cacheKey = this.buildCacheKey(key);
        return await this.cacheRedis!.expire(cacheKey, ttl) === 1;
      },

      clear: async () => {
        // This is a simplified implementation - in production you'd want to use Redis SCAN
        const keys = await this.cacheRedis!.keys(`${this.config.cache?.redis?.keyPrefix || 'cache'}:*`);
        if (keys.length > 0) {
          await this.cacheRedis!.del(...keys);
        }
      },

      getStats: async () => {
        return this.cacheRedis!.getStats();
      }
    };
  }

  /**
   * Pub/Sub operations (Redis-backed)
   */
  get pubsub(): DatabaseClient['pubsub'] | undefined {
    if (!this.redis) return undefined;

    return {
      publish: async (channel: string, message: any) => {
        return this.redis!.publish(channel, JSON.stringify(message));
      },

      subscribe: (channel: string, callback: (message: any) => void) => {
        this.redis!.subscribe(channel, (data) => {
          try {
            const parsedMessage = JSON.parse(data.message);
            callback(parsedMessage);
          } catch (error) {
            callback(data.message);
          }
        });
      },

      unsubscribe: (channel: string, callback?: (message: any) => void) => {
        this.redis!.unsubscribe(channel, callback ? () => {} : undefined);
      }
    };
  }

  /**
   * Ensure database is connected
   */
  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }

  /**
   * Build cache key with prefix
   */
  private buildCacheKey(key: string): string {
    const prefix = this.config.cache?.redis?.keyPrefix || 'cache';
    return `${prefix}:${key}`;
  }

  /**
   * Build SELECT query from options
   */
  private buildSelectQuery(table: string, options: QueryOptions): { sql: string; params: any[] } {
    const params: any[] = [];
    let paramIndex = 1;

    // SELECT clause
    const selectClause = options.select && options.select.length > 0
      ? options.select.join(', ')
      : '*';

    let sql = `SELECT ${selectClause} FROM ${table}`;

    // WHERE clause
    if (options.where && options.where.length > 0) {
      const whereConditions = options.where.map(clause => {
        const param = `$${paramIndex++}`;
        params.push(clause.value);
        return `${clause.column} ${clause.operator} ${param}`;
      });
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // GROUP BY clause
    if (options.groupBy && options.groupBy.length > 0) {
      sql += ` GROUP BY ${options.groupBy.join(', ')}`;
    }

    // HAVING clause
    if (options.having && options.having.length > 0) {
      const havingConditions = options.having.map(clause => {
        const param = `$${paramIndex++}`;
        params.push(clause.value);
        return `${clause.column} ${clause.operator} ${param}`;
      });
      sql += ` HAVING ${havingConditions.join(' AND ')}`;
    }

    // ORDER BY clause
    if (options.orderBy && options.orderBy.length > 0) {
      const orderClauses = options.orderBy.map(clause =>
        `${clause.column} ${clause.direction}`
      );
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // LIMIT clause
    if (options.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    // OFFSET clause
    if (options.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    return { sql, params };
  }

  /**
   * Build INSERT query
   */
  private buildInsertQuery(table: string, records: InsertData[]): { sql: string; params: any[] } {
    const params: any[] = [];
    let paramIndex = 1;

    const columns = Object.keys(records[0]);
    const placeholders = records.map(record => {
      const recordPlaceholders = columns.map(() => `$${paramIndex++}`);
      Object.values(record).forEach(value => params.push(value));
      return `(${recordPlaceholders.join(', ')})`;
    });

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')} RETURNING *`;

    return { sql, params };
  }

  /**
   * Build UPDATE query
   */
  private buildUpdateQuery(table: string, data: UpdateData, conditions: Record<string, any>): { sql: string; params: any[] } {
    const params: any[] = [];
    let paramIndex = 1;

    // SET clause
    const setClauses = Object.entries(data).map(([column, value]) => {
      params.push(value);
      return `${column} = $${paramIndex++}`;
    });

    // WHERE clause
    const whereClauses = Object.entries(conditions).map(([column, value]) => {
      params.push(value);
      return `${column} = $${paramIndex++}`;
    });

    const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;

    return { sql, params };
  }

  /**
   * Build DELETE query
   */
  private buildDeleteQuery(table: string, conditions: Record<string, any>): { sql: string; params: any[] } {
    const params: any[] = [];
    let paramIndex = 1;

    const whereClauses = Object.entries(conditions).map(([column, value]) => {
      params.push(value);
      return `${column} = $${paramIndex++}`;
    });

    const sql = `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`;

    return { sql, params };
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.postgresql || !this.config.migrations?.enabled) return;

    const tableName = this.config.migrations.tableName;

    // Create migrations table if it doesn't exist
    await this.postgresql.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(255) NOT NULL
      )
    `);

    // Get executed migrations
    const executedMigrations = await this.postgresql.query(
      `SELECT id, checksum FROM ${tableName} ORDER BY executed_at`
    );

    const executedIds = new Set(executedMigrations.rows.map(row => row.id));

    // Import and run pending migrations
    // This would typically load migrations from files
    // For now, we'll skip this implementation
  }
}

/**
 * Transaction client for operations within a transaction
 */
class TransactionClient implements DatabaseClient {
  constructor(
    private parent: BunDatabase,
    private pgClient: BunPostgres
  ) {}

  async connect(): Promise<void> {
    // Already connected in transaction
  }

  async disconnect(): Promise<void> {
    // Handled by parent transaction
  }

  async healthCheck(): Promise<boolean> {
    return true; // Already validated
  }

  getStats(): any {
    return this.parent.getStats();
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const queryParams = Array.isArray(params) ? params : (params ? [params] : []);
    return this.pgClient.query(sql, queryParams);
  }

  async find(table: string, options?: QueryOptions): Promise<any[]> {
    const { sql, params } = this.parent['buildSelectQuery'](table, options || {});
    const result = await this.pgClient.query(sql, params);
    return result.rows;
  }

  async findOne(table: string, conditions: Record<string, any>): Promise<any> {
    const results = await this.find(table, {
      where: Object.entries(conditions).map(([column, value]) => ({
        column,
        operator: '=',
        value
      })),
      limit: 1
    });
    return results[0] || null;
  }

  async insert(table: string, data: InsertData | InsertData[]): Promise<any> {
    const records = Array.isArray(data) ? data : [data];
    const { sql, params } = this.parent['buildInsertQuery'](table, records);
    return this.pgClient.query(sql, params);
  }

  async update(table: string, data: UpdateData, conditions: Record<string, any>): Promise<number> {
    const { sql, params } = this.parent['buildUpdateQuery'](table, data, conditions);
    const result = await this.pgClient.query(sql, params);
    return result.rowCount;
  }

  async delete(table: string, conditions: Record<string, any>): Promise<number> {
    const { sql, params } = this.parent['buildDeleteQuery'](table, conditions);
    const result = await this.pgClient.query(sql, params);
    return result.rowCount;
  }

  async count(table: string, conditions?: Record<string, any>): Promise<number> {
    const whereClause = conditions ? Object.entries(conditions).map(([column, value]) => ({
      column,
      operator: '=',
      value
    })) : [];

    const { sql, params } = this.parent['buildSelectQuery'](table, {
      select: ['COUNT(*) as count'],
      where: whereClause
    });

    const result = await this.pgClient.query(sql, params);
    return parseInt(result.rows[0].count);
  }

  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    // Nested transactions not supported in PostgreSQL
    throw new Error('Nested transactions not supported');
  }

  get cache(): DatabaseClient['cache'] | undefined {
    return this.parent.cache;
  }

  get pubsub(): DatabaseClient['pubsub'] | undefined {
    return this.parent.pubsub;
  }
}

// Export types and utilities
export type { DatabaseConfig, DatabaseClient, QueryOptions, WhereClause, OrderByClause, InsertData, UpdateData, Migration, MigrationRecord, CacheOptions, CacheEntry };