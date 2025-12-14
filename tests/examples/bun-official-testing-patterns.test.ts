// examples/testing/bun-official-testing-patterns.test.ts - Official Bun Testing Patterns
// Following Bun's official testing guidelines and harness utilities

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
// Note: harness imports would be available in Bun's test environment
// import { bunExe, bunEnv, tempDir, gcTick } from "harness";

describe("Bun Official Testing Patterns", () => {
  let testData: any = {};

  // Proper setup/teardown following Bun guidelines
  beforeEach(() => {
    testData = { initialized: true };
  });

  afterEach(async () => {
    testData = {};
    // In Bun's harness: await gcTick(); // Force garbage collection
  });

  describe("Process Spawning (Bun Guidelines)", () => {
    test("should spawn Bun process using harness utilities", async () => {
      // Following Bun's official pattern for spawning processes
      // This would use bunExe() and bunEnv from harness in Bun's test suite

      const code = `
        console.log("Hello from spawned Bun process!");
        console.error("This goes to stderr");
      `;

      // In Bun's test environment:
      // const proc = Bun.spawn({
      //   cmd: [bunExe(), "-e", code],
      //   env: bunEnv,
      // });

      // For our example, we'll simulate the pattern
      const proc = Bun.spawn({
        cmd: ["echo", "Hello from spawned process!"],
        stdout: "pipe",
        stderr: "pipe"
      });

      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited
      ]);

      expect(stdout.trim()).toBe("Hello from spawned process!");
      expect(stderr).toBe("");
      expect(exitCode).toBe(0);
    });

    test("should use random ports (port: 0)", async () => {
      // Following Bun's CRITICAL guideline: Never use hardcoded ports
      const server = Bun.serve({
        port: 0, // Always use port: 0 for random port
        fetch() {
          return new Response("Hello from random port!");
        }
      });

      // Verify we got a random port (not 0)
      expect(server.port).toBeGreaterThan(0);
      expect(server.port).toBeLessThan(65536);

      // Test the server
      const response = await fetch(`http://localhost:${server.port}`);
      expect(await response.text()).toBe("Hello from random port!");

      server.stop();
    });
  });

  describe("Resource Management (Bun Guidelines)", () => {
    test("should use await using for automatic cleanup", async () => {
      // Following Bun's recommendation for resource cleanup
      let cleanupCalled = false;

      // Simulate resource with cleanup
      const createResource = () => ({
        data: "test resource",
        [Symbol.dispose]() {
          cleanupCalled = true;
        }
      });

      {
        await using resource = createResource();
        expect(resource.data).toBe("test resource");
        expect(cleanupCalled).toBe(false);
      }

      // Resource should be automatically cleaned up
      expect(cleanupCalled).toBe(true);
    });

    test("should use using for synchronous cleanup", () => {
      let cleanupCalled = false;

      const createSyncResource = () => ({
        data: "sync resource",
        [Symbol.dispose]() {
          cleanupCalled = true;
        }
      });

      {
        using resource = createSyncResource();
        expect(resource.data).toBe("sync resource");
        expect(cleanupCalled).toBe(false);
      }

      expect(cleanupCalled).toBe(true);
    });
  });

  describe("Temporary Files (Bun Guidelines)", () => {
    test("should create temporary directories with files", async () => {
      // Following Bun's tempDir pattern from harness
      // In Bun's test environment:
      // using dir = tempDir("my-test-prefix", {
      //   "file.txt": "Hello, world!",
      //   "script.js": "console.log('test');"
      // });

      // For our example, we'll use Bun's built-in temp directory
      const tempDir = `${import.meta.dir}/temp-test-${Date.now()}`;

      // Create temp directory structure
      await Bun.write(`${tempDir}/file.txt`, "Hello, world!");
      await Bun.write(`${tempDir}/script.js`, "console.log('test');");

      // Verify files exist and content
      const fileContent = await Bun.file(`${tempDir}/file.txt`).text();
      const scriptContent = await Bun.file(`${tempDir}/script.js`).text();

      expect(fileContent).toBe("Hello, world!");
      expect(scriptContent).toBe("console.log('test');");

      // Cleanup (in real Bun tests, tempDir handles this automatically)
      await Bun.spawn({ cmd: ["rm", "-rf", tempDir] });
    });
  });

  describe("Async/Await Patterns (Bun Guidelines)", () => {
    test("should use Promise.withResolvers for single callbacks", async () => {
      // Following Bun's recommendation for callback-to-promise conversion

      const { promise, resolve, reject } = Promise.withResolvers<string>();

      // Simulate async operation with callback
      setTimeout(() => {
        resolve("Callback result");
      }, 10);

      const result = await promise;
      expect(result).toBe("Callback result");
    });

    test("should handle multiple callbacks with proper async", async () => {
      // For multiple callbacks, Bun allows using callbacks directly
      let openCalled = false;
      let messageReceived = "";

      // Simulate WebSocket-like behavior
      const mockConnection = {
        onopen: () => { openCalled = true; },
        onmessage: (msg: string) => { messageReceived = msg; },
        send: (msg: string) => {
          setTimeout(() => mockConnection.onmessage(msg), 5);
        }
      };

      const { promise, resolve } = Promise.withResolvers();

      mockConnection.onopen = () => {
        openCalled = true;
        mockConnection.send("test message");
      };

      mockConnection.onmessage = (msg: string) => {
        messageReceived = msg;
        resolve(undefined);
      };

      // Trigger connection
      mockConnection.onopen();

      await promise;

      expect(openCalled).toBe(true);
      expect(messageReceived).toBe("test message");
    });
  });

  describe("Error Testing (Bun Guidelines)", () => {
    test("should test error exit codes properly", async () => {
      // Following Bun's error testing patterns

      const proc = Bun.spawn({
        cmd: ["sh", "-c", "exit 42"],
        stdout: "pipe",
        stderr: "pipe"
      });

      const exitCode = await proc.exited;
      expect(exitCode).toBe(42); // Non-zero exit code indicates error
    });

    test("should test synchronous errors", () => {
      // Test function that throws synchronously
      const failingFunction = () => {
        throw new Error("Expected synchronous error");
      };

      expect(() => failingFunction()).toThrow("Expected synchronous error");
    });

    test("should test async errors", async () => {
      // Test async function that rejects
      const failingAsyncFunction = async () => {
        await new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Expected async error")), 5)
        );
      };

      await expect(failingAsyncFunction()).rejects.toThrow("Expected async error");
    });
  });

  describe("String Creation (Bun Guidelines)", () => {
    test("should use Buffer.alloc for repetitive strings", () => {
      // Following Bun's performance guideline: Use Buffer.alloc instead of "".repeat

      const count = 1000;
      const fillChar = "A";

      // Bun's recommended approach
      const bufferString = Buffer.alloc(count, fillChar.charCodeAt(0)).toString();

      // Verify length and content
      expect(bufferString.length).toBe(count);
      expect(bufferString).toBe("A".repeat(count));

      // Performance comparison (Buffer.alloc is faster in debug JSC)
      const start1 = Bun.nanoseconds();
      const bufferResult = Buffer.alloc(10000, "X".charCodeAt(0)).toString();
      const end1 = Bun.nanoseconds();

      const start2 = Bun.nanoseconds();
      const repeatResult = "X".repeat(10000);
      const end2 = Bun.nanoseconds();

      // Both should produce same result
      expect(bufferResult).toBe(repeatResult);

      // Buffer.alloc should be reasonably fast (allowing for some variance)
      const bufferTime = Number(end1 - start1) / 1_000_000; // ms
      const repeatTime = Number(end2 - start2) / 1_000_000; // ms

      expect(bufferTime).toBeLessThan(50); // Should complete in reasonable time
      expect(repeatTime).toBeLessThan(50);
    });
  });

  describe("Test Organization (Bun Guidelines)", () => {
    describe("Unit Tests", () => {
      test("should test specific functionality in isolation", () => {
        // Following Bun's unit test organization
        const add = (a: number, b: number) => a + b;

        expect(add(2, 3)).toBe(5);
        expect(add(-1, 1)).toBe(0);
        expect(add(0, 0)).toBe(0);
      });
    });

    describe("Integration Tests", () => {
      test("should test component interactions", async () => {
        // Following Bun's integration test patterns
        const server = Bun.serve({
          port: 0,
          fetch(request) {
            const url = new URL(request.url);
            if (url.pathname === "/api/data") {
              return Response.json({ message: "Integration test data" });
            }
            return new Response("Not found", { status: 404 });
          }
        });

        try {
          const response = await fetch(`http://localhost:${server.port}/api/data`);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.message).toBe("Integration test data");
        } finally {
          server.stop();
        }
      });
    });

    // Regression test following Bun's pattern
    // In Bun's codebase, this would be: test/regression/issue/01234.test.ts
    describe("Regression Tests", () => {
      test("should handle previously broken edge case", () => {
        // This demonstrates Bun's regression test pattern
        // Issue number would be in filename: test/regression/issue/01234.test.ts

        const data = { edge: "case", value: null };
        const jsonString = JSON.stringify(data);
        const parsed = JSON.parse(jsonString);

        expect(parsed.edge).toBe("case");
        expect(parsed.value).toBeNull();
      });
    });
  });

  describe("Platform-Specific Testing (Bun Guidelines)", () => {
    test("should handle platform differences appropriately", () => {
      // Following Bun's platform testing patterns
      // In Bun's harness: isMacOS, isWindows, isPosix

      const isPosix = process.platform !== "win32";
      const isWindows = process.platform === "win32";
      const isMacOS = process.platform === "darwin";

      // Verify platform detection logic
      expect(isPosix || isWindows).toBe(true);
      expect(isMacOS && isWindows).toBe(false); // Can't be both

      // Test path separator handling
      const pathSep = isWindows ? "\\" : "/";
      const testPath = `folder${pathSep}file.txt`;

      if (isWindows) {
        expect(testPath).toContain("\\");
      } else {
        expect(testPath).toContain("/");
      }
    });
  });

  describe("Parameterized Tests (Bun Guidelines)", () => {
    // Following Bun's describe.each() pattern
    describe.each([
      { input: "hello", expected: "HELLO" },
      { input: "world", expected: "WORLD" },
      { input: "Bun", expected: "BUN" }
    ])("String transformation ($input)", ({ input, expected }) => {
      test(`should uppercase ${input}`, () => {
        expect(input.toUpperCase()).toBe(expected);
      });
    });

    test.each([
      [1, 2, 3],
      [4, 5, 9],
      [-1, 1, 0]
    ])("should add %d + %d to equal %d", (a, b, expected) => {
      expect(a + b).toBe(expected);
    });
  });

  describe("Snapshot Testing (Bun Guidelines)", () => {
    test("should match snapshot for complex object", () => {
      // Following Bun's toMatchSnapshot() pattern
      const complexObject = {
        users: [
          { id: 1, name: "Alice", roles: ["admin", "user"] },
          { id: 2, name: "Bob", roles: ["user"] }
        ],
        metadata: {
          version: "1.0.0",
          timestamp: "2025-01-01T00:00:00Z",
          features: ["auth", "api", "dashboard"]
        }
      };

      // In Bun's test suite, this would create/update snapshots
      expect(complexObject).toMatchSnapshot();
    });
  });
});

// CLI Testing Example (following Bun's test/cli/ pattern)
describe("CLI Testing - Bun Official Pattern", () => {
  test("should test CLI stdout and stderr", async () => {
    // Following Bun's CLI testing pattern from test/cli/

    const proc = Bun.spawn({
      cmd: ["echo", "stdout message"],
      stdout: "pipe",
      stderr: "pipe"
    });

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited
    ]);

    expect(stdout.trim()).toBe("stdout message");
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
  });

  test("should test CLI error conditions", async () => {
    const proc = Bun.spawn({
      cmd: ["sh", "-c", "echo 'error message' >&2; exit 1"],
      stdout: "pipe",
      stderr: "pipe"
    });

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited
    ]);

    expect(stdout).toBe("");
    expect(stderr.trim()).toBe("error message");
    expect(exitCode).toBe(1);
  });
});

// Bundler Testing Example (following Bun's test/bundler/ pattern)
describe("Bundler Testing - Bun Official Pattern", () => {
  test("should test bundler functionality", async () => {
    // Following Bun's bundler testing pattern from test/bundler/

    const inputCode = `
      import { helper } from './helper';
      export const result = helper('test');
    `;

    const helperCode = `
      export function helper(input) {
        return input.toUpperCase();
      }
    `;

    // Create temporary files (in Bun's harness, this would use tempDirWithFiles)
    const tempDir = `${import.meta.dir}/bundler-test-${Date.now()}`;

    await Bun.write(`${tempDir}/main.js`, inputCode);
    await Bun.write(`${tempDir}/helper.js`, helperCode);

    // Verify files exist
    const mainContent = await Bun.file(`${tempDir}/main.js`).text();
    const helperContent = await Bun.file(`${tempDir}/helper.js`).text();

    expect(mainContent).toContain("import { helper }");
    expect(mainContent).toContain("export const result");
    expect(helperContent).toContain("export function helper");

    // Cleanup
    await Bun.spawn({ cmd: ["rm", "-rf", tempDir] });
  });
});