/**
 * Concurrent API Testing Suite - Leveraging Bun's New Concurrent Testing Features
 * Demonstrates test.concurrent, describe.concurrent, and performance improvements
 */

import { test, describe, expect } from 'bun:test';

// Mock API endpoints for testing
const API_ENDPOINTS = [
  'https://httpbin.org/get',
  'https://httpbin.org/uuid',
  'https://httpbin.org/json',
  'https://httpbin.org/status/200',
  'https://httpbin.org/delay/1',
] as const;

// ===== CONCURRENT API TESTS =====

describe.concurrent('API Endpoint Testing', () => {
  test.concurrent.each(API_ENDPOINTS.map(url => [url]))('fetches data from %s', async (endpoint: string) => {
    const response = await fetch(endpoint);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
  });

  test.concurrent('handles multiple concurrent requests', async () => {
    const requests = API_ENDPOINTS.map(endpoint =>
      fetch(endpoint).then(res => res.json())
    );

    const results = await Promise.all(requests);
    expect(results).toHaveLength(API_ENDPOINTS.length);

    results.forEach(result => {
      expect(result).toBeDefined();
    });
  });

  test.concurrent.skip('skipped concurrent test', async () => {
    // This test is skipped but demonstrates the syntax
    const response = await fetch(API_ENDPOINTS[0]);
    expect(response.status).toBe(200);
  });
});

// ===== MIXED CONCURRENT AND SERIAL TESTS =====

describe('Mixed Test Execution Modes', () => {
  // Serial test - runs alone
  test.serial('prepares test environment', () => {
    expect(1 + 1).toBe(2);
  });

  // Concurrent tests - run in parallel
  describe.concurrent('Concurrent Operations', () => {
    test.concurrent('operation A', async () => {
      await Bun.sleep(100);
      expect(true).toBe(true);
    });

    test.concurrent('operation B', async () => {
      await Bun.sleep(100);
      expect(true).toBe(true);
    });

    test.concurrent('operation C', async () => {
      await Bun.sleep(100);
      expect(true).toBe(true);
    });
  });

  // Back to serial
  test.serial('cleans up test environment', () => {
    expect(2 + 2).toBe(4);
  });
});

// ===== PERFORMANCE TESTING WITH CONCURRENCY =====

describe.concurrent('Performance Benchmarks', () => {
  test.concurrent('measures fetch performance', async () => {
    const start = performance.now();

    const responses = await Promise.all([
      fetch('https://httpbin.org/get'),
      fetch('https://httpbin.org/get'),
      fetch('https://httpbin.org/get'),
    ]);

    const end = performance.now();
    const duration = end - start;

    responses.forEach(response => {
      expect(response.ok).toBe(true);
    });

    // Concurrent requests should be faster than sequential
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  test.concurrent.each([
    { name: 'small payload', size: 100 },
    { name: 'medium payload', size: 1000 },
    { name: 'large payload', size: 10000 },
  ])('handles $name concurrently', async ({ name, size }) => {
    const data = 'x'.repeat(size);
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: data,
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.data).toBe(data);
  });
});

// ===== ERROR HANDLING IN CONCURRENT TESTS =====

describe.concurrent('Error Handling', () => {
  test.concurrent('handles network errors gracefully', async () => {
    try {
      await fetch('https://nonexistent-domain-that-should-fail.invalid');
      throw new Error('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
    }
  });

  test.concurrent('handles timeout errors', async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100);

    try {
      await fetch('https://httpbin.org/delay/5', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      throw new Error('Should have been aborted');
    } catch (error: any) {
      clearTimeout(timeoutId);
      expect(error.name).toBe('AbortError');
    }
  });
});

// ===== CHAINED QUALIFIERS DEMONSTRATION =====

describe.concurrent('Chained Qualifiers', () => {
  test.concurrent.skip.failing('skipped failing test', () => {
    throw new Error('This test is expected to fail but is skipped');
  });

  test.concurrent.only.each([1, 2, 3])('only runs for value %i', (value) => {
    expect(value).toBeGreaterThan(0);
  });
});

// ===== LOAD TESTING WITH CONCURRENCY =====

describe.concurrent('Load Testing', () => {
  test.concurrent('sustains high concurrent load', async () => {
    const concurrentRequests = 20;
    const requests = Array.from({ length: concurrentRequests }, () =>
      fetch('https://httpbin.org/get').then(res => res.json())
    );

    const start = performance.now();
    const results = await Promise.all(requests);
    const end = performance.now();

    expect(results).toHaveLength(concurrentRequests);
    results.forEach(result => {
      expect(result).toBeDefined();
    });

    const totalDuration = end - start;
    const avgResponseTime = totalDuration / concurrentRequests;

    console.log(`Load test: ${concurrentRequests} requests in ${totalDuration.toFixed(2)}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);

    // Should handle the load reasonably well
    expect(avgResponseTime).toBeLessThan(500);
  });
});