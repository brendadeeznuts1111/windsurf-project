# 🚨 Bun Error Codes & Troubleshooting Guide

*Generated on 2025-12-12T14:30:00.000Z*

## 📋 Overview

Bun, as a JavaScript runtime, bundler, test runner, and package manager, doesn't maintain a centralized, exhaustive list of numeric "error codes" like some traditional tools (e.g., Node.js's ERR_* prefixes or npm's E* codes). Instead, errors are primarily descriptive messages with stack traces, often including exit codes (numeric values returned by CLI commands) for scripting and automation.

These are influenced by JavaScriptCore (Bun's JS engine) and Web APIs, so many errors mirror standard JS exceptions (e.g., TypeError, ReferenceError) but with Bun-specific enhancements like faster stack traces and source code snippets.

**Key Features:**
- Helpful diagnostics with truncated source code (up to 1024 bytes/line)
- Real-time error reporting in VS Code
- Fast stack traces with syntax highlighting
- Exit codes for automation (0 = success, 1+ = failure)

## 🔧 Error Categories

### 1. Runtime Errors (Bun as JS Runtime)

Bun's runtime throws standard JS errors but adds Bun-specific ones for its APIs (e.g., `Bun.file`, `Bun.serve`). Errors include stack traces with source code highlights.

**Format:**
```
Error: <message>
    at <file>:<line>:<col>
<Source code snippet with ^ pointer>
```

**Exit Codes:** Typically 1 for unhandled exceptions; 0 for success.

#### Common Runtime Errors

| Error Type/Message | When It Occurs | Example | Fix/Workaround |
|-------------------|----------------|---------|----------------|
| `TypeError: Cannot read properties of undefined` | Accessing undefined properties | `console.log(undefined.prop);` | Add null checks: `if (obj?.prop) { ... }` |
| `ReferenceError: <var> is not defined` | Undeclared variable in strict mode | Using var without let/const | Declare variables properly |
| `BunFileError: ENOENT: no such file or directory` | `Bun.file(path)` where path doesn't exist | `Bun.file('/nonexistent.txt').text()` | Use `Bun.file(path).exists()` first |
| `SyntaxError: Unexpected token` | Invalid JS/TS syntax | Malformed import or JSX | Fix syntax; Bun auto-transpiles |
| `AggregateError: Multiple errors occurred` | Parallel ops fail | `Promise.all([fetch('/bad'), fetch('/bad2')])` | Handle with try/catch |
| `AbortError: The operation was aborted` | Timeout or signal abort | Long-running `Bun.spawn` | Set timeouts: `{ timeout: 5000 }` |
| `ModuleNotFoundError: Cannot resolve "<module>"` | Import non-existent module | `import 'missing-pkg'` | Install with `bun add <pkg>` |

**Notes:**
- Bun truncates long source code in errors to avoid terminal overflow
- For `Bun.serve()`: Port conflicts return HTTP 500
- Unhandled promise rejections are logged with stack traces

### 2. Test Runner Errors (`bun test`)

Bun's test runner uses Jest-like syntax with Bun's speed. It tracks errors between tests and exits with the count of unhandled errors.

| Error Type/Exit Code | When It Occurs | Example | Fix/Workaround |
|---------------------|----------------|---------|----------------|
| Exit Code: `<n>` (n > 0) | Unhandled rejections/errors between tests | Async code leaks promises | Wrap in test blocks |
| `TestTimeoutError: Test did not finish before timeout` | Test exceeds timeout (default 5s) | Infinite loop in test | Set `test.timeout(10000)` |
| `AssertionError: Expected ... to be ...` | Failed expect matcher | `expect(1).toBe(2)` | Review Bun Test API docs |
| `SnapshotMismatchError` | Snapshot test fails | Output changed after code change | Update with `--update-snapshot` |
| `ModuleResolutionError` | Missing file/module in test | `import './missing.ts'` | Ensure paths exist |

**Notes:**
- Global timeout: 2147483647ms (effectively infinite for suites)
- Environment: Sets `NODE_ENV=test`
- VS Code integration: Real-time errors in "Problems" tab

### 3. CLI & Package Manager Errors

Bun's package manager uses descriptive messages, often borrowing from npm/Yarn. Exit codes: 0 = success, 1 = general failure, 8 = auth/network.

| Error Code/Message | When It Occurs | Example | Fix/Workaround |
|-------------------|----------------|---------|----------------|
| `ERESOLVE: unable to resolve dependency tree` | Conflicting dependency versions | Peer dep mismatch | Use overrides in package.json |
| `ENOENT: no such file or directory` | Missing package.json/lockfile | `bun install` in empty dir | Run `bun init` first |
| `EADDRINUSE: address already in use` | Port conflict | Multiple servers on same port | Change port with `--port` |
| `ENOTFOUND: registry error` | Network/registry issue | Offline or bad mirror | Check connection |
| Exit Code 1: Installation failed | Invalid semver in `bun add` | `bun add react@^999.0.0` | Verify versions |
| SIGINT/SIGTERM (130/143) | Process interrupted | Ctrl+C during `bun run` | Handle signals gracefully |

**Notes:**
- Lockfile: `bun.lockb` (binary) prevents resolution errors
- Windows: v1.1.1+ fixes native module installation
- Publishing: Resolves catalog refs; fails on mismatches

### 4. Build & Transpile Errors (`bun build`)

Errors during bundling/transpiling with descriptive messages.

| Error Type/Message | When It Occurs | Example | Fix/Workaround |
|-------------------|----------------|---------|----------------|
| `BuildError: Failed to bundle` | Circular deps or invalid syntax | Import cycle: A → B → A | Refactor imports |
| `TranspileError: Unsupported syntax` | Experimental JS features | Top-level await in non-module | Enable with `--target bun` |
| `MinifyError` | Code too large for minification | Huge bundle with `--minify` | Split code or disable |
| Exit Code 1: Output path invalid | Bad `--outfile` path | Permission denied | Check directory permissions |

## 🛠️ General Troubleshooting Tips

### Debugging
- Use `bun --inspect` for Chrome DevTools debugging
- Add `console.trace()` for custom stack traces
- Redirect stderr: `bun run script.ts 2> errors.log`

### Updates
- Many errors are fixed in recent releases
- Check `bun --help` and release notes
- VS Code: Real-time error reporting in Problems tab

### Community Resources
- GitHub Issues: [oven-sh/bun](https://github.com/oven-sh/bun)
- Stack Overflow: Search for `[bun]` tag
- Discord: Official Bun community

## 📚 Related Examples

- [Error Handling Patterns](./examples/error-handling-patterns.ts)
- [Custom Error Classes](./examples/custom-error-classes.ts)
- [Async Error Handling](./examples/async-error-handling.ts)
- [Testing Error Scenarios](./examples/testing-error-scenarios.test.ts)

## 🔗 Quick Reference

**Exit Codes:**
- `0`: Success
- `1`: General error / unhandled exception
- `8`: Auth/network issues
- `130`: SIGINT (Ctrl+C)
- `143`: SIGTERM

**Most Common Fixes:**
1. Check file paths exist
2. Verify package versions
3. Add null/undefined checks
4. Handle async operations properly
5. Check network connectivity

---

*For the latest error information, run `bun --help` or check the [Bun Blog](https://bun.sh/blog) for release notes.*</content>
<parameter name="filePath">docs/bun-error-codes-troubleshooting.md