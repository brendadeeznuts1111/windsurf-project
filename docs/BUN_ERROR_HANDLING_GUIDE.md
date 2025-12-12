# Bun Error Handling Guide

> Learn how to handle errors in Bun's development server

## Development Mode Error Handling

To activate development mode, set `development: true`.

```ts
Bun.serve({
  development: true, // Enables built-in error page
  fetch(req) {
    throw new Error("woops!");
  },
});
```

In development mode, Bun will surface errors in-browser with a built-in error page that shows the stack trace and error details.

## Error Callback Handler

To handle server-side errors programmatically, implement an `error` handler. This function should return a `Response` to serve to the client when an error occurs.

```ts
Bun.serve({
  fetch(req) {
    throw new Error("woops!");
  },
  error(error) {
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
});
```

## Error Handling Best Practices

### 1. Always Wrap Async Operations

```ts
Bun.serve({
  async fetch(req) {
    try {
      const data = await fetch('https://api.example.com');
      return new Response(await data.text());
    } catch (error) {
      return new Response(`API Error: ${error.message}`, { status: 500 });
    }
  },
  error(error) {
    console.error('Server error:', error);
    return new Response('Internal Server Error', { status: 500 });
  },
});
```

### 2. Handle Different Error Types

```ts
Bun.serve({
  async fetch(req) {
    try {
      // Your request handling logic
      return new Response('Success');
    } catch (error) {
      if (error instanceof TypeError) {
        return new Response('Bad Request', { status: 400 });
      }
      if (error.code === 'ENOENT') {
        return new Response('File Not Found', { status: 404 });
      }
      return new Response('Internal Server Error', { status: 500 });
    }
  },
});
```

### 3. Use Development Mode for Debugging

```ts
const isDevelopment = process.env.NODE_ENV === 'development';

Bun.serve({
  development: isDevelopment,
  fetch(req) {
    // Your logic here
  },
  error(error) {
    if (isDevelopment) {
      // Return detailed error in development
      return new Response(`<pre>${error.stack}</pre>`, {
        headers: { 'Content-Type': 'text/html' },
        status: 500
      });
    } else {
      // Return generic error in production
      return new Response('Something went wrong', { status: 500 });
    }
  },
});
```

## Common Error Patterns

### File System Errors

```ts
Bun.serve({
  async fetch(req) {
    try {
      const file = Bun.file('./data.json');
      const exists = await file.exists();
      if (!exists) {
        throw new Error('File not found');
      }
      return new Response(await file.text());
    } catch (error) {
      if (error.code === 'ENOENT') {
        return new Response('File not found', { status: 404 });
      }
      return new Response('File read error', { status: 500 });
    }
  },
});
```

### Network Request Errors

```ts
Bun.serve({
  async fetch(req) {
    try {
      const response = await fetch('https://api.example.com');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return new Response('Network error', { status: 503 });
      }
      return new Response('API error', { status: 500 });
    }
  },
});
```

## Error Logging

Always log errors for debugging, but be careful not to expose sensitive information in production.

```ts
Bun.serve({
  fetch(req) {
    // Your logic that might throw
  },
  error(error) {
    // Log the full error for debugging
    console.error('Server error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });

    // Return safe response to client
    return new Response('Something went wrong', { status: 500 });
  },
});
```

## Testing Error Scenarios

Create tests for your error handling:

```ts
import { test, expect } from 'bun:test';

test('handles file not found', async () => {
  const server = Bun.serve({
    fetch(req) {
      throw new Error('File not found');
    },
    error(error) {
      return new Response('Not found', { status: 404 });
    },
  });

  const response = await fetch(`http://localhost:${server.port}`);
  expect(response.status).toBe(404);
  expect(await response.text()).toBe('Not found');

  server.stop();
});
```

## Related Documentation

- [Bun Runtime Debugger](/runtime/debugger)
- [Bun Testing Guide](/guides/testing)
- [Bun File API](/api/file)
- [Bun Serve API](/api/serve)

---

*This guide demonstrates Bun's comprehensive error handling capabilities, from built-in development error pages to custom error responses and proper error logging practices.*