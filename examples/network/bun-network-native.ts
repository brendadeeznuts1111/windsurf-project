import { dns, connect, udpSocket } from "bun";
import { logger } from "../logging/bun-logger";

interface DNSResult {
  hostname: string;
  records: string[];
  duration_ns: number;
}

interface ProcessTree {
  pid: number;
  command: string;
  children?: ProcessTree[];
}

interface DiskUsage {
  path: string;
  size: string;
  timestamp: string;
}

export class BunNetworkUtils {
  /**
   * DNS resolution with timing and caching
   */
  async resolveDNS(hostname: string): Promise<DNSResult> {
    const start = Bun.nanoseconds();

    const records = await dns.lookup(hostname);
    const duration = Bun.nanoseconds() - start;

    logger.debug("DNS resolution completed", {
      hostname,
      duration_ns: duration,
      record_count: records.length,
    });

    return {
      hostname,
      records,
      duration_ns: duration,
    };
  }

  /**
   * DNS prefetching for performance
   */
  prefetchDNS(hostname: string, port?: number): void {
    dns.prefetch(hostname, port);
    logger.debug("DNS prefetch initiated", { hostname, port });
  }

  /**
   * Get DNS cache statistics
   */
  getDNSCacheStats(): any {
    const stats = dns.getCacheStats();
    logger.debug("DNS cache stats retrieved", stats);
    return stats;
  }

  /**
   * UDP packet capture with Bun.udpSocket()
   */
  createUdpListener(port: number) {
    const socket = udpSocket({
      port,
      socket: {
        data(socket, data, port, address) {
          logger.info("UDP packet received", {
            from: `${address}:${port}`,
            size: data.length,
          });
          // Process packet...
        },
        error(socket, error) {
          logger.error("UDP socket error", { port }, error);
        },
        close(socket) {
          logger.info("UDP socket closed", { port });
        },
      },
    });

    return socket;
  }

  /**
   * TCP connection pooling with Bun.connect
   */
  createTcpPool(host: string, port: number, poolSize: number = 10) {
    const pool: any[] = [];

    for (let i = 0; i < poolSize; i++) {
      const socket = connect({
        hostname: host,
        port,
        socket: {
          connect() {
            logger.trace("TCP socket connected", { host, port });
          },
          error(error) {
            logger.error("TCP socket error", { host, port }, error);
          },
        },
      });

      pool.push(socket);
    }

    return {
      async send(data: string): Promise<string> {
        const socket = pool[Math.floor(Math.random() * pool.length)];
        const writer = socket.writer;
        await writer.write(data);
        const reader = socket.reader;
        const response = await reader.read();
        return new TextDecoder().decode(response);
      },
      closeAll() {
        pool.forEach(s => s.close());
        logger.info("TCP pool closed", { pool_size: poolSize });
      },
    };
  }

  /**
   * HTTP client with connection pooling
   */
  async httpRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const start = Bun.nanoseconds();

    const response = await fetch(url, {
      ...options,
      // Bun automatically handles connection pooling
    });

    const duration = Bun.nanoseconds() - start;

    logger.debug("HTTP request completed", {
      url,
      status: response.status,
      duration_ns: duration,
    });

    return response;
  }

  /**
   * Utility functions using Bun.deepEquals, Bun.inspect, Bun.resolve
   */
  deepEqualComparison(obj1: any, obj2: any): boolean {
    return Bun.deepEquals(obj1, obj2);
  }

  inspectObject(obj: any): string {
    return Bun.inspect(obj);
  }

  resolvePath(path: string): string {
    return Bun.resolveSync(path, import.meta.dir);
  }
}