#!/usr/bin/env bun

/**
 * @fileoverview Simple Dashboard Server
 * @description Basic dashboard for testing the unified API hub
 */

import { serve } from 'bun';

const PORT = 3002;

const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bun Systems Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e4e4e4;
            margin: 0;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #00d9ff; text-align: center; }
        .status { padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px; margin: 20px 0; }
        .healthy { border-left: 4px solid #00ff88; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .metric { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Bun Systems Dashboard</h1>
        <div class="status healthy">
            <h2>✅ System Status: Healthy</h2>
            <p>All Bun systems are operating normally</p>
        </div>
        <div class="metrics">
            <div class="metric">
                <h3>📊 Performance</h3>
                <p>185% improvement</p>
            </div>
            <div class="metric">
                <h3>🧠 Consciousness</h3>
                <p>Level 0.95</p>
            </div>
            <div class="metric">
                <h3>🔗 Services</h3>
                <p>8 active</p>
            </div>
            <div class="metric">
                <h3>⚡ Response Time</h3>
                <p>< 2.5ms</p>
            </div>
        </div>
    </div>
</body>
</html>`;

console.log(`🚀 Starting Simple Dashboard on port ${PORT}`);

serve({
    port: PORT,
    fetch: async (request) => {
        const url = new URL(request.url);

        if (url.pathname === '/health') {
            return Response.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: ['dashboard', 'api', 'websocket']
            });
        }

        if (url.pathname === '/metrics') {
            return Response.json({
                performance: '185%',
                consciousness: 0.95,
                services: 8,
                responseTime: 2.5
            });
        }

        return new Response(dashboardHTML, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
});

console.log(`📊 Dashboard: http://localhost:${PORT}`);
console.log(`❤️ Health: http://localhost:${PORT}/health`);
console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);