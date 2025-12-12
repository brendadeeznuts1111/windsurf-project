#!/usr/bin/env bun

/**
 * 🔬 Bun Performance Profiler
 *
 * Advanced performance profiling for Bun applications:
 * - CPU profiling and flame graphs
 * - Memory usage analysis
 * - Function-level performance metrics
 * - System resource monitoring
 * - Performance regression detection
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ============================================================================
// PROFILER TYPES
// ============================================================================

export interface ProfileResult {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    delta: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
  cpuUsage?: {
    before: NodeJS.CpuUsage;
    after: NodeJS.CpuUsage;
    delta: NodeJS.CpuUsage;
  };
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  timestamp: number;
  duration: number;
  profiles: ProfileResult[];
  summary: {
    totalProfiles: number;
    averageDuration: number;
    totalMemoryDelta: number;
    peakMemoryUsage: number;
  };
  systemInfo: {
    platform: string;
    arch: string;
    nodeVersion: string;
    bunVersion?: string;
  };
}

export interface ProfilerOptions {
  /** Enable CPU profiling */
  cpuProfiling?: boolean;
  /** Enable memory profiling */
  memoryProfiling?: boolean;
  /** Output directory for profiles */
  outputDir?: string;
  /** Enable flame graph generation */
  flameGraph?: boolean;
  /** Sample interval in milliseconds */
  sampleInterval?: number;
}

// ============================================================================
// PERFORMANCE PROFILER
// ============================================================================

export class BunPerformanceProfiler {
  private options: Required<ProfilerOptions>;
  private profiles: ProfileResult[] = [];
  private activeProfiles = new Map<string, {
    startTime: number;
    memoryBefore: NodeJS.MemoryUsage;
    cpuBefore?: NodeJS.CpuUsage;
  }>();
  private performanceObserver?: PerformanceObserver;
  private isProfiling = false;

  constructor(options: ProfilerOptions = {}) {
    this.options = {
      cpuProfiling: true,
      memoryProfiling: true,
      outputDir: join(tmpdir(), 'bun-profiles'),
      flameGraph: false,
      sampleInterval: 100,
      ...options,
    };

    // Create output directory
    try {
      mkdirSync(this.options.outputDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create profile output directory:', error);
    }
  }

  /**
   * Start profiling session
   */
  start(): void {
    if (this.isProfiling) return;

    this.isProfiling = true;
    console.log('🔬 Started performance profiling');

    // Set up performance observer for automatic profiling
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordPerformanceEntry(entry);
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure', 'function'] });
  }

  /**
   * Stop profiling session
   */
  stop(): void {
    if (!this.isProfiling) return;

    this.isProfiling = false;

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = undefined;
    }

    console.log('🛑 Stopped performance profiling');
  }

