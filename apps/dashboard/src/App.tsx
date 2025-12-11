/**
 * @fileoverview Main Application Component
 * @description Central dashboard application with comprehensive Bun API demonstrations
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link FetchDemo} - HTTP networking and API testing
 * @see {@link TCPDemo} - TCP networking with connection management
 * @see {@link BunV13Demo} - Bun v1.3 enhanced features
 * @see {@link MarketTelemetryDemo} - PID-aware market data telemetry
 * @see {@link PIDFileSystemDemo} - Process-aware file operations
 * @see {@link BunFileAPIDocs} - Complete file I/O API reference
 * @see {@link OddsWebSocketClient} - Real-time WebSocket connections
 * @see {@link ArbitrageTable} - Arbitrage opportunity detection
 * @see {@link MarketDataChart} - Market data visualization
 * @see {@link SharpDetectionPanel} - Sharp money detection
 * @see {@link PerformanceMetrics} - System performance monitoring
 */

import React, { useState, useEffect } from 'react';
import { OddsWebSocketClient } from './components/OddsWebSocketClient';
import { ArbitrageTable } from './components/ArbitrageTable';
import { MarketDataChart } from './components/MarketDataChart';
import { SharpDetectionPanel } from './components/SharpDetectionPanel';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import BunV13Demo from './components/BunV13Demo';
import { FetchDemo } from './components/FetchDemo';
import { BunFileAPIDocs } from './components/BunFileAPIDocs';
import { PIDFileSystemDemo } from './components/PIDFileSystemDemo';
import { MarketTelemetryDemo } from './components/MarketTelemetryDemo';
import { TCPDemo } from './components/TCPDemo';
import BunV13Demo from './components/BunV13Demo';
import { CrossReferenceGuide } from './components/CrossReferenceGuide';
import SQLDemo from './components/SQLDemo';
import AdvancedSQLDemo from './components/AdvancedSQLDemo';
import NodeCompatDemo from './components/NodeCompatDemo';
import './App.css';

/**
 * Main Application Component
 *
 * Central dashboard providing comprehensive demonstrations of Bun's runtime capabilities
 * including networking, file I/O, telemetry, and advanced features.
 *
 * Features:
 * - Multi-tab interface for different Bun API demonstrations
 * - Real-time WebSocket connection status
 * - Comprehensive Bun v1.3 feature showcase
 * - Enterprise-grade telemetry and monitoring
 * - Interactive networking and file system demos
 *
 * @component
 * @returns {React.FC} The main application component
 */
function App() {
  // Component state
  /** @type {boolean} WebSocket connection status */
  const [isConnected, setIsConnected] = useState(false);

  /** @type {string} Currently active tab identifier */
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Odds Protocol Dashboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'arbitrage' ? 'active' : ''}
          onClick={() => setActiveTab('arbitrage')}
        >
          Arbitrage
        </button>
        <button
          className={activeTab === 'market-data' ? 'active' : ''}
          onClick={() => setActiveTab('market-data')}
        >
          Market Data
        </button>
        <button
          className={activeTab === 'sharp-detection' ? 'active' : ''}
          onClick={() => setActiveTab('sharp-detection')}
        >
          Sharp Detection
        </button>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={activeTab === 'bun-v13' ? 'active' : ''}
          onClick={() => setActiveTab('bun-v13')}
        >
          Bun v1.3 CSS
        </button>
        <button
          className={activeTab === 'bun-fetch' ? 'active' : ''}
          onClick={() => setActiveTab('bun-fetch')}
        >
          Bun Fetch API
        </button>
        <button
          className={activeTab === 'bun-file-api' ? 'active' : ''}
          onClick={() => setActiveTab('bun-file-api')}
        >
          Bun File I/O
        </button>
        <button
          className={activeTab === 'pid-file-system' ? 'active' : ''}
          onClick={() => setActiveTab('pid-file-system')}
        >
          PID File System
        </button>
        <button
          className={activeTab === 'market-telemetry' ? 'active' : ''}
          onClick={() => setActiveTab('market-telemetry')}
        >
          Market Telemetry
        </button>
        <button
          className={activeTab === 'tcp-demo' ? 'active' : ''}
          onClick={() => setActiveTab('tcp-demo')}
        >
          TCP API Demo
        </button>
        <button
          className={activeTab === 'bun-v13-enhanced' ? 'active' : ''}
          onClick={() => setActiveTab('bun-v13-enhanced')}
        >
          Bun v1.3 Enhanced
        </button>
        <button
          className={activeTab === 'cross-reference' ? 'active' : ''}
          onClick={() => setActiveTab('cross-reference')}
        >
          Cross-Reference Guide
        </button>
        <button
          className={activeTab === 'sql-demo' ? 'active' : ''}
          onClick={() => setActiveTab('sql-demo')}
        >
          Bun SQL API
        </button>
        <button
          className={activeTab === 'advanced-sql-demo' ? 'active' : ''}
          onClick={() => setActiveTab('advanced-sql-demo')}
        >
          Advanced SQL Features
        </button>
        <button
          className={activeTab === 'node-compat-demo' ? 'active' : ''}
          onClick={() => setActiveTab('node-compat-demo')}
        >
          Node.js Compatibility
        </button>
      </nav>

      <main className="app-main">
        <OddsWebSocketClient onConnectionChange={setIsConnected} />

        {activeTab === 'overview' && (
          <div className="overview-panel">
            <h2>System Overview</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>WebSocket Status</h3>
                <p>{isConnected ? 'Connected' : 'Disconnected'}</p>
              </div>
              <div className="metric-card">
                <h3>Active Opportunities</h3>
                <p>0</p>
              </div>
              <div className="metric-card">
                <h3>Messages/sec</h3>
                <p>0</p>
              </div>
              <div className="metric-card">
                <h3>Latency</h3>
                <p>0ms</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'arbitrage' && <ArbitrageTable />}
        {activeTab === 'market-data' && <MarketDataChart />}
        {activeTab === 'sharp-detection' && <SharpDetectionPanel />}
        {activeTab === 'performance' && <PerformanceMetrics />}
        {activeTab === 'bun-v13' && <BunV13Demo />}
        {activeTab === 'bun-fetch' && <FetchDemo />}
        {activeTab === 'bun-file-api' && <BunFileAPIDocs />}
        {activeTab === 'pid-file-system' && <PIDFileSystemDemo />}
        {activeTab === 'market-telemetry' && <MarketTelemetryDemo />}
        {activeTab === 'tcp-demo' && <TCPDemo />}
        {activeTab === 'bun-v13-enhanced' && <BunV13Demo />}
        {activeTab === 'cross-reference' && <CrossReferenceGuide />}
        {activeTab === 'sql-demo' && <SQLDemo />}
        {activeTab === 'advanced-sql-demo' && <AdvancedSQLDemo />}
        {activeTab === 'node-compat-demo' && <NodeCompatDemo />}
      </main>
    </div>
  );
}

export default App;
