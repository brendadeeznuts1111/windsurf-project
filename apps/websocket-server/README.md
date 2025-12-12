# Windsurf WebSocket Server

Real-time WebSocket server for data streaming with tick processing and client management. Built with Bun-native WebSocket APIs for high-performance real-time communication.

## Features

- 🚀 **Bun-native WebSockets**: High-performance WebSocket server
- 📊 **Channel-based Messaging**: Subscribe/unsubscribe to data channels
- ⏱️ **Tick Streaming**: Real-time data ticks for various channels
- 👥 **Client Management**: Connection tracking and automatic cleanup
- 🏥 **Health Monitoring**: System health and connection status
- 🔄 **Auto-reconnect**: Client timeout and cleanup mechanisms
- 📈 **Metrics Integration**: Real-time system metrics streaming

## Quick Start

```bash
# Install dependencies
bun install

# Start the server
bun run start

# Development mode with hot reload
bun run dev
```

The WebSocket server will listen on `ws://localhost:8080/ws` and HTTP health check on `http://localhost:8080/health`.

## Available Channels

### market-ticks
Real-time market data simulation
```json
{
  "symbol": "AAPL",
  "price": 150.25,
  "volume": 500,
  "change": 2.5,
  "bid": 150.20,
  "ask": 150.30
}
```

### system-metrics
Live system performance metrics
```json
{
  "cpu": 45.2,
  "memory": 67.8,
  "disk": 23.1,
  "network_rx": 150.5,
  "network_tx": 89.3,
  "connections": 42
}
```

### health-status
System health and tension scoring
```json
{
  "tension_score": 25,
  "status": "healthy",
  "events": 12,
  "peak_tension": 85
}
```

### user-activity
Real-time user activity metrics
```json
{
  "active_users": 1250,
  "new_registrations": 5,
  "page_views": 89,
  "api_calls": 234
}
```

### analytics-updates
Analytics and business metrics
```json
{
  "total_users": 1050,
  "total_posts": 5200,
  "engagement_rate": 78.5,
  "conversion_rate": 3.2
}
```

## WebSocket Protocol

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
```

### Messages

#### Server Messages
```javascript
// Welcome message (sent on connection)
{
  "type": "welcome",
  "client_id": "uuid-v7-identifier",
  "channels": ["market-ticks", "system-metrics", ...],
  "timestamp": 1234567890123
}

// Data message
{
  "type": "data",
  "channel": "market-ticks",
  "data": { ... },
  "timestamp": 1234567890123
}

// Subscription confirmation
{
  "type": "subscribed",
  "channel": "market-ticks",
  "timestamp": 1234567890123
}
```

#### Client Messages
```javascript
// Subscribe to channel
{
  "type": "subscribe",
  "channel": "market-ticks",
  "timestamp": 1234567890123
}

// Unsubscribe from channel
{
  "type": "unsubscribe",
  "channel": "market-ticks",
  "timestamp": 1234567890123
}

// Ping (keep-alive)
{
  "type": "ping",
  "timestamp": 1234567890123
}
```

## JavaScript Client Example

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  console.log('Connected to Windsurf WebSocket server');

  // Subscribe to market ticks
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'market-ticks',
    timestamp: Date.now()
  }));

  // Subscribe to system metrics
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'system-metrics',
    timestamp: Date.now()
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'welcome':
      console.log('Client ID:', message.client_id);
      break;
    case 'data':
      console.log(`Received ${message.channel} data:`, message.data);
      break;
    case 'subscribed':
      console.log(`Subscribed to ${message.channel}`);
      break;
  }
};

ws.onclose = () => {
  console.log('Disconnected from server');
};

// Keep-alive ping every 30 seconds
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'ping',
      timestamp: Date.now()
    }));
  }
}, 30000);
```

## HTTP Endpoints

### Health Check
```http
GET /health
```

Returns server status and connection information:

```json
{
  "status": "healthy",
  "clients": 5,
  "channels": 3,
  "uptime": 3600.5,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Architecture

### Client Management
- **Connection Tracking**: Each client gets a unique UUID
- **Channel Subscriptions**: Clients can subscribe to multiple channels
- **Activity Monitoring**: Automatic cleanup of inactive connections
- **Timeout Handling**: 30-second inactivity timeout

### Tick Streaming
- **Channel-based**: Different data types on separate channels
- **Configurable Rates**: Different update frequencies per channel
- **Real-time**: Immediate broadcasting to subscribed clients
- **Efficient**: Minimal overhead for high-frequency updates

### Performance Features
- **Bun-native**: Direct WebSocket API usage
- **Zero-copy**: Efficient message handling
- **Connection Pooling**: Optimized for many concurrent connections
- **Memory Efficient**: Automatic cleanup and resource management

## Configuration

The server uses the following defaults:

- **WebSocket Port**: 8080
- **HTTP Port**: 8080 (same port, different endpoints)
- **Client Timeout**: 30 seconds
- **Tick Intervals**: 100ms - 5000ms depending on channel

## Development

```bash
# Run tests
bun test

# Type checking
bun run typecheck

# Linting
bun run lint

# Build for production
bun run build
```

## Built with Windsurf APIs

This server demonstrates:

- **Bun.serve WebSocket**: Native WebSocket server implementation
- **Bun UUID**: Client identification and message tracking
- **Metrics Collector**: System monitoring integration
- **Tension Engine**: Health status monitoring
- **Channel Management**: Real-time data distribution

## Monitoring

The server provides real-time monitoring through:

- Connection counts and channel subscriptions
- Message throughput and latency
- System resource usage
- Client activity and health status

## License

MIT