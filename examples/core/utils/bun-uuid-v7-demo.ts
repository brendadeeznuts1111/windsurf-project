#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/utils
 * @difficulty intermediate
 * @prerequisites []
 * @related-examples
 *   - examples/bun-uuid-demo.test.ts (existing UUID demo)
 *   - examples/core/utils/bun-utils-benchmark.ts (performance testing)
 *   - examples/core/networking/bun-api-validation.ts (ID generation)
 * @guides examples/bun-uuid-v7-guide.md
 * @tests examples/bun-uuid-v7.test.ts
 * @benchmarks benchmarks/uuid-v7-performance.bench.ts
 * @tags uuid, crypto, timestamp, sorting, performance, time-sortable
 * @description Comprehensive demonstration of Bun.randomUUIDv7 native API with utility functions for validation, timestamp extraction, and comparison
 */

// ============================================================================
// UUID V7 UTILITIES (Using Bun.randomUUIDv7 Native API)
// ============================================================================

class UUIDv7 {
  /**
   * Generate a UUID v7 using Bun's native implementation
   * Format: timestamp (48 bits) + version (4 bits) + variant (2 bits) + random (62 bits)
   */
  static generate(encoding: "hex" | "base64" | "base64url" = "hex", timestamp?: number): string {
    // Use Bun's native randomUUIDv7 implementation
    return Bun.randomUUIDv7(encoding, timestamp);
  }

  /**
   * Generate a UUID v7 as a Buffer using Bun's native implementation
   */
  static generateBuffer(timestamp?: number): Buffer {
    return Bun.randomUUIDv7("buffer", timestamp);
  }

  /**
   * Extract timestamp from UUID v7
   */
  static extractTimestamp(uuid: string): number {
    // Remove dashes and decode hex
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);

    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    // Extract 48-bit timestamp (first 6 bytes, big-endian)
    const timestamp48 = (BigInt(bytes[0]) << 40n) |
                       (BigInt(bytes[1]) << 32n) |
                       (BigInt(bytes[2]) << 24n) |
                       (BigInt(bytes[3]) << 16n) |
                       (BigInt(bytes[4]) << 8n) |
                       BigInt(bytes[5]);

    return Number(timestamp48);
  }

  /**
   * Validate UUID v7 format
   */
  static validate(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Compare two UUIDs for time ordering
   */
  static compare(uuid1: string, uuid2: string): number {
    const ts1 = this.extractTimestamp(uuid1);
    const ts2 = this.extractTimestamp(uuid2);

    if (ts1 !== ts2) {
      return ts1 - ts2;
    }

    // If timestamps are equal, compare the full UUIDs
    return uuid1.localeCompare(uuid2);
  }
}

// ============================================================================
// DEMO APPLICATION
// ============================================================================

class UUIDv7Demo {
  private results: any[] = [];

  async demonstrateUUIDv7(): Promise<void> {
    console.log('🆔 UUID v7 Time-Sortable Demonstration');
    console.log('=====================================\n');

    // Basic UUID generation
    console.log('🔢 Basic UUID Generation:');
    const uuids = [];
    for (let i = 0; i < 5; i++) {
      const uuid = UUIDv7.generate();
      uuids.push(uuid);
      console.log(`  ${i + 1}. ${uuid}`);
    }

    // Different encodings
    console.log('\n📝 Different Encodings:');
    const baseUuid = UUIDv7.generate();
    console.log(`  Hex:     ${baseUuid}`);
    console.log(`  Base64:  ${UUIDv7.generate('base64')}`);
    console.log(`  Base64URL: ${UUIDv7.generate('base64url')}`);
    console.log(`  Buffer:  ${UUIDv7.generateBuffer().toString('hex')} (as hex for display)`);

    // Timestamp control
    console.log('\n⏰ Timestamp Control:');
    const now = Date.now();
    const past = now - 3600000; // 1 hour ago
    const future = now + 3600000; // 1 hour from now

    console.log(`  Current: ${UUIDv7.generate('hex', now)}`);
    console.log(`  Past:    ${UUIDv7.generate('hex', past)}`);
    console.log(`  Future:  ${UUIDv7.generate('hex', future)}`);

    // Time-sortable property demonstration
    console.log('\n📈 Time-Sortable Property:');
    const timeBasedUuids = [];
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay
      const uuid = UUIDv7.generate();
      timeBasedUuids.push(uuid);
      const timestamp = UUIDv7.extractTimestamp(uuid);
      console.log(`  ${i + 1}. ${uuid.substring(0, 18)}... → ${new Date(timestamp).toISOString()}`);
    }

