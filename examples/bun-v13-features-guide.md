# Bun v1.3 Release Notes & Features Guide

> Comprehensive overview of Bun v1.3 enhancements, performance improvements, and new features

Bun v1.3 introduces significant enhancements across the entire runtime, including improved async stack traces, performance optimizations, database enhancements, and better Node.js compatibility.

## Async Stack Traces

Bun's stack traces now include asynchronous call frames, making debugging async/await code significantly easier.

```typescript
async function foo() {
  return await bar();
}

async function bar() {
  return await baz();
}

async function baz() {
  await 1; // ensure it's a real async function
  throw new Error("oops");
}

try {
  await foo();
} catch (e) {
  console.log(e);
}
```

**Bun v1.3 output:**
```
 6 |   return await baz();
 7 | }
 8 |
 9 | async function baz() {
10 |   await 1; // ensure it's a real async function
11 |   throw new Error("oops");
                 ^
error: oops
      at baz (async.js:11:13)
      at async bar (async.js:6:16)
      at async foo (async.js:2:16)
```

**Previous versions:**
```
 6 |   return await baz();
 7 | }
 8 |
 9 | async function baz() {
10 |   await 1; // ensure it's a real async function
11 |   throw new Error("oops");
             ^
error: oops
      at baz (async.js:11:9)
```

## Performance Optimizations

### 240x Faster postMessage and structuredClone

A new fast path for `postMessage` and `structuredClone` when dealing with "simple" objects containing only primitive values.

```typescript
// These operations are now significantly faster
const simpleObject = { name: "John", age: 30, active: true };
worker.postMessage(simpleObject);

const cloned = structuredClone(simpleObject);
```

### Bun.YAML.stringify

Support for serializing JavaScript objects to YAML format.

```typescript
import { YAML } from "bun";

const data = {
  name: "John",
  age: 30,
  hobbies: ["reading", "coding"],
  address: {
    street: "123 Main St",
    city: "Anytown"
  }
};

const yamlString = YAML.stringify(data);
console.log(yamlString);
// Output:
// name: John
// age: 30
// hobbies:
//   - reading
//   - coding
// address:
//   street: 123 Main St
//   city: Anytown
```

## TTY Support Improvements

### Interactive TTYs After stdin Closes

Fixed support for TUI applications that process piped data then open `/dev/tty` for interactive input.

```typescript
import { createReadStream } from "fs";
import { stdin, stdout } from "process";

// 1. Process any data piped from stdin
for await (const chunk of stdin) {
  stdout.write(`Piped data: ${chunk}`);
}

// 2. After stdin closes, open /dev/tty for interactive input
stdout.write(
  "stdin closed. Now accepting interactive input (type 'exit' to quit):\n"
);
const tty = createReadStream("/dev/tty");

for await (const chunk of tty) {
  const line = chunk.toString().trim();
  stdout.write(`You typed: "${line}"\n`);
  if (line === "exit") {
    tty.destroy();
  }
}
```

**Usage:**
```bash
echo "Initial data" | bun script.js
```

## Bun.SQL Enhancements

### MySQL Adapter Improvements

#### affectedRows and lastInsertRowid

```typescript
import { sql } from "bun";

// For INSERT queries
const insertResult = await sql`INSERT INTO users (name) VALUES ('John Doe');`;
console.log(insertResult.lastInsertRowid); // e.g., 1
console.log(insertResult.affectedRows); // 1

// For UPDATE queries
const updateResult =
  await sql`UPDATE users SET name = 'Jane Doe' WHERE id = 1;`;
console.log(updateResult.affectedRows); // 1
```

#### Better Column Type Handling

| MySQL Type | JavaScript Type | Notes |
|------------|-----------------|-------|
| INT, TINYINT, MEDIUMINT | number | Within safe integer range |
| BIT(1) | boolean | |
| BIT(N) where N > 1 | number | Previously incorrectly parsed |

#### TLS Support

```typescript
const db = new SQL("mysql://user:pass@localhost/db", {
  tls: {
    rejectUnauthorized: true,
    ca: Bun.file('./certs/ca.pem'),
    cert: Bun.file('./certs/client.crt'),
    key: Bun.file('./certs/client.key'),
  }
});
```

#### mysql_native_password Authentication

Automatic handling of `mysql_native_password` authentication and switching.

### PostgreSQL Improvements

#### Simple Query Protocol

```typescript
// Multi-statement queries
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

```typescript
const db = new SQL({
  prepare: false, // Disable prepared statements
});
```

#### Unix Domain Socket Connections

```typescript
await using db = new SQL({
  path: "/tmp/.s.PGSQL.5432",
  user: "postgres",
  password: "postgres",
  database: "mydb"
});
```

#### Runtime Configuration

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

#### PostgreSQL Array Support

```typescript
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

## Bundler & Minifier Improvements

### Minifier Optimizations

#### New Expressions Optimization

```typescript
// Input
const obj = new Object();
const arr = new Array(1, 2, 3);
const err = new Error("Something went wrong");

// Minified output
const obj = {};
const arr = [1, 2, 3];
const err = Error("Something went wrong");
```

