#!/usr/bin/env bun

/**
 * 🎯 Bun Unix Domain Socket Proxy
 *
 * Bun-compatible version of the Unix domain socket proxy.
 * Forwards Unix socket connections to TCP endpoints.
 * Useful for testing with containerized services.
 */

import { serve } from 'bun';
import * as net from 'node:net';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface ProxyOptions {
  serviceName: string;
  targetHost: string;
  targetPort: number;
  socketPath?: string;
  cleanupOnExit?: boolean;
}

export interface ProxyStats {
  connectionsActive: number;
  connectionsTotal: number;
  bytesForwarded: number;
  uptimeMs: number;
  startTime: number;
}

/**
 * Bun-compatible Unix Domain Socket Proxy
 *
 * Creates a proxy that listens on a Unix domain socket and forwards
 * connections to a TCP host:port. Useful for testing scenarios where
 * services are containerized but need Unix socket access.
 */
export class BunUnixSocketProxy {
  private server: net.Server | null = null;
  private socketPath: string;
  private targetHost: string;
  private targetPort: number;
  private serviceName: string;
  private connections: Set<net.Socket> = new Set();
  private stats: ProxyStats;
  private cleanupOnExit: boolean;

  constructor(options: ProxyOptions) {
    this.serviceName = options.serviceName;
    this.targetHost = options.targetHost;
    this.targetPort = options.targetPort;
    this.cleanupOnExit = options.cleanupOnExit ?? true;

    this.socketPath = options.socketPath ||
      path.join(os.tmpdir(), `${this.serviceName}_proxy_${Date.now()}.sock`);

    this.stats = {
      connectionsActive: 0,
      connectionsTotal: 0,
      bytesForwarded: 0,
      uptimeMs: 0,
      startTime: Date.now(),
    };

    // Register cleanup handlers
    if (this.cleanupOnExit) {
      this.setupCleanupHandlers();
    }
  }

  /**
   * Get the Unix socket path for clients to connect to
   */
  get path(): string {
    return this.socketPath;
  }

  /**
   * Get current proxy statistics
   */
  getStats(): ProxyStats {
    return {
      ...this.stats,
      uptimeMs: Date.now() - this.stats.startTime,
    };
  }

  /**
   * Start the proxy server
   */
  async start(): Promise<void> {
    // Clean up any existing socket file
    await this.cleanupSocketFile();

    return new Promise((resolve, reject) => {
      this.server = net.createServer(clientSocket => {
        this.handleClientConnection(clientSocket);
      });

      this.server.on("error", (err) => {
        console.error(`${this.serviceName} proxy server error:`, err);
        reject(err);
      });

      this.server.listen(this.socketPath, () => {
        console.log(`🚀 Unix socket proxy for ${this.serviceName} listening on ${this.socketPath}`);
        console.log(`   ↳ Forwarding to ${this.targetHost}:${this.targetPort}`);
        resolve();
      });
    });
  }

