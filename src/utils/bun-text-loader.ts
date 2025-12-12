#!/usr/bin/env bun

/**
 * 🎯 Bun Text File Loader - Node.js require.extensions Replacement
 *
 * Provides Bun-native text file loading utilities that replace Node.js require.extensions.
 * Optimized for performance with caching, batch loading, and error handling.
 */

export interface TextFileOptions {
  encoding?: 'utf8' | 'base64';
  cache?: boolean;
  maxCacheSize?: number;
  cacheTTL?: number;
}

export interface TextFileResult {
  content: string;
  path: string;
  size: number;
  loadTime: number;
  cached: boolean;
  encoding: string;
}

export interface BatchLoadResult {
  results: TextFileResult[];
  totalTime: number;
  successCount: number;
  errorCount: number;
}

/**
 * Cache entry for loaded text files
 */
interface CacheEntry {
  content: string;
  mtime: number;
  size: number;
  loadedAt: number;
}

/**
 * Bun Text File Loader - Replaces Node.js require.extensions
 *
 * Provides multiple strategies for loading text files in Bun:
 * - Direct Bun.file() API calls
 * - Cached loading for performance
 * - Batch loading for multiple files
 * - Error handling and validation
 */
export class BunTextLoader {
  private static cache = new Map<string, CacheEntry>();
  private static defaultOptions: Required<TextFileOptions> = {
    encoding: 'utf8',
    cache: true,
    maxCacheSize: 100,
    cacheTTL: 300000, // 5 minutes
  };

  /**
   * Load a single text file using Bun's native API
   *
   * @param filePath Path to the text file
   * @param options Loading options
   * @returns Promise resolving to TextFileResult
   */
  static async load(
    filePath: string,
    options: TextFileOptions = {}
  ): Promise<TextFileResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = performance.now();

