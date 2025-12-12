#!/usr/bin/env bun

/**
 * 🎯 Tension Scoring Engine - Core Component
 *
 * Manages tension scoring for the Worker-Spawn Integration System.
 * Provides real-time tension calculation, alerting, and circuit breaker logic.
 */

import { EventEmitter } from 'events';

export interface TensionRule {
  condition: (...args: any[]) => boolean;
  weight: number | ((...args: any[]) => number);
  severity: 'low' | 'medium' | 'high' | 'critical';
  remedy: string;
  alert: string;
}

export interface TensionEvent {
  type: string;
  workerId?: string;
  tension: number;
  severity: TensionRule['severity'];
  message: string;
  remedy: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface TensionConfig {
  rules: Record<string, TensionRule>;
  thresholds: {
    warning: number;
    critical: number;
    circuitBreaker: number;
  };
  monitoring: {
    enabled: boolean;
    intervalMs: number;
    retentionHours: number;
    alertCooldownMs: number;
  };
}

export interface TensionMetrics {
  currentTension: number;
  peakTension: number;
  averageTension: number;
  eventCount: number;
  lastEventTime: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<TensionRule['severity'], number>;
}

/**
 * Tension Scoring Engine
 * Manages tension calculation and alerting for worker-spawn operations
 */
export class TensionScoringEngine extends EventEmitter {
  private config: TensionConfig;
  private metrics: TensionMetrics;
  private eventHistory: TensionEvent[] = [];
  private alertCooldowns: Map<string, number> = new Map();
  private monitoringInterval?: Timer;

