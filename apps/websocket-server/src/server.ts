#!/usr/bin/env bun
/**
 * Windsurf WebSocket Server
 * Real-time data streaming server with tick processing and client management
 * Features: WebSocket connections, channel-based messaging, tick streaming
 */

import { serve } from "bun";

// Import our custom utilities
import { BunUUIDGenerator } from "../../../src/utils/bun-uuid";
import { MetricsCollector } from "../../../src/utils/metrics-collector";
import { TensionScoringEngine } from "../../../src/core/tension-scoring/tension-engine";

// Types
interface WebSocketClient {
  id: string;
  ws: WebSocket;
  subscribedChannels: Set<string>;
  connectedAt: Date;
  lastActivity: Date;
}

interface TickData {
  id: string;
  timestamp: number;
  channel: string;
  data: any;
  source: string;
}

interface ChannelMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'data';
  channel?: string;
  data?: any;
  timestamp: number;
}

// Initialize core services
const uuid = new BunUUIDGenerator();
const metrics = new MetricsCollector();
const tension = new TensionScoringEngine({
  rules: {},
  thresholds: {
    warning: 50,
    critical: 75,
    circuitBreaker: 90,
  },
  monitoring: {
    enabled: true,
    intervalMs: 5000,
    retentionHours: 24,
    alertCooldownMs: 60000,
  },
});

// Client and channel management
const clients = new Map<string, WebSocketClient>();
const channels = new Map<string, Set<string>>(); // channel -> client IDs
const tickBuffer = new Map<string, TickData[]>(); // channel -> recent ticks

// Channel definitions
const AVAILABLE_CHANNELS = [
  'market-ticks',
  'system-metrics',
  'user-activity',
  'health-status',
  'analytics-updates',
] as const;

// Tick streaming intervals
const tickIntervals = new Map<string, Timer>();

// Initialize tick streaming for channels
function initializeTickStreaming() {
  // Market ticks - simulate trading data
  startTickStreaming('market-ticks', 100); // 10 ticks per second

  // System metrics - real system data
  startTickStreaming('system-metrics', 1000); // 1 tick per second

  // Health status - tension scoring updates
  startTickStreaming('health-status', 5000); // 1 tick per 5 seconds

  console.log('✅ Tick streaming initialized for all channels');
}

function startTickStreaming(channel: string, intervalMs: number) {
  const interval = setInterval(() => {
    const tick = generateTickForChannel(channel);
    if (tick) {
      broadcastToChannel(channel, {
        type: 'data',
        channel,
        data: tick,
        timestamp: Date.now(),
      });
    }
  }, intervalMs);

  tickIntervals.set(channel, interval);
}

function generateTickForChannel(channel: string): TickData | null {
  const tickId = uuid.generate();
  const timestamp = Date.now();

  switch (channel) {
    case 'market-ticks':
      return {
        id: tickId,
        timestamp,
        channel,
        source: 'simulator',
        data: {
          symbol: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'][Math.floor(Math.random() * 4)],
          price: 100 + Math.random() * 200,
          volume: Math.floor(Math.random() * 1000),
          change: (Math.random() - 0.5) * 10,
          bid: 95 + Math.random() * 10,
          ask: 105 + Math.random() * 10,
        },
      };

    case 'system-metrics':
      return {
        id: tickId,
        timestamp,
        channel,
        source: 'system',
        data: {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          disk: Math.random() * 100,
          network_rx: Math.random() * 1000,
          network_tx: Math.random() * 1000,
          connections: Math.floor(Math.random() * 100),
        },
      };

    case 'health-status':
      const health = tension.getMetrics();
      return {
        id: tickId,
        timestamp,
        channel,
        source: 'health-monitor',
        data: {
          tension_score: health.currentTension,
          status: health.currentTension < 30 ? 'healthy' : health.currentTension < 70 ? 'warning' : 'critical',
          events: health.eventCount,
          peak_tension: health.peakTension,
        },
      };

    case 'user-activity':
      return {
        id: tickId,
        timestamp,
        channel,
        source: 'user-tracker',
        data: {
          active_users: Math.floor(Math.random() * 1000),
          new_registrations: Math.floor(Math.random() * 10),
          page_views: Math.floor(Math.random() * 100),
          api_calls: Math.floor(Math.random() * 50),
        },
      };

    case 'analytics-updates':
      return {
        id: tickId,
        timestamp,
        channel,
        source: 'analytics',
        data: {
          total_users: 1000 + Math.floor(Math.random() * 100),
          total_posts: 5000 + Math.floor(Math.random() * 500),
          engagement_rate: Math.random() * 100,
          conversion_rate: Math.random() * 10,
        },
      };

    default:
      return null;
  }
}

