#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/networking
 * @difficulty beginner
 * @prerequisites bun-serve-advanced.ts
 * @related-examples
 *   - bun-rest-crud-api.ts (uses CORS for cross-origin requests)
 *   - bun-rate-limiting.ts (middleware chaining)
 *   - bun-http-session.ts (security middleware stack)
 * @guides bun-cors-guide.md, bun-api-security.md
 * @tests bun-cors-testing.test.ts
 * @benchmarks bun-cors-performance.bench.ts
 * @tags http, middleware, cors, security, cross-origin
 * @description Comprehensive CORS middleware with preflight handling, configurable origins, and security features
 */

import { serve } from "bun";

// ============================================================================
// CORS TYPES & INTERFACES
// ============================================================================

interface CORSOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  optionsSuccessStatus?: number;
  preflightContinue?: boolean;
}

interface CORSResult {
  headers: Record<string, string>;
  shouldContinue: boolean;
}

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

export class CORSMiddleware {
  private options: Required<CORSOptions>;

  constructor(options: CORSOptions = {}) {
    this.options = {
      origin: options.origin ?? '*',
      methods: options.methods ?? ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      allowedHeaders: options.allowedHeaders ?? ['Content-Type', 'Authorization'],
      exposedHeaders: options.exposedHeaders ?? [],
      credentials: options.credentials ?? false,
      maxAge: options.maxAge ?? 86400, // 24 hours
      optionsSuccessStatus: options.optionsSuccessStatus ?? 204,
      preflightContinue: options.preflightContinue ?? false,
    };

    console.log('🌐 CORS Middleware initialized', {
      origin: this.options.origin,
      methods: this.options.methods.length,
      credentials: this.options.credentials,
      maxAge: `${this.options.maxAge}s`,
    });
  }

  /**
   * Main CORS middleware function
   */
  middleware(): (request: Request) => CORSResult | Response {
    return (request: Request) => {
      const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';

      // Check if origin is allowed
      if (!this.isOriginAllowed(origin)) {
        // If origin is not allowed, don't add CORS headers
        return { headers: {}, shouldContinue: true };
      }

      const method = request.method;
      const requestHeaders = request.headers.get('Access-Control-Request-Headers') || '';

      // Handle preflight requests
      if (method === 'OPTIONS') {
        return this.handlePreflight(request, origin, requestHeaders);
      }

      // Handle actual requests
      return this.handleActualRequest(origin);
    };
  }

  /**
   * Handle CORS preflight requests
   */
  private handlePreflight(request: Request, origin: string, requestHeaders: string): Response {
    const requestedMethod = request.headers.get('Access-Control-Request-Method');

    // Check if requested method is allowed
    if (requestedMethod && !this.options.methods.includes(requestedMethod)) {
      return new Response('Method not allowed', {
        status: 405,
        headers: { 'Allow': this.options.methods.join(', ') }
      });
    }

    // Check if requested headers are allowed
    if (requestHeaders) {
      const requestedHeaders = requestHeaders.split(',').map(h => h.trim().toLowerCase());
      const allowedHeaders = this.options.allowedHeaders.map(h => h.toLowerCase());

      const hasWildcard = allowedHeaders.includes('*');
      const allAllowed = hasWildcard || requestedHeaders.every(header =>
        allowedHeaders.includes(header)
      );

      if (!allAllowed) {
        return new Response('Headers not allowed', { status: 400 });
      }
    }

    // Build preflight response
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': this.getOriginValue(origin),
      'Access-Control-Allow-Methods': this.options.methods.join(', '),
      'Access-Control-Allow-Headers': this.options.allowedHeaders.join(', '),
      'Access-Control-Max-Age': this.options.maxAge.toString(),
    };

    if (this.options.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (this.options.exposedHeaders.length > 0) {
      headers['Access-Control-Expose-Headers'] = this.options.exposedHeaders.join(', ');
    }

    return new Response(null, {
      status: this.options.optionsSuccessStatus,
      headers,
    });
  }

