import { test, describe } from "bun:test";
import { ErrorTracker, ValidationError } from "../examples/bun-error-tracker";

describe("Bun Error Tracker Performance Benchmarks", () => {
  const ITERATIONS = 10000;

  test("ErrorTracker error tracking performance", () => {
    const tracker = new ErrorTracker();
    const errors: ValidationError[] = [
      { code: "REQUIRED", message: "Field required", field: "name" },
      { code: "INVALID_FORMAT", message: "Invalid format", field: "email" },
      { code: "TOO_LONG", message: "Value too long", field: "description" },
      { code: "DUPLICATE", message: "Value already exists", field: "username" },
      { code: "INVALID_RANGE", message: "Value out of range", field: "age" }
    ];

    const sources = ["api", "web", "mobile", "admin", "batch"];

    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const error = errors[i % errors.length];
      const source = sources[i % sources.length];
      tracker.trackError(error, source);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / ITERATIONS;

    console.log(`📊 Error Tracking Performance (${ITERATIONS} errors):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per error: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Errors per second: ${Math.floor(ITERATIONS / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(1); // Should be sub-millisecond
  });

  test("ErrorTracker report generation performance", () => {
    const tracker = new ErrorTracker();

    // Pre-populate with test data
    for (let i = 0; i < 1000; i++) {
      tracker.trackError({
        code: `ERROR_TYPE_${i % 20}`,
        message: `Test error ${i}`,
        field: `field_${i % 10}`
      }, `source_${i % 5}`);
    }

    const reportIterations = 100;
    const startTime = performance.now();

    for (let i = 0; i < reportIterations; i++) {
      tracker.generateReport();
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / reportIterations;

    console.log(`📊 Report Generation Performance (${reportIterations} reports):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per report: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Reports per second: ${Math.floor(reportIterations / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(10); // Should be fast
  });

  test("ErrorTracker memory efficiency", () => {
    const tracker = new ErrorTracker();
    const initialMemory = process.memoryUsage().heapUsed;

    // Track many errors
    for (let i = 0; i < 50000; i++) {
      tracker.trackError({
        code: `MEMORY_TEST_${i % 100}`,
        message: `Memory test error ${i}`,
        field: `field_${i % 20}`,
        value: `value_${i}`,
        details: { index: i, timestamp: Date.now() }
      }, `source_${i % 10}`);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = finalMemory - initialMemory;
    const memoryPerError = memoryDelta / 50000;

    console.log(`📊 Memory Usage (50,000 errors):`);
    console.log(`   Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Memory delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Memory per error: ${(memoryPerError / 1024).toFixed(2)}KB`);

    expect(memoryPerError).toBeLessThan(1024); // Should be less than 1KB per error
  });

  test("ErrorTracker concurrent performance", async () => {
    const trackers = Array.from({ length: 5 }, () => new ErrorTracker());
    const concurrentOperations = 5;
    const operationsPerWorker = 2000;

    const worker = async (tracker: ErrorTracker, workerId: number) => {
      for (let i = 0; i < operationsPerWorker; i++) {
        tracker.trackError({
          code: `CONCURRENT_ERROR_${i % 10}`,
          message: `Concurrent error ${i} from worker ${workerId}`,
          field: `field_${i % 5}`
        }, `worker_${workerId}`);
      }
    };

    const startTime = performance.now();

    const promises = trackers.map((tracker, index) => worker(tracker, index));
    await Promise.all(promises);

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const totalOperations = concurrentOperations * operationsPerWorker;
    const avgTime = totalTime / totalOperations;

    console.log(`📊 Concurrent Performance (${concurrentOperations} workers, ${operationsPerWorker} ops each):`);
    console.log(`   Total operations: ${totalOperations}`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per operation: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Operations per second: ${Math.floor(totalOperations / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(2); // Should handle concurrency well
  });

  test("ErrorTracker warning tracking performance", () => {
    const tracker = new ErrorTracker();
    const warnings = [
      "Deprecated API usage detected",
      "High memory usage warning",
      "Rate limit approaching",
      "Database connection slow",
      "Cache miss rate high"
    ];

    const sources = ["api", "system", "database", "cache", "network"];

    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const warning = warnings[i % warnings.length];
      const source = sources[i % sources.length];
      tracker.trackWarning(warning, source, { index: i });
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / ITERATIONS;

    console.log(`📊 Warning Tracking Performance (${ITERATIONS} warnings):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per warning: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Warnings per second: ${Math.floor(ITERATIONS / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(0.5); // Should be very fast
  });

  test("ErrorTracker mixed operations performance", () => {
    const tracker = new ErrorTracker();
    const operations = ITERATIONS / 10; // Balance different operation types

    const startTime = performance.now();

    // Mix of errors and warnings
    for (let i = 0; i < operations; i++) {
      // Track errors
      tracker.trackError({
        code: `MIXED_ERROR_${i % 5}`,
        message: `Mixed operation error ${i}`
      }, `mixed_source_${i % 3}`);

      // Track warnings
      tracker.trackWarning(`Mixed warning ${i}`, `mixed_source_${i % 3}`);

      // Generate reports occasionally
      if (i % 100 === 0) {
        tracker.generateReport();
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const totalOperations = operations * 2 + Math.floor(operations / 100); // errors + warnings + reports
    const avgTime = totalTime / totalOperations;

    console.log(`📊 Mixed Operations Performance (${operations} cycles):`);
    console.log(`   Total operations: ${totalOperations}`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per operation: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Operations per second: ${Math.floor(totalOperations / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(1); // Should handle mixed operations efficiently
  });
});