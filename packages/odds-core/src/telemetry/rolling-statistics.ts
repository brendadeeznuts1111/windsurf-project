/**
 * @fileoverview Rolling Statistics Engine
 * @description Real-time market analytics with time-windowed statistics and anomaly detection
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link MarketTelemetry} - Uses rolling statistics for market analysis
 * @see {@link EnrichedMarketTick} - Market tick data with statistical analysis
 * @see {@link AnomalyDetection} - Automated anomaly detection results
 * @see {@link RollingStats} - Statistical metrics data structure
 * @see {@link HFTMetrics} - High-frequency trading performance metrics
 */

/**
 * [CORE][TELEMETRY][CLASS][META:{rolling,statistics}][RollingStatEngine][#REF:EnrichedMarketTick,AnomalyDetection]
 *
 * Rolling statistics engine for real-time market analytics
 * Maintains time-windowed statistics with anomaly detection
 */

import type {
  EnrichedMarketTick,
  RollingStats,
  AnomalyDetection
} from './telemetry-types';

export class RollingStatEngine {
  private readonly windowNs: number;
  private readonly ticks: EnrichedMarketTick[] = [];
  private readonly stats: Map<string, number> = new Map();
  private lastAnomalyCheck = 0;
  private readonly anomalyCheckInterval = 1000000000; // 1 second

  constructor(windowNs: number = 1_000_000_000) { // 1 second default
    this.windowNs = windowNs;
  }

  /**
   * Ingest a new tick and update rolling statistics
   */
  ingest(tick: EnrichedMarketTick): void {
    // Add to window
    this.ticks.push(tick);

    // Remove old ticks outside window
    const cutoff = tick.tick_timestamp - this.windowNs;
    while (this.ticks.length > 0 && this.ticks[0].tick_timestamp < cutoff) {
      this.ticks.shift();
    }

    // Recalculate statistics
    this.recalculate();
  }

  /**
   * Get current rolling statistics
   */
  getStats(): RollingStats {
    return {
      volume_mean: this.stats.get('volume_mean') || 0,
      volume_stddev: this.stats.get('volume_stddev') || 0,
      price_mean: this.stats.get('price_mean') || 0,
      price_volatility: this.stats.get('price_volatility') || 0,
      tick_velocity: this.stats.get('tick_velocity') || 0,
      liquidity_score: this.stats.get('liquidity_score') || 0,
      market_pressure: this.stats.get('market_pressure') || 0,
    };
  }

  /**
   * Check for anomalies in the current window
   */
  detectAnomaly(): AnomalyDetection | null {
    const now = Date.now() * 1_000_000; // nanoseconds

    // Throttle anomaly checks
    if (now - this.lastAnomalyCheck < this.anomalyCheckInterval) {
      return null;
    }
    this.lastAnomalyCheck = now;

    // Check for volume spike
    const volumeSpike = this.detectVolumeSpike();
    if (volumeSpike) return volumeSpike;

    // Check for volatility spike
    const volatilitySpike = this.detectVolatilitySpike();
    if (volatilitySpike) return volatilitySpike;

    // Check for latency spike
    const latencySpike = this.detectLatencySpike();
    if (latencySpike) return latencySpike;

    return null;
  }

  /**
   * Get tick count in current window
   */
  getTickCount(): number {
    return this.ticks.length;
  }

  /**
   * Get time span of current window
   */
  getTimeSpan(): number {
    if (this.ticks.length < 2) return 0;
    return this.ticks[this.ticks.length - 1].tick_timestamp - this.ticks[0].tick_timestamp;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.ticks.length = 0;
    this.stats.clear();
  }

  /**
   * Recalculate all statistics
   */
  private recalculate(): void {
    if (this.ticks.length === 0) return;

    // Volume statistics
    const volumes = this.ticks.map(t => t.volume || 0);
    this.stats.set('volume_mean', this.mean(volumes));
    this.stats.set('volume_stddev', this.stddev(volumes));

    // Price statistics
    const prices = this.ticks.map(t => t.price || 0);
    this.stats.set('price_mean', this.mean(prices));
    this.stats.set('price_volatility', this.annualizedVolatility(prices));

    // Tick velocity (ticks per second)
    this.stats.set('tick_velocity', this.calculateTickVelocity());

    // Liquidity score (0-100)
    this.stats.set('liquidity_score', this.calculateLiquidityScore());

    // Market pressure (-100 to +100)
    this.stats.set('market_pressure', this.calculateMarketPressure());
  }

