# Bun Web APIs Guide

> Enhanced web APIs with Bun's performance improvements and additional features

Bun enhances and extends standard web APIs with better performance, additional functionality, and improved developer experience. This guide covers the key web APIs that work differently or better in Bun.

## Enhanced Fetch API

Bun's fetch implementation is faster and includes additional features beyond the standard Web API.

### Basic Usage

```typescript
// Standard fetch works exactly the same
const response = await fetch('https://api.example.com/data');
const data = await response.json();
console.log(data);
```

### Enhanced Features

```typescript
// Automatic JSON parsing
const user = await fetch('https://api.example.com/user/123').json();

// Automatic text parsing
const html = await fetch('https://example.com/page').text();

// Automatic arrayBuffer for binary data
const imageData = await fetch('https://example.com/image.png').arrayBuffer();

// Direct blob access
const blob = await fetch('https://example.com/file.pdf').blob();
```

### Request/Response Enhancements

```typescript
// Enhanced Request object
const request = new Request('https://api.example.com', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ name: 'John', age: 30 })
});

// Request cloning (improved performance)
const clonedRequest = request.clone();

// Enhanced Response object
const response = await fetch(request);

// Response properties
console.log('Status:', response.status);
console.log('Status Text:', response.statusText);
console.log('Headers:', Object.fromEntries(response.headers.entries()));
console.log('URL:', response.url);

// Response cloning
const clonedResponse = response.clone();
```

### Advanced Fetch Patterns

```typescript
// Parallel requests with Promise.all
const [users, posts, comments] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
  fetch('/api/comments').then(r => r.json())
]);

// Request with timeout
function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

try {
  const response = await fetchWithTimeout('https://slow-api.example.com');
  const data = await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out');
  } else {
    console.error('Request failed:', error);
  }
}

// Retry logic
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Web Crypto API

Bun provides fast implementations of Web Crypto API with additional utilities.

### Cryptographic Operations

```typescript
// Generate random values
const array = new Uint8Array(32);
crypto.getRandomValues(array);
console.log('Random bytes:', array);

// Hash data
async function hashData(data: string, algorithm: string = 'SHA-256') {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

const hash = await hashData('Hello World');
console.log('SHA-256 hash:', hash);
```

### HMAC Signing

```typescript
async function createHMAC(message: string, secret: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return new Uint8Array(signature);
}

const signature = await createHMAC('Hello World', 'my-secret-key');
console.log('HMAC signature:', signature);
```

### AES Encryption

```typescript
async function encryptAES(text: string, password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  return { encrypted: new Uint8Array(encrypted), iv, salt };
}

async function decryptAES(encrypted: Uint8Array, iv: Uint8Array, salt: Uint8Array, password: string) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Usage
const { encrypted, iv, salt } = await encryptAES('Secret message', 'password123');
const decrypted = await decryptAES(encrypted, iv, salt, 'password123');
console.log('Decrypted:', decrypted);
```

## Web Streams API

Bun provides enhanced support for streams with better performance and additional utilities.

### Readable Streams

```typescript
// Create a readable stream from an array
function createArrayStream<T>(array: T[]) {
  return new ReadableStream<T>({
    start(controller) {
      for (const item of array) {
        controller.enqueue(item);
      }
      controller.close();
    }
  });
}

const numberStream = createArrayStream([1, 2, 3, 4, 5]);
const reader = numberStream.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log('Value:', value);
}
```

### Transform Streams

```typescript
// Create a transform stream that doubles numbers
const doubleStream = new TransformStream<number, number>({
  transform(chunk, controller) {
    controller.enqueue(chunk * 2);
  }
});

// Chain streams
const inputStream = createArrayStream([1, 2, 3, 4, 5]);
const doubledStream = inputStream.pipeThrough(doubleStream);

// Collect results
const results: number[] = [];
const reader = doubledStream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  results.push(value);
}
console.log('Doubled:', results); // [2, 4, 6, 8, 10]
```

### Writable Streams

```typescript
// Create a writable stream that logs data
const loggingStream = new WritableStream<string>({
  write(chunk) {
    console.log('Received:', chunk);
  },
  close() {
    console.log('Stream closed');
  }
});

