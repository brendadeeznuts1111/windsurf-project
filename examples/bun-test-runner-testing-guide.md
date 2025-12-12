# 🧪 Bun Test Runner Testing Guide

*Generated on 2025-12-12T14:50:00.000Z*

## 📋 Overview

The `test/cli/test/` directory contains tests for the `bun test` command itself - a meta-testing approach where the test runner tests its own functionality. This ensures the test framework works correctly across different scenarios, configurations, and edge cases.

## 🗂️ Test Runner Test Organization

### Main Test Files

- **`__snapshots__/`** - Jest snapshot files for output validation
- **`bun-test.test.ts`** - Comprehensive test runner functionality tests (42KB+)
- **`claudecode-flag.test.ts`** - Claude Code integration testing
- **`concurrent-test-glob.test.ts`** - Concurrent test execution with glob patterns
- **`coverage.test.ts`** - Code coverage functionality testing
- **`expectations.test.ts`** - Test expectation utilities
- **`rerun-each.test.ts`** - Test re-run functionality
- **`test-randomize.test.ts`** - Test randomization features
- **`test-timeout-behavior.test.ts`** - Test timeout handling
- **`test-filter-lifecycle-snapshot.test.ts`** - Test filtering and lifecycle snapshots

### Fixture Files

- **`process-kill-fixture.ts`** - Process termination testing fixtures
- **`process-kill-fixture-sync.ts`** - Synchronous process kill fixtures
- **`test-filter-lifecycle.js`** - Test filtering lifecycle fixtures
- **`test-randomize.fixture.ts`** - Test randomization fixtures

## 🧪 Core Test Runner Functionality Tests

### Basic Test Execution

```typescript
describe("bun test", () => {
  test("runs basic test files", () => {
    const tempDir = tempDirWithFiles("basic-test", {
      "test.test.ts": `
        import { test, expect } from "bun:test";
        test("passes", () => expect(1 + 1).toBe(2));
      `,
    });

    const result = runBunCommand(["test"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("1 pass");
  });
});
```

### Test Discovery and Filtering

```typescript
test("finds test files with different extensions", () => {
  const tempDir = tempDirWithFiles("extensions-test", {
    "test.js": `import { test } from "bun:test"; test("js", () => {});`,
    "test.ts": `import { test } from "bun:test"; test("ts", () => {});`,
    "test.tsx": `import { test } from "bun:test"; test("tsx", () => {});`,
    "test.jsx": `import { test } from "bun:test"; test("jsx", () => {});`,
  });

  const result = runBunCommand(["test"], { cwd: tempDir });
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("4 pass");
});
```

### Test Patterns and Naming

```typescript
test("supports different test patterns", () => {
  const tempDir = tempDirWithFiles("patterns-test", {
    "unit.test.ts": `import { test } from "bun:test"; test("unit", () => {});`,
    "integration.spec.ts": `import { test } from "bun:test"; test("integration", () => {});`,
    "e2e.test.ts": `import { test } from "bun:test"; test("e2e", () => {});`,
    "MyClass.test.ts": `import { test } from "bun:test"; test("class", () => {});`,
  });

  const result = runBunCommand(["test"], { cwd: tempDir });
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("4 pass");
});
```

## 🔄 Concurrent Test Execution

### Glob Pattern Testing

```typescript
describe("concurrent test glob", () => {
  test("runs tests matching glob patterns concurrently", () => {
    const tempDir = tempDirWithFiles("glob-test", {
      "src": {
        "feature-a.test.ts": `import { test } from "bun:test"; test("a", () => {});`,
        "feature-b.test.ts": `import { test } from "bun:test"; test("b", () => {});`,
        "utils.test.ts": `import { test } from "bun:test"; test("utils", () => {});`,
      },
      "tests": {
        "api.test.ts": `import { test } from "bun:test"; test("api", () => {});`,
      },
    });

    // Test glob patterns
    const result1 = runBunCommand(["test", "src/*.test.ts"], { cwd: tempDir });
    expect(result1.stdout.toString()).toContain("3 pass");

    const result2 = runBunCommand(["test", "**/*.test.ts"], { cwd: tempDir });
    expect(result2.stdout.toString()).toContain("4 pass");
  });
});
```

### Concurrent Execution Behavior

```typescript
test("concurrent execution respects test isolation", () => {
  const tempDir = tempDirWithFiles("concurrent-isolation", {
    "test1.test.ts": `
      import { test } from "bun:test";
      global.testVar = "test1";
      test("sets global", () => {
        expect(global.testVar).toBe("test1");
      });
    `,
    "test2.test.ts": `
      import { test } from "bun:test";
      test("isolated global", () => {
        expect(global.testVar).toBeUndefined();
      });
    `,
  });

  const result = runBunCommand(["test"], { cwd: tempDir });
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("2 pass");
});
```

