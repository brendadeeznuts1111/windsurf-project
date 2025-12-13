import { test, describe, expect } from "bun:test";
import { ENDPOINTS, getPath, getConfigByPath, buildQuery } from "./endpoints";

// Helper to extract all endpoint configs into a flat array for easy iteration
function getAllEndpoints() {
  return Object.values(ENDPOINTS).flatMap(category => Object.values(category));
}

describe("API Endpoints Validation (src/constants/endpoints.ts)", () => {

  // --- SPEC 01 Validation ---

  test("All endpoint paths must be defined and start with a slash", () => {
    const endpoints = getAllEndpoints();

    for (const endpoint of endpoints) {
      // Rule: path must start with a slash
      expect(endpoint.path).toMatch(/^\//);
      // Rule: path should not end with a slash (unless it's just '/')
      expect(endpoint.path).not.toMatch(/.\/$/);
    }
  });

  test("All endpoints must have valid HTTP methods", () => {
    const endpoints = getAllEndpoints();
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "WS"];

    for (const endpoint of endpoints) {
      expect(validMethods).toContain(endpoint.method);
    }
  });

  test("All endpoints must have descriptions", () => {
    const endpoints = getAllEndpoints();

    for (const endpoint of endpoints) {
      expect(endpoint.description).toBeDefined();
      expect(typeof endpoint.description).toBe("string");
      expect(endpoint.description.length).toBeGreaterThan(0);
    }
  });

  test("Auth-required endpoints must have rate limits", () => {
    const endpoints = getAllEndpoints();

    for (const endpoint of endpoints) {
      if (endpoint.auth) {
        expect(endpoint.rateLimit).toBeDefined();
        expect(typeof endpoint.rateLimit).toBe("number");
        expect(endpoint.rateLimit).toBeGreaterThan(0);
      }
    }
  });

  // --- Helper Function Validation ---

  test("getPath helper correctly substitutes parameters", () => {
    // Test with parameter substitution
    const metricDetailPath = getPath("monitor", "metricDetail", { id: "123-456" });
    expect(metricDetailPath).toBe("/api/v1/metrics/123-456");

    // Test without parameters
    const statusPath = getPath("monitor", "status");
    expect(statusPath).toBe("/api/v1/status");

    // Test with multiple parameters (if any existed)
    const adminConfigPath = getPath("admin", "config");
    expect(adminConfigPath).toBe("/api/v1/admin/config");
  });

  test("getConfigByPath reverse lookup works correctly", () => {
    // Test exact path match
    const statusConfig = getConfigByPath("/api/v1/status");
    expect(statusConfig).toBeDefined();
    expect(statusConfig?.description).toBe("Get overall system status");

    // Test parameterized path match
    const metricConfig = getConfigByPath("/api/v1/metrics/123");
    expect(metricConfig).toBeDefined();
    expect(metricConfig?.description).toBe("Get specific metric by ID");

    // Test WebSocket path
    const wsConfig = getConfigByPath("/ws/metrics");
    expect(wsConfig).toBeDefined();
    expect(wsConfig?.method).toBe("WS");

    // Test static path with wildcard
    const staticConfig = getConfigByPath("/assets/app.js");
    expect(staticConfig).toBeDefined();
    expect(staticConfig?.description).toBe("Serve static assets");

    // Test non-existent path
    const notFoundConfig = getConfigByPath("/nonexistent/path");
    expect(notFoundConfig).toBeNull();
  });

  test("buildQuery helper creates proper query strings", () => {
    const params = { timeframe: "24h", format: "json", limit: "100" };
    const queryString = buildQuery(params);
    expect(queryString).toBe("?timeframe=24h&format=json&limit=100");

    // Test empty params
    const emptyQuery = buildQuery({});
    expect(emptyQuery).toBe("?");

    // Test single param
    const singleQuery = buildQuery({ sort: "desc" });
    expect(singleQuery).toBe("?sort=desc");
  });

  // --- Category-Specific Validation ---

  test("Monitor endpoints have appropriate rate limits", () => {
    Object.values(ENDPOINTS.monitor).forEach(endpoint => {
      expect(endpoint.rateLimit).toBeDefined();
      expect(endpoint.rateLimit).toBeGreaterThan(50); // Monitor endpoints should have reasonable limits
    });
  });

  test("Admin endpoints require authentication", () => {
    Object.values(ENDPOINTS.admin).forEach(endpoint => {
      expect(endpoint.auth).toBe(true);
      expect(endpoint.rateLimit).toBeDefined();
      expect(endpoint.rateLimit).toBeLessThan(50); // Admin endpoints should have strict limits
    });
  });

  test("WebSocket endpoints have auth and rate limiting", () => {
    Object.values(ENDPOINTS.ws).forEach(endpoint => {
      expect(endpoint.auth).toBe(true);
      expect(endpoint.rateLimit).toBeDefined();
      expect(endpoint.method).toBe("WS");
    });
  });

  test("Static endpoints are public with reasonable rate limits", () => {
    Object.values(ENDPOINTS.static).forEach(endpoint => {
      expect(endpoint.auth).toBe(false);
      expect(endpoint.rateLimit).toBeDefined();
      expect(endpoint.rateLimit).toBeGreaterThan(100); // Static content can handle higher loads
    });
  });

  // --- Type Safety Validation ---

  test("Type exports work correctly", () => {
    // These should compile without errors (type-only tests)
    const monitorEndpoint: MonitorEndpoint = ENDPOINTS.monitor.status;
    const adminEndpoint: AdminEndpoint = ENDPOINTS.admin.config;
    const wsEndpoint: WSEndpoint = ENDPOINTS.ws.realtimeMetrics;
    const staticEndpoint: StaticEndpoint = ENDPOINTS.static.dashboard;

    // Verify they have the expected shape
    expect(monitorEndpoint.method).toBeDefined();
    expect(adminEndpoint.auth).toBe(true);
    expect(wsEndpoint.method).toBe("WS");
    expect(staticEndpoint.auth).toBe(false);
  });
});</content>
<parameter name="filePath">src/constants/endpoints.test.ts