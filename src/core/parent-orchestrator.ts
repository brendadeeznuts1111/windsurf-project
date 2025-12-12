#!/usr/bin/env bun

/**
 * 🎼 Parent Worker Orchestrator
 *
 * Orchestrates multiple WorkerWithSpawn instances with circuit breaker logic,
 * spawn tracking, and tension-based worker management.
 */

import { WorkerWithSpawn } from '../workers/worker-with-spawn';
import { TensionScoringEngine } from '../tension-scoring/tension-engine';
import { SpawnSecurityValidator } from '../../security/spawn-validator';

export interface WorkerConfig {
  workerId: string;
  scriptPath: string | URL;
  spawnConfig?: any;
  runtimeConfig?: any;
  performanceConfig?: any;
  tensionConfig?: any;
}

export interface OrchestratorConfig {
  workers: WorkerConfig[];
  orchestration: {
    autoStart: boolean;
    respawnFailedWorkers: boolean;
    maxRespawnAttempts: number;
    respawnDelayMs: number;
  };
  monitoring: {
    healthCheckIntervalMs: number;
    tensionAggregationIntervalMs: number;
    metricsRetentionHours: number;
  };
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeoutMs: number;
    halfOpenMaxRequests: number;
  };
}

export interface WorkerMetrics {
  workerId: string;
  isRunning: boolean;
  isHealthy: boolean;
  tensionScore: number;
  spawnCount: number;
  spawnFailures: number;
  spawnTimeouts: number;
  averageExecutionTime: number;
  uptimeSeconds: number;
  lastHealthCheck: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
}

export interface OrchestratorMetrics {
  totalWorkers: number;
  activeWorkers: number;
  healthyWorkers: number;
  averageTension: number;
  totalSpawns: number;
  totalFailures: number;
  circuitBreakersOpen: number;
  uptimeSeconds: number;
}

/**
 * Parent Worker Orchestrator
 * Manages a pool of WorkerWithSpawn instances with advanced orchestration
 */
export class ParentWorkerOrchestrator {
  private config: OrchestratorConfig;
  private workers = new Map<string, WorkerWithSpawn>();
  private workerMetrics = new Map<string, WorkerMetrics>();
  private circuitBreakerStates = new Map<string, {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailureTime: number;
    nextAttemptTime: number;
    halfOpenRequests: number;
  }>();

  private tensionEngine: TensionScoringEngine;
  private securityValidator: SpawnSecurityValidator;
  private healthCheckInterval?: Timer;
  private tensionAggregationInterval?: Timer;
  private startTime = Date.now();

  constructor(
    config: OrchestratorConfig,
    tensionEngine: TensionScoringEngine,
    securityValidator: SpawnSecurityValidator
  ) {
    this.config = config;
    this.tensionEngine = tensionEngine;
    this.securityValidator = securityValidator;

    this.setupTensionMonitoring();
  }

  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    console.log('🎼 Starting Parent Worker Orchestrator');

    if (this.config.orchestration.autoStart) {
      await this.startAllWorkers();
    }

    this.startHealthMonitoring();
    this.startTensionAggregation();

    console.log('✅ Parent Worker Orchestrator started');
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Parent Worker Orchestrator');

