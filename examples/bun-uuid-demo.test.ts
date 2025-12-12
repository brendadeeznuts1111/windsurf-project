import { describe, expect, test } from "bun:test";
import { BunUUIDGenerator, generateUUID, generateUUIDs, parseUUID, extractUUIDTimestamp } from "../src/utils/bun-uuid";

describe("Bun UUID Generator Examples", () => {
  test("basic UUID generation", () => {
    const generator = new BunUUIDGenerator();

    // Generate single UUID
    const uuid = generator.generate();
    expect(typeof uuid).toBe("string");
    expect(uuid.length).toBe(36);

    // Validate UUID v7 format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(uuid)).toBe(true);

    console.log("✅ Generated UUID:", uuid);
  });

  test("bulk UUID generation", () => {
    const generator = new BunUUIDGenerator();

    // Generate multiple UUIDs
    const uuids = generator.generateBulk(100);
    expect(uuids).toHaveLength(100);

    // All should be unique
    const uniqueSet = new Set(uuids);
    expect(uniqueSet.size).toBe(100);

    // All should be valid UUID v7
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    uuids.forEach(uuid => {
      expect(uuidRegex.test(uuid)).toBe(true);
    });

    console.log("✅ Generated 100 unique UUIDs");
  });

  test("UUID parsing and timestamp extraction", () => {
    const generator = new BunUUIDGenerator();

    // Generate and parse a UUID
    const uuid = generator.generate();
    const info = generator.parse(uuid);

    expect(info.version).toBe(7);
    expect(info.timestamp).toBeInstanceOf(Date);
    expect(typeof info.sequence).toBe("number");
    expect(typeof info.nodeId).toBe("string");
    expect(info.raw).toBe(uuid);

    // Extract timestamp
    const timestamp = generator.extractTimestamp(uuid);
    expect(timestamp).toBeInstanceOf(Date);

    // Timestamp should be recent (within last minute)
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThan(60000); // Within 1 minute

    console.log("✅ Parsed UUID:", {
      version: info.version,
      timestamp: info.timestamp.toISOString(),
      sequence: info.sequence,
      nodeId: info.nodeId.substring(0, 8) + "..."
    });
  });

  test("time-ordered UUID generation", () => {
    const generator = new BunUUIDGenerator();

    // Generate UUIDs with small delays
    const uuids: string[] = [];
    for (let i = 0; i < 10; i++) {
      uuids.push(generator.generate());
      // Small delay to ensure different timestamps
      Bun.sleepSync(1);
    }

    // Check lexicographic ordering (UUID v7 property)
    const sorted = [...uuids].sort();
    const isOrdered = JSON.stringify(uuids) === JSON.stringify(sorted);

    console.log("✅ Time-ordered UUIDs:", isOrdered ? "Yes" : "No");

    // UUID v7 should generally be sortable due to time component
    expect(isOrdered).toBe(true);
  });

  test("cache functionality", async () => {
    const generator = new BunUUIDGenerator();

    // Initially empty cache
    let stats = generator.getCacheStats();
    expect(stats.size).toBe(0);

    // Warm up cache
    await generator.warmupCache(1000);
    stats = generator.getCacheStats();
    expect(stats.size).toBe(1000);
    expect(stats.utilization).toBe(10); // 1000/10000 = 10%

    // Generate from cache
    const uuid = generator.generate();
    stats = generator.getCacheStats();
    expect(stats.size).toBe(999); // One used

    console.log("✅ Cache functionality working:", stats);
  });

  test("convenience functions", () => {
    // Test standalone functions
    const uuid = generateUUID();
    expect(typeof uuid).toBe("string");
    expect(uuid.length).toBe(36);

    const uuids = generateUUIDs(5);
    expect(uuids).toHaveLength(5);
    expect(new Set(uuids).size).toBe(5); // All unique

    const info = parseUUID(uuid);
    expect(info.version).toBe(7);

    const timestamp = extractUUIDTimestamp(uuid);
    expect(timestamp).toBeInstanceOf(Date);

    console.log("✅ Convenience functions working");
  });

  test("error handling", () => {
    const generator = new BunUUIDGenerator();

    // Invalid UUID format
    expect(() => generator.parse("invalid-uuid")).toThrow();
    expect(() => generator.extractTimestamp("not-a-uuid")).toThrow();

    console.log("✅ Error handling working");
  });

  test("performance demonstration", () => {
    const generator = new BunUUIDGenerator();

    // Quick performance test
    const start = performance.now();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      generator.generate();
    }

    const duration = performance.now() - start;
    const rate = count / (duration / 1000);

    console.log(`📊 Performance Demo (${count} UUIDs):`);
    console.log(`   Duration: ${duration.toFixed(2)}ms`);
    console.log(`   Rate: ${Math.floor(rate)} UUIDs/second`);

    expect(rate).toBeGreaterThan(1000); // Should be fast
  });

  test("database-friendly properties", () => {
    const generator = new BunUUIDGenerator();

    // Generate UUIDs that would be good for database primary keys
    const uuids = generator.generateBulk(100);

    // Check they're all properly formatted for databases
    uuids.forEach(uuid => {
      // Should be lowercase (PostgreSQL preference)
      expect(uuid).toBe(uuid.toLowerCase());

      // Should not contain invalid characters
      expect(uuid).toMatch(/^[0-9a-f-]+$/);

      // Should be exactly 36 characters
      expect(uuid.length).toBe(36);
    });

    console.log("✅ Database-friendly UUID properties verified");
  });
});