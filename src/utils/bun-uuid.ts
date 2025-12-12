/**
 * Bun UUID Generator - EX032 Implementation
 * UUID v7 generator with bulk operations, caching, and time-based sorting
 */

export interface UUIDInfo {
  version: number;
  timestamp: Date;
  sequence: number;
  nodeId: string;
  raw: string;
}

export interface IDGenerator {
  generate(): string;
  generateBulk(count: number): string[];
}

export interface TimeBased {
  extractTimestamp(uuid: string): Date;
  isTimeOrdered(uuids: string[]): boolean;
}

/**
 * BunUUIDGenerator - EX032 Implementation
 * High-performance UUID v7 generator with caching and bulk operations
 */
export class BunUUIDGenerator implements IDGenerator, TimeBased {
  private cache: string[] = [];
  private readonly CACHE_SIZE = 10000;
  private readonly BULK_SIZE = 1000;

  /**
   * Generate a single UUID v7
   */
  generate(): string {
    // Use cached UUID if available
    if (this.cache.length > 0) {
      return this.cache.pop()!;
    }

    // Generate new UUID using Bun's native implementation
    return Bun.randomUUIDv7();
  }

  /**
   * Generate multiple UUIDs efficiently with caching
   */
  generateBulk(count: number): string[] {
    const result: string[] = [];

    // Use cached UUIDs first
    const fromCache = Math.min(count, this.cache.length);
    for (let i = 0; i < fromCache; i++) {
      result.push(this.cache.pop()!);
    }

    // Generate remaining UUIDs in bulk
    const remaining = count - fromCache;
    if (remaining > 0) {
      // Generate in chunks for efficiency
      for (let i = 0; i < remaining; i += this.BULK_SIZE) {
        const chunkSize = Math.min(this.BULK_SIZE, remaining - i);

        // Generate chunk
        for (let j = 0; j < chunkSize; j++) {
          result.push(Bun.randomUUIDv7());
        }
      }
    }

    return result;
  }

  /**
   * Parse UUID v7 and extract components
   */
  parse(uuid: string): UUIDInfo {
    // UUID v7 format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
    // Where x is any hex digit, y is one of 8, 9, A, or B

    if (!this.isValidUUIDv7(uuid)) {
      throw new Error(`Invalid UUID v7 format: ${uuid}`);
    }

    // Remove dashes for easier parsing
    const clean = uuid.replace(/-/g, '');

    // Extract timestamp (first 48 bits = 12 hex chars)
    const timestampHex = clean.substring(0, 12);
    const timestamp = parseInt(timestampHex, 16);

    // Extract sequence (next 12 bits = 3 hex chars)
    const sequenceHex = clean.substring(12, 15);
    const sequence = parseInt(sequenceHex, 16);

    // Extract node ID (remaining 62 bits = 15.5 hex chars, but we take 12)
    const nodeId = clean.substring(15, 27);

    return {
      version: 7,
      timestamp: new Date(timestamp),
      sequence,
      nodeId,
      raw: uuid
    };
  }

  /**
   * Extract timestamp from UUID v7
   */
  extractTimestamp(uuid: string): Date {
    const info = this.parse(uuid);
    return info.timestamp;
  }

  /**
   * Check if UUIDs are in time order (lexicographically sortable)
   */
  isTimeOrdered(uuids: string[]): boolean {
    for (let i = 1; i < uuids.length; i++) {
      if (uuids[i] < uuids[i - 1]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Pre-populate cache for high-throughput scenarios
   */
  async warmupCache(targetSize: number = this.CACHE_SIZE): Promise<void> {
    const actualSize = Math.min(targetSize, this.CACHE_SIZE);
    const uuids = this.generateBulk(actualSize);
    this.cache = uuids.reverse(); // Push to cache in reverse order for FIFO

    logger.debug("UUID cache warmed up", {
      cache_size: this.cache.length,
      target_size: targetSize
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.length,
      capacity: this.CACHE_SIZE,
      utilization: (this.cache.length / this.CACHE_SIZE) * 100
    };
  }

  /**
   * Validate UUID v7 format
   */
  private isValidUUIDv7(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache = [];
  }
}

// Default instance
export const uuidGenerator = new BunUUIDGenerator();

// Convenience functions
export function generateUUID(): string {
  return uuidGenerator.generate();
}

export function generateUUIDs(count: number): string[] {
  return uuidGenerator.generateBulk(count);
}

export function parseUUID(uuid: string): UUIDInfo {
  return uuidGenerator.parse(uuid);
}

export function extractUUIDTimestamp(uuid: string): Date {
  return uuidGenerator.extractTimestamp(uuid);
}

// Import logger for internal use
import { logger } from "../../examples/logging/bun-logger";