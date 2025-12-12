# 🏎️ Bun Benchmarking Guide

*Generated on 2025-12-12T15:10:00.000Z*

## 📋 Overview

Bun provides powerful benchmarking capabilities for measuring performance, though it doesn't currently have a dedicated `bench` command like some other JavaScript runtimes. Instead, Bun offers flexible benchmarking through custom scripts, built-in performance APIs, and integration with existing testing frameworks.

## 🏃 Current Benchmarking Options

### No Built-in `bench` Command

As of Bun v1.3.4, there is no dedicated `bench` command. However, Bun provides excellent performance measurement tools:

```bash
# Bun does NOT have this (yet):
bun bench my-benchmark.ts

# Instead, use custom benchmarking scripts:
bun run scripts/benchmark/benchmark.ts
```

### Performance APIs

Bun includes powerful built-in performance measurement APIs:

```typescript
// High-precision timing
const start = Bun.nanoseconds();
expensiveOperation();
const duration = (Bun.nanoseconds() - start) / 1e6; // Convert to milliseconds

// Performance hooks (Node.js compatible)
import { performance } from 'perf_hooks';
const start = performance.now();
// ... code to benchmark ...
const duration = performance.now() - start;
```

## 🛠️ Custom Benchmarking Scripts

### Basic Benchmarking Setup

```typescript
// benchmark-basic.ts
function benchmark(name: string, fn: () => void, iterations = 1000) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Bun.nanoseconds();
    fn();
    const end = Bun.nanoseconds();
    times.push((end - start) / 1e6); // Convert to milliseconds
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`${name}:`);
  console.log(`  Average: ${avg.toFixed(3)}ms`);
  console.log(`  Min: ${min.toFixed(3)}ms`);
  console.log(`  Max: ${max.toFixed(3)}ms`);
  console.log(`  Iterations: ${iterations}`);
}

// Usage
benchmark("Array push", () => {
  const arr = [];
  for (let i = 0; i < 1000; i++) {
    arr.push(i);
  }
});

benchmark("Array index access", () => {
  const arr = Array.from({ length: 1000 }, (_, i) => i);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
});
```

### Advanced Benchmarking with Statistics

```typescript
// benchmark-advanced.ts
interface BenchmarkStats {
  name: string;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
  iterations: number;
}

function calculateStats(times: number[]): Omit<BenchmarkStats, 'name' | 'iterations'> {
  const sorted = [...times].sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const median = sorted[Math.floor(sorted.length / 2)];

  const variance = times.reduce((acc, time) => acc + Math.pow(time - mean, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

function benchmarkAdvanced(name: string, fn: () => void, iterations = 10000): BenchmarkStats {
  const times: number[] = [];

  // Warm-up
  for (let i = 0; i < Math.min(1000, iterations / 10); i++) {
    fn();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = Bun.nanoseconds();
    fn();
    const end = Bun.nanoseconds();
    times.push((end - start) / 1e6); // Convert to milliseconds
  }

  const stats = calculateStats(times);

  return {
    name,
    ...stats,
    iterations,
  };
}

function printStats(stats: BenchmarkStats) {
  console.log(`\n${stats.name}:`);
  console.log(`  Iterations: ${stats.iterations.toLocaleString()}`);
  console.log(`  Mean: ${stats.mean.toFixed(3)}ms`);
  console.log(`  Median: ${stats.median.toFixed(3)}ms`);
  console.log(`  Std Dev: ${stats.stdDev.toFixed(3)}ms`);
  console.log(`  Min: ${stats.min.toFixed(3)}ms`);
  console.log(`  Max: ${stats.max.toFixed(3)}ms`);
  console.log(`  P95: ${stats.p95.toFixed(3)}ms`);
  console.log(`  P99: ${stats.p99.toFixed(3)}ms`);
}

// Usage
const results = [
  benchmarkAdvanced("Array operations", () => {
    const arr = [];
    for (let i = 0; i < 100; i++) {
      arr.push(i);
      arr.pop();
    }
  }),

  benchmarkAdvanced("Object creation", () => {
    const obj = { a: 1, b: 2, c: 3 };
    return obj.a + obj.b + obj.c;
  }),

  benchmarkAdvanced("String concatenation", () => {
    let str = "";
    for (let i = 0; i < 100; i++) {
      str += i.toString();
    }
    return str.length;
  }),
];

results.forEach(printStats);
```

## 🧪 Integration with Bun Test

### Performance Testing in Test Suites

```typescript
// performance.test.ts
import { describe, test, expect } from "bun:test";

describe("Performance benchmarks", () => {
  function measurePerformance(fn: () => void, iterations = 1000): number {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Bun.nanoseconds();
      fn();
      const end = Bun.nanoseconds();
      times.push((end - start) / 1e6);
    }

    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  test("JSON parsing is fast", () => {
    const data = '{"key": "value", "number": 123, "array": [1,2,3,4,5]}';
    const avgTime = measurePerformance(() => {
      JSON.parse(data);
    }, 10000);

    // Should be very fast (< 0.1ms on modern hardware)
    expect(avgTime).toBeLessThan(0.1);
    console.log(`JSON parse average: ${avgTime.toFixed(4)}ms`);
  });

  test("Bun.serve response time", async () => {
    let server: any;

    const avgTime = measurePerformance(() => {
      // This would measure server creation time
      // In real scenarios, you'd measure request/response cycles
    }, 100);

    expect(avgTime).toBeLessThan(10); // Should be fast
  });
});
```

