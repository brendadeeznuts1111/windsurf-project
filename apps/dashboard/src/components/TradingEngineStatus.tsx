/**
 * @fileoverview Trading Engine Status Component
 * @description Real-time trading engine monitoring and control panel
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect } from 'react';
import './trading-engine.css';

interface TradingEngineData {
  status: string;
  mode: string;
  performance: {
    trades_today: number;
    success_rate: number;
    total_pnl_today: number;
    avg_pnl_per_trade: number;
    best_trade: number;
    worst_trade: number;
    win_streak: number;
    loss_streak: number;
  };
  execution: {
    avg_execution_time_ms: number;
    fastest_execution_ms: number;
    slowest_execution_ms: number;
    success_rate: number;
  };
  opportunities: {
    detected: number;
    executed: number;
    rejected: number;
    pending: number;
  };
  bookmakers: {
    active: number;
    total: number;
    avg_response_time_ms: number;
    reliability_score: number;
  };
  risk_management: {
    max_exposure_per_trade: number;
    max_daily_loss: number;
    position_limits: {
      basketball: number;
      football: number;
      tennis: number;
      baseball: number;
    };
  };
  ai_models: {
    arbitrage_detector: {
      accuracy: number;
      confidence_threshold: number;
      false_positive_rate: string;
    };
    price_predictor: {
      accuracy: number;
      features_used: number;
      training_data_points: number;
    };
  };
}

/**
 * Trading Engine Status Component
 *
 * Displays real-time trading engine metrics, performance data,
 * and provides manual override controls for semi-automated trading.
 *
 * @component
 * @returns {React.FC} Trading engine status dashboard
 */
export const TradingEngineStatus: React.FC = () => {
  const [data, setData] = useState<TradingEngineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTradingData = async () => {
    try {
      const response = await fetch('/api/v1/trading/engine');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const tradingData: TradingEngineData = await response.json();
      setData(tradingData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradingData();

    if (autoRefresh) {
      const interval = setInterval(fetchTradingData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value}%`;
  };

  if (loading) {
    return (
      <div className="trading-engine-status">
        <div className="loading-spinner">Loading trading engine status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trading-engine-status">
        <div className="error-message">
          <h3>⚠️ Connection Error</h3>
          <p>{error}</p>
          <button onClick={fetchTradingData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="trading-engine-status">
        <div className="no-data">No trading data available</div>
      </div>
    );
  }

  return (
    <div className="trading-engine-status">
      <header className="trading-header">
        <div className="header-left">
          <h2>🤖 Trading Engine</h2>
          <div className="status-indicators">
            <span className={`status-badge ${data.status}`}>
              {data.status.toUpperCase()}
            </span>
            <span className="mode-badge">
              {data.mode.replace('-', ' ').toUpperCase()}
            </span>
            <span className="automation-badge">
              75% AUTOMATION
            </span>
          </div>
        </div>
        <div className="header-right">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh
          </label>
          <button onClick={fetchTradingData} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </header>

      <div className="trading-metrics-grid">
        {/* Performance Metrics */}
        <div className="metric-section">
          <h3>📈 Performance Today</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{data.performance.trades_today}</div>
              <div className="metric-label">Trades</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatPercentage(data.performance.success_rate)}</div>
              <div className="metric-label">Success Rate</div>
            </div>
            <div className="metric-card">
              <div className={`metric-value ${data.performance.total_pnl_today >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(data.performance.total_pnl_today)}
              </div>
              <div className="metric-label">Total P&L</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatCurrency(data.performance.avg_pnl_per_trade)}</div>
              <div className="metric-label">Avg P&L/Trade</div>
            </div>
          </div>
        </div>

        {/* Execution Metrics */}
        <div className="metric-section">
          <h3>⚡ Real-time Execution</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{data.execution.avg_execution_time_ms}ms</div>
              <div className="metric-label">Avg Execution</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.execution.fastest_execution_ms}ms</div>
              <div className="metric-label">Fastest</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatPercentage(data.execution.success_rate)}</div>
              <div className="metric-label">Exec Success</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.opportunities.pending}</div>
              <div className="metric-label">Pending</div>
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div className="metric-section">
          <h3>🎯 Opportunities</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{data.opportunities.detected}</div>
              <div className="metric-label">Detected</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.opportunities.executed}</div>
              <div className="metric-label">Executed</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.opportunities.rejected}</div>
              <div className="metric-label">Rejected</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.opportunities.pending}</div>
              <div className="metric-label">Pending</div>
            </div>
          </div>
        </div>

        {/* Bookmakers */}
        <div className="metric-section">
          <h3>🏦 Bookmakers</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{data.bookmakers.active}/{data.bookmakers.total}</div>
              <div className="metric-label">Active</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.bookmakers.avg_response_time_ms}ms</div>
              <div className="metric-label">Avg Response</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatPercentage(data.bookmakers.reliability_score)}</div>
              <div className="metric-label">Reliability</div>
            </div>
          </div>
        </div>

        {/* AI Models */}
        <div className="metric-section">
          <h3>🧠 AI Models</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{formatPercentage(data.ai_models.arbitrage_detector.accuracy)}</div>
              <div className="metric-label">Arb Detector</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatPercentage(data.ai_models.price_predictor.accuracy)}</div>
              <div className="metric-label">Price Predictor</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.ai_models.arbitrage_detector.false_positive_rate}%</div>
              <div className="metric-label">False Positives</div>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="metric-section">
          <h3>⚖️ Risk Management</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{formatCurrency(data.risk_management.max_exposure_per_trade)}</div>
              <div className="metric-label">Max Exposure</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatCurrency(data.risk_management.max_daily_loss)}</div>
              <div className="metric-label">Daily Loss Limit</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.risk_management.position_limits.basketball}</div>
              <div className="metric-label">Basketball Limit</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.risk_management.position_limits.football}</div>
              <div className="metric-label">Football Limit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <h3>🎮 Manual Controls</h3>
        <div className="control-buttons">
          <button className="control-button pause">
            ⏸️ Pause Trading
          </button>
          <button className="control-button resume">
            ▶️ Resume Trading
          </button>
          <button className="control-button emergency-stop">
            🛑 Emergency Stop
          </button>
          <button className="control-button reset-limits">
            🔄 Reset Limits
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingEngineStatus;