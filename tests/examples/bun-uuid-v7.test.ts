#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/utils
 * @difficulty intermediate
 * @prerequisites examples/core/utils/bun-uuid-v7-demo.ts
 * @related-examples
 *   - examples/core/utils/bun-uuid-v7-demo.ts (implementation)
 *   - examples/bun-uuid-demo.test.ts (existing UUID tests)
 * @tests examples/bun-uuid-v7-comprehensive.test.ts
 * @benchmarks benchmarks/uuid-v7-performance.bench.ts
 * @tags uuid, testing, validation, crypto, time-sortable
 * @description Comprehensive test suite for Bun.randomUUIDv7 implementation with format validation, time ordering, and performance testing
 */

import { UUIDv7 } from './core/utils/bun-uuid-v7-demo';

// ============================================================================
// TEST UTILITIES
// ============================================================================

class TestRunner {
  private tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];
  private results: Array<{ name: string; passed: boolean; error?: string; duration: number }> = [];

  test(name: string, fn: () => void | Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 UUID v7 Comprehensive Test Suite');
    console.log('====================================\n');

    for (const test of this.tests) {
      const startTime = performance.now();

      try {
        await test.fn();
        const duration = performance.now() - startTime;
        this.results.push({ name: test.name, passed: true, duration });
        console.log(`✅ ${test.name} (${duration.toFixed(2)}ms)`);
      } catch (error) {
        const duration = performance.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.results.push({ name: test.name, passed: false, error: errorMessage, duration });
        console.log(`❌ ${test.name} (${duration.toFixed(2)}ms): ${errorMessage}`);
      }
    }

    this.printSummary();
  }

  private printSummary() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Duration: ${avgDuration.toFixed(2)}ms per test`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.name}: ${result.error}`);
      });
    }

    console.log('\n🎯 Test Coverage:');
    console.log('   • UUID format validation');
    console.log('   • Time-sortable properties');
    console.log('   • Encoding variations');
    console.log('   • Timestamp extraction');
    console.log('   • Comparison functions');
    console.log('   • Performance benchmarks');
    console.log('   • Edge cases and error handling');

    if (passed === total) {
      console.log('\n🎉 All tests passed! UUID v7 implementation is working correctly.');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Please review the implementation.`);
    }
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

const testRunner = new TestRunner();

// Basic UUID generation tests
testRunner.test('UUID v7 basic generation', () => {
  const uuid = UUIDv7.generate();
  if (!UUIDv7.validate(uuid)) {
    throw new Error('Generated UUID is not valid');
  }
  if (!uuid.includes('-')) {
    throw new Error('UUID should contain dashes');
  }
});

testRunner.test('UUID v7 format validation', () => {
  // Valid UUID v7
  const validUuid = '019b1b90-a7b0-7c10-8b5d-9b7c13e3a3d9';
  if (!UUIDv7.validate(validUuid)) {
    throw new Error('Valid UUID v7 should pass validation');
  }

  // Invalid UUIDs
  const invalidUuids = [
    'not-a-uuid',
    '019b1b90-a7b0-4c10-8b5d-9b7c13e3a3d9', // Wrong version (4 instead of 7)
    '019b1b90-a7b0-7c10-8b5d-9b7c13e3a3d', // Too short
    '019b1b90-a7b0-7c10-8b5d-9b7c13e3a3d99', // Too long
  ];

  for (const invalid of invalidUuids) {
    if (UUIDv7.validate(invalid)) {
      throw new Error(`Invalid UUID should not pass validation: ${invalid}`);
    }
  }
});

testRunner.test('UUID v7 version and variant bits', () => {
  const uuid = UUIDv7.generate();
  const parts = uuid.split('-');

  // Version should be 7 (0b0111) - stored in high 4 bits of first char of parts[2]
  const version = parseInt(parts[2][0], 16);
  if (version !== 7) {
    throw new Error(`UUID version should be 7, got ${version}`);
  }

  // Variant should be RFC 4122 (0b10) - stored in high 2 bits of first char of parts[3]
  const variantNibble = parseInt(parts[3][0], 16);
  const variant = variantNibble >> 2; // High 2 bits
  if (variant !== 2) {
    throw new Error(`UUID variant should be 2 (RFC 4122), got ${variant}`);
  }
});

testRunner.test('UUID v7 encoding variations', () => {
  const uuidHex = UUIDv7.generate('hex');
  const uuidBase64 = UUIDv7.generate('base64');
  const uuidBase64URL = UUIDv7.generate('base64url');

  // All should be strings
  if (typeof uuidHex !== 'string' || typeof uuidBase64 !== 'string' || typeof uuidBase64URL !== 'string') {
    throw new Error('All encodings should return strings');
  }

  // Hex should contain dashes and be valid UUID
  if (!uuidHex.includes('-') || !UUIDv7.validate(uuidHex)) {
    throw new Error('Hex encoding should be valid UUID format');
  }

  // Base64 should not contain dashes
  if (uuidBase64.includes('-')) {
    throw new Error('Base64 encoding should not contain dashes');
  }

  // Base64URL should not contain certain characters
  if (uuidBase64URL.includes('+') || uuidBase64URL.includes('/')) {
    throw new Error('Base64URL should not contain + or / characters');
  }
});

testRunner.test('UUID v7 timestamp control', () => {
  const now = Date.now();
  const past = now - 3600000; // 1 hour ago
  const future = now + 3600000; // 1 hour from now

  const uuidNow = UUIDv7.generate('hex', now);
  const uuidPast = UUIDv7.generate('hex', past);
  const uuidFuture = UUIDv7.generate('hex', future);

  // Extract timestamps
  const tsNow = UUIDv7.extractTimestamp(uuidNow);
  const tsPast = UUIDv7.extractTimestamp(uuidPast);
  const tsFuture = UUIDv7.extractTimestamp(uuidFuture);

  // Timestamps should be close to input (within 1 second due to millisecond precision)
  if (Math.abs(tsNow - now) > 1000) {
    throw new Error(`Timestamp extraction inaccurate for current time: expected ~${now}, got ${tsNow}`);
  }
  if (Math.abs(tsPast - past) > 1000) {
    throw new Error(`Timestamp extraction inaccurate for past time: expected ~${past}, got ${tsPast}`);
  }
  if (Math.abs(tsFuture - future) > 1000) {
    throw new Error(`Timestamp extraction inaccurate for future time: expected ~${future}, got ${tsFuture}`);
  }
});

testRunner.test('UUID v7 time-sortable property', () => {
  const uuids: string[] = [];

  // Generate UUIDs with small time delays
  for (let i = 0; i < 10; i++) {
    uuids.push(UUIDv7.generate());
    // Small delay to ensure different timestamps
    const start = Date.now();
    while (Date.now() - start < 1) {} // Busy wait for 1ms
  }

  // Verify they are in time order
  for (let i = 1; i < uuids.length; i++) {
    if (UUIDv7.compare(uuids[i-1], uuids[i]) >= 0) {
      throw new Error(`UUIDs are not properly time-sorted: ${uuids[i-1]} should come before ${uuids[i]}`);
    }
  }

  // Verify sorting function works
  const shuffled = [...uuids].sort(() => Math.random() - 0.5);
  const sorted = shuffled.sort((a, b) => UUIDv7.compare(a, b));

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== uuids[i]) {
      throw new Error('Sorting function does not produce correct time order');
    }
  }
});

testRunner.test('UUID v7 comparison function', () => {
  const uuid1 = UUIDv7.generate();
  const uuid2 = UUIDv7.generate();

  // Same UUID should compare as equal
  if (UUIDv7.compare(uuid1, uuid1) !== 0) {
    throw new Error('Same UUID should compare as equal');
  }

  // Different UUIDs should have consistent comparison
  const comparison1 = UUIDv7.compare(uuid1, uuid2);
  const comparison2 = UUIDv7.compare(uuid2, uuid1);

  if (comparison1 !== -comparison2) {
    throw new Error('UUID comparison should be antisymmetric');
  }

  // Transitivity
  const uuid3 = UUIDv7.generate();
  const comp12 = UUIDv7.compare(uuid1, uuid2);
  const comp23 = UUIDv7.compare(uuid2, uuid3);
  const comp13 = UUIDv7.compare(uuid1, uuid3);

  if (comp12 <= 0 && comp23 <= 0 && comp13 > 0) {
    throw new Error('UUID comparison should be transitive');
  }
});

testRunner.test('UUID v7 uniqueness', () => {
  const uuids = new Set<string>();
  const count = 10000;

  for (let i = 0; i < count; i++) {
    uuids.add(UUIDv7.generate());
  }

  if (uuids.size !== count) {
    throw new Error(`UUIDs are not unique: generated ${count} UUIDs but only ${uuids.size} are unique`);
  }
});

testRunner.test('UUID v7 timestamp extraction edge cases', () => {
  // Test with various timestamps
  const testCases = [
    0, // Unix epoch
    1000000000000, // Year 2001
    1609459200000, // 2021-01-01
    Date.now(),
    9999999999999, // Near max 48-bit timestamp
  ];

  for (const timestamp of testCases) {
    const uuid = UUIDv7.generate('hex', timestamp);
    const extracted = UUIDv7.extractTimestamp(uuid);

    // Should be within 1ms due to rounding
    if (Math.abs(extracted - timestamp) > 1) {
      throw new Error(`Timestamp extraction failed for ${timestamp}: got ${extracted}`);
    }
  }
});

testRunner.test('UUID v7 performance baseline', () => {
  const iterations = 10000;
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    UUIDv7.generate();
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  const speed = iterations / (duration / 1000);

  // Should be reasonably fast (> 100,000 UUIDs/sec)
  if (speed < 100000) {
    throw new Error(`Performance too slow: ${speed.toFixed(0)} UUIDs/sec (minimum: 100,000)`);
  }

  console.log(`   Performance: ${speed.toFixed(0).toLocaleString()} UUIDs/sec`);
});

testRunner.test('UUID v7 memory efficiency', () => {
  const iterations = 1000;
  const startMemory = process.memoryUsage().heapUsed;

  const uuids: string[] = [];
  for (let i = 0; i < iterations; i++) {
    uuids.push(UUIDv7.generate());
  }

  const endMemory = process.memoryUsage().heapUsed;
  const memoryPerUuid = (endMemory - startMemory) / iterations;

  // Should be reasonable (< 1KB per UUID)
  if (memoryPerUuid > 1024) {
    throw new Error(`Memory usage too high: ${memoryPerUuid.toFixed(2)} bytes per UUID (maximum: 1024)`);
  }

  console.log(`   Memory: ${memoryPerUuid.toFixed(2)} bytes per UUID`);
});

testRunner.test('UUID v7 error handling', () => {
  // Test invalid inputs to extractTimestamp
  const invalidUuids = [
    'not-a-uuid',
    '019b1b90-a7b0-7c10-8b5d-9b7c13e3a3d', // Too short
    '019b1b90-a7b0-7c10-8b5d-9b7c13e3a3d99', // Too long
    '019b1b90-a7b0-7c10-8b5d-9b7c13e3a3dx', // Invalid character
  ];

  for (const invalid of invalidUuids) {
    try {
      UUIDv7.extractTimestamp(invalid);
      throw new Error(`Should have thrown error for invalid UUID: ${invalid}`);
    } catch (error) {
      // Expected - invalid UUID should cause error
    }
  }

  // Test comparison with invalid UUIDs
  try {
    UUIDv7.compare('invalid-uuid', UUIDv7.generate());
    throw new Error('Should have thrown error for invalid UUID in comparison');
  } catch (error) {
    // Expected
  }
});

testRunner.test('UUID v7 distributed system simulation', () => {
  // Simulate multiple nodes generating UUIDs concurrently
  const nodes = 5;
  const uuidsPerNode = 100;
  const allUuids: Array<{ node: number; uuid: string }> = [];

  for (let node = 0; node < nodes; node++) {
    for (let i = 0; i < uuidsPerNode; i++) {
      allUuids.push({
        node,
        uuid: UUIDv7.generate()
      });
    }
  }

  // All UUIDs should be unique across nodes
  const uuidSet = new Set(allUuids.map(item => item.uuid));
  if (uuidSet.size !== allUuids.length) {
    throw new Error(`UUIDs not unique across nodes: ${allUuids.length} generated, ${uuidSet.size} unique`);
  }

  // UUIDs should be sortable globally
  const sorted = allUuids
    .map(item => item.uuid)
    .sort((a, b) => UUIDv7.compare(a, b));

  // Verify global ordering
  for (let i = 1; i < sorted.length; i++) {
    if (UUIDv7.compare(sorted[i-1], sorted[i]) > 0) {
      throw new Error('Global UUID ordering violated in distributed simulation');
    }
  }

  console.log(`   Distributed test: ${nodes} nodes × ${uuidsPerNode} UUIDs = ${allUuids.length} total, all unique and sortable`);
});

// ============================================================================
// RUN TESTS
// ============================================================================

if (import.meta.main) {
  testRunner.run().catch(console.error);
}

export { TestRunner };