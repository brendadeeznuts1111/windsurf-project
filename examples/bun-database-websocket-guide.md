# Bun Database & WebSocket Enhancements Guide

> Comprehensive guide to Bun 1.3's database APIs and WebSocket improvements

Bun 1.3 introduces powerful enhancements to database connectivity and WebSocket support, providing unified APIs for multiple database systems and improved real-time communication capabilities.

## Bun.SQL - Unified Database API

Bun.SQL provides a unified, high-performance API for MySQL, MariaDB, PostgreSQL, and SQLite with zero external dependencies.

### Connecting to Databases

```typescript
import { sql, SQL } from "bun";

// Connect to different database types with the same API
const postgres = new SQL("postgres://localhost/mydb");
const mysql = new SQL("mysql://localhost/mydb");
const sqlite = new SQL("sqlite://data.db");

// Use environment variables (defaults to PostgreSQL if DATABASE_URL is set)
const db = sql; // Uses process.env.DATABASE_URL

// Query with automatic parameterization
const seniorAge = 65;
const seniorUsers = await sql`
  SELECT name, age FROM users
  WHERE age >= ${seniorAge}
`;

console.log(seniorUsers);
```

### PostgreSQL Array Support

Bun 1.3 adds comprehensive PostgreSQL array type support with the `sql.array` helper:

```typescript
import { sql } from "bun";

// Insert arrays into PostgreSQL array columns
await sql`
  INSERT INTO users (name, roles)
  VALUES (${"Alice"}, ${sql.array(["admin", "user"], "TEXT")})
`;

// Update with array values
await sql`
  UPDATE users
  SET ${sql({
    name: "Bob",
    roles: sql.array(["moderator", "user"], "TEXT"),
  })}
  WHERE id = ${userId}
`;

// JSON/JSONB arrays
const jsonData = await sql`
  SELECT ${sql.array([{ a: 1 }, { b: 2 }], "JSONB")} as data
`;

// Various PostgreSQL types
await sql`SELECT ${sql.array([1, 2, 3], "INTEGER")} as numbers`;
await sql`SELECT ${sql.array([true, false], "BOOLEAN")} as flags`;
await sql`SELECT ${sql.array([new Date()], "TIMESTAMP")} as dates`;
await sql`SELECT ${sql.array(["uuid1", "uuid2"], "UUID")} as ids`;
```

### PostgreSQL Enhancements

#### Simple Query Protocol

Execute multiple statements in a single query using the simple query protocol:

```typescript
// Multi-statement queries
await sql`
  SELECT 1;
  SELECT 2;
`.simple();

// Database migrations
await sql`
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  );

  CREATE INDEX idx_users_email ON users(email);

  INSERT INTO users (name, email)
  VALUES ('Admin', 'admin@example.com');
`.simple();
```

#### Disable Prepared Statements

Useful for PGBouncer in transaction mode or debugging query execution plans:

```typescript
const db = new SQL({
  prepare: false, // Disable prepared statements
});

// All queries now use simple protocol
const users = await db`SELECT * FROM users`;
```

#### Unix Domain Socket Connections

Connect via Unix domain sockets for better performance on the same machine:

```typescript
await using db = new SQL({
  path: "/tmp/.s.PGSQL.5432",  // Full path to socket
  user: "postgres",
  password: "postgres",
  database: "mydb"
});
```

#### Runtime Configuration

Set PostgreSQL runtime parameters via connection options:

```typescript
// Via URL
await using db = new SQL(
  "postgres://user:pass@localhost:5432/mydb?search_path=information_schema",
  { max: 1 }
);

// Via connection object
await using db = new SQL("postgres://user:pass@localhost:5432/mydb", {
  connection: {
    search_path: "information_schema",
    statement_timeout: "30s",
    application_name: "my_app"
  },
  max: 1
});
```

#### Dynamic Column Operations

Powerful helpers for building dynamic SQL queries:

```typescript
const user = { name: "Alice", email: "alice@example.com", age: 30 };

// Insert only specific columns
await sql`INSERT INTO users ${sql(user, "name", "email")}`;

// Update specific fields
const updates = { name: "Alice Smith", email: "alice.smith@example.com" };
await sql`UPDATE users SET ${sql(
  updates,
  "name",
  "email",
)} WHERE id = ${userId}`;

// WHERE IN with arrays
await sql`SELECT * FROM users WHERE id IN ${sql([1, 2, 3])}`;

// Extract field from array of objects
const users = [{ id: 1 }, { id: 2 }, { id: 3 }];
await sql`SELECT * FROM orders WHERE user_id IN ${sql(users, "id")}`;
```

#### Proper Null Handling in Arrays

Bun 1.3 correctly preserves null values in array results:

```typescript
const result = await sql`SELECT ARRAY[0, 1, 2, NULL]::integer[]`;
console.log(result[0].array); // [0, 1, 2, null]
```

