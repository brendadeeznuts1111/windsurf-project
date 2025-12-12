#!/usr/bin/env bun

/**
 * Bun Advanced Testing Features Demonstration
 * Shows how to use randomization, seeding, bailing, and watch mode
 */

import { $ } from "bun";

async function demonstrateAdvancedTesting() {
  console.log("🚀 Bun Advanced Testing Features Demo");
  console.log("=====================================\n");

  // ============================================================================
  // 1. RANDOMIZE TEST EXECUTION
  // ============================================================================

  console.log("1️⃣ Randomize Test Execution");
  console.log("-----------------------------");
  console.log("Command: bun test --randomize examples/bun-advanced-testing.test.ts");
  console.log("Purpose: Detect tests that depend on shared state or execution order\n");

  try {
    console.log("Running randomized tests...");
    const result = await $`bun test --randomize examples/bun-advanced-testing.test.ts`.quiet();
    console.log("✅ Randomized test run completed");
    console.log("Note: Check the output for the --seed value\n");
  } catch (error) {
    console.log("ℹ️  Expected some tests to fail (demonstrating randomization detection)\n");
  }

  // ============================================================================
  // 2. REPRODUCIBLE RANDOMIZATION WITH SEED
  // ============================================================================

  console.log("2️⃣ Reproducible Randomization with Seed");
  console.log("-----------------------------------------");
  console.log("Command: bun test --seed 12345 examples/bun-advanced-testing.test.ts");
  console.log("Purpose: Reproduce the same test order for debugging\n");

  try {
    console.log("Running tests with seed 12345...");
    const result = await $`bun test --seed 12345 examples/bun-advanced-testing.test.ts`.quiet();
    console.log("✅ Seeded test run completed");
    console.log("Note: Same seed always produces same order\n");
  } catch (error) {
    console.log("ℹ️  Expected some tests to fail (demonstrating seed reproducibility)\n");
  }

  // ============================================================================
  // 3. BAIL OUT EARLY
  // ============================================================================

  console.log("3️⃣ Bail Out Early on Failures");
  console.log("-------------------------------");
  console.log("Command: bun test --bail examples/bun-advanced-testing.test.ts");
  console.log("Purpose: Stop testing after first failure (useful for CI)\n");

  try {
    console.log("Running tests with --bail (stops after 1 failure)...");
    const result = await $`bun test --bail examples/bun-advanced-testing.test.ts`.quiet();
    console.log("✅ Bail-out test run completed");
  } catch (error) {
    console.log("ℹ️  Test run stopped early due to failure (expected behavior)\n");
  }

  // ============================================================================
  // 4. BAIL OUT WITH CUSTOM COUNT
  // ============================================================================

  console.log("4️⃣ Bail Out After Multiple Failures");
  console.log("-------------------------------------");
  console.log("Command: bun test --bail=3 examples/bun-advanced-testing.test.ts");
  console.log("Purpose: Stop testing after 3 failures\n");

  try {
    console.log("Running tests with --bail=3 (stops after 3 failures)...");
    const result = await $`bun test --bail=3 examples/bun-advanced-testing.test.ts`.quiet();
    console.log("✅ Custom bail-out test run completed");
  } catch (error) {
    console.log("ℹ️  Test run stopped after 3 failures (expected behavior)\n");
  }

  // ============================================================================
  // 5. WATCH MODE (Non-interactive demo)
  // ============================================================================

  console.log("5️⃣ Watch Mode (Development Workflow)");
  console.log("-------------------------------------");
  console.log("Command: bun test --watch examples/bun-advanced-testing.test.ts");
  console.log("Purpose: Auto-restart tests on file changes during development");
  console.log("Note: Not demonstrated here (requires interactive terminal)");
  console.log("💡 Use --watch during development for TDD workflow\n");

  // ============================================================================
  // 6. COMBINED FEATURES
  // ============================================================================

  console.log("6️⃣ Combined Features Demonstration");
  console.log("-----------------------------------");
  console.log("Command: bun test --randomize --bail=2 --seed 999 examples/bun-advanced-testing.test.ts");
  console.log("Purpose: Combine randomization, bailing, and seeding\n");

  try {
    console.log("Running tests with combined features...");
    const result = await $`bun test --randomize --bail=2 --seed 999 examples/bun-advanced-testing.test.ts`.quiet();
    console.log("✅ Combined features test run completed");
  } catch (error) {
    console.log("ℹ️  Test run stopped due to bail-out (expected behavior)\n");
  }

  // ============================================================================
  // 7. PERFORMANCE COMPARISON
  // ============================================================================

  console.log("7️⃣ Performance Comparison");
  console.log("--------------------------");

  // Normal run
  console.log("Running normal test execution...");
  const normalStart = performance.now();
  try {
    await $`bun test examples/bun-advanced-testing.test.ts --timeout 10000`.quiet();
  } catch {
    // Expected failures
  }
  const normalTime = performance.now() - normalStart;

  // Randomized run
  console.log("Running randomized test execution...");
  const randomStart = performance.now();
  try {
    await $`bun test --randomize examples/bun-advanced-testing.test.ts --timeout 10000`.quiet();
  } catch {
    // Expected failures
  }
  const randomTime = performance.now() - randomStart;

  console.log(`📊 Performance Results:`);
  console.log(`   Normal execution: ${normalTime.toFixed(2)}ms`);
  console.log(`   Randomized execution: ${randomTime.toFixed(2)}ms`);
  console.log(`   Overhead: ${((randomTime - normalTime) / normalTime * 100).toFixed(2)}%\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log("🎯 Bun Advanced Testing Features Summary");
  console.log("=========================================");
  console.log("✅ --randomize: Detect order-dependent tests");
  console.log("✅ --seed: Reproduce exact test execution order");
  console.log("✅ --bail: Stop early on failures (CI optimization)");
  console.log("✅ --watch: Auto-restart on file changes (development)");
  console.log("✅ Combined usage: All features work together");
  console.log("\n🚀 These features help ensure robust, reliable test suites!");
}

// Run the demonstration
demonstrateAdvancedTesting().catch(console.error);