/**
 * @fileoverview Dashboard header component
 * @description Header with navigation tabs and status indicators
 */

import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { formatDuration } from '../../shared/utils';

interface DashboardHeaderProps {
  activeTab: 'overview' | 'systems' | 'rss';
  onTabChange: (tab: 'overview' | 'systems' | 'rss') => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  onTabChange
}) => {
  const { health, metrics, isLoading, refreshData } = useDashboard();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return '#00ff88';
      case 'warning': return '#ffaa00';
      case 'error': return '#ff4444';
      default: return '#666666';
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-main">
        <h1>🚀 Bun Systems Dashboard</h1>
        <div className="header-controls">
          <div className="connection-status">
            {isLoading ? (
              <span style={{ color: '#ffaa00' }}>⏳ Loading...</span>
            ) : health ? (
              <span style={{ color: getStatusColor(health.status) }}>
                {health.status === 'healthy' ? '🟢' :
                 health.status === 'warning' ? '🟡' : '🔴'} {health.status.toUpperCase()}
              </span>
            ) : (
              <span style={{ color: '#666' }}>⚪ Disconnected</span>
            )}
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="refresh-button"
          >
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => onTabChange('overview')}
        >
          📊 Overview
        </button>
        <button
          className={activeTab === 'systems' ? 'active' : ''}
          onClick={() => onTabChange('systems')}
        >
          🔧 Systems
        </button>
        <button
          className={activeTab === 'rss' ? 'active' : ''}
          onClick={() => onTabChange('rss')}
        >
          📰 Bun Updates
        </button>
      </nav>

      {metrics && (
        <div className="header-stats">
          <span>Requests: {metrics.requests}</span>
          <span>Uptime: {formatDuration(metrics.uptime)}</span>
          <span>Systems: {Object.keys(metrics.systems).length}</span>
        </div>
      )}
    </header>
  );
};