/**
 * @fileoverview Database Performance Benchmarks
 * @description Comprehensive performance benchmarks for PostgreSQL and Redis clients
 * @version 1.0.0
 * @since 2025-01-01
 */

import { BunPostgres } from '../bun-postgres';
import { BunRedis } from '../bun-redis';
import { BunDatabase, DatabaseType } from '../bun-database';

// Benchmark configurations
const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'bench_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  maxConnections: 20,
  minConnections: 5,
  connectionTimeout: 10000,
  queryTimeout: 30000
};

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '3'), // Use database 3 for benchmarks
  maxConnections: 20,
  minConnections: 5,
  connectionTimeout: 10000,
  commandTimeout: 30000,
  keyPrefix: 'bench:'
};

const hybridConfig = {
  type: DatabaseType.POSTGRESQL,
  postgresql: postgresConfig,
  cache: {
    enabled: true,
    redis: redisConfig,
    defaultTtl: 3600
  }
};

// Benchmark data generators
function generateUserData(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      name: `Benchmark User ${i}`,
      email: `bench${i}@example.com`,
      age: 18 + (i % 50),
      active: i % 10 !== 0, // 90% active users
      profile_data: {
        theme: ['light', 'dark', 'auto'][i % 3],
        language: ['en', 'es', 'fr', 'de'][i % 4],
        preferences: {
          notifications: i % 2 === 0,
          analytics: i % 3 === 0
        }
      },
      created_at: new Date(Date.now() - (i * 1000 * 60 * 60)) // Spread over hours
    });
  }
  return users;
}

function generateCacheData(count: number) {
  const cacheEntries = [];
  for (let i = 0; i < count; i++) {
    cacheEntries.push({
      key: `cache:item:${i}`,
      value: {
        id: i,
        data: `Benchmark cache data ${i}`,
        metadata: {
          size: 100 + (i % 100),
          category: ['user', 'product', 'session', 'config'][i % 4],
          tags: [`tag${i % 10}`, `group${i % 5}`]
        },
        timestamp: Date.now() - (i * 1000)
      },
      ttl: 300 + (i % 300) // 5-10 minutes TTL
    });
  }
  return cacheEntries;
}

// Performance benchmark suite
export class DatabaseBenchmarks {
  private postgres?: BunPostgres;
  private redis?: BunRedis;
  private hybrid?: BunDatabase;
  private results: any = {};

  async setup(): Promise<void> {
    console.log('🔧 Setting up database benchmarks...');

    try {
      // Initialize PostgreSQL
      this.postgres = new BunPostgres(postgresConfig);
      await this.postgres.healthCheck();
      console.log('✅ PostgreSQL connected');
    } catch (error) {
      console.warn('⚠️ PostgreSQL not available:', error);
    }

    try {
      // Initialize Redis
      this.redis = new BunRedis(redisConfig);
      await this.redis.healthCheck();
      console.log('✅ Redis connected');
    } catch (error) {
      console.warn('⚠️ Redis not available:', error);
    }

    try {
      // Initialize hybrid database
      this.hybrid = new BunDatabase(hybridConfig);
      await this.hybrid.connect();
      console.log('✅ Hybrid database connected');
    } catch (error) {
      console.warn('⚠️ Hybrid database not available:', error);
    }

    // Setup benchmark tables/data
    await this.setupBenchmarkData();
  }

