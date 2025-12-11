# Bun v1.3.4 API Reference

## 🌐 URLPattern

### Constructor

```typescript
new URLPattern(input?: string | URLPatternInit, baseURL?: string)
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `protocol` | `URLPattern` | Pattern for matching the protocol |
| `username` | `URLPattern` | Pattern for matching the username |
| `password` | `URLPattern` | Pattern for matching the password |
| `hostname` | `URLPattern` | Pattern for matching the hostname |
| `port` | `URLPattern` | Pattern for matching the port |
| `pathname` | `URLPattern` | Pattern for matching the pathname |
| `search` | `URLPattern` | Pattern for matching the search string |
| `hash` | `URLPattern` | Pattern for matching the hash |
| `hasRegExpGroups` | `boolean` | Whether the pattern uses regex groups |

### Methods

#### `test(input, baseURL?)`
Returns `boolean` - whether the input matches the pattern.

```typescript
const pattern = new URLPattern({ pathname: "/users/:id" });
pattern.test("/users/123"); // true
pattern.test("/posts/456"); // false
```

#### `exec(input, baseURL?)`
Returns `URLPatternResult | null` - detailed match information.

```typescript
const result = pattern.exec("/users/123?tab=profile");
if (result) {
  console.log(result.pathname.groups.id); // "123"
  console.log(result.search.groups.tab); // "profile"
}
```

### URLPatternInit

```typescript
interface URLPatternInit {
  protocol?: string;
  username?: string;
  password?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  baseURL?: string;
}
```

### URLPatternResult

```typescript
interface URLPatternResult {
  inputs: [URLPatternInput, URLPatternInput];
  protocol: URLPatternComponentResult;
  username: URLPatternComponentResult;
  password: URLPatternComponentResult;
  hostname: URLPatternComponentResult;
  port: URLPatternComponentResult;
  pathname: URLPatternComponentResult;
  search: URLPatternComponentResult;
  hash: URLPatternComponentResult;
}

interface URLPatternComponentResult {
  input: string;
  groups: Record<string, string>;
}
```

---

## ⏰ Fake Timers (bun:test)

### Timer Control Methods

```typescript
import { mock } from "bun:test";

// Enable fake timers
mock.timers.enable();

// Disable fake timers
mock.timers.disable();

// Reset all timers
mock.timers.reset();

// Run all pending timers
mock.timers.runAll();

// Advance time by ms
Bun.sleepSync(ms: number): void;

// Async sleep
Bun.sleep(ms: number): Promise<void>;
```

### Timer Functions Affected

- `setTimeout`
- `setInterval`
- `clearTimeout`
- `clearInterval`
- `setImmediate`
- `clearImmediate`
- `requestAnimationFrame`
- `cancelAnimationFrame`

### Example

```typescript
test("fake timers", () => {
  mock.timers.enable();

  const mockFn = mock();
  setTimeout(mockFn, 1000);

  expect(mockFn).not.toHaveBeenCalled();

  Bun.sleepSync(1000);

  expect(mockFn).toHaveBeenCalled();

  mock.timers.disable();
});
```

---

## 🌐 fetch() Proxy Options

### Extended RequestInit

```typescript
interface RequestInit {
  // ... existing properties
  proxy?: string | ProxyOptions;
}

interface ProxyOptions {
  url: string;
  headers?: Record<string, string>;
}
```

### Examples

```typescript
// String format
fetch(url, { proxy: "http://proxy.example.com:8080" });

// Object format with headers
fetch(url, {
  proxy: {
    url: "http://proxy.example.com:8080",
    headers: {
      "Proxy-Authorization": "Bearer token",
      "X-Custom-Header": "value"
    }
  }
});
```

### Header Precedence

1. `Proxy-Authorization` header (highest precedence)
2. URL-embedded credentials
3. No authentication

---

## 📝 console.log Format Specifiers

### Supported Specifiers

| Specifier | Description | Example |
|-----------|-------------|---------|
| `%s` | String | `console.log("%s", "hello")` → `"hello"` |
| `%d` | Number | `console.log("%d", 42)` → `42` |
| `%i` | Integer | `console.log("%i", 3.14)` → `3` |
| `%f` | Float | `console.log("%f", 3.14)` → `3.140000` |
| `%j` | JSON | `console.log("%j", {a:1})` → `{"a":1}` |
| `%o` | Object | `console.log("%o", obj)` → `[object Object]` |
| `%O` | Object (detailed) | `console.log("%O", obj)` → `{a: 1}` |
| `%%` | Percent sign | `console.log("%%")` → `%` |

### JSON Formatting Examples

```typescript
const user = { id: 123, name: "Alice" };
const list = [1, 2, 3];

