# 🖥️ Bun CLI Testing Guide

*Generated on 2025-12-12T14:45:00.000Z*

## 📋 Overview

Bun's CLI testing covers all command-line interfaces, configuration options, and stdout/stderr behavior. CLI tests ensure that Bun's commands work correctly across different platforms and use cases.

## 🗂️ CLI Test Organization

CLI tests are organized by command and functionality:

### Main CLI Test Categories

- **`test/cli/`** - All CLI-related tests
  - **`__snapshots__/`** - Jest snapshot files for output validation
  - **`bun.test.ts`** - General `bun` command tests
  - **`bunfig-test-options.test.ts`** - Configuration file testing
  - **`console-depth.test.ts`** - Console output depth testing
  - **`update_interactive_*.test.ts`** - Interactive update command testing
  - **`user-agent.test.ts`** - User agent header testing

### CLI Command Directories

- **`create/`** - Tests for `bun create` command
- **`env/`** - Tests for environment variable handling
- **`hot/`** - Tests for hot reloading functionality
- **`init/`** - Tests for `bun init` command
- **`inspect/`** - Tests for `bun --inspect` debugging
- **`install/`** - Tests for `bun install` package management
- **`run/`** - Tests for `bun run` script execution
- **`test/`** - Tests for `bun test` command itself
- **`watch/`** - Tests for file watching functionality

## 🧪 CLI Testing Patterns

### Command Execution Testing

```typescript
import { expect, test } from "bun:test";
import { bunExe } from "../../harness";

test("bun --version shows version", () => {
  const { stdout } = Bun.spawnSync({
    cmd: [bunExe(), "--version"],
    stdout: "pipe",
    stderr: "pipe",
  });

  const version = stdout.toString().trim();
  expect(version).toMatch(/\d+\.\d+\.\d+/);
});
```

### Exit Code Testing

```typescript
test("bun run with missing script exits with code 1", () => {
  const result = Bun.spawnSync({
    cmd: [bunExe(), "run", "nonexistent-script"],
    stdout: "pipe",
    stderr: "pipe",
  });

  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain("Script not found");
});
```

### Output Validation with Snapshots

```typescript
test("bun --help output matches snapshot", () => {
  const { stdout } = Bun.spawnSync({
    cmd: [bunExe(), "--help"],
    stdout: "pipe",
  });

  expect(stdout.toString()).toMatchSnapshot();
});
```

### Configuration File Testing

```typescript
test("bunfig.toml options are respected", () => {
  const tempDir = tempDirWithFiles("bunfig-test", {
    "bunfig.toml": `
[install]
registry = "https://registry.npmjs.org/"
saveTextLockfile = true
`,
    "package.json": `{"name": "test"}`,
  });

  const result = Bun.spawnSync({
    cmd: [bunExe(), "install"],
    cwd: tempDir,
    stdout: "pipe",
    stderr: "pipe",
  });

  expect(result.exitCode).toBe(0);
  // Verify bunfig options were applied
});
```

## 🔧 CLI Testing Utilities

### SpawnSync Wrapper

```typescript
function runBunCommand(args: string[], options?: {
  cwd?: string;
  env?: Record<string, string>;
  input?: string;
}) {
  return Bun.spawnSync({
    cmd: [bunExe(), ...args],
    cwd: options?.cwd,
    env: { ...bunEnv, ...options?.env },
    stdin: options?.input ? "pipe" : "ignore",
    stdout: "pipe",
    stderr: "pipe",
    ...(options?.input && {
      stdin: new TextEncoder().encode(options.input)
    }),
  });
}
```

### Output Normalization

```typescript
function normalizeCliOutput(output: string): string {
  return output
    .replace(/\r\n/g, "\n")  // Normalize line endings
    .replace(/\d+\.\d+\.\d+/g, "<version>")  // Replace versions
    .replace(/\\+/g, "/")  // Normalize paths
    .trim();
}
```

