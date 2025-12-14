// examples/testing/test-config-performance-reliability.test.ts - Performance and Reliability Tests
// Focused tests for bunfig.toml configuration performance and consistency
// Based on Bun's test organization patterns

import { describe, test, expect } from "bun:test";

// Note: In Bun's test environment, these would be imported from harness:
// import { bunEnv, bunExe, tempDirWithFiles } from "harness";

// For our example, we'll simulate these utilities
const bunEnv = process.env;
const bunExe = () => "bun"; // In real Bun tests, this returns the debug build path

// Simulate tempDirWithFiles (in Bun's harness, this creates actual temp directories)
function tempDirWithFiles(name: string, files: Record<string, any>): string {
  const tempDir = `${import.meta.dir}/temp-test-${name}-${Date.now()}`;
  require("fs").mkdirSync(tempDir, { recursive: true });

  function createFiles(dir: string, fileStructure: Record<string, any>) {
    const fs = require("fs");
    const path = require("path");

    for (const [key, value] of Object.entries(fileStructure)) {
      const fullPath = path.join(dir, key);
      if (typeof value === "string") {
        fs.writeFileSync(fullPath, value);
      } else if (typeof value === "object") {
        fs.mkdirSync(fullPath, { recursive: true });
        createFiles(fullPath, value);
      }
    }
  }

  createFiles(tempDir, files);
  return tempDir;
}

// Cleanup utility
function cleanupTempDir(dir: string) {
  try {
    require("fs").rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup ${dir}:`, error);
  }
}

describe("Performance and Reliability Testing", () => {
  test("consistent randomization with same seed", async () => {
    const createTestDir = (seed: number) => tempDirWithFiles(`seed-${seed}`, {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        const tests = ["a", "b", "c", "d", "e"];
        tests.forEach(name => {
          test(name, () => {
            console.log("TEST:", name);
            expect(true).toBe(true);
          });
        });
      `,
      "bunfig.toml": `[test]\nrandomize = true\nseed = ${seed}`,
    });

    const dir1 = createTestDir(12345);
    const dir2 = createTestDir(12345);

    try {
      // Run both directories
      const results = await Promise.all([dir1, dir2].map(async (dir) => {
        const proc = Bun.spawn({
          cmd: [bunExe(), "test"],
          env: bunEnv,
          cwd: dir,
          stderr: "pipe",
          stdout: "pipe",
        });

        const [stdout, stderr] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
        ]);

        await proc.exited;
        return stdout + stderr;
      }));

      // Extract test order from both runs
      const extractOrder = (output: string) => {
        const matches = output.matchAll(/TEST: ([a-e])/g);
        return Array.from(matches, (m) => m[1]);
      };

      const order1 = extractOrder(results[0]);
      const order2 = extractOrder(results[1]);

      // Same seed should produce same order
      expect(order1).toEqual(order2);
      expect(order1.length).toBe(5);

    } finally {
      cleanupTempDir(dir1);
      cleanupTempDir(dir2);
    }
  }, 60000);

  test("rerunEach stress test", async () => {
    const dir = tempDirWithFiles("bunfig-test-stress", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        let runCount = 0;
        test("stress test", () => {
          runCount++;
          expect(runCount).toBeGreaterThan(0);
        });
      `,
      "bunfig.toml": `[test]\nrerunEach = 10`,
    });

    try {
      const proc = Bun.spawn({
        cmd: [bunExe(), "test"],
        env: bunEnv,
        cwd: dir,
        stderr: "pipe",
        stdout: "pipe",
      });

      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);

      expect(exitCode).toBe(0);
      const output = stdout + stderr;
      // 1 test * 10 reruns = 10 total test runs
      expect(output).toContain("10 pass");

    } finally {
      cleanupTempDir(dir);
    }
  }, 30000);
});