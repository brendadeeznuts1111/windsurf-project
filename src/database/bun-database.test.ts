/**
 * @fileoverview Unified Database Abstraction Layer Tests
 * @description Comprehensive test suite for BunDatabase implementation
 * @version 1.0.0
 * @since 2025-01-01
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { BunDatabase, DatabaseType, DatabaseConfig } from '../bun-database';

// Test configurations
const postgresConfig: DatabaseConfig = {
  type: DatabaseType.POSTGRESQL,
  postgresql: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'test_db',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    maxConnections: 5,
    minConnections: 1,
    connectionTimeout: 5000,
    queryTimeout: 5000
  }
};

const redisConfig: DatabaseConfig = {
  type: DatabaseType.REDIS,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '2'), // Use database 2 for testing
    maxConnections: 5,
    minConnections: 1,
    connectionTimeout: 5000,
    commandTimeout: 5000,
    keyPrefix: 'test:'
  }
};

const hybridConfig: DatabaseConfig = {
  type: DatabaseType.POSTGRESQL, // Primary database
  postgresql: postgresConfig.postgresql,
  cache: {
    enabled: true,
    redis: redisConfig.redis,
    defaultTtl: 300
  }
};

describe('EX031: Unified Database Abstraction Layer', () => {
  describe('PostgreSQL Database Operations', () => {
    let db: BunDatabase;

    beforeAll(async () => {
      try {
        db = new BunDatabase(postgresConfig);
        await db.connect();
      } catch (error) {
        console.warn('PostgreSQL not available, skipping tests:', error);
        return;
      }
    });

    afterAll(async () => {
      if (db) {
        await db.disconnect();
      }
    });

    beforeEach(async () => {
      if (!db) return;

      // Create test table
      await db.query(`
        CREATE TABLE IF NOT EXISTS test_users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          age INTEGER,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Clean up
      await db.query('DELETE FROM test_users');
    });

    describe('Connection Management', () => {
      it('should connect and disconnect successfully', async () => {
        const isHealthy = await db.healthCheck();
        expect(isHealthy).toBe(true);

        const stats = db.getStats();
        expect(stats.connected).toBe(true);
        expect(stats.postgresql).toBeDefined();
      });
    });

    describe('Query Operations', () => {
      it('should execute raw queries', async () => {
        const result = await db.query('SELECT 1 as test_value');
        expect(result.rows[0].test_value).toBe(1);
      });

      it('should find records with query builder', async () => {
        // Insert test data
        await db.insert('test_users', [
          { name: 'Alice', email: 'alice@example.com', age: 25 },
          { name: 'Bob', email: 'bob@example.com', age: 30 },
          { name: 'Charlie', email: 'charlie@example.com', age: 35 }
        ]);

        // Find all users
        const allUsers = await db.find('test_users');
        expect(allUsers).toHaveLength(3);

        // Find users with age > 28
        const olderUsers = await db.find('test_users', {
          where: [{ column: 'age', operator: '>', value: 28 }]
        });
        expect(olderUsers).toHaveLength(2);

        // Find with ordering and limit
        const limitedUsers = await db.find('test_users', {
          orderBy: [{ column: 'age', direction: 'DESC' }],
          limit: 2
        });
        expect(limitedUsers).toHaveLength(2);
        expect(limitedUsers[0].age).toBe(35);
        expect(limitedUsers[1].age).toBe(30);
      });

      it('should find single record', async () => {
        await db.insert('test_users', { name: 'Dave', email: 'dave@example.com', age: 40 });

        const user = await db.findOne('test_users', { email: 'dave@example.com' });
        expect(user).toBeDefined();
        expect(user.name).toBe('Dave');
        expect(user.age).toBe(40);

        const notFound = await db.findOne('test_users', { email: 'nonexistent@example.com' });
        expect(notFound).toBe(null);
      });

      it('should insert records', async () => {
        const insertData = { name: 'Eve', email: 'eve@example.com', age: 28 };

        const result = await db.insert('test_users', insertData);
        expect(result.rows[0]).toHaveProperty('id');
        expect(result.rows[0].name).toBe('Eve');

        // Insert multiple records
        const multipleData = [
          { name: 'Frank', email: 'frank@example.com', age: 32 },
          { name: 'Grace', email: 'grace@example.com', age: 29 }
        ];

        await db.insert('test_users', multipleData);

        const count = await db.count('test_users');
        expect(count).toBe(3);
      });

      it('should update records', async () => {
        // Insert test data
        await db.insert('test_users', { name: 'Henry', email: 'henry@example.com', age: 45 });

        // Update age
        const updateCount = await db.update(
          'test_users',
          { age: 46, active: false },
          { email: 'henry@example.com' }
        );

        expect(updateCount).toBe(1);

        // Verify update
        const updatedUser = await db.findOne('test_users', { email: 'henry@example.com' });
        expect(updatedUser.age).toBe(46);
        expect(updatedUser.active).toBe(false);
      });

      it('should delete records', async () => {
        // Insert test data
        await db.insert('test_users', [
          { name: 'Ivy', email: 'ivy@example.com', age: 22 },
          { name: 'Jack', email: 'jack@example.com', age: 27 }
        ]);

        // Delete one record
        const deleteCount = await db.delete('test_users', { email: 'ivy@example.com' });
        expect(deleteCount).toBe(1);

        // Verify deletion
        const remainingCount = await db.count('test_users');
        expect(remainingCount).toBe(1);

        const remainingUser = await db.findOne('test_users', { email: 'jack@example.com' });
        expect(remainingUser).toBeDefined();
      });

      it('should count records', async () => {
        await db.insert('test_users', [
          { name: 'Kate', email: 'kate@example.com', age: 31 },
          { name: 'Liam', email: 'liam@example.com', age: 33 },
          { name: 'Mia', email: 'mia@example.com', age: 26 }
        ]);

        const totalCount = await db.count('test_users');
        expect(totalCount).toBe(3);

        const adultCount = await db.count('test_users', { age: { $gte: 30 } });
        expect(adultCount).toBe(2);
      });
    });

    describe('Transaction Support', () => {
      it('should execute transactions successfully', async () => {
        await db.transaction(async (client) => {
          // Insert users in transaction
          await client.insert('test_users', { name: 'Nina', email: 'nina@example.com', age: 24 });
          await client.insert('test_users', { name: 'Oscar', email: 'oscar@example.com', age: 38 });

          // Verify within transaction
          const count = await client.count('test_users');
          expect(count).toBe(2);
        });

        // Verify after commit
        const finalCount = await db.count('test_users');
        expect(finalCount).toBe(2);
      });

      it('should rollback transactions on error', async () => {
        try {
          await db.transaction(async (client) => {
            await client.insert('test_users', { name: 'Paul', email: 'paul@example.com', age: 29 });
            // This will fail due to duplicate email
            await client.insert('test_users', { name: 'Quinn', email: 'paul@example.com', age: 31 });
          });
        } catch (error) {
          // Expected error
        }

        // Verify rollback - no users should be inserted
        const count = await db.count('test_users');
        expect(count).toBe(0);
      });
    });
  });

  describe('Redis Database Operations', () => {
    let db: BunDatabase;

    beforeAll(async () => {
      try {
        db = new BunDatabase(redisConfig);
        await db.connect();
      } catch (error) {
        console.warn('Redis not available, skipping tests:', error);
        return;
      }
    });

    afterAll(async () => {
      if (db) {
        await db.disconnect();
      }
    });

    beforeEach(async () => {
      if (!db) return;

      // Clean up test keys
      try {
        const keys = await db.query('KEYS test:*');
        if (keys.length > 0) {
          await db.query('DEL', keys);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    describe('Cache Operations', () => {
      it('should set and get cache values', async () => {
        const cache = db.cache;
        expect(cache).toBeDefined();

        const key = 'cache:test:key';
        const value = { message: 'Hello Cache', timestamp: Date.now() };

        await cache!.set(key, value, { ttl: 60 });

        const retrieved = await cache!.get(key);
        expect(retrieved).toEqual(value);
      });

      it('should handle cache expiration', async () => {
        const cache = db.cache;
        expect(cache).toBeDefined();

        const key = 'cache:expire:key';
        const value = 'temporary value';

        await cache!.set(key, value, { ttl: 1 }); // 1 second

        // Should exist immediately
        const existsBefore = await cache!.exists(key);
        expect(existsBefore).toBe(true);

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Should be gone
        const existsAfter = await cache!.exists(key);
        expect(existsAfter).toBe(false);

        const retrieved = await cache!.get(key);
        expect(retrieved).toBe(null);
      });

      it('should delete cache entries', async () => {
        const cache = db.cache;
        expect(cache).toBeDefined();

        const key = 'cache:delete:key';
        await cache!.set(key, 'value to delete');

        const existsBefore = await cache!.exists(key);
        expect(existsBefore).toBe(true);

        const deleted = await cache!.del(key);
        expect(deleted).toBe(true);

        const existsAfter = await cache!.exists(key);
        expect(existsAfter).toBe(false);
      });

      it('should clear all cache entries', async () => {
        const cache = db.cache;
        expect(cache).toBeDefined();

        // Set multiple cache entries
        await cache!.set('cache:clear:key1', 'value1');
        await cache!.set('cache:clear:key2', 'value2');
        await cache!.set('cache:clear:key3', 'value3');

        // Clear cache
        await cache!.clear();

        // Verify all are gone
        const exists1 = await cache!.exists('cache:clear:key1');
        const exists2 = await cache!.exists('cache:clear:key2');
        const exists3 = await cache!.exists('cache:clear:key3');

        expect(exists1).toBe(false);
        expect(exists2).toBe(false);
        expect(exists3).toBe(false);
      });
    });

    describe('Pub/Sub Operations', () => {
      it('should publish and subscribe to messages', async () => {
        const pubsub = db.pubsub;
        expect(pubsub).toBeDefined();

        const channel = 'test:pubsub:channel';
        const receivedMessages: any[] = [];

        // Subscribe to channel
        pubsub!.subscribe(channel, (message) => {
          receivedMessages.push(message);
        });

        // Wait for subscription to be established
        await new Promise(resolve => setTimeout(resolve, 100));

        // Publish messages
        const subscriberCount1 = await pubsub!.publish(channel, { type: 'test', data: 'message1' });
        const subscriberCount2 = await pubsub!.publish(channel, 'simple string message');

        // Wait for messages to be received
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify messages were received
        expect(receivedMessages).toHaveLength(2);
        expect(receivedMessages[0]).toEqual({ type: 'test', data: 'message1' });
        expect(receivedMessages[1]).toBe('simple string message');

        // Verify subscriber counts
        expect(subscriberCount1).toBeGreaterThan(0);
        expect(subscriberCount2).toBeGreaterThan(0);
      });

      it('should handle multiple subscribers', async () => {
        const pubsub = db.pubsub;
        expect(pubsub).toBeDefined();

        const channel = 'test:multi:channel';
        const receivedBySub1: any[] = [];
        const receivedBySub2: any[] = [];

        // Subscribe with two different callbacks
        pubsub!.subscribe(channel, (message) => receivedBySub1.push(message));
        pubsub!.subscribe(channel, (message) => receivedBySub2.push(message));

        // Wait for subscriptions
        await new Promise(resolve => setTimeout(resolve, 100));

        // Publish message
        await pubsub!.publish(channel, 'broadcast message');

        // Wait for messages
        await new Promise(resolve => setTimeout(resolve, 100));

        // Both subscribers should receive the message
        expect(receivedBySub1).toHaveLength(1);
        expect(receivedBySub2).toHaveLength(1);
        expect(receivedBySub1[0]).toBe('broadcast message');
        expect(receivedBySub2[0]).toBe('broadcast message');
      });

      it('should unsubscribe from channels', async () => {
        const pubsub = db.pubsub;
        expect(pubsub).toBeDefined();

        const channel = 'test:unsubscribe:channel';
        let messageCount = 0;

        const callback = (message: any) => {
          messageCount++;
        };

        // Subscribe
        pubsub!.subscribe(channel, callback);

        // Wait for subscription
        await new Promise(resolve => setTimeout(resolve, 100));

        // Publish first message
        await pubsub!.publish(channel, 'message1');
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(messageCount).toBe(1);

        // Unsubscribe
        pubsub!.unsubscribe(channel, callback);

        // Wait for unsubscription
        await new Promise(resolve => setTimeout(resolve, 100));

        // Publish second message (should not be received)
        await pubsub!.publish(channel, 'message2');
        await new Promise(resolve => setTimeout(resolve, 100));

        // Should still have only 1 message
        expect(messageCount).toBe(1);
      });
    });
  });

  describe('Hybrid Database Operations (PostgreSQL + Redis Cache)', () => {
    let db: BunDatabase;

    beforeAll(async () => {
      try {
        db = new BunDatabase(hybridConfig);
        await db.connect();
      } catch (error) {
        console.warn('PostgreSQL or Redis not available, skipping hybrid tests:', error);
        return;
      }
    });

    afterAll(async () => {
      if (db) {
        await db.disconnect();
      }
    });

    beforeEach(async () => {
      if (!db) return;

      // Create test table
      await db.query(`
        CREATE TABLE IF NOT EXISTS test_cache_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE,
          profile_data JSONB,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Clean up
      await db.query('DELETE FROM test_cache_users');

      // Clear cache
      if (db.cache) {
        await db.cache.clear();
      }
    });

    it('should integrate database operations with caching', async () => {
      const cache = db.cache;
      expect(cache).toBeDefined();

      // Insert user data
      const userData = {
        username: 'cacheuser',
        email: 'cache@example.com',
        profile_data: { theme: 'dark', language: 'en' },
        last_login: new Date()
      };

      await db.insert('test_cache_users', userData);

      // Cache user data
      await cache!.set(`user:${userData.username}`, userData, { ttl: 300 });

      // Retrieve from cache
      const cachedUser = await cache!.get(`user:${userData.username}`);
      expect(cachedUser).toEqual(userData);

      // Verify database still has the data
      const dbUser = await db.findOne('test_cache_users', { username: 'cacheuser' });
      expect(dbUser.username).toBe(userData.username);
      expect(dbUser.email).toBe(userData.email);
    });

    it('should handle cache misses gracefully', async () => {
      const cache = db.cache;
      expect(cache).toBeDefined();

      // Try to get non-existent cache entry
      const missing = await cache!.get('nonexistent:key');
      expect(missing).toBe(null);

      // Verify existence check
      const exists = await cache!.exists('nonexistent:key');
      expect(exists).toBe(false);
    });

    it('should support pub/sub alongside database operations', async () => {
      const pubsub = db.pubsub;
      expect(pubsub).toBeDefined();

      const channel = 'test:db:notifications';
      const notifications: any[] = [];

      // Subscribe to notifications
      pubsub!.subscribe(channel, (message) => {
        notifications.push(message);
      });

      // Wait for subscription
      await new Promise(resolve => setTimeout(resolve, 100));

      // Perform database operation
      await db.insert('test_cache_users', {
        username: 'notifyuser',
        email: 'notify@example.com'
      });

      // Publish notification about the operation
      await pubsub!.publish(channel, {
        type: 'user_created',
        username: 'notifyuser',
        timestamp: new Date().toISOString()
      });

      // Wait for notification
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify notification was received
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('user_created');
      expect(notifications[0].username).toBe('notifyuser');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid database configurations', async () => {
      const invalidConfig: DatabaseConfig = {
        type: DatabaseType.POSTGRESQL,
        postgresql: {
          host: 'invalid.host',
          port: 5432,
          database: 'invalid_db',
          user: 'invalid_user',
          password: 'invalid_password',
          connectionTimeout: 1000 // Short timeout
        }
      };

      const invalidDb = new BunDatabase(invalidConfig);

      try {
        await invalidDb.connect();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle SQL injection attempts safely', async () => {
      const db = new BunDatabase(postgresConfig);

      try {
        await db.connect();

        // Attempt SQL injection
        const maliciousInput = "'; DROP TABLE test_users; --";
        const result = await db.query('SELECT $1 as input', [maliciousInput]);

        expect(result.rows[0].input).toBe(maliciousInput);

        // Verify table still exists
        const tableCheck = await db.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'test_users'
          ) as table_exists
        `);

        expect(tableCheck.rows[0].table_exists).toBe(true);
      } finally {
        await db.disconnect();
      }
    });

    it('should handle concurrent operations safely', async () => {
      const db = new BunDatabase(postgresConfig);

      try {
        await db.connect();

        const concurrentOperations = 10;
        const promises = [];

        for (let i = 0; i < concurrentOperations; i++) {
          promises.push(
            db.insert('test_users', {
              name: `Concurrent User ${i}`,
              email: `concurrent${i}@example.com`,
              age: 20 + i
            })
          );
        }

        await Promise.all(promises);

        // Verify all operations completed
        const count = await db.count('test_users');
        expect(count).toBe(concurrentOperations);
      } finally {
        await db.disconnect();
      }
    });
  });

  describe('Performance Characteristics', () => {
    it('should maintain good performance under load', async () => {
      const db = new BunDatabase(postgresConfig);

      try {
        await db.connect();

        const operationCount = 50;
        const startTime = Date.now();

        const promises = [];
        for (let i = 0; i < operationCount; i++) {
          promises.push(
            db.insert('test_users', {
              name: `Perf User ${i}`,
              email: `perf${i}@example.com`,
              age: i
            })
          );
        }

        await Promise.all(promises);
        const endTime = Date.now();

        const totalTime = endTime - startTime;
        const opsPerSecond = (operationCount / totalTime) * 1000;

        console.log(`Database throughput: ${opsPerSecond.toFixed(2)} operations/second`);
        expect(opsPerSecond).toBeGreaterThan(5); // At least 5 ops per second
      } finally {
        await db.disconnect();
      }
    });

    it('should handle cache performance optimizations', async () => {
      const db = new BunDatabase(hybridConfig);

      try {
        await db.connect();

        const cache = db.cache;
        if (!cache) return; // Skip if cache not available

        const cacheOperations = 100;
        const startTime = Date.now();

        const promises = [];
        for (let i = 0; i < cacheOperations; i++) {
          promises.push(
            cache.set(`perf:cache:key${i}`, { data: `value${i}`, index: i })
          );
        }

        await Promise.all(promises);
        const endTime = Date.now();

        const totalTime = endTime - startTime;
        const cacheOpsPerSecond = (cacheOperations / totalTime) * 1000;

        console.log(`Cache throughput: ${cacheOpsPerSecond.toFixed(2)} operations/second`);
        expect(cacheOpsPerSecond).toBeGreaterThan(20); // At least 20 cache ops per second
      } finally {
        await db.disconnect();
      }
    });
  });
});