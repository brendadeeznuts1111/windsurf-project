// packages/odds-websocket/src/server-v13.ts - Bun v1.3 Optimized
import type { OddsTick, ArbitrageOpportunity } from 'odds-core';
import { hash, stripANSI } from "bun";
// Import utilities from relative path
import { 
  getSocketInfo, 
  performNetworkDiagnostics, 
  StreamProcessor 
} from '../../odds-core/src/utils.js';

interface ConnectionData {
  id: string;
  connectedAt: number;
  subscription: Set<string>;
  backpressureCount: number;
  messageCount: number;
  socketInfo?: any;
}

export class BunV13WebSocketServer {
  private server: ReturnType<typeof Bun.serve>;
  private workerPool: Worker[] = [];
  private rapidHashCache = new Map<string, bigint>();
  private messageCount = 0;
  private streamProcessor = new StreamProcessor();
  private connectionSockets = new Map<string, any>();

  constructor(options: { port: number; workerCount?: number } = { port: 3000 }) {
    this.initializeWorkers(options.workerCount || 4);
    
    this.server = Bun.serve<ConnectionData>({
      port: options.port,
      development: process.env.NODE_ENV !== 'production',
      
      // Bun v1.3: Fetch handler with enhanced capabilities
      fetch: async (req, server) => this.handleFetch(req, server),
      
      websocket: {
        open: (ws) => this.handleOpen(ws),
        message: (ws, message) => this.handleMessage(ws, message),
        close: (ws) => this.handleClose(ws),
        
        // Bun v1.3: Enhanced compression
        perMessageDeflate: {
          compress: true,
        },
        
        // Bun v1.3: Better backpressure handling
        backpressureLimit: 1024 * 1024,
        closeOnBackpressureLimit: false,
        idleTimeout: 60,
        maxPayloadLength: 4 * 1024 * 1024,
      },
    });

    console.log(`🚀 Bun v1.3 WebSocket Server running on port ${this.server.port}`);
  }

  private initializeWorkers(count: number) {
    for (let i = 0; i < count; i++) {
      const worker = new Worker(new URL('./tick-processor.ts', import.meta.url).href, {
        name: `tick-processor-${i}`,
        smol: true, // Bun v1.3: Reduced memory usage
      });

      // Bun v1.3: 500x faster postMessage for worker communication
      worker.onmessage = (event) => {
        this.handleWorkerResult(event.data);
      };

      worker.onerror = (error) => {
        console.error(`Worker ${i} error:`, error);
      };

      this.workerPool.push(worker);
    }
  }

  private async handleFetch(req: Request, server: ReturnType<typeof Bun.serve>): Promise<Response> {
    const url = new URL(req.url);
    
    if (url.pathname === '/ws' && server.upgrade(req)) {
      return new Response();
    }
    
    if (url.pathname === '/health') {
      const stats = this.getEnhancedStats();
      return new Response(JSON.stringify(stats));
    }
    
    if (url.pathname === '/metrics') {
      return new Response(this.getPerformanceMetrics());
    }
    
    if (url.pathname === '/network-diagnostics') {
      const diagnostics = await this.performNetworkDiagnostics();
      return new Response(JSON.stringify(diagnostics, null, 2));
    }
    
    return new Response('Not Found', { status: 404 });
  }

  private handleOpen(ws: any) {
    const connectionId = hash.rapidhash(`${Date.now()}${Math.random()}`).toString(16);
    
    // Bun v1.3: Capture enhanced socket information
    const socketInfo = {
      localAddress: ws.remoteAddress, // Note: Bun's WebSocket uses different property names
      localPort: this.server.port,
      remoteAddress: ws.remoteAddress,
      remotePort: 'unknown', // WebSocket doesn't expose remote port
      protocol: 'WebSocket',
      connectedAt: performance.now(),
    };
    
    ws.data = {
      id: connectionId,
      connectedAt: performance.now(),
      subscription: new Set<string>(),
      backpressureCount: 0,
      messageCount: 0,
      socketInfo,
    };

    this.connectionSockets.set(connectionId, ws);
    ws.subscribe('odds-ticks');
    
    console.log(`🔗 New connection: ${connectionId}`);
    console.log(`   Remote: ${socketInfo.remoteAddress}`);
    console.log(`   Local: ${socketInfo.localAddress}:${socketInfo.localPort}`);
  }

  private async handleMessage(ws: any, message: string | Buffer) {
    this.messageCount++;
    const data = message.toString();

    try {
      // Bun v1.3: 6-57x faster ANSI stripping
      const cleanData = stripANSI(data);
      const tick: OddsTick = JSON.parse(cleanData);

      // Bun v1.3: Rapidhash for tick deduplication
      const tickHash = this.calculateTickHash(tick);
      
      if (this.isDuplicateTick(tickHash)) {
        return; // Skip duplicates
      }

      // Bun v1.3: 500x faster worker communication
      const worker = this.getNextWorker();
      worker.postMessage({ 
        type: 'process-tick', 
        tick, 
        connectionId: ws.data.id 
      });

      // Handle backpressure with Bun v1.3 optimizations
      await this.handleBackpressureOptimized(ws, tick);

    } catch (error) {
      console.error('❌ Message processing error:', error);
      ws.close(1011, 'Invalid message format');
    }
  }

