# Bun v1.3.6 Release Notes & Breaking Changes

> Complete overview of Bun v1.3.6 updates including breaking changes, new features, and migration guide

## Overview

Bun v1.3.6 introduces several breaking changes and improvements focused on type safety, error handling, and Node.js compatibility. This release includes changes to WebSocket handling, type definitions, build behavior, and testing functionality.

## Breaking Changes

### WebSocket Data Definition (XState Pattern)

WebSocket data in `Bun.serve()` now uses a pattern popularized by XState due to TypeScript limitations.

```typescript
// Before v1.3.6
Bun.serve({
  websocket: {
    open(ws) {
      ws.data = { userId: 123 };
    },
    message(ws, msg) {
      console.log(ws.data.userId); // TypeScript error
    }
  }
});

// After v1.3.6 (XState pattern)
Bun.serve({
  websocket: {
    open(ws, env) {
      ws.data = { userId: 123 };
    },
    message(ws, msg) {
      console.log(ws.data.userId); // ✅ TypeScript happy
    }
  }
});
```

### Type System Changes

#### Bun.Server<T> Generic Type

`Bun.Server` is now generic with the WebSocket data type parameter:

```typescript
// Before v1.3.6
const server = Bun.serve({ /* config */ });
type ServerType = typeof server; // Bun.Server

// After v1.3.6
const server = Bun.serve({ /* config */ });
type ServerType = typeof server; // Bun.Server<WebSocketData | undefined>
```

#### Bun.ServeOptions Deprecated

`Bun.ServeOptions` is deprecated in favor of `Bun.Serve.Options`:

```typescript
// Before v1.3.6
import type { ServeOptions } from 'bun';
const config: ServeOptions = { /* ... */ };

// After v1.3.6
import type { Serve } from 'bun';
const config: Serve.Options = { /* ... */ };
```

### Bun.serve() Routes

The `static` option has been renamed to `routes`:

```typescript
// Before v1.3.6
Bun.serve({
  static: {
    '/api': apiHandler,
    '/files': fileHandler
  }
});

// After v1.3.6
Bun.serve({
  routes: {
    '/api': apiHandler,
    '/files': fileHandler
  }
});
```

### SQL Client Error Handling

SQL client now throws an error if called as a function instead of a tagged template literal:

```typescript
import { sql } from './db';

// ❌ Before v1.3.6 (allowed but incorrect)
const result = sql('SELECT * FROM users');

// ✅ After v1.3.6 (correct usage)
const result = sql`SELECT * FROM users`;

// ✅ Alternative for dynamic queries
const result = sql.unsafe('SELECT * FROM users');
```

### Bun.build() Error Handling

`Bun.build()` now throws `AggregateError` by default on build failures:

```typescript
// Before v1.3.6 - threw single Error
try {
  await Bun.build({ /* config */ });
} catch (error) {
  console.log(error.message); // Single error message
}

// After v1.3.6 - throws AggregateError
try {
  await Bun.build({ /* config */ });
} catch (error) {
  if (error instanceof AggregateError) {
    console.log('Multiple build errors:');
    error.errors.forEach(err => console.log(`- ${err.message}`));
  } else {
    console.log(error.message);
  }
}

// To revert to old behavior
await Bun.build({
  /* config */,
  throw: false // Returns result object instead of throwing
});
```

### Minifier Behavior

Minifier now removes unused function and class expression names by default:

```typescript
// Before v1.3.6
const helper = () => 'unused';
export const main = () => 'used';

// After minification: helper function name preserved

// After v1.3.6
const helper = () => 'unused';
export const main = () => 'used';

// After minification: helper function name removed

// To preserve names
bun build --minify --keep-names
```

### bun:test TypeScript Types

TypeScript types for `bun:test`'s expect matchers are now stricter:

```typescript
// Before v1.3.6 - more lenient
expect(null).toBe("hello"); // TypeScript allowed this

// After v1.3.6 - stricter types
expect(null).toBe("hello"); // ❌ TypeScript error

// Fix with type parameter
expect(null).toBe<string | null>("hello"); // ✅ Allowed
```

### bun test Filter Behavior

`bun test -t <filter>` now fails with an error when no tests match the regex:

```bash
# Before v1.3.6
bun test -t "nonexistent" # Exits successfully (no output)

# After v1.3.6
bun test -t "nonexistent" # Exits with error code 1
# Error: No tests found matching pattern: nonexistent
```

