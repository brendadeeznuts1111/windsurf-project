/**
 * @fileoverview Dashboard state management
 * @description Centralized state management for the Bun Systems Dashboard
 */

import type { DashboardMetrics, SystemStatus, SystemId, SystemHealthStatusType } from '../../shared/types/dashboard';
import { SYSTEM_NAMES } from '../../shared/constants';
import { DASHBOARD_CONSTANTS } from '../../constants';

export class DashboardState {
  private startTime = Date.now();
  private metrics: DashboardMetrics;
  private updateInterval: Timer | null = null;

  constructor() {
    this.metrics = {
      requests: 0,
      uptime: 0,
      systems: this.initializeSystems()
    };

    this.startPeriodicUpdates();
  }

  /**
   * Initialize system status objects
   */
  private initializeSystems(): Record<string, SystemStatus> {
    const systems: Record<string, SystemStatus> = {};

    SYSTEM_NAMES.forEach(name => {
      systems[name] = {
        status: 'unknown',
        lastCheck: 0,
        metrics: {}
      };
    });

    return systems;
  }

  /**
   * Start periodic system status updates
   */
  private startPeriodicUpdates(): void {
    // Update every 5 seconds
    this.updateInterval = setInterval(() => {
      this.updateSystemStatuses();
    }, DASHBOARD_CONSTANTS.UPDATE_INTERVAL_MS);

    // Initial update
    this.updateSystemStatuses();
  }

  /**
   * Update all system statuses with mock data
   */
  private updateSystemStatuses(): void {
    const now = Date.now();

    // Update uptime
    this.metrics.uptime = now - this.startTime;

    // Update each system with realistic mock data
    Object.keys(this.metrics.systems).forEach(systemName => {
      this.updateSystemStatus(systemName as SystemId, now);
    });
  }

  /**
   * Update a specific system's status
   */
  private updateSystemStatus(systemName: SystemId, timestamp: number): void {
    const system = this.metrics.systems[systemName];

    // Simulate realistic status updates
    switch (systemName) {
      case 'textLoader':
        system.status = (Math.random() > DASHBOARD_CONSTANTS.TEXT_LOADER_WARNING_PROBABILITY ? 'healthy' : 'warning') as SystemHealthStatusType;
        system.metrics = {
          size: Math.floor(Math.random() * DASHBOARD_CONSTANTS.MAX_FILE_SIZE_BYTES),
          totalSize: Math.floor(Math.random() * DASHBOARD_CONSTANTS.MAX_TOTAL_SIZE_BYTES),
          files: Math.floor(Math.random() * DASHBOARD_CONSTANTS.MAX_FILES_COUNT) + DASHBOARD_CONSTANTS.MIN_FILES_COUNT
        };
        break;

      case 'envSync':
        system.status = (Math.random() > DASHBOARD_CONSTANTS.ENV_SYNC_ERROR_PROBABILITY ? 'healthy' : 'error') as SystemHealthStatusType;
        system.metrics = {
          synchronized: Math.random() > DASHBOARD_CONSTANTS.ENV_SYNC_ISSUE_PROBABILITY,
          issues: Math.floor(Math.random() * DASHBOARD_CONSTANTS.MAX_WARNINGS_COUNT),
          lastSync: new Date(timestamp - Math.random() * DASHBOARD_CONSTANTS.LAST_SYNC_TIME_RANGE_MS).toISOString()
        };
        break;

      case 'socketProxy':
        system.status = (Math.random() > DASHBOARD_CONSTANTS.SOCKET_PROXY_IDLE_PROBABILITY ? 'idle' : 'healthy') as SystemHealthStatusType;
        system.metrics = {
          activeProxies: Math.floor(Math.random() * DASHBOARD_CONSTANTS.MAX_ACTIVE_PROXIES),
          proxyNames: ['proxy-1', 'proxy-2', 'proxy-3'].slice(0, Math.floor(Math.random() * 3) + 1) as unknown
        };
        break;

      case 'workerSystem':
        system.status = Math.random() > DASHBOARD_CONSTANTS.WORKER_SYSTEM_WARNING_PROBABILITY ? 'healthy' : 'warning';
        system.metrics = {
          tensionEvents: Math.floor(Math.random() * DASHBOARD_CONSTANTS.MAX_TENSION_EVENTS),
          currentTension: Math.random() * DASHBOARD_CONSTANTS.MAX_CURRENT_TENSION,
          activeWorkers: Math.floor(Math.random() * DASHBOARD_CONSTANTS.MAX_ACTIVE_WORKERS) + DASHBOARD_CONSTANTS.MIN_ACTIVE_WORKERS
        };
        break;

      case 'tensionEngine':
        system.status = Math.random() > 0.08 ? 'healthy' : 'warning';
        system.metrics = {
          events: Math.floor(Math.random() * 50) + 10,
          currentTension: Math.random() * 0.5,
          peakTension: Math.random() * 0.8,
          alertsTriggered: Math.floor(Math.random() * 3)
        };
        break;

      case 'security':
        system.status = Math.random() > 0.05 ? 'healthy' : 'error';
        system.metrics = {
          validations: Math.floor(Math.random() * 100) + 50,
          blocked: Math.floor(Math.random() * 10),
          warnings: Math.floor(Math.random() * 5),
          lastScan: new Date(timestamp - Math.random() * 600000).toISOString()
        };
        break;
    }

    system.lastCheck = timestamp;
  }

  /**
   * Get current metrics
   */
  getMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  /**
   * Get health summary
   */
  getHealthSummary(): { healthy: number; total: number; warning: number; error: number; overall: SystemHealthStatusType } {
    const systems = Object.values(this.metrics.systems);
    const healthy = systems.filter(s => s.status === 'healthy').length;
    const warning = systems.filter(s => s.status === 'warning').length;
    const error = systems.filter(s => s.status === 'error').length;
    const total = systems.length;

    let overall: SystemHealthStatusType = 'healthy';
    if (error > 0) overall = 'error';
    else if (warning > 0) overall = 'warning';

    return { healthy, total, warning, error, overall };
  }

  /**
   * Increment request counter
   */
  incrementRequests(): void {
    this.metrics.requests++;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}