## 📊 Code Coverage Testing

### Coverage Report Generation

```typescript
describe("coverage", () => {
  test("generates coverage reports", () => {
    const tempDir = tempDirWithFiles("coverage-test", {
      "src": {
        "math.ts": `
          export function add(a: number, b: number): number {
            return a + b;
          }
          export function unused(a: number): number {
            return a * 2;
          }
        `,
      },
      "math.test.ts": `
        import { test, expect } from "bun:test";
        import { add } from "./src/math";

        test("add function", () => {
          expect(add(1, 2)).toBe(3);
        });
      `,
    });

    const result = runBunCommand(["test", "--coverage"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);

    // Check coverage files exist
    expect(fs.existsSync(join(tempDir, "coverage"))).toBe(true);
  });

  test("coverage includes branch coverage", () => {
    const tempDir = tempDirWithFiles("branch-coverage", {
      "conditional.ts": `
        export function check(value: number): string {
          if (value > 0) {
            return "positive";
          } else {
            return "non-positive";
          }
        }
      `,
      "conditional.test.ts": `
        import { test, expect } from "bun:test";
        import { check } from "./conditional";

        test("covers both branches", () => {
          expect(check(1)).toBe("positive");
          expect(check(-1)).toBe("non-positive");
        });
      `,
    });

    const result = runBunCommand(["test", "--coverage"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    // Coverage should show 100% branch coverage
  });
});
```

### Coverage Configuration

```typescript
test("respects coverage configuration", () => {
  const tempDir = tempDirWithFiles("coverage-config", {
    "bunfig.toml": `
[test]
coverage = true
coverageExclude = ["node_modules/**", "dist/**"]
coverageReporter = ["text", "html"]
`,
    "src": {
      "code.ts": `export const value = 42;`,
    },
    "code.test.ts": `
      import { test, expect } from "bun:test";
      import { value } from "./src/code";
      test("imports", () => expect(value).toBe(42));
    `,
  });

  const result = runBunCommand(["test"], { cwd: tempDir });
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("Coverage");
});
```

## 🎲 Test Randomization

### Random Execution Order

```typescript
describe("test randomization", () => {
  test("can randomize test execution order", () => {
    const tempDir = tempDirWithFiles("randomize-test", {
      "test1.test.ts": `import { test } from "bun:test"; test("1", () => {});`,
      "test2.test.ts": `import { test } from "bun:test"; test("2", () => {});`,
      "test3.test.ts": `import { test } from "bun:test"; test("3", () => {});`,
    });

    // Run with randomization seed
    const result1 = runBunCommand(["test", "--randomize", "123"], { cwd: tempDir });
    const result2 = runBunCommand(["test", "--randomize", "123"], { cwd: tempDir });

    // Same seed should produce same order
    expect(result1.stdout.toString()).toBe(result2.stdout.toString());

    // Different seed should potentially produce different order
    const result3 = runBunCommand(["test", "--randomize", "456"], { cwd: tempDir });
    // Note: Small test suites might not show randomization
  });
});
```

### Reproducible Randomization

```typescript
test("randomization is reproducible with seed", () => {
  const tempDir = tempDirWithFiles("reproducible-random", {
    "a.test.ts": `import { test } from "bun:test"; test("a", () => {});`,
    "b.test.ts": `import { test } from "bun:test"; test("b", () => {});`,
    "c.test.ts": `import { test } from "bun:test"; test("c", () => {});`,
  });

  const results = [];

  // Run multiple times with same seed
  for (let i = 0; i < 3; i++) {
    const result = runBunCommand(["test", "--randomize", "42"], { cwd: tempDir });
    results.push(result.stdout.toString());
  }

  // All results should be identical
  expect(results[0]).toBe(results[1]);
  expect(results[1]).toBe(results[2]);
});
```

## ⏱️ Timeout Behavior Testing

### Test-Level Timeouts

```typescript
describe("test timeouts", () => {
  test("respects per-test timeout", () => {
    const tempDir = tempDirWithFiles("timeout-test", {
      "timeout.test.ts": `
        import { test } from "bun:test";

        test("slow test", async () => {
          await Bun.sleep(100);
        }, 50); // 50ms timeout - should fail
      `,
    });

    const result = runBunCommand(["test"], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toContain("timed out");
  });

  test("global timeout configuration", () => {
    const tempDir = tempDirWithFiles("global-timeout", {
      "bunfig.toml": `
[test]
timeout = 100
`,
      "slow.test.ts": `
        import { test } from "bun:test";

        test("very slow", async () => {
          await Bun.sleep(200); // Exceeds 100ms global timeout
        });
      `,
    });

    const result = runBunCommand(["test"], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toContain("timed out");
  });
});
```

### Process Kill Testing

```typescript
describe("process kill behavior", () => {
  test("handles process termination gracefully", () => {
    const tempDir = tempDirWithFiles("process-kill", {
      "kill-test.test.ts": `
        import { test } from "bun:test";

        test("handles SIGTERM", async () => {
          process.on('SIGTERM', () => {
            process.exit(0);
          });
          // Test will be killed by timeout
          await Bun.sleep(10000);
        }, 100);
      `,
    });

    const result = runBunCommand(["test"], { cwd: tempDir });
    expect(result.exitCode).toBe(1); // Should fail due to timeout
  });
});
```

## 🔄 Test Re-run Functionality

### Re-run Each Feature

```typescript
describe("rerun-each", () => {
  test("can rerun failed tests multiple times", () => {
    const tempDir = tempDirWithFiles("rerun-test", {
      "flaky.test.ts": `
        import { test } from "bun:test";

        let attempts = 0;
        test("flaky test", () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("Flaky failure");
          }
          expect(true).toBe(true);
        });
      `,
    });

    // Run with rerun-each to allow retries
    const result = runBunCommand(["test", "--rerun-each", "3"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("1 pass");
  });
});
```

## 🎯 Test Filtering and Lifecycle

### Test Filtering

```typescript
describe("test filtering", () => {
  test("can filter by test name pattern", () => {
    const tempDir = tempDirWithFiles("filter-test", {
      "multiple.test.ts": `
        import { test, describe } from "bun:test";

        describe("math", () => {
          test("addition", () => expect(1 + 1).toBe(2));
          test("subtraction", () => expect(2 - 1).toBe(1));
          test("multiplication", () => expect(2 * 3).toBe(6));
        });

        describe("strings", () => {
          test("concatenation", () => expect("a" + "b").toBe("ab"));
          test("length", () => expect("hello".length).toBe(5));
        });
      `,
    });

    // Filter to only math tests
    const result = runBunCommand(["test", "--testNamePattern", "math"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("3 pass");
    expect(result.stdout.toString()).not.toContain("strings");
  });

  test("can filter by file path", () => {
    const tempDir = tempDirWithFiles("file-filter", {
      "unit.test.ts": `import { test } from "bun:test"; test("unit", () => {});`,
      "integration.test.ts": `import { test } from "bun:test"; test("integration", () => {});`,
      "e2e.test.ts": `import { test } from "bun:test"; test("e2e", () => {});`,
    });

    const result = runBunCommand(["test", "unit.test.ts"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("1 pass");
    expect(result.stdout.toString()).not.toContain("integration");
  });
});
```

### Test Lifecycle Snapshots

```typescript
test("test lifecycle follows expected order", () => {
  const tempDir = tempDirWithFiles("lifecycle-test", {
    "lifecycle.test.ts": `
      import { test, describe, beforeAll, beforeEach, afterEach, afterAll } from "bun:test";

      const events: string[] = [];

      describe("lifecycle test", () => {
        beforeAll(() => events.push("beforeAll"));
        beforeEach(() => events.push("beforeEach"));
        afterEach(() => events.push("afterEach"));
        afterAll(() => events.push("afterAll"));

        test("first test", () => {
          events.push("test1");
          expect(true).toBe(true);
        });

        test("second test", () => {
          events.push("test2");
          expect(true).toBe(true);
        });
      });

      // Expose events for snapshot testing
      global.lifecycleEvents = events;
    `,
  });

  const result = runBunCommand(["test"], { cwd: tempDir });
  expect(result.exitCode).toBe(0);

  // Lifecycle should follow: beforeAll, beforeEach, test1, afterEach, beforeEach, test2, afterEach, afterAll
  expect(global.lifecycleEvents).toMatchSnapshot();
});
```

## 🔧 Advanced Test Runner Features

### Custom Test Environment

```typescript
test("custom environment variables", () => {
  const tempDir = tempDirWithFiles("env-test", {
    "env.test.ts": `
      import { test, expect } from "bun:test";

      test("reads environment", () => {
        expect(process.env.CUSTOM_VAR).toBe("test-value");
        expect(process.env.NODE_ENV).toBe("test");
      });
    `,
  });

  const result = runBunCommand(["test"], {
    cwd: tempDir,
    env: { CUSTOM_VAR: "test-value" }
  });

  expect(result.exitCode).toBe(0);
});
```

