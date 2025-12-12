// examples/testing/test-config-randomize-seed-consistency.test.ts - Randomization and Seeding Tests
// Focused tests for bunfig.toml randomize and seed configuration options
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

describe("Randomization and Seeding", () => {
  test("randomize with seed produces consistent order", async () => {
    const dir = tempDirWithFiles("bunfig-test-randomize-seed", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        test("alpha", () => {
          console.log("RUNNING: alpha");
          expect(1).toBe(1);
        });
        test("bravo", () => {
          console.log("RUNNING: bravo");
          expect(2).toBe(2);
        });
        test("charlie", () => {
          console.log("RUNNING: charlie");
          expect(3).toBe(3);
        });
        test("delta", () => {
          console.log("RUNNING: delta");
          expect(4).toBe(4);
        });
        test("echo", () => {
          console.log("RUNNING: echo");
          expect(5).toBe(5);
        });
      `,
      "bunfig.toml": `[test]\nrandomize = true\nseed = 2444615283`,
    });

    try {
      // Run twice to verify same order (following Bun's pattern)
      const outputs: string[] = [];
      for (let i = 0; i < 2; i++) {
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
        outputs.push(stdout + stderr);
      }

      // Extract the order tests ran in
      const extractOrder = (output: string) => {
        const matches = output.matchAll(/RUNNING: (\w+)/g);
        return Array.from(matches, (m) => m[1]);
      };

      const order1 = extractOrder(outputs[0]);
      const order2 = extractOrder(outputs[1]);

      // Should have all 5 tests
      expect(order1.length).toBe(5);
      expect(order2.length).toBe(5);

      // Order should be identical across runs
      expect(order1).toEqual(order2);

      // Order should NOT be alphabetical (tests randomization is working)
      const alphabetical = ["alpha", "bravo", "charlie", "delta", "echo"];
      expect(order1).not.toEqual(alphabetical);

      // Verify randomization is working by checking it's not in declaration order
      expect(order1).toMatchSnapshot();

    } finally {
      cleanupTempDir(dir);
    }
  }, 30000);

  test("seed without randomize errors", async () => {
    const dir = tempDirWithFiles("bunfig-test-seed-no-randomize", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        test("test 1", () => expect(1).toBe(1));
      `,
      "bunfig.toml": `[test]\nseed = 2444615283`,
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

      expect(exitCode).toBe(1);
      const output = stdout + stderr;
      expect(output).toContain("seed");
      expect(output).toContain("randomize");

    } finally {
      cleanupTempDir(dir);
    }
  });

  test("seed with randomize=false errors", async () => {
    const dir = tempDirWithFiles("bunfig-test-seed-randomize-false", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        test("test 1", () => expect(1).toBe(1));
      `,
      "bunfig.toml": `[test]\nrandomize = false\nseed = 2444615283`,
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

      expect(exitCode).toBe(1);
      const output = stdout + stderr;
      expect(output).toContain("seed");
      expect(output).toContain("randomize");

    } finally {
      cleanupTempDir(dir);
    }
  });
});