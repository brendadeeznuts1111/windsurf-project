/// <reference lib="dom" />

// apps/dashboard/src/components/__tests__/simple.test.tsx
import { describe, test, expect } from 'bun:test';
import { SIZE_CONSTANTS } from '../../constants';

describe('Simple Test Suite', () => {
  test('basic arithmetic works', () => {
    expect(2 + 2).toBe(4);
  });

  test('string operations work', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });

  test('array operations work', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6]);
  });

  // Conditional tests using test.if()
  const macOS = process.platform === "darwin";
  test.if(macOS)("runs on macOS", () => {
    expect(process.platform).toBe("darwin");
  });

  test.if(!macOS)("runs on non-macOS platforms", () => {
    expect(process.platform).not.toBe("darwin");
  });

  // Random conditional test (runs ~50% of the time)
  test.if(Math.random() > 0.5)("runs half the time (random)", () => {
    expect(Math.random()).toBeGreaterThanOrEqual(0);
    expect(Math.random()).toBeLessThanOrEqual(1);
  });

  // Environment-based conditional test
  const isCI = process.env.CI === "true";
  test.if(isCI)("runs in CI environment", () => {
    expect(process.env.CI).toBe("true");
  });

  test.if(!isCI)("runs in local environment", () => {
    expect(process.env.CI).not.toBe("true");
  });
});