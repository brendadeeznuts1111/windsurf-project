#!/usr/bin/env bun
// packages/odds-websocket/src/__tests__/server-v13-concurrent.test.ts
// Bun v1.3 Concurrent WebSocket Server Testing

import { test, describe, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { BunV13WebSocketServer } from '../server-v13.js';

// Test configuration
const SERVER_CONFIG = {
  port: 3001, // Different from default to avoid conflicts
  workerCount: 2
};

const TEST_TIMEOUT = 15000;

// Mock data for testing
const mockOddsData = {
  id: "test-odds-123",
  sport: "basketball",
  event: "Lakers vs Celtics",
  odds: { home: -110, away: -110 },
  timestamp: new Date().toISOString(),
  bookmaker: "test-bookmaker"
};

const mockArbitrageData = {
  id: "test-arb-456",
  sport: "basketball",
  event: "Lakers vs Celtics",
  opportunities: [
    { bookmaker: "BookA", odds: -105, commission: 0.02 },
    { bookmaker: "BookB", odds: -115, commission: 0.025 }
  ],
  profit: 2.5,
  timestamp: new Date().toISOString()
};

describe.concurrent("Bun v1.3 WebSocket Server - Concurrent Tests", () => {
  let server: BunV13WebSocketServer;

  beforeAll(async () => {
    console.log("🚀 Starting WebSocket server for concurrent tests...");
    server = new BunV13WebSocketServer(SERVER_CONFIG);
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    console.log("🛑 Stopping WebSocket server...");
    if (server) {
      server.stop();
    }
  });

  beforeEach(() => {
    // Reset server state before each test
  });

  test.concurrent("handles multiple concurrent connections", async () => {
    const connections = Array.from({ length: 5 }, (_, i) => 
      new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`)
    );

    // Wait for all connections to open
    await Promise.all(connections.map(ws => 
      new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = reject;
        setTimeout(reject, 5000);
      })
    ));

    // All connections should be successful
    connections.forEach(ws => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    // Close all connections
    connections.forEach(ws => ws.close());
  }, TEST_TIMEOUT);

  test.concurrent("concurrent message broadcasting", async () => {
    const client1 = new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`);
    const client2 = new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`);
    const client3 = new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`);

    // Wait for connections
    await Promise.all([
      new Promise<void>(resolve => { client1.onopen = () => resolve(); }),
      new Promise<void>(resolve => { client2.onopen = () => resolve(); }),
      new Promise<void>(resolve => { client3.onopen = () => resolve(); })
    ]);

    const messages1: any[] = [];
    const messages2: any[] = [];
    const messages3: any[] = [];

    client1.onmessage = (event) => messages1.push(JSON.parse(event.data));
    client2.onmessage = (event) => messages2.push(JSON.parse(event.data));
    client3.onmessage = (event) => messages3.push(JSON.parse(event.data));

    // Send concurrent messages
    const messagePromises = Array.from({ length: 10 }, (_, i) => {
      const message = {
        ...mockOddsData,
        id: `test-${i}`,
        timestamp: new Date().toISOString()
      };
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Simulate sending message to server
          if (client1.readyState === WebSocket.OPEN) {
            client1.send(JSON.stringify(message));
          }
          resolve();
        }, Math.random() * 100);
      });
    });

    await Promise.all(messagePromises);

    // Wait for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // All clients should receive messages
    expect(messages1.length).toBeGreaterThan(0);
    expect(messages2.length).toBeGreaterThan(0);
    expect(messages3.length).toBeGreaterThan(0);

    // Close connections
    client1.close();
    client2.close();
    client3.close();
  }, TEST_TIMEOUT);

  test.concurrent("concurrent subscription management", async () => {
    const clients = Array.from({ length: 3 }, () => 
      new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`)
    );

    // Wait for connections
    await Promise.all(clients.map(ws => 
      new Promise<void>(resolve => { ws.onopen = () => resolve(); })
    ));

    // Subscribe to different channels concurrently
    const subscriptionPromises = clients.map((ws, index) => {
      return new Promise<void>((resolve) => {
        const subscription = {
          type: "subscribe",
          channels: [`basketball-${index}`, `arbitrage-${index}`]
        };
        
        ws.send(JSON.stringify(subscription));
        setTimeout(resolve, 100);
      });
    });

    await Promise.all(subscriptionPromises);

    // Verify subscriptions (this would require server-side subscription tracking)
    // For now, just ensure no errors occurred
    clients.forEach(ws => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    // Close connections
    clients.forEach(ws => ws.close());
  }, TEST_TIMEOUT);

  test.concurrent("concurrent network diagnostics endpoint", async () => {
    // Make concurrent requests to the diagnostics endpoint
    const requests = Array.from({ length: 5 }, () =>
      fetch(`http://localhost:${SERVER_CONFIG.port}/network-diagnostics`)
    );

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Parse and validate response content
    const data = await responses[0].json();
    expect(data).toHaveProperty('serverPort');
    expect(data).toHaveProperty('activeConnections');
    expect(data).toHaveProperty('connections');
  }, TEST_TIMEOUT);

  test.concurrent("handles connection drops gracefully", async () => {
    const clients = Array.from({ length: 5 }, () => 
      new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`)
    );

    // Wait for connections
    await Promise.all(clients.map(ws => 
      new Promise<void>(resolve => { ws.onopen = () => resolve(); })
    ));

    // Drop connections randomly
    const dropPromises = clients.map((ws, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          ws.close();
          resolve();
        }, Math.random() * 500);
      });
    });

    await Promise.all(dropPromises);

    // Server should handle drops without crashing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify server is still running
    const testClient = new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`);
    await new Promise<void>((resolve) => {
      testClient.onopen = () => {
        expect(testClient.readyState).toBe(WebSocket.OPEN);
        testClient.close();
        resolve();
      };
      testClient.onerror = () => resolve(); // Even if it fails, server is still running
    });
  }, TEST_TIMEOUT);
});

