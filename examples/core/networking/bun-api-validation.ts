#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/networking
 * @difficulty intermediate
 * @prerequisites bun-serve-advanced.ts, bun-rest-crud-api.ts
 * @related-examples
 *   - bun-rest-crud-api.ts (uses input validation)
 *   - bun-file-upload-api.ts (validates file uploads)
 *   - bun-rate-limiting.ts (validates rate limit rules)
 * @guides bun-input-validation-guide.md, bun-api-security.md
 * @tests bun-api-validation-testing.test.ts
 * @benchmarks bun-validation-performance.bench.ts
 * @tags validation, security, api, middleware, sanitization
 * @description Comprehensive input validation middleware with sanitization, type checking, and security features
 */

import { serve } from "bun";

// ============================================================================
// VALIDATION TYPES & INTERFACES
// ============================================================================

interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'custom';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: (string | number)[];
  customValidator?: (value: any) => boolean | string;
  sanitize?: (value: any) => any;
  message?: string;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

interface ValidationOptions {
  strict?: boolean; // Reject unknown fields
  stripUnknown?: boolean; // Remove unknown fields
  abortEarly?: boolean; // Stop on first error
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(value: string): string {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .substring(0, 10000); // Limit length
  }

  /**
   * Sanitize HTML (basic)
   */
  static sanitizeHtml(value: string): string {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .trim()
      .substring(0, 10000);
  }

  /**
   * Validate and convert value based on type
   */
  static validateAndConvert(value: any, rule: ValidationRule): { valid: boolean; converted?: any; error?: string } {
    if (value === undefined || value === null || value === '') {
      if (rule.required) {
        return { valid: false, error: rule.message || 'This field is required' };
      }
      return { valid: true, converted: value };
    }

    let convertedValue = value;

    // Type conversion and validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          convertedValue = String(value);
        }
        if (rule.minLength && convertedValue.length < rule.minLength) {
          return { valid: false, error: rule.message || `Minimum length is ${rule.minLength}` };
        }
        if (rule.maxLength && convertedValue.length > rule.maxLength) {
          return { valid: false, error: rule.message || `Maximum length is ${rule.maxLength}` };
        }
        if (rule.pattern && !rule.pattern.test(convertedValue)) {
          return { valid: false, error: rule.message || 'Invalid format' };
        }
        if (rule.sanitize) {
          convertedValue = rule.sanitize(convertedValue);
        }
        break;

      case 'number':
        const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(numValue)) {
          return { valid: false, error: rule.message || 'Must be a valid number' };
        }
        convertedValue = numValue;
        if (rule.min !== undefined && convertedValue < rule.min) {
          return { valid: false, error: rule.message || `Minimum value is ${rule.min}` };
        }
        if (rule.max !== undefined && convertedValue > rule.max) {
          return { valid: false, error: rule.message || `Maximum value is ${rule.max}` };
        }
        break;

      case 'boolean':
        if (typeof value === 'string') {
          convertedValue = value.toLowerCase() === 'true' || value === '1';
        } else {
          convertedValue = Boolean(value);
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return { valid: false, error: rule.message || 'Invalid email format' };
        }
        convertedValue = value.toLowerCase().trim();
        break;

      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          return { valid: false, error: rule.message || 'Invalid URL format' };
        }
        convertedValue = value.trim();
        break;

      case 'uuid':
        if (typeof value !== 'string' || !this.isValidUUID(value)) {
          return { valid: false, error: rule.message || 'Invalid UUID format' };
        }
        convertedValue = value.toLowerCase();
        break;

      case 'custom':
        if (rule.customValidator) {
          const result = rule.customValidator(value);
          if (result !== true) {
            return { valid: false, error: typeof result === 'string' ? result : (rule.message || 'Validation failed') };
          }
        }
        break;
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(convertedValue as any)) {
      return { valid: false, error: rule.message || `Must be one of: ${rule.enum.join(', ')}` };
    }

    return { valid: true, converted: convertedValue };
  }
}

// ============================================================================
// INPUT VALIDATION MIDDLEWARE
// ============================================================================

