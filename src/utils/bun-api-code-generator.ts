#!/usr/bin/env bun

/**
 * 🏗️ Bun-Native API Code Generator
 *
 * Generates standardized Bun API implementations from enhanced Repository.toml specifications
 * using the comprehensive template format with PR tracking, domain scoping, and enterprise patterns.
 */

import { RepositoryParser, type Specification } from './repository-parser';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface CodeGenerationOptions {
  outputDir: string;
  includeTests: boolean;
  includeBenchmarks: boolean;
  includeValidation: boolean;
  template: 'full' | 'minimal' | 'enterprise';
}

export class BunAPICodeGenerator {
  private parser: RepositoryParser;

  constructor(tomlPath: string = '../../Repository.toml') {
    this.parser = new RepositoryParser(tomlPath);
  }

  /**
   * Generate code for a specific specification
   */
  generateSpecification(specId: string, options: Partial<CodeGenerationOptions> = {}): string {
    const spec = this.parser.getById(specId);
    if (!spec) {
      throw new Error(`Specification ${specId} not found`);
    }

    const opts = {
      outputDir: './generated',
      includeTests: true,
      includeBenchmarks: true,
      includeValidation: true,
      template: 'enterprise' as const,
      ...options
    };

    return this.generateCode(spec, opts);
  }

  /**
   * Generate code for multiple specifications
   */
  generateBatch(specIds: string[], options: Partial<CodeGenerationOptions> = {}): Map<string, string> {
    const results = new Map<string, string>();

    for (const specId of specIds) {
      try {
        const code = this.generateSpecification(specId, options);
        results.set(specId, code);
      } catch (error) {
        console.warn(`Failed to generate ${specId}:`, error);
        // Skip missing specifications
      }
    }

    return results;
  }

  /**
   * Generate all specifications
   */
  generateAll(options: Partial<CodeGenerationOptions> = {}): Map<string, string> {
    const allSpecs = this.parser.getAll();
    return this.generateBatch(allSpecs.map(s => s.spec.specification), options);
  }

  /**
   * Write generated code to files
   */
  writeToFiles(generated: Map<string, string>, options: Partial<CodeGenerationOptions> = {}): void {
    const opts = {
      outputDir: './generated',
      includeTests: true,
      includeBenchmarks: true,
      includeValidation: true,
      ...options
    };

    mkdirSync(opts.outputDir, { recursive: true });

    for (const [specId, code] of generated) {
      const filename = `${specId.toLowerCase().replace('ex', 'ex')}.ts`;
      const filepath = join(opts.outputDir, filename);
      writeFileSync(filepath, code);
      console.log(`✅ Generated ${filepath}`);
    }
  }

