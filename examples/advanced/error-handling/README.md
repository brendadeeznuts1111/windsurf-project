# Advanced Error Handling

Demonstrates Bun's comprehensive error handling capabilities for development and production servers.

## Features Demonstrated

- **Development Mode**: Built-in error pages with stack traces
- **Custom Error Handlers**: Programmatic error response control
- **Error Type Handling**: Different responses for different error types
- **Production Safety**: Generic error responses without sensitive data

## Usage

```bash
bun run examples/advanced/error-handling/bun-error-handling-demo.ts
```

This starts three servers demonstrating different error handling approaches:

### Development Server (Port 3001)
- Visit `http://localhost:3001/throw-error` to see Bun's built-in error page
- Visit `http://localhost:3001/async-error` for async error handling

### Custom Error Server (Port 3002)
- Visit `http://localhost:3002/custom-error` for custom HTML error responses
- Visit `http://localhost:3002/file-error` for file system error handling

### Production Server (Port 3003)
- Any request shows safe, generic error responses (no stack traces)

## Error Handling Patterns

### 1. Development Mode (Automatic)
```ts
Bun.serve({
  development: true, // Shows detailed error pages
  fetch(req) {
    throw new Error("woops!"); // Automatic error page
  }
});
```

### 2. Custom Error Handler
```ts
Bun.serve({
  fetch(req) {
    throw new Error("custom error");
  },
  error(error) {
    return new Response(`Custom error: ${error.message}`, {
      status: 500
    });
  }
});
```

### 3. Error Type Discrimination
```ts
error(error) {
  if (error instanceof TypeError) {
    return new Response('Type error', { status: 400 });
  }
  if ((error as any).code === 'ENOENT') {
    return new Response('File not found', { status: 404 });
  }
  return new Response('Server error', { status: 500 });
}
```

## Best Practices

- **Development**: Use `development: true` for debugging
- **Production**: Use custom error handlers to avoid exposing sensitive information
- **Logging**: Always log errors for monitoring, but don't expose in responses
- **Type Safety**: Check error types and codes for appropriate responses

## Related Examples

- Core: HTTP Server (#21)
- Testing: Error Examples (#01-#06)
- Docs: [Bun Error Handling Guide](../BUN_ERROR_HANDLING_GUIDE.md)