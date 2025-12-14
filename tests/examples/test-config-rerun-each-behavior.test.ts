// examples/testing/test-config-rerun-each-behavior.test.ts - Test Rerun Configuration Tests
// Focused tests for bunfig.toml rerunEach configuration option
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

describe("Test Rerun Configuration", () => {
  test("rerunEach option works", async () => {
    const dir = tempDirWithFiles("bunfig-test-rerun-each", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        let counter = 0;
        test("test 1", () => {
          counter++;
          expect(counter).toBeGreaterThan(0);
        });
      `,
      "bunfig.toml": `[test]\nrerunEach = 3`,
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
      // With rerunEach = 3, the test file should run 3 times
      // So we should see "3 pass" (1 test * 3 runs)
      expect(output).toContain("3 pass");

    } finally {
      cleanupTempDir(dir);
    }
  }, 30000);

  test("rerunEach with multiple tests", async () => {
    const dir = tempDirWithFiles("bunfig-test-rerun-multiple", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        test("test A", () => expect(true).toBe(true));
        test("test B", () => expect(42).toBe(42));
        test("test C", () => expect("hello").toBe("hello"));
      `,
      "bunfig.toml": `[test]\nrerunEach = 2`,
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
      // 3 tests * 2 reruns = 6 total test runs
      expect(output).toContain("6 pass");

    } finally {
      cleanupTempDir(dir);
    }
  }, 30000);
});