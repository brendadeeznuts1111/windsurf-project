# CPU Profiling Guide - Bun v1.3.4

## 🎯 Analyzing CPU Profiles

Bun v1.3.4 generates `.cpuprofile` files that can be analyzed using various tools to understand performance bottlenecks and optimize code.

## 📊 Generated Profile

The CPU profiling run generated: `CPU.267589641449.39260.cpuprofile` (4.2MB)

## 🔍 Analysis Tools

### 1. Chrome DevTools (Recommended)

```bash
# Open Chrome and navigate to:
# chrome://tracing

# Then:
# 1. Click "Load" button
# 2. Select the .cpuprofile file
# 3. Analyze the flame graph
```

### 2. VS Code Extension

```bash
# Install "CPU Profiles" extension in VS Code
# Then open the .cpuprofile file directly
```

### 3. Speedscope (Web-based)

```bash
# Install speedscope globally
npm install -g speedscope

# Open profile
speedscope CPU.267589641449.39260.cpuprofile
```

### 4. Flamebearer (Alternative)

```bash
# Convert to flamegraph format
npx flamebearer CPU.267589641449.39260.cpuprofile

# Opens in browser automatically
```

## 📈 Performance Insights from Our Profile

Based on the benchmark run, here are the key findings:

### Execution Times (from our run):
- **Fibonacci (30-40)**: 1,076.99ms - Heavy recursive computation
- **Matrix 50x50**: 1.67ms - Efficient numerical computation
- **String processing**: 100,786.18ms - **Bottleneck!** String manipulation is slow
- **JSON operations**: 11.64ms - Fast serialization/parsing
- **Async operations**: 59.07ms - Efficient Promise handling

### Optimization Opportunities:

1. **String Processing Bottleneck**
   - 100+ seconds spent on string operations
   - Consider using `Uint8Array` for binary data
   - Use `StringBuilder` pattern for concatenation

2. **Fibonacci Recursion**
   - Deep recursion causing stack pressure
   - Implement iterative version or memoization

3. **Matrix Operations**
   - Already well-optimized (1.67ms for 50x50)

## 🛠️ Profiling Commands

### Basic Profiling
```bash
# Profile any script
bun --cpu-prof ./script.ts

# Custom output file
bun --cpu-prof=custom-profile.cpuprofile ./script.ts

# Custom sample rate (samples per second)
bun --cpu-prof --cpu-prof-sample-rate=1000 ./script.ts
```

### Advanced Profiling
```bash
# Profile during build
bun build --cpu-prof ./app.ts

# Profile tests
bun test --cpu-prof

# Profile with timeout
timeout 30 bun --cpu-prof ./long-running-script.ts
```

### Programmatic Profiling
```typescript
// Start profiling
const profiler = Bun.profiler.start();

// Your code here
expensiveOperation();

// Stop and save
profiler.stop("my-profile.cpuprofile");

// Time specific operations
const result = Bun.profiler.time("operationName", () => {
  return expensiveFunction();
});

console.log(`Duration: ${result.duration}ms`);
console.log(`CPU Usage: ${result.cpuUsage}%`);
```

## 📊 Interpreting Flame Graphs

### Flame Graph Structure
```
[Function Name]
    [Child Function]
        [Deepest Function Call]
```

- **Width**: Time spent in function (wider = more time)
- **Height**: Stack depth (taller = deeper call stack)
- **Color**: Random (for visual distinction)

### Common Patterns to Look For

1. **Wide Bars**: Functions consuming most CPU time
2. **Tall Stacks**: Deep recursion or call chains
3. **Plateaus**: Long-running loops or computations
4. **Spikes**: Sudden performance issues

### Optimization Strategies

1. **Memoization**: Cache expensive function results
2. **Algorithm Optimization**: Use more efficient algorithms
3. **Lazy Loading**: Defer expensive operations
4. **Parallelization**: Use Web Workers for CPU-intensive tasks
5. **Data Structure Optimization**: Choose better data structures

## 🔧 Real-World Profiling Examples

### API Server Profiling
```typescript
// Profile API endpoints
Bun.serve({
  fetch(req) {
    const profiler = Bun.profiler.start();

    // Handle request
    const response = handleRequest(req);

    profiler.stop(`profile-${req.method}-${Date.now()}.cpuprofile`);
    return response;
  }
});
```

### React Component Profiling
```typescript
// Profile component renders
function ProfiledComponent() {
  const profiler = Bun.profiler.start();

  // Component logic
  const result = expensiveComputation();

  profiler.stop(`render-profile.cpuprofile`);

  return <div>{result}</div>;
}
```

### Database Query Profiling
```typescript
// Profile database operations
async function profiledQuery(sql: string) {
  const profiler = Bun.profiler.start();

  const result = await db.query(sql);

  profiler.stop(`query-profile.cpuprofile`);
  return result;
}
```

## 📈 Performance Benchmarks

Our CPU profiling demo revealed:

| Operation | Time | Notes |
|-----------|------|-------|
| Fibonacci (recursive) | 1,077ms | Stack-intensive |
| Matrix multiplication | 1.67ms | Well-optimized |
| String processing | 100,786ms | **Major bottleneck** |
| JSON operations | 11.64ms | Fast native implementation |
| Async operations | 59.07ms | Efficient Promise handling |

## 🎯 Best Practices

1. **Profile in production-like conditions**
2. **Use representative data sets**
3. **Profile for realistic durations**
4. **Compare before/after optimizations**
5. **Focus on the widest bars in flame graphs**

## 🔗 Resources

- [Chrome Tracing Documentation](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/)
- [Speedscope](https://www.speedscope.app/)
- [Flame Graphs](http://www.brendangregg.com/flamegraphs.html)
- [Bun Profiling Docs](https://bun.sh/docs/api/profiler)

---

*CPU profiling with Bun v1.3.4 provides deep insights into application performance, enabling data-driven optimization decisions.*