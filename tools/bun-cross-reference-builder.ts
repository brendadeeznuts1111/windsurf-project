#!/usr/bin/env bun
// tools/bun-cross-reference-builder.ts - Automated Cross-Reference Builder
// Automatically generates cross-references and related examples for self-maintaining catalog

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

interface ExampleAnalysis {
  file: string;
  path: string;
  apis: Set<string>;
  imports: Set<string>;
  tags: Set<string>;
  patterns: Set<string>;
  categories: Set<string>;
  complexity: number;
  dependencies: Set<string>;
}

interface CrossReferenceGraph {
  examples: Map<string, ExampleAnalysis>;
  apiUsage: Map<string, Set<string>>;
  tagRelationships: Map<string, Set<string>>;
  importDependencies: Map<string, Set<string>>;
  patternClusters: Map<string, Set<string>>;
}

interface Relationship {
  example: string;
  related: string[];
  crossReferences: string[];
  similarity: number;
  reasons: string[];
}

class CrossReferenceBuilder {
  private examplesDir = 'examples';
  private catalogFile = 'examples/ENHANCED_EXAMPLES_CATALOG_v2.md';
  private graph: CrossReferenceGraph;

  constructor() {
    this.graph = {
      examples: new Map(),
      apiUsage: new Map(),
      tagRelationships: new Map(),
      importDependencies: new Map(),
      patternClusters: new Map()
    };
  }

  private analyzeExample(filePath: string): ExampleAnalysis | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const relativePath = filePath.replace(this.examplesDir + '/', '');

      const analysis: ExampleAnalysis = {
        file: basename(filePath),
        path: relativePath,
        apis: new Set(),
        imports: new Set(),
        tags: new Set(),
        patterns: new Set(),
        categories: new Set(),
        complexity: 0,
        dependencies: new Set()
      };

      // Extract Bun APIs
      const bunApiMatches = content.match(/Bun\.\w+/g);
      if (bunApiMatches) {
        bunApiMatches.forEach(api => {
          analysis.apis.add(api.replace('Bun.', ''));
        });
      }

