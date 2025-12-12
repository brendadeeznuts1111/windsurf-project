#!/usr/bin/env bun
// tools/bun-catalog-generator.ts - Enhanced Catalog Generator with Advanced Metadata
// Generates comprehensive catalogs with difficulty levels, learning paths, platform support, and performance data

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname, basename, dirname } from 'path';

interface ExampleMetadata {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  platforms: string[];
  tags: string[];
  learningPath?: string[];
  prerequisites?: string[];
  estimatedTime: string;
  performanceData?: {
    opsPerSecond?: number;
    memoryUsage?: string;
    startupTime?: string;
    benchmarkDate?: string;
  };
  crossReferences?: string[];
  relatedExamples?: string[];
  bunVersion: string;
  lastUpdated: string;
}

interface CatalogEntry {
  file: string;
  path: string;
  metadata: ExampleMetadata;
  content?: string;
}

interface CatalogStats {
  totalExamples: number;
  categories: Record<string, number>;
  difficulties: Record<string, number>;
  platforms: Record<string, number>;
  tags: Record<string, number>;
  averagePerformance?: {
    opsPerSecond: number;
    memoryUsage: string;
  };
}

interface LearningPath {
  name: string;
  description: string;
  difficulty: string;
  estimatedDuration: string;
  examples: string[];
  prerequisites?: string[];
  outcomes: string[];
}

class EnhancedCatalogGenerator {
  private examplesDir = 'examples';
  private benchmarksDir = 'benchmarks';
  private catalog: CatalogEntry[] = [];
  private learningPaths: LearningPath[] = [];

  constructor() {
    this.initializeLearningPaths();
  }

  private initializeLearningPaths(): void {
    this.learningPaths = [
      {
        name: "Bun Fundamentals",
        description: "Master the core Bun runtime features and APIs",
        difficulty: "beginner",
        estimatedDuration: "2-3 hours",
        examples: [
          "core/bun-file-operations.ts",
          "core/bun-serve-basics.ts",
          "core/bun-spawn-processes.ts"
        ],
        outcomes: [
          "Understand Bun's native APIs",
          "File operations with Bun.file()",
          "Basic HTTP serving with Bun.serve()",
          "Process spawning with Bun.spawn()"
        ]
      },
      {
        name: "Performance Optimization",
        description: "Learn to write high-performance Bun applications",
        difficulty: "intermediate",
        estimatedDuration: "4-5 hours",
        examples: [
          "benchmarks/bun-performance-benchmark-comprehensive.ts",
          "advanced/performance/bun-memory-optimization.ts",
          "advanced/performance/bun-concurrent-processing.ts"
        ],
        prerequisites: ["Bun Fundamentals"],
        outcomes: [
          "Performance benchmarking techniques",
          "Memory optimization strategies",
          "Concurrent processing patterns",
          "Identifying performance bottlenecks"
        ]
      },
      {
        name: "Enterprise Patterns",
        description: "Advanced patterns for production Bun applications",
        difficulty: "advanced",
        estimatedDuration: "6-8 hours",
        examples: [
          "deployment/blue-green-manager.ts",
          "advanced/workspaces/bun-catalogs-advanced.ts",
          "security/bun-security-hardening.ts"
        ],
        prerequisites: ["Performance Optimization"],
        outcomes: [
          "Blue-green deployment orchestration",
          "Advanced catalog management",
          "Security hardening techniques",
          "Production deployment strategies"
        ]
      }
    ];
  }

  private extractMetadataFromFile(filePath: string): ExampleMetadata | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Extract metadata from comments at the top of the file
      let inMetadataBlock = false;
      let metadataLines: string[] = [];

      for (const line of lines) {
        if (line.trim().startsWith('// @metadata')) {
          inMetadataBlock = true;
          continue;
        }

        if (inMetadataBlock) {
          if (line.trim().startsWith('// @end-metadata')) {
            break;
          }
          metadataLines.push(line.replace(/^\/\/\s*/, ''));
        }
      }

      if (metadataLines.length > 0) {
        try {
          const parsedMetadata = JSON.parse(metadataLines.join('\n'));
          return this.validateAndEnhanceMetadata(parsedMetadata, filePath);
        } catch (error) {
          console.warn(`⚠️ Failed to parse metadata in ${filePath}:`, error);
        }
      }

      // Fallback: generate metadata from file content and path
      return this.generateMetadataFromContent(filePath, content);

    } catch (error) {
      console.warn(`⚠️ Failed to read metadata from ${filePath}:`, error);
      return null;
    }
  }

  private validateAndEnhanceMetadata(metadata: any, filePath: string): ExampleMetadata {
    const enhanced: ExampleMetadata = {
      title: metadata.title || basename(filePath, extname(filePath)),
      description: metadata.description || 'Bun runtime example',
      category: metadata.category || this.inferCategoryFromPath(filePath),
      difficulty: metadata.difficulty || 'intermediate',
      platforms: metadata.platforms || ['macOS', 'Linux', 'Windows'],
      tags: metadata.tags || [],
      estimatedTime: metadata.estimatedTime || '15 minutes',
      bunVersion: metadata.bunVersion || '>=1.3.0',
      lastUpdated: metadata.lastUpdated || new Date().toISOString().split('T')[0],
      learningPath: metadata.learningPath,
      prerequisites: metadata.prerequisites,
      crossReferences: metadata.crossReferences,
      relatedExamples: metadata.relatedExamples,
      performanceData: metadata.performanceData
    };

    return enhanced;
  }

  private generateMetadataFromContent(filePath: string, content: string): ExampleMetadata {
    const fileName = basename(filePath, extname(filePath));
    const category = this.inferCategoryFromPath(filePath);

    // Extract title from first comment or filename
    const firstLine = content.split('\n')[0];
    const title = firstLine.startsWith('//') ?
      firstLine.replace(/^\/\/\s*/, '').replace(/\s*-\s*.*$/, '') :
      fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Infer difficulty from content complexity
    const difficulty = this.inferDifficultyFromContent(content);

    // Extract tags from imports and function names
    const tags = this.extractTagsFromContent(content);

    return {
      title,
      description: `${category} example demonstrating Bun runtime capabilities`,
      category,
      difficulty,
      platforms: ['macOS', 'Linux', 'Windows'],
      tags,
      estimatedTime: difficulty === 'beginner' ? '10 minutes' :
                    difficulty === 'intermediate' ? '20 minutes' :
                    difficulty === 'advanced' ? '45 minutes' : '60 minutes',
      bunVersion: '>=1.3.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }

  private inferCategoryFromPath(filePath: string): string {
    const pathParts = dirname(filePath).split('/');
    const examplesIndex = pathParts.indexOf('examples');

    if (examplesIndex !== -1 && examplesIndex + 1 < pathParts.length) {
      const category = pathParts[examplesIndex + 1];
      return category.charAt(0).toUpperCase() + category.slice(1);
    }

    return 'General';
  }

  private inferDifficultyFromContent(content: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const lines = content.split('\n').length;
    const complexityIndicators = [
      /async|await/g,
      /Promise|async function/g,
      /class|interface/g,
      /import.*from/g,
      /Bun\.|process\.|fs\.|path\./g
    ];

    let complexityScore = 0;
    complexityIndicators.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexityScore += matches.length;
    });

    if (lines < 50 && complexityScore < 5) return 'beginner';
    if (lines < 150 && complexityScore < 15) return 'intermediate';
    if (lines < 300 && complexityScore < 30) return 'advanced';
    return 'expert';
  }

  private extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];

    // Extract Bun APIs used
    const bunApis = content.match(/Bun\.\w+/g);
    if (bunApis) {
      bunApis.forEach(api => {
        const apiName = api.replace('Bun.', '');
        tags.push(`bun-${apiName.toLowerCase()}`);
      });
    }

    // Extract common patterns
    if (content.includes('async')) tags.push('async');
    if (content.includes('class')) tags.push('oop');
    if (content.includes('benchmark') || content.includes('performance')) tags.push('performance');
    if (content.includes('test') || content.includes('assert')) tags.push('testing');
    if (content.includes('http') || content.includes('serve')) tags.push('http');
    if (content.includes('file') || content.includes('fs')) tags.push('filesystem');

    return [...new Set(tags)]; // Remove duplicates
  }

  private async loadPerformanceData(): Promise<void> {
    try {
      // First try to get real-time data from performance regression tracker
      const realTimeData = await this.loadRealTimePerformanceData();

      if (realTimeData && realTimeData.length > 0) {
        console.log(`📊 Loaded ${realTimeData.length} real-time performance metrics`);
        this.integrateRealTimeData(realTimeData);
        return;
      }

      // Fallback to parsing benchmark files
      console.log('📊 Falling back to benchmark file parsing...');
      const benchmarkFiles = readdirSync(this.benchmarksDir)
        .filter(file => file.endsWith('.test.ts') || file.endsWith('.benchmark.test.ts'));

      for (const benchmarkFile of benchmarkFiles) {
        const benchmarkPath = join(this.benchmarksDir, benchmarkFile);
        const content = readFileSync(benchmarkPath, 'utf-8');

        // Extract performance metrics from benchmark files
        const opsMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:ops\/sec|operations\/second)/i);
        const memoryMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:MB|KB)/i);

        if (opsMatch || memoryMatch) {
          // Associate performance data with related examples
          const relatedExamples = this.findRelatedExamples(benchmarkFile);

          relatedExamples.forEach(examplePath => {
            const entry = this.catalog.find(e => e.path === examplePath);
            if (entry) {
              entry.metadata.performanceData = {
                opsPerSecond: opsMatch ? parseFloat(opsMatch[1]) : undefined,
                memoryUsage: memoryMatch ? memoryMatch[0] : undefined,
                benchmarkDate: new Date().toISOString().split('T')[0]
              };
            }
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load performance data:', error);
    }
  }

  private async loadRealTimePerformanceData(): Promise<any[]> {
    try {
      // Check if performance baselines exist
      if (!existsSync('performance-baselines.json')) {
        return [];
      }

      const baselinesContent = readFileSync('performance-baselines.json', 'utf-8');
      const baselinesData = JSON.parse(baselinesContent);

      const realTimeMetrics: any[] = [];

      // Extract latest performance data from baselines
      for (const baseline of baselinesData.baselines) {
        if (baseline.history && baseline.history.length > 0) {
          const latestMetric = baseline.history[baseline.history.length - 1];

          realTimeMetrics.push({
            metric: baseline.metric,
            value: latestMetric.value,
            unit: this.getUnitFromMetric(baseline.metric),
            timestamp: new Date(latestMetric.timestamp),
            benchmark: latestMetric.benchmark || 'performance-tracker',
            platform: latestMetric.platform
          });
        }
      }

      return realTimeMetrics;
    } catch (error) {
      console.warn('⚠️ Failed to load real-time performance data:', error);
      return [];
    }
  }

  private getUnitFromMetric(metric: string): string {
    if (metric.includes('per-second') || metric.includes('ops')) return 'ops/sec';
    if (metric.includes('memory') || metric.includes('mb')) return 'MB';
    if (metric.includes('time') || metric.includes('ms')) return 'ms';
    return 'units';
  }

  private integrateRealTimeData(realTimeMetrics: any[]): void {
    // Map performance metrics to examples
    const metricMappings: Record<string, string[]> = {
      'file-operations-per-second': ['core/file-system-advanced.ts', 'core/bun-file-operations.ts'],
      'uuid-generation-per-second': ['core/bun-file-operations.ts'],
      'table-rendering-per-second': ['core/bun-serve-basics.ts'],
      'toml-parsing-per-second': ['core/bun-file-operations.ts'],
      'deep-equality-comparison-per-second': ['core/bun-file-operations.ts'],
      'sha256-hashing-per-second': ['core/bun-file-operations.ts'],
      'memory-usage-mb': ['core/bun-serve-advanced.ts', 'deployment/blue-green-manager.ts'],
      'startup-time-ms': ['core/bun-serve-basics.ts', 'core/bun-serve-advanced.ts']
    };

    realTimeMetrics.forEach(metric => {
      const relatedExamples = metricMappings[metric.metric] || this.findRelatedExamples(metric.benchmark);

      relatedExamples.forEach(examplePath => {
        const entry = this.catalog.find(e => e.path === examplePath);
        if (entry) {
          if (!entry.metadata.performanceData) {
            entry.metadata.performanceData = {};
          }

          // Map metric types to performance data fields
          if (metric.metric.includes('per-second') || metric.metric.includes('ops')) {
            entry.metadata.performanceData.opsPerSecond = metric.value;
          } else if (metric.metric.includes('memory') || metric.metric.includes('mb')) {
            entry.metadata.performanceData.memoryUsage = `${metric.value} ${metric.unit}`;
          } else if (metric.metric.includes('time') || metric.metric.includes('ms')) {
            entry.metadata.performanceData.startupTime = `${metric.value}${metric.unit}`;
          }

          entry.metadata.performanceData.benchmarkDate = metric.timestamp.toISOString().split('T')[0];
        }
      });
    });
  }

  private findRelatedExamples(benchmarkFile: string): string[] {
    const related: string[] = [];
    const benchmarkName = benchmarkFile.replace(/\.benchmark\.test\.ts$|\.test\.ts$/, '');

    // Find examples that match the benchmark name
    this.catalog.forEach(entry => {
      if (entry.metadata.title.toLowerCase().includes(benchmarkName.toLowerCase()) ||
          benchmarkName.toLowerCase().includes(entry.metadata.title.toLowerCase())) {
        related.push(entry.path);
      }
    });

    return related;
  }

  private scanExamplesDirectory(): void {
    const scanDirectory = (dir: string, basePath = ''): void => {
      try {
        const entries = readdirSync(dir);

        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const relativePath = join(basePath, entry);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath, relativePath);
          } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
            const metadata = this.extractMetadataFromFile(fullPath);
            if (metadata) {
              this.catalog.push({
                file: entry,
                path: relativePath,
                metadata
              });
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to scan directory ${dir}:`, error);
      }
    };

    scanDirectory(this.examplesDir);
  }

  private generateCrossReferences(): void {
    // Create cross-references based on tags and categories
    const tagMap = new Map<string, CatalogEntry[]>();
    const categoryMap = new Map<string, CatalogEntry[]>();

    this.catalog.forEach(entry => {
      // Build tag map
      entry.metadata.tags.forEach(tag => {
        if (!tagMap.has(tag)) tagMap.set(tag, []);
        tagMap.get(tag)!.push(entry);
      });

      // Build category map
      if (!categoryMap.has(entry.metadata.category)) {
        categoryMap.set(entry.metadata.category, []);
      }
      categoryMap.get(entry.metadata.category)!.push(entry);
    });

    // Add cross-references to each entry
    this.catalog.forEach(entry => {
      const crossRefs: string[] = [];
      const related: string[] = [];

      // Find related examples by shared tags
      entry.metadata.tags.forEach(tag => {
        const relatedEntries = tagMap.get(tag) || [];
        relatedEntries.forEach(relatedEntry => {
          if (relatedEntry.path !== entry.path) {
            related.push(relatedEntry.path);
          }
        });
      });

      // Find examples in same category
      const categoryEntries = categoryMap.get(entry.metadata.category) || [];
      categoryEntries.forEach(catEntry => {
        if (catEntry.path !== entry.path) {
          crossRefs.push(catEntry.path);
        }
      });

      entry.metadata.crossReferences = [...new Set(crossRefs)];
      entry.metadata.relatedExamples = [...new Set(related)].slice(0, 5); // Limit to 5
    });
  }

  private assignLearningPaths(): void {
    this.catalog.forEach(entry => {
      // Assign learning paths based on category and difficulty
      const matchingPaths = this.learningPaths.filter(path =>
        path.examples.some(example => entry.path.includes(example.split('/').pop() || ''))
      );

      if (matchingPaths.length > 0) {
        entry.metadata.learningPath = matchingPaths.map(p => p.name);
        entry.metadata.prerequisites = matchingPaths[0].prerequisites;
      }
    });
  }

  private generateStats(): CatalogStats {
    const stats: CatalogStats = {
      totalExamples: this.catalog.length,
      categories: {},
      difficulties: {},
      platforms: {},
      tags: {}
    };

    this.catalog.forEach(entry => {
      // Count categories
      stats.categories[entry.metadata.category] =
        (stats.categories[entry.metadata.category] || 0) + 1;

      // Count difficulties
      stats.difficulties[entry.metadata.difficulty] =
        (stats.difficulties[entry.metadata.difficulty] || 0) + 1;

      // Count platforms
      entry.metadata.platforms.forEach(platform => {
        stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
      });

      // Count tags
      entry.metadata.tags.forEach(tag => {
        stats.tags[tag] = (stats.tags[tag] || 0) + 1;
      });
    });

    // Calculate average performance
    const performanceEntries = this.catalog.filter(e => e.metadata.performanceData?.opsPerSecond);
    if (performanceEntries.length > 0) {
      const totalOps = performanceEntries.reduce((sum, e) => sum + (e.metadata.performanceData?.opsPerSecond || 0), 0);
      stats.averagePerformance = {
        opsPerSecond: Math.round(totalOps / performanceEntries.length),
        memoryUsage: 'Varies by example'
      };
    }

    return stats;
  }

  private generateMarkdownCatalog(): string {
    const stats = this.generateStats();

    let markdown = '# 🚀 Enhanced Bun Examples Catalog\n\n';
    markdown += `*Generated on ${new Date().toISOString()} by Enhanced Catalog Generator v2.0*\n\n`;

    // Executive Summary
    markdown += '## 📊 Executive Summary\n\n';
    markdown += '| Metric | Value |\n';
    markdown += '|--------|-------|\n';
    markdown += `| Total Examples | ${stats.totalExamples} |\n`;
    markdown += `| Categories | ${Object.keys(stats.categories).length} |\n`;
    markdown += `| Difficulty Levels | ${Object.keys(stats.difficulties).length} |\n`;
    markdown += `| Platform Support | ${Object.keys(stats.platforms).length} |\n`;
    markdown += `| Technology Tags | ${Object.keys(stats.tags).length} |\n`;

    if (stats.averagePerformance) {
      markdown += `| Avg Performance | ${stats.averagePerformance.opsPerSecond} ops/sec |\n`;
    }
    markdown += '\n';

    // Learning Paths
    markdown += '## 🛣️ Learning Paths\n\n';
    this.learningPaths.forEach(path => {
      markdown += `### ${path.name}\n`;
      markdown += `**Difficulty**: ${path.difficulty} | **Duration**: ${path.estimatedDuration}\n\n`;
      markdown += `${path.description}\n\n`;

      if (path.prerequisites?.length) {
        markdown += '**Prerequisites:**\n';
        path.prerequisites.forEach(prereq => markdown += `- ${prereq}\n`);
        markdown += '\n';
      }

      markdown += '**Examples in this path:**\n';
      path.examples.forEach(example => {
        const entry = this.catalog.find(e => e.path === example);
        if (entry) {
          markdown += `- [${entry.metadata.title}](${entry.path}) - ${entry.metadata.estimatedTime}\n`;
        }
      });
      markdown += '\n';

      markdown += '**Learning Outcomes:**\n';
      path.outcomes.forEach(outcome => markdown += `- ${outcome}\n`);
      markdown += '\n---\n\n';
    });

    // Examples by Category
    markdown += '## 📚 Examples by Category\n\n';

    const categories = Object.keys(stats.categories).sort();
    categories.forEach(category => {
      markdown += `### ${category} (${stats.categories[category]} examples)\n\n`;

      const categoryExamples = this.catalog
        .filter(e => e.metadata.category === category)
        .sort((a, b) => {
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
          return difficultyOrder[a.metadata.difficulty] - difficultyOrder[b.metadata.difficulty];
        });

      categoryExamples.forEach(example => {
        markdown += `#### ${this.getDifficultyEmoji(example.metadata.difficulty)} ${example.metadata.title}\n\n`;
        markdown += `${example.metadata.description}\n\n`;

        markdown += `**Difficulty**: ${example.metadata.difficulty} | **Time**: ${example.metadata.estimatedTime} | **Bun**: ${example.metadata.bunVersion}\n\n`;

        if (example.metadata.tags.length > 0) {
          markdown += `**Tags**: ${example.metadata.tags.map(tag => `\`${tag}\``).join(', ')}\n\n`;
        }

        if (example.metadata.platforms.length > 0) {
          markdown += `**Platforms**: ${example.metadata.platforms.join(', ')}\n\n`;
        }

        if (example.metadata.performanceData) {
          markdown += '**Performance Data:**\n';
          if (example.metadata.performanceData.opsPerSecond) {
            markdown += `- Operations/sec: ${example.metadata.performanceData.opsPerSecond.toLocaleString()}\n`;
          }
          if (example.metadata.performanceData.memoryUsage) {
            markdown += `- Memory usage: ${example.metadata.performanceData.memoryUsage}\n`;
          }
          markdown += '\n';
        }

        if (example.metadata.learningPath?.length) {
          markdown += `**Learning Path**: ${example.metadata.learningPath.join(', ')}\n\n`;
        }

        if (example.metadata.prerequisites?.length) {
          markdown += `**Prerequisites**: ${example.metadata.prerequisites.join(', ')}\n\n`;
        }

        markdown += `**File**: [\`${example.path}\`](${example.path})\n\n`;

        if (example.metadata.crossReferences?.length) {
          markdown += '**Cross-references:**\n';
          example.metadata.crossReferences.forEach(ref => {
            const refEntry = this.catalog.find(e => e.path === ref);
            if (refEntry) {
              markdown += `- [${refEntry.metadata.title}](${ref})\n`;
            }
          });
          markdown += '\n';
        }

        if (example.metadata.relatedExamples?.length) {
          markdown += '**Related examples:**\n';
          example.metadata.relatedExamples.forEach(ref => {
            const refEntry = this.catalog.find(e => e.path === ref);
            if (refEntry) {
              markdown += `- [${refEntry.metadata.title}](${ref})\n`;
            }
          });
          markdown += '\n';
        }

        markdown += '---\n\n';
      });
    });

    // Statistics Details
    markdown += '## 📈 Detailed Statistics\n\n';

    markdown += '### Difficulty Distribution\n\n';
    Object.entries(stats.difficulties).forEach(([difficulty, count]) => {
      const percentage = Math.round((count / stats.totalExamples) * 100);
      markdown += `- ${this.getDifficultyEmoji(difficulty as any)} ${difficulty}: ${count} examples (${percentage}%)\n`;
    });
    markdown += '\n';

    markdown += '### Platform Support\n\n';
    Object.entries(stats.platforms).forEach(([platform, count]) => {
      const percentage = Math.round((count / stats.totalExamples) * 100);
      markdown += `- ${platform}: ${count} examples (${percentage}%)\n`;
    });
    markdown += '\n';

    markdown += '### Popular Tags\n\n';
    Object.entries(stats.tags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .forEach(([tag, count]) => {
        markdown += `- \`${tag}\`: ${count} examples\n`;
      });
    markdown += '\n';

    return markdown;
  }

  private getDifficultyEmoji(difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'): string {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🟠';
      case 'expert': return '🔴';
    }
  }

  public async generateCatalog(): Promise<void> {
    console.log('🚀 Generating enhanced Bun examples catalog...\n');

    // Phase 1: Scan examples directory
    console.log('📂 Scanning examples directory...');
    this.scanExamplesDirectory();
    console.log(`✅ Found ${this.catalog.length} examples\n`);

    // Phase 2: Load performance data
    console.log('📊 Loading performance benchmark data...');
    await this.loadPerformanceData();
    console.log('✅ Performance data integrated\n');

    // Phase 3: Generate cross-references
    console.log('🔗 Generating cross-references...');
    this.generateCrossReferences();
    console.log('✅ Cross-references generated\n');

    // Phase 4: Assign learning paths
    console.log('🛣️ Assigning learning paths...');
    this.assignLearningPaths();
    console.log('✅ Learning paths assigned\n');

    // Phase 5: Generate catalog
    console.log('📝 Generating catalog markdown...');
    const markdown = this.generateMarkdownCatalog();

    // Save catalog
    const outputPath = 'examples/ENHANCED_EXAMPLES_CATALOG_v2.md';
    writeFileSync(outputPath, markdown);

    console.log(`✅ Enhanced catalog generated successfully!`);
    console.log(`📄 Saved to: ${outputPath}`);

    // Display summary
    const stats = this.generateStats();
    console.log('\n📊 Catalog Summary:');
    console.log(`   Total examples: ${stats.totalExamples}`);
    console.log(`   Categories: ${Object.keys(stats.categories).length}`);
    console.log(`   Learning paths: ${this.learningPaths.length}`);
    console.log(`   Performance tracked: ${this.catalog.filter(e => e.metadata.performanceData).length} examples`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Enhanced Bun Catalog Generator v2.0

Usage: bun run tools/bun-catalog-generator.ts [options]

Options:
  --output=<path>    Output file path (default: examples/ENHANCED_EXAMPLES_CATALOG_v2.md)
  --include-content  Include full example content in catalog
  --json            Generate JSON catalog instead of Markdown
  --help, -h         Show this help message

Features:
  • Advanced metadata extraction (difficulty, platforms, tags)
  • Learning path assignment
  • Performance data integration
  • Cross-reference generation
  • Comprehensive statistics

Examples:
  bun run tools/bun-catalog-generator.ts
  bun run tools/bun-catalog-generator.ts --output=my-catalog.md
  bun run tools/bun-catalog-generator.ts --json
`);
    return;
  }

  try {
    const generator = new EnhancedCatalogGenerator();
    await generator.generateCatalog();
  } catch (error) {
    console.error('❌ Catalog generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}