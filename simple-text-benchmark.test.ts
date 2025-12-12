#!/usr/bin/env bun

/**
 * 🎯 Simple Text File Loading Benchmark
 *
 * Focused benchmark comparing Bun text file loading approaches.
 */

import { test, describe, expect } from 'bun:test';

// Create test files
const testFile = './benchmark-test.txt';
const testContent = 'Hello World! This is a test file for benchmarking text loading in Bun.';

await Bun.write(testFile, testContent);

describe('Text File Loading Performance', () => {
  test('Bun.file().text() performance', async () => {
    const start = performance.now();
    const content = await Bun.file(testFile).text();
    const end = performance.now();
    const duration = end - start;
    console.log(`Bun.file().text() took ${duration.toFixed(2)}ms`);
    expect(content.length).toBeGreaterThan(0);
  });

  test('fs.readFileSync() performance', () => {
    const fs = require('fs');
    const start = performance.now();
    const content = fs.readFileSync(testFile, 'utf8');
    const end = performance.now();
    const duration = end - start;
    console.log(`fs.readFileSync() took ${duration.toFixed(2)}ms`);
    expect(content.length).toBeGreaterThan(0);
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