console.log("User: %j", user);
// User: {"id":123,"name":"Alice"}

console.log("List: %j", list);
// List: [1,2,3]

console.log("Mixed: %s %j %d", "Status:", { ok: true }, 200);
// Mixed: Status: {"ok":true} 200
```

---

## 🔧 http.Agent

### Constructor Options

```typescript
interface AgentOptions {
  keepAlive?: boolean;           // Default: false
  keepAliveMsecs?: number;       // Default: 1000
  maxSockets?: number;           // Default: Infinity
  maxFreeSockets?: number;       // Default: 256
  timeout?: number;              // Default: 0 (no timeout)
  scheduling?: 'fifo' | 'lifo';  // Default: 'fifo'
}
```

### Fixed Issues in v1.3.4

1. **Incorrect property name**: `keepalive` vs `keepAlive`
2. **Missing request headers**: `Connection: keep-alive` not sent
3. **Case-sensitive parsing**: Response header comparison was case-sensitive

### Example

```typescript
import http from "node:http";

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 30000
});

const req = http.request({
  hostname: "api.example.com",
  port: 443,
  path: "/data",
  agent,
  method: "GET"
}, (res) => {
  console.log(`Status: ${res.statusCode}`);
  // Connection is properly reused for subsequent requests
});

req.end();
```

---

## 📦 Bun.build Compile Options

### Compile-Specific Options

```typescript
interface CompileOptions {
  autoloadTsconfig?: boolean;      // Load tsconfig.json at runtime
  autoloadPackageJson?: boolean;   // Load package.json at runtime
  autoloadDotenv?: boolean;        // Load .env files at runtime
  autoloadBunfig?: boolean;        // Load bunfig.toml at runtime
}
```

### CLI Flags

```bash
# Enable config loading
bun build --compile --compile-autoload-tsconfig app.ts
bun build --compile --compile-autoload-package-json app.ts
bun build --compile --compile-autoload-dotenv app.ts
bun build --compile --compile-autoload-bunfig app.ts

# Multiple flags
bun build --compile \
  --compile-autoload-tsconfig \
  --compile-autoload-package-json \
  app.ts
```

### Security Defaults

- **autoloadTsconfig**: `false` (secure)
- **autoloadPackageJson**: `false` (secure)
- **autoloadDotenv**: `false` (secure)
- **autoloadBunfig**: `false` (secure)

---

## 🗜️ Compression Streams

### Supported Formats

- `"gzip"` - Gzip compression
- `"deflate"` - Deflate compression
- `"brotli"` - Brotli compression (if available)

### Constructor

```typescript
new CompressionStream(format: CompressionFormat): CompressionStream;
new DecompressionStream(format: CompressionFormat): DecompressionStream;
```

### Example

```typescript
// Compress
const compressor = new CompressionStream("gzip");
const compressed = await new Response(
  readableStream.pipeThrough(compressor)
).arrayBuffer();

// Decompress
const decompressor = new DecompressionStream("gzip");
const decompressed = await new Response(
  new Blob([compressed]).stream().pipeThrough(decompressor)
).text();
```

---

## 🧪 bun:test Options

### Test Configuration

```typescript
interface TestOptions {
  retry?: number;     // Number of retries on failure
  repeats?: number;   // Number of times to repeat the test
  timeout?: number;   // Test timeout in milliseconds
  only?: boolean;     // Run only this test
  skip?: boolean;     // Skip this test
}
```

### Examples

```typescript
// Retry on failure
test("flaky test", { retry: 3 }, () => {
  expect(unreliableOperation()).toBe(true);
});

