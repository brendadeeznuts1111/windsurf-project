/**
 * @fileoverview PID Context Management System
 * @description Process identity, execution chains, and secure PID operations
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link MarketTelemetry} - Uses PID context for operation attribution
 * @see {@link AuditTrail} - Records PID operations for audit compliance
 * @see {@link PIDFileSystemDemo} - Demonstrates PID-aware file operations
 * @see {@link process.pid} - Node.js process identification
 * @see {@link process.ppid} - Parent process identification
 * @see {@link ExecutionLink} - Execution chain data structure
 */

/**
 * [CORE][TELEMETRY][CLASS][META:{singleton,extends=SecurePIDRegistry}][PIDContext][#REF:process.pid,ExecutionLink,PIDAuditTrail]
 *
 * PID Context Management System
 * Manages process identity, execution chains, and secure PID operations
 */

import { generateId, rapidHash } from '../utils/index-streamlined';
import { LoggerManager } from '../error/error-handler';
import type {
  ProcessType,
  ExecutionLink,
  TelemetryContext
} from './telemetry-types';
import { PIDContextError } from './telemetry-types';

export interface ProcessInfo {
  pid: number;
  parentPid?: number;
  instanceId: string;
  type: ProcessType;
  startTime: number;
  executionChain: ExecutionLink[];
  metadata: Record<string, any>;
}

export interface ExecutionContext {
  id: string;
  type: 'request' | 'execution' | 'fork' | 'spawn';
  timestamp: number;
  metadata?: Record<string, any>;
}

// Global process registry
const processes = new Map<number, ProcessInfo>();

export class SecurePIDRegistry {
  private static instance: SecurePIDRegistry;
  private readonly logger = LoggerManager.getInstance();

  static getInstance(): SecurePIDRegistry {
    if (!SecurePIDRegistry.instance) {
      SecurePIDRegistry.instance = new SecurePIDRegistry();
    }
    return SecurePIDRegistry.instance;
  }

  /**
   * Register a new process with full context
   */
  registerProcess(
    pid: number,
    type: ProcessType,
    metadata: Record<string, any> = {}
  ): ProcessInfo {
    const instanceId = generateId('proc');
    const parentPid = process.ppid;

    const processInfo: ProcessInfo = {
      pid,
      parentPid,
      instanceId,
      type,
      startTime: Date.now(),
      executionChain: [{
        id: generateId('exec'),
        type: 'spawn',
        timestamp: Date.now(),
        metadata: { initial: true }
      }],
      metadata
    };

    processes.set(pid, processInfo);

    this.logger.logForPid(pid, 'info', 'Process registered', {
      type,
      instanceId,
      parentPid
    });

    return processInfo;
  }

  /**
   * Get process information by PID
   */
  getProcess(pid: number): ProcessInfo | undefined {
    return processes.get(pid);
  }

  /**
   * Update process execution chain
   */
  addExecutionLink(
    pid: number,
    type: 'request' | 'execution' | 'fork' | 'spawn',
    metadata?: Record<string, any>
  ): void {
    const process = processes.get(pid);
    if (!process) {
      throw new PIDContextError(`Process ${pid} not registered`);
    }

    const link: ExecutionLink = {
      id: generateId('link'),
      type,
      timestamp: Date.now(),
      metadata
    };

    process.executionChain.push(link);

    // Keep only last 10 links to prevent memory growth
    if (process.executionChain.length > 10) {
      process.executionChain = process.executionChain.slice(-10);
    }
  }

  /**
   * Create execution context for telemetry
   */
  beginRequest(workflow: string, metadata?: Record<string, any>): TelemetryContext {
    const pid = process.pid;
    const requestId = generateId('req');

    this.addExecutionLink(pid, 'request', {
      workflow,
      requestId,
      ...metadata
    });

    return {
      requestId,
      workflow,
      stage: 'started',
      ...metadata
    };
  }

  /**
   * End execution context
   */
  endRequest(context: TelemetryContext, result?: any): void {
    const pid = process.pid;

    this.addExecutionLink(pid, 'execution', {
      requestId: context.requestId,
      result: result ? 'success' : 'error',
      duration: Date.now() - (context as any).startTime
    });

    this.logger.logForPid(pid, 'info', 'Request completed', {
      requestId: context.requestId,
      workflow: context.workflow,
      result: result ? 'success' : 'error'
    });
  }

  /**
   * Record execution step
   */
  recordExecution(step: string, data: any, context?: TelemetryContext): void {
    const pid = process.pid;

    this.addExecutionLink(pid, 'execution', {
      step,
      data,
      requestId: context?.requestId
    });
  }

  /**
   * Get all registered processes
   */
  getAllProcesses(): ProcessInfo[] {
    return Array.from(processes.values());
  }

  /**
   * Unregister process
   */
  unregisterProcess(pid: number): void {
    const process = processes.get(pid);
    if (process) {
      this.logger.logForPid(pid, 'info', 'Process unregistered', {
        instanceId: process.instanceId,
        uptime: Date.now() - process.startTime
      });
      processes.delete(pid);
    }
  }

  /**
   * Get process tree for a given PID
   */
  getProcessTree(pid: number): ProcessInfo[] {
    const result: ProcessInfo[] = [];
    const visited = new Set<number>();

    const traverse = (currentPid: number) => {
      if (visited.has(currentPid)) return;
      visited.add(currentPid);

      const process = processes.get(currentPid);
      if (process) {
        result.push(process);
        // In a real implementation, you'd traverse child processes
        // For now, we just return the single process
      }
    };

    traverse(pid);
    return result;
  }

  /**
   * Validate PID integrity
   */
  validatePID(pid: number): boolean {
    const process = processes.get(pid);
    if (!process) return false;

    // Check if process is still alive (basic check)
    // Note: In a real implementation, this would check actual process status
    // For now, assume process is alive if registered
    return true;
  }

  /**
   * Get execution chain for a process
   */
  getExecutionChain(pid: number): ExecutionLink[] {
    const process = processes.get(pid);
    return process?.executionChain || [];
  }

  /**
   * Generate secure process token
   */
  generateProcessToken(pid: number): string {
    const process = processes.get(pid);
    if (!process) {
      throw new PIDContextError(`Process ${pid} not registered`);
    }

    const payload = {
      pid,
      instanceId: process.instanceId,
      timestamp: Date.now()
    };

    const hash = rapidHash(JSON.stringify(payload));
    return `${process.instanceId}.${hash.toString(16)}`;
  }

  /**
   * Validate process token
   */
  validateProcessToken(token: string): { pid: number; valid: boolean } {
    try {
      const [instanceId, hashStr] = token.split('.');
      const expectedHash = rapidHash(instanceId + hashStr);

      // Find process by instance ID
      for (const [pid, process] of processes) {
        if (process.instanceId === instanceId) {
          const actualHash = rapidHash(JSON.stringify({
            pid,
            instanceId: process.instanceId,
            timestamp: Date.now() // Approximate timestamp
          }));

          return {
            pid,
            valid: actualHash.toString(16) === hashStr
          };
        }
      }

      return { pid: -1, valid: false };
    } catch {
      return { pid: -1, valid: false };
    }
  }
}

// Initialize the current process
const registry = SecurePIDRegistry.getInstance();
registry.registerProcess(process.pid, 'api-gateway', {
  version: '1.0.0',
  environment: Bun.env.NODE_ENV || 'development'
});

// Export singleton instance
export const PIDContext = SecurePIDRegistry.getInstance();