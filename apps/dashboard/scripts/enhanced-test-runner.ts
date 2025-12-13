#!/usr/bin/env bun

/**
 * Enhanced Test Runner with Comprehensive Reporting
 * Runs all test suites with detailed metrics and coverage analysis
 */

import { execSync, spawn } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  duration: number;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

interface TestReport {
  timestamp: string;
  totalSuites: number;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  averageDuration: number;
  coverage: {
    overall: number;
    bySuite: Record<string, any>;
  };
  performance: {
    grade: 'Excellent' | 'Good' | 'Needs Improvement';
    recommendations: string[];
  };
  results: TestResult[];
}

export class EnhancedTestRunner {
  private results: TestResult[] = [];
  private startTime = 0;

  private parseBunTextOutput(output: string, suiteName: string): TestResult {
    let passed = 0;
    let failed = 0;
    let duration = 0;
    let coverage: TestResult['coverage'];

    try {
      const lines = output.split('\n');

      // Parse test results - look for patterns like "X pass, Y fail" or similar
      for (const line of lines) {
        // Look for test result summary: "X pass" and "Y fail" on separate lines
        const passMatch = line.match(/^(\d+)\s+pass$/);
        const failMatch = line.match(/^(\d+)\s+fail$/);

        if (passMatch) {
          passed = parseInt(passMatch[1]);
        }
        if (failMatch) {
          failed = parseInt(failMatch[1]);
        }

        // Look for duration: "Ran X tests across Y file. [Zms]"
        const durationMatch = line.match(/Ran\s+\d+\s+tests\s+across\s+\d+\s+file\.\s+\[(\d+(?:\.\d+)?)ms\]/);
        if (durationMatch) {
          duration = Math.round(parseFloat(durationMatch[1]));
        }
      }

      // Parse coverage table - look for the "All files" line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('All files') && line.includes('%')) {
          // Parse coverage percentages from the table
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 4) {
            const funcsPct = parseFloat(parts[1].replace('%', '')) || 0;
            const linesPct = parseFloat(parts[2].replace('%', '')) || 0;

            coverage = {
              statements: Math.round(funcsPct), // Using funcs as statements approximation
              branches: 0, // Bun text output doesn't show branches
              functions: Math.round(funcsPct),
              lines: Math.round(linesPct)
            };
          }
          break;
        }
      }

      // If no coverage found in output, try to read from lcov file
      if (!coverage) {
        try {
          const lcovPath = join('coverage', 'lcov.info');
          if (existsSync(lcovPath)) {
            const lcovContent = readFileSync(lcovPath, 'utf8');
            coverage = this.parseLcovCoverage(lcovContent);
          }
        } catch (error) {
          // LCOV file might not exist
        }
      }

    } catch (error) {
      console.warn(`Failed to parse Bun text output for ${suiteName}:`, error);
    }

    return {
      suite: suiteName,
      passed,
      failed,
      duration,
      coverage
    };
  }

  private parseLcovCoverage(lcovContent: string): TestResult['coverage'] {
    // Simple LCOV parsing for basic coverage stats
    const lines = lcovContent.split('\n');
    let functionsFound = 0;
    let functionsHit = 0;
    let linesFound = 0;
    let linesHit = 0;

    for (const line of lines) {
      if (line.startsWith('FNF:')) {
        functionsFound += parseInt(line.split(':')[1]) || 0;
      } else if (line.startsWith('FNH:')) {
        functionsHit += parseInt(line.split(':')[1]) || 0;
      } else if (line.startsWith('LF:')) {
        linesFound += parseInt(line.split(':')[1]) || 0;
      } else if (line.startsWith('LH:')) {
        linesHit += parseInt(line.split(':')[1]) || 0;
      }
    }

    const functionsPct = functionsFound > 0 ? (functionsHit / functionsFound) * 100 : 0;
    const linesPct = linesFound > 0 ? (linesHit / linesFound) * 100 : 0;

    return {
      statements: Math.round(linesPct),
      branches: 0, // LCOV doesn't easily give branch coverage
      functions: Math.round(functionsPct),
      lines: Math.round(linesPct)
    };
  }



  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting Enhanced Test Suite...\n');

    this.startTime = Date.now();

    // Run test suites
    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runPerformanceTests();
    await this.runAccessibilityTests();
    await this.runVisualRegressionTests();

    // Generate comprehensive report
    const report = this.generateReport();

    // Save report
    this.saveReport(report);

    // Display summary
    this.displaySummary(report);

    return report;
  }

  private async runUnitTests(): Promise<void> {
    console.log('📦 Running Unit Tests...');

    try {
      const output = execSync('bun test src/components/__tests__/*.test.tsx', {
        encoding: 'utf8',
        timeout: 15000 // 15 second timeout
      });

      const testResult = this.parseBunTextOutput(output, 'Unit Tests');
      this.results.push(testResult);
      console.log('✅ Unit Tests completed');
    } catch (error) {
      console.log('❌ Unit Tests failed');
      this.results.push({
        suite: 'Unit Tests',
        passed: 0,
        failed: 1,
        duration: 0
      });
    }
  }

  private async runIntegrationTests(): Promise<void> {
    console.log('🔗 Running Integration Tests...');

    try {
      const output = execSync('bun test src/components/__tests__/integration.test.tsx', {
        encoding: 'utf8',
        timeout: 15000
      });

      const testResult = this.parseBunTextOutput(output, 'Integration Tests');
      this.results.push(testResult);
      console.log('✅ Integration Tests completed');
    } catch (error) {
      console.log('❌ Integration Tests failed');
      this.results.push({
        suite: 'Integration Tests',
        passed: 0,
        failed: 1,
        duration: 0
      });
    }
  }

  private async runPerformanceTests(): Promise<void> {
    console.log('⚡ Running Performance Benchmarks...');

    try {
      const output = execSync('bun test src/components/__tests__/performance-benchmarks.test.tsx', {
        encoding: 'utf8',
        timeout: 15000
      });

      const testResult = this.parseBunTextOutput(output, 'Performance Tests');
      this.results.push(testResult);
      console.log('✅ Performance Tests completed');
    } catch (error) {
      console.log('❌ Performance Tests failed');
      this.results.push({
        suite: 'Performance Tests',
        passed: 0,
        failed: 1,
        duration: 0
      });
    }
  }

  private async runAccessibilityTests(): Promise<void> {
    console.log('♿ Running Accessibility Tests...');

    try {
      const output = execSync('bun test src/components/__tests__/accessibility.test.tsx', {
        encoding: 'utf8',
        timeout: 15000
      });

      const testResult = this.parseBunTextOutput(output, 'Accessibility Tests');
      this.results.push(testResult);
      console.log('✅ Accessibility Tests completed');
    } catch (error) {
      console.log('❌ Accessibility Tests failed');
      this.results.push({
        suite: 'Accessibility Tests',
        passed: 0,
        failed: 1,
        duration: 0
      });
    }
  }

  private async runVisualRegressionTests(): Promise<void> {
    console.log('👁️ Running Visual Regression Tests...');

    try {
      const output = execSync('bun test src/components/__tests__/visual-regression.test.tsx', {
        encoding: 'utf8',
        timeout: 15000
      });

      const testResult = this.parseBunTextOutput(output, 'Visual Regression Tests');
      this.results.push(testResult);
      console.log('✅ Visual Regression Tests completed');
    } catch (error) {
      console.log('❌ Visual Regression Tests failed');
      this.results.push({
        suite: 'Visual Regression Tests',
        passed: 0,
        failed: 1,
        duration: 0
      });
    }
  }

  private generateReport(): TestReport {
    const totalTests = this.results.reduce((sum, r) => sum + r.passed + r.failed, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;

    // Calculate overall coverage from actual data
    let overallCoverage = 0;
    const coverageBySuite: Record<string, any> = {};

    this.results.forEach(result => {
      if (result.coverage) {
        const suiteCoverage = (result.coverage.statements + result.coverage.branches + result.coverage.functions + result.coverage.lines) / 4;
        coverageBySuite[result.suite] = result.coverage;
        overallCoverage = Math.max(overallCoverage, suiteCoverage);
      }
    });

    const coverage = {
      overall: overallCoverage,
      bySuite: coverageBySuite
    };

    // Performance grading
    let grade: 'Excellent' | 'Good' | 'Needs Improvement' = 'Excellent';
    const recommendations: string[] = [];

    if (averageDuration > 100) {
      grade = 'Needs Improvement';
      recommendations.push('Consider optimizing test execution time');
    } else if (averageDuration > 50) {
      grade = 'Good';
    }

    if (totalFailed > 0) {
      recommendations.push('Address failing tests');
    }

    if (coverage.overall < 80) {
      recommendations.push('Improve test coverage');
    }

    return {
      timestamp: new Date().toISOString(),
      totalSuites: this.results.length,
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      averageDuration,
      coverage,
      performance: {
        grade,
        recommendations
      },
      results: this.results
    };
  }

  private saveReport(report: TestReport): void {
    const reportDir = 'apps/dashboard/test-reports';
    mkdirSync(reportDir, { recursive: true });

    const reportPath = join(reportDir, `test-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    const summaryPath = join(reportDir, 'latest-summary.md');
    const summary = this.generateMarkdownSummary(report);
    writeFileSync(summaryPath, summary);

    console.log(`📊 Test reports saved to: ${reportDir}`);
  }

  private generateMarkdownSummary(report: TestReport): string {
    return `# Test Execution Summary

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**Total Suites:** ${report.totalSuites}
**Total Tests:** ${report.totalTests}
**Passed:** ${report.totalPassed}
**Failed:** ${report.totalFailed}
**Success Rate:** ${((report.totalPassed / report.totalTests) * 100).toFixed(1)}%

## Performance Metrics
- **Total Duration:** ${report.totalDuration.toFixed(2)}ms
- **Average per Test:** ${report.averageDuration.toFixed(2)}ms
- **Performance Grade:** ${report.performance.grade}

## Test Suite Results

${report.results.map(r => `### ${r.suite}
- **Passed:** ${r.passed}
- **Failed:** ${r.failed}
- **Duration:** ${r.duration.toFixed(2)}ms
${r.coverage ? `- **Coverage:** ${r.coverage.statements || 'N/A'}%` : ''}
`).join('\n')}

## Recommendations

${report.performance.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by Enhanced Test Runner*
`;
  }

  private displaySummary(report: TestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST EXECUTION COMPLETE');
    console.log('='.repeat(60));

    console.log(`📊 Total Suites: ${report.totalSuites}`);
    console.log(`🧪 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.totalPassed}`);
    console.log(`❌ Failed: ${report.totalFailed}`);
    console.log(`📈 Success Rate: ${((report.totalPassed / report.totalTests) * 100).toFixed(1)}%`);
    console.log(`⏱️ Total Duration: ${report.totalDuration.toFixed(2)}ms`);
    console.log(`📊 Performance Grade: ${report.performance.grade}`);

    if (report.performance.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.performance.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    console.log('\n📋 Suite Breakdown:');
    report.results.forEach(result => {
      const status = result.failed > 0 ? '❌' : '✅';
      console.log(`   ${status} ${result.suite}: ${result.passed}/${result.passed + result.failed} passed`);
    });

    console.log('\n' + '='.repeat(60));
  }
}

// Run the enhanced test suite
const runner = new EnhancedTestRunner();
runner.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});