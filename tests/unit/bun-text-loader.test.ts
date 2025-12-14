#!/usr/bin/env bun

/**
 * 📝 Bun Text File Operations Tests
 *
 * Comprehensive tests for text file reading/writing operations
 * Based on Bun's official testing patterns and guidelines
 */

import { test, describe, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { expect } from 'bun:test';
import { BunTextLoader } from './bun-text-loader';
import { tempDir } from '../../harness';
import { constants, promises as fs } from 'node:fs';
import path from 'node:path';

// Default file permissions (0o644)
const defaultMode = constants.S_IWUSR | constants.S_IRUSR | constants.S_IRGRP | constants.S_IROTH;

describe('BunTextLoader', () => {
  let testDir: any;

  beforeAll(() => {
    testDir = tempDir('text-loader-tests');
  });

  afterAll(async () => {
    // Automatic cleanup via disposable
  });

  describe('load() method', () => {
    beforeEach(async () => {
      // Create test files
      await Bun.write(`${testDir}/test.txt`, 'Hello World');
      await Bun.write(`${testDir}/empty.txt`, '');
      await Bun.write(`${testDir}/unicode.txt`, 'Hello 世界 🌍');
      await Bun.write(`${testDir}/json.txt`, '{"test": true}');
    });

    afterEach(async () => {
      // Clean up test files
      const files = ['test.txt', 'empty.txt', 'unicode.txt', 'json.txt'];
      await Promise.all(
        files.map(file =>
          fs.unlink(`${testDir}/${file}`).catch(() => {})
        )
      );
    });

    test('loads existing text file correctly', async () => {
      const result = await BunTextLoader.load(`${testDir}/test.txt`);
      expect(result.content).toBe('Hello World');
      expect(result.size).toBe(11);
      expect(result.encoding).toBe('utf8');
      expect(result.cached).toBe(false);
    });

    test('loads empty file correctly', async () => {
      const result = await BunTextLoader.load(`${testDir}/empty.txt`);
      expect(result.content).toBe('');
      expect(result.size).toBe(0);
    });

    test('handles unicode content correctly', async () => {
      const result = await BunTextLoader.load(`${testDir}/unicode.txt`);
      expect(result.content).toBe('Hello 世界 🌍');
    });

    test('throws on non-existent file', async () => {
      await expect(
        BunTextLoader.load(`${testDir}/nonexistent.txt`)
      ).rejects.toThrow();
    });

    test('caching works correctly', async () => {
      const filePath = `${testDir}/test.txt`;

      // Clear cache to ensure clean state
      BunTextLoader.clearCache();

      // First load (not cached)
      const result1 = await BunTextLoader.load(filePath);
      expect(result1.cached).toBe(false);

      // Second load (should be cached)
      const result2 = await BunTextLoader.loadCached(filePath);
      expect(result2.cached).toBe(true);
      expect(result2.content).toBe(result1.content);
    });

    test('base64 encoding works', async () => {
      const result = await BunTextLoader.load(`${testDir}/test.txt`, {
        encoding: 'base64'
      });
      expect(result.encoding).toBe('base64');
      expect(result.content).toBe(Buffer.from('Hello World').toString('base64'));
    });
  });

  describe('loadBatch() method', () => {
    beforeEach(async () => {
      await Bun.write(`${testDir}/batch1.txt`, 'File 1');
      await Bun.write(`${testDir}/batch2.txt`, 'File 2');
      await Bun.write(`${testDir}/batch3.txt`, 'File 3');
    });

    afterEach(async () => {
      const files = ['batch1.txt', 'batch2.txt', 'batch3.txt'];
      await Promise.all(
        files.map(file =>
          fs.unlink(`${testDir}/${file}`).catch(() => {})
        )
      );
    });

    test('loads multiple files correctly', async () => {
      const filePaths = [
        `${testDir}/batch1.txt`,
        `${testDir}/batch2.txt`,
        `${testDir}/batch3.txt`
      ];

      const result = await BunTextLoader.loadBatch(filePaths);

      expect(result.results).toHaveLength(3);
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.totalTime).toBeGreaterThan(0);

      expect(result.results[0].content).toBe('File 1');
      expect(result.results[1].content).toBe('File 2');
      expect(result.results[2].content).toBe('File 3');
    });

    test('handles mixed success/failure correctly', async () => {
      const filePaths = [
        `${testDir}/batch1.txt`,
        `${testDir}/nonexistent.txt`,
        `${testDir}/batch2.txt`
      ];

      const result = await BunTextLoader.loadBatch(filePaths);

      expect(result.results).toHaveLength(2); // Only successful loads
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(1);
      expect(result.totalTime).toBeGreaterThan(0);
    });

    test('loadBatchContents returns just content strings', async () => {
      const filePaths = [
        `${testDir}/batch1.txt`,
        `${testDir}/batch2.txt`
      ];

      const contents = await BunTextLoader.loadBatchContents(filePaths);

      expect(contents).toEqual(['File 1', 'File 2']);
    });
  });

  describe('loadSync() method', () => {
    beforeEach(async () => {
      await Bun.write(`${testDir}/sync.txt`, 'Sync Content');
    });

    afterEach(async () => {
      await fs.unlink(`${testDir}/sync.txt`).catch(() => {});
    });

    test('loads file synchronously', () => {
      const result = BunTextLoader.loadSync(`${testDir}/sync.txt`);
      expect(result.content).toBe('Sync Content');
      expect(result.cached).toBe(false);
    });
  });

  describe('file operations', () => {
    test('exists() checks file existence correctly', async () => {
      expect(await BunTextLoader.exists(`${testDir}/test.txt`)).toBe(false);

      await Bun.write(`${testDir}/test.txt`, 'test');
      expect(await BunTextLoader.exists(`${testDir}/test.txt`)).toBe(true);

      await fs.unlink(`${testDir}/test.txt`);
    });

    test('stat() returns file information', async () => {
      const content = 'Hello World';
      await Bun.write(`${testDir}/stat.txt`, content);

      const stat = await BunTextLoader.stat(`${testDir}/stat.txt`);
      expect(stat.exists).toBe(true);
      expect(stat.size).toBe(content.length);

      await fs.unlink(`${testDir}/stat.txt`);
    });
  });

  describe('cache management', () => {
    beforeEach(async () => {
      await Bun.write(`${testDir}/cache.txt`, 'Cache Test');
    });

    afterEach(async () => {
      await fs.unlink(`${testDir}/cache.txt`).catch(() => {});
    });

    test('cache statistics work', () => {
      const stats = BunTextLoader.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('totalSize');
      expect(typeof stats.size).toBe('number');
    });

    test('clearCache() works', async () => {
      // Load and cache a file
      await BunTextLoader.loadCached(`${testDir}/cache.txt`);

      let stats = BunTextLoader.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // Clear cache
      BunTextLoader.clearCache();

      stats = BunTextLoader.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('error handling', () => {
    test('provides detailed error messages', async () => {
      try {
        await BunTextLoader.load('/nonexistent/path/file.txt');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('Failed to load text file');
        expect(error.message).toContain('/nonexistent/path/file.txt');
      }
    });

    test('handles directory paths correctly', async () => {
      await expect(
        BunTextLoader.load(testDir.toString())
      ).rejects.toThrow();
    });
  });

  describe('integration with Bun.write', () => {
    test('works with files created by Bun.write', async () => {
      const filePath = `${testDir}/bun-write-test.txt`;
      const content = 'Created by Bun.write()';

      // Create file with Bun.write
      await Bun.write(filePath, content);

      // Load with BunTextLoader
      const result = await BunTextLoader.load(filePath);
      expect(result.content).toBe(content);
      expect(result.size).toBe(content.length);

      // Clean up
      await fs.unlink(filePath);
    });

    test('handles different file permissions', async () => {
      const filePath = `${testDir}/perms-test.txt`;
      const content = 'Permissions test';

      // Create file
      await Bun.write(filePath, content);

      // Check permissions
      const stat = await fs.stat(filePath);
      expect(stat.mode & defaultMode).toBe(defaultMode);

      // Load and verify content
      const result = await BunTextLoader.load(filePath);
      expect(result.content).toBe(content);

      // Clean up
      await fs.unlink(filePath);
    });
  });
});

describe('Text File Utilities', () => {
  let testDir: any;

  beforeAll(() => {
    testDir = tempDir('text-utils-tests');
  });

  test('loadJSON parses JSON files correctly', async () => {
    const jsonContent = '{"name": "test", "value": 42}';
    await Bun.write(`${testDir}/test.json`, jsonContent);

    const data = await BunTextLoader.loadJSON(`${testDir}/test.json`);
    expect(data.name).toBe('test');
    expect(data.value).toBe(42);

    await fs.unlink(`${testDir}/test.json`);
  });

  test('loadCSV parses CSV files correctly', async () => {
    const csvContent = 'name,age\nAlice,25\nBob,30';
    await Bun.write(`${testDir}/test.csv`, csvContent);

    const data = await BunTextLoader.loadCSV(`${testDir}/test.csv`);
    expect(data).toEqual([
      ['name', 'age'],
      ['Alice', '25'],
      ['Bob', '30']
    ]);

    await fs.unlink(`${testDir}/test.csv`);
  });

  test('loadLines splits content into lines', async () => {
    const content = 'Line 1\nLine 2\nLine 3';
    await Bun.write(`${testDir}/lines.txt`, content);

    const lines = await BunTextLoader.loadLines(`${testDir}/lines.txt`);
    expect(lines).toEqual(['Line 1', 'Line 2', 'Line 3']);

    await fs.unlink(`${testDir}/lines.txt`);
  });
});

describe('Performance Tests', () => {
  let testDir: any;

  beforeAll(() => {
    testDir = tempDir('perf-tests');
  });

  test('handles large files efficiently', async () => {
    const largeContent = 'x'.repeat(100000); // 100KB
    await Bun.write(`${testDir}/large.txt`, largeContent);

    const start = performance.now();
    const result = await BunTextLoader.load(`${testDir}/large.txt`);
    const duration = performance.now() - start;

    expect(result.content.length).toBe(100000);
    expect(duration).toBeLessThan(100); // Should be fast

    await fs.unlink(`${testDir}/large.txt`);
  });

  test('batch loading is faster than individual loads', async () => {
    // Create multiple test files
    const files = ['file1.txt', 'file2.txt', 'file3.txt'];
    const content = 'Test content';

    await Promise.all(
      files.map(file => Bun.write(`${testDir}/${file}`, content))
    );

    const filePaths = files.map(file => `${testDir}/${file}`);

    // Time batch load
    const batchStart = performance.now();
    await BunTextLoader.loadBatch(filePaths);
    const batchTime = performance.now() - batchStart;

    // Time individual loads
    const individualStart = performance.now();
    await Promise.all(filePaths.map(path => BunTextLoader.load(path)));
    const individualTime = performance.now() - individualStart;

    // Batch should be faster or equal
    expect(batchTime).toBeLessThanOrEqual(individualTime + 10); // Allow small variance

    // Clean up
    await Promise.all(files.map(file => fs.unlink(`${testDir}/${file}`)));
  });
});