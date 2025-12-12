# Bun v1.3.4 Release Notes & Features

> Complete overview of Bun v1.3.4 enhancements including fs.glob improvements, SourceMap API, smarter TypeScript types, and Node.js compatibility fixes

## 🚀 Major Features

### fs.glob Array Support

The `node:fs` module's `glob`, `globSync`, and `promises.glob` functions now support arrays for patterns and exclude options, aligning with node-glob behavior.

```typescript
import { globSync } from "node:fs";

// Match multiple patterns simultaneously
const files = globSync(["**/*.js", "**/*.ts"], {
  ignore: ["node_modules/**"], // Array of exclude patterns
});

console.log(files.sort());
```

### node:module SourceMap API

Bun now implements the `SourceMap` class and `findSourceMap()` function from the `node:module` built-in module.

```typescript
import { SourceMap } from "node:module";

const payload = {
  version: 3,
  file: "output.js",
  sources: ["input.js"],
  sourcesContent: ["() => {}"],
  names: ["add"],
  mappings: "AAAA,SAASA,GAAG",
};

const map = new SourceMap(payload);

// Find original source location
const entry = map.findEntry(0, 9);
console.log(entry);
// {
//   generatedLine: 0,
//   generatedColumn: 9,
//   originalLine: 0,
//   originalColumn: 9,
//   originalSource: 'input.js',
//   name: 'add'
// }
```

## 🧠 Smarter TypeScript Types

Global types that exist in both browsers and Node.js environments now automatically extend the appropriate types based on your `tsconfig.json` configuration.

- **With DOM lib**: Merges with browser DOM types
- **Without DOM lib**: Extends Node.js-compatible types from `undici-types`, `node:perf_hooks`, etc.

## 🐛 Node.js Compatibility Fixes

### Environment Variables
- `NODE_NO_WARNINGS` environment variable is now respected

### HTTP/2
- Fixed multiple RST frame sending issue

### Testing Framework
- `-t` filter now properly hides skipped and todo tests
- Fixed memory corruption in `beforeEach` hooks

## 🔧 Runtime Bug Fixes

### Core Runtime
- Fixed rare crash in `Bun.which()`
- Request constructor now properly stores `redirect` option
- Fixed Content-Type header removal bug with FormData/ReadableStream
- `Bun.inspect` now shows file size for Response objects
- Fixed unref'd timers not executing in tiny applications

### Windows Compatibility
- Fixed crash when using async macros in bundler

### Web APIs
- WebSocket "error" event now includes Error object instead of string
- `Bun.S3` presigned URLs now sort query parameters alphabetically
- `fetch()` now allows Connection header override
- Fixed HTTP-only S3_ENDPOINT environment variable bug

## 📈 Performance Improvements

- Enhanced glob pattern matching with array support
- Improved SourceMap parsing and memory management
- Better Node.js compatibility reduces polyfill overhead

## 🔒 Security Enhancements

- More robust error handling in SourceMap parsing
- Improved environment variable validation
- Enhanced sandboxing for file operations

## 🛠️ Developer Experience

### Better Error Messages
- More descriptive error messages for glob operations
- Clearer SourceMap parsing error reporting
- Improved TypeScript type inference hints

### Tooling Integration
- Better compatibility with existing Node.js tooling
- Enhanced debugging capabilities with SourceMap support
- Improved test output filtering

## 📚 Migration Guide

### From v1.3.3 to v1.3.4

1. **No breaking changes** - All changes are backward compatible
2. **TypeScript projects** may see improved type inference automatically
3. **Glob operations** can now use arrays for better performance
4. **SourceMap debugging** is now fully supported

### Recommended Updates

```bash
# Update to latest version
bun update

# If using glob operations, consider array syntax for better performance
const files = globSync(["**/*.js", "**/*.ts"], {
  ignore: ["node_modules/**", "dist/**"]
});
```

## 🎯 Key Benefits

- **Better Node.js Compatibility**: More APIs work out of the box
- **Enhanced Developer Experience**: Smarter TypeScript types and better error messages
- **Performance Improvements**: Faster glob operations and better memory management
- **Robustness**: Fixed crashes and memory corruption issues
- **Future-Proof**: Aligns with latest Node.js features and patterns

This release continues Bun's mission of providing a fast, reliable, and compatible JavaScript runtime with excellent developer experience.