### Memory Usage Benchmarking

```typescript
// memory-benchmark.test.ts
import { describe, test, expect } from "bun:test";

describe("Memory benchmarks", () => {
  test("no memory leaks in loops", () => {
    const initialHeap = process.memoryUsage().heapUsed;

    for (let i = 0; i < 10000; i++) {
      const arr = new Array(1000).fill(Math.random());
      // arr goes out of scope immediately
    }

    const finalHeap = process.memoryUsage().heapUsed;
    const increase = finalHeap - initialHeap;

    // Allow some increase but not excessive
    expect(increase).toBeLessThan(1024 * 1024); // < 1MB increase
    console.log(`Memory increase: ${(increase / 1024 / 1024).toFixed(2)}MB`);
  });

  test("garbage collection effectiveness", () => {
    // Create many objects
    const objects: any[] = [];
    for (let i = 0; i < 100000; i++) {
      objects.push({ data: Math.random(), nested: { value: i } });
    }

    const beforeGC = process.memoryUsage().heapUsed;
    Bun.gc(true); // Force garbage collection
    const afterGC = process.memoryUsage().heapUsed;

    const collected = beforeGC - afterGC;
    expect(collected).toBeGreaterThan(1024 * 1024); // Should collect at least 1MB

    console.log(`GC collected: ${(collected / 1024 / 1024).toFixed(2)}MB`);
  });
});
```

## 🚀 HTTP Server Benchmarking

### Request/Response Performance

```typescript
// http-benchmark.ts
async function benchmarkHTTPServer() {
  const server = Bun.serve({
    port: 0, // Auto-assign port
    fetch(req) {
      return new Response(`Hello ${req.url}`);
    },
  });

  const port = server.port;
  const baseUrl = `http://localhost:${port}`;

  // Benchmark different types of requests
  const benchmarks = [
    {
      name: "Simple GET",
      async run() {
        const response = await fetch(baseUrl);
        return await response.text();
      }
    },
    {
      name: "JSON response",
      async run() {
        const response = await fetch(`${baseUrl}/json`);
        return await response.json();
      }
    },
    {
      name: "POST request",
      async run() {
        const response = await fetch(baseUrl, {
          method: "POST",
          body: "test data",
        });
        return await response.text();
      }
    }
  ];

  for (const bench of benchmarks) {
    const stats = benchmarkAdvanced(bench.name, () => bench.run(), 1000);
    printStats(stats);
  }

  server.stop();
}

// Update server for JSON endpoint
const server = Bun.serve({
  port: 0,
  fetch(req) {
    if (req.url.includes("/json")) {
      return Response.json({ message: "Hello", timestamp: Date.now() });
    }
    return new Response(`Hello from ${req.url}`);
  },
});

await benchmarkHTTPServer();
```

## 📊 Repository Benchmark Scripts

### Available Benchmark Scripts

The repository includes several benchmark scripts in `scripts/benchmark/`:

```bash
# Run all benchmarks
bun run scripts/benchmark/benchmark.ts

# Run specific benchmarks
bun run scripts/benchmark/benchmark-compression.ts
bun run scripts/benchmark/benchmark-v13.ts
bun run scripts/benchmark/benchmark-worker.ts
bun run scripts/benchmark/packages-performance-test.ts
```

### Benchmark Categories

#### Compression Benchmarks
```typescript
// Test different compression algorithms
const data = new Uint8Array(1024 * 1024); // 1MB of data
crypto.getRandomValues(data);

const benchmarks = [
  {
    name: "Bun.gzipSync",
    run: () => Bun.gzipSync(data),
  },
  {
    name: "Bun.deflateSync",
    run: () => Bun.deflateSync(data),
  },
  {
    name: "Bun.zstdCompressSync",
    run: () => Bun.zstdCompressSync(data),
  },
];

for (const bench of benchmarks) {
  const stats = benchmarkAdvanced(bench.name, bench.run, 100);
  printStats(stats);
}
```

#### V13 Feature Benchmarks
```typescript
// Benchmark new Bun v1.3 features
const benchmarks = [
  {
    name: "UUID v7 generation",
    run: () => Bun.randomUUIDv7(),
  },
  {
    name: "Deep equality check",
    run: () => Bun.deepEquals({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }),
  },
  {
    name: "Nano-second precision timing",
    run: () => Bun.nanoseconds(),
  },
];

