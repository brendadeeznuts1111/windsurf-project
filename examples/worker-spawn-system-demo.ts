#!/usr/bin/env bun

/**
 * 🚀 Bun Workers & Spawn Integration - Complete System Demo
 *
 * Demonstrates the full tension-driven worker-spawn integration system.
 * Shows how all components work together for robust process management.
 */

import { TensionScoringEngine, createSpawnTensionEngine } from '../src/core/tension-scoring/tension-engine';
import { WorkerWithSpawn, createMonitoredSpawnWorker } from '../src/workers/worker-with-spawn';
import { SpawnSecurityValidator, createSecurityValidator } from '../src/security/spawn-validator';
import { ParentWorkerOrchestrator, createParentOrchestrator } from '../src/core/parent-orchestrator';
import { WorkerHealthMonitor, createHealthMonitor } from '../src/monitoring/worker-health-monitor';

// ============================================================================
// DEMO WORKER IMPLEMENTATION
// ============================================================================

/**
 * Demo worker that processes tasks using external tools
 */
class DemoSpawnWorker {
  private worker: WorkerWithSpawn;
  private processedTasks = 0;

  constructor(worker: WorkerWithSpawn) {
    this.worker = worker;
    this.setupMessageHandling();
  }

  private setupMessageHandling(): void {
    this.worker.onmessage = (event) => {
      const message = event.data;

      switch (message.type) {
        case 'process-task':
          this.processTask(message.task);
          break;
        case 'health-check':
          this.worker.postMessage({
            type: 'health-response',
            status: 'healthy',
            processedTasks: this.processedTasks,
            timestamp: Date.now(),
          });
          break;
      }
    };
  }

  private async processTask(task: any): Promise<void> {
    try {
      console.log(`🔧 Worker processing task: ${task.id}`);

      // Simulate different types of spawn operations
      switch (task.tool) {
        case 'jq':
          await this.processWithJq(task);
          break;
        case 'curl':
          await this.processWithCurl(task);
          break;
        case 'grep':
          await this.processWithGrep(task);
          break;
        default:
          throw new Error(`Unsupported tool: ${task.tool}`);
      }

      this.processedTasks++;

      this.worker.postMessage({
        type: 'task-completed',
        taskId: task.id,
        success: true,
        processedTasks: this.processedTasks,
      });

    } catch (error) {
      console.error(`❌ Task ${task.id} failed:`, error);

      this.worker.postMessage({
        type: 'task-failed',
        taskId: task.id,
        error: (error as Error).message,
      });
    }
  }

  private async processWithJq(task: any): Promise<void> {
    const result = await this.worker.spawnTool('jq', ['-r', task.query || '.'], {
      stdin: task.data ? JSON.stringify(task.data) : undefined,
    });

    if (!result.success) {
      throw new Error(`jq processing failed: ${result.error}`);
    }

    console.log(`📊 jq result: ${result.output.slice(0, 100)}...`);
  }

  private async processWithCurl(task: any): Promise<void> {
    const args = ['-s', task.url];
    if (task.method && task.method !== 'GET') {
      args.unshift('-X', task.method);
    }

    const result = await this.worker.spawnTool('curl', args);

    if (!result.success) {
      throw new Error(`curl request failed: ${result.error}`);
    }

    console.log(`🌐 curl result: ${result.output.slice(0, 100)}...`);
  }

  private async processWithGrep(task: any): Promise<void> {
    const result = await this.worker.spawnTool('grep', [task.pattern || '.*'], {
      stdin: task.text || 'sample text for grep',
    });

    if (!result.success) {
      throw new Error(`grep search failed: ${result.error}`);
    }

    console.log(`🔍 grep result: ${result.output.slice(0, 100)}...`);
  }
}

// ============================================================================
// SYSTEM DEMONSTRATION
// ============================================================================

/**
 * Complete system demonstration
 */
