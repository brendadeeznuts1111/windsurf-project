# Bun Build & Bundle Guide

> Advanced bundling, transpilation, and optimization with Bun's native bundler

Bun includes a fast, native bundler that can transpile TypeScript, JSX, and other formats to JavaScript. This guide covers advanced bundling features and optimization techniques.

## Basic Bundling

### Command Line Usage

```bash
# Bundle a single file
bun build ./src/index.ts

# Bundle with output directory
bun build ./src/index.ts --outdir ./dist

# Bundle to a single file
bun build ./src/index.ts --outfile ./dist/bundle.js

# Watch mode for development
bun build ./src/index.ts --watch

# Minify for production
bun build ./src/index.ts --minify
```

### Configuration with package.json

```json package.json
{
  "name": "my-app",
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --minify",
    "dev": "bun build ./src/index.ts --outdir ./dist --watch"
  }
}
```

## Advanced Configuration

### bunfig.toml Configuration

```toml
# bunfig.toml
[build]
# Output directory
outdir = "./dist"

# Single output file (alternative to --outfile)
# outfile = "./dist/bundle.js"

# Target environment
target = "browser"  # "browser" | "node" | "bun"

# Minification options
minify = true
minifySyntax = true
minifyWhitespace = true
minifyIdentifiers = true

# Source maps
sourcemap = "linked"  # "none" | "inline" | "linked" | "external"

# Code splitting
splitting = true

# Public path for assets
publicPath = "/assets/"

# External dependencies (don't bundle)
external = ["react", "react-dom"]

# Define global constants
[build.define]
"process.env.NODE_ENV" = "\"production\""
"__DEV__" = "false"

# Loader configuration
[build.loaders]
".png" = "file"
".jpg" = "file"
".svg" = "dataurl"
".css" = "text"
```

### Entry Points

```bash
# Single entry point
bun build ./src/index.ts

# Multiple entry points
bun build ./src/index.ts ./src/admin.ts --outdir ./dist

# Glob patterns
bun build ./src/pages/*.ts --outdir ./dist
```

## Loaders and File Types

Bun automatically handles many file types with built-in loaders:

### JavaScript/TypeScript

```typescript
// index.ts
import { add } from './math.ts';
import React from 'react';
import styles from './styles.css';

console.log(add(1, 2));
```

### CSS Handling

```css
/* styles.css */
.button {
  background: blue;
  color: white;
}

.button:hover {
  background: darkblue;
}
```

```typescript
// Import CSS
import './styles.css';

// CSS modules
import styles from './styles.module.css';
element.className = styles.button;
```

### Asset Loading

```typescript
// File loader (copies file and returns path)
import logoPath from './logo.png';
img.src = logoPath;

// Data URL loader (embeds file as base64)
import logoData from './logo.svg';
img.src = logoData;

// Text loader
import shaderCode from './shader.glsl';
console.log(shaderCode);
```

### JSON Files

```typescript
// Automatic JSON parsing
import config from './config.json';
console.log(config.apiUrl);

// Raw JSON as string
import configText from './config.json' assert { type: 'text' };
const config = JSON.parse(configText);
```

## Code Splitting

### Dynamic Imports

```typescript
// Code splitting with dynamic imports
const button = document.createElement('button');
button.textContent = 'Load Feature';
button.onclick = async () => {
  const { heavyFeature } = await import('./heavy-feature.ts');
  heavyFeature();
};
document.body.appendChild(button);
```

### Manual Chunking

```typescript
// Split vendor libraries
import React from 'react';  // Goes into vendor chunk
import utils from './utils'; // Goes into main chunk

// Force new chunk
const admin = import('./admin.ts'); // Creates separate chunk
```

## Optimization Techniques

### Tree Shaking

Bun automatically removes unused code:

```typescript
// Only `add` function is included in bundle
import { add } from './math.ts';
console.log(add(1, 2));

// `subtract` function is tree-shaken away
// import { subtract } from './math.ts';
```

### Minification Options

```bash
# Basic minification
bun build --minify

# Advanced minification (more aggressive)
bun build --minify --minify-syntax --minify-whitespace --minify-identifiers
```

### Dead Code Elimination

```typescript
// This code is eliminated if NEVER is false
if (false) {
  console.log('This is dead code');
}

// Conditional dead code
const DEBUG = false;
if (DEBUG) {
  console.log('Debug info');
}
```

## Framework Integration

### React Applications

