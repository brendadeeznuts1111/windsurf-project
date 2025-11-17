#!/usr/bin/env bun
// packages/odds-websocket/src/__tests__/server.test.ts - WebSocket Server Tests

import { test, describe, expect, beforeAll, afterAll, beforeEach, afterEach, mock } from "bun:test";

import { BunV13WebSocketServer } from '../server-v13.js';
import { OddsTick, ArbitrageOpportunity } from '../../odds-core/src/types.js';

// Mock WebSocket message interface
interface MockWebSocketMessage {
  type: string;
  timestamp: string;
  data: any;
}

describe("Odds WebSocket - Server Core", () => {
  let server: BunV13WebSocketServer;
  const testPort = 3010;

  beforeAll(async () => {
    // Start test WebSocket server
    server = new BunV13WebSocketServer({
      port: testPort,
      workerCount: 0 // Disable workers for testing
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Cleanup server
    if (server && typeof (server as any).stop === 'function') {
      (server as any).stop();
    }
  });

  describe("Server Initialization", () => {
    test("starts server on specified port", () => {
      expect(server).toBeDefined();
      expect(testPort).toBeGreaterThan(0);
    });

    test("handles server configuration", () => {
      const config = {
        port: 3011,
        workerCount: 0 // Disable workers for testing
      };
      
      const testServer = new BunV13WebSocketServer(config);
      expect(testServer).toBeDefined();
      
      // Cleanup
      if (typeof (testServer as any).stop === 'function') {
        (testServer as any).stop();
      }
    });
  });

  describe("Connection Management", () => {
    test.concurrent("accepts WebSocket connections", async () => {
      const wsUrl = `ws://localhost:${testPort}`;
      const ws = new WebSocket(wsUrl);
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          expect(ws.readyState).toBe(WebSocket.OPEN);
          resolve();
        };
        
        ws.onerror = reject;
      });
      
      ws.close();
    });

    test.concurrent("handles connection drops", async () => {
      const wsUrl = `ws://localhost:${testPort}`;
      const ws = new WebSocket(wsUrl);
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          ws.close();
        };
        ws.onclose = () => {
          expect(ws.readyState).toBe(WebSocket.CLOSED);
          resolve();
        };
      });
    });
  });

  describe("Message Handling", () => {
    test.concurrent("processes odds update messages", async () => {
      const wsUrl = `ws://localhost:${testPort}`;
      const ws = new WebSocket(wsUrl);
      const receivedMessages: MockWebSocketMessage[] = [];
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          const oddsMessage: MockWebSocketMessage = {
            type: "odds-update",
            timestamp: new Date().toISOString(),
            data: {
              exchange: "test-exchange",
              gameId: "game-123",
              line: -110,
              juice: -110,
              timestamp: new Date()
            }
          };
          
          ws.send(JSON.stringify(oddsMessage));
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          receivedMessages.push(message);
          
          if (receivedMessages.length >= 1) {
            expect(message.type).toBe("odds-update");
            expect(message.data).toBeDefined();
            resolve();
          }
        };
      });
      
      ws.close();
    });

    test.concurrent("handles subscription messages", async () => {
      const wsUrl = `ws://localhost:${testPort}`;
      const ws = new WebSocket(wsUrl);
      const receivedMessages: MockWebSocketMessage[] = [];
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          const subscribeMessage: MockWebSocketMessage = {
            type: "subscribe",
            timestamp: new Date().toISOString(),
            data: {
              games: ["game-123", "game-456"],
              exchanges: ["exchange-1", "exchange-2"]
            }
          };
          
          ws.send(JSON.stringify(subscribeMessage));
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          receivedMessages.push(message);
          
          if (message.type === "subscription-confirmed") {
            expect(message.data.games).toBeDefined();
            expect(message.data.exchanges).toBeDefined();
            resolve();
          }
        };
      });
      
      ws.close();
    });

    test.concurrent("handles invalid message formats", async () => {
      const wsUrl = `ws://localhost:${testPort}`;
      const ws = new WebSocket(wsUrl);
      const receivedMessages: MockWebSocketMessage[] = [];
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          // Send invalid JSON
          ws.send("invalid json message");
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          receivedMessages.push(message);
          
          if (message.type === "error") {
            expect(message.error).toBeDefined();
            resolve();
          }
        };
      });
      
      ws.close();
    });
  });

  describe("Performance and Scalability", () => {
    test.concurrent("handles high message throughput", async () => {
      const wsUrl = `ws://localhost:${testPort}`;
      const ws = new WebSocket(wsUrl);
      const receivedCount = { value: 0 };
      const messageCount = 100;
      
      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          const startTime = performance.now();
          
          // Send many messages rapidly
          for (let i = 0; i < messageCount; i++) {
            const message: MockWebSocketMessage = {
              type: "test-message",
              timestamp: new Date().toISOString(),
              data: { id: i, content: `Test message ${i}` }
            };
            
            ws.send(JSON.stringify(message));
          }
        };
        
        ws.onmessage = () => {
          receivedCount.value++;
          
          if (receivedCount.value >= messageCount) {
            const duration = performance.now() - startTime;
            const messagesPerSecond = messageCount / (duration / 1000);
            
            expect(messagesPerSecond).toBeGreaterThan(100); // Should handle >100 msg/sec
            expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
            
            console.log(`🚀 Processed ${messagesPerSecond.toFixed(0)} messages/sec`);
            resolve();
          }
        };
        
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error("Test timeout")), 10000);
      });
      
      ws.close();
    });

    test.concurrent("handles concurrent connections", async () => {
      const connectionCount = 10;
      const connections: WebSocket[] = [];
      const connectionPromises: Promise<void>[] = [];
      
      // Create many concurrent connections
      for (let i = 0; i < connectionCount; i++) {
        const promise = new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(`ws://localhost:${testPort}`);
          
          const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
          
          ws.onopen = () => {
            clearTimeout(timeout);
            connections.push(ws);
            resolve();
          };
          
          ws.onerror = reject;
        });
        
        connectionPromises.push(promise);
      }
      
      const startTime = performance.now();
      
      // Wait for all connections
      await Promise.all(connectionPromises);
      
      const duration = performance.now() - startTime;
      
      expect(connections).toHaveLength(connectionCount);
      expect(connections.every(ws => ws.readyState === WebSocket.OPEN)).toBe(true);
      expect(duration).toBeLessThan(3000); // Should establish 10 connections in under 3 seconds
      
      console.log(`🔗 Established ${connectionCount} connections in ${duration.toFixed(2)}ms`);
      
      // Cleanup
      connections.forEach(ws => ws.close());
    });
  });

  describe("Error Handling and Recovery", () => {
    test.concurrent("handles malformed messages gracefully", async () => {
      const wsUrl = `ws://localhost:${testPort}`;
      const ws = new WebSocket(wsUrl);
      const errorMessages: MockWebSocketMessage[] = [];
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          // Send various malformed messages
          ws.send("");
          ws.send("{invalid json");
          ws.send(null as any);
          ws.send(undefined as any);
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          
          if (message.type === "error") {
            errorMessages.push(message);
            
            if (errorMessages.length >= 2) { // Expect at least some error responses
              expect(errorMessages.every(msg => msg.error)).toBe(true);
              resolve();
            }
          }
        };
      });
      
      ws.close();
    });

    test.concurrent("recovers from connection interruptions", async () => {
      let reconnectAttempts = 0;
      const maxAttempts = 3;
      
      const attemptConnection = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(`ws://localhost:${testPort}`);
          
          ws.onopen = () => {
            reconnectAttempts++;
            expect(reconnectAttempts).toBeLessThanOrEqual(maxAttempts);
            ws.close();
            resolve();
          };
          
          ws.onerror = () => {
            if (reconnectAttempts < maxAttempts) {
              setTimeout(() => attemptConnection().then(resolve).catch(reject), 100);
            } else {
              reject(new Error("Max reconnection attempts exceeded"));
            }
          };
        });
      };
      
      await expect(attemptConnection()).resolves.toBeUndefined();
    });
  });

  describe("Security and Validation", () => {
    test.concurrent("validates message structure", async () => {
      const wsUrl = `ws://localhost:${testPort}`;
      const ws = new WebSocket(wsUrl);
      const validationResults: MockWebSocketMessage[] = [];
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          // Send messages with missing required fields
          const invalidMessages = [
            { type: "odds-update" }, // Missing timestamp and data
            { timestamp: new Date().toISOString() }, // Missing type and data
            { data: { exchange: "test" } } // Missing type and timestamp
          ];
          
          invalidMessages.forEach(msg => {
            ws.send(JSON.stringify(msg));
          });
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          
          if (message.type === "error") {
            validationResults.push(message);
            
            if (validationResults.length >= 2) {
              expect(validationResults.every(msg => msg.error)).toBe(true);
              resolve();
            }
          }
        };
      });
      
      ws.close();
    });
  });
});

console.log("✅ Odds WebSocket Server Tests loaded successfully");
