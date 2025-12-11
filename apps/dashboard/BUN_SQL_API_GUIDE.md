# Bun SQL API Implementation Guide

## 🎯 Overview

This implementation demonstrates Bun's powerful built-in SQL capabilities, showcasing automatic database detection, unsafe queries, lazy execution, query cancellation, and comprehensive environment variable support.

## 🏗️ Architecture

### Components

1. **SQLDemo Component** (`src/components/SQLDemo.tsx`)
   - Interactive SQL query interface
   - Real-time query execution and results
   - Database connection management

2. **Database Setup Script** (`setup-db.ts`)
   - Automated database initialization
   - Sample data population
   - Multi-database support testing

3. **API Router** (`src/api/router.ts`)
   - URLPattern-based routing
   - SQL query integration
   - Error handling and logging

## 🚀 Features Implemented

### ✅ Automatic Database Detection

Bun automatically detects database types from connection URLs:

```typescript
// SQLite (default for file:// and :memory:)
const sqlite = new SQL(':memory:');
const fileDb = new SQL('file://./data.db');

// PostgreSQL (default for unrecognized URLs)
const postgres = new SQL('postgres://user:pass@localhost:5432/db');

// MySQL (explicit mysql:// or mysql2://)
const mysql = new SQL('mysql://user:pass@localhost:3306/db');
```

### ✅ Environment Variable Configuration

Comprehensive environment variable support:

```bash
# SQLite
DATABASE_URL=":memory:"
DATABASE_URL="file://./app.db"

# PostgreSQL
DATABASE_URL="postgres://user:pass@localhost:5432/db"
POSTGRES_URL="postgres://user:pass@localhost:5432/db"

# MySQL
DATABASE_URL="mysql://user:pass@localhost:3306/db"
MYSQL_URL="mysql://user:pass@localhost:3306/db"
```

### ✅ Unsafe Queries (sql.unsafe)

Execute raw SQL with proper parameter handling:

```typescript
// Multiple commands without parameters
const result = await sql.unsafe(`
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM products;
`);

// Single command with parameters
const result = await sql.unsafe(
  "SELECT * FROM users WHERE id = $1 AND status = $2",
  [userId, 'active']
);
```

### ✅ Lazy Execution & Cancellation

Queries execute only when awaited or explicitly executed:

```typescript
// Lazy execution - query doesn't run yet
const query = sql`SELECT * FROM users WHERE active = ${true}`;

// Execute explicitly
const executingQuery = query.execute();

// Cancel if needed
setTimeout(() => executingQuery.cancel(), 100);

// Wait for results (or cancellation)
await executingQuery;
```

### ✅ Tagged Template Literals

Safe, parameterized queries with automatic escaping:

```typescript
const userId = 123;
const status = 'active';

// Safe parameterized query
const users = await sql`
  SELECT * FROM users
  WHERE id = ${userId}
  AND status = ${status}
  ORDER BY created_at DESC
`;
```

### ✅ Transaction Support

Atomic operations with automatic rollback:

```typescript
await sql.begin(async (tx) => {
  // All operations in this block are atomic
  await tx`INSERT INTO users (name) VALUES (${'New User'})`;
  await tx`INSERT INTO orders (user_id, amount) VALUES (${userId}, ${amount})`;

  // If any operation fails, all are rolled back automatically
});
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL,
  total REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## 🛠️ Usage Examples

### Basic Setup

```bash
# Install dependencies (Bun SQL is built-in)
bun install

# Set up database with sample data
bun run db:setup

# Start the dashboard
bun run dev

# Navigate to "Bun SQL API" tab
```

### Environment Configuration

```bash
# SQLite (default)
export DATABASE_URL=":memory:"

# PostgreSQL
export DATABASE_URL="postgres://user:pass@localhost:5432/demo"

# MySQL
export DATABASE_URL="mysql://user:pass@localhost:3306/demo"

# Then run the app
bun run dev
```

### Programmatic Usage

```typescript
import { SQL } from 'bun:sql';

// Connect to database
const sql = new SQL(process.env.DATABASE_URL || ':memory:');

