# Bun Runtime API Guide

> Complete reference for Bun's runtime APIs including Bun.serve, Bun.file, Bun.write, and more

Bun provides a rich set of runtime APIs that enhance and extend JavaScript's capabilities. This guide covers the most important runtime APIs that developers use daily.

## Bun.serve() - HTTP Server

Bun's native HTTP server is built on web standards and provides exceptional performance.

### Basic HTTP Server

```typescript
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello World!");
  },
});

console.log(`Server running at http://localhost:${server.port}`);
```

### Advanced Server Configuration

```typescript
const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0", // Listen on all interfaces
  development: true,    // Development mode with hot reload

  // Request handler
  async fetch(request) {
    const url = new URL(request.url);

    // Routing
    if (url.pathname === "/api/users") {
      return Response.json({ users: [] });
    }

    if (url.pathname === "/api/health") {
      return new Response("OK", { status: 200 });
    }

    // Static file serving
    if (url.pathname.startsWith("/static/")) {
      return new Response(Bun.file(url.pathname.slice(8)));
    }

    return new Response("Not Found", { status: 404 });
  },

  // Error handler
  error(error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  },
});
```

### WebSocket Support

```typescript
const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    // Upgrade to WebSocket
    if (server.upgrade(req)) {
      return; // WebSocket upgrade handled
    }
    return new Response("WebSocket upgrade failed", { status: 400 });
  },

  websocket: {
    open(ws) {
      console.log("WebSocket opened");
      ws.send("Welcome!");
    },

    message(ws, message) {
      console.log("Received:", message);
      ws.send(`Echo: ${message}`);
    },

    close(ws, code, reason) {
      console.log("WebSocket closed", code, reason);
    },
  },
});
```

## Bun.file() - File System Operations

Bun provides fast, synchronous file operations with automatic streaming for large files.

### Reading Files

```typescript
// Read entire file as string
const text = await Bun.file("package.json").text();
console.log(text);

// Read as JSON (automatic parsing)
const packageJson = await Bun.file("package.json").json();
console.log(packageJson.name);

// Read as ArrayBuffer
const buffer = await Bun.file("image.png").arrayBuffer();

// Read as Uint8Array
const bytes = await Bun.file("data.bin").bytes();

// Stream large files
const stream = Bun.file("large-file.mp4").stream();
const response = new Response(stream);
```

### Writing Files

```typescript
// Write string
await Bun.write("output.txt", "Hello World!");

// Write JSON (automatic stringify)
await Bun.write("data.json", { name: "Bun", version: "1.0.0" });

// Write binary data
const buffer = new Uint8Array([1, 2, 3, 4, 5]);
await Bun.write("binary.dat", buffer);

// Write from Response
const response = await fetch("https://api.example.com/data");
await Bun.write("cached-data.json", response);
```

### File Information

```typescript
const file = Bun.file("package.json");

// Check if file exists
const exists = await file.exists();
console.log("File exists:", exists);

// Get file size
const size = file.size;
console.log("File size:", size, "bytes");

// Get last modified time
const lastModified = file.lastModified;
console.log("Last modified:", new Date(lastModified));
```

## Bun.write() - Universal Writing

Bun.write() can write to files, stdout, stderr, and more.

```typescript
// Write to file
await Bun.write("output.txt", "Hello File!");

// Write to stdout
await Bun.write(Bun.stdout, "Hello stdout!\n");

// Write to stderr
await Bun.write(Bun.stderr, "Hello stderr!\n");

// Write to WebSocket
const ws = new WebSocket("ws://localhost:3000");
await Bun.write(ws, "Hello WebSocket!");

// Write to Response (server-side)
const response = new Response("Hello World!");
await Bun.write(response, "Updated content");
```

## Environment & Configuration

### Environment Variables

```typescript
// Read environment variables
const port = process.env.PORT || "3000";
const nodeEnv = process.env.NODE_ENV || "development";

// Bun-specific environment detection
const isDevelopment = Bun.env.NODE_ENV === "development";
const isProduction = Bun.env.NODE_ENV === "production";
```

### bunfig.toml Configuration

```toml
# bunfig.toml
[install]
# Package manager settings
registry = "https://registry.npmjs.org"
saveTextLockfile = true

[build]
# Build settings
outdir = "dist"
minify = true

[run]
# Runtime settings
hot = true
port = "3000"
```

## SQLite Database

Bun includes built-in SQLite support for fast, file-based databases.

```typescript
import { Database } from "bun:sqlite";

// Create/open database
const db = new Database("app.db");

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert data
const insert = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
insert.run("John Doe", "john@example.com");

// Query data
const select = db.prepare("SELECT * FROM users WHERE name = ?");
const user = select.get("John Doe");
console.log(user);

// Query multiple rows
const allUsers = db.query("SELECT * FROM users").all();
console.log(allUsers);

// Transactions
const transaction = db.transaction(() => {
  db.prepare("INSERT INTO users (name, email) VALUES (?, ?)").run("Jane Doe", "jane@example.com");
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run("Jane Updated", 1);
});

// Close database
db.close();
```

## Web APIs & Fetch

Bun enhances web APIs with better performance and additional features.

### Enhanced Fetch

```typescript
// Basic fetch
const response = await fetch("https://api.example.com/data");
const data = await response.json();

// Fetch with timeout
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch("https://api.example.com/slow-endpoint", {
    signal: controller.signal,
  });
  const data = await response.json();
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request timed out");
  }
}

