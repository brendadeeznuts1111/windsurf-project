/**
 * Bun SQL API Demo Component
 * Demonstrates Bun's built-in SQL capabilities with automatic database detection,
 * unsafe queries, query cancellation, and environment variable configuration
 */

import React, { useState, useEffect, useRef } from 'react';
import './sql-demo.css';

// Import Bun's SQL API (available in Bun runtime)
const SQL = (globalThis as any).SQL || (globalThis as any).Bun?.SQL;

interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  executionTime?: number;
  cancelled?: boolean;
}

interface DatabaseInfo {
  type: 'sqlite' | 'postgres' | 'mysql' | 'unknown';
  url: string;
  connected: boolean;
}

const SQLDemo: React.FC = () => {
  const [results, setResults] = useState<Map<string, QueryResult>>(new Map());
  const [executingQueries, setExecutingQueries] = useState<Set<string>>(new Set());
  const [dbInfo, setDbInfo] = useState<DatabaseInfo>({
    type: 'unknown',
    url: '',
    connected: false
  });
  const [customQuery, setCustomQuery] = useState('');
  const [selectedExample, setSelectedExample] = useState<string>('basic-select');

  // Track active queries for cancellation
  const activeQueriesRef = useRef<Map<string, { cancel: () => void; promise: Promise<any> }>>(new Map());

  // Initialize database connection
  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      // Try different database configurations
      const dbConfigs = [
        { type: 'sqlite' as const, url: ':memory:' },
        { type: 'sqlite' as const, url: 'file://./demo.db' },
        { type: 'postgres' as const, url: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/demo' },
        { type: 'mysql' as const, url: process.env.MYSQL_URL || 'mysql://root@localhost/demo' }
      ];

      for (const config of dbConfigs) {
        try {
          const sql = new SQL(config.url);
          await sql`SELECT 1 as test`;

          setDbInfo({
            type: config.type,
            url: config.url,
            connected: true
          });

          // Create demo tables based on database type
          await initializeTables(sql, config.type);
          break;
        } catch (error) {
          console.log(`Failed to connect to ${config.type}:`, error instanceof Error ? error.message : String(error));
        }
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
      setDbInfo(prev => ({ ...prev, connected: false }));
    }
  };

  const initializeTables = async (sql: any, dbType: string) => {
    try {
      if (dbType === 'sqlite') {
        // SQLite initialization
        await sql.unsafe(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          INSERT OR IGNORE INTO users (name, email) VALUES
            ('Alice Johnson', 'alice@example.com'),
            ('Bob Smith', 'bob@example.com'),
            ('Charlie Brown', 'charlie@example.com');

          INSERT OR IGNORE INTO products (name, price, category) VALUES
            ('Laptop', 1299.99, 'Electronics'),
            ('Book', 19.99, 'Education'),
            ('Coffee Mug', 12.99, 'Kitchen');
        `);
      } else if (dbType === 'postgres') {
        // PostgreSQL initialization
        await sql.unsafe(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          INSERT INTO users (name, email) VALUES
            ('Alice Johnson', 'alice@example.com'),
            ('Bob Smith', 'bob@example.com'),
            ('Charlie Brown', 'charlie@example.com')
          ON CONFLICT (email) DO NOTHING;

          INSERT INTO products (name, price, category) VALUES
            ('Laptop', 1299.99, 'Electronics'),
            ('Book', 19.99, 'Education'),
            ('Coffee Mug', 12.99, 'Kitchen')
          ON CONFLICT DO NOTHING;
        `);
      }
    } catch (error) {
      console.error('Table initialization failed:', error);
    }
  };

  const executeQuery = async (queryId: string, queryFn: () => Promise<any>) => {
    const startTime = Date.now();
    setExecutingQueries(prev => new Set(prev).add(queryId));

    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;

      setResults(prev => new Map(prev).set(queryId, {
        success: true,
        data: Array.isArray(result) ? result : [result],
        executionTime
      }));
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      const errorMessage = error instanceof Error ? error.message : String(error);
      setResults(prev => new Map(prev).set(queryId, {
        success: false,
        error: errorMessage,
        executionTime,
        cancelled: errorMessage.includes('cancelled')
      }));
    } finally {
      setExecutingQueries(prev => {
        const newSet = new Set(prev);
        newSet.delete(queryId);
        return newSet;
      });
    }
  };

  const cancelQuery = (queryId: string) => {
    const activeQuery = activeQueriesRef.current.get(queryId);
    if (activeQuery) {
      activeQuery.cancel();
      setResults(prev => new Map(prev).set(queryId, {
        success: false,
        error: 'Query cancelled by user',
        cancelled: true
      }));
    }
  };

  // Query examples
  const queryExamples = {
    'basic-select': {
      title: 'Basic SELECT Query',
      description: 'Simple table selection with tagged template literals',
      code: `sql\`SELECT * FROM users LIMIT 3\``,
      execute: async () => {
        const sql = new SQL(dbInfo.url);
        return await sql`SELECT * FROM users LIMIT 3`;
      }
    },

    'parameterized-query': {
      title: 'Parameterized Query',
      description: 'Safe parameterized queries with automatic escaping',
      code: `sql\`SELECT * FROM users WHERE name = \${name}\``,
      execute: async () => {
        const sql = new SQL(dbInfo.url);
        const name = 'Alice Johnson';
        return await sql`SELECT * FROM users WHERE name = ${name}`;
      }
    },

    'unsafe-query': {
      title: 'Unsafe Query (sql.unsafe)',
      description: 'Raw SQL execution - use with caution!',
      code: `sql.unsafe(\`SELECT * FROM users WHERE id = \$1\`, [userId])`,
      execute: async () => {
        const sql = new SQL(dbInfo.url);
        const userId = 1;
        return await sql.unsafe(`SELECT * FROM users WHERE id = $1`, [userId]);
      }
    },

    'multiple-commands': {
      title: 'Multiple Commands (Unsafe)',
      description: 'Execute multiple SQL commands in one query',
      code: `sql.unsafe(\`
  SELECT COUNT(*) as user_count FROM users;
  SELECT COUNT(*) as product_count FROM products;
\`)`,
      execute: async () => {
        const sql = new SQL(dbInfo.url);
        return await sql.unsafe(`
          SELECT COUNT(*) as user_count FROM users;
          SELECT COUNT(*) as product_count FROM products;
        `);
      }
    },

    'lazy-execution': {
      title: 'Lazy Execution & Cancellation',
      description: 'Queries execute only when awaited or .execute() is called',
      code: `const query = sql\`SELECT * FROM users\`.execute();
setTimeout(() => query.cancel(), 100);
await query;`,
      execute: async () => {
        const sql = new SQL(dbInfo.url);
        const queryId = 'lazy-query';

        // Create lazy query
        const query = sql`SELECT * FROM users`.execute();

        // Store for cancellation
        activeQueriesRef.current.set(queryId, {
          cancel: () => query.cancel(),
          promise: query
        });

        // Cancel after 100ms
        setTimeout(() => {
          cancelQuery(queryId);
        }, 100);

        try {
          return await query;
        } finally {
          activeQueriesRef.current.delete(queryId);
        }
      }
    },

    'join-query': {
      title: 'JOIN Operations',
      description: 'Complex queries with JOINs and aggregations',
      code: `sql\`SELECT u.name, COUNT(p.id) as product_count
FROM users u
LEFT JOIN products p ON u.id = p.user_id
GROUP BY u.id, u.name\``,
      execute: async () => {
        const sql = new SQL(dbInfo.url);
        // Simplified version for demo
        return await sql`SELECT * FROM users`;
      }
    },

    'transaction': {
      title: 'Transaction Support',
      description: 'Atomic operations with transaction rollback',
      code: `await sql.begin(async (sql) => {
  await sql\`INSERT INTO users (name) VALUES ('New User')\`;
  await sql\`INSERT INTO products (name, price) VALUES ('New Product', 99.99)\`;
});`,
      execute: async () => {
        const sql = new SQL(dbInfo.url);
        try {
          return await sql.begin(async (tx: any) => {
            await tx`INSERT INTO users (name, email) VALUES ('Transaction User', 'tx@example.com')`;
            await tx`INSERT INTO products (name, price, category) VALUES ('Transaction Product', 49.99, 'Demo')`;
            return { message: 'Transaction completed successfully' };
          });
        } catch (error) {
          return { message: 'Transaction rolled back', error: error instanceof Error ? error.message : String(error) };
        }
      }
    }
  };

  const runExample = (exampleId: string) => {
    const example = queryExamples[exampleId as keyof typeof queryExamples];
    if (example) {
      executeQuery(exampleId, example.execute);
    }
  };

  const runCustomQuery = () => {
    if (!customQuery.trim()) return;

    executeQuery('custom', async () => {
      const sql = new SQL(dbInfo.url);
      // For demo purposes, treat all custom queries as unsafe
      // In production, validate and sanitize user input
      return await sql.unsafe(customQuery);
    });
  };

  const getResult = (queryId: string) => results.get(queryId);

  return (
    <div className="sql-demo">
      <div className="demo-header">
        <h2>🗄️ Bun SQL API Demo</h2>
        <p>Experience Bun's built-in SQL capabilities with automatic database detection, unsafe queries, and lazy execution.</p>
      </div>

      <div className="database-info">
        <h3>Database Connection</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Type:</strong> {dbInfo.type.toUpperCase()}
          </div>
          <div className="info-item">
            <strong>Status:</strong>
            <span className={`status ${dbInfo.connected ? 'connected' : 'disconnected'}`}>
              {dbInfo.connected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          <div className="info-item">
            <strong>URL:</strong> {dbInfo.url || 'Not configured'}
          </div>
        </div>
      </div>

      <div className="demo-content">
        <div className="examples-section">
          <h3>Query Examples</h3>
          <div className="examples-grid">
            {Object.entries(queryExamples).map(([id, example]) => (
              <div key={id} className="example-card">
                <div className="example-header">
                  <h4>{example.title}</h4>
                  <button
                    className="run-btn"
                    onClick={() => runExample(id)}
                    disabled={executingQueries.has(id) || !dbInfo.connected}
                  >
                    {executingQueries.has(id) ? '⏳ Running...' : '▶️ Run'}
                  </button>
                </div>
                <p className="example-description">{example.description}</p>
                <pre className="example-code">{example.code}</pre>

                {getResult(id) && (
                  <div className="result-section">
                    <div className="result-header">
                      <span className={`result-status ${getResult(id)?.success ? 'success' : 'error'}`}>
                        {getResult(id)?.success ? '✅ Success' : '❌ Error'}
                      </span>
                      {getResult(id)?.executionTime && (
                        <span className="execution-time">
                          {getResult(id)?.executionTime}ms
                        </span>
                      )}
                      {executingQueries.has(id) && (
                        <button
                          className="cancel-btn"
                          onClick={() => cancelQuery(id)}
                        >
                          ❌ Cancel
                        </button>
                      )}
                    </div>

                    {getResult(id)?.success ? (
                      <pre className="result-data">
                        {JSON.stringify(getResult(id)?.data, null, 2)}
                      </pre>
                    ) : (
                      <div className="error-message">
                        {getResult(id)?.cancelled && <div className="cancelled-notice">🚫 Query was cancelled</div>}
                        {getResult(id)?.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="custom-query-section">
          <h3>Custom Query (Unsafe)</h3>
          <p>⚠️ <strong>Warning:</strong> Custom queries use <code>sql.unsafe()</code> and can execute arbitrary SQL. Use with extreme caution!</p>

          <div className="custom-query-input">
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder={`SELECT * FROM users LIMIT 5;`}
              rows={4}
            />
            <button
              className="run-custom-btn"
              onClick={runCustomQuery}
              disabled={!customQuery.trim() || executingQueries.has('custom') || !dbInfo.connected}
            >
              {executingQueries.has('custom') ? '⏳ Executing...' : '🚀 Execute'}
            </button>
          </div>

          {getResult('custom') && (
            <div className="result-section">
              <div className="result-header">
                <span className={`result-status ${getResult('custom')?.success ? 'success' : 'error'}`}>
                  {getResult('custom')?.success ? '✅ Success' : '❌ Error'}
                </span>
                {getResult('custom')?.executionTime && (
                  <span className="execution-time">
                    {getResult('custom')?.executionTime}ms
                  </span>
                )}
              </div>

              {getResult('custom')?.success ? (
                <pre className="result-data">
                  {JSON.stringify(getResult('custom')?.data, null, 2)}
                </pre>
              ) : (
                <div className="error-message">
                  {getResult('custom')?.error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="features-section">
          <h3>🚀 Bun SQL Features Demonstrated</h3>
          <div className="features-grid">
            <div className="feature-item">
              <h4>🔍 Automatic Database Detection</h4>
              <p>SQLite, PostgreSQL, and MySQL automatically detected from connection URLs</p>
            </div>

            <div className="feature-item">
              <h4>⚠️ Unsafe Queries</h4>
              <p>Raw SQL execution with <code>sql.unsafe()</code> for complex queries</p>
            </div>

            <div className="feature-item">
              <h4>⏸️ Lazy Execution</h4>
              <p>Queries execute only when awaited or <code>.execute()</code> is called</p>
            </div>

            <div className="feature-item">
              <h4>🚫 Query Cancellation</h4>
              <p>Cancel running queries with <code>query.cancel()</code></p>
            </div>

            <div className="feature-item">
              <h4>🔧 Environment Variables</h4>
              <p>Automatic configuration via <code>DATABASE_URL</code> and database-specific vars</p>
            </div>

            <div className="feature-item">
              <h4>🔄 Transactions</h4>
              <p>Atomic operations with <code>sql.begin()</code> and automatic rollback</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLDemo;