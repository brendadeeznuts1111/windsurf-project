# 🧰 Bun Test Harness

*Generated on 2025-12-12T14:40:00.000Z*

## 📋 Overview

The Bun test harness (`harness.ts`) is a comprehensive utility file loaded in every test file in the Bun repository. It provides essential testing infrastructure, environment detection, and helper functions for writing robust tests.

## 🏗️ Core Infrastructure

### Environment Detection

```typescript
// Platform detection
export const isMacOS = process.platform === "darwin";
export const isLinux = process.platform === "linux";
export const isPosix = isMacOS || isLinux;
export const isWindows = process.platform === "win32";

// Architecture detection
export const isArm64 = process.arch === "arm64";
export const isIntelMacOS = isMacOS && process.arch === "x64";

// Runtime detection
export const isDebug = Bun.version.includes("debug");
export const isCI = process.env.CI !== undefined;
export const isASAN = basename(process.execPath).includes("bun-asan");

// Library detection
export const libcFamily: "glibc" | "musl" =
  process.platform !== "linux"
    ? "glibc"
    : (process.report.getReport() as any).header.glibcVersionRuntime
    ? "glibc"
    : "musl";
```

### Test Environment Configuration

```typescript
// Standardized test environment
export const bunEnv: NodeJS.Dict<string> = {
  ...process.env,
  GITHUB_ACTIONS: "false",
  BUN_DEBUG_QUIET_LOGS: "1",
  NO_COLOR: "1",
  FORCE_COLOR: undefined,
  TZ: "Etc/UTC",
  CI: "1",
  BUN_RUNTIME_TRANSPILER_CACHE_PATH: "0",
  BUN_FEATURE_FLAG_INTERNAL_FOR_TESTING: "1",
  BUN_GARBAGE_COLLECTOR_LEVEL: process.env.BUN_GARBAGE_COLLECTOR_LEVEL || "0",
  BUN_FEATURE_FLAG_EXPERIMENTAL_BAKE: "1",
  BUN_DEBUG_linkerctx: "0",
  WANTS_LOUD: "0",
  AGENT: "false",
};
```

## 🧪 Test Utilities

### Flaky/Broken Test Markers

```typescript
// Mark tests as flaky or broken for CI
export const isFlaky = isCI;
export const isBroken = isCI;

// Usage in tests
test.skipIf(isFlaky && isMacOS)("this test is flaky on macOS");
test.todoIf(isBroken)("this test is currently broken");
```

### Garbage Collection Helpers

```typescript
// Force garbage collection
export function gc(force = true) {
  bunGC(force);
}

// Deterministic GC for memory leak testing
export async function expectMaxObjectTypeCount(
  expect: typeof import("bun:test").expect,
  type: string,
  count: number,
  maxWait = 1000,
) {
  gc();
  if (heapStats().objectTypeCounts[type] <= count) return;

  for (const wait = 20; maxWait > 0; maxWait -= wait) {
    if (heapStats().objectTypeCounts[type] <= count) break;
    await Bun.sleep(wait);
    gc();
  }

  expect(heapStats().objectTypeCounts[type] || 0).toBeLessThanOrEqual(count);
}

// Memory-safe GC with rollback
export function withoutAggressiveGC(block: () => unknown) {
  if (!unsafe.gcAggressionLevel) return block();

  const origGC = unsafe.gcAggressionLevel();
  unsafe.gcAggressionLevel(0);
  try {
    return block();
  } finally {
    unsafe.gcAggressionLevel(origGC);
  }
}
```

### File System Testing

```typescript
// Directory tree structure for tests
export type DirectoryTree = {
  [name: string]:
    | string
    | Buffer
    | DirectoryTree
    | ((opts: { root: string }) => Bun.MaybePromise<string | Buffer | DirectoryTree>);
};

// Create temporary directory with files
export function tempDirWithFiles(
  basename: string,
  filesOrAbsolutePathToCopyFolderFrom: DirectoryTree | string,
): string {
  const base = fs.mkdtempSync(join(fs.realpathSync.native(os.tmpdir()), basename + "_"));
  makeTreeSync(base, filesOrAbsolutePathToCopyFolderFrom);
  return base;
}

// Disposable temporary directory (using Symbol.dispose)
export function tempDir(
  basename: string,
  filesOrAbsolutePathToCopyFolderFrom: DirectoryTree | string,
): string & DisposableString & AsyncDisposable {
  const base = tempDirWithFiles(basename, filesOrAbsolutePathToCopyFolderFrom);
  return new DisposableString(base) as string & DisposableString & AsyncDisposable;
}
```

## 🚀 Process Execution

### Bun Command Execution

