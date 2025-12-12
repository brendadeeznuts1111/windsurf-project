// ============================================================
// @example advanced/error-handling: Bun Server Error Handling Demo
// Demonstrates development mode errors and custom error handlers
// Based on Bun's built-in error handling capabilities
// ============================================================

// Example 1: Development Mode Error Page
console.log('🚀 Starting Bun Error Handling Demo Server...');

const devServer = Bun.serve({
  port: 3001,
  development: true, // Enables built-in error page
  fetch(req) {
    const url = new URL(req.url);

    // Simulate different error scenarios
    if (url.pathname === '/throw-error') {
      throw new Error('This is a development error!');
    }

    if (url.pathname === '/async-error') {
      // Simulate async error
      return Promise.reject(new Error('Async operation failed!'));
    }

    if (url.pathname === '/custom-error') {
      // This will be handled by custom error handler
      throw new TypeError('Custom error type');
    }

    return new Response(`Bun Error Handling Demo\nVisit:\n- /throw-error (development error page)\n- /async-error (async error)\n- /custom-error (custom error handler)\n- /file-error (file system error)`, {
      headers: { 'Content-Type': 'text/plain' }
    });
  },
});

console.log(`📊 Development server: http://localhost:${devServer.port}`);
console.log('   Try: curl http://localhost:3001/throw-error');

// Example 2: Custom Error Handler
const customErrorServer = Bun.serve({
  port: 3002,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/custom-error') {
      throw new TypeError('This error will be handled by custom error handler');
    }

    if (url.pathname === '/file-error') {
      // Simulate file system error
      throw Object.assign(new Error('File not found'), { code: 'ENOENT' });
    }

    return new Response('Custom Error Handler Demo Server\nTry: /custom-error or /file-error', {
      headers: { 'Content-Type': 'text/plain' }
    });
  },
  error(error) {
    console.log('🔧 Custom error handler called:', error.message);

    // Handle different error types
    if (error instanceof TypeError) {
      return new Response(`<h1>Type Error</h1><p>${error.message}</p>`, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if ((error as any).code === 'ENOENT') {
      return new Response(`<h1>File Not Found</h1><p>${error.message}</p>`, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Default error response
    return new Response(`<h1>Server Error</h1><pre>${error.stack}</pre>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  },
});

console.log(`🛠️  Custom error server: http://localhost:${customErrorServer.port}`);

// Example 3: Production Error Handling (no stack traces)
const prodServer = Bun.serve({
  port: 3003,
  development: false, // Production mode
  fetch(req) {
    throw new Error('This error will be handled gracefully in production');
  },
  error(error) {
    // Log error for debugging (don't expose to client)
    console.error('Production error:', error.message);

    // Return safe, generic response
    return new Response('Something went wrong. Please try again later.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  },
});

console.log(`🏭 Production server: http://localhost:${prodServer.port}`);

// Cleanup function
function cleanup() {
  console.log('\n🧹 Shutting down servers...');
  devServer.stop();
  customErrorServer.stop();
  prodServer.stop();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

console.log('\n🎯 Test the servers:');
console.log('Development: curl http://localhost:3001/throw-error');
console.log('Custom:      curl http://localhost:3002/custom-error');
console.log('Production:  curl http://localhost:3003/ (any request)');
console.log('\nPress Ctrl+C to stop all servers');