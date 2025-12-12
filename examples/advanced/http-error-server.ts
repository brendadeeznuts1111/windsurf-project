// examples/advanced/http-error-server.ts - Bun.serve Error Handling Failure Example
// Demonstrates error handling issues in Bun.serve

Bun.serve({
  port: 3000,
  async fetch(req) {
    throw new Error('woops!');  // Thrown error
    return new Response('OK');
  },
  error(e) {
    console.log('Caught:', e);  // This won't run
    return new Response('Uh oh: ' + e.message, { status: 500 });
  },
});
console.log('Server on http://localhost:3000');

export {}; // Make this a module