#### typeof undefined Checks

```typescript
// Input
console.log(typeof x === "undefined");
console.log(typeof x !== "undefined");

// Minified output
console.log(typeof x > "u");
console.log(typeof x < "u");
```

### Plugin API Enhancements

#### onEnd Hook

```typescript
await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./out",
  plugins: [
    {
      name: "onEnd example",
      setup(build) {
        build.onEnd((result) => {
          if (result.success) {
            console.log(
              `✅ Build succeeded with ${result.outputs.length} outputs`,
            );
          } else {
            console.error(`❌ Build failed with ${result.logs.length} errors`);
          }
        });
      },
    },
  ],
});
```

#### jsxSideEffects Option

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsxSideEffects": true
  }
}
```

```typescript
// This side effect will now be preserved
let counter = 0;
function MyComponent() {
  counter++; // Side effect preserved
  return <div>Hello</div>;
}
```

### Unused Names Removal

```typescript
// Input
const myFunc = function myInternalName() {
  // "myInternalName" is not used anywhere
};

const myClass = class MyInternalClass {
  // "MyInternalClass" is not used anywhere
};

// After `bun build --minify`:
// const myFunc = function() {};
// const myClass = class {};

// To preserve names: `bun build --minify --keep-names`
```

## Performance Monitoring

### Event Loop Delay Monitoring

```typescript
import { monitorEventLoopDelay } from "perf_hooks";

const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

// Introduce a delay
await Bun.sleep(100);

histogram.disable();

console.log("Event Loop Delay (ns):");
console.log("Min:", histogram.min);
console.log("Max:", histogram.max);
console.log("Mean:", histogram.mean);
console.log("50th Percentile:", histogram.percentile(50));
console.log("99th Percentile:", histogram.percentile(99));

// Reset for next measurement
histogram.reset();
```

## HTTP Server Enhancements

### closeIdleConnections()

```typescript
import { createServer } from "http";

const server = createServer((req, res) => {
  res.end("Hello, World!");
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");

  // On shutdown signal
  process.on("SIGINT", () => {
    console.log("Closing server...");

    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log("Server closed.");
    });

    // Forcefully close any idle keep-alive connections
    server.closeIdleConnections();
  });
});
```

## CLI Enhancements

### Workspace Support

```bash
bun run --workspaces <script>
```

## WebSocket Improvements

### RFC 6455 Compliant Subprotocol Negotiation

```typescript
// Server
Bun.serve({
  port: 3000,
  fetch(req, server) {
    const success = server.upgrade(req, {
      headers: {
        "Sec-WebSocket-Protocol": "chat",
      },
    });
    return success ? undefined : new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    open(ws) {
      console.log(`Server: new connection with protocol "${ws.protocol}"`);
    },
  },
});

// Client
const ws = new WebSocket("ws://localhost:3000", ["chat", "superchat"]);

ws.onopen = () => {
  console.log(`Client: connected with protocol "${ws.protocol}"`); // "chat"
  ws.close();
};
```

### Override Special Headers

```typescript
const ws = new WebSocket("ws://localhost:8080", {
  headers: {
    "Host": "custom-host.example.com",
    "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
    "Sec-WebSocket-Protocol": "chat, superchat",
    "X-Custom-Header": "MyValue",
  },
});
```

## Redis Client Enhancements

### Database Selection in URL

```typescript
import { RedisClient } from "bun";

// Connect to database #2
const client = new RedisClient("redis://localhost:6379/2");

// Set a key in DB 2
await client.set("foo", "bar");
console.log(await client.get("foo")); // "bar"

// Connect to the default database #0
const defaultClient = new RedisClient("redis://localhost:6379/0");

// The key "foo" will not be found in DB 0
console.log(await defaultClient.get("foo")); // null
```

### HGET Support

```typescript
import { redis } from "bun";

// Old way: returns an array
const [value] = await redis.hmget("my-hash", "my-field");

// New way: returns the value directly (2x faster)
const value = await redis.hget("my-hash", "my-field");
```

## Node.js Compatibility Improvements

### Child Process Fixes

```typescript
// Fixed: RangeError in child_process.spawnSync with stdio options
import { spawnSync } from "child_process";

const result = spawnSync("ls", ["-la"], {
  stdio: [process.stdin, process.stdout, process.stderr]
});
```

### Network Module Fixes

```typescript
// Fixed: socket.write() with Uint8Array
import { createConnection } from "net";

const socket = createConnection({ port: 3000 });
socket.write(new Uint8Array([1, 2, 3, 4])); // Now works correctly
```

### Crypto Module Fixes

```typescript
// Fixed: crypto.verify() with null/undefined algorithm
import { verify } from "crypto";

