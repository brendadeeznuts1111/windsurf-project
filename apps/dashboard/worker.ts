#!/usr/bin/env bun

/**
 * CPU Profiling Demo - Bun v1.3.4
 * Demonstrates CPU profiling capabilities with various workloads
 */

// Simulate CPU-intensive operations
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function matrixMultiplication(size: number): number[][] {
  const matrixA = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.random())
  );
  const matrixB = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.random())
  );

  const result = Array.from({ length: size }, () => Array(size).fill(0));

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        result[i][j] += matrixA[i][k] * matrixB[k][j];
      }
    }
  }

  return result;
}

function stringProcessing(iterations: number): string {
  let result = "";
  for (let i = 0; i < iterations; i++) {
    result += Math.random().toString(36).substring(2, 15);
    result = result.split('').sort(() => Math.random() - 0.5).join('');
  }
  return result;
}

function jsonSerialization(iterations: number): any[] {
  const results = [];
  for (let i = 0; i < iterations; i++) {
    const data = {
      id: i,
      name: `Item ${i}`,
      value: Math.random(),
      nested: {
        array: Array.from({ length: 10 }, () => Math.random()),
        object: { a: 1, b: 2, c: 3 }
      },
      timestamp: Date.now()
    };

    // Serialize and parse to simulate real work
    const serialized = JSON.stringify(data);
    const parsed = JSON.parse(serialized);
    results.push(parsed);
  }
  return results;
}

function asyncOperations(count: number): Promise<number[]> {
  const promises = Array.from({ length: count }, async (_, i) => {
    // Simulate async I/O with CPU work
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    return fibonacci(20 + (i % 10)); // Vary fibonacci depth
  });

  return Promise.all(promises);
}

async function runBenchmarks() {
  console.log("🚀 Starting CPU profiling benchmarks...");
  console.log("📊 This will generate CPU usage patterns for profiling analysis\n");

  const startTime = performance.now();

  // Phase 1: Pure CPU computation
  console.log("🔢 Phase 1: Fibonacci calculations...");
  const fibStart = performance.now();
  const fibResults = [];
  for (let i = 30; i <= 40; i++) {
    fibResults.push(fibonacci(i));
  }
  const fibTime = performance.now() - fibStart;
  console.log(`   Fibonacci (30-40): ${fibTime.toFixed(2)}ms`);

  // Phase 2: Matrix operations
  console.log("📐 Phase 2: Matrix multiplication...");
  const matrixStart = performance.now();
  const matrixResult = matrixMultiplication(50);
  const matrixTime = performance.now() - matrixStart;
  console.log(`   Matrix 50x50: ${matrixTime.toFixed(2)}ms`);

  // Phase 3: String processing
  console.log("🔤 Phase 3: String manipulation...");
  const stringStart = performance.now();
  const stringResult = stringProcessing(10000);
  const stringTime = performance.now() - stringStart;
  console.log(`   String processing: ${stringTime.toFixed(2)}ms`);

  // Phase 4: JSON operations
  console.log("📋 Phase 4: JSON serialization...");
  const jsonStart = performance.now();
  const jsonResults = jsonSerialization(5000);
  const jsonTime = performance.now() - jsonStart;
  console.log(`   JSON operations: ${jsonTime.toFixed(2)}ms`);

  // Phase 5: Async operations
  console.log("⚡ Phase 5: Async operations...");
  const asyncStart = performance.now();
  const asyncResults = await asyncOperations(100);
  const asyncTime = performance.now() - asyncStart;
  console.log(`   Async operations: ${asyncTime.toFixed(2)}ms`);

  const totalTime = performance.now() - startTime;

  console.log("\n📈 Benchmark Results:");
  console.log(`   Total execution time: ${totalTime.toFixed(2)}ms`);
  console.log(`   Fibonacci results: ${fibResults.length} calculations`);
  console.log(`   Matrix size: ${matrixResult.length}x${matrixResult[0].length}`);
  console.log(`   String length: ${stringResult.length} characters`);
  console.log(`   JSON objects: ${jsonResults.length}`);
  console.log(`   Async results: ${asyncResults.length}`);

  // Demonstrate console.log %j formatting
  console.log("\n📝 Console %j formatting demo:");
  const sampleData = {
    benchmark: "cpu-profiling-demo",
    phases: 5,
    totalTime: `${totalTime.toFixed(2)}ms`,
    timestamp: new Date().toISOString(),
    results: {
      fibonacci: fibResults.slice(0, 3),
      matrixSize: `${matrixResult.length}x${matrixResult[0].length}`,
      stringLength: stringResult.length,
      jsonCount: jsonResults.length,
      asyncCount: asyncResults.length
    }
  };

  console.log("Sample data: %j", sampleData);
}

// Run the benchmarks
runBenchmarks().catch(error => {
  console.error("❌ Benchmark failed:", error);
  process.exit(1);
});