export class InputValidationMiddleware {
  private schemas: Map<string, ValidationSchema> = new Map();
  private options: ValidationOptions;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      strict: options.strict ?? false,
      stripUnknown: options.stripUnknown ?? false,
      abortEarly: options.abortEarly ?? false,
    };

    console.log('✅ Input Validation Middleware initialized', {
      strict: this.options.strict,
      stripUnknown: this.options.stripUnknown,
      abortEarly: this.options.abortEarly,
    });
  }

  /**
   * Register a validation schema for a route
   */
  registerSchema(route: string, schema: ValidationSchema): void {
    this.schemas.set(route, schema);
    console.log(`📋 Registered validation schema for route: ${route}`);
  }

  /**
   * Validate request body against schema
   */
  validate(route: string, data: any): ValidationResult {
    const schema = this.schemas.get(route);
    if (!schema) {
      return {
        isValid: true,
        errors: {},
        sanitizedData: data || {},
      };
    }

    const errors: Record<string, string> = {};
    const sanitizedData: Record<string, any> = {};

    // Validate known fields
    for (const [field, rule] of Object.entries(schema)) {
      const result = ValidationUtils.validateAndConvert(data[field], rule);

      if (!result.valid) {
        errors[field] = result.error!;
        if (this.options.abortEarly) {
          break;
        }
      } else if (result.converted !== undefined) {
        sanitizedData[field] = result.converted;
      }
    }

    // Handle unknown fields
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (!schema[key]) {
          if (this.options.strict) {
            errors[key] = 'Unknown field';
            if (this.options.abortEarly) {
              break;
            }
          } else if (!this.options.stripUnknown) {
            sanitizedData[key] = value;
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData,
    };
  }

  /**
   * Middleware function for HTTP requests
   */
  middleware(route?: string) {
    return async (request: Request): Promise<{ valid: boolean; data?: any; errors?: Record<string, string> }> => {
      try {
        let body: any = null;

        // Only parse body for methods that typically have one
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            body = await request.json();
          } catch (error) {
            return {
              valid: false,
              errors: { body: 'Invalid JSON in request body' }
            };
          }
        }

        // Validate query parameters
        const url = new URL(request.url);
        const queryParams: Record<string, string> = {};
        for (const [key, value] of url.searchParams) {
          queryParams[key] = value;
        }

        // Combine body and query params for validation
        const dataToValidate = { ...body, ...queryParams };

        const result = this.validate(route || request.url, dataToValidate);

        return {
          valid: result.isValid,
          data: result.isValid ? result.sanitizedData : undefined,
          errors: result.isValid ? undefined : result.errors,
        };

      } catch (error) {
        console.error('Validation middleware error:', error);
        return {
          valid: false,
          errors: { middleware: 'Validation middleware error' }
        };
      }
    };
  }

  /**
   * Get registered schemas
   */
  getSchemas(): Record<string, ValidationSchema> {
    const result: Record<string, ValidationSchema> = {};
    for (const [route, schema] of this.schemas) {
      result[route] = schema;
    }
    return result;
  }
}

// ============================================================================
// PREDEFINED VALIDATION SCHEMAS
// ============================================================================

