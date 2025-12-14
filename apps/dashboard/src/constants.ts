/**
 * Application Constants
 * Centralized constants to eliminate magic numbers and improve maintainability
 */

// Network Configuration
export const NETWORK_CONSTANTS = {
  DEFAULT_TCP_PORT: 8080,
  DEFAULT_HTTP_PORT: 3000,
  WEBSOCKET_PORT: 6969,
  API_PORT: 6969,
  LOCALHOST: 'localhost',
  WS_PATH: '/ws',
} as const;

// Timing Constants (in milliseconds)
export const TIMING_CONSTANTS = {
  SECOND: 1000,
  TWO_SECONDS: 2000,
  THREE_SECONDS: 3000,
  FIVE_SECONDS: 5000,
  TEN_SECONDS: 10000,
  THIRTY_SECONDS: 30000,
  MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
} as const;

// Performance Thresholds
export const PERFORMANCE_CONSTANTS = {
  MAX_CONNECTION_TIME_MS: 1000,
  MAX_CONCURRENT_TIME_MS: 1000,
  MAX_TOTAL_TIME_MS: 1000,
  MEMORY_LIMIT_MB: 5,
  LATENCY_WARNING_US: 1000,
} as const;

// PID and Process Constants
export const PROCESS_CONSTANTS = {
  MIN_PID: 1000,
  MAX_PID_RANGE: 10000,
  TEST_PID: 12345,
  TEST_PPID: 1,
} as const;

// Data Size Constants
export const SIZE_CONSTANTS = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TEST_DATA_SIZE: 1024,
  LONG_STRING_LENGTH: 1000,
} as const;

// HTTP/WebSocket Status Codes
export const STATUS_CODES = {
  NORMAL_CLOSURE: 1000,
} as const;

// Market Data Constants
export const MARKET_CONSTANTS = {
  DEFAULT_TICK_RATE: 10,
  MAX_TICK_RATE: 100,
  MIN_TICK_RATE: 1,
  PRICE_PRECISION: 2,
} as const;

// Retry and Backoff Constants
export const RETRY_CONSTANTS = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
} as const;

// Business Logic Constants
export const BUSINESS_CONFIG = {
  ARBITRAGE: {
    DEFAULT_UPDATE_INTERVAL: 30000, // 30 seconds
    MIN_PROFIT_THRESHOLD: 0.001, // 0.1%
    MAX_OPPORTUNITIES: 50,
    CONFIDENCE_THRESHOLD: 0.8,
  },
  MARKET_DATA: {
    DEFAULT_UPDATE_INTERVAL: 1000, // 1 second
    PRICE_PRECISION: 2,
    VOLUME_PRECISION: 0,
  },
} as const;

// Test Data Constants
export const TEST_DATA = {
  SAMPLE_PRICES: {
    AAPL: 175.50,
    BTC: 45000,
    ETH: 3000,
  },
  SAMPLE_VOLUMES: {
    SMALL: 1000,
    MEDIUM: 5000,
    LARGE: 10000,
  },
} as const;

// Dashboard State Constants
export const DASHBOARD_CONSTANTS = {
  // Update intervals
  UPDATE_INTERVAL_MS: 5000, // 5 seconds

  // System status probabilities (0-1 range)
  TEXT_LOADER_WARNING_PROBABILITY: 0.1,
  ENV_SYNC_ERROR_PROBABILITY: 0.05,
  ENV_SYNC_ISSUE_PROBABILITY: 0.1,
  SOCKET_PROXY_IDLE_PROBABILITY: 0.15,
  WORKER_SYSTEM_WARNING_PROBABILITY: 0.1,
  TENSION_ENGINE_WARNING_PROBABILITY: 0.08,
  SECURITY_ERROR_PROBABILITY: 0.05,

  // File system metrics
  MAX_FILE_SIZE_BYTES: 1000000, // 1MB
  MAX_TOTAL_SIZE_BYTES: 5000000, // 5MB
  MAX_FILES_COUNT: 100,
  MIN_FILES_COUNT: 50,

  // Time ranges for mock data (milliseconds)
  LAST_SYNC_TIME_RANGE_MS: 300000, // 5 minutes
  LAST_SCAN_TIME_RANGE_MS: 600000, // 10 minutes

  // System metrics ranges
  MAX_ACTIVE_PROXIES: 10,
  MAX_TENSION_EVENTS: 20,
  MAX_CURRENT_TENSION: 0.8,
  MAX_ACTIVE_WORKERS: 5,
  MIN_ACTIVE_WORKERS: 1,
  MAX_EVENTS_COUNT: 50,
  MIN_EVENTS_COUNT: 10,
  MAX_PEAK_TENSION: 0.8,
  MAX_ALERTS_TRIGGERED: 3,
  MAX_VALIDATIONS_COUNT: 100,
  MIN_VALIDATIONS_COUNT: 50,
  MAX_BLOCKED_COUNT: 10,
  MAX_WARNINGS_COUNT: 5,
} as const;