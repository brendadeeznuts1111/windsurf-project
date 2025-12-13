/**
 * Clean Bun WebSocket Implementation
 * Following Bun documentation best practices
 * DOMAIN: websocket.bun-native
 * STATUS: reference-implementation
 */

/// <reference types="@cloudflare/workers-types" />

import { describe, test, expect } from "bun:test";

// WebSocket message types
interface WSMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WSData {
  id: string;
  username: string;
  connectedAt: number;
  subscriptions: Set<string>;
}

// Clean WebSocket server implementation
export function createWebSocketServer(port: number = 3000) {
  const server = Bun.serve({
    port,
    fetch(req, server) {
      const url = new URL(req.url);

      // WebSocket upgrade endpoint
      if (url.pathname === '/ws') {
        const username = url.searchParams.get('username') || 'anonymous';

        const success = server.upgrade(req, {
          data: {
            id: crypto.randomUUID(),
            username,
            connectedAt: Date.now(),
            subscriptions: new Set<string>()
          } as WSData
        });

        return success
          ? undefined
          : new Response('WebSocket upgrade failed', { status: 400 });
      }

      // Health check endpoint
      if (url.pathname === '/health') {
        return Response.json({
          status: 'healthy',
          websocket: {
            port: server.port,
            protocol: 'bun-native'
          },
          timestamp: new Date().toISOString()
        });
      }

      return new Response('Not Found', { status: 404 });
    },

    websocket: {
      // Proper typing for WebSocket data
      data: {} as WSData,

      // Message handler with proper typing
      message(ws, message) {
        try {
          const data = ws.data as WSData;
          const parsed: WSMessage = JSON.parse(message.toString());

          console.log(`📨 Message from ${data.username}:`, parsed.type);

          switch (parsed.type) {
            case 'subscribe':
              handleSubscribe(ws, parsed.data.channel);
              break;
            case 'unsubscribe':
              handleUnsubscribe(ws, parsed.data.channel);
              break;
            case 'broadcast':
              handleBroadcast(ws, parsed.data.message);
              break;
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.close(1003, 'Invalid message format');
        }
      },

      // Connection opened
      open(ws) {
        const data = ws.data as WSData;
        console.log(`🔗 ${data.username} connected (${data.id})`);

        // Subscribe to default channels
        ws.subscribe('general');
        data.subscriptions.add('general');

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'welcome',
          data: {
            id: data.id,
            username: data.username,
            channels: Array.from(data.subscriptions)
          },
          timestamp: Date.now()
        }));

        // Broadcast join message
        server.publish('general', JSON.stringify({
          type: 'user-joined',
          data: { username: data.username },
          timestamp: Date.now()
        }));
      },

      // Connection closed
      close(ws, code, reason) {
        const data = ws.data as WSData;
        console.log(`❌ ${data.username} disconnected (${code}: ${reason})`);

        // Broadcast leave message
        server.publish('general', JSON.stringify({
          type: 'user-left',
          data: { username: data.username },
          timestamp: Date.now()
        }));
      },

      // Backpressure handling
      drain(ws) {
        const data = ws.data as WSData;
        console.log(`🚰 Backpressure relieved for ${data.username}`);
      }
    },

    // Compression configuration (per Bun docs)
    perMessageDeflate: {
      compress: "shared",
      decompress: "shared"
    }
  });

  console.log(`🚀 WebSocket server listening on port ${server.port}`);
  return server;
}

// Message handlers
function handleSubscribe(ws: any, channel: string) {
  const data = ws.data as WSData;
  ws.subscribe(channel);
  data.subscriptions.add(channel);

  ws.send(JSON.stringify({
    type: 'subscribed',
    data: { channel },
    timestamp: Date.now()
  }));
}

function handleUnsubscribe(ws: any, channel: string) {
  const data = ws.data as WSData;
  ws.unsubscribe(channel);
  data.subscriptions.delete(channel);

  ws.send(JSON.stringify({
    type: 'unsubscribed',
    data: { channel },
    timestamp: Date.now()
  }));
}

function handleBroadcast(ws: any, message: string) {
  const data = ws.data as WSData;

  // Broadcast to all subscribers
  ws.publish('general', JSON.stringify({
    type: 'broadcast',
    data: {
      from: data.username,
      message
    },
    timestamp: Date.now()
  }));
}

// Test the WebSocket implementation
describe.concurrent('Bun WebSocket Server', () => {
  test('server starts successfully', () => {
    const server = createWebSocketServer(0); // Use random port
    expect(server.port).toBeGreaterThan(0);
    server.stop();
  });

  test('health endpoint works', async () => {
    const server = createWebSocketServer(0);
    const port = server.port;

    try {
      const response = await fetch(`http://localhost:${port}/health`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.status).toBe('healthy');
      expect(data.websocket.port).toBe(port);
      expect(data.websocket.protocol).toBe('bun-native');
    } finally {
      server.stop();
    }
  });

  test('WebSocket upgrade works', async () => {
    const server = createWebSocketServer(0);
    const port = server.port;

    try {
      const ws = new WebSocket(`ws://localhost:${port}/ws?username=testuser`);

      await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
        setTimeout(() => reject(new Error('Connection timeout')), 1000);
      });

      expect(ws.readyState).toBe(WebSocket.OPEN);

      // Test ping/pong
      ws.send(JSON.stringify({ type: 'ping' }));

      const pongMessage = await new Promise((resolve, reject) => {
        ws.onmessage = (event) => resolve(JSON.parse(event.data.toString()));
        setTimeout(() => reject(new Error('Pong timeout')), 1000);
      });

      expect(pongMessage.type).toBe('pong');

      ws.close();
    } finally {
      server.stop();
    }
  });

  test('WebSocket message handling', async () => {
    const server = createWebSocketServer(0);
    const port = server.port;

    try {
      const ws = new WebSocket(`ws://localhost:${port}/ws?username=testuser`);

      await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
        setTimeout(() => reject(new Error('Connection timeout')), 1000);
      });

      // Test subscribe
      ws.send(JSON.stringify({ type: 'subscribe', data: { channel: 'test' } }));

      const subscribeResponse = await new Promise((resolve, reject) => {
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data.toString());
          if (data.type === 'subscribed') resolve(data);
        };
        setTimeout(() => reject(new Error('Subscribe timeout')), 1000);
      });

      expect(subscribeResponse.type).toBe('subscribed');
      expect(subscribeResponse.data.channel).toBe('test');

      ws.close();
    } finally {
      server.stop();
    }
  });
});

// Export for use in other files
export { createWebSocketServer };
export type { WSMessage, WSData };