export async function demonstrateWorkerSpawnSystem(): Promise<void> {
  console.log('🚀 Starting Bun Workers & Spawn Integration Demo');
  console.log('================================================');

  try {
    // 1. Initialize Core Components
    console.log('\n📦 Initializing core components...');

    const tensionEngine = createSpawnTensionEngine();
    await tensionEngine.initialize();

    const securityValidator = createSecurityValidator();
    await securityValidator.initialize();

    console.log('✅ Core components initialized');

    // 2. Create Worker Configurations
    console.log('\n👷 Creating worker configurations...');

    const workerConfigs = [
      {
        workerId: 'demo-worker-1',
        scriptPath: './src/workers/demo-worker.ts', // We'll create this
        spawnConfig: {
          allowedTools: ['jq', 'curl', 'grep'],
          defaultTimeout: 10000,
          maxBufferMB: 10,
        },
      },
      {
        workerId: 'demo-worker-2',
        scriptPath: './src/workers/demo-worker.ts',
        spawnConfig: {
          allowedTools: ['jq', 'curl', 'grep', 'sort'],
          defaultTimeout: 15000,
          maxBufferMB: 20,
        },
      },
    ];

    // 3. Create Parent Orchestrator
    console.log('\n🎼 Creating parent orchestrator...');

    const orchestrator = createParentOrchestrator(
      workerConfigs,
      tensionEngine,
      securityValidator
    );

    // 4. Create Health Monitor
    console.log('\n🏥 Creating health monitor...');

    const healthMonitor = createHealthMonitor(orchestrator, tensionEngine);

    // 5. Start the System
    console.log('\n▶️  Starting the system...');

    await orchestrator.start();
    await healthMonitor.start();

    console.log('✅ System started successfully');

    // 6. Demonstrate Worker Operations
    console.log('\n🔧 Demonstrating worker operations...');

    await demonstrateWorkerOperations(orchestrator);

    // 7. Demonstrate Tension Monitoring
    console.log('\n📊 Demonstrating tension monitoring...');

    await demonstrateTensionMonitoring(tensionEngine, orchestrator);

    // 8. Demonstrate Health Monitoring
    console.log('\n🏥 Demonstrating health monitoring...');

    await demonstrateHealthMonitoring(healthMonitor);

    // 9. Demonstrate Circuit Breaker
    console.log('\n🔴 Demonstrating circuit breaker...');

    await demonstrateCircuitBreaker(orchestrator, tensionEngine);

    // 10. Show Final Metrics
    console.log('\n📈 Final system metrics...');

    await showFinalMetrics(orchestrator, healthMonitor, tensionEngine);

    // 11. Graceful Shutdown
    console.log('\n🛑 Shutting down system...');

    await healthMonitor.stop();
    await orchestrator.stop();

    console.log('✅ System shutdown complete');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// DEMONSTRATION FUNCTIONS
// ============================================================================

async function demonstrateWorkerOperations(orchestrator: ParentWorkerOrchestrator): Promise<void> {
  // Wait for workers to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  const workers = orchestrator.listWorkers();
  console.log(`   Found ${workers.length} workers: ${workers.map(w => w.id).join(', ')}`);

  // Send test tasks to workers
  const testTasks = [
    {
      id: 'task-1',
      tool: 'jq',
      query: '.name',
      data: { name: 'Alice', age: 30 },
    },
    {
      id: 'task-2',
      tool: 'curl',
      url: 'https://httpbin.org/get',
      method: 'GET',
    },
    {
      id: 'task-3',
      tool: 'grep',
      pattern: 'sample',
      text: 'This is sample text for grep testing',
    },
  ];

  for (const task of testTasks) {
    try {
      // In a real implementation, we'd send this to a specific worker
      // For demo purposes, we'll just log the task
      console.log(`   📤 Sending task ${task.id} (${task.tool})`);
    } catch (error) {
      console.error(`   ❌ Failed to send task ${task.id}:`, error);
    }
  }

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 3000));
}

async function demonstrateTensionMonitoring(
  tensionEngine: TensionScoringEngine,
  orchestrator: ParentWorkerOrchestrator
): Promise<void> {
  // Simulate some tension events
  console.log('   📊 Simulating tension events...');

  // Simulate successful operations (low tension)
  tensionEngine.emitTension('spawn:execution:success', 0.0, {
    workerId: 'demo-worker-1',
    tool: 'jq',
    executionTime: 150,
  });

  // Simulate slow operation (medium tension)
  tensionEngine.emitTension('spawn:execution:slow', 0.1, {
    workerId: 'demo-worker-1',
    tool: 'curl',
    executionTime: 8000,
    threshold: 5000,
  });

  // Simulate timeout (high tension)
  tensionEngine.emitTension('spawn:execution:timeout', 0.3, {
    workerId: 'demo-worker-2',
    tool: 'grep',
    timeout: 10000,
  });

  // Wait for tension processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Show current tension scores
  const workers = orchestrator.listWorkers();
  for (const worker of workers) {
    const tension = tensionEngine.getWorkerTension(worker.id);
    console.log(`   📈 Worker ${worker.id} tension: ${tension.toFixed(3)}`);
  }
}