### bun test Nesting

`test()` and `afterAll()` inside another `test()` callback now throw errors:

```typescript
// ❌ Before v1.3.6 (silently ignored)
test('outer test', () => {
  test('nested test', () => {
    expect(true).toBe(true);
  });
});

// ✅ After v1.3.6 (throws error)
test('outer test', () => {
  // ❌ Error: test() cannot be nested inside another test()
  test('nested test', () => {
    expect(true).toBe(true);
  });
});

// Fix: Move nested test outside or use describe()
describe('test group', () => {
  test('first test', () => { /* ... */ });
  test('second test', () => { /* ... */ });
});
```

### Namespace Imports

Objects from `import * as ns` no longer inherit from `Object.prototype`:

```typescript
// Before v1.3.6
import * as utils from './utils';
console.log(utils.hasOwnProperty('map')); // true

// After v1.3.6
import * as utils from './utils';
console.log(utils.hasOwnProperty('map')); // false (or undefined)
```

## New Features & Improvements

### TypeScript Module Resolution

TypeScript default `"module": "Preserve"` (was auto-detected):

```json
// tsconfig.json - now defaults to preserve
{
  "compilerOptions": {
    "module": "Preserve" // Default in v1.3.6
  }
}
```

### GC Signal Change

GC signal changed from `SIGUSR1` to `SIGPWR` on Linux for better compatibility.

### File Extension Handling

`require('./file.unknown-extension')` defaults to JavaScript loader instead of file loader for Node.js compatibility.

### Command Aliases

`bun info` is now aliased to `bun pm view`:

```bash
bun info react        # Same as: bun pm view react
bun pm view react     # Original command still works
```

### Network Interfaces

`os.networkInterfaces()` returns `scopeid` instead of `scope_id` for IPv6 interfaces (matches Node.js).

### Node.js Version Reporting

Bun now reports as Node.js v24.3.0 instead of v22.6.0:

```typescript
console.log(process.version);        // "v24.3.0"
console.log(process.versions.node);  // "24.3.0"
// Affects N-API version reporting
```

## Migration Guide: v1.3.5 → v1.3.6

### Immediate Actions Required

#### 1. Update WebSocket Handlers
```typescript
// Find all Bun.serve() websocket configurations
Bun.serve({
  websocket: {
    // Add 'env' parameter to open() handler
    open(ws, env) {  // ← Added 'env' parameter
      ws.data = { userId: 123 };
    },

    // message/close handlers unchanged
    message(ws, msg) {
      console.log(ws.data.userId);
    }
  }
});
```

#### 2. Update Type Imports
```typescript
// Replace Bun.ServeOptions
import type { Serve } from 'bun';
const config: Serve.Options = { /* ... */ };

// Update server types
const server: Bun.Server<WebSocketData> = Bun.serve({ /* ... */ });
```

#### 3. Update Route Configuration
```typescript
// Rename 'static' to 'routes'
Bun.serve({
  routes: {  // ← Renamed from 'static'
    '/api': apiHandler,
    '/files': fileHandler
  }
});
```

#### 4. Fix SQL Client Usage
```typescript
// Use tagged templates instead of function calls
const users = sql`SELECT * FROM users WHERE active = ${true}`;
const posts = sql`SELECT * FROM posts LIMIT ${limit}`;

// For dynamic queries
const query = `SELECT * FROM ${table}`;
const result = sql.unsafe(query);
```

#### 5. Update Build Error Handling
```typescript
try {
  await Bun.build({ /* config */ });
} catch (error) {
  if (error instanceof AggregateError) {
    // Handle multiple errors
    error.errors.forEach(err => console.error(err.message));
  } else {
    // Handle single error (legacy behavior)
    console.error(error.message);
  }
}
```

### Testing Updates Required

#### 1. Fix Test Nesting
```typescript
// ❌ Remove nested test() calls
test('parent', () => {
  test('child', () => {}); // ← Remove this
});

// ✅ Use describe() for grouping
describe('feature', () => {
  test('scenario 1', () => {});
  test('scenario 2', () => {});
});
```

#### 2. Update Expect Matchers
```typescript
// Add type parameters for stricter checking
expect(null).toBe<string | null>(null);
expect(undefined).toBe<number | undefined>(undefined);

// Or use more specific assertions
expect(value).toBeNull();
expect(value).toBeUndefined();
```