### SQLite Enhancements

#### Database Deserialization with Options

When deserializing SQLite databases, specify additional options:

```typescript
import { Database } from "bun:sqlite";

const serialized = db.serialize();

const deserialized = Database.deserialize(serialized, {
  readonly: true,     // Open in read-only mode
  strict: true,       // Enable strict mode
  safeIntegers: true, // Return BigInt for large integers
});
```

#### Column Type Introspection

Statement objects now expose type information about result columns:

```typescript
import { Database } from "bun:sqlite";

const db = new Database(":memory:");
db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)");
db.run("INSERT INTO users VALUES (1, 'Alice', 30)");

const stmt = db.query("SELECT * FROM users");

// Get declared types from the schema
console.log(stmt.declaredTypes); // ["INTEGER", "TEXT", "INTEGER"]

// Get actual types from values
console.log(stmt.columnTypes); // ["integer", "text", "integer"]

const row = stmt.get();
```

## Built-in Redis Client

Bun 1.3 introduces first-class Redis (and Valkey) support with exceptional performance.

### Basic Usage

```typescript
import { redis, RedisClient } from "bun";

// Connects to process.env.REDIS_URL or localhost:6379 if not set
await redis.set("foo", "bar");
const value = await redis.get("foo");
console.log(value); // "bar"

console.log(await redis.ttl("foo")); // -1 (no expiration set)
```

### Advanced Operations

```typescript
// Hashes
await redis.hset("user:123", "name", "Alice");
await redis.hset("user:123", "age", "30");
const user = await redis.hgetall("user:123");
console.log(user); // { name: "Alice", age: "30" }

// Lists
await redis.lpush("messages", "Hello");
await redis.lpush("messages", "World");
const messages = await redis.lrange("messages", 0, -1);
console.log(messages); // ["World", "Hello"]

// Sets
await redis.sadd("tags", "javascript", "typescript", "bun");
const tags = await redis.smembers("tags");
console.log(tags); // ["javascript", "typescript", "bun"]
```

### Pub/Sub Messaging

```typescript
import { RedisClient } from "bun";

// Create dedicated clients for pub/sub
const subscriber = new RedisClient("redis://localhost:6379");
const publisher = await subscriber.duplicate();

// Subscribe to channels
await subscriber.subscribe("notifications", (message, channel) => {
  console.log(`Received on ${channel}:`, message);
});

// Publish messages
await publisher.publish("notifications", "Hello from Bun!");

// Pattern subscriptions
await subscriber.psubscribe("user:*", (message, channel, pattern) => {
  console.log(`Pattern ${pattern} matched ${channel}:`, message);
});
```

### Connection Management

```typescript
// Custom connection options
const redis = new RedisClient({
  url: "redis://localhost:6379",
  password: "mypassword",
  database: 1,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: null, // Disable retries
});

// Connection pooling
const pool = new RedisConnectionPool({
  minConnections: 2,
  maxConnections: 10,
  acquireTimeoutMs: 60000,
});

// Use pooled connections
const client = await pool.acquire();
await client.set("key", "value");
pool.release(client);
```

### Performance Features

```typescript
// Pipelining for multiple commands
const pipeline = redis.pipeline();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.get("key1");
pipeline.get("key2");

const results = await pipeline.exec();
console.log(results); // Array of command results

// Transactions
const transaction = redis.multi();
transaction.set("key1", "value1");
transaction.set("key2", "value2");
transaction.get("key1");

const results = await transaction.exec();
```

## WebSocket Improvements

Bun 1.3 brings significant enhancements to WebSocket support with better standards compliance and performance.

### RFC 6455 Compliant Subprotocol Negotiation

WebSocket clients now properly implement subprotocol negotiation:

```typescript
// Specify preferred subprotocols
const ws = new WebSocket("ws://localhost:3000", ["chat", "superchat"]);

ws.onopen = () => {
  console.log(`Connected with protocol: ${ws.protocol}`); // "chat"
};

// Server-side subprotocol selection
const server = Bun.serve({
  websocket: {
    open(ws) {
      // ws.protocol contains the negotiated subprotocol
      console.log(`Client connected with protocol: ${ws.protocol}`);
    },
  },
});
```

### Override Special WebSocket Headers

Override WebSocket handshake headers for proxy scenarios:

```typescript
const ws = new WebSocket("ws://localhost:8080", {
  headers: {
    "Host": "custom-host.example.com",
    "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
    "Sec-WebSocket-Protocol": "chat, superchat",
  },
});
```

### Automatic Permessage-Deflate Compression

Bun automatically negotiates and enables permessage-deflate compression:

```typescript
const ws = new WebSocket("wss://echo.websocket.org");

ws.onopen = () => {
  console.log("Extensions:", ws.extensions);
  // "permessage-deflate"
};

// Server-side compression support
const server = Bun.serve({
  websocket: {
    open(ws) {
      // Compression is automatically negotiated
      ws.send("Compressed message"); // Automatically compressed
    },
  },
});
```

