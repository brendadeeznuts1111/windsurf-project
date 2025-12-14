/**
 * @fileoverview Enhanced MIME Type and Byte Metrics Utilities
 * @description Comprehensive MIME type detection, byte tracking, and performance metrics
 * @author Bun Documentation Team
 * @version 1.0.0
 * @since 2025
 */

export interface MimeTypeStats {
  type: string;
  count: number;
  totalBytes: number;
  averageBytes: number;
  lastUsed: Date;
}

export interface ByteMetrics {
  totalProcessed: number;
  perSecond: number;
  perMinute: number;
  perHour: number;
  peakRate: number;
  compressionRatio: number;
}

export interface FileOperationMetrics {
  reads: number;
  writes: number;
  streams: number;
  deletes: number;
  copies: number;
  moves: number;
}

export class EnhancedMimeMetrics {
  private mimeStats = new Map<string, MimeTypeStats>();
  private byteHistory: number[] = [];
  private operationMetrics: FileOperationMetrics = {
    reads: 0,
    writes: 0,
    streams: 0,
    deletes: 0,
    copies: 0,
    moves: 0
  };
  private startTime = Date.now();

  // Use Bun's official MIME type constants
  private static get MIME_TYPES(): Record<string, string> {
    // Import dynamically to avoid circular dependencies
    const { MIME_TYPES } = require('../constants/bun-mime-api');
    return MIME_TYPES;
  }

  /**
   * Detect MIME type from file extension
   */
  static detectMimeType(filename: string): string {
    const { detectMimeType } = require('../constants/bun-mime-api');
    return detectMimeType(filename);
  }

  /**
   * Get MIME type category
   */
  static getMimeCategory(mimeType: string): string {
    const { getMimeCategory } = require('../constants/bun-mime-api');
    return getMimeCategory(mimeType);
  }

  /**
   * Track file operation with MIME type and byte count
   */
  trackFileOperation(filename: string, operation: keyof FileOperationMetrics, bytes: number = 0): void {
    const mimeType = EnhancedMimeMetrics.detectMimeType(filename);

    // Update operation metrics
    this.operationMetrics[operation]++;

    // Update MIME type stats
    const existing = this.mimeStats.get(mimeType);
    if (existing) {
      existing.count++;
      existing.totalBytes += bytes;
      existing.averageBytes = existing.totalBytes / existing.count;
      existing.lastUsed = new Date();
    } else {
      this.mimeStats.set(mimeType, {
        type: mimeType,
        count: 1,
        totalBytes: bytes,
        averageBytes: bytes,
        lastUsed: new Date()
      });
    }

    // Track byte history for rate calculations
    if (bytes > 0) {
      this.byteHistory.push(bytes);
      // Keep only last 1000 entries for performance
      if (this.byteHistory.length > 1000) {
        this.byteHistory = this.byteHistory.slice(-1000);
      }
    }
  }

  /**
   * Get current byte metrics
   */
  getByteMetrics(): ByteMetrics {
    const now = Date.now();
    const elapsedSeconds = (now - this.startTime) / 1000;
    const totalBytes = this.byteHistory.reduce((sum, bytes) => sum + bytes, 0);

    const perSecond = elapsedSeconds > 0 ? totalBytes / elapsedSeconds : 0;
    const perMinute = perSecond * 60;
    const perHour = perSecond * 3600;

    // Calculate peak rate (highest per-second rate in recent history)
    let peakRate = 0;
    if (this.byteHistory.length >= 10) {
      const recentBytes = this.byteHistory.slice(-10).reduce((sum, bytes) => sum + bytes, 0);
      peakRate = recentBytes / 10; // Assuming 1 second intervals
    }

    return {
      totalProcessed: totalBytes,
      perSecond: Math.round(perSecond),
      perMinute: Math.round(perMinute),
      perHour: Math.round(perHour),
      peakRate: Math.round(peakRate),
      compressionRatio: 1.0 // Placeholder - would need original vs compressed sizes
    };
  }

  /**
   * Get MIME type statistics
   */
  getMimeStats(): MimeTypeStats[] {
    return Array.from(this.mimeStats.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Get file operation metrics
   */
  getOperationMetrics(): FileOperationMetrics {
    return { ...this.operationMetrics };
  }

  /**
   * Get top MIME types by usage
   */
  getTopMimeTypes(limit: number = 10): Array<{ type: string; count: number; category: string }> {
    return this.getMimeStats()
      .slice(0, limit)
      .map(stat => ({
        type: stat.type,
        count: stat.count,
        category: EnhancedMimeMetrics.getMimeCategory(stat.type)
      }));
  }

  /**
   * Get MIME type distribution by category
   */
  getMimeCategoryDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const stat of this.mimeStats.values()) {
      const category = EnhancedMimeMetrics.getMimeCategory(stat.type);
      distribution[category] = (distribution[category] || 0) + stat.count;
    }

    return distribution;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.mimeStats.clear();
    this.byteHistory = [];
    this.operationMetrics = {
      reads: 0,
      writes: 0,
      streams: 0,
      deletes: 0,
      copies: 0,
      moves: 0
    };
    this.startTime = Date.now();
  }

