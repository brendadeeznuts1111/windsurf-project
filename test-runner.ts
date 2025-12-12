#!/usr/bin/env bun

/**
 * 🧪 Bun Test Runner - Following Official Guidelines
 *
 * Runs tests using proper Bun testing patterns and harness utilities.
 * Demonstrates best practices for Bun test development.
 */

import { spawnBunProcess, tempDir, createMockServer, waitFor } from './harness';

// ============================================================================
// TEST RUNNER UTILITIES
// ============================================================================

/**
 * Run a specific test file
 */
async function runTestFile(testFile: string): Promise<{
  success: boolean;
  output: string;
  duration: number;
}> {
  console.log(`🧪 Running ${testFile}...`);

  const start = performance.now();

  try {
    const result = await spawnBunProcess(['test', testFile], {
      timeout: 30000, // 30 second timeout (Bun guideline)
    });

    const duration = performance.now() - start;

    if (result.success) {
      console.log(`✅ ${testFile} passed (${duration.toFixed(1)}ms)`);
      return { success: true, output: result.stdout, duration };
    } else {
      console.log(`❌ ${testFile} failed (${duration.toFixed(1)}ms)`);
      console.log('Error output:', result.stderr);
      return { success: false, output: result.stderr, duration };
    }
  } catch (error) {
    const duration = performance.now() - start;
    console.log(`💥 ${testFile} crashed (${duration.toFixed(1)}ms)`);
    console.log('Crash:', error);
    return { success: false, output: String(error), duration };
  }
}

/**
 * Run all test files in a directory
 */
async function runTestDirectory(dir: string): Promise<{
  total: number;
  passed: number;
  failed: number;
  duration: number;
}> {
  const testFiles = [
    'text-file-test.test.ts',
    'src/utils/bun-env-synchronizer.test.ts',
    'src/utils/bun-text-loader.test.ts',
    'src/utils/bun-unix-socket-proxy.test.ts',
  ];

  console.log(`🏃 Running ${testFiles.length} test files from ${dir}\n`);

  let passed = 0;
  let failed = 0;
  const start = performance.now();

  for (const testFile of testFiles) {
    try {
      const result = await runTestFile(testFile);
      if (result.success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`💥 Failed to run ${testFile}:`, error);
      failed++;
    }
  }

  const duration = performance.now() - start;

  console.log(`\n📊 Test Results:`);
  console.log(`   Total: ${testFiles.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Duration: ${duration.toFixed(1)}ms`);
  console.log(`   Success Rate: ${((passed / testFiles.length) * 100).toFixed(1)}%`);

  return {
    total: testFiles.length,
    passed,
    failed,
    duration,
  };
}

/**
 * Demonstrate proper test patterns
 */
async function demonstrateTestPatterns(): Promise<void> {
  console.log('\n🎯 Demonstrating Bun Test Patterns\n');

  // Pattern 1: Using tempDir for test files
  console.log('📁 Pattern 1: Temporary directories');
  using testDir = tempDir('demo', {
    'config.json': '{"test": true}',
    'data.txt': 'Hello, test data!',
  });

  const configContent = await Bun.file(`${testDir}/config.json`).text();
  const dataContent = await Bun.file(`${testDir}/data.txt`).text();

  console.log(`   Config: ${configContent}`);
  console.log(`   Data: ${dataContent}`);
  console.log('   ✅ Files cleaned up automatically\n');

  // Pattern 2: Using waitFor instead of setTimeout
  console.log('⏳ Pattern 2: waitFor instead of timeouts');
  let counter = 0;

  // Start async operation
  setTimeout(() => counter = 42, 100);

  // Wait for condition (Bun guideline)
  await waitFor(() => counter === 42, {
    timeout: 1000,
    message: 'Counter should reach 42'
  });

  console.log(`   Counter reached: ${counter}`);
  console.log('   ✅ No arbitrary timeouts used\n');

  // Pattern 3: Mock servers with random ports
  console.log('🌐 Pattern 3: Mock servers with random ports');
  const mockServer = createMockServer((req) => {
    if (req.url.endsWith('/health')) {
      return new Response('OK', { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  });

  console.log(`   Server running on: ${mockServer.url}`);

  // Test the server
  const healthResponse = await fetch(`${mockServer.url}/health`);
  console.log(`   Health check: ${healthResponse.status} ${await healthResponse.text()}`);

  mockServer.close();
  console.log('   ✅ Server cleaned up automatically\n');

  // Pattern 4: Proper error testing
  console.log('🚨 Pattern 4: Proper error testing');
  try {
    await Bun.file('/nonexistent/file.txt').text();
    console.log('   ❌ Should have thrown');
  } catch (error) {
    console.log(`   ✅ Correctly threw: ${error.message}`);
  }
  console.log('');
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    run: args.includes('--run') || args.includes('run'),
    demo: args.includes('--demo'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Show usage information
 */
function showUsage() {
  console.log('🧪 Bun Test Runner - Following Official Guidelines');
  console.log('');
  console.log('Usage:');
  console.log('  bun run test-runner.ts --run     Run all tests');
  console.log('  bun run test-runner.ts --demo    Show test patterns');
  console.log('  bun run test-runner.ts --help    Show this help');
  console.log('');
  console.log('Guidelines followed:');
  console.log('  ✅ No timeouts - use waitFor for conditions');
  console.log('  ✅ No hardcoded ports - use port: 0');
  console.log('  ✅ Proper resource cleanup - use using/disposables');
  console.log('  ✅ Use bunExe() and bunEnv() for spawning');
  console.log('  ✅ Test fixtures end with -fixture.ts');
  console.log('');
  console.log('Note: Use `bun bd test` for testing your changes, not `bun test`');
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();

  if (args.help) {
    showUsage();
    return;
  }

  if (args.demo) {
    await demonstrateTestPatterns();
    return;
  }

  if (args.run) {
    const results = await runTestDirectory('./');
    process.exit(results.failed > 0 ? 1 : 0);
  }

  // Default: show usage
  showUsage();
}

// Run if called directly
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runTestFile, runTestDirectory, demonstrateTestPatterns };