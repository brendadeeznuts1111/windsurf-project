#!/usr/bin/env bun

/**
 * 🏥 Worker Health Monitor
 *
 * Monitors worker health based on tension scores and spawn metrics.
 * Triggers automatic respawning and circuit breaker management.
 */

import { ParentWorkerOrchestrator } from '../core/parent-orchestrator';
import { TensionScoringEngine } from '../tension-scoring/tension-engine';

export interface HealthMonitorConfig {
  orchestrator: ParentWorkerOrchestrator;
  tensionEngine: TensionScoringEngine;
  checkIntervalMs: number;
  tensionThreshold: number;
  respawnEnabled: boolean;
  circuitBreakerEnabled: boolean;
  maxRespawnAttempts: number;
  cooldownPeriodMs: number;
}

export interface WorkerHealthStatus {
  workerId: string;
  isHealthy: boolean;
  tensionScore: number;
  spawnMetrics: {
    count: number;
    failures: number;
    failureRate: number;
    averageExecutionTime: number;
  };
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  lastHealthCheck: number;
  respawnAttempts: number;
  lastRespawnTime: number;
  consecutiveFailures: number;
}

export interface HealthMonitorMetrics {
  totalWorkers: number;
  healthyWorkers: number;
  unhealthyWorkers: number;
  averageTension: number;
  totalRespawns: number;
  activeCircuitBreakers: number;
  uptimeSeconds: number;
}

/**
 * Worker Health Monitor
 * Continuously monitors worker health and triggers recovery actions
 */
export class WorkerHealthMonitor {
  private config: HealthMonitorConfig;
  private healthStatuses = new Map<string, WorkerHealthStatus>();
  private monitorInterval?: Timer;
  private startTime = Date.now();
  private totalRespawns = 0;

  constructor(config: HealthMonitorConfig) {
    this.config = config;
    this.setupTensionMonitoring();
  }

  /**
   * Start health monitoring
   */
  async start(): Promise<void> {
    console.log('🏥 Starting Worker Health Monitor');

    // Initialize health status for all workers
    await this.initializeWorkerHealthStatuses();

    // Start monitoring loop
    this.monitorInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.checkIntervalMs);