  private async setupBenchmarkData(): Promise<void> {
    if (this.postgres) {
      // Create benchmark tables
      await this.postgres.query(`
        CREATE TABLE IF NOT EXISTS bench_users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          age INTEGER,
          active BOOLEAN DEFAULT true,
          profile_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.postgres.query(`
        CREATE INDEX IF NOT EXISTS idx_bench_users_email ON bench_users(email);
        CREATE INDEX IF NOT EXISTS idx_bench_users_age ON bench_users(age);
        CREATE INDEX IF NOT EXISTS idx_bench_users_active ON bench_users(active);
      `);

      // Clean up any existing data
      await this.postgres.query('DELETE FROM bench_users');
    }

    if (this.redis) {
      // Clean up benchmark keys
      const keys = await this.redis.keys('bench:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  async teardown(): Promise<void> {
    console.log('🧹 Cleaning up database benchmarks...');

    if (this.hybrid) {
      await this.hybrid.disconnect();
    }

    if (this.redis) {
      await this.redis.close();
    }

    if (this.postgres) {
      await this.postgres.close();
    }
  }

  async runAllBenchmarks(): Promise<any> {
    console.log('🏃 Running database performance benchmarks...\n');

    const benchmarks = [
      this.benchmarkPostgresInserts,
      this.benchmarkPostgresQueries,
      this.benchmarkPostgresUpdates,
      this.benchmarkPostgresDeletes,
      this.benchmarkRedisOperations,
      this.benchmarkRedisPipeline,
      this.benchmarkCacheOperations,
      this.benchmarkHybridOperations,
      this.benchmarkConcurrentOperations,
      this.benchmarkConnectionPooling
    ];

    for (const benchmark of benchmarks) {
      try {
        const result = await benchmark.call(this);
        if (result) {
          this.results[result.name] = result;
          console.log(`✅ ${result.name}: ${result.summary}`);
        }
      } catch (error) {
        console.error(`❌ Benchmark failed:`, error);
      }
    }

    return this.results;
  }

  // ===== POSTGRESQL BENCHMARKS =====

  async benchmarkPostgresInserts(): Promise<any> {
    if (!this.postgres) return null;

    const batchSizes = [1, 10, 100, 1000];
    const results = {};

    for (const batchSize of batchSizes) {
      const testData = generateUserData(batchSize);

      const startTime = Bun.nanoseconds();

      if (batchSize === 1) {
        // Single inserts
        for (const user of testData) {
          await this.postgres.query(
            'INSERT INTO bench_users (name, email, age, active, profile_data) VALUES ($1, $2, $3, $4, $5)',
            [user.name, user.email, user.age, user.active, JSON.stringify(user.profile_data)]
          );
        }
      } else {
        // Batch insert
        const values = testData.map(user =>
          `('${user.name.replace(/'/g, "''")}', '${user.email}', ${user.age}, ${user.active}, '${JSON.stringify(user.profile_data).replace(/'/g, "''")}')`
        ).join(', ');

        await this.postgres.query(`
          INSERT INTO bench_users (name, email, age, active, profile_data)
          VALUES ${values}
        `);
      }

      const endTime = Bun.nanoseconds();
      const duration = (endTime - startTime) / 1e6; // Convert to milliseconds
      const opsPerSecond = batchSize / (duration / 1000);

      results[`${batchSize}_records`] = {
        duration_ms: duration,
        ops_per_second: opsPerSecond,
        avg_latency_ms: duration / batchSize
      };
    }

    return {
      name: 'PostgreSQL Inserts',
      summary: `${results['1000_records'].ops_per_second.toFixed(0)} inserts/sec (batch)`,
      details: results
    };
  }

  async benchmarkPostgresQueries(): Promise<any> {
    if (!this.postgres) return null;

    // Ensure we have data
    const testData = generateUserData(1000);
    for (const user of testData) {
      await this.postgres.query(
        'INSERT INTO bench_users (name, email, age, active, profile_data) VALUES ($1, $2, $3, $4, $5)',
        [user.name, user.email, user.age, user.active, JSON.stringify(user.profile_data)]
      );
    }

    const queryTypes = [
      {
        name: 'Simple SELECT',
        sql: 'SELECT * FROM bench_users LIMIT 100',
        params: []
      },
      {
        name: 'WHERE clause',
        sql: 'SELECT * FROM bench_users WHERE age > $1 AND active = $2',
        params: [25, true]
      },
      {
        name: 'JSON query',
        sql: 'SELECT * FROM bench_users WHERE profile_data->>\'theme\' = $1',
        params: ['dark']
      },
      {
        name: 'COUNT query',
        sql: 'SELECT COUNT(*) FROM bench_users WHERE age BETWEEN $1 AND $2',
        params: [20, 30]
      },
      {
        name: 'ORDER BY + LIMIT',
        sql: 'SELECT * FROM bench_users ORDER BY created_at DESC LIMIT $1',
        params: [50]
      }
    ];

    const results = {};

    for (const query of queryTypes) {
      const iterations = 100;
      const startTime = Bun.nanoseconds();

      for (let i = 0; i < iterations; i++) {
        await this.postgres.query(query.sql, query.params);
      }

      const endTime = Bun.nanoseconds();
      const totalDuration = (endTime - startTime) / 1e6; // Convert to milliseconds
      const avgLatency = totalDuration / iterations;
      const queriesPerSecond = iterations / (totalDuration / 1000);

      results[query.name] = {
        avg_latency_ms: avgLatency,
        queries_per_second: queriesPerSecond,
        total_duration_ms: totalDuration
      };
    }

    return {
      name: 'PostgreSQL Queries',
      summary: `${results['Simple SELECT'].queries_per_second.toFixed(0)} queries/sec (simple)`,
      details: results
    };
  }

  async benchmarkPostgresUpdates(): Promise<any> {
    if (!this.postgres) return null;

    // Setup test data
    const testData = generateUserData(1000);
    for (const user of testData) {
      await this.postgres.query(
        'INSERT INTO bench_users (name, email, age, active, profile_data) VALUES ($1, $2, $3, $4, $5)',
        [user.name, user.email, user.age, user.active, JSON.stringify(user.profile_data)]
      );
    }

    const updateOperations = [
      {
        name: 'Single field update',
        sql: 'UPDATE bench_users SET age = age + 1 WHERE id = $1',
        getIds: async () => {
          const result = await this.postgres!.query('SELECT id FROM bench_users LIMIT 500');
          return result.rows.map(row => row.id);
        }
      },
      {
        name: 'JSON field update',
        sql: 'UPDATE bench_users SET profile_data = profile_data || $1 WHERE id = $2',
        getIds: async () => {
          const result = await this.postgres!.query('SELECT id FROM bench_users LIMIT 500');
          return result.rows.map(row => [JSON.stringify({ 'last_updated': new Date().toISOString() }), row.id]);
        }
      }
    ];

    const results = {};

    for (const operation of updateOperations) {
      const ids = await operation.getIds();
      const startTime = Bun.nanoseconds();

      for (const params of ids) {
        await this.postgres!.query(operation.sql, Array.isArray(params) ? params : [params]);
      }

      const endTime = Bun.nanoseconds();
      const duration = (endTime - startTime) / 1e6;
      const opsPerSecond = ids.length / (duration / 1000);

      results[operation.name] = {
        duration_ms: duration,
        ops_per_second: opsPerSecond,
        records_updated: ids.length
      };
    }

    return {
      name: 'PostgreSQL Updates',
      summary: `${results['Single field update'].ops_per_second.toFixed(0)} updates/sec`,
      details: results
    };
  }

  async benchmarkPostgresDeletes(): Promise<any> {
    if (!this.postgres) return null;

    const deleteCounts = [10, 100, 500];
    const results = {};

    for (const count of deleteCounts) {
      // Setup fresh data for each test
      const testData = generateUserData(count * 2);
      for (const user of testData) {
        await this.postgres.query(
          'INSERT INTO bench_users (name, email, age, active, profile_data) VALUES ($1, $2, $3, $4, $5)',
          [user.name, user.email, user.age, user.active, JSON.stringify(user.profile_data)]
        );
      }

      // Get IDs to delete
      const idsResult = await this.postgres.query('SELECT id FROM bench_users LIMIT $1', [count]);
      const ids = idsResult.rows.map(row => row.id);

      const startTime = Bun.nanoseconds();

      // Delete records
      await this.postgres.query(`DELETE FROM bench_users WHERE id = ANY($1)`, [ids]);

      const endTime = Bun.nanoseconds();
      const duration = (endTime - startTime) / 1e6;
      const opsPerSecond = count / (duration / 1000);

      results[`${count}_records`] = {
        duration_ms: duration,
        ops_per_second: opsPerSecond,
        records_deleted: count
      };
    }

    return {
      name: 'PostgreSQL Deletes',
      summary: `${results['500_records'].ops_per_second.toFixed(0)} deletes/sec`,
      details: results
    };
  }

  // ===== REDIS BENCHMARKS =====

  async benchmarkRedisOperations(): Promise<any> {
    if (!this.redis) return null;

    const operationTypes = [
      {
        name: 'SET operations',
        operation: async (i: number) => {
          await this.redis!.set(`bench:key:${i}`, `value${i}`, { ex: 300 });
        }
      },
      {
        name: 'GET operations',
        setup: async () => {
          // Pre-populate keys
          for (let i = 0; i < 1000; i++) {
            await this.redis!.set(`bench:get:key:${i}`, `value${i}`);
          }
        },
        operation: async (i: number) => {
          await this.redis!.get(`bench:get:key:${i % 1000}`);
        }
      },
      {
        name: 'INCR operations',
        operation: async (i: number) => {
          await this.redis!.incr(`bench:counter:${i % 10}`);
        }
      },
      {
        name: 'Hash operations',
        operation: async (i: number) => {
          const hashKey = `bench:hash:${i % 50}`;
          await this.redis!.hset(hashKey, `field${i % 10}`, `value${i}`);
        }
      },
      {
        name: 'List operations',
        operation: async (i: number) => {
          const listKey = `bench:list:${i % 20}`;
          await this.redis!.lpush(listKey, `item${i}`);
        }
      }
    ];

    const results = {};

    for (const opType of operationTypes) {
      if (opType.setup) {
        await opType.setup();
      }

      const iterations = 1000;
      const startTime = Bun.nanoseconds();

      for (let i = 0; i < iterations; i++) {
        await opType.operation(i);
      }

      const endTime = Bun.nanoseconds();
      const duration = (endTime - startTime) / 1e6;
      const opsPerSecond = iterations / (duration / 1000);

      results[opType.name] = {
        duration_ms: duration,
        ops_per_second: opsPerSecond,
        iterations: iterations
      };
    }

    return {
      name: 'Redis Operations',
      summary: `${results['SET operations'].ops_per_second.toFixed(0)} SET ops/sec`,
      details: results
    };
  }

  async benchmarkRedisPipeline(): Promise<any> {
    if (!this.redis) return null;

    const pipelineSizes = [10, 50, 100, 500];
    const results = {};

    for (const size of pipelineSizes) {
      const commands = [];
      for (let i = 0; i < size; i++) {
        commands.push({
          command: 'SET',
          args: [`bench:pipeline:key:${i}`, `value${i}`]
        });
      }

      const iterations = Math.max(1, Math.floor(1000 / size)); // Adjust iterations based on pipeline size
      const startTime = Bun.nanoseconds();

      for (let i = 0; i < iterations; i++) {
        await this.redis!.pipeline(commands.map(cmd => ({
          ...cmd,
          args: cmd.args.map(arg => typeof arg === 'string' ? `${arg}_${i}` : arg)
        })));
      }

      const endTime = Bun.nanoseconds();
      const duration = (endTime - startTime) / 1e6;
      const totalCommands = iterations * size;
      const commandsPerSecond = totalCommands / (duration / 1000);

      results[`pipeline_${size}`] = {
        duration_ms: duration,
        commands_per_second: commandsPerSecond,
        total_commands: totalCommands,
        pipeline_size: size,
        iterations: iterations
      };
    }

    return {
      name: 'Redis Pipelining',
      summary: `${results['pipeline_100'].commands_per_second.toFixed(0)} commands/sec (100 cmd pipeline)`,
      details: results
    };
  }

  // ===== CACHE BENCHMARKS =====

  async benchmarkCacheOperations(): Promise<any> {
    if (!this.hybrid?.cache) return null;

    const cache = this.hybrid.cache;
    const testData = generateCacheData(1000);

    // Setup: populate cache
    for (const item of testData) {
      await cache.set(item.key, item.value, { ttl: item.ttl });
    }

    const operations = [
      {
        name: 'Cache SET',
        operation: async (i: number) => {
          const item = testData[i % testData.length];
          await cache.set(`${item.key}_new_${i}`, item.value, { ttl: 300 });
        }
      },
      {
        name: 'Cache GET (hit)',
        operation: async (i: number) => {
          const item = testData[i % testData.length];
          await cache.get(item.key);
        }
      },
      {
        name: 'Cache GET (miss)',
        operation: async (i: number) => {
          await cache.get(`nonexistent:key:${i}`);
        }
      },
      {
        name: 'Cache EXISTS',
        operation: async (i: number) => {
          const item = testData[i % testData.length];
          await cache.exists(item.key);
        }
      }
    ];

    const results = {};

    for (const op of operations) {
      const iterations = 1000;
      const startTime = Bun.nanoseconds();

      for (let i = 0; i < iterations; i++) {
        await op.operation(i);
      }

      const endTime = Bun.nanoseconds();
      const duration = (endTime - startTime) / 1e6;
      const opsPerSecond = iterations / (duration / 1000);

      results[op.name] = {
        duration_ms: duration,
        ops_per_second: opsPerSecond,
        iterations: iterations
      };
    }

    return {
      name: 'Cache Operations',
      summary: `${results['Cache GET (hit)'].ops_per_second.toFixed(0)} cache hits/sec`,
      details: results
    };
  }

  // ===== HYBRID BENCHMARKS =====

  async benchmarkHybridOperations(): Promise<any> {
    if (!this.hybrid) return null;

    // Setup test data
    const testUsers = generateUserData(500);
    for (const user of testUsers) {
      await this.hybrid.insert('bench_users', {
        name: user.name,
        email: user.email,
        age: user.age,
        active: user.active,
        profile_data: user.profile_data
      });
    }

    const operations = [
      {
        name: 'Hybrid read-through cache',
        operation: async (i: number) => {
          const user = testUsers[i % testUsers.length];

          // First call - should hit database and populate cache
          let result = await this.hybrid.findOne('bench_users', { email: user.email });

          // Second call - should hit cache
          result = await this.hybrid.findOne('bench_users', { email: user.email });

          return result;
        }
      },
      {
        name: 'Hybrid write-through cache',
        operation: async (i: number) => {
          const userData = {
            name: `Hybrid User ${i}`,
            email: `hybrid${i}@example.com`,
            age: 20 + (i % 30),
            active: true,
            profile_data: { source: 'benchmark' }
          };

          // Insert to database (cache should be updated if configured)
          await this.hybrid.insert('bench_users', userData);

          // Cache the result
          if (this.hybrid.cache) {
            await this.hybrid.cache.set(`user:${userData.email}`, userData, { ttl: 300 });
          }
        }
      }
    ];

    const results = {};

    for (const op of operations) {
      const iterations = Math.min(200, testUsers.length);
      const startTime = Bun.nanoseconds();

      for (let i = 0; i < iterations; i++) {
        await op.operation(i);
      }

      const endTime = Bun.nanoseconds();
      const duration = (endTime - startTime) / 1e6;
      const opsPerSecond = iterations / (duration / 1000);

      results[op.name] = {
        duration_ms: duration,
        ops_per_second: opsPerSecond,
        iterations: iterations
      };
    }

    return {
      name: 'Hybrid Operations',
      summary: `${results['Hybrid read-through cache'].ops_per_second.toFixed(0)} hybrid reads/sec`,
      details: results
    };
  }

  // ===== CONCURRENCY BENCHMARKS =====

  async benchmarkConcurrentOperations(): Promise<any> {
    if (!this.postgres && !this.redis) return null;

    const concurrencyLevels = [5, 10, 25, 50];
    const results = {};

    for (const concurrency of concurrencyLevels) {
      const startTime = Bun.nanoseconds();

      const promises = [];
      for (let i = 0; i < concurrency; i++) {
        if (this.postgres) {
          promises.push(
            this.postgres.query('SELECT $1 as id, pg_sleep(0.01)', [i])
          );
        } else if (this.redis) {
          promises.push(
            this.redis.set(`concurrent:key:${i}`, `value${i}`)
          );
        }
      }

      await Promise.all(promises);

      const endTime = Bun.nanoseconds();
      const duration = (endTime - startTime) / 1e6;
      const opsPerSecond = concurrency / (duration / 1000);

      results[`concurrency_${concurrency}`] = {
        duration_ms: duration,
        ops_per_second: opsPerSecond,
        concurrent_operations: concurrency,
        avg_latency_ms: duration / concurrency
      };
    }

    return {
      name: 'Concurrent Operations',
      summary: `${results['concurrency_50'].ops_per_second.toFixed(0)} concurrent ops/sec`,
      details: results
    };
  }

  // ===== CONNECTION POOLING BENCHMARKS =====

  async benchmarkConnectionPooling(): Promise<any> {
    const results = {};

    if (this.postgres) {
      const pgStats = this.postgres.getStats();
      results.postgres = {
        total_connections: pgStats.totalConnections,
        active_connections: pgStats.activeConnections,
        idle_connections: pgStats.idleConnections,
        waiting_clients: pgStats.waitingClients
      };
    }

    if (this.redis) {
      const redisStats = this.redis.getStats();
      results.redis = {
        total_connections: redisStats.totalConnections,
        active_connections: redisStats.activeConnections,
        idle_connections: redisStats.idleConnections,
        waiting_clients: redisStats.waitingClients,
        total_commands: redisStats.totalCommands,
        failed_commands: redisStats.failedCommands
      };
    }

    // Test connection pool efficiency
    const poolTestStart = Bun.nanoseconds();

    const poolPromises = [];
    for (let i = 0; i < 100; i++) {
      if (this.postgres) {
        poolPromises.push(this.postgres.query('SELECT 1'));
      } else if (this.redis) {
        poolPromises.push(this.redis.ping());
      }
    }

    await Promise.all(poolPromises);

    const poolTestEnd = Bun.nanoseconds();
    const poolDuration = (poolTestEnd - poolTestStart) / 1e6;
    const poolOpsPerSecond = 100 / (poolDuration / 1000);

    results.pool_efficiency = {
      test_duration_ms: poolDuration,
      ops_per_second: poolOpsPerSecond,
      total_operations: 100
    };

    return {
      name: 'Connection Pooling',
      summary: `${poolOpsPerSecond.toFixed(0)} pooled ops/sec`,
      details: results
    };
  }

  // ===== UTILITY METHODS =====

  getResults(): any {
    return this.results;
  }

  generateReport(): string {
    let report = '# Database Performance Benchmarks Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const [benchmarkName, result] of Object.entries(this.results)) {
      report += `## ${benchmarkName}\n\n`;
      report += `**Summary:** ${result.summary}\n\n`;

      if (result.details) {
        report += '### Detailed Results\n\n';
        report += '```json\n';
        report += JSON.stringify(result.details, null, 2);
        report += '\n```\n\n';
      }
    }

    return report;
  }
}

// Export benchmark runner
export async function runDatabaseBenchmarks(): Promise<any> {
  const benchmarks = new DatabaseBenchmarks();

  try {
    await benchmarks.setup();
    const results = await benchmarks.runAllBenchmarks();

    console.log('\n📊 Benchmark Results Summary:');
    console.log('===============================');

    for (const [name, result] of Object.entries(results)) {
      console.log(`${name}: ${result.summary}`);
    }

    // Generate and save report
    const report = benchmarks.generateReport();
    await Bun.write('database-benchmark-report.md', report);

    console.log('\n📄 Detailed report saved to: database-benchmark-report.md');

    return results;
  } finally {
    await benchmarks.teardown();
  }
}

// CLI runner
if (import.meta.main) {
  runDatabaseBenchmarks()
    .then(() => {
      console.log('✅ Database benchmarks completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database benchmarks failed:', error);
      process.exit(1);
    });
}