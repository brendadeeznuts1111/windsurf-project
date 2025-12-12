// ============================================================
// @example 04-types-integration: Bun TypeScript API Showcase
// Demonstrates native TS support: typeOf, deepEquals, typed BunFile/WebSocket
// Performance: Zero transpilation, full inference, runtime checks
// ============================================================

// Native TS: No tsconfig needed – Bun infers types automatically
import type { BunFile, ServerWebSocket } from 'bun';  // Auto-installed @types/bun

// 1. Runtime Type Detection with typeof
function inspectType(value: unknown): string {
  const type = typeof value;
  console.log(`Value: ${JSON.stringify(value)} | Type: ${type}`);
  return type;
}

// Example: Complex object typing
const user: { id: string; name: string; age: number } = { id: Bun.randomUUIDv7(), name: 'Alice', age: 30 };
inspectType(user);  // 'object'
inspectType(user.age);  // 'number'

// 2. Deep Equality with Type Safety
function validateConfig(expected: { port: number; debug: boolean }, actual: unknown): boolean {
  if (typeof actual !== 'object') return false;
  return Bun.deepEquals(actual as typeof expected, expected, true);
}

const config = { port: 3000, debug: true };
console.log('Config valid?', validateConfig(config, { port: 3000, debug: true }));  // true

// 3. Typed BunFile API
async function readTypedFile(path: string): Promise<BunFile> {
  const file: BunFile = Bun.file(path);
  if (!await file.exists()) {
    throw new Error(`File not found: ${path}`);  // Type-safe error
  }
  console.log(`File type: ${file.type} | Size: ${file.size} bytes`);
  const text = await file.text();  // Inferred as string
  return file;
}

// Usage: Read a sample TS file
try {
  const file = await readTypedFile('./sample-config.ts');
  console.log('Content preview:', (await file.text()).slice(0, 100));
} catch (e) {
  console.log('Sample file not found, skipping preview');
}

// 4. Typed ServerWebSocket in Bun.serve()
Bun.serve({
  port: 3001,
  websocket: {
    open(ws) {
      console.log('WebSocket connection opened');
    },
    message(ws, message) {
      console.log(`Typed WS message: ${typeof message} - ${message}`);
    },
  },
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      if (server.upgrade(req)) {
        return;  // No response needed for upgrade
      }
    }
    return new Response('Bun TS Server Ready!', {
      headers: { 'Content-Type': 'text/plain' }  // Typed Response
    });
  },
  error(e: Error) {
    console.error(`Typed error: ${typeof e} - ${e.message}`);
    return new Response('Internal Server Error', { status: 500 });
  }
});

console.log('Type-safe Bun server running on http://localhost:3001');
console.log('Test WS: wscat -c ws://localhost:3001/ws');

// Graceful exit with types
process.on('SIGINT', () => {
  console.log('Shutting down typed server...');
  process.exit(0);
});