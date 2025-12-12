#!/usr/bin/env bun

/**
 * 🎯 Worker Configuration Example - Bun Workers & Spawn Integration
 *
 * This file demonstrates how to configure workers with spawn capabilities
 * for the Tension Alerting System. Shows integration patterns for:
 * - Worker initialization with spawn config
 * - Tension monitoring setup
 * - Security controls and tool whitelisting
 * - Performance tuning and resource limits
 */

import { WorkerWithSpawn } from '../src/workers/worker-with-spawn';
import { ParentWorkerOrchestrator } from '../src/core/parent-orchestrator';
import { TensionScoringEngine } from '../src/core/tension-scoring/tension-engine';
import { SpawnSecurityValidator } from '../src/security/spawn-validator';
import { WorkerHealthMonitor } from '../src/monitoring/worker-health-monitor';

// ============================================================================
// 1. WORKER CONFIGURATION EXAMPLES
// ============================================================================

/**
 * Telegram Sender Worker Configuration
 * Handles alert notifications with external tool integration
 */
export const TELEGRAM_SENDER_CONFIG = {
  workerId: 'telegram-sender-01',
  scriptPath: './src/workers/telegram-sender.ts',

  // Spawn configuration (immutable via environmentData)
  spawnConfig: {
    allowedTools: ['curl', 'jq', 'grep', 'sort'],
    defaultTimeout: 30000,      // 30s
    maxBufferMB: 50,            // 50MB
    maxSpawnsPerMinute: 10,     // Rate limiting
    allowedDirs: ['/etc/alertmon', '/var/log', '/tmp'],
    killSignal: 'SIGTERM' as const,
  },

  // Dynamic runtime configuration (workerData)
  runtimeConfig: {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    alertChannels: ['#critical-alerts', '#performance-alerts'],
    retryAttempts: 3,
    backoffMultiplier: 1.5,
  },

  // Tension monitoring
  tensionConfig: {
    enabled: true,
    alertThreshold: 0.5,
    circuitBreakerThreshold: 0.7,
    respawnOnTension: true,
  },

  // Performance tuning
  performanceConfig: {
    smol: true,                 // Bun v1.3: Reduced memory usage
    maxOldGenerationSizeMB: 100,
    maxYoungGenerationSizeMB: 50,
  },
};

/**
 * Config Validation Worker Configuration
 * Validates configuration files using external tools
 */
export const CONFIG_VALIDATOR_CONFIG = {
  workerId: 'config-validator-01',
  scriptPath: './src/workers/config-validator.ts',

  spawnConfig: {
    allowedTools: ['toml-validator', 'yaml-validator', 'json-schema-validator'],
    defaultTimeout: 15000,      // 15s for validation
    maxBufferMB: 10,            // Smaller buffer for validation
    maxSpawnsPerMinute: 20,     // Higher rate for validation
    allowedDirs: ['/etc', '/config', '/app/config'],
    killSignal: 'SIGTERM' as const,
  },

  runtimeConfig: {
    schemaDir: '/app/schemas',
    validationCacheEnabled: true,
    cacheTTL: 300000,          // 5 minutes
  },

  tensionConfig: {
    enabled: true,
    alertThreshold: 0.3,
    circuitBreakerThreshold: 0.6,
    respawnOnTension: true,
  },

  performanceConfig: {
    smol: true,
    maxOldGenerationSizeMB: 75,
    maxYoungGenerationSizeMB: 25,
  },
};

/**
 * Data Processing Worker Configuration
 * Processes market data with external analysis tools
 */