### Test Runner Configuration

```typescript
describe("test configuration", () => {
  test("respects bunfig.toml test settings", () => {
    const tempDir = tempDirWithFiles("config-test", {
      "bunfig.toml": `
[test]
updateSnapshots = false
bail = true
verbose = true
`,
      "config.test.ts": `
        import { test, expect } from "bun:test";
        test("config test", () => expect(true).toBe(true));
      `,
    });

    const result = runBunCommand(["test"], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    // Should show verbose output due to config
    expect(result.stdout.toString()).toContain("config.test.ts");
  });
});
```

## 🐛 Error Handling and Edge Cases

### Test Runner Error Conditions

```typescript
test("handles missing test files gracefully", () => {
  const tempDir = tempDirWithFiles("no-tests", {
    "package.json": `{"name": "no-tests"}`,
  });

  const result = runBunCommand(["test"], { cwd: tempDir });
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("No tests found");
});

test("handles syntax errors in test files", () => {
  const tempDir = tempDirWithFiles("syntax-error", {
    "broken.test.ts": `import { test } from "bun:test"; test("broken", () => { syntax error });`,
  });

  const result = runBunCommand(["test"], { cwd: tempDir });
  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain("SyntaxError");
});
```

### Concurrent Execution Edge Cases

```typescript
test("handles test file with multiple describe blocks", () => {
  const tempDir = tempDirWithFiles("multiple-describe", {
    "multi.test.ts": `
      import { test, describe } from "bun:test";

      describe("group 1", () => {
        test("test 1", () => {});
      });

      describe("group 2", () => {
        test("test 2", () => {});
      });
    `,
  });

  const result = runBunCommand(["test"], { cwd: tempDir });
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("2 pass");
});
```

## 📊 Performance and Reliability Testing

### Test Runner Performance

```typescript
test("test runner performance scales", () => {
  const testFiles = [];
  for (let i = 0; i < 100; i++) {
    testFiles.push(`test${i}.test.ts`);
  }

  const tempDir = tempDirWithFiles("scale-test", {});
  testFiles.forEach(file => {
    fs.writeFileSync(join(tempDir, file), `
      import { test } from "bun:test";
      test("${file}", () => {});
    `);
  });

  const start = performance.now();
  const result = runBunCommand(["test"], { cwd: tempDir });
  const duration = performance.now() - start;

  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("100 pass");
  expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
});
```

## 📋 Best Practices for Test Runner Testing

### 1. **Test Isolation**
```typescript
describe("test isolation", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("environment is clean", () => {
    // Each test gets a clean environment
  });
});
```

### 2. **Deterministic Testing**
```typescript
test("avoids flaky tests", () => {
  // Use deterministic timing
  const start = Date.now();
  // ... test logic ...
  const duration = Date.now() - start;

  // Allow some variance but not too much
  expect(duration).toBeLessThan(1000);
});
```

### 3. **Comprehensive Coverage**
```typescript
describe("comprehensive testing", () => {
  test("tests success cases", () => {
    // Test happy path
  });

  test("tests error cases", () => {
    // Test error conditions
  });

  test("tests edge cases", () => {
    // Test boundary conditions
  });

  test("tests concurrent execution", () => {
    // Test race conditions
  });
});
```

## 🔗 Related Examples

- [Testing Guide](./bun-testing-guide.md)
- [Test Harness Reference](./bun-test-harness-guide.md)
- [CLI Testing Guide](./bun-cli-testing-guide.md)
- [Error Codes & Troubleshooting](./bun-error-codes-troubleshooting.md)

## 📚 Key Concepts

1. **Meta-Testing**: Testing the test runner itself ensures reliability
2. **Concurrent Execution**: Tests run in parallel for better performance
3. **Comprehensive Coverage**: Tests all features, edge cases, and configurations
4. **Deterministic Results**: Consistent test execution across environments
5. **Performance Validation**: Ensures test runner scales and performs well
6. **Configuration Testing**: Validates all configuration options work correctly

The test runner tests ensure that Bun's testing framework is robust, reliable, and performs well under various conditions and configurations.

---

*For the complete test runner test suite, see the [test/cli/test/](https://github.com/oven-sh/bun/tree/main/test/cli/test) directory in the Bun repository.*</content>
<parameter name="filePath">examples/bun-test-runner-testing-guide.md