#!/usr/bin/env bun

/**
 * 🚀 Bun-Native API Integration Master Suite - Performance Benchmarks
 *
 * Comprehensive benchmark suite testing all major Bun APIs for performance
 * and reliability. This suite covers the complete Bun API surface.
 */

import { test, describe } from "bun:test";

describe("Bun API Performance Benchmarks", () => {
  test("Bun.serve HTTP request performance", async () => {
    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      const server = Bun.serve({
        port: 0,
        fetch() { return new Response("OK"); },
      });

      await fetch(server.url);
      server.stop();

      const end = performance.now();
      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`📊 Bun.serve HTTP request: ${avgTime.toFixed(2)}ms avg (${minTime.toFixed(2)}ms - ${maxTime.toFixed(2)}ms)`);
  });

  test("Bun.hash performance", () => {
    const iterations = 100000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      Bun.hash("test data " + i);
    }

    const end = performance.now();
    const opsPerSec = iterations / ((end - start) / 1000);

    console.log(`📊 Bun.hash: ${(opsPerSec / 1000).toFixed(0)}K ops/sec`);
  });

  test("Bun.password.hash performance", async () => {
    const iterations = 10;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await Bun.password.hash("password123" + i);
    }

    const end = performance.now();
    const avgTime = (end - start) / iterations;

    console.log(`📊 Bun.password.hash: ${avgTime.toFixed(2)}ms per hash`);
  });

  test("Bun.gzipSync performance", () => {
    const data = Buffer.alloc(1024 * 1024); // 1MB
    const iterations = 10;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      Bun.gzipSync(data);
    }

    const end = performance.now();
    const avgTime = (end - start) / iterations;
    const throughput = (1024 * 1024 * iterations) / ((end - start) / 1000) / (1024 * 1024); // MB/sec

    console.log(`📊 Bun.gzipSync 1MB: ${avgTime.toFixed(2)}ms avg, ${throughput.toFixed(1)} MB/sec`);
  });

  test("Bun.zstdCompress performance", async () => {
    const data = Buffer.alloc(1024 * 1024); // 1MB
    const iterations = 10;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await Bun.zstdCompress(data);
    }

    const end = performance.now();
    const avgTime = (end - start) / iterations;
    const throughput = (1024 * 1024 * iterations) / ((end - start) / 1000) / (1024 * 1024); // MB/sec

    console.log(`📊 Bun.zstdCompress 1MB: ${avgTime.toFixed(2)}ms avg, ${throughput.toFixed(1)} MB/sec`);
  });

  test("Bun.deepEquals performance", () => {
    const obj1 = { a: { b: [1, 2, { c: 3 }] } };
    const obj2 = { a: { b: [1, 2, { c: 3 }] } };
    const iterations = 100000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      Bun.deepEquals(obj1, obj2);
    }

    const end = performance.now();
    const opsPerSec = iterations / ((end - start) / 1000);

    console.log(`📊 Bun.deepEquals: ${(opsPerSec / 1000).toFixed(0)}K ops/sec`);
  });

  test("Bun.randomUUIDv7 performance", () => {
    const iterations = 100000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      Bun.randomUUIDv7();
    }

    const end = performance.now();
    const opsPerSec = iterations / ((end - start) / 1000);

    console.log(`📊 Bun.randomUUIDv7: ${(opsPerSec / 1000).toFixed(0)}K ops/sec`);
  });

  test("Bun.CryptoHasher performance", () => {
    const iterations = 10000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const hasher = new Bun.CryptoHasher("sha256");
      hasher.update("test data " + i);
      hasher.digest("hex");
    }

    const end = performance.now();
    const opsPerSec = iterations / ((end - start) / 1000);

    console.log(`📊 Bun.CryptoHasher: ${(opsPerSec / 1000).toFixed(0)}K ops/sec`);
  });

  test("Bun.TOML.parse performance", () => {
    const toml = `
    [package]
    name = "test"
    version = "1.0.0"
    dependencies = { "bun" = "1.0.0" }
    [scripts]
    dev = "bun run dev.ts"
    build = "bun run build.ts"
    `;
    const iterations = 10000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      Bun.TOML.parse(toml);
    }

    const end = performance.now();
    const opsPerSec = iterations / ((end - start) / 1000);

    console.log(`📊 Bun.TOML.parse: ${(opsPerSec / 1000).toFixed(0)}K ops/sec`);
  });
});