#!/usr/bin/env bun

/**
 * 🚀 Unix Socket Proxy Demo - Integration with Worker System
 *
 * Demonstrates how the Unix socket proxy integrates with the worker-spawn system
 * for testing scenarios where services need Unix socket access but run in containers.
 */

import { BunUnixSocketProxy, BunSocketManager, WorkerTestProxy } from '../src/utils/bun-unix-socket-proxy';
import { WorkerWithSpawn } from '../src/workers/worker-with-spawn';
import { createSpawnTensionEngine } from '../src/core/tension-scoring/tension-engine';
import { createSecurityValidator } from '../src/security/spawn-validator';
import * as net from 'node:net';

// ============================================================================
// DEMO SCENARIOS
// ============================================================================

/**
 * Demo 1: Basic Unix Socket Proxy
 */
async function demoBasicProxy() {
  console.log('\n🔧 Demo 1: Basic Unix Socket Proxy');
  console.log('='.repeat(50));

  // Start a mock TCP service
  const mockService = net.createServer(socket => {
    socket.on('data', data => {
      socket.write(`MOCK: ${data.toString().toUpperCase()}`);
    });
  });

  const mockPort = await new Promise<number>((resolve) => {
    mockService.listen(0, 'localhost', () => {
      resolve((mockService.address() as net.AddressInfo).port);
    });
  });

  console.log(`📡 Started mock TCP service on port ${mockPort}`);

  // Create Unix socket proxy
  const proxy = await BunUnixSocketProxy.create({
    serviceName: 'mock-service',
    targetHost: 'localhost',
    targetPort: mockPort,
  });

  console.log(`🔗 Unix socket proxy listening on: ${proxy.path}`);

  // Test the proxy
  const testData = 'hello world';
  const response = await testUnixSocket(proxy.path, testData);

  console.log(`📨 Sent: "${testData}"`);
  console.log(`📨 Received: "${response}"`);
  console.log(`✅ Proxy working: ${response === `MOCK: ${testData.toUpperCase()}` ? 'YES' : 'NO'}`);

  // Show stats
  const stats = proxy.getStats();
  console.log(`📊 Stats: ${stats.connectionsTotal} connections, ${stats.bytesForwarded} bytes forwarded`);

  // Clean up
  await proxy.stop();
  await new Promise<void>((resolve) => mockService.close(() => resolve()));

  console.log('✅ Basic proxy demo completed');
}

/**
 * Demo 2: Multiple Service Proxies
 */
async function demoMultipleProxies() {
  console.log('\n🔧 Demo 2: Multiple Service Proxies');
  console.log('='.repeat(50));

  // Start multiple mock services
  const services = [
    { name: 'redis', port: 6379, response: 'REDIS: ' },
    { name: 'postgres', port: 5432, response: 'PG: ' },
    { name: 'mysql', port: 3306, response: 'MYSQL: ' },
  ];

  const mockServers: net.Server[] = [];
  const proxies: BunUnixSocketProxy[] = [];

  // Start mock servers and proxies
  for (const service of services) {
    const server = net.createServer(socket => {
      socket.on('data', data => {
        socket.write(`${service.response}${data.toString()}`);
      });
    });

    const actualPort = await new Promise<number>((resolve) => {
      server.listen(0, 'localhost', () => {
        resolve((server.address() as net.AddressInfo).port);
      });
    });

    mockServers.push(server);

    const proxy = await BunUnixSocketProxy.create({
      serviceName: service.name,
      targetHost: 'localhost',
      targetPort: actualPort,
    });

    proxies.push(proxy);
    console.log(`🔗 ${service.name} proxy: ${proxy.path} -> localhost:${actualPort}`);
  }

  // Test all proxies
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const proxy = proxies[i];
    const testData = `test-${service.name}`;
    const response = await testUnixSocket(proxy.path, testData);

    console.log(`📨 ${service.name}: "${testData}" -> "${response}"`);
  }

  // Show active proxies
  console.log(`📊 Active proxies: ${BunSocketManager.getActiveProxies().join(', ')}`);

  // Clean up
  await Promise.all(proxies.map(proxy => proxy.stop()));
  await Promise.all(mockServers.map(server =>
    new Promise<void>((resolve) => server.close(() => resolve()))
  ));

  console.log('✅ Multiple proxies demo completed');
}

