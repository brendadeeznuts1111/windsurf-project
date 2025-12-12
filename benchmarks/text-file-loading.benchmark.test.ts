#!/usr/bin/env bun

/**
 * ⚡ Bun Text File Loading Benchmarks
 *
 * Comprehensive performance comparison of different text file loading approaches in Bun.
 * Compares Bun native APIs, utility classes, and simulated Node.js patterns.
 */

import { bench, describe, beforeAll, afterAll } from 'bun:test';
import { BunTextLoader } from '../src/utils/bun-text-loader';

// ============================================================================
// TEST DATA SETUP
// ============================================================================

const TEST_FILES = {
  small: { name: 'small.txt', content: 'Hello World', size: 'small' },
  medium: { name: 'medium.txt', content: 'x'.repeat(1024 * 10), size: 'medium' }, // 10KB
  large: { name: 'large.txt', content: 'x'.repeat(1024 * 100), size: 'large' }, // 100KB
  xlarge: { name: 'xlarge.txt', content: 'x'.repeat(1024 * 1000), size: 'xlarge' }, // 1MB
} as const;

let testFilePaths: Record<string, string>;

// ============================================================================
// BENCHMARK SETUP
// ============================================================================

beforeAll(async () => {
  console.log('📁 Setting up benchmark test files...');

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

  console.log('✅ Benchmark setup complete');
});

afterAll(async () => {
  console.log('🧹 Cleaning up benchmark files...');

  // Clean up test files
  for (const filePath of Object.values(testFilePaths)) {
    try {
      await Bun.file(filePath).delete();
    } catch (error) {
      console.warn(`Failed to delete ${filePath}:`, error);
    }
  }

  console.log('✅ Benchmark cleanup complete');
});

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

