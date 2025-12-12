# Bun GraphQL Redis Subscriptions Guide

> Scalable GraphQL subscriptions using Bun-native WebSocket pub/sub with Redis-backed external pub/sub for multi-instance consistency

This guide covers implementing scalable GraphQL subscriptions in Bun using a hybrid approach that combines Bun's ultra-fast native WebSocket pub/sub with Redis for cross-instance event propagation.

## Overview

Bun's GraphQL subscription implementation provides:

- **Single-instance performance**: Zero-copy WebSocket pub/sub for local subscriptions
- **Multi-instance scaling**: Redis-backed pub/sub for cross-instance event propagation
- **Production readiness**: Heartbeat, limits, compression, and graceful cleanup
- **GraphQL integration**: Ready for GraphQL Yoga or similar libraries

## Architecture

### Hybrid Pub/Sub Approach

```typescript
// Single instance: Bun-native WebSocket pub/sub (fastest)
server.publish(trigger, payload, true); // compression enabled

// Multi-instance: Redis pub/sub (consistent)
await redisPublisher.publish(channel, payload);
```

### Connection Strategy

```typescript
// Dedicated Redis connections for pub/sub separation
const redisPublisher = new RedisClient("redis://localhost:6379");
const redisSubscriber = redisPublisher.duplicate(); // Separate connection

// Subscriber listens for cross-instance events
redisSubscriber.subscribeInternal(async (message, channel) => {
  const trigger = channel.slice("gql:sub:".length);
  server.publish(trigger, message, true); // Forward locally
}, "gql:sub:*");
```

## Implementation

### Core Subscription Class

```typescript
import { type ServerWebSocket } from "bun";
import { RedisClient } from "bun:redis";

type Trigger = string;

interface GraphQLWebSocket extends ServerWebSocket<unknown> {
  subscriptions: Set<Trigger>;
}

export class BunGraphQLRedisSubscriptions {
  private config = {
    channelPrefix: "gql:sub:" as string,
    heartbeatIntervalMs: 30000,
    maxSubscriptionsPerConn: 50,
  };

  constructor(
    private redisPublisher: RedisClient,
    private redisSubscriber?: RedisClient,
  ) {
    // Auto-create subscriber if not provided
    if (!this.redisSubscriber) {
      this.redisSubscriber = redisPublisher.duplicate();
      this.redisSubscriber.subscribeInternal(
        async (message: string, channel: string) => {
          const trigger = channel.slice(this.config.channelPrefix.length);
          this.server?.publish(trigger, message, true);
        },
        `${this.config.channelPrefix}*`
      );
    }
  }

  private server?: Bun.Server;

  public registerServer(server: Bun.Server) {
    this.server = server;
  }

  public async publish(trigger: Trigger, payload: string) {
    const channel = `${this.config.channelPrefix}${trigger}`;
    const start = Bun.nanoseconds();

    try {
      // Local fast path
      const localDelivered = this.server?.publish(trigger, payload, true) ?? 0;

      // Cross-instance propagation
      await this.redisPublisher.publish(channel, payload);

      console.log("Subscription event published", {
        trigger,
        localDelivered,
        duration_ns: Bun.nanoseconds() - start,
      });
    } catch (error) {
      console.error("Publish failed", { trigger }, error);
    }
  }

  public websocketHandler() {
    return {
      open(ws: GraphQLWebSocket) {
        ws.subscriptions = new Set<Trigger>();
        const interval = setInterval(() => ws.ping(), this.config.heartbeatIntervalMs);
        ws.data = { interval };
      },

      message(ws: GraphQLWebSocket, message: string) {
        if (message.startsWith("subscribe:")) {
          const trigger = message.slice(10);
          if (ws.subscriptions.size >= this.config.maxSubscriptionsPerConn) {
            ws.close(1013, "Too many subscriptions");
            return;
          }
          ws.subscribe(trigger);
          ws.subscriptions.add(trigger);
        } else if (message.startsWith("unsubscribe:")) {
          const trigger = message.slice(12);
          ws.unsubscribe(trigger);
          ws.subscriptions.delete(trigger);
        }
      },

      close(ws: GraphQLWebSocket) {
        clearInterval((ws.data as any).interval);
        for (const trigger of ws.subscriptions) {
          ws.unsubscribe(trigger);
        }
      },

      drain(ws: GraphQLWebSocket) {
        console.log("Drain: backpressure relieved");
      },
    };
  }
}
```

### Integration with Bun.serve

```typescript
import { serve } from "bun";
import { BunGraphQLRedisSubscriptions } from "./subscriptions";
import { RedisClient } from "bun:redis";

const redis = new RedisClient("redis://localhost:6379");
await redis.connect();

const subscriptions = new BunGraphQLRedisSubscriptions(redis);

const server = serve({
  port: 4000,
  fetch(req) {
    // GraphQL endpoint handling here
    return new Response("GraphQL endpoint");
  },

  websocket: subscriptions.websocketHandler(),
});

// Register server for local pub/sub
subscriptions.registerServer(server);

console.log("GraphQL server with subscriptions running on port 4000");
```

