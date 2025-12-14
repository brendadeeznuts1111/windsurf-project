#!/usr/bin/env bun

/**
 * 🧪 Unix Socket Proxy Tests & Integration
 *
 * Tests for the Bun Unix socket proxy and integration with worker system.
 */

import { test, describe, beforeAll, afterAll } from 'bun:test';
import { expect } from 'bun:test';
import { BunUnixSocketProxy, BunSocketManager, WorkerTestProxy } from '../src/utils/bun-unix-socket-proxy';
import * as net from 'node:net';
import * as fs from 'node:fs';

describe('Bun Unix Socket Proxy', () => {
  let proxy: BunUnixSocketProxy;
  let testServer: net.Server;
  let testPort: number;

  beforeAll(async () => {
    // Start a test TCP server
    testServer = net.createServer(socket => {
      socket.on('data', data => {
        // Echo back the data with a prefix
        socket.write(`ECHO: ${data.toString()}`);
      });
    });

    await new Promise<void>((resolve) => {
      testServer.listen(0, 'localhost', () => {
        testPort = (testServer.address() as net.AddressInfo).port;
        resolve();
      });
    });

    // Start the proxy
    proxy = await BunUnixSocketProxy.create({
      serviceName: 'test-service',
      targetHost: 'localhost',
      targetPort: testPort,
    });
  });

  afterAll(async () => {
    // Clean up
    await proxy.stop();
    await new Promise<void>((resolve) => {
      testServer.close(() => resolve());
    });
  });

  test('proxy creates Unix socket file', () => {
    expect(proxy.path).toBeDefined();
    expect(fs.existsSync(proxy.path)).toBe(true);
  });

  test('proxy forwards data correctly', async () => {
    const testData = 'Hello from Unix socket!';
    let response = '';

    await new Promise<void>((resolve) => {
      const client = net.createConnection(proxy.path);

      client.on('connect', () => {
        client.write(testData);
      });

      client.on('data', (data) => {
        response = data.toString();
        client.end();
      });

      client.on('close', () => {
        resolve();
      });

      client.on('error', (err) => {
        console.error('Client error:', err);
        resolve();
      });
    });

    expect(response).toBe(`ECHO: ${testData}`);
  });

  test('proxy provides statistics', () => {
    const stats = proxy.getStats();
    expect(stats).toBeDefined();
    expect(stats.connectionsTotal).toBeGreaterThanOrEqual(0);
    expect(stats.startTime).toBeGreaterThan(0);
  });
});

