// Main entry point for odds-arbitrage package
export { ArbitrageDetector } from './detector';
export { KellyCriterion } from './kelly';

// Re-export types from odds-core that are used by this package
export type { ArbitrageOpportunity } from 'odds-core';
