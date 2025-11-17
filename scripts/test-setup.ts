#!/usr/bin/env bun
// scripts/test-setup.ts - Global Test Setup for Odds Protocol

import { beforeAll, afterAll, beforeEach, afterEach, mock } from "bun:test";

// Global test configuration
(globalThis as any).TEST_CONFIG = {
  timeout: 30000,
  retries: 3,
  parallel: true,
  coverage: true,
  MOCK_SERVER_PORT: 3006,
  WEBSOCKET_PORT: 3003
};

// Performance tracking
(globalThis as any).PERFORMANCE_METRICS = {
  tests: [],
  startTime: 0,
  endTime: 0
};

// Mock data generators
(globalThis as any).TestData = {
  createMockOddsTick: (overrides: any = {}) => ({
    exchange: "test-exchange",
    gameId: `game-${Math.random().toString(36).substr(2, 9)}`,
    line: -110,
    juice: -110,
    timestamp: new Date(),
    ...overrides
  }),
  
  createMockArbitrageOpportunity: (overrides: any = {}) => ({
    id: `arb-${Math.random().toString(36).substr(2, 9)}`,
    exchangeA: "ExchangeA",
    exchangeB: "ExchangeB",
    lineA: -105,
    lineB: -115,
    juiceA: -110,
    juiceB: -110,
    edge: 2.5,
    kellyFraction: 0.05,
    timestamp: new Date(),
    expiry: new Date(Date.now() + 3600000),
    ...overrides
  }),
  
  createMockWebSocketMessage: (type: string, data: any) => ({
    type,
    timestamp: new Date().toISOString(),
    data
  })
};

// Mock performance monitor
(globalThis as any).MockPerformanceMonitor = class {
  private operations: Array<{ name: string; duration: number; timestamp: number }> = [];

  startOperation(name: string): { name: string; startTime: number } {
    return { name, startTime: performance.now() };
  }

  endOperation(metric: { name: string; startTime: number }): number {
    const duration = performance.now() - metric.startTime;
    this.operations.push({
      name: metric.name,
      duration,
      timestamp: Date.now()
    });
    return duration;
  }

  generateReport() {
    return {
      operations: this.operations,
      summary: {
        totalOperations: this.operations.length,
        averageDuration: this.operations.reduce((sum, op) => sum + op.duration, 0) / this.operations.length,
        totalDuration: this.operations.reduce((sum, op) => sum + op.duration, 0)
      }
    };
  }

  reset() {
    this.operations = [];
  }
};

// Mock server manager
(globalThis as any).MockServerManager = class {
  private servers: Array<{ port: number; server: any }> = [];

  async createHttpServer(port: number, routes: Record<string, any>) {
    const server = Bun.serve({
      port,
      fetch(req) {
        const url = new URL(req.url);
        const handler = routes[url.pathname];
        
        if (handler) {
          return handler(req);
        }
        
        return new Response("Not Found", { status: 404 });
      }
    });

    this.servers.push({ port, server });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return server;
  }

  async cleanup() {
    for (const { server } of this.servers) {
      if (typeof server.stop === 'function') {
        server.stop();
      }
    }
    this.servers = [];
  }
};

// Test utilities
(globalThis as any).TestUtils = {
  async waitFor(condition: () => boolean, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (!condition() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  },
  
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  generateRandomId(): string {
    return Math.random().toString(36).substr(2, 9);
  },
  
  measurePerformance<T extends (...args: any[]) => any>(
    fn: T,
    options: { iterations?: number } = { iterations: 1000 }
  ): { duration: number; opsPerSecond: number; result: ReturnType<T> } {
    const { iterations = 1000 } = options;
    const startTime = performance.now();
    
    let result: ReturnType<T>;
    for (let i = 0; i < iterations; i++) {
      result = fn();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    const opsPerSecond = (iterations / duration) * 1000;
    
    return { duration, opsPerSecond, result: result! };
  }
};

// Global setup
beforeAll(async () => {
  console.log("🚀 Setting up Odds Protocol Test Environment...");
  
  // Set environment variables
  process.env.NODE_ENV = "test";
  process.env.BUN_DEBUG = "0";
  
  console.log("✅ Test environment ready");
});

// Global cleanup
afterAll(async () => {
  console.log("🧹 Cleaning up Odds Protocol Test Environment...");
  
  // Reset environment
  process.env.NODE_ENV = "development";
  delete process.env.BUN_DEBUG;
  
  // Clear all mocks
  mock.clearAllMocks();
  
  console.log("✅ Test environment cleaned up");
});

// Per-test setup
beforeEach(() => {
  // Reset performance metrics
  (globalThis as any).PERFORMANCE_METRICS.tests = [];
  (globalThis as any).PERFORMANCE_METRICS.startTime = performance.now();
});

afterEach(() => {
  // Record test completion time
  (globalThis as any).PERFORMANCE_METRICS.endTime = performance.now();
});

console.log("✅ Odds Protocol Test Setup loaded successfully");
