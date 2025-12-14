// examples/testing/test-config-combined-options.test.ts - Combined Configuration Options Tests
// Focused tests for multiple bunfig.toml test configuration options working together
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

describe("Combined Configuration Options", () => {
  test("all test options together", async () => {
    const dir = tempDirWithFiles("bunfig-test-all-options", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        test("test 1", () => expect(1).toBe(1));
        test("test 2", () => expect(2).toBe(2));
      `,
      "bunfig.toml": `[test]\nrandomize = true\nseed = 12345\nrerunEach = 2`,
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
      // 2 tests * 2 reruns = 4 total test runs
      expect(output).toContain("4 pass");

    } finally {
      cleanupTempDir(dir);
    }
  }, 30000);

  test("configuration file parsing", async () => {
    const dir = tempDirWithFiles("bunfig-test-parsing", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        test("basic test", () => expect(1).toBe(1));
      `,
      "bunfig.toml": `
        [test]
        randomize = true
        seed = 98765
        rerunEach = 1
      `,
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
      expect(output).toContain("1 pass");

    } finally {
      cleanupTempDir(dir);
    }
  }, 30000);
});