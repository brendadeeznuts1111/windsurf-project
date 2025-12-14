#!/usr/bin/env bun

/**
 * @example-metadata
 * @category package-management
 * @difficulty intermediate
 * @prerequisites []
 * @related-examples []
 * @guides examples/guides/advanced/bun-package-patching-guide.md
 * @tests examples/package-management/bun-patch-testing.test.ts
 * @benchmarks benchmarks/bun-patch-performance.bench.ts
 * @tags package-management, patching, dependencies, node_modules
 * @description Demonstration of Bun's package patching capabilities
 */

console.log('🔧 Bun Package Patching Demonstration');
console.log('=====================================\n');

console.log('📦 Bun patch allows you to persistently modify packages in node_modules');
console.log('   in a git-friendly way, similar to pnpm patch but integrated with Bun.\n');

console.log('🚀 Basic workflow:');
console.log('   1. bun patch <package>           # Prepare package for patching');
console.log('   2. Edit files in node_modules/<package>/');
console.log('   3. bun patch --commit <package>  # Generate .patch file');
console.log('   4. Commit patches/ and package.json changes\n');

console.log('🛡️  Safety features:');
console.log('   • Creates unlinked copies in node_modules');
console.log('   • Preserves global cache integrity');
console.log('   • Project-scoped modifications');
console.log('   • Git-friendly .patch files\n');

console.log('🎯 Use cases:');
console.log('   • Fix bugs in third-party packages');
console.log('   • Add missing features');
console.log('   • Customize library behavior');
console.log('   • Test upstream contributions\n');

console.log('📁 Generated files:');
console.log('   patches/lodash+4.17.21.patch');
console.log('   package.json (patchedDependencies field)\n');

console.log('🎉 Learn more: https://bun.com/docs/pm/cli/patch');