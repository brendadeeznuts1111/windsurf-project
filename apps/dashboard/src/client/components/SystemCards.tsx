/**
 * @fileoverview System cards component
 * @description Displays system status cards with detailed information
 */

import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { formatSystemName, formatTimeAgo, formatBytes } from '../../shared/utils';
import type { SystemStatus } from '../../shared/types/dashboard';

interface SystemCardProps {
  systemName: string;
  system: SystemStatus;
  detailed?: boolean;
}

const SystemCard: React.FC<SystemCardProps> = ({ systemName, system, detailed = false }) => {
  const formatMetricValue = (key: string, value: any): string => {
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('size') || key.toLowerCase().includes('bytes')) {
        return formatBytes(value);
      }
      if (key.toLowerCase().includes('time') || key.toLowerCase().includes('duration')) {
        return formatTimeAgo(value);
      }
      return value.toString();
    }
    return String(value);
  };

  return (
    <div className={`system-card status-${system.status}`}>
      <div className="system-header">
        <h3>
          <span className="system-icon">
            {systemName === 'textLoader' ? '📄' :
             systemName === 'envSync' ? '🔄' :
             systemName === 'socketProxy' ? '🔗' :
             systemName === 'workerSystem' ? '👷' :
             systemName === 'tensionEngine' ? '📊' :
             systemName === 'security' ? '🔒' : '⚙️'}
          </span>
          {formatSystemName(systemName)}
        </h3>
        <div className={`status-badge status-${system.status}`}>
          {system.status.toUpperCase()}
        </div>
      </div>

      <div className="system-meta">
        <span className="last-check">Last check: {formatTimeAgo(system.lastCheck)}</span>
      </div>

      {detailed && Object.keys(system.metrics).length > 0 && (
        <div className="system-metrics">
          {Object.entries(system.metrics).map(([key, value]) => (
            <div key={key} className="metric-item">
              <span className="metric-key">{formatSystemName(key)}:</span>
              <span className="metric-value">{formatMetricValue(key, value)}</span>
            </div>
          ))}
        </div>
      )}

      {!detailed && (
        <div className="system-summary">
          <div className="metric-count">
            {Object.keys(system.metrics).length} metrics
          </div>
        </div>
      )}
    </div>
  );
};

interface SystemCardsProps {
  detailed?: boolean;
}

export const SystemCards: React.FC<SystemCardsProps> = ({ detailed = false }) => {
  const { metrics, isLoading, error } = useDashboard();

  if (isLoading && !metrics) {
    return (
      <div className="system-cards loading">
        <div className="loading-spinner">Loading system status...</div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="system-cards error">
        <div className="error-message">
          <h3>❌ Failed to load systems</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="system-cards no-data">
        <p>No system data available</p>
      </div>
    );
  }

  const systemEntries = Object.entries(metrics.systems);

  return (
    <div className="system-cards">
      <div className="cards-header">
        <h2>System Status</h2>
        <div className="systems-count">
          {systemEntries.length} systems monitored
        </div>
      </div>

      <div className={`cards-grid ${detailed ? 'detailed' : 'overview'}`}>
        {systemEntries.map(([systemName, system]) => (
          <SystemCard
            key={systemName}
            systemName={systemName}
            system={system}
            detailed={detailed}
          />
        ))}
      </div>
    </div>
  );
};