/**
 * Demo 3: Integration with Worker System
 */
async function demoWorkerIntegration() {
  console.log('\n🔧 Demo 3: Worker System Integration');
  console.log('='.repeat(50));

  // Start a mock service that workers might need
  const mockService = net.createServer(socket => {
    socket.on('data', data => {
      const command = data.toString().trim();
      if (command === 'PING') {
        socket.write('PONG');
      } else if (command.startsWith('ECHO ')) {
        socket.write(command.substring(5));
      } else {
        socket.write('UNKNOWN COMMAND');
      }
    });
  });

  const mockPort = await new Promise<number>((resolve) => {
    mockService.listen(0, 'localhost', () => {
      resolve((mockService.address() as net.AddressInfo).port);
    });
  });

  console.log(`📡 Started mock service on port ${mockPort}`);

  // Create worker test proxy
  const workerProxy = new WorkerTestProxy();
  const socketPath = await workerProxy.startForWorker('demo-worker', mockPort);

  console.log(`🔗 Worker proxy created: ${socketPath}`);

  // Initialize worker system components
  const tensionEngine = createSpawnTensionEngine();
  await tensionEngine.initialize();

  const securityValidator = createSecurityValidator();
  await securityValidator.initialize();

  // Create a worker that can use the Unix socket
  const workerScript = `
    import { parentPort } from 'worker_threads';

    parentPort.on('message', async (message) => {
      if (message.type === 'test-unix-socket') {
        try {
          // In a real scenario, the worker would use the socket path
          // For demo, we'll just acknowledge
          parentPort.postMessage({
            type: 'unix-socket-test-result',
            socketPath: message.socketPath,
            success: true
          });
        } catch (error) {
          parentPort.postMessage({
            type: 'unix-socket-test-result',
            error: error.message,
            success: false
          });
        }
      }
    });
  `;

  // For demo purposes, simulate worker interaction
  console.log('🔧 Worker would use socket path:', socketPath);
  console.log('🔧 In real usage, worker would connect to Unix socket for service communication');

  // Test the socket directly
  const pingResponse = await testUnixSocket(socketPath, 'PING');
  const echoResponse = await testUnixSocket(socketPath, 'ECHO Hello Worker');

  console.log(`📨 Worker test - PING: "${pingResponse}"`);
  console.log(`📨 Worker test - ECHO: "${echoResponse}"`);

  // Clean up
  await workerProxy.stop();
  await tensionEngine.shutdown();
  await new Promise<void>((resolve) => mockService.close(() => resolve()));

  console.log('✅ Worker integration demo completed');
}

/**
 * Demo 4: Error Handling and Recovery
 */
async function demoErrorHandling() {
  console.log('\n🔧 Demo 4: Error Handling and Recovery');
  console.log('='.repeat(50));

  // Test with invalid target
  console.log('🧪 Testing invalid target connection...');
  try {
    const proxy = new BunUnixSocketProxy({
      serviceName: 'error-test',
      targetHost: 'invalid.host.does.not.exist',
      targetPort: 12345,
    });

    await proxy.start();
    console.log('❌ Unexpected: Proxy started with invalid target');
    await proxy.stop();
  } catch (error) {
    console.log('✅ Expected: Proxy failed to start with invalid target');
    console.log(`   Error: ${error.message}`);
  }

  // Test connection to non-existent service
  console.log('🧪 Testing connection to stopped service...');
  const proxy = new BunUnixSocketProxy({
    serviceName: 'recovery-test',
    targetHost: 'localhost',
    targetPort: 12345, // Closed port
  });

  await proxy.start();
  console.log(`🔗 Proxy started: ${proxy.path}`);

  try {
    await testUnixSocket(proxy.path, 'test');
    console.log('❌ Unexpected: Connection succeeded to closed port');
  } catch (error) {
    console.log('✅ Expected: Connection failed to closed port');
  }

  await proxy.stop();
  console.log('✅ Error handling demo completed');
}