export const DATA_PROCESSOR_CONFIG = {
  workerId: 'data-processor-01',
  scriptPath: './src/workers/data-processor.ts',

  spawnConfig: {
    allowedTools: ['python3', 'Rscript', 'gnuplot', 'awk', 'sed'],
    defaultTimeout: 60000,      // 1 minute for data processing
    maxBufferMB: 200,           // Larger buffer for data
    maxSpawnsPerMinute: 5,      // Lower rate for heavy processing
    allowedDirs: ['/data', '/tmp', '/var/tmp'],
    killSignal: 'SIGTERM' as const,
  },

  runtimeConfig: {
    pythonPath: '/usr/bin/python3',
    rLibsPath: '/usr/local/lib/R',
    tempDir: '/var/tmp/data-processor',
    cleanupTempFiles: true,
  },

  tensionConfig: {
    enabled: true,
    alertThreshold: 0.4,
    circuitBreakerThreshold: 0.8,
    respawnOnTension: true,
  },

  performanceConfig: {
    smol: false,                // Full memory for data processing
    maxOldGenerationSizeMB: 500,
    maxYoungGenerationSizeMB: 200,
  },
};

// ============================================================================
// 2. TENSION SCORING CONFIGURATION
// ============================================================================

/**
 * Spawn-Specific Tension Rules Configuration
 */
export const SPAWN_TENSION_CONFIG = {
  rules: {
    // Security violation
    'spawn:tool:not_allowed': {
      condition: (tool: string, allowed: string[]) => !allowed.includes(tool),
      weight: 0.5,
      severity: 'critical' as const,
      remedy: 'Update allowedTools whitelist',
      alert: 'Worker attempted to spawn unauthorized tool',
    },

    // Timeout (tool unresponsive)
    'spawn:execution:timeout': {
      condition: (killedByTimeout: boolean) => killedByTimeout,
      weight: 0.3,
      severity: 'high' as const,
      remedy: 'Increase timeout or optimize tool input',
      alert: 'External tool execution timed out',
    },

    // Buffer overflow
    'spawn:output:buffer_overflow': {
      condition: (killedByBuffer: boolean) => killedByBuffer,
      weight: 0.25,
      severity: 'high' as const,
      remedy: 'Reduce input size or increase maxBuffer',
      alert: 'Tool output exceeded buffer limit',
    },

    // Failure rate high
    'spawn:tool:failure_rate': {
      condition: (failures: number, total: number) => (failures / total) > 0.1,
      weight: 0.2 + ((failures / total) - 0.1) * 2,
      severity: 'critical' as const,
      remedy: 'Investigate tool reliability or use alternative',
      alert: 'External tool failure rate exceeds 10%',
    },

    // Slow execution
    'spawn:execution:slow': {
      condition: (ms: number) => ms > 5000,
      weight: 0.1 + Math.floor(ms / 5000) * 0.05,
      severity: 'medium' as const,
      remedy: 'Profile tool execution',
      alert: 'Tool execution exceeds 5s threshold',
    },

    // Spawn rate too high
    'spawn:rate:high': {
      condition: (spawnsPerSecond: number) => spawnsPerSecond > 10,
      weight: 0.15,
      severity: 'medium' as const,
      remedy: 'Implement tool result caching',
      alert: 'Worker spawning tools too frequently',
    },
  },

  thresholds: {
    warning: 0.3,
    critical: 0.5,
    circuitBreaker: 0.7,
  },

  monitoring: {
    enabled: true,
    intervalMs: 30000,         // Check every 30s
    retentionHours: 24,        // Keep metrics for 24h
    alertCooldownMs: 300000,   // 5 minutes between alerts
  },
};

// ============================================================================
// 3. SECURITY CONFIGURATION
// ============================================================================

/**
 * Spawn Security Configuration
 */
export const SPAWN_SECURITY_CONFIG = {
  validation: {
    enabled: true,
    validateToolsOnStartup: true,
    auditAllSpawns: true,
    blocklistEnvVars: [
      'LD_PRELOAD',
      'LD_LIBRARY_PATH',
      'DYLD_LIBRARY_PATH',
      'DYLD_INSERT_LIBRARIES',
    ],
  },

  sanitization: {
    allowedEnvVars: [
      'PATH',
      'HOME',
      'USER',
      'SHELL',
      'LANG',
      'LC_*',
      'TZ',
    ],
    sanitizePath: true,
    restrictWorkingDirectory: true,
  },

  resourceLimits: {
    maxConcurrentSpawns: 5,
    maxTotalSpawnsPerHour: 1000,
    maxMemoryPerSpawnMB: 100,
    maxCpuTimePerSpawnSeconds: 60,
  },

  audit: {
    enabled: true,
    logFile: '/var/log/spawn-audit.log',
    maxLogSizeMB: 100,
    retentionDays: 30,
  },
};

