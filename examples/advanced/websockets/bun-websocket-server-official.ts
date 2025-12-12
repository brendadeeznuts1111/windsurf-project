// ============================================================
// @example advanced/websockets: Official Bun WebSocket Types Demo
// Demonstrates Bun's official WebSocket API with proper type safety
// Based on official Bun.serve() WebSocket type definitions
// ============================================================

import type { Server, ServerWebSocket } from '../../../types/bun-websocket';

// Simple WebSocket server demonstrating official types
const wsServer = Bun.serve({
  port: 8080,
  fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade endpoint
    if (url.pathname === '/ws') {
      const success = server.upgrade(req);
      if (success) {
        return; // WebSocket upgrade successful
      }
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json({
        status: 'healthy',
        websocket_support: true,
        types_version: 'official'
      });
    }

    return new Response('WebSocket server running. Connect to /ws', {
      headers: { 'Content-Type': 'text/plain' }
    });
  },

  websocket: {
    // Connection opened - fully typed
    open(ws: ServerWebSocket) {
      console.log(`🔗 WebSocket connection opened from ${ws.remoteAddress}`);

      // Send welcome message with proper typing
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to Bun WebSocket server with official types!',
        features: ['pubsub', 'compression', 'typed-api'],
        timestamp: new Date().toISOString()
      }));
    },

    // Message received - fully typed
    message(ws: ServerWebSocket, message: string | ArrayBuffer | Uint8Array) {
      console.log(`📨 Received message type: ${typeof message}`);

      // Handle different message types
      if (typeof message === 'string') {
        try {
          const data = JSON.parse(message);
          console.log('📄 Parsed JSON message:', data);

          // Echo back with type information
          ws.send(JSON.stringify({
            type: 'echo',
            original: data,
            messageType: typeof message,
            timestamp: new Date().toISOString()
          }));
        } catch (e) {
          // Handle non-JSON messages
          ws.send(JSON.stringify({
            type: 'echo',
            original: message,
            messageType: typeof message,
            note: 'non-json message',
            timestamp: new Date().toISOString()
          }));
        }
      } else {
        // Handle binary messages
        const byteLength = message instanceof ArrayBuffer ? message.byteLength : message.byteLength;
        console.log(`📊 Received binary message: ${byteLength} bytes`);

        ws.send(JSON.stringify({
          type: 'binary_echo',
          byteLength,
          messageType: message.constructor.name,
          timestamp: new Date().toISOString()
        }));
      }
    },

    // Connection closed - fully typed
    close(ws: ServerWebSocket, code: number, reason: string) {
      console.log(`👋 WebSocket connection closed: code=${code}, reason="${reason}"`);
    },

    // Backpressure management - fully typed
    drain(ws: ServerWebSocket) {
      console.log(`💧 Backpressure relieved for ${ws.remoteAddress}`);
    },

    // WebSocket configuration with official types
    maxPayloadLength: 1024 * 1024, // 1MB
    idleTimeout: 300, // 5 minutes
    backpressureLimit: 64 * 1024, // 64KB
    closeOnBackpressureLimit: false,
    sendPings: true,
    publishToSelf: false,

    // Compression settings with official Compressor types
    perMessageDeflate: {
      compress: 'shared',
      decompress: 'shared'
    }
  },

  // Main server error handler
  error(error) {
    console.error('Server error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

// Server publish functionality demonstration
setInterval(() => {
  // Publish to all subscribers (if any)
  const published = wsServer.publish('announcements', JSON.stringify({
    type: 'server_announcement',
    message: 'Official Bun WebSocket types demo running!',
    timestamp: new Date().toISOString()
  }));

  if (published > 0) {
    console.log(`📢 Published announcement to ${published} subscribers`);
  }
}, 30000); // Every 30 seconds

console.log('🚀 Official Bun WebSocket Server with Types');
console.log(`📡 Server running on port ${wsServer.port}`);
console.log('🔗 WebSocket endpoint: ws://localhost:8080/ws');
console.log('🏥 Health check: http://localhost:8080/health');
console.log('');
console.log('💡 Test with:');
console.log('   • Send JSON: {"message": "hello"}');
console.log('   • Send text: "plain text message"');
console.log('   • Send binary: (use binary WebSocket client)');
console.log('');
console.log('⚡ Features demonstrated:');
console.log('   • Official ServerWebSocket types');
console.log('   • Proper message type handling');
console.log('   • Compression configuration');
console.log('   • Backpressure management');
console.log('   • Connection lifecycle events');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  wsServer.stop();
  console.log('✅ Server stopped gracefully');
  process.exit(0);
});

export { wsServer };