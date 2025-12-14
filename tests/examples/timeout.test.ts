// examples/testing/timeout.test.ts - TestTimeoutError Example
// Demonstrates test timeout error with bun test

import { test, expect } from 'bun:test';

test('Infinite loop timeout', async () => {
  // Simulate long-running task
  await new Promise(resolve => setTimeout(resolve, 10000));  // >5s
  expect(1).toBe(1);  // Never reached
});