// ============================================================================
// 4. ORCHESTRATOR CONFIGURATION
// ============================================================================

/**
 * Parent Worker Orchestrator Configuration
 */
export const ORCHESTRATOR_CONFIG = {
  workers: [
    TELEGRAM_SENDER_CONFIG,
    CONFIG_VALIDATOR_CONFIG,
    DATA_PROCESSOR_CONFIG,
  ],

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
    failureThreshold: 0.5,     // 50% failure rate
    recoveryTimeoutMs: 300000, // 5 minutes
    halfOpenMaxRequests: 3,
  },
};

// ============================================================================
// 5. USAGE EXAMPLES
// ============================================================================

/**
 * Example: Initialize Complete Worker System
 */
export async function initializeWorkerSystem() {
  console.log('🚀 Initializing Worker-Spawn Integration System');

  // 1. Initialize tension scoring engine
  const tensionEngine = new TensionScoringEngine(SPAWN_TENSION_CONFIG);
  await tensionEngine.initialize();

  // 2. Initialize security validator
  const securityValidator = new SpawnSecurityValidator(SPAWN_SECURITY_CONFIG);
  await securityValidator.initialize();

  // 3. Create worker orchestrator
  const orchestrator = new ParentWorkerOrchestrator(ORCHESTRATOR_CONFIG);

  // 4. Initialize health monitoring
  const healthMonitor = new WorkerHealthMonitor({
    orchestrator,
    tensionEngine,
    checkIntervalMs: 30000,
    tensionThreshold: 0.5,
  });

  // 5. Start the system
  await orchestrator.start();
  await healthMonitor.start();

  console.log('✅ Worker-Spawn Integration System initialized');

  return {
    orchestrator,
    tensionEngine,
    securityValidator,
    healthMonitor,
  };
}

/**
 * Example: Create Individual Worker with Spawn Capabilities
 */
export async function createSpawnEnabledWorker(config: typeof TELEGRAM_SENDER_CONFIG) {
  // Set environmentData (immutable spawn config)
  setEnvironmentData(`worker:${config.workerId}`, {
    spawnConfig: config.spawnConfig,
  });

  // Create worker with spawn capabilities
  const worker = new WorkerWithSpawn(config.scriptPath, {
    workerData: config.runtimeConfig,
    smol: config.performanceConfig.smol,
    name: config.workerId,
  });

  // Configure tension monitoring
  worker.onTensionUpdate = (tension: number, reason: string) => {
    console.log(`⚠️ Worker ${config.workerId} tension: ${tension} (${reason})`);
  };

  return worker;
}

/**
 * Example: Monitor Worker Spawn Metrics
 */
