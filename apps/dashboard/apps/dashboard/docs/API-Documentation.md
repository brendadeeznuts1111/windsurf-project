# API Documentation

Generated from JSDoc comments in the codebase.

## MarketTelemetryDemo.tsx

### Files

**fileoverview** Market Telemetry Demo Component
**description** Interactive demonstration of Bun's PID-aware market data telemetry system
**author** Odds Protocol Team
**version** 1.0.0
**since** 2024


🔗 **See also:** [**link** TCPDemo] - Related TCP networking demonstration

🔗 **See also:** [**link** BunV13Demo] - Bun v1.3 enhanced features integration

🔗 **See also:** [**link** MarketTelemetry] - Core telemetry engine implementation

🔗 **See also:** [**link** PIDContext] - PID context management system

🔗 **See also:** [**link** AuditTrail] - Audit trail for telemetry operations

### Interfaces

#### TelemetryOperation

Telemetry operation data structure for display
**interface** TelemetryOperation
**property** {string} id - Unique operation identifier
**property** {string} type - Operation type (tick, batch, subscription)
**property** {string} marketId - Market identifier (e.g., 'ESZ4', 'BTC/USD')
**property** {number} pid - Process ID that generated the operation
**property** {number} timestamp - Operation timestamp in milliseconds
**property** {number} latency - Operation latency in nanoseconds
**property** {any} data - Additional operation data

### Classs

Market Telemetry Demo Component

Interactive demonstration of Bun's enterprise-grade market data telemetry system.
Showcases PID-aware tick processing, real-time analytics, and anomaly detection.

Features:
- Real-time market tick generation and processing
- PID context enrichment and attribution
- Rolling statistics and anomaly detection
- Interactive subscription management
- Performance monitoring and latency tracking

**component**

**Example:**
```typescript```tsx
<MarketTelemetryDemo />```

```

**Returns** (*React.FC*): The market telemetry demo component

### Methods

#### startTelemetry

Starts the telemetry tick generation process

Generates market ticks at the specified rate and records them through
the telemetry system with full PID context enrichment.

**method** startTelemetry
**private**
**Returns** (*void*): 
**Example:**
```typescript```
startTelemetry(); // Begins generating ticks at current tickRate```

```

#### runBatch

Processes a batch of market ticks through the telemetry system

Demonstrates batch processing capabilities with parallel tick enrichment
and performance monitoring.

**method** runBatch
**private**
**Returns** (*Promise<void>*): 
**Example:**
```typescript```
await runBatch(); // Processes 100 ticks in batch```

```

#### subscribeToMarket

Subscribes to real-time telemetry events for a specific market

Sets up a subscription to receive live market tick data with
full telemetry enrichment and PID context.

**method** subscribeToMarket
**private**
- **`marketId`** (*string*): The market identifier to subscribe to
**Returns** (*void*): 
**Example:**
```typescript```
subscribeToMarket('ESZ4'); // Subscribe to E-mini S&P 500 futures```

```

### Functions

Renders the Market Telemetry Demo component

Provides an interactive interface for:
- Starting/stopping telemetry tick generation
- Processing batch operations
- Managing market subscriptions
- Viewing real-time telemetry operations
- Monitoring performance metrics

**Returns** (*JSX.Element*): The rendered component

---

## TCPDemo.tsx

### Files

**fileoverview** TCP API Demo Component
**description** Interactive demonstration of Bun's high-performance TCP networking capabilities
**author** Odds Protocol Team
**version** 1.0.0
**since** 2024


🔗 **See also:** [**link** MarketTelemetryDemo] - Market data telemetry with networking integration

🔗 **See also:** [**link** BunV13Demo] - Bun v1.3 socket information and stream processing

🔗 **See also:** [**link** FetchDemo] - HTTP networking comparison and contrast

🔗 **See also:** [**link** BunFileAPIDocs] - File I/O operations that complement networking

🔗 **See also:** [**link** Bun.listen] - Bun's TCP server API reference

🔗 **See also:** [**link** Bun.connect] - Bun's TCP client API reference

### Interfaces

#### TCPOperation

TCP operation data structure for display and tracking
**interface** TCPOperation
**property** {string} id - Unique operation identifier
**property** {string} type - Operation type (server_start, connecting, send, receive, etc.)
**property** {'client' | 'server'} direction - Whether operation is from client or server perspective
**property** {'connecting' | 'connected' | 'sending' | 'receiving' | 'closed' | 'error'} status - Current operation status
**property** {any} data - Operation-specific data (message content, connection info, etc.)
**property** {number} timestamp - Operation timestamp in milliseconds
**property** {number} [latency] - Operation latency in milliseconds (for data operations)

#### TCPConnection

TCP connection data structure
**interface** TCPConnection
**property** {string} id - Unique connection identifier
**property** {'client' | 'server'} type - Connection type
**property** {string} hostname - Target hostname for connection
**property** {number} port - Target port for connection
**property** {'disconnected' | 'connecting' | 'connected' | 'listening'} status - Connection status
**property** {any} [socket] - Socket instance (mock implementation)
**property** {TCPOperation[]} operations - Array of operations performed on this connection

### Classs

TCP API Demo Component

Interactive demonstration of Bun's high-performance TCP networking capabilities.
Showcases server/client connections, message passing, heartbeat monitoring,
concurrent connections, and load testing scenarios.

Features:
- TCP server creation and management
- Client connection with configurable parameters
- Real-time message sending and receiving
- TLS encryption simulation
- Concurrent client connections
- Load testing with automated stress scenarios
- Heartbeat monitoring and connection health
- Message queuing and backpressure handling
- Broadcast messaging capabilities

**component**

**Example:**
```typescript```tsx
<TCPDemo />```