export class ValidationSchemas {
  /**
   * User registration schema
   */
  static userRegistration(): ValidationSchema {
    return {
      username: {
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_-]+$/,
        sanitize: ValidationUtils.sanitizeString,
        message: 'Username must be 3-30 characters, letters, numbers, underscore, or hyphen only'
      },
      email: {
        type: 'email',
        required: true,
        sanitize: (value: string) => value.toLowerCase().trim(),
        message: 'Valid email address required'
      },
      password: {
        type: 'string',
        required: true,
        minLength: 8,
        maxLength: 128,
        message: 'Password must be 8-128 characters'
      },
      age: {
        type: 'number',
        min: 13,
        max: 120,
        message: 'Age must be between 13 and 120'
      }
    };
  }

  /**
   * Blog post schema
   */
  static blogPost(): ValidationSchema {
    return {
      title: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 200,
        sanitize: ValidationUtils.sanitizeString,
        message: 'Title is required and must be 1-200 characters'
      },
      content: {
        type: 'string',
        required: true,
        minLength: 10,
        maxLength: 50000,
        sanitize: ValidationUtils.sanitizeHtml,
        message: 'Content is required and must be 10-50000 characters'
      },
      published: {
        type: 'boolean',
        message: 'Published must be true or false'
      },
      tags: {
        type: 'custom',
        customValidator: (value: unknown) => {
          if (!Array.isArray(value)) return 'Tags must be an array';
          if (value.length > 10) return 'Maximum 10 tags allowed';
          if (value.some((tag: unknown) => typeof tag !== 'string' || (tag as string).length > 50)) {
            return 'Each tag must be a string of 50 characters or less';
          }
          return true;
        },
        sanitize: (value: unknown) => Array.isArray(value) ? (value as string[]).map((tag: string) => tag.trim().toLowerCase()) : [],
        message: 'Invalid tags format'
      },
      category: {
        type: 'string',
        enum: ['technology', 'lifestyle', 'business', 'health', 'education'],
        message: 'Category must be one of: technology, lifestyle, business, health, education'
      }
    };
  }

  /**
   * API search/query schema
   */
  static searchQuery(): ValidationSchema {
    return {
      q: {
        type: 'string',
        maxLength: 100,
        sanitize: ValidationUtils.sanitizeString,
        message: 'Search query must be 100 characters or less'
      },
      limit: {
        type: 'number',
        min: 1,
        max: 100,
        message: 'Limit must be between 1 and 100'
      },
      offset: {
        type: 'number',
        min: 0,
        max: 10000,
        message: 'Offset must be between 0 and 10000'
      },
      sort: {
        type: 'string',
        enum: ['asc', 'desc'],
        message: 'Sort must be "asc" or "desc"'
      },
      category: {
        type: 'string',
        enum: ['all', 'active', 'inactive', 'pending'],
        message: 'Category must be one of: all, active, inactive, pending'
      }
    };
  }

  /**
   * File upload metadata schema
   */
  static fileUpload(): ValidationSchema {
    return {
      description: {
        type: 'string',
        maxLength: 500,
        sanitize: ValidationUtils.sanitizeString,
        message: 'Description must be 500 characters or less'
      },
      category: {
        type: 'string',
        enum: ['document', 'image', 'video', 'audio', 'other'],
        message: 'Category must be one of: document, image, video, audio, other'
      },
      tags: {
        type: 'custom',
        customValidator: (value: unknown) => {
          if (!Array.isArray(value)) return 'Tags must be an array';
          if (value.length > 5) return 'Maximum 5 tags allowed';
          if (value.some((tag: unknown) => typeof tag !== 'string' || (tag as string).length > 30)) {
            return 'Each tag must be a string of 30 characters or less';
          }
          return true;
        },
        sanitize: (value: unknown) => Array.isArray(value) ? (value as string[]).map((tag: string) => tag.trim().toLowerCase()) : [],
        message: 'Invalid tags format'
      },
      public: {
        type: 'boolean',
        message: 'Public must be true or false'
      }
    };
  }
}

// ============================================================================
// DEMO HTTP SERVER WITH INPUT VALIDATION
// ============================================================================

class ValidationDemoServer {
  private validator: InputValidationMiddleware;
  private server?: ReturnType<typeof serve>;

  constructor() {
    this.validator = new InputValidationMiddleware({
      strict: false,
      stripUnknown: false,
      abortEarly: false,
    });

    // Register validation schemas
    this.validator.registerSchema('/api/users', ValidationSchemas.userRegistration());
    this.validator.registerSchema('/api/posts', ValidationSchemas.blogPost());
    this.validator.registerSchema('/api/search', ValidationSchemas.searchQuery());
    this.validator.registerSchema('/api/upload', ValidationSchemas.fileUpload());
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/health' && method === 'GET') {
        const schemas = this.validator.getSchemas();
        return Response.json({
          status: 'healthy',
          validation: {
            schemasCount: Object.keys(schemas).length,
            schemas: Object.keys(schemas),
          },
          timestamp: new Date().toISOString(),
        }, { headers: corsHeaders });
      }

