/**
 * @fileoverview Metrics overview component
 * @description Displays key dashboard metrics and health status
 */

import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { formatDuration, formatBytes } from '../../shared/utils';

export const MetricsOverview: React.FC = () => {
  const { metrics, health, isLoading, error } = useDashboard();

  if (isLoading && !metrics) {
    return (
      <div className="metrics-overview loading">
        <div className="loading-spinner">Loading dashboard metrics...</div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="metrics-overview error">
        <div className="error-message">
          <h3>❌ Failed to load metrics</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics || !health) {
    return (
      <div className="metrics-overview no-data">
        <p>No metrics data available</p>
      </div>
    );
  }

  const healthySystems = Object.values(metrics.systems).filter(s => s.status === 'healthy').length;
  const totalSystems = Object.keys(metrics.systems).length;

  return (
    <div className="metrics-overview">
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.requests}</div>
            <div className="metric-label">Total Requests</div>
          </div>
        </div>

        <div className="metric-card primary">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-value">{formatDuration(metrics.uptime)}</div>
            <div className="metric-label">Uptime</div>
          </div>
        </div>

        <div className="metric-card primary">
          <div className="metric-icon">🔧</div>
          <div className="metric-content">
            <div className="metric-value">{healthySystems}/{totalSystems}</div>
            <div className="metric-label">Healthy Systems</div>
          </div>
        </div>

        <div className="metric-card status">
          <div className="metric-icon">
            {health.status === 'healthy' ? '🟢' :
             health.status === 'warning' ? '🟡' : '🔴'}
          </div>
          <div className="metric-content">
            <div className="metric-value">{health.status.toUpperCase()}</div>
            <div className="metric-label">Overall Health</div>
          </div>
        </div>
      </div>

      <div className="health-breakdown">
        <h3>System Health Breakdown</h3>
        <div className="health-stats">
          <div className="health-stat">
            <span className="health-label">Healthy:</span>
            <span className="health-value healthy">{health.healthy}</span>
          </div>
          <div className="health-stat">
            <span className="health-label">Warning:</span>
            <span className="health-value warning">{health.warning}</span>
          </div>
          <div className="health-stat">
            <span className="health-label">Error:</span>
            <span className="health-value error">{health.error}</span>
          </div>
        </div>
      </div>
    </div>
  );
};