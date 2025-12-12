import { test, describe, expect } from "bun:test";
import { BunUUIDGenerator, generateUUID, generateUUIDs, parseUUID, extractUUIDTimestamp } from "../src/utils/bun-uuid";

describe("Bun UUID Generator Performance Benchmarks", () => {
  const ITERATIONS = 10000;
  const BULK_SIZE = 1000;

  test("UUID generation performance - single", () => {
    const generator = new BunUUIDGenerator();
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const uuid = generator.generate();
      expect(typeof uuid).toBe("string");
      expect(uuid.length).toBe(36); // Standard UUID format
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / ITERATIONS;

    console.log(`📊 UUID Single Generation (${ITERATIONS} calls):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per UUID: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   UUIDs per second: ${Math.floor(ITERATIONS / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(1); // Should be sub-millisecond
  });

  test("UUID generation performance - bulk", () => {
    const generator = new BunUUIDGenerator();
    const bulkIterations = ITERATIONS / BULK_SIZE; // Adjust for bulk operations

    const startTime = performance.now();

    for (let i = 0; i < bulkIterations; i++) {
      const uuids = generator.generateBulk(BULK_SIZE);
      expect(uuids).toHaveLength(BULK_SIZE);
      expect(new Set(uuids).size).toBe(BULK_SIZE); // All unique
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const totalUUIDs = bulkIterations * BULK_SIZE;
    const avgTime = totalTime / totalUUIDs;

    console.log(`📊 UUID Bulk Generation (${totalUUIDs} UUIDs in ${bulkIterations} batches):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per UUID: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   UUIDs per second: ${Math.floor(totalUUIDs / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(0.5); // Should be very fast in bulk
  });

  test("UUID caching performance", async () => {
    const generator = new BunUUIDGenerator();

    // Warm up cache
    await generator.warmupCache(5000);

    const cacheStats = generator.getCacheStats();
    expect(cacheStats.size).toBe(5000);
    expect(cacheStats.utilization).toBeGreaterThan(0);

    console.log(`📊 UUID Cache Stats:`);
    console.log(`   Cache size: ${cacheStats.size}/${cacheStats.capacity}`);
    console.log(`   Utilization: ${cacheStats.utilization.toFixed(1)}%`);

    // Test cache performance
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const uuid = generator.generate();
      expect(typeof uuid).toBe("string");
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / ITERATIONS;

    console.log(`📊 UUID Cache Performance (${ITERATIONS} calls):`);
    console.log(`   Average per UUID: ${(avgTime * 1000).toFixed(3)}μs`);

    expect(avgTime).toBeLessThan(0.1); // Should be extremely fast with cache
  });

  test("UUID parsing performance", () => {
    const generator = new BunUUIDGenerator();
    const uuids = generator.generateBulk(1000); // Pre-generate for parsing test

    const startTime = performance.now();

    for (const uuid of uuids) {
      const info = generator.parse(uuid);
      expect(info.version).toBe(7);
      expect(info.timestamp).toBeInstanceOf(Date);
      expect(typeof info.sequence).toBe("number");
      expect(typeof info.nodeId).toBe("string");
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / uuids.length;

    console.log(`📊 UUID Parsing Performance (${uuids.length} UUIDs):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per parse: ${(avgTime * 1000).toFixed(3)}μs`);

    expect(avgTime).toBeLessThan(10); // Should be reasonably fast
  });

  test("UUID timestamp extraction performance", () => {
    const generator = new BunUUIDGenerator();
    const uuids = generator.generateBulk(1000);

    const startTime = performance.now();

    for (const uuid of uuids) {
      const timestamp = generator.extractTimestamp(uuid);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / uuids.length;

    console.log(`📊 UUID Timestamp Extraction (${uuids.length} UUIDs):`);
    console.log(`   Average per extraction: ${(avgTime * 1000).toFixed(3)}μs`);

    expect(avgTime).toBeLessThan(10);
  });

  test("UUID time ordering validation", () => {
    const generator = new BunUUIDGenerator();

    // Generate UUIDs with small delays to ensure time ordering
    const uuids: string[] = [];
    for (let i = 0; i < 100; i++) {
      uuids.push(generator.generate());
      // Small delay to ensure different timestamps
      Bun.sleepSync(1);
    }

    const isOrdered = generator.isTimeOrdered(uuids);
    console.log(`📊 Time Ordering Test (100 UUIDs): ${isOrdered ? '✅ Ordered' : '❌ Not ordered'}`);

    // UUID v7 should be time-ordered (though not guaranteed due to sequence numbers)
    // This test validates the sorting property
    const sorted = [...uuids].sort();
    const isLexicographicallyOrdered = JSON.stringify(uuids) === JSON.stringify(sorted);

    console.log(`📊 Lexicographic Ordering: ${isLexicographicallyOrdered ? '✅ Ordered' : '❌ Not ordered'}`);

    expect(isLexicographicallyOrdered).toBe(true); // UUID v7 should be sortable
  });

  test("UUID uniqueness validation", () => {
    const generator = new BunUUIDGenerator();
    const uuids = generator.generateBulk(ITERATIONS);

    const uniqueSet = new Set(uuids);
    const uniquenessRate = (uniqueSet.size / uuids.length) * 100;

    console.log(`📊 UUID Uniqueness Test (${ITERATIONS} UUIDs):`);
    console.log(`   Unique UUIDs: ${uniqueSet.size}`);
    console.log(`   Uniqueness rate: ${uniquenessRate.toFixed(2)}%`);

    expect(uniquenessRate).toBe(100); // Should be 100% unique
    expect(uniqueSet.size).toBe(uuids.length);
  });

  test("UUID format validation", () => {
    const generator = new BunUUIDGenerator();
    const uuids = generator.generateBulk(100);

    for (const uuid of uuids) {
      // UUID v7 format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(uuid)).toBe(true);

      // Should be exactly 36 characters
      expect(uuid.length).toBe(36);

      // Should contain exactly 4 dashes
      expect((uuid.match(/-/g) || []).length).toBe(4);
    }

    console.log(`📊 UUID Format Validation: ✅ All ${uuids.length} UUIDs valid`);
  });

  test("Convenience functions performance", () => {
    const startTime = performance.now();

    // Test convenience functions
    for (let i = 0; i < ITERATIONS / 10; i++) {
      const uuid = generateUUID();
      expect(typeof uuid).toBe("string");

      const uuids = generateUUIDs(10);
      expect(uuids).toHaveLength(10);
      expect(new Set(uuids).size).toBe(10); // All unique
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const totalOperations = (ITERATIONS / 10) * 11; // 1 generate + 10 generateBulk per iteration
    const avgTime = totalTime / totalOperations;

    console.log(`📊 Convenience Functions (${totalOperations} operations):`);
    console.log(`   Average per operation: ${(avgTime * 1000).toFixed(3)}μs`);

    expect(avgTime).toBeLessThan(1);
  });

  test("Memory usage with large bulk operations", () => {
    const generator = new BunUUIDGenerator();
    const initialMemory = process.memoryUsage().heapUsed;

    // Generate a large number of UUIDs
    const largeBulk = generator.generateBulk(50000);
    const afterGenerationMemory = process.memoryUsage().heapUsed;

    // Parse all of them
    for (const uuid of largeBulk.slice(0, 1000)) { // Parse subset to avoid too much time
      generator.parse(uuid);
    }
    const afterParsingMemory = process.memoryUsage().heapUsed;

    const generationDelta = afterGenerationMemory - initialMemory;
    const parsingDelta = afterParsingMemory - afterGenerationMemory;

    console.log(`📊 Memory Usage (50,000 UUIDs):`);
    console.log(`   Generation delta: ${(generationDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Parsing delta: ${(parsingDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Memory per UUID: ${(generationDelta / 50000).toFixed(0)} bytes`);

    expect(generationDelta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    expect(largeBulk.length).toBe(50000);
    expect(new Set(largeBulk).size).toBe(50000); // All unique
  });
});