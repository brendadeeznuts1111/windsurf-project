# 🔌 Bun Plugin Testing Guide

*Generated on 2025-12-12T14:55:00.000Z*

## 📋 Overview

Bun provides comprehensive testing capabilities for plugins used in development mode and bundling. Plugin tests ensure that custom build hooks, resolvers, and loaders work correctly across different scenarios.

## 🏗️ Plugin Testing Infrastructure

### Development Mode Testing

Bun's plugin testing uses the `devTest` harness for testing plugins in development server environments:

```typescript
import { devTest, minimalFramework } from "../bake-harness";

// Test plugin functionality in dev mode
devTest("plugin behavior", {
  framework: minimalFramework,
  pluginFile: `
    export default [{
      name: 'test-plugin',
      setup(build) {
        // Plugin setup code
      }
    }];
  `,
  files: {
    "routes/index.ts": `
      export default function() {
        return new Response("Hello from plugin!");
      }
    `,
  },
  async test(dev) {
    await dev.fetch("/").equals("Hello from plugin!");
  },
});
```

### Key Testing Components

- **`devTest`**: Test runner for development mode plugin testing
- **`minimalFramework`**: Basic framework configuration for testing
- **`pluginFile`**: Plugin code as a string (dynamically loaded)
- **`files`**: Test project file structure
- **`test()`**: Async test function with dev server access

## 🔧 Plugin Hook Testing

### onResolve Hook Testing

The `onResolve` hook handles module resolution and path transformation:

```typescript
devTest("onResolve path transformation", {
  framework: minimalFramework,
  pluginFile: `
    import * as path from 'path';
    export default [{
      name: 'resolve-plugin',
      setup(build) {
        build.onResolve({ filter: /trigger/ }, (args) => {
          return { path: path.join(import.meta.dirname, '/resolved.ts') };
        });
      }
    }];
  `,
  files: {
    "resolved.ts": `
      export const value = "resolved";
    `,
    "routes/index.ts": `
      import { value } from 'trigger';

      export default function (req, meta) {
        return new Response('Resolved: ' + value);
      }
    `,
  },
  async test(dev) {
    await dev.fetch("/").equals("Resolved: resolved");
  },
});
```

**Key Concepts:**
- **Filter Pattern**: Regex to match import paths
- **Path Resolution**: Transform import paths to actual file paths
- **Namespace Support**: Handle virtual modules

### onLoad Hook Testing

The `onLoad` hook transforms file contents before compilation:

```typescript
devTest("onLoad content transformation", {
  framework: minimalFramework,
  pluginFile: `
    export default [{
      name: 'load-plugin',
      setup(build) {
        build.onLoad({ filter: /transform/ }, (args) => {
          return {
            contents: 'export const transformed = true;',
            loader: 'ts'
          };
        });
      }
    }];
  `,
  files: {
    "transform.ts": `
      // This content will be replaced by the plugin
      throw new Error('Original content should not execute');
    `,
    "routes/index.ts": `
      import { transformed } from '../transform.ts';

      export default function (req, meta) {
        return new Response('Transformed: ' + transformed);
      }
    `,
  },
  async test(dev) {
    await dev.fetch("/").equals("Transformed: true");
  },
});
```

**Key Concepts:**
- **Content Replacement**: Return custom file contents
- **Loader Specification**: Define file type for compilation
- **Caching Behavior**: Test multiple requests for consistency

## 🌐 Virtual File Testing

### Namespace-Based Virtual Files

Plugins can create virtual files that don't exist on disk:

