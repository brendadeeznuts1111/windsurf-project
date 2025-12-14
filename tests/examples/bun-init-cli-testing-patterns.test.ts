// examples/testing/bun-init-testing-patterns.test.ts - Advanced Bun CLI Testing Patterns
// Based on Bun's official test suite patterns for CLI command testing

import { describe, test, expect } from "bun:test";
import fs from "fs";
import path from "path";

// Note: In Bun's test environment, these would be imported from harness:
// import { bunEnv, bunExe, isWindows, tempDirWithFiles } from "harness";

// For our example, we'll simulate these utilities
const bunEnv = process.env;
const bunExe = () => "bun"; // In real Bun tests, this returns the debug build path
const isWindows = process.platform === "win32";

// Simulate tempDirWithFiles (in Bun's harness, this creates actual temp directories)
function tempDirWithFiles(name: string, files: Record<string, any>): string {
  const tempDir = path.join(process.cwd(), "temp-test", name + "-" + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  function createFiles(dir: string, fileStructure: Record<string, any>) {
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

// Cleanup utility (in real Bun tests, tempDirWithFiles handles this automatically)
function cleanupTempDir(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup ${dir}:`, error);
  }
}

(isWindows ? describe : describe.concurrent)("bun init - Advanced CLI Testing", () => {
  test("bun init creates proper project structure", async () => {
    const temp = tempDirWithFiles("bun-init-basic", {});

    try {
      // Following Bun's pattern: use bunExe() and bunEnv for proper test execution
      const { exited } = Bun.spawn({
        cmd: [bunExe(), "init", "-y"],
        cwd: temp,
        stdio: ["ignore", "inherit", "inherit"],
        env: bunEnv,
      });

      expect(await exited).toBe(0);

      // Verify package.json structure (following Bun's exact test)
      const pkg = JSON.parse(fs.readFileSync(path.join(temp, "package.json"), "utf8"));
      expect(pkg).toEqual({
        "name": path.basename(temp).toLowerCase().replace(/ /g, "-"),
        "module": "index.ts",
        "type": "module",
        "private": true,
        "devDependencies": {
          "@types/bun": "latest",
        },
        "peerDependencies": {
          "typescript": "^5",
        },
      });

      // Verify README content
      const readme = fs.readFileSync(path.join(temp, "README.md"), "utf8");
      expect(readme).toStartWith("# " + path.basename(temp).toLowerCase().replace(/ /g, "-") + "\n");
      expect(readme).toInclude("index.ts");

      // Verify file creation
      expect(fs.existsSync(path.join(temp, "index.ts"))).toBe(true);
      expect(fs.existsSync(path.join(temp, ".gitignore"))).toBe(true);
      expect(fs.existsSync(path.join(temp, "tsconfig.json"))).toBe(true);

    } finally {
      cleanupTempDir(temp);
    }
  }, 30000); // Following Bun's pattern: explicit timeout for long-running tests

  test("bun init with interactive input simulation", async () => {
    const temp = tempDirWithFiles("bun-init-interactive", {});

    try {
      // Following Bun's pattern: simulate piped CLI input
      const { exited } = Bun.spawn({
        cmd: [bunExe(), "init"],
        cwd: temp,
        stdio: [new Blob(["\n\n\n\n\n\n\n\n\n\n\n\n"]), "inherit", "inherit"], // Piped newlines for interactive prompts
        env: bunEnv,
      });

      expect(await exited).toBe(0);

      // Verify project was created
      expect(fs.existsSync(path.join(temp, "package.json"))).toBe(true);
      expect(fs.existsSync(path.join(temp, "index.ts"))).toBe(true);

    } finally {
      cleanupTempDir(temp);
    }
  }, 30000);

  test("bun init in existing directory with files", async () => {
    const temp = tempDirWithFiles("bun-init-existing", {
      "existing-file.txt": "This file was here first",
      "src": {
        "component.ts": "export class Component {}"
      }
    });

    try {
      const { exited } = Bun.spawn({
        cmd: [bunExe(), "init", "-y"],
        cwd: temp,
        stdio: ["ignore", "inherit", "inherit"],
        env: bunEnv,
      });

      expect(await exited).toBe(0);

      // Verify existing files are preserved
      expect(fs.existsSync(path.join(temp, "existing-file.txt"))).toBe(true);
      expect(fs.readFileSync(path.join(temp, "existing-file.txt"), "utf8")).toBe("This file was here first");

      // Verify new Bun files were created
      expect(fs.existsSync(path.join(temp, "package.json"))).toBe(true);
      expect(fs.existsSync(path.join(temp, "index.ts"))).toBe(true);

    } finally {
      cleanupTempDir(temp);
    }
  }, 30000);

  test("bun init error handling - refuses to overwrite files", async () => {
    const temp = tempDirWithFiles("bun-init-error", {
      "important-file": "Don't overwrite me!"
    });

    try {
      // Following Bun's pattern: test error conditions
      const { exited } = Bun.spawn({
        cmd: [bunExe(), "init", "-y", "important-file"], // Try to init in existing file
        cwd: temp,
        stdio: ["ignore", "pipe", "pipe"],
        env: bunEnv,
      });

      expect(await exited).not.toBe(0); // Should fail

      // Verify file was not overwritten
      expect(fs.readFileSync(path.join(temp, "important-file"), "utf8")).toBe("Don't overwrite me!");

    } finally {
      cleanupTempDir(temp);
    }
  });

  test("bun init with Unicode and special characters", async () => {
    const temp = tempDirWithFiles("bun-init-unicode", {});

    try {
      const { exited } = Bun.spawn({
        cmd: [bunExe(), "init", "-y", "测试 项目 🚀"], // Unicode project name
        cwd: temp,
        stdio: ["ignore", "inherit", "inherit"],
        env: bunEnv,
      });

      expect(await exited).toBe(0);

      // Verify Unicode handling
      const projectDir = fs.readdirSync(temp).find(dir => dir.includes("测试"));
      expect(projectDir).toBeDefined();

      const projectPath = path.join(temp, projectDir!);
      expect(fs.existsSync(path.join(projectPath, "package.json"))).toBe(true);

    } finally {
      cleanupTempDir(temp);
    }
  }, 30000);

  test("bun init preserves existing configuration", async () => {
    const temp = tempDirWithFiles("bun-init-preserve", {
      "package.json": JSON.stringify({
        name: "my-existing-project",
        version: "1.0.0",
        dependencies: { "some-dep": "^1.0.0" }
      }, null, 2),
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          module: "ESNext"
        }
      }, null, 2)
    });

    try {
      const { exited, stderr } = Bun.spawn({
        cmd: [bunExe(), "init"],
        cwd: temp,
        stdio: ["ignore", "pipe", "pipe"],
        env: bunEnv,
      });

      expect(await exited).toBe(0);

      // Following Bun's pattern: check stderr for configuration message
      const stderrText = await new Response(stderr).text();
      expect(stderrText).toInclude("configuring existing project");

      // Verify existing package.json was updated, not replaced
      const pkg = JSON.parse(fs.readFileSync(path.join(temp, "package.json"), "utf8"));
      expect(pkg.name).toBe("my-existing-project");
      expect(pkg.dependencies).toHaveProperty("some-dep");

      // Verify Bun-specific fields were added
      expect(pkg).toHaveProperty("devDependencies.@types/bun");

    } finally {
      cleanupTempDir(temp);
    }
  });

  describe("Framework-specific initialization", () => {
    test("bun init --react creates React project", async () => {
      const temp = tempDirWithFiles("bun-init-react", {});

      try {
        const { exited } = Bun.spawn({
          cmd: [bunExe(), "init", "--react"],
          cwd: temp,
          stdio: ["ignore", "inherit", "inherit"],
          env: bunEnv,
        });

        expect(await exited).toBe(0);

        const pkg = JSON.parse(fs.readFileSync(path.join(temp, "package.json"), "utf8"));

        // Following Bun's pattern: verify React dependencies
        expect(pkg.dependencies || pkg.devDependencies).toHaveProperty("react");
        expect(pkg.dependencies || pkg.devDependencies).toHaveProperty("react-dom");

        // Verify React-specific file structure
        expect(fs.existsSync(path.join(temp, "src"))).toBe(true);
        expect(fs.existsSync(path.join(temp, "src/index.tsx"))).toBe(true);

      } finally {
        cleanupTempDir(temp);
      }
    }, 30000);

    test("bun init --react=tailwind includes Tailwind", async () => {
      const temp = tempDirWithFiles("bun-init-react-tailwind", {});

      try {
        const { exited } = Bun.spawn({
          cmd: [bunExe(), "init", "--react=tailwind"],
          cwd: temp,
          stdio: ["ignore", "inherit", "inherit"],
          env: bunEnv,
        });

        expect(await exited).toBe(0);

        const pkg = JSON.parse(fs.readFileSync(path.join(temp, "package.json"), "utf8"));

        // Verify Tailwind integration
        expect(pkg.dependencies || pkg.devDependencies).toHaveProperty("bun-plugin-tailwind");

      } finally {
        cleanupTempDir(temp);
      }
    }, 30000);
  });

  describe("Snapshot testing patterns", () => {
    test("bun init creates consistent file structure", async () => {
      const temp = tempDirWithFiles("bun-init-snapshot", {});

      try {
        const { exited } = Bun.spawn({
          cmd: [bunExe(), "init", "-y"],
          cwd: temp,
          stdio: ["ignore", "inherit", "inherit"],
          env: bunEnv,
        });

        expect(await exited).toBe(0);

        // Following Bun's pattern: use snapshot testing for file structure
        const files = fs.readdirSync(temp).sort();
        expect(files).toEqual([
          ".gitignore",
          "README.md",
          "bun.lock",
          "index.ts",
          "node_modules",
          "package.json",
          "tsconfig.json"
        ]);

        // Snapshot package.json structure
        const pkg = JSON.parse(fs.readFileSync(path.join(temp, "package.json"), "utf8"));
        expect(pkg).toMatchSnapshot();

      } finally {
        cleanupTempDir(temp);
      }
    });
  });

  describe("Cross-platform compatibility", () => {
    test("bun init handles platform-specific paths", async () => {
      const temp = tempDirWithFiles("bun-init-platform", {});

      try {
        const { exited } = Bun.spawn({
          cmd: [bunExe(), "init", "-y"],
          cwd: temp,
          stdio: ["ignore", "inherit", "inherit"],
          env: bunEnv,
        });

        expect(await exited).toBe(0);

        // Verify platform-appropriate file separators in generated content
        const pkg = JSON.parse(fs.readFileSync(path.join(temp, "package.json"), "utf8"));
        const readme = fs.readFileSync(path.join(temp, "README.md"), "utf8");

        // These should work regardless of platform
        expect(pkg.name).toBeDefined();
        expect(readme).toInclude("bun");

      } finally {
        cleanupTempDir(temp);
      }
    });
  });
});

// Additional test patterns following Bun's CLI testing approach
describe("CLI Testing Utilities - Bun Patterns", () => {
  test("proper stdout/stderr capture", async () => {
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

  test("error exit code testing", async () => {
    const proc = Bun.spawn({
      cmd: ["sh", "-c", "exit 42"],
      stdout: "pipe",
      stderr: "pipe"
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(42);
  });

  test("large output handling", async () => {
    // Test handling of large outputs (following Bun's comprehensive testing)
    const largeData = "x".repeat(10000);

    const proc = Bun.spawn({
      cmd: ["echo", largeData],
      stdout: "pipe",
      stderr: "pipe"
    });

    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    expect(stdout.trim()).toBe(largeData);
    expect(exitCode).toBe(0);
  });
});