const result = verify(null, data, publicKey, signature); // Defaults to SHA256
```

### N-API Improvements

- Fixed `napi_strict_equals` to use `===` instead of `Object.is`
- Fixed `napi_call_function` crash with null `this` value
- Fixed `napi_create_array_with_length` with negative/oversized lengths

### HTTP/2 Module Fixes

```typescript
// Fixed: util.promisify(http2.connect)
import { promisify } from "util";
import { connect } from "http2";

const connectAsync = promisify(connect);
const session = await connectAsync("https://example.com");
```

### Child Process Property Enumeration

```typescript
// Fixed: stdin, stdout, stderr, stdio are now enumerable
import { spawn } from "child_process";

const child = spawn("ls", ["-la"]);
// These properties are now enumerable for Object.assign compatibility
console.log(Object.keys(child)); // includes 'stdin', 'stdout', 'stderr', 'stdio'
```

## JavaScript Runtime Improvements

### YAML.parse Enhanced Input Support

```typescript
import { YAML } from "bun";

// Now accepts various input types
const yamlString = "name: John\nage: 30";
const buffer = Buffer.from(yamlString);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const uint8Array = new Uint8Array(arrayBuffer);
const blob = new Blob([yamlString]);

// All of these work:
const data1 = YAML.parse(yamlString);
const data2 = YAML.parse(buffer);
const data3 = YAML.parse(arrayBuffer);
const data4 = YAML.parse(uint8Array);
const data5 = YAML.parse(blob);
```

### Cookie API Fixes

```typescript
// Fixed: Bun.Cookie.isExpired() with Unix epoch dates
import { Cookie } from "bun";

const expiredCookie = new Cookie("session=abc; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
console.log(expiredCookie.isExpired()); // true
```

### Crypto API Fixes

```typescript
// Fixed: crypto.subtle.importKey with CRT parameters
import { webcrypto } from "crypto";

const key = await webcrypto.subtle.importKey(
  "pkcs8",
  privateKeyData,
  { name: "RSA-PSS", hash: "SHA-256" },
  false,
  ["sign"]
);
```

### Fetch API Fixes

```typescript
// Fixed: Large request bodies with HTTP proxies
const largeData = new Uint8Array(1024 * 1024); // 1MB
await fetch("https://api.example.com/upload", {
  method: "POST",
  body: largeData,
  proxy: "http://proxy.company.com:8080"
});
```

### HTMLRewriter Improvements

```typescript
// Fixed: Error propagation in handlers
const rewriter = new HTMLRewriter()
  .on("div", {
    element(element) {
      // Errors now propagate correctly
      if (element.getAttribute("class") === "error") {
        throw new Error("Invalid element");
      }
    }
  });

// Fixed: Reliability improvements
try {
  const result = await rewriter.transform(response);
} catch (error) {
  console.error("HTML rewriting failed:", error);
}
```

### Structured Clone Fixes

```typescript
// Fixed: Cloning nested objects with Blob/File
const nested = {
  data: {
    file: new File(["content"], "test.txt"),
    blob: new Blob(["data"]),
    array: [1, 2, { nested: true }]
  }
};

const cloned = structuredClone(nested);
// Now works correctly and preserves File.name property
```

### WebSocket Error Handling

```typescript
// Fixed: Error event emitted before close event
const ws = new WebSocket("ws://invalid-host");

ws.onerror = (error) => {
  console.log("Error event fired first:", error);
};

ws.onclose = (event) => {
  console.log("Close event fired second:", event.code, event.reason);
};
```

## Version Information

```typescript
// Improved version reporting
console.log(process.versions);
// Now shows semantic versions for zlib and libdeflate
```

## Watch Mode Improvements

```typescript
// Fixed: Crash when files are deleted during watch
// Fixed: Incorrect handling of swap files
bun --watch run dev.ts
```

## Bun.SQL Bug Fixes

### Connection String Parsing

```typescript
// Fixed: DATABASE_URL options precedence
const db = new SQL("postgres://user:pass@host:5432/db?sslmode=require");
// Options now take precedence correctly
```

### Connection Cleanup

```typescript
// Fixed: Potential crash when closing MySQL/PostgreSQL connections
await db.close(); // Now safe
```

## Migration Guide

### From Previous Bun Versions

#### Async Stack Traces
- No code changes needed - improved debugging automatically available

#### Database Enhancements
```typescript
// Before: Limited MySQL support
// After: Full MySQL adapter with TLS, auth switching
const db = new SQL("mysql://user:pass@host/db", {
  tls: { rejectUnauthorized: true }
});
```

#### Performance Improvements
- `postMessage` and `structuredClone` automatically faster for simple objects
- No code changes required

#### WebSocket Compliance
```typescript
// Before: Limited subprotocol support
// After: Full RFC 6455 compliance
const ws = new WebSocket(url, ["chat", "superchat"]);
console.log(ws.protocol); // Now correctly populated
```

#### Redis Enhancements
```typescript
// Before: Manual database selection
// After: URL-based database selection
const client = new RedisClient("redis://localhost:6379/2");
// Automatically connects to database 2
```

This guide covers the major enhancements and improvements in Bun v1.3, focusing on performance, compatibility, and developer experience improvements.