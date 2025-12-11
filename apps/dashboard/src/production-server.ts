#!/usr/bin/env bun

/**
 * Production Server for Bun Dashboard
 * Serves both React SPA and API routes
 * Optimized for production deployment
 */

import { handleAPIRequest } from './api/router';
import { Database } from 'bun:sqlite';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database
const db = new Database(process.env.DATABASE_URL || ':memory:');

// Setup database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    symbol TEXT,
    profit REAL,
    risk REAL,
    timestamp INTEGER,
    status TEXT
  );
`);

// Insert sample data if table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM opportunities').get() as { count: number };
if (count.count === 0) {
  db.exec(`
    INSERT INTO opportunities VALUES
      ('arb-001', 'ESZ4', 1250.50, 0.02, ${Date.now()}, 'active'),
      ('arb-002', 'NQZ4', 890.75, 0.015, ${Date.now() - 300000}, 'active'),
      ('arb-003', 'CLZ4', 2100.25, 0.03, ${Date.now() - 600000}, 'claimed');
  `);
}

console.log(`🚀 Starting Bun Dashboard Production Server...`);
console.log(`📡 Server: http://${HOST}:${PORT}`);
console.log(`🎯 Health: http://${HOST}:${PORT}/health`);
console.log(`📊 API: http://${HOST}:${PORT}/api/*`);
console.log(`🌐 Frontend: http://${HOST}:${PORT}/`);
console.log(`📈 Metrics: http://${HOST}:${PORT}/api/metrics`);
console.log(`🔄 Press Ctrl+C to stop\n`);

Bun.serve({
  port: PORT,
  hostname: HOST,

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const startTime = Date.now();

    try {
      // Health check endpoint
      if (url.pathname === '/health') {
        return Response.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'production'
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // API routes
      if (url.pathname.startsWith('/api/')) {
        return handleAPIRequest(request);
      }

      // WebSocket routes
      if (url.pathname.startsWith('/ws')) {
        return handleAPIRequest(request);
      }

      // Serve static files from dist directory
      try {
        const filePath = url.pathname === '/' ? '/index.html' : url.pathname;
        const fullPath = `./dist${filePath}`;

        // Check if file exists
        const file = Bun.file(fullPath);
        const exists = await file.exists();

        if (exists) {
          // Determine content type
          const ext = filePath.split('.').pop()?.toLowerCase();
          const contentType = {
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'svg': 'image/svg+xml',
            'ico': 'image/x-icon',
            'woff': 'font/woff',
            'woff2': 'font/woff2'
          }[ext || ''] || 'text/plain';

          const headers = new Headers();
          headers.set('Content-Type', contentType);
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');

          return new Response(file, { headers });
        }
      } catch (error) {
        console.error('Static file error:', error);
      }

      // SPA fallback - serve index.html for client-side routing
      try {
        const indexFile = Bun.file('./dist/index.html');
        if (await indexFile.exists()) {
          return new Response(indexFile, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache'
            }
          });
        }
      } catch (error) {
        console.error('SPA fallback error:', error);
      }

      // 404 for unknown routes
      return Response.json({
        success: false,
        error: 'Not found',
        timestamp: Date.now()
      }, {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ Server Error:', error);

      return Response.json({
        success: false,
        error: 'Internal server error',
        timestamp: Date.now()
      }, {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
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

console.log(`✅ Production server running at http://${HOST}:${PORT}`);
console.log(`📚 API Documentation available at /api/health`);