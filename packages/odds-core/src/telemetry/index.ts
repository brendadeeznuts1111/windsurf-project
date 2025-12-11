/**
 * @fileoverview Telemetry Module Exports
 * @description Centralized exports for all telemetry modules and types
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link MarketTelemetry} - Main telemetry engine
 * @see {@link PIDContext} - Process context management
 * @see {@link AuditTrail} - Audit trail system
 * @see {@link RollingStatEngine} - Statistics engine
 * @see {@link MarketTelemetryDemo} - Dashboard demonstration
 * @see {@link TCPDemo} - Networking integration example
 */

/**
 * [CORE][TELEMETRY][INDEX][META:{exports}][TelemetryExports]
 *
 * Centralized exports for all telemetry modules
 */

// Main telemetry engine
export { MarketTelemetry, Telemetry } from './market-telemetry';

// PID context management
export { SecurePIDRegistry, PIDContext } from './pid-context';

// Audit trail
export { PIDAuditTrail, AuditTrail } from './pid-audit-trail';

// Rolling statistics
export { RollingStatEngine } from './rolling-statistics';

// Types
export type {
  TelemetryConfig,
  TelemetryContext,
  MarketTick,
  EnrichedMarketTick,
  HFTMetrics,
  MarketMicrostructure,
  RollingStats,
  OrderBookSnapshot,
  TelemetryEntry,
  TelemetryBuffer,
  TelemetrySubscriber,
  SubscriptionHandle,
  AnomalyDetection,
  ProcessType,
  ExecutionLink,
  TelemetryEvent,
} from './telemetry-types';

// Error types
export {
  TelemetryError,
  PIDContextError,
  IntegrityError,
} from './telemetry-types';