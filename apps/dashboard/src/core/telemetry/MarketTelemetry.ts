// apps/dashboard/src/core/telemetry/MarketTelemetry.ts

/**
 * Browser-compatible MarketTelemetry adapter
 * Wraps the server-side telemetry for dashboard use
 */

import type {
  MarketTick,
  EnrichedMarketTick,
  TelemetryContext,
  TelemetrySubscriber,
  SubscriptionHandle
} from 'odds-core';
import { PROCESS_CONSTANTS } from '../../constants';

export class MarketTelemetry {
  private static instance: MarketTelemetry;
  private subscribers = new Map<string, Set<TelemetrySubscriber>>();
  private tickSequence = 0;

  static getInstance(): MarketTelemetry {
    if (!MarketTelemetry.instance) {
      MarketTelemetry.instance = new MarketTelemetry();
    }
    return MarketTelemetry.instance;
  }

  configure(config: any): void {
    console.log('[TELEMETRY] Configuration updated (browser mode)', config);
  }

  async recordTick(tick: MarketTick, context: TelemetryContext): Promise<EnrichedMarketTick> {
    // Simulate enriched tick for browser demo
    const enrichedTick: EnrichedMarketTick = {
      ...tick,
      tick_sequence: ++this.tickSequence,
      tick_delta: 0,
      tick_jitter: Math.random() * 100,
      tick_gap_count: 0,
      pid_context: {
        pid: PROCESS_CONSTANTS.MIN_PID + Math.floor(Math.random() * PROCESS_CONSTANTS.MAX_PID_RANGE),
        instance_id: `i-${Math.random().toString(36).substr(2, 9)}`,
        process_type: 'hft-engine',
        request_id: context.requestId,
        execution_link_id: `link_${Date.now()}`
      },
      telemetry: {
        ingest_latency_ns: Math.random() * 1000 + 100,
        queue_depth: Math.floor(Math.random() * 100),
        buffer_utilization: Math.random() * 100,
        packet_sequence: this.tickSequence,
        clock_skew_ns: Math.random() * 1000
      },
      integrity_hash: Math.random().toString(36).substr(2, 16)
    };

    // Notify subscribers
    this.notifySubscribers(tick.market_id, enrichedTick);

    return enrichedTick;
  }

  async recordBatch(ticks: MarketTick[], context: TelemetryContext): Promise<EnrichedMarketTick[]> {
    const enrichedTicks = await Promise.all(
      ticks.map(tick => this.recordTick(tick, context))
    );

    console.log(`[TELEMETRY] Recorded batch of ${ticks.length} ticks`);
    return enrichedTicks;
  }

  subscribe(
    marketId: string,
    subscriber: TelemetrySubscriber,
    context: TelemetryContext
  ): SubscriptionHandle {
    if (!this.subscribers.has(marketId)) {
      this.subscribers.set(marketId, new Set());
    }

    this.subscribers.get(marketId)!.add(subscriber);

    console.log(`[TELEMETRY] Subscribed to ${marketId}`);

    return {
      id: `sub_${Date.now()}`,
      marketId,
      unsubscribe: () => this.unsubscribe(marketId, subscriber)
    };
  }

  private unsubscribe(marketId: string, subscriber: TelemetrySubscriber): void {
    const subscribers = this.subscribers.get(marketId);
    if (subscribers) {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        this.subscribers.delete(marketId);
      }
    }
  }

  private notifySubscribers(marketId: string, data: EnrichedMarketTick): void {
    const subscribers = this.subscribers.get(marketId);
    if (!subscribers || subscribers.size === 0) return;

    for (const subscriber of subscribers) {
      if (subscriber.filter && !subscriber.filter(data)) continue;

      try {
        subscriber.callback(data);
      } catch (error) {
        console.error('[TELEMETRY] Subscriber callback failed:', error);
      }
    }
  }
}