/**
 * @fileoverview Advanced Test Runner
 * @description Real test execution engine with resource monitoring and analytics
 * @version 1.0.0
 * @since 2025-01-01
 *
 * EX034: Advanced Test Runner Implementation
 * Provides actual test execution, resource monitoring, performance analytics,
 * and intelligent test orchestration with real functionality
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, relative } from 'path';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { ResourceMonitor } from '../utils/resource-monitor';
import { TestDurationOracle } from '../agents/testDurationOracle';

interface TestFile {
  path: string;
  name: string;
  size: number;
  mtime: Date;
  category: 'unit' | 'integration' | 'performance' | 'property' | 'e2e';
}

interface TestResult {
  file: string;
  status: 'pass' | 'fail' | 'skip' | 'timeout';
  duration: number;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: string[];
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

interface TestSuiteResult {
  name: string;
  files: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  resourceUsage: {
    peakMemoryMB: number;
    totalCpuMs: number;
    averagePressure: number;
  };
}

interface TestRunnerConfig {
  concurrency: number;
  timeout: number;
  retries: number;
  coverage: boolean;
  bail: boolean; // Stop on first failure
  pattern: string[];
  exclude: string[];
  reporters: string[];
  resourceBudget: {
    maxMemoryMB: number;
    maxCpuMs: number;
    warningThreshold: number;
  };
}

/**
 * Advanced Test Runner with Resource Monitoring
 */
export class AdvancedTestRunner extends EventEmitter {
  private config: TestRunnerConfig;
  private testFiles: TestFile[] = [];
  private results: TestSuiteResult[] = [];
  private resourceMonitor = ResourceMonitor.getInstance();

  constructor(config: Partial<TestRunnerConfig> = {}) {
    super();

    this.config = {
      concurrency: 4,
      timeout: 30000,
      retries: 2,
      coverage: true,
      bail: false,
      pattern: ['**/*.test.ts', '**/*.spec.ts'],
      exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
      reporters: ['console', 'json'],
      resourceBudget: {
        maxMemoryMB: 1024,
        maxCpuMs: 300000, // 5 minutes
        warningThreshold: 0.8
      },
      ...config
    };

    // Set up resource monitoring
    this.resourceMonitor.setBudget({
      maxHeapMB: this.config.resourceBudget.maxMemoryMB,
      maxCpuMs: this.config.resourceBudget.maxCpuMs,
      warningThreshold: this.config.resourceBudget.warningThreshold,
      criticalThreshold: 0.9
    });

    this.resourceMonitor.on('alert', (alert) => {
      this.emit('resourceAlert', alert);
    });
  }

  /**
   * Discover test files in directory
   */
  async discoverTests(basePath: string): Promise<TestFile[]> {
    const files: TestFile[] = [];

    async function scanDirectory(dir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip excluded directories
        if (entry.isDirectory()) {
          if (this.config.exclude.some(pattern => entry.name.includes(pattern.replace('/**', '')))) {
            continue;
          }
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          // Check if file matches test patterns
          const relativePath = relative(basePath, fullPath);
          const matchesPattern = this.config.pattern.some(pattern =>
            this.matchesPattern(relativePath, pattern)
          );

          if (matchesPattern && (extname(entry.name) === '.ts' || extname(entry.name) === '.js')) {
            const stats = await stat(fullPath);
            const category = this.categorizeTestFile(relativePath);

            files.push({
              path: fullPath,
              name: relativePath,
              size: stats.size,
              mtime: stats.mtime,
              category
            });
          }
        }
      }
    }

