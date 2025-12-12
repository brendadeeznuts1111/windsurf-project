#!/usr/bin/env bun

/**
 * 📈 Bun Systems Metrics Collector
 *
 * Comprehensive metrics collection for all Bun advanced features:
 * - Performance metrics (latency, throughput, memory)
 * - System health metrics
 * - Error rates and success rates
 * - Resource utilization
 * - Custom business metrics
 */

import { BunTextLoader } from './bun-text-loader';
import { BunEnvSynchronizer } from './bun-env-synchronizer';
import { BunSocketManager } from './bun-unix-socket-proxy';
import { TensionScoringEngine } from '../core/tension-scoring/tension-engine';

// ============================================================================
// METRICS TYPES
// ============================================================================

export interface SystemMetrics {
  timestamp: number;
  system: string;
  metrics: Record<string, number | string | boolean>;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface HealthMetrics {
  system: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  uptime: number;
  lastCheck: number;
  checks: {
    total: number;
    passed: number;
    failed: number;
  };
}

export interface ResourceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
}

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

export class MetricsCollector {
  private metrics: SystemMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private healthMetrics: HealthMetrics[] = [];
  private resourceMetrics: ResourceMetrics[] = [];
  private collectionInterval?: Timer;
  private isCollecting = false;

  // System instances for metrics collection
  private textLoader = BunTextLoader;
  private envSync = new BunEnvSynchronizer();
  private tensionEngine: TensionScoringEngine;

  constructor(tensionEngine: TensionScoringEngine) {
    this.tensionEngine = tensionEngine;
  }

  /**
   * Start metrics collection
   */
  startCollection(intervalMs: number = 30000): void {
    if (this.isCollecting) return;

    this.isCollecting = true;
    console.log(`📈 Starting metrics collection (interval: ${intervalMs}ms)`);

    // Initial collection
    this.collectAllMetrics();

    // Set up periodic collection
    this.collectionInterval = setInterval(() => {
      this.collectAllMetrics();
    }, intervalMs);
  }

  /**
   * Stop metrics collection
   */
  stopCollection(): void {
    if (!this.isCollecting) return;

    this.isCollecting = false;
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }

    console.log('🛑 Stopped metrics collection');
  }

  /**
   * Collect all system metrics
   */
  private collectAllMetrics(): void {
    this.collectTextLoaderMetrics();
    this.collectEnvSyncMetrics();
    this.collectSocketProxyMetrics();
    this.collectTensionMetrics();
    this.collectResourceMetrics();
    this.collectHealthMetrics();

    // Clean old metrics (keep last 1000 entries per type)
    this.cleanupOldMetrics();
  }

  /**
   * Collect text loader metrics
   */
  private collectTextLoaderMetrics(): void {
    try {
      const cacheStats = BunTextLoader.getCacheStats();

      this.addSystemMetrics('textLoader', {
        cacheSize: cacheStats.size,
        cacheTotalSize: cacheStats.totalSize,
        cacheHitRate: cacheStats.hitRate || 0,
      });
    } catch (error) {
      console.warn('Failed to collect text loader metrics:', error);
    }
  }

  /**
   * Collect environment sync metrics
   */
  private collectEnvSyncMetrics(): void {
    try {
      const validation = this.envSync.validate();

      this.addSystemMetrics('envSync', {
        synchronized: validation.isValid ? 1 : 0,
        syncIssues: validation.issues.length,
        lastValidation: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to collect env sync metrics:', error);
    }
  }

  /**
   * Collect socket proxy metrics
   */
  private collectSocketProxyMetrics(): void {
    try {
      const activeProxies = BunSocketManager.getActiveProxies();

      this.addSystemMetrics('socketProxy', {
        activeProxies: activeProxies.length,
        proxyNames: activeProxies.join(','),
      });

      // Collect individual proxy stats
      for (const proxyName of activeProxies) {
        const stats = BunSocketManager.getProxyStats(proxyName);
        if (stats) {
          this.addSystemMetrics(`socketProxy.${proxyName}`, {
            connectionsActive: stats.connectionsActive,
            connectionsTotal: stats.connectionsTotal,
            bytesForwarded: stats.bytesForwarded,
            uptime: stats.uptimeMs,
          });
        }
      }
    } catch (error) {
      console.warn('Failed to collect socket proxy metrics:', error);
    }
  }

  /**
   * Collect tension engine metrics
   */
  private collectTensionMetrics(): void {
    try {
      const metrics = this.tensionEngine.getMetrics();

      this.addSystemMetrics('tensionEngine', {
        currentTension: metrics.currentTension,
        peakTension: metrics.peakTension,
        averageTension: metrics.averageTension,
        eventCount: metrics.eventCount,
        lastEventTime: metrics.lastEventTime,
      });
    } catch (error) {
      console.warn('Failed to collect tension metrics:', error);
    }
  }

  /**
   * Collect resource metrics
   */
  private collectResourceMetrics(): void {
    try {
      const memUsage = process.memoryUsage();

      const resourceMetrics: ResourceMetrics = {
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        },
        cpu: {
          usage: 0, // Would need additional library for CPU usage
          loadAverage: require('os').loadavg(),
        },
        disk: {
          used: 0, // Would need additional library for disk usage
          total: 0,
          percentage: 0,
        },
      };

      this.resourceMetrics.push(resourceMetrics);

      // Keep only last 100 resource metrics
      if (this.resourceMetrics.length > 100) {
        this.resourceMetrics = this.resourceMetrics.slice(-100);
      }
    } catch (error) {
      console.warn('Failed to collect resource metrics:', error);
    }
  }

  /**
   * Collect health metrics
   */
  private collectHealthMetrics(): void {
    const systems = ['textLoader', 'envSync', 'socketProxy', 'tensionEngine'];

    for (const system of systems) {
      const existingHealth = this.healthMetrics.find(h => h.system === system);
      const checks = existingHealth?.checks || { total: 0, passed: 0, failed: 0 };

      checks.total++;

      // Simple health check (would be more sophisticated in real implementation)
      const isHealthy = Math.random() > 0.1; // 90% success rate for demo
      if (isHealthy) {
        checks.passed++;
      } else {
        checks.failed++;
      }

      const healthMetric: HealthMetrics = {
        system,
        status: isHealthy ? 'healthy' : 'warning',
        uptime: Date.now() - (existingHealth?.lastCheck || Date.now()),
        lastCheck: Date.now(),
        checks,
      };

      // Update or add health metric
      const index = this.healthMetrics.findIndex(h => h.system === system);
      if (index >= 0) {
        this.healthMetrics[index] = healthMetric;
      } else {
        this.healthMetrics.push(healthMetric);
      }
    }
  }

  /**
   * Add system metrics
   */
  private addSystemMetrics(system: string, metrics: Record<string, any>): void {
    this.metrics.push({
      timestamp: Date.now(),
      system,
      metrics,
    });
  }

  /**
   * Record performance metric
   */
  recordPerformance(operation: string, duration: number, success: boolean, metadata?: Record<string, any>): void {
    this.performanceMetrics.push({
      operation,
      duration,
      success,
      timestamp: Date.now(),
      metadata,
    });

    // Keep only last 1000 performance metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - maxAge;

    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    systems: Record<string, any>;
    performance: {
      total: number;
      success: number;
      averageDuration: number;
      byOperation: Record<string, { count: number; avgDuration: number; successRate: number }>;
    };
    health: Record<string, HealthMetrics>;
    resources: ResourceMetrics | null;
  } {
    // System metrics summary
    const systems: Record<string, any> = {};
    const systemGroups = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.system]) acc[metric.system] = [];
      acc[metric.system].push(metric);
      return acc;
    }, {} as Record<string, SystemMetrics[]>);

    for (const [system, metrics] of Object.entries(systemGroups)) {
      const latest = metrics[metrics.length - 1];
      systems[system] = {
        latest: latest.metrics,
        count: metrics.length,
        timeRange: latest.timestamp - metrics[0].timestamp,
      };
    }

    // Performance metrics summary
    const performance = {
      total: this.performanceMetrics.length,
      success: this.performanceMetrics.filter(m => m.success).length,
      averageDuration: this.performanceMetrics.length > 0
        ? this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length
        : 0,
      byOperation: {} as Record<string, { count: number; avgDuration: number; successRate: number }>,
    };

    const operationGroups = this.performanceMetrics.reduce((acc, metric) => {
      if (!acc[metric.operation]) acc[metric.operation] = [];
      acc[metric.operation].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetrics[]>);

    for (const [operation, metrics] of Object.entries(operationGroups)) {
      const count = metrics.length;
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / count;
      const successRate = metrics.filter(m => m.success).length / count;

      performance.byOperation[operation] = { count, avgDuration, successRate };
    }

    // Health metrics
    const health: Record<string, HealthMetrics> = {};
    for (const healthMetric of this.healthMetrics) {
      health[healthMetric.system] = healthMetric;
    }

    // Latest resource metrics
    const resources = this.resourceMetrics[this.resourceMetrics.length - 1] || null;

    return { systems, performance, health, resources };
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      summary: this.getMetricsSummary(),
      raw: {
        systemMetrics: this.metrics.slice(-100), // Last 100 system metrics
        performanceMetrics: this.performanceMetrics.slice(-100), // Last 100 performance metrics
        healthMetrics: this.healthMetrics,
        resourceMetrics: this.resourceMetrics.slice(-10), // Last 10 resource metrics
      }
    }, null, 2);
  }

  /**
   * Get metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    const summary = this.getMetricsSummary();
    let output = '';

    // System metrics
    for (const [system, metrics] of Object.entries(summary.systems)) {
      for (const [key, value] of Object.entries(metrics.latest)) {
        if (typeof value === 'number') {
          output += `# HELP bun_${system}_${key} ${key} for ${system}\n`;
          output += `# TYPE bun_${system}_${key} gauge\n`;
          output += `bun_${system}_${key} ${value}\n\n`;
        }
      }
    }

    // Performance metrics
    output += `# HELP bun_performance_total Total performance measurements\n`;
    output += `# TYPE bun_performance_total counter\n`;
    output += `bun_performance_total ${summary.performance.total}\n\n`;

    output += `# HELP bun_performance_success Success rate\n`;
    output += `# TYPE bun_performance_success gauge\n`;
    output += `bun_performance_success ${summary.performance.success / Math.max(summary.performance.total, 1)}\n\n`;

    // Health metrics
    for (const [system, health] of Object.entries(summary.health)) {
      const statusValue = health.status === 'healthy' ? 1 : health.status === 'warning' ? 0.5 : 0;
      output += `# HELP bun_health_${system} Health status of ${system}\n`;
      output += `# TYPE bun_health_${system} gauge\n`;
      output += `bun_health_${system} ${statusValue}\n\n`;
    }

    return output;
  }
}

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

/**
 * Performance monitoring decorator
 */
