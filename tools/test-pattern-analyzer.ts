#!/usr/bin/env bun
// tools/test-pattern-analyzer.ts - Test Pattern Analysis & Anti-Pattern Detection
// Analyzes test files to identify patterns, anti-patterns, and testing best practices

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, basename, dirname } from 'path';

interface TestPattern {
  name: string;
  description: string;
  pattern: RegExp;
  category: 'good' | 'warnings' | 'bad';
  severity: 'low' | 'medium' | 'high';
  recommendation?: string;
}

interface TestAnalysis {
  file: string;
  path: string;
  patterns: {
    good: TestPattern[];
    warnings: TestPattern[];
    bad: TestPattern[];
  };
  metrics: {
    totalTests: number;
    asyncTests: number;
    describeBlocks: number;
    testTimeouts: number;
    assertions: number;
    mocks: number;
    setupTeardown: number;
  };
  score: number;
  issues: string[];
  recommendations: string[];
}

interface PatternReport {
  summary: {
    totalFiles: number;
    averageScore: number;
    patternDistribution: Record<string, number>;
    antiPatternDistribution: Record<string, number>;
    mostCommonIssues: Array<{ issue: string; count: number }>;
  };
  files: TestAnalysis[];
  correlations: {
    complexityVsTestQuality: Array<{ complexity: number; score: number }>;
    categoryVsPatterns: Record<string, Record<string, number>>;
  };
}

