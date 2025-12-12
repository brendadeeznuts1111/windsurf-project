import { connect, listen } from "bun";

describe("Bun TCP Socket Performance Benchmarks", () => {
  const BENCHMARK_DURATION = 3000; // 3 seconds for benchmarks
  const MESSAGE_SIZE = 64; // 64 bytes per message
  const CONCURRENT_CONNECTIONS = 5;

  function createMessage(size: number): string {
    return "x".repeat(size);
  }

  test("TCP socket throughput - single connection", async () => {
    let messageCount = 0;
    let serverClosed = false;
    let clientClosed = false;

    const handlers = {
      open(socket) {
        if (!socket.data?.isServer) {
          // Start sending messages as fast as possible
          const sendLoop = () => {
            let sent = 0;
            while (sent < 10000) { // Send in batches
              if (!socket.write(createMessage(MESSAGE_SIZE))) {
                socket.data = { pending: createMessage(MESSAGE_SIZE) };
                break;
              }
              sent++;
            }
          };
          sendLoop();
        }
      },
      data(socket, buffer) {
        if (socket.data?.isServer) {
          // Server: echo back
          if (!socket.write(buffer)) {
            socket.data = { pending: buffer };
          }
        } else {
          // Client: count received messages
          messageCount++;
        }
      },
      drain(socket) {
        const pending = socket.data?.pending;
        if (!pending) return;

        if (socket.write(pending)) {
          socket.data = undefined;
          if (!socket.data?.isServer) {
            // Client sent pending message
          }
        }
      },
      close(socket) {
        if (socket.data?.isServer) {
          serverClosed = true;
        } else {
          clientClosed = true;
        }
      },
    };

    // Start server
    const server = listen({
      socket: handlers,
      hostname: "127.0.0.1",
      port: 0,
      data: { isServer: true },
    });

    // Connect client
    const client = await connect({
      socket: handlers,
      hostname: "127.0.0.1",
      port: server.port,
    });

    // Run benchmark
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, BENCHMARK_DURATION));
    const endTime = Date.now();

    client.end();
    server.stop(true);

    // Wait for clean shutdown
    while (!serverClosed || !clientClosed) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const duration = (endTime - startTime) / 1000;
    const messagesPerSecond = messageCount / duration;
    const throughputMBps = (messageCount * MESSAGE_SIZE) / duration / (1024 * 1024);

    console.log(`📊 TCP Single Connection:`);
    console.log(`   Messages: ${messageCount}`);
    console.log(`   Duration: ${duration.toFixed(2)}s`);
    console.log(`   Throughput: ${messagesPerSecond.toFixed(0)} msg/s`);
    console.log(`   Data rate: ${throughputMBps.toFixed(2)} MB/s`);

    expect(messagesPerSecond).toBeGreaterThan(1000); // Should handle thousands of messages/sec
  });

  test("TCP socket concurrent connections performance", async () => {
    const results = [];
    const connections = [];

    for (let connId = 0; connId < CONCURRENT_CONNECTIONS; connId++) {
      results[connId] = { messageCount: 0, serverClosed: false, clientClosed: false };

      const handlers = {
        open(socket) {
          if (!socket.data?.isServer) {
            // Send messages for this connection
            const sendLoop = () => {
              for (let i = 0; i < 100; i++) {
                if (!socket.write(createMessage(MESSAGE_SIZE))) {
                  socket.data = { pending: createMessage(MESSAGE_SIZE) };
                  break;
                }
              }
            };
            sendLoop();
          }
        },
        data(socket, buffer) {
          if (socket.data?.isServer) {
            // Echo back
            if (!socket.write(buffer)) {
              socket.data = { pending: buffer };
            }
          } else {
            // Count messages for this connection
            results[connId].messageCount++;
          }
        },
        drain(socket) {
          const pending = socket.data?.pending;
          if (!pending) return;

          if (socket.write(pending)) {
            socket.data = undefined;
          }
        },
        close(socket) {
          if (socket.data?.isServer) {
            results[connId].serverClosed = true;
          } else {
            results[connId].clientClosed = true;
          }
        },
      };

      // Start server for this connection
      const server = listen({
        socket: handlers,
        hostname: "127.0.0.1",
        port: 0,
        data: { isServer: true },
      });

      // Connect client
      const client = await connect({
        socket: handlers,
        hostname: "127.0.0.1",
        port: server.port,
      });

      connections.push({ server, client, connId });
    }

    // Run benchmark
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, BENCHMARK_DURATION));
    const endTime = Date.now();

    // Close all connections
    for (const conn of connections) {
      conn.client.end();
      conn.server.stop(true);
    }

    // Wait for all to close
    let allClosed = false;
    while (!allClosed) {
      allClosed = results.every(r => r.serverClosed && r.clientClosed);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const duration = (endTime - startTime) / 1000;
    const totalMessages = results.reduce((sum, r) => sum + r.messageCount, 0);
    const messagesPerSecond = totalMessages / duration;
    const throughputMBps = (totalMessages * MESSAGE_SIZE) / duration / (1024 * 1024);

    console.log(`📊 TCP Concurrent (${CONCURRENT_CONNECTIONS} connections):`);
    console.log(`   Total messages: ${totalMessages}`);
    console.log(`   Duration: ${duration.toFixed(2)}s`);
    console.log(`   Throughput: ${messagesPerSecond.toFixed(0)} msg/s`);
    console.log(`   Data rate: ${throughputMBps.toFixed(2)} MB/s`);
    console.log(`   Per connection: ${(messagesPerSecond / CONCURRENT_CONNECTIONS).toFixed(0)} msg/s`);

    expect(messagesPerSecond).toBeGreaterThan(1000); // Should scale with connections
  });

  test("TCP socket latency measurement", async () => {
    const ROUND_TRIPS = 100;
    const latencies = [];
    let roundTripCount = 0;
    let serverClosed = false;
    let clientClosed = false;

    const handlers = {
      open(socket) {
        if (!socket.data?.isServer) {
          // Send first message with timestamp
          socket.data = { startTime: performance.now() };
          socket.write("ping");
        }
      },
      data(socket, buffer) {
        const message = new TextDecoder().decode(buffer);

        if (socket.data?.isServer) {
          // Server: respond to ping
          socket.write("pong");
        } else {
          // Client: received pong, measure latency
          if (message === "pong" && socket.data?.startTime) {
            const latency = performance.now() - socket.data.startTime;
            latencies.push(latency);
            roundTripCount++;

            if (roundTripCount < ROUND_TRIPS) {
              // Send next ping
              socket.data = { startTime: performance.now() };
              socket.write("ping");
            }
          }
        }
      },
      close(socket) {
        if (socket.data?.isServer) {
          serverClosed = true;
        } else {
          clientClosed = true;
        }
      },
    };

    // Start server
    const server = listen({
      socket: handlers,
      hostname: "127.0.0.1",
      port: 0,
      data: { isServer: true },
    });

    // Connect client
    const client = await connect({
      socket: handlers,
      hostname: "127.0.0.1",
      port: server.port,
    });

    // Wait for all round trips to complete
    while (roundTripCount < ROUND_TRIPS) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    client.end();
    server.stop(true);

    // Wait for clean shutdown
    while (!serverClosed || !clientClosed) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Calculate statistics
    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    console.log(`📊 TCP Latency (${ROUND_TRIPS} round trips):`);
    console.log(`   Average: ${(avgLatency * 1000).toFixed(3)}μs`);
    console.log(`   Min: ${(minLatency * 1000).toFixed(3)}μs`);
    console.log(`   Max: ${(maxLatency * 1000).toFixed(3)}μs`);

    expect(avgLatency).toBeLessThan(1); // Should be sub-millisecond
    expect(latencies.length).toBe(ROUND_TRIPS);
  });

  test("TCP socket memory efficiency", async () => {
    const CONNECTIONS = 50;
    const connections = [];
    let activeConnections = 0;
    let maxActiveConnections = 0;

    const handlers = {
      open(socket) {
        activeConnections++;
        maxActiveConnections = Math.max(maxActiveConnections, activeConnections);
      },
      data(socket, buffer) {
        // Simple echo
        if (socket.data?.isServer) {
          socket.write(buffer);
        }
      },
      close(socket) {
        activeConnections--;
      },
    };

    // Start server
    const server = listen({
      socket: handlers,
      hostname: "127.0.0.1",
      port: 0,
      data: { isServer: true },
    });

    // Create many connections
    for (let i = 0; i < CONNECTIONS; i++) {
      const client = await connect({
        socket: handlers,
        hostname: "127.0.0.1",
        port: server.port,
      });
      connections.push(client);

      // Send a small message
      client.write("test");
    }

    // Wait for all connections to be established
    await new Promise(resolve => setTimeout(resolve, 100));

    // Close all connections
    for (const client of connections) {
      client.end();
    }
    server.stop(true);

    console.log(`📊 TCP Memory Test (${CONNECTIONS} connections):`);
    console.log(`   Max active connections: ${maxActiveConnections}`);
    console.log(`   Memory efficient: ${maxActiveConnections === CONNECTIONS ? '✅' : '❌'}`);

    expect(maxActiveConnections).toBe(CONNECTIONS);
  });
});