### Enhanced WebSocket Server Features

```typescript
const server = Bun.serve({
  websocket: {
    // Connection limits
    maxConnections: 1000,

    // Message size limits
    maxMessageSize: 1024 * 1024, // 1MB

    // Backpressure handling
    backpressureLimit: 1024 * 1024, // 1MB

    // Per-connection message limits
    maxMessagesPerMinute: 100,

    open(ws) {
      console.log(`Connection opened: ${ws.remoteAddress}`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: "welcome",
        timestamp: Date.now(),
      }));
    },

    message(ws, message) {
      // Handle different message types
      if (typeof message === "string") {
        try {
          const data = JSON.parse(message);
          handleMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: "error",
            message: "Invalid JSON",
          }));
        }
      } else {
        // Binary message handling
        handleBinaryMessage(ws, message);
      }
    },

    close(ws, code, reason) {
      console.log(`Connection closed: ${code} ${reason}`);
    },

    drain(ws) {
      console.log("Backpressure relieved, resuming sends");
    },
  },
});
```

### WebSocket Client Enhancements

```typescript
// Enhanced client with automatic reconnection
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private url: string) {}

  connect() {
    this.ws = new WebSocket(this.url, {
      headers: {
        "Authorization": "Bearer token123",
      },
    });

    this.ws.onopen = () => {
      console.log("Connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = (event) => {
      console.log(`Disconnected: ${event.code} ${event.reason}`);
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting in ${this.reconnectDelay}ms...`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);

      this.reconnectDelay *= 2; // Exponential backoff
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close() {
    this.ws?.close();
  }
}
```

## Performance Benchmarks

### Database Performance

```typescript
// PostgreSQL benchmark
bench("Bun.SQL PostgreSQL insert", async () => {
  await sql`INSERT INTO users (name, email) VALUES (${"test"}, ${"test@example.com"})`;
});

bench("Bun.SQL PostgreSQL select", async () => {
  await sql`SELECT * FROM users WHERE id = ${1}`;
});

// SQLite benchmark
bench("Bun SQLite insert", () => {
  db.run("INSERT INTO users (name, email) VALUES (?, ?)", ["test", "test@example.com"]);
});

bench("Bun SQLite select", () => {
  db.query("SELECT * FROM users WHERE id = ?").get(1);
});

// Redis benchmark
bench("Bun Redis set/get", async () => {
  await redis.set("bench:key", "value");
  await redis.get("bench:key");
});
```

### WebSocket Performance

```typescript
bench("WebSocket message throughput", async () => {
  const messages = Array.from({ length: 1000 }, (_, i) => `Message ${i}`);

  const start = Bun.nanoseconds();

  for (const message of messages) {
    ws.send(message);
  }

  // Wait for all messages to be sent
  await new Promise(resolve => {
    let received = 0;
    ws.onmessage = () => {
      received++;
      if (received === messages.length) resolve();
    };
  });

  const duration = Bun.nanoseconds() - start;
  console.log(`Sent ${messages.length} messages in ${duration / 1e6}ms`);
});
```

## Migration Guide

### From postgres/mysql2 to Bun.SQL

```typescript
// Before (with npm packages)
import postgres from "postgres";
import mysql from "mysql2";

const pgClient = postgres("postgres://user:pass@localhost/db");
const mysqlClient = mysql.createConnection("mysql://user:pass@localhost/db");

// After (Bun.SQL)
import { SQL } from "bun";

const pgClient = new SQL("postgres://user:pass@localhost/db");
const mysqlClient = new SQL("mysql://user:pass@localhost/db");
```

### From ioredis to Bun Redis

```typescript
// Before (ioredis)
import Redis from "ioredis";

const redis = new Redis("redis://localhost:6379");

// After (Bun Redis)
import { RedisClient } from "bun";

const redis = new RedisClient("redis://localhost:6379");
```

## Best Practices

### Database Connections

1. **Use connection pooling** for high-throughput applications
2. **Close connections** when your application shuts down
3. **Handle connection errors** gracefully with retry logic
4. **Use prepared statements** for repeated queries
5. **Monitor connection health** with health checks

### WebSocket Usage

1. **Implement heartbeat/ping-pong** for connection health
2. **Handle backpressure** to prevent memory issues
3. **Use compression** for text-heavy messages
4. **Implement reconnection logic** for reliability
5. **Validate messages** before processing

### Performance Optimization

1. **Batch database operations** when possible
2. **Use appropriate indexes** on frequently queried columns
3. **Implement caching** with Redis for hot data
4. **Monitor query performance** and optimize slow queries
5. **Use connection pooling** to reduce connection overhead

This guide covers Bun 1.3's comprehensive database and WebSocket enhancements, providing production-ready APIs for modern web applications.