#!/usr/bin/env bun

/**
 * 📢 Telegram Alert Generator
 *
 * Generates formatted Telegram alerts for system monitoring, metrics, and events.
 * Supports multiple alert types with customizable formatting and severity levels.
 */

import { BunUUIDGenerator } from '../../utils/bun-uuid';
import { MetricsCollector } from '../../utils/metrics-collector';
import { TensionScoringEngine } from '../../core/tension-scoring/tension-engine';

export interface TelegramAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical' | 'success';
  title: string;
  message: string;
  timestamp: number;
  source: string;
  metadata?: Record<string, any>;
  // Common identifier properties
  propterid?: string;
  crossReferenceId?: string;
  logId?: string;
}

export interface AlertConfig {
  botToken?: string;
  chatId?: string;
  enableEmoji: boolean;
  maxMessageLength: number;
  rateLimitMs: number;
}

export interface AlertTemplate {
  type: TelegramAlert['type'];
  emoji: string;
  prefix: string;
  color: string;
}

export class TelegramAlertGenerator {
  private uuid = new BunUUIDGenerator();
  private metrics = new MetricsCollector();
  private tension = new TensionScoringEngine({
    rules: {},
    thresholds: { warning: 50, critical: 75, circuitBreaker: 90 },
    monitoring: { enabled: true, intervalMs: 5000, retentionHours: 24, alertCooldownMs: 60000 }
  });

  private config: AlertConfig;
  private templates: Record<TelegramAlert['type'], AlertTemplate>;
  private lastAlertTime = 0;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = {
      enableEmoji: true,
      maxMessageLength: 4096,
      rateLimitMs: 1000,
      ...config
    };

