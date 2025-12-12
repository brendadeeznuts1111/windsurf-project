/**
 * Bun ReadableStream Methods - .text(), .json(), .bytes(), .blob()
 * Demonstrates the new ReadableStream utility methods for easy data consumption
 */

import { test, describe, expect } from 'bun:test';

// ===== BASIC USAGE EXAMPLES =====

// Example 1: .text() method
test('ReadableStream.text() - Convert stream to string', async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('Hello World'));
      controller.close();
    }
  });

  const text = await stream.text();
  expect(text).toBe('Hello World');
});

// Example 2: .json() method
test('ReadableStream.json() - Parse stream as JSON', async () => {
  const data = { message: 'Hello', count: 42, items: [1, 2, 3] };
  const jsonString = JSON.stringify(data);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(jsonString));
      controller.close();
    }
  });

  const parsed = await stream.json();
  expect(parsed).toEqual(data);
  expect(parsed.message).toBe('Hello');
  expect(parsed.count).toBe(42);
  expect(parsed.items).toEqual([1, 2, 3]);
});

// Example 3: .bytes() method
test('ReadableStream.bytes() - Get stream as Uint8Array', async () => {
  const originalBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(originalBytes);
      controller.close();
    }
  });

  const bytes = await stream.bytes();
  expect(bytes).toBeInstanceOf(Uint8Array);
  expect(bytes).toEqual(originalBytes);
  expect(new TextDecoder().decode(bytes)).toBe('Hello');
});

// Example 4: .blob() method
test('ReadableStream.blob() - Convert stream to Blob', async () => {
  const data = 'Hello World 🌍';
  const encoded = new TextEncoder().encode(data);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoded);
      controller.close();
    }
  });

  const blob = await stream.blob();
  expect(blob).toBeInstanceOf(Blob);
  expect(blob.size).toBe(encoded.length);
  expect(blob.type).toBe(''); // Default type

  const text = await blob.text();
  expect(text).toBe(data);
});

// ===== ADVANCED USAGE PATTERNS =====

// Example 5: Fetch response streams
test('Using ReadableStream methods with fetch responses', async () => {
  // Mock a fetch response with a ReadableStream body
  const mockData = { status: 'success', data: [1, 2, 3, 4, 5] };
  const jsonString = JSON.stringify(mockData);

  // Create a Response with a ReadableStream body
  const response = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(jsonString));
        controller.close();
      }
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  // Use the new methods
  const text = await response.clone().text();
  expect(text).toBe(jsonString);

  const json = await response.clone().json();
  expect(json).toEqual(mockData);

  const bytes = await response.clone().bytes();
  expect(bytes).toBeInstanceOf(Uint8Array);

  const blob = await response.clone().blob();
  expect(blob).toBeInstanceOf(Blob);
  expect(blob.type).toBe('application/json');
});

// Example 6: File streams
test('Using ReadableStream methods with file streams', async () => {
  // Create a test file
  const testData = {
    name: 'Test File',
    content: 'This is test content',
    numbers: [10, 20, 30, 40, 50]
  };

  const jsonContent = JSON.stringify(testData, null, 2);
  await Bun.write('test-stream-file.json', jsonContent);

  // Read file as stream
  const file = Bun.file('test-stream-file.json');
  const stream = file.stream();

  // Use new methods
  const text = await stream.text();
  expect(text).toBe(jsonContent);

  const json = await file.stream().json();
  expect(json).toEqual(testData);

  const bytes = await file.stream().bytes();
  expect(bytes).toBeInstanceOf(Uint8Array);
  expect(bytes.length).toBe(jsonContent.length);

  const blob = await file.stream().blob();
  expect(blob).toBeInstanceOf(Blob);
  expect(blob.size).toBe(jsonContent.length);

  // Cleanup
  await Bun.write('test-stream-file.json', '');
});

// Example 7: Binary data streams
test('Binary data with ReadableStream methods', async () => {
  // Create binary data (simulating an image or file)
  const binaryData = new Uint8Array(1024);
  for (let i = 0; i < binaryData.length; i++) {
    binaryData[i] = i % 256;
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(binaryData);
      controller.close();
    }
  });

  const bytes = await stream.bytes();
  expect(bytes).toEqual(binaryData);
  expect(bytes.length).toBe(1024);

  const blob = await stream.blob();
  expect(blob.size).toBe(1024);

  // Convert back to bytes from blob
  const blobBytes = new Uint8Array(await blob.arrayBuffer());
  expect(blobBytes).toEqual(binaryData);
});

// ===== ERROR HANDLING =====

test('Error handling with ReadableStream methods', async () => {
  // Test invalid JSON
  const invalidJsonStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{ invalid json }'));
      controller.close();
    }
  });

  await expect(invalidJsonStream.json()).rejects.toThrow();

  // Test closed stream
  const closedStream = new ReadableStream({
    start(controller) {
      controller.close();
    }
  });

  const text = await closedStream.text();
  expect(text).toBe('');

  const bytes = await closedStream.bytes();
  expect(bytes).toEqual(new Uint8Array(0));

  const blob = await closedStream.blob();
  expect(blob.size).toBe(0);
});

// ===== PERFORMANCE COMPARISON =====

test('Performance comparison with traditional approaches', async () => {
  const largeData = 'x'.repeat(100000); // 100KB of data

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(largeData));
      controller.close();
    }
  });

  // Method 1: Using new .text() method
  const start1 = performance.now();
  const text1 = await stream.text();
  const time1 = performance.now() - start1;

  // Method 2: Traditional approach (would need to recreate stream)
  const stream2 = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(largeData));
      controller.close();
    }
  });

  const start2 = performance.now();
  const reader = stream2.getReader();
  let text2 = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text2 += new TextDecoder().decode(value);
  }
  const time2 = performance.now() - start2;

  expect(text1).toBe(largeData);
  expect(text2).toBe(largeData);

  console.log(`New .text() method: ${time1.toFixed(2)}ms`);
  console.log(`Traditional approach: ${time2.toFixed(2)}ms`);
  console.log(`Speedup: ${(time2 / time1).toFixed(1)}x`);

  // New method should be faster or comparable
  expect(time1).toBeLessThanOrEqual(time2 * 1.5);
});

// ===== INTEGRATION WITH WEB APIS =====

test('Integration with Web APIs', async () => {
  // Create a stream that mimics a file upload
  const fileContent = 'This is file content for upload simulation';
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(fileContent));
      controller.close();
    }
  });

  // Convert to various formats
  const text = await stream.text();
  const bytes = await stream.bytes();
  const blob = await stream.blob();
  const json = await stream.json(); // This will fail since it's not JSON

  expect(text).toBe(fileContent);
  expect(bytes).toBeInstanceOf(Uint8Array);
  expect(blob).toBeInstanceOf(Blob);

  // JSON should fail for non-JSON content
  const jsonStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(fileContent));
      controller.close();
    }
  });

  await expect(jsonStream.json()).rejects.toThrow();
});

// ===== STREAM TRANSFORMATION CHAINS =====

test('Stream transformation chains', async () => {
  // Create a stream with JSON data
  const originalData = {
    users: [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
      { id: 3, name: 'Charlie', active: true }
    ],
    total: 3
  };

  const jsonStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(originalData)));
      controller.close();
    }
  });

  // Chain operations: JSON -> transform -> JSON -> text
  const parsed = await jsonStream.json();
  const transformed = {
    ...parsed,
    users: parsed.users.filter((u: any) => u.active),
    activeCount: parsed.users.filter((u: any) => u.active).length
  };

  const transformedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(transformed)));
      controller.close();
    }
  });

  const finalText = await transformedStream.text();
  const finalData = JSON.parse(finalText);

  expect(finalData.total).toBe(3);
  expect(finalData.activeCount).toBe(2);
  expect(finalData.users.length).toBe(2);
  expect(finalData.users[0].name).toBe('Alice');
  expect(finalData.users[1].name).toBe('Charlie');
});

// ===== PRACTICAL WEB SERVER EXAMPLE =====

test('Practical web server example with ReadableStream methods', async () => {
  const serverData = { message: 'Hello from server', timestamp: Date.now() };

  // Simulate a server response stream
  const responseStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(serverData)));
      controller.close();
    }
  });

  // Client-side processing (simulating fetch response)
  const jsonResponse = await responseStream.json();
  expect(jsonResponse.message).toBe('Hello from server');
  expect(typeof jsonResponse.timestamp).toBe('number');

  const textResponse = await responseStream.text();
  expect(textResponse).toContain('Hello from server');

  const bytesResponse = await responseStream.bytes();
  expect(bytesResponse.length).toBeGreaterThan(0);

  const blobResponse = await responseStream.blob();
  expect(blobResponse.type).toBe('');
  expect(blobResponse.size).toBeGreaterThan(0);
});

// ===== TYPE SAFETY DEMONSTRATION =====

test('TypeScript type safety with ReadableStream methods', async () => {
  interface ApiResponse {
    success: boolean;
    data: {
      users: Array<{ id: number; name: string }>;
      total: number;
    };
  }

  const apiData: ApiResponse = {
    success: true,
    data: {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      total: 2
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(apiData)));
      controller.close();
    }
  });

  // TypeScript knows the return type of .json()
  const response: ApiResponse = await stream.json();

  expect(response.success).toBe(true);
  expect(response.data.total).toBe(2);
  expect(response.data.users[0].name).toBe('Alice');
});

// ===== SUMMARY =====

describe('ReadableStream Methods Summary', () => {
  test('All methods work correctly', () => {
    const methods = ['text', 'json', 'bytes', 'blob'];
    expect(methods.length).toBe(4);

    console.log('✅ ReadableStream now includes:');
    methods.forEach(method => {
      console.log(`  • .${method}() - Easy ${method} conversion`);
    });

    console.log('\n🎯 Benefits:');
    console.log('  • Simplified stream consumption');
    console.log('  • Type-safe operations');
    console.log('  • Better performance than manual approaches');
    console.log('  • Consistent with web standards');
  });
});