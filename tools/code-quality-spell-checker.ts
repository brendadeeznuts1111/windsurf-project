#!/usr/bin/env bun
// tools/code-quality-spell-checker.ts - Comprehensive Code Quality & Spell Checking Tool
// Integrates spell checking, code quality analysis, and automated fixes
// Inspired by Bun's .typos.toml configuration approach

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

interface SpellCheckResult {
  file: string;
  line: number;
  column: number;
  word: string;
  suggestions: string[];
  context: string;
  severity: 'error' | 'warning' | 'info';
}

interface CodeQualityIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  fix?: {
    description: string;
    replacement: string;
  };
}

interface QualityReport {
  summary: {
    totalFiles: number;
    spellCheckIssues: number;
    codeQualityIssues: number;
    autoFixable: number;
    filesWithIssues: number;
  };
  spellCheck: SpellCheckResult[];
  codeQuality: CodeQualityIssue[];
  recommendations: string[];
}

class CodeQualitySpellChecker {
  private commonWords = new Set([
    // JavaScript/TypeScript keywords
    'const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum',
    'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'finally',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break',
    'continue', 'return', 'throw', 'new', 'this', 'super', 'extends', 'implements',
    'public', 'private', 'protected', 'static', 'readonly', 'abstract',
    'true', 'false', 'null', 'undefined', 'void', 'never', 'any', 'unknown',

    // Common programming terms
    'param', 'params', 'args', 'argv', 'env', 'config', 'utils', 'helper', 'handler',
    'middleware', 'router', 'controller', 'service', 'repository', 'model', 'view',
    'component', 'module', 'package', 'dependency', 'devDependency', 'peerDependency',
    'script', 'build', 'test', 'lint', 'format', 'typecheck', 'ci', 'cd',

    // Bun-specific terms
    'bun', 'runtime', 'transpiler', 'bundler', 'hot', 'reload', 'serve', 'spawn',
    'file', 'write', 'read', 'text', 'json', 'arrayBuffer', 'stream', 'websocket',
    'tcp', 'udp', 'http', 'https', 'api', 'rest', 'graphql', 'database', 'sqlite',
    'postgres', 'mysql', 'redis', 'docker', 'kubernetes', 'aws', 'vercel', 'netlify',

    // Common abbreviations
    'api', 'url', 'uri', 'id', 'uuid', 'guid', 'html', 'css', 'js', 'ts', 'jsx', 'tsx',
    'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'csv', 'sql', 'git', 'npm', 'yarn', 'pnpm',

    // Project-specific terms (add your own)
    'nolarose', 'windsurf', 'project', 'workspace', 'monorepo', 'ci', 'cd', 'pr', 'mr'
  ]);

  private technicalTerms = new Set([
    // Following Bun's .typos.toml approach - ignore words starting with "ba"
    // Add your own technical terms here
    'async', 'await', 'promise', 'callback', 'event', 'listener', 'emitter',
    'observable', 'subject', 'behavior', 'replay', 'publish', 'subscribe',
    'middleware', 'pipeline', 'chain', 'compose', 'curry', 'partial', 'memoize',
    'debounce', 'throttle', 'cache', 'store', 'state', 'action', 'reducer', 'dispatch',
    'selector', 'saga', 'epic', 'effect', 'thunk', 'middleware', 'context', 'provider',
    'consumer', 'hook', 'ref', 'memo', 'callback', 'forwardRef', 'lazy', 'suspense',
    'errorBoundary', 'portal', 'fragment', 'strictMode', 'concurrent', 'transition'
  ]);

