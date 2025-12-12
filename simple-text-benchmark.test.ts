#!/usr/bin/env bun

/**
 * 🎯 Simple Text File Loading Benchmark
 *
 * Focused benchmark comparing Bun text file loading approaches.
 */

import { bench, describe } from 'bun:test';

// Create test files
const testFile = './benchmark-test.txt';
const testContent = 'Hello World! This is a test file for benchmarking text loading in Bun.';

await Bun.write(testFile, testContent);

describe('Text File Loading Performance', () => {
  bench('Bun.file().text()', async () => {
    const content = await Bun.file(testFile).text();
    return content.length;
  });

  bench('Bun.file().textSync()', () => {
    const content = Bun.file(testFile).textSync();
    return content.length;
  });
});

// Clean up
process.on('exit', () => {
  try {
    Bun.file(testFile).delete();
  } catch {
    // Ignore cleanup errors
  }
});