// Safe parameterized queries
const users = await sql`
  SELECT * FROM users
  WHERE active = ${true}
  ORDER BY created_at DESC
  LIMIT ${limit}
`;

// Unsafe raw queries (use with caution)
const result = await sql.unsafe(`
  SELECT u.name, COUNT(o.id) as order_count
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  GROUP BY u.id, u.name
`);

// Transactions
await sql.begin(async (tx) => {
  const userId = await tx`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING id
  `;

  await tx`
    INSERT INTO orders (user_id, amount)
    VALUES (${userId}, ${amount})
  `;
});
```

## 🔍 Query Examples

### 1. Basic SELECT with Parameters

```typescript
const users = await sql`
  SELECT id, name, email
  FROM users
  WHERE created_at >= ${startDate}
  ORDER BY name
`;
```

### 2. JOIN Operations

```typescript
const orderDetails = await sql`
  SELECT
    o.id as order_id,
    u.name as customer_name,
    p.name as product_name,
    o.quantity,
    o.total,
    o.status
  FROM orders o
  JOIN users u ON o.user_id = u.id
  JOIN products p ON o.product_id = p.id
  WHERE o.status = ${status}
  ORDER BY o.created_at DESC
`;
```

### 3. Aggregations

```typescript
const stats = await sql`
  SELECT
    COUNT(*) as total_orders,
    SUM(total) as total_revenue,
    AVG(total) as avg_order_value,
    MAX(total) as largest_order,
    MIN(total) as smallest_order
  FROM orders
  WHERE created_at >= ${startDate}
`;
```

### 4. Unsafe Complex Queries

```typescript
// Multiple result sets
const [userCounts, productCounts] = await sql.unsafe(`
  SELECT status, COUNT(*) as count FROM users GROUP BY status;
  SELECT category, COUNT(*) as count FROM products GROUP BY category;
`);

// Dynamic column selection
const columns = ['id', 'name', 'email'];
const users = await sql.unsafe(
  `SELECT ${columns.join(', ')} FROM users WHERE active = $1`,
  [true]
);
```

### 5. Lazy Execution with Cancellation

```typescript
// Create lazy query
const slowQuery = sql`
  SELECT * FROM large_table
  WHERE complex_condition = ${param}
`;

// Execute with timeout
const executingQuery = slowQuery.execute();

// Cancel after 5 seconds if not done
const timeout = setTimeout(() => {
  console.log('Cancelling slow query...');
  executingQuery.cancel();
}, 5000);

try {
  const results = await executingQuery;
  clearTimeout(timeout);
  console.log('Query completed:', results.length, 'rows');
} catch (error) {
  if (error.message.includes('cancelled')) {
    console.log('Query was cancelled due to timeout');
  } else {
    console.error('Query failed:', error);
  }
}
```

## 🎯 Performance Considerations

### Connection Pooling

Bun automatically manages connection pooling for supported databases:

- **SQLite**: Single connection (file-based) or in-memory
- **PostgreSQL**: Connection pool with `pg.Pool` compatibility
- **MySQL**: Connection pool with automatic reconnection

### Query Optimization

```typescript
// Use indexed columns in WHERE clauses
const users = await sql`
  SELECT * FROM users
  WHERE email = ${email}  -- email should be indexed
`;

// Avoid SELECT * for large tables
const userNames = await sql`
  SELECT name FROM users  -- Only select needed columns
  WHERE active = ${true}
`;

// Use LIMIT for large result sets
const recentUsers = await sql`
  SELECT * FROM users
  ORDER BY created_at DESC
  LIMIT ${pageSize}
  OFFSET ${offset}
`;
```

### Memory Management

```typescript
// Process large result sets in chunks
const BATCH_SIZE = 1000;
let offset = 0;

while (true) {
  const batch = await sql`
    SELECT * FROM large_table
    LIMIT ${BATCH_SIZE}
    OFFSET ${offset}
  `;

  if (batch.length === 0) break;

  // Process batch
  await processBatch(batch);

  offset += BATCH_SIZE;
}
```

## 🧪 Testing

### Unit Tests for SQL Operations

```typescript
import { describe, test, expect, mock } from 'bun:test';