  /**
   * Profile a function execution
   */
  async profileFunction<T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; profile: ProfileResult }> {
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const cpuBefore = this.options.cpuProfiling ? process.cpuUsage() : undefined;

    this.activeProfiles.set(name, {
      startTime,
      memoryBefore,
      cpuBefore,
    });

    try {
      // Mark performance start
      performance.mark(`${name}-start`);

      const result = await fn();

      // Mark performance end
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const endTime = performance.now();
      const memoryAfter = process.memoryUsage();
      const cpuAfter = this.options.cpuProfiling ? process.cpuUsage() : undefined;

      const profile: ProfileResult = {
        name,
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: {
            rss: memoryAfter.rss - memoryBefore.rss,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            external: memoryAfter.external - memoryBefore.external,
          },
        },
        cpuUsage: cpuBefore && cpuAfter ? {
          before: cpuBefore,
          after: cpuAfter,
          delta: {
            user: cpuAfter.user - cpuBefore.user,
            system: cpuAfter.system - cpuBefore.system,
          },
        } : undefined,
        metadata,
      };

      this.profiles.push(profile);
      this.activeProfiles.delete(name);

      return { result, profile };

    } catch (error) {
      // Clean up on error
      this.activeProfiles.delete(name);
      throw error;
    }
  }

  /**
   * Profile async operations with timing
   */
  async profileAsync<T>(
    name: string,
    operation: Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; profile: ProfileResult }> {
    return this.profileFunction(name, () => operation, metadata);
  }

  /**
   * Start manual profiling session
   */
  startManualProfile(name: string): void {
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const cpuBefore = this.options.cpuProfiling ? process.cpuUsage() : undefined;

    this.activeProfiles.set(name, {
      startTime,
      memoryBefore,
      cpuBefore,
    });

    performance.mark(`${name}-start`);
  }

  /**
   * End manual profiling session
   */
  endManualProfile(name: string, metadata?: Record<string, any>): ProfileResult | null {
    const active = this.activeProfiles.get(name);
    if (!active) return null;

    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const cpuAfter = this.options.cpuProfiling ? process.cpuUsage() : undefined;

    const profile: ProfileResult = {
      name,
      startTime: active.startTime,
      endTime,
      duration: endTime - active.startTime,
      memoryUsage: {
        before: active.memoryBefore,
        after: memoryAfter,
        delta: {
          rss: memoryAfter.rss - active.memoryBefore.rss,
          heapTotal: memoryAfter.heapTotal - active.memoryBefore.heapTotal,
          heapUsed: memoryAfter.heapUsed - active.memoryBefore.heapUsed,
          external: memoryAfter.external - active.memoryBefore.external,
        },
      },
      cpuUsage: active.cpuBefore && cpuAfter ? {
        before: active.cpuBefore,
        after: cpuAfter,
        delta: {
          user: cpuAfter.user - active.cpuBefore.user,
          system: cpuAfter.system - active.cpuBefore.system,
        },
      } : undefined,
      metadata,
    };

    this.profiles.push(profile);
    this.activeProfiles.delete(name);

    return profile;
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const totalDuration = this.profiles.length > 0
      ? this.profiles[this.profiles.length - 1].endTime - this.profiles[0].startTime
      : 0;

    const totalMemoryDelta = this.profiles.reduce((sum, p) => sum + p.memoryUsage.delta.heapUsed, 0);
    const peakMemoryUsage = Math.max(...this.profiles.map(p => p.memoryUsage.after.heapUsed));

    const report: PerformanceReport = {
      timestamp: Date.now(),
      duration: totalDuration,
      profiles: [...this.profiles],
      summary: {
        totalProfiles: this.profiles.length,
        averageDuration: this.profiles.length > 0
          ? this.profiles.reduce((sum, p) => sum + p.duration, 0) / this.profiles.length
          : 0,
        totalMemoryDelta,
        peakMemoryUsage,
      },
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        bunVersion: (globalThis as any).Bun?.version,
      },
    };

    return report;
  }

  /**
   * Export report to file
   */
  exportReport(filename?: string): string {
    const report = this.generateReport();
    const filePath = join(this.options.outputDir, filename || `profile-${Date.now()}.json`);

    writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`📊 Performance report exported to: ${filePath}`);

    return filePath;
  }

  /**
   * Get current profiling statistics
   */
  getStats(): {
    activeProfiles: number;
    completedProfiles: number;
    totalDuration: number;
    averageMemoryDelta: number;
  } {
    const completedProfiles = this.profiles.length;
    const activeProfiles = this.activeProfiles.size;
    const totalDuration = this.profiles.reduce((sum, p) => sum + p.duration, 0);
    const averageMemoryDelta = completedProfiles > 0
      ? this.profiles.reduce((sum, p) => sum + p.memoryUsage.delta.heapUsed, 0) / completedProfiles
      : 0;

    return {
      activeProfiles,
      completedProfiles,
      totalDuration,
      averageMemoryDelta,
    };
  }

  /**
   * Clear all profiling data
   */
  clear(): void {
    this.profiles = [];
    this.activeProfiles.clear();
    console.log('🧹 Cleared all profiling data');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private recordPerformanceEntry(entry: PerformanceEntry): void {
    // This would be called by the PerformanceObserver
    // For automatic profiling of performance.measure() calls
    console.log(`📊 Performance entry: ${entry.name} - ${entry.duration}ms`);
  }
}

// ============================================================================
// PROFILING UTILITIES
// ============================================================================

/**
 * Profile a function with automatic reporting
 */
export async function profileFunction<T>(
  profiler: BunPerformanceProfiler,
  name: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const { result } = await profiler.profileFunction(name, fn, metadata);
  return result;
}

/**
 * Create a profiling wrapper for methods
 */
