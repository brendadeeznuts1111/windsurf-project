// Advanced Testing Features: test.serial, chaining qualifiers, and randomization
// Demonstrates sequential tests within concurrent groups and qualifier chaining

import { test, expect, describe, beforeAll, afterAll } from "bun:test";

describe.concurrent("Mixed Concurrent and Sequential Tests", () => {

    let sharedResource: { value: number; operations: string[] };

    beforeAll(() => {
        // Initialize shared resource for concurrent tests
        sharedResource = {
            value: 0,
            operations: []
        };
        console.log("🔧 Shared resource initialized");
    });

    // These tests will run concurrently
    test.concurrent("concurrent operation #1", async () => {
        await new Promise(resolve => setTimeout(resolve, 50));

        // Each concurrent test gets its own view of the resource
        const localValue = sharedResource.value + 1;
        sharedResource.operations.push(`concurrent-1-${Date.now()}`);

        expect(localValue).toBeGreaterThan(0);
        expect(sharedResource.operations.length).toBeGreaterThan(0);
    });

    test.concurrent("concurrent operation #2", async () => {
        await new Promise(resolve => setTimeout(resolve, 60));

        const localValue = sharedResource.value + 2;
        sharedResource.operations.push(`concurrent-2-${Date.now()}`);

        expect(localValue).toBeGreaterThan(1);
        expect(sharedResource.operations.length).toBeGreaterThan(0);
    });

    // This test will run sequentially, AFTER all concurrent tests complete
    test.serial("sequential cleanup and validation", () => {
        console.log("📋 Running sequential test after concurrent tests...");

        // Validate that concurrent tests completed
        expect(sharedResource.operations.length).toBeGreaterThan(0);

        // Perform sequential cleanup
        sharedResource.value = 0;
        sharedResource.operations = [];

        expect(sharedResource.value).toBe(0);
        expect(sharedResource.operations).toHaveLength(0);

        console.log("✅ Sequential cleanup completed");
    });

    // More concurrent tests after the serial one
    test.concurrent("concurrent operation #3", async () => {
        await new Promise(resolve => setTimeout(resolve, 40));

        sharedResource.value = 100;
        sharedResource.operations.push(`concurrent-3-${Date.now()}`);

        expect(sharedResource.value).toBe(100);
        expect(sharedResource.operations.length).toBe(1);
    });

    test.serial("final sequential validation", () => {
        console.log("📋 Final sequential validation...");

        // This runs after all concurrent tests
        expect(sharedResource.value).toBe(100);
        expect(sharedResource.operations).toHaveLength(1);

        console.log("✅ All tests completed successfully");
    });

    afterAll(() => {
        console.log("🧹 Cleaning up test suite...");
        sharedResource = { value: 0, operations: [] };
    });
});

// Demonstrate chaining qualifiers
describe("Chained Qualifiers Examples", () => {

    // Test that is expected to fail and runs for each item
    test.failing.each([
        { input: 1, expected: "should fail" },
        { input: 2, expected: "should fail" },
        { input: 3, expected: "should fail" }
    ])("demonstrates failing.each with %o", ({ input, expected }) => {
        // This test is expected to fail - demonstrating the chaining feature
        if (input > 0) {
            throw new Error(`Test ${input} failed as expected: ${expected}`);
        }
        expect(input).toBe(0); // This will never pass
    });

    // Test that is skipped and runs for each item
    test.skip.each([
        "feature-1",
        "feature-2",
        "feature-3"
    ])("skipped feature test for %s", (feature) => {
        // This test will be skipped
        expect(feature).toBeDefined();
    });

    // Test that only runs for each item (useful for debugging)
    test.only.each([
        { type: "api", status: 200 },
        { type: "database", status: 201 },
        { type: "cache", status: 200 }
    ])("focused test for %s service", ({ type, status }) => {
        expect(status).toBeGreaterThanOrEqual(200);
        expect(type).toBeDefined();
    });
});

// Demonstrate concurrent test limitations and workarounds
describe.concurrent("Concurrent Test Limitations and Solutions", () => {

    // Note: expect.assertions() is not supported in concurrent tests
    test.concurrent("demonstrates assertion counting workaround", async () => {
        let assertionCount = 0;

        // Manual assertion counting as workaround
        expect(true).toBe(true);
        assertionCount++;

        expect(1 + 1).toBe(2);
        assertionCount++;

        expect("test").toBe("test");
        assertionCount++;

        // Manual verification instead of expect.assertions()
        expect(assertionCount).toBe(3);
    });

    // Note: toMatchInlineSnapshot() works, but snapshot() doesn't
    test.concurrent("inline snapshot works in concurrent tests", async () => {
        const result = {
            id: Math.random().toString(36),
            timestamp: Date.now(),
            data: { value: 42 }
        };

        // This works in concurrent tests
        expect(result).toMatchInlineSnapshot(`
          Object {
            "data": Object {
              "value": 42,
            },
            "id": StringMatching /^[a-z0-9]+$/,
            "timestamp": Number,
          }
        `);
    });

    // beforeAll and afterAll are not executed concurrently
    let setupOrder: number[] = [];

    beforeAll(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        setupOrder.push(1);
        console.log("🔧 beforeAll executed (not concurrent)");
    });

    test.concurrent("concurrent test #1", async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        expect(setupOrder).toContain(1);
    });

    test.concurrent("concurrent test #2", async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
        expect(setupOrder).toContain(1);
    });

    afterAll(() => {
        setupOrder.push(2);
        console.log("🧹 afterAll executed (not concurrent)");
        expect(setupOrder).toEqual([1, 2]);
    });
});

// Randomization demonstration
describe("Randomization-Ready Tests", () => {

    let executionOrder: string[] = [];

    test("test A", () => {
        executionOrder.push("A");
        expect(executionOrder.length).toBeGreaterThan(0);
    });

    test("test B", () => {
        executionOrder.push("B");
        expect(executionOrder.length).toBeGreaterThan(0);
    });

    test("test C", () => {
        executionOrder.push("C");
        expect(executionOrder.length).toBeGreaterThan(0);
    });

    test("test D", () => {
        executionOrder.push("D");
        expect(executionOrder.length).toBeGreaterThan(0);
    });

    // This test will always run last to verify order
    test.serial("verify execution order", () => {
        console.log("📊 Execution order:", executionOrder.join(" -> "));
        expect(executionOrder).toHaveLength(4);
        expect(executionOrder).toContain("A");
        expect(executionOrder).toContain("B");
        expect(executionOrder).toContain("C");
        expect(executionOrder).toContain("D");

        // Reset for next run
        executionOrder = [];
    });
});
