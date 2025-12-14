#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/file-system
 * @difficulty intermediate
 * @prerequisites bun-file-mime-demo.test.ts, bun-file-upload-api.ts
 * @related-examples
 *   - bun-file-mime-demo.test.ts (basic MIME type detection)
 *   - bun-file-upload-api.ts (file upload with MIME validation)
 *   - bun-file-streaming.ts (streaming with MIME types)
 * @guides bun-mime-types-advanced-guide.md, bun-file-processing.md
 * @tests bun-mime-advanced-testing.test.ts
 * @benchmarks bun-mime-advanced-performance.bench.ts
 * @tags mime, file-processing, validation, content-analysis, metadata
 * @description Advanced MIME type detection with content analysis, metadata extraction, and comprehensive file type support
 */

import { EnhancedMimeMetrics } from '../../../src/utils/enhanced-mime-metrics';

// ============================================================================
// ADVANCED MIME TYPE DETECTOR
// ============================================================================

interface MimeDetectionResult {
  mimeType: string;
  confidence: number;
  method: 'extension' | 'content' | 'magic' | 'metadata';
  charset?: string;
  encoding?: string;
  metadata?: Record<string, any>;
}

interface FileAnalysisResult {
  basic: {
    size: number;
    extension: string;
    mimeType: string;
    charset?: string;
  };
  content: {
    detectedMimeType: string;
    confidence: number;
    magicBytes?: string;
    textRatio?: number;
    entropy?: number;
  };
  metadata: {
    dimensions?: { width: number; height: number };
    duration?: number;
    bitrate?: number;
    compression?: string;
    colorSpace?: string;
    hasAlpha?: boolean;
    pageCount?: number;
    language?: string;
    encoding?: string;
  };
  security: {
    isSafe: boolean;
    warnings: string[];
    risks: string[];
  };
  processing: {
    recommendedChunkSize?: number;
    supportsStreaming: boolean;
    compressionRatio?: number;
  };
}

export class AdvancedMimeDetector {
  private static readonly MAGIC_BYTES: Record<string, { signature: number[]; offset: number; mimeType: string }> = {
    // Image formats
    'png': {
      signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      offset: 0,
      mimeType: 'image/png'
    },
    'jpeg': {
      signature: [0xFF, 0xD8, 0xFF],
      offset: 0,
      mimeType: 'image/jpeg'
    },
    'gif': {
      signature: [0x47, 0x49, 0x46, 0x38],
      offset: 0,
      mimeType: 'image/gif'
    },
    'webp': {
      signature: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
      offset: 0,
      mimeType: 'image/webp'
    },
    'bmp': {
      signature: [0x42, 0x4D],
      offset: 0,
      mimeType: 'image/bmp'
    },

    // Document formats
    'pdf': {
      signature: [0x25, 0x50, 0x44, 0x46],
      offset: 0,
      mimeType: 'application/pdf'
    },
    'zip': {
      signature: [0x50, 0x4B, 0x03, 0x04],
      offset: 0,
      mimeType: 'application/zip'
    },
    'rar': {
      signature: [0x52, 0x61, 0x72, 0x21],
      offset: 0,
      mimeType: 'application/x-rar-compressed'
    },
    'gzip': {
      signature: [0x1F, 0x8B],
      offset: 0,
      mimeType: 'application/gzip'
    },

    // Audio/Video formats
    'mp3': {
      signature: [0x49, 0x44, 0x33],
      offset: 0,
      mimeType: 'audio/mpeg'
    },
    'mp4': {
      signature: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
      offset: 4,
      mimeType: 'video/mp4'
    },
    'avi': {
      signature: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20],
      offset: 0,
      mimeType: 'video/x-msvideo'
    },