    // Stop monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.tensionAggregationInterval) {
      clearInterval(this.tensionAggregationInterval);
    }

    // Stop all workers
    await this.stopAllWorkers();

    console.log('✅ Parent Worker Orchestrator stopped');
  }

  /**
   * Start all configured workers
   */
  async startAllWorkers(): Promise<void> {
    const startPromises = this.config.workers.map(config =>
      this.startWorker(config.workerId)
    );

    await Promise.allSettled(startPromises);
  }

  /**
   * Stop all workers
   */
  async stopAllWorkers(): Promise<void> {
    const stopPromises = Array.from(this.workers.values()).map(worker =>
      worker.shutdown()
    );

    await Promise.allSettled(stopPromises);
    this.workers.clear();
  }

  /**
   * Start a specific worker
   */
  async startWorker(workerId: string): Promise<void> {
    const config = this.config.workers.find(w => w.workerId === workerId);
    if (!config) {
      throw new Error(`Worker configuration not found: ${workerId}`);
    }

    try {
      console.log(`🚀 Starting worker: ${workerId}`);

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(workerId)) {
        console.log(`⚠️ Circuit breaker open for ${workerId}, skipping start`);
        return;
      }

      // Create worker with spawn capabilities
      const worker = new WorkerWithSpawn(config.scriptPath, {
        name: workerId,
        smol: config.performanceConfig?.smol ?? true,
        spawnConfig: config.spawnConfig,
        tensionEngine: this.tensionEngine,
        securityValidator: this.securityValidator,
      });

      // Set up event handlers
      this.setupWorkerEventHandlers(worker, workerId);

      // Store worker
      this.workers.set(workerId, worker);

      // Initialize metrics
      this.initializeWorkerMetrics(workerId);

      console.log(`✅ Worker started: ${workerId}`);

    } catch (error) {
      console.error(`❌ Failed to start worker ${workerId}:`, error);
      this.recordWorkerFailure(workerId);
    }
  }

  /**
   * Stop a specific worker
   */
  async stopWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    await worker.shutdown();
    this.workers.delete(workerId);

    // Update metrics
    const metrics = this.workerMetrics.get(workerId);
    if (metrics) {
      metrics.isRunning = false;
    }
  }

  /**
   * Get metrics for a specific worker
   */
  getWorkerMetrics(workerId: string): WorkerMetrics | null {
    return this.workerMetrics.get(workerId) || null;
  }

  /**
   * Get orchestrator-wide metrics
   */
  getOrchestratorMetrics(): OrchestratorMetrics {
    const allMetrics = Array.from(this.workerMetrics.values());
    const activeWorkers = allMetrics.filter(m => m.isRunning);
    const healthyWorkers = activeWorkers.filter(m => m.isHealthy);
    const circuitBreakersOpen = Array.from(this.circuitBreakerStates.values())
      .filter(state => state.state === 'open').length;

    const totalSpawns = allMetrics.reduce((sum, m) => sum + m.spawnCount, 0);
    const totalFailures = allMetrics.reduce((sum, m) => sum + m.spawnFailures, 0);
    const averageTension = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.tensionScore, 0) / allMetrics.length
      : 0;

    return {
      totalWorkers: allMetrics.length,
      activeWorkers: activeWorkers.length,
      healthyWorkers: healthyWorkers.length,
      averageTension,
      totalSpawns,
      totalFailures,
      circuitBreakersOpen,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * List all workers with their status
   */
  listWorkers(): Array<{
    id: string;
    isRunning: boolean;
    isHealthy: boolean;
    tensionScore: number;
    circuitBreakerState: string;
  }> {
    return Array.from(this.workerMetrics.entries()).map(([id, metrics]) => ({
      id,
      isRunning: metrics.isRunning,
      isHealthy: metrics.isHealthy,
      tensionScore: metrics.tensionScore,
      circuitBreakerState: this.circuitBreakerStates.get(id)?.state || 'closed',
    }));
  }

  /**
   * Force respawn a worker
   */
  async respawnWorker(workerId: string): Promise<void> {
    console.log(`🔄 Respawning worker: ${workerId}`);

    await this.stopWorker(workerId);
    await new Promise(resolve => setTimeout(resolve, this.config.orchestration.respawnDelayMs));
    await this.startWorker(workerId);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupTensionMonitoring(): void {
    // Listen for tension events that affect worker management
    this.tensionEngine.on('tension', (event) => {
      if (event.workerId) {
        this.handleWorkerTension(event);
      }
    });
  }

  private setupWorkerEventHandlers(worker: WorkerWithSpawn, workerId: string): void {
    // Handle worker errors
    worker.onerror = (error) => {
      console.error(`Worker ${workerId} error:`, error);
      this.recordWorkerFailure(workerId);
    };

    // Handle worker messages
    worker.onmessage = (event) => {
      this.handleWorkerMessage(workerId, event.data);
    };

    // Handle tension updates
    (worker as any).onTensionUpdate = (tension: number, reason: string) => {
      this.updateWorkerTension(workerId, tension, reason);
    };
  }

  private handleWorkerMessage(workerId: string, message: any): void {
    // Handle spawn-related messages from workers
    if (message.type === 'spawn:completed') {
      this.updateWorkerSpawnMetrics(workerId, message.result);
    } else if (message.type === 'spawn:failed') {
      this.recordWorkerSpawnFailure(workerId);
    }
  }

  private handleWorkerTension(event: any): void {
    const workerId = event.workerId;
    const tension = event.tension;

    // Check if we need to trigger circuit breaker
    if (tension >= this.config.circuitBreaker.failureThreshold) {
      this.openCircuitBreaker(workerId, `Tension threshold exceeded: ${tension}`);
    }

    // Check if worker needs respawning
    if (tension >= 0.7 && this.config.orchestration.respawnFailedWorkers) {
      this.respawnWorker(workerId).catch(error =>
        console.error(`Failed to respawn worker ${workerId}:`, error)
      );
    }
  }

  private updateWorkerTension(workerId: string, tension: number, reason: string): void {
    const metrics = this.workerMetrics.get(workerId);
    if (metrics) {
      metrics.tensionScore = tension;
      metrics.lastHealthCheck = Date.now();
    }
  }

  private updateWorkerSpawnMetrics(workerId: string, result: any): void {
    const metrics = this.workerMetrics.get(workerId);
    if (!metrics) return;

    metrics.spawnCount++;
    if (!result.success) {
      metrics.spawnFailures++;
    }
    if (result.killedByTimeout) {
      metrics.spawnTimeouts++;
    }

    // Update average execution time
    const totalTime = metrics.averageExecutionTime * (metrics.spawnCount - 1) + result.executionTime;
    metrics.averageExecutionTime = totalTime / metrics.spawnCount;
  }

  private recordWorkerFailure(workerId: string): void {
    this.recordWorkerSpawnFailure(workerId);

    // Check circuit breaker
    const circuitState = this.circuitBreakerStates.get(workerId);
    if (circuitState) {
      circuitState.failures++;
      circuitState.lastFailureTime = Date.now();

      if (circuitState.failures >= this.config.circuitBreaker.failureThreshold) {
        this.openCircuitBreaker(workerId, `Failure threshold exceeded: ${circuitState.failures}`);
      }
    }
  }

  private recordWorkerSpawnFailure(workerId: string): void {
    const circuitState = this.circuitBreakerStates.get(workerId);
    if (circuitState) {
      circuitState.failures++;
      circuitState.lastFailureTime = Date.now();
    }
  }

  private openCircuitBreaker(workerId: string, reason: string): void {
    console.log(`🔴 Opening circuit breaker for ${workerId}: ${reason}`);

    const circuitState = this.circuitBreakerStates.get(workerId) || {
      state: 'closed' as const,
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      halfOpenRequests: 0,
    };

    circuitState.state = 'open';
    circuitState.nextAttemptTime = Date.now() + this.config.circuitBreaker.recoveryTimeoutMs;

    this.circuitBreakerStates.set(workerId, circuitState);

    // Stop the worker
    this.stopWorker(workerId).catch(error =>
      console.error(`Failed to stop worker ${workerId} during circuit breaker:`, error)
    );
  }

  private isCircuitBreakerOpen(workerId: string): boolean {
    const circuitState = this.circuitBreakerStates.get(workerId);
    if (!circuitState) return false;

    if (circuitState.state === 'open') {
      const now = Date.now();
      if (now >= circuitState.nextAttemptTime) {
        // Time to try half-open
        circuitState.state = 'half-open';
        circuitState.halfOpenRequests = 0;
        return false;
      }
      return true;
    }

    return false;
  }

  private initializeWorkerMetrics(workerId: string): void {
    this.workerMetrics.set(workerId, {
      workerId,
      isRunning: true,
      isHealthy: true,
      tensionScore: 0,
      spawnCount: 0,
      spawnFailures: 0,
      spawnTimeouts: 0,
      averageExecutionTime: 0,
      uptimeSeconds: 0,
      lastHealthCheck: Date.now(),
      circuitBreakerState: 'closed',
    });

    // Initialize circuit breaker state
    this.circuitBreakerStates.set(workerId, {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      halfOpenRequests: 0,
    });
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.monitoring.healthCheckIntervalMs);
  }

  private startTensionAggregation(): void {
    this.tensionAggregationInterval = setInterval(() => {
      this.aggregateTensionMetrics();
    }, this.config.monitoring.tensionAggregationIntervalMs);
  }

  private performHealthChecks(): void {
    for (const [workerId, worker] of this.workers.entries()) {
      this.checkWorkerHealth(workerId, worker);
    }
  }

  private checkWorkerHealth(workerId: string, worker: WorkerWithSpawn): void {
    const metrics = this.workerMetrics.get(workerId);
    if (!metrics) return;

    // Update uptime
    metrics.uptimeSeconds = Math.floor((Date.now() - (metrics.lastHealthCheck - metrics.uptimeSeconds * 1000)) / 1000);

    // Check if worker is still responsive
    try {
      worker.postMessage({ type: 'health-check', timestamp: Date.now() });
      metrics.isHealthy = true;
    } catch (error) {
      console.warn(`Worker ${workerId} health check failed:`, error);
      metrics.isHealthy = false;
      this.recordWorkerFailure(workerId);
    }

    // Update circuit breaker state
    const circuitState = this.circuitBreakerStates.get(workerId);
    if (circuitState) {
      metrics.circuitBreakerState = circuitState.state;
    }

    metrics.lastHealthCheck = Date.now();
  }

  private aggregateTensionMetrics(): void {
    const orchestratorMetrics = this.getOrchestratorMetrics();

    // Emit aggregate tension metrics
    this.tensionEngine.emitTension('orchestrator:health', orchestratorMetrics.averageTension, {
      totalWorkers: orchestratorMetrics.totalWorkers,
      activeWorkers: orchestratorMetrics.activeWorkers,
      healthyWorkers: orchestratorMetrics.healthyWorkers,
      circuitBreakersOpen: orchestratorMetrics.circuitBreakersOpen,
    });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a default orchestrator configuration
 */
export function createDefaultOrchestratorConfig(workers: WorkerConfig[]): OrchestratorConfig {
  return {
    workers,
    orchestration: {
      autoStart: true,
      respawnFailedWorkers: true,
      maxRespawnAttempts: 3,
      respawnDelayMs: 5000,
    },
    monitoring: {
      healthCheckIntervalMs: 30000,
      tensionAggregationIntervalMs: 60000,
      metricsRetentionHours: 24,
    },
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeoutMs: 300000,
      halfOpenMaxRequests: 3,
    },
  };
}

/**
 * Create a parent orchestrator with all components
 */
export function createParentOrchestrator(
  workerConfigs: WorkerConfig[],
  tensionEngine: TensionScoringEngine,
  securityValidator: SpawnSecurityValidator
): ParentWorkerOrchestrator {
  const config = createDefaultOrchestratorConfig(workerConfigs);
  return new ParentWorkerOrchestrator(config, tensionEngine, securityValidator);
}