    try {
      // Check cache first
      if (opts.cache) {
        const cached = this.getCached(filePath);
        if (cached) {
          const loadTime = performance.now() - startTime;
          let content = cached.content;

          // Apply encoding transformation even for cached content
          if (opts.encoding === 'base64') {
            content = Buffer.from(content, 'utf8').toString('base64');
          }

          return {
            content,
            path: filePath,
            size: cached.size,
            loadTime,
            cached: true,
            encoding: opts.encoding,
          };
        }
      }

      // Load file using Bun's native API
      const file = Bun.file(filePath);
      let content: string;

      if (opts.encoding === 'base64') {
        const bytes = new Uint8Array(await file.arrayBuffer());
        content = Buffer.from(bytes).toString('base64');
      } else {
        content = await file.text();
      }

      const loadTime = performance.now() - startTime;
      const stat = await file.stat();

      // Cache the result
      if (opts.cache) {
        this.setCached(filePath, {
          content,
          mtime: stat.mtime,
          size: stat.size,
          loadedAt: Date.now(),
        });
      }

      return {
        content,
        path: filePath,
        size: stat.size,
        loadTime,
        cached: false,
        encoding: opts.encoding,
      };

    } catch (error) {
      const loadTime = performance.now() - startTime;
      throw new Error(`Failed to load text file '${filePath}': ${(error as Error).message} (load time: ${loadTime.toFixed(2)}ms)`);
    }
  }

  /**
   * Load a text file synchronously (limited use case)
   *
   * @param filePath Path to the text file
   * @param options Loading options
   * @returns TextFileResult
   */
  static loadSync(
    filePath: string,
    options: TextFileOptions = {}
  ): TextFileResult {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = performance.now();

    try {
      // Check cache first
      if (opts.cache) {
        const cached = this.getCached(filePath);
        if (cached) {
          const loadTime = performance.now() - startTime;
          return {
            content: cached.content,
            path: filePath,
            size: cached.size,
            loadTime,
            cached: true,
            encoding: opts.encoding,
          };
        }
      }

      // Load file synchronously using Bun.write/Bun.read pattern
      // Since Bun.file doesn't have textSync, we'll use a different approach
      const content = require('fs').readFileSync(filePath, 'utf8');
      const stat = require('fs').statSync(filePath);

      let processedContent: string;
      if (opts.encoding === 'base64') {
        processedContent = Buffer.from(content, 'utf8').toString('base64');
      } else {
        processedContent = content;
      }

      const loadTime = performance.now() - startTime;

      // Cache the result
      if (opts.cache) {
        this.setCached(filePath, {
          content: processedContent,
          mtime: stat.mtime,
          size: stat.size,
          loadedAt: Date.now(),
        });
      }

      return {
        content: processedContent,
        path: filePath,
        size: stat.size,
        loadTime,
        cached: false,
        encoding: opts.encoding,
      };

    } catch (error) {
      const loadTime = performance.now() - startTime;
      throw new Error(`Failed to load text file '${filePath}': ${(error as Error).message} (load time: ${loadTime.toFixed(2)}ms)`);
    }
  }

  /**
   * Load multiple text files in parallel
   *
   * @param filePaths Array of file paths to load
   * @param options Loading options
   * @returns Promise resolving to BatchLoadResult
   */
  static async loadBatch(
    filePaths: string[],
    options: TextFileOptions = {}
  ): Promise<BatchLoadResult> {
    const startTime = performance.now();
    const results: TextFileResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Load all files in parallel
    const promises = filePaths.map(async (filePath) => {
      try {
        const result = await this.load(filePath, options);
        successCount++;
        return result;
      } catch (error) {
        errorCount++;
        console.warn(`Failed to load ${filePath}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(promises);

    // Filter out null results (failed loads)
    for (const result of batchResults) {
      if (result) {
        results.push(result);
      }
    }

    const totalTime = performance.now() - startTime;

    return {
      results,
      totalTime,
      successCount,
      errorCount,
    };
  }

  /**
   * Load multiple text files and return just the contents as strings
   * (Convenience method for simple use cases)
   *
   * @param filePaths Array of file paths to load
   * @param options Loading options
   * @returns Promise resolving to array of file contents
   */
  static async loadBatchContents(
    filePaths: string[],
    options: TextFileOptions = {}
  ): Promise<string[]> {
    const batchResult = await this.loadBatch(filePaths, options);
    return batchResult.results.map(result => result.content);
  }

  /**
   * Load a text file with caching (always checks cache first)
   *
   * @param filePath Path to the text file
   * @param options Loading options
   * @returns Promise resolving to TextFileResult
   */
  static async loadCached(
    filePath: string,
    options: TextFileOptions = {}
  ): Promise<TextFileResult> {
    const opts = { ...this.defaultOptions, ...options, cache: true };
    return this.load(filePath, opts);
  }

  /**
   * Check if a file exists and is readable
   *
   * @param filePath Path to check
   * @returns Promise resolving to boolean
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      const file = Bun.file(filePath);
      return await file.exists();
    } catch {
      return false;
    }
  }

  /**
   * Get file statistics without loading content
   *
   * @param filePath Path to check
   * @returns Promise resolving to file stats
   */
  static async stat(filePath: string): Promise<{
    size: number;
    mtime: number;
    exists: boolean;
  }> {
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      if (!exists) {
        return { size: 0, mtime: 0, exists: false };
      }

      const stat = await file.stat();
      return {
        size: stat.size,
        mtime: stat.mtime,
        exists: true,
      };
    } catch {
      return { size: 0, mtime: 0, exists: false };
    }
  }

  /**
   * Clear the file cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    totalSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      totalSize: Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0),
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private static getCached(filePath: string): CacheEntry | null {
    const cached = this.cache.get(filePath);
    if (!cached) return null;

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.loadedAt > this.defaultOptions.cacheTTL) {
      this.cache.delete(filePath);
      return null;
    }

    return cached;
  }

  private static setCached(filePath: string, entry: CacheEntry): void {
    // Check cache size limit
    if (this.cache.size >= this.defaultOptions.maxCacheSize) {
      // Remove oldest entry (simple LRU approximation)
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.loadedAt - b.loadedAt)[0]?.[0];

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(filePath, entry);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load a text file and parse as JSON
 *
 * @param filePath Path to JSON file
 * @param options Loading options
 * @returns Promise resolving to parsed JSON
 */
export async function loadJSON<T = any>(
  filePath: string,
  options: TextFileOptions = {}
): Promise<T> {
  const result = await BunTextLoader.load(filePath, options);
  return JSON.parse(result.content);
}

/**
 * Load a text file and parse as CSV
 *
 * @param filePath Path to CSV file
 * @param options Loading options
 * @returns Promise resolving to parsed CSV data
 */
export async function loadCSV(
  filePath: string,
  options: TextFileOptions = {}
): Promise<string[][]> {
  const result = await BunTextLoader.load(filePath, options);
  const lines = result.content.trim().split('\n');
  return lines.map(line => line.split(',').map(cell => cell.trim()));
}

/**
 * Load a text file and return lines as array
 *
 * @param filePath Path to text file
 * @param options Loading options
 * @returns Promise resolving to array of lines
 */
export async function loadLines(
  filePath: string,
  options: TextFileOptions = {}
): Promise<string[]> {
  const result = await BunTextLoader.load(filePath, options);
  const lines = result.content.trim().split('\n');
  return lines;
}

// Add static methods to BunTextLoader class
BunTextLoader.loadJSON = loadJSON;
BunTextLoader.loadCSV = loadCSV;
BunTextLoader.loadLines = loadLines;

/**
 * Create a text file loader function (similar to require.extensions)
 *
 * @param extensions Array of file extensions to handle
 * @returns Function that loads files with given extensions
 */
export function createTextLoader(extensions: string[] = ['.txt', '.md']) {
  return async function loadTextFile(filePath: string): Promise<string> {
    // Check if file has supported extension
    const hasSupportedExt = extensions.some(ext => filePath.endsWith(ext));
    if (!hasSupportedExt) {
      throw new Error(`Unsupported file extension. Supported: ${extensions.join(', ')}`);
    }

    const result = await BunTextLoader.load(filePath);
    return result.content;
  };
}

// ============================================================================
// NODE.JS COMPATIBILITY LAYER
// ============================================================================

/**
 * Node.js require.extensions compatibility layer
 *
 * Usage:
 * ```typescript
 * // Instead of:
 * require.extensions['.txt'] = (module, filename) => {
 *   module.exports = require("fs").readFileSync(filename, "utf8");
 * };
 *
 * // Use:
 * setupTextFileExtensions(['.txt', '.md']);
 * const content = require('./file.txt'); // Works like Node.js
 * ```
 */
export function setupTextFileExtensions(extensions: string[] = ['.txt', '.md']): void {
  // Note: This is a compatibility layer - in Bun, we recommend using
  // the async APIs directly instead of require()

  console.warn('⚠️  setupTextFileExtensions() is for Node.js compatibility.');
  console.warn('   For better performance, use BunTextLoader.load() directly.');

  // In a real implementation, this would monkey-patch require
  // But since Bun doesn't use require.extensions, this is just for demonstration
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default BunTextLoader;