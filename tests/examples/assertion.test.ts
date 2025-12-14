// examples/testing/assertion.test.ts - AssertionError Example
// Demonstrates assertion failure in bun test

import { test, expect } from 'bun:test';

test('Value mismatch', () => {
  expect(42).toBe(99);  // Simple failure
});