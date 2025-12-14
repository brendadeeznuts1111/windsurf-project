/**
 * @fileoverview Dashboard context and provider hook
 * @description React context for dashboard state management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { DashboardMetrics, SystemHealthStatus, ActivityLogEntry, LogLevel } from '../../shared/types/dashboard';

interface DashboardContextType {
  metrics: DashboardMetrics | null;
  health: SystemHealthStatus | null;
  activityLog: ActivityLogEntry[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addActivityLog: (level: LogLevel, message: string, data?: unknown) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addActivityLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    const entry: ActivityLogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      ...(data && { data })
    };

    setActivityLog(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50 entries

    // Also log to console with Bun's enhanced formatting
    const logLevel = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
    if (data !== undefined) {
      console[logLevel]('[' + entry.timestamp + '] ' + message, data);
    } else {
      console[logLevel]('[' + entry.timestamp + '] ' + message);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      addActivityLog('info', 'Refreshing dashboard data...');

      // Fetch metrics and health in parallel
      const [metricsResponse, healthResponse] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/health')
      ]);

      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch metrics: ' + metricsResponse.status);
      }

      if (!healthResponse.ok) {
        throw new Error('Failed to fetch health: ' + healthResponse.status);
      }

      const [metricsData, healthData] = await Promise.all([
        metricsResponse.json(),
        healthResponse.json()
      ]);

      setMetrics(metricsData);
      setHealth(healthData);

      addActivityLog('info', 'Dashboard data refreshed successfully', {
        requests: metricsData.requests,
        systems: Object.keys(metricsData.systems || {}).length,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addActivityLog('error', 'Failed to refresh dashboard data', { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);

    return () => clearInterval(interval);
  }, []);

  const value: DashboardContextType = {
    metrics,
    health,
    activityLog,
    isLoading,
    error,
    refreshData,
    addActivityLog
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};