export function createProfiledWrapper<T extends Record<string, any>>(
  profiler: BunPerformanceProfiler,
  target: T,
  methodNames: (keyof T)[]
): T {
  const wrapper = { ...target };

  for (const methodName of methodNames) {
    const originalMethod = target[methodName];
    if (typeof originalMethod === 'function') {
      wrapper[methodName] = ((...args: any[]) => {
        return profiler.profileFunction(
          `${String(methodName)}`,
          () => (originalMethod as any).apply(target, args),
          { args: args.length }
        ).then(({ result }) => result);
      }) as any;
    }
  }

  return wrapper;
}

/**
 * Memory usage profiler
 */
export class MemoryProfiler {
  private snapshots: Array<{
    timestamp: number;
    memory: NodeJS.MemoryUsage;
    label?: string;
  }> = [];

  /**
   * Take memory snapshot
   */
  snapshot(label?: string): void {
    this.snapshots.push({
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      label,
    });
  }

  /**
   * Get memory usage report
   */
  getReport(): {
    snapshots: typeof this.snapshots;
    deltas: Array<{
      from: string;
      to: string;
      delta: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
      };
    }>;
  } {
    const deltas = [];

    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1];
      const curr = this.snapshots[i];

      deltas.push({
        from: prev.label || `snapshot-${i - 1}`,
        to: curr.label || `snapshot-${i}`,
        delta: {
          rss: curr.memory.rss - prev.memory.rss,
          heapTotal: curr.memory.heapTotal - prev.memory.heapTotal,
          heapUsed: curr.memory.heapUsed - prev.memory.heapUsed,
          external: curr.memory.external - prev.memory.external,
        },
      });
    }

    return { snapshots: this.snapshots, deltas };
  }

  /**
   * Clear snapshots
   */
  clear(): void {
    this.snapshots = [];
  }
}

// ============================================================================
// BENCHMARKING UTILITIES
// ============================================================================

/**
 * Run comparative benchmarks
 */
