/**
 * @fileoverview Database Ecosystem Validation Test
 * @description Quick validation test for the fixed database implementations
 */

import { BunPostgres } from './bun-postgres';
import { BunRedis } from './bun-redis';
import { BunDatabase, DatabaseType } from './bun-database';

// Test configurations (will fail gracefully if services not available)
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'test_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  maxConnections: 2,
  minConnections: 1,
  connectionTimeout: 2000, // Short timeout for testing
  queryTimeout: 2000
};

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '1'),
  maxConnections: 2,
  minConnections: 1,
  connectionTimeout: 2000,
  commandTimeout: 2000
};

async function testPostgresBasic() {
  console.log('🧪 Testing PostgreSQL Basic Connection...');

  try {
    const pg = new BunPostgres(pgConfig);
    const isHealthy = await pg.healthCheck();

    if (isHealthy) {
      console.log('✅ PostgreSQL connection successful');

      // Test basic query
      const result = await pg.query('SELECT 1 as test');
      console.log('✅ PostgreSQL query successful:', result.rows[0]);

      await pg.close();
      return true;
    } else {
      console.log('❌ PostgreSQL health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ PostgreSQL test failed:', error.message);
    return false;
  }
}

async function testRedisBasic() {
  console.log('🧪 Testing Redis Basic Connection...');

  try {
    const redis = new BunRedis(redisConfig);
    const isHealthy = await redis.healthCheck();

    if (isHealthy) {
      console.log('✅ Redis connection successful');

      // Test basic operations
      await redis.set('test:key', 'test_value');
      const value = await redis.get('test:key');
      console.log('✅ Redis operations successful:', value);

      await redis.close();
      return true;
    } else {
      console.log('❌ Redis health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Redis test failed:', error.message);
    return false;
  }
}

async function testUnifiedDatabase() {
  console.log('🧪 Testing Unified Database Layer...');

  try {
    const db = new BunDatabase({
      type: DatabaseType.POSTGRESQL,
      postgresql: pgConfig
    });

    await db.connect();
    console.log('✅ Unified database connection successful');

    const isHealthy = await db.healthCheck();
    if (isHealthy) {
      console.log('✅ Unified database health check passed');
      await db.disconnect();
      return true;
    } else {
      console.log('❌ Unified database health check failed');
      await db.disconnect();
      return false;
    }
  } catch (error) {
    console.log('❌ Unified database test failed:', error.message);
    return false;
  }
}

async function runValidationTests() {
  console.log('🔬 Database Ecosystem Validation Tests\n');
  console.log('=====================================\n');

  const results = {
    postgres: await testPostgresBasic(),
    redis: await testRedisBasic(),
    unified: await testUnifiedDatabase()
  };

  console.log('\n📊 Validation Results:');
  console.log('======================');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All database implementations are working correctly!');
  } else {
    console.log('⚠️ Some implementations need attention. Check service availability.');
  }

  return results;
}

// Run tests if called directly
if (import.meta.main) {
  runValidationTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

export { runValidationTests };