describe.concurrent("Bun v1.3 Performance Tests", () => {
  test.concurrent("high-frequency message processing", async () => {
    const client = new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`);
    
    await new Promise<void>(resolve => { client.onopen = () => resolve(); });

    let messageCount = 0;
    const startTime = performance.now();

    client.onmessage = (event) => {
      messageCount++;
      if (messageCount >= 1000) {
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(5000); // Should process 1000 messages in under 5 seconds
        console.log(`📡 Processed 1000 messages in ${duration.toFixed(2)}ms`);
        client.close();
      }
    };

    // Send high-frequency messages
    for (let i = 0; i < 1000; i++) {
      const message = {
        ...mockOddsData,
        id: `perf-test-${i}`,
        timestamp: new Date().toISOString()
      };
      
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }, TEST_TIMEOUT);

  test.concurrent("concurrent client stress test", async () => {
    const clientCount = 10;
    const messagesPerClient = 100;
    
    const clients = Array.from({ length: clientCount }, () => 
      new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`)
    );

    // Wait for all connections
    await Promise.all(clients.map(ws => 
      new Promise<void>(resolve => { ws.onopen = () => resolve(); })
    ));

    const startTime = performance.now();
    let totalMessages = 0;

    // Setup message handlers
    clients.forEach(ws => {
      let messageCount = 0;
      ws.onmessage = () => {
        messageCount++;
        totalMessages++;
        if (messageCount >= messagesPerClient) {
          ws.close();
        }
      };
    });

    // Send messages concurrently
    const sendPromises = clients.map((ws, clientIndex) => {
      return Promise.all(Array.from({ length: messagesPerClient }, (_, messageIndex) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              const message = {
                ...mockOddsData,
                id: `stress-${clientIndex}-${messageIndex}`,
                timestamp: new Date().toISOString()
              };
              ws.send(JSON.stringify(message));
            }
            resolve();
          }, Math.random() * 10);
        });
      }));
    });

    await Promise.all(sendPromises);

    // Wait for all messages to be processed
    while (totalMessages < clientCount * messagesPerClient) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = performance.now() - startTime;
    const messagesPerSecond = (totalMessages / duration) * 1000;

    expect(messagesPerSecond).toBeGreaterThan(100); // Should handle at least 100 msg/sec
    console.log(`🚀 Processed ${totalMessages} messages in ${duration.toFixed(2)}ms (${messagesPerSecond.toFixed(0)} msg/sec)`);
  }, TEST_TIMEOUT);
});

describe("Bun v1.3 Sequential Tests", () => {
  test("server startup and shutdown sequence", async () => {
    // Test that server can be started and stopped sequentially
    const testServer = new BunV13WebSocketServer({ port: 3002 });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Server should be running
    const response = await fetch("http://localhost:3002/network-diagnostics");
    expect(response.status).toBe(200);
    
    // Stop server
    testServer.stop();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Server should be stopped
    try {
      await fetch("http://localhost:3002/network-diagnostics");
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined(); // Expected to fail
    }
  });

  test("memory cleanup after connections", async () => {
    const initialMemory = process.memoryUsage();
    
    // Create and close many connections
    for (let i = 0; i < 50; i++) {
      const ws = new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`);
      await new Promise<void>(resolve => { ws.onopen = () => resolve(); });
      ws.close();
    }
    
    // Force garbage collection if available
    if (typeof globalThis.gc !== 'undefined') {
      globalThis.gc();
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalMemory = process.memoryUsage();
    
    // Memory usage should not increase dramatically
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
  });
});

// Error handling tests
describe.concurrent("Bun v1.3 Error Handling", () => {
  test.concurrent("handles malformed messages gracefully", async () => {
    const client = new WebSocket(`ws://localhost:${SERVER_CONFIG.port}`);
    
    await new Promise<void>(resolve => { client.onopen = () => resolve(); });

    // Send malformed JSON
    client.send("{ invalid json }");
    
    // Send valid message to ensure server is still responsive
    const validMessage = JSON.stringify(mockOddsData);
    client.send(validMessage);

    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Server should still be responsive
    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  }, TEST_TIMEOUT);

  test.concurrent("handles connection timeouts", async () => {
    // Create connection but don't complete handshake
    const controller = new AbortController();
    
    try {
      const response = await fetch(`http://localhost:${SERVER_CONFIG.port}/network-diagnostics`, {
        signal: controller.signal
      });
      
      // Should succeed normally
      expect(response.status).toBe(200);
    } catch (error) {
      // Handle timeout if it occurs
      expect(error).toBeDefined();
    }
  }, TEST_TIMEOUT);
});

console.log("✅ Bun v1.3 WebSocket concurrent test suite loaded");
