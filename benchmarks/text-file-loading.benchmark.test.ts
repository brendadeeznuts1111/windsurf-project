#!/usr/bin/env bun

/**
 * ⚡ Bun Text File Loading Benchmarks
 *
 * Performance comparison of different text file loading approaches in Bun.
 * Compares Bun native APIs and utility classes.
 */

import { test, describe, beforeAll, afterAll, expect } from 'bun:test';
import { BunTextLoader } from '../src/utils/bun-text-loader';

describe("Bun Text File Loading Performance Benchmarks", () => {
  const ITERATIONS = 100;
  let testFile: string;

  beforeAll(async () => {
    // Create a test file
    testFile = "/tmp/bun-benchmark-test.txt";
    const content = "x".repeat(1024); // 1KB test file
    await Bun.write(testFile, content);
  });

  afterAll(async () => {
    // Cleanup
    try {
      await Bun.write(testFile, "");
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  test("Bun.file().text() performance", async () => {
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const file = Bun.file(testFile);
      const content = await file.text();
      if (!content || content.length !== 1024) {
        throw new Error("Invalid content loaded");
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / ITERATIONS;

    console.log(`📊 Bun.file().text() (${ITERATIONS} calls):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per call: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Calls per second: ${Math.floor(ITERATIONS / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(10); // Should be fast
  });

  test("BunTextLoader.load() performance", async () => {
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const result = await BunTextLoader.load(testFile);
      if (!result.content || result.content.length !== 1024) {
        throw new Error("Invalid content loaded");
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / ITERATIONS;

    console.log(`📊 BunTextLoader.load() (${ITERATIONS} calls):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per call: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Calls per second: ${Math.floor(ITERATIONS / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(10); // Should be fast
  });

  test("BunTextLoader.loadCached() performance", async () => {
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const result = await BunTextLoader.loadCached(testFile);
      if (!result.content || result.content.length !== 1024) {
        throw new Error("Invalid content loaded");
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / ITERATIONS;

    console.log(`📊 BunTextLoader.loadCached() (${ITERATIONS} calls):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per call: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Calls per second: ${Math.floor(ITERATIONS / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(10); // Should be fast
  });
});