#!/usr/bin/env bun

/**
 * 🎯 WorkerWithSpawn - Extended Worker with Spawn Capabilities
 *
 * Extends Bun Worker with spawn functionality for external tool execution.
 * Includes tension monitoring, security validation, and resource management.
 */

import { Worker, spawn as bunSpawn, type SpawnOptions } from 'bun';
import { TensionScoringEngine } from '../tension-scoring/tension-engine';
import { SpawnSecurityValidator } from '../../security/spawn-validator';

export interface SpawnConfig {
  allowedTools: string[];
  defaultTimeout: number;
  maxBufferMB: number;
  maxSpawnsPerMinute: number;
  allowedDirs: string[];
  killSignal: NodeJS.Signals;
}

export interface WorkerSpawnMetrics {
  spawnCount: number;
  spawnFailures: number;
  spawnTimeouts: number;
  spawnBufferOverflows: number;
  totalExecutionTime: number;
  lastSpawnTime: number;
  failureRate: number;
  averageExecutionTime: number;
}

export interface SpawnResult {
  success: boolean;
  output: string;
  error: string;
  executionTime: number;
  exitCode: number | null;
  killedByTimeout?: boolean;
  killedByBuffer?: boolean;
}

export interface WorkerWithSpawnOptions extends WorkerOptions {
  spawnConfig?: Partial<SpawnConfig>;
  tensionEngine?: TensionScoringEngine;
  securityValidator?: SpawnSecurityValidator;
  onTensionUpdate?: (tension: number, reason: string) => void;
}

/**
 * Extended Worker class with spawn capabilities
 */
export class WorkerWithSpawn extends Worker {
  private spawnConfig: SpawnConfig;
  private tensionEngine?: TensionScoringEngine;
  private securityValidator?: SpawnSecurityValidator;
  private onTensionUpdate?: (tension: number, reason: string) => void;

  private spawnMetrics: WorkerSpawnMetrics = {
    spawnCount: 0,
    spawnFailures: 0,
    spawnTimeouts: 0,
    spawnBufferOverflows: 0,
    totalExecutionTime: 0,
    lastSpawnTime: 0,
    failureRate: 0,
    averageExecutionTime: 0,
  };

  private spawnRateLimiter = new Map<string, number[]>();
  private abortController = new AbortController();

  constructor(scriptPath: string | URL, options: WorkerWithSpawnOptions = {}) {
    super(scriptPath, options);

    // Initialize spawn configuration
    this.spawnConfig = this.createDefaultSpawnConfig();
    if (options.spawnConfig) {
      this.spawnConfig = { ...this.spawnConfig, ...options.spawnConfig };
    }

    // Set up tension monitoring
    this.tensionEngine = options.tensionEngine;
    this.securityValidator = options.securityValidator;
    this.onTensionUpdate = options.onTensionUpdate;

    // Set up message handling for spawn operations
    this.setupMessageHandling();
  }

  /**
   * Execute a spawn operation with full tension monitoring
   */
  async spawnTool(
    tool: string,
    args: string[] = [],
    options: Partial<SpawnOptions> = {}
  ): Promise<SpawnResult> {
    const startTime = performance.now();

    try {
      // 1. Security validation
      await this.validateSpawnSecurity(tool, args, options);

      // 2. Rate limiting check
      this.checkRateLimit(tool);

      // 3. Execute spawn
      const result = await this.executeSpawn(tool, args, options);

      // 4. Update metrics
      this.updateSpawnMetrics(result, performance.now() - startTime);

      // 5. Report tension
      this.reportSpawnTension(result, tool, args);

      return result;

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorResult: SpawnResult = {
        success: false,
        output: '',
        error: (error as Error).message,
        executionTime,
        exitCode: null,
      };

      // Update metrics for failed spawn
      this.updateSpawnMetrics(errorResult, executionTime);

      // Report tension for spawn error
      this.reportSpawnTension(errorResult, tool, args, error as Error);

      return errorResult;
    }
  }

  /**
   * Get current spawn metrics
   */
  getSpawnMetrics(): WorkerSpawnMetrics {
    return { ...this.spawnMetrics };
  }

  /**
   * Get current tension score for this worker
   */
  getTensionScore(): number {
    if (!this.tensionEngine) return 0;
    return this.tensionEngine.getWorkerTension(this.name || 'unknown');
  }