// Write to the stream
const writer = loggingStream.getWriter();
await writer.write('Hello');
await writer.write('World');
await writer.close();
```

### Stream Utilities

```typescript
// Convert async iterable to readable stream
async function* asyncGenerator() {
  for (let i = 0; i < 5; i++) {
    yield i;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

const stream = new ReadableStream({
  async start(controller) {
    for await (const value of asyncGenerator()) {
      controller.enqueue(value);
    }
    controller.close();
  }
});

// Convert stream to array
async function streamToArray<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader();
  const results: T[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    results.push(value);
  }

  return results;
}

const array = await streamToArray(stream);
console.log('Array:', array);
```

## URL and URLSearchParams

Bun provides enhanced URL handling with better performance.

### URL Parsing and Manipulation

```typescript
// Parse URLs
const url = new URL('https://example.com:8080/path/to/resource?param1=value1&param2=value2#fragment');

// Access components
console.log('Protocol:', url.protocol);    // 'https:'
console.log('Host:', url.host);           // 'example.com:8080'
console.log('Hostname:', url.hostname);   // 'example.com'
console.log('Port:', url.port);           // '8080'
console.log('Pathname:', url.pathname);   // '/path/to/resource'
console.log('Search:', url.search);       // '?param1=value1&param2=value2'
console.log('Hash:', url.hash);           // '#fragment'

// Modify URL
url.pathname = '/new/path';
url.searchParams.set('param3', 'value3');
url.hash = '#new-fragment';

console.log('Modified URL:', url.toString());
```

### URLSearchParams

```typescript
// Create from URL
const url = new URL('https://example.com?foo=bar&baz=qux');
const params = url.searchParams;

// Get parameters
console.log('foo:', params.get('foo'));        // 'bar'
console.log('baz:', params.get('baz'));        // 'qux'
console.log('missing:', params.get('missing')); // null

// Get all values for a key
params.append('foo', 'bar2');
console.log('all foo:', params.getAll('foo')); // ['bar', 'bar2']

// Check if parameter exists
console.log('has foo:', params.has('foo'));    // true
console.log('has missing:', params.has('missing')); // false

// Set parameters
params.set('newParam', 'newValue');
params.set('foo', 'updated'); // Replaces all 'foo' values

// Delete parameters
params.delete('baz');

// Iterate over parameters
for (const [key, value] of params) {
  console.log(`${key}: ${value}`);
}

// Convert to string
console.log('Query string:', params.toString()); // 'foo=updated&foo=bar2&newParam=newValue'
```

## FormData and File APIs

Enhanced support for form data and file handling.

### FormData

```typescript
// Create FormData
const formData = new FormData();

// Add text fields
formData.append('name', 'John Doe');
formData.append('email', 'john@example.com');

// Add file
const file = Bun.file('./document.pdf');
formData.append('document', file);

// Add multiple values
formData.append('tags', 'javascript');
formData.append('tags', 'typescript');

// Iterate over entries
for (const [key, value] of formData.entries()) {
  console.log(`${key}:`, value);
}

// Send with fetch
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

### File and Blob APIs

```typescript
// Create files from various sources
const textFile = new File(['Hello World'], 'hello.txt', { type: 'text/plain' });
const jsonFile = new File([JSON.stringify({ key: 'value' })], 'data.json', { type: 'application/json' });

// Create from Bun.file
const bunFile = Bun.file('./image.png');
const webFile = new File([await bunFile.arrayBuffer()], 'image.png', { type: 'image/png' });

// File properties
console.log('Name:', textFile.name);
console.log('Size:', textFile.size);
console.log('Type:', textFile.type);
console.log('Last modified:', textFile.lastModified);

// Read file content
const text = await textFile.text();
const arrayBuffer = await textFile.arrayBuffer();
const blob = textFile.slice(0, 5); // First 5 bytes

// Blob operations
const blob = new Blob(['Hello', ' ', 'World'], { type: 'text/plain' });
const blobText = await blob.text();
const blobSize = blob.size;
```

## Headers API

Enhanced Headers object with better performance and utilities.

```typescript
// Create headers
const headers = new Headers({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer token123'
});

// Add headers
headers.append('X-Custom-Header', 'value1');
headers.append('X-Custom-Header', 'value2'); // Multiple values allowed

// Set headers (replaces existing)
headers.set('Content-Type', 'text/plain');

// Get headers
console.log('Content-Type:', headers.get('Content-Type'));
console.log('All X-Custom-Header:', headers.getAll('X-Custom-Header'));

// Check if header exists
console.log('Has Authorization:', headers.has('Authorization'));

// Delete headers
headers.delete('X-Custom-Header');

// Iterate over headers
for (const [key, value] of headers.entries()) {
  console.log(`${key}: ${value}`);
}

// Convert to object
const headersObject = Object.fromEntries(headers.entries());
console.log('Headers object:', headersObject);
```

## AbortController and AbortSignal

Better support for cancellable operations.

```typescript
// Create abort controller
const controller = new AbortController();
const signal = controller.signal;

// Use with fetch
const fetchPromise = fetch('/api/data', { signal });

// Abort the request
setTimeout(() => {
  controller.abort();
}, 1000);

// Handle abortion
try {
  const response = await fetchPromise;
  const data = await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was aborted');
  } else {
    console.error('Request failed:', error);
  }
}

// Multiple operations with same signal
const promises = [
  fetch('/api/users', { signal }),
  fetch('/api/posts', { signal }),
  fetch('/api/comments', { signal })
];

// Abort all at once
controller.abort();
```

## Performance Tips

### Fetch Optimization

1. **Use appropriate methods**: `response.json()`, `response.text()`, etc. for automatic parsing
2. **Implement timeouts**: Use AbortController for request timeouts
3. **Retry logic**: Implement exponential backoff for failed requests
4. **Connection pooling**: Reuse connections for multiple requests

### Crypto Performance

1. **Use appropriate algorithms**: SHA-256 for general hashing, HMAC for integrity
2. **Key caching**: Reuse cryptographic keys when possible
3. **Streaming crypto**: Use streams for large data encryption/decryption

### Stream Efficiency

1. **Backpressure handling**: Respect stream backpressure
2. **Chunked processing**: Process data in appropriate chunk sizes
3. **Resource cleanup**: Close streams when done

### General Web API Tips

1. **URL caching**: Parse URLs once and reuse
2. **Header reuse**: Create header objects once for similar requests
3. **FormData optimization**: Use appropriate data types for form fields
4. **Memory management**: Clean up resources (streams, controllers) when done

This guide covers Bun's enhanced web APIs. For runtime-specific APIs like `Bun.serve()` and `Bun.file()`, see the Runtime API Guide.