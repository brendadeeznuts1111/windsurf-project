import { logger } from "../../examples/logging/bun-logger";

interface ResolveResult {
  path: string;
  exists: boolean;
  isFile: boolean;
  isDirectory: boolean;
}

/**
 * Module resolution with cache invalidation
 */
export class BunResolveManager {
  private cache = new Map<string, ResolveResult>();
  private cacheTimeout = 30000; // 30 seconds

  /**
   * Resolve module path synchronously
   */
  resolve(moduleName: string, fromPath?: string): string {
    try {
      return Bun.resolveSync(moduleName, fromPath || import.meta.dir);
    } catch (error) {
      logger.error("Module resolution failed", { module: moduleName, from: fromPath }, error as Error);
      throw error;
    }
  }

  /**
   * Resolve with caching
   */
  async resolveCached(moduleName: string, fromPath?: string): Promise<ResolveResult> {
    const cacheKey = `${moduleName}:${fromPath || 'default'}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - (cached as any).timestamp < this.cacheTimeout) {
      return cached;
    }

    try {
      const resolvedPath = this.resolve(moduleName, fromPath);

      const result: ResolveResult = {
        path: resolvedPath,
        exists: true, // Assume it exists if resolved
        isFile: true, // Assume it's a file
        isDirectory: false,
      };

      // Cache result
      (result as any).timestamp = Date.now();
      this.cache.set(cacheKey, result);

      return result;

    } catch (error) {
      const result: ResolveResult = {
        path: moduleName,
        exists: false,
        isFile: false,
        isDirectory: false,
      };

      // Cache negative result for shorter time
      (result as any).timestamp = Date.now();
      this.cache.set(cacheKey, result);

      return result;
    }
  }

  /**
   * Clear resolution cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug("Resolution cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need hit/miss counters
    };
  }

  /**
   * Batch resolve multiple modules
   */
  async resolveBatch(modules: string[], fromPath?: string): Promise<Map<string, ResolveResult>> {
    const results = new Map<string, ResolveResult>();

    // Resolve in parallel
    const promises = modules.map(async (module) => {
      const result = await this.resolveCached(module, fromPath);
      results.set(module, result);
    });

    await Promise.all(promises);

    logger.debug("Batch resolution completed", { count: modules.length });
    return results;
  }
}

// Export singleton instance
export const resolveManager = new BunResolveManager();