  /**
   * Calculate mean of values
   */
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private stddev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.mean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate annualized volatility
   */
  private annualizedVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }

    if (returns.length === 0) return 0;

    const vol = this.stddev(returns);

    // Annualize (assuming nanosecond timestamps)
    // 252 trading days * 24 hours * 60 minutes * 60 seconds * 1e9 nanoseconds
    const yearNs = 252 * 24 * 60 * 60 * 1_000_000_000;
    const timeSpan = this.getTimeSpan();

    if (timeSpan === 0) return 0;

    return vol * Math.sqrt(yearNs / timeSpan);
  }

  /**
   * Calculate tick velocity
   */
  private calculateTickVelocity(): number {
    const timeSpan = this.getTimeSpan();
    if (timeSpan === 0) return 0;
    return this.ticks.length / (timeSpan / 1e9); // ticks per second
  }

  /**
   * Calculate liquidity score (0-100)
   */
  private calculateLiquidityScore(): number {
    if (this.ticks.length === 0) return 0;

    const volumes = this.ticks.map(t => t.volume || 0);
    const avgVolume = this.mean(volumes);
    const volumeStddev = this.stddev(volumes);

    if (avgVolume === 0) return 0;

    // Higher volume with lower variance = higher liquidity
    const volumeStability = volumeStddev / avgVolume;
    const score = Math.min(100, (avgVolume / (avgVolume + volumeStddev)) * 100);

    return Math.max(0, score);
  }

  /**
   * Calculate market pressure (-100 to +100)
   */
  private calculateMarketPressure(): number {
    const buyTicks = this.ticks.filter(t => t.side === 'buy').length;
    const sellTicks = this.ticks.filter(t => t.side === 'sell').length;
    const total = buyTicks + sellTicks;

    if (total === 0) return 0;

    // Positive = buying pressure, Negative = selling pressure
    return ((buyTicks - sellTicks) / total) * 100;
  }

  /**
   * Detect volume spike anomaly
   */
  private detectVolumeSpike(): AnomalyDetection | null {
    const volumeMean = this.stats.get('volume_mean') || 0;
    const volumeStddev = this.stats.get('volume_stddev') || 0;

    if (volumeStddev === 0 || this.ticks.length === 0) return null;

    const latestVolume = this.ticks[this.ticks.length - 1].volume || 0;
    const zScore = (latestVolume - volumeMean) / volumeStddev;

    if (zScore > 3) { // 3 standard deviations
      return {
        type: 'volume_spike',
        severity: zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium',
        message: `Volume spike: ${latestVolume} vs avg ${volumeMean.toFixed(0)} (${zScore.toFixed(1)}σ)`,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Detect volatility spike anomaly
   */
  private detectVolatilitySpike(): AnomalyDetection | null {
    const volatility = this.stats.get('price_volatility') || 0;

    if (volatility > 2.0) { // > 200% annualized
      return {
        type: 'volatility_spike',
        severity: volatility > 3.0 ? 'critical' : volatility > 2.5 ? 'high' : 'medium',
        message: `High volatility: ${(volatility * 100).toFixed(0)}% annualized`,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Detect latency spike anomaly
   */
  private detectLatencySpike(): AnomalyDetection | null {
    if (this.ticks.length === 0) return null;

    const latencies = this.ticks.map(t => t.telemetry?.ingest_latency_ns || 0);
    const avgLatency = this.mean(latencies);
    const latencyStddev = this.stddev(latencies);

    if (latencyStddev === 0) return null;

    const latestLatency = latencies[latencies.length - 1];
    const zScore = (latestLatency - avgLatency) / latencyStddev;

    if (zScore > 3) {
      return {
        type: 'latency_spike',
        severity: zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium',
        message: `Latency spike: ${(latestLatency / 1000).toFixed(1)}μs vs avg ${(avgLatency / 1000).toFixed(1)}μs`,
        timestamp: Date.now()
      };
    }

    return null;
  }
}