  constructor(config: TensionConfig) {
    super();
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize the tension scoring engine
   */
  async initialize(): Promise<void> {
    console.log('🎯 Initializing Tension Scoring Engine');

    if (this.config.monitoring.enabled) {
      this.startMonitoring();
    }

    // Validate configuration
    this.validateConfig();

    console.log('✅ Tension Scoring Engine initialized');
  }

  /**
   * Emit a tension event and update scoring
   */
  emitTension(type: string, tension: number, metadata: Record<string, any> = {}): void {
    const rule = this.config.rules[type];
    if (!rule) {
      console.warn(`⚠️ No tension rule defined for type: ${type}`);
      return;
    }

    // Check if rule condition is met
    const conditionMet = this.evaluateRuleCondition(rule, metadata);
    if (!conditionMet) {
      return; // Rule condition not met, no tension
    }

    // Check alert cooldown
    const cooldownKey = `${type}:${metadata.workerId || 'global'}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey) || 0;
    const now = Date.now();

    if (now - lastAlert < this.config.monitoring.alertCooldownMs) {
      return; // Still in cooldown
    }

    // Calculate actual tension value
    const actualTension = typeof tension === 'number' ? tension : this.getRuleWeight(rule, metadata);

    // Create tension event
    const event: TensionEvent = {
      type,
      workerId: metadata.workerId,
      tension: actualTension,
      severity: rule.severity,
      message: rule.alert,
      remedy: rule.remedy,
      timestamp: now,
      metadata,
    };

    // Update metrics
    this.updateMetrics(event);

    // Store event history
    this.eventHistory.push(event);

    // Clean old events
    this.cleanEventHistory();

    // Update alert cooldown
    this.alertCooldowns.set(cooldownKey, now);

    // Emit event
    this.emit('tension', event);

    // Emit severity-specific events
    this.emit(`tension:${rule.severity}`, event);

    // Log tension event
    this.logTensionEvent(event);
  }

  /**
   * Get current tension metrics
   */
  getMetrics(): TensionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent tension events
   */
  getRecentEvents(limit: number = 50): TensionEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get tension events by worker
   */
  getEventsByWorker(workerId: string): TensionEvent[] {
    return this.eventHistory.filter(event => event.workerId === workerId);
  }

  /**
   * Calculate aggregate tension for a worker
   */
  getWorkerTension(workerId: string, timeWindowMs: number = 300000): number {
    const now = Date.now();
    const recentEvents = this.eventHistory.filter(event =>
      event.workerId === workerId &&
      (now - event.timestamp) <= timeWindowMs
    );

    if (recentEvents.length === 0) return 0;

    // Weight recent events more heavily
    const weightedSum = recentEvents.reduce((sum, event, index) => {
      const age = (now - event.timestamp) / timeWindowMs;
      const recencyWeight = Math.max(0.1, 1 - age); // Recent events weight more
      return sum + (event.tension * recencyWeight);
    }, 0);

    return Math.min(weightedSum / recentEvents.length, 1.0);
  }

  /**
   * Check if tension exceeds thresholds
   */
  checkThresholds(tension: number): {
    warning: boolean;
    critical: boolean;
    circuitBreaker: boolean;
  } {
    return {
      warning: tension >= this.config.thresholds.warning,
      critical: tension >= this.config.thresholds.critical,
      circuitBreaker: tension >= this.config.thresholds.circuitBreaker,
    };
  }

  /**
   * Shutdown the tension engine
   */
  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.removeAllListeners();
    console.log('🛑 Tension Scoring Engine shutdown');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private initializeMetrics(): TensionMetrics {
    return {
      currentTension: 0,
      peakTension: 0,
      averageTension: 0,
      eventCount: 0,
      lastEventTime: 0,
      eventsByType: {},
      eventsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    };
  }

  private validateConfig(): void {
    if (!this.config.rules || Object.keys(this.config.rules).length === 0) {
      throw new Error('Tension rules must be defined');
    }

    for (const [type, rule] of Object.entries(this.config.rules)) {
      if (!rule.condition || typeof rule.condition !== 'function') {
        throw new Error(`Rule ${type} must have a condition function`);
      }

      // Validate weight (can be number or function)
      if (typeof rule.weight === 'number') {
        if (rule.weight < 0 || rule.weight > 1) {
          throw new Error(`Rule ${type} weight must be between 0 and 1`);
        }
      } else if (typeof rule.weight !== 'function') {
        throw new Error(`Rule ${type} weight must be a number or function`);
      }
    }
  }

  private evaluateRuleCondition(rule: TensionRule, metadata: Record<string, any>): boolean {
    try {
      // Extract arguments from metadata based on rule type
      const args = this.extractRuleArguments(rule, metadata);
      return rule.condition(...args);
    } catch (error) {
      console.error(`Error evaluating rule condition: ${error}`);
      return false;
    }
  }

  private extractRuleArguments(rule: TensionRule, metadata: Record<string, any>): any[] {
    // Extract arguments based on the rule type and expected parameters
    const ruleType = Object.keys(this.config.rules).find(key => this.config.rules[key] === rule);

    switch (ruleType) {
      case 'spawn:tool:not_allowed':
        return [metadata.attemptedTool, metadata.allowedTools];

      case 'spawn:execution:timeout':
        return [metadata.killedByTimeout];

      case 'spawn:output:buffer_overflow':
        return [metadata.killedByBuffer];

      case 'spawn:tool:failure_rate':
        return [metadata.failures || 0, metadata.total || 1];

      case 'spawn:execution:slow':
        return [metadata.executionTime || 0];

      case 'spawn:rate:high':
        return [metadata.spawnsPerSecond || 0];

      case 'spawn:resource:memory_high':
        return [metadata.memoryMB || 0];

      case 'spawn:circuit:open':
        return [metadata.failureRate || 0];

      default:
        // For unknown rules, pass all metadata values
        return Object.values(metadata);
    }
  }

  private updateMetrics(event: TensionEvent): void {
    this.metrics.currentTension = event.tension;
    this.metrics.peakTension = Math.max(this.metrics.peakTension, event.tension);
    this.metrics.eventCount++;
    this.metrics.lastEventTime = event.timestamp;

    // Update event counts
    this.metrics.eventsByType[event.type] = (this.metrics.eventsByType[event.type] || 0) + 1;
    this.metrics.eventsBySeverity[event.severity]++;

    // Recalculate average tension
    const totalTension = this.eventHistory.reduce((sum, e) => sum + e.tension, 0) + event.tension;
    this.metrics.averageTension = totalTension / (this.eventHistory.length + 1);
  }

  private getRuleWeight(rule: TensionRule, metadata: Record<string, any>): number {
    if (typeof rule.weight === 'function') {
      const args = this.extractRuleArguments(rule, metadata);
      return rule.weight(...args);
    }
    return rule.weight;
  }

  private cleanEventHistory(): void {
    const retentionMs = this.config.monitoring.retentionHours * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    this.eventHistory = this.eventHistory.filter(event => event.timestamp > cutoffTime);
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.monitoring.intervalMs);
  }

  private performHealthCheck(): void {
    // Emit periodic health metrics
    this.emit('health-check', {
      metrics: this.getMetrics(),
      timestamp: Date.now(),
    });
  }

  private logTensionEvent(event: TensionEvent): void {
    const severityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    }[event.severity];

    const logMessage = `${severityEmoji} TENSION [${event.severity.toUpperCase()}] ${event.type}: ${event.message}`;

    if (event.workerId) {
      console.log(`${logMessage} (Worker: ${event.workerId})`);
    } else {
      console.log(logMessage);
    }

    if (event.tension >= this.config.thresholds.critical) {
      console.log(`   💡 Remedy: ${event.remedy}`);
    }
  }
}

// ============================================================================
// SPAWN-SPECIFIC TENSION RULES
// ============================================================================

/**
 * Pre-defined tension rules for spawn operations
 */
export const SPAWN_TENSION_RULES: Record<string, TensionRule> = {
  // Security violation
  'spawn:tool:not_allowed': {
    condition: (tool: string, allowed: string[]) => !allowed.includes(tool),
    weight: 0.5,
    severity: 'critical',
    remedy: 'Update allowedTools whitelist',
    alert: 'Worker attempted to spawn unauthorized tool',
  },

  // Timeout (tool unresponsive)
  'spawn:execution:timeout': {
    condition: (killedByTimeout: boolean) => killedByTimeout,
    weight: 0.3,
    severity: 'high',
    remedy: 'Increase timeout or optimize tool input',
    alert: 'External tool execution timed out',
  },

  // Buffer overflow (output too large)
  'spawn:output:buffer_overflow': {
    condition: (killedByBuffer: boolean) => killedByBuffer,
    weight: 0.25,
    severity: 'high',
    remedy: 'Reduce input size or increase maxBuffer',
    alert: 'Tool output exceeded buffer limit',
  },

  // Failure rate high (tool unreliable)
  'spawn:tool:failure_rate': {
    condition: (failures: number, total: number) => (failures / total) > 0.1,
    weight: (failures: number, total: number) => 0.2 + Math.max(0, ((failures / total) - 0.1) * 2),
    severity: 'critical',
    remedy: 'Investigate tool reliability or use alternative',
    alert: 'External tool failure rate exceeds 10%',
  },

  // Slow execution (performance degradation)
  'spawn:execution:slow': {
    condition: (ms: number) => ms > 5000,
    weight: (ms: number) => 0.1 + Math.floor(ms / 5000) * 0.05,
    severity: 'medium',
    remedy: 'Profile tool execution',
    alert: 'Tool execution exceeds 5s threshold',
  },

  // Spawn rate too high (potential DoS)
  'spawn:rate:high': {
    condition: (spawnsPerSecond: number) => spawnsPerSecond > 10,
    weight: 0.15,
    severity: 'medium',
    remedy: 'Implement tool result caching',
    alert: 'Worker spawning tools too frequently',
  },

  // Resource exhaustion
  'spawn:resource:memory_high': {
    condition: (memoryMB: number) => memoryMB > 100,
    weight: 0.2,
    severity: 'high',
    remedy: 'Reduce concurrent spawns or increase memory limits',
    alert: 'Spawn operation using excessive memory',
  },

  // Circuit breaker activation
  'spawn:circuit:open': {
    condition: (failureRate: number) => failureRate > 0.5,
    weight: 0.4,
    severity: 'critical',
    remedy: 'Worker disabled due to high failure rate',
    alert: 'Circuit breaker opened - worker temporarily disabled',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a default tension configuration
 */
export function createDefaultTensionConfig(): TensionConfig {
  return {
    rules: SPAWN_TENSION_RULES,
    thresholds: {
      warning: 0.3,
      critical: 0.5,
      circuitBreaker: 0.7,
    },
    monitoring: {
      enabled: true,
      intervalMs: 30000,
      retentionHours: 24,
      alertCooldownMs: 300000,
    },
  };
}

/**
 * Create a tension engine with default spawn rules
 */
export function createSpawnTensionEngine(): TensionScoringEngine {
  return new TensionScoringEngine(createDefaultTensionConfig());
}