#!/usr/bin/env bun
/**
 * Phase 1 Integration Runner
 * Executes all Phase 1 enhancements in sequence
 */

async function runPhase1Integration(): Promise<void> {
  console.log("🚀 Phase 1: Enhanced Cross-Reference Integration\n");

  const steps = [
    { name: "Enhance cross-references with performance data", cmd: "bun run tools/cross-reference-enhancer.ts" },
    { name: "Create executable demonstration examples", cmd: "bun run tools/create-executable-examples.ts" },
    { name: "Validate cross-reference accuracy", cmd: "bun run tools/cross-reference-validator.ts" },
    { name: "Run integration tests", cmd: "bun test examples/tests/quality-validation.test.ts" }
  ];

  for (const [index, step] of steps.entries()) {
    console.log(`📋 Step ${index + 1}: ${step.name}`);

    try {
      const { $ } = await import("bun");
      const result = await $`${step.cmd.split(' ')}`;

      if (result.exitCode === 0) {
        console.log(`✅ ${step.name} completed\n`);
      } else {
        console.log(`❌ ${step.name} failed\n`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`❌ ${step.name} failed: ${error}\n`);
      process.exit(1);
    }
  }

  console.log("🎉 Phase 1 integration completed successfully!");
  console.log("\n📊 Phase 1 Results:");
  console.log("• ✅ Cross-references enhanced with performance metadata");
  console.log("• ✅ Executable examples created for key relationships");
  console.log("• ✅ Validation system ensures documentation accuracy");
  console.log("• ✅ Integration tests verify system integrity");
  console.log("• ✅ Performance data integrated into documentation");

  console.log("\n🚀 Ready for Phase 2: Advanced Automation");
}

// Run Phase 1 Integration
if (import.meta.main) {
  await runPhase1Integration();
}