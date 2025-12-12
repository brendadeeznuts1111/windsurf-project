#!/usr/bin/env bun

/**
 * Unified Bun Dashboard Server
 * High-performance HTTP + WebSocket server using Bun.serve()
 * Provides RESTful endpoints and real-time telemetry streaming
 */

import { handleAPIRequest } from './api/router';
import type { ServerWebSocket } from 'bun';

const PORT = parseInt(process.env.PORT || '6969');
const HOST = process.env.HOST || 'localhost';

// WebSocket client tracking
interface WSClient {
  id: string;
  subscriptions: Set<string>;
  connectedAt: number;
}

const wsClients = new Map<ServerWebSocket<WSClient>, WSClient>();
let messageSequence = 0;

console.log(`🚀 Starting Unified Bun Dashboard Server...`);
console.log(`📡 HTTP Server: http://${HOST}:${PORT}`);
console.log(`🔌 WebSocket: ws://${HOST}:${PORT}/ws`);
console.log(`📊 Health: http://${HOST}:${PORT}/api/health`);
console.log(`📈 Metrics: http://${HOST}:${PORT}/api/metrics`);
console.log(`🎯 Opportunities: http://${HOST}:${PORT}/api/opportunities`);
console.log(`🔄 Press Ctrl+C to stop\n`);

