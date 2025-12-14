import { expect, describe, test } from 'bun:test';
import { BunServeAdvanced } from '../../examples/core/bun-serve-advanced';
import { BunCompressionManager } from '../../examples/streaming/bun-compression';
import { uuidGenerator } from '../../src/utils/bun-uuid';
import { deepEquals } from '../../src/testing/bun-deepequals';
import { resolveManager } from '../../src/module/bun-resolve';
import { BunFileSystemManager } from '../../examples/core/file-system-advanced';

describe('Bun API Integration Validation', () => {
  describe('EX021: Bun.serve Advanced', () => {
    test('should create server instance', () => {
      const server = new BunServeAdvanced();
      expect(server).toBeDefined();
      expect(typeof server.start).toBe('function');
      expect(typeof server.stop).toBe('function');
    });
  });

  describe('EX038: Bun Compression', () => {
    const compressor = new BunCompressionManager();

    test('should compress text data', async () => {
      const data = Buffer.from('Hello World! '.repeat(1000));
      const result = await compressor.autoCompress(data);

      expect(result.compressed.length).toBeLessThan(data.length);
      expect(result.algorithm).toBe('zstd');
      expect(result.savings).toBeGreaterThan(0);
    });

    test('should skip compression for small data', async () => {
      const data = Buffer.from('small');
      const result = await compressor.autoCompress(data);

      expect(result.algorithm).toBe('none');
      expect(result.savings).toBe(0);
    });
  });

  describe('EX032: Bun UUID Generation', () => {
    test('should generate valid UUIDv7', () => {
      const id = uuidGenerator.generate();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should generate bulk UUIDs', () => {
      const batch = uuidGenerator.generateBulk(10);
      expect(batch).toHaveLength(10);
      expect(new Set(batch).size).toBe(10); // All unique
    });
  });

  describe('EX035: Bun Deep Equals', () => {
    test('should compare simple objects', () => {
      const obj1 = { a: 1, b: 'test' };
      const obj2 = { a: 1, b: 'test' };
      const obj3 = { a: 1, b: 'different' };

      expect(deepEquals.equals(obj1, obj2)).toBe(true);
      expect(deepEquals.equals(obj1, obj3)).toBe(false);
    });

    test('should handle circular references', () => {
      const obj1: any = { a: 1 };
      const obj2: any = { a: 1 };
      obj1.self = obj1;
      obj2.self = obj2;

      expect(() => deepEquals.equals(obj1, obj2)).not.toThrow();
    });

    test('should benchmark performance', () => {
      const perf = deepEquals.benchmark(50);
      expect(perf.duration).toBeGreaterThan(0);
      expect(perf.comparisons_per_second).toBeGreaterThan(0);
    });
  });

  describe('EX027: Bun Hash Suite', () => {
    test('should generate consistent hashes', () => {
      const data = 'test data';
      const hash1 = Bun.hash(data);
      const hash2 = Bun.hash(data);

      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different data', () => {
      const hash1 = Bun.hash('data1');
      const hash2 = Bun.hash('data2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('EX026: Bun Password Suite', () => {
    test('should hash and verify passwords', async () => {
      const password = 'test-password-123';
      const hash = await Bun.password.hash(password);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);

      const isValid = await Bun.password.verify(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await Bun.password.verify('wrong-password', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('EX044: Bun JSC Memory Management', () => {
    test('should track memory usage', () => {
      const memUsage = process.memoryUsage();

      expect(memUsage.heapUsed).toBeGreaterThan(0);
      expect(memUsage.heapTotal).toBeGreaterThan(0);
      expect(memUsage.rss).toBeGreaterThan(0);
    });

    test('should force garbage collection', () => {
      const initialMem = process.memoryUsage().heapUsed;

      // Create some garbage
      const garbage = Array(10000).fill({ data: 'test'.repeat(100) });

      // Force GC if available
      if (global.gc) {
        global.gc();
        const finalMem = process.memoryUsage().heapUsed;
        expect(finalMem).toBeLessThanOrEqual(initialMem);
      }
    });
  });

  describe('EX041: Bun Module Resolution', () => {
    test('should resolve existing modules', () => {
      const result = resolveManager.resolve('bun:sqlite');

      expect(typeof result).toBe('string');
      expect(result).toContain('bun:sqlite');
    });

    test('should handle non-existent modules', () => {
      expect(() => {
        resolveManager.resolve('non-existent-module-12345');
      }).toThrow();
    });
  });

  describe('EX001: Bun File System Advanced', () => {
    test('should stream process files', async () => {
      const fsManager = new BunFileSystemManager();
      const results: string[] = [];

      // Create a test file
      await Bun.write('test-stream.txt', 'line1\nerror: something\nline3\n');

      try {
        const generator = fsManager.streamProcessLogs('test-stream.txt', line =>
          line.includes('error')
        );

        for await (const line of generator) {
          results.push(line);
        }

        expect(results).toContain('error: something');
      } finally {
        await Bun.file('test-stream.txt').delete();
      }
    });
  });
});