    console.log('✅ Worker Health Monitor started');
  }

  /**
   * Stop health monitoring
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Worker Health Monitor');

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    console.log('✅ Worker Health Monitor stopped');
  }

  /**
   * Get health status for a specific worker
   */
  getWorkerHealth(workerId: string): WorkerHealthStatus | null {
    return this.healthStatuses.get(workerId) || null;
  }

  /**
   * Get overall health monitor metrics
   */
  getHealthMetrics(): HealthMonitorMetrics {
    const allStatuses = Array.from(this.healthStatuses.values());
    const healthyWorkers = allStatuses.filter(s => s.isHealthy).length;
    const unhealthyWorkers = allStatuses.length - healthyWorkers;
    const averageTension = allStatuses.length > 0
      ? allStatuses.reduce((sum, s) => sum + s.tensionScore, 0) / allStatuses.length
      : 0;

    const activeCircuitBreakers = allStatuses.filter(s =>
      s.circuitBreakerState !== 'closed'
    ).length;

    return {
      totalWorkers: allStatuses.length,
      healthyWorkers,
      unhealthyWorkers,
      averageTension,
      totalRespawns: this.totalRespawns,
      activeCircuitBreakers,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Force a health check for all workers
   */
  async forceHealthCheck(): Promise<void> {
    await this.performHealthChecks();
  }

  /**
   * Manually trigger respawn for a worker
   */
  async triggerRespawn(workerId: string, reason: string): Promise<boolean> {
    const status = this.healthStatuses.get(workerId);
    if (!status) {
      console.warn(`Worker ${workerId} not found for manual respawn`);
      return false;
    }

    if (status.respawnAttempts >= this.config.maxRespawnAttempts) {
      console.warn(`Worker ${workerId} has exceeded max respawn attempts (${this.config.maxRespawnAttempts})`);
      return false;
    }

    // Check cooldown period
    const timeSinceLastRespawn = Date.now() - status.lastRespawnTime;
    if (timeSinceLastRespawn < this.config.cooldownPeriodMs) {
      console.warn(`Worker ${workerId} is in cooldown period (${this.config.cooldownPeriodMs - timeSinceLastRespawn}ms remaining)`);
      return false;
    }

    console.log(`🔄 Manual respawn triggered for ${workerId}: ${reason}`);

    try {
      await this.config.orchestrator.respawnWorker(workerId);
      status.respawnAttempts++;
      status.lastRespawnTime = Date.now();
      status.consecutiveFailures = 0; // Reset on successful respawn
      this.totalRespawns++;
      return true;
    } catch (error) {
      console.error(`Failed to respawn worker ${workerId}:`, error);
      status.consecutiveFailures++;
      return false;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupTensionMonitoring(): void {
    // Listen for tension events that indicate health issues
    this.config.tensionEngine.on('tension', (event) => {
      if (event.workerId) {
        this.handleTensionEvent(event);
      }
    });

    // Listen for critical tension events
    this.config.tensionEngine.on('tension:critical', (event) => {
      if (event.workerId && this.config.respawnEnabled) {
        this.handleCriticalTension(event);
      }
    });
  }

  private async initializeWorkerHealthStatuses(): Promise<void> {
    const workers = this.config.orchestrator.listWorkers();

    for (const worker of workers) {
      const metrics = this.config.orchestrator.getWorkerMetrics(worker.id);
      if (!metrics) continue;

      const status: WorkerHealthStatus = {
        workerId: worker.id,
        isHealthy: worker.isHealthy,
        tensionScore: worker.tensionScore,
        spawnMetrics: {
          count: metrics.spawnCount,
          failures: metrics.spawnFailures,
          failureRate: metrics.spawnFailures / Math.max(metrics.spawnCount, 1),
          averageExecutionTime: metrics.averageExecutionTime,
        },
        circuitBreakerState: worker.circuitBreakerState,
        lastHealthCheck: Date.now(),
        respawnAttempts: 0,
        lastRespawnTime: 0,
        consecutiveFailures: 0,
      };

      this.healthStatuses.set(worker.id, status);
    }
  }

  private async performHealthChecks(): Promise<void> {
    const workers = this.config.orchestrator.listWorkers();

    for (const worker of workers) {
      await this.checkWorkerHealth(worker.id);
    }

    // Update overall health metrics
    this.updateHealthMetrics();
  }

  private async checkWorkerHealth(workerId: string): Promise<void> {
    const orchestratorMetrics = this.config.orchestrator.getWorkerMetrics(workerId);
    const tensionScore = this.config.tensionEngine.getWorkerTension(workerId, 300000); // 5 minutes
    const workers = this.config.orchestrator.listWorkers();
    const worker = workers.find(w => w.id === workerId);

    if (!orchestratorMetrics || !worker) {
      // Worker might have been removed
      this.healthStatuses.delete(workerId);
      return;
    }

    const status = this.healthStatuses.get(workerId) || this.createHealthStatus(workerId);

    // Update health status
    status.isHealthy = this.determineWorkerHealth(orchestratorMetrics, tensionScore);
    status.tensionScore = tensionScore;
    status.spawnMetrics = {
      count: orchestratorMetrics.spawnCount,
      failures: orchestratorMetrics.spawnFailures,
      failureRate: orchestratorMetrics.spawnFailures / Math.max(orchestratorMetrics.spawnCount, 1),
      averageExecutionTime: orchestratorMetrics.averageExecutionTime,
    };
    status.circuitBreakerState = worker.circuitBreakerState;
    status.lastHealthCheck = Date.now();

    // Check for health deterioration
    if (!status.isHealthy) {
      status.consecutiveFailures++;
      await this.handleUnhealthyWorker(workerId, status);
    } else {
      status.consecutiveFailures = 0;
    }

    this.healthStatuses.set(workerId, status);
  }

  private determineWorkerHealth(metrics: any, tensionScore: number): boolean {
    // Health criteria
    const failureRateHealthy = metrics.spawnFailures / Math.max(metrics.spawnCount, 1) < 0.1;
    const tensionHealthy = tensionScore < this.config.tensionThreshold;
    const timeoutsHealthy = metrics.spawnTimeouts < metrics.spawnCount * 0.05; // <5% timeouts

    return failureRateHealthy && tensionHealthy && timeoutsHealthy;
  }

  private createHealthStatus(workerId: string): WorkerHealthStatus {
    return {
      workerId,
      isHealthy: true,
      tensionScore: 0,
      spawnMetrics: {
        count: 0,
        failures: 0,
        failureRate: 0,
        averageExecutionTime: 0,
      },
      circuitBreakerState: 'closed',
      lastHealthCheck: Date.now(),
      respawnAttempts: 0,
      lastRespawnTime: 0,
      consecutiveFailures: 0,
    };
  }

  private async handleUnhealthyWorker(workerId: string, status: WorkerHealthStatus): Promise<void> {
    console.log(`⚠️ Worker ${workerId} is unhealthy (tension: ${status.tensionScore.toFixed(3)}, failures: ${status.consecutiveFailures})`);

    // Check if respawn is enabled and conditions are met
    if (this.config.respawnEnabled &&
        status.consecutiveFailures >= 2 && // Require 2 consecutive failures
        status.respawnAttempts < this.config.maxRespawnAttempts) {

      // Check cooldown period
      const timeSinceLastRespawn = Date.now() - status.lastRespawnTime;
      if (timeSinceLastRespawn >= this.config.cooldownPeriodMs) {
        await this.triggerAutomaticRespawn(workerId, status);
      }
    }
  }

  private async triggerAutomaticRespawn(workerId: string, status: WorkerHealthStatus): Promise<void> {
    console.log(`🔄 Automatically respawning unhealthy worker: ${workerId}`);

    try {
      await this.config.orchestrator.respawnWorker(workerId);
      status.respawnAttempts++;
      status.lastRespawnTime = Date.now();
      status.consecutiveFailures = 0; // Reset on successful respawn
      this.totalRespawns++;

      console.log(`✅ Successfully respawned worker: ${workerId}`);
    } catch (error) {
      console.error(`❌ Failed to respawn worker ${workerId}:`, error);
      status.consecutiveFailures++;
    }
  }

  private handleTensionEvent(event: any): void {
    const workerId = event.workerId;
    if (!workerId) return;

    const status = this.healthStatuses.get(workerId);
    if (!status) return;

    // Update tension score
    status.tensionScore = event.tension;

    // Log tension-based health issues
    if (event.tension >= this.config.tensionThreshold) {
      console.log(`📊 Worker ${workerId} tension elevated: ${event.tension.toFixed(3)} (${event.message})`);
    }
  }

  private handleCriticalTension(event: any): void {
    const workerId = event.workerId;
    if (!workerId) return;

    console.log(`🚨 Critical tension for worker ${workerId}: ${event.tension.toFixed(3)} - ${event.message}`);

    // Force immediate health check
    this.checkWorkerHealth(workerId).catch(error =>
      console.error(`Health check failed for ${workerId}:`, error)
    );
  }

  private updateHealthMetrics(): void {
    const metrics = this.getHealthMetrics();

    // Emit health summary events
    if (metrics.unhealthyWorkers > 0) {
      this.config.tensionEngine.emitTension('health:unhealthy_workers', 0.1, {
        unhealthyWorkers: metrics.unhealthyWorkers,
        totalWorkers: metrics.totalWorkers,
        averageTension: metrics.averageTension,
      });
    }

    if (metrics.activeCircuitBreakers > 0) {
      this.config.tensionEngine.emitTension('health:circuit_breakers_active', 0.15, {
        activeCircuitBreakers: metrics.activeCircuitBreakers,
        totalWorkers: metrics.totalWorkers,
      });
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a default health monitor configuration
 */
export function createDefaultHealthMonitorConfig(
  orchestrator: ParentWorkerOrchestrator,
  tensionEngine: TensionScoringEngine
): HealthMonitorConfig {
  return {
    orchestrator,
    tensionEngine,
    checkIntervalMs: 30000,      // Check every 30 seconds
    tensionThreshold: 0.5,       // Tension > 0.5 = unhealthy
    respawnEnabled: true,
    circuitBreakerEnabled: true,
    maxRespawnAttempts: 3,
    cooldownPeriodMs: 60000,     // 1 minute cooldown between respawns
  };
}

/**
 * Create a health monitor with default configuration
 */
export function createHealthMonitor(
  orchestrator: ParentWorkerOrchestrator,
  tensionEngine: TensionScoringEngine
): WorkerHealthMonitor {
  const config = createDefaultHealthMonitorConfig(orchestrator, tensionEngine);
  return new WorkerHealthMonitor(config);
}