const server = Bun.serve<WSClient>({
  port: PORT,
  hostname: HOST,

  async fetch(request: Request, server): Promise<Response> {
    const url = new URL(request.url);
    const startTime = Date.now();

    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
          }
        });
      }

      // WebSocket upgrade for /ws endpoint
      if (url.pathname === '/ws') {
        const clientId = `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const upgraded = server.upgrade(request, {
          data: {
            id: clientId,
            subscriptions: new Set<string>(),
            connectedAt: Date.now()
          }
        });

        if (upgraded) {
          return undefined as unknown as Response; // Bun handles the upgrade
        }

        return Response.json({
          success: false,
          error: 'WebSocket upgrade failed',
          timestamp: Date.now()
        }, { status: 400 });
      }

      // Route HTTP requests through API router
      const response = handleAPIRequest(request);

      // Add CORS and timing headers
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      headers.set('X-Powered-By', 'Bun v1.3.4 + URLPattern + WebSocket');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

    } catch (error) {
      console.error('❌ Server Error:', error);

      return Response.json({
        success: false,
        error: 'Internal server error',
        timestamp: Date.now()
      }, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }
  },

  websocket: {
    open(ws) {
      const client = ws.data;
      wsClients.set(ws, client);

      console.log(`🔌 WebSocket connected: ${client.id} (${wsClients.size} total clients)`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        data: {
          clientId: client.id,
          serverTime: Date.now(),
          pid: process.pid
        },
        timestamp: Date.now(),
        sequence: messageSequence++
      }));
    },

    message(ws, message) {
      const client = ws.data;

      try {
        const msg = JSON.parse(message.toString());

        switch (msg.type) {
          case 'subscribe':
            if (msg.data?.channel) {
              client.subscriptions.add(msg.data.channel);
              ws.subscribe(msg.data.channel);
              console.log(`📢 ${client.id} subscribed to: ${msg.data.channel}`);

              ws.send(JSON.stringify({
                type: 'subscribed',
                data: { channel: msg.data.channel },
                timestamp: Date.now(),
                sequence: messageSequence++
              }));
            }
            break;

          case 'unsubscribe':
            if (msg.data?.channel) {
              client.subscriptions.delete(msg.data.channel);
              ws.unsubscribe(msg.data.channel);
              console.log(`🔕 ${client.id} unsubscribed from: ${msg.data.channel}`);
            }
            break;

          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              data: { clientTime: msg.data?.clientTime, serverTime: Date.now() },
              timestamp: Date.now(),
              sequence: messageSequence++
            }));
            break;

          default:
            console.log(`📨 Message from ${client.id}:`, msg.type);
        }
      } catch (err) {
        console.error(`❌ Failed to parse WebSocket message:`, err);
      }
    },

    close(ws, code, reason) {
      const client = ws.data;
      wsClients.delete(ws);
      console.log(`🔌 WebSocket disconnected: ${client.id} (code: ${code}, ${wsClients.size} remaining)`);
    },

    error(ws, error) {
      console.error(`❌ WebSocket error for ${ws.data.id}:`, error);
    },

    // Performance settings
    perMessageDeflate: false, // Disable for lower latency
    maxPayloadLength: 16 * 1024 * 1024, // 16MB max message
    idleTimeout: 120, // 2 minute idle timeout
  },

  error(error: Error) {
    console.error('💥 Server Error:', error);
    return Response.json({
      success: false,
      error: 'Server error occurred',
      timestamp: Date.now()
    }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────────────────
// Telemetry Broadcasting
// ─────────────────────────────────────────────────────────────────

/**
 * Broadcast telemetry data to all subscribed clients
 */
export function broadcastTelemetry(channel: string, data: any): void {
  const message = JSON.stringify({
    type: 'telemetry',
    channel,
    data,
    timestamp: Date.now(),
    sequence: messageSequence++,
    pid: process.pid
  });

  server.publish(channel, message);
}

/**
 * Broadcast to all connected clients
 */
export function broadcastAll(type: string, data: any): void {
  const message = JSON.stringify({
    type,
    data,
    timestamp: Date.now(),
    sequence: messageSequence++,
    pid: process.pid
  });

  for (const [ws] of wsClients) {
    ws.send(message);
  }
}

/**
 * Get connected client count
 */
export function getClientCount(): number {
  return wsClients.size;
}

/**
 * Get server stats
 */
export function getServerStats() {
  return {
    clients: wsClients.size,
    messagesSent: messageSequence,
    uptime: process.uptime(),
    pid: process.pid,
    port: PORT
  };
}

// ─────────────────────────────────────────────────────────────────
// Mock Telemetry Stream (for demo - replace with real telemetry)
// ─────────────────────────────────────────────────────────────────

let tickCount = 0;
const DEMO_SYMBOLS = ['ESZ4', 'NQZ4', 'CLZ4', 'GCZ4', 'BTCUSD', 'ETHUSD'];

function generateMockTick() {
  const symbol = DEMO_SYMBOLS[Math.floor(Math.random() * DEMO_SYMBOLS.length)];
  const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 2500 : 4500;

  return {
    tick_id: ++tickCount,
    market_id: symbol,
    price: basePrice + (Math.random() - 0.5) * 100,
    volume: Math.floor(Math.random() * 1000) + 1,
    bid: basePrice + (Math.random() - 0.5) * 100 - 0.5,
    ask: basePrice + (Math.random() - 0.5) * 100 + 0.5,
    tick_timestamp: Date.now() * 1_000_000, // nanoseconds
    pid_context: {
      pid: process.pid,
      parent_pid: process.ppid,
      instance_id: `dashboard_${process.pid}`
    },
    telemetry: {
      ingest_latency_ns: Math.floor(Math.random() * 500) + 100,
      queue_depth: Math.floor(Math.random() * 10),
      buffer_utilization: Math.random() * 30
    }
  };
}

// Start mock telemetry stream
const TICK_INTERVAL = 100; // 10 ticks per second

setInterval(() => {
  if (wsClients.size > 0) {
    const tick = generateMockTick();
    broadcastTelemetry('market-ticks', tick);

    // Broadcast metrics every 10 ticks
    if (tickCount % 10 === 0) {
      broadcastTelemetry('metrics', {
        ticks_processed: tickCount,
        clients_connected: wsClients.size,
        uptime_seconds: process.uptime(),
        memory_mb: process.memoryUsage().heapUsed / 1024 / 1024
      });
    }
  }
}, TICK_INTERVAL);

// ─────────────────────────────────────────────────────────────────
// ORCA Dashboard Real-time Updates
// ─────────────────────────────────────────────────────────────────

/**
 * Broadcast ORCA package updates
 */
export function broadcastOrcaUpdate(data: any): void {
  broadcastTelemetry('orca-packages', data);
}

/**
 * Broadcast ORCA registry status
 */
export function broadcastOrcaRegistry(data: any): void {
  broadcastTelemetry('orca-registries', data);
}

// ─────────────────────────────────────────────────────────────────
// Azure DevOps Real-time Updates
// ─────────────────────────────────────────────────────────────────

/**
 * Broadcast Azure build status updates
 */
export function broadcastAzureBuild(data: any): void {
  broadcastTelemetry('azure-builds', data);
}

/**
 * Broadcast Azure work item updates
 */
export function broadcastAzureWorkItem(data: any): void {
  broadcastTelemetry('azure-work-items', data);
}

/**
 * Broadcast Azure PR updates
 */
export function broadcastAzurePR(data: any): void {
  broadcastTelemetry('azure-prs', data);
}

// Start periodic ORCA stats broadcast
setInterval(() => {
  if (wsClients.size > 0) {
    broadcastTelemetry('orca-stats', {
      timestamp: Date.now(),
      totalPackages: 11,
      activeConnections: wsClients.size
    });
  }
}, 5000); // Every 5 seconds

console.log(`✅ Unified Server running at http://${HOST}:${PORT}`);
console.log(`🔌 WebSocket available at ws://${HOST}:${PORT}/ws`);
console.log(`📊 Broadcasting telemetry every ${TICK_INTERVAL}ms when clients connected`);
console.log(`🐋 ORCA Dashboard channels: orca-packages, orca-registries, orca-stats`);
console.log(`☁️ Azure DevOps channels: azure-builds, azure-work-items, azure-prs`);

export { server };
