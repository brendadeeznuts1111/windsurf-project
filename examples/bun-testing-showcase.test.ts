import { describe, test, expect, expectTypeOf, mock } from "bun:test";

// Bun Testing Showcase - Leveraging all the new features
describe.concurrent("Bun Testing Features Showcase", () => {
  // Type testing with expectTypeOf
  test("type assertions work", () => {
    expectTypeOf<string>().toEqualTypeOf<string>();
    expectTypeOf<number>().not.toEqualTypeOf<string>();
    expectTypeOf({ name: "test" }).toHaveProperty("name");
    expectTypeOf<Promise<number>>().resolves.toBeNumber();
    expectTypeOf<string[]>().items.toBeString();
  });

  // Concurrent tests with serial override
  test.serial("serial test in concurrent suite", () => {
    expect(1 + 1).toBe(2);
  });

  // Mock testing with new matchers
  test("mock return value testing", () => {
    const mockFn = mock(() => 42);
    mockFn();
    mockFn();

    expect(mockFn).toHaveReturnedWith(42);
    expect(mockFn).toHaveLastReturnedWith(42);
    expect(mockFn).toHaveNthReturnedWith(1, 42);
  });

  // Expected failures
  test.failing("known bug - division by zero", () => {
    // This test is expected to fail until we implement proper error handling
    expect(() => divide(10, 0)).toThrow();
  });

  // Chained qualifiers
  test.failing.each([1, 2, 3])("failing test for %i", (i) => {
    if (i > 0) {
      throw new Error(`Expected failure for ${i}`);
    }
  });

  // Inline snapshots with indentation
  test("formatted data snapshot", () => {
    const user = { 
      name: "Alice", 
      age: 30, 
      email: "alice@example.com",
      preferences: {
        theme: "dark",
        notifications: true
      }
    };

    expect(user).toMatchInlineSnapshot(`
      {
        "age": 30,
        "email": "alice@example.com",
        "name": "Alice",
        "preferences": {
          "notifications": true,
          "theme": "dark",
        },
      }
    `);
  });

  // Async testing
  test("async operations", async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  // Error testing
  test("error handling", () => {
    expect(() => {
      throw new Error("test error");
    }).toThrow("test error");
  });
});

// Helper function for testing
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}
