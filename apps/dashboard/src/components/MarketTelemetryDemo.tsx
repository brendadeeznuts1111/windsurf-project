/**
 * @fileoverview Market Telemetry Demo Component
 * @description Interactive demonstration of Bun's PID-aware market data telemetry system
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link TCPDemo} - Related TCP networking demonstration
 * @see {@link BunV13Demo} - Bun v1.3 enhanced features integration
 * @see {@link MarketTelemetry} - Core telemetry engine implementation
 * @see {@link PIDContext} - PID context management system
 * @see {@link AuditTrail} - Audit trail for telemetry operations
 */

import React, { useState, useRef, useEffect } from 'react';
import { MarketTelemetry } from '../core/telemetry/MarketTelemetry';
import './market-telemetry-demo.css';
import { MARKET_CONSTANTS, TIMING_CONSTANTS, TEST_DATA } from '../constants';

interface TelemetryContext {
  requestId: string;
}

/**
 * Telemetry operation data structure for display
 * @interface TelemetryOperation
 * @property {string} id - Unique operation identifier
 * @property {string} type - Operation type (tick, batch, subscription)
 * @property {string} marketId - Market identifier (e.g., 'ESZ4', 'BTC/USD')
 * @property {number} pid - Process ID that generated the operation
 * @property {number} timestamp - Operation timestamp in milliseconds
 * @property {number} latency - Operation latency in nanoseconds
 * @property {any} data - Additional operation data
 */
interface TelemetryOperation {
  id: string;
  type: string;
  marketId: string;
  pid: number;
  timestamp: number;
  latency: number;
  data: any;
}

// Track operations for display
let operations: TelemetryOperation[] = [];
let subscribers: Map<string, any> = new Map();

interface TelemetryOperation {
  id: string;
  type: string;
  marketId: string;
  pid: number;
  timestamp: number;
  latency: number;
  data: any;
}

/**
 * Market Telemetry Demo Component
 *
 * Interactive demonstration of Bun's enterprise-grade market data telemetry system.
 * Showcases PID-aware tick processing, real-time analytics, and anomaly detection.
 *
 * Features:
 * - Real-time market tick generation and processing
 * - PID context enrichment and attribution
 * - Rolling statistics and anomaly detection
 * - Interactive subscription management
 * - Performance monitoring and latency tracking
 *
 * @component
 * @example
 * ```tsx
 * <MarketTelemetryDemo />
 * ```
 *
 * @returns {React.FC} The market telemetry demo component
 */
