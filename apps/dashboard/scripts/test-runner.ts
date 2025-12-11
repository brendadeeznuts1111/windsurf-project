#!/usr/bin/env bun
// apps/dashboard/scripts/test-runner.ts
import { spawn } from 'bun';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

interface TestResult {
  suite: string;
  test: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  pattern: string;
  description: string;
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  private testSuites: TestSuite[] = [
    {
      name: 'unit',
      pattern: 'src/components/__tests__/*.test.tsx',
      description: 'Unit tests for React components'
    },
    {
      name: 'integration',
      pattern: 'src/components/__tests__/integration.test.tsx',
      description: 'Integration tests for component interactions'
    },
    {
      name: 'performance',
      pattern: 'src/components/__tests__/performance-benchmarks.test.ts',
      description: 'Performance benchmarks and regression tests'
    },
    {
      name: 'visual',
      pattern: 'src/components/__tests__/visual-regression.test.tsx',
      description: 'Visual regression and accessibility tests'
    },
    {
      name: 'e2e',
      pattern: 'src/**/*.e2e.test.tsx',
      description: 'End-to-end tests (if any)'
    }
  ];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting comprehensive test suite...\n');

    this.startTime = Date.now();
    const results: TestResult[] = [];

    for (const suite of this.testSuites) {
      console.log(`📋 Running ${suite.name} tests: ${suite.description}`);
      const suiteResults = await this.runTestSuite(suite);
      results.push(...suiteResults);
      console.log('');
    }

