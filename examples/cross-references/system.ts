/**
 * Cross-Reference System for Bun Examples
 * Provides comprehensive linking between examples, benchmarks, guides, and tests
 */

export interface CrossReference {
  file: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  relatedExamples: string[];
  guides: string[];
  tests: string[];
  benchmarks: string[];
  tags: string[];
  dependencies: string[];
  alternatives: string[];
  description: string;
  lastUpdated: string;
}

export interface BenchmarkReference {
  benchmark: string;
  category: string;
  metrics: string[];
  baseline: Record<string, number>;
  thresholds: Record<string, number>;
  relatedExamples: string[];
  comparisons: string[];
}

export class CrossReferenceSystem {
  private references: Map<string, CrossReference> = new Map();
  private benchmarkRefs: Map<string, BenchmarkReference> = new Map();

  /**
   * Register an example with its cross-references
   */
  registerExample(ref: CrossReference): void {
    this.references.set(ref.file, ref);
  }

  /**
   * Register a benchmark with its references
   */
  registerBenchmark(ref: BenchmarkReference): void {
    this.benchmarkRefs.set(ref.benchmark, ref);
  }

  /**
   * Find related examples for a given file
   */
  getRelatedExamples(file: string): CrossReference[] {
    const ref = this.references.get(file);
    if (!ref) return [];

    return ref.relatedExamples
      .map(example => this.references.get(example))
      .filter(Boolean) as CrossReference[];
  }

  /**
   * Find examples by tags
   */
  getExamplesByTags(tags: string[]): CrossReference[] {
    return Array.from(this.references.values())
      .filter(ref => tags.some(tag => ref.tags.includes(tag)));
  }

  /**
   * Get learning path for a topic
   */
  getLearningPath(topic: string): CrossReference[] {
    return Array.from(this.references.values())
      .filter(ref => ref.tags.includes(topic))
      .sort((a, b) => {
        const order = ['beginner', 'intermediate', 'advanced'];
        return order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
      });
  }

  /**
   * Get benchmarks for an example
   */
  getBenchmarksForExample(example: string): BenchmarkReference[] {
    const ref = this.references.get(example);
    if (!ref) return [];

    return ref.benchmarks
      .map(benchmark => this.benchmarkRefs.get(benchmark))
      .filter(Boolean) as BenchmarkReference[];
  }

  /**
   * Validate cross-references integrity
   */
  validateReferences(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that all referenced files exist
    for (const [file, ref] of this.references) {
      // Check related examples exist
      for (const related of ref.relatedExamples) {
        if (!this.references.has(related)) {
          errors.push(`Missing related example: ${related} (referenced by ${file})`);
        }
      }

      // Check prerequisites exist
      for (const prereq of ref.prerequisites) {
        if (!this.references.has(prereq)) {
          errors.push(`Missing prerequisite: ${prereq} (required by ${file})`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Export cross-reference data
   */
  export(): { examples: CrossReference[]; benchmarks: BenchmarkReference[] } {
    return {
      examples: Array.from(this.references.values()),
      benchmarks: Array.from(this.benchmarkRefs.values())
    };
  }

  /**
   * Import cross-reference data
   */
  import(data: { examples: CrossReference[]; benchmarks: BenchmarkReference[] }): void {
    this.references.clear();
    this.benchmarkRefs.clear();

    data.examples.forEach(ref => this.registerExample(ref));
    data.benchmarks.forEach(ref => this.registerBenchmark(ref));
  }
}

// Global cross-reference system instance
export const crossRefSystem = new CrossReferenceSystem();