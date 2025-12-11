/**
 * @fileoverview Telemetry Type Definitions
 * @description Comprehensive type definitions for market telemetry system
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link MarketTelemetry} - Uses these types for telemetry operations
 * @see {@link RollingStatEngine} - Processes statistical data types
 * @see {@link AuditTrail} - Uses audit entry types
 * @see {@link MarketTick} - Raw market data structure
 * @see {@link EnrichedMarketTick} - Enhanced market data with telemetry
 * @see {@link HFTMetrics} - High-frequency trading performance metrics
 */

/**
 * [CORE][TELEMETRY][TYPES][META:{singleton,types}][TelemetryTypes][#REF:MarketTick,EnrichedMarketTick,HFTMetrics]
 *
 * Comprehensive type definitions for market telemetry system
 * All types are designed for high-frequency trading environments
 */

export interface TelemetryConfig {
  precision: 'millisecond' | 'microsecond' | 'nanosecond';
  bufferSize: number;
  flushInterval: number;
  enableHFTMetrics: boolean;
  enableMicrostructure: boolean;
  persistence: 'memory' | 'disk' | 'hybrid';
  compression: 'none' | 'gzip' | 'lz4';
  enableHMAC: boolean;
  timeWindowNs: number;
  latencyThresholdNs: number;
}

export interface TelemetryContext {
  requestId: string;
  workflow?: string;
  stage?: string;
  [key: string]: any;
}

export interface MarketTick {
  market_id: string;
  tick_timestamp: number; // nanoseconds
  price?: number;
  volume?: number;
  bid?: number;
  ask?: number;
  side?: 'buy' | 'sell';
  trade_price?: number;
  trade_size?: number;
  tick_size?: number;
  lot_size?: number;
  order_book?: OrderBookSnapshot;
  [key: string]: any;
}

export interface EnrichedMarketTick extends MarketTick {
  tick_sequence: number;
  tick_delta: number; // ns since last tick
  tick_jitter: number; // timing variance
  tick_gap_count: number; // missing sequence numbers

  pid_context: {
    pid: number;
    parent_pid?: number;
    instance_id: string;
    process_type: ProcessType;
    execution_chain: ExecutionLink[];
    request_id?: string;
    execution_link_id?: string;
  };

  telemetry: {
    ingest_latency_ns: number;
    queue_depth: number;
    buffer_utilization: number;
    packet_sequence: number;
    clock_skew_ns: number;
  };

  integrity_hash?: string;

  hft_metrics?: HFTMetrics;
  microstructure?: MarketMicrostructure;
  rolling_stats?: RollingStats;
}

export interface HFTMetrics {
  latency_99th: number; // nanoseconds
  packet_loss: number; // percentage
  clock_skew: number; // nanoseconds
  queue_depth: number;
  fill_rate: number; // percentage
  slippage_avg: number; // basis points
  tick_to_trade: number; // nanoseconds
}

export interface MarketMicrostructure {
  bid_ask_spread: number; // basis points
  order_imbalance: number; // -1 to 1
  trade_size_distribution: TradeSizeBin[];
  tick_size: number;
  lot_size: number;
  depth_at_best: number;
  vwap_deviation: number; // from mid-price
}

export interface TradeSizeBin {
  size_min: number;
  size_max: number;
  count: number;
  volume: number;
}

export interface RollingStats {
  volume_mean: number;
  volume_stddev: number;
  price_mean: number;
  price_volatility: number; // annualized
  tick_velocity: number; // ticks/sec
  liquidity_score: number; // 0-100
  market_pressure: number; // -100 to +100
}

export interface OrderBookSnapshot {
  bids: Array<{ price: number; size: number; count: number }>;
  asks: Array<{ price: number; size: number; count: number }>;
  timestamp_ns: number;
}

export interface TelemetryEntry {
  tick: EnrichedMarketTick;
  processed_at: number;
  persisted: boolean;
}

export interface TelemetryBuffer {
  entries: EnrichedMarketTick[];
  lastFlush: number;
  pid: number;
}

export interface TelemetrySubscriber {
  pid: number;
  callback: (data: any) => void;
  filter?: (data: any) => boolean;
}

export interface SubscriptionHandle {
  id: string;
  marketId: string;
  unsubscribe: () => void;
}

export interface AnomalyDetection {
  type: 'volume_spike' | 'volatility_spike' | 'latency_spike' | 'packet_loss';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp?: number;
}

// Process and execution types
export type ProcessType = 'hft-engine' | 'batch-processor' | 'analytics' | 'monitoring' | 'api-gateway';

export interface ExecutionLink {
  id: string;
  type: 'request' | 'execution' | 'fork' | 'spawn';
  timestamp: number;
  metadata?: Record<string, any>;
}

// Configuration types
export interface TelemetryPersistenceConfig {
  basePath: string;
  retentionDays: number;
  maxFileSize: number;
  compressionLevel: number;
}

export interface TelemetryStreamingConfig {
  maxSubscribers: number;
  bufferSize: number;
  flushInterval: number;
  enableFiltering: boolean;
}

// Error types
export class TelemetryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = 'TelemetryError';
  }
}

export class PIDContextError extends TelemetryError {
  constructor(message: string, context?: any) {
    super(message, 'PID_CONTEXT_ERROR', context);
  }
}

export class IntegrityError extends TelemetryError {
  constructor(message: string, context?: any) {
    super(message, 'INTEGRITY_ERROR', context);
  }
}

// Utility types
export type TelemetryEventType = 'tick' | 'batch' | 'anomaly' | 'flush' | 'subscription';

export interface TelemetryEvent {
  type: TelemetryEventType;
  timestamp: number;
  data: any;
  context?: TelemetryContext;
}