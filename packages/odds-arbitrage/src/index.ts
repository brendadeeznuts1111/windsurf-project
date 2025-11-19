// Main entry point for odds-arbitrage package
export { ArbitrageDetector } from './detector';
export { KellyCriterion } from './kelly';

// Re-export types
export type { ArbitrageOpportunity, ArbitrageResult } from './detector';
export type { KellyBet } from './kelly';