// Parallel requests
const [users, posts] = await Promise.all([
  fetch("https://api.example.com/users").then(r => r.json()),
  fetch("https://api.example.com/posts").then(r => r.json()),
]);
```

### Web Crypto

```typescript
// Generate random bytes
const randomBytes = new Uint8Array(32);
crypto.getRandomValues(randomBytes);

// Hash data
const encoder = new TextEncoder();
const data = encoder.encode("Hello World");
const hash = await crypto.subtle.digest("SHA-256", data);
console.log(new Uint8Array(hash));

// HMAC signing
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode("secret-key"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"]
);

const signature = await crypto.subtle.sign("HMAC", key, data);
```

## Bun.secrets - Environment Secrets Management

Bun provides a secure way to access environment variables and secrets with type safety and validation.

### Basic Usage

```typescript
// Access environment variables
const port = Bun.env.PORT || "3000";
const apiKey = Bun.env.API_KEY;

// Type-safe access with defaults
const config = {
  port: parseInt(Bun.env.PORT || "3000"),
  databaseUrl: Bun.env.DATABASE_URL,
  debug: Bun.env.NODE_ENV === "development",
};
```

### Secrets Management

```typescript
// Environment-based secrets (recommended for most use cases)
const apiKey = Bun.env.OPENAI_API_KEY;
const dbPassword = Bun.env.DATABASE_PASSWORD;

// With fallback values
const apiKey = Bun.env.API_KEY || "fallback-key";

// Type-safe environment access
interface AppConfig {
  openaiApiKey: string;
  databaseUrl: string;
  jwtSecret: string;
  port: number;
}

const config: AppConfig = {
  openaiApiKey: Bun.env.OPENAI_API_KEY!,
  databaseUrl: Bun.env.DATABASE_URL!,
  jwtSecret: Bun.env.JWT_SECRET!,
  port: parseInt(Bun.env.PORT || "3000"),
};
```

### Advanced Secrets API

```typescript
// Bun.secrets provides additional security features
// Note: Available in certain Bun environments
try {
  const secretKey = Bun.secrets.get("SECRET_KEY");
  console.log("Secret retrieved securely");
} catch (error) {
  console.log("Secrets API not available in this context");
  // Fall back to environment variables
  const secretKey = Bun.env.SECRET_KEY;
}
```

### API Integration Demo

```typescript
// Complete example: OpenAI API with environment variables
async function callOpenAI(prompt: string) {
  const apiKey = Bun.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not found in environment");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Usage
const result = await callOpenAI("Explain Bun's environment API in one sentence");
console.log(result);
```

### Environment File Integration

```bash
# .env file
OPENAI_API_KEY=sk-your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-jwt-secret

# Load with Bun
bun run --env-file=.env your-script.ts
```

### Security Best Practices

```typescript
// Validate required secrets at startup
function validateSecrets() {
  const required = ["API_KEY", "DATABASE_URL", "JWT_SECRET"];

  for (const secret of required) {
    if (!Bun.secrets.get(secret)) {
      throw new Error(`Required secret ${secret} is not set`);
    }
  }
}

// Call at application start
validateSecrets();

console.log("✅ All required secrets are available");
```

### Runtime vs Build-time Secrets

```typescript
// Runtime secrets (available during execution)
const runtimeSecret = Bun.secrets.get("RUNTIME_SECRET");

// Build-time secrets (replaced during bundling)
// Note: These are embedded in the bundle
const buildTimeSecret = process.env.BUILD_TIME_SECRET;

// For production, prefer runtime secrets
const config = {
  // ✅ Good: Runtime secret
  apiKey: Bun.secrets.get("API_KEY"),

  // ⚠️  Careful: Embedded in bundle
  publicKey: process.env.PUBLIC_KEY,

  // ✅ Good: Environment-specific
  debug: Bun.env.NODE_ENV === "development",
};
```

## Process & System APIs

### Process Information

```typescript
// Process ID
console.log("PID:", process.pid);
console.log("Parent PID:", process.ppid);

// Platform information
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);

// Memory usage
const memUsage = process.memoryUsage();
console.log("RSS:", memUsage.rss);
console.log("Heap Used:", memUsage.heapUsed);
console.log("Heap Total:", memUsage.heapTotal);
```

### Spawning Processes

```typescript
// Run a command
const proc = Bun.spawn(["ls", "-la"], {
  cwd: "/tmp",
  env: { CUSTOM_VAR: "value" },
});

// Get output
const output = await new Response(proc.stdout).text();
console.log("Output:", output);

// Wait for completion
await proc.exited;
console.log("Exit code:", proc.exitCode);
```

## Performance Tips

### File Operations
- Use `Bun.file()` for reading - it's optimized for Bun's runtime
- For large files, use streaming: `Bun.file(path).stream()`
- Prefer `Bun.write()` over Node.js `fs.writeFile()` for better performance

### HTTP Server
- Use `Bun.serve()` instead of Express for maximum performance
- Enable compression for text responses
- Use WebSockets for real-time features

### Database
- Use prepared statements for repeated queries
- Enable WAL mode for concurrent reads/writes
- Close database connections when done

### General
- Use top-level await in scripts (no wrapper function needed)
- Leverage Bun's fast transpilation for development
- Use `bun --hot` for development with hot reload

This guide covers the core Bun runtime APIs. For more advanced usage, check the specific guides for bundling, testing, and deployment.