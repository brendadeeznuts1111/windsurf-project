#!/usr/bin/env bun

/**
 * 📊 Bun Systems Dashboard - Real-time Monitoring
 *
 * Web dashboard for monitoring all Bun advanced features systems:
 * - Text file loading metrics
 * - Environment synchronization status
 * - Unix socket proxy connections
 * - Worker system health
 * - Tension monitoring
 * - Security audit logs
 */

import { serve } from 'bun';
import { BunTextLoader } from './src/utils/bun-text-loader';
import { BunEnvSynchronizer } from './src/utils/bun-env-synchronizer';
import { BunUnixSocketProxy, BunSocketManager } from './src/utils/bun-unix-socket-proxy';
import { TensionScoringEngine } from './src/core/tension-scoring/tension-engine';
import { createSecurityValidator } from './src/security/spawn-validator';

// ============================================================================
// DASHBOARD STATE MANAGEMENT
// ============================================================================

class DashboardState {
  private startTime = Date.now();
  private metrics = {
    requests: 0,
    uptime: 0,
    systems: {
      textLoader: { status: 'unknown', lastCheck: 0, metrics: {} },
      envSync: { status: 'unknown', lastCheck: 0, metrics: {} },
      socketProxy: { status: 'unknown', lastCheck: 0, metrics: {} },
      workerSystem: { status: 'unknown', lastCheck: 0, metrics: {} },
      tensionEngine: { status: 'unknown', lastCheck: 0, metrics: {} },
      security: { status: 'unknown', lastCheck: 0, metrics: {} },
    }
  };

  // System instances
  private textLoader = BunTextLoader;
  private envSync = new BunEnvSynchronizer();
  private tensionEngine = new TensionScoringEngine({
    rules: {},
    thresholds: { warning: 0.3, critical: 0.5, circuitBreaker: 0.7 },
    monitoring: { enabled: false, intervalMs: 30000, retentionHours: 24, alertCooldownMs: 300000 },
  });

  constructor() {
    this.startPeriodicUpdates();
  }

  /**
   * Get current dashboard metrics
   */
  getMetrics() {
    this.metrics.uptime = Date.now() - this.startTime;
    return { ...this.metrics };
  }

  /**
   * Update system status
   */
  private async updateSystemStatus() {
    const now = Date.now();

    // Text Loader status
    try {
      const stats = BunTextLoader.getCacheStats();
      this.metrics.systems.textLoader = {
        status: 'healthy',
        lastCheck: now,
        metrics: stats
      };
    } catch (error) {
      this.metrics.systems.textLoader = {
        status: 'error',
        lastCheck: now,
        metrics: { error: (error as Error).message }
      };
    }

    // Environment Sync status
    try {
      const validation = this.envSync.validate();
      this.metrics.systems.envSync = {
        status: validation.isValid ? 'healthy' : 'warning',
        lastCheck: now,
        metrics: { synchronized: validation.isValid, issues: validation.issues.length }
      };
    } catch (error) {
      this.metrics.systems.envSync = {
        status: 'error',
        lastCheck: now,
        metrics: { error: (error as Error).message }
      };
    }

    // Socket Proxy status
    try {
      const proxies = BunSocketManager.getActiveProxies();
      this.metrics.systems.socketProxy = {
        status: proxies.length > 0 ? 'healthy' : 'idle',
        lastCheck: now,
        metrics: { activeProxies: proxies.length, proxyNames: proxies }
      };
    } catch (error) {
      this.metrics.systems.socketProxy = {
        status: 'error',
        lastCheck: now,
        metrics: { error: (error as Error).message }
      };
    }

    // Worker System status
    try {
      const tensionMetrics = this.tensionEngine.getMetrics();
      this.metrics.systems.workerSystem = {
        status: 'healthy',
        lastCheck: now,
        metrics: {
          tensionEvents: tensionMetrics.eventCount,
          currentTension: tensionMetrics.currentTension
        }
      };
    } catch (error) {
      this.metrics.systems.workerSystem = {
        status: 'error',
        lastCheck: now,
        metrics: { error: (error as Error).message }
      };
    }

    // Tension Engine status
    try {
      const metrics = this.tensionEngine.getMetrics();
      this.metrics.systems.tensionEngine = {
        status: 'healthy',
        lastCheck: now,
        metrics: {
          events: metrics.eventCount,
          currentTension: metrics.currentTension.toFixed(3),
          peakTension: metrics.peakTension.toFixed(3)
        }
      };
    } catch (error) {
      this.metrics.systems.tensionEngine = {
        status: 'error',
        lastCheck: now,
        metrics: { error: (error as Error).message }
      };
    }

    // Security status
    try {
      const securityMetrics = createSecurityValidator().getSecurityMetrics();
      this.metrics.systems.security = {
        status: securityMetrics.blockedSpawns > 0 ? 'warning' : 'healthy',
        lastCheck: now,
        metrics: {
          validations: securityMetrics.totalValidations,
          blocked: securityMetrics.blockedSpawns,
          warnings: securityMetrics.warningsCount
        }
      };
    } catch (error) {
      this.metrics.systems.security = {
        status: 'error',
        lastCheck: now,
        metrics: { error: (error as Error).message }
      };
    }
  }

