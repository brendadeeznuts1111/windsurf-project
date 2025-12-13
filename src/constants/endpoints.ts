// src/constants/endpoints.ts
// Type-safe endpoint definitions with metadata and validation

// ────────── TYPE DEFINITIONS ──────────

export interface EndpointConfig {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "WS";
  description: string;
  auth?: boolean;
  rateLimit?: number; // requests per minute
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export type EndpointCategory = "monitor" | "admin" | "ws" | "static";

// ────────── ENDPOINT DEFINITIONS BY TYPE ──────────

export const ENDPOINTS: Record<EndpointCategory, Record<string, EndpointConfig>> = {
  monitor: {
    status: {
      path: "/api/v1/status",
      method: "GET",
      description: "Get overall system status",
      auth: false,
      rateLimit: 100
    },
    metrics: {
      path: "/api/v1/metrics",
      method: "GET",
      description: "Get performance metrics",
      auth: false,
      rateLimit: 60,
      query: {
        timeframe: "1h | 24h | 7d",
        format: "json | prometheus"
      }
    },
    metricDetail: {
      path: "/api/v1/metrics/:id",
      method: "GET",
      description: "Get specific metric by ID",
      auth: false,
      rateLimit: 100,
      params: {
        id: "uuid of the metric"
      }
    },
    health: {
      path: "/api/v1/health",
      method: "GET",
      description: "Health check endpoint",
      auth: false,
      rateLimit: 200
    }
  },

  admin: {
    config: {
      path: "/api/v1/admin/config",
      method: "PUT",
      description: "Update server configuration",
      auth: true,
      rateLimit: 30
    },
    shutdown: {
      path: "/api/v1/admin/shutdown",
      method: "POST",
      description: "Gracefully shutdown server",
      auth: true,
      rateLimit: 5
    },
    restart: {
      path: "/api/v1/admin/restart",
      method: "POST",
      description: "Restart server process",
      auth: true,
      rateLimit: 5
    }
  },

  ws: {
    realtimeMetrics: {
      path: "/ws/metrics",
      method: "WS",
      description: "WebSocket for real-time metrics",
      auth: true,
      rateLimit: 50
    },
    liveLogs: {
      path: "/ws/logs",
      method: "WS",
      description: "WebSocket for live log streaming",
      auth: true,
      rateLimit: 30
    }
  },

  static: {
    dashboard: {
      path: "/dashboard",
      method: "GET",
      description: "Serve monitoring dashboard",
      auth: false,
      rateLimit: 100
    },
    assets: {
      path: "/assets/*",
      method: "GET",
      description: "Serve static assets",
      auth: false,
      rateLimit: 200
    }
  }
} as const;

// ────────── HELPER FUNCTIONS ──────────

/**
 * Get full URL with dynamic parameter substitution
 * Usage: getPath('monitor', 'metricDetail', { id: '123-456' })
 */
export function getPath(
  category: EndpointCategory,
  endpoint: string,
  params?: Record<string, string>
): string {
  const config = ENDPOINTS[category][endpoint];
  if (!config) throw new Error(`Unknown endpoint: ${category}.${endpoint}`);

  let path = config.path;

  // Replace :param placeholders
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }

  return path;
}

/**
 * Get endpoint configuration by path (reverse lookup)
 * Usage: getConfigByPath('/api/v1/status')
 */
export function getConfigByPath(path: string): EndpointConfig | null {
  for (const category of Object.values(ENDPOINTS)) {
    for (const config of Object.values(category)) {
      // Handle wildcard paths
      if (config.path.includes("*")) {
        const regex = new RegExp(config.path.replace("*", ".*"));
        if (regex.test(path)) return config;
      }

      // Handle exact matches and param-based paths
      const basePath = config.path.split("/:")[0];
      if (path.startsWith(basePath)) return config;
    }
  }
  return null;
}

/**
 * Build query string from object
 * Usage: buildQuery({ timeframe: '24h', format: 'json' })
 */
export function buildQuery(params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return `?${searchParams.toString()}`;
}

// ────────── TYPE EXPORTS ──────────

export type MonitorEndpoint = typeof ENDPOINTS.monitor[keyof typeof ENDPOINTS.monitor];
export type AdminEndpoint = typeof ENDPOINTS.admin[keyof typeof ENDPOINTS.admin];
export type WSEndpoint = typeof ENDPOINTS.ws[keyof typeof ENDPOINTS.ws];
export type StaticEndpoint = typeof ENDPOINTS.static[keyof typeof ENDPOINTS.static];