    // Text formats
    'utf8': {
      signature: [0xEF, 0xBB, 0xBF],
      offset: 0,
      mimeType: 'text/plain'
    },
    'utf16be': {
      signature: [0xFE, 0xFF],
      offset: 0,
      mimeType: 'text/plain'
    },
    'utf16le': {
      signature: [0xFF, 0xFE],
      offset: 0,
      mimeType: 'text/plain'
    },
    'utf32be': {
      signature: [0x00, 0x00, 0xFE, 0xFF],
      offset: 0,
      mimeType: 'text/plain'
    },
    'utf32le': {
      signature: [0xFF, 0xFE, 0x00, 0x00],
      offset: 0,
      mimeType: 'text/plain'
    }
  };

  private static readonly EXTENSION_MIME_MAP: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp',
    'svg': 'image/svg+xml', 'ico': 'image/x-icon', 'tiff': 'image/tiff',
    'tif': 'image/tiff', 'heic': 'image/heic', 'heif': 'image/heif',

    // Documents
    'pdf': 'application/pdf', 'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain', 'rtf': 'application/rtf',

    // Archives
    'zip': 'application/zip', 'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed', 'tar': 'application/x-tar',
    'gz': 'application/gzip', 'bz2': 'application/x-bzip2',

    // Audio
    'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'flac': 'audio/flac',
    'aac': 'audio/aac', 'ogg': 'audio/ogg', 'm4a': 'audio/mp4',

    // Video
    'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mkv': 'video/x-matroska',
    'mov': 'video/quicktime', 'wmv': 'video/x-ms-wmv', 'flv': 'video/x-flv',
    'webm': 'video/webm', 'm4v': 'video/mp4',

    // Code
    'js': 'application/javascript', 'ts': 'application/typescript',
    'json': 'application/json', 'xml': 'application/xml',
    'html': 'text/html', 'css': 'text/css', 'scss': 'text/x-scss',
    'py': 'text/x-python', 'java': 'text/x-java-source',
    'cpp': 'text/x-c++src', 'c': 'text/x-csrc', 'php': 'application/x-php',

    // Data
    'csv': 'text/csv', 'tsv': 'text/tab-separated-values',
    'yaml': 'application/x-yaml', 'yml': 'application/x-yaml',
    'toml': 'application/toml', 'ini': 'text/plain',

    // Other
    'exe': 'application/x-msdownload', 'dll': 'application/x-msdownload',
    'so': 'application/x-sharedlib', 'dylib': 'application/x-sharedlib'
  };

  /**
   * Detect MIME type using multiple methods
   */
  static async detectMimeType(filePathOrBuffer: string | Uint8Array, filename?: string): Promise<MimeDetectionResult> {
    let buffer: Uint8Array;
    let fileSize = 0;

    if (typeof filePathOrBuffer === 'string') {
      // Read file
      const file = Bun.file(filePathOrBuffer);
      buffer = new Uint8Array(await file.arrayBuffer());
      fileSize = buffer.length;
      filename = filename || filePathOrBuffer.split('/').pop() || '';
    } else {
      buffer = filePathOrBuffer;
      fileSize = buffer.length;
    }

    // Method 1: Magic byte detection (highest confidence)
    const magicResult = this.detectByMagicBytes(buffer);
    if (magicResult.confidence > 0.9) {
      return magicResult;
    }

    // Method 2: File extension (medium confidence)
    const extensionResult = this.detectByExtension(filename || '');
    if (extensionResult.confidence > 0.7) {
      return extensionResult;
    }

    // Method 3: Content analysis (fallback)
    const contentResult = this.detectByContentAnalysis(buffer);
    if (contentResult.confidence > 0.5) {
      return contentResult;
    }

    // Default fallback
    return {
      mimeType: 'application/octet-stream',
      confidence: 0.1,
      method: 'extension'
    };
  }

  /**
   * Detect MIME type using magic bytes
   */
  private static detectByMagicBytes(buffer: Uint8Array): MimeDetectionResult {
    for (const [key, magic] of Object.entries(this.MAGIC_BYTES)) {
      if (buffer.length < magic.offset + magic.signature.length) continue;

      let matches = true;
      for (let i = 0; i < magic.signature.length; i++) {
        if (buffer[magic.offset + i] !== magic.signature[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return {
          mimeType: magic.mimeType,
          confidence: 0.95,
          method: 'magic',
          charset: this.detectCharset(buffer),
        };
      }
    }

    return { mimeType: 'application/octet-stream', confidence: 0, method: 'magic' };
  }

  /**
   * Detect MIME type using file extension
   */
  private static detectByExtension(filename: string): MimeDetectionResult {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const mimeType = this.EXTENSION_MIME_MAP[extension];

    if (mimeType) {
      return {
        mimeType,
        confidence: 0.8,
        method: 'extension',
        charset: mimeType.startsWith('text/') ? 'utf-8' : undefined,
      };
    }

    return { mimeType: 'application/octet-stream', confidence: 0, method: 'extension' };
  }

  /**
   * Detect MIME type using content analysis
   */
  private static detectByContentAnalysis(buffer: Uint8Array): MimeDetectionResult {
    // Calculate text ratio
    let textChars = 0;
    let totalChars = Math.min(buffer.length, 512); // Analyze first 512 bytes

    for (let i = 0; i < totalChars; i++) {
      const byte = buffer[i];
      // Consider printable ASCII and common whitespace as text
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        textChars++;
      }
    }

    const textRatio = textChars / totalChars;

    if (textRatio > 0.9) {
      return {
        mimeType: 'text/plain',
        confidence: 0.6,
        method: 'content',
        charset: this.detectCharset(buffer),
      };
    }

    if (textRatio > 0.7) {
      // Could be JSON, XML, or other structured text
      try {
        const text = new TextDecoder().decode(buffer.slice(0, 100));
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          return {
            mimeType: 'application/json',
            confidence: 0.7,
            method: 'content',
            charset: 'utf-8',
          };
        }
        if (text.trim().startsWith('<?xml') || text.trim().startsWith('<')) {
          return {
            mimeType: 'application/xml',
            confidence: 0.7,
            method: 'content',
            charset: 'utf-8',
          };
        }
      } catch (e) {
        // Ignore decoding errors
      }
    }

    return { mimeType: 'application/octet-stream', confidence: 0.2, method: 'content' };
  }

  /**
   * Detect character encoding
   */
  private static detectCharset(buffer: Uint8Array): string | undefined {
    // Check for BOM (Byte Order Mark)
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      return 'utf-8';
    }
    if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
      return 'utf-16be';
    }
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
      return 'utf-16le';
    }
    if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0xFE && buffer[3] === 0xFF) {
      return 'utf-32be';
    }
    if (buffer.length >= 4 && buffer[0] === 0xFF && buffer[1] === 0xFE && buffer[2] === 0x00 && buffer[3] === 0x00) {
      return 'utf-32le';
    }

    // Default to UTF-8 for text content
    return 'utf-8';
  }

  /**
   * Analyze file comprehensively
   */
  static async analyzeFile(filePathOrBuffer: string | Uint8Array, filename?: string): Promise<FileAnalysisResult> {
    let buffer: Uint8Array;
    let fileSize = 0;
    let extension = '';

    if (typeof filePathOrBuffer === 'string') {
      const file = Bun.file(filePathOrBuffer);
      buffer = new Uint8Array(await file.arrayBuffer());
      fileSize = buffer.length;
      extension = filename || filePathOrBuffer.split('.').pop() || '';
    } else {
      buffer = filePathOrBuffer;
      fileSize = buffer.length;
      extension = filename?.split('.').pop() || '';
    }

    // Basic MIME detection
    const mimeResult = await this.detectMimeType(buffer, filename);
    const mimeType = mimeResult.mimeType;

    // Content analysis
    const contentAnalysis = this.analyzeContent(buffer, mimeType);

    // Metadata extraction
    const metadata = await this.extractMetadata(buffer, mimeType, extension);

    // Security analysis
    const security = this.analyzeSecurity(buffer, mimeType, extension);

    // Processing recommendations
    const processing = this.getProcessingRecommendations(mimeType, fileSize);

    return {
      basic: {
        size: fileSize,
        extension,
        mimeType,
        charset: mimeResult.charset,
      },
      content: contentAnalysis,
      metadata,
      security,
      processing,
    };
  }

  /**
   * Analyze file content characteristics
   */
  private static analyzeContent(buffer: Uint8Array, mimeType: string): FileAnalysisResult['content'] {
    // Calculate text ratio
    let textChars = 0;
    let totalChars = Math.min(buffer.length, 1024);

    for (let i = 0; i < totalChars; i++) {
      const byte = buffer[i];
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13 || byte === 32) {
        textChars++;
      }
    }

    const textRatio = textChars / totalChars;

    // Calculate entropy (file randomness)
    const byteCounts = new Array(256).fill(0);
    for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
      byteCounts[buffer[i]]++;
    }

    let entropy = 0;
    for (const count of byteCounts) {
      if (count > 0) {
        const p = count / Math.min(buffer.length, 1024);
        entropy -= p * Math.log2(p);
      }
    }

    // Detect magic bytes
    let magicBytes: string | undefined;
    for (const [key, magic] of Object.entries(this.MAGIC_BYTES)) {
      if (buffer.length >= magic.offset + magic.signature.length) {
        let matches = true;
        for (let i = 0; i < Math.min(magic.signature.length, 4); i++) {
          if (buffer[magic.offset + i] !== magic.signature[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          magicBytes = magic.signature.slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join(' ');
          break;
        }
      }
    }

    return {
      detectedMimeType: mimeType,
      confidence: 0.8, // Simplified
      magicBytes,
      textRatio,
      entropy,
    };
  }

  /**
   * Extract file metadata
   */
  private static async extractMetadata(buffer: Uint8Array, mimeType: string, extension: string): Promise<FileAnalysisResult['metadata']> {
    const metadata: FileAnalysisResult['metadata'] = {};

    // Image metadata (simplified)
    if (mimeType.startsWith('image/')) {
      // This would normally parse image headers for dimensions
      // For demo, we'll provide mock data
      if (mimeType === 'image/png' || mimeType === 'image/jpeg') {
        metadata.dimensions = { width: 1920, height: 1080 }; // Mock
        metadata.colorSpace = 'RGB';
        metadata.hasAlpha = mimeType === 'image/png';
      }
    }

    // Audio/Video metadata (simplified)
    if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
      metadata.duration = 180; // Mock 3 minutes
      metadata.bitrate = 128000; // Mock 128kbps
    }

    // Document metadata
    if (mimeType === 'application/pdf') {
      metadata.pageCount = 10; // Mock
      metadata.compression = 'FlateDecode';
    }

    // Text file metadata
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      metadata.encoding = 'utf-8';
      metadata.language = 'en'; // Mock language detection
    }

    return metadata;
  }

  /**
   * Analyze file security
   */
  private static analyzeSecurity(buffer: Uint8Array, mimeType: string, extension: string): FileAnalysisResult['security'] {
    const warnings: string[] = [];
    const risks: string[] = [];

    // Check for potentially dangerous file types
    const dangerousTypes = ['application/x-msdownload', 'application/x-sharedlib'];
    if (dangerousTypes.includes(mimeType)) {
      risks.push('Executable file detected');
    }

    // Check for script content in non-script files
    if (!mimeType.includes('javascript') && !mimeType.includes('script')) {
      const text = new TextDecoder().decode(buffer.slice(0, 512)).toLowerCase();
      if (text.includes('<script') || text.includes('javascript:') || text.includes('eval(')) {
        warnings.push('Potential script injection detected');
      }
    }

    // Check file size (very large files might be suspicious)
    if (buffer.length > 100 * 1024 * 1024) { // 100MB
      warnings.push('Unusually large file size');
    }

    // Check for hidden files
    if (extension.startsWith('.')) {
      warnings.push('Hidden file extension detected');
    }

    const isSafe = risks.length === 0;

    return {
      isSafe,
      warnings,
      risks,
    };
  }

  /**
   * Get processing recommendations
   */
  private static getProcessingRecommendations(mimeType: string, fileSize: number): FileAnalysisResult['processing'] {
    const recommendations: FileAnalysisResult['processing'] = {
      supportsStreaming: true,
      recommendedChunkSize: 64 * 1024, // 64KB default
    };

    // Large files should be streamed
    if (fileSize > 10 * 1024 * 1024) { // 10MB
      recommendations.recommendedChunkSize = 1024 * 1024; // 1MB chunks
    }

    // Some file types don't support streaming well
    const nonStreamingTypes = ['application/zip', 'application/x-rar-compressed'];
    if (nonStreamingTypes.includes(mimeType)) {
      recommendations.supportsStreaming = false;
    }

    // Estimate compression ratio
    if (mimeType.startsWith('text/')) {
      recommendations.compressionRatio = 0.3; // Text compresses well
    } else if (mimeType.startsWith('image/')) {
      recommendations.compressionRatio = 0.8; // Images already compressed
    } else {
      recommendations.compressionRatio = 0.9; // Other files vary
    }

    return recommendations;
  }
}