test('user creation and retrieval', async () => {
  const sql = new SQL(':memory:');

  // Create user
  const [user] = await sql`
    INSERT INTO users (name, email)
    VALUES (${'Test User'}, ${'test@example.com'})
    RETURNING *
  `;

  expect(user.name).toBe('Test User');
  expect(user.email).toBe('test@example.com');

  // Retrieve user
  const [retrieved] = await sql`
    SELECT * FROM users WHERE id = ${user.id}
  `;

  expect(retrieved.id).toBe(user.id);
});
```

### Transaction Testing

```typescript
test('transaction rollback on error', async () => {
  const sql = new SQL(':memory:');

  const initialCount = (await sql`SELECT COUNT(*) as count FROM users`)[0].count;

  try {
    await sql.begin(async (tx) => {
      await tx`INSERT INTO users (name) VALUES ('Should Rollback')`;
      throw new Error('Intentional failure');
    });
  } catch (error) {
    // Expected
  }

  const finalCount = (await sql`SELECT COUNT(*) as count FROM users`)[0].count;
  expect(finalCount).toBe(initialCount); // Should be unchanged
});
```

## 🔒 Security Best Practices

### Parameterized Queries (Safe)

```typescript
// ✅ Always use parameterized queries
const users = await sql`
  SELECT * FROM users
  WHERE email = ${userInput}
  AND status = ${status}
`;
```

### Unsafe Queries (Use Sparingly)

```typescript
// ⚠️ Only use unsafe for trusted input or admin operations
const columns = ['id', 'name', 'email']; // Trusted, not user input
const users = await sql.unsafe(
  `SELECT ${columns.join(', ')} FROM users`,
  [] // No parameters for this example
);
```

### Input Validation

```typescript
function validateTableName(tableName: string): boolean {
  const allowedTables = ['users', 'products', 'orders'];
  return allowedTables.includes(tableName);
}

// Safe dynamic table selection
const tableName = 'users'; // From validated input
if (validateTableName(tableName)) {
  const data = await sql.unsafe(`SELECT * FROM ${tableName}`, []);
}
```

## 🚀 Production Deployment

### Environment Variables

```bash
# Production PostgreSQL
DATABASE_URL="postgres://prod_user:secure_pass@db.example.com:5432/app_db"

# Connection pool settings (if supported)
DATABASE_POOL_SIZE=10
DATABASE_POOL_TIMEOUT=30000
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    await sql`SELECT 1 as health_check`;
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});
```

### Monitoring

```typescript
// Query performance monitoring
const originalQuery = sql.query;
sql.query = async function(query, ...args) {
  const start = performance.now();
  try {
    const result = await originalQuery.call(this, query, ...args);
    const duration = performance.now() - start;

    // Log slow queries
    if (duration > 1000) {
      console.log(`Slow query (${duration.toFixed(2)}ms):`, query);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`Failed query (${duration.toFixed(2)}ms):`, query, error);
    throw error;
  }
};
```

## 📚 API Reference

### SQL Constructor

```typescript
new SQL(connectionString?: string): SQLInstance
```

### Query Methods

```typescript
// Tagged template literal (safe)
sql`SELECT * FROM users WHERE id = ${id}`: Promise<Result[]>

// Unsafe raw queries
sql.unsafe(query: string, params?: any[]): Promise<Result[]>

// Lazy execution
sql`SELECT * FROM users`.execute(): ExecutingQuery

// Transactions
sql.begin(callback: (tx: SQL) => Promise<void>): Promise<void>
```

### ExecutingQuery Methods

```typescript
// Cancel execution
executingQuery.cancel(): void

// Wait for completion
await executingQuery: Result[]
```

## 🎉 Conclusion

Bun's SQL API provides a powerful, safe, and performant interface for database operations with:

- **Automatic database detection** from connection URLs
- **Safe parameterized queries** via tagged template literals
- **Unsafe raw queries** for complex operations (use with caution)
- **Lazy execution** with cancellation support
- **Transaction support** with automatic rollback
- **Environment variable configuration** for different databases
- **Connection pooling** and performance optimizations

This implementation showcases the full capabilities of Bun's SQL API in a production-ready dashboard application.