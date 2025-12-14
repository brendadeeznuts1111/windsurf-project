#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/file-system
 * @difficulty intermediate
 * @prerequisites bun-file-mime-demo.test.ts, bun-serve-advanced.ts
 * @related-examples
 *   - bun-rest-crud-api.ts (integrates file uploads)
 *   - bun-file-mime-advanced-demo.test.ts (MIME type validation)
 *   - bun-rate-limiting.ts (upload rate limiting)
 * @guides bun-file-upload-guide.md, bun-multipart-form-data.md
 * @tests bun-file-upload-testing.test.ts
 * @benchmarks bun-file-upload-performance.bench.ts
 * @tags file, upload, multipart, streaming, validation, security
 * @description Complete file upload API with multipart handling, validation, streaming, and security features
 */

import { serve } from "bun";

// ============================================================================
// FILE UPLOAD TYPES & INTERFACES
// ============================================================================

interface UploadOptions {
  maxFileSize?: number;        // Max file size in bytes (default: 10MB)
  allowedTypes?: string[];     // Allowed MIME types (default: images, docs, archives)
  allowedExtensions?: string[]; // Allowed file extensions
  destination?: string;        // Upload destination directory
  filename?: (originalName: string, mimeType: string) => string; // Custom filename generator
  validateContent?: (buffer: Uint8Array, mimeType: string) => boolean; // Content validation
  onProgress?: (bytesReceived: number, totalBytes: number) => void; // Upload progress callback
  preserveOriginalName?: boolean; // Keep original filename (default: false for security)
}

interface UploadedFile {
  fieldname: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  destination: string;
  path: string;
  buffer?: Uint8Array;
  stream?: ReadableStream;
}

interface UploadResult {
  success: boolean;
  files: UploadedFile[];
  errors: string[];
  fields: Record<string, string>;
}

// ============================================================================
// FILE UPLOAD UTILITIES
// ============================================================================

class FileUploadUtils {
  /**
   * Generate safe filename
   */
  static generateSafeFilename(originalName: string, mimeType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = this.getExtensionFromMimeType(mimeType) ||
                     this.getExtensionFromFilename(originalName) ||
                     'bin';

    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Get file extension from MIME type
   */
  static getExtensionFromMimeType(mimeType: string): string | null {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/json': 'json',
      'application/zip': 'zip',
      'application/x-zip-compressed': 'zip',
      'text/csv': 'csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls',
    };

    return mimeToExt[mimeType] || null;
  }

  /**
   * Get file extension from filename
   */
  static getExtensionFromFilename(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Validate file type
   */
  static validateFileType(mimeType: string, allowedTypes: string[]): boolean {
    if (allowedTypes.includes('*/*')) return true;

    return allowedTypes.some(allowed => {
      if (allowed.includes('*')) {
        const [mainType] = allowed.split('/');
        return mimeType.startsWith(mainType + '/');
      }
      return mimeType === allowed;
    });
  }

  /**
   * Validate file extension
   */
  static validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
    if (allowedExtensions.length === 0) return true;

    const extension = this.getExtensionFromFilename(filename);
    return allowedExtensions.includes(extension);
  }

  /**
   * Basic content validation for images
   */
  static validateImageContent(buffer: Uint8Array, mimeType: string): boolean {
    // Check for common image signatures
    const signatures: Record<string, number[]> = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
    };

    const signature = signatures[mimeType];
    if (!signature) return true; // Skip validation for unknown types

    // Check if buffer starts with expected signature
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }
}

// ============================================================================
// MULTIPART FORM DATA PARSER
// ============================================================================

class MultipartParser {
  private boundary: string;
  private buffer: Uint8Array = new Uint8Array();
  private files: UploadedFile[] = [];
  private fields: Record<string, string> = {};

  constructor(boundary: string) {
    this.boundary = boundary;
  }

  /**
   * Parse multipart data from request
   */
  async parse(request: Request, options: UploadOptions = {}): Promise<UploadResult> {
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return {
        success: false,
        files: [],
        errors: ['Content-Type must be multipart/form-data'],
        fields: {},
      };
    }

