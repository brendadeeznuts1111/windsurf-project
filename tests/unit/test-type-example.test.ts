import { expectTypeOf, test } from "bun:test";

test("types are correct", () => {
  expectTypeOf<string>().toEqualTypeOf<string>();
  expectTypeOf({ foo: 1 }).toHaveProperty("foo");
  expectTypeOf<Promise<number>>().resolves.toBeNumber();
});