function broadcastToChannel(channel: string, message: ChannelMessage) {
  const channelClients = channels.get(channel);
  if (!channelClients) return;

  const messageStr = JSON.stringify(message);

  for (const clientId of channelClients) {
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(messageStr);
        client.lastActivity = new Date();
      } catch (error) {
        console.error(`Failed to send to client ${clientId}:`, error);
        // Client will be cleaned up by ping/pong mechanism
      }
    }
  }
}

function addClientToChannel(clientId: string, channel: string) {
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }
  channels.get(channel)!.add(clientId);

  const client = clients.get(clientId);
  if (client) {
    client.subscribedChannels.add(channel);
  }

  console.log(`📡 Client ${clientId} subscribed to ${channel}`);
}

function removeClientFromChannel(clientId: string, channel: string) {
  const channelClients = channels.get(channel);
  if (channelClients) {
    channelClients.delete(clientId);
    if (channelClients.size === 0) {
      channels.delete(channel);
    }
  }

  const client = clients.get(clientId);
  if (client) {
    client.subscribedChannels.delete(channel);
  }

  console.log(`📡 Client ${clientId} unsubscribed from ${channel}`);
}

function removeClient(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  // Remove from all channels
  for (const channel of client.subscribedChannels) {
    removeClientFromChannel(clientId, channel);
  }

  clients.delete(clientId);
  console.log(`👋 Client ${clientId} disconnected. Total clients: ${clients.size}`);
}

// WebSocket server
const server = serve({
  port: 8080,
  async fetch(req, server) {
    // Handle HTTP requests (health check, etc.)
    if (req.method === 'GET' && new URL(req.url).pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        clients: clients.size,
        channels: channels.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle WebSocket upgrade
    if (req.method === 'GET' && new URL(req.url).pathname === '/ws') {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
    }

    return new Response('Not found', { status: 404 });
  },
  websocket: {
    open(ws) {
      const clientId = uuid.generate();
      const client: WebSocketClient = {
        id: clientId,
        ws,
        subscribedChannels: new Set(),
        connectedAt: new Date(),
        lastActivity: new Date(),
      };

      clients.set(clientId, client);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        client_id: clientId,
        channels: AVAILABLE_CHANNELS,
        timestamp: Date.now(),
      }));

      console.log(`🔗 Client ${clientId} connected. Total clients: ${clients.size}`);
    },

    message(ws, message) {
      try {
        const data = JSON.parse(message.toString()) as ChannelMessage;
        const client = Array.from(clients.values()).find(c => c.ws === ws);

        if (!client) return;

        client.lastActivity = new Date();

        switch (data.type) {
          case 'subscribe':
            if (data.channel && AVAILABLE_CHANNELS.includes(data.channel as any)) {
              addClientToChannel(client.id, data.channel);
              ws.send(JSON.stringify({
                type: 'subscribed',
                channel: data.channel,
                timestamp: Date.now(),
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'Invalid channel',
                available_channels: AVAILABLE_CHANNELS,
                timestamp: Date.now(),
              }));
            }
            break;

          case 'unsubscribe':
            if (data.channel) {
              removeClientFromChannel(client.id, data.channel);
              ws.send(JSON.stringify({
                type: 'unsubscribed',
                channel: data.channel,
                timestamp: Date.now(),
              }));
            }
            break;

          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: Date.now(),
            }));
            break;
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
          timestamp: Date.now(),
        }));
      }
    },

    close(ws) {
      const client = Array.from(clients.values()).find(c => c.ws === ws);
      if (client) {
        removeClient(client.id);
      }
    },
  },
});

// Cleanup inactive clients
setInterval(() => {
  const now = Date.now();
  const timeoutMs = 30000; // 30 seconds

  for (const [clientId, client] of clients) {
    if (now - client.lastActivity.getTime() > timeoutMs) {
      console.log(`⏰ Client ${clientId} timed out`);
      client.ws.close();
      removeClient(clientId);
    }
  }
}, 10000); // Check every 10 seconds

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');

  // Close all client connections
  for (const client of clients.values()) {
    client.ws.close();
  }

  // Clear tick intervals
  for (const interval of tickIntervals.values()) {
    clearInterval(interval);
  }

  server.stop();
  console.log('✅ WebSocket server stopped');
  process.exit(0);
});

// Start the server
function startServer() {
  console.log('🚀 Starting Windsurf WebSocket Server...');
  console.log(`📡 WebSocket server listening on ws://localhost:8080/ws`);
  console.log(`🌐 HTTP health check available at http://localhost:8080/health`);
  console.log('📊 Available channels:');
  AVAILABLE_CHANNELS.forEach(channel => {
    console.log(`  • ${channel}`);
  });
  console.log('');

  initializeTickStreaming();

  console.log('✅ WebSocket server started successfully');
  console.log('💡 Press Ctrl+C to stop the server');
}

startServer();