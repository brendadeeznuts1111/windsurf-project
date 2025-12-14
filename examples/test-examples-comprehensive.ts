#!/usr/bin/env bun

/**
 * Comprehensive Examples Testing Suite
 * Tests and validates all major Bun examples
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

interface TestResult {
  example: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  output?: string;
  error?: string;
}

class ExamplesTester {
  private results: TestResult[] = [];
  private examplesDir = '.';

  async runAllTests(): Promise<void> {
    console.log('🧪 Comprehensive Examples Testing Suite');
    console.log('=======================================\n');

    const examples = [
      { name: 'enhanced-mime-metrics-demo.ts', type: 'utility', timeout: 10000 },
      { name: 'bun-complete-api-showcase.ts', type: 'server', timeout: 15000 },
      { name: 'bun-uuid-demo.test.ts', type: 'test', timeout: 5000 },
      { name: 'bun-snapshot-testing.test.ts', type: 'test', timeout: 5000 },
      { name: 'bun-file-mime-demo.test.ts', type: 'test', timeout: 5000 },
      { name: 'bun-file-sink-demo.test.ts', type: 'test', timeout: 5000 },
      { name: 'bun-text-file-loader-demo.ts', type: 'utility', timeout: 8000 },
      { name: 'rbac-system-demo.ts', type: 'demo', timeout: 10000 },
    ];

    for (const example of examples) {
      await this.testExample(example);
    }

    this.printSummary();
  }

  private async testExample(example: { name: string; type: string; timeout: number }): Promise<void> {
    const startTime = Date.now();
    const examplePath = `${this.examplesDir}/${example.name}`;

    if (!existsSync(examplePath)) {
      this.results.push({
        example: example.name,
        status: 'SKIP',
        duration: 0,
        error: 'File not found'
      });
      return;
    }

    try {
      const result = await this.runExample(examplePath, example.timeout);
      const duration = Date.now() - startTime;

      this.results.push({
        example: example.name,
        status: result.success ? 'PASS' : 'FAIL',
        duration,
        output: result.output,
        error: result.error
      });

      console.log(`${result.success ? '✅' : '❌'} ${example.name} (${duration}ms)`);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error.slice(0, 100)}...`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        example: example.name,
        status: 'FAIL',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${example.name} (${duration}ms) - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runExample(path: string, timeout: number): Promise<{ success: boolean; output?: string; error?: string }> {
    return new Promise((resolve) => {
      const isTest = path.endsWith('.test.ts');
      const command = process.execPath; // Use the current bun executable
      const args = isTest ? ['test', path] : ['run', path];

      const child = spawn(command, args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({ success: false, error: 'Timeout' });
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        const success = code === 0;
        resolve({
          success,
          output: output.slice(0, 500), // Limit output size
          error: errorOutput || (code !== 0 ? `Exit code: ${code}` : undefined)
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({ success: false, error: error.message });
      });
    });
  }

  private printSummary(): void {
    console.log('\n📊 Test Results Summary');
    console.log('========================');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`Total Examples: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📈 Success Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('❌ Failed Examples:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`   • ${result.example}: ${result.error}`);
      });
    }

    if (skipped > 0) {
      console.log('\n⏭️  Skipped Examples:');
      this.results.filter(r => r.status === 'SKIP').forEach(result => {
        console.log(`   • ${result.example}: ${result.error}`);
      });
    }

    console.log('\n🎯 Recommendations:');
    if (passed / total > 0.8) {
      console.log('   ✅ Excellent! Most examples are working correctly.');
    } else if (passed / total > 0.6) {
      console.log('   ⚠️  Good coverage, but some examples need attention.');
    } else {
      console.log('   ❌ Many examples need fixes or updates.');
    }

    console.log('\n💡 Next Steps:');
    console.log('   • Fix any failing examples');
    console.log('   • Add more comprehensive tests');
    console.log('   • Update documentation');
    console.log('   • Add performance benchmarks');
  }
}

// Run the comprehensive test suite
if (import.meta.main) {
  const tester = new ExamplesTester();
  tester.runAllTests().catch(console.error);
}