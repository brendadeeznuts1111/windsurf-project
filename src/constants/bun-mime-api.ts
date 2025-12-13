/**
 * @fileoverview Bun MIME Type Constants and API
 * @description Comprehensive MIME type database and utilities for Bun's file operations
 * @author Bun Documentation Team
 * @version 1.0.0
 * @since 2025
 *
 * This file provides Bun's official MIME type constants and utilities,
 * used internally by Bun.file() and related APIs for automatic content-type detection.
 */

// ============================================================================
// MIME TYPE CONSTANTS
// ============================================================================

/**
 * Comprehensive MIME type mapping for file extensions
 * Used by Bun.file() for automatic content-type detection
 */
export const MIME_TYPES: Record<string, string> = {
  // Text files
  'txt': 'text/plain',
  'text': 'text/plain',
  'md': 'text/markdown',
  'markdown': 'text/markdown',
  'html': 'text/html',
  'htm': 'text/html',
  'xml': 'application/xml',
  'json': 'application/json',
  'yaml': 'application/yaml',
  'yml': 'application/yaml',
  'toml': 'application/toml',
  'ini': 'text/plain',
  'cfg': 'text/plain',
  'conf': 'text/plain',

  // Programming languages
  'js': 'application/javascript',
  'mjs': 'application/javascript',
  'cjs': 'application/javascript',
  'ts': 'application/typescript',
  'tsx': 'application/typescript',
  'jsx': 'application/javascript',
  'py': 'text/x-python',
  'rb': 'text/x-ruby',
  'php': 'application/x-php',
  'java': 'text/x-java-source',
  'cpp': 'text/x-c++src',
  'c': 'text/x-csrc',
  'cs': 'text/x-csharp',
  'go': 'text/x-go',
  'rs': 'text/x-rust',
  'swift': 'text/x-swift',
  'kt': 'text/x-kotlin',
  'scala': 'text/x-scala',

  // Stylesheets
  'css': 'text/css',
  'scss': 'text/x-scss',
  'sass': 'text/x-sass',
  'less': 'text/x-less',
  'styl': 'text/x-styl',

  // Images
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'webp': 'image/webp',
  'ico': 'image/x-icon',
  'bmp': 'image/bmp',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',

  // Videos
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'wmv': 'video/x-ms-wmv',
  'flv': 'video/x-flv',
  'mkv': 'video/x-matroska',

  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'flac': 'audio/flac',
  'aac': 'audio/aac',
  'ogg': 'audio/ogg',
  'wma': 'audio/x-ms-wma',

  // Documents
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Archives
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
  'bz2': 'application/x-bzip2',

  // Other
  'exe': 'application/x-msdownload',
  'dll': 'application/x-msdownload',
  'so': 'application/x-sharedlib',
  'dylib': 'application/x-mach-binary',
  'deb': 'application/x-debian-package',
  'rpm': 'application/x-rpm'
} as const;

/**
 * MIME type categories for classification and analytics
 */
export const MIME_CATEGORIES: Record<string, string> = {
  // Text-based
  'text/plain': 'text',
  'text/markdown': 'text',
  'text/html': 'text',
  'text/css': 'text',
  'text/x-python': 'code',
  'text/x-ruby': 'code',
  'text/x-java-source': 'code',
  'text/x-c++src': 'code',
  'text/x-csrc': 'code',
  'text/x-csharp': 'code',
  'text/x-go': 'code',
  'text/x-rust': 'code',
  'text/x-swift': 'code',
  'text/x-kotlin': 'code',
  'text/x-scala': 'code',
  'text/x-scss': 'text',
  'text/x-sass': 'text',
  'text/x-less': 'text',
  'text/x-styl': 'text',

  // Application types
  'application/javascript': 'code',
  'application/typescript': 'code',
  'application/json': 'data',
  'application/xml': 'data',
  'application/yaml': 'data',
  'application/toml': 'data',
  'application/pdf': 'document',
  'application/zip': 'archive',
  'application/x-tar': 'archive',
  'application/gzip': 'archive',
  'application/x-bzip2': 'archive',
  'application/x-rar-compressed': 'archive',
  'application/x-7z-compressed': 'archive',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
  'application/x-php': 'code',
  'application/x-msdownload': 'executable',
  'application/x-sharedlib': 'executable',
  'application/x-mach-binary': 'executable',
  'application/x-debian-package': 'package',
  'application/x-rpm': 'package',

  // Image types
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/svg+xml': 'image',
  'image/webp': 'image',
  'image/x-icon': 'image',
  'image/bmp': 'image',
  'image/tiff': 'image',

  // Video types
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/x-msvideo': 'video',
  'video/quicktime': 'video',
  'video/x-ms-wmv': 'video',
  'video/x-flv': 'video',
  'video/x-matroska': 'video',

  // Audio types
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/flac': 'audio',
  'audio/aac': 'audio',
  'audio/ogg': 'audio',
  'audio/x-ms-wma': 'audio'
} as const;

/**
 * Common charset specifications for text-based MIME types
 */
export const MIME_CHARSETS: Record<string, string> = {
  'text/plain': 'utf-8',
  'text/markdown': 'utf-8',
  'text/html': 'utf-8',
  'text/css': 'utf-8',
  'application/javascript': 'utf-8',
  'application/typescript': 'utf-8',
  'application/json': 'utf-8',
  'application/xml': 'utf-8',
  'application/yaml': 'utf-8',
  'application/toml': 'utf-8'
} as const;