      // User registration endpoint
      if (url.pathname === '/api/users' && method === 'POST') {
        const validation = await this.validator.middleware('/api/users')(request);

        if (!validation.valid) {
          return Response.json(
            {
              error: 'Validation failed',
              details: validation.errors,
            },
            { status: 400, headers: corsHeaders }
          );
        }

        // Simulate user creation
        const user = {
          id: crypto.randomUUID(),
          ...validation.data,
          createdAt: new Date().toISOString(),
        };

        // Remove password from response
        delete user.password;

        return Response.json(
          {
            message: 'User created successfully',
            user,
          },
          { status: 201, headers: corsHeaders }
        );
      }

      // Blog post creation endpoint
      if (url.pathname === '/api/posts' && method === 'POST') {
        const validation = await this.validator.middleware('/api/posts')(request);

        if (!validation.valid) {
          return Response.json(
            {
              error: 'Validation failed',
              details: validation.errors,
            },
            { status: 400, headers: corsHeaders }
          );
        }

        // Simulate post creation
        const post = {
          id: crypto.randomUUID(),
          ...validation.data,
          authorId: 'user-123', // Mock author
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return Response.json(
          {
            message: 'Post created successfully',
            post,
          },
          { status: 201, headers: corsHeaders }
        );
      }

      // Search endpoint with query validation
      if (url.pathname === '/api/search' && method === 'GET') {
        const validation = await this.validator.middleware('/api/search')(request);

        if (!validation.valid) {
          return Response.json(
            {
              error: 'Invalid search parameters',
              details: validation.errors,
            },
            { status: 400, headers: corsHeaders }
          );
        }

        // Simulate search results
        const results = Array.from({ length: validation.data.limit || 10 }, (_, i) => ({
          id: `result-${i + 1}`,
          title: `Search Result ${i + 1}`,
          description: `This is search result ${i + 1} for query: ${validation.data.q || 'none'}`,
          category: validation.data.category || 'all',
        }));

        return Response.json(
          {
            query: validation.data,
            results,
            total: results.length,
            pagination: {
              limit: validation.data.limit || 10,
              offset: validation.data.offset || 0,
            },
          },
          { headers: corsHeaders }
        );
      }

      // File upload metadata validation
      if (url.pathname === '/api/upload' && method === 'POST') {
        const validation = await this.validator.middleware('/api/upload')(request);

        if (!validation.valid) {
          return Response.json(
            {
              error: 'Invalid upload metadata',
              details: validation.errors,
            },
            { status: 400, headers: corsHeaders }
          );
        }

        // Simulate file upload processing
        const upload = {
          id: crypto.randomUUID(),
          ...validation.data,
          filename: 'uploaded-file.jpg', // Mock filename
          size: 1024000, // Mock size
          uploadedAt: new Date().toISOString(),
        };

        return Response.json(
          {
            message: 'File uploaded successfully',
            upload,
          },
          { status: 201, headers: corsHeaders }
        );
      }

      // Validation test endpoint
      if (url.pathname === '/validate-test' && method === 'POST') {
        const validation = await this.validator.middleware('/api/users')(request);

        return Response.json(
          {
            validation: {
              isValid: validation.valid,
              errors: validation.errors,
              sanitizedData: validation.data,
            },
            originalBody: await request.clone().json().catch(() => null),
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

  start(port: number = 3006): void {
    this.server = serve({
      port,
      hostname: 'localhost',
      fetch: this.handleRequest.bind(this),
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });

    console.log(`✅ Input Validation Demo Server running at http://localhost:${port}`);
    console.log('\n📋 Available Endpoints:');
    console.log('  GET  /health                      - Health check with validation schemas');
    console.log('  POST /api/users                   - User registration (with validation)');
    console.log('  POST /api/posts                   - Blog post creation (with validation)');
    console.log('  GET  /api/search                  - Search with query validation');
    console.log('  POST /api/upload                  - File upload metadata validation');
    console.log('  POST /validate-test               - Test validation without processing');
    console.log('\n🔍 Validation Features:');
    console.log('  • Type checking and conversion');
    console.log('  • Required field validation');
    console.log('  • Length and range limits');
    console.log('  • Pattern matching and enums');
    console.log('  • Custom validation functions');
    console.log('  • Input sanitization');
    console.log('  • Error aggregation');
    console.log('\n💡 Test validation by sending invalid data to see detailed error messages!');
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
  const server = new ValidationDemoServer();

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

export type { ValidationRule, ValidationSchema, ValidationResult, ValidationOptions };