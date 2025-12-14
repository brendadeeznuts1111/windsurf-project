# Bun Text File Loader Demo

This demonstrates how to load text files in Bun, replacing Node.js `require.extensions`.

## Features

- Async text file loading with `Bun.file().text()`
- TypeScript import assertions support
- Batch loading capabilities
- Caching for performance
- Error handling

## Usage

```typescript
import { BunTextLoader } from './src/utils/bun-text-loader';

// Load single file
const content = await BunTextLoader.load('./config.txt');

// Load multiple files
const contents = await BunTextLoader.loadBatch([
  './config.txt',
  './template.txt',
  './readme.md'
]);
```