    await scanDirectory(basePath);
    this.testFiles = files.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`📋 Discovered ${files.length} test files`);
    return files;
  }

  /**
   * Check if path matches glob pattern (simplified)
   */
  private matchesPattern(path: string, pattern: string): boolean {
    const regex = new RegExp(
      pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.')
    );
    return regex.test(path);
  }

  /**
   * Categorize test file by type
   */
  private categorizeTestFile(path: string): TestFile['category'] {
    if (path.includes('/unit/') || path.includes('.unit.')) return 'unit';
    if (path.includes('/integration/') || path.includes('.integration.')) return 'integration';
    if (path.includes('/performance/') || path.includes('.performance.')) return 'performance';
    if (path.includes('/property/') || path.includes('.property.')) return 'property';
    if (path.includes('/e2e/') || path.includes('.e2e.')) return 'e2e';
    return 'unit'; // Default
  }

  /**
   * Run all discovered tests
   */
  async runTests(): Promise<TestSuiteResult[]> {
    if (this.testFiles.length === 0) {
      throw new Error('No test files discovered. Run discoverTests() first.');
    }

    console.log(`🚀 Running ${this.testFiles.length} test files with concurrency ${this.config.concurrency}`);

    const startTime = Date.now();
    const suites: TestSuiteResult[] = [];

    // Group tests by category for better organization
    const categories = this.groupTestsByCategory();

    for (const [category, files] of Object.entries(categories)) {
      const suiteResult = await this.runTestCategory(category, files);
      suites.push(suiteResult);

      if (this.config.bail && suiteResult.failedTests > 0) {
        console.log('🛑 Bailing due to test failures');
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    this.results = suites;

    // Generate final report
    this.generateFinalReport(suites, totalDuration);

    return suites;
  }

  /**
   * Group test files by category
   */
  private groupTestsByCategory(): Record<string, TestFile[]> {
    const categories: Record<string, TestFile[]> = {
      unit: [],
      integration: [],
      performance: [],
      property: [],
      e2e: []
    };

    for (const file of this.testFiles) {
      categories[file.category].push(file);
    }

    return categories;
  }

  /**
   * Run tests for a specific category
   */
  private async runTestCategory(category: string, files: TestFile[]): Promise<TestSuiteResult> {
    console.log(`\n📂 Running ${category} tests (${files.length} files)`);

    const startTime = Date.now();
    const results: TestResult[] = [];
    const semaphore = new Semaphore(this.config.concurrency);

    // Run files with controlled concurrency
    const promises = files.map(async (file) => {
      await semaphore.acquire();

      try {
        const result = await this.runTestFile(file);
        results.push(result);
        return result;
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(promises);

    const duration = Date.now() - startTime;

    // Calculate aggregate statistics
    const totalTests = results.reduce((sum, r) => sum + r.tests, 0);
    const passedTests = results.reduce((sum, r) => sum + r.passed, 0);
    const failedTests = results.reduce((sum, r) => sum + r.failed, 0);
    const skippedTests = results.reduce((sum, r) => sum + r.skipped, 0);

    // Calculate coverage (simplified)
    const coverage = {
      statements: results.length > 0 ? results.reduce((sum, r) => sum + (r.coverage?.statements || 0), 0) / results.length : 0,
      branches: results.length > 0 ? results.reduce((sum, r) => sum + (r.coverage?.branches || 0), 0) / results.length : 0,
      functions: results.length > 0 ? results.reduce((sum, r) => sum + (r.coverage?.functions || 0), 0) / results.length : 0,
      lines: results.length > 0 ? results.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) / results.length : 0
    };

    // Get resource usage
    const resourceSummary = this.resourceMonitor.getSummary();
    const resourceUsage = {
      peakMemoryMB: resourceSummary.current.heapUsed,
      totalCpuMs: resourceSummary.current.cpuTime,
      averagePressure: resourceSummary.pressure?.overall || 0
    };

    const suiteResult: TestSuiteResult = {
      name: category,
      files: results,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration,
      coverage,
      resourceUsage
    };

    this.emit('suiteComplete', suiteResult);
    return suiteResult;
  }

  /**
   * Run a single test file
   */
  private async runTestFile(file: TestFile): Promise<TestResult> {
    const startTime = Date.now();

    // Predict test duration
    const prediction = TestDurationOracle.predictDuration(file.name);

    console.log(`  🧪 ${file.name} (predicted: ${prediction.predictedDuration}ms)`);

    let result: TestResult = {
      file: file.name,
      status: 'fail',
      duration: 0,
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Run test with retries
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const testResult = await this.executeTestFile(file);

        result = {
          ...testResult,
          duration: Date.now() - startTime
        };

        // Record actual duration for future predictions
        TestDurationOracle.recordDuration(file.name, result.duration);

        if (result.status === 'pass' || result.status === 'skip') {
          break; // Success or skip, no need to retry
        }

        if (attempt < this.config.retries) {
          console.log(`    🔄 Retrying ${file.name} (attempt ${attempt + 2}/${this.config.retries + 1})`);
        }
      } catch (error) {
        result.errors.push(`Attempt ${attempt + 1}: ${error.message}`);
        result.status = 'fail';
        result.duration = Date.now() - startTime;

        if (attempt < this.config.retries) {
          console.log(`    ❌ Attempt ${attempt + 1} failed for ${file.name}, retrying...`);
        }
      }
    }

    // Log result
    const statusIcon = result.status === 'pass' ? '✅' : result.status === 'skip' ? '⏭️' : '❌';
    console.log(`    ${statusIcon} ${file.name}: ${result.status} (${result.duration}ms, ${result.passed}/${result.tests} passed)`);

    if (result.errors.length > 0) {
      result.errors.forEach(error => console.log(`      ${error}`));
    }

    return result;
  }

  /**
   * Execute a test file using Bun's test runner
   */
  private async executeTestFile(file: TestFile): Promise<TestResult> {
    return new Promise((resolve, reject) => {
      const args = [
        'test',
        file.path,
        '--reporter=json'
      ];

      if (this.config.coverage) {
        args.push('--coverage');
      }

      const testProcess = spawn('bun', args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      testProcess.on('close', (code) => {
        try {
          // Parse JSON output from Bun test runner
          const jsonOutput = JSON.parse(stdout);

          const result: TestResult = {
            file: file.name,
            status: code === 0 ? 'pass' : 'fail',
            duration: jsonOutput.duration || 0,
            tests: jsonOutput.tests || 0,
            passed: jsonOutput.passed || 0,
            failed: jsonOutput.failed || 0,
            skipped: jsonOutput.skipped || 0,
            errors: jsonOutput.errors || []
          };

          // Add coverage if available
          if (jsonOutput.coverage) {
            result.coverage = {
              statements: jsonOutput.coverage.statements?.pct || 0,
              branches: jsonOutput.coverage.branches?.pct || 0,
              functions: jsonOutput.coverage.functions?.pct || 0,
              lines: jsonOutput.coverage.lines?.pct || 0
            };
          }

          resolve(result);
        } catch (error) {
          // If JSON parsing fails, create a basic result
          const result: TestResult = {
            file: file.name,
            status: code === 0 ? 'pass' : 'fail',
            duration: 0,
            tests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: [stderr || 'Test execution failed']
          };
          resolve(result);
        }
      });

      testProcess.on('error', (error) => {
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        testProcess.kill('SIGTERM');
        reject(new Error('Test timeout'));
      }, this.config.timeout);
    });
  }

  /**
   * Generate final test report
   */
  private generateFinalReport(suites: TestSuiteResult[], totalDuration: number): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ADVANCED TEST SUITE REPORT');
    console.log('='.repeat(80));

    const totalSuites = suites.length;
    const totalTests = suites.reduce((sum, s) => sum + s.totalTests, 0);
    const totalPassed = suites.reduce((sum, s) => sum + s.passedTests, 0);
    const totalFailed = suites.reduce((sum, s) => sum + s.failedTests, 0);
    const totalSkipped = suites.reduce((sum, s) => sum + s.skippedTests, 0);

    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`   Suites: ${totalSuites}`);
    console.log(`   Tests: ${totalTests} total, ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped`);
    console.log(`   Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
    console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    // Coverage summary
    const avgCoverage = {
      statements: suites.reduce((sum, s) => sum + s.coverage.statements, 0) / suites.length,
      branches: suites.reduce((sum, s) => sum + s.coverage.branches, 0) / suites.length,
      functions: suites.reduce((sum, s) => sum + s.coverage.functions, 0) / suites.length,
      lines: suites.reduce((sum, s) => sum + s.coverage.lines, 0) / suites.length
    };

    console.log(`\n📈 COVERAGE SUMMARY:`);
    console.log(`   Statements: ${avgCoverage.statements.toFixed(1)}%`);
    console.log(`   Branches: ${avgCoverage.branches.toFixed(1)}%`);
    console.log(`   Functions: ${avgCoverage.functions.toFixed(1)}%`);
    console.log(`   Lines: ${avgCoverage.lines.toFixed(1)}%`);

    // Resource usage summary
    const peakMemory = Math.max(...suites.map(s => s.resourceUsage.peakMemoryMB));
    const totalCpu = suites.reduce((sum, s) => sum + s.resourceUsage.totalCpuMs, 0);
    const avgPressure = suites.reduce((sum, s) => sum + s.resourceUsage.averagePressure, 0) / suites.length;

    console.log(`\n💾 RESOURCE USAGE:`);
    console.log(`   Peak Memory: ${peakMemory.toFixed(1)}MB`);
    console.log(`   Total CPU: ${(totalCpu / 1000).toFixed(2)}s`);
    console.log(`   Average Pressure: ${(avgPressure * 100).toFixed(1)}%`);

    // Suite breakdown
    console.log(`\n📂 SUITE BREAKDOWN:`);
    suites.forEach(suite => {
      const successRate = suite.totalTests > 0 ? ((suite.passedTests / suite.totalTests) * 100).toFixed(1) : '0.0';
      console.log(`   ${suite.name}: ${suite.passedTests}/${suite.totalTests} (${successRate}%) - ${(suite.duration / 1000).toFixed(2)}s`);
    });

    // Performance insights
    const slowSuites = suites.filter(s => s.duration > 30000); // > 30 seconds
    if (slowSuites.length > 0) {
      console.log(`\n🐌 PERFORMANCE INSIGHTS:`);
      console.log(`   Slow suites (>30s): ${slowSuites.map(s => s.name).join(', ')}`);
    }

    const lowCoverageSuites = suites.filter(s => s.coverage.lines < 70);
    if (lowCoverageSuites.length > 0) {
      console.log(`\n📉 COVERAGE INSIGHTS:`);
      console.log(`   Low coverage suites (<70%): ${lowCoverageSuites.map(s => s.name).join(', ')}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Get test results summary
   */
  getSummary(): {
    totalSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    successRate: number;
    averageCoverage: {
      statements: number;
      branches: number;
      functions: number;
      lines: number;
    };
  } {
    const totalSuites = this.results.length;
    const totalTests = this.results.reduce((sum, s) => sum + s.totalTests, 0);
    const passedTests = this.results.reduce((sum, s) => sum + s.passedTests, 0);
    const failedTests = this.results.reduce((sum, s) => sum + s.failedTests, 0);
    const skippedTests = this.results.reduce((sum, s) => sum + s.skippedTests, 0);

    const averageCoverage = {
      statements: this.results.reduce((sum, s) => sum + s.coverage.statements, 0) / totalSuites,
      branches: this.results.reduce((sum, s) => sum + s.coverage.branches, 0) / totalSuites,
      functions: this.results.reduce((sum, s) => sum + s.coverage.functions, 0) / totalSuites,
      lines: this.results.reduce((sum, s) => sum + s.coverage.lines, 0) / totalSuites
    };

    return {
      totalSuites,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      averageCoverage
    };
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      this.permits--;
      resolve();
    }
  }
}

// Export for use in test scripts
export async function runAdvancedTestSuite(basePath: string = process.cwd()): Promise<any> {
  const runner = new AdvancedTestRunner();

  try {
    console.log('🧠 Initializing Advanced Test Suite...');

    // Discover tests
    await runner.discoverTests(basePath);

    // Run tests
    const results = await runner.runTests();

    // Get summary
    const summary = runner.getSummary();

    console.log('\n🎉 Advanced test suite completed!');
    console.log(`Success rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Coverage: ${summary.averageCoverage.lines.toFixed(1)}% lines`);

    return {
      results,
      summary
    };

  } catch (error) {
    console.error('❌ Advanced test suite failed:', error);
    throw error;
  }
}

// CLI runner
if (import.meta.main) {
  const basePath = process.argv[2] || process.cwd();

  runAdvancedTestSuite(basePath)
    .then(() => {
      console.log('✅ Advanced test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Advanced test suite failed:', error);
      process.exit(1);
    });
}