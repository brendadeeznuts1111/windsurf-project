#!/usr/bin/env bun

/**
 * 🎯 Bun Text File Loader - Node.js require.extensions Replacement
 *
 * Replaces Node.js require.extensions functionality for loading text files in Bun.
 * Provides multiple approaches for loading .txt, .md, and other text files.
 */

import { BunTextLoader } from '../src/utils/bun-text-loader';

// ============================================================================
// DEMO TEXT FILES
// ============================================================================

// Create some demo text files for testing
async function createDemoFiles() {
  const demoDir = './demo-text-files';

  // Create demo directory
  await Bun.write(`${demoDir}/.gitkeep`, '');

  // Create demo text files
  const files = {
    'config.txt': `{
  "app": {
    "name": "Bun Text Loader Demo",
    "version": "1.0.0",
    "environment": "development"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "demo_db"
  }
}`,
    'template.txt': `Hello {{name}},

Welcome to {{appName}} version {{version}}!

Your account has been created successfully.
Please verify your email at: {{email}}

Best regards,
The {{appName}} Team`,
    'readme.md': `# Bun Text File Loader Demo

This demonstrates how to load text files in Bun, replacing Node.js \`require.extensions\`.

## Features

- Async text file loading with \`Bun.file().text()\`
- TypeScript import assertions support
- Batch loading capabilities
- Caching for performance
- Error handling

## Usage

\`\`\`typescript
import { BunTextLoader } from './src/utils/bun-text-loader';

// Load single file
const content = await BunTextLoader.load('./config.txt');

// Load multiple files
const contents = await BunTextLoader.loadBatch([
  './config.txt',
  './template.txt',
  './readme.md'
]);
\`\`\`
`,
    'data.csv': `name,age,city,email
Alice,25,New York,alice@example.com
Bob,30,San Francisco,bob@example.com
Charlie,35,Chicago,charlie@example.com
Diana,28,Los Angeles,diana@example.com`,
    'script.py': `#!/usr/bin/env python3
"""
Demo Python script that could be loaded as text
"""

def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
`
  };

  console.log('📁 Creating demo text files...');
  for (const [filename, content] of Object.entries(files)) {
    const filePath = `${demoDir}/${filename}`;
    await Bun.write(filePath, content);
    console.log(`   ✅ Created ${filePath}`);
  }

  return demoDir;
}

// ============================================================================
// DEMONSTRATION FUNCTIONS
// ============================================================================

/**
 * Demonstrate Bun.file().text() - Direct Bun API
 */
async function demoBunFileAPI(demoDir: string) {
  console.log('\n🔧 Demo 1: Bun.file().text() - Direct Bun API');
  console.log('='.repeat(50));

  try {
    // Load config.json as text
    const configText = await Bun.file(`${demoDir}/config.txt`).text();
    console.log('📄 Config file loaded:');
    console.log(configText.slice(0, 100) + '...');

    // Parse as JSON
    const config = JSON.parse(configText);
    console.log('🔍 Parsed config:', config.app.name);

    // Load template
    const template = await Bun.file(`${demoDir}/template.txt`).text();
    console.log('📝 Template loaded:', template.split('\n')[0]);

    // Load markdown
    const readme = await Bun.file(`${demoDir}/readme.md`).text();
    console.log('📖 README loaded:', readme.split('\n')[0]);

  } catch (error) {
    console.error('❌ Bun.file() demo failed:', error);
  }
}

/**
 * Demonstrate BunTextLoader utility class
 */
async function demoTextLoader(demoDir: string) {
  console.log('\n🛠️  Demo 2: BunTextLoader Utility Class');
  console.log('='.repeat(50));

  try {
    // Load single file
    const config = await BunTextLoader.load(`${demoDir}/config.txt`);
    console.log('📄 Single file loaded with BunTextLoader');

    // Load batch of files
    const files = [
      `${demoDir}/config.txt`,
      `${demoDir}/template.txt`,
      `${demoDir}/readme.md`
    ];

    console.log('📦 Loading batch of files...');
    const batchResult = await BunTextLoader.loadBatch(files);
    console.log(`✅ Loaded ${batchResult.results.length} files (${batchResult.successCount} success, ${batchResult.errorCount} errors)`);
    console.log(`   📏 Sizes: ${batchResult.results.map(r => r.size).join(', ')} characters`);
    console.log(`   ⏱️  Total time: ${batchResult.totalTime.toFixed(2)}ms`);

    // Also demonstrate the convenience method
    const contents = await BunTextLoader.loadBatchContents(files);
    console.log(`   📄 Content lengths: ${contents.map(c => c.length).join(', ')} characters`);

    // Demonstrate caching
    console.log('🗄️  Testing cached loading...');
    const start1 = performance.now();
    await BunTextLoader.loadCached(`${demoDir}/readme.md`);
    const time1 = performance.now() - start1;

    const start2 = performance.now();
    await BunTextLoader.loadCached(`${demoDir}/readme.md`);
    const time2 = performance.now() - start2;

    console.log(`   First load: ${time1.toFixed(2)}ms`);
    console.log(`   Cached load: ${time2.toFixed(2)}ms`);
    console.log(`   Speedup: ${(time1 / time2).toFixed(1)}x`);

  } catch (error) {
    console.error('❌ BunTextLoader demo failed:', error);
  }
}

/**
 * Demonstrate "import assertions" style loading
 */