export async function monitorWorkerMetrics(workerId: string) {
  const orchestrator = new ParentWorkerOrchestrator(ORCHESTRATOR_CONFIG);
  const metrics = await orchestrator.getWorkerMetrics(workerId);

  console.log(`📊 Worker ${workerId} Spawn Metrics:`);
  console.log(`   Spawns: ${metrics.spawnCount}`);
  console.log(`   Failures: ${metrics.spawnFailures}`);
  console.log(`   Timeouts: ${metrics.spawnTimeouts}`);
  console.log(`   Avg Time: ${metrics.avgExecutionTime}ms`);
  console.log(`   Tension: ${metrics.tensionScore}`);
  console.log(`   Status: ${metrics.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);

  return metrics;
}

// ============================================================================
// 6. CLI INTEGRATION EXAMPLES
// ============================================================================

/**
 * CLI Command: Show Worker Spawn Metrics
 * Usage: bun run worker:metrics --id telegram-sender-01
 */
export async function showWorkerMetrics(workerId: string) {
  const metrics = await monitorWorkerMetrics(workerId);

  // Format for CLI output
  const output = `
Worker: ${workerId} (PID: ${metrics.workerPid})
├─ Spawns: ${metrics.spawnCount} (${(metrics.spawnCount / metrics.uptimeMinutes).toFixed(1)}/min)
├─ Failures: ${metrics.spawnFailures} (${((metrics.spawnFailures / metrics.spawnCount) * 100).toFixed(1)}%)
├─ Timeouts: ${metrics.spawnTimeouts}
├─ Avg Time: ${metrics.avgExecutionTime.toFixed(0)}ms
├─ Tension: ${metrics.tensionScore.toFixed(3)} (${getTensionLevel(metrics.tensionScore)})
└─ Status: ${metrics.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}
  `.trim();

  console.log(output);
}

function getTensionLevel(tension: number): string {
  if (tension < 0.3) return 'Low';
  if (tension < 0.5) return 'Medium';
  if (tension < 0.7) return 'High';
  return 'Critical';
}

/**
 * CLI Command: List All Workers with Spawn Status
 * Usage: bun run workers:list
 */
export async function listWorkersWithSpawnStatus() {
  const orchestrator = new ParentWorkerOrchestrator(ORCHESTRATOR_CONFIG);
  const workers = await orchestrator.listWorkers();

  console.log('🔧 Workers with Spawn Integration:');
  console.log('=' .repeat(60));

  for (const worker of workers) {
    const metrics = await orchestrator.getWorkerMetrics(worker.id);
    const status = worker.isRunning ? '🟢 Running' : '🔴 Stopped';
    const tension = getTensionLevel(metrics.tensionScore);

    console.log(`${worker.id.padEnd(20)} ${status.padEnd(12)} ${tension.padEnd(8)} ${metrics.spawnCount} spawns`);
  }
}

// ============================================================================
// 7. TESTING CONFIGURATION
// ============================================================================

/**
 * Test Configuration for Worker-Spawn Integration
 */
export const WORKER_SPAWN_TEST_CONFIG = {
  mockTools: {
    'test-tool-success': {
      exitCode: 0,
      stdout: 'success output',
      stderr: '',
      executionTime: 100,
    },
    'test-tool-failure': {
      exitCode: 1,
      stdout: '',
      stderr: 'tool failed',
      executionTime: 50,
    },
    'test-tool-timeout': {
      exitCode: null, // Will timeout
      executionTime: 35000, // Exceeds timeout
    },
  },

  testScenarios: [
    {
      name: 'successful-spawn',
      tool: 'test-tool-success',
      expectedTension: 0.0,
      expectedSuccess: true,
    },
    {
      name: 'failed-spawn',
      tool: 'test-tool-failure',
      expectedTension: 0.2,
      expectedSuccess: false,
    },
    {
      name: 'timeout-spawn',
      tool: 'test-tool-timeout',
      expectedTension: 0.3,
      expectedSuccess: false,
    },
    {
      name: 'unauthorized-tool',
      tool: 'unauthorized-tool',
      expectedTension: 0.5,
      expectedSuccess: false,
    },
  ],
};

// ============================================================================
// 8. EXPORT CONFIGURATIONS
// ============================================================================

export {
  TELEGRAM_SENDER_CONFIG,
  CONFIG_VALIDATOR_CONFIG,
  DATA_PROCESSOR_CONFIG,
  SPAWN_TENSION_CONFIG,
  SPAWN_SECURITY_CONFIG,
  ORCHESTRATOR_CONFIG,
  WORKER_SPAWN_TEST_CONFIG,
};

// Type exports for TypeScript
export type WorkerConfig = typeof TELEGRAM_SENDER_CONFIG;
export type TensionConfig = typeof SPAWN_TENSION_CONFIG;
export type SecurityConfig = typeof SPAWN_SECURITY_CONFIG;
export type OrchestratorConfig = typeof ORCHESTRATOR_CONFIG;