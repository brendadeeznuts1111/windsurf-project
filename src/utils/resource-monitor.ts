/**
 * @fileoverview Resource Monitor - Testing Infrastructure Core
 * @description Real resource monitoring for test suites with pressure scoring
 * @version 1.0.0
 * @since 2025-01-01
 *
 * EX033: Resource Monitor Implementation
 * Provides actual resource tracking, pressure scoring, and budget management
 * for comprehensive test suite monitoring and optimization
 */

import { EventEmitter } from 'node:events';
import { performance, PerformanceObserver } from 'node:perf_hooks';

interface ResourceMetrics {
  heapUsed: number;      // MB
  heapTotal: number;     // MB
  external: number;      // MB
  rss: number;          // MB
  cpuTime: number;      // milliseconds
  timestamp: number;
}

interface PressureScore {
  memory: number;        // 0-1 scale
  cpu: number;          // 0-1 scale
  overall: number;      // 0-1 scale
  timestamp: number;
}

interface ResourceBudget {
  maxHeapMB: number;
  maxCpuMs: number;
  warningThreshold: number; // 0-1 scale
  criticalThreshold: number; // 0-1 scale
}

interface ResourceAlert {
  type: 'warning' | 'critical' | 'budget_exceeded';
  resource: 'memory' | 'cpu' | 'overall';
  currentValue: number;
  threshold: number;
  timestamp: number;
  message: string;
}

/**
 * Resource Monitor for Test Suite Performance Tracking
 */