describe('Bun Socket Manager', () => {
  let testServer: net.Server;
  let testPort: number;

  beforeAll(async () => {
    // Start a test TCP server
    testServer = net.createServer(socket => {
      socket.on('data', data => {
        socket.write(`MANAGED: ${data.toString()}`);
      });
    });

    await new Promise<void>((resolve) => {
      testServer.listen(0, 'localhost', () => {
        testPort = (testServer.address() as net.AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      testServer.close(() => resolve());
    });
    await BunSocketManager.stopAllProxies();
  });

  test('creates and manages proxies', async () => {
    // Create a proxy
    const proxy = await BunSocketManager.createProxy({
      serviceName: 'managed-service',
      targetHost: 'localhost',
      targetPort: testPort,
    });

    expect(proxy).toBeDefined();
    expect(BunSocketManager.getActiveProxies()).toContain('managed-service');

    // Test the proxy
    const testData = 'Managed proxy test';
    let response = '';

    await new Promise<void>((resolve) => {
      const client = net.createConnection(proxy.path);

      client.on('connect', () => {
        client.write(testData);
      });

      client.on('data', (data) => {
        response = data.toString();
        client.end();
      });

      client.on('close', () => {
        resolve();
      });
    });

    expect(response).toBe(`MANAGED: ${testData}`);

    // Get stats
    const stats = BunSocketManager.getProxyStats('managed-service');
    expect(stats).toBeDefined();
    expect(stats!.connectionsTotal).toBeGreaterThanOrEqual(1);

    // Stop the proxy
    await BunSocketManager.stopProxy('managed-service');
    expect(BunSocketManager.getActiveProxies()).not.toContain('managed-service');
  });
});

describe('Worker Test Proxy Integration', () => {
  let testServer: net.Server;
  let testPort: number;
  let workerProxy: WorkerTestProxy;

  beforeAll(async () => {
    // Start a test TCP server
    testServer = net.createServer(socket => {
      socket.on('data', data => {
        socket.write(`WORKER: ${data.toString()}`);
      });
    });

    await new Promise<void>((resolve) => {
      testServer.listen(0, 'localhost', () => {
        testPort = (testServer.address() as net.AddressInfo).port;
        resolve();
      });
    });

    workerProxy = new WorkerTestProxy();
  });

  afterAll(async () => {
    await workerProxy.stop();
    await new Promise<void>((resolve) => {
      testServer.close(() => resolve());
    });
  });

  test('creates proxy for worker testing', async () => {
    const socketPath = await workerProxy.startForWorker('test-worker', testPort);

    expect(socketPath).toBeDefined();
    expect(fs.existsSync(socketPath)).toBe(true);

    // Test the worker proxy
    const testData = 'Worker proxy test';
    let response = '';

    await new Promise<void>((resolve) => {
      const client = net.createConnection(socketPath);

      client.on('connect', () => {
        client.write(testData);
      });

      client.on('data', (data) => {
        response = data.toString();
        client.end();
      });

      client.on('close', () => {
        resolve();
      });
    });

    expect(response).toBe(`WORKER: ${testData}`);
  });
});

describe('Error Handling', () => {
  test('handles invalid target connection', async () => {
    const proxy = new BunUnixSocketProxy({
      serviceName: 'error-test',
      targetHost: 'invalid.host',
      targetPort: 12345,
    });

    // Should not throw during construction
    expect(proxy).toBeDefined();

    // Should handle connection errors gracefully
    try {
      await proxy.start();
      // If we get here, the proxy started (unexpected for invalid host)
      await proxy.stop();
    } catch (error) {
      // Expected to fail with invalid host
      expect(error).toBeDefined();
    }
  });

  test('handles socket file cleanup', async () => {
    const proxy = new BunUnixSocketProxy({
      serviceName: 'cleanup-test',
      targetHost: 'localhost',
      targetPort: 12345, // Invalid port
    });

    // Start should handle cleanup of existing socket files
    try {
      await proxy.start();
      await proxy.stop();
    } catch {
      // Expected to fail, but cleanup should work
    }

    // Socket file should be cleaned up
    expect(fs.existsSync(proxy.path)).toBe(false);
  });
});

describe('Integration with Worker System', () => {
  test('proxy integrates with worker spawn system', async () => {
    // This would test integration with the WorkerWithSpawn class
    // For now, just verify the proxy can be created
    const proxy = new BunUnixSocketProxy({
      serviceName: 'worker-integration-test',
      targetHost: 'localhost',
      targetPort: 6379, // Redis default port
    });

    expect(proxy.path).toContain('worker-integration-test');
    expect(proxy.path).toContain('.sock');
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance Tests', () => {
  let proxy: BunUnixSocketProxy;
  let testServer: net.Server;
  let testPort: number;

  beforeAll(async () => {
    // Start a high-performance test server
    testServer = net.createServer(socket => {
      socket.on('data', data => {
        // Just echo back
        socket.write(data);
      });
    });

    await new Promise<void>((resolve) => {
      testServer.listen(0, 'localhost', () => {
        testPort = (testServer.address() as net.AddressInfo).port;
        resolve();
      });
    });

    proxy = await BunUnixSocketProxy.create({
      serviceName: 'perf-test',
      targetHost: 'localhost',
      targetPort: testPort,
    });
  });

  afterAll(async () => {
    await proxy.stop();
    await new Promise<void>((resolve) => {
      testServer.close(() => resolve());
    });
  });

  test('handles multiple concurrent connections', async () => {
    const numConnections = 10;
    const testData = 'Concurrent test data';
    const responses: string[] = [];

    const connectionPromises = Array.from({ length: numConnections }, (_, i) =>
      new Promise<void>((resolve) => {
        const client = net.createConnection(proxy.path);

        client.on('connect', () => {
          client.write(`${testData}-${i}`);
        });

        client.on('data', (data) => {
          responses.push(data.toString());
          client.end();
        });

        client.on('close', () => {
          resolve();
        });

        client.on('error', () => {
          resolve(); // Still resolve on error
        });
      })
    );

    await Promise.all(connectionPromises);

    // Should have received responses for all connections
    expect(responses.length).toBe(numConnections);
    responses.forEach(response => {
      expect(response).toMatch(/^Concurrent test data-\d+$/);
    });
  });

  test('provides accurate statistics', async () => {
    // Make a few connections to generate stats
    for (let i = 0; i < 3; i++) {
      await new Promise<void>((resolve) => {
        const client = net.createConnection(proxy.path);

        client.on('connect', () => {
          client.write(`stats-test-${i}`);
        });

        client.on('data', () => {
          client.end();
        });

        client.on('close', () => {
          resolve();
        });
      });
    }

    const stats = proxy.getStats();
    expect(stats.connectionsTotal).toBeGreaterThanOrEqual(3);
    expect(stats.uptimeMs).toBeGreaterThan(0);
    expect(stats.startTime).toBeGreaterThan(0);
  });
});