  /**
   * Start periodic status updates
   */
  private startPeriodicUpdates() {
    setInterval(() => {
      this.updateSystemStatus();
    }, 5000); // Update every 5 seconds

    // Initial update
    this.updateSystemStatus();
  }

  /**
   * Get system health summary
   */
  getHealthSummary() {
    const systems = this.metrics.systems;
    const healthy = Object.values(systems).filter(s => s.status === 'healthy').length;
    const warning = Object.values(systems).filter(s => s.status === 'warning').length;
    const error = Object.values(systems).filter(s => s.status === 'error').length;
    const total = Object.keys(systems).length;

    return {
      healthy,
      warning,
      error,
      total,
      overall: error > 0 ? 'error' : warning > 0 ? 'warning' : 'healthy'
    };
  }
}

// ============================================================================
// DASHBOARD SERVER
// ============================================================================

/**
 * Create the dashboard server
 */
function createDashboardServer(state: DashboardState) {
  return serve({
    port: 0, // Random port
    async fetch(req) {
      const url = new URL(req.url);

      // Increment request counter
      state.getMetrics().requests++;

      // API endpoints
      if (url.pathname === '/api/metrics') {
        return Response.json(state.getMetrics());
      }

      if (url.pathname === '/api/health') {
        return Response.json(state.getHealthSummary());
      }

      if (url.pathname === '/api/systems') {
        return Response.json(state.getMetrics().systems);
      }

      // Main dashboard page
      if (url.pathname === '/' || url.pathname === '/dashboard') {
        return new Response(getDashboardHTML(state), {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // Static assets
      if (url.pathname === '/style.css') {
        return new Response(getDashboardCSS(), {
          headers: { 'Content-Type': 'text/css' }
        });
      }

      if (url.pathname === '/script.js') {
        return new Response(getDashboardJS(), {
          headers: { 'Content-Type': 'application/javascript' }
        });
      }

      return new Response('Not Found', { status: 404 });
    }
  });
}

// ============================================================================
// DASHBOARD HTML
// ============================================================================

function getDashboardHTML(state: DashboardState): string {
  const metrics = state.getMetrics();
  const health = state.getHealthSummary();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bun Systems Dashboard</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div class="dashboard">
        <header class="dashboard-header">
            <h1>🚀 Bun Systems Dashboard</h1>
            <div class="status-indicator status-${health.overall}">
                ${health.overall.toUpperCase()}
            </div>
        </header>

        <div class="metrics-overview">
            <div class="metric-card">
                <h3>📊 Requests</h3>
                <div class="metric-value">${metrics.requests}</div>
            </div>
            <div class="metric-card">
                <h3>⏱️ Uptime</h3>
                <div class="metric-value">${formatDuration(metrics.uptime)}</div>
            </div>
            <div class="metric-card">
                <h3>💚 Healthy Systems</h3>
                <div class="metric-value">${health.healthy}/${health.total}</div>
            </div>
            <div class="metric-card">
                <h3>⚠️ Warnings</h3>
                <div class="metric-value">${health.warning}</div>
            </div>
        </div>

        <div class="systems-grid">
            ${Object.entries(metrics.systems).map(([name, system]) =>
              getSystemCardHTML(name, system)
            ).join('')}
        </div>

        <div class="actions">
            <button onclick="refreshData()">🔄 Refresh</button>
            <button onclick="clearCache()">🗑️ Clear Cache</button>
            <button onclick="runHealthCheck()">🏥 Health Check</button>
        </div>

        <div class="logs">
            <h3>📋 Recent Activity</h3>
            <div id="activity-log" class="activity-log">
                <!-- Activity log will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <script src="/script.js"></script>
</body>
</html>`;
}

function getSystemCardHTML(name: string, system: any): string {
  const statusClass = `status-${system.status}`;
  const lastCheck = formatTimeAgo(system.lastCheck);

  return `
    <div class="system-card ${statusClass}">
        <h4>${getSystemIcon(name)} ${formatSystemName(name)}</h4>
        <div class="system-status">
            <span class="status-badge ${statusClass}">${system.status}</span>
            <span class="last-check">${lastCheck}</span>
        </div>
        <div class="system-metrics">
            ${Object.entries(system.metrics).map(([key, value]) =>
              `<div class="metric">${formatMetricKey(key)}: ${value}</div>`
            ).join('')}
        </div>
    </div>
  `;
}

function getSystemIcon(name: string): string {
  const icons: Record<string, string> = {
    textLoader: '📄',
    envSync: '🔄',
    socketProxy: '🔗',
    workerSystem: '👷',
    tensionEngine: '📊',
    security: '🔒'
  };
  return icons[name] || '⚙️';
}

function formatSystemName(name: string): string {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function formatMetricKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// ============================================================================
// DASHBOARD CSS
// ============================================================================

function getDashboardCSS(): string {
  return `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #0f0f23;
        color: #ffffff;
        line-height: 1.6;
    }

    .dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #333;
    }

    .dashboard-header h1 {
        color: #00ff88;
    }

    .status-indicator {
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 14px;
    }

    .status-healthy { background: #00ff88; color: #000; }
    .status-warning { background: #ffaa00; color: #000; }
    .status-error { background: #ff4444; color: #000; }
    .status-unknown { background: #666; color: #fff; }
    .status-idle { background: #444; color: #fff; }

    .metrics-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }

    .metric-card {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #333;
    }

    .metric-card h3 {
        color: #00ff88;
        margin-bottom: 10px;
    }

    .metric-value {
        font-size: 2em;
        font-weight: bold;
        color: #ffffff;
    }

    .systems-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }

    .system-card {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #333;
    }

    .system-card h4 {
        color: #00ff88;
        margin-bottom: 10px;
    }

    .system-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
    }

    .last-check {
        font-size: 12px;
        color: #888;
    }

    .system-metrics {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .system-metrics .metric {
        font-size: 14px;
        color: #ccc;
    }

    .actions {
        display: flex;
        gap: 10px;
        margin-bottom: 30px;
    }

    .actions button {
        background: #333;
        color: #fff;
        border: 1px solid #555;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .actions button:hover {
        background: #555;
    }

    .logs {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #333;
    }

    .logs h3 {
        color: #00ff88;
        margin-bottom: 15px;
    }

    .activity-log {
        max-height: 300px;
        overflow-y: auto;
        font-family: monospace;
        font-size: 14px;
        background: #000;
        padding: 10px;
        border-radius: 4px;
    }

    .log-entry {
        margin-bottom: 5px;
        padding: 2px 0;
    }

    .log-timestamp { color: #666; }
    .log-level-info { color: #00ff88; }
    .log-level-warn { color: #ffaa00; }
    .log-level-error { color: #ff4444; }
  `;
}

// ============================================================================
// DASHBOARD JAVASCRIPT
// ============================================================================

function getDashboardJS(): string {
  return `
    let activityLog = [];

    function addToActivityLog(level, message) {
        const timestamp = new Date().toLocaleTimeString();
        activityLog.unshift({ timestamp, level, message });

        // Keep only last 50 entries
        if (activityLog.length > 50) {
            activityLog = activityLog.slice(0, 50);
        }

        updateActivityLog();
    }

    function updateActivityLog() {
        const logElement = document.getElementById('activity-log');
        logElement.innerHTML = activityLog.map(entry =>
            \`<div class="log-entry">
                <span class="log-timestamp">[\${entry.timestamp}]</span>
                <span class="log-level-\${entry.level}">[\${entry.level.toUpperCase()}]</span>
                \${entry.message}
            </div>\`
        ).join('');
    }

    async function refreshData() {
        addToActivityLog('info', 'Refreshing dashboard data...');

        try {
            const response = await fetch('/api/metrics');
            const data = await response.json();

            // Update metrics overview
            updateMetricsOverview(data);

            // Update system cards
            updateSystemCards(data.systems);

            addToActivityLog('info', 'Dashboard data refreshed');
        } catch (error) {
            addToActivityLog('error', \`Failed to refresh data: \${error.message}\`);
        }
    }

    function updateMetricsOverview(data) {
        // Update request count
        const requestElement = document.querySelector('.metric-card:nth-child(1) .metric-value');
        if (requestElement) requestElement.textContent = data.requests;

        // Update uptime
        const uptimeElement = document.querySelector('.metric-card:nth-child(2) .metric-value');
        if (uptimeElement) uptimeElement.textContent = formatDuration(data.uptime);
    }

    function updateSystemCards(systems) {
        Object.entries(systems).forEach(([name, system]) => {
            const card = document.querySelector(\`.system-card:has(h4:contains("\${formatSystemName(name)}"))\`);
            if (card) {
                // Update status
                const statusBadge = card.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = \`status-badge status-\${system.status}\`;
                    statusBadge.textContent = system.status;
                }

                // Update last check
                const lastCheck = card.querySelector('.last-check');
                if (lastCheck) {
                    lastCheck.textContent = formatTimeAgo(system.lastCheck);
                }

                // Update metrics
                const metricsContainer = card.querySelector('.system-metrics');
                if (metricsContainer) {
                    metricsContainer.innerHTML = Object.entries(system.metrics)
                        .map(([key, value]) => \`<div class="metric">\${formatMetricKey(key)}: \${value}</div>\`)
                        .join('');
                }
            }
        });
    }

    async function clearCache() {
        addToActivityLog('info', 'Clearing text loader cache...');

        try {
            // This would need a backend endpoint to actually clear cache
            addToActivityLog('info', 'Cache cleared (simulated)');
        } catch (error) {
            addToActivityLog('error', \`Failed to clear cache: \${error.message}\`);
        }
    }

    async function runHealthCheck() {
        addToActivityLog('info', 'Running health check...');

        try {
            const response = await fetch('/api/health');
            const health = await response.json();

            addToActivityLog('info',
                \`Health check: \${health.healthy}/\${health.total} healthy, \${health.warning} warnings, \${health.error} errors\`
            );
        } catch (error) {
            addToActivityLog('error', \`Health check failed: \${error.message}\`);
        }
    }

    // Utility functions
    function formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return \`\${hours}h \${minutes % 60}m\`;
        if (minutes > 0) return \`\${minutes}m \${seconds % 60}s\`;
        return \`\${seconds}s\`;
    }

    function formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);

        if (seconds < 60) return \`\${seconds}s ago\`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return \`\${minutes}m ago\`;
        const hours = Math.floor(minutes / 60);
        return \`\${hours}h ago\`;
    }

    function formatSystemName(name) {
        return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    function formatMetricKey(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        addToActivityLog('info', 'Dashboard initialized');
        refreshData();

        // Auto-refresh every 30 seconds
        setInterval(refreshData, 30000);
    });
  `;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

/**
 * Start the dashboard server
 */
export async function startDashboard(): Promise<{ server: any; port: number; url: string }> {
  console.log('📊 Starting Bun Systems Dashboard...');

  const state = new DashboardState();
  const server = createDashboardServer(state);

  console.log(`✅ Dashboard running at: http://localhost:${server.port}`);
  console.log(`   📊 Metrics API: http://localhost:${server.port}/api/metrics`);
  console.log(`   💚 Health API: http://localhost:${server.port}/api/health`);
  console.log(`   🔧 Systems API: http://localhost:${server.port}/api/systems`);

  return {
    server,
    port: server.port || 3000,
    url: `http://localhost:${server.port || 3000}`
  };
}

// Run if called directly
if (import.meta.main) {
  startDashboard().catch(error => {
    console.error('❌ Failed to start dashboard:', error);
    process.exit(1);
  });
}