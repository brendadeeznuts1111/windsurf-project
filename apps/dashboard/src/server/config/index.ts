/**
 * @fileoverview Server configuration management
 * @description Centralized configuration for the dashboard server
 */

import { DEFAULT_CONFIG } from '../../shared/constants';
import type { DashboardConfig } from '../../shared/types/dashboard';

export class ConfigManager {
  private config: DashboardConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment variables and defaults
   */
  private loadConfig(): DashboardConfig {
    return {
      server: {
        port: parseInt(process.env.DASHBOARD_PORT || DEFAULT_CONFIG.server.port.toString()),
        host: process.env.DASHBOARD_HOST || DEFAULT_CONFIG.server.host,
        timeout: parseInt(process.env.DASHBOARD_TIMEOUT || DEFAULT_CONFIG.server.timeout.toString())
      },
      dashboard: {
        refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_INTERVAL || DEFAULT_CONFIG.dashboard.refreshInterval.toString()),
        maxRetries: parseInt(process.env.DASHBOARD_MAX_RETRIES || DEFAULT_CONFIG.dashboard.maxRetries.toString()),
        maxConsecutiveErrors: parseInt(process.env.DASHBOARD_MAX_CONSECUTIVE_ERRORS || DEFAULT_CONFIG.dashboard.maxConsecutiveErrors.toString())
      },
      api: {
        baseUrl: process.env.API_BASE_URL || DEFAULT_CONFIG.api.baseUrl,
        timeout: parseInt(process.env.API_TIMEOUT || DEFAULT_CONFIG.api.timeout.toString())
      },
      logging: {
        maxEntries: parseInt(process.env.LOG_MAX_ENTRIES || DEFAULT_CONFIG.logging.maxEntries.toString()),
        consoleFormat: process.env.LOG_CONSOLE_FORMAT !== 'false'
      }
    };
  }

  /**
   * Get the current configuration
   */
  getConfig(): DashboardConfig {
    return { ...this.config };
  }

  /**
   * Get server configuration
   */
  getServerConfig() {
    return this.config.server;
  }

  /**
   * Get dashboard configuration
   */
  getDashboardConfig() {
    return this.config.dashboard;
  }

  /**
   * Get API configuration
   */
  getApiConfig() {
    return this.config.api;
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.config.logging;
  }

  /**
   * Update configuration (for runtime changes)
   */
  updateConfig(updates: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.server.port < 1 || this.config.server.port > 65535) {
      errors.push('Server port must be between 1 and 65535');
    }

    if (this.config.dashboard.refreshInterval < 1000) {
      errors.push('Dashboard refresh interval must be at least 1000ms');
    }

    if (this.config.api.timeout < 1000) {
      errors.push('API timeout must be at least 1000ms');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const configManager = new ConfigManager();