# Bun Fetch API Guide

> Send HTTP requests with Bun's enhanced fetch API implementation

Bun implements the WHATWG `fetch` standard with additional extensions for server-side JavaScript needs. While Bun also implements `node:http`, `fetch` is generally recommended for its simplicity and performance.

## Basic HTTP Requests

### GET Requests

```typescript
// Simple GET request
const response = await fetch("https://api.example.com/users");
console.log(response.status); // => 200

// Read response as text
const text = await response.text();

// Read response as JSON
const data = await response.json();

// Read response as bytes
const bytes = await response.bytes();
```

### HTTPS Support

```typescript
// HTTPS works automatically
const response = await fetch("https://api.github.com/users/octocat");
const user = await response.json();
console.log(user.name);
```

### Using Request Objects

```typescript
const request = new Request("https://api.example.com/data", {
  method: "GET",
  headers: {
    "Authorization": "Bearer token123",
    "Accept": "application/json"
  }
});

const response = await fetch(request);
const data = await response.json();
```

## POST and Other HTTP Methods

### POST Requests

```typescript
const response = await fetch("https://api.example.com/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com"
  })
});

const newUser = await response.json();
```

### Form Data

```typescript
const formData = new FormData();
formData.append("name", "John Doe");
formData.append("email", "john@example.com");
formData.append("avatar", fileInput.files[0]);

const response = await fetch("https://api.example.com/upload", {
  method: "POST",
  body: formData
});
```

### PUT, PATCH, DELETE

```typescript
// PUT request
const response = await fetch("https://api.example.com/users/123", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Updated Name" })
});

// DELETE request
const deleteResponse = await fetch("https://api.example.com/users/123", {
  method: "DELETE"
});
```

## Advanced Request Options

### Custom Headers

```typescript
const response = await fetch("https://api.example.com/data", {
  headers: {
    "Authorization": "Bearer token123",
    "X-API-Key": "my-api-key",
    "User-Agent": "MyApp/1.0"
  }
});
```

### Using Headers Object

```typescript
const headers = new Headers();
headers.append("Authorization", "Bearer token123");
headers.append("X-Custom-Header", "value");

const response = await fetch("https://api.example.com/data", {
  headers
});
```

### Timeout Control

```typescript
// Using AbortSignal.timeout (Bun extension)
const response = await fetch("https://slow-api.example.com", {
  signal: AbortSignal.timeout(5000) // 5 second timeout
});
```

### Request Cancellation

```typescript
const controller = new AbortController();

const responsePromise = fetch("https://api.example.com/data", {
  signal: controller.signal
});

// Cancel the request
controller.abort();

try {
  const response = await responsePromise;
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request was cancelled");
  }
}
```

## Response Handling

### Response Body Methods

```typescript
const response = await fetch("https://api.example.com/data");

// Text response
const text = await response.text();

// JSON response
const json = await response.json();

// Binary data
const bytes = await response.bytes();
const arrayBuffer = await response.arrayBuffer();

// Form data
const formData = await response.formData();

// Blob
const blob = await response.blob();
```

### Response Metadata

```typescript
const response = await fetch("https://api.example.com/data");

console.log("Status:", response.status);
console.log("Status Text:", response.statusText);
console.log("Headers:", Object.fromEntries(response.headers.entries()));
console.log("URL:", response.url);
console.log("OK:", response.ok); // true for 200-299 status codes
```

### Error Handling

```typescript
try {
  const response = await fetch("https://api.example.com/data");

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(data);
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request was aborted");
  } else if (error.name === "TypeError") {
    console.log("Network error or invalid URL");
  } else {
    console.error("Request failed:", error);
  }
}
```

## Streaming

### Streaming Response Bodies

```typescript
const response = await fetch("https://api.example.com/large-file");

// Using async iteration
for await (const chunk of response.body) {
  console.log("Received chunk:", chunk.length, "bytes");
}

// Using ReadableStream directly
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log("Chunk:", value);
}
```

### Streaming Request Bodies

```typescript
// Create a streaming request body
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue("Hello ");
    controller.enqueue("World!");
    controller.close();
  }
});

const response = await fetch("https://api.example.com/upload", {
  method: "POST",
  body: stream
});
```

## Proxy Support

### HTTP Proxy

```typescript
const response = await fetch("https://api.example.com/data", {
  proxy: "http://proxy.company.com:8080"
});
```

### Proxy with Authentication

```typescript
const response = await fetch("https://api.example.com/data", {
  proxy: {
    url: "http://proxy.company.com:8080",
    headers: {
      "Proxy-Authorization": "Basic " + btoa("username:password"),
      "X-Proxy-Custom": "value"
    }
  }
});
```

