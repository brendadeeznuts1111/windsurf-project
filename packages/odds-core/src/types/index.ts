// Core types for odds protocol
export interface OddsTick {
  id: string;
  timestamp: number;
  symbol: string;
  price: number;
  size: number;
  exchange: string;
  side: 'buy' | 'sell';
}

export interface MarketData {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
  sequence: number;
}

export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  exchange1: string;
  exchange2: string;
  price1: number;
  price2: number;
  profit: number;
  confidence: number;
  timestamp: number;
}

export interface SharpDetectionResult {
  symbol: string;
  isSharp: boolean;
  confidence: number;
  reasoning: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
  sequence: number;
}

export interface MarketHours {
  open: string;
  close: string;
  timezone: string;
  days: number[];
}

// Export new topics and enhanced types
export * from './topics';
export * from './enhanced';
export { ProcessingMetadata } from './topics';
export * from './lightweight';
export * from './strict';
export * from './realtime';
export * from './analytics';
export * from './lifecycle';
export * from './enhanced-odds';

// Export incremental synthetic arbitrage types (improved approach)
export * from './synthetic-arbitrage-v1';
export * from './synthetic-arbitrage-v2';
export * from './synthetic-arbitrage-v3';
export * from './synthetic-validation-v2';

// Export comprehensive rotation number system
export * from './rotation-numbers';
