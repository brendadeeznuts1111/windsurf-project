# Advanced WebSockets

Demonstrates Bun's official WebSocket API with full type safety and advanced features.

## Features Demonstrated

- **Official TypeScript Types**: Using Bun's official `ServerWebSocket` and `Server` types
- **Message Type Handling**: Support for string, ArrayBuffer, and Uint8Array messages
- **Compression**: Per-message deflate compression with configurable settings
- **Backpressure Management**: Automatic handling of connection backpressure
- **Connection Lifecycle**: Open, message, close, and drain event handlers
- **Pub/Sub System**: Server-side publish/subscribe functionality
- **Health Monitoring**: Built-in health check endpoint

## Usage

```bash
bun run examples/advanced/websockets/bun-websocket-server-official.ts
```

This starts a WebSocket server on port 8080 with the following endpoints:

### WebSocket Endpoints
- **`ws://localhost:8080/ws`** - Main WebSocket connection endpoint
- **`http://localhost:8080/health`** - Health check and server statistics

### Test Commands
```bash
# Connect with wscat
wscat -c ws://localhost:8080/ws

# Send JSON message
{"type": "test", "message": "Hello WebSocket!"}

# Send plain text
Hello from text message!

# Check health
curl http://localhost:8080/health
```

## WebSocket Configuration

The server demonstrates all major WebSocket configuration options:

```typescript
websocket: {
  // Message handling
  message(ws, message) { /* handle messages */ },
  open(ws) { /* connection opened */ },
  close(ws, code, reason) { /* connection closed */ },
  drain(ws) { /* backpressure relieved */ },

  // Performance settings
  maxPayloadLength: 1024 * 1024, // 1MB max payload
  idleTimeout: 300, // 5 minute timeout
  backpressureLimit: 64 * 1024, // 64KB backpressure limit

  // Protocol settings
  sendPings: true, // Keep connections alive
  publishToSelf: false, // Don't echo to sender

  // Compression
  perMessageDeflate: {
    compress: 'shared',
    decompress: 'shared'
  }
}
```

## Message Types Supported

### JSON Messages
```json
{
  "type": "chat",
  "message": "Hello WebSocket!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Binary Messages
- `ArrayBuffer`: Raw binary data
- `Uint8Array`: Typed binary arrays
- Automatic type detection and handling

### Plain Text Messages
```
Hello from plain text message!
```

## Advanced Features

### Compression
- **Per-Message Deflate**: Automatic compression/decompression
- **Compression Levels**: `disable`, `shared`, `dedicated`, and size-specific options
- **Performance**: Significant bandwidth savings for text-heavy applications

### Backpressure Management
- **Automatic Handling**: Server manages connection backpressure
- **Drain Events**: Notification when backpressure is relieved
- **Configurable Limits**: Customizable backpressure thresholds

### Pub/Sub System
```typescript
// Server-side publishing
server.publish('topic', 'message', compress);

// Client-side subscription
ws.subscribe('topic');
ws.unsubscribe('topic');
ws.publish('topic', 'message');
```

### Connection Management
- **Connection Tracking**: Monitor active connections and statistics
- **Graceful Shutdown**: Proper cleanup on server termination
- **Health Monitoring**: Real-time server health and performance metrics

## Type Safety

This example uses Bun's official WebSocket types for complete type safety:

```typescript
import type { Server, ServerWebSocket } from '../../../types/bun-websocket';

// Fully typed WebSocket handlers
open(ws: ServerWebSocket) { /* ... */ }
message(ws: ServerWebSocket, message: string | ArrayBuffer | Uint8Array) { /* ... */ }
close(ws: ServerWebSocket, code: number, reason: string) { /* ... */ }
```

## Performance Characteristics

- **Zero-Copy Operations**: Efficient message passing without copying
- **Low Latency**: Minimal overhead for WebSocket operations
- **Scalable**: Supports thousands of concurrent connections
- **Memory Efficient**: Optimized memory usage for long-running connections

## Related Examples

- Core: HTTP Server (#21) - Basic HTTP server implementation
- Advanced: Error Handling (#??) - Error handling patterns
- Ecosystem: Redis (#49) - Pub/Sub with Redis backend

## Production Considerations

- **Connection Limits**: Monitor and limit concurrent connections
- **Message Validation**: Always validate incoming messages
- **Rate Limiting**: Implement connection and message rate limits
- **Monitoring**: Track connection metrics and performance
- **Security**: Use TLS in production environments
- **Load Balancing**: Consider distributing WebSocket connections across multiple servers