import { connect, listen } from "bun";

describe("Bun TCP Socket Performance Demo", () => {
  const TEST_DURATION = 5000; // 5 seconds
  const MESSAGE = "Hello World!";

  test("TCP socket echo server performance", async () => {
    let messageCount = 0;
    let serverClosed = false;
    let clientClosed = false;

    const handlers = {
      open(socket) {
        if (!socket.data?.isServer) {
          // Client: start sending messages
          const sendMessages = () => {
            for (let i = 0; i < 100; i++) {
              if (!socket.write(MESSAGE)) {
                socket.data = { pending: MESSAGE };
                break;
              }
            }
          };
          sendMessages();
        }
      },
      data(socket, buffer) {
        if (socket.data?.isServer) {
          // Server: echo back the message
          if (!socket.write(buffer)) {
            socket.data = { pending: buffer };
          }
        } else {
          // Client: received echo, count it
          messageCount++;
        }
      },
      drain(socket) {
        const pending = socket.data?.pending;
        if (!pending) return;

        if (socket.write(pending)) {
          socket.data = undefined;
          if (!socket.data?.isServer) {
            messageCount++; // Client sent pending message
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
      port: 0, // Use random available port
      data: { isServer: true },
    });

    // Connect client
    const client = await connect({
      socket: handlers,
      hostname: "127.0.0.1",
      port: server.port,
    });

    // Run test for specified duration
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, TEST_DURATION));
    const endTime = Date.now();

    // Close connections
    client.end();
    server.stop(true);

    // Wait for clean shutdown
    while (!serverClosed || !clientClosed) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const duration = (endTime - startTime) / 1000;
    const messagesPerSecond = messageCount / duration;

    console.log(`📊 TCP Socket Performance:`);
    console.log(`   Messages processed: ${messageCount}`);
    console.log(`   Duration: ${duration.toFixed(2)}s`);
    console.log(`   Throughput: ${messagesPerSecond.toFixed(0)} messages/second`);

    expect(messageCount).toBeGreaterThan(1000); // Should handle reasonable load
    expect(messagesPerSecond).toBeGreaterThan(100); // Should be performant
  });

  test("TCP socket basic functionality", async () => {
    let serverReceived = "";
    let clientReceived = "";
    let serverClosed = false;
    let clientClosed = false;

    const handlers = {
      open(socket) {
        if (!socket.data?.isServer) {
          socket.write("Hello from client!");
        }
      },
      data(socket, buffer) {
        const message = new TextDecoder().decode(buffer);
        if (socket.data?.isServer) {
          serverReceived = message;
          socket.write("Hello from server!");
        } else {
          clientReceived = message;
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

    // Wait for communication
    let attempts = 0;
    while ((!serverReceived || !clientReceived) && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 10));
      attempts++;
    }

    // Close connections
    client.end();
    server.stop(true);

    // Wait for clean shutdown
    while (!serverClosed || !clientClosed) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    expect(serverReceived).toBe("Hello from client!");
    expect(clientReceived).toBe("Hello from server!");
  });

  test("TCP socket backpressure handling", async () => {
    let drainCount = 0;
    let writeAttempts = 0;
    let successfulWrites = 0;

    const handlers = {
      open(socket) {
        if (!socket.data?.isServer) {
          // Send many messages to trigger backpressure
          for (let i = 0; i < 1000; i++) {
            writeAttempts++;
            if (socket.write(`Message ${i}`)) {
              successfulWrites++;
            } else {
              socket.data = { pending: `Message ${i}` };
              break;
            }
          }
        }
      },
      data(socket, buffer) {
        // Server just acknowledges receipt
        if (socket.data?.isServer) {
          // Don't write back to avoid complicating the test
        }
      },
      drain(socket) {
        if (!socket.data?.isServer) {
          drainCount++;
          const pending = socket.data?.pending;
          if (pending && socket.write(pending)) {
            socket.data = undefined;
            successfulWrites++;
          }
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

    // Wait for operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    client.end();
    server.stop(true);

    console.log(`📊 Backpressure Test:`);
    console.log(`   Write attempts: ${writeAttempts}`);
    console.log(`   Successful writes: ${successfulWrites}`);
    console.log(`   Drain events: ${drainCount}`);

    expect(writeAttempts).toBeGreaterThan(0);
    expect(successfulWrites).toBeGreaterThan(0);
    // Drain events indicate backpressure was handled
  });
});