describe('Text File Loading Performance Benchmarks', () => {
  // ============================================================================
  // SMALL FILE BENCHMARKS (11 bytes)
  // ============================================================================

  describe('Small File (11 bytes)', () => {
    const filePath = testFilePaths.small;

    bench('Bun.file().text()', async () => {
      await Bun.file(filePath).text();
    });

    bench('Bun.file().textSync()', () => {
      Bun.file(filePath).textSync();
    });

    bench('BunTextLoader.load()', async () => {
      await BunTextLoader.load(filePath);
    });

    bench('BunTextLoader.loadSync()', () => {
      BunTextLoader.loadSync(filePath);
    });

    bench('BunTextLoader.loadCached() - first', async () => {
      await BunTextLoader.loadCached(filePath);
    });

    bench('BunTextLoader.loadCached() - cached', async () => {
      await BunTextLoader.loadCached(filePath);
    });

    // Simulated Node.js require.extensions pattern
    bench('Simulated require.extensions', async () => {
      // Simulate the Node.js pattern using Bun
      const content = await Bun.file(filePath).text();
      // In Node.js this would be: module.exports = content
      return content;
    });
  });

  // ============================================================================
  // MEDIUM FILE BENCHMARKS (10KB)
  // ============================================================================

  describe('Medium File (10KB)', () => {
    const filePath = testFilePaths.medium;

    bench('Bun.file().text()', async () => {
      await Bun.file(filePath).text();
    });

    bench('Bun.file().textSync()', () => {
      Bun.file(filePath).textSync();
    });

    bench('BunTextLoader.load()', async () => {
      await BunTextLoader.load(filePath);
    });

    bench('BunTextLoader.loadSync()', () => {
      BunTextLoader.loadSync(filePath);
    });

    bench('BunTextLoader.loadCached() - first', async () => {
      await BunTextLoader.loadCached(filePath);
    });

    bench('BunTextLoader.loadCached() - cached', async () => {
      await BunTextLoader.loadCached(filePath);
    });
  });

  // ============================================================================
  // LARGE FILE BENCHMARKS (100KB)
  // ============================================================================

  describe('Large File (100KB)', () => {
    const filePath = testFilePaths.large;

    bench('Bun.file().text()', async () => {
      await Bun.file(filePath).text();
    });

    bench('Bun.file().textSync()', () => {
      Bun.file(filePath).textSync();
    });

    bench('BunTextLoader.load()', async () => {
      await BunTextLoader.load(filePath);
    });

    bench('BunTextLoader.loadSync()', () => {
      BunTextLoader.loadSync(filePath);
    });

    bench('BunTextLoader.loadCached() - first', async () => {
      await BunTextLoader.loadCached(filePath);
    });

    bench('BunTextLoader.loadCached() - cached', async () => {
      await BunTextLoader.loadCached(filePath);
    });
  });

  // ============================================================================
  // EXTRA LARGE FILE BENCHMARKS (1MB)
  // ============================================================================

  describe('Extra Large File (1MB)', () => {
    const filePath = testFilePaths.xlarge;

    bench('Bun.file().text()', async () => {
      await Bun.file(filePath).text();
    });

    bench('Bun.file().textSync()', () => {
      Bun.file(filePath).textSync();
    });

    bench('BunTextLoader.load()', async () => {
      await BunTextLoader.load(filePath);
    });

    bench('BunTextLoader.loadSync()', () => {
      BunTextLoader.loadSync(filePath);
    });

    bench('BunTextLoader.loadCached() - first', async () => {
      await BunTextLoader.loadCached(filePath);
    });

    bench('BunTextLoader.loadCached() - cached', async () => {
      await BunTextLoader.loadCached(filePath);
    });
  });

  // ============================================================================
  // BATCH LOADING BENCHMARKS
  // ============================================================================

  describe('Batch Loading', () => {
    const filePaths = Object.values(testFilePaths);

    bench('Promise.all() + Bun.file().text()', async () => {
      await Promise.all(filePaths.map(path => Bun.file(path).text()));
    });

    bench('BunTextLoader.loadBatch()', async () => {
      await BunTextLoader.loadBatch(filePaths);
    });

    bench('BunTextLoader.loadBatchContents()', async () => {
      await BunTextLoader.loadBatchContents(filePaths);
    });

    // Sequential loading for comparison
    bench('Sequential Bun.file().text()', async () => {
      for (const path of filePaths) {
        await Bun.file(path).text();
      }
    });
  });

  // ============================================================================
  // ENCODING BENCHMARKS
  // ============================================================================

  describe('Encoding Performance', () => {
    const filePath = testFilePaths.medium;

    bench('UTF-8 (default)', async () => {
      await Bun.file(filePath).text();
    });

    bench('Base64 encoding', async () => {
      const bytes = new Uint8Array(await Bun.file(filePath).arrayBuffer());
      Buffer.from(bytes).toString('base64');
    });

    bench('BunTextLoader base64', async () => {
      await BunTextLoader.load(filePath, { encoding: 'base64' });
    });
  });

  // ============================================================================
  // ERROR HANDLING BENCHMARKS
  // ============================================================================

  describe('Error Handling', () => {
    const nonexistentFile = './benchmark-files/nonexistent.txt';

    bench('Bun.file().text() - error', async () => {
      try {
        await Bun.file(nonexistentFile).text();
      } catch {
        // Expected error
      }
    });

    bench('BunTextLoader.load() - error', async () => {
      try {
        await BunTextLoader.load(nonexistentFile);
      } catch {
        // Expected error
      }
    });
  });
});

// ============================================================================
// MEMORY USAGE ANALYSIS
// ============================================================================

describe('Memory Usage Analysis', () => {
  bench('Load and process 1MB file', async () => {
    const content = await Bun.file(testFilePaths.xlarge).text();
    // Simulate some processing
    const lines = content.split('\n');
    const processed = lines.map(line => line.toUpperCase()).join('\n');
    return processed.length;
  });

  bench('Load multiple files simultaneously', async () => {
    const contents = await Promise.all(
      Object.values(testFilePaths).map(path => Bun.file(path).text())
    );
    return contents.reduce((sum, content) => sum + content.length, 0);
  });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Run benchmarks and display results
 */
export async function runTextFileBenchmarks() {
  console.log('⚡ Running Bun Text File Loading Benchmarks...\n');

  // Run the benchmarks
  const startTime = performance.now();

  // Note: In a real benchmark run, you'd use `bun test --bench` to run these
  console.log('📊 Benchmark categories:');
  console.log('   • Small File (11 bytes)');
  console.log('   • Medium File (10KB)');
  console.log('   • Large File (100KB)');
  console.log('   • Extra Large File (1MB)');
  console.log('   • Batch Loading');
  console.log('   • Encoding Performance');
  console.log('   • Error Handling');
  console.log('   • Memory Usage Analysis');
  console.log('');
  console.log('💡 Run with: bun test --bench benchmarks/text-file-loading.bench.ts');
  console.log('');

  const endTime = performance.now();
  console.log(`⏱️  Setup time: ${(endTime - startTime).toFixed(2)}ms`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (import.meta.main) {
  runTextFileBenchmarks().catch(error => {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  });
}