```typescript
// index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

```bash
# Build React app
bun build ./src/index.tsx --outdir ./dist --minify
```

### Svelte Components

```typescript
// App.svelte
<script>
  let count = 0;
</script>

<button on:click={() => count++}>
  Count: {count}
</button>
```

```typescript
// index.ts
import App from './App.svelte';
import './styles.css';

const app = new App({
  target: document.body,
});
```

## Plugin System

### Custom Plugins

```typescript
// plugin.ts
import type { BunPlugin } from 'bun';

const myPlugin: BunPlugin = {
  name: 'my-plugin',
  setup(build) {
    // Custom loader
    build.onLoad({ filter: /\.custom$/ }, async (args) => {
      const text = await Bun.file(args.path).text();
      return {
        contents: `export default ${JSON.stringify(text)};`,
        loader: 'js',
      };
    });

    // Custom resolver
    build.onResolve({ filter: /^virtual:/ }, (args) => {
      if (args.path === 'virtual:theme') {
        return { path: args.path, namespace: 'virtual' };
      }
    });

    build.onLoad({ filter: /^virtual:/, namespace: 'virtual' }, (args) => {
      return {
        contents: 'export const theme = "dark";',
        loader: 'js',
      };
    });
  },
};

export default myPlugin;
```

```typescript
// build.ts
import { build } from 'bun';
import myPlugin from './plugin.ts';

await build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [myPlugin],
});
```

## Development vs Production

### Development Builds

```bash
# Fast builds with source maps
bun build --watch --sourcemap=inline

# Hot reload setup
bun --hot run dev.ts
```

### Production Builds

```bash
# Optimized production build
bun build --minify --sourcemap=linked --target=browser

# Analyze bundle size
bun build --analyze
```

## Advanced Features

### Conditional Compilation

```typescript
// Development-only code
if (process.env.NODE_ENV === 'development') {
  console.log('Debug mode');
}

// Platform-specific code
if (process.platform === 'win32') {
  // Windows-specific code
} else {
  // Unix-specific code
}
```

### Environment Variables

```typescript
// Runtime environment variables
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Build-time replacement
const VERSION = process.env.npm_package_version;
```

### Asset Optimization

```typescript
// Image optimization
import logo from './logo.png'; // Automatically optimized

// Font loading
import './fonts/inter.css';

// CSS optimization
import './styles.css'; // Minified and optimized
```

## Performance Tips

### Bundle Analysis

```bash
# Analyze bundle composition
bun build --analyze

# Check bundle size
ls -lh dist/bundle.js
```

### Optimization Checklist

- [ ] Use `--minify` for production
- [ ] Enable code splitting for large apps
- [ ] Use dynamic imports for lazy loading
- [ ] Externalize large dependencies
- [ ] Optimize images and assets
- [ ] Use appropriate target environment
- [ ] Enable source maps for debugging

### Build Performance

```bash
# Parallel builds
bun build ./src/*.ts --outdir ./dist

# Incremental builds with watch mode
bun build --watch

# Use .bunfig.toml for persistent config
```

## Historical Context: Bytecode Alignment Evolution

> **Important**: Understanding Bun's build system evolution helps explain current reliability and performance characteristics.

### The v1.1.11 Bytecode Alignment Fix

Bun v1.1.11 (December 2025) contained a critical fix that transformed `--compile` from experimental to production-ready. This fix addressed **8-byte alignment requirements** for bytecode cache sections in standalone executables.

**Key Issues Resolved:**
- **Memory corruption** in compiled binaries on ARM64
- **I/O performance degradation** due to alignment faults
- **Race conditions** during parallel package installation
- **Shell script failures** with variable expansion

**Performance Impact:**
- **20ms improvement** in `bun install` summary generation
- **Zero-copy operations** enabled for file streams
- **Direct memory mapping** of bytecode sections

### Verification Commands

```bash
# Check binary alignment (macOS)
otool -l compiled-binary | grep -A2 JSBC
# Should show: align 2^3 (8)

# Test compilation reliability
echo 'console.log("test")' > test.ts
bun build --compile test.ts --outfile test-bin
./test-bin  # Should exit cleanly
```

### Related Historical Documentation

For a deep technical dive into these fixes and their cascading effects, see: [Bun v1.1.11 Bytecode Alignment Analysis](../bun-v111-bytecode-alignment-analysis.md)

This historical context explains why Bun's current build system is exceptionally reliable for production use.

This guide covers Bun's powerful bundling capabilities. For runtime APIs and deployment, see the related guides.