#### 3. Update Test Filters
```bash
# Test that filters work as expected
bun test -t "auth"  # Will fail if no matching tests

# Use broader patterns to avoid failures
bun test -t ".*auth.*"
```

### Build Configuration Updates

#### 1. Minification Settings
```bash
# Add --keep-names if you need function names preserved
bun build --minify --keep-names

# Or configure in build script
await Bun.build({
  /* config */,
  minify: {
    identifiers: false  // Preserve names
  }
});
```

#### 2. TypeScript Configuration
```json
// tsconfig.json - verify module setting
{
  "compilerOptions": {
    "module": "Preserve"  // Now the default
  }
}
```

### Namespace Import Updates

```typescript
// Before v1.3.6
import * as utils from './utils';
if (utils.hasOwnProperty('map')) { /* ... */ }

// After v1.3.6
import * as utils from './utils';
if (Object.hasOwn(utils, 'map')) { /* ... */ }
// Or use Object.prototype.hasOwnProperty.call()
if (Object.prototype.hasOwnProperty.call(utils, 'map')) { /* ... */ }
```

## Compatibility Matrix

| Feature | v1.3.5 | v1.3.6 | Migration Required |
|---------|--------|--------|-------------------|
| WebSocket data | Legacy pattern | XState pattern | ✅ Yes |
| Bun.Server type | Non-generic | Generic | ⚠️ Type updates |
| ServeOptions | Current | Deprecated | ✅ Update imports |
| Routes static | `static` | `routes` | ✅ Rename option |
| SQL client | Function allowed | Tagged templates only | ✅ Update queries |
| Build errors | Single Error | AggregateError | ⚠️ Error handling |
| Minifier | Preserves names | Removes names | ⚠️ Add --keep-names |
| Test types | Lenient | Strict | ⚠️ Type parameters |
| Test filter | Silent fail | Error on no match | ⚠️ Update scripts |
| Test nesting | Silent ignore | Throws error | ✅ Restructure tests |
| Namespace imports | Inherits Object.prototype | No inheritance | ⚠️ Update checks |

## Testing Your Migration

### Automated Checks

```bash
# 1. Check for WebSocket usage
grep -r "Bun\.serve" --include="*.ts" --include="*.tsx" .

# 2. Check for deprecated imports
grep -r "Bun\.ServeOptions" --include="*.ts" --include="*.tsx" .

# 3. Check for SQL function calls
grep -r "sql(" --include="*.ts" .

# 4. Check for nested tests
grep -r "test(" --include="*.ts" | grep -A 5 -B 5 "test("

# 5. Check for namespace imports
grep -r "import \* as" --include="*.ts" --include="*.tsx" .
```

### Manual Verification

```typescript
// Test WebSocket changes
const server = Bun.serve({
  websocket: {
    open(ws, env) {  // Should not cause TypeScript errors
      ws.data = { connected: true };
    }
  },
  port: 3000
});

// Test type changes
const typedServer: Bun.Server<{ connected: boolean }> = server;

// Test SQL changes
import { sql } from './db';
const result = sql`SELECT 1`;  // Should work
// const bad = sql('SELECT 1');  // Should throw error

// Test build changes
try {
  await Bun.build({ entrypoints: ['./test.ts'] });
} catch (error) {
  if (error instanceof AggregateError) {
    console.log('AggregateError caught correctly');
  }
}
```

## Performance Impact

### Improvements
- **Better TypeScript performance** with preserved modules
- **Faster minification** with name removal
- **Improved Node.js compatibility** with version reporting
- **Better error aggregation** for build failures

### Potential Breaking Changes
- **Build output size** may decrease due to minification changes
- **Debugging difficulty** may increase with removed function names
- **Test execution time** may change with stricter filtering

## Support & Resources

### Getting Help
- **Migration Issues**: Check the [Bun Discord](https://bun.sh/discord) #help channel
- **Type Errors**: Use `bun --print` to evaluate type issues
- **Build Failures**: Run with `--verbose` for detailed error information

### Rollback Options
If you encounter blocking issues, you can temporarily work around some changes:

```bash
# Disable stricter test filtering
# (No direct flag, restructure tests instead)

# Preserve function names in minification
bun build --minify --keep-names

# Use older error handling
await Bun.build({ /* config */, throw: false });
```

This release focuses on **type safety improvements** and **better Node.js compatibility** while maintaining Bun's performance advantages. The breaking changes are designed to prevent common errors and improve the developer experience in the long term.