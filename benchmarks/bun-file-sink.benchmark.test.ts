import { test, describe, expect } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import fs from "node:fs";

describe("Bun FileSink Performance Benchmarks", () => {
  const ITERATIONS = 1000;
  let tempFiles: string[] = [];

  // Cleanup helper
  function cleanup() {
    for (const file of tempFiles) {
      try {
        fs.unlinkSync(file);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    tempFiles = [];
  }

  function createTempPath(name: string) {
    const path = join(tmpdir(), `bun-filesink-bench-${Date.now()}-${name}.txt`);
    tempFiles.push(path);
    try {
      fs.unlinkSync(path);
    } catch (e) {
      // File doesn't exist, that's fine
    }
    return path;
  }

  test("FileSink write performance - small strings", () => {
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const filePath = createTempPath(`small-${i}`);
      const writer = Bun.file(filePath).writer();
      writer.write("Hello World");
      writer.end();
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / ITERATIONS;

    console.log(`📊 FileSink Small Strings: ${(avgTime * 1000).toFixed(3)}μs per write`);
    expect(avgTime).toBeLessThan(10); // Should be fast (< 10ms per write)

    cleanup();
  });

  test("FileSink write performance - large content", () => {
    const largeContent = "x".repeat(1024 * 10); // 10KB
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS / 10; i++) { // Reduce iterations for large content
      const filePath = createTempPath(`large-${i}`);
      const writer = Bun.file(filePath).writer();
      writer.write(largeContent);
      writer.end();
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / (ITERATIONS / 10);

    console.log(`📊 FileSink Large Content (10KB): ${(avgTime * 1000).toFixed(3)}μs per write`);
    expect(avgTime).toBeLessThan(50); // Should be reasonable (< 50ms per 10KB write)

    cleanup();
  });

  test("FileSink write performance - multiple chunks", () => {
    const chunks = ["Hello", ", ", "World", "!", "\n", "This is a test."];
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const filePath = createTempPath(`chunks-${i}`);
      const writer = Bun.file(filePath).writer();

      for (const chunk of chunks) {
        writer.write(chunk);
      }

      writer.end();
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / ITERATIONS;

    console.log(`📊 FileSink Multiple Chunks: ${(avgTime * 1000).toFixed(3)}μs per multi-chunk write`);
    expect(avgTime).toBeLessThan(15); // Should be efficient

    cleanup();
  });

  test("FileSink flush performance", () => {
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const filePath = createTempPath(`flush-${i}`);
      const writer = Bun.file(filePath).writer();

      writer.write("First chunk");
      writer.flush(); // Force flush
      writer.write("Second chunk");
      writer.flush(); // Force flush
      writer.write("Third chunk");
      writer.end();
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / ITERATIONS;

    console.log(`📊 FileSink With Flushes: ${(avgTime * 1000).toFixed(3)}μs per flushed write`);
    expect(avgTime).toBeLessThan(20); // Should be reasonable with flushes

    cleanup();
  });

  test("FileSink highWaterMark performance", () => {
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS / 5; i++) { // Reduce iterations for highWaterMark test
      const filePath = createTempPath(`hwm-${i}`);
      const writer = Bun.file(filePath).writer({ highWaterMark: 1 });

      writer.write("A");
      writer.flush();
      writer.write("B");
      writer.flush();
      writer.write("C");
      writer.end();
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / (ITERATIONS / 5);

    console.log(`📊 FileSink High Water Mark: ${(avgTime * 1000).toFixed(3)}μs per HWM write`);
    expect(avgTime).toBeLessThan(25); // Should be reasonable with small buffer

    cleanup();
  });

  test("FileSink binary data performance", () => {
    const binaryData = new Uint8Array(1024); // 1KB binary data
    for (let i = 0; i < binaryData.length; i++) {
      binaryData[i] = i % 256;
    }

    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS / 10; i++) { // Reduce iterations for binary data
      const filePath = createTempPath(`binary-${i}`);
      const writer = Bun.file(filePath).writer();
      writer.write(binaryData);
      writer.end();
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / (ITERATIONS / 10);

    console.log(`📊 FileSink Binary Data (1KB): ${(avgTime * 1000).toFixed(3)}μs per binary write`);
    expect(avgTime).toBeLessThan(30); // Should handle binary data efficiently

    cleanup();
  });

  test("FileSink concurrent writes performance", async () => {
    const concurrentOps = 10;
    const startTime = performance.now();

    const promises = [];
    for (let i = 0; i < concurrentOps; i++) {
      promises.push((async () => {
        for (let j = 0; j < ITERATIONS / concurrentOps; j++) {
          const filePath = createTempPath(`concurrent-${i}-${j}`);
          const writer = Bun.file(filePath).writer();
          await writer.write(`Concurrent write ${i}-${j}`);
          await writer.end();
        }
      })());
    }

    await Promise.all(promises);

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / (ITERATIONS / concurrentOps) / concurrentOps;

    console.log(`📊 FileSink Concurrent (${concurrentOps} ops): ${(avgTime * 1000).toFixed(3)}μs per concurrent write`);
    expect(avgTime).toBeLessThan(50); // Should handle concurrency well

    cleanup();
  });

  test("FileSink memory efficiency", () => {
    const writers: any[] = [];
    const startTime = performance.now();

    // Create many writers
    for (let i = 0; i < 100; i++) {
      const filePath = createTempPath(`memory-${i}`);
      const writer = Bun.file(filePath).writer();
      writers.push(writer);
    }

    // Write to all writers
    for (const writer of writers) {
      writer.write("Memory test data");
    }

    // End all writers
    for (const writer of writers) {
      writer.end();
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log(`📊 FileSink Memory Test (100 files): ${totalTime.toFixed(2)}ms total`);
    console.log(`📊 Average per file: ${(totalTime / 100 * 1000).toFixed(3)}μs`);

    expect(totalTime).toBeLessThan(1000); // Should complete in reasonable time

    cleanup();
  });
});