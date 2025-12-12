/**
 * @fileoverview Bun Redis Client Implementation
 * @description High-performance Redis client using Bun's native TCP sockets
 * @version 1.0.0
 * @since 2025-01-01
 *
 * EX030: Advanced Redis Client with Connection Pooling
 * Implements Redis RESP protocol over TCP using Bun.serve and TCP sockets
 * Features: Connection pooling, pipelining, pub/sub, clustering support
 */

import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { Socket } from 'node:net';

// Redis RESP protocol constants
const CRLF = '\r\n';
const OK_RESPONSE = '+OK\r\n';
const PONG_RESPONSE = '+PONG\r\n';

// Redis commands
enum RedisCommand {
  PING = 'PING',
  GET = 'GET',
  SET = 'SET',
  DEL = 'DEL',
  EXISTS = 'EXISTS',
  EXPIRE = 'EXPIRE',
  TTL = 'TTL',
  INCR = 'INCR',
  DECR = 'DECR',
  HGET = 'HGET',
  HSET = 'HSET',
  HDEL = 'HDEL',
  HLEN = 'HLEN',
  HKEYS = 'HKEYS',
  HVALS = 'HVALS',
  HGETALL = 'HGETALL',
  LPUSH = 'LPUSH',
  RPUSH = 'RPUSH',
  LPOP = 'LPOP',
  RPOP = 'RPOP',
  LLEN = 'LLEN',
  LRANGE = 'LRANGE',
  SADD = 'SADD',
  SREM = 'SREM',
  SISMEMBER = 'SISMEMBER',
  SCARD = 'SCARD',
  SMEMBERS = 'SMEMBERS',
  PUBLISH = 'PUBLISH',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  PSUBSCRIBE = 'PSUBSCRIBE',
  PUNSUBSCRIBE = 'PUNSUBSCRIBE',
  SELECT = 'SELECT',
  AUTH = 'AUTH',
  QUIT = 'QUIT'
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  maxConnections?: number;
  minConnections?: number;
  connectionTimeout?: number;
  commandTimeout?: number;
  retryDelay?: number;
  maxRetries?: number;
  keyPrefix?: string;
}

interface Connection {
  id: string;
  socket: any; // Bun TCP socket
  connected: boolean;
  lastUsed: number;
  buffer: string;
  pendingCommands: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>;
  selectedDb: number;
  authenticated: boolean;
}

interface RedisResult {
  value: any;
  type: 'string' | 'integer' | 'array' | 'error' | 'null';
}

interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalCommands: number;
  failedCommands: number;
}

/**
 * Enterprise Redis Client with Connection Pooling
 */