  /**
   * Handle actual CORS requests
   */
  private handleActualRequest(origin: string): CORSResult {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': this.getOriginValue(origin),
    };

    if (this.options.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (this.options.exposedHeaders.length > 0) {
      headers['Access-Control-Expose-Headers'] = this.options.exposedHeaders.join(', ');
    }

    return {
      headers,
      shouldContinue: true,
    };
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string): boolean {
    if (!origin) return true; // Allow requests without Origin header (same-origin)

    const { origin: allowedOrigin } = this.options;

    if (allowedOrigin === '*') {
      return true;
    }

    if (typeof allowedOrigin === 'string') {
      return origin === allowedOrigin;
    }

    if (Array.isArray(allowedOrigin)) {
      return allowedOrigin.includes(origin);
    }

    if (typeof allowedOrigin === 'function') {
      try {
        return allowedOrigin(origin);
      } catch (error) {
        console.warn('CORS origin function threw error:', error);
        return false;
      }
    }

    return false;
  }

  /**
   * Get the appropriate origin value for headers
   */
  private getOriginValue(requestOrigin: string): string {
    const { origin: allowedOrigin } = this.options;

    if (allowedOrigin === '*') {
      return '*';
    }

    if (typeof allowedOrigin === 'string') {
      return allowedOrigin;
    }

    if (Array.isArray(allowedOrigin)) {
      return requestOrigin; // Return the actual origin if it's in the allowed list
    }

    if (typeof allowedOrigin === 'function') {
      return requestOrigin; // Return the actual origin if function allows it
    }

    return requestOrigin;
  }

  /**
   * Get CORS configuration
   */
  getConfig(): CORSOptions {
    return { ...this.options };
  }
}

// ============================================================================
// CORS PRESETS
// ============================================================================

export class CORSPresets {
  /**
   * Permissive CORS for development
   */
  static development(): CORSMiddleware {
    return new CORSMiddleware({
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['*'],
      maxAge: 86400,
    });
  }

  /**
   * Secure CORS for production APIs
   */
  static production(allowedOrigins: string[]): CORSMiddleware {
    return new CORSMiddleware({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit'],
      maxAge: 7200, // 2 hours
    });
  }

  /**
   * Strict CORS for sensitive endpoints
   */
  static strict(singleOrigin: string): CORSMiddleware {
    return new CORSMiddleware({
      origin: singleOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization'],
      maxAge: 3600, // 1 hour
    });
  }

  /**
   * Dynamic CORS with custom logic
   */
  static dynamic(originChecker: (origin: string) => boolean): CORSMiddleware {
    return new CORSMiddleware({
      origin: originChecker,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
      maxAge: 3600,
    });
  }

  /**
   * CORS for file uploads
   */
  static fileUpload(allowedOrigins: string[]): CORSMiddleware {
    return new CORSMiddleware({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-File-Name'],
      exposedHeaders: ['X-Upload-ID', 'X-Upload-Progress'],
      maxAge: 7200,
    });
  }
}

// ============================================================================
// DEMO HTTP SERVER WITH CORS
// ============================================================================

class CORSDemoServer {
  private corsMiddlewares: {
    permissive: CORSMiddleware;
    strict: CORSMiddleware;
    dynamic: CORSMiddleware;
  };
  private server?: ReturnType<typeof serve>;

