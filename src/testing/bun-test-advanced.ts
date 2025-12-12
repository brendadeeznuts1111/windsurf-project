import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { logger } from "../../examples/logging/bun-logger";

/**
 * Advanced testing patterns with Bun-native features
 */
describe("BunNativeLogger", () => {
  let logSpy: any;

  beforeEach(() => {
    // Spy on logger methods using Bun's spyOn
    logSpy = spyOn(logger, "info");
  });

  afterEach(() => {
    // Restore original logger
    mock.restoreAll();
  });

  it("should log with correct structure", () => {
    logger.info("Test message", { test: true });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const call = logSpy.mock.calls[0];

    // Use Bun.deepEquals for object comparison
    expect(Bun.deepEquals(call[1], { test: true })).toBe(true);
  });

  it("should handle circular references", () => {
    const circular: any = { name: "test" };
    circular.self = circular;

    // Bun.inspect handles circular references natively
    const output = Bun.inspect(circular);
    expect(output).toContain("[Circular]");

    expect(() => logger.info("Circular test", circular)).not.toThrow();
  });
});

/**
 * Snapshot testing with Bun.file()
 */
export async function snapshotTest(name: string, actual: any): Promise<void> {
  const snapshotPath = `__snapshots__/${name}.snap`;
  const snapshotFile = Bun.file(snapshotPath);

  const serialized = JSON.stringify(actual, null, 2) + "\n";

  if (await snapshotFile.exists()) {
    // Compare with existing snapshot
    const expected = await snapshotFile.text();

    if (expected !== serialized) {
      // Mismatch - write diff
      const diffPath = `__snapshots__/${name}.diff`;
      await Bun.write(diffPath, `--- Expected\n+++ Actual\n@@ -1 +1 @@\n-${expected}+${serialized}`);

      throw new Error(`Snapshot mismatch for ${name}`);
    }

    logger.debug("Snapshot test passed", { name });
  } else {
    // Create new snapshot
    await Bun.write(snapshotPath, serialized);
    logger.info("Snapshot created", { name, path: snapshotPath });
  }
}

/**
 * Performance testing utilities
 */
export class BunPerformanceTester {
  private results: Map<string, number[]> = new Map();

  /**
   * Benchmark a function
   */
  async benchmark(name: string, fn: () => Promise<void> | void, iterations: number = 100): Promise<void> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Bun.nanoseconds();
      await fn();
      const end = Bun.nanoseconds();
      times.push(end - start);
    }

    this.results.set(name, times);

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    logger.info("Benchmark completed", {
      name,
      iterations,
      avg_ns: avg,
      min_ns: min,
      max_ns: max,
    });
  }

  /**
   * Get benchmark results
   */
  getResults(name: string): { avg: number; min: number; max: number; samples: number } | null {
    const times = this.results.get(name);
    if (!times) return null;

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      samples: times.length,
    };
  }
}