### Interactive Command Testing

```typescript
test("bun update --interactive works", async () => {
  const tempDir = tempDirWithFiles("update-test", {
    "package.json": `{"dependencies": {"lodash": "4.17.0"}}`,
  });

  // Simulate user input for interactive mode
  const input = "y\n"; // Answer "yes" to update prompt

  const result = Bun.spawnSync({
    cmd: [bunExe(), "update", "--interactive"],
    cwd: tempDir,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    input: new TextEncoder().encode(input),
  });

  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("Updated");
});
```

## 📋 Specific CLI Command Tests

### Package Management Testing

#### Install Command
```typescript
describe("bun install", () => {
  test("installs dependencies from package.json", () => {
    const tempDir = tempDirWithFiles("install-test", {
      "package.json": `{
        "dependencies": {
          "lodash": "^4.17.0"
        }
      }`,
    });

    const result = runBunCommand(["install"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stderr.toString()).toContain("Saved lockfile");
  });

  test("handles peer dependency conflicts", () => {
    const tempDir = tempDirWithFiles("peer-deps-test", {
      "package.json": `{
        "dependencies": {
          "react": "^17.0.0",
          "react-dom": "^18.0.0"
        }
      }`,
    });

    const result = runBunCommand(["install"], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("ERESOLVE");
  });
});
```

#### Run Command
```typescript
describe("bun run", () => {
  test("executes npm scripts", () => {
    const tempDir = tempDirWithFiles("run-test", {
      "package.json": `{
        "scripts": {
          "hello": "echo 'Hello World'"
        }
      }`,
    });

    const result = runBunCommand(["run", "hello"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString().trim()).toBe("Hello World");
  });

  test("passes arguments to scripts", () => {
    const tempDir = tempDirWithFiles("args-test", {
      "package.json": `{
        "scripts": {
          "greet": "echo"
        }
      }`,
    });

    const result = runBunCommand(["run", "greet", "Alice"], { cwd: tempDir });
    expect(result.stdout.toString().trim()).toBe("Alice");
  });
});
```

### Development Server Testing

#### Dev Command
```typescript
describe("bun dev", () => {
  test("starts development server", async () => {
    const tempDir = tempDirWithFiles("dev-test", {
      "package.json": `{"scripts": {"dev": "echo 'Server started'"}}`,
    });

    const server = Bun.spawn({
      cmd: [bunExe(), "run", "dev"],
      cwd: tempDir,
      stdout: "pipe",
      stderr: "pipe",
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(server.killed).toBe(false);
    server.kill();
  });
});
```

### Build & Bundle Testing

#### Build Command
```typescript
describe("bun build", () => {
  test("bundles TypeScript to JavaScript", () => {
    const tempDir = tempDirWithFiles("build-test", {
      "index.ts": `console.log("Hello from Bun!");`,
      "package.json": `{"name": "build-test"}`,
    });

    const result = runBunCommand(["build", "index.ts"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);

    // Check if output file was created
    const outputExists = fs.existsSync(join(tempDir, "index.js"));
    expect(outputExists).toBe(true);
  });

  test("handles build errors gracefully", () => {
    const tempDir = tempDirWithFiles("build-error-test", {
      "broken.ts": `console.log(undefined.property);`, // TypeError
    });

    const result = runBunCommand(["build", "broken.ts"], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("error");
  });
});
```

### Test Runner Testing

#### Test Command
```typescript
describe("bun test", () => {
  test("runs test files", () => {
    const tempDir = tempDirWithFiles("test-runner-test", {
      "math.test.ts": `
        import { test, expect } from "bun:test";

        test("adds numbers", () => {
          expect(1 + 1).toBe(2);
        });
      `,
    });

    const result = runBunCommand(["test"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("1 pass");
  });

  test("reports test failures", () => {
    const tempDir = tempDirWithFiles("failing-test", {
      "fail.test.ts": `
        import { test, expect } from "bun:test";

        test("fails", () => {
          expect(1 + 1).toBe(3);
        });
      `,
    });

    const result = runBunCommand(["test"], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toContain("1 fail");
  });
});
```