  constructor() {
    // Initialize different CORS configurations
    this.corsMiddlewares = {
      permissive: CORSPresets.development(),
      strict: CORSPresets.strict('http://localhost:3000'),
      dynamic: CORSPresets.dynamic((origin) => {
        // Allow localhost origins and specific domains
        return origin.startsWith('http://localhost:') ||
               origin === 'https://trusted-domain.com' ||
               origin.endsWith('.trusted-domain.com');
      }),
    };
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    try {
      // Health check (no CORS needed for same-origin)
      if (url.pathname === '/health' && method === 'GET') {
        return Response.json({
          status: 'healthy',
          cors: {
            permissive: this.corsMiddlewares.permissive.getConfig(),
            strict: this.corsMiddlewares.strict.getConfig(),
            dynamic: this.corsMiddlewares.dynamic.getConfig(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Permissive CORS endpoint
      if (url.pathname === '/api/permissive' && method === 'GET') {
        const corsResult = this.corsMiddlewares.permissive.middleware()(request);

        if (corsResult instanceof Response) {
          // Preflight response
          return corsResult;
        }

        return Response.json(
          {
            message: 'Permissive CORS endpoint',
            origin: request.headers.get('Origin'),
            cors: 'allowed',
            timestamp: new Date().toISOString(),
          },
          { headers: corsResult.headers }
        );
      }

      // Strict CORS endpoint
      if (url.pathname === '/api/strict' && method === 'GET') {
        const corsResult = this.corsMiddlewares.strict.middleware()(request);

        if (corsResult instanceof Response) {
          return corsResult;
        }

        return Response.json(
          {
            message: 'Strict CORS endpoint',
            origin: request.headers.get('Origin'),
            cors: 'restricted',
            timestamp: new Date().toISOString(),
          },
          { headers: corsResult.headers }
        );
      }

      // Dynamic CORS endpoint
      if (url.pathname === '/api/dynamic' && method === 'GET') {
        const corsResult = this.corsMiddlewares.dynamic.middleware()(request);

        if (corsResult instanceof Response) {
          return corsResult;
        }

        return Response.json(
          {
            message: 'Dynamic CORS endpoint',
            origin: request.headers.get('Origin'),
            cors: 'validated',
            timestamp: new Date().toISOString(),
          },
          { headers: corsResult.headers }
        );
      }

      // POST endpoint with CORS
      if (url.pathname === '/api/data' && method === 'POST') {
        const corsResult = this.corsMiddlewares.permissive.middleware()(request);

        if (corsResult instanceof Response) {
          return corsResult;
        }

        const body = await request.json().catch(() => ({}));

        return Response.json(
          {
            message: 'Data received',
            data: body,
            origin: request.headers.get('Origin'),
            timestamp: new Date().toISOString(),
          },
          { headers: corsResult.headers }
        );
      }

      // CORS test endpoint
      if (url.pathname === '/cors-test' && method === 'GET') {
        const origin = request.headers.get('Origin') || 'none';

        const tests = {
          permissive: this.corsMiddlewares.permissive.middleware()(request) instanceof Response ? 'blocked' : 'allowed',
          strict: this.corsMiddlewares.strict.middleware()(request) instanceof Response ? 'blocked' : 'allowed',
          dynamic: this.corsMiddlewares.dynamic.middleware()(request) instanceof Response ? 'blocked' : 'allowed',
        };

        return Response.json({
          origin,
          tests,
          timestamp: new Date().toISOString(),
        });
      }

      // 404 for unknown routes
      return Response.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );

    } catch (error) {
      console.error('Request error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  start(port: number = 3004): void {
    this.server = serve({
      port,
      hostname: 'localhost',
      fetch: this.handleRequest.bind(this),
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });

    console.log(`🌐 CORS Demo Server running at http://localhost:${port}`);
    console.log('\n📋 Available Endpoints:');
    console.log('  GET  /health                    - Health check with CORS configs');
    console.log('  GET  /api/permissive            - Permissive CORS (* origin)');
    console.log('  GET  /api/strict                - Strict CORS (localhost:3000 only)');
    console.log('  GET  /api/dynamic               - Dynamic CORS (custom logic)');
    console.log('  POST /api/data                  - POST endpoint with CORS');
    console.log('  GET  /cors-test                 - Test CORS behavior for current origin');
    console.log('\n🌐 CORS Configurations:');
    console.log('  • Permissive: Allows all origins, no credentials');
    console.log('  • Strict: Only localhost:3000, with credentials');
    console.log('  • Dynamic: Custom validation logic');
    console.log('\n💡 Test from different origins to see CORS in action!');
    console.log('   Try: curl -H "Origin: http://evil.com" http://localhost:3004/api/strict');
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
  const server = new CORSDemoServer();

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

export type { CORSOptions, CORSResult };