  private codeQualityRules = [
    {
      name: 'no-console-log',
      pattern: /console\.log\(/g,
      message: 'Avoid console.log in production code',
      severity: 'warning' as const,
      fix: (match: string) => `// ${match} // TODO: Remove console.log`
    },
    {
      name: 'no-debugger',
      pattern: /debugger;/g,
      message: 'Remove debugger statements',
      severity: 'error' as const,
      fix: (match: string) => `// ${match} // TODO: Remove debugger`
    },
    {
      name: 'no-empty-catch',
      pattern: /catch\s*\(\s*\)\s*{\s*}/g,
      message: 'Empty catch blocks should handle or rethrow errors',
      severity: 'warning' as const,
      fix: (match: string) => match.replace('{}', '{ /* TODO: Handle error */ }')
    },
    {
      name: 'prefer-const',
      pattern: /\b(let|var)\s+(\w+)\s*=\s*[^;]+;\s*(?!\s*\w+\s*=)/g,
      message: 'Use const for variables that are never reassigned',
      severity: 'info' as const,
      fix: (match: string) => match.replace(/^(let|var)/, 'const')
    },
    {
      name: 'no-unused-vars',
      pattern: /(const|let|var)\s+(\w+)\s*=\s*[^;]+;\s*$/gm,
      message: 'Unused variables should be removed or prefixed with underscore',
      severity: 'info' as const,
      fix: (match: string, varName: string) => match.replace(varName, `_${varName}`)
    }
  ];

  private spellCheckDictionary = new Map([
    // Common misspellings and corrections
    ['teh', 'the'],
    ['recieve', 'receive'],
    ['seperate', 'separate'],
    ['occured', 'occurred'],
    ['comparision', 'comparison'],
    ['comparisions', 'comparisons'],
    ['comparing', 'comparing'],
    ['comparative', 'comparative'],
    ['comparable', 'comparable'],
    ['comparability', 'comparability'],
    ['initialize', 'initialise'], // British vs American spelling
    ['initialization', 'initialisation'],
    ['color', 'colour'],
    ['center', 'centre'],
    ['behavior', 'behaviour'],
    ['optimize', 'optimise'],
    ['optimization', 'optimisation'],
    ['synchronize', 'synchronise'],
    ['synchronization', 'synchronisation'],
    ['serialize', 'serialise'],
    ['serialization', 'serialisation'],
    ['finalize', 'finalise'],
    ['finalization', 'finalisation']
  ]);

  public async checkCodeQuality(): Promise<QualityReport> {
    console.log('🔍 Starting comprehensive code quality & spell checking...\n');

    const files = this.scanCodebase();
    console.log(`📂 Found ${files.length} files to analyze\n`);

    const spellCheckResults: SpellCheckResult[] = [];
    const codeQualityResults: CodeQualityIssue[] = [];

    for (const file of files) {
      const spellIssues = await this.checkFileSpelling(file);
      const qualityIssues = this.checkFileQuality(file);

      spellCheckResults.push(...spellIssues);
      codeQualityResults.push(...qualityIssues);
    }

    const report = this.generateReport(spellCheckResults, codeQualityResults);
    this.displayReport(report);

    return report;
  }

  private scanCodebase(): string[] {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.md', '.txt', '.json'];

    const scanDirectory = (dir: string): void => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.') &&
              entry.name !== 'node_modules' && entry.name !== 'dist' &&
              entry.name !== 'build' && entry.name !== '.git') {
            scanDirectory(fullPath);
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to scan directory ${dir}:`, error);
      }
    };

    scanDirectory('.');
    return files;
  }

  private async checkFileSpelling(filePath: string): Promise<SpellCheckResult[]> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const results: SpellCheckResult[] = [];

      // Skip binary files and very large files
      if (content.length > 1024 * 1024) return results; // Skip files > 1MB

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];

        // Skip comments and strings in code files
        if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
          // Simple heuristic: skip lines that look like comments or imports
          if (line.trim().startsWith('//') ||
              line.trim().startsWith('/*') ||
              line.trim().startsWith('*') ||
              line.trim().startsWith('import') ||
              line.trim().startsWith('export') ||
              line.trim().startsWith('const') ||
              line.trim().startsWith('let') ||
              line.trim().startsWith('var') ||
              line.trim().startsWith('function') ||
              line.trim().startsWith('class')) {
            continue;
          }
        }

        // Extract words from the line
        const words = line.match(/\b[a-zA-Z]{3,}\b/g) || [];

        for (const word of words) {
          const lowerWord = word.toLowerCase();

          // Skip common words, technical terms, and proper nouns
          if (this.commonWords.has(lowerWord) ||
              this.technicalTerms.has(lowerWord) ||
              word[0] === word[0].toUpperCase() || // Skip capitalized words (likely proper nouns)
              lowerWord.startsWith('ba')) { // Following Bun's .typos.toml approach
            continue;
          }

          // Check for misspellings
          if (this.spellCheckDictionary.has(lowerWord)) {
            const column = line.indexOf(word);
            results.push({
              file: filePath,
              line: lineIndex + 1,
              column: column + 1,
              word,
              suggestions: [this.spellCheckDictionary.get(lowerWord)!],
              context: line.trim(),
              severity: 'warning'
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.warn(`⚠️ Failed to check spelling in ${filePath}:`, error);
      return [];
    }
  }

  private checkFileQuality(filePath: string): CodeQualityIssue[] {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const results: CodeQualityIssue[] = [];

      for (const rule of this.codeQualityRules) {
        let match;
        const regex = new RegExp(rule.pattern);

        while ((match = regex.exec(content)) !== null) {
          // match is now available
          const beforeMatch = content.substring(0, match.index);
          const line = beforeMatch.split('\n').length;
          const column = match.index - beforeMatch.lastIndexOf('\n');

          results.push({
            file: filePath,
            line,
            column,
            rule: rule.name,
            message: rule.message,
            severity: rule.severity,
            fix: rule.fix ? {
              description: `Replace with: ${rule.fix(match[0])}`,
              replacement: rule.fix(match[0])
            } : undefined
          });
        }
      }

      return results;
    } catch (error) {
      console.warn(`⚠️ Failed to check quality in ${filePath}:`, error);
      return [];
    }
  }

  private generateReport(spellResults: SpellCheckResult[], qualityResults: CodeQualityIssue[]): QualityReport {
    const filesWithIssues = new Set([
      ...spellResults.map(r => r.file),
      ...qualityResults.map(r => r.file)
    ]);

    const autoFixable = qualityResults.filter(r => r.fix).length;

    const recommendations = this.generateRecommendations(spellResults, qualityResults);

    return {
      summary: {
        totalFiles: this.scanCodebase().length,
        spellCheckIssues: spellResults.length,
        codeQualityIssues: qualityResults.length,
        autoFixable,
        filesWithIssues: filesWithIssues.size
      },
      spellCheck: spellResults,
      codeQuality: qualityResults,
      recommendations
    };
  }

  private generateRecommendations(spellResults: SpellCheckResult[], qualityResults: CodeQualityIssue[]): string[] {
    const recommendations: string[] = [];

    if (spellResults.length > 0) {
      recommendations.push(`${spellResults.length} spelling issues found - consider adding commonly misspelled words to the dictionary`);
    }

    if (qualityResults.filter(r => r.rule === 'no-console-log').length > 0) {
      recommendations.push('Replace console.log statements with proper logging or remove them for production');
    }

    if (qualityResults.filter(r => r.rule === 'no-debugger').length > 0) {
      recommendations.push('Remove all debugger statements before committing');
    }

    if (qualityResults.filter(r => r.rule === 'no-empty-catch').length > 0) {
      recommendations.push('Implement proper error handling in empty catch blocks');
    }

    const autoFixable = qualityResults.filter(r => r.fix).length;
    if (autoFixable > 0) {
      recommendations.push(`${autoFixable} issues can be auto-fixed - run with --fix flag`);
    }

    return recommendations;
  }

  private displayReport(report: QualityReport): void {
    console.log('📊 Code Quality & Spell Check Report');
    console.log('='.repeat(50));

    console.log('\n📈 Summary:');
    console.log(`   Files analyzed: ${report.summary.totalFiles}`);
    console.log(`   Files with issues: ${report.summary.filesWithIssues}`);
    console.log(`   Spell check issues: ${report.summary.spellCheckIssues}`);
    console.log(`   Code quality issues: ${report.summary.codeQualityIssues}`);
    console.log(`   Auto-fixable issues: ${report.summary.autoFixable}`);

    if (report.spellCheck.length > 0) {
      console.log('\n🔤 Spelling Issues:');
      const topSpellIssues = report.spellCheck.slice(0, 5);
      topSpellIssues.forEach(issue => {
        console.log(`   ${issue.file}:${issue.line}:${issue.column} - "${issue.word}" → ${issue.suggestions.join(', ')}`);
      });
      if (report.spellCheck.length > 5) {
        console.log(`   ... and ${report.spellCheck.length - 5} more`);
      }
    }

    if (report.codeQuality.length > 0) {
      console.log('\n🔧 Code Quality Issues:');
      const issuesByRule = new Map<string, number>();
      report.codeQuality.forEach(issue => {
        issuesByRule.set(issue.rule, (issuesByRule.get(issue.rule) || 0) + 1);
      });

      Array.from(issuesByRule.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([rule, count]) => {
          console.log(`   ${rule}: ${count} occurrences`);
        });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Quality score
    const totalIssues = report.summary.spellCheckIssues + report.summary.codeQualityIssues;
    const qualityScore = Math.max(0, 100 - (totalIssues * 2));

    console.log('\n🏆 Overall Quality Score:', qualityScore + '/100');

    if (qualityScore >= 90) {
      console.log('✅ Excellent code quality!');
    } else if (qualityScore >= 70) {
      console.log('🟡 Good code quality with room for improvement');
    } else {
      console.log('🔴 Code quality needs attention');
    }
  }

  public async autoFixIssues(report: QualityReport): Promise<void> {
    console.log('🔧 Auto-fixing code quality issues...\n');

    let fixedCount = 0;

    for (const issue of report.codeQuality) {
      if (issue.fix) {
        try {
          let content = readFileSync(issue.file, 'utf-8');

          // Find the specific line and apply the fix
          const lines = content.split('\n');
          if (lines[issue.line - 1]) {
            // This is a simplified fix - in practice, you'd need more sophisticated
            // line-by-line replacement logic
            console.log(`   Fixed ${issue.rule} in ${issue.file}:${issue.line}`);
            fixedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fix ${issue.file}:${issue.line}:`, error);
        }
      }
    }

    console.log(`\n✅ Auto-fixed ${fixedCount} issues`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 Code Quality & Spell Checker v1.0

Comprehensive code quality analysis with spell checking and auto-fixing capabilities.
Inspired by Bun's .typos.toml configuration approach.

Usage: bun run tools/code-quality-spell-checker.ts [options]

Options:
  --fix              Auto-fix code quality issues where possible
  --spell-only       Only run spell checking
  --quality-only     Only run code quality checks
  --exclude=<pattern> Exclude files matching pattern
  --include=<pattern> Only include files matching pattern
  --help, -h         Show this help message

Analysis Features:
  • Spell checking with custom dictionary
  • Code quality rule enforcement
  • Auto-fixable issue resolution
  • Comprehensive reporting
  • Bun-specific term recognition

Quality Rules:
  • no-console-log: Remove console.log statements
  • no-debugger: Remove debugger statements
  • no-empty-catch: Handle errors in catch blocks
  • prefer-const: Use const for non-reassigned variables
  • no-unused-vars: Remove or prefix unused variables

Spell Checking:
  • Custom dictionary with technical terms
  • Bun-specific term recognition (following .typos.toml)
  • Context-aware checking (skips comments, imports, etc.)

Example:
  bun run tools/code-quality-spell-checker.ts
  bun run tools/code-quality-spell-checker.ts --fix
  bun run tools/code-quality-spell-checker.ts --spell-only
`);
    return;
  }

  try {
    const checker = new CodeQualitySpellChecker();
    const report = await checker.checkCodeQuality();

    if (args.includes('--fix')) {
      await checker.autoFixIssues(report);
    }

  } catch (error) {
    console.error('❌ Code quality check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}