export class ResourceMonitor {
  private static instance: ResourceMonitor;
  private eventEmitter = new EventEmitter();
  private metrics: ResourceMetrics[] = [];
  private pressureScores: PressureScore[] = [];
  private alerts: ResourceAlert[] = [];
  private budget?: ResourceBudget;
  private performanceObserver?: PerformanceObserver;
  private startTime = performance.now();
  private cpuStartTime = process.cpuUsage();

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Set up performance observer for GC events
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'gc') {
          this.recordGarbageCollection(entry);
        }
      }
    });

    this.performanceObserver.observe({ entryTypes: ['gc'] });

    // Set up periodic metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 1000); // Collect every second
  }

  /**
   * Set resource budget for monitoring
   */
  setBudget(budget: ResourceBudget): void {
    this.budget = budget;
    console.log(`📊 Resource budget set: ${budget.maxHeapMB}MB heap, ${budget.maxCpuMs}ms CPU`);
  }

  /**
   * Record current resource metrics
   */
  recordMetrics(): ResourceMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.cpuStartTime);

    const metrics: ResourceMetrics = {
      heapUsed: memUsage.heapUsed / 1024 / 1024, // Convert to MB
      heapTotal: memUsage.heapTotal / 1024 / 1024,
      external: memUsage.external / 1024 / 1024,
      rss: memUsage.rss / 1024 / 1024,
      cpuTime: (cpuUsage.user + cpuUsage.system) / 1000, // Convert to milliseconds
      timestamp: Date.now()
    };

    this.metrics.push(metrics);

    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Calculate pressure score
    this.calculatePressureScore(metrics);

    return metrics;
  }

  /**
   * Collect metrics (called by interval timer)
   */
  private collectMetrics(): void {
    this.recordMetrics();
  }

  /**
   * Record garbage collection event
   */
  private recordGarbageCollection(entry: any): void {
    console.log(`🗑️  GC Event: ${entry.kind} - ${entry.duration.toFixed(2)}ms`);
  }

  /**
   * Calculate resource pressure score
   */
  private calculatePressureScore(metrics: ResourceMetrics): void {
    let memoryPressure = 0;
    let cpuPressure = 0;

    // Memory pressure based on heap usage vs budget
    if (this.budget) {
      memoryPressure = Math.min(metrics.heapUsed / this.budget.maxHeapMB, 1);

      // CPU pressure based on time used vs budget
      const elapsedTime = performance.now() - this.startTime;
      cpuPressure = Math.min(metrics.cpuTime / this.budget.maxCpuMs, 1);
    } else {
      // Default pressure calculation without budget
      memoryPressure = Math.min(metrics.heapUsed / 1024, 1); // Assume 1GB max
      cpuPressure = Math.min(metrics.cpuTime / 300000, 1); // Assume 5min max
    }

    const overallPressure = (memoryPressure + cpuPressure) / 2;

    const pressureScore: PressureScore = {
      memory: memoryPressure,
      cpu: cpuPressure,
      overall: overallPressure,
      timestamp: metrics.timestamp
    };

    this.pressureScores.push(pressureScore);

    // Keep only last 100 pressure scores
    if (this.pressureScores.length > 100) {
      this.pressureScores = this.pressureScores.slice(-100);
    }

    // Check for alerts
    this.checkAlerts(pressureScore, metrics);
  }

  /**
   * Check for resource alerts
   */
  private checkAlerts(pressure: PressureScore, metrics: ResourceMetrics): void {
    const alerts: ResourceAlert[] = [];

    // Memory alerts
    if (this.budget) {
      if (pressure.memory >= this.budget.criticalThreshold) {
        alerts.push({
          type: 'critical',
          resource: 'memory',
          currentValue: metrics.heapUsed,
          threshold: this.budget.maxHeapMB * this.budget.criticalThreshold,
          timestamp: Date.now(),
          message: `Critical memory usage: ${metrics.heapUsed.toFixed(1)}MB (${(pressure.memory * 100).toFixed(1)}% of budget)`
        });
      } else if (pressure.memory >= this.budget.warningThreshold) {
        alerts.push({
          type: 'warning',
          resource: 'memory',
          currentValue: metrics.heapUsed,
          threshold: this.budget.maxHeapMB * this.budget.warningThreshold,
          timestamp: Date.now(),
          message: `High memory usage: ${metrics.heapUsed.toFixed(1)}MB (${(pressure.memory * 100).toFixed(1)}% of budget)`
        });
      }

      // CPU alerts
      if (pressure.cpu >= this.budget.criticalThreshold) {
        alerts.push({
          type: 'critical',
          resource: 'cpu',
          currentValue: metrics.cpuTime,
          threshold: this.budget.maxCpuMs * this.budget.criticalThreshold,
          timestamp: Date.now(),
          message: `Critical CPU usage: ${metrics.cpuTime.toFixed(0)}ms (${(pressure.cpu * 100).toFixed(1)}% of budget)`
        });
      } else if (pressure.cpu >= this.budget.warningThreshold) {
        alerts.push({
          type: 'warning',
          resource: 'cpu',
          currentValue: metrics.cpuTime,
          threshold: this.budget.maxCpuMs * this.budget.warningThreshold,
          timestamp: Date.now(),
          message: `High CPU usage: ${metrics.cpuTime.toFixed(0)}ms (${(pressure.cpu * 100).toFixed(1)}% of budget)`
        });
      }
    }

    // Overall pressure alert
    if (pressure.overall >= 0.9) {
      alerts.push({
        type: 'critical',
        resource: 'overall',
        currentValue: pressure.overall,
        threshold: 0.9,
        timestamp: Date.now(),
        message: `Critical resource pressure: ${(pressure.overall * 100).toFixed(1)}%`
      });
    } else if (pressure.overall >= 0.7) {
      alerts.push({
        type: 'warning',
        resource: 'overall',
        currentValue: pressure.overall,
        threshold: 0.7,
        timestamp: Date.now(),
        message: `High resource pressure: ${(pressure.overall * 100).toFixed(1)}%`
      });
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.eventEmitter.emit('alert', alert);
      console.warn(`🚨 Resource Alert: ${alert.message}`);
    });
  }

  /**
   * Get current pressure score
   */
  static getPressureScore(): number {
    const instance = ResourceMonitor.getInstance();
    const latest = instance.pressureScores[instance.pressureScores.length - 1];
    return latest ? latest.overall : 0;
  }

  /**
   * Get average metrics over time window
   */
  static getAverageMetrics(windowMs: number = 60000): ResourceMetrics | null {
    const instance = ResourceMonitor.getInstance();
    const cutoff = Date.now() - windowMs;
    const recentMetrics = instance.metrics.filter(m => m.timestamp >= cutoff);

    if (recentMetrics.length === 0) return null;

    const avg: ResourceMetrics = {
      heapUsed: recentMetrics.reduce((sum, m) => sum + m.heapUsed, 0) / recentMetrics.length,
      heapTotal: recentMetrics.reduce((sum, m) => sum + m.heapTotal, 0) / recentMetrics.length,
      external: recentMetrics.reduce((sum, m) => sum + m.external, 0) / recentMetrics.length,
      rss: recentMetrics.reduce((sum, m) => sum + m.rss, 0) / recentMetrics.length,
      cpuTime: recentMetrics.reduce((sum, m) => sum + m.cpuTime, 0) / recentMetrics.length,
      timestamp: Date.now()
    };

    return avg;
  }

  /**
   * Reset all monitoring data
   */
  static reset(): void {
    const instance = ResourceMonitor.getInstance();
    instance.metrics = [];
    instance.pressureScores = [];
    instance.alerts = [];
    instance.startTime = performance.now();
    instance.cpuStartTime = process.cpuUsage();
    console.log('🔄 Resource monitor reset');
  }

  /**
   * Get resource usage summary
   */
  getSummary(): {
    current: ResourceMetrics;
    average: ResourceMetrics | null;
    pressure: PressureScore | null;
    alerts: ResourceAlert[];
    budget?: ResourceBudget;
  } {
    const current = this.recordMetrics();
    const average = ResourceMonitor.getAverageMetrics();
    const pressure = this.pressureScores[this.pressureScores.length - 1] || null;

    return {
      current,
      average,
      pressure,
      alerts: this.alerts.slice(-10), // Last 10 alerts
      budget: this.budget
    };
  }

  /**
   * Add event listener
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.eventEmitter.removeAllListeners();
  }
}

// Export singleton instance
export const resourceMonitor = ResourceMonitor.getInstance();