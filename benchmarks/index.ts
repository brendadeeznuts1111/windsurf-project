#!/usr/bin/env bun

/**
 * Bun Benchmarks Index
 * Comprehensive performance testing suite for Bun examples
 */

const BENCHMARKS = {
  'bun-rest-performance.bench.ts': {
    category: 'api-performance',
    description: 'REST API performance benchmarks with load testing and regression detection',
    examples: ['examples/applications/apis/bun-rest-crud-api.ts'],
    metrics: ['responseTime', 'throughput', 'errorRate', 'memoryUsage'],
    baselines: {
      responseTime: { target: 10, unit: 'ms', direction: 'lower-better' },
      throughput: { target: 1000, unit: 'req/sec', direction: 'higher-better' },
      memoryUsage: { target: 50, unit: 'MB', direction: 'lower-better' }
    },
    runCommand: 'bun run benchmarks/bun-rest-performance.bench.ts'
  },

  'bun-api-benchmark.test.ts': {
    category: 'api-performance',
    description: 'General API performance testing suite',
    examples: ['examples/applications/apis/bun-rest-crud-api.ts'],
    metrics: ['responseTime', 'throughput'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-api-benchmark.test.ts'
  },

  'bun-api-benchmarks-real.bench.ts': {
    category: 'api-performance',
    description: 'Real-world API performance scenarios',
    examples: ['examples/applications/apis/bun-rest-crud-api.ts'],
    metrics: ['responseTime', 'throughput', 'latency'],
    baselines: {},
    runCommand: 'bun run benchmarks/bun-api-benchmarks-real.bench.ts'
  },

  'bun-file-mime.benchmark.test.ts': {
    category: 'file-performance',
    description: 'File MIME type detection performance',
    examples: ['examples/core/file-system/bun-file-mime-demo.test.ts', 'examples/core/file-system/bun-file-mime-advanced-demo.test.ts'],
    metrics: ['detectionSpeed', 'accuracy'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-file-mime.benchmark.test.ts'
  },

  'bun-file-sink.benchmark.test.ts': {
    category: 'file-performance',
    description: 'File sink/streaming performance benchmarks',
    examples: ['examples/core/file-system/bun-file-streaming.ts', 'examples/core/file-system/bun-file-upload-api.ts'],
    metrics: ['throughput', 'memoryUsage', 'latency'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-file-sink.benchmark.test.ts'
  },

  'bun-snapshot-testing.benchmark.test.ts': {
    category: 'testing-performance',
    description: 'Snapshot testing performance benchmarks',
    examples: ['examples/bun-snapshot-testing.test.ts', 'examples/bun-snapshot-testing-advanced.test.ts'],
    metrics: ['testExecutionTime', 'memoryUsage'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-snapshot-testing.benchmark.test.ts'
  },

  'bun-testing-features-demo.test.ts': {
    category: 'testing-performance',
    description: 'Testing framework feature demonstrations',
    examples: ['examples/bun-testing-demo.ts', 'examples/bun-advanced-testing.test.ts'],
    metrics: ['testExecutionTime', 'coverage'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-testing-features-demo.test.ts'
  },

  'bun-tcp-socket.benchmark.test.ts': {
    category: 'network-performance',
    description: 'TCP socket performance benchmarks',
    examples: ['examples/core/networking/bun-tls-server.ts'],
    metrics: ['throughput', 'latency', 'connections'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-tcp-socket.benchmark.test.ts'
  },

  'bun-strip-ansi.benchmark.test.ts': {
    category: 'utility-performance',
    description: 'ANSI stripping utility performance',
    examples: ['examples/core/bun-strip-ansi.ts'],
    metrics: ['processingSpeed', 'memoryUsage'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-strip-ansi.benchmark.test.ts'
  },

  'uuid-generation.bench.ts': {
    category: 'utility-performance',
    description: 'UUID generation performance benchmarks',
    examples: ['examples/bun-uuid-demo.test.ts'],
    metrics: ['generationSpeed', 'uniqueness', 'memoryUsage'],
    baselines: {},
    runCommand: 'bun run benchmarks/uuid-generation.bench.ts'
  },

  'bun-executable-compilation.benchmark.test.ts': {
    category: 'build-performance',
    description: 'Executable compilation performance benchmarks',
    examples: [],
    metrics: ['compilationTime', 'binarySize', 'startupTime'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-executable-compilation.benchmark.test.ts'
  },

  'bun-error-tracker.benchmark.test.ts': {
    category: 'error-handling-performance',
    description: 'Error tracking and handling performance',
    examples: ['examples/bun-error-tracker.ts', 'examples/bun-error-tracker-demo.test.ts'],
    metrics: ['errorProcessingTime', 'memoryUsage', 'accuracy'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-error-tracker.benchmark.test.ts'
  },

  'bun-deprecation.benchmark.test.ts': {
    category: 'maintenance-performance',
    description: 'Deprecation warning performance benchmarks',
    examples: [],
    metrics: ['warningGenerationTime', 'memoryUsage'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-deprecation.benchmark.test.ts'
  },

  'text-file-loading.benchmark.test.ts': {
    category: 'file-performance',
    description: 'Text file loading performance benchmarks',
    examples: ['examples/bun-text-file-import-demo.ts', 'examples/bun-text-file-loader-demo.ts'],
    metrics: ['loadTime', 'memoryUsage', 'parsingSpeed'],
    baselines: {},
    runCommand: 'bun test benchmarks/text-file-loading.benchmark.test.ts'
  },

  'text-file-loading.performance.test.ts': {
    category: 'file-performance',
    description: 'Text file loading performance analysis',
    examples: ['examples/bun-text-file-import-demo.ts', 'examples/bun-text-file-loader-demo.ts'],
    metrics: ['loadTime', 'throughput', 'memoryUsage'],
    baselines: {},
    runCommand: 'bun test benchmarks/text-file-loading.performance.test.ts'
  },

  'concurrent-testing.benchmark.test.ts': {
    category: 'testing-performance',
    description: 'Concurrent testing performance benchmarks',
    examples: ['examples/bun-testing-demo.ts', 'examples/bun-advanced-testing.test.ts'],
    metrics: ['executionTime', 'resourceUsage', 'parallelEfficiency'],
    baselines: {},
    runCommand: 'bun test benchmarks/concurrent-testing.benchmark.test.ts'
  },

  'bun-testing-performance.benchmark.test.ts': {
    category: 'testing-performance',
    description: 'General testing framework performance',
    examples: ['examples/bun-testing-demo.ts', 'examples/bun-advanced-testing.test.ts'],
    metrics: ['testExecutionTime', 'memoryUsage', 'parallelization'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-testing-performance.benchmark.test.ts'
  },

  'bun-mime-api-constants.benchmark.test.ts': {
    category: 'api-performance',
    description: 'MIME API constants performance benchmarks',
    examples: ['examples/bun-mime-api-constants-demo.ts'],
    metrics: ['lookupSpeed', 'memoryUsage'],
    baselines: {},
    runCommand: 'bun test benchmarks/bun-mime-api-constants.benchmark.test.ts'
  }
};

// ============================================================================
// BENCHMARK CATEGORIES
// ============================================================================

const BENCHMARK_CATEGORIES = {
  'api-performance': {
    name: 'API Performance',
    description: 'HTTP API, REST endpoints, and server performance',
    benchmarks: Object.keys(BENCHMARKS).filter(key => BENCHMARKS[key].category === 'api-performance'),
    priority: 'high'
  },

  'file-performance': {
    name: 'File System Performance',
    description: 'File operations, streaming, and I/O performance',
    benchmarks: Object.keys(BENCHMARKS).filter(key => BENCHMARKS[key].category === 'file-performance'),
    priority: 'high'
  },

  'testing-performance': {
    name: 'Testing Framework Performance',
    description: 'Test execution, snapshot testing, and assertion performance',
    benchmarks: Object.keys(BENCHMARKS).filter(key => BENCHMARKS[key].category === 'testing-performance'),
    priority: 'medium'
  },

  'network-performance': {
    name: 'Network Performance',
    description: 'TCP sockets, WebSocket, and network operations',
    benchmarks: Object.keys(BENCHMARKS).filter(key => BENCHMARKS[key].category === 'network-performance'),
    priority: 'medium'
  },

  'utility-performance': {
    name: 'Utility Performance',
    description: 'UUID generation, ANSI stripping, and utility functions',
    benchmarks: Object.keys(BENCHMARKS).filter(key => BENCHMARKS[key].category === 'utility-performance'),
    priority: 'low'
  },

  'build-performance': {
    name: 'Build Performance',
    description: 'Compilation, bundling, and executable generation',
    benchmarks: Object.keys(BENCHMARKS).filter(key => BENCHMARKS[key].category === 'build-performance'),
    priority: 'medium'
  },

  'error-handling-performance': {
    name: 'Error Handling Performance',
    description: 'Error tracking, logging, and exception handling',
    benchmarks: Object.keys(BENCHMARKS).filter(key => BENCHMARKS[key].category === 'error-handling-performance'),
    priority: 'low'
  },

  'maintenance-performance': {
    name: 'Maintenance Performance',
    description: 'Deprecation warnings, cleanup, and maintenance operations',
    benchmarks: Object.keys(BENCHMARKS).filter(key => BENCHMARKS[key].category === 'maintenance-performance'),
    priority: 'low'
  }
};

// ============================================================================
// CLI INTERFACE
// ============================================================================

console.log('🚀 Bun Benchmarks - Performance Testing Suite');
console.log(`Total Benchmarks: ${Object.keys(BENCHMARKS).length}`);
console.log(`Categories: ${Object.keys(BENCHMARK_CATEGORIES).length}`);
console.log('');

// CLI argument handling
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
    console.log('📋 Available Benchmarks:');
    Object.entries(BENCHMARK_CATEGORIES).forEach(([category, info]) => {
      console.log(`\n🏷️  ${info.name} (${info.priority} priority)`);
      console.log(`   ${info.description}`);
      info.benchmarks.forEach(benchmark => {
        const bench = BENCHMARKS[benchmark];
        console.log(`   • ${benchmark}`);
        console.log(`     ${bench.description}`);
        console.log(`     Examples: ${bench.examples.length > 0 ? bench.examples.join(', ') : 'None'}`);
        console.log(`     Run: ${bench.runCommand}`);
      });
    });
    break;

  case 'category':
    const categoryName = args[1];
    if (!categoryName || !BENCHMARK_CATEGORIES[categoryName]) {
      console.log('Usage: bun run benchmarks/index.ts category <category>');
      console.log('Available categories:', Object.keys(BENCHMARK_CATEGORIES).join(', '));
      process.exit(1);
    }
    const category = BENCHMARK_CATEGORIES[categoryName];
    console.log(`🏷️  ${category.name} Benchmarks:`);
    category.benchmarks.forEach(benchmark => {
      const bench = BENCHMARKS[benchmark];
      console.log(`\n📊 ${benchmark}`);
      console.log(`   ${bench.description}`);
      console.log(`   Command: ${bench.runCommand}`);
      if (bench.examples.length > 0) {
        console.log(`   Related Examples: ${bench.examples.join(', ')}`);
      }
      if (Object.keys(bench.baselines).length > 0) {
        console.log(`   Baselines: ${Object.keys(bench.baselines).join(', ')}`);
      }
    });
    break;

  case 'run':
    const benchmarkName = args[1];
    if (!benchmarkName || !BENCHMARKS[benchmarkName]) {
      console.log('Usage: bun run benchmarks/index.ts run <benchmark>');
      console.log('Use "list" to see available benchmarks');
      process.exit(1);
    }
    const benchmark = BENCHMARKS[benchmarkName];
    console.log(`🏃 Running: ${benchmarkName}`);
    console.log(`📝 ${benchmark.description}`);
    console.log(`\nCommand: ${benchmark.runCommand}`);
    console.log('\n⚠️  Please run the command manually to execute the benchmark.');
    break;

  case 'stats':
    const totalBenchmarks = Object.keys(BENCHMARKS).length;
    const benchmarksWithBaselines = Object.values(BENCHMARKS).filter(b => Object.keys(b.baselines).length > 0).length;
    const benchmarksWithExamples = Object.values(BENCHMARKS).filter(b => b.examples.length > 0).length;

    console.log('📊 Benchmark Statistics:');
    console.log(`   Total Benchmarks: ${totalBenchmarks}`);
    console.log(`   With Baselines: ${benchmarksWithBaselines}`);
    console.log(`   With Examples: ${benchmarksWithExamples}`);
    console.log(`   Categories: ${Object.keys(BENCHMARK_CATEGORIES).length}`);

    console.log('\n📈 Benchmarks by Category:');
    Object.entries(BENCHMARK_CATEGORIES).forEach(([key, category]) => {
      console.log(`   ${category.name}: ${category.benchmarks.length} (${category.priority})`);
    });
    break;

  default:
    console.log('🔧 Bun Benchmark Index Commands:');
    console.log('  list                    - List all benchmarks by category');
    console.log('  category <name>         - Show benchmarks in a specific category');
    console.log('  run <benchmark>         - Show how to run a specific benchmark');
    console.log('  stats                   - Show benchmark statistics');
    console.log('');
    console.log('📊 Current Status:');
    console.log(`   • ${Object.keys(BENCHMARKS).length} benchmarks across ${Object.keys(BENCHMARK_CATEGORIES).length} categories`);
    console.log('   • 1 benchmark with performance baselines');
    console.log('   • Linked to examples with cross-reference system');
    console.log('   • Regression detection capabilities');
    break;
}

export { BENCHMARKS, BENCHMARK_CATEGORIES };