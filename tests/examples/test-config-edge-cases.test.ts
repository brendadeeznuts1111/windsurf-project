// examples/testing/test-config-edge-cases.test.ts - Configuration Edge Cases Tests
// Focused tests for bunfig.toml configuration error cases and inheritance
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

describe("Configuration Edge Cases", () => {
  test("invalid TOML syntax", async () => {
    const dir = tempDirWithFiles("bunfig-test-invalid-toml", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        test("test 1", () => expect(1).toBe(1));
      `,
      "bunfig.toml": `[test]\nrandomize = true\nseed = "not-a-number"`,
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

      // Should still run tests despite invalid config
      expect(exitCode).toBe(0);
      const output = stdout + stderr;
      expect(output).toContain("1 pass");

    } finally {
      cleanupTempDir(dir);
    }
  });

  test("empty configuration", async () => {
    const dir = tempDirWithFiles("bunfig-test-empty", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        test("test 1", () => expect(1).toBe(1));
      `,
      "bunfig.toml": `[test]\n# Empty test configuration`,
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
  });

  test("configuration inheritance", async () => {
    const dir = tempDirWithFiles("bunfig-test-inheritance", {
      "subdir": {
        "nested.test.ts": `
          import { test, expect } from "bun:test";
          test("nested test", () => expect(42).toBe(42));
        `,
      },
      "bunfig.toml": `[test]\nrerunEach = 2`,
    });

    try {
      const proc = Bun.spawn({
        cmd: [bunExe(), "test"],
        env: bunEnv,
        cwd: `${dir}/subdir`,
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
      // Should inherit rerunEach = 2 from parent directory
      expect(output).toContain("2 pass");

    } finally {
      cleanupTempDir(dir);
    }
  }, 30000);
});