    // Verify sorting
    const sorted = [...timeBasedUuids].sort((a, b) => UUIDv7.compare(a, b));
    const isSorted = sorted.every((uuid, index) =>
      index === 0 || UUIDv7.compare(sorted[index - 1], uuid) <= 0
    );
    console.log(`  UUIDs are properly time-sorted: ${isSorted ? '✅' : '❌'}`);

    // Performance demonstration
    console.log('\n⚡ Performance Demonstration:');
    const perfResults = await this.runPerformanceTest();
    console.log(`  Generated ${perfResults.count.toLocaleString()} UUIDs in ${perfResults.duration.toFixed(2)}ms`);
    console.log(`  Speed: ${(perfResults.count / perfResults.duration * 1000).toFixed(0).toLocaleString()} UUIDs/second`);
    console.log(`  Memory usage: ${perfResults.memoryUsage} bytes per UUID`);

    // Use cases demonstration
    console.log('\n🎯 Use Cases:');
    await this.demonstrateUseCases();

    // Validation
    console.log('\n🔍 Validation:');
    const testUuid = UUIDv7.generate();
    console.log(`  Generated UUID: ${testUuid}`);
    console.log(`  Is valid UUID v7: ${UUIDv7.validate(testUuid) ? '✅' : '❌'}`);
    console.log(`  Extracted timestamp: ${new Date(UUIDv7.extractTimestamp(testUuid)).toISOString()}`);

    console.log('\n🎉 UUID v7 demonstration complete!');
    console.log('\n💡 Key Benefits:');
    console.log('   • Time-sortable: UUIDs sort chronologically');
    console.log('   • High performance: Fast generation with crypto security');
    console.log('   • Multiple encodings: Hex, Base64, Base64URL, Buffer');
    console.log('   • Timestamp control: Generate UUIDs for specific times');
    console.log('   • Database friendly: Efficient indexing and partitioning');
  }

  private async runPerformanceTest(): Promise<{ count: number; duration: number; memoryUsage: number }> {
    const iterations = 10000;
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      UUIDv7.generate();
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      count: iterations,
      duration: endTime - startTime,
      memoryUsage: Math.round((endMemory - startMemory) / iterations)
    };
  }

  private async demonstrateUseCases(): Promise<void> {
    // Database primary keys
    console.log('  🗄️  Database Primary Keys:');
    const dbRecords = [];
    for (let i = 0; i < 3; i++) {
      const id = UUIDv7.generate();
      dbRecords.push({ id, data: `Record ${i + 1}` });
      console.log(`    INSERT INTO users (id, data) VALUES ('${id}', '${dbRecords[i].data}');`);
    }

    // Distributed systems
    console.log('\n  🌐 Distributed Systems:');
    const nodes = ['node-a', 'node-b', 'node-c'];
    const distributedIds = nodes.map(node => ({
      node,
      id: UUIDv7.generate()
    }));

    distributedIds.forEach(({ node, id }) => {
      console.log(`    ${node}: ${id.substring(0, 13)}...`);
    });

    // Verify time ordering
    const globallyOrdered = distributedIds
      .map(item => item.id)
      .sort((a, b) => UUIDv7.compare(a, b))
      .every((id, index, arr) =>
        index === 0 || UUIDv7.compare(arr[index - 1], arr[index]) <= 0
      );
    console.log(`    Globally time-ordered across nodes: ${globallyOrdered ? '✅' : '❌'}`);
  }
}

// ============================================================================
// CROSS-REFERENCE METADATA (for future integration)
// ============================================================================

/**
 * @example-metadata
 * @category core/utils
 * @difficulty intermediate
 * @prerequisites []
 * @related-examples
 *   - examples/bun-uuid-demo.test.ts
 *   - examples/core/utils/bun-utils-benchmark.ts
 *   - examples/core/networking/bun-api-validation.ts
 * @guides examples/bun-uuid-v7-guide.md
 * @tests examples/bun-uuid-v7.test.ts
 * @benchmarks benchmarks/uuid-v7-performance.bench.ts
 * @tags uuid, crypto, timestamp, sorting, performance, time-sortable
 * @description Time-sortable UUID v7 generation with multiple encodings and performance demonstration
 */

// ============================================================================
// DEMO EXECUTION
// ============================================================================

if (import.meta.main) {
  const demo = new UUIDv7Demo();
  demo.demonstrateUUIDv7().catch(console.error);
}

export { UUIDv7, UUIDv7Demo };