  private generateCode(spec: Specification, options: CodeGenerationOptions): string {
    const className = this.generateClassName(spec);
    const methods = this.generateMethods(spec);
    const dependencies = this.extractDependencies(spec);
    const benchmarks = options.includeBenchmarks ? this.generateBenchmarks(spec) : '';
    const validation = options.includeValidation ? this.generateValidation(spec) : '';

    let code = `/**
 * ${this.generateDescription(spec)}
 * DOMAIN: ${spec.domain}
 * SCOPE: ${spec.scope}
 * SPEC: ${spec.spec.specification}
${spec.prNumber ? ` * PR: #${spec.prNumber} - ${spec.comments?.find(c => c.includes('PR #'))?.split(' - ')[1] || 'Implementation'}` : ''}
 * STATUS: ${spec.status}
${spec.tags.length > 0 ? ` * TAGS: ${spec.tags.join(', ')}` : ''}
${spec.reviewedBy ? ` * REVIEWED-BY: @${spec.reviewedBy.join(' @')}` : ''}
${spec.commit ? ` * COMMIT: ${spec.commit}` : ''}
 */

import { Bun, type BunAPI } from "bun";
${dependencies.length > 0 ? `// Dependencies: ${dependencies.join(', ')}` : ''}

export class ${className} {
  // ========================================
  // META: {PROPERTY} values from TOML
  // ========================================
  private config = {
    // From META:{PROPERTY} - ensure sync
    ${this.generateConfigFromMeta(spec)}
  };

  // ========================================
  // #REF:* dependencies injected
  // ========================================
  constructor(
${dependencies.map(dep => `    private ${dep.toLowerCase()}: any,  // ${dep} - Injected dependency`).join(',\n')}
  ) {
    // COMMENT: Initialize with Bun-native features
    console.log("Component initialized", {
      domain: "${spec.domain}",
      spec: "${spec.spec.specification}"
    });
  }

${methods}
}`;

    if (benchmarks) {
      code += `

// ========================================
// BENCHMARKS
// ========================================
${benchmarks}`;
    }

    if (validation) {
      code += `

// ========================================
// VALIDATION
// ========================================
${validation}`;
    }

    return code;
  }

  private generateClassName(spec: Specification): string {
    const parts = spec.spec.specification.split('.');
    return parts.map(part =>
      part.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('')
    ).join('');
  }

  private generateDescription(spec: Specification): string {
    const comment = spec.comments?.find(c => c.includes('COMMENT:'));
    return comment ? comment.replace('COMMENT:', '').trim() : `${spec.domain} ${spec.scope} implementation`;
  }

  private generateConfigFromMeta(spec: Specification): string {
    // Extract configuration from META:{PROPERTY}
    const meta = spec.spec['META']?.['PROPERTY'];
    if (!meta) return '// No configuration specified';

    const configLines: string[] = [];
    for (const [key, value] of Object.entries(meta)) {
      if (typeof value === 'object' && value !== null) {
        configLines.push(`    ${key}: ${JSON.stringify(value, null, 2).replace(/\n/g, '\n    ')},`);
      } else {
        configLines.push(`    ${key}: ${JSON.stringify(value)},`);
      }
    }
    return configLines.join('\n');
  }

  private extractDependencies(spec: Specification): string[] {
    const refs = spec.spec['#REF:*']?.references;
    if (!refs) return [];

    return Array.isArray(refs) ? refs : [refs];
  }

  private generateMethods(spec: Specification): string {
    // Generate basic methods based on CLASS specification
    const classSpec = spec.spec.CLASS;
    if (!classSpec?.methods) return '';

    return classSpec.methods.map((method: string) => `
  // ========================================
  // METHOD: ${method}
  // STATUS: ${spec.status}
  // TAGS: ${spec.tags.join(', ')}
  // ========================================
  public async ${method}(param: any): Promise<any> {
    const traceId = crypto.randomUUID();
    const start = Bun.nanoseconds();

    try {
      // Bun-native logic here
      console.log("Method execution started", {
        trace_id: traceId,
        method: "${method}",
        spec: "${spec.spec.specification}"
      });

      // Implementation with Bun APIs only
      // TODO: Implement ${method} logic

      return { success: true, method: "${method}" };
    } catch (error) {
      console.error("Method failed", {
        trace_id: traceId,
        method: "${method}",
        duration_ns: Bun.nanoseconds() - start,
      }, error);
      throw error;
    } finally {
      console.log("Method completed", {
        trace_id: traceId,
        method: "${method}",
        duration_ns: Bun.nanoseconds() - start,
      });
    }
  }`).join('\n');
  }

  private generateBenchmarks(spec: Specification): string {
    const className = this.generateClassName(spec);
    const methods = spec.spec.CLASS?.methods || [];

    return methods.map((method: string) => `
bench("${className}.${method}", async () => {
  const instance = new ${className}(${this.extractDependencies(spec).map(() => 'null').join(', ')});
  await instance.${method}({ test: true });
});`).join('\n');
  }

  private generateValidation(spec: Specification): string {
    const className = this.generateClassName(spec);
    const methods = spec.spec.CLASS?.methods || [];

    return methods.map((method: string) => `
validate("${className}.${method}", async () => {
  const instance = new ${className}(${this.extractDependencies(spec).map(() => 'null').join(', ')});
  const result = await instance.${method}({ validate: true });

  // Validation logic with benchmarks
  expect(result).toHaveProperty('success');
  expect(result.method).toBe("${method}");
});`).join('\n');
  }
}

// CLI Interface
async function main() {
  const generator = new BunAPICodeGenerator();

  console.log('🚀 Bun-Native API Code Generator\n');

  // Generate a sample specification
  try {
    const sampleCode = generator.generateSpecification('EX021');
    console.log('📄 Generated EX021 (HTTP Server):\n');
    console.log(sampleCode.slice(0, 500) + '...\n');

    // Generate batch
    const batch = generator.generateBatch(['EX021', 'EX022'], {
      includeTests: false,
      includeBenchmarks: true,
      includeValidation: true
    });

    console.log(`📦 Generated ${batch.size} specifications`);
    batch.forEach((_, specId) => {
      console.log(`  ✅ ${specId}`);
    });

    // Write to files
    console.log('\n💾 Writing to files...');
    generator.writeToFiles(batch, { outputDir: './generated-apis' });

  } catch (error) {
    console.error('❌ Generation failed:', error);
  }
}

// Run CLI if executed directly
if (import.meta.main) {
  main().catch(console.error);
}