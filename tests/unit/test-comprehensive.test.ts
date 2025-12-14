import { describe, test, expect, expectTypeOf } from "bun:test";

// Example of comprehensive Bun testing without external dependencies
describe("Bun Native Testing Examples", () => {
  test("basic assertions", () => {
    expect(1 + 1).toBe(2);
    expect("hello").toContain("ell");
    expect([1, 2, 3]).toHaveLength(3);
  });

  test("async operations", async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  test("type checking", () => {
    // Type assertions using Bun's expectTypeOf
    expectTypeOf<string>().toEqualTypeOf<string>();
    expectTypeOf<number>().not.toEqualTypeOf<string>();
    
    // Object property checking
    expectTypeOf({ name: "test" }).toHaveProperty("name");
    
    // Promise type checking
    expectTypeOf<Promise<string>>().resolves.toBeString();
    
    // Array type checking
    expectTypeOf<string[]>().items.toBeString();
  });

  test("error handling", () => {
    expect(() => {
      throw new Error("test error");
    }).toThrow("test error");
  });

  test("function testing", () => {
    const testFn = () => "test result";
    expect(testFn()).toBe("test result");
    // Bun supports mocking through spy/mock functions
  });
});