    try {
      const arrayBuffer = await request.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      return this.parseMultipartData(data, options);
    } catch (error) {
      return {
        success: false,
        files: [],
        errors: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        fields: {},
      };
    }
  }

  /**
   * Parse multipart data from Uint8Array
   */
  private parseMultipartData(data: Uint8Array, options: UploadOptions): UploadResult {
    const boundaryBytes = new TextEncoder().encode('--' + this.boundary);
    const endBoundaryBytes = new TextEncoder().encode('--' + this.boundary + '--');

    let position = 0;
    const errors: string[] = [];

    while (position < data.length) {
      // Find next boundary
      const boundaryIndex = this.findBoundary(data, boundaryBytes, position);
      if (boundaryIndex === -1) break;

      // Check for end boundary
      const endBoundaryIndex = this.findBoundary(data, endBoundaryBytes, boundaryIndex);
      if (endBoundaryIndex !== -1) break;

      // Parse part
      let partEnd = this.findBoundary(data, boundaryBytes, boundaryIndex + boundaryBytes.length);
      if (partEnd === -1) {
        partEnd = data.length;
      }

      const partData = data.slice(boundaryIndex + boundaryBytes.length, partEnd);
      const result = this.parsePart(partData, options);

      if (result.file) {
        this.files.push(result.file);
      } else if (result.field) {
        this.fields[result.field.name] = result.field.value;
      }

      if (result.error) {
        errors.push(result.error);
      }

      position = partEnd;
    }

    return {
      success: errors.length === 0,
      files: this.files,
      errors,
      fields: this.fields,
    };
  }

  /**
   * Parse individual multipart part
   */
  private parsePart(data: Uint8Array, options: UploadOptions): {
    file?: UploadedFile;
    field?: { name: string; value: string };
    error?: string;
  } {
    // Find headers
    const headerEnd = this.findSequence(data, new Uint8Array([13, 10, 13, 10])); // \r\n\r\n
    if (headerEnd === -1) {
      return { error: 'Invalid multipart part: no headers found' };
    }

    const headers = new TextDecoder().decode(data.slice(0, headerEnd));
    const body = data.slice(headerEnd + 4);

    // Parse Content-Disposition header
    const contentDisposition = headers.split('\n')
      .find(line => line.toLowerCase().includes('content-disposition'));

    if (!contentDisposition) {
      return { error: 'Missing Content-Disposition header' };
    }

    const dispositionMatch = contentDisposition.match(/form-data;\s*name="([^"]+)"/);
    if (!dispositionMatch) {
      return { error: 'Invalid Content-Disposition header' };
    }

    const fieldName = dispositionMatch[1];

    // Check if this is a file field
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
    if (filenameMatch) {
      // This is a file upload
      const originalName = filenameMatch[1];

      // Get MIME type from Content-Type header
      const contentTypeMatch = headers.split('\n')
        .find(line => line.toLowerCase().includes('content-type'));

      let mimeType = 'application/octet-stream';
      if (contentTypeMatch) {
        const typeMatch = contentTypeMatch.match(/:\s*([^\s;]+)/);
        if (typeMatch) {
          mimeType = typeMatch[1];
        }
      }

      // Validate file
      const validation = this.validateFile(body, originalName, mimeType, options);
      if (!validation.valid) {
        return { error: validation.error };
      }

      // Generate filename
      const filename = options.filename ?
        options.filename(originalName, mimeType) :
        FileUploadUtils.generateSafeFilename(originalName, mimeType);

      const destination = options.destination || './uploads';

      const uploadedFile: UploadedFile = {
        fieldname: fieldName,
        originalname: originalName,
        filename: filename,
        mimetype: mimeType,
        size: body.length,
        destination: destination,
        path: `${destination}/${filename}`,
        buffer: options.preserveOriginalName ? undefined : body, // Don't store buffer if streaming
      };

      // Save file to disk (in production, you'd want to stream this)
      try {
        const filePath = uploadedFile.path;
        // Ensure directory exists
        const dir = filePath.split('/').slice(0, -1).join('/');
        if (dir && dir !== '.') {
          Bun.write(`${dir}/.gitkeep`, ''); // Create directory if needed
        }

        Bun.write(filePath, body);
        console.log(`📁 Saved file: ${filePath} (${body.length} bytes)`);
      } catch (error) {
        return { error: `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }

      return { file: uploadedFile };
    } else {
      // This is a regular form field
      const value = new TextDecoder().decode(body).trim();
      return { field: { name: fieldName, value } };
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(
    buffer: Uint8Array,
    filename: string,
    mimeType: string,
    options: UploadOptions
  ): { valid: boolean; error?: string } {
    // Check file size
    if (options.maxFileSize && buffer.length > options.maxFileSize) {
      return {
        valid: false,
        error: `File too large: ${buffer.length} bytes (max: ${options.maxFileSize})`
      };
    }

    // Check MIME type
    if (options.allowedTypes && !FileUploadUtils.validateFileType(mimeType, options.allowedTypes)) {
      return {
        valid: false,
        error: `Invalid file type: ${mimeType} (allowed: ${options.allowedTypes.join(', ')})`
      };
    }

    // Check file extension
    if (options.allowedExtensions && !FileUploadUtils.validateFileExtension(filename, options.allowedExtensions)) {
      return {
        valid: false,
        error: `Invalid file extension: ${filename} (allowed: ${options.allowedExtensions.join(', ')})`
      };
    }

    // Validate content
    if (options.validateContent && !options.validateContent(buffer, mimeType)) {
      return {
        valid: false,
        error: 'File content validation failed'
      };
    }

    // Basic image validation
    if (mimeType.startsWith('image/') && !FileUploadUtils.validateImageContent(buffer, mimeType)) {
      return {
        valid: false,
        error: 'Invalid image file content'
      };
    }

    return { valid: true };
  }

  /**
   * Find boundary in data
   */
  private findBoundary(data: Uint8Array, boundary: Uint8Array, start: number = 0): number {
    for (let i = start; i <= data.length - boundary.length; i++) {
      let found = true;
      for (let j = 0; j < boundary.length; j++) {
        if (data[i + j] !== boundary[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Find sequence in data
   */
  private findSequence(data: Uint8Array, sequence: Uint8Array, start: number = 0): number {
    for (let i = start; i <= data.length - sequence.length; i++) {
      let found = true;
      for (let j = 0; j < sequence.length; j++) {
        if (data[i + j] !== sequence[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        return i;
      }
    }
    return -1;
  }
}

// ============================================================================
// FILE UPLOAD MIDDLEWARE
// ============================================================================

export class FileUploadMiddleware {
  private options: Required<UploadOptions>;

  constructor(options: UploadOptions = {}) {
    this.options = {
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      allowedTypes: options.allowedTypes || ['image/*', 'application/pdf', 'text/*'],
      allowedExtensions: options.allowedExtensions || [],
      destination: options.destination || './uploads',
      filename: options.filename || FileUploadUtils.generateSafeFilename,
      validateContent: options.validateContent || (() => true),
      onProgress: options.onProgress || (() => {}),
      preserveOriginalName: options.preserveOriginalName || false,
    };

    console.log('📁 File Upload Middleware initialized', {
      maxSize: `${(this.options.maxFileSize / 1024 / 1024).toFixed(1)}MB`,
      allowedTypes: this.options.allowedTypes.length,
      destination: this.options.destination,
    });
  }

  /**
   * Upload middleware for single file
   */
  single(fieldName: string) {
    return async (request: Request): Promise<UploadResult> => {
      return this.handleUpload(request, [fieldName], false);
    };
  }

  /**
   * Upload middleware for multiple files
   */
  array(fieldName: string, maxCount: number = 10) {
    return async (request: Request): Promise<UploadResult> => {
      const fieldNames = Array.from({ length: maxCount }, (_, i) => `${fieldName}${i}`);
      return this.handleUpload(request, fieldNames, true);
    };
  }

  /**
   * Upload middleware for multiple fields
   */
  fields(fields: Array<{ name: string; maxCount?: number }>) {
    return async (request: Request): Promise<UploadResult> => {
      const fieldNames: string[] = [];
      for (const field of fields) {
        const maxCount = field.maxCount || 1;
        for (let i = 0; i < maxCount; i++) {
          fieldNames.push(field.name);
        }
      }
      return this.handleUpload(request, fieldNames, true);
    };
  }

  /**
   * Handle file upload
   */
  private async handleUpload(request: Request, fieldNames: string[], multiple: boolean): Promise<UploadResult> {
    const contentType = request.headers.get('Content-Type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return {
        success: false,
        files: [],
        errors: ['Content-Type must be multipart/form-data'],
        fields: {},
      };
    }

    // Extract boundary from Content-Type
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      return {
        success: false,
        files: [],
        errors: ['Missing boundary in Content-Type'],
        fields: {},
      };
    }

    const boundary = boundaryMatch[1].replace(/"/g, '');
    const parser = new MultipartParser(boundary);

    const result = await parser.parse(request, this.options);

    // Filter files by field names if specified
    if (fieldNames.length > 0) {
      result.files = result.files.filter(file => fieldNames.includes(file.fieldname));
    }

    return result;
  }

  /**
   * Get upload options
   */
  getOptions(): UploadOptions {
    return { ...this.options };
  }
}

// ============================================================================
// DEMO HTTP SERVER WITH FILE UPLOADS
// ============================================================================

class FileUploadDemoServer {
  private uploadMiddleware: FileUploadMiddleware;
  private server?: ReturnType<typeof serve>;

  constructor() {
    this.uploadMiddleware = new FileUploadMiddleware({
      maxFileSize: 5 * 1024 * 1024, // 5MB for demo
      allowedTypes: ['image/*', 'application/pdf', 'text/*', 'application/json'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'json'],
      destination: './uploads',
      onProgress: (received, total) => {
        const percent = ((received / total) * 100).toFixed(1);
        console.log(`📤 Upload progress: ${percent}% (${received}/${total} bytes)`);
      },
    });

    // Ensure upload directory exists
    try {
      Bun.write('./uploads/.gitkeep', '');
    } catch (error) {
      // Directory might already exist
    }
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/health' && method === 'GET') {
        return Response.json({
          status: 'healthy',
          upload: {
            options: this.uploadMiddleware.getOptions(),
            uploadDir: './uploads',
          },
          timestamp: new Date().toISOString(),
        }, { headers: corsHeaders });
      }

      // Single file upload
      if (url.pathname === '/upload/single' && method === 'POST') {
        const uploadResult = await this.uploadMiddleware.single('file')(request);

        if (!uploadResult.success) {
          return Response.json(
            { error: 'Upload failed', details: uploadResult.errors },
            { status: 400, headers: corsHeaders }
          );
        }

        return Response.json(
          {
            message: 'File uploaded successfully',
            file: uploadResult.files[0],
            fields: uploadResult.fields,
          },
          { headers: corsHeaders }
        );
      }

      // Multiple files upload
      if (url.pathname === '/upload/multiple' && method === 'POST') {
        const uploadResult = await this.uploadMiddleware.array('files', 3)(request);

        if (!uploadResult.success) {
          return Response.json(
            { error: 'Upload failed', details: uploadResult.errors },
            { status: 400, headers: corsHeaders }
          );
        }

        return Response.json(
          {
            message: `${uploadResult.files.length} files uploaded successfully`,
            files: uploadResult.files,
            fields: uploadResult.fields,
          },
          { headers: corsHeaders }
        );
      }

      // Mixed fields and files upload
      if (url.pathname === '/upload/mixed' && method === 'POST') {
        const uploadResult = await this.uploadMiddleware.fields([
          { name: 'avatar', maxCount: 1 },
          { name: 'documents', maxCount: 2 },
        ])(request);

        if (!uploadResult.success) {
          return Response.json(
            { error: 'Upload failed', details: uploadResult.errors },
            { status: 400, headers: corsHeaders }
          );
        }

        return Response.json(
          {
            message: 'Mixed upload completed',
            files: uploadResult.files,
            fields: uploadResult.fields,
          },
          { headers: corsHeaders }
        );
      }

      // List uploaded files
      if (url.pathname === '/files' && method === 'GET') {
        try {
          // Simple file listing (in production, you'd use a proper file system library)
          const files: Array<{ name: string; path: string; size: number; type: string }> = [];

          // For demo purposes, return a mock response
          // In a real implementation, you'd scan the directory
          return Response.json(
            {
              files: [
                { name: 'example.jpg', path: './uploads/example.jpg', size: 1024000, type: 'image/jpeg' },
                { name: 'document.pdf', path: './uploads/document.pdf', size: 2048000, type: 'application/pdf' }
              ],
              count: 2,
              note: 'File listing is simplified for demo purposes'
            },
            { headers: corsHeaders }
          );
        } catch (error) {
          return Response.json(
            { error: 'Failed to list files', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500, headers: corsHeaders }
          );
        }
      }

      // Download file
      if (url.pathname.startsWith('/files/') && method === 'GET') {
        const filename = url.pathname.replace('/files/', '');
        const filePath = `./uploads/${filename}`;

        try {
          const file = Bun.file(filePath);
          const exists = await file.exists();

          if (!exists) {
            return Response.json(
              { error: 'File not found' },
              { status: 404, headers: corsHeaders }
            );
          }

          return new Response(file, {
            headers: {
              ...corsHeaders,
              'Content-Type': file.type || 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          });
        } catch (error) {
          return Response.json(
            { error: 'Failed to download file' },
            { status: 500, headers: corsHeaders }
          );
        }
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

  start(port: number = 3005): void {
    this.server = serve({
      port,
      hostname: 'localhost',
      fetch: this.handleRequest.bind(this),
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });

    console.log(`📁 File Upload Demo Server running at http://localhost:${port}`);
    console.log('\n📋 Available Endpoints:');
    console.log('  GET  /health                    - Health check with upload config');
    console.log('  POST /upload/single             - Single file upload');
    console.log('  POST /upload/multiple           - Multiple files upload (up to 3)');
    console.log('  POST /upload/mixed              - Mixed fields and files');
    console.log('  GET  /files                     - List uploaded files');
    console.log('  GET  /files/:filename           - Download file');
    console.log('\n📁 Upload Configuration:');
    console.log('  • Max file size: 5MB');
    console.log('  • Allowed types: images, PDFs, text files, JSON');
    console.log('  • Destination: ./uploads/');
    console.log('  • Safe filename generation');
    console.log('\n💡 Test file uploads using curl or a web form!');
    console.log('   Example: curl -F "file=@image.jpg" http://localhost:3005/upload/single');
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
  const server = new FileUploadDemoServer();

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

export type { UploadOptions, UploadedFile, UploadResult };