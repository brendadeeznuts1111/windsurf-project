#!/usr/bin/env bun

/**
 * Simple Dashboard Server for Enhanced Team Dashboard
 * Serves the HTML dashboard and provides basic API endpoints for testing
 */

import { serve } from "bun";
import { readFileSync } from "fs";
import { join } from "path";

const PORT = 3001;

// Read the dashboard HTML file
const dashboardHTML = readFileSync(join(import.meta.dir, "enhanced-team-dashboard.html"), "utf-8");

// Mock data for testing
let mockMetrics = {
  totalRequests: 0,
  activeConnections: 0,
  errorRate: 0.00,
  uptime: 0,
  avgResponseTime: 0.00,
  memoryUsage: 0.00,
  cpuUsage: 0.00,
  throughput: 0.00
};

const startTime = Date.now();

// Update mock metrics periodically
setInterval(() => {
  mockMetrics.totalRequests += Math.floor(Math.random() * 10);
  mockMetrics.activeConnections = Math.floor(Math.random() * 5) + 1;
  mockMetrics.errorRate = Math.random() * 0.1;
  mockMetrics.uptime = Math.floor((Date.now() - startTime) / 1000);
  mockMetrics.avgResponseTime = 50 + Math.random() * 100;
  mockMetrics.memoryUsage = 100 + Math.random() * 200;
  mockMetrics.cpuUsage = Math.random() * 30;
  mockMetrics.throughput = Math.random() * 50;
}, 2000); // Update every 2 seconds

// WebSocket handler for real-time metrics
const wsHandler = {
  open(ws) {
    console.log("WebSocket client connected");
    ws.subscribe("metrics");

    // Send initial metrics
    ws.send(JSON.stringify({
      type: "metrics",
      data: mockMetrics,
      timestamp: Date.now()
    }));

    // Send periodic updates
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "metrics",
          data: mockMetrics,
          timestamp: Date.now()
        }));
      } else {
        clearInterval(interval);
      }
    }, 2000); // Send metrics every 2 seconds

    ws.data = { interval };
  },

  message(ws, message) {
    console.log("WebSocket message received:", message);
  },

  close(ws) {
    console.log("WebSocket client disconnected");
    if (ws.data?.interval) {
      clearInterval(ws.data.interval);
    }
  }
};

const server = serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    // Serve the dashboard HTML
    if (url.pathname === "/" || url.pathname === "/enhanced-team-dashboard.html") {
      return new Response(dashboardHTML, {
        headers: { "Content-Type": "text/html" }
      });
    }

    // Serve the WebSocket client JavaScript
    if (url.pathname === "/monitorWs.js") {
      const jsContent = readFileSync(join(import.meta.dir, "monitorWs.js"), "utf-8");
      return new Response(jsContent, {
        headers: { "Content-Type": "application/javascript" }
      });
    }

    // API endpoints
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000)
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/api/monitor/live") {
      return new Response(JSON.stringify(mockMetrics), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/api/metrics") {
      return new Response(JSON.stringify(mockMetrics), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 404 for unknown routes
    return new Response("Not Found", { status: 404 });
  },

  websocket: wsHandler
});

console.log(`🚀 Enhanced Team Dashboard Server running at http://localhost:${PORT}`);
console.log(`📊 WebSocket endpoint: ws://localhost:${PORT}/ws/metrics`);
console.log(`💚 Health check: http://localhost:${PORT}/health`);
console.log(`📈 API metrics: http://localhost:${PORT}/api/metrics`);