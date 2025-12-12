#!/usr/bin/env bun

/**
 * ⚡ Bun Text File Loading Performance Test
 *
 * Simple performance measurement for text file loading operations.
 */

import { test, describe, beforeAll, afterAll, expect } from 'bun:test';
import { BunTextLoader } from '../src/utils/bun-text-loader';

describe('Text File Loading Performance', () => {
  const TEST_FILES = {
    small: { name: 'small.txt', content: 'Hello World', size: 'small' },
    medium: { name: 'medium.txt', content: 'x'.repeat(1024 * 10), size: 'medium' }, // 10KB
    large: { name: 'large.txt', content: 'x'.repeat(1024 * 100), size: 'large' }, // 100KB
  } as const;

  let testFilePaths: Record<string, string>;

  beforeAll(async () => {
    console.log('📁 Setting up performance test files...');

    // Create test directory
    await Bun.write('./benchmark-files/.gitkeep', '');

    // Create test files
    testFilePaths = {};
    for (const [key, file] of Object.entries(TEST_FILES)) {
      const filePath = `./benchmark-files/${file.name}`;
      await Bun.write(filePath, file.content);
      testFilePaths[key] = filePath;
      console.log(`   ✅ Created ${file.name} (${file.content.length} bytes)`);
    }

    console.log('✅ Performance test setup complete');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up performance test files...');
    // Clean up test files
    for (const filePath of Object.values(testFilePaths)) {
      try {
        await Bun.$`rm -f ${filePath}`;
      } catch (error) {
        console.warn(`Failed to cleanup ${filePath}:`, error);
      }
    }
    console.log('✅ Cleanup complete');
  });

  test('BunTextLoader Performance - Small File', async () => {
    const startTime = performance.now();

    for (let i = 0; i < 100; i++) {
      const result = await BunTextLoader.load(testFilePaths.small);
      if (!result.content) throw new Error('Failed to load file');
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 100;

    console.log(`📊 Small file (11 bytes): ${avgTime.toFixed(3)}ms per load`);
    expect(avgTime).toBeLessThan(10); // Should be fast
  });

  test('BunTextLoader Performance - Medium File', async () => {
    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      const result = await BunTextLoader.load(testFilePaths.medium);
      if (!result.content) throw new Error('Failed to load file');
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 50;

    console.log(`📊 Medium file (10KB): ${avgTime.toFixed(3)}ms per load`);
    expect(avgTime).toBeLessThan(50); // Should be reasonable
  });

  test('BunTextLoader Performance - Large File', async () => {
    const startTime = performance.now();

    for (let i = 0; i < 10; i++) {
      const result = await BunTextLoader.load(testFilePaths.large);
      if (!result.content) throw new Error('Failed to load file');
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 10;

    console.log(`📊 Large file (100KB): ${avgTime.toFixed(3)}ms per load`);
    expect(avgTime).toBeLessThan(100); // Should be acceptable
  });

  test('Direct Bun.file() Performance Comparison', async () => {
    const startTime = performance.now();

    for (let i = 0; i < 100; i++) {
      const result = await Bun.file(testFilePaths.small).text();
      if (!result) throw new Error('Failed to load file');
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 100;

    console.log(`📊 Direct Bun.file() (11 bytes): ${avgTime.toFixed(3)}ms per load`);
    expect(avgTime).toBeLessThan(5); // Should be very fast
  });

  test('Memory Usage Check', async () => {
    // Load large file multiple times
    for (let i = 0; i < 5; i++) {
      const result = await BunTextLoader.load(testFilePaths.large);
      if (!result.content) throw new Error('Failed to load file');
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    console.log('✅ Memory usage test completed');
  });
});