  /**
   * Stop the proxy server and clean up
   */
  async stop(): Promise<void> {
    console.log(`🛑 Stopping Unix socket proxy for ${this.serviceName}`);

    // Close all active connections
    const closePromises = Array.from(this.connections).map(socket =>
      new Promise<void>((resolve) => {
        socket.once('close', resolve);
        socket.destroy();
      })
    );

    await Promise.all(closePromises);
    this.connections.clear();
    this.stats.connectionsActive = 0;

    // Close the server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => resolve());
      });
      this.server = null;
    }

    // Remove the socket file
    await this.cleanupSocketFile();

    console.log(`✅ Unix socket proxy for ${this.serviceName} stopped`);
  }

  /**
   * Create and start a proxy instance
   */
  static async create(options: ProxyOptions): Promise<BunUnixSocketProxy> {
    const proxy = new BunUnixSocketProxy(options);
    await proxy.start();
    return proxy;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async handleClientConnection(clientSocket: net.Socket): Promise<void> {
    console.log(`${this.serviceName} connection received on unix socket`);

    // Update stats
    this.stats.connectionsTotal++;
    this.stats.connectionsActive++;
    this.connections.add(clientSocket);

    try {
      // Create connection to the target service
      const targetSocket = await this.createTargetConnection();

      // Set up bidirectional data forwarding
      this.setupDataForwarding(clientSocket, targetSocket);

    } catch (error) {
      console.error(`${this.serviceName} failed to connect to target:`, error);
      clientSocket.destroy();
      this.stats.connectionsActive--;
      this.connections.delete(clientSocket);
    }
  }

  private async createTargetConnection(): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({
        host: this.targetHost,
        port: this.targetPort,
      });

      socket.on("connect", () => {
        console.log(`✅ Connected to ${this.serviceName} target at ${this.targetHost}:${this.targetPort}`);
        resolve(socket);
      });

      socket.on("error", (err) => {
        reject(err);
      });

      // Set a connection timeout
      setTimeout(() => {
        socket.destroy();
        reject(new Error(`Connection timeout to ${this.targetHost}:${this.targetPort}`));
      }, 5000);
    });
  }

  private setupDataForwarding(clientSocket: net.Socket, targetSocket: net.Socket): void {
    let clientBytes = 0;
    let targetBytes = 0;

    // Forward client data to target
    clientSocket.on("data", (data) => {
      clientBytes += data.length;
      targetSocket.write(data);
    });

    // Forward target data to client
    targetSocket.on("data", (data) => {
      targetBytes += data.length;
      clientSocket.write(data);
    });

    // Handle socket closures
    const cleanup = () => {
      this.stats.bytesForwarded += clientBytes + targetBytes;
      this.stats.connectionsActive--;
      this.connections.delete(clientSocket);
    };

    clientSocket.on("close", () => {
      targetSocket.end();
      cleanup();
    });

    clientSocket.on("error", (err) => {
      console.error(`${this.serviceName} client socket error:`, err);
      targetSocket.destroy();
      cleanup();
    });

    targetSocket.on("close", () => {
      clientSocket.end();
      cleanup();
    });

    targetSocket.on("error", (err) => {
      console.error(`${this.serviceName} target socket error:`, err);
      clientSocket.destroy();
      cleanup();
    });
  }

  private async cleanupSocketFile(): Promise<void> {
    try {
      await fs.promises.unlink(this.socketPath);
      console.log(`🧹 Cleaned up socket file: ${this.socketPath}`);
    } catch {
      // Ignore error if file doesn't exist
    }
  }

  private setupCleanupHandlers(): void {
    // Clean up on process exit
    process.on('exit', () => this.stop());
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
    process.on('uncaughtException', () => this.stop());
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create multiple proxies for different services
 */
export async function createServiceProxies(
  services: Array<{ name: string; host: string; port: number }>
): Promise<BunUnixSocketProxy[]> {
  const proxies = await Promise.all(
    services.map(service =>
      BunUnixSocketProxy.create({
        serviceName: service.name,
        targetHost: service.host,
        targetPort: service.port,
      })
    )
  );

  console.log(`🚀 Created ${proxies.length} Unix socket proxies`);
  return proxies;
}

/**
 * Stop multiple proxies
 */
export async function stopServiceProxies(proxies: BunUnixSocketProxy[]): Promise<void> {
  await Promise.all(proxies.map(proxy => proxy.stop()));
  console.log(`🛑 Stopped ${proxies.length} Unix socket proxies`);
}

// ============================================================================
// BUN-SPECIFIC INTEGRATION
// ============================================================================

/**
 * Integration with Bun's file system for socket management
 */
export class BunSocketManager {
  private static activeProxies = new Map<string, BunUnixSocketProxy>();

  static async createProxy(options: ProxyOptions): Promise<BunUnixSocketProxy> {
    const proxy = await BunUnixSocketProxy.create(options);
    this.activeProxies.set(options.serviceName, proxy);
    return proxy;
  }

  static async stopProxy(serviceName: string): Promise<void> {
    const proxy = this.activeProxies.get(serviceName);
    if (proxy) {
      await proxy.stop();
      this.activeProxies.delete(serviceName);
    }
  }

  static async stopAllProxies(): Promise<void> {
    const stopPromises = Array.from(this.activeProxies.values()).map(proxy => proxy.stop());
    await Promise.all(stopPromises);
    this.activeProxies.clear();
  }

  static getActiveProxies(): string[] {
    return Array.from(this.activeProxies.keys());
  }

  static getProxyStats(serviceName: string): ProxyStats | null {
    const proxy = this.activeProxies.get(serviceName);
    return proxy ? proxy.getStats() : null;
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Create proxies for common services
 */
export async function createCommonServiceProxies(): Promise<BunUnixSocketProxy[]> {
  const services = [
    { name: 'redis', host: 'localhost', port: 6379 },
    { name: 'postgres', host: 'localhost', port: 5432 },
    { name: 'mysql', host: 'localhost', port: 3306 },
  ];

  return createServiceProxies(services);
}

// ============================================================================
// CLI INTEGRATION
// ============================================================================

/**
 * CLI command to start a proxy
 * Usage: bun run proxy:start --service redis --host localhost --port 6379
 */
export async function startProxyCommand(args: string[]): Promise<void> {
  const serviceName = args.find(arg => arg.startsWith('--service='))?.split('=')[1];
  const host = args.find(arg => arg.startsWith('--host='))?.split('=')[1];
  const port = parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '0');

  if (!serviceName || !host || !port) {
    console.error('Usage: bun run proxy:start --service=<name> --host=<host> --port=<port>');
    process.exit(1);
  }

  try {
    const proxy = await BunSocketManager.createProxy({
      serviceName,
      targetHost: host,
      targetPort: port,
    });

    console.log(`✅ Proxy started for ${serviceName} at ${proxy.path}`);

    // Keep running until interrupted
    process.on('SIGINT', async () => {
      await BunSocketManager.stopProxy(serviceName);
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start proxy:', error);
    process.exit(1);
  }
}

// ============================================================================
// INTEGRATION WITH WORKER SYSTEM
// ============================================================================

/**
 * Integration with the worker-spawn system for testing
 */
export class WorkerTestProxy {
  private proxy: BunUnixSocketProxy | null = null;

  async startForWorker(workerId: string, targetPort: number): Promise<string> {
    this.proxy = await BunUnixSocketProxy.create({
      serviceName: `worker-${workerId}`,
      targetHost: 'localhost',
      targetPort,
    });

    return this.proxy.path;
  }

  async stop(): Promise<void> {
    if (this.proxy) {
      await this.proxy.stop();
      this.proxy = null;
    }
  }
}