async function demonstrateHealthMonitoring(healthMonitor: WorkerHealthMonitor): Promise<void> {
  // Force a health check
  await healthMonitor.forceHealthCheck();

  // Show health metrics
  const metrics = healthMonitor.getHealthMetrics();
  console.log(`   🏥 Health metrics: ${metrics.healthyWorkers}/${metrics.totalWorkers} healthy`);
  console.log(`   📊 Average tension: ${metrics.averageTension.toFixed(3)}`);
  console.log(`   🔄 Total respawns: ${metrics.totalRespawns}`);

  // Show individual worker health
  const workers = ['demo-worker-1', 'demo-worker-2'];
  for (const workerId of workers) {
    const health = healthMonitor.getWorkerHealth(workerId);
    if (health) {
      console.log(`   💚 Worker ${workerId}: ${health.isHealthy ? 'healthy' : 'unhealthy'} (${health.tensionScore.toFixed(3)} tension)`);
    }
  }
}

async function demonstrateCircuitBreaker(
  orchestrator: ParentWorkerOrchestrator,
  tensionEngine: TensionScoringEngine
): Promise<void> {
  console.log('   🔴 Simulating circuit breaker activation...');

  // Simulate multiple failures to trigger circuit breaker
  for (let i = 0; i < 6; i++) {
    tensionEngine.emitTension('spawn:execution:failed', 0.2, {
      workerId: 'demo-worker-1',
      tool: 'jq',
      exitCode: 1,
    });
  }

  // Wait for circuit breaker processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check circuit breaker status
  const workers = orchestrator.listWorkers();
  for (const worker of workers) {
    console.log(`   🔌 Worker ${worker.id} circuit breaker: ${worker.circuitBreakerState}`);
  }
}

async function showFinalMetrics(
  orchestrator: ParentWorkerOrchestrator,
  healthMonitor: WorkerHealthMonitor,
  tensionEngine: TensionScoringEngine
): Promise<void> {
  const orchestratorMetrics = orchestrator.getOrchestratorMetrics();
  const healthMetrics = healthMonitor.getHealthMetrics();
  const tensionMetrics = tensionEngine.getMetrics();

  console.log('\n📊 FINAL SYSTEM METRICS');
  console.log('=======================');
  console.log(`Workers: ${orchestratorMetrics.activeWorkers}/${orchestratorMetrics.totalWorkers} active`);
  console.log(`Health: ${healthMetrics.healthyWorkers}/${healthMetrics.totalWorkers} healthy`);
  console.log(`Tension: ${orchestratorMetrics.averageTension.toFixed(3)} average`);
  console.log(`Spawns: ${orchestratorMetrics.totalSpawns} total, ${orchestratorMetrics.totalFailures} failures`);
  console.log(`Circuit Breakers: ${orchestratorMetrics.circuitBreakersOpen} active`);
  console.log(`Respawns: ${healthMetrics.totalRespawns} total`);
  console.log(`Tension Events: ${tensionMetrics.eventCount} total`);
  console.log(`System Uptime: ${orchestratorMetrics.uptimeSeconds}s`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a demo worker script (in a real implementation, this would be a separate file)
 */
export function createDemoWorkerScript(): string {
  return `
#!/usr/bin/env bun

/**
 * Demo Worker Script for Spawn Integration Testing
 */

import { DemoSpawnWorker } from './demo-spawn-worker';

// Create and run demo worker
const worker = new DemoSpawnWorker(self as any);

// Worker is now ready to receive messages
console.log('Demo worker initialized and ready');
  `;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Run the demonstration if called directly
if (import.meta.main) {
  demonstrateWorkerSpawnSystem().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export { demonstrateWorkerSpawnSystem, createDemoWorkerScript };