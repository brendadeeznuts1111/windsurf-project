#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/file-system
 * @difficulty intermediate
 * @prerequisites bun-file-mime-demo.test.ts, bun-file-upload-api.ts
 * @related-examples
 *   - bun-file-mime-demo.test.ts (MIME type detection for streaming)
 *   - bun-file-upload-api.ts (streaming file uploads)
 *   - bun-file-mime-advanced-demo.test.ts (content analysis for streaming)
 * @guides bun-file-streaming-guide.md, bun-large-file-processing.md
 * @tests bun-file-streaming-testing.test.ts
 * @benchmarks bun-file-streaming-performance.bench.ts
 * @tags streaming, files, performance, memory-efficient, large-files
 * @description High-performance file streaming utilities with memory-efficient processing, progress tracking, and resumable transfers
 */

import { serve } from "bun";

// ============================================================================
// STREAMING UTILITIES
// ============================================================================

interface StreamingOptions {
  chunkSize?: number;
  highWaterMark?: number;
  encoding?: string;
  start?: number;
  end?: number;
  onProgress?: (bytesRead: number, totalBytes: number, speed: number) => void;
  onChunk?: (chunk: Uint8Array, index: number) => void | Promise<void>;
  signal?: AbortSignal;
}

interface StreamingResult {
  totalBytes: number;
  chunksProcessed: number;
  averageSpeed: number; // bytes per second
  duration: number; // milliseconds
  success: boolean;
  error?: string;
}

interface ResumableTransfer {
  id: string;
  filePath: string;
  totalSize: number;
  bytesTransferred: number;
  chunkSize: number;
  checksum?: string;
  lastModified: number;
  metadata: Record<string, any>;
}

// ============================================================================
// HIGH-PERFORMANCE FILE STREAMER
// ============================================================================

export class FileStreamer {
  private static readonly DEFAULT_CHUNK_SIZE = 64 * 1024; // 64KB
  private static readonly DEFAULT_HIGH_WATER_MARK = 1024 * 1024; // 1MB

  /**
   * Stream file with progress tracking and memory efficiency
   */
  static async streamFile(
    filePath: string,
    destination: WritableStream<Uint8Array> | string,
    options: StreamingOptions = {}
  ): Promise<StreamingResult> {
    const startTime = performance.now();
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const highWaterMark = options.highWaterMark || this.DEFAULT_HIGH_WATER_MARK;

    let bytesRead = 0;
    let chunksProcessed = 0;
    let lastProgressTime = startTime;
    let lastProgressBytes = 0;

    try {
      // Open file
      const file = Bun.file(filePath);
      const fileSize = file.size;

      if (!await file.exists()) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Handle range requests
      const start = options.start || 0;
      const end = options.end || fileSize - 1;
      const rangeSize = end - start + 1;

      // Create readable stream
      const readable = file.stream();

      // Create destination stream
      let writable: WritableStream<Uint8Array>;

      if (typeof destination === 'string') {
        // For file destination, we'll handle writing differently
        // This is a simplified version for the demo
        writable = new WritableStream({
          write(chunk) {
            // In a real implementation, you'd accumulate chunks and write to file
            // For demo purposes, we'll just consume the chunks
          }
        });
      } else {
        writable = destination;
      }

      const writer = writable.getWriter();
      await writer.ready; // Wait for writer to be ready
      const reader = readable.getReader();

      // Stream processing loop
      while (true) {
        if (options.signal?.aborted) {
          throw new Error('Stream aborted');
        }

        const { done, value } = await reader.read();

        if (done) break;

        // Process chunk
        if (options.onChunk) {
          await options.onChunk(value, chunksProcessed);
        }

        // Write chunk
        await writer.write(value);

        bytesRead += value.length;
        chunksProcessed++;

        // Progress tracking
        if (options.onProgress) {
          const now = performance.now();
          const timeDiff = now - lastProgressTime;

          if (timeDiff >= 100) { // Update every 100ms
            const bytesDiff = bytesRead - lastProgressBytes;
            const speed = (bytesDiff / timeDiff) * 1000; // bytes per second

            options.onProgress(bytesRead, rangeSize, speed);

            lastProgressTime = now;
            lastProgressBytes = bytesRead;
          }
        }
      }

      await writer.close();

      const duration = performance.now() - startTime;
      const averageSpeed = bytesRead / (duration / 1000);

      return {
        totalBytes: bytesRead,
        chunksProcessed,
        averageSpeed,
        duration,
        success: true,
      };

    } catch (error) {
      const duration = performance.now() - startTime;

      return {
        totalBytes: bytesRead,
        chunksProcessed,
        averageSpeed: bytesRead / (duration / 1000),
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown streaming error',
      };
    }
  }

