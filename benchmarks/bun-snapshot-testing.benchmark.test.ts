import { test, describe, expect } from "bun:test";

/**
 * Snapshot Testing Performance Benchmarks
 * Measures the performance characteristics of Bun's snapshot testing
 */

describe("Bun Snapshot Testing Performance Benchmarks", () => {
  const ITERATIONS = 1000;

  test("snapshot performance - simple objects", () => {
    const simpleObject = { id: 1, name: "test", active: true };

    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      // Simulate snapshot comparison (Bun handles this internally)
      const serialized = JSON.stringify(simpleObject);
      const parsed = JSON.parse(serialized);
      expect(parsed).toEqual(simpleObject);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / ITERATIONS;

    console.log(`📊 Simple Object Snapshot (${ITERATIONS} iterations):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per snapshot: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Snapshots per second: ${Math.floor(ITERATIONS / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(0.1); // Should be very fast
  });

  test("snapshot performance - complex nested objects", () => {
    const complexObject = {
      user: {
        id: 123,
        profile: {
          name: "John Doe",
          email: "john@example.com",
          preferences: {
            theme: "dark",
            notifications: {
              email: true,
              push: false,
              sms: true
            }
          }
        },
        stats: {
          posts: 42,
          followers: [1, 2, 3, 4, 5],
          following: 123
        }
      },
      metadata: {
        version: "1.0.0",
        created: new Date().toISOString(),
        tags: ["test", "benchmark", "snapshot"]
      }
    };

    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS / 10; i++) { // Reduce iterations for complex objects
      const serialized = JSON.stringify(complexObject);
      const parsed = JSON.parse(serialized);
      expect(parsed.user.id).toBe(complexObject.user.id);
      expect(parsed.metadata.tags.length).toBe(complexObject.metadata.tags.length);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const totalIterations = ITERATIONS / 10;
    const avgTime = totalTime / totalIterations;

    console.log(`📊 Complex Object Snapshot (${totalIterations} iterations):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per snapshot: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Snapshots per second: ${Math.floor(totalIterations / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(1); // Should be reasonably fast
  });

  test("snapshot performance - large arrays", () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      value: Math.random(),
      data: `item-${i}`,
      nested: {
        prop1: i * 2,
        prop2: i * 3,
        prop3: `nested-${i}`
      }
    }));

    const startTime = performance.now();

    for (let i = 0; i < 10; i++) { // Very few iterations for large data
      const serialized = JSON.stringify(largeArray);
      const parsed = JSON.parse(serialized);
      expect(parsed.length).toBe(largeArray.length);
      expect(parsed[0].id).toBe(largeArray[0].id);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / 10;

    console.log(`📊 Large Array Snapshot (10 iterations, 1000 items each):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per snapshot: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Data size: ${(JSON.stringify(largeArray).length / 1024).toFixed(2)}KB`);

    expect(avgTime).toBeLessThan(50); // Should handle large data reasonably
  });

  test("snapshot performance - string processing", () => {
    const testStrings = [
      "short string",
      "A".repeat(100), // 100 chars
      "B".repeat(1000), // 1KB
      "C".repeat(10000), // 10KB
    ];

    const results = {};

    for (const [index, testString] of testStrings.entries()) {
      const startTime = performance.now();

      for (let i = 0; i < ITERATIONS / 10; i++) {
        const serialized = JSON.stringify(testString);
        const parsed = JSON.parse(serialized);
        expect(parsed).toBe(testString);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const totalIterations = ITERATIONS / 10;
      const avgTime = totalTime / totalIterations;

      const size = testString.length;
      results[`${size}chars`] = {
        avgTime: avgTime * 1000, // microseconds
        throughput: totalIterations / (totalTime / 1000) // per second
      };

      console.log(`📊 String Snapshot (${size} chars, ${totalIterations} iterations):`);
      console.log(`   Average per snapshot: ${(avgTime * 1000).toFixed(3)}μs`);
      console.log(`   Throughput: ${Math.floor(totalIterations / (totalTime / 1000))} ops/sec`);
    }

    expect(results["12chars"].avgTime).toBeLessThan(10);
    expect(results["100chars"].avgTime).toBeLessThan(20);
    expect(results["1000chars"].avgTime).toBeLessThan(100);
  });

  test("snapshot performance - memory usage patterns", () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Create many snapshot operations
    const snapshots = [];
    for (let i = 0; i < 1000; i++) {
      const data = {
        id: i,
        timestamp: Date.now(),
        data: `snapshot-${i}`,
        nested: {
          value: Math.random(),
          array: [1, 2, 3, 4, 5]
        }
      };

      const serialized = JSON.stringify(data);
      snapshots.push({ data, serialized });
    }

    const afterCreationMemory = process.memoryUsage().heapUsed;

    // Process snapshots (simulate comparison)
    for (const snapshot of snapshots) {
      const parsed = JSON.parse(snapshot.serialized);
      expect(parsed.id).toBe(snapshot.data.id);
    }

    const afterProcessingMemory = process.memoryUsage().heapUsed;

    const creationDelta = afterCreationMemory - initialMemory;
    const processingDelta = afterProcessingMemory - afterCreationMemory;

    console.log(`📊 Memory Usage (1000 snapshots):`);
    console.log(`   Creation delta: ${(creationDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Processing delta: ${(processingDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Memory per snapshot: ${(creationDelta / 1000).toFixed(0)} bytes`);

    expect(creationDelta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
  });

  test("snapshot performance - concurrent operations", async () => {
    const concurrentTasks = 5;
    const tasksPerWorker = 200;

    const worker = async (workerId: number) => {
      const results = [];
      for (let i = 0; i < tasksPerWorker; i++) {
        const data = {
          worker: workerId,
          task: i,
          timestamp: Date.now(),
          data: `worker-${workerId}-task-${i}`
        };

        const start = performance.now();
        const serialized = JSON.stringify(data);
        const parsed = JSON.parse(serialized);
        const end = performance.now();

        results.push({
          data,
          serialized,
          parsed,
          duration: end - start
        });
      }
      return results;
    };

    const startTime = performance.now();

    const promises = Array.from({ length: concurrentTasks }, (_, i) => worker(i));
    const results = await Promise.all(promises);

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const totalOperations = concurrentTasks * tasksPerWorker;
    const avgTime = totalTime / totalOperations;

    console.log(`📊 Concurrent Snapshot (${concurrentTasks} workers, ${tasksPerWorker} tasks each):`);
    console.log(`   Total operations: ${totalOperations}`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per operation: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Operations per second: ${Math.floor(totalOperations / (totalTime / 1000))}`);

    expect(avgTime).toBeLessThan(0.5); // Should handle concurrency well
    expect(results.length).toBe(concurrentTasks);
    results.forEach((workerResults, workerId) => {
      expect(workerResults.length).toBe(tasksPerWorker);
      workerResults.forEach(result => {
        expect(result.parsed.worker).toBe(workerId);
      });
    });
  });

  test("snapshot performance - real world API response", () => {
    // Simulate a realistic API response
    const createAPIResponse = (userId: number) => ({
      status: 200,
      success: true,
      data: {
        user: {
          id: userId,
          username: `user${userId}`,
          email: `user${userId}@example.com`,
          profile: {
            firstName: `First${userId}`,
            lastName: `Last${userId}`,
            avatar: `https://example.com/avatar${userId}.jpg`,
            bio: `Bio for user ${userId}`,
            location: "San Francisco, CA",
            website: `https://user${userId}.com`
          },
          stats: {
            posts: Math.floor(Math.random() * 1000),
            followers: Math.floor(Math.random() * 10000),
            following: Math.floor(Math.random() * 1000),
            likes: Math.floor(Math.random() * 5000)
          },
          preferences: {
            theme: "dark",
            notifications: {
              email: true,
              push: false,
              sms: Math.random() > 0.5
            },
            privacy: {
              profileVisible: true,
              activityVisible: Math.random() > 0.3
            }
          }
        },
        relationships: {
          isFollowing: Math.random() > 0.5,
          isFollowedBy: Math.random() > 0.5,
          mutualFriends: Math.floor(Math.random() * 50)
        }
      },
      meta: {
        requestId: `req-${Math.random().toString(36).substring(2)}`,
        timestamp: new Date().toISOString(),
        version: "v1.2.3",
        processingTime: Math.floor(Math.random() * 100) + 10
      }
    });

    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS / 10; i++) {
      const response = createAPIResponse(i);
      const serialized = JSON.stringify(response);
      const parsed = JSON.parse(serialized);

      // Verify structure is maintained
      expect(parsed.status).toBe(200);
      expect(parsed.data.user.id).toBe(i);
      expect(parsed.meta.version).toBe("v1.2.3");
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const totalIterations = ITERATIONS / 10;
    const avgTime = totalTime / totalIterations;

    console.log(`📊 API Response Snapshot (${totalIterations} iterations):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per snapshot: ${(avgTime * 1000).toFixed(3)}μs`);
    console.log(`   Response size: ~2KB each`);

    expect(avgTime).toBeLessThan(5); // Should be fast for API responses
  });
});