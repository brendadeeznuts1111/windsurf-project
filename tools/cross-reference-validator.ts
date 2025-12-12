#!/usr/bin/env bun
/**
 * Cross-Reference Validator
 * Ensures all documented relationships remain accurate
 */

import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";

interface ValidationResult {
  component: string;
  status: 'valid' | 'warning' | 'error';
  issues: string[];
  lastValidated: string;
}

class CrossReferenceValidator {
  private results: ValidationResult[] = [];
  private crossRefPath = 'examples/ENHANCED_EXAMPLES_CATALOG.md';

  async validateCrossReferences(): Promise<void> {
    console.log("🔍 Validating cross-reference documentation...\n");

    const content = await readFile(this.crossRefPath, 'utf-8');
    const components = this.extractComponents(content);

    for (const component of components) {
      const result = await this.validateComponent(component);
      this.results.push(result);
    }

    this.displayResults();
    this.generateReport();
  }

  private extractComponents(content: string): string[] {
    const lines = content.split('\n');
    const components: string[] = [];

    for (const line of lines) {
      // Match component headers like "### 1. Self-Optimizing Server"
      const match = line.match(/^### \d+\. (.+)$/);
      if (match) {
        components.push(match[1]);
      }
    }

    return components;
  }

  private async validateComponent(componentName: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      component: componentName,
      status: 'valid',
      issues: [],
      lastValidated: new Date().toISOString()
    };

    // Check if referenced files exist
    const filePaths = await this.extractFilePaths(componentName);

    for (const filePath of filePaths) {
      if (!await this.fileExists(filePath)) {
        result.issues.push(`Referenced file not found: ${filePath}`);
        result.status = 'error';
      }
    }

    // Check cross-references are bidirectional
    const crossRefs = await this.extractCrossReferences(componentName);
    for (const ref of crossRefs) {
      if (!await this.crossReferenceExists(ref, componentName)) {
        result.issues.push(`Missing bidirectional reference: ${ref} → ${componentName}`);
        result.status = result.status === 'error' ? 'error' : 'warning';
      }
    }

    // Check for performance data
    if (!await this.hasPerformanceData(componentName)) {
      result.issues.push('Missing performance data');
      result.status = result.status === 'error' ? 'error' : 'warning';
    }

    return result;
  }

  private async extractFilePaths(componentName: string): Promise<string[]> {
    // Extract file paths mentioned in component documentation
    const content = await readFile(this.crossRefPath, 'utf-8');
    const lines = content.split('\n');
    const paths: string[] = [];

    let inComponent = false;
    for (const line of lines) {
      if (line.includes(`###`) && line.includes(componentName)) {
        inComponent = true;
        continue;
      }

      if (inComponent && line.includes('###') && !line.includes(componentName)) {
        break; // Next component
      }

      if (inComponent) {
        // Extract paths like `src/self-optimizing-server.ts`
        const pathMatch = line.match(/`([^`]+\.ts)`/);
        if (pathMatch) {
          paths.push(pathMatch[1]);
        }
      }
    }

    return paths;
  }

  private async extractCrossReferences(componentName: string): Promise<string[]> {
    // Extract cross-referenced components
    const content = await readFile(this.crossRefPath, 'utf-8');
    const lines = content.split('\n');
    const refs: string[] = [];

    let inComponent = false;
    for (const line of lines) {
      if (line.includes(`###`) && line.includes(componentName)) {
        inComponent = true;
        continue;
      }

      if (inComponent && line.includes('###') && !line.includes(componentName)) {
        break;
      }

      if (inComponent && line.includes('**🔗 Cross-References:**')) {
        // Next lines contain references
        let lineIndex = lines.indexOf(line) + 1;
        while (lineIndex < lines.length && lines[lineIndex].trim()) {
          const refMatch = lines[lineIndex].match(/- \*\*([^:]+):\*\*/);
          if (refMatch) {
            refs.push(refMatch[1]);
          }
          lineIndex++;
        }
        break;
      }
    }

    return refs;
  }

  private async crossReferenceExists(fromComponent: string, toComponent: string): Promise<boolean> {
    const refs = await this.extractCrossReferences(fromComponent);
    return refs.includes(toComponent);
  }

  private async hasPerformanceData(componentName: string): Promise<boolean> {
    // Check if performance section mentions this component
    const content = await readFile(this.crossRefPath, 'utf-8');
    return content.includes(componentName) &&
           (content.includes('vs Node.js') || content.includes('performance'));
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private displayResults(): void {
    console.log("📊 Validation Results:\n");

    const valid = this.results.filter(r => r.status === 'valid').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    console.log(`✅ Valid: ${valid}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Errors: ${errors}\n`);

    // Show issues
    this.results.forEach(result => {
      if (result.issues.length > 0) {
        console.log(`${result.status === 'error' ? '❌' : '⚠️'} ${result.component}:`);
        result.issues.forEach(issue => console.log(`   • ${issue}`));
        console.log();
      }
    });
  }

  private generateReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        valid: this.results.filter(r => r.status === 'valid').length,
        warnings: this.results.filter(r => r.status === 'warning').length,
        errors: this.results.filter(r => r.status === 'error').length
      },
      results: this.results
    };

    // Write validation report (in real implementation)
    const reportPath = 'reports/cross-reference-validation.json';
    console.log(`📄 Validation report would be saved to ${reportPath}`);
  }
}

// CLI
if (import.meta.main) {
  const validator = new CrossReferenceValidator();
  await validator.validateCrossReferences();
}