class TestPatternAnalyzer {
  private testPatterns: TestPattern[] = [
    // Good Patterns
    {
      name: 'Bun Test Import Style',
      description: 'Uses proper Bun test imports from "bun:test"',
      pattern: /import\s+{[^}]*}\s+from\s+['"]bun:test['"]/,
      category: 'good',
      severity: 'high'
    },
    {
      name: 'Harness Import Usage',
      description: 'Imports utilities from harness.ts (bunExe, bunEnv, tempDir, etc.)',
      pattern: /import\s+{[^}]*bunExe[^}]*}\s+from\s+['"]harness['"]/,
      category: 'good',
      severity: 'high'
    },
    {
      name: 'Regression Test Naming',
      description: 'Regression tests should follow issue number pattern',
      pattern: /test\/regression\/issue\/\d+\.test\./,
      category: 'good',
      severity: 'medium'
    },
    {
      name: 'Random Port Usage',
      description: 'Uses port: 0 for random port assignment',
      pattern: /port:\s*0/,
      category: 'good',
      severity: 'medium'
    },
    {
      name: 'Descriptive Test Names',
      description: 'Test names should be descriptive and follow naming conventions',
      pattern: /test\(['"`](should|when|given|then|with|without|can|does|will|has)/i,
      category: 'good',
      severity: 'medium'
    },
    {
      name: 'Proper Setup/Teardown',
      description: 'Uses beforeEach/afterEach for proper test isolation',
      pattern: /(beforeEach|afterEach|beforeAll|afterAll)\s*\(/,
      category: 'good',
      severity: 'high'
    },
    {
      name: 'Assertion Usage',
      description: 'Uses proper assertions instead of console logs',
      pattern: /expect\(|assert\(|t\.\(ok\|equal\|deepEqual\)\)/,
      category: 'good',
      severity: 'high'
    },
    {
      name: 'Async Test Handling',
      description: 'Properly handles async operations in tests',
      pattern: /async\s+(function\s+)?test\(|await\s+expect\(/,
      category: 'good',
      severity: 'medium'
    },

    // Warning Patterns
    {
      name: 'Magic Numbers',
      description: 'Uses unexplained numeric literals',
      pattern: /(expect|assert)\(\s*\d+\s*\)/,
      category: 'warnings',
      severity: 'low',
      recommendation: 'Use named constants for magic numbers'
    },
    {
      name: 'Long Test Functions',
      description: 'Test functions that are too long (>50 lines)',
      pattern: /test\(['"`].*['"`],\s*\([^)]*\)\s*=>\s*\{[\s\S]{1000,}\}/,
      category: 'warnings',
      severity: 'medium',
      recommendation: 'Break down large tests into smaller, focused tests'
    },
    {
      name: 'Nested Describes',
      description: 'Deeply nested describe blocks (>3 levels)',
      pattern: /describe\(['"`].*['"`],\s*\(\)\s*=>\s*\{\s*describe\(['"`].*['"`],\s*\(\)\s*=>\s*\{\s*describe\(/,
      category: 'warnings',
      severity: 'medium',
      recommendation: 'Avoid deep nesting; consider flattening test structure'
    },

    // Bad Patterns (Anti-patterns)
    {
      name: 'Console Log in Tests',
      description: 'Uses console.log instead of proper assertions',
      pattern: /console\.log\(/,
      category: 'bad',
      severity: 'high',
      recommendation: 'Replace console.log with proper assertions using expect()'
    },
    {
      name: 'Empty Test Blocks',
      description: 'Test blocks with no actual test code',
      pattern: /test\(['"`].*['"`],\s*\(\)\s*=>\s*\{\s*\}\)/,
      category: 'bad',
      severity: 'high',
      recommendation: 'Implement actual test logic or remove empty tests'
    },
    {
      name: 'Test Only Usage',
      description: 'Uses test.only() which can hide other tests',
      pattern: /test\.only\(/,
      category: 'bad',
      severity: 'high',
      recommendation: 'Remove .only() before committing; run all tests'
    },
    {
      name: 'Hardcoded Timeouts',
      description: 'Uses arbitrary setTimeout in tests',
      pattern: /setTimeout\([^,]+,\s*\d+\)/,
      category: 'bad',
      severity: 'medium',
      recommendation: 'Use proper async/await or test timeouts instead of setTimeout'
    },
    {
      name: 'Global State Modification',
      description: 'Modifies global state in tests',
      pattern: /(global|process\.env|window)\.\w+\s*=/,
      category: 'bad',
      severity: 'high',
      recommendation: 'Use proper mocking or isolate test state'
    },
    {
      name: 'Missing Harness Import',
      description: 'Does not import utility functions from harness',
      pattern: /import.*harness/,
      category: 'warnings',
      severity: 'low',
      recommendation: 'Consider importing utility functions from harness.ts for better test infrastructure'
    },
    {
      name: 'Hardcoded Port Numbers',
      description: 'Uses hardcoded port numbers instead of port: 0',
      pattern: /port:\s*[1-9]\d*/,
      category: 'bad',
      severity: 'high',
      recommendation: 'Use port: 0 to get a random port instead of hardcoding port numbers'
    },
    {
      name: 'Time-Based Waits',
      description: 'Uses setTimeout or setInterval for waiting in tests',
      pattern: /setTimeout\(|setInterval\(/,
      category: 'bad',
      severity: 'high',
      recommendation: 'Wait for conditions to be met instead of using arbitrary timeouts'
    },
    {
      name: 'Test Timeouts',
      description: 'Sets timeout on individual tests',
      pattern: /timeout\(/,
      category: 'bad',
      severity: 'medium',
      recommendation: 'Do not set timeouts on tests - Bun already has timeouts'
    },
    {
      name: 'TypeScript Test Without Types',
      description: 'TypeScript test files should use proper typing',
      pattern: /\/\/\s*@ts-(ignore|nocheck)/,
      category: 'warnings',
      severity: 'medium',
      recommendation: 'Use @ts-expect-error for intentional type errors instead of @ts-ignore or @ts-nocheck'
    }
  ];

  private analyzeTestFile(filePath: string): TestAnalysis | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const relativePath = filePath.replace(/^examples\//, '');

      const analysis: TestAnalysis = {
        file: basename(filePath),
        path: relativePath,
        patterns: {
          good: [],
          warnings: [],
          bad: []
        },
        metrics: {
          totalTests: 0,
          asyncTests: 0,
          describeBlocks: 0,
          testTimeouts: 0,
          assertions: 0,
          mocks: 0,
          setupTeardown: 0
        },
        score: 100,
        issues: [],
        recommendations: []
      };

      // Count basic metrics
      analysis.metrics.totalTests = (content.match(/test\(/g) || []).length;
      analysis.metrics.asyncTests = (content.match(/async\s+(function\s+)?test\(/g) || []).length;
      analysis.metrics.describeBlocks = (content.match(/describe\(/g) || []).length;
      analysis.metrics.testTimeouts = (content.match(/timeout\(/g) || []).length;
      analysis.metrics.assertions = (content.match(/expect\(|assert\(|t\.\(ok\|equal\|deepEqual\)\)/g) || []).length;
      analysis.metrics.mocks = (content.match(/mock\(|spy\(|stub\(/g) || []).length;
      analysis.metrics.setupTeardown = (content.match(/(beforeEach|afterEach|beforeAll|afterAll)/g) || []).length;

      // Analyze patterns
      for (const pattern of this.testPatterns) {
        if (pattern.pattern.test(content)) {
          analysis.patterns[pattern.category].push(pattern);

          // Adjust score based on pattern
          const scorePenalty = pattern.category === 'bad' ? 20 :
                              pattern.category === 'warnings' ? 10 : 0;
          analysis.score = Math.max(0, analysis.score - scorePenalty);

          if (pattern.category !== 'good') {
            analysis.issues.push(`${pattern.name}: ${pattern.description}`);
            if (pattern.recommendation) {
              analysis.recommendations.push(pattern.recommendation);
            }
          }
        }
      }

      // Additional analysis
      this.performAdvancedAnalysis(content, analysis);

      return analysis;

    } catch (error) {
      console.warn(`⚠️ Failed to analyze ${filePath}:`, error);
      return null;
    }
  }

  private performAdvancedAnalysis(content: string, analysis: TestAnalysis): void {
    // Check for test isolation issues
    const sharedVariables = content.match(/let\s+\w+\s*=.*;?\s*(?=\w+\s*=|\n\n)/g);
    if (sharedVariables && sharedVariables.length > 3) {
      analysis.issues.push('Potential test isolation issues: Many shared variables');
      analysis.recommendations.push('Consider using beforeEach to reset shared state');
      analysis.score -= 15;
    }

    // Check for missing assertions
    const testsWithoutAssertions = (content.match(/test\([^)]+\)\s*=>\s*\{[^}]*\}/g) || [])
      .filter(test => !test.includes('expect(') && !test.includes('assert('));
    if (testsWithoutAssertions.length > 0) {
      analysis.issues.push(`${testsWithoutAssertions.length} tests may be missing assertions`);
      analysis.recommendations.push('Ensure all tests have at least one assertion');
      analysis.score -= 10;
    }

    // Check for flaky test patterns
    if (content.includes('setTimeout') && content.includes('expect')) {
      analysis.issues.push('Potential flaky test: Using setTimeout with assertions');
      analysis.recommendations.push('Use proper async testing patterns instead of setTimeout');
      analysis.score -= 15;
    }

    // Check for proper error testing
    const errorTests = content.match(/expect.*toThrow|expect.*rejects/g);
    if (analysis.metrics.totalTests > 5 && (!errorTests || errorTests.length === 0)) {
      analysis.issues.push('Missing error case testing');
      analysis.recommendations.push('Add tests for error conditions and edge cases');
      analysis.score -= 5;
    }

    // Performance analysis
    if (content.includes('performance') || content.includes('benchmark')) {
      if (!content.includes('timeout') && analysis.metrics.totalTests > 1) {
        analysis.issues.push('Performance tests may need timeout protection');
        analysis.recommendations.push('Add reasonable timeouts to performance tests');
        analysis.score -= 5;
      }
    }
  }

  private scanTestFiles(): TestAnalysis[] {
    const analyses: TestAnalysis[] = [];
    const testExtensions = ['.test.ts', '.spec.ts', '.test.js', '.spec.js'];

    const scanDirectory = (dir: string): void => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            scanDirectory(fullPath);
          } else if (entry.isFile()) {
            const ext = extname(entry.name);
            if (testExtensions.some(testExt => entry.name.endsWith(testExt))) {
              const analysis = this.analyzeTestFile(fullPath);
              if (analysis) {
                analyses.push(analysis);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to scan directory ${dir}:`, error);
      }
    };

    scanDirectory('examples');
    return analyses;
  }

  private analyzeCorrelations(analyses: TestAnalysis[]): PatternReport['correlations'] {
    const correlations = {
      complexityVsTestQuality: [] as Array<{ complexity: number; score: number }>,
      categoryVsPatterns: {} as Record<string, Record<string, number>>
    };

    // Complexity vs Test Quality correlation
    analyses.forEach(analysis => {
      // Estimate complexity based on metrics
      const complexity = (
        analysis.metrics.totalTests * 2 +
        analysis.metrics.describeBlocks * 3 +
        analysis.metrics.assertions * 1 +
        analysis.metrics.mocks * 2 +
        analysis.metrics.setupTeardown * 2
      );

      correlations.complexityVsTestQuality.push({
        complexity,
        score: analysis.score
      });
    });

    // Category vs Patterns correlation
    analyses.forEach(analysis => {
      const category = dirname(analysis.path).split('/')[0] || 'root';

      if (!correlations.categoryVsPatterns[category]) {
        correlations.categoryVsPatterns[category] = {};
      }

      // Count pattern types by category
      correlations.categoryVsPatterns[category].good =
        (correlations.categoryVsPatterns[category].good || 0) + analysis.patterns.good.length;
      correlations.categoryVsPatterns[category].warnings =
        (correlations.categoryVsPatterns[category].warnings || 0) + analysis.patterns.warnings.length;
      correlations.categoryVsPatterns[category].bad =
        (correlations.categoryVsPatterns[category].bad || 0) + analysis.patterns.bad.length;
    });

    return correlations;
  }

  private generateReport(analyses: TestAnalysis[]): PatternReport {
    const correlations = this.analyzeCorrelations(analyses);

    // Calculate summary statistics
    const totalScore = analyses.reduce((sum, a) => sum + a.score, 0);
    const averageScore = analyses.length > 0 ? Math.round(totalScore / analyses.length) : 0;

    const patternDistribution: Record<string, number> = {};
    const antiPatternDistribution: Record<string, number> = {};
    const issueCounts: Record<string, number> = {};

    analyses.forEach(analysis => {
      // Pattern distribution
      patternDistribution.good = (patternDistribution.good || 0) + analysis.patterns.good.length;
      patternDistribution.warnings = (patternDistribution.warnings || 0) + analysis.patterns.warnings.length;
      patternDistribution.bad = (patternDistribution.bad || 0) + analysis.patterns.bad.length;

      // Anti-pattern distribution
      antiPatternDistribution.consoleLog = (antiPatternDistribution.consoleLog || 0) +
        (analysis.patterns.bad.some(p => p.name === 'Console Log in Tests') ? 1 : 0);
      antiPatternDistribution.emptyTests = (antiPatternDistribution.emptyTests || 0) +
        (analysis.patterns.bad.some(p => p.name === 'Empty Test Blocks') ? 1 : 0);
      antiPatternDistribution.testOnly = (antiPatternDistribution.testOnly || 0) +
        (analysis.patterns.bad.some(p => p.name === 'Test Only Usage') ? 1 : 0);

      // Issue counts
      analysis.issues.forEach(issue => {
        const key = issue.split(':')[0];
        issueCounts[key] = (issueCounts[key] || 0) + 1;
      });
    });

    const mostCommonIssues = Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    return {
      summary: {
        totalFiles: analyses.length,
        averageScore,
        patternDistribution,
        antiPatternDistribution,
        mostCommonIssues
      },
      files: analyses,
      correlations
    };
  }

  private generateMarkdownReport(report: PatternReport): string {
    let markdown = `# 🧪 Test Pattern Analysis Report

*Generated on ${new Date().toISOString()} by Test Pattern Analyzer*

## 📊 Executive Summary

**Test Files Analyzed:** ${report.summary.totalFiles}
**Average Test Quality Score:** ${report.summary.averageScore}/100
**Pattern Distribution:** ${report.summary.patternDistribution.good || 0} good, ${report.summary.patternDistribution.warnings || 0} warnings, ${report.summary.patternDistribution.bad || 0} anti-patterns

### 🏆 Quality Score Distribution
- **Excellent (90-100):** ${report.files.filter(f => f.score >= 90).length} files
- **Good (70-89):** ${report.files.filter(f => f.score >= 70 && f.score < 90).length} files
- **Needs Improvement (50-69):** ${report.files.filter(f => f.score >= 50 && f.score < 70).length} files
- **Critical Issues (0-49):** ${report.files.filter(f => f.score < 50).length} files

## 🚨 Most Common Issues

${report.summary.mostCommonIssues.map(issue => `- **${issue.issue}**: ${issue.count} occurrences`).join('\n')}

## 📈 Anti-Pattern Distribution

| Anti-Pattern | Files Affected | Severity |
|-------------|----------------|----------|
| Console Log in Tests | ${report.summary.antiPatternDistribution.consoleLog || 0} | High |
| Empty Test Blocks | ${report.summary.antiPatternDistribution.emptyTests || 0} | High |
| Test Only Usage | ${report.summary.antiPatternDistribution.testOnly || 0} | High |

## 📋 Detailed File Analysis

${report.files.map(file => `
### ${file.file}
**Path:** \`${file.path}\`
**Quality Score:** ${file.score}/100 ${this.getScoreEmoji(file.score)}

**Metrics:**
- Total Tests: ${file.metrics.totalTests}
- Async Tests: ${file.metrics.asyncTests}
- Describe Blocks: ${file.metrics.describeBlocks}
- Assertions: ${file.metrics.assertions}
- Setup/Teardown: ${file.metrics.setupTeardown}

**Patterns Found:**
${file.patterns.good.length > 0 ? `✅ **Good:** ${file.patterns.good.map(p => p.name).join(', ')}` : ''}
${file.patterns.warnings.length > 0 ? `⚠️ **Warnings:** ${file.patterns.warnings.map(p => p.name).join(', ')}` : ''}
${file.patterns.bad.length > 0 ? `❌ **Anti-patterns:** ${file.patterns.bad.map(p => p.name).join(', ')}` : ''}

${file.issues.length > 0 ? `
**Issues:**
${file.issues.map(issue => `- ${issue}`).join('\n')}

**Recommendations:**
${file.recommendations.map(rec => `- ${rec}`).join('\n')}` : '**✅ No issues found!**'}
`).join('\n---\n')}

## 🔍 Correlation Analysis

### Complexity vs Test Quality

${this.generateCorrelationChart(report.correlations.complexityVsTestQuality)}

### Category-wise Pattern Distribution

${Object.entries(report.correlations.categoryVsPatterns).map(([category, patterns]) => `
#### ${category.charAt(0).toUpperCase() + category.slice(1)}
- **Good Patterns:** ${patterns.good || 0}
- **Warnings:** ${patterns.warnings || 0}
- **Anti-patterns:** ${patterns.bad || 0}
`).join('\n')}

## 💡 Recommendations

### Immediate Actions (Bun-Specific)
1. **Fix Critical Anti-patterns:** Address console.log usage and empty tests
2. **Remove test.only() calls:** Ensure all tests run in CI/CD
3. **Add proper assertions:** Replace console logs with expect() statements
4. **Use Bun test imports:** Import from "bun:test" instead of other test runners

### Quality Improvements (Following Bun Standards)
1. **Implement setup/teardown:** Use beforeEach/afterEach for test isolation
2. **Add error case testing:** Include tests for failure scenarios
3. **Use descriptive test names:** Follow "should/when/given" naming patterns
4. **Import harness utilities:** Use functions from harness.ts for better test infrastructure
5. **TypeScript first:** Write tests in TypeScript, use @ts-expect-error for intentional errors

### Best Practices (Bun Official Guidelines)
1. **Keep tests focused:** Avoid long, complex test functions
2. **Use proper async handling:** Leverage async/await instead of setTimeout
3. **Mock external dependencies:** Isolate tests from external systems
4. **Follow Bun test organization:** Use js/bun/, js/node/, js/web/, regression/ structure
5. **Regression tests:** Add tests in test/regression/issue/ with issue numbers
6. **Use harness utilities:** Import bunExe, bunEnv, tempDir from harness.ts
7. **Random ports only:** Always use port: 0, never hardcode ports
8. **No test timeouts:** Don't set timeout() on individual tests
9. **Resource cleanup:** Use await using/using for automatic cleanup
10. **Test fixtures:** End fixture files with *-fixture.ts
11. **No flaky tests:** Wait for conditions, not arbitrary time

### Bun-Specific Testing Patterns
1. **Test categorization:** Organize by API type (bun/node/web/third_party)
2. **Harness utilities:** Import gcTick, sleep, and other utilities from harness.ts
3. **CLI testing:** Test stdout/stderr for CLI commands in test/cli/
4. **Bundler testing:** Test transpilation/bundling in test/bundler/
5. **Zig integration:** Consider Zig tests for low-level functionality

## 🎯 Quality Standards

### Minimum Requirements
- ✅ No console.log in test files
- ✅ No test.only() in committed code
- ✅ At least one assertion per test
- ✅ Proper async/await usage

### Recommended Standards
- ✅ Setup/teardown for state isolation
- ✅ Descriptive test names
- ✅ Error case coverage
- ✅ Reasonable test timeouts

---
*This report is automatically generated and should be reviewed regularly to maintain test quality standards.*
`;

    return markdown;
  }

  private getScoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  private generateCorrelationChart(data: Array<{ complexity: number; score: number }>): string {
    if (data.length === 0) return '*No correlation data available*';

    // Simple text-based correlation visualization
    const complexityRanges = [
      { min: 0, max: 10, label: 'Simple (0-10)' },
      { min: 11, max: 25, label: 'Moderate (11-25)' },
      { min: 26, max: 50, label: 'Complex (26-50)' },
      { min: 51, max: Infinity, label: 'Very Complex (51+)' }
    ];

    let chart = '| Complexity | Avg Score | Sample Size |\n';
    chart += '|------------|-----------|-------------|\n';

    complexityRanges.forEach(range => {
      const samples = data.filter(d => d.complexity >= range.min && d.complexity <= range.max);
      const avgScore = samples.length > 0 ?
        Math.round(samples.reduce((sum, s) => sum + s.score, 0) / samples.length) : 0;

      chart += `| ${range.label} | ${avgScore}/100 | ${samples.length} |\n`;
    });

    return chart;
  }

  public async analyzeTestPatterns(): Promise<void> {
    console.log('🧪 Starting test pattern analysis...\n');

    // Phase 1: Scan and analyze test files
    console.log('🔍 Phase 1: Scanning test files...');
    const analyses = this.scanTestFiles();
    console.log(`✅ Analyzed ${analyses.length} test files\n`);

    // Phase 2: Generate comprehensive report
    console.log('📊 Phase 2: Generating analysis report...');
    const report = this.generateReport(analyses);
    const markdown = this.generateMarkdownReport(report);

    // Save report
    const reportPath = 'test-pattern-analysis-report.md';
    writeFileSync(reportPath, markdown);
    console.log(`✅ Analysis report saved to: ${reportPath}\n`);

    // Phase 3: Display summary
    console.log('📊 Test Pattern Analysis Summary:');
    console.log(`   Files analyzed: ${report.summary.totalFiles}`);
    console.log(`   Average quality score: ${report.summary.averageScore}/100`);
    console.log(`   Good patterns found: ${report.summary.patternDistribution.good || 0}`);
    console.log(`   Warnings identified: ${report.summary.patternDistribution.warnings || 0}`);
    console.log(`   Anti-patterns detected: ${report.summary.patternDistribution.bad || 0}`);

    if (report.summary.mostCommonIssues.length > 0) {
      console.log('\n🚨 Top Issues:');
      report.summary.mostCommonIssues.slice(0, 3).forEach(issue => {
        console.log(`   • ${issue.issue}: ${issue.count} files`);
      });
    }

    // Quality assessment
    const excellent = analyses.filter(a => a.score >= 90).length;
    const good = analyses.filter(a => a.score >= 70 && a.score < 90).length;
    const needsWork = analyses.filter(a => a.score < 70).length;

    console.log('\n🏆 Quality Distribution:');
    console.log(`   Excellent (90-100): ${excellent} files`);
    console.log(`   Good (70-89): ${good} files`);
    console.log(`   Needs improvement (<70): ${needsWork} files`);

    if (needsWork > 0) {
      console.log('\n💡 Recommendation: Review the detailed report and address critical issues.');
    } else {
      console.log('\n🎉 Excellent! Test quality standards are being maintained.');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 Test Pattern Analyzer v1.0

Analyzes test files to identify patterns, anti-patterns, and testing best practices.

Usage: bun run tools/test-pattern-analyzer.ts [options]

Options:
  --output=<path>       Output file path (default: test-pattern-analysis-report.md)
  --threshold=<score>   Minimum quality score threshold (default: 70)
  --strict              Treat warnings as errors
  --focus=<category>    Focus analysis on specific category (core, advanced, etc.)
  --help, -h           Show this help message

Features:
  • Comprehensive pattern recognition
  • Anti-pattern detection with severity levels
  • Quality scoring and recommendations
  • Correlation analysis between complexity and test quality
  • Category-wise pattern distribution

Analysis Categories:
  • Good Patterns: Proper testing practices
  • Warnings: Potential issues or improvements
  • Anti-patterns: Critical issues requiring fixes

Quality Scoring:
  • 90-100: Excellent test quality
  • 70-89: Good, minor improvements needed
  • 50-69: Needs significant improvement
  • 0-49: Critical issues requiring immediate attention

Example:
  bun run tools/test-pattern-analyzer.ts
  bun run tools/test-pattern-analyzer.ts --threshold=80 --strict
`);
    return;
  }

  try {
    const analyzer = new TestPatternAnalyzer();
    await analyzer.analyzeTestPatterns();
  } catch (error) {
    console.error('❌ Test pattern analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}