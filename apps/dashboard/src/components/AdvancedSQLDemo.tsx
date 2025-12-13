/**
 * Advanced Bun SQL Features Demo
 * Demonstrates error handling, BigInt support, Redis integration, and WebSocket improvements
 */

import React, { useState, useEffect, useRef } from 'react';
import './advanced-sql-demo.css';

// Import Bun's advanced APIs
const SQL = (globalThis as any).SQL || (globalThis as any).Bun?.SQL;
const redis = (globalThis as any).redis || (globalThis as any).Bun?.redis;
const RedisClient = (globalThis as any).RedisClient || (globalThis as any).Bun?.RedisClient;

interface DemoResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
  errorType?: string;
}

const AdvancedSQLDemo: React.FC = () => {
  const [results, setResults] = useState<Map<string, DemoResult>>(new Map());
  const [executingDemos, setExecutingDemos] = useState<Set<string>>(new Set());
  const [redisConnected, setRedisConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize Redis connection
  useEffect(() => {
    initializeRedis();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initializeRedis = async () => {
    try {
      if (redis) {
        // Test Redis connection
        await redis.set('bun-demo-test', 'connected');
        const value = await redis.get('bun-demo-test');
        if (value === 'connected') {
          setRedisConnected(true);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Redis not available:', errorMessage);
    }
  };

  const executeDemo = async (demoId: string, demoFn: () => Promise<any>) => {
    const startTime = Date.now();
    setExecutingDemos(prev => new Set(prev).add(demoId));

    try {
      const result = await demoFn();
      const executionTime = Date.now() - startTime;

      setResults(prev => new Map(prev).set(demoId, {
        success: true,
        data: result,
        executionTime
      }));
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Determine error type
      let errorType = 'Unknown';
      if (error instanceof SQL?.PostgresError) {
        errorType = 'PostgreSQL Error';
      } else if (error instanceof SQL?.SQLiteError) {
        errorType = 'SQLite Error';
      } else if (error instanceof SQL?.MySQLError) {
        errorType = 'MySQL Error';
      } else if (error instanceof SQL?.SQLError) {
        errorType = 'SQL Error';
      }

      setResults(prev => new Map(prev).set(demoId, {
        success: false,
        error: error.message,
        executionTime,
        errorType
      }));
    } finally {
      setExecutingDemos(prev => {
        const newSet = new Set(prev);
        newSet.delete(demoId);
        return newSet;
      });
    }
  };

  // Advanced SQL demos
  const advancedDemos = {
    'error-handling': {
      title: 'Typed Error Handling',
      description: 'Demonstrates database-specific error classes and proper error handling',
      code: `// Bun provides typed errors for different databases
try {
  // This will fail due to constraint violation
  await sql.unsafe('INSERT INTO users (email) VALUES (?)', ['duplicate@example.com']);
} catch (error) {
  if (error instanceof SQL.PostgresError) {
    // PostgreSQL-specific error
    return {
      type: 'PostgreSQL',
      code: error.code,
      detail: error.detail,
      hint: error.hint
    };
  } else if (error instanceof SQL.SQLiteError) {
    // SQLite-specific error
    return {
      type: 'SQLite',
      code: error.code,
      errno: error.errno
    };
  } else if (error instanceof SQL.MySQLError) {
    // MySQL-specific error
    return {
      type: 'MySQL',
      code: error.code,
      errno: error.errno
    };
  }
  return { type: 'Generic', message: error.message };
}`,
      execute: async () => {
        const sql = new SQL(':memory:');
        await sql.unsafe('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE)');

        try {
          // Insert first user
          await sql.unsafe('INSERT INTO users (email) VALUES (?)', ['test@example.com']);
          // Try to insert duplicate (will fail)
          await sql.unsafe('INSERT INTO users (email) VALUES (?)', ['test@example.com']);
        } catch (error: any) {
          if (error instanceof SQL?.SQLiteError) {
            return {
              type: 'SQLite',
              code: error.code,
              errno: error.errno,
              message: 'Constraint violation handled correctly'
            };
          }
          throw error;
        }
      }
    },

    'bigint-handling': {
      title: 'BigInt & Large Number Handling',
      description: 'Automatic handling of numbers that exceed JavaScript\'s safe integer range',
      code: `// Numbers exceeding 53-bit integers are handled specially
const result = await sql\`
  SELECT
    9223372036854775807 as big_int,
    12345 as normal_int,
    9007199254740992 as unsafe_int
\`;

// BigInt option for automatic conversion
const sqlBigInt = new SQL({
  bigint: true,  // Convert large numbers to BigInt
});

const bigIntResult = await sqlBigInt\`
  SELECT 9223372036854775807 as big_number
\`;

// Without bigint: true → returns string
// With bigint: true → returns BigInt`,
      execute: async () => {
        const sql = new SQL(':memory:');

        // Test large number handling
        const result = await sql`
          SELECT
            9223372036854775807 as big_int,
            12345 as normal_int,
            9007199254740992 as unsafe_int
        `;

        const row = result[0];

        return {
          big_int: {
            value: row.big_int,
            type: typeof row.big_int,
            isBigInt: typeof row.big_int === 'string'
          },
          normal_int: {
            value: row.normal_int,
            type: typeof row.normal_int,
            isSafe: Number.isSafeInteger(row.normal_int)
          },
          unsafe_int: {
            value: row.unsafe_int,
            type: typeof row.unsafe_int,
            isSafe: Number.isSafeInteger(row.unsafe_int)
          }
        };
      }
    },

    'redis-integration': {
      title: 'Redis Client Integration',
      description: 'Built-in Redis client with high performance and automatic reconnection',
      code: `// Bun's built-in Redis client (7.9x faster than ioredis)
import { redis, RedisClient } from "bun";

// Auto-connects to REDIS_URL or localhost:6379
await redis.set("user:123", JSON.stringify({
  id: 123,
  name: "Alice",
  email: "alice@example.com"
}));

const userData = await redis.get("user:123");
const user = JSON.parse(userData);

// Hash operations
await redis.hset("user:123:profile", {
  followers: 150,
  following: 89,
  posts: 42
});

const profile = await redis.hgetall("user:123:profile");

// Pub/Sub messaging
const subscriber = await redis.duplicate();
await subscriber.subscribe("notifications", (message, channel) => {
  console.log(\`Received: \${message} on \${channel}\`);
});

await redis.publish("notifications", "Hello from Bun!");`,
      execute: async () => {
        if (!redis) {
          throw new Error('Redis client not available. Make sure Redis is running.');
        }

        try {
          // Test basic operations
          await redis.set('bun-demo:key', 'Hello from Bun SQL Demo!');
          const value = await redis.get('bun-demo:key');

          // Test hash operations
          await redis.hset('bun-demo:user', {
            name: 'Alice',
            email: 'alice@example.com',
            role: 'developer'
          });

          const user = await redis.hgetall('bun-demo:user');

          // Test TTL
          await redis.setex('bun-demo:temp', 60, 'temporary value');
          const ttl = await redis.ttl('bun-demo:temp');

          return {
            basic: { key: 'bun-demo:key', value },
            hash: user,
            ttl: { key: 'bun-demo:temp', ttl_seconds: ttl }
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Redis operations failed: ${errorMessage}`);
        }
      }
    },

    'websocket-advanced': {
      title: 'Advanced WebSocket Features',
      description: 'RFC 6455 compliant subprotocol negotiation and permessage-deflate compression',
      code: `// RFC 6455 compliant subprotocol negotiation
const ws = new WebSocket("ws://localhost:3000", ["chat", "superchat"]);

ws.onopen = () => {
  console.log(\`Connected with protocol: \${ws.protocol}\`);
  console.log(\`Extensions: \${ws.extensions}\`); // permessage-deflate
};

// Override special WebSocket headers
const ws2 = new WebSocket("ws://localhost:8080", {
  headers: {
    "Host": "custom-host.example.com",
    "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
  },
});

// Automatic permessage-deflate compression
ws.onmessage = (event) => {
  // Messages are automatically decompressed
  console.log("Received:", event.data);
};`,
      execute: async () => {
        // Test WebSocket connection to a demo endpoint
        return new Promise((resolve, reject) => {
          try {
            // Try to connect to a WebSocket echo server
            const ws = new WebSocket('wss://echo.websocket.org');

            ws.onopen = () => {
              setWsConnected(true);
              ws.send('Hello from Bun SQL Demo!');

              setTimeout(() => {
                ws.close();
              }, 1000);
            };

            ws.onmessage = (event) => {
              resolve({
                connected: true,
                protocol: ws.protocol,
                extensions: ws.extensions,
                message: event.data,
                url: ws.url
              });
            };

            ws.onerror = (error) => {
              reject(new Error('WebSocket connection failed'));
            };

            ws.onclose = () => {
              setWsConnected(false);
            };

            // Timeout after 5 seconds
            setTimeout(() => {
              if (ws.readyState === WebSocket.CONNECTING) {
                ws.close();
                reject(new Error('WebSocket connection timeout'));
              }
            }, 5000);

          } catch (error) {
            reject(error);
          }
        });
      }
    },

    'multi-statement': {
      title: 'Multiple Result Sets',
      description: 'Execute multiple SQL statements and handle multiple result sets',
      code: `// Multiple statements in a single query
const results = await sql.unsafe(\`
  SELECT COUNT(*) as user_count FROM users;
  SELECT COUNT(*) as product_count FROM products;
  SELECT AVG(price) as avg_price FROM products;
\`);

// Access individual result sets
const [userCount, productCount, avgPrice] = results;

console.log('Users:', userCount[0].user_count);
console.log('Products:', productCount[0].product_count);
console.log('Avg Price:', avgPrice[0].avg_price);

// MySQL supports this natively
// PostgreSQL requires special handling`,
      execute: async () => {
        const sql = new SQL(':memory:');

        // Create test data
        await sql.unsafe(`
          CREATE TABLE users (id INTEGER, name TEXT);
          CREATE TABLE products (id INTEGER, name TEXT, price REAL);

          INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie');
          INSERT INTO products VALUES (1, 'Laptop', 1299.99), (2, 'Book', 19.99);
        `);

        // Execute multiple statements
        const results = await sql.unsafe(`
          SELECT COUNT(*) as user_count FROM users;
          SELECT COUNT(*) as product_count FROM products;
          SELECT AVG(price) as avg_price FROM products;
        `);

        return {
          userCount: results[0][0].user_count,
          productCount: results[1][0].product_count,
          avgPrice: results[2][0].avg_price
        };
      }
    },

    'prepared-statements': {
      title: 'Prepared Statements & Performance',
      description: 'Automatic prepared statement caching and query performance optimization',
      code: `// Prepared statements are automatically created and cached
const userIds = [1, 2, 3, 4, 5];

for (const id of userIds) {
  // Same prepared statement reused automatically
  const user = await sql\`SELECT * FROM users WHERE id = \${id}\`;
  console.log('User:', user[0]);
}

// Batch operations with connection pooling
const results = await Promise.all([
  sql\`SELECT * FROM users WHERE active = \${true}\`,
  sql\`SELECT * FROM products WHERE in_stock = \${true}\`,
  sql\`SELECT * FROM orders WHERE status = \${'pending'}\`
]);

// MySQL uses server-side prepared statements
// PostgreSQL uses protocol-level prepared statements`,
      execute: async () => {
        const sql = new SQL(':memory:');

        // Create test data
        await sql.unsafe(`
          CREATE TABLE users (id INTEGER, name TEXT, active BOOLEAN);
          INSERT INTO users VALUES
            (1, 'Alice', true), (2, 'Bob', true), (3, 'Charlie', false);
        `);

        const startTime = performance.now();

        // Simulate multiple queries (prepared statements would be reused)
        const userIds = [1, 2, 3];
        const results: any[] = [];

        for (const id of userIds) {
          const user = await sql`SELECT * FROM users WHERE id = ${id}`;
          results.push(user[0]);
        }

        const executionTime = performance.now() - startTime;

        return {
          queryCount: userIds.length,
          results,
          executionTime: `${executionTime.toFixed(2)}ms`,
          avgTimePerQuery: `${(executionTime / userIds.length).toFixed(2)}ms`
        };
      }
    }
  };

  const runDemo = (demoId: string) => {
    const demo = advancedDemos[demoId as keyof typeof advancedDemos];
    if (demo) {
      executeDemo(demoId, demo.execute);
    }
  };

  const getResult = (demoId: string) => results.get(demoId);

  return (
    <div className="advanced-sql-demo">
      <div className="demo-header">
        <h2>🚀 Advanced Bun SQL Features</h2>
        <p>Explore Bun's advanced SQL capabilities including error handling, BigInt support, Redis integration, and WebSocket improvements.</p>

        <div className="status-indicators">
          <div className={`status-item ${redis ? 'available' : 'unavailable'}`}>
            <span className="status-dot"></span>
            Redis: {redis ? 'Available' : 'Not Available'}
          </div>
          <div className={`status-item ${true ? 'available' : 'unavailable'}`}>
            <span className="status-dot"></span>
            WebSocket: Available
          </div>
        </div>
      </div>

      <div className="demo-content">
        <div className="demos-section">
          <h3>Advanced Feature Demos</h3>
          <div className="demos-grid">
            {Object.entries(advancedDemos).map(([id, demo]) => (
              <div key={id} className="demo-card">
                <div className="demo-header">
                  <h4>{demo.title}</h4>
                  <button
                    className="run-demo-btn"
                    onClick={() => runDemo(id)}
                    disabled={executingDemos.has(id) ||
                             (id === 'redis-integration' && !redis)}
                  >
                    {executingDemos.has(id) ? '⏳ Running...' : '▶️ Run Demo'}
                  </button>
                </div>
                <p className="demo-description">{demo.description}</p>
                <pre className="demo-code">{demo.code}</pre>

                {getResult(id) && (
                  <div className="result-section">
                    <div className="result-header">
                      <span className={`result-status ${getResult(id)?.success ? 'success' : 'error'}`}>
                        {getResult(id)?.success ? '✅ Success' : '❌ Error'}
                        {getResult(id)?.errorType && ` (${getResult(id)?.errorType})`}
                      </span>
                      {getResult(id)?.executionTime && (
                        <span className="execution-time">
                          {getResult(id)?.executionTime}ms
                        </span>
                      )}
                    </div>

                    {getResult(id)?.success ? (
                      <pre className="result-data">
                        {JSON.stringify(getResult(id)?.data, null, 2)}
                      </pre>
                    ) : (
                      <div className="error-message">
                        {getResult(id)?.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="features-overview">
          <h3>🎯 Key Advanced Features</h3>
          <div className="features-grid">
            <div className="feature-item">
              <h4>🔍 Typed Error Handling</h4>
              <p>Database-specific error classes (PostgresError, SQLiteError, MySQLError) with detailed error information</p>
            </div>

            <div className="feature-item">
              <h4>🔢 BigInt & Large Number Support</h4>
              <p>Automatic handling of numbers exceeding JavaScript's safe integer range with configurable BigInt conversion</p>
            </div>

            <div className="feature-item">
              <h4>⚡ Built-in Redis Client</h4>
              <p>High-performance Redis client (7.9x faster than ioredis) with automatic reconnection and Pub/Sub support</p>
            </div>

            <div className="feature-item">
              <h4>🌐 Advanced WebSocket Features</h4>
              <p>RFC 6455 compliant subprotocol negotiation and automatic permessage-deflate compression</p>
            </div>

            <div className="feature-item">
              <h4>📊 Multiple Result Sets</h4>
              <p>Execute multiple SQL statements in a single query and handle multiple result sets</p>
            </div>

            <div className="feature-item">
              <h4>🚀 Prepared Statement Caching</h4>
              <p>Automatic prepared statement creation and caching for improved query performance</p>
            </div>
          </div>
        </div>

        <div className="performance-section">
          <h3>📈 Performance Characteristics</h3>
          <div className="performance-grid">
            <div className="perf-item">
              <h4>URLPattern Matching</h4>
              <div className="perf-value">168k matches/sec</div>
              <div className="perf-note">4× faster than Node.js</div>
            </div>

            <div className="perf-item">
              <h4>Redis Operations</h4>
              <div className="perf-value">7.9× faster</div>
              <div className="perf-note">vs ioredis</div>
            </div>

            <div className="perf-item">
              <h4>WebSocket Compression</h4>
              <div className="perf-value">60-80% reduction</div>
              <div className="perf-note">Message size reduction</div>
            </div>

            <div className="perf-item">
              <h4>SQL Query Execution</h4>
              <div className="perf-value">Sub-millisecond</div>
              <div className="perf-note">With prepared statements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSQLDemo;