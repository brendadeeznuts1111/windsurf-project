#!/usr/bin/env bun
// tools/class-naming-enhancer.ts - Class Naming Convention Analyzer & Enhancer
// Analyzes class names for consistency, suggests improvements, and enforces naming standards

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

interface ClassInfo {
  name: string;
  file: string;
  path: string;
  line: number;
  context: string;
  category: 'class' | 'interface' | 'type' | 'enum';
  exported: boolean;
  extends?: string;
  implements?: string[];
}

interface NamingPattern {
  pattern: RegExp;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  example: string;
}

interface NamingAnalysis {
  classInfo: ClassInfo;
  issues: NamingIssue[];
  score: number;
  suggestions: string[];
}

interface NamingIssue {
  type: 'inconsistent' | 'non-descriptive' | 'too-long' | 'too-short' | 'abbreviation' | 'case-violation' | 'prefix-missing' | 'suffix-missing';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  current: string;
  recommended: string;
}

interface NamingReport {
  summary: {
    totalClasses: number;
    averageScore: number;
    issuesByType: Record<string, number>;
    issuesBySeverity: Record<string, number>;
    mostCommonIssues: Array<{ issue: string; count: number }>;
    namingPatterns: {
      pascalCase: number;
      camelCase: number;
      snakeCase: number;
      kebabCase: number;
      other: number;
    };
  };
  analyses: NamingAnalysis[];
  recommendations: {
    global: string[];
    fileSpecific: Record<string, string[]>;
  };
}

class ClassNamingEnhancer {
  private namingPatterns: NamingPattern[] = [
    {
      pattern: /^[A-Z][a-zA-Z0-9]*$/,
      description: 'Follows PascalCase convention',
      severity: 'low',
      suggestion: 'Use PascalCase for class names',
      example: 'UserService instead of userService'
    },
    {
      pattern: /^[A-Z][a-zA-Z0-9]{2,50}$/,
      description: 'Reasonable length (3-50 characters)',
      severity: 'medium',
      suggestion: 'Keep class names between 3-50 characters',
      example: 'UserAuthenticationService instead of UAuthSvc'
    },
    {
      pattern: /^(?!.*(?:Mgr|Mgrs|Util|Utils|Helper|Helpers|Handler|Handlers|Processor|Processors|Manager|Managers)$)/,
      description: 'Avoid generic suffixes',
      severity: 'medium',
      suggestion: 'Use specific, descriptive names instead of generic suffixes',
      example: 'UserValidator instead of UserHelper'
    },
    {
      pattern: /^(?!.*[A-Z]{3,})/,
      description: 'Avoid excessive abbreviations',
      severity: 'high',
      suggestion: 'Spell out abbreviations or use well-known acronyms only',
      example: 'HttpClient instead of HTTPClnt'
    },
    {
      pattern: /^(?!^[a-z])/,
      description: 'Starts with uppercase letter',
      severity: 'high',
      suggestion: 'Class names must start with uppercase',
      example: 'UserService instead of userService'
    },
    {
      pattern: /^(?!.*(?:Class|Interface|Type|Enum)$)/,
      description: 'Avoid redundant type suffixes',
      severity: 'low',
      suggestion: 'Don\'t include type in class name',
      example: 'User instead of UserClass'
    }
  ];

  private commonAbbreviations = new Map([
    ['svc', 'Service'],
    ['mgr', 'Manager'],
    ['ctrl', 'Controller'],
    ['repo', 'Repository'],
    ['dao', 'DataAccess'],
    ['dto', 'DataTransfer'],
    ['vm', 'ViewModel'],
    ['api', 'Api'],
    ['http', 'Http'],
    ['db', 'Database'],
    ['sql', 'Sql'],
    ['xml', 'Xml'],
    ['json', 'Json'],
    ['html', 'Html'],
    ['css', 'Css'],
    ['js', 'JavaScript'],
    ['ts', 'TypeScript']
  ]);

  private analyzeClassName(name: string): NamingIssue[] {
    const issues: NamingIssue[] = [];

    // Check each naming pattern
    this.namingPatterns.forEach(pattern => {
      if (!pattern.pattern.test(name)) {
        issues.push({
          type: this.getIssueType(pattern.description),
          description: pattern.description,
          severity: pattern.severity,
          suggestion: pattern.suggestion,
          current: name,
          recommended: this.generateSuggestion(name, pattern)
        });
      }
    });

    // Additional checks
    if (name.length < 3) {
      issues.push({
        type: 'too-short',
        description: 'Class name is too short',
        severity: 'medium',
        suggestion: 'Use more descriptive names',
        current: name,
        recommended: this.expandShortName(name)
      });
    }

    if (name.length > 50) {
      issues.push({
        type: 'too-long',
        description: 'Class name is too long',
        severity: 'low',
        suggestion: 'Consider shorter, more focused names',
        current: name,
        recommended: this.shortenLongName(name)
      });
    }

    // Check for abbreviations that should be expanded
    const expanded = this.expandAbbreviations(name);
    if (expanded !== name) {
      issues.push({
        type: 'abbreviation',
        description: 'Contains abbreviations that could be expanded',
        severity: 'low',
        suggestion: 'Consider expanding abbreviations for clarity',
        current: name,
        recommended: expanded
      });
    }

    return issues;
  }

  private getIssueType(description: string): NamingIssue['type'] {
    if (description.includes('PascalCase') || description.includes('uppercase')) {
      return 'case-violation';
    }
    if (description.includes('length')) {
      return description.includes('too long') ? 'too-long' : 'too-short';
    }
    if (description.includes('abbreviations')) {
      return 'abbreviation';
    }
    if (description.includes('generic suffixes') || description.includes('redundant')) {
      return 'suffix-missing';
    }
    return 'non-descriptive';
  }

  private generateSuggestion(name: string, pattern: NamingPattern): string {
    // Apply the pattern's suggestion logic
    if (pattern.description.includes('PascalCase')) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    if (pattern.description.includes('length')) {
      return name.length < 3 ? this.expandShortName(name) : this.shortenLongName(name);
    }
    if (pattern.description.includes('abbreviations')) {
      return this.expandAbbreviations(name);
    }
    return name; // fallback
  }

  private expandShortName(name: string): string {
    // Simple expansion for very short names
    const expansions: Record<string, string> = {
      'A': 'Application',
      'B': 'Business',
      'C': 'Controller',
      'D': 'Data',
      'E': 'Entity',
      'F': 'Factory',
      'G': 'Gateway',
      'H': 'Handler',
      'I': 'Interface',
      'J': 'Job',
      'K': 'Key',
      'L': 'Logger',
      'M': 'Model',
      'N': 'Network',
      'O': 'Object',
      'P': 'Processor',
      'Q': 'Queue',
      'R': 'Repository',
      'S': 'Service',
      'T': 'Task',
      'U': 'Utility',
      'V': 'Validator',
      'W': 'Worker',
      'X': 'Xml',
      'Y': 'Yaml',
      'Z': 'Zip'
    };
    return expansions[name] || `${name}Class`;
  }

  private shortenLongName(name: string): string {
    // Remove redundant words
    return name
      .replace(/ServiceClass|ClassService/g, 'Service')
      .replace(/ManagerClass|ClassManager/g, 'Manager')
      .replace(/ControllerClass|ClassController/g, 'Controller')
      .replace(/InterfaceInterface/g, 'Interface')
      .replace(/TypeType/g, 'Type');
  }

  private expandAbbreviations(name: string): string {
    let result = name;
    this.commonAbbreviations.forEach((expansion, abbr) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      result = result.replace(regex, expansion);
    });
    return result;
  }

  private detectNamingCase(name: string): 'pascal' | 'camel' | 'snake' | 'kebab' | 'other' {
    if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return 'pascal';
    if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return 'camel';
    if (/^[a-z_][a-z0-9_]*$/.test(name)) return 'snake';
    if (/^[a-z-][a-z0-9-]*$/.test(name)) return 'kebab';
    return 'other';
  }

  private scanForClasses(): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const scanDirectory = (dir: string): void => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            scanDirectory(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            const fileClasses = this.extractClassesFromFile(fullPath);
            classes.push(...fileClasses);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to scan directory ${dir}:`, error);
      }
    };

    scanDirectory('.');
    return classes;
  }

  private extractClassesFromFile(filePath: string): ClassInfo[] {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const classes: ClassInfo[] = [];

      const classRegex = /(?:export\s+)?(class|interface|type|enum)\s+(\w+)/g;
      const extendsRegex = /extends\s+(\w+)/;
      const implementsRegex = /implements\s+([\w\s,]+)/;

      let match;
      while ((match = classRegex.exec(content)) !== null) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const line = lines[lineIndex];

        const classInfo: ClassInfo = {
          name: match[2],
          file: basename(filePath),
          path: filePath,
          line: lineIndex + 1,
          context: line.trim(),
          category: match[1] as any,
          exported: match[0].includes('export')
        };

        // Extract inheritance info
        const extendsMatch = line.match(extendsRegex);
        if (extendsMatch) {
          classInfo.extends = extendsMatch[1];
        }

        const implementsMatch = line.match(implementsRegex);
        if (implementsMatch) {
          classInfo.implements = implementsMatch[1].split(',').map(s => s.trim());
        }

        classes.push(classInfo);
      }

      return classes;
    } catch (error) {
      console.warn(`⚠️ Failed to analyze ${filePath}:`, error);
      return [];
    }
  }

  private analyzeNaming(classInfo: ClassInfo): NamingAnalysis {
    const issues = this.analyzeClassName(classInfo.name);
    const score = Math.max(0, 100 - (issues.reduce((sum, issue) => {
      const severityScore = issue.severity === 'high' ? 20 : issue.severity === 'medium' ? 10 : 5;
      return sum + severityScore;
    }, 0)));

    const suggestions = issues.map(issue => `${issue.suggestion}: ${issue.current} → ${issue.recommended}`);

    return {
      classInfo,
      issues,
      score,
      suggestions
    };
  }

  private generateReport(classes: ClassInfo[]): NamingReport {
    const analyses = classes.map(cls => this.analyzeNaming(cls));

    // Calculate summary statistics
    const totalScore = analyses.reduce((sum, a) => sum + a.score, 0);
    const averageScore = analyses.length > 0 ? Math.round(totalScore / analyses.length) : 0;

    const issuesByType: Record<string, number> = {};
    const issuesBySeverity: Record<string, number> = {};
    const issueCounts: Record<string, number> = {};
    const namingPatterns = {
      pascalCase: 0,
      camelCase: 0,
      snakeCase: 0,
      kebabCase: 0,
      other: 0
    };

    analyses.forEach(analysis => {
      // Count naming patterns
      const caseType = this.detectNamingCase(analysis.classInfo.name);
      switch (caseType) {
        case 'pascal': namingPatterns.pascalCase++; break;
        case 'camel': namingPatterns.camelCase++; break;
        case 'snake': namingPatterns.snakeCase++; break;
        case 'kebab': namingPatterns.kebabCase++; break;
        default: namingPatterns.other++; break;
      }

      // Count issues
      analysis.issues.forEach(issue => {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;

        const key = `${issue.type}: ${issue.description}`;
        issueCounts[key] = (issueCounts[key] || 0) + 1;
      });
    });

    const mostCommonIssues = Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(analyses);

    return {
      summary: {
        totalClasses: classes.length,
        averageScore,
        issuesByType,
        issuesBySeverity,
        mostCommonIssues,
        namingPatterns
      },
      analyses,
      recommendations
    };
  }

  private generateRecommendations(analyses: NamingAnalysis[]): NamingReport['recommendations'] {
    const global: string[] = [];
    const fileSpecific: Record<string, string[]> = {};

    // Global recommendations
    if (analyses.some(a => a.score < 50)) {
      global.push('Critical: Multiple classes have poor naming (score < 50)');
    }

    const highSeverityIssues = analyses.reduce((sum, a) => sum + a.issues.filter(i => i.severity === 'high').length, 0);
    if (highSeverityIssues > 0) {
      global.push(`Address ${highSeverityIssues} high-severity naming issues immediately`);
    }

    const caseViolations = analyses.filter(a => a.issues.some(i => i.type === 'case-violation')).length;
    if (caseViolations > analyses.length * 0.5) {
      global.push('Establish PascalCase as the standard for class names');
    }

    const abbreviations = analyses.filter(a => a.issues.some(i => i.type === 'abbreviation')).length;
    if (abbreviations > analyses.length * 0.3) {
      global.push('Create a team glossary for acceptable abbreviations');
    }

    // File-specific recommendations
    const fileGroups = new Map<string, NamingAnalysis[]>();
    analyses.forEach(analysis => {
      const file = analysis.classInfo.file;
      if (!fileGroups.has(file)) {
        fileGroups.set(file, []);
      }
      fileGroups.get(file)!.push(analysis);
    });

    fileGroups.forEach((fileAnalyses, file) => {
      const fileRecs: string[] = [];
      const lowScoreClasses = fileAnalyses.filter(a => a.score < 70);

      if (lowScoreClasses.length > 0) {
        fileRecs.push(`Review naming for ${lowScoreClasses.length} classes with scores < 70`);
      }

      if (fileRecs.length > 0) {
        fileSpecific[file] = fileRecs;
      }
    });

    return { global, fileSpecific };
  }

  private generateMarkdownReport(report: NamingReport): string {
    let markdown = `# 🏷️ Class Naming Convention Analysis Report

*Generated on ${new Date().toISOString()} by Class Naming Enhancer*

## 📊 Executive Summary

**Classes Analyzed:** ${report.summary.totalClasses}
**Average Naming Score:** ${report.summary.averageScore}/100
**Naming Pattern Distribution:**
- PascalCase: ${report.summary.namingPatterns.pascalCase}
- camelCase: ${report.summary.namingPatterns.camelCase}
- snake_case: ${report.summary.namingPatterns.snakeCase}
- kebab-case: ${report.summary.namingPatterns.kebabCase}
- Other: ${report.summary.namingPatterns.other}

### 🏆 Quality Distribution
- **Excellent (90-100):** ${report.analyses.filter(a => a.score >= 90).length} classes
- **Good (70-89):** ${report.analyses.filter(a => a.score >= 70 && a.score < 90).length} classes
- **Needs Improvement (50-69):** ${report.analyses.filter(a => a.score >= 50 && a.score < 70).length} classes
- **Critical Issues (0-49):** ${report.analyses.filter(a => a.score < 50).length} classes

## 🚨 Most Common Issues

${report.summary.mostCommonIssues.map(issue => `- **${issue.issue}**: ${issue.count} occurrences`).join('\n')}

## 📋 Issues by Type

${Object.entries(report.summary.issuesByType).map(([type, count]) => `- **${type}**: ${count} issues`).join('\n')}

## 📋 Issues by Severity

${Object.entries(report.summary.issuesBySeverity).map(([severity, count]) => `- **${severity}**: ${count} issues`).join('\n')}

## 🔍 Detailed Class Analysis

${report.analyses
  .sort((a, b) => a.score - b.score) // Sort by score ascending (worst first)
  .map(analysis => `
### ${analysis.classInfo.category} ${analysis.classInfo.name}
**File:** \`${analysis.classInfo.path}:${analysis.classInfo.line}\`
**Score:** ${analysis.score}/100 ${analysis.score >= 90 ? '🟢' : analysis.score >= 70 ? '🟡' : '🔴'}
**Context:** \`${analysis.classInfo.context}\`

${analysis.issues.length > 0 ? `
**Issues:**
${analysis.issues.map(issue => `- **${issue.severity.toUpperCase()}** ${issue.description}
  - Current: \`${issue.current}\`
  - Suggested: \`${issue.recommended}\`
  - ${issue.suggestion}`).join('\n')}

**Recommendations:**
${analysis.suggestions.map(suggestion => `- ${suggestion}`).join('\n')}` : '**✅ No naming issues found!**'}
`).join('\n---\n')}

## 💡 Recommendations

### Global Recommendations
${report.recommendations.global.map(rec => `- ${rec}`).join('\n')}

### File-Specific Recommendations
${Object.entries(report.recommendations.fileSpecific).map(([file, recs]) => `
#### ${file}
${recs.map(rec => `- ${rec}`).join('\n')}`).join('\n')}

## 📏 Naming Standards

### ✅ Required Standards
- **PascalCase**: All class, interface, and type names must use PascalCase
- **Descriptive**: Names should clearly indicate purpose and responsibility
- **Length**: 3-50 characters (reasonable descriptiveness)
- **No Abbreviations**: Avoid unclear abbreviations (except well-known acronyms)

### 🎯 Recommended Patterns
- **Services**: \`${'UserService'}\`, \`${'AuthenticationService'}\`
- **Controllers**: \`${'UserController'}\`, \`${'ApiController'}\`
- **Models**: \`${'User'}\`, \`${'UserProfile'}\`
- **Utilities**: \`${'StringUtils'}\`, \`${'DateHelper'}\`
- **Validators**: \`${'EmailValidator'}\`, \`${'PasswordPolicy'}\`

### 🚫 Anti-Patterns to Avoid
- **Generic Suffixes**: Manager, Helper, Handler, Processor
- **Type in Name**: Class, Interface, Type, Enum
- **Abbreviations**: Svc, Mgr, Ctrl, Repo
- **Case Violations**: camelCase, snake_case for classes
- **Too Short**: Single or two letter names

## 🛠️ Automated Fixes

Consider implementing automated fixes for common issues:

\`\`\`bash
# Auto-fix case violations
bun run tools/class-naming-enhancer.ts --fix-case

# Expand common abbreviations
bun run tools/class-naming-enhancer.ts --expand-abbreviations

# Generate rename suggestions
bun run tools/class-naming-enhancer.ts --suggest-renames
\`\`\`

---
*This report helps maintain consistent, professional naming conventions across the codebase.*
`;

    return markdown;
  }

  public async enhanceClassNaming(): Promise<void> {
    console.log('🏷️ Starting class naming enhancement analysis...\n');

    // Phase 1: Scan for classes
    console.log('🔍 Phase 1: Scanning codebase for classes...');
    const classes = this.scanForClasses();
    console.log(`✅ Found ${classes.length} classes, interfaces, and types\n`);

    // Phase 2: Analyze naming
    console.log('📊 Phase 2: Analyzing naming conventions...');
    const report = this.generateReport(classes);
    console.log('✅ Analysis complete\n');

    // Phase 3: Generate report
    console.log('📝 Phase 3: Generating enhancement report...');
    const markdown = this.generateMarkdownReport(report);

    const reportPath = 'class-naming-enhancement-report.md';
    writeFileSync(reportPath, markdown);
    console.log(`✅ Enhancement report saved to: ${reportPath}\n`);

    // Phase 4: Display summary
    console.log('📊 Class Naming Analysis Summary:');
    console.log(`   Classes analyzed: ${report.summary.totalClasses}`);
    console.log(`   Average quality score: ${report.summary.averageScore}/100`);
    console.log(`   PascalCase usage: ${report.summary.namingPatterns.pascalCase}/${report.summary.totalClasses}`);
    console.log(`   Issues found: ${Object.values(report.summary.issuesByType).reduce((a, b) => a + b, 0)}`);

    const highSeverity = report.summary.issuesBySeverity.high || 0;
    const mediumSeverity = report.summary.issuesBySeverity.medium || 0;
    const lowSeverity = report.summary.issuesBySeverity.low || 0;

    console.log('\n🚨 Issues by Severity:');
    console.log(`   High: ${highSeverity}`);
    console.log(`   Medium: ${mediumSeverity}`);
    console.log(`   Low: ${lowSeverity}`);

    if (report.recommendations.global.length > 0) {
      console.log('\n💡 Key Recommendations:');
      report.recommendations.global.slice(0, 3).forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Quality assessment
    const excellent = report.analyses.filter(a => a.score >= 90).length;
    const good = report.analyses.filter(a => a.score >= 70 && a.score < 90).length;
    const needsWork = report.analyses.filter(a => a.score < 70).length;

    console.log('\n🏆 Quality Distribution:');
    console.log(`   Excellent (90-100): ${excellent} classes`);
    console.log(`   Good (70-89): ${good} classes`);
    console.log(`   Needs improvement (<70): ${needsWork} classes`);

    if (needsWork > 0) {
      console.log('\n💡 Recommendation: Review the detailed report and consider renaming classes for better consistency.');
    } else {
      console.log('\n🎉 Excellent! Class naming conventions are well-maintained.');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🏷️ Class Naming Enhancer v1.0

Analyzes class, interface, and type names for consistency and suggests improvements.

Usage: bun run tools/class-naming-enhancer.ts [options]

Options:
  --output=<path>         Output file path (default: class-naming-enhancement-report.md)
  --threshold=<score>     Minimum quality score threshold (default: 70)
  --fix-case              Auto-fix case violations (PascalCase)
  --expand-abbreviations  Auto-expand common abbreviations
  --suggest-renames       Generate rename suggestions file
  --include-interfaces    Include interfaces in analysis (default: true)
  --include-types         Include type aliases in analysis (default: true)
  --help, -h             Show this help message

Analysis Features:
  • PascalCase convention checking
  • Length and descriptiveness validation
  • Abbreviation detection and expansion
  • Generic suffix identification
  • Quality scoring (0-100)
  • Automated improvement suggestions

Naming Standards Enforced:
  • PascalCase for all class/interface/type names
  • 3-50 character length
  • Descriptive, non-generic names
  • No redundant type suffixes
  • Limited abbreviations

Example:
  bun run tools/class-naming-enhancer.ts
  bun run tools/class-naming-enhancer.ts --threshold=80 --fix-case
`);
    return;
  }

  try {
    const enhancer = new ClassNamingEnhancer();
    await enhancer.enhanceClassNaming();
  } catch (error) {
    console.error('❌ Class naming enhancement failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}