## TLS and Security

### Client Certificates

```typescript
const response = await fetch("https://secure-api.example.com", {
  tls: {
    key: Bun.file("/path/to/client-key.pem"),
    cert: Bun.file("/path/to/client-cert.pem"),
    ca: [Bun.file("/path/to/ca-cert.pem")]
  }
});
```

### Custom TLS Validation

```typescript
const response = await fetch("https://api.example.com", {
  tls: {
    checkServerIdentity: (hostname, cert) => {
      // Custom certificate validation
      if (hostname !== cert.subject.CN) {
        throw new Error("Certificate CN mismatch");
      }
    }
  }
});
```

### Disable TLS Validation (Development Only)

```typescript
// ⚠️ Only use in development with self-signed certificates
const response = await fetch("https://localhost:3000", {
  tls: {
    rejectUnauthorized: false
  }
});
```

## Unix Domain Sockets

```typescript
const response = await fetch("http://localhost/api", {
  unix: "/var/run/my-app.sock"
});
```

## Protocol Support

### S3 URLs

```typescript
// Using environment variables
const response = await fetch("s3://my-bucket/data.json");

// Using explicit credentials
const response = await fetch("s3://my-bucket/data.json", {
  s3: {
    accessKeyId: "AKIAEXAMPLE",
    secretAccessKey: "secret-key",
    region: "us-east-1"
  }
});
```

### File URLs

```typescript
const response = await fetch("file:///path/to/local/file.txt");
const content = await response.text();
```

### Data URLs

```typescript
const response = await fetch("data:text/plain;base64,SGVsbG8gV29ybGQ=");
const text = await response.text(); // "Hello World"
```

### Blob URLs

```typescript
const blob = new Blob(["Hello World"], { type: "text/plain" });
const url = URL.createObjectURL(blob);
const response = await fetch(url);
const text = await response.text();
```

## Performance Optimizations

### DNS Prefetching

```typescript
import { dns } from "bun";

// Prefetch DNS for faster connections
dns.prefetch("api.example.com");
```

### Preconnect

```typescript
// Preconnect to establish connection early
await fetch.preconnect("https://api.example.com");
```

### Connection Reuse

```typescript
// Bun automatically reuses connections (HTTP keep-alive)
// Disable for specific requests if needed
const response = await fetch("https://api.example.com", {
  keepalive: false
});
```

### Response Decompression

```typescript
// Automatic decompression (gzip, deflate, brotli, zstd)
const response = await fetch("https://api.example.com", {
  decompress: true // default: true
});
```

## Debugging

### Verbose Logging

```typescript
const response = await fetch("https://api.example.com", {
  verbose: true // Bun extension
});
```

Output:
```
[fetch] > GET https://api.example.com/
[fetch] > User-Agent: Bun/1.3.3
[fetch] > Accept: */*

[fetch] < 200 OK
[fetch] < Content-Type: application/json
[fetch] < Content-Length: 123
```

### Request Inspection

```typescript
const response = await fetch("https://api.example.com");

console.log("Request URL:", response.url);
console.log("Response headers:", Object.fromEntries(response.headers));
console.log("Response status:", response.status);
```

## Advanced Patterns

### Retry Logic

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

### Parallel Requests

```typescript
const urls = [
  "https://api.example.com/users",
  "https://api.example.com/posts",
  "https://api.example.com/comments"
];

const responses = await Promise.all(urls.map(url => fetch(url)));
const data = await Promise.all(responses.map(r => r.json()));
```

### Request Interception/Middleware

```typescript
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string, token?: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    };
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...options.headers };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  get(endpoint: string) {
    return this.request(endpoint);
  }

  post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
}

// Usage
const api = new ApiClient("https://api.example.com", "my-token");
const users = await api.get("/users");
const newUser = await api.post("/users", { name: "John" });
```

## Best Practices

### Error Handling
- Always check `response.ok` before processing
- Handle network errors with try/catch
- Use appropriate timeout values
- Implement retry logic for transient failures

### Performance
- Reuse connections with keep-alive (automatic)
- Use streaming for large responses
- Implement request timeouts
- Cache DNS lookups when possible

### Security
- Validate SSL certificates in production
- Use environment variables for sensitive data
- Implement proper authentication
- Validate response data

### Resource Management
- Close response bodies when done
- Cancel requests when components unmount
- Use appropriate timeouts to prevent hanging

This guide covers Bun's comprehensive fetch API implementation with all its extensions and optimizations beyond the standard Web API.