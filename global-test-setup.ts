/**
 * 🌍 Global Test Setup - Following Bun Testing Guidelines
 *
 * Sets up global test utilities and environment following Bun's best practices.
 * No timeouts, no hardcoded ports, proper resource cleanup.
 */

import { beforeAll, beforeEach, afterEach } from "bun:test";
import { getGlobalResourceTracker } from "./harness";

// Global test state
declare global {
  var testUtils: {
    generateMockData: (type: string) => any;
    waitFor: (condition: () => boolean | Promise<boolean>, options?: any) => Promise<void>;
    assertEnvironment: () => void;
    createMockServer: (handler: (req: Request) => Response | Promise<Response>) => any;
  };
  var testStartTime: number;
  var testEnvironment: string;
  var resourceTracker: any;
}

// Initialize global test utilities
beforeAll(() => {
  // Set NODE_ENV for test environment
  process.env.NODE_ENV = 'test';

  // Set additional test environment variables expected by comprehensive tests
  process.env.DATABASE_URL = 'postgresql://localhost:5432/test_db';
  process.env.API_URL = 'http://localhost:3001';
  process.env.LOG_LEVEL = 'error';

  // Global test utilities (following Bun guidelines)
  global.testUtils = {
    generateMockData: (type: string) => {
      switch (type) {
        case "user":
          return {
            id: "test-user-1",
            name: "Test User",
            email: "test@example.com"
          };
        case "worker":
          return {
            id: "test-worker-1",
            type: "data-processor",
            status: "active"
          };
        case "config":
          return {
            appName: "TestApp",
            version: "1.0.0",
            environment: "test"
          };
        case "database":
          return {
            connection: "mock-connection",
            query: "mock-query-function"
          };
        default:
          return { id: `test-${type}-1`, type };
      }
    },

    // Use waitFor instead of setTimeout (Bun guideline)
    waitFor: async (condition: () => boolean | Promise<boolean>, options = {}) => {
      const { timeout = 5000, interval = 50, message = "Condition not met" } = options;
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        if (await condition()) return;
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      throw new Error(`${message} (waited ${timeout}ms)`);
    },

    assertEnvironment: () => {
      if (process.env.NODE_ENV !== "test") {
        throw new Error("Not in test environment");
      }
    },

    // Create mock server with random port (Bun guideline)
    createMockServer: (handler: (req: Request) => Response | Promise<Response>) => {
      const server = Bun.serve({
        port: 0, // Random port
        fetch: handler,
      });

      return {
        server,
        port: server.port,
        url: `http://localhost:${server.port}`,
        close: () => server.stop()
      };
    }
  };

  global.testStartTime = Date.now();
  global.testEnvironment = "comprehensive-test";

  console.log("✅ Global test utilities initialized (Bun guidelines compliant)");
});

// Set up resource tracking for each test
beforeEach(() => {
  global.resourceTracker = getGlobalResourceTracker();
});

afterEach(async () => {
  // Clean up resources after each test
  if (global.resourceTracker) {
    await global.resourceTracker.cleanup();
  }
});