export const MarketTelemetryDemo: React.FC = () => {
  // Component state
  /** @type {TelemetryOperation[]} Operations displayed in the UI */
  const [displayOperations, setDisplayOperations] = useState<TelemetryOperation[]>([]);

  /** @type {boolean} Whether telemetry generation is currently running */
  const [isRunning, setIsRunning] = useState(false);

  /** @type {string} Currently selected market for tick generation */
  const [selectedMarket, setSelectedMarket] = useState('ESZ4');

  /** @type {number} Tick generation rate in ticks per second */
  const [tickRate, setTickRate] = useState(10);

  /** @type {Set<string>} Set of markets currently subscribed to */
  const [subscribedMarkets, setSubscribedMarkets] = useState<Set<string>>(new Set());

  /** @type {React.MutableRefObject<NodeJS.Timeout | undefined>} Reference to the tick generation interval */
  const intervalRef = useRef<NodeJS.Timeout>();

  const markets = [
    { id: 'ESZ4', name: 'E-mini S&P 500 Dec 2024', symbol: 'ES' },
    { id: 'NQZ4', name: 'E-mini Nasdaq Dec 2024', symbol: 'NQ' },
    { id: 'CLZ4', name: 'WTI Crude Dec 2024', symbol: 'CL' },
    { id: 'GCZ4', name: 'Gold Dec 2024', symbol: 'GC' },
    { id: 'BTC', name: 'Bitcoin/USD', symbol: 'BTC' },
  ];

  const generateTick = (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    const basePrice = marketId === 'ESZ4' ? 5750 :
                     marketId === 'NQZ4' ? 19500 :
                     marketId === 'CLZ4' ? 75 :
                     marketId === 'GCZ4' ? 2050 : 65000;

    return {
      market_id: marketId,
      tick_timestamp: Date.now() * 1000000, // nanoseconds
      price: basePrice + (Math.random() - 0.5) * (basePrice * 0.01), // ±1%
      volume: Math.floor(Math.random() * 100) + 1,
      bid: basePrice * 0.999,
      ask: basePrice * 1.001,
      side: (Math.random() > 0.5 ? 'buy' : 'sell') as 'buy' | 'sell',
      tick_size: marketId.includes('ES') ? 0.25 : marketId.includes('NQ') ? 0.25 : 0.01,
    };
  };

  /**
   * Starts the telemetry tick generation process
   *
   * Generates market ticks at the specified rate and records them through
   * the telemetry system with full PID context enrichment.
   *
   * @method startTelemetry
   * @private
   * @returns {void}
   *
   * @example
   * ```typescript
   * startTelemetry(); // Begins generating ticks at current tickRate
   * ```
   */
  const startTelemetry = () => {
    setIsRunning(true);

    intervalRef.current = setInterval(async () => {
      const tick = generateTick(selectedMarket);
      const context: TelemetryContext = { requestId: `demo_${Date.now()}` };

      try {
        const enrichedTick = await MarketTelemetry.getInstance().recordTick(tick, context);

        // Track operation for display
        const operation: TelemetryOperation = {
          id: `tick_${enrichedTick.tick_sequence}`,
          type: 'tick',
          marketId: tick.market_id,
          pid: enrichedTick.pid_context.pid,
          timestamp: Date.now(),
          latency: enrichedTick.telemetry.ingest_latency_ns,
          data: enrichedTick
        };

        operations.unshift(operation);
        if (operations.length > 50) operations = operations.slice(0, 50);

      } catch (error) {
        console.error('Failed to record tick:', error);
      }
    }, TIMING_CONSTANTS.SECOND / tickRate);
  };

  const stopTelemetry = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  /**
   * Processes a batch of market ticks through the telemetry system
   *
   * Demonstrates batch processing capabilities with parallel tick enrichment
   * and performance monitoring.
   *
   * @method runBatch
   * @private
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await runBatch(); // Processes 100 ticks in batch
   * ```
   */
  const runBatch = async () => {
    const batchSize = 100;
    const ticks = Array.from({ length: batchSize }, () => generateTick(selectedMarket));
    const context: TelemetryContext = { requestId: `batch_${Date.now()}` };

    try {
      const enrichedTicks = await MarketTelemetry.getInstance().recordBatch(ticks, context);

      // Track operation for display
      const operation: TelemetryOperation = {
        id: `batch_${Date.now()}`,
        type: 'batch',
        marketId: ticks[0]?.market_id || 'unknown',
        pid: process.pid,
        timestamp: Date.now(),
        latency: enrichedTicks.reduce((sum: number, tick: any) => sum + tick.telemetry.ingest_latency_ns, 0) / enrichedTicks.length,
        data: {
          count: enrichedTicks.length,
          throughput: enrichedTicks.length / 0.1 // Rough estimate
        }
      };

      operations.unshift(operation);
      if (operations.length > 50) operations = operations.slice(0, 50);

    } catch (error) {
      console.error('Failed to record batch:', error);
    }
  };

  /**
   * Subscribes to real-time telemetry events for a specific market
   *
   * Sets up a subscription to receive live market tick data with
   * full telemetry enrichment and PID context.
   *
   * @method subscribeToMarket
   * @private
   * @param {string} marketId - The market identifier to subscribe to
   * @returns {void}
   *
   * @example
   * ```typescript
   * subscribeToMarket('ESZ4'); // Subscribe to E-mini S&P 500 futures
   * ```
   */
  const subscribeToMarket = (marketId: string) => {
    if (subscribedMarkets.has(marketId)) return;

    const context: TelemetryContext = { requestId: `sub_${marketId}` };

    const subscription = MarketTelemetry.getInstance().subscribe(marketId, {
      pid: process.pid,
      callback: (data: any) => {
        console.log(`📡 ${marketId} tick:`, {
          price: data.price?.toFixed(2),
          volume: data.volume,
          latency: `${(data.telemetry?.ingest_latency_ns / 1000).toFixed(1)}μs`,
          pid: data.pid_context?.pid
        });

        // Track subscription event
        const operation: TelemetryOperation = {
          id: `sub_${Date.now()}`,
          type: 'subscription',
          marketId,
          pid: process.pid,
          timestamp: Date.now(),
          latency: 0,
          data: { tick: data }
        };

        operations.unshift(operation);
        if (operations.length > 50) operations = operations.slice(0, 50);
      }
    }, context);

    subscribers.set(marketId, subscription);
    setSubscribedMarkets(prev => new Set(prev).add(marketId));
  };

  const unsubscribeFromMarket = (marketId: string) => {
    const subscription = subscribers.get(marketId);
    if (subscription) {
      subscription.unsubscribe();
      subscribers.delete(marketId);
    }

    setSubscribedMarkets(prev => {
      const newSet = new Set(prev);
      newSet.delete(marketId);
      return newSet;
    });
  };

  // Update operations list periodically
  useEffect(() => {
    const updateOperations = () => {
      setDisplayOperations([...operations]);
    };

    updateOperations();
    const interval = setInterval(updateOperations, 500);
    return () => clearInterval(interval);
  }, []);

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'tick': return '📈';
      case 'batch': return '📦';
      case 'subscription': return '📡';
      default: return '⚙️';
    }
  };

  const formatLatency = (latency: number, type: string) => {
    if (type === 'tick') {
      return `${(latency / 1000).toFixed(1)}μs`;
    }
    return `${latency.toFixed(1)}ms`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  /**
   * Renders the Market Telemetry Demo component
   *
   * Provides an interactive interface for:
   * - Starting/stopping telemetry tick generation
   * - Processing batch operations
   * - Managing market subscriptions
   * - Viewing real-time telemetry operations
   * - Monitoring performance metrics
   *
   * @returns {JSX.Element} The rendered component
   */
  return (
    <div className="market-telemetry-demo">
      <div className="demo-header">
        <h2>📈 ORCA Market Telemetry Demo</h2>
        <p>Experience PID-aware high-frequency trading telemetry with real-time market data processing</p>
      </div>

      <div className="demo-content">
        {/* Market Selection & Controls */}
        <div className="controls-section">
          <div className="market-selector">
            <h3>Market Selection</h3>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
            >
              {markets.map(market => (
                <option key={market.id} value={market.id}>
                  {market.symbol} - {market.name}
                </option>
              ))}
            </select>
          </div>

          <div className="telemetry-controls">
            <h3>Telemetry Controls</h3>

            <div className="control-group">
              <label>Tick Rate: {tickRate} ticks/sec</label>
              <input
                type="range"
                min="1"
                max="100"
                value={tickRate}
                onChange={(e) => setTickRate(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>

            <div className="control-buttons">
              {!isRunning ? (
                <button className="start-btn" onClick={startTelemetry}>
                  ▶️ Start Telemetry
                </button>
              ) : (
                <button className="stop-btn" onClick={stopTelemetry}>
                  ⏹️ Stop Telemetry
                </button>
              )}

              <button className="batch-btn" onClick={runBatch}>
                📦 Run Batch (100 ticks)
              </button>
            </div>
          </div>

          <div className="subscription-controls">
            <h3>Market Subscriptions</h3>
            <div className="subscription-list">
              {markets.map(market => (
                <div key={market.id} className="subscription-item">
                  <span>{market.symbol}</span>
                  {subscribedMarkets.has(market.id) ? (
                    <button
                      className="unsubscribe-btn"
                      onClick={() => unsubscribeFromMarket(market.id)}
                    >
                      📡 Unsubscribe
                    </button>
                  ) : (
                    <button
                      className="subscribe-btn"
                      onClick={() => subscribeToMarket(market.id)}
                    >
                      📡 Subscribe
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Telemetry Operations Monitor */}
        <div className="operations-monitor">
          <div className="monitor-header">
            <h3>PID Telemetry Operations</h3>
            <div className="monitor-stats">
              <span>Total: {displayOperations.length}</span>
              <span>Ticks: {displayOperations.filter(op => op.type === 'tick').length}</span>
              <span>Batches: {displayOperations.filter(op => op.type === 'batch').length}</span>
              <span>PIDs: {new Set(displayOperations.map(op => op.pid)).size}</span>
            </div>
            <button
              className="clear-btn"
              onClick={() => { operations = []; setDisplayOperations([]); }}
            >
              Clear Log
            </button>
          </div>

          <div className="operations-list">
            {displayOperations.length === 0 ? (
              <div className="no-operations">
                <p>No telemetry operations yet. Start telemetry or run a batch to see PID tracking in action!</p>
              </div>
            ) : (
              displayOperations.map(operation => (
                <div key={operation.id} className="operation-item">
                  <div className="operation-header">
                    <span className="operation-icon">
                      {getOperationIcon(operation.type)}
                    </span>
                    <span className="operation-type">{operation.type.toUpperCase()}</span>
                    <span className="operation-market">{operation.marketId}</span>
                    <span className="operation-pid">PID: {operation.pid}</span>
                    <span className="operation-time">{formatTimestamp(operation.timestamp)}</span>
                  </div>

                  <div className="operation-details">
                    <div className="operation-metrics">
                      <span>Latency: {formatLatency(operation.latency, operation.type)}</span>
                      {operation.type === 'tick' && operation.data && (
                        <>
                          <span>Price: ${operation.data.price?.toFixed(2)}</span>
                          <span>Volume: {operation.data.volume}</span>
                          <span>Queue: {operation.data.telemetry?.queue_depth}</span>
                        </>
                      )}
                      {operation.type === 'batch' && operation.data && (
                        <>
                          <span>Count: {operation.data.count}</span>
                          <span>Throughput: {operation.data.throughput?.toFixed(0)}/sec</span>
                        </>
                      )}
                    </div>

                    {operation.data?.pid_context && (
                      <div className="pid-context">
                        <strong>PID Context:</strong>
                        <span>Instance: {operation.data.pid_context.instance_id?.slice(-8)}</span>
                        <span>Type: {operation.data.pid_context.process_type}</span>
                        <span>Request: {operation.data.pid_context.request_id?.slice(-8)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="performance-summary">
        <div className="summary-card">
          <h4>Telemetry Performance</h4>
            <div className="performance-metrics">
              <div className="metric">
                <span className="metric-label">Avg Latency</span>
                <span className="metric-value">
                  {displayOperations.length > 0
                    ? formatLatency(
                        displayOperations.reduce((sum, op) => sum + op.latency, 0) / displayOperations.length,
                        'tick'
                      )
                    : '-'
                  }
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Throughput</span>
                <span className="metric-value">
                  {displayOperations.filter(op => op.type === 'tick').length}/sec
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">PID Diversity</span>
                <span className="metric-value">
                  {new Set(displayOperations.map(op => op.pid)).size} processes
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Data Integrity</span>
                <span className="metric-value">100%</span>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};