## 🐛 Error & Edge Case Testing

### Invalid Input Handling
```typescript
test("bun with invalid flag shows error", () => {
  const result = runBunCommand(["--invalid-flag"]);
  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain("error");
});

test("bun run with missing package.json", () => {
  const tempDir = tempDirWithFiles("no-package-json", {});
  const result = runBunCommand(["run", "start"], { cwd: tempDir });
  expect(result.exitCode).toBe(1);
});
```

### Permission & Access Testing
```typescript
test("bun install without write permissions fails", () => {
  const tempDir = tempDirWithFiles("readonly-test", {
    "package.json": `{"dependencies": {"lodash": "^4.17.0"}}`,
  });

  // Make directory read-only (Unix-like systems)
  if (isPosix) {
    fs.chmodSync(tempDir, 0o444);
  }

  const result = runBunCommand(["install"], { cwd: tempDir });
  expect(result.exitCode).toBe(1);
});
```

### Network & Registry Testing
```typescript
test("bun install with invalid registry fails", () => {
  const tempDir = tempDirWithFiles("registry-test", {
    "package.json": `{"dependencies": {"lodash": "^4.17.0"}}`,
  });

  const result = runBunCommand(["install"], {
    cwd: tempDir,
    env: { BUN_CONFIG_REGISTRY: "https://invalid-registry.example.com" }
  });

  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain("ENOTFOUND");
});
```

## 🔧 Advanced CLI Testing Techniques

### Mocking External Commands
```typescript
test("bun run uses PATH correctly", () => {
  const tempDir = tempDirWithFiles("path-test", {
    "package.json": `{"scripts": {"custom": "my-custom-command"}}`,
  });

  // Create a mock command in PATH
  const mockCommand = tempDirWithFiles("mock-bin", {
    "my-custom-command": `#!/usr/bin/env sh\necho "Mock command executed"`,
  });

  if (isPosix) {
    fs.chmodSync(join(mockCommand, "my-custom-command"), 0o755);
  }

  const result = runBunCommand(["run", "custom"], {
    cwd: tempDir,
    env: { PATH: `${mockCommand}:${process.env.PATH}` }
  });

  expect(result.stdout.toString().trim()).toBe("Mock command executed");
});
```

### Timing & Performance Testing
```typescript
test("bun install performance", () => {
  const tempDir = tempDirWithFiles("perf-test", {
    "package.json": `{"dependencies": {"lodash": "^4.17.0"}}`,
  });

  const start = performance.now();
  const result = runBunCommand(["install"], { cwd: tempDir });
  const end = performance.now();

  expect(result.exitCode).toBe(0);
  expect(end - start).toBeLessThan(10000); // Should complete within 10 seconds
});
```

### Cross-Platform Compatibility
```typescript
describe("cross-platform", () => {
  testIf(isWindows)("Windows-specific behavior", () => {
    const result = runBunCommand(["--version"]);
    expect(result.stdout.toString()).toContain("\\"); // Windows path separators
  });

  testIf(isPosix)("Unix-specific behavior", () => {
    const result = runBunCommand(["--version"]);
    expect(result.stdout.toString()).toContain("/"); // Unix path separators
  });
});
```

## 📊 Snapshot Testing

### CLI Output Snapshots
```typescript
test("bun --help output is consistent", () => {
  const { stdout } = Bun.spawnSync({
    cmd: [bunExe(), "--help"],
    stdout: "pipe",
  });

  // Normalize output for consistent snapshots across platforms
  const normalized = normalizeCliOutput(stdout.toString());
  expect(normalized).toMatchSnapshot();
});
```

### Interactive Command Snapshots
```typescript
test("bun update --interactive prompts", async () => {
  const tempDir = tempDirWithFiles("interactive-test", {
    "package.json": `{"dependencies": {"lodash": "4.17.0"}}`,
  });

  // Use a pseudo-terminal for interactive testing
  const result = Bun.spawnSync({
    cmd: [bunExe(), "update", "--interactive"],
    cwd: tempDir,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  }, {
    input: "n\n", // Answer "no" to all prompts
  });

  const output = result.stdout.toString() + result.stderr.toString();
  expect(normalizeCliOutput(output)).toMatchSnapshot();
});
```

## 🐳 Container & Environment Testing

### Docker Integration Testing
```typescript
describeWithContainer("registry testing", {
  image: "verdaccio/verdaccio:5",
  ports: { 4873: 4873 },
}, ({ port, host, ready }) => {
  test("bun install uses custom registry", async () => {
    await ready;

    const tempDir = tempDirWithFiles("registry-test", {
      "package.json": `{"dependencies": {"lodash": "^4.17.0"}}`,
    });

    const result = runBunCommand(["install"], {
      cwd: tempDir,
      env: { BUN_CONFIG_REGISTRY: `http://${host}:${port}` }
    });

    expect(result.exitCode).toBe(0);
  });
});
```

## 📋 Best Practices

### 1. **Test Isolation**
```typescript
describe("isolated tests", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = tempDirWithFiles("test-isolation", {
      "package.json": `{"name": "test"}`,
    });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("each test gets clean environment", () => {
    // Tests won't interfere with each other
  });
});
```

### 2. **Platform-Specific Testing**
```typescript
testIf(isWindows)("Windows-specific paths", () => {
  const result = runBunCommand(["run", "echo", "%PATH%"]);
  expect(result.stdout.toString()).toContain("\\");
});

