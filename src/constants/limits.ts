// src/constants/limits.ts

/**
 * SPEC: API Limits v1.0
 * Purpose: Centralize all numerical constraints and limits.
 */

// --- Rate Limiting ---
export const RATE_LIMITS = {
  DEFAULT_API_WINDOW_MS: 60 * 1000, // 1 minute window for rate limiting
  DEFAULT_API_MAX_REQUESTS: 60,     // 60 requests per window
  AUTH_MAX_REQUESTS: 30,            // Stricter limit for auth endpoints
  ADMIN_MAX_REQUESTS: 5,            // Very strict limit for administrative endpoints
} as const;

// --- Network & Data Sizes ---
export const DATA_LIMITS = {
  MAX_JSON_BODY_SIZE_MB: 10,        // Maximum JSON body size allowed
  MAX_FILE_UPLOAD_SIZE_MB: 50,      // Maximum size for a single file upload
  MAX_QUERY_STRING_LENGTH: 2048,    // Max characters in the query string
} as const;

// --- Server & Timeouts ---
export const TIMEOUTS = {
  REQUEST_TIMEOUT_MS: 10000,        // 10 seconds for a standard request
  WEBSOCKET_PING_INTERVAL_MS: 30000,// 30 seconds for WebSocket health ping
  CACHE_TTL_DEFAULT_SECONDS: 300,   // 5 minutes for default cache TTL
} as const;