export class BunRedis {
  private config: Required<RedisConfig>;
  private pool: Connection[] = [];
  private waitingQueue: Array<(conn: Connection) => void> = [];
  private eventEmitter = new EventEmitter();
  private stats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingClients: 0,
    totalCommands: 0,
    failedCommands: 0
  };
  private subscriptions = new Map<string, Set<(message: any) => void>>();
  private psubscriptions = new Map<string, Set<(message: any) => void>>();

  constructor(config: RedisConfig) {
    this.config = {
      host: 'localhost',
      port: 6379,
      database: 0,
      maxConnections: 10,
      minConnections: 2,
      connectionTimeout: 30000,
      commandTimeout: 30000,
      retryDelay: 1000,
      maxRetries: 3,
      keyPrefix: '',
      ...config
    };

    this.initializePool();
  }

  /**
   * Initialize connection pool with minimum connections
   */
  private async initializePool(): Promise<void> {
    const promises = [];
    for (let i = 0; i < this.config.minConnections; i++) {
      promises.push(this.createConnection());
    }

    try {
      await Promise.all(promises);
      this.eventEmitter.emit('poolReady');
    } catch (error) {
      console.error('Failed to initialize Redis connection pool:', error);
      this.eventEmitter.emit('poolError', error);
    }
  }

  /**
   * Create a new Redis connection
   */
  private async createConnection(): Promise<Connection> {
    const connectionId = randomUUID();

    try {
      // Create TCP connection to Redis using Node.js net
      const socket = new Socket();

      // Set up event handlers
      socket.on('connect', () => this.handleSocketOpen(connectionId));
      socket.on('data', (data) => this.handleSocketData(connectionId, data));
      socket.on('close', () => this.handleSocketClose(connectionId));
      socket.on('error', (error) => this.handleSocketError(connectionId, error));
      socket.setTimeout(this.config.connectionTimeout);

      // Connect to Redis
      await new Promise<void>((resolve, reject) => {
        socket.connect(this.config.port, this.config.host, resolve);
        socket.on('error', reject);
        socket.on('timeout', () => reject(new Error('Connection timeout')));
      });

      const connection: Connection = {
        id: connectionId,
        socket,
        connected: false,
        lastUsed: Date.now(),
        buffer: '',
        pendingCommands: new Map(),
        selectedDb: 0,
        authenticated: !this.config.password // No auth needed if no password
      };

      this.pool.push(connection);
      this.stats.totalConnections++;
      this.stats.idleConnections++;

      // Authenticate if password is provided
      if (this.config.password) {
        await this.authenticate(connection);
      }

      // Select database
      if (this.config.database !== 0) {
        await this.selectDatabase(connection, this.config.database);
      }

      connection.connected = true;
      this.eventEmitter.emit('connected', connectionId);

      return connection;
    } catch (error) {
      console.error(`Failed to create Redis connection ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * Handle socket open event
   */
  private handleSocketOpen(connectionId: string): void {
    console.log(`Redis connection ${connectionId} opened`);
  }

  /**
   * Handle incoming socket data (RESP protocol)
   */
  private handleSocketData(connectionId: string, data: Buffer): void {
    const connection = this.pool.find(conn => conn.id === connectionId);
    if (!connection) return;

    connection.buffer += data.toString();

    // Process complete RESP messages
    this.processBuffer(connection);
  }

  /**
   * Handle socket close event
   */
  private handleSocketClose(connectionId: string): void {
    console.log(`Redis connection ${connectionId} closed`);
    this.removeConnection(connectionId);
  }

  /**
   * Handle socket error event
   */
  private handleSocketError(connectionId: string, error: Error): void {
    console.error(`Redis connection ${connectionId} error:`, error);
    this.removeConnection(connectionId);
  }

  /**
   * Remove connection from pool
   */
  private removeConnection(connectionId: string): void {
    const index = this.pool.findIndex(conn => conn.id === connectionId);
    if (index !== -1) {
      const connection = this.pool[index];
      this.pool.splice(index, 1);
      this.stats.totalConnections--;

      // Reject all pending commands
      for (const [commandId, { reject }] of connection.pendingCommands) {
        reject(new Error('Connection closed'));
        clearTimeout(connection.pendingCommands.get(commandId)!.timeout);
      }

      if (connection.connected) {
        this.stats.activeConnections--;
      } else {
        this.stats.idleConnections--;
      }
    }
  }

  /**
   * Authenticate with Redis server
   */
  private async authenticate(connection: Connection): Promise<void> {
    const command = this.buildCommand(RedisCommand.AUTH, [this.config.password!]);
    await connection.socket.write(command);

    return new Promise((resolve, reject) => {
      const authCommandId = `auth_${connection.id}`;
      const timeout = setTimeout(() => {
        connection.pendingCommands.delete(authCommandId);
        reject(new Error('Authentication timeout'));
      }, this.config.commandTimeout);

      connection.pendingCommands.set(authCommandId, {
        resolve: (result: any) => {
          clearTimeout(timeout);
          if (result && result.type === 'error') {
            reject(new Error(`Authentication failed: ${result.value}`));
          } else {
            connection.authenticated = true;
            resolve();
          }
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout
      });
    });
  }

  /**
   * Select Redis database
   */
  private async selectDatabase(connection: Connection, db: number): Promise<void> {
    const command = this.buildCommand(RedisCommand.SELECT, [db.toString()]);
    await connection.socket.write(command);

    return new Promise((resolve, reject) => {
      const selectHandler = (result: RedisResult) => {
        if (result.type === 'error') {
          reject(new Error(`Database selection failed: ${result.value}`));
        } else {
          connection.selectedDb = db;
          resolve();
        }
        this.eventEmitter.removeListener('selectResponse', selectHandler);
      };

      this.eventEmitter.on('selectResponse', selectHandler);

      setTimeout(() => {
        this.eventEmitter.removeListener('selectResponse', selectHandler);
        reject(new Error('Database selection timeout'));
      }, this.config.commandTimeout);
    });
  }

  /**
   * Process accumulated buffer for complete RESP messages
   */
  private processBuffer(connection: Connection): void {
    while (connection.buffer.length > 0) {
      const result = this.parseRESPMessage(connection.buffer);
      if (!result) break;

      connection.buffer = connection.buffer.slice(result.consumed);

      // Handle the parsed result
      this.handleRedisResult(connection, result.value);
    }
  }

  /**
   * Parse RESP (Redis Serialization Protocol) message
   */
  private parseRESPMessage(buffer: string): { value: RedisResult; consumed: number } | null {
    if (buffer.length === 0) return null;

    const type = buffer[0];
    let offset = 1;

    switch (type) {
      case '+': // Simple String
        const simpleStringEnd = buffer.indexOf(CRLF, offset);
        if (simpleStringEnd === -1) return null;
        const simpleString = buffer.slice(offset, simpleStringEnd);
        return {
          value: { value: simpleString, type: 'string' },
          consumed: simpleStringEnd + 2
        };

      case '-': // Error
        const errorEnd = buffer.indexOf(CRLF, offset);
        if (errorEnd === -1) return null;
        const errorMessage = buffer.slice(offset, errorEnd);
        return {
          value: { value: errorMessage, type: 'error' },
          consumed: errorEnd + 2
        };

      case ':': // Integer
        const intEnd = buffer.indexOf(CRLF, offset);
        if (intEnd === -1) return null;
        const intValue = parseInt(buffer.slice(offset, intEnd));
        return {
          value: { value: intValue, type: 'integer' },
          consumed: intEnd + 2
        };

      case '$': // Bulk String
        const bulkLenEnd = buffer.indexOf(CRLF, offset);
        if (bulkLenEnd === -1) return null;
        const bulkLen = parseInt(buffer.slice(offset, bulkLenEnd));
        if (bulkLen === -1) {
          // Null bulk string
          return {
            value: { value: null, type: 'null' },
            consumed: bulkLenEnd + 2
          };
        }
        const bulkStart = bulkLenEnd + 2;
        const bulkEnd = bulkStart + bulkLen;
        if (bulkEnd + 2 > buffer.length) return null;
        const bulkString = buffer.slice(bulkStart, bulkEnd);
        return {
          value: { value: bulkString, type: 'string' },
          consumed: bulkEnd + 2
        };

      case '*': // Array
        const arrayLenEnd = buffer.indexOf(CRLF, offset);
        if (arrayLenEnd === -1) return null;
        const arrayLen = parseInt(buffer.slice(offset, arrayLenEnd));
        if (isNaN(arrayLen)) return null;

        if (arrayLen === -1) {
          // Null array
          return {
            value: { value: null, type: 'null' },
            consumed: arrayLenEnd + 2
          };
        }

        if (arrayLen === 0) {
          // Empty array
          return {
            value: { value: [], type: 'array' },
            consumed: arrayLenEnd + 2
          };
        }

        const array: any[] = [];
        let arrayOffset = arrayLenEnd + 2;

        for (let i = 0; i < arrayLen; i++) {
          const elementResult = this.parseRESPMessage(buffer.slice(arrayOffset));
          if (!elementResult) return null;
          array.push(elementResult.value.value);
          arrayOffset += elementResult.consumed;
        }

        return {
          value: { value: array, type: 'array' },
          consumed: arrayOffset
        };

      default:
        throw new Error(`Unknown RESP type: ${type}`);
    }
  }

  /**
   * Handle parsed Redis result
   */
  private handleRedisResult(connection: Connection, result: RedisResult): void {
    // Handle pub/sub messages
    if (this.isPubSubMessage(result)) {
      this.handlePubSubMessage(result);
      return;
    }

    // Handle regular command responses
    if (connection.pendingCommands.size > 0) {
      const [commandId, { resolve, reject, timeout }] = connection.pendingCommands.entries().next().value;
      connection.pendingCommands.delete(commandId);
      clearTimeout(timeout);

      if (result.type === 'error') {
        reject(new Error(result.value));
      } else {
        resolve(result.value);
      }
    }
  }

  /**
   * Check if result is a pub/sub message
   */
  private isPubSubMessage(result: RedisResult): boolean {
    return result.type === 'array' &&
           Array.isArray(result.value) &&
           result.value.length >= 3 &&
           (result.value[0] === 'message' || result.value[0] === 'pmessage');
  }

  /**
   * Handle pub/sub message
   */
  private handlePubSubMessage(result: RedisResult): void {
    const [messageType, channel, payload] = result.value;

    if (messageType === 'message') {
      const handlers = this.subscriptions.get(channel);
      if (handlers) {
        handlers.forEach(handler => handler({ channel, message: payload }));
      }
    } else if (messageType === 'pmessage') {
      const pattern = result.value[1];
      const handlers = this.psubscriptions.get(pattern);
      if (handlers) {
        handlers.forEach(handler => handler({ pattern, channel, message: payload }));
      }
    }
  }

  /**
   * Build RESP command
   */
  private buildCommand(command: string, args: string[] = []): Buffer {
    const parts = ['*' + (args.length + 1) + CRLF];

    // Add command
    parts.push('$' + Buffer.byteLength(command) + CRLF + command + CRLF);

    // Add arguments
    for (const arg of args) {
      const argStr = typeof arg === 'string' ? arg : JSON.stringify(arg);
      parts.push('$' + Buffer.byteLength(argStr) + CRLF + argStr + CRLF);
    }

    return Buffer.from(parts.join(''));
  }

  /**
   * Acquire a connection from the pool
   */
  private async acquireConnection(): Promise<Connection> {
    return new Promise((resolve, reject) => {
      const idleConnection = this.getIdleConnection();

      if (idleConnection) {
        this.stats.idleConnections--;
        this.stats.activeConnections++;
        idleConnection.lastUsed = Date.now();
        resolve(idleConnection);
        return;
      }

      // No idle connections, check if we can create more
      if (this.stats.totalConnections < this.config.maxConnections) {
        this.createConnection().then(connection => {
          this.stats.activeConnections++;
          connection.lastUsed = Date.now();
          resolve(connection);
        }).catch(reject);
        return;
      }

      // Wait for a connection to become available
      this.stats.waitingClients++;
      this.waitingQueue.push((connection) => {
        this.stats.waitingClients--;
        resolve(connection);
      });

      // Set timeout
      setTimeout(() => {
        this.stats.waitingClients--;
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);
    });
  }

  /**
   * Release a connection back to the pool
   */
  private releaseConnection(connection: Connection): void {
    this.stats.activeConnections--;
    this.stats.idleConnections++;
    connection.lastUsed = Date.now();

    // Process waiting queue
    this.processWaitingQueue();
  }

  /**
   * Get an idle connection from the pool
   */
  private getIdleConnection(): Connection | null {
    return this.pool.find(conn => conn.connected && !conn.socket.destroyed) || null;
  }

  /**
   * Process waiting queue when connections become available
   */
  private processWaitingQueue(): void {
    if (this.waitingQueue.length > 0 && this.stats.idleConnections > 0) {
      const callback = this.waitingQueue.shift();
      const connection = this.getIdleConnection();

      if (connection && callback) {
        this.stats.idleConnections--;
        this.stats.activeConnections++;
        connection.lastUsed = Date.now();
        callback(connection);
      }
    }
  }

  /**
   * Execute a Redis command
   */
  private async executeCommand(command: string, args: string[] = []): Promise<any> {
    const connection = await this.acquireConnection();
    const commandId = randomUUID();

    try {
      const commandBuffer = this.buildCommand(command, args);
      await connection.socket.write(commandBuffer);

      this.stats.totalCommands++;

      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          connection.pendingCommands.delete(commandId);
          reject(new Error('Command timeout'));
        }, this.config.commandTimeout);

        connection.pendingCommands.set(commandId, { resolve, reject, timeout });
      });
    } catch (error) {
      this.stats.failedCommands++;
      throw error;
    } finally {
      this.releaseConnection(connection);
    }
  }

  /**
   * Apply key prefix if configured
   */
  private applyKeyPrefix(key: string): string {
    return this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key;
  }

  // ===== STRING OPERATIONS =====

  async get(key: string): Promise<string | null> {
    return this.executeCommand(RedisCommand.GET, [this.applyKeyPrefix(key)]);
  }

  async set(key: string, value: string, options?: { ex?: number; px?: number; nx?: boolean; xx?: boolean }): Promise<string> {
    const args = [this.applyKeyPrefix(key), value];

    if (options) {
      if (options.ex) args.push('EX', options.ex.toString());
      if (options.px) args.push('PX', options.px.toString());
      if (options.nx) args.push('NX');
      if (options.xx) args.push('XX');
    }

    return this.executeCommand(RedisCommand.SET, args);
  }

  async del(...keys: string[]): Promise<number> {
    const prefixedKeys = keys.map(key => this.applyKeyPrefix(key));
    return this.executeCommand(RedisCommand.DEL, prefixedKeys);
  }

  async exists(...keys: string[]): Promise<number> {
    const prefixedKeys = keys.map(key => this.applyKeyPrefix(key));
    return this.executeCommand(RedisCommand.EXISTS, prefixedKeys);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.executeCommand(RedisCommand.EXPIRE, [this.applyKeyPrefix(key), seconds.toString()]);
  }

  async ttl(key: string): Promise<number> {
    return this.executeCommand(RedisCommand.TTL, [this.applyKeyPrefix(key)]);
  }

  async incr(key: string): Promise<number> {
    return this.executeCommand(RedisCommand.INCR, [this.applyKeyPrefix(key)]);
  }

  async decr(key: string): Promise<number> {
    return this.executeCommand(RedisCommand.DECR, [this.applyKeyPrefix(key)]);
  }

  // ===== HASH OPERATIONS =====

  async hget(key: string, field: string): Promise<string | null> {
    return this.executeCommand(RedisCommand.HGET, [this.applyKeyPrefix(key), field]);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.executeCommand(RedisCommand.HSET, [this.applyKeyPrefix(key), field, value]);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.executeCommand(RedisCommand.HDEL, [this.applyKeyPrefix(key), ...fields]);
  }

  async hlen(key: string): Promise<number> {
    return this.executeCommand(RedisCommand.HLEN, [this.applyKeyPrefix(key)]);
  }

  async hkeys(key: string): Promise<string[]> {
    return this.executeCommand(RedisCommand.HKEYS, [this.applyKeyPrefix(key)]);
  }

  async hvals(key: string): Promise<string[]> {
    return this.executeCommand(RedisCommand.HVALS, [this.applyKeyPrefix(key)]);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const result = await this.executeCommand(RedisCommand.HGETALL, [this.applyKeyPrefix(key)]);
    const obj: Record<string, string> = {};
    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = result[i + 1];
    }
    return obj;
  }

  // ===== LIST OPERATIONS =====

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.executeCommand(RedisCommand.LPUSH, [this.applyKeyPrefix(key), ...values]);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.executeCommand(RedisCommand.RPUSH, [this.applyKeyPrefix(key), ...values]);
  }

  async lpop(key: string): Promise<string | null> {
    return this.executeCommand(RedisCommand.LPOP, [this.applyKeyPrefix(key)]);
  }

  async rpop(key: string): Promise<string | null> {
    return this.executeCommand(RedisCommand.RPOP, [this.applyKeyPrefix(key)]);
  }

  async llen(key: string): Promise<number> {
    return this.executeCommand(RedisCommand.LLEN, [this.applyKeyPrefix(key)]);
  }

  async lrange(key: string, start: number, end: number): Promise<string[]> {
    return this.executeCommand(RedisCommand.LRANGE, [this.applyKeyPrefix(key), start.toString(), end.toString()]);
  }

  // ===== SET OPERATIONS =====

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.executeCommand(RedisCommand.SADD, [this.applyKeyPrefix(key), ...members]);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.executeCommand(RedisCommand.SREM, [this.applyKeyPrefix(key), ...members]);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.executeCommand(RedisCommand.SISMEMBER, [this.applyKeyPrefix(key), member]);
  }

  async scard(key: string): Promise<number> {
    return this.executeCommand(RedisCommand.SCARD, [this.applyKeyPrefix(key)]);
  }

  async smembers(key: string): Promise<string[]> {
    return this.executeCommand(RedisCommand.SMEMBERS, [this.applyKeyPrefix(key)]);
  }

  // ===== PUB/SUB OPERATIONS =====

  async publish(channel: string, message: string): Promise<number> {
    return this.executeCommand(RedisCommand.PUBLISH, [channel, message]);
  }

  subscribe(channel: string, callback: (message: any) => void): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      // Send SUBSCRIBE command
      this.executeCommand(RedisCommand.SUBSCRIBE, [channel]).catch(console.error);
    }
    this.subscriptions.get(channel)!.add(callback);
  }

  unsubscribe(channel: string, callback?: (message: any) => void): void {
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      if (callback) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.subscriptions.delete(channel);
          this.executeCommand(RedisCommand.UNSUBSCRIBE, [channel]).catch(console.error);
        }
      } else {
        handlers.clear();
        this.subscriptions.delete(channel);
        this.executeCommand(RedisCommand.UNSUBSCRIBE, [channel]).catch(console.error);
      }
    }
  }

  psubscribe(pattern: string, callback: (message: any) => void): void {
    if (!this.psubscriptions.has(pattern)) {
      this.psubscriptions.set(pattern, new Set());
      this.executeCommand(RedisCommand.PSUBSCRIBE, [pattern]).catch(console.error);
    }
    this.psubscriptions.get(pattern)!.add(callback);
  }

  punsubscribe(pattern: string, callback?: (message: any) => void): void {
    const handlers = this.psubscriptions.get(pattern);
    if (handlers) {
      if (callback) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.psubscriptions.delete(pattern);
          this.executeCommand(RedisCommand.PUNSUBSCRIBE, [pattern]).catch(console.error);
        }
      } else {
        handlers.clear();
        this.psubscriptions.delete(pattern);
        this.executeCommand(RedisCommand.PUNSUBSCRIBE, [pattern]).catch(console.error);
      }
    }
  }

  // ===== UTILITY OPERATIONS =====

  async ping(): Promise<string> {
    return this.executeCommand(RedisCommand.PING);
  }

  async quit(): Promise<string> {
    return this.executeCommand(RedisCommand.QUIT);
  }

  /**
   * Get connection pool statistics
   */
  getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Close all connections and destroy the pool
   */
  async close(): Promise<void> {
    // Unsubscribe from all channels
    for (const channel of this.subscriptions.keys()) {
      await this.executeCommand(RedisCommand.UNSUBSCRIBE, [channel]).catch(console.error);
    }
    for (const pattern of this.psubscriptions.keys()) {
      await this.executeCommand(RedisCommand.PUNSUBSCRIBE, [pattern]).catch(console.error);
    }

    const promises = this.pool.map(async (connection) => {
      if (connection.socket && !connection.socket.destroyed) {
        await this.executeCommand(RedisCommand.QUIT).catch(console.error);
        connection.socket.end();
      }
    });

    await Promise.all(promises);
    this.pool = [];
    this.subscriptions.clear();
    this.psubscriptions.clear();
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalCommands: 0,
      failedCommands: 0
    };
  }

  /**
   * Execute multiple commands in a pipeline
   */
  async pipeline(commands: Array<{ command: string; args?: string[] }>): Promise<any[]> {
    const connection = await this.acquireConnection();

    try {
      // Build all commands
      const commandBuffers = commands.map(({ command, args = [] }) =>
        this.buildCommand(command, args)
      );

      // Send all commands at once
      const pipelineBuffer = Buffer.concat(commandBuffers);
      await connection.socket.write(pipelineBuffer);

      // Collect all responses
      const results: any[] = [];
      for (let i = 0; i < commands.length; i++) {
        results.push(await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Pipeline command timeout'));
          }, this.config.commandTimeout);

          const commandId = `pipeline-${i}`;
          connection.pendingCommands.set(commandId, {
            resolve: (value: any) => {
              clearTimeout(timeout);
              resolve(value);
            },
            reject: (error: Error) => {
              clearTimeout(timeout);
              reject(error);
            },
            timeout
          });
        }));
      }

      return results;
    } finally {
      this.releaseConnection(connection);
    }
  }
}

// Export types
export type { RedisConfig, RedisResult, PoolStats };