/**
 * @fileoverview Redis Client Tests
 * @description Comprehensive test suite for BunRedis implementation
 * @version 1.0.0
 * @since 2025-01-01
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { BunRedis, RedisConfig } from '../bun-redis';

// Test configuration - assumes Redis is running locally
const testConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '1'), // Use database 1 for testing
  maxConnections: 5,
  minConnections: 1,
  connectionTimeout: 5000,
  commandTimeout: 5000,
  keyPrefix: 'test:'
};

describe('EX030: Advanced Redis Client with Connection Pooling', () => {
  let redis: BunRedis;

  beforeAll(async () => {
    // Skip tests if Redis is not available
    try {
      redis = new BunRedis(testConfig);
      await redis.healthCheck();
    } catch (error) {
      console.warn('Redis not available, skipping tests:', error);
      return;
    }
  });

  afterAll(async () => {
    if (redis) {
      await redis.close();
    }
  });

  beforeEach(async () => {
    // Clean up test keys
    try {
      const keys = await redis.keys('test:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Connection Management', () => {
    it('should establish connection pool successfully', async () => {
      const stats = redis.getStats();
      expect(stats.totalConnections).toBeGreaterThan(0);
      expect(stats.idleConnections).toBeGreaterThan(0);
    });

    it('should perform health check', async () => {
      const isHealthy = await redis.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should handle connection pool statistics', () => {
      const stats = redis.getStats();
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('idleConnections');
      expect(stats).toHaveProperty('waitingClients');
      expect(stats).toHaveProperty('totalCommands');
      expect(stats).toHaveProperty('failedCommands');
    });
  });

  describe('Basic Operations', () => {
    it('should respond to PING', async () => {
      const result = await redis.ping();
      expect(result).toBe('PONG');
    });

    it('should handle QUIT command', async () => {
      const result = await redis.quit();
      expect(result).toBe('OK');
    });
  });

  describe('String Operations', () => {
    it('should set and get string values', async () => {
      const key = 'string:key';
      const value = 'Hello World';

      const setResult = await redis.set(key, value);
      expect(setResult).toBe('OK');

      const getResult = await redis.get(key);
      expect(getResult).toBe(value);
    });

    it('should handle SET with options', async () => {
      const key = 'string:options';
      const value = 'temporary value';

      // Set with expiration
      await redis.set(key, value, { ex: 2 }); // 2 seconds

      // Should exist immediately
      const existsBefore = await redis.exists(key);
      expect(existsBefore).toBe(1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Should be gone
      const existsAfter = await redis.exists(key);
      expect(existsAfter).toBe(0);
    });

    it('should handle INCR and DECR operations', async () => {
      const key = 'counter';

      const incr1 = await redis.incr(key);
      expect(incr1).toBe(1);

      const incr2 = await redis.incr(key);
      expect(incr2).toBe(2);

      const decr1 = await redis.decr(key);
      expect(decr1).toBe(1);

      const decr2 = await redis.decr(key);
      expect(decr2).toBe(0);
    });

    it('should handle EXISTS and DEL operations', async () => {
      const key1 = 'exists:key1';
      const key2 = 'exists:key2';

      // Initially should not exist
      const existsBefore = await redis.exists(key1, key2);
      expect(existsBefore).toBe(0);

      // Set values
      await redis.set(key1, 'value1');
      await redis.set(key2, 'value2');

      // Should exist now
      const existsAfter = await redis.exists(key1, key2);
      expect(existsAfter).toBe(2);

      // Delete one key
      const delResult = await redis.del(key1);
      expect(delResult).toBe(1);

      // Only one should remain
      const existsFinal = await redis.exists(key1, key2);
      expect(existsFinal).toBe(1);
    });

    it('should handle TTL operations', async () => {
      const key = 'ttl:key';

      await redis.set(key, 'value');
      await redis.expire(key, 10); // 10 seconds

      const ttl = await redis.ttl(key);
      expect(ttl).toBeGreaterThan(5); // Should be close to 10
      expect(ttl).toBeLessThanOrEqual(10);
    });
  });

  describe('Hash Operations', () => {
    const hashKey = 'hash:test';

    beforeEach(async () => {
      await redis.hdel(hashKey, 'field1', 'field2', 'field3');
    });

    it('should handle HSET and HGET operations', async () => {
      const field = 'field1';
      const value = 'hash value 1';

      const setResult = await redis.hset(hashKey, field, value);
      expect(setResult).toBe(1); // Number of fields added

      const getResult = await redis.hget(hashKey, field);
      expect(getResult).toBe(value);
    });

    it('should handle HLEN operation', async () => {
      // Initially empty
      const lenBefore = await redis.hlen(hashKey);
      expect(lenBefore).toBe(0);

      // Add fields
      await redis.hset(hashKey, 'f1', 'v1');
      await redis.hset(hashKey, 'f2', 'v2');
      await redis.hset(hashKey, 'f3', 'v3');

      const lenAfter = await redis.hlen(hashKey);
      expect(lenAfter).toBe(3);
    });

    it('should handle HKEYS and HVALS operations', async () => {
      const testData = {
        name: 'John Doe',
        age: '30',
        city: 'New York'
      };

      // Set hash fields
      for (const [field, value] of Object.entries(testData)) {
        await redis.hset(hashKey, field, value);
      }

      const keys = await redis.hkeys(hashKey);
      const values = await redis.hvals(hashKey);

      expect(keys.sort()).toEqual(Object.keys(testData).sort());
      expect(values.sort()).toEqual(Object.values(testData).sort());
    });

    it('should handle HGETALL operation', async () => {
      const testData = {
        title: 'Test Hash',
        version: '1.0',
        active: 'true'
      };

      // Set hash fields
      for (const [field, value] of Object.entries(testData)) {
        await redis.hset(hashKey, field, value);
      }

      const result = await redis.hgetall(hashKey);

      expect(result).toEqual(testData);
    });

    it('should handle HDEL operation', async () => {
      // Set up test data
      await redis.hset(hashKey, 'keep', 'value1');
      await redis.hset(hashKey, 'delete1', 'value2');
      await redis.hset(hashKey, 'delete2', 'value3');

      // Delete two fields
      const delResult = await redis.hdel(hashKey, 'delete1', 'delete2');
      expect(delResult).toBe(2);

      // Verify remaining field
      const remaining = await redis.hget(hashKey, 'keep');
      expect(remaining).toBe('value1');

      // Verify deleted fields are gone
      const deleted1 = await redis.hget(hashKey, 'delete1');
      const deleted2 = await redis.hget(hashKey, 'delete2');
      expect(deleted1).toBe(null);
      expect(deleted2).toBe(null);
    });
  });

  describe('List Operations', () => {
    const listKey = 'list:test';

    beforeEach(async () => {
      await redis.del(listKey);
    });

    it('should handle LPUSH and RPUSH operations', async () => {
      // Push to left
      const lpushResult = await redis.lpush(listKey, 'left1', 'left2');
      expect(lpushResult).toBe(2);

      // Push to right
      const rpushResult = await redis.rpush(listKey, 'right1', 'right2');
      expect(rpushResult).toBe(4);
    });

    it('should handle LPOP and RPOP operations', async () => {
      // Set up list: [left2, left1, right1, right2]
      await redis.lpush(listKey, 'left1', 'left2');
      await redis.rpush(listKey, 'right1', 'right2');

      // Pop from left
      const lpopResult = await redis.lpop(listKey);
      expect(lpopResult).toBe('left2');

      // Pop from right
      const rpopResult = await redis.rpop(listKey);
      expect(rpopResult).toBe('right2');

      // Check remaining length
      const len = await redis.llen(listKey);
      expect(len).toBe(2);
    });

    it('should handle LLEN operation', async () => {
      // Initially empty
      const lenBefore = await redis.llen(listKey);
      expect(lenBefore).toBe(0);

      // Add elements
      await redis.rpush(listKey, 'item1', 'item2', 'item3');

      const lenAfter = await redis.llen(listKey);
      expect(lenAfter).toBe(3);
    });

    it('should handle LRANGE operation', async () => {
      // Set up list
      await redis.rpush(listKey, 'one', 'two', 'three', 'four', 'five');

      // Get all elements
      const all = await redis.lrange(listKey, 0, -1);
      expect(all).toEqual(['one', 'two', 'three', 'four', 'five']);

      // Get first 3 elements
      const first3 = await redis.lrange(listKey, 0, 2);
      expect(first3).toEqual(['one', 'two', 'three']);

      // Get last 2 elements
      const last2 = await redis.lrange(listKey, -2, -1);
      expect(last2).toEqual(['four', 'five']);

      // Get middle elements
      const middle = await redis.lrange(listKey, 1, 3);
      expect(middle).toEqual(['two', 'three', 'four']);
    });
  });

  describe('Set Operations', () => {
    const setKey = 'set:test';

    beforeEach(async () => {
      await redis.del(setKey);
    });

    it('should handle SADD operation', async () => {
      const addResult1 = await redis.sadd(setKey, 'member1', 'member2');
      expect(addResult1).toBe(2);

      const addResult2 = await redis.sadd(setKey, 'member2', 'member3'); // member2 already exists
      expect(addResult2).toBe(1);
    });

    it('should handle SISMEMBER operation', async () => {
      await redis.sadd(setKey, 'member1', 'member2', 'member3');

      const isMember1 = await redis.sismember(setKey, 'member1');
      const isMember2 = await redis.sismember(setKey, 'member2');
      const isMember4 = await redis.sismember(setKey, 'member4');

      expect(isMember1).toBe(1);
      expect(isMember2).toBe(1);
      expect(isMember4).toBe(0);
    });

    it('should handle SCARD operation', async () => {
      // Initially empty
      const cardBefore = await redis.scard(setKey);
      expect(cardBefore).toBe(0);

      // Add members
      await redis.sadd(setKey, 'a', 'b', 'c', 'd');

      const cardAfter = await redis.scard(setKey);
      expect(cardAfter).toBe(4);
    });

    it('should handle SMEMBERS operation', async () => {
      const members = ['alice', 'bob', 'charlie', 'diana'];

      await redis.sadd(setKey, ...members);

      const retrievedMembers = await redis.smembers(setKey);

      expect(retrievedMembers.sort()).toEqual(members.sort());
    });

    it('should handle SREM operation', async () => {
      // Set up set
      await redis.sadd(setKey, 'keep1', 'remove1', 'remove2', 'keep2');

      // Remove two members
      const remResult = await redis.srem(setKey, 'remove1', 'remove2');
      expect(remResult).toBe(2);

      // Check remaining members
      const remaining = await redis.smembers(setKey);
      expect(remaining.sort()).toEqual(['keep1', 'keep2'].sort());

      // Check cardinality
      const card = await redis.scard(setKey);
      expect(card).toBe(2);
    });
  });

  describe('Pub/Sub Operations', () => {
    const channel1 = 'test:channel1';
    const channel2 = 'test:channel2';

    it('should handle PUBLISH and SUBSCRIBE operations', async () => {
      const receivedMessages: any[] = [];

      // Subscribe to channels
      redis.subscribe(channel1, (message) => {
        receivedMessages.push({ channel: channel1, message });
      });

      redis.subscribe(channel2, (message) => {
        receivedMessages.push({ channel: channel2, message });
      });

      // Wait for subscriptions to be established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Publish messages
      const pubResult1 = await redis.publish(channel1, { type: 'test', data: 'message1' });
      const pubResult2 = await redis.publish(channel2, 'simple string message');

      // Wait for messages to be received
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify messages were received
      expect(receivedMessages).toHaveLength(2);
      expect(receivedMessages.find(m => m.channel === channel1)?.message).toEqual({
        type: 'test',
        data: 'message1'
      });
      expect(receivedMessages.find(m => m.channel === channel2)?.message).toBe('simple string message');

      // Verify subscriber counts
      expect(pubResult1).toBeGreaterThan(0); // At least 1 subscriber
      expect(pubResult2).toBeGreaterThan(0);
    });

    it('should handle UNSUBSCRIBE operation', async () => {
      const receivedMessages: any[] = [];
      let messageCount = 0;

      const callback = (message: any) => {
        messageCount++;
        receivedMessages.push(message);
      };

      // Subscribe
      redis.subscribe(channel1, callback);

      // Wait for subscription
      await new Promise(resolve => setTimeout(resolve, 100));

      // Publish first message
      await redis.publish(channel1, 'message1');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(messageCount).toBe(1);

      // Unsubscribe
      redis.unsubscribe(channel1, callback);

      // Wait for unsubscription
      await new Promise(resolve => setTimeout(resolve, 100));

      // Publish second message (should not be received)
      await redis.publish(channel1, 'message2');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still have only 1 message
      expect(messageCount).toBe(1);
    });
  });

  describe('Pipeline Operations', () => {
    it('should execute commands in pipeline', async () => {
      const pipelineCommands = [
        { command: 'SET', args: ['pipeline:key1', 'value1'] },
        { command: 'SET', args: ['pipeline:key2', 'value2'] },
        { command: 'GET', args: ['pipeline:key1'] },
        { command: 'GET', args: ['pipeline:key2'] },
        { command: 'DEL', args: ['pipeline:key1', 'pipeline:key2'] }
      ];

      const results = await redis.pipeline(pipelineCommands);

      expect(results).toHaveLength(5);
      expect(results[0]).toBe('OK'); // SET key1
      expect(results[1]).toBe('OK'); // SET key2
      expect(results[2]).toBe('value1'); // GET key1
      expect(results[3]).toBe('value2'); // GET key2
      expect(results[4]).toBe(2); // DEL count
    });
  });

  describe('Connection Pool Behavior', () => {
    it('should handle multiple concurrent operations', async () => {
      const promises = [];

      // Execute 20 concurrent operations
      for (let i = 0; i < 20; i++) {
        promises.push(redis.set(`concurrent:key${i}`, `value${i}`));
      }

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result).toBe('OK');
      });

      // Verify all keys were set
      for (let i = 0; i < 20; i++) {
        const value = await redis.get(`concurrent:key${i}`);
        expect(value).toBe(`value${i}`);
      }
    });

    it('should reuse connections from pool', async () => {
      const initialStats = redis.getStats();

      // Execute several operations
      for (let i = 0; i < 10; i++) {
        await redis.set(`reuse:key${i}`, `value${i}`);
        await redis.get(`reuse:key${i}`);
      }

      const finalStats = redis.getStats();

      // Connections should be reused
      expect(finalStats.totalConnections).toBe(initialStats.totalConnections);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      try {
        // This will fail at RESP protocol level
        await (redis as any).executeCommand('INVALID_COMMAND', ['arg1']);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle connection timeouts', async () => {
      // Create client with very short timeout
      const timeoutConfig: RedisConfig = {
        ...testConfig,
        commandTimeout: 1 // 1ms timeout
      };

      const timeoutClient = new BunRedis(timeoutConfig);

      try {
        // This should timeout (simulate slow operation)
        await timeoutClient.set('timeout:key', 'x'.repeat(1000000)); // Large value
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      } finally {
        await timeoutClient.close();
      }
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle high-throughput operations', async () => {
      const startTime = Date.now();
      const operationCount = 200;

      const promises = [];
      for (let i = 0; i < operationCount; i++) {
        promises.push(redis.set(`perf:key${i}`, `value${i}`));
      }

      await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const ops = (operationCount / totalTime) * 1000;

      console.log(`Redis throughput: ${ops.toFixed(2)} operations/second`);
      expect(ops).toBeGreaterThan(50); // At least 50 ops per second
    });

    it('should maintain connection pool efficiency', () => {
      const stats = redis.getStats();

      // Pool should not have excessive waiting clients
      expect(stats.waitingClients).toBeLessThan(stats.totalConnections);
    });
  });
});