      // Extract imports
      const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        importMatches.forEach(imp => {
          const match = imp.match(/from\s+['"]([^'"]+)['"]/);
          if (match) {
            analysis.imports.add(match[1]);
          }
        });
      }

      // Extract function calls and patterns
      const patterns = [
        // HTTP/Serve patterns
        /Bun\.serve/g,
        /fetch\(/g,
        /Response\(/g,
        /Request\(/g,

        // File system patterns
        /Bun\.file/g,
        /readFile/g,
        /writeFile/g,
        /readdir/g,

        // Process patterns
        /Bun\.spawn/g,
        /exec\(/g,
        /spawn\(/g,

        // Database patterns
        /bun:sqlite/g,
        /database/g,
        /query\(/g,

        // WebSocket patterns
        /WebSocket/g,
        /ws\./g,
        /socket/g,

        // Testing patterns
        /test\(/g,
        /expect\(/g,
        /describe\(/g,

        // Performance patterns
        /benchmark/g,
        /performance/g,
        /timing/g,

        // Configuration patterns
        /config/g,
        /YAML/g,
        /JSON\.parse/g,

        // CLI patterns
        /parseArgs/g,
        /argv/g,
        /console\.log/g,

        // Advanced patterns
        /class\s+\w+/g,
        /async\s+function/g,
        /Promise/g,
        /await/g
      ];

      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          analysis.patterns.add(pattern.source.replace(/[/\\^$*+?.()|[\]{}]/g, '').replace(/g$/, ''));
        }
      });

      // Calculate complexity score
      analysis.complexity =
        (content.split('\n').length * 0.1) +
        (analysis.apis.size * 2) +
        (analysis.imports.size * 1.5) +
        (analysis.patterns.size * 1);

      // Infer categories from path
      const pathParts = relativePath.split('/');
      if (pathParts.length > 0) {
        analysis.categories.add(pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1));
      }

      // Extract dependencies (other examples this might reference)
      const exampleRefs = content.match(/examples\/[^'"\s]+/g);
      if (exampleRefs) {
        exampleRefs.forEach(ref => {
          analysis.dependencies.add(ref.replace('examples/', ''));
        });
      }

      return analysis;

    } catch (error) {
      console.warn(`⚠️ Failed to analyze ${filePath}:`, error);
      return null;
    }
  }

  public buildRelationshipGraph(): void {
    console.log('🔍 Analyzing examples for cross-references...');

    const scanDirectory = (dir: string): void => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory()) {
            scanDirectory(fullPath);
          } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
            const analysis = this.analyzeExample(fullPath);
            if (analysis) {
              this.graph.examples.set(analysis.path, analysis);

              // Build API usage map
              analysis.apis.forEach(api => {
                if (!this.graph.apiUsage.has(api)) {
                  this.graph.apiUsage.set(api, new Set());
                }
                this.graph.apiUsage.get(api)!.add(analysis.path);
              });

              // Build tag relationships (using patterns as tags)
              analysis.patterns.forEach(pattern => {
                if (!this.graph.tagRelationships.has(pattern)) {
                  this.graph.tagRelationships.set(pattern, new Set());
                }
                this.graph.tagRelationships.get(pattern)!.add(analysis.path);
              });

              // Build import dependencies
              analysis.imports.forEach(imp => {
                if (!this.graph.importDependencies.has(imp)) {
                  this.graph.importDependencies.set(imp, new Set());
                }
                this.graph.importDependencies.get(imp)!.add(analysis.path);
              });
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to scan directory ${dir}:`, error);
      }
    };

    scanDirectory(this.examplesDir);
    console.log(`✅ Analyzed ${this.graph.examples.size} examples`);
  }

  private calculateSimilarity(example1: ExampleAnalysis, example2: ExampleAnalysis): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // API overlap (highest weight)
    const apiIntersection = new Set([...example1.apis].filter(api => example2.apis.has(api)));
    if (apiIntersection.size > 0) {
      score += apiIntersection.size * 3;
      reasons.push(`Shared APIs: ${Array.from(apiIntersection).join(', ')}`);
    }

    // Pattern overlap
    const patternIntersection = new Set([...example1.patterns].filter(p => example2.patterns.has(p)));
    if (patternIntersection.size > 0) {
      score += patternIntersection.size * 2;
      reasons.push(`Shared patterns: ${Array.from(patternIntersection).join(', ')}`);
    }

    // Import overlap
    const importIntersection = new Set([...example1.imports].filter(imp => example2.imports.has(imp)));
    if (importIntersection.size > 0) {
      score += importIntersection.size * 1.5;
      reasons.push(`Shared imports: ${Array.from(importIntersection).join(', ')}`);
    }

    // Category similarity
    const categoryIntersection = new Set([...example1.categories].filter(cat => example2.categories.has(cat)));
    if (categoryIntersection.size > 0) {
      score += categoryIntersection.size * 2;
      reasons.push(`Same category: ${Array.from(categoryIntersection).join(', ')}`);
    }

    // Complexity similarity (prefer similar complexity levels)
    const complexityDiff = Math.abs(example1.complexity - example2.complexity);
    const complexityBonus = Math.max(0, 1 - (complexityDiff / 10));
    score += complexityBonus;
    if (complexityBonus > 0.5) {
      reasons.push('Similar complexity level');
    }

    // Dependency relationships
    if (example1.dependencies.has(example2.path) || example2.dependencies.has(example1.path)) {
      score += 2;
      reasons.push('Direct dependency relationship');
    }

    return { score, reasons };
  }

  public generateRelationships(): Map<string, Relationship> {
    console.log('🔗 Generating cross-references and relationships...');

    const relationships = new Map<string, Relationship>();

    for (const [path1, example1] of this.graph.examples) {
      const relationship: Relationship = {
        example: path1,
        related: [],
        crossReferences: [],
        similarity: 0,
        reasons: []
      };

      const similarities: Array<{ path: string; score: number; reasons: string[] }> = [];

      for (const [path2, example2] of this.graph.examples) {
        if (path1 === path2) continue;

        const { score, reasons } = this.calculateSimilarity(example1, example2);
        if (score > 0) {
          similarities.push({ path: path2, score, reasons });
        }
      }

      // Sort by similarity score (descending)
      similarities.sort((a, b) => b.score - a.score);

      // Take top related examples (limit to 5)
      relationship.related = similarities.slice(0, 5).map(s => s.path);

      // Generate cross-references (examples in same category or with high similarity)
      const crossRefs = similarities
        .filter(s => s.score >= 3 || example1.categories.has(this.graph.examples.get(s.path)?.categories.values().next().value || ''))
        .slice(0, 3)
        .map(s => s.path);

      relationship.crossReferences = crossRefs;

      // Store similarity info
      if (similarities.length > 0) {
        relationship.similarity = similarities[0].score;
        relationship.reasons = similarities[0].reasons;
      }

      relationships.set(path1, relationship);
    }

    console.log(`✅ Generated relationships for ${relationships.size} examples`);
    return relationships;
  }

  private updateCatalogWithRelationships(relationships: Map<string, Relationship>): void {
    console.log('📝 Updating catalog with auto-generated relationships...');

    if (!existsSync(this.catalogFile)) {
      console.warn(`⚠️ Catalog file not found: ${this.catalogFile}`);
      return;
    }

    let content = readFileSync(this.catalogFile, 'utf-8');
    let updatedCount = 0;

    for (const [examplePath, relationship] of relationships) {
      // Find the example section in the catalog by looking for the file reference
      const filePattern = new RegExp(`\\[${basename(examplePath)}\\]\\(${examplePath}\\)`, 'g');
      const fileMatch = content.match(filePattern);

      if (!fileMatch) {
        console.log(`No catalog entry found for ${examplePath} (looking for: [${basename(examplePath)}](${examplePath}))`);
      }

      if (fileMatch) {
        console.log(`Found catalog entry for ${examplePath}`);
        // Find the section boundaries
        const lines = content.split('\n');
        let startIndex = -1;
        let endIndex = -1;

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(fileMatch[0])) {
            startIndex = i;
            // Find the next #### or end of file
            for (let j = i + 1; j < lines.length; j++) {
              if (lines[j].startsWith('#### ') || lines[j].startsWith('## ')) {
                endIndex = j - 1;
                break;
              }
            }
            if (endIndex === -1) endIndex = lines.length - 1;
            break;
          }
        }

        if (startIndex !== -1 && endIndex !== -1) {
          const section = lines.slice(startIndex, endIndex + 1).join('\n');

          // Check if related examples section exists
          if (section.includes('**Related examples:**')) {
            // Update existing section
            const updatedSection = section.replace(
              /(\*\*Related examples:\*\*\n)([\s\S]*?)(\n\n|$)/,
              (match, prefix, content, suffix) => {
                const newRelated = relationship.related.map(rel => {
                  const relExample = this.graph.examples.get(rel);
                  return relExample ? `- [${relExample.file.replace('.ts', '')}](${rel})` : '';
                }).filter(Boolean).join('\n');

                return `${prefix}${newRelated}${suffix}`;
              }
            );

            // Replace the section in content
            const beforeSection = lines.slice(0, startIndex).join('\n');
            const afterSection = lines.slice(endIndex + 1).join('\n');
            content = beforeSection + '\n' + updatedSection + '\n' + afterSection;
          } else {
            // Add new related examples section
            const insertPoint = section.lastIndexOf('---') !== -1 ?
              section.lastIndexOf('---') :
              section.length;

            const newRelatedSection = relationship.related.length > 0 ? `

**Related examples:**
${relationship.related.map(rel => {
  const relExample = this.graph.examples.get(rel);
  return relExample ? `- [${relExample.file.replace('.ts', '')}](${rel})` : '';
}).filter(Boolean).join('\n')}
` : '';

            const updatedSection = section.slice(0, insertPoint) + newRelatedSection + section.slice(insertPoint);
            const beforeSection = lines.slice(0, startIndex).join('\n');
            const afterSection = lines.slice(endIndex + 1).join('\n');
            content = beforeSection + '\n' + updatedSection + '\n' + afterSection;
          }

          updatedCount++;
        }
      }
    }

    // Write updated catalog
    writeFileSync(this.catalogFile, content);
    console.log(`✅ Updated catalog with relationships for ${updatedCount} examples`);
  }

  public generateCrossReferenceReport(relationships: Map<string, Relationship>): void {
    console.log('📊 Generating cross-reference analysis report...');

    const report = `# 🔗 Cross-Reference Analysis Report

*Generated on ${new Date().toISOString()} by Automated Cross-Reference Builder*

## 📈 Overview

**Total Examples Analyzed:** ${this.graph.examples.size}
**API Usage Map:** ${this.graph.apiUsage.size} unique APIs
**Tag Relationships:** ${this.graph.tagRelationships.size} pattern clusters
**Import Dependencies:** ${this.graph.importDependencies.size} import relationships

## 🔍 Top APIs Used

${Array.from(this.graph.apiUsage.entries())
  .sort(([,a], [,b]) => b.size - a.size)
  .slice(0, 10)
  .map(([api, examples]) => `- **${api}**: used in ${examples.size} examples`)
  .join('\n')}

## 🏷️ Popular Patterns

${Array.from(this.graph.tagRelationships.entries())
  .sort(([,a], [,b]) => b.size - a.size)
  .slice(0, 10)
  .map(([pattern, examples]) => `- **${pattern}**: found in ${examples.size} examples`)
  .join('\n')}

## 📋 Relationship Summary

${Array.from(relationships.entries())
  .map(([path, rel]) => `### ${path}
- **Related Examples:** ${rel.related.length}
- **Cross-References:** ${rel.crossReferences.length}
- **Top Similarity Score:** ${rel.similarity.toFixed(2)}
${rel.reasons.length > 0 ? `- **Reasons:** ${rel.reasons.slice(0, 2).join(', ')}` : ''}`)
  .join('\n\n')}

## 🎯 Clustering Analysis

### High-Connectivity Examples
${Array.from(relationships.entries())
  .sort(([,a], [,b]) => (b.related.length + b.crossReferences.length) - (a.related.length + a.crossReferences.length))
  .slice(0, 5)
  .map(([path, rel]) => `- **${path}**: ${rel.related.length + rel.crossReferences.length} connections`)
  .join('\n')}

### Isolated Examples
${Array.from(relationships.entries())
  .filter(([,rel]) => rel.related.length + rel.crossReferences.length === 0)
  .map(([path]) => `- ${path}`)
  .join('\n') || '*All examples have relationships!* 🎉'}

---
*This report is automatically generated and updated with each catalog build.*
`;

    writeFileSync('cross-reference-analysis-report.md', report);
    console.log('✅ Generated cross-reference analysis report');
  }

  public async buildCrossReferences(): Promise<void> {
    console.log('🚀 Starting automated cross-reference building...\n');

    // Phase 1: Build relationship graph
    console.log('📊 Phase 1: Building relationship graph...');
    this.buildRelationshipGraph();
    console.log('');

    // Phase 2: Generate relationships
    console.log('🔗 Phase 2: Generating relationships...');
    const relationships = this.generateRelationships();
    console.log('');

    // Phase 3: Update catalog
    console.log('📝 Phase 3: Updating catalog...');
    this.updateCatalogWithRelationships(relationships);
    console.log('');

    // Phase 4: Generate report
    console.log('📊 Phase 4: Generating analysis report...');
    this.generateCrossReferenceReport(relationships);
    console.log('');

    console.log('🎉 Cross-reference building complete!');
    console.log(`📄 Updated catalog: ${this.catalogFile}`);
    console.log(`📊 Analysis report: cross-reference-analysis-report.md`);

    // Summary statistics
    const totalRelationships = Array.from(relationships.values())
      .reduce((sum, rel) => sum + rel.related.length + rel.crossReferences.length, 0);

    console.log('\n📊 Summary:');
    console.log(`   Examples analyzed: ${this.graph.examples.size}`);
    console.log(`   Relationships created: ${totalRelationships}`);
    console.log(`   Average relationships per example: ${(totalRelationships / this.graph.examples.size).toFixed(1)}`);
    console.log(`   API clusters: ${this.graph.apiUsage.size}`);
    console.log(`   Pattern clusters: ${this.graph.tagRelationships.size}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔗 Automated Cross-Reference Builder v1.0

Automatically analyzes examples and generates cross-references for self-maintaining catalog.

Usage: bun run tools/bun-cross-reference-builder.ts [options]

Options:
  --analyze-only     Only analyze and generate report, don't update catalog
  --report-only      Only generate analysis report
  --verbose, -v      Show detailed analysis output
  --help, -h         Show this help message

Features:
  • Automatic API usage analysis
  • Pattern recognition and clustering
  • Similarity scoring between examples
  • Self-maintaining related examples
  • Cross-reference generation
  • Comprehensive analysis reports

Output Files:
  • examples/ENHANCED_EXAMPLES_CATALOG_v2.md (updated with relationships)
  • cross-reference-analysis-report.md (analysis report)

Example:
  bun run tools/bun-cross-reference-builder.ts
  bun run tools/bun-cross-reference-builder.ts --analyze-only
`);
    return;
  }

  try {
    const builder = new CrossReferenceBuilder();

    if (args.includes('--analyze-only')) {
      // Just analyze and report
      builder.buildRelationshipGraph();
      const relationships = builder.generateRelationships();
      builder.generateCrossReferenceReport(relationships);
      console.log('✅ Analysis complete (catalog not updated)');
    } else if (args.includes('--report-only')) {
      // Just generate report
      builder.buildRelationshipGraph();
      const relationships = builder.generateRelationships();
      builder.generateCrossReferenceReport(relationships);
      console.log('✅ Report generation complete');
    } else {
      // Full build
      await builder.buildCrossReferences();
    }
  } catch (error) {
    console.error('❌ Cross-reference building failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}