testIf(isMacOS)("macOS-specific features", () => {
  const result = runBunCommand(["run", "echo", "$HOME"]);
  expect(result.stdout.toString()).toContain("/Users/");
});
```

### 3. **Error Message Validation**
```typescript
test("meaningful error messages", () => {
  const result = runBunCommand(["run", "nonexistent-script"]);

  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain("Script not found");
  expect(result.stderr.toString()).toContain("nonexistent-script");
});
```

### 4. **Performance Regression Testing**
```typescript
test("no performance regressions", () => {
  const tempDir = tempDirWithFiles("perf-regression", {
    "package.json": `{"dependencies": {"lodash": "^4.17.0"}}`,
  });

  const start = performance.now();
  const result = runBunCommand(["install"], { cwd: tempDir });
  const duration = performance.now() - start;

  expect(result.exitCode).toBe(0);
  expect(duration).toBeLessThan(5000); // < 5 seconds baseline

  // Log for regression tracking
  console.log(`Install duration: ${duration.toFixed(2)}ms`);
});
```

## 🔗 Related Examples

- [Testing Guide](./bun-testing-guide.md)
- [Test Harness Reference](./bun-test-harness-guide.md)
- [Error Codes & Troubleshooting](./bun-error-codes-troubleshooting.md)
- [Package Management Testing](./package-management-testing.test.ts)

## 📚 Key Concepts

1. **Command Testing**: Validate CLI behavior, exit codes, and output
2. **Configuration Testing**: Test bunfig.toml and environment variables
3. **Cross-Platform**: Ensure consistent behavior across OSes
4. **Error Handling**: Test error messages and edge cases
5. **Performance**: Monitor command execution times
6. **Integration**: Test with external tools and registries

CLI testing ensures Bun's command-line interface is reliable, user-friendly, and consistent across different environments and use cases.

---

*For the complete CLI test suite, see the [test/cli/](https://github.com/oven-sh/bun/tree/main/test/cli) directory in the Bun repository.*</content>
<parameter name="filePath">examples/bun-cli-testing-guide.md