### GraphQL Integration Example

```typescript
import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = `
  type Query {
    hello: String
  }

  type Subscription {
    messageAdded: Message
  }

  type Message {
    id: ID!
    content: String!
    author: String!
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
  Subscription: {
    messageAdded: {
      subscribe: () => subscriptions.asyncIterator('MESSAGE_ADDED'),
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });
const yoga = createYoga({ schema });

// Integrate with Bun.serve
const server = serve({
  port: 4000,
  fetch: yoga,
  websocket: subscriptions.websocketHandler(),
});
```

## Configuration

### Environment Variables

```bash
# Redis connection
REDIS_URL=redis://localhost:6379

# Subscription settings
MAX_SUBSCRIPTIONS_PER_CONNECTION=50
HEARTBEAT_INTERVAL_MS=30000
CHANNEL_PREFIX=gql:sub:

# Performance tuning
TARGET_THROUGHPUT_EVENTS_PER_SEC=10000
```

### Runtime Configuration

```typescript
const config = {
  // Redis settings
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    duplicateConnectionForSub: true,
    retryStrategy: "exponential",
    reconnectionDelayMs: 1000,
  },

  // WebSocket settings
  websocket: {
    maxSubscriptionsPerConnection: parseInt(process.env.MAX_SUBSCRIPTIONS_PER_CONNECTION || "50"),
    heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS || "30000"),
    compression: true,
  },

  // Pub/sub settings
  pubsub: {
    channelPrefix: process.env.CHANNEL_PREFIX || "gql:sub:",
    multiInstanceSupport: true,
    eventPropagation: "redis",
  },

  // Performance targets
  performance: {
    targetThroughputEventsPerSec: parseInt(process.env.TARGET_THROUGHPUT_EVENTS_PER_SEC || "10000"),
    backpressureHandling: true,
  },
};
```

## Performance Optimization

### Connection Pooling

```typescript
// Redis connection pooling for high throughput
const redisPool = new RedisConnectionPool({
  minConnections: 5,
  maxConnections: 20,
  acquireTimeoutMs: 10000,
});

// Use pooled connections
const publisher = await redisPool.acquire();
await publisher.publish(channel, payload);
redisPool.release(publisher);
```

### Message Batching

```typescript
// Batch multiple events for efficiency
class MessageBatcher {
  private batch: Array<{ trigger: string; payload: string }> = [];
  private timeout?: Timer;

  constructor(
    private pubsub: BunGraphQLRedisSubscriptions,
    private batchSize = 10,
    private batchTimeoutMs = 100
  ) {}

  add(trigger: string, payload: string) {
    this.batch.push({ trigger, payload });

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.batchTimeoutMs);
    }
  }

  private flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    if (this.batch.length === 0) return;

    // Publish batch
    for (const { trigger, payload } of this.batch) {
      this.pubsub.publish(trigger, payload);
    }

    this.batch = [];
  }
}
```

### Memory Management

```typescript
// Subscription cleanup and memory monitoring
class SubscriptionManager {
  private subscriptions = new Map<string, Set<GraphQLWebSocket>>();
  private cleanupInterval: Timer;

  constructor() {
    // Periodic cleanup of dead connections
    this.cleanupInterval = setInterval(() => {
      this.cleanupDeadConnections();
    }, 60000); // Every minute
  }

  addSubscription(trigger: string, ws: GraphQLWebSocket) {
    if (!this.subscriptions.has(trigger)) {
      this.subscriptions.set(trigger, new Set());
    }
    this.subscriptions.get(trigger)!.add(ws);
  }

  removeSubscription(trigger: string, ws: GraphQLWebSocket) {
    const subs = this.subscriptions.get(trigger);
    if (subs) {
      subs.delete(ws);
      if (subs.size === 0) {
        this.subscriptions.delete(trigger);
      }
    }
  }