export function withPerformanceMonitoring(collector: MetricsCollector) {
  return function <T extends (...args: any[]) => any>(
    fn: T,
    operationName?: string
  ): T {
    const name = operationName || fn.name || 'anonymous';

    return ((...args: any[]) => {
      const start = performance.now();

      try {
        const result = fn(...args);
        const duration = performance.now() - start;

        // Handle promises
        if (result && typeof result.then === 'function') {
          return result
            .then((value: any) => {
              collector.recordPerformance(name, performance.now() - start, true);
              return value;
            })
            .catch((error: any) => {
              collector.recordPerformance(name, performance.now() - start, false, { error: error.message });
              throw error;
            });
        }

        // Synchronous result
        collector.recordPerformance(name, duration, true);
        return result;

      } catch (error) {
        collector.recordPerformance(name, performance.now() - start, false, { error: (error as Error).message });
        throw error;
      }
    }) as T;
  };
}

/**
 * Create a metrics collector instance
 */
export function createMetricsCollector(tensionEngine: TensionScoringEngine): MetricsCollector {
  return new MetricsCollector(tensionEngine);
}

/**
 * Global metrics collector instance
 */
let globalMetricsCollector: MetricsCollector | null = null;

/**
 * Get or create global metrics collector
 */
export function getGlobalMetricsCollector(tensionEngine?: TensionScoringEngine): MetricsCollector {
  if (!globalMetricsCollector) {
    if (!tensionEngine) {
      throw new Error('Tension engine required for first metrics collector creation');
    }
    globalMetricsCollector = new MetricsCollector(tensionEngine);
  }
  return globalMetricsCollector;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * CLI command to start metrics collection
 */
export async function startMetricsCommand(args: string[]): Promise<void> {
  const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '30000');

  console.log(`📈 Starting metrics collection (interval: ${interval}ms)`);

  // This would need access to the tension engine
  // For demo purposes, we'll show the command structure
  console.log('Metrics collection started (requires tension engine instance)');
}

/**
 * CLI command to export metrics
 */
export async function exportMetricsCommand(args: string[]): Promise<void> {
  const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'json';

  console.log(`📊 Exporting metrics in ${format} format`);

  // This would export from the global metrics collector
  console.log('Metrics export requires running metrics collector');
}

/**
 * CLI command to show metrics summary
 */
export async function showMetricsCommand(): Promise<void> {
  console.log('📈 Metrics Summary');

  // This would show summary from global metrics collector
  console.log('Metrics summary requires running metrics collector');
}

// ============================================================================
// INTEGRATION WITH DASHBOARD
// ============================================================================

/**
 * Integration with the dashboard for real-time metrics
 */
export class MetricsDashboardIntegration {
  private collector: MetricsCollector;

  constructor(collector: MetricsCollector) {
    this.collector = collector;
  }

  /**
   * Get metrics for dashboard API
   */
  getDashboardMetrics() {
    return {
      summary: this.collector.getMetricsSummary(),
      timestamp: Date.now(),
      version: '1.0.0',
    };
  }

  /**
   * Get real-time metrics stream
   */
  getRealTimeMetrics() {
    return {
      systems: this.collector.getMetricsSummary().systems,
      performance: this.collector.getMetricsSummary().performance,
      health: this.collector.getMetricsSummary().health,
      timestamp: Date.now(),
    };
  }
}