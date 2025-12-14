/**
 * @fileoverview Shared type definitions for the Bun Systems Dashboard
 * @description TypeScript interfaces and types used across server and client
 */

export interface SystemStatus {
  status: SystemHealthStatusType;
  lastCheck: number;
  metrics: Record<string, unknown>;
}

export interface DashboardMetrics {
  requests: number;
  uptime: number;
  systems: Record<SystemId, SystemStatus>;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'warning' | 'error';
  timestamp: string;
  healthy: number;
  total: number;
  warning: number;
  error: number;
}

export interface ActivityLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

export interface DashboardConfig {
  server: ServerConfig;
  dashboard: DashboardUIConfig;
  api: ApiConfig;
  logging: LoggingConfig;
}

export interface ServerConfig {
  port: number;
  host: string;
  timeout: number;
}

export interface DashboardUIConfig {
  refreshInterval: number;
  maxRetries: number;
  maxConsecutiveErrors: number;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

export interface LoggingConfig {
  maxEntries: number;
  consoleFormat: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export type SystemId = 'textLoader' | 'envSync' | 'socketProxy' | 'workerSystem' | 'tensionEngine' | 'security';

export type LogLevel = 'info' | 'warn' | 'error';

export type SystemHealthStatusType = 'healthy' | 'warning' | 'error' | 'unknown' | 'idle';

export type SystemMetricValue = string | number | boolean | null;

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: unknown;
  timestamp: string;
}

export type WebSocketEventType = 'metrics' | 'health' | 'system-update' | 'error' | 'log';