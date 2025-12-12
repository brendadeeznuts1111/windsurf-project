#!/usr/bin/env bun
/**
 * Cross-Reference Demonstrations Index
 * Executable examples showing component integrations
 */

console.log('🔗 Cross-Reference Demonstrations\n');
console.log('Available demonstrations:\n');

const demos = [
  {
    name: 'server-db-analytics-flow',
    description: 'Complete Server → Database → Analytics flow',
    command: 'bun run examples/demonstrate/demonstrate-server-db-analytics-flow.ts'
  },
  {
    name: 'plugin-websocket-security-integration',
    description: 'Plugin → WebSocket → Security integration',
    command: 'bun run examples/demonstrate/demonstrate-plugin-websocket-security-integration.ts'
  },
  {
    name: 'pattern-performance-optimization-cycle',
    description: 'Pattern → Performance → Optimization cycle',
    command: 'bun run examples/demonstrate/demonstrate-pattern-performance-optimization-cycle.ts'
  }
];

demos.forEach((demo, i) => {
  console.log(`${i + 1}. ${demo.name}`);
  console.log(`   ${demo.description}`);
  console.log(`   ${demo.command}\n`);
});

console.log('💡 These demonstrations show how documented components work together.');
console.log('   Run any demonstration to see the integration in action.');

if (import.meta.main) {
  // Allow running specific demo by argument
  const demoName = process.argv[2];
  if (demoName) {
    const demo = demos.find(d => d.name === demoName);
    if (demo) {
      console.log(`\n🚀 Running ${demo.name}...`);
      // In real implementation, would execute the demo
      console.log('Demo execution would go here...');
    } else {
      console.log(`❌ Demo '${demoName}' not found`);
    }
  }
}