```typescript
// Run Bun scripts
export function bunRun(file: string, env?: Record<string, string>, dump = false) {
  const result = Bun.spawnSync([bunExe(), file], {
    cwd: path.dirname(file),
    env: { ...bunEnv, NODE_ENV: undefined, ...env },
    stdin: "ignore",
    stdout: !dump ? "pipe" : "inherit",
    stderr: !dump ? "pipe" : "inherit",
  });

  if (!result.success) {
    if (dump) {
      throw new Error(`exited with code ${result.exitCode}`);
    }
    throw new Error(String(result.stderr) + "\n" + String(result.stdout));
  }

  return {
    stdout: String(result.stdout ?? "").trim(),
    stderr: String(result.stderr ?? "").trim(),
  };
}

// Run Bun test command
export function bunTest(file: string, env?: Record<string, string>) {
  const result = Bun.spawnSync([bunExe(), "test", path.basename(file)], {
    cwd: path.dirname(file),
    env: { ...bunEnv, NODE_ENV: undefined, ...env },
  });

  if (!result.success) throw new Error(result.stderr.toString("utf8"));
  return {
    stdout: result.stdout.toString("utf8").trim(),
    stderr: result.stderr.toString("utf8").trim(),
  };
}
```

## 🔧 Custom Test Matchers

### Binary Type Checking

```typescript
// Extended expect matchers
expect.extend({
  toBeBinaryType(actual: any, expected: keyof typeof binaryTypes) {
    switch (expected) {
      case "buffer":
        return { pass: Buffer.isBuffer(actual) };
      case "arraybuffer":
        return { pass: actual instanceof ArrayBuffer };
      // ... more binary type checks
    }
  },

  toRun(cmds: string[], optionalStdout?: string, expectedCode: number = 0) {
    const result = Bun.spawnSync({
      cmd: [bunExe(), ...cmds],
      env: bunEnv,
      stdio: ["inherit", "pipe", "inherit"],
    });

    if (result.exitCode !== expectedCode) {
      return {
        pass: false,
        message: () => `Command failed: ${cmds.join(" ")}`,
      };
    }

    if (optionalStdout != null) {
      return {
        pass: result.stdout.toString("utf-8") === optionalStdout,
        message: () => `Expected output mismatch`,
      };
    }

    return { pass: true };
  },
});
```

### Error Code Testing

```typescript
expect.extend({
  toThrowWithCode(fn: CallableFunction, cls: CallableFunction, code: string) {
    try {
      fn();
      return { pass: false, message: () => "Function did not throw" };
    } catch (e) {
      if (!(e instanceof cls)) {
        return {
          pass: false,
          message: () => `Expected ${cls.name}, got ${e.constructor.name}`,
        };
      }

      if (!("code" in e) || e.code !== code) {
        return {
          pass: false,
          message: () => `Expected code '${code}', got '${e.code}'`,
        };
      }

      return { pass: true };
    }
  },
});
```

## 🐳 Docker Testing

### Container Management

```typescript
export function describeWithContainer(
  label: string,
  {
    image,
    env = {},
    args = [],
    archs,
    concurrent = false,
  }: {
    image: string;
    env?: Record<string, string>;
    args?: string[];
    archs?: NodeJS.Architecture[];
    concurrent?: boolean;
  },
  fn: (container: { port: number; host: string; ready: Promise<void> }) => void,
) {
  // Skip if Docker not available
  if (!isDockerEnabled()) {
    describe.todo(label);
    return;
  }

  (concurrent && Bun.version !== "1.2.22" ? describe.concurrent : describe)(label, () => {
    // Container setup and management
  });
}
```

## 🔐 Security & Secrets

### Secret Management

```typescript
/**
 * Gets a secret from the environment.
 * In Buildkite, secrets are retrieved using the buildkite-agent command.
 */
export function getSecret(name: string): string | undefined {
  let value = process.env[name]?.trim();

  // In Buildkite, secrets must be retrieved using the agent
  if (!value && isBuildKite) {
    const { exitCode, stdout } = spawnSync({
      cmd: ["buildkite-agent", "secret", "get", name],
      stdout: "pipe",
      env: ciEnv,
      stderr: "inherit",
    });
    if (exitCode === 0) {
      value = stdout.toString().trim();
    }
  }

  if (!value) {
    throw new Error(`Secret not found: ${name}`);
  }

  process.env[name] = value;
  return value;
}
```

## 📊 Performance Testing

### Memory Leak Detection

```typescript
test("no memory leaks", async () => {
  const initialHeap = process.memoryUsage().heapUsed;

  // Perform operations that might leak
  const largeArray = new Array(1000000).fill("test");

  // Force garbage collection
  await gcTick();

  const finalHeap = process.memoryUsage().heapUsed;
  expect(finalHeap - initialHeap).toBeLessThan(1024 * 1024); // < 1MB increase
});
```

### File Descriptor Leak Detection

