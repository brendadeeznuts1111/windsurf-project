/**
 * @fileoverview PostgreSQL Client Tests
 * @description Comprehensive test suite for BunPostgres implementation
 * @version 1.0.0
 * @since 2025-01-01
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { BunPostgres, PostgresConfig } from '../bun-postgres';

// Test configuration - assumes PostgreSQL is running locally
const testConfig: PostgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'test_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  maxConnections: 5,
  minConnections: 1,
  connectionTimeout: 5000,
  queryTimeout: 5000
};

describe('EX029: Advanced PostgreSQL Client with Connection Pooling', () => {
  let postgres: BunPostgres;

  beforeAll(async () => {
    // Skip tests if PostgreSQL is not available
    try {
      postgres = new BunPostgres(testConfig);
      await postgres.healthCheck();
    } catch (error) {
      console.warn('PostgreSQL not available, skipping tests:', error);
      return;
    }
  });

  afterAll(async () => {
    if (postgres) {
      await postgres.close();
    }
  });

  describe('Connection Management', () => {
    it('should establish connection pool successfully', async () => {
      const stats = postgres.getStats();
      expect(stats.totalConnections).toBeGreaterThan(0);
      expect(stats.idleConnections).toBeGreaterThan(0);
    });

    it('should perform health check', async () => {
      const isHealthy = await postgres.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should handle connection pool statistics', () => {
      const stats = postgres.getStats();
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('idleConnections');
      expect(stats).toHaveProperty('waitingClients');
    });
  });

  describe('Basic Queries', () => {
    beforeEach(async () => {
      // Create test table
      await postgres.query(`
        CREATE TABLE IF NOT EXISTS test_users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          age INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Clean up
      await postgres.query('DELETE FROM test_users');
    });

    it('should execute SELECT query', async () => {
      const result = await postgres.query('SELECT 1 as test_value');
      expect(result.rows[0].test_value).toBe(1);
      expect(result.rowCount).toBe(1);
    });

    it('should execute parameterized queries', async () => {
      const result = await postgres.query('SELECT $1 as value, $2 as name', [42, 'test']);
      expect(result.rows[0].value).toBe(42);
      expect(result.rows[0].name).toBe('test');
    });

    it('should handle INSERT operations', async () => {
      const result = await postgres.query(
        'INSERT INTO test_users (name, email, age) VALUES ($1, $2, $3) RETURNING *',
        ['John Doe', 'john@example.com', 30]
      );

      expect(result.rows[0].name).toBe('John Doe');
      expect(result.rows[0].email).toBe('john@example.com');
      expect(result.rows[0].age).toBe(30);
      expect(result.rows[0]).toHaveProperty('id');
    });

    it('should handle UPDATE operations', async () => {
      // Insert test data
      await postgres.query(
        'INSERT INTO test_users (name, email, age) VALUES ($1, $2, $3)',
        ['Jane Doe', 'jane@example.com', 25]
      );

      // Update
      const updateResult = await postgres.query(
        'UPDATE test_users SET age = $1 WHERE email = $2 RETURNING *',
        [26, 'jane@example.com']
      );

      expect(updateResult.rows[0].age).toBe(26);
      expect(updateResult.rowCount).toBe(1);
    });

    it('should handle DELETE operations', async () => {
      // Insert test data
      await postgres.query(
        'INSERT INTO test_users (name, email, age) VALUES ($1, $2, $3)',
        ['Bob Smith', 'bob@example.com', 35]
      );

      // Delete
      const deleteResult = await postgres.query(
        'DELETE FROM test_users WHERE email = $1',
        ['bob@example.com']
      );

      expect(deleteResult.rowCount).toBe(1);

      // Verify deletion
      const selectResult = await postgres.query(
        'SELECT COUNT(*) as count FROM test_users WHERE email = $1',
        ['bob@example.com']
      );
      expect(parseInt(selectResult.rows[0].count)).toBe(0);
    });
  });

  describe('Transaction Support', () => {
    beforeEach(async () => {
      await postgres.query('DELETE FROM test_users');
    });

    it('should execute transactions successfully', async () => {
      await postgres.transaction(async (client) => {
        // Insert multiple users in transaction
        await client.query(
          'INSERT INTO test_users (name, email, age) VALUES ($1, $2, $3)',
          ['Alice', 'alice@example.com', 28]
        );

        await client.query(
          'INSERT INTO test_users (name, email, age) VALUES ($1, $2, $3)',
          ['Charlie', 'charlie@example.com', 32]
        );

        // Verify within transaction
        const result = await client.query('SELECT COUNT(*) as count FROM test_users');
        expect(parseInt(result.rows[0].count)).toBe(2);
      });

      // Verify after transaction commit
      const result = await postgres.query('SELECT COUNT(*) as count FROM test_users');
      expect(parseInt(result.rows[0].count)).toBe(2);
    });

    it('should rollback transactions on error', async () => {
      try {
        await postgres.transaction(async (client) => {
          await client.query(
            'INSERT INTO test_users (name, email, age) VALUES ($1, $2, $3)',
            ['Dave', 'dave@example.com', 40]
          );

          // This will fail due to duplicate email
          await client.query(
            'INSERT INTO test_users (name, email, age) VALUES ($1, $2, $3)',
            ['Eve', 'dave@example.com', 38] // Same email as above
          );
        });
      } catch (error) {
        // Expected error
      }

      // Verify rollback - no users should be inserted
      const result = await postgres.query('SELECT COUNT(*) as count FROM test_users');
      expect(parseInt(result.rows[0].count)).toBe(0);
    });
  });

  describe('Connection Pool Behavior', () => {
    it('should handle multiple concurrent queries', async () => {
      const promises = [];

      // Execute 10 concurrent queries
      for (let i = 0; i < 10; i++) {
        promises.push(
          postgres.query('SELECT $1 as id, pg_sleep(0.01)', [i])
        );
      }

      const results = await Promise.all(promises);

      // Verify all queries completed
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.rows[0].id).toBe(index);
      });
    });

    it('should reuse connections from pool', async () => {
      const initialStats = postgres.getStats();

      // Execute several queries
      for (let i = 0; i < 5; i++) {
        await postgres.query('SELECT 1');
      }

      const finalStats = postgres.getStats();

      // Connections should be reused
      expect(finalStats.totalConnections).toBe(initialStats.totalConnections);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid SQL syntax', async () => {
      try {
        await postgres.query('INVALID SQL SYNTAX');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toContain('syntax error');
      }
    });

    it('should handle connection timeouts', async () => {
      // Create client with very short timeout
      const timeoutConfig: PostgresConfig = {
        ...testConfig,
        queryTimeout: 1 // 1ms timeout
      };

      const timeoutClient = new BunPostgres(timeoutConfig);

      try {
        // This should timeout
        await timeoutClient.query('SELECT pg_sleep(1)'); // Sleep for 1 second
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toContain('timeout');
      } finally {
        await timeoutClient.close();
      }
    });
  });

  describe('Data Type Handling', () => {
    beforeEach(async () => {
      await postgres.query(`
        CREATE TABLE IF NOT EXISTS test_types (
          id SERIAL PRIMARY KEY,
          text_field TEXT,
          int_field INTEGER,
          float_field REAL,
          bool_field BOOLEAN,
          json_field JSONB,
          timestamp_field TIMESTAMP,
          array_field INTEGER[]
        )
      `);

      await postgres.query('DELETE FROM test_types');
    });

    it('should handle various PostgreSQL data types', async () => {
      const testData = {
        text_field: 'Hello World',
        int_field: 42,
        float_field: 3.14,
        bool_field: true,
        json_field: { nested: { value: 'test' } },
        timestamp_field: new Date('2025-01-01T12:00:00Z'),
        array_field: [1, 2, 3, 4, 5]
      };

      const insertResult = await postgres.query(`
        INSERT INTO test_types
        (text_field, int_field, float_field, bool_field, json_field, timestamp_field, array_field)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, Object.values(testData));

      const row = insertResult.rows[0];

      expect(row.text_field).toBe(testData.text_field);
      expect(row.int_field).toBe(testData.int_field);
      expect(row.float_field).toBe(testData.float_field);
      expect(row.bool_field).toBe(testData.bool_field);
      expect(row.json_field).toEqual(testData.json_field);
      expect(new Date(row.timestamp_field).getTime()).toBe(testData.timestamp_field.getTime());
      expect(row.array_field).toEqual(testData.array_field);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle high-throughput queries', async () => {
      const startTime = Date.now();
      const queryCount = 100;

      const promises = [];
      for (let i = 0; i < queryCount; i++) {
        promises.push(postgres.query('SELECT $1 as counter', [i]));
      }

      await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const qps = (queryCount / totalTime) * 1000;

      console.log(`PostgreSQL throughput: ${qps.toFixed(2)} queries/second`);
      expect(qps).toBeGreaterThan(10); // At least 10 queries per second
    });

    it('should maintain connection pool efficiency', () => {
      const stats = postgres.getStats();

      // Pool should not have excessive waiting clients
      expect(stats.waitingClients).toBeLessThan(stats.totalConnections);
    });
  });
});