export async function runComparativeBenchmark(
  profiler: BunPerformanceProfiler,
  benchmarks: Array<{
    name: string;
    fn: () => any | Promise<any>;
    iterations?: number;
  }>
): Promise<{
  results: Array<{
    name: string;
    profiles: ProfileResult[];
    averageDuration: number;
    totalMemoryDelta: number;
  }>;
}> {
  const results = [];

  for (const benchmark of benchmarks) {
    const { name, fn, iterations = 10 } = benchmark;
    const profiles: ProfileResult[] = [];

    console.log(`🏃 Running benchmark: ${name} (${iterations} iterations)`);

    for (let i = 0; i < iterations; i++) {
      const { profile } = await profiler.profileFunction(`${name}-iteration-${i}`, fn);
      profiles.push(profile);
    }

    const averageDuration = profiles.reduce((sum, p) => sum + p.duration, 0) / profiles.length;
    const totalMemoryDelta = profiles.reduce((sum, p) => sum + p.memoryUsage.delta.heapUsed, 0);

    results.push({
      name,
      profiles,
      averageDuration,
      totalMemoryDelta,
    });

    console.log(`   ✅ Average: ${averageDuration.toFixed(2)}ms, Memory: ${(totalMemoryDelta / 1024).toFixed(1)}KB`);
  }

  return { results };
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * CLI command to run performance profiling
 */
export async function profileCommand(args: string[]): Promise<void> {
  const profiler = new BunPerformanceProfiler({
    cpuProfiling: true,
    memoryProfiling: true,
    flameGraph: false,
  });

  profiler.start();

  console.log('🔬 Running performance profiling...');

  // Profile some example operations
  await profiler.profileFunction('text-file-load', async () => {
    // Simulate text file loading
    await new Promise(resolve => setTimeout(resolve, 10));
    return 'simulated content';
  });

  await profiler.profileFunction('memory-intensive', () => {
    // Simulate memory-intensive operation
    const data = [];
    for (let i = 0; i < 10000; i++) {
      data.push({ id: i, value: Math.random() });
    }
    return data.length;
  });

  profiler.stop();

  // Generate and export report
  const reportPath = profiler.exportReport();

  // Show summary
  const stats = profiler.getStats();
  console.log('📊 Profiling Summary:');
  console.log(`   Completed profiles: ${stats.completedProfiles}`);
  console.log(`   Total duration: ${stats.totalDuration.toFixed(2)}ms`);
  console.log(`   Average memory delta: ${(stats.averageMemoryDelta / 1024).toFixed(1)}KB`);
  console.log(`   Report saved to: ${reportPath}`);
}

/**
 * CLI command to run memory profiling
 */
export async function memoryProfileCommand(): Promise<void> {
  const profiler = new MemoryProfiler();

  console.log('🧠 Running memory profiling...');

  profiler.snapshot('start');

  // Simulate memory allocations
  const data = [];
  for (let i = 0; i < 1000; i++) {
    data.push(new Array(1000).fill(Math.random()));
    if (i % 100 === 0) {
      profiler.snapshot(`iteration-${i}`);
    }
  }

  profiler.snapshot('end');

  const report = profiler.getReport();

  console.log('📊 Memory Profiling Report:');
  report.snapshots.forEach((snapshot, index) => {
    const heapMB = (snapshot.memory.heapUsed / 1024 / 1024).toFixed(1);
    console.log(`   ${snapshot.label || `snapshot-${index}`}: ${heapMB}MB heap used`);
  });

  console.log('\n📈 Memory Deltas:');
  report.deltas.forEach(delta => {
    const heapDeltaKB = (delta.delta.heapUsed / 1024).toFixed(1);
    console.log(`   ${delta.from} → ${delta.to}: ${heapDeltaKB}KB`);
  });
}

/**
 * CLI command to run comparative benchmarks
 */
export async function benchmarkCommand(args: string[]): Promise<void> {
  const profiler = new BunPerformanceProfiler();

  const benchmarks = [
    {
      name: 'simple-calculation',
      fn: () => {
        let sum = 0;
        for (let i = 0; i < 100000; i++) {
          sum += Math.sin(i) * Math.cos(i);
        }
        return sum;
      },
    },
    {
      name: 'string-operations',
      fn: () => {
        let result = '';
        for (let i = 0; i < 1000; i++) {
          result += i.toString() + '-';
        }
        return result.length;
      },
    },
    {
      name: 'object-creation',
      fn: () => {
        const objects = [];
        for (let i = 0; i < 10000; i++) {
          objects.push({
            id: i,
            name: `object-${i}`,
            data: new Array(10).fill(Math.random()),
          });
        }
        return objects.length;
      },
    },
  ];

  console.log('🏁 Running comparative benchmarks...');

  const { results } = await runComparativeBenchmark(profiler, benchmarks);

  console.log('\n📊 Benchmark Results:');
  results.forEach(result => {
    console.log(`   ${result.name}:`);
    console.log(`     Average duration: ${result.averageDuration.toFixed(2)}ms`);
    console.log(`     Total memory delta: ${(result.totalMemoryDelta / 1024).toFixed(1)}KB`);
  });

  // Export detailed report
  const reportPath = profiler.exportReport('benchmark-results.json');
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// ============================================================================
// INTEGRATION WITH EXISTING SYSTEMS
// ============================================================================

/**
 * Profile Bun text loader operations
 */
export async function profileTextLoader(profiler: BunPerformanceProfiler): Promise<void> {
  const { BunTextLoader } = await import('./bun-text-loader');

  // Create test file
  const testContent = 'x'.repeat(10000);
  await Bun.write('/tmp/profile-test.txt', testContent);

  // Profile loading
  await profiler.profileFunction('text-loader-load', async () => {
    return BunTextLoader.load('/tmp/profile-test.txt');
  });

  await profiler.profileFunction('text-loader-cache', async () => {
    return BunTextLoader.loadCached('/tmp/profile-test.txt');
  });

  // Clean up
  await Bun.file('/tmp/profile-test.txt').delete();
}

/**
 * Profile environment synchronizer
 */
export async function profileEnvSync(profiler: BunPerformanceProfiler): Promise<void> {
  const { BunEnvSynchronizer } = await import('./bun-env-synchronizer');

  const sync = new BunEnvSynchronizer();

  await profiler.profileFunction('env-sync', () => {
    return sync.sync({
      PROFILE_TEST_VAR: 'test_value',
      PROFILE_NUM_VAR: 123,
    });
  });
}

// ============================================================================
// MAIN EXPORTS
// ============================================================================

export {
  // Main classes
  BunPerformanceProfiler,
  MemoryProfiler,

  // Utility functions
  profileFunction,
  createProfiledWrapper,
  runComparativeBenchmark,

  // CLI commands
  profileCommand,
  memoryProfileCommand,
  benchmarkCommand,

  // Integration functions
  profileTextLoader,
  profileEnvSync,
};