  /**
   * Graceful shutdown with abort signal
   */
  async shutdown(): Promise<void> {
    this.abortController.abort();

    // Terminate any running spawns
    // Note: In a real implementation, we'd track active spawns and terminate them

    await this.terminate();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private createDefaultSpawnConfig(): SpawnConfig {
    return {
      allowedTools: ['jq', 'curl', 'grep', 'sort', 'awk'],
      defaultTimeout: 30000,
      maxBufferMB: 50,
      maxSpawnsPerMinute: 10,
      allowedDirs: ['/etc', '/tmp', '/var/tmp'],
      killSignal: 'SIGTERM',
    };
  }

  private setupMessageHandling(): void {
    // Handle spawn-related messages from worker
    this.onmessage = (event) => {
      const message = event.data;

      if (message.type === 'spawn:request') {
        this.handleSpawnRequest(message);
      } else if (message.type === 'spawn:metrics') {
        this.handleMetricsRequest(message);
      }
    };
  }

  private async handleSpawnRequest(message: any): Promise<void> {
    try {
      const result = await this.spawnTool(
        message.tool,
        message.args,
        message.options
      );

      this.postMessage({
        type: 'spawn:result',
        id: message.id,
        result,
      });
    } catch (error) {
      this.postMessage({
        type: 'spawn:error',
        id: message.id,
        error: (error as Error).message,
      });
    }
  }

  private handleMetricsRequest(message: any): void {
    this.postMessage({
      type: 'metrics:response',
      id: message.id,
      metrics: this.getSpawnMetrics(),
      tension: this.getTensionScore(),
    });
  }

  private async validateSpawnSecurity(
    tool: string,
    args: string[],
    options: Partial<SpawnOptions>
  ): Promise<void> {
    // Check if tool is allowed
    if (!this.spawnConfig.allowedTools.includes(tool)) {
      const error = new Error(`Tool '${tool}' not in allowed tools list`);
      this.tensionEngine?.emitTension('spawn:tool:not_allowed', 0.5, {
        workerId: this.name,
        attemptedTool: tool,
        allowedTools: this.spawnConfig.allowedTools,
      });
      throw error;
    }

    // Additional security validation
    if (this.securityValidator) {
      await this.securityValidator.validateSpawn({
        tool,
        args,
        options,
        workerId: this.name,
      });
    }
  }

  private checkRateLimit(tool: string): void {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get or create rate tracking for this tool
    const toolSpawns = this.spawnRateLimiter.get(tool) || [];
    const recentSpawns = toolSpawns.filter(time => time > windowStart);

    if (recentSpawns.length >= this.spawnConfig.maxSpawnsPerMinute) {
      const spawnsPerSecond = recentSpawns.length / 60;
      this.tensionEngine?.emitTension('spawn:rate:high', 0.15, {
        workerId: this.name,
        tool,
        spawnsPerSecond,
        limit: this.spawnConfig.maxSpawnsPerMinute,
      });
      throw new Error(`Rate limit exceeded for tool '${tool}'`);
    }

    // Add current spawn to tracking
    recentSpawns.push(now);
    this.spawnRateLimiter.set(tool, recentSpawns);
  }

  private async executeSpawn(
    tool: string,
    args: string[],
    options: Partial<SpawnOptions>
  ): Promise<SpawnResult> {
    const startTime = performance.now();

    // Prepare spawn options with security and resource controls
    const spawnOptions: SpawnOptions = {
      ...options,
      timeout: options.timeout || this.spawnConfig.defaultTimeout,
      maxBuffer: options.maxBuffer || (this.spawnConfig.maxBufferMB * 1024 * 1024),
      signal: this.abortController.signal,

      // Security: Sanitize environment
      env: this.sanitizeEnvironment(options.env),

      // Ensure we're using allowed directories
      cwd: this.validateWorkingDirectory(options.cwd),
    };

    try {
      const proc = bunSpawn([tool, ...args], spawnOptions);

      // Stream output
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);

      const exitCode = await proc.exited;
      const executionTime = performance.now() - startTime;

      const result: SpawnResult = {
        success: exitCode === 0,
        output: stdout,
        error: stderr,
        executionTime,
        exitCode,
      };

      return result;

    } catch (error) {
      const executionTime = performance.now() - startTime;

      if ((error as Error).name === 'TimeoutError') {
        return {
          success: false,
          output: '',
          error: 'Spawn operation timed out',
          executionTime,
          exitCode: null,
          killedByTimeout: true,
        };
      }

      if ((error as Error).name === 'BufferOverflowError') {
        return {
          success: false,
          output: '',
          error: 'Spawn output exceeded buffer limit',
          executionTime,
          exitCode: null,
          killedByBuffer: true,
        };
      }

      throw error;
    }
  }