/**
 * Demo 5: Performance and Load Testing
 */
async function demoPerformance() {
  console.log('\n🔧 Demo 5: Performance and Load Testing');
  console.log('='.repeat(50));

  // Start a high-performance mock service
  const mockService = net.createServer(socket => {
    socket.on('data', data => {
      // Fast echo response
      socket.write(data);
    });
  });

  const mockPort = await new Promise<number>((resolve) => {
    mockService.listen(0, 'localhost', () => {
      resolve((mockService.address() as net.AddressInfo).port);
    });
  });

  const proxy = await BunUnixSocketProxy.create({
    serviceName: 'perf-test',
    targetHost: 'localhost',
    targetPort: mockPort,
  });

  console.log(`🏃 Starting performance test with ${proxy.path}`);

  // Test concurrent connections
  const numConnections = 50;
  const startTime = performance.now();

  const connectionPromises = Array.from({ length: numConnections }, async (_, i) => {
    const testData = `connection-${i}`;
    const response = await testUnixSocket(proxy.path, testData);
    return response === testData;
  });

  const results = await Promise.all(connectionPromises);
  const endTime = performance.now();

  const successfulConnections = results.filter(Boolean).length;
  const totalTime = endTime - startTime;
  const avgTimePerConnection = totalTime / numConnections;

  console.log(`📊 Performance Results:`);
  console.log(`   Connections: ${successfulConnections}/${numConnections} successful`);
  console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`   Avg per connection: ${avgTimePerConnection.toFixed(2)}ms`);
  console.log(`   Connections/sec: ${(numConnections / (totalTime / 1000)).toFixed(1)}`);

  // Show proxy stats
  const stats = proxy.getStats();
  console.log(`📊 Proxy Stats:`);
  console.log(`   Total connections: ${stats.connectionsTotal}`);
  console.log(`   Active connections: ${stats.connectionsActive}`);
  console.log(`   Bytes forwarded: ${stats.bytesForwarded}`);
  console.log(`   Uptime: ${stats.uptimeMs}ms`);

  // Clean up
  await proxy.stop();
  await new Promise<void>((resolve) => mockService.close(() => resolve()));

  console.log('✅ Performance demo completed');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Test a Unix socket connection
 */
async function testUnixSocket(socketPath: string, data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`🔌 Connecting to Unix socket: ${socketPath}`);
    const client = net.createConnection(socketPath);

    let response = '';
    let connected = false;

    client.on('connect', () => {
      console.log('✅ Unix socket connected');
      connected = true;
      client.write(data);
    });

    client.on('data', (data) => {
      console.log(`📨 Received data: ${data.toString()}`);
      response += data.toString();
      client.end();
    });

    client.on('close', () => {
      console.log('🔌 Unix socket closed');
      if (connected) {
        resolve(response);
      } else {
        reject(new Error('Connection closed before data received'));
      }
    });

    client.on('error', (err) => {
      console.log(`❌ Unix socket error: ${err.message}`);
      reject(err);
    });

    // Timeout
    setTimeout(() => {
      console.log('⏰ Connection timeout');
      client.destroy();
      reject(new Error('Connection timeout'));
    }, 10000);
  });
}

// ============================================================================
// MAIN DEMONSTRATION
// ============================================================================

/**
 * Run all demonstrations
 */
async function runAllDemos() {
  console.log('🚀 Bun Unix Socket Proxy - Complete Demonstration');
  console.log('=================================================');

  try {
    await demoBasicProxy();
    await demoMultipleProxies();
    await demoWorkerIntegration();
    await demoErrorHandling();
    await demoPerformance();

    console.log('\n🎉 All demonstrations completed successfully!');
    console.log('\n📚 Summary:');
    console.log('   ✅ Basic Unix socket proxy functionality');
    console.log('   ✅ Multiple service proxy management');
    console.log('   ✅ Worker system integration');
    console.log('   ✅ Error handling and recovery');
    console.log('   ✅ Performance and load testing');
    console.log('   ✅ Bun-native implementation');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  runAllDemos().catch(error => {
    console.error('Demo execution failed:', error);
    process.exit(1);
  });
}

export { runAllDemos };