  private calculateTickHash(tick: OddsTick): bigint {
    const key = `${tick.exchange}-${tick.gameId}-${tick.line}-${tick.timestamp.getTime()}`;
    
    // Bun v1.3: Rapidhash for fast hashing
    if (!this.rapidHashCache.has(key)) {
      this.rapidHashCache.set(key, hash.rapidhash(key));
    }
    
    return this.rapidHashCache.get(key)!;
  }

  private isDuplicateTick(hash: bigint): boolean {
    return this.rapidHashCache.has(hash.toString());
  }

  private getNextWorker(): Worker {
    const worker = this.workerPool[this.messageCount % this.workerPool.length];
    if (!worker) {
      throw new Error('No workers available');
    }
    return worker;
  }

  private async handleBackpressureOptimized(ws: any, tick: OddsTick) {
    const data = JSON.stringify(tick);
    const sent = ws.send(data); // Remove the second argument (compress) as it's not supported
    
    if (sent === -1) {
      ws.data.backpressureCount++;
      
      // Bun v1.3: Use setTimeout instead of scheduler
      setTimeout(() => {
        if (ws.data.backpressureCount > 5) {
          // Pause logic would go here if supported
          // For now, just reduce backpressure
          ws.data.backpressureCount = Math.max(0, ws.data.backpressureCount - 3);
        }
      }, 50);
    } else {
      ws.data.backpressureCount = Math.max(0, ws.data.backpressureCount - 1);
    }
  }

  private handleWorkerResult(result: any) {
    // Bun v1.3: 500x faster broadcasting
    if (result.type === 'arbitrage-alert') {
      this.server.publish('arbitrage-alerts', JSON.stringify(result.data), false);
    } else if (result.type === 'sharp-signal') {
      this.server.publish('sharp-signals', JSON.stringify(result.data), false);
    }
  }

  private handleClose(ws: any) {
    const connectionId = ws.data.id;
    this.connectionSockets.delete(connectionId);
    console.log(`🔌 Connection closed: ${connectionId}`);
  }

  private async performNetworkDiagnostics() {
    const endpoints = [
      { hostname: 'httpbin.org', port: 80 },
      { hostname: 'api.github.com', port: 443 },
      { hostname: 'example.com', port: 80 }
    ];

    const results = await performNetworkDiagnostics(endpoints);
    
    return {
      timestamp: Date.now(),
      serverPort: this.server.port,
      activeConnections: this.connectionSockets.size,
      diagnostics: results,
      connectionDetails: Array.from(this.connectionSockets.entries()).map(([id, ws]) => ({
        id,
        socketInfo: ws.data?.socketInfo,
        messageCount: ws.data?.messageCount || 0,
        backpressureCount: ws.data?.backpressureCount || 0,
        connectedAt: ws.data?.connectedAt,
      }))
    };
  }

  private getEnhancedStats() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      connections: 0, // Server type doesn't expose connections
      workerCount: this.workerPool.length,
      messageCount: this.messageCount,
      memory: process.memoryUsage(),
      bunVersion: Bun.version,
      performance: {
        rapidHashCacheSize: this.rapidHashCache.size,
        postMessageOptimized: true, // Bun v1.3 feature
      }
    };
  }

  private getPerformanceMetrics(): string {
    const metrics = {
      bun_runtime: {
        version: Bun.version,
        platform: process.platform,
        memory: process.memoryUsage(),
      },
      websocket: {
        connections: 0, // Server type doesn't expose connections
        messages_processed: this.messageCount,
        workers: this.workerPool.length,
      },
      performance: {
        postmessage_optimized: true, // 500x faster
        rapidhash_enabled: true, // Fast hashing
        stripani_optimized: true, // 6-57x faster
        sql_preconnected: !!process.env.DATABASE_URL,
      },
      timestamps: {
        collected_at: new Date().toISOString(),
        uptime: process.uptime(),
      }
    };

    return JSON.stringify(metrics, null, 2);
  }

  // Bun v1.3: Graceful shutdown with process control
  async gracefulShutdown() {
    console.log('🔄 Initiating graceful shutdown...');
    
    // Notify workers to shutdown
    for (const worker of this.workerPool) {
      worker.postMessage({ type: 'shutdown' });
    }
    
    // Close server
    this.server.stop();
    
    console.log('✅ Server shutdown complete');
  }
}

// Start server with Bun v1.3 optimizations
const server = new BunV13WebSocketServer({
  port: parseInt(process.env.WS_PORT || '3000'),
  workerCount: parseInt(process.env.WORKER_COUNT || '4')
});

// Bun v1.3: Process signal handling for graceful shutdown
process.on('SIGTERM', () => server.gracefulShutdown());
process.on('SIGINT', () => server.gracefulShutdown());

export default server;