  private sanitizeEnvironment(env?: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    // Only allow safe environment variables
    const allowedVars = [
      'PATH', 'HOME', 'USER', 'SHELL', 'LANG',
      'LC_*', 'TZ', 'TMPDIR'
    ];

    const inputEnv = env || process.env;

    for (const [key, value] of Object.entries(inputEnv)) {
      if (allowedVars.some(pattern =>
        pattern.includes('*') ? key.startsWith(pattern.slice(0, -1)) : key === pattern
      )) {
        sanitized[key] = value;
      }
    }

    // Block dangerous variables
    delete sanitized.LD_PRELOAD;
    delete sanitized.LD_LIBRARY_PATH;
    delete sanitized.DYLD_LIBRARY_PATH;

    return sanitized;
  }

  private validateWorkingDirectory(cwd?: string): string {
    if (!cwd) return process.cwd();

    // Check if directory is allowed
    const isAllowed = this.spawnConfig.allowedDirs.some(allowedDir =>
      cwd.startsWith(allowedDir)
    );

    if (!isAllowed) {
      throw new Error(`Working directory '${cwd}' not in allowed directories`);
    }

    return cwd;
  }

  private updateSpawnMetrics(result: SpawnResult, executionTime: number): void {
    this.spawnMetrics.spawnCount++;
    this.spawnMetrics.lastSpawnTime = Date.now();
    this.spawnMetrics.totalExecutionTime += executionTime;

    if (!result.success) {
      this.spawnMetrics.spawnFailures++;
    }

    if (result.killedByTimeout) {
      this.spawnMetrics.spawnTimeouts++;
    }

    if (result.killedByBuffer) {
      this.spawnMetrics.spawnBufferOverflows++;
    }

    // Recalculate derived metrics
    this.spawnMetrics.failureRate = this.spawnMetrics.spawnFailures / this.spawnMetrics.spawnCount;
    this.spawnMetrics.averageExecutionTime = this.spawnMetrics.totalExecutionTime / this.spawnMetrics.spawnCount;
  }

  private reportSpawnTension(
    result: SpawnResult,
    tool: string,
    args: string[],
    error?: Error
  ): void {
    if (!this.tensionEngine) return;

    const metadata = {
      workerId: this.name,
      tool,
      args,
      executionTime: result.executionTime,
      exitCode: result.exitCode,
    };

    // Report based on result
    if (result.killedByTimeout) {
      this.tensionEngine.emitTension('spawn:execution:timeout', 0.3, metadata);
    } else if (result.killedByBuffer) {
      this.tensionEngine.emitTension('spawn:output:buffer_overflow', 0.25, metadata);
    } else if (!result.success) {
      this.tensionEngine.emitTension('spawn:execution:failed', 0.2, metadata);
    }

    // Check for slow execution
    if (result.executionTime > 5000) {
      this.tensionEngine.emitTension('spawn:execution:slow', 0.1, {
        ...metadata,
        threshold: 5000,
      });
    }

    // Check failure rate
    if (this.spawnMetrics.failureRate > 0.1) {
      this.tensionEngine.emitTension('spawn:tool:failure_rate', 0.2, {
        ...metadata,
        failureRate: this.spawnMetrics.failureRate,
        totalSpawns: this.spawnMetrics.spawnCount,
      });
    }

    // Notify tension update callback
    const currentTension = this.getTensionScore();
    if (this.onTensionUpdate) {
      this.onTensionUpdate(currentTension, `Spawn ${result.success ? 'success' : 'failure'} for ${tool}`);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a WorkerWithSpawn with default configuration
 */
export function createSpawnWorker(
  scriptPath: string | URL,
  options: WorkerWithSpawnOptions = {}
): WorkerWithSpawn {
  return new WorkerWithSpawn(scriptPath, options);
}

/**
 * Create a WorkerWithSpawn with full tension monitoring
 */
export function createMonitoredSpawnWorker(
  scriptPath: string | URL,
  tensionEngine: TensionScoringEngine,
  securityValidator?: SpawnSecurityValidator,
  options: Partial<WorkerWithSpawnOptions> = {}
): WorkerWithSpawn {
  return new WorkerWithSpawn(scriptPath, {
    ...options,
    tensionEngine,
    securityValidator,
  });
}