```

**Returns** (*React.FC*): The TCP demo component

### Methods

#### connectClient

Establishes TCP client connections

Creates one or more TCP client connections based on the concurrentClients setting.
Handles both single and multiple concurrent connection scenarios.

**method** connectClient
**private**
**Returns** (*Promise<void>*): 
**Example:**
```typescript```
await connectClient(); // Connect 1 or more clients based on concurrentClients setting```

```

#### runLoadTest

Executes a comprehensive TCP load test

Performs automated stress testing by:
1. Connecting 5 clients simultaneously
2. Sending 10 messages from each client
3. Monitoring performance and reliability
4. Gracefully closing all connections

**method** runLoadTest
**private**
**Returns** (*Promise<void>*): 
**Example:**
```typescript```
await runLoadTest(); // Execute full TCP load testing scenario```

```

### Functions

Renders the TCP Demo component

Provides an interactive interface for:
- Creating and managing TCP servers
- Establishing client connections
- Sending and receiving messages
- Monitoring connection health and operations
- Running load tests and performance analysis
- Configuring TLS and concurrent connections

**Returns** (*JSX.Element*): The rendered TCP demo component

---

## market-telemetry.ts

### Files

**fileoverview** Market Telemetry Engine
**description** High-frequency market data telemetry with PID context enrichment
**author** Odds Protocol Team
**version** 1.0.0
**since** 2024


🔗 **See also:** [**link** PIDContext] - Process identity and execution chain management

🔗 **See also:** [**link** AuditTrail] - Cryptographic audit trail for all operations

🔗 **See also:** [**link** RollingStatEngine] - Real-time analytics and anomaly detection

🔗 **See also:** [**link** MarketTelemetryDemo] - Interactive dashboard demonstration

🔗 **See also:** [**link** Bun.nanoseconds] - High-precision timing used throughout

🔗 **See also:** [**link** process.pid] - Process identification for attribution

### Classs

#### MarketTelemetry

[CORE][TELEMETRY][CLASS][META:{singleton,extends=SecurePIDRegistry}][MarketTelemetry][#REF:PIDContext,Bun.file,PIDFileSystem,PIDAuditTrail]

High-frequency market data telemetry with PID context enrichment.

Every tick, trade, and order book event is stamped with:
- PID, instanceId, and execution chain
- Request correlation for cross-process tracing
- Resource attribution for performance analysis
- HMAC integrity verification
- Nanosecond-precision timestamps

Key Features:
- Nanosecond-precision timing for HFT environments
- PID-aware operation attribution and tracing
- Rolling statistics with anomaly detection
- Real-time streaming subscriptions
- Cryptographic integrity verification
- Enterprise-grade audit trails

**class** MarketTelemetry

**Example:**
```typescript```
import { MarketTelemetry } from './telemetry/market-telemetry';

const telemetry = MarketTelemetry.getInstance();
telemetry.configure({ enableHFTMetrics: true });

const tick = { market_id: 'ESZ4', price: 4500.50, volume: 100 };
const enriched = await telemetry.recordTick(tick, { requestId: 'req_123' });```

```

### Methods

#### recordTick

Records a single market tick with full PID context enrichment

Processes a market tick through the complete telemetry pipeline:
1. Enriches with PID context and execution chain
2. Calculates HFT metrics and microstructure analysis
3. Updates rolling statistics and anomaly detection
4. Notifies real-time subscribers
5. Records audit trail entry

**method** recordTick
**public**
- **`tick`** (*MarketTick*): The raw market tick data
- **`context`** (*TelemetryContext*): Request context for correlation
**Returns** (*Promise<EnrichedMarketTick>*): Enriched tick with full telemetry data

**performance** < 1 microsecond per tick in production


**Example:**
```typescript```
const tick = {
  market_id: 'ESZ4',
  price: 4500.50,
  volume: 100,
  timestamp: Date.now() * 1000000 // nanoseconds
};

const enriched = await telemetry.recordTick(tick, {
  requestId: 'req_123',
  workflow: 'hft-processing'
});```

```

#### recordBatch

Records a batch of market ticks with parallel processing

Processes multiple ticks concurrently for high-throughput scenarios.
Utilizes worker pools and parallel enrichment pipelines.

**method** recordBatch
**public**
**param** {MarketTick[]} ticks - Array of raw market ticks
- **`context`** (*TelemetryContext*): Request context for correlation
**Returns** (*Promise<EnrichedMarketTick[]>*): Array of enriched ticks

**performance** 10M+ ticks/second throughput capability


**Example:**
```typescript```
const ticks = [
  { market_id: 'ESZ4', price: 4500.50, volume: 100 },
  { market_id: 'ESZ4', price: 4500.75, volume: 50 }
];

const enriched = await telemetry.recordBatch(ticks, {
  requestId: 'batch_123',
  workflow: 'market-data-ingestion'
});```

```

#### subscribe

Subscribes to real-time telemetry events for a market

Establishes a real-time subscription to receive enriched market ticks
as they are processed. Supports filtering and custom callbacks.

**method** subscribe
**public**
- **`marketId`** (*string*): Market identifier to subscribe to
- **`subscriber`** (*TelemetrySubscriber*): Subscriber configuration with callback
- **`context`** (*TelemetryContext*): Request context for audit trail
**Returns** (*SubscriptionHandle*): Handle for managing the subscription


**Example:**
```typescript```
const subscription = telemetry.subscribe('ESZ4', {
  pid: process.pid,
  callback: (tick) => {
    console.log('New tick:', tick.price, tick.volume);
  },
  filter: (tick) => tick.volume > 100 // Only high volume ticks
}, { requestId: 'sub_123' });

// Later: subscription.unsubscribe();```

```

---

