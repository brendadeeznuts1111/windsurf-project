#!/usr/bin/env bun
/**
 * Create Executable Examples for Cross-References
 * Generates demonstration scripts for documented relationships
 */

import { writeFile, mkdir } from "fs/promises";

interface CrossReferenceDemo {
  name: string;
  description: string;
  components: string[];
  demonstration: string;
  expectedOutput: string;
}

class ExecutableExamplesCreator {
  private demos: CrossReferenceDemo[] = [
    {
      name: 'server-db-analytics-flow',
      description: 'Demonstrates the complete flow: Server → Database → Analytics',
      components: ['self-optimizing-server', 'database-ecosystem', 'analytics-system'],
      demonstration: `
import { ConsciousMetaOptimizer } from '../src/self-optimizing-server';
import { BunDatabaseManager } from '../src/database/bun-database';
import { AnalyticsSystem } from '../src/analytics';

console.log('🚀 Demonstrating Server → Database → Analytics Flow\\n');

// 1. Start self-optimizing server
const optimizer = new ConsciousMetaOptimizer();
const server = await optimizer.createServer({ consciousness: true });

// 2. Initialize database connection
const db = new BunDatabaseManager();
await db.connect();

// 3. Set up analytics tracking
const analytics = new AnalyticsSystem();
analytics.trackServerMetrics(server);

// 4. Demonstrate data flow
const testData = { request: 'demo', timestamp: Date.now() };
await db.store(testData);
const retrieved = await db.query('SELECT * FROM requests ORDER BY timestamp DESC LIMIT 1');
await analytics.analyzeRequestFlow(retrieved);

console.log('✅ Complete ecosystem flow demonstrated');
console.log('📊 Analytics:', await analytics.getSummary());
      `,
      expectedOutput: 'Complete ecosystem integration with metrics display'
    },
    {
      name: 'plugin-websocket-security-integration',
      description: 'Shows Plugin → WebSocket → Security integration',
      components: ['plugin-system-architecture', 'websocket-system', 'security-framework'],
      demonstration: `
import { PluginManager } from '../src/plugin-system';
import { BunWebSocketServer } from '../packages/odds-websocket';
import { SecurityFramework } from '../src/security';

console.log('🔌 Demonstrating Plugin → WebSocket → Security Integration\\n');

// 1. Load security plugin
const pluginManager = new PluginManager();
await pluginManager.loadPlugin('security-hardening');

// 2. Create WebSocket server with security
const wsServer = new BunWebSocketServer({
  port: 8080,
  security: pluginManager.getSecurityConfig()
});

// 3. Initialize security framework
const security = new SecurityFramework();
security.integrateWithWebSocket(wsServer);

// 4. Demonstrate secure WebSocket connection
const client = new WebSocket('ws://localhost:8080');
client.onopen = () => {
  console.log('🔒 Secure WebSocket connection established');
  client.send('Hello with security validation');
};

client.onmessage = (event) => {
  console.log('📨 Secure message received:', event.data);
  client.close();
};

console.log('✅ Plugin-WebSocket-Security integration complete');
      `,
      expectedOutput: 'Secure WebSocket server with plugin enhancements'
    },
    {
      name: 'pattern-performance-optimization-cycle',
      description: 'Demonstrates Pattern → Performance → Optimization cycle',
      components: ['pattern-documentation-engine', 'performance-pattern-integration', 'self-optimizing-server'],
      demonstration: `
import { PatternEngine } from '../src/pattern-documentation';
import { PerformanceIntegrator } from '../src/performance-pattern-integration';
import { ConsciousMetaOptimizer } from '../src/self-optimizing-server';

console.log('🎨 Demonstrating Pattern → Performance → Optimization Cycle\\n');

// 1. Load performance patterns
const patterns = new PatternEngine();
await patterns.loadPatterns();

// 2. Integrate with performance data
const integrator = new PerformanceIntegrator();
const performancePatterns = await integrator.weavePerformanceData(patterns);

// 3. Apply to self-optimizing server
const optimizer = new ConsciousMetaOptimizer();
const server = await optimizer.createServer({
  patterns: performancePatterns,
  optimization: true
});

// 4. Demonstrate optimization cycle
console.log('🔄 Optimization Cycle:');
console.log('Pattern:', await patterns.getActivePattern());
console.log('Performance:', await integrator.getPerformanceMetrics());
console.log('Optimization:', await optimizer.getOptimizationStatus());

console.log('✅ Pattern-Performance-Optimization cycle complete');
      `,
      expectedOutput: 'Conscious optimization with pattern-based performance enhancement'
    }
  ];

  async createExecutableExamples(): Promise<void> {
    console.log("🔧 Creating executable cross-reference demonstrations...\n");

    // Create examples/demonstrate directory
    await mkdir('examples/demonstrate', { recursive: true });

    for (const demo of this.demos) {
      await this.createDemoFile(demo);
    }

    // Create index file
    await this.createDemoIndex();

    console.log("✅ Created executable cross-reference demonstrations");
  }

  private async createDemoFile(demo: CrossReferenceDemo): Promise<void> {
    const fileName = `examples/demonstrate/demonstrate-${demo.name}.ts`;

    const content = `#!/usr/bin/env bun
/**
 * ${demo.name.replace(/-/g, ' ').toUpperCase()}
 * ${demo.description}
 *
 * Components: ${demo.components.join(', ')}
 *
 * Run with: bun run examples/demonstrate/demonstrate-${demo.name}.ts
 */

${demo.demonstration.trim()}

// Expected output: ${demo.expectedOutput}
if (import.meta.main) {
  console.log('🎯 Running ${demo.name} demonstration...\\n');

  try {
    // Note: This is a demonstration - actual implementation would
    // require the full component imports and setup
    console.log('📋 This demonstration shows the integration pattern for:');
    console.log('   ${demo.components.join(' → ')}');
    console.log('\\n💡 Expected result: ${demo.expectedOutput}');
    console.log('\\n🔧 To run the actual implementation, ensure all components are available.');
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  }
}
`;

    await writeFile(fileName, content);
    console.log(`  ✓ Created ${fileName}`);
  }

  private async createDemoIndex(): Promise<void> {
    const indexContent = `#!/usr/bin/env bun
/**
 * Cross-Reference Demonstrations Index
 * Executable examples showing component integrations
 */

console.log('🔗 Cross-Reference Demonstrations\\n');
console.log('Available demonstrations:\\n');

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
  console.log(\`\${i + 1}. \${demo.name}\`);
  console.log(\`   \${demo.description}\`);
  console.log(\`   \${demo.command}\\n\`);
});

console.log('💡 These demonstrations show how documented components work together.');
console.log('   Run any demonstration to see the integration in action.');

if (import.meta.main) {
  // Allow running specific demo by argument
  const demoName = process.argv[2];
  if (demoName) {
    const demo = demos.find(d => d.name === demoName);
    if (demo) {
      console.log(\`\\n🚀 Running \${demo.name}...\`);
      // In real implementation, would execute the demo
      console.log('Demo execution would go here...');
    } else {
      console.log(\`❌ Demo '\${demoName}' not found\`);
    }
  }
}
`;

    await writeFile('examples/demonstrate/index.ts', indexContent);
    console.log("  ✓ Created examples/demonstrate/index.ts");
  }
}

// CLI
if (import.meta.main) {
  const creator = new ExecutableExamplesCreator();
  await creator.createExecutableExamples();
}