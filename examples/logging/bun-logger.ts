/**
 * Bun Logger - Simple logging utility for examples
 */

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  data?: Record<string, any>;
}

export class BunLogger {
  private logs: LogEntry[] = [];
  private minLevel: LogEntry['level'] = 'info';

  constructor(minLevel: LogEntry['level'] = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private log(level: LogEntry['level'], message: string, data?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data
    };

    this.logs.push(entry);

    // Console output with emoji
    const emoji = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[level];

    console.log(`${emoji} [${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, any>): void {
    this.log('error', message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clear(): void {
    this.logs = [];
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      timeRange: {
        start: this.logs[0]?.timestamp,
        end: this.logs[this.logs.length - 1]?.timestamp
      }
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    return stats;
  }
}

// Default logger instance
export const logger = new BunLogger();