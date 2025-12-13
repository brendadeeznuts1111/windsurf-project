// src/constants/api.ts
// API base configuration for full URL construction and path prefixing

// ────────── API BASE CONSTANTS ──────────

/**
 * API base path for routing
 * Use this for server-side route matching
 */
export const API_BASE_PATH = "/api/v1" as const;

/**
 * Full API base URL for client SDKs and external consumers
 * Configure via environment: API_BASE_URL=http://localhost:3000/api/v1
 */
export const API_BASE_URL = process.env.API_BASE_URL ||
  `http://localhost:${process.env.PORT || 3000}${API_BASE_PATH}`;

// ────────── ENHANCED ENDPOINTS WITH BASE SUPPORT ──────────

export interface EndpointConfig {
  path: string; // Relative path from API_BASE_PATH
  fullPath: string; // Full path including API_BASE_PATH
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "WS";
  description: string;
  auth?: boolean;
  rateLimit?: number;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export const ENDPOINTS = {
  monitor: {
    status: {
      path: "/status",
      fullPath: `${API_BASE_PATH}/status`,
      method: "GET",
      description: "Get overall system status",
      auth: false,
      rateLimit: 100
    },
    metrics: {
      path: "/metrics",
      fullPath: `${API_BASE_PATH}/metrics`,
      method: "GET",
      description: "Get performance metrics",
      auth: false,
      rateLimit: 60,
      query: {
        timeframe: "1h | 24h | 7d",
        format: "json | prometheus"
      }
    },
    health: {
      path: "/health",
      fullPath: `${API_BASE_PATH}/health`,
      method: "GET",
      description: "Health check endpoint",
      auth: false,
      rateLimit: 200
    }
  },
  admin: {
    config: {
      path: "/admin/config",
      fullPath: `${API_BASE_PATH}/admin/config`,
      method: "PUT",
      description: "Update server configuration",
      auth: true,
      rateLimit: 30
    }
  }
} as const;

// ────────── HELPER FUNCTIONS ──────────

/**
 * Build full URL for external consumption
 * Usage: buildFullUrl('monitor', 'status') → "http://localhost:3000/api/v1/status"
 */
export function buildFullUrl(
  category: keyof typeof ENDPOINTS,
  endpoint: string,
  params?: Record<string, string>
): string {
  const categoryEndpoints = ENDPOINTS[category] as any;
  const config = categoryEndpoints[endpoint];
  if (!config) throw new Error(`Unknown endpoint: ${category}.${endpoint}`);

  let fullPath = config.fullPath;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      fullPath = fullPath.replace(`:${key}`, encodeURIComponent(value));
    }
  }

  return `${API_BASE_URL}${fullPath}`;
}

/**
 * Check if a request path matches the API base
 * Usage: isApiPath("/api/v1/status") → true
 */
export function isApiPath(pathname: string): boolean {
  return pathname.startsWith(API_BASE_PATH);
}

/**
 * Strip API base from path for internal routing
 * Usage: stripApiBase("/api/v1/status") → "/status"
 */
export function stripApiBase(pathname: string): string {
  return pathname.replace(API_BASE_PATH, "");
}