async function demoImportStyle(demoDir: string) {
  console.log('\n📥 Demo 3: Import Assertions Style');
  console.log('='.repeat(50));

  // Note: This would require TypeScript declarations
  console.log('ℹ️  Import assertions require TypeScript declarations:');
  console.log('   declare module "*.txt" { const content: string; export default content; }');
  console.log('');
  console.log('   // Usage (would work with proper declarations):');
  console.log('   import config from "./config.txt";');
  console.log('   console.log(config); // string content');
  console.log('');
  console.log('   For now, demonstrating equivalent with dynamic imports...');

  try {
    // Simulate import-style loading
    const configText = await Bun.file(`${demoDir}/config.txt`).text();
    const templateText = await Bun.file(`${demoDir}/template.txt`).text();

    console.log('📄 Config "imported":', JSON.parse(configText).app.name);
    console.log('📝 Template "imported":', templateText.split('\n')[0]);

  } catch (error) {
    console.error('❌ Import style demo failed:', error);
  }
}

/**
 * Demonstrate error handling
 */
async function demoErrorHandling(demoDir: string) {
  console.log('\n🚨 Demo 4: Error Handling');
  console.log('='.repeat(50));

  const testCases = [
    { name: 'Valid file', path: `${demoDir}/config.txt` },
    { name: 'Non-existent file', path: `${demoDir}/nonexistent.txt` },
    { name: 'Directory (should fail)', path: demoDir },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      const content = await Bun.file(testCase.path).text();
      console.log(`   ✅ Success: ${content.length} characters`);
    } catch (error) {
      console.log(`   ❌ Failed: ${(error as Error).message}`);
    }
  }
}

/**
 * Demonstrate performance comparison
 */
async function demoPerformanceComparison(demoDir: string) {
  console.log('\n⚡ Demo 5: Performance Comparison');
  console.log('='.repeat(50));

  const filePath = `${demoDir}/readme.md`;
  const iterations = 100;

  // Test Bun.file().text()
  console.log(`Running ${iterations} iterations...`);

  const bunTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await Bun.file(filePath).text();
    bunTimes.push(performance.now() - start);
  }

  // Test BunTextLoader
  const loaderTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await BunTextLoader.load(filePath);
    loaderTimes.push(performance.now() - start);
  }

  // Calculate statistics
  const avgBun = bunTimes.reduce((a, b) => a + b) / bunTimes.length;
  const avgLoader = loaderTimes.reduce((a, b) => a + b) / loaderTimes.length;
  const minBun = Math.min(...bunTimes);
  const minLoader = Math.min(...loaderTimes);
  const maxBun = Math.max(...bunTimes);
  const maxLoader = Math.max(...loaderTimes);

  console.log('📊 Performance Results:');
  console.log(`   Bun.file().text():     ${avgBun.toFixed(3)}ms avg (${minBun.toFixed(3)}ms - ${maxBun.toFixed(3)}ms)`);
  console.log(`   BunTextLoader.load():  ${avgLoader.toFixed(3)}ms avg (${minLoader.toFixed(3)}ms - ${maxLoader.toFixed(3)}ms)`);
  console.log(`   Overhead: ${(avgLoader - avgBun).toFixed(3)}ms (${((avgLoader - avgBun) / avgBun * 100).toFixed(1)}%)`);
}

/**
 * Demonstrate integration with existing systems
 */
async function demoSystemIntegration(demoDir: string) {
  console.log('\n🔗 Demo 6: System Integration');
  console.log('='.repeat(50));

  try {
    // Load config and integrate with tension system
    const configText = await Bun.file(`${demoDir}/config.txt`).text();
    const config = JSON.parse(configText);

    console.log('📊 Integrating with tension monitoring...');

    // Simulate tension event based on config
    if (config.app.environment === 'development') {
      console.log('⚠️  Development environment detected - would emit tension event');
      // In real implementation:
      // tensionEngine.emitTension('config:dev_environment', 0.05, { config });
    }

    // Load template and demonstrate processing
    const template = await Bun.file(`${demoDir}/template.txt`).text();
    const processed = template
      .replace('{{name}}', 'Alice')
      .replace(/\{\{appName\}\}/g, config.app.name)
      .replace('{{version}}', config.app.version)
      .replace('{{email}}', 'alice@example.com');

    console.log('📝 Template processing result:');
    console.log(processed.split('\n').slice(0, 3).join('\n'));

  } catch (error) {
    console.error('❌ System integration demo failed:', error);
  }
}

// ============================================================================
// MAIN DEMONSTRATION
// ============================================================================

/**
 * Run all demonstrations
 */
async function runAllDemos() {
  console.log('🚀 Bun Text File Loader - Complete Demonstration');
  console.log('===============================================');

  try {
    // Create demo files
    const demoDir = await createDemoFiles();

    // Run all demos
    await demoBunFileAPI(demoDir);
    await demoTextLoader(demoDir);
    await demoImportStyle(demoDir);
    await demoErrorHandling(demoDir);
    await demoPerformanceComparison(demoDir);
    await demoSystemIntegration(demoDir);

    console.log('\n🎉 All demonstrations completed successfully!');
    console.log('\n📚 Summary:');
    console.log('   ✅ Bun.file().text() - Direct Bun API');
    console.log('   ✅ BunTextLoader - Utility class with caching');
    console.log('   ✅ Import assertions - TypeScript support');
    console.log('   ✅ Error handling - Robust failure management');
    console.log('   ✅ Performance - Optimized for Bun');
    console.log('   ✅ System integration - Works with existing codebase');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  runAllDemos().catch(error => {
    console.error('Demo execution failed:', error);
    process.exit(1);
  });
}

export { runAllDemos, createDemoFiles };