    this.templates = {
      info: {
        type: 'info',
        emoji: 'ℹ️',
        prefix: 'ℹ️ *INFO*',
        color: 'blue'
      },
      warning: {
        type: 'warning',
        emoji: '⚠️',
        prefix: '⚠️ *WARNING*',
        color: 'yellow'
      },
      error: {
        type: 'error',
        emoji: '❌',
        prefix: '❌ *ERROR*',
        color: 'red'
      },
      critical: {
        type: 'critical',
        emoji: '🚨',
        prefix: '🚨 *CRITICAL*',
        color: 'red'
      },
      success: {
        type: 'success',
        emoji: '✅',
        prefix: '✅ *SUCCESS*',
        color: 'green'
      }
    };
  }

  /**
   * Generate system health alert
   */
  async generateHealthAlert(): Promise<TelegramAlert> {
    const health = this.tension.getMetrics();
    const systemMetrics = this.metrics.getMetricsSummary();

    let type: TelegramAlert['type'] = 'info';
    let title = 'System Health Report';
    let message = '';

    if (health.currentTension >= 75) {
      type = 'critical';
      title = '🚨 Critical System Alert';
      message = `System tension at ${health.currentTension}% (Critical threshold exceeded)`;
    } else if (health.currentTension >= 50) {
      type = 'warning';
      title = '⚠️ System Warning';
      message = `System tension at ${health.currentTension}% (Warning threshold exceeded)`;
    } else {
      type = 'success';
      title = '✅ System Healthy';
      message = `System operating normally (Tension: ${health.currentTension}%)`;
    }

    message += `\n\n📊 System Metrics:`;
    message += `\n• Events: ${health.eventCount}`;
    message += `\n• Peak Tension: ${health.peakTension}%`;
    message += `\n• Systems Monitored: ${Object.keys(systemMetrics.systems).length}`;

    // Add some system metrics if available
    const systemKeys = Object.keys(systemMetrics.systems);
    if (systemKeys.length > 0) {
      const firstSystem = systemKeys[0];
      const latestMetrics = systemMetrics.systems[firstSystem].latest;
      message += `\n• Latest ${firstSystem}: ${JSON.stringify(latestMetrics).slice(0, 50)}...`;
    }

    return this.createAlert(type, title, message, 'health-monitor', {
      tension: health.currentTension,
      metrics: systemMetrics
    });
  }

  /**
   * Generate performance alert
   */
  async generatePerformanceAlert(operation: string, duration: number, threshold: number): Promise<TelegramAlert> {
    const type: TelegramAlert['type'] = duration > threshold * 2 ? 'critical' :
                                       duration > threshold ? 'warning' : 'info';

    const title = type === 'critical' ? '🐌 Performance Critical' :
                  type === 'warning' ? '⚠️ Performance Warning' : '📊 Performance Report';

    let message = `Operation: ${operation}\nDuration: ${duration.toFixed(2)}ms\nThreshold: ${threshold}ms`;

    if (type === 'critical') {
      message += '\n\n🚨 Performance severely degraded!';
    } else if (type === 'warning') {
      message += '\n\n⚠️ Performance below acceptable levels.';
    }

    return this.createAlert(type, title, message, 'performance-monitor', {
      operation,
      duration,
      threshold
    });
  }

  /**
   * Generate error alert
   */
  generateErrorAlert(error: Error, context?: string): TelegramAlert {
    const type: TelegramAlert['type'] = 'error';
    const title = '❌ System Error';

    let message = `Error: ${error.message}`;
    if (context) {
      message += `\nContext: ${context}`;
    }
    if (error.stack) {
      message += `\n\nStack Trace:\n\`\`\`\n${error.stack.slice(0, 500)}...\n\`\`\``;
    }

    return this.createAlert(type, title, message, 'error-handler', {
      error: error.message,
      context,
      stack: error.stack?.slice(0, 200)
    });
  }

  /**
   * Generate custom alert
   */
  generateCustomAlert(
    type: TelegramAlert['type'],
    title: string,
    message: string,
    source: string,
    metadata?: Record<string, any>
  ): TelegramAlert {
    return this.createAlert(type, title, message, source, metadata);
  }

  /**
   * Generate metrics summary alert
   */
  async generateMetricsSummaryAlert(): Promise<TelegramAlert> {
    const systemMetrics = this.metrics.getMetricsSummary();
    const health = this.tension.getMetrics();

    const title = '📊 Daily Metrics Summary';
    const message = `System Overview:

🏥 Health Status: ${health.currentTension < 30 ? 'Good' : health.currentTension < 70 ? 'Fair' : 'Poor'}
📈 Current Tension: ${health.currentTension}%
📊 Total Events: ${health.eventCount}
🏔️ Peak Tension: ${health.peakTension}%

Performance Metrics:
• Total Operations: ${systemMetrics.performance.total}
• Success Rate: ${systemMetrics.performance.total > 0 ? ((systemMetrics.performance.success / systemMetrics.performance.total) * 100).toFixed(1) : 0}%
• Average Duration: ${systemMetrics.performance.averageDuration.toFixed(2)}ms
• Systems Monitored: ${Object.keys(systemMetrics.systems).length}`;

    return this.createAlert('info', title, message, 'metrics-summary', {
      health,
      metrics: systemMetrics
    });
  }

  /**
   * Format alert for Telegram
   */
  formatForTelegram(alert: TelegramAlert): string {
    const template = this.templates[alert.type];
    const timestamp = new Date(alert.timestamp).toLocaleString();

    let message = '';

    if (this.config.enableEmoji) {
      message += `${template.emoji} `;
    }

    message += `*${alert.title}*\n\n`;
    message += `${alert.message}\n\n`;
    message += `🕒 ${timestamp}\n`;
    message += `🔍 Source: ${alert.source}\n`;
    message += `🆔 ID: ${alert.id.slice(0, 8)}`;

    // Truncate if too long
    if (message.length > this.config.maxMessageLength) {
      message = message.slice(0, this.config.maxMessageLength - 3) + '...';
    }

    return message;
  }

  /**
   * Send alert via Telegram Bot API
   */
  async sendAlert(alert: TelegramAlert): Promise<boolean> {
    if (!this.config.botToken || !this.config.chatId) {
      console.warn('Telegram bot token or chat ID not configured');
      return false;
    }

    // Rate limiting
    const now = Date.now();
    if (now - this.lastAlertTime < this.config.rateLimitMs) {
      console.log('Rate limited, skipping alert');
      return false;
    }
    this.lastAlertTime = now;

    try {
      const message = this.formatForTelegram(alert);
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      console.log(`✅ Alert sent to Telegram: ${alert.title}`);
      return true;
    } catch (error) {
      console.error('Failed to send Telegram alert:', error);
      return false;
    }
  }

  /**
   * Create alert with common identifiers
   */
  private createAlert(
    type: TelegramAlert['type'],
    title: string,
    message: string,
    source: string,
    metadata?: Record<string, any>
  ): TelegramAlert {
    const alert: TelegramAlert = {
      id: this.uuid.generate(),
      type,
      title,
      message,
      timestamp: Date.now(),
      source,
      metadata,
      // Common identifier properties
      propterid: `alert-${type}`,
      logId: `log-telegram-${type}-${this.uuid.generate().slice(0, 8)}`
    };

    return alert;
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    templates: Record<string, AlertTemplate>;
    config: AlertConfig;
    lastAlertTime: number;
  } {
    return {
      templates: this.templates,
      config: this.config,
      lastAlertTime: this.lastAlertTime
    };
  }
}

// Export singleton instance
export const telegramAlertGenerator = new TelegramAlertGenerator();

// Export utility functions
export function createHealthAlert() {
  return telegramAlertGenerator.generateHealthAlert();
}

export function createPerformanceAlert(operation: string, duration: number, threshold: number) {
  return telegramAlertGenerator.generatePerformanceAlert(operation, duration, threshold);
}

export function createErrorAlert(error: Error, context?: string) {
  return telegramAlertGenerator.generateErrorAlert(error, context);
}

export function createCustomAlert(
  type: TelegramAlert['type'],
  title: string,
  message: string,
  source: string,
  metadata?: Record<string, any>
) {
  return telegramAlertGenerator.generateCustomAlert(type, title, message, source, metadata);
}

export function formatAlertForTelegram(alert: TelegramAlert): string {
  return telegramAlertGenerator.formatForTelegram(alert);
}

export function sendAlertToTelegram(alert: TelegramAlert): Promise<boolean> {
  return telegramAlertGenerator.sendAlert(alert);
}