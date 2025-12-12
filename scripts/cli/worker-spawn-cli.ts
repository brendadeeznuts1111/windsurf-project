#!/usr/bin/env bun

/**
 * 🔧 Worker Spawn CLI Commands
 *
 * Command-line interface for monitoring and managing worker-spawn operations.
 * Provides real-time metrics, health status, and administrative controls.
 */

import { ParentWorkerOrchestrator } from '../src/core/parent-orchestrator';
import { WorkerHealthMonitor } from '../src/monitoring/worker-health-monitor';
import { TensionScoringEngine } from '../src/core/tension-scoring/tension-engine';
import { SpawnSecurityValidator } from '../src/security/spawn-validator';

// ============================================================================
// CLI COMMAND HANDLERS
// ============================================================================

/**
 * Show spawn metrics for a specific worker
 * Usage: bun run worker:metrics --id <worker-id>
 */
export async function showWorkerMetrics(
  workerId: string,
  orchestrator: ParentWorkerOrchestrator
): Promise<void> {
  const metrics = orchestrator.getWorkerMetrics(workerId);

  if (!metrics) {
    console.error(`❌ Worker '${workerId}' not found`);
    process.exit(1);
  }

  const workers = orchestrator.listWorkers();
  const worker = workers.find(w => w.id === workerId);

  console.log(`📊 Worker Spawn Metrics: ${workerId}`);
  console.log('=' .repeat(50));
  console.log(`Status: ${metrics.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
  console.log(`Health: ${metrics.isHealthy ? '💚 Healthy' : '💔 Unhealthy'}`);
  console.log(`Tension: ${metrics.tensionScore.toFixed(3)} (${getTensionLevel(metrics.tensionScore)})`);
  console.log(`Circuit Breaker: ${worker?.circuitBreakerState || 'unknown'}`);
  console.log('');
  console.log('Spawn Statistics:');
  console.log(`  Total Spawns: ${metrics.spawnCount}`);
  console.log(`  Failures: ${metrics.spawnFailures}`);
  console.log(`  Timeouts: ${metrics.spawnTimeouts}`);
  console.log(`  Failure Rate: ${((metrics.spawnFailures / Math.max(metrics.spawnCount, 1)) * 100).toFixed(1)}%`);
  console.log(`  Avg Execution Time: ${metrics.averageExecutionTime.toFixed(0)}ms`);
  console.log(`  Uptime: ${formatDuration(metrics.uptimeSeconds * 1000)}`);
  console.log(`  Last Health Check: ${formatTimeAgo(metrics.lastHealthCheck)}`);
}

/**
 * List all workers with spawn status
 * Usage: bun run workers:list
 */
export async function listWorkersWithSpawnStatus(
  orchestrator: ParentWorkerOrchestrator
): Promise<void> {
  const workers = orchestrator.listWorkers();

  if (workers.length === 0) {
    console.log('📭 No workers found');
    return;
  }

  console.log('🔧 Workers with Spawn Integration');
  console.log('=' .repeat(80));
  console.log('Worker ID'.padEnd(20) + 'Status'.padEnd(12) + 'Health'.padEnd(10) + 'Tension'.padEnd(10) + 'Spawns'.padEnd(8) + 'Circuit Breaker');
  console.log('-'.repeat(80));

  for (const worker of workers) {
    const metrics = orchestrator.getWorkerMetrics(worker.id);
    if (!metrics) continue;

    const status = worker.isRunning ? '🟢 Running' : '🔴 Stopped';
    const health = worker.isHealthy ? '💚 Healthy' : '💔 Unhealthy';
    const tension = metrics.tensionScore.toFixed(2).padStart(6);
    const spawns = metrics.spawnCount.toString().padStart(6);
    const circuit = worker.circuitBreakerState;

    console.log(
      worker.id.padEnd(20) +
      status.padEnd(12) +
      health.padEnd(10) +
      tension.padEnd(10) +
      spawns.padEnd(8) +
      circuit
    );
  }

  // Summary
  const totalWorkers = workers.length;
  const activeWorkers = workers.filter(w => w.isRunning).length;
  const healthyWorkers = workers.filter(w => w.isHealthy).length;
  const circuitBreakersOpen = workers.filter(w => w.circuitBreakerState !== 'closed').length;

  console.log('');
  console.log(`📈 Summary: ${activeWorkers}/${totalWorkers} active, ${healthyWorkers}/${totalWorkers} healthy, ${circuitBreakersOpen} circuit breakers open`);
}

/**
 * Show health monitor metrics
 * Usage: bun run health:status
 */
export async function showHealthStatus(
  healthMonitor: WorkerHealthMonitor
): Promise<void> {
  const metrics = healthMonitor.getHealthMetrics();

  console.log('🏥 Worker Health Monitor Status');
  console.log('=' .repeat(50));
  console.log(`Total Workers: ${metrics.totalWorkers}`);
  console.log(`Healthy Workers: ${metrics.healthyWorkers} (${((metrics.healthyWorkers / Math.max(metrics.totalWorkers, 1)) * 100).toFixed(1)}%)`);
  console.log(`Unhealthy Workers: ${metrics.unhealthyWorkers}`);
  console.log(`Average Tension: ${metrics.averageTension.toFixed(3)} (${getTensionLevel(metrics.averageTension)})`);
  console.log(`Active Circuit Breakers: ${metrics.activeCircuitBreakers}`);
  console.log(`Total Respawns: ${metrics.totalRespawns}`);
  console.log(`Monitor Uptime: ${formatDuration(metrics.uptimeSeconds * 1000)}`);
  console.log('');

  // Individual worker health
  console.log('Individual Worker Health:');
  console.log('-'.repeat(50));

  for (let i = 1; i <= metrics.totalWorkers; i++) {
    const workerId = `demo-worker-${i}`;
    const health = healthMonitor.getWorkerHealth(workerId);

    if (health) {
      const status = health.isHealthy ? '💚' : '💔';
      const tension = health.tensionScore.toFixed(2);
      const spawns = health.spawnMetrics.count;
      const failures = health.spawnMetrics.failures;

      console.log(`${workerId.padEnd(15)} ${status} ${tension.padStart(5)} tension, ${spawns} spawns, ${failures} failures`);
    }
  }
}

/**
 * Show tension monitoring status
 * Usage: bun run tension:status
 */
export async function showTensionStatus(
  tensionEngine: TensionScoringEngine
): Promise<void> {
  const metrics = tensionEngine.getMetrics();
  const recentEvents = tensionEngine.getRecentEvents(10);

  console.log('📊 Tension Monitoring Status');
  console.log('=' .repeat(50));
  console.log(`Current Tension: ${metrics.currentTension.toFixed(3)}`);
  console.log(`Peak Tension: ${metrics.peakTension.toFixed(3)}`);
  console.log(`Average Tension: ${metrics.averageTension.toFixed(3)}`);
  console.log(`Total Events: ${metrics.eventCount}`);
  console.log(`Last Event: ${formatTimeAgo(metrics.lastEventTime)}`);
  console.log('');

  console.log('Events by Type:');
  Object.entries(metrics.eventsByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('');
  console.log('Events by Severity:');
  Object.entries(metrics.eventsBySeverity).forEach(([severity, count]) => {
    console.log(`  ${severity}: ${count}`);
  });

  if (recentEvents.length > 0) {
    console.log('');
    console.log('Recent Events:');
    console.log('-'.repeat(50));

    recentEvents.forEach(event => {
      const timeAgo = formatTimeAgo(event.timestamp);
      const severity = event.severity.toUpperCase();
      console.log(`${timeAgo.padEnd(12)} ${severity.padStart(8)} ${event.type.padEnd(25)} ${event.message}`);
    });
  }
}

/**
 * Show security audit log
 * Usage: bun run security:audit [--limit <number>]
 */
export async function showSecurityAudit(
  securityValidator: SpawnSecurityValidator,
  limit: number = 20
): Promise<void> {
  const auditLog = securityValidator.getAuditLog(limit);
  const metrics = securityValidator.getSecurityMetrics();

  console.log('🔒 Security Audit Log');
  console.log('=' .repeat(50));
  console.log(`Total Validations: ${metrics.totalValidations}`);
  console.log(`Blocked Spawns: ${metrics.blockedSpawns}`);
  console.log(`Active Spawns: ${metrics.activeSpawns}`);
  console.log(`Total Warnings: ${metrics.warningsCount}`);
  console.log('');

  if (auditLog.length === 0) {
    console.log('📭 No audit entries found');
    return;
  }

  console.log('Recent Audit Entries:');
  console.log('-'.repeat(100));
  console.log('Time'.padEnd(12) + 'Worker'.padEnd(15) + 'Tool'.padEnd(10) + 'Allowed'.padEnd(8) + 'Warnings'.padEnd(8) + 'Reason');
  console.log('-'.repeat(100));

  auditLog.forEach(entry => {
    const time = formatTimeAgo(entry.timestamp);
    const worker = (entry.workerId || 'unknown').padEnd(15);
    const tool = entry.tool.padEnd(10);
    const allowed = entry.allowed ? '✅' : '❌';
    const warnings = entry.warnings.length.toString().padStart(6);
    const reason = entry.reason || '';

    console.log(`${time.padEnd(12)}${worker}${tool}${allowed.padEnd(8)}${warnings}  ${reason}`);
  });

  if (metrics.recentBlocks.length > 0) {
    console.log('');
    console.log('Recent Blocks:');
    metrics.recentBlocks.forEach(block => {
      console.log(`  ❌ ${formatTimeAgo(block.timestamp)}: ${block.tool} by ${block.workerId || 'unknown'} - ${block.reason}`);
    });
  }
}

/**
 * Force respawn a worker
 * Usage: bun run worker:respawn --id <worker-id> [--reason <reason>]
 */
export async function respawnWorker(
  workerId: string,
  reason: string,
  healthMonitor: WorkerHealthMonitor
): Promise<void> {
  console.log(`🔄 Respawning worker: ${workerId}`);
  console.log(`Reason: ${reason}`);

  const success = await healthMonitor.triggerRespawn(workerId, reason);

  if (success) {
    console.log('✅ Worker respawned successfully');
  } else {
    console.log('❌ Worker respawn failed');
    process.exit(1);
  }
}

/**
 * Stop a worker
 * Usage: bun run worker:stop --id <worker-id>
 */
export async function stopWorker(
  workerId: string,
  orchestrator: ParentWorkerOrchestrator
): Promise<void> {
  console.log(`🛑 Stopping worker: ${workerId}`);

  try {
    await orchestrator.stopWorker(workerId);
    console.log('✅ Worker stopped successfully');
  } catch (error) {
    console.error('❌ Failed to stop worker:', error);
    process.exit(1);
  }
}

/**
 * Start a worker
 * Usage: bun run worker:start --id <worker-id>
 */
export async function startWorker(
  workerId: string,
  orchestrator: ParentWorkerOrchestrator
): Promise<void> {
  console.log(`▶️  Starting worker: ${workerId}`);

  try {
    await orchestrator.startWorker(workerId);
    console.log('✅ Worker started successfully');
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

/**
 * Show system overview
 * Usage: bun run system:status
 */
export async function showSystemStatus(
  orchestrator: ParentWorkerOrchestrator,
  healthMonitor: WorkerHealthMonitor,
  tensionEngine: TensionScoringEngine,
  securityValidator: SpawnSecurityValidator
): Promise<void> {
  console.log('🚀 Worker-Spawn Integration System Status');
  console.log('=' .repeat(60));

  // Orchestrator metrics
  const orchMetrics = orchestrator.getOrchestratorMetrics();
  console.log('🎼 Orchestrator:');
  console.log(`  Workers: ${orchMetrics.activeWorkers}/${orchMetrics.totalWorkers} active`);
  console.log(`  Healthy: ${orchMetrics.healthyWorkers}/${orchMetrics.totalWorkers}`);
  console.log(`  Average Tension: ${orchMetrics.averageTension.toFixed(3)}`);
  console.log(`  Total Spawns: ${orchMetrics.totalSpawns}`);
  console.log(`  Total Failures: ${orchMetrics.totalFailures}`);
  console.log(`  Circuit Breakers: ${orchMetrics.circuitBreakersOpen} open`);
  console.log(`  Uptime: ${formatDuration(orchMetrics.uptimeSeconds * 1000)}`);
  console.log('');

  // Health monitor metrics
  const healthMetrics = healthMonitor.getHealthMetrics();
  console.log('🏥 Health Monitor:');
  console.log(`  Healthy Workers: ${healthMetrics.healthyWorkers}/${healthMetrics.totalWorkers}`);
  console.log(`  Active Circuit Breakers: ${healthMetrics.activeCircuitBreakers}`);
  console.log(`  Total Respawns: ${healthMetrics.totalRespawns}`);
  console.log(`  Uptime: ${formatDuration(healthMetrics.uptimeSeconds * 1000)}`);
  console.log('');

  // Tension engine metrics
  const tensionMetrics = tensionEngine.getMetrics();
  console.log('📊 Tension Engine:');
  console.log(`  Current Tension: ${tensionMetrics.currentTension.toFixed(3)}`);
  console.log(`  Peak Tension: ${tensionMetrics.peakTension.toFixed(3)}`);
  console.log(`  Total Events: ${tensionMetrics.eventCount}`);
  console.log(`  Last Event: ${formatTimeAgo(tensionMetrics.lastEventTime)}`);
  console.log('');

  // Security metrics
  const securityMetrics = securityValidator.getSecurityMetrics();
  console.log('🔒 Security:');
  console.log(`  Total Validations: ${securityMetrics.totalValidations}`);
  console.log(`  Blocked Spawns: ${securityMetrics.blockedSpawns}`);
  console.log(`  Active Spawns: ${securityMetrics.activeSpawns}`);
  console.log(`  Total Warnings: ${securityMetrics.warningsCount}`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTensionLevel(tension: number): string {
  if (tension < 0.3) return 'Low';
  if (tension < 0.5) return 'Medium';
  if (tension < 0.7) return 'High';
  return 'Critical';
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 0) return `${seconds}s ago`;
  return 'now';
}

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

/**
 * Parse CLI arguments
 */
function parseArgs(): { command: string; options: Record<string, any> } {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options: Record<string, any> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];

      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++; // Skip next arg as it's the value
      } else {
        options[key] = true;
      }
    }
  }

  return { command, options };
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log('🔧 Worker-Spawn Integration CLI');
  console.log('================================');
  console.log('');
  console.log('Commands:');
  console.log('  worker:metrics --id <worker-id>     Show spawn metrics for a worker');
  console.log('  workers:list                        List all workers with spawn status');
  console.log('  health:status                       Show health monitor status');
  console.log('  tension:status                      Show tension monitoring status');
  console.log('  security:audit [--limit <n>]        Show security audit log');
  console.log('  worker:respawn --id <worker-id>     Force respawn a worker');
  console.log('  worker:stop --id <worker-id>        Stop a worker');
  console.log('  worker:start --id <worker-id>       Start a worker');
  console.log('  system:status                       Show complete system status');
  console.log('  help                                Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  bun run cli/worker-spawn.ts worker:metrics --id demo-worker-1');
  console.log('  bun run cli/worker-spawn.ts workers:list');
  console.log('  bun run cli/worker-spawn.ts system:status');
}

// ============================================================================
// MAIN CLI EXECUTION
// ============================================================================

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const { command, options } = parseArgs();

  // Initialize system components (in a real implementation, these would be shared)
  const tensionEngine = new TensionScoringEngine({
    rules: {},
    thresholds: { warning: 0.3, critical: 0.5, circuitBreaker: 0.7 },
    monitoring: { enabled: true, intervalMs: 30000, retentionHours: 24, alertCooldownMs: 300000 },
  });

  const securityValidator = new SpawnSecurityValidator({
    validation: { enabled: true, validateToolsOnStartup: true, auditAllSpawns: true, blocklistEnvVars: [] },
    sanitization: { allowedEnvVars: ['PATH', 'HOME'], sanitizePath: true, restrictWorkingDirectory: true },
    resourceLimits: { maxConcurrentSpawns: 5, maxTotalSpawnsPerHour: 1000, maxMemoryPerSpawnMB: 100, maxCpuTimePerSpawnSeconds: 60 },
    audit: { enabled: true, logFile: '/tmp/spawn-audit.log', maxLogSizeMB: 10, retentionDays: 7 },
  });

  const orchestrator = new ParentWorkerOrchestrator({
    workers: [],
    orchestration: { autoStart: false, respawnFailedWorkers: true, maxRespawnAttempts: 3, respawnDelayMs: 5000 },
    monitoring: { healthCheckIntervalMs: 30000, tensionAggregationIntervalMs: 60000, metricsRetentionHours: 24 },
    circuitBreaker: { enabled: true, failureThreshold: 5, recoveryTimeoutMs: 300000, halfOpenMaxRequests: 3 },
  }, tensionEngine, securityValidator);

  const healthMonitor = new WorkerHealthMonitor({
    orchestrator,
    tensionEngine,
    checkIntervalMs: 30000,
    tensionThreshold: 0.5,
    respawnEnabled: true,
    circuitBreakerEnabled: true,
    maxRespawnAttempts: 3,
    cooldownPeriodMs: 60000,
  });

  // Execute command
  try {
    switch (command) {
      case 'worker:metrics':
        if (!options.id) {
          console.error('❌ Worker ID required (--id <worker-id>)');
          process.exit(1);
        }
        await showWorkerMetrics(options.id, orchestrator);
        break;

      case 'workers:list':
        await listWorkersWithSpawnStatus(orchestrator);
        break;

      case 'health:status':
        await showHealthStatus(healthMonitor);
        break;

      case 'tension:status':
        await showTensionStatus(tensionEngine);
        break;

      case 'security:audit':
        const limit = parseInt(options.limit) || 20;
        await showSecurityAudit(securityValidator, limit);
        break;

      case 'worker:respawn':
        if (!options.id) {
          console.error('❌ Worker ID required (--id <worker-id>)');
          process.exit(1);
        }
        await respawnWorker(options.id, options.reason || 'Manual respawn', healthMonitor);
        break;

      case 'worker:stop':
        if (!options.id) {
          console.error('❌ Worker ID required (--id <worker-id>)');
          process.exit(1);
        }
        await stopWorker(options.id, orchestrator);
        break;

      case 'worker:start':
        if (!options.id) {
          console.error('❌ Worker ID required (--id <worker-id>)');
          process.exit(1);
        }
        await startWorker(options.id, orchestrator);
        break;

      case 'system:status':
        await showSystemStatus(orchestrator, healthMonitor, tensionEngine, securityValidator);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

// Run CLI if called directly
if (import.meta.main) {
  main().catch(error => {
    console.error('CLI failed:', error);
    process.exit(1);
  });
}