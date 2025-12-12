import { test, describe, expect } from "bun:test";

describe("Bun Deprecation Warning Performance Benchmarks", () => {
  // Node.js-style deprecation warning implementations
  function deprecateUsingClosure(fn, msg, code) {
    if (process.noDeprecation === true) {
      return fn;
    }

    var warned = false;
    return function() {
      if (!warned) {
        if (process.throwDeprecation) {
          var err = new Error(msg);
          if (code) err.code = code;
          throw err;
        } else if (process.traceDeprecation) {
          console.trace(msg);
        } else {
          console.error(msg);
        }
        warned = true;
      }
      return fn.apply(this, arguments);
    };
  }

  function deprecateOriginal(fn, msg) {
    var warned = false;
    function deprecated() {
      if (!warned) {
        if (process.throwDeprecation) {
          throw new Error(msg);
        } else if (process.traceDeprecation) {
          console.trace(msg);
        } else {
          console.error(msg);
        }
        warned = true;
      }
      return fn.apply(this, arguments);
    }
    return deprecated;
  }

  test("deprecation warning performance comparison", () => {
    const ITERATIONS = 10000;

    // Create deprecated functions
    const deprecatedClosure = deprecateUsingClosure(
      () => Math.random() + 1,
      "This is deprecated",
      "DEP0001"
    );

    const deprecatedOriginal = deprecateOriginal(
      () => Math.random() + 1,
      "This is deprecated"
    );

    // Benchmark closure-based approach
    const closureStart = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      deprecatedClosure();
    }
    const closureTime = performance.now() - closureStart;

    // Benchmark original approach
    const originalStart = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      deprecatedOriginal();
    }
    const originalTime = performance.now() - originalStart;

    const closureAvg = (closureTime / ITERATIONS) * 1000; // microseconds
    const originalAvg = (originalTime / ITERATIONS) * 1000; // microseconds
    const ratio = closureTime / originalTime;

    console.log(`📊 Deprecation Warning Performance (${ITERATIONS} calls):`);
    console.log(`   Closure-based: ${(closureAvg).toFixed(3)}μs per call`);
    console.log(`   Original: ${(originalAvg).toFixed(3)}μs per call`);
    console.log(`   Ratio (closure/original): ${ratio.toFixed(2)}x`);

    // Both should be reasonably fast
    expect(closureAvg).toBeLessThan(100); // Should be fast
    expect(originalAvg).toBeLessThan(100); // Should be fast
  });

  test("deprecation warning basic functionality", () => {
    // Test that both approaches work and warn appropriately
    let warningCount = 0;

    // Mock console.error to count warnings
    const originalConsoleError = console.error;
    console.error = (...args) => {
      warningCount++;
      originalConsoleError(...args);
    };

    const originalNoDeprecation = process.noDeprecation;

    try {
      process.noDeprecation = false;

      // Test original approach (warns once)
      const deprecatedOriginal = deprecateOriginal(() => "result", "Test deprecation");
      expect(deprecatedOriginal()).toBe("result");
      expect(deprecatedOriginal()).toBe("result"); // Should not warn again
      expect(warningCount).toBe(1);

      // Test closure approach (warns once)
      const deprecatedClosure = deprecateUsingClosure(() => "result2", "Closure deprecation");
      expect(deprecatedClosure()).toBe("result2");
      expect(deprecatedClosure()).toBe("result2"); // Should not warn again
      expect(warningCount).toBe(2);

    } finally {
      console.error = originalConsoleError;
      process.noDeprecation = originalNoDeprecation;
    }
  });

  test("memory usage comparison", () => {
    const FUNCTION_COUNT = 1000;

    // Create many deprecated functions with closure approach
    const closureStart = performance.now();
    const closureFunctions = [];
    for (let i = 0; i < FUNCTION_COUNT; i++) {
      closureFunctions.push(
        deprecateUsingClosure(
          () => `result-${i}`,
          `Deprecation ${i}`,
          `DEP${i.toString().padStart(4, '0')}`
        )
      );
    }
    const closureCreationTime = performance.now() - closureStart;

    // Create many deprecated functions with original approach
    const originalStart = performance.now();
    const originalFunctions = [];
    for (let i = 0; i < FUNCTION_COUNT; i++) {
      originalFunctions.push(
        deprecateOriginal(
          () => `result-${i}`,
          `Deprecation ${i}`
        )
      );
    }
    const originalCreationTime = performance.now() - originalStart;

    console.log(`📊 Memory Usage Test (${FUNCTION_COUNT} functions):`);
    console.log(`   Closure creation: ${closureCreationTime.toFixed(2)}ms`);
    console.log(`   Original creation: ${originalCreationTime.toFixed(2)}ms`);
    console.log(`   Ratio: ${(closureCreationTime / originalCreationTime).toFixed(2)}x`);

    // Test calling all functions
    const callStart = performance.now();
    for (let i = 0; i < FUNCTION_COUNT; i++) {
      closureFunctions[i]();
      originalFunctions[i]();
    }
    const callTime = performance.now() - callStart;

    console.log(`   Call time (${FUNCTION_COUNT * 2} calls): ${callTime.toFixed(2)}ms`);
    console.log(`   Average per call: ${(callTime / (FUNCTION_COUNT * 2) * 1000).toFixed(3)}μs`);

    expect(closureCreationTime).toBeLessThan(1000); // Should create quickly
    expect(originalCreationTime).toBeLessThan(1000); // Should create quickly
  });
});