for (const bench of benchmarks) {
  const stats = benchmarkAdvanced(bench.name, bench.run, 10000);
  printStats(stats);
}
```

## 🛠️ Benchmarking Best Practices

### 1. **Warm-up Runs**
```typescript
function benchmarkWithWarmup(name: string, fn: () => void, iterations = 1000) {
  // Warm-up phase
  console.log(`Warming up ${name}...`);
  for (let i = 0; i < Math.min(100, iterations / 10); i++) {
    fn();
  }

  // Actual benchmark
  console.log(`Benchmarking ${name}...`);
  return benchmarkAdvanced(name, fn, iterations);
}
```

### 2. **Statistical Analysis**
```typescript
function analyzeBenchmarkResults(results: BenchmarkStats[]) {
  const fastest = results.reduce((prev, curr) =>
    prev.mean < curr.mean ? prev : curr
  );

  const slowest = results.reduce((prev, curr) =>
    prev.mean > curr.mean ? prev : curr
  );

  console.log("\nBenchmark Analysis:");
  console.log(`Fastest: ${fastest.name} (${fastest.mean.toFixed(3)}ms)`);
  console.log(`Slowest: ${slowest.name} (${slowest.mean.toFixed(3)}ms)`);
  console.log(`Speed difference: ${(slowest.mean / fastest.mean).toFixed(2)}x`);
}
```

### 3. **Memory-Aware Benchmarking**
```typescript
function benchmarkWithMemoryTracking(name: string, fn: () => void, iterations = 1000) {
  const initialMemory = process.memoryUsage();

  const result = benchmarkAdvanced(name, () => {
    fn();
    // Periodic GC to prevent memory pressure from affecting results
    if (Math.random() < 0.01) { // 1% chance per iteration
      Bun.gc();
    }
  }, iterations);

  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

  console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

  return { ...result, memoryIncrease };
}
```

### 4. **Cross-Runtime Comparisons**
```typescript
async function compareRuntimes() {
  const code = `
    const arr = [];
    for (let i = 0; i < 10000; i++) {
      arr.push(Math.random());
    }
    arr.sort();
    return arr.length;
  `;

  // This would require running the same code in different runtimes
  // and comparing results - implementation would vary

  console.log("Cross-runtime comparison would go here");
  console.log("Currently, Bun provides excellent performance for:");
  console.log("- JavaScript execution");
  console.log("- Module resolution");
  console.log("- HTTP serving");
  console.log("- File I/O operations");
}
```

## 📈 Performance Profiling

### CPU Profiling

```bash
# Enable CPU profiling
bun --cpu-prof my-script.ts

# Profile with custom name
bun --cpu-prof --cpu-prof-name=my-profile my-script.ts

# Save profile to specific directory
bun --cpu-prof --cpu-prof-dir=./profiles my-script.ts
```

### Memory Profiling

```typescript
// Track memory usage over time
function profileMemory(operation: () => void, samples = 100) {
  const memorySamples: number[] = [];

  const interval = setInterval(() => {
    memorySamples.push(process.memoryUsage().heapUsed);
  }, 10); // Sample every 10ms

  operation();

  clearInterval(interval);

  console.log("Memory profile:");
  console.log(`Samples: ${memorySamples.length}`);
  console.log(`Peak memory: ${(Math.max(...memorySamples) / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Average memory: ${(memorySamples.reduce((a, b) => a + b, 0) / memorySamples.length / 1024 / 1024).toFixed(2)}MB`);
}
```

## 🔄 Future `bench` Command

While Bun doesn't currently have a built-in `bench` command, the ecosystem is actively developing benchmarking tools. The current approach using custom scripts provides maximum flexibility and can be easily extended.

### Potential Future API

```typescript
// Hypothetical future API (not currently available)
export function bench(name: string, fn: () => void | Promise<void>) {
  // Built-in benchmarking with statistics
}

// Usage
bench("my operation", async () => {
  await expensiveOperation();
});
```

## 📚 Related Examples

- [Performance Testing](./performance-testing.md)
- [Memory Leak Testing](./memory-leak-testing.md)
- [HTTP Server Testing](./http-server-testing.md)
- [Test Runner Guide](./bun-testing-guide.md)

## 📊 Key Concepts

1. **No Built-in bench Command**: Bun v1.3.4 doesn't have `bun bench` yet
2. **Custom Scripts**: Use `scripts/benchmark/` for comprehensive benchmarking
3. **High-Precision Timing**: `Bun.nanoseconds()` for accurate measurements
4. **Memory Tracking**: Built-in GC and memory usage monitoring
5. **Statistical Analysis**: Mean, median, percentiles for reliable results
6. **Cross-Platform**: Benchmarks work consistently across environments

Bun's benchmarking capabilities are powerful and flexible, allowing for comprehensive performance analysis of JavaScript code, HTTP servers, and system operations.

---

*For the latest benchmarking features, check Bun's [performance documentation](https://bun.sh/docs/runtime/performance) and [GitHub repository](https://github.com/oven-sh/bun) for updates on the `bench` command.*</content>
<parameter name="filePath">examples/bun-benchmarking-guide.md