import { logger } from "../../examples/logging/bun-logger";

interface DeepEqualsOptions {
  strict?: boolean;
  maxDepth?: number;
  customComparators?: Map<string, (a: any, b: any) => boolean>;
}

/**
 * Advanced deep equality with custom comparators and performance optimization
 */
export class BunDeepEquals {
  private options: DeepEqualsOptions;
  private cache = new WeakMap();

  constructor(options: DeepEqualsOptions = {}) {
    this.options = {
      strict: true,
      maxDepth: 10,
      customComparators: new Map(),
      ...options,
    };
  }

  /**
   * Deep equality comparison
   */
  equals(a: any, b: any): boolean {
    return this.deepEquals(a, b, 0);
  }

  private deepEquals(a: any, b: any, depth: number): boolean {
    // Max depth check
    if (depth > (this.options.maxDepth || 10)) {
      logger.warn("Max depth exceeded in deep equals", { depth });
      return false;
    }

    // Same reference
    if (a === b) return true;

    // Handle null/undefined
    if (a == null || b == null) return a === b;

    // Different types
    if (typeof a !== typeof b) return false;

    // Primitive types
    if (typeof a !== 'object') return a === b;

    // Check cache for circular references
    const cacheKey = `${a}-${b}`;
    if (this.cache.has(a) && this.cache.get(a) === b) return true;

    // Custom comparators
    const typeName = a.constructor?.name;
    if (typeName && this.options.customComparators?.has(typeName)) {
      const comparator = this.options.customComparators.get(typeName)!;
      return comparator(a, b);
    }

    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;

      // Cache for circular reference detection
      this.cache.set(a, b);

      try {
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEquals(a[i], b[i], depth + 1)) return false;
        }
        return true;
      } finally {
        this.cache.delete(a);
      }
    }

    // Objects
    if (a.constructor === Object && b.constructor === Object) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      // Cache for circular reference detection
      this.cache.set(a, b);

      try {
        for (const key of keysA) {
          if (!(key in b)) return false;
          if (!this.deepEquals(a[key], b[key], depth + 1)) return false;
        }
        return true;
      } finally {
        this.cache.delete(a);
      }
    }

    // Use Bun's built-in deep equals for other cases
    return Bun.deepEquals(a, b);
  }

  /**
   * Performance benchmark
   */
  benchmark(iterations: number = 1000): { duration: number; comparisons_per_second: number } {
    const obj1 = { a: { b: [1, 2, { c: 3 }] } };
    const obj2 = { a: { b: [1, 2, { c: 3 }] } };

    const start = Bun.nanoseconds();

    for (let i = 0; i < iterations; i++) {
      this.equals(obj1, obj2);
    }

    const duration = Bun.nanoseconds() - start;
    const comparisons_per_second = iterations / (duration / 1e9);

    logger.info("Deep equals benchmark", {
      iterations,
      duration_ns: duration,
      comparisons_per_second: Math.floor(comparisons_per_second),
    });

    return { duration, comparisons_per_second };
  }

  /**
   * Add custom comparator
   */
  addComparator(typeName: string, comparator: (a: any, b: any) => boolean): void {
    this.options.customComparators?.set(typeName, comparator);
    logger.debug("Custom comparator added", { type: typeName });
  }
}

// Export singleton instance
export const deepEquals = new BunDeepEquals();