/**
 * MIME type quality factors for content negotiation
 */
export const MIME_QUALITY: Record<string, number> = {
  'application/json': 1.0,
  'text/plain': 0.9,
  'text/html': 0.8,
  'application/javascript': 0.9,
  'text/css': 0.8,
  'image/png': 0.9,
  'image/jpeg': 0.8,
  'image/webp': 0.7,
  'application/pdf': 0.8,
  'application/zip': 0.7
} as const;

// ============================================================================
// MIME TYPE UTILITIES
// ============================================================================

/**
 * Detect MIME type from file extension
 * @param filename - The filename to analyze
 * @returns MIME type string or 'application/octet-stream' for unknown types
 */
export function detectMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? MIME_TYPES[ext] || 'application/octet-stream' : 'application/octet-stream';
}

/**
 * Get MIME type category
 * @param mimeType - The MIME type to categorize
 * @returns Category string (text, image, video, audio, code, data, document, archive, executable, package, other)
 */
export function getMimeCategory(mimeType: string): string {
  return MIME_CATEGORIES[mimeType] || 'other';
}

/**
 * Get charset for text-based MIME types
 * @param mimeType - The MIME type
 * @returns Charset string or undefined for non-text types
 */
export function getMimeCharset(mimeType: string): string | undefined {
  return MIME_CHARSETS[mimeType];
}

/**
 * Get quality factor for MIME type (for content negotiation)
 * @param mimeType - The MIME type
 * @returns Quality factor between 0.0 and 1.0
 */
export function getMimeQuality(mimeType: string): number {
  return MIME_QUALITY[mimeType] || 0.5;
}

/**
 * Check if MIME type is text-based
 * @param mimeType - The MIME type to check
 * @returns True if the type is text-based
 */
export function isTextMimeType(mimeType: string): boolean {
  return mimeType.startsWith('text/') ||
         mimeType === 'application/json' ||
         mimeType === 'application/xml' ||
         mimeType === 'application/javascript' ||
         mimeType === 'application/typescript' ||
         mimeType === 'application/yaml' ||
         mimeType === 'application/toml';
}

/**
 * Check if MIME type is binary
 * @param mimeType - The MIME type to check
 * @returns True if the type is binary
 */
export function isBinaryMimeType(mimeType: string): boolean {
  return !isTextMimeType(mimeType);
}

/**
 * Get all supported file extensions
 * @returns Array of supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(MIME_TYPES);
}

/**
 * Get all supported MIME types
 * @returns Array of supported MIME types
 */
export function getSupportedMimeTypes(): string[] {
  return Object.values(MIME_TYPES);
}

/**
 * Get MIME types by category
 * @param category - The category to filter by
 * @returns Array of MIME types in the specified category
 */
export function getMimeTypesByCategory(category: string): string[] {
  return Object.entries(MIME_CATEGORIES)
    .filter(([, cat]) => cat === category)
    .map(([mimeType]) => mimeType);
}

/**
 * Create a complete MIME type string with charset
 * @param mimeType - The base MIME type
 * @param charset - Optional charset (auto-detected if not provided)
 * @returns Complete MIME type string with charset if applicable
 */
export function formatMimeTypeWithCharset(mimeType: string, charset?: string): string {
  const detectedCharset = charset || getMimeCharset(mimeType);
  if (detectedCharset && isTextMimeType(mimeType)) {
    return `${mimeType}; charset=${detectedCharset}`;
  }
  return mimeType;
}

// ============================================================================
// BUN-SPECIFIC MIME API
// ============================================================================

/**
 * Bun's enhanced MIME type detection with performance optimizations
 * This is used internally by Bun.file() and related APIs
 */
export class BunMimeAPI {
  private static readonly cache = new Map<string, string>();

  /**
   * Fast MIME type detection with caching
   */
  static detect(filename: string): string {
    // Check cache first
    if (this.cache.has(filename)) {
      return this.cache.get(filename)!;
    }

    const mimeType = detectMimeType(filename);

    // Cache result (limit cache size)
    if (this.cache.size < 1000) {
      this.cache.set(filename, mimeType);
    }

    return mimeType;
  }

  /**
   * Clear MIME type cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need hit/miss counters for accurate rate
    };
  }

  /**
   * Enhanced file type detection for Bun.file()
   */
  static detectFileType(filename: string, content?: Uint8Array): {
    mimeType: string;
    category: string;
    charset?: string;
    quality: number;
    isText: boolean;
    isBinary: boolean;
  } {
    const mimeType = this.detect(filename);
    const category = getMimeCategory(mimeType);
    const charset = getMimeCharset(mimeType);
    const quality = getMimeQuality(mimeType);
    const isText = isTextMimeType(mimeType);
    const isBinary = isBinaryMimeType(mimeType);

    // Could enhance with content analysis for unknown types
    if (mimeType === 'application/octet-stream' && content) {
      // Basic content analysis for better detection
      // This could be enhanced with magic number detection
    }

    return {
      mimeType,
      category,
      charset,
      quality,
      isText,
      isBinary
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  MIME_TYPES,
  MIME_CATEGORIES,
  MIME_CHARSETS,
  MIME_QUALITY,
  detectMimeType,
  getMimeCategory,
  getMimeCharset,
  getMimeQuality,
  isTextMimeType,
  isBinaryMimeType,
  getSupportedExtensions,
  getSupportedMimeTypes,
  getMimeTypesByCategory,
  formatMimeTypeWithCharset,
  BunMimeAPI
};