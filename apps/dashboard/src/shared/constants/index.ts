/**
 * @fileoverview Shared constants for the Bun Systems Dashboard
 * @description Application-wide constants and configuration defaults
 */

import type { DashboardConfig } from '../types/dashboard';

export const SYSTEM_NAMES = [
  'textLoader',
  'envSync',
  'socketProxy',
  'workerSystem',
  'tensionEngine',
  'security'
] as const;

export const STATUS_COLORS = {
  healthy: '#00ff88',
  warning: '#ffaa00',
  error: '#ff4444',
  unknown: '#666666',
  idle: '#444444'
} as const;

export const LOG_LEVELS = {
  info: 'info',
  warn: 'warn',
  error: 'error'
} as const;

export const DEFAULT_CONFIG: DashboardConfig = {
  server: {
    port: 3000,
    host: 'localhost',
    timeout: 30000
  },
  dashboard: {
    refreshInterval: 30000,
    maxRetries: 3,
    maxConsecutiveErrors: 3
  },
  api: {
    baseUrl: '',
    timeout: 10000
  },
  logging: {
    maxEntries: 50,
    consoleFormat: true
  }
};

export const API_ENDPOINTS = {
  metrics: '/api/metrics',
  health: '/api/health',
  systems: '/api/systems',
  rss: 'https://bun.com/rss.xml'
} as const;

export const UI_CONSTANTS = {
  maxActivityLogEntries: 50,
  refreshIntervals: [5000, 10000, 30000, 60000],
  chartColors: ['#00ff88', '#ffaa00', '#ff4444', '#4299e1', '#ed8936', '#9f7aea']
} as const;