  /**
   * Export metrics for serialization
   */
  export(): {
    mimeStats: Record<string, MimeTypeStats>;
    byteMetrics: ByteMetrics;
    operationMetrics: FileOperationMetrics;
    startTime: number;
  } {
    return {
      mimeStats: Object.fromEntries(this.mimeStats),
      byteMetrics: this.getByteMetrics(),
      operationMetrics: this.operationMetrics,
      startTime: this.startTime
    };
  }

  /**
   * Import metrics from serialized data
   */
  import(data: {
    mimeStats: Record<string, MimeTypeStats>;
    byteMetrics: ByteMetrics;
    operationMetrics: FileOperationMetrics;
    startTime: number;
  }): void {
    this.mimeStats = new Map(Object.entries(data.mimeStats));
    this.operationMetrics = { ...data.operationMetrics };
    this.startTime = data.startTime;
    // Restore byte history from total processed (approximate)
    if (data.byteMetrics.totalProcessed > 0) {
      // Create a reasonable byte history based on total processed
      const avgBytesPerOperation = Math.max(1000, data.byteMetrics.totalProcessed / Math.max(1, this.operationMetrics.reads + this.operationMetrics.writes + this.operationMetrics.streams));
      const numOperations = this.operationMetrics.reads + this.operationMetrics.writes + this.operationMetrics.streams;
      this.byteHistory = Array.from({ length: Math.min(1000, numOperations) }, () => avgBytesPerOperation);
    }
  }
}

// Global instance for application-wide metrics
export const globalMimeMetrics = new EnhancedMimeMetrics();

// Enhanced Bun.file wrapper with comprehensive metrics
export function createTrackedBunFile() {
  const originalBunFile = Bun.file;

  return function(path: string | URL, options?: { type?: string }) {
    const file = originalBunFile(path, options);

    // Track the file operation
    const filename = typeof path === 'string' ? path : path.toString();
    globalMimeMetrics.trackFileOperation(filename, 'reads');

    // Enhanced method wrappers with byte tracking
    const originalText = file.text.bind(file);
    const originalBytes = file.bytes.bind(file);
    const originalArrayBuffer = file.arrayBuffer.bind(file);
    const originalJson = file.json.bind(file);

    file.text = async function() {
      const result = await originalText();
      const bytes = new Blob([result]).size;
      globalMimeMetrics.trackFileOperation(filename, 'reads', bytes);
      return result;
    };

    file.bytes = async function() {
      const result = await originalBytes();
      globalMimeMetrics.trackFileOperation(filename, 'reads', result.length);
      return result;
    };

    file.arrayBuffer = async function() {
      const result = await originalArrayBuffer();
      globalMimeMetrics.trackFileOperation(filename, 'reads', result.byteLength);
      return result;
    };

    file.json = async function() {
      const result = await originalJson();
      const bytes = new Blob([JSON.stringify(result)]).size;
      globalMimeMetrics.trackFileOperation(filename, 'reads', bytes);
      return result;
    };

    return file;
  };
}

// Utility functions for MIME type analysis
export function analyzeMimeTypeUsage(files: string[]): {
  distribution: Record<string, number>;
  topTypes: Array<{ type: string; count: number; percentage: number }>;
  categories: Record<string, number>;
} {
  const distribution: Record<string, number> = {};
  let total = 0;

  // Count MIME types
  for (const file of files) {
    const mimeType = EnhancedMimeMetrics.detectMimeType(file);
    distribution[mimeType] = (distribution[mimeType] || 0) + 1;
    total++;
  }

  // Calculate top types with percentages
  const topTypes = Object.entries(distribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / total) * 100)
    }));

  // Calculate category distribution
  const categories: Record<string, number> = {};
  for (const [mimeType, count] of Object.entries(distribution)) {
    const category = EnhancedMimeMetrics.getMimeCategory(mimeType);
    categories[category] = (categories[category] || 0) + count;
  }

  return { distribution, topTypes, categories };
}

export default EnhancedMimeMetrics;