// ============================================================================
// DEMO APPLICATION
// ============================================================================

class AdvancedMimeDemo {
  private metrics: EnhancedMimeMetrics;

  constructor() {
    this.metrics = new EnhancedMimeMetrics();
  }

  async demonstrateAdvancedDetection(): Promise<void> {
    console.log('🔬 Advanced MIME Type Detection & Analysis Demo');
    console.log('================================================\n');

    // Test files with various types
    const testFiles = [
      'README.md', // Should exist in project
      'package.json', // Should exist
      'examples/index.ts', // TypeScript file
      'bun.lock', // Lock file
    ];

    console.log('📁 Analyzing existing project files:');
    for (const filePath of testFiles) {
      try {
        const exists = await Bun.file(filePath).exists();
        if (!exists) {
          console.log(`  ⏭️  ${filePath} - File not found, skipping`);
          continue;
        }

        console.log(`\n📄 Analyzing: ${filePath}`);
        const analysis = await AdvancedMimeDetector.analyzeFile(filePath);

        console.log(`  📊 Basic Info:`);
        console.log(`    Size: ${analysis.basic.size.toLocaleString()} bytes`);
        console.log(`    Extension: ${analysis.basic.extension}`);
        console.log(`    MIME Type: ${analysis.basic.mimeType}`);
        console.log(`    Charset: ${analysis.basic.charset || 'N/A'}`);

        console.log(`  🔍 Content Analysis:`);
        console.log(`    Detected Type: ${analysis.content.detectedMimeType}`);
        console.log(`    Confidence: ${(analysis.content.confidence * 100).toFixed(1)}%`);
        console.log(`    Text Ratio: ${(analysis.content.textRatio! * 100).toFixed(1)}%`);
        console.log(`    Entropy: ${analysis.content.entropy?.toFixed(2) || 'N/A'}`);

        if (analysis.metadata.dimensions) {
          console.log(`  📐 Dimensions: ${analysis.metadata.dimensions.width}x${analysis.metadata.dimensions.height}`);
        }
        if (analysis.metadata.duration) {
          console.log(`  ⏱️  Duration: ${analysis.metadata.duration}s`);
        }

        console.log(`  🛡️  Security:`);
        console.log(`    Safe: ${analysis.security.isSafe ? '✅' : '❌'}`);
        if (analysis.security.warnings.length > 0) {
          console.log(`    Warnings: ${analysis.security.warnings.join(', ')}`);
        }
        if (analysis.security.risks.length > 0) {
          console.log(`    Risks: ${analysis.security.risks.join(', ')}`);
        }

        console.log(`  ⚙️  Processing:`);
        console.log(`    Streaming: ${analysis.processing.supportsStreaming ? '✅' : '❌'}`);
        console.log(`    Chunk Size: ${analysis.processing.recommendedChunkSize} bytes`);
        if (analysis.processing.compressionRatio) {
          console.log(`    Compression Ratio: ${(analysis.processing.compressionRatio * 100).toFixed(1)}%`);
        }

        // Track in metrics
        this.metrics.trackFileOperation(filePath, 'reads', analysis.basic.size);

      } catch (error) {
        console.log(`  ❌ Error analyzing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Demonstrate MIME type detection methods
    console.log('\n🔍 MIME Detection Method Comparison:');
    const testBuffers = [
      { name: 'PNG Header', buffer: new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) },
      { name: 'JPEG Header', buffer: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]) },
      { name: 'JSON Text', buffer: new TextEncoder().encode('{"name": "test", "value": 123}') },
      { name: 'Plain Text', buffer: new TextEncoder().encode('Hello, World!\nThis is plain text.') },
      { name: 'Binary Data', buffer: new Uint8Array([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]) },
    ];

    for (const test of testBuffers) {
      console.log(`\n🧪 Testing: ${test.name}`);
      const result = await AdvancedMimeDetector.detectMimeType(test.buffer, `test.${test.name.toLowerCase().split(' ')[0]}`);

      console.log(`  MIME Type: ${result.mimeType}`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`  Method: ${result.method}`);
      console.log(`  Charset: ${result.charset || 'N/A'}`);
    }

    // Display metrics summary
    console.log('\n📊 Metrics Summary:');
    const byteMetrics = this.metrics.getByteMetrics();
    const mimeStats = this.metrics.getMimeStats();
    const operationMetrics = this.metrics.getOperationMetrics();

    console.log(`  Total Processed: ${byteMetrics.totalProcessed.toLocaleString()} bytes`);
    console.log(`  MIME Types Detected: ${mimeStats.length}`);
    console.log(`  Read Operations: ${operationMetrics.reads}`);

    console.log('\n🎉 Advanced MIME Type Detection & Analysis demo complete!');
    console.log('\n💡 Key Features Demonstrated:');
    console.log('   • Multi-method MIME type detection (magic bytes, extension, content analysis)');
    console.log('   • Comprehensive file analysis (content, metadata, security)');
    console.log('   • Processing recommendations and streaming support');
    console.log('   • Security analysis and risk detection');
    console.log('   • Performance metrics and tracking');
  }
}

// ============================================================================
// DEMO EXECUTION
// ============================================================================

if (import.meta.main) {
  const demo = new AdvancedMimeDemo();
  demo.demonstrateAdvancedDetection().catch(console.error);
}

export type { MimeDetectionResult, FileAnalysisResult };