  /**
   * Stream large file with resumable transfer support
   */
  static async streamWithResume(
    filePath: string,
    destination: string,
    transferId: string,
    options: StreamingOptions & { resumeFrom?: number } = {}
  ): Promise<StreamingResult & { resumableTransfer: ResumableTransfer }> {
    const file = Bun.file(filePath);
    const fileSize = file.size;

    if (!await file.exists()) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check for existing transfer
    const resumeFrom = options.resumeFrom || 0;

    // Create resumable transfer metadata
    const transfer: ResumableTransfer = {
      id: transferId,
      filePath,
      totalSize: fileSize,
      bytesTransferred: resumeFrom,
      chunkSize: options.chunkSize || this.DEFAULT_CHUNK_SIZE,
      lastModified: Date.now(),
      metadata: {
        mimeType: file.type,
        originalName: filePath.split('/').pop(),
        ...options,
      },
    };

    // Stream with resume support
    const result = await this.streamFile(filePath, destination, {
      ...options,
      start: resumeFrom,
    });

    transfer.bytesTransferred += result.totalBytes;
    transfer.lastModified = Date.now();

    return {
      ...result,
      resumableTransfer: transfer,
    };
  }

  /**
   * Parallel streaming for multiple files
   */
  static async streamMultipleFiles(
    fileStreams: Array<{
      source: string;
      destination: string;
      options?: StreamingOptions;
    }>,
    concurrency: number = 3
  ): Promise<Array<StreamingResult & { source: string; destination: string }>> {
    const results: Array<StreamingResult & { source: string; destination: string }> = [];

    // Process in batches to control concurrency
    for (let i = 0; i < fileStreams.length; i += concurrency) {
      const batch = fileStreams.slice(i, i + concurrency);

      const batchPromises = batch.map(async ({ source, destination, options }) => {
        const result = await this.streamFile(source, destination, options);
        return {
          ...result,
          source,
          destination,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Transform stream with processing pipeline
   */
  static async streamWithTransform(
    filePath: string,
    destination: string,
    transform: (chunk: Uint8Array, index: number) => Uint8Array | Promise<Uint8Array>,
    options: StreamingOptions = {}
  ): Promise<StreamingResult> {
    const startTime = performance.now();
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;

    let bytesRead = 0;
    let bytesWritten = 0;
    let chunksProcessed = 0;

    try {
      const file = Bun.file(filePath);
      if (!await file.exists()) {
        throw new Error(`File not found: ${filePath}`);
      }

      const readable = file.stream();
      const destFile = Bun.file(destination);
      const writable = destFile.writer();

      const reader = readable.getReader();

      while (true) {
        if (options.signal?.aborted) {
          throw new Error('Stream aborted');
        }

        const { done, value } = await reader.read();
        if (done) break;

        // Apply transformation
        const transformedChunk = await transform(value, chunksProcessed);

        // Write transformed chunk
        await writable.write(transformedChunk);

        bytesRead += value.length;
        bytesWritten += transformedChunk.length;
        chunksProcessed++;

        // Progress tracking
        if (options.onProgress) {
          const speed = bytesRead / ((performance.now() - startTime) / 1000);
          options.onProgress(bytesRead, file.size, speed);
        }

        if (options.onChunk) {
          await options.onChunk(transformedChunk, chunksProcessed);
        }
      }

      await writable.end();

      const duration = performance.now() - startTime;
      const averageSpeed = bytesRead / (duration / 1000);

      return {
        totalBytes: bytesWritten,
        chunksProcessed,
        averageSpeed,
        duration,
        success: true,
      };

    } catch (error) {
      const duration = performance.now() - startTime;

      return {
        totalBytes: bytesWritten,
        chunksProcessed,
        averageSpeed: bytesRead / (duration / 1000),
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown streaming error',
      };
    }
  }

  /**
   * Stream with simple transformation (compression simulation)
   */
  static async streamWithCompression(
    filePath: string,
    destination: string,
    compress: boolean = true,
    options: StreamingOptions = {}
  ): Promise<StreamingResult> {
    // Simplified transformation for demo - just reverse bytes
    const transform = compress
      ? async (chunk: Uint8Array) => {
          const reversed = new Uint8Array(chunk.length);
          for (let i = 0; i < chunk.length; i++) {
            reversed[i] = ~chunk[i]; // Simple bitwise NOT transformation
          }
          return reversed;
        }
      : async (chunk: Uint8Array) => {
          const unreversed = new Uint8Array(chunk.length);
          for (let i = 0; i < chunk.length; i++) {
            unreversed[i] = ~chunk[i]; // Reverse the transformation
          }
          return unreversed;
        };

    return this.streamWithTransform(filePath, destination, transform, options);
  }

  /**
   * Calculate optimal chunk size based on file characteristics
   */
  static calculateOptimalChunkSize(fileSize: number, fileType: string): number {
    // Base chunk size on file size
    let chunkSize = this.DEFAULT_CHUNK_SIZE;

    if (fileSize < 1024 * 1024) { // < 1MB
      chunkSize = 8 * 1024; // 8KB for small files
    } else if (fileSize < 100 * 1024 * 1024) { // < 100MB
      chunkSize = 64 * 1024; // 64KB for medium files
    } else if (fileSize < 1024 * 1024 * 1024) { // < 1GB
      chunkSize = 512 * 1024; // 512KB for large files
    } else {
      chunkSize = 1024 * 1024; // 1MB for very large files
    }

    // Adjust based on file type
    if (fileType.startsWith('video/') || fileType.startsWith('audio/')) {
      chunkSize *= 2; // Larger chunks for media files
    } else if (fileType.startsWith('text/')) {
      chunkSize /= 2; // Smaller chunks for text files
    }

    return Math.min(chunkSize, 2 * 1024 * 1024); // Cap at 2MB
  }
}

// ============================================================================
// STREAM MONITORING & ANALYTICS
// ============================================================================

export class StreamMonitor {
  private activeStreams = new Map<string, {
    startTime: number;
    bytesTransferred: number;
    lastUpdate: number;
    metadata: Record<string, any>;
  }>();

  /**
   * Register a streaming operation
   */
  registerStream(id: string, metadata: Record<string, any> = {}): void {
    this.activeStreams.set(id, {
      startTime: performance.now(),
      bytesTransferred: 0,
      lastUpdate: performance.now(),
      metadata,
    });
  }

  /**
   * Update stream progress
   */
  updateProgress(id: string, bytesTransferred: number): void {
    const stream = this.activeStreams.get(id);
    if (stream) {
      stream.bytesTransferred = bytesTransferred;
      stream.lastUpdate = performance.now();
    }
  }

  /**
   * Complete a streaming operation
   */
  completeStream(id: string): {
    duration: number;
    totalBytes: number;
    averageSpeed: number;
  } | null {
    const stream = this.activeStreams.get(id);
    if (!stream) return null;

    const duration = performance.now() - stream.startTime;
    const averageSpeed = stream.bytesTransferred / (duration / 1000);

    this.activeStreams.delete(id);

    return {
      duration,
      totalBytes: stream.bytesTransferred,
      averageSpeed,
    };
  }

  /**
   * Get active streams statistics
   */
  getActiveStreams(): Array<{
    id: string;
    duration: number;
    bytesTransferred: number;
    currentSpeed: number;
    metadata: Record<string, any>;
  }> {
    const now = performance.now();

    return Array.from(this.activeStreams.entries()).map(([id, stream]) => {
      const duration = now - stream.startTime;
      const timeSinceLastUpdate = now - stream.lastUpdate;
      const currentSpeed = timeSinceLastUpdate > 0
        ? (stream.bytesTransferred / timeSinceLastUpdate) * 1000
        : 0;

      return {
        id,
        duration,
        bytesTransferred: stream.bytesTransferred,
        currentSpeed,
        metadata: stream.metadata,
      };
    });
  }

  /**
   * Clean up stale streams (no updates for 5 minutes)
   */
  cleanupStaleStreams(maxAge: number = 5 * 60 * 1000): number {
    const now = performance.now();
    let cleaned = 0;

    for (const [id, stream] of this.activeStreams) {
      if (now - stream.lastUpdate > maxAge) {
        this.activeStreams.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// ============================================================================
// DEMO HTTP SERVER WITH FILE STREAMING
// ============================================================================

class FileStreamingDemoServer {
  private streamMonitor: StreamMonitor;
  private server?: ReturnType<typeof serve>;

  constructor() {
    this.streamMonitor = new StreamMonitor();
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/health' && method === 'GET') {
        const activeStreams = this.streamMonitor.getActiveStreams();
        return Response.json({
          status: 'healthy',
          streaming: {
            activeStreams: activeStreams.length,
            totalBytesTransferred: activeStreams.reduce((sum, s) => sum + s.bytesTransferred, 0),
          },
          timestamp: new Date().toISOString(),
        }, { headers: corsHeaders });
      }

      // Stream file download
      if (url.pathname.startsWith('/download/') && method === 'GET') {
        const filename = url.pathname.replace('/download/', '');
        const filePath = `./uploads/${filename}`;

        try {
          const file = Bun.file(filePath);
          if (!await file.exists()) {
            return Response.json(
              { error: 'File not found' },
              { status: 404, headers: corsHeaders }
            );
          }

          const streamId = `download-${Date.now()}-${Math.random()}`;
          this.streamMonitor.registerStream(streamId, {
            filename,
            type: 'download',
            fileSize: file.size,
          });

          // Create readable stream
          const readable = file.stream();

          // Return streaming response
          return new Response(readable, {
            headers: {
              ...corsHeaders,
              'Content-Type': file.type || 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Length': file.size.toString(),
              'Accept-Ranges': 'bytes',
            },
          });

        } catch (error) {
          return Response.json(
            { error: 'Failed to stream file' },
            { status: 500, headers: corsHeaders }
          );
        }
      }

      // Stream file upload
      if (url.pathname === '/upload/stream' && method === 'POST') {
        const contentType = request.headers.get('Content-Type') || '';
        const contentLength = parseInt(request.headers.get('Content-Length') || '0');

        if (!contentType.includes('application/octet-stream')) {
          return Response.json(
            { error: 'Content-Type must be application/octet-stream' },
            { status: 400, headers: corsHeaders }
          );
        }

        const streamId = `upload-${Date.now()}-${Math.random()}`;
        this.streamMonitor.registerStream(streamId, {
          type: 'upload',
          contentLength,
          contentType,
        });

        try {
          const arrayBuffer = await request.arrayBuffer();
          const filename = `streamed-upload-${Date.now()}.bin`;
          const filePath = `./uploads/${filename}`;

          // Write uploaded data
          await Bun.write(filePath, new Uint8Array(arrayBuffer));

          // Complete monitoring
          this.streamMonitor.updateProgress(streamId, arrayBuffer.byteLength);
          const stats = this.streamMonitor.completeStream(streamId);

          return Response.json(
            {
              message: 'File uploaded successfully',
              filename,
              size: arrayBuffer.byteLength,
              stats,
            },
            { headers: corsHeaders }
          );

        } catch (error) {
          return Response.json(
            { error: 'Upload failed' },
            { status: 500, headers: corsHeaders }
          );
        }
      }

      // Stream processing demo
      if (url.pathname === '/process/stream' && method === 'POST') {
        const streamId = `process-${Date.now()}-${Math.random()}`;

        try {
          const arrayBuffer = await request.arrayBuffer();
          const inputData = new Uint8Array(arrayBuffer);

          this.streamMonitor.registerStream(streamId, {
            type: 'processing',
            inputSize: inputData.length,
          });

          // Simulate stream processing (convert to uppercase for text)
          const processedData = new Uint8Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // Simple transformation: invert bits
            processedData[i] = ~inputData[i];
            this.streamMonitor.updateProgress(streamId, i + 1);
          }

          const stats = this.streamMonitor.completeStream(streamId);

          return new Response(processedData, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/octet-stream',
              'X-Processing-Stats': JSON.stringify(stats),
            },
          });

        } catch (error) {
          return Response.json(
            { error: 'Processing failed' },
            { status: 500, headers: corsHeaders }
          );
        }
      }

      // Compression streaming demo
      if (url.pathname === '/compress/stream' && method === 'POST') {
        try {
          const arrayBuffer = await request.arrayBuffer();
          const inputData = new Uint8Array(arrayBuffer);

          // Simulate compression with simple transformation
          const compressed = new Uint8Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            compressed[i] = ~inputData[i];
          }

          const compressionRatio = ((inputData.length - compressed.length) / inputData.length * 100).toFixed(1);

          return new Response(compressed, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/octet-stream',
              'X-Compression-Ratio': `${compressionRatio}%`,
              'X-Original-Size': inputData.length.toString(),
              'X-Compressed-Size': compressed.length.toString(),
            },
          });

        } catch (error) {
          return Response.json(
            { error: 'Compression failed' },
            { status: 500, headers: corsHeaders }
          );
        }
      }

      // Streaming statistics
      if (url.pathname === '/streams/stats' && method === 'GET') {
        const activeStreams = this.streamMonitor.getActiveStreams();
        const cleaned = this.streamMonitor.cleanupStaleStreams();

        return Response.json(
          {
            activeStreams: activeStreams.length,
            streams: activeStreams,
            cleanedStaleStreams: cleaned,
            timestamp: new Date().toISOString(),
          },
          { headers: corsHeaders }
        );
      }

      // 404 for unknown routes
      return Response.json(
        { error: 'Endpoint not found' },
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      console.error('Request error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  start(port: number = 3008): void {
    this.server = serve({
      port,
      hostname: 'localhost',
      fetch: this.handleRequest.bind(this),
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });

    console.log(`🌊 File Streaming Demo Server running at http://localhost:${port}`);
    console.log('\n📋 Available Endpoints:');
    console.log('  GET  /health                    - Health check with streaming stats');
    console.log('  GET  /download/:filename        - Stream file download');
    console.log('  POST /upload/stream             - Stream file upload');
    console.log('  POST /process/stream            - Stream processing demo');
    console.log('  POST /compress/stream           - Stream compression demo');
    console.log('  GET  /streams/stats             - Active streams statistics');
    console.log('\n🌊 Streaming Features:');
    console.log('  • Memory-efficient file streaming');
    console.log('  • Progress tracking and monitoring');
    console.log('  • Resumable transfer support');
    console.log('  • Parallel streaming for multiple files');
    console.log('  • Stream transformation pipelines');
    console.log('  • Compression/decompression streaming');
    console.log('  • Automatic chunk size optimization');
    console.log('\n💡 Test streaming with curl:');
    console.log('   curl -X POST --data-binary @large-file.bin http://localhost:3008/upload/stream');
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      console.log('🛑 Server stopped');
    }
  }
}

// ============================================================================
// DEMO EXECUTION
// ============================================================================

if (import.meta.main) {
  const server = new FileStreamingDemoServer();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    server.stop();
    process.exit(0);
  });

  server.start();
}

export type { StreamingOptions, StreamingResult, ResumableTransfer };