```typescript
devTest("virtual file creation", {
  framework: minimalFramework,
  pluginFile: `
    export default [{
      name: 'virtual-plugin',
      setup(build) {
        build.onResolve({ filter: /^virtual:/ }, (args) => {
          return {
            path: args.path.slice(8), // Remove 'virtual:' prefix
            namespace: 'virtual'
          };
        });

        build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
          return {
            contents: \`export default "\${args.path} loaded virtually";\`,
            loader: 'ts'
          };
        });
      }
    }];
  `,
  files: {
    "routes/index.ts": `
      import virtual from 'virtual:hello';
      import disk from '../real-file.ts';

      export default function (req, meta) {
        return Response.json([virtual, disk]);
      }
    `,
    "real-file.ts": `
      export default "real file content";
    `,
  },
  async test(dev) {
    await dev.fetch("/").equals([
      "hello loaded virtually",
      "real file content"
    ]);
  },
});
```

**Key Concepts:**
- **Custom Namespaces**: Isolate virtual files from disk files
- **Path Manipulation**: Transform import paths
- **Loader Integration**: Virtual files work with TypeScript compilation

## 🔄 Watch Mode Testing

### File Change Detection

Test how plugins respond to file system changes:

```typescript
devTest("watch mode file changes", {
  framework: minimalFramework,
  pluginFile: `
    let changeCount = 0;
    export default [{
      name: 'watch-plugin',
      setup(build) {
        build.onLoad({ filter: /watched/ }, (args) => {
          changeCount++;
          return {
            contents: \`export const changes = \${changeCount};\`,
            loader: 'ts'
          };
        });
      }
    }];
  `,
  files: {
    "watched.ts": `
      export const initial = true;
    `,
    "routes/index.ts": `
      import { changes } from '../watched.ts';

      export default function (req, meta) {
        return new Response('Changes: ' + changes);
      }
    `,
  },
  async test(dev) {
    // Initial load
    await dev.fetch("/").equals("Changes: 1");

    // Modify watched file
    await dev.write("watched.ts", "export const modified = true;");

    // Should detect change and reload
    await dev.fetch("/").equals("Changes: 2");
  },
});
```

## 🧪 Advanced Plugin Testing Patterns

### Multi-Plugin Coordination

Test how multiple plugins interact:

```typescript
devTest("multi-plugin interaction", {
  framework: minimalFramework,
  pluginFile: `
    export default [
      {
        name: 'plugin-a',
        setup(build) {
          build.onResolve({ filter: /step1/ }, () => ({ path: 'virtual:step2' }));
        }
      },
      {
        name: 'plugin-b',
        setup(build) {
          build.onResolve({ filter: /^virtual:/ }, (args) => ({
            path: args.path,
            namespace: 'virtual'
          }));
          build.onLoad({ filter: /.*/, namespace: 'virtual' }, () => ({
            contents: 'export default "processed by both plugins";',
            loader: 'ts'
          }));
        }
      }
    ];
  `,
  files: {
    "routes/index.ts": `
      import result from 'step1';

      export default function() {
        return new Response(result);
      }
    `,
  },
  async test(dev) {
    await dev.fetch("/").equals("processed by both plugins");
  },
});
```

### Error Handling Testing

Test plugin error conditions and recovery:

```typescript
devTest("plugin error handling", {
  framework: minimalFramework,
  pluginFile: `
    export default [{
      name: 'error-plugin',
      setup(build) {
        build.onLoad({ filter: /error/ }, () => {
          throw new Error("Plugin transformation failed");
        });
      }
    }];
  `,
  files: {
    "error.ts": `export const shouldNotLoad = true;`,
    "routes/index.ts": `
      import { shouldNotLoad } from '../error.ts';

      export default function() {
        return new Response("Should not reach here");
      }
    `,
  },
  async test(dev) {
    // Should return 500 error due to plugin failure
    const response = await dev.fetch("/");
    expect(response.status).toBe(500);
  },
});
```

## 🛠️ Testing Utilities

### Plugin Testing Helpers

```typescript
// Helper to create plugin test configurations
function createPluginTest(name: string, pluginCode: string, testFiles: any) {
  return {
    framework: minimalFramework,
    pluginFile: pluginCode,
    files: testFiles,
    async test(dev) {
      // Common test assertions
      const response = await dev.fetch("/");
      expect(response.status).toBe(200);
    }
  };
}

// Usage
devTest("custom plugin", createPluginTest("my-plugin", `
  export default [{
    name: 'my-plugin',
    setup(build) {
      // Plugin logic
    }
  }];
`, {
  "routes/index.ts": `export default () => new Response("OK");`
}));
```

### Performance Testing

```typescript
devTest("plugin performance", {
  framework: minimalFramework,
  pluginFile: `
    export default [{
      name: 'perf-plugin',
      setup(build) {
        build.onLoad({ filter: /.*/ }, (args) => {
          const start = Date.now();
          // Simulate processing time
          for (let i = 0; i < 1000; i++) {
            Math.sqrt(i);
          }
          const duration = Date.now() - start;
          return {
            contents: \`export const processTime = \${duration};\`,
            loader: 'ts'
          };
        });
      }
    }];
  `,
  files: {
    "routes/index.ts": `
      import { processTime } from '../test.ts';

      export default function() {
        return new Response('Processing time: ' + processTime + 'ms');
      }
    `,
    "test.ts": `export const dummy = true;`
  },
  async test(dev) {
    const response = await dev.fetch("/");
    const text = await response.text();
    expect(text).toContain("Processing time:");
    // Could add performance assertions here
  },
});
```

## 🔧 Plugin Testing Best Practices

### 1. **Isolation Testing**
```typescript
describe("plugin isolation", () => {
  devTest("plugin A doesn't affect plugin B", {
    // Test each plugin independently
  });

  devTest("plugins can be combined", {
    // Test plugin interactions
  });
});
```

### 2. **Edge Case Coverage**
```typescript
devTest("handles empty files", {
  pluginFile: `export default [{ /* plugin that handles empty files */ }];`,
  files: {
    "empty.ts": "",
    "routes/index.ts": `import '../empty.ts'; export default () => Response.json({ok: true});`
  },
  async test(dev) {
    await dev.fetch("/").equals({ok: true});
  }
});
```

### 3. **Error Recovery Testing**
```typescript
devTest("graceful error recovery", {
  pluginFile: `
    export default [{
      name: 'resilient-plugin',
      setup(build) {
        build.onLoad({ filter: /.*/ }, (args) => {
          try {
            // Risky operation
            return { contents: transformFile(args.path) };
          } catch (error) {
            // Fallback behavior
            return { contents: 'export default "fallback";' };
          }
        });
      }
    }];
  `,
  files: {
    "routes/index.ts": `
      import result from '../problematic.ts';
      export default () => new Response(result);
    `,
    "problematic.ts": `// File that causes transformation issues`
  },
  async test(dev) {
    await dev.fetch("/").equals("fallback");
  }
});
```

## 📊 Plugin Testing Metrics

### Coverage Goals
- **Hook Coverage**: Test all plugin hooks (onResolve, onLoad, onStart, onEnd)
- **Filter Coverage**: Test various filter patterns and edge cases
- **Namespace Coverage**: Test custom namespaces and virtual files
- **Error Coverage**: Test error conditions and recovery paths

### Performance Benchmarks
- **Load Times**: Plugin initialization and file processing speed
- **Memory Usage**: Plugin memory footprint during development
- **Concurrent Requests**: Performance under load

## 🔗 Related Examples

- [Bundler Plugin Testing](./bundler-plugin-testing.md)
- [Custom Plugin Development](./custom-plugin-development.md)
- [Build Hook Reference](./build-hooks-reference.md)
- [Virtual Module Patterns](./virtual-module-patterns.md)

## 📚 Key Concepts

1. **Development Mode**: Plugins tested in live development environment
2. **Hook Testing**: Individual testing of onResolve, onLoad, and other hooks
3. **Virtual Files**: Testing namespace-based virtual module systems
4. **Watch Integration**: File change detection and hot reloading
5. **Error Handling**: Plugin failure modes and recovery strategies
6. **Performance**: Plugin efficiency and resource usage monitoring

Plugin testing ensures that Bun's extensible build system works reliably with custom plugins, maintaining the same high standards as the core runtime.

---

*For the complete plugin testing suite, see the [test/bake/](https://github.com/oven-sh/bun/tree/main/test/bake) directory in the Bun repository.*</content>
<parameter name="filePath">examples/bun-plugin-testing-guide.md