```typescript
export function fileDescriptorLeakChecker() {
  const initial = getMaxFD();
  return {
    [Symbol.dispose]() {
      const current = getMaxFD();
      if (current > initial) {
        throw new Error(`File descriptor leak: ${current} > ${initial}`);
      }
    },
  };
}
```

## 🌐 Network Testing

### Port Management

```typescript
export function randomPort(): number {
  return 1024 + Math.floor(Math.random() * (65535 - 1024));
}

export async function waitForPort(port: number, timeout: number = 60_000): Promise<void> {
  // Wait for port to become available
}
```

## 📁 Registry Testing

### Verdaccio Registry Management

```typescript
export class VerdaccioRegistry {
  port: number;
  process: ChildProcess | undefined;

  constructor(opts?: { configPath?: string; packagesPath?: string }) {
    this.port = randomPort();
    // Configuration for local npm registry testing
  }

  async start(silent: boolean = true) {
    // Start local npm registry for testing
  }

  registryUrl() {
    return `http://localhost:${this.port}/`;
  }
}
```

## 🧹 Cleanup & Resource Management

### Automatic Cleanup

```typescript
// Using Symbol.dispose for automatic cleanup
using tempDir = tempDir("test-", { "file.txt": "content" });
// Directory automatically cleaned up when scope exits

// File descriptor leak checking
using fdChecker = fileDescriptorLeakChecker();
// Throws if file descriptors leaked
```

### TLS Certificate Testing

```typescript
// Pre-configured TLS certificates for testing
export const tls = Object.freeze({
  cert: "-----BEGIN CERTIFICATE-----\n...",
  key: "-----BEGIN PRIVATE KEY-----\n...",
});

export const expiredTls = Object.freeze({
  // Expired certificate for testing
});

export const invalidTls = Object.freeze({
  // Invalid certificate for testing
});
```

## 🔧 Advanced Utilities

### String Encoding Detection

```typescript
// Extended String prototype methods
declare global {
  interface String {
    isLatin1(): boolean;
    isUTF16(): boolean;
  }
}

String.prototype.isLatin1 = function () {
  return require("bun:internal-for-testing").jscInternals.isLatin1String(this);
};

String.prototype.isUTF16 = function () {
  return require("bun:internal-for-testing").jscInternals.isUTF16String(this);
};
```

### Environment Scoping

```typescript
// Temporarily modify environment variables
export function rejectUnauthorizedScope(value: boolean) {
  const original = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = value ? "1" : "0";
  return {
    [Symbol.dispose]() {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = original;
    },
  };
}
```

## 📚 Usage Examples

### Basic Test Setup

```typescript
import { describe, test, expect } from "bun:test";
import { tempDir, bunRun } from "harness";

describe("my feature", () => {
  test("works correctly", async () => {
    using tmp = tempDir("test-", {
      "input.txt": "test data",
      "script.ts": `console.log("hello");`,
    });

    const result = bunRun(join(tmp, "script.ts"));
    expect(result.stdout).toBe("hello");
  });
});
```

### Memory Leak Testing

```typescript
describe("memory management", () => {
  test("no leaks in complex operation", async () => {
    const initialCount = heapStats().objectTypeCounts["MyObject"] || 0;

    // Perform complex operations
    for (let i = 0; i < 1000; i++) {
      createComplexObject();
    }

    await expectMaxObjectTypeCount(expect, "MyObject", initialCount + 10);
  });
});
```

### Docker Integration Testing

```typescript
describeWithContainer("database integration", {
  image: "postgres_plain",
  env: { POSTGRES_PASSWORD: "test" },
}, ({ port, host, ready }) => {
  test("connects to database", async () => {
    await ready; // Wait for container to be ready

    const client = new Client({
      host,
      port,
      password: "test",
    });

    await client.connect();
    // Test database operations
  });
});
```

## 🔗 Related Examples

- [Test Runner Configuration](./examples/test-runner-config.ts)
- [Memory Leak Testing](./examples/memory-leak-testing.test.ts)
- [Docker Integration Tests](./examples/docker-integration.test.ts)
- [Custom Test Matchers](./examples/custom-matchers.test.ts)

## 📖 Key Concepts

1. **Environment Consistency**: All tests run with standardized `bunEnv`
2. **Platform Detection**: Automatic detection of OS, architecture, and runtime
3. **Resource Management**: Automatic cleanup with `Symbol.dispose`
4. **Memory Testing**: Built-in tools for leak detection
5. **Container Testing**: Seamless Docker integration for services
6. **Secret Management**: Secure handling of test credentials

The harness provides a robust foundation for writing reliable, cross-platform tests that work consistently across different environments and CI systems.

---

*For the complete harness API, see the [harness.ts source](https://github.com/oven-sh/bun/blob/main/test/harness.ts) in the Bun repository.*</content>
<parameter name="filePath">examples/bun-test-harness-guide.md