  private cleanupDeadConnections() {
    let cleaned = 0;
    for (const [trigger, sockets] of this.subscriptions) {
      for (const ws of sockets) {
        if (ws.readyState !== WebSocket.OPEN) {
          sockets.delete(ws);
          cleaned++;
        }
      }
      if (sockets.size === 0) {
        this.subscriptions.delete(trigger);
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} dead WebSocket connections`);
    }
  }

  getStats() {
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .reduce((sum, sockets) => sum + sockets.size, 0);

    return {
      activeTriggers: this.subscriptions.size,
      totalSubscriptions,
      memoryUsage: process.memoryUsage(),
    };
  }
}
```

## Security Considerations

### Authentication

```typescript
// Authenticate subscriptions
function authenticateWebSocket(ws: GraphQLWebSocket, authToken: string) {
  try {
    const payload = jwt.verify(authToken, process.env.JWT_SECRET!);
    ws.data = { ...ws.data, user: payload };
    return true;
  } catch (error) {
    ws.close(4001, "Authentication failed");
    return false;
  }
}

// Per-subscription authorization
function authorizeSubscription(
  ws: GraphQLWebSocket,
  trigger: string,
  variables: any
) {
  const user = (ws.data as any).user;

  // Check if user can subscribe to this trigger
  if (trigger.startsWith("user:")) {
    const userId = trigger.split(":")[1];
    return user.id === userId;
  }

  return true; // Allow by default
}
```

### Rate Limiting

```typescript
// Rate limit subscriptions per connection
const subscriptionRateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkSubscriptionRateLimit(ws: GraphQLWebSocket): boolean {
  const key = ws.remoteAddress;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxSubscriptions = 10;

  const current = subscriptionRateLimiter.get(key);
  if (!current || now > current.resetTime) {
    subscriptionRateLimiter.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxSubscriptions) {
    return false;
  }

  current.count++;
  return true;
}
```

## Monitoring and Observability

### Metrics Collection

```typescript
// Subscription metrics
interface SubscriptionMetrics {
  activeConnections: number;
  totalSubscriptions: number;
  eventsPublished: number;
  eventsDelivered: number;
  averageDeliveryTime: number;
  errorRate: number;
}

class SubscriptionMetricsCollector {
  private metrics: SubscriptionMetrics = {
    activeConnections: 0,
    totalSubscriptions: 0,
    eventsPublished: 0,
    eventsDelivered: 0,
    averageDeliveryTime: 0,
    errorRate: 0,
  };

  recordConnection(ws: GraphQLWebSocket, action: 'open' | 'close') {
    if (action === 'open') {
      this.metrics.activeConnections++;
    } else {
      this.metrics.activeConnections--;
    }
  }

  recordSubscription(trigger: string, action: 'subscribe' | 'unsubscribe') {
    if (action === 'subscribe') {
      this.metrics.totalSubscriptions++;
    } else {
      this.metrics.totalSubscriptions--;
    }
  }

  recordEvent(trigger: string, deliveryTime: number, success: boolean) {
    this.metrics.eventsPublished++;
    if (success) {
      this.metrics.eventsDelivered++;
      // Update rolling average
      const alpha = 0.1; // Smoothing factor
      this.metrics.averageDeliveryTime =
        this.metrics.averageDeliveryTime * (1 - alpha) + deliveryTime * alpha;
    }
  }

  getMetrics(): SubscriptionMetrics {
    return { ...this.metrics };
  }
}
```

### Health Checks

```typescript
// Health check endpoint
function createHealthCheck(pubsub: BunGraphQLRedisSubscriptions) {
  return async () => {
    try {
      // Test local pub/sub
      const testTrigger = `health:${Date.now()}`;
      let received = false;

      const timeout = setTimeout(() => {
        throw new Error("Health check timeout");
      }, 5000);

      // Subscribe temporarily
      const testWs = { subscribe: () => {}, unsubscribe: () => {} } as any;
      testWs.subscribe(testTrigger);

      // Publish test event
      await pubsub.publish(testTrigger, "health-check");

      // Wait for delivery (in real implementation, use a promise)
      await new Promise(resolve => setTimeout(resolve, 100));

      clearTimeout(timeout);

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        pubsub: "working",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  };
}
```

## Deployment Considerations

### Single Instance Deployment

```typescript
// Single instance - Redis subscriber not needed
const redis = new RedisClient(process.env.REDIS_URL);
const pubsub = new BunGraphQLRedisSubscriptions(redis, undefined); // No subscriber

// Only local WebSocket pub/sub will be used
```

### Multi-Instance Deployment

```typescript
// Multi-instance - Redis subscriber required
const redis = new RedisClient(process.env.REDIS_URL);
const pubsub = new BunGraphQLRedisSubscriptions(redis); // Auto-creates subscriber

// Events propagate across all instances via Redis
```

### Docker Configuration

```dockerfile
FROM oven/bun:latest

# Install Redis client
RUN bun add redis

# Copy application
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

EXPOSE 4000
CMD ["bun", "run", "server.ts"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: graphql-subscriptions
spec:
  replicas: 3
  selector:
    matchLabels:
      app: graphql-subscriptions
  template:
    metadata:
      labels:
        app: graphql-subscriptions
    spec:
      containers:
      - name: graphql
        image: myapp/graphql:latest
        ports:
        - containerPort: 4000
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: MAX_SUBSCRIPTIONS_PER_CONNECTION
          value: "100"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, mock } from "bun:test";
import { BunGraphQLRedisSubscriptions } from "./subscriptions";

describe("BunGraphQLRedisSubscriptions", () => {
  it("should publish events locally", async () => {
    const mockRedis = { publish: mock(() => Promise.resolve(1)) };
    const pubsub = new BunGraphQLRedisSubscriptions(mockRedis as any);

    // Mock server
    pubsub.registerServer({ publish: mock(() => 5) } as any);

    await pubsub.publish("test:event", "payload");

    expect(mockRedis.publish).toHaveBeenCalledWith("gql:sub:test:event", "payload");
  });

  it("should handle subscription limits", () => {
    const pubsub = new BunGraphQLRedisSubscriptions({} as any);
    const mockWs = {
      subscriptions: new Set(Array(50).fill("trigger")),
      close: mock(),
    };

    // Try to subscribe to 51st trigger
    pubsub.websocketHandler().message(mockWs as any, "subscribe:trigger51");

    expect(mockWs.close).toHaveBeenCalledWith(1013, "Too many subscriptions");
  });
});
```

### Integration Tests

```typescript
describe("GraphQL Subscriptions Integration", () => {
  it("should deliver events to subscribers", async () => {
    // Start test server
    const server = serve({
      port: 0,
      websocket: pubsub.websocketHandler(),
    });

    // Connect WebSocket client
    const ws = new WebSocket(`ws://localhost:${server.port}`);

    // Subscribe to events
    ws.onopen = () => ws.send("subscribe:test:event");

    // Wait for subscription confirmation
    await new Promise(resolve => {
      ws.onmessage = (event) => {
        if (event.data === "subscribed:test:event") resolve();
      };
    });

    // Publish event
    await pubsub.publish("test:event", "test payload");

    // Verify delivery
    const received = await new Promise(resolve => {
      ws.onmessage = (event) => resolve(event.data);
    });

    expect(received).toBe("test payload");

    ws.close();
    server.stop();
  });
});
```

## Performance Benchmarks

### Throughput Testing

```typescript
bench("Subscription publish throughput", async () => {
  const redis = new RedisClient("redis://localhost:6379");
  const pubsub = new BunGraphQLRedisSubscriptions(redis);

  // Warm up
  for (let i = 0; i < 1000; i++) {
    await pubsub.publish(`bench:event:${i}`, `payload ${i}`);
  }

  // Benchmark
  const start = Bun.nanoseconds();
  for (let i = 0; i < 10000; i++) {
    await pubsub.publish(`bench:event:${i}`, `payload ${i}`);
  }
  const duration = Bun.nanoseconds() - start;

  console.log(`10k events in ${duration / 1e6}ms`);
  console.log(`Throughput: ${(10000 / (duration / 1e9))} events/sec`);
});
```

### Memory Usage Testing

```typescript
bench("Memory usage with 10k concurrent subscriptions", async () => {
  const initialMemory = process.memoryUsage();

  // Create 10k mock WebSocket connections
  const mockSockets: GraphQLWebSocket[] = [];
  for (let i = 0; i < 10000; i++) {
    mockSockets.push({
      subscriptions: new Set([`trigger:${i}`]),
      subscribe: () => {},
      unsubscribe: () => {},
    } as any);
  }

  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

  console.log(`Memory increase: ${memoryIncrease / 1024 / 1024}MB`);
  console.log(`Per subscription: ${memoryIncrease / 10000} bytes`);
});
```

## Troubleshooting

### Common Issues

**Events not delivered locally:**
- Ensure `registerServer()` was called with the Bun.serve instance
- Check that WebSocket clients are properly subscribed to triggers

**Cross-instance events not working:**
- Verify Redis connection and pub/sub permissions
- Check Redis subscriber connection is active
- Ensure channel prefix matches between publisher and subscriber

**High memory usage:**
- Monitor subscription counts per connection
- Implement connection cleanup for dead WebSockets
- Use subscription limits to prevent abuse

**Performance degradation:**
- Profile Redis connection pool usage
- Monitor event delivery times
- Check for backpressure in WebSocket connections

### Debug Logging

```typescript
// Enable detailed logging
const pubsub = new BunGraphQLRedisSubscriptions(redis, {
  debug: true,
  logLevel: "debug",
});

// Log all events
pubsub.on('publish', (trigger, payload, localCount) => {
  console.log(`Published ${trigger}: ${payload} (${localCount} local)`);
});

pubsub.on('subscribe', (trigger, ws) => {
  console.log(`Subscribed to ${trigger}: ${ws.remoteAddress}`);
});

pubsub.on('error', (error, context) => {
  console.error('Subscription error:', error, context);
});
```

This comprehensive guide provides everything needed to implement scalable GraphQL subscriptions in Bun, from single-instance development to multi-instance production deployments.