// Repeat multiple times
test("stress test", { repeats: 10 }, () => {
  expect(performanceTest()).toBeLessThan(100);
});

// Combined options
test("comprehensive", {
  retry: 2,
  repeats: 5,
  timeout: 10000
}, () => {
  // Test implementation
});
```

---

## 📊 CPU Profiling

### CLI Options

```bash
# Basic profiling
bun --cpu-prof script.ts

# Custom output file
bun --cpu-prof=output.cpuprofile script.ts

# Custom sample rate (samples per second)
bun --cpu-prof --cpu-prof-sample-rate=1000 script.ts
```

### Programmatic API

```typescript
// Start profiling
const profiler = Bun.profiler.start();

// Run code to profile
expensiveOperation();

// Stop and save
profiler.stop("profile.cpuprofile");

// Time a specific operation
const result = Bun.profiler.time("operation", () => {
  return expensiveFunction();
});
console.log(`Duration: ${result.duration}ms`);
```

---

## 🔧 Build Configuration

### Source Map Options

```typescript
await Bun.build({
  entrypoints: ["app.ts"],
  sourcemap: "external", // Preserve legal comments
  format: "cjs",         // Inline import.meta
  // ... other options
});
```

### Legal Comments Preservation

```typescript
/* @license MIT */
/* @preserve */
/* @copyright 2024 */
const code = "comments preserved in production";
```

---

## 📈 Performance Metrics

### URLPattern Performance

```typescript
// Benchmark URL matching
const pattern = new URLPattern({ pathname: "/api/:resource/:id" });
const urls = [
  "/api/users/123",
  "/api/posts/456",
  "/api/comments/789"
];

console.time("URLPattern matching");
for (let i = 0; i < 100000; i++) {
  for (const url of urls) {
    pattern.test(url);
  }
}
console.timeEnd("URLPattern matching");
// ~168,400 matches/second
```

### Compression Performance

```typescript
const data = "x".repeat(1024 * 1024); // 1MB string

console.time("Gzip compression");
const compressor = new CompressionStream("gzip");
await new Response(new Blob([data]).stream().pipeThrough(compressor)).arrayBuffer();
console.timeEnd("Gzip compression");
// ~150 MB/s compression speed
```

### Test Performance

```typescript
// Benchmark test execution
test("performance benchmark", { repeats: 1000 }, () => {
  expect(2 + 2).toBe(4);
});
// Sub-millisecond per test execution
```

---

## 🐛 Troubleshooting

### URLPattern Issues

```typescript
// Common mistakes
const badPattern = new URLPattern({ pathname: "/users/:id{[0-9+]}" }); // Missing escape
const goodPattern = new URLPattern({ pathname: "/users/:id{[0-9]+}" }); // Correct

// Debug matching
const pattern = new URLPattern({ pathname: "/api/:version/users/:id" });
const result = pattern.exec("/api/v1/users/123");
console.log("%j", result); // Inspect match results
```

### Timer Issues

```typescript
// Ensure timers are enabled
test("timer test", () => {
  mock.timers.enable();

  const fn = mock();
  setTimeout(fn, 100);

  Bun.sleepSync(100);
  expect(fn).toHaveBeenCalled();

  mock.timers.disable(); // Clean up
});
```

### Proxy Issues

```typescript
// Debug proxy connections
fetch("https://httpbin.org/ip", {
  proxy: {
    url: "http://proxy.example.com:8080",
    headers: {
      "Proxy-Authorization": "Bearer token"
    }
  }
}).then(res => {
  console.log("Proxy response:", res.status);
  return res.json();
}).then(data => {
  console.log("%j", data);
});
```

---

## 🔗 Related APIs

- **Bun.serve()**: High-performance HTTP server
- **Bun.build()**: Advanced bundling and compilation
- **Bun.test()**: Enhanced testing framework
- **Bun.profiler**: Performance profiling tools
- **fetch()**: Extended with proxy support

---

*This reference covers the complete API surface of Bun v1.3.4's new features. For implementation details, see the comprehensive feature guide.*