    this.generateReport(results);
  }

  async runTestSuite(suite: TestSuite): Promise<TestResult[]> {
    try {
      const command = ['bun', 'test', suite.pattern, '--run', '--reporter=json'];
      const process = spawn(command, {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'inherit']
      });

      let output = '';
      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      const exitCode = await new Promise<number>((resolve) => {
        process.on('close', resolve);
      });

      if (exitCode !== 0) {
        console.log(`❌ ${suite.name} tests failed`);
        return [{
          suite: suite.name,
          test: 'suite',
          status: 'fail',
          duration: 0,
          error: `Exit code: ${exitCode}`
        }];
      }

      // Parse JSON output
      try {
        const jsonResults = JSON.parse(output);
        return this.parseVitestResults(suite.name, jsonResults);
      } catch (error) {
        console.log(`⚠️  Could not parse ${suite.name} results`);
        return [{
          suite: suite.name,
          test: 'parsing',
          status: 'fail',
          duration: 0,
          error: error.message
        }];
      }

    } catch (error) {
      console.log(`❌ Error running ${suite.name} tests:`, error);
      return [{
        suite: suite.name,
        test: 'execution',
        status: 'fail',
        duration: 0,
        error: error.message
      }];
    }
  }

  private parseVitestResults(suiteName: string, results: any): TestResult[] {
    const testResults: TestResult[] = [];

    if (results.testResults) {
      for (const fileResult of results.testResults) {
        for (const testResult of fileResult.assertionResults) {
          testResults.push({
            suite: suiteName,
            test: testResult.title,
            status: testResult.status === 'passed' ? 'pass' :
                   testResult.status === 'failed' ? 'fail' : 'skip',
            duration: testResult.duration || 0,
            error: testResult.failureMessages?.join('\n')
          });
        }
      }
    }

    return testResults;
  }

  private generateReport(results: TestResult[]): void {
    const totalTime = Date.now() - this.startTime;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const skipped = results.filter(r => r.status === 'skip').length;
    const total = results.length;

    console.log('📊 Test Results Summary');
    console.log('═'.repeat(50));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📈 Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
    console.log('');

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      results.filter(r => r.status === 'fail').forEach(result => {
        console.log(`  • ${result.suite}: ${result.test}`);
        if (result.error) {
          console.log(`    ${result.error.split('\n')[0]}`);
        }
      });
      console.log('');
    }

    // Generate detailed report
    this.saveDetailedReport(results, { passed, failed, skipped, total, totalTime });

    // Performance analysis
    this.analyzePerformance(results);

    // Recommendations
    this.generateRecommendations(results);
  }

  private saveDetailedReport(results: TestResult[], summary: any): void {
    const reportDir = join(process.cwd(), 'reports', 'test-results');
    if (!existsSync(reportDir)) {
      mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(reportDir, `test-report-${timestamp}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      results: results.map(r => ({
        ...r,
        // Truncate long error messages
        error: r.error?.substring(0, 500)
      })),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        bunVersion: '1.3.x' // Would get from actual Bun version
      }
    };

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved: ${reportPath}`);
  }

  private analyzePerformance(results: TestResult[]): void {
    const testDurations = results
      .filter(r => r.status === 'pass' && r.duration > 0)
      .map(r => r.duration);

    if (testDurations.length === 0) return;

    const avgDuration = testDurations.reduce((a, b) => a + b, 0) / testDurations.length;
    const maxDuration = Math.max(...testDurations);
    const slowTests = results.filter(r => r.duration > 1000); // Tests taking > 1s

    console.log('⚡ Performance Analysis');
    console.log(`  Average test duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Slowest test: ${maxDuration.toFixed(2)}ms`);

    if (slowTests.length > 0) {
      console.log(`  ⚠️  ${slowTests.length} tests took > 1 second:`);
      slowTests.slice(0, 5).forEach(test => {
        console.log(`    • ${test.suite}: ${test.test} (${test.duration}ms)`);
      });
    }
    console.log('');
  }

  private generateRecommendations(results: TestResult[]): void {
    const recommendations: string[] = [];

    const failedTests = results.filter(r => r.status === 'fail').length;
    const slowTests = results.filter(r => r.duration > 1000).length;
    const successRate = results.length > 0 ? (results.filter(r => r.status === 'pass').length / results.length) * 100 : 0;

    if (failedTests > 0) {
      recommendations.push(`Fix ${failedTests} failing tests to improve reliability`);
    }

    if (successRate < 90) {
      recommendations.push('Improve test reliability - aim for >90% success rate');
    }

    if (slowTests > 0) {
      recommendations.push(`Optimize ${slowTests} slow tests (>1s) for faster feedback`);
    }

    if (results.length < 50) {
      recommendations.push('Add more comprehensive test coverage');
    }

    if (recommendations.length > 0) {
      console.log('💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  • ${rec}`));
      console.log('');
    }
  }

  async runPerformanceBenchmarks(): Promise<void> {
    console.log('🏃 Running performance benchmarks...\n');

    const benchmarkCommand = ['bun', 'test', '--run', '--reporter=verbose', 'performance-benchmarks'];
    const process = spawn(benchmarkCommand, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    const exitCode = await new Promise<number>((resolve) => {
      process.on('close', resolve);
    });

    if (exitCode === 0) {
      console.log('✅ Performance benchmarks completed successfully');
    } else {
      console.log('❌ Performance benchmarks failed');
    }
  }

  async runCoverageReport(): Promise<void> {
    console.log('📊 Generating coverage report...\n');

    const coverageCommand = ['bun', 'test', '--run', '--coverage'];
    const process = spawn(coverageCommand, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    const exitCode = await new Promise<number>((resolve) => {
      process.on('close', resolve);
    });

    if (exitCode === 0) {
      console.log('✅ Coverage report generated');
    } else {
      console.log('❌ Coverage report generation failed');
    }
  }

  async runAccessibilityAudit(): Promise<void> {
    console.log('♿ Running accessibility audit...\n');

    // This would integrate with tools like axe-core, lighthouse, etc.
    // For now, just run the visual regression tests which include accessibility checks
    const auditCommand = ['bun', 'test', '--run', 'visual-regression'];
    const process = spawn(auditCommand, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    const exitCode = await new Promise<number>((resolve) => {
      process.on('close', resolve);
    });

    if (exitCode === 0) {
      console.log('✅ Accessibility audit completed');
    } else {
      console.log('❌ Accessibility audit found issues');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.includes('--benchmarks') || args.includes('--performance')) {
    await runner.runPerformanceBenchmarks();
  } else if (args.includes('--coverage')) {
    await runner.runCoverageReport();
  } else if (args.includes('--accessibility') || args.includes('--a11y')) {
    await runner.runAccessibilityAudit();
  } else if (args.includes('--all')) {
    await runner.runAllTests();
    await runner.runPerformanceBenchmarks();
    await runner.runCoverageReport();
    await runner.runAccessibilityAudit();
  } else {
    await runner.runAllTests();
  }
}

if (import.meta.main) {
  main().catch(console.error);
}