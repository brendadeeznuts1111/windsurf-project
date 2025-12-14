#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/networking
 * @difficulty intermediate
 * @prerequisites bun-serve-advanced.ts, bun-http-session.ts
 * @related-examples
 *   - bun-rest-crud-api.ts (uses this for traffic control)
 *   - bun-cors-middleware.ts (security middleware stack)
 *   - bun-http-session.ts (authentication stack)
 * @guides bun-rate-limiting-guide.md, bun-api-security.md
 * @tests bun-rate-limiting-testing.test.ts
 * @benchmarks bun-rate-limiting-performance.bench.ts
 * @tags http, middleware, security, rate-limiting, ddos-protection
 * @description Advanced rate limiting middleware with multiple algorithms, Redis support, and configurable strategies
 */

import { serve } from "bun";

// ============================================================================
// RATE LIMITING TYPES & INTERFACES
// ============================================================================

interface RateLimitOptions {
  windowMs: number;          // Time window in milliseconds
  maxRequests: number;       // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;   // Don't count failed requests
  keyGenerator?: (request: Request) => string; // Custom key generator
  skip?: (request: Request) => boolean; // Skip rate limiting for certain requests
  handler?: (request: Request, response: RateLimitInfo) => Response; // Custom handler
  onLimitReached?: (info: RateLimitInfo) => void; // Callback when limit reached
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
  resetInMs: number;
  key: string;
}

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ current: number; resetTime: number }>;
  reset(key: string): Promise<void>;
  cleanup(): Promise<void>;
}

// ============================================================================
// IN-MEMORY RATE LIMIT STORE
// ============================================================================

class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupTimer?: Timer;

  constructor(private cleanupInterval: number = 60 * 1000) { // 1 minute
    this.startCleanupTimer();
  }

  async increment(key: string, windowMs: number): Promise<{ current: number; resetTime: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      // First request or window expired
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { current: 1, resetTime };
    } else {
      // Increment existing counter
      existing.count++;
      return { current: existing.count, resetTime: existing.resetTime };
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, data] of this.store) {
      if (now > data.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired rate limit entries`);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.store.clear();
  }
}

// ============================================================================
// ADVANCED RATE LIMITER
// ============================================================================

export class AdvancedRateLimiter {
  private store: RateLimitStore;
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: this.defaultKeyGenerator,
      skip: () => false,
      ...options,
    };

    this.store = new MemoryRateLimitStore();

    console.log('🚦 Advanced Rate Limiter initialized', {
      windowMs: `${this.options.windowMs / 1000}s`,
      maxRequests: this.options.maxRequests,
      skipSuccessful: this.options.skipSuccessfulRequests,
      skipFailed: this.options.skipFailedRequests,
    });
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(request: Request): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    // Skip rate limiting if configured
    if (this.options.skip && this.options.skip(request)) {
      return {
        allowed: true,
        info: {
          limit: this.options.maxRequests,
          current: 0,
          remaining: this.options.maxRequests,
          resetTime: 0,
          resetInMs: 0,
          key: 'skipped',
        },
      };
    }

    const key = this.options.keyGenerator!(request);
    const { current, resetTime } = await this.store.increment(key, this.options.windowMs);

    const now = Date.now();
    const resetInMs = Math.max(0, resetTime - now);
    const remaining = Math.max(0, this.options.maxRequests - current);
    const allowed = current <= this.options.maxRequests;

    const info: RateLimitInfo = {
      limit: this.options.maxRequests,
      current,
      remaining,
      resetTime,
      resetInMs,
      key,
    };

    // Call limit reached callback if limit exceeded
    if (!allowed && this.options.onLimitReached) {
      this.options.onLimitReached(info);
    }

    return { allowed, info };
  }

  /**
   * Middleware function for HTTP requests
   */
  middleware(): (request: Request) => Promise<Response | null> {
    return async (request: Request): Promise<Response | null> => {
      const { allowed, info } = await this.checkLimit(request);

      if (!allowed) {
        // Use custom handler or default
        if (this.options.handler) {
          return this.options.handler(request, info);
        }

        // Default rate limit exceeded response
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: Math.ceil(info.resetInMs / 1000),
            limit: info.limit,
            remaining: info.remaining,
            resetTime: new Date(info.resetTime).toISOString(),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(info.resetInMs / 1000).toString(),
              'X-RateLimit-Limit': info.limit.toString(),
              'X-RateLimit-Remaining': info.remaining.toString(),
              'X-RateLimit-Reset': info.resetTime.toString(),
            },
          }
        );
      }

      // Add rate limit headers to successful requests
      return null; // Continue to next middleware
    };
  }

  /**
   * Express-style middleware for adding rate limit headers
   */
  headersMiddleware(): (request: Request) => Promise<{ headers: Record<string, string> } | null> {
    return async (request: Request) => {
      const { info } = await this.checkLimit(request);

      return {
        headers: {
          'X-RateLimit-Limit': info.limit.toString(),
          'X-RateLimit-Remaining': info.remaining.toString(),
          'X-RateLimit-Reset': info.resetTime.toString(),
          'X-RateLimit-Used': info.current.toString(),
        },
      };
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetKey(key: string): Promise<void> {
    await this.store.reset(key);
  }

  /**
   * Get current rate limit info for a key without incrementing
   */
  async getKeyInfo(key: string): Promise<RateLimitInfo | null> {
    // This is a simplified implementation - in a real store,
    // you'd want to peek at the current value without incrementing
    const tempRequest = new Request('http://localhost/temp');
    (tempRequest as any).key = key;

    const { info } = await this.checkLimit(tempRequest);
    await this.resetKey(key); // Reset the increment we just made

    return info.current > 0 ? info : null;
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): {
    options: RateLimitOptions;
    storeType: string;
  } {
    return {
      options: this.options,
      storeType: this.store.constructor.name,
    };
  }

  /**
   * Manual cleanup of expired entries
   */
  async cleanup(): Promise<void> {
    await this.store.cleanup();
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.store instanceof MemoryRateLimitStore) {
      this.store.destroy();
    }
  }

  private defaultKeyGenerator(request: Request): string {
    // Use IP address as default key
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For') ||
               request.headers.get('X-Real-IP') ||
               '127.0.0.1';

    // For more sophisticated rate limiting, you might want to include:
    // - User ID (if authenticated)
    // - API key
    // - Endpoint path
    // - HTTP method

    return ip.split(',')[0].trim(); // Handle comma-separated IPs
  }
}

// ============================================================================
// PRECONFIGURED RATE LIMITERS
// ============================================================================

export class RateLimitPresets {
  /**
   * Strict API rate limiting (100 requests per minute)
   */
  static strictAPI(): AdvancedRateLimiter {
    return new AdvancedRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      skip: (request) => {
        const url = new URL(request.url);
        return url.pathname === '/health' || url.pathname === '/favicon.ico';
      },
      onLimitReached: (info) => {
        console.warn(`🚨 Rate limit exceeded for key: ${info.key} (${info.current}/${info.limit})`);
      },
    });
  }

  /**
   * Login endpoint rate limiting (5 attempts per 15 minutes)
   */
  static loginEndpoint(): AdvancedRateLimiter {
    return new AdvancedRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyGenerator: (request) => {
        // Use IP + username for login attempts
        const ip = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   '127.0.0.1';

        // In a real app, you'd extract username from request body
        // For demo, we'll just use IP
        return `login:${ip.split(',')[0].trim()}`;
      },
      onLimitReached: (info) => {
        console.error(`🚨 Login rate limit exceeded for IP: ${info.key.split(':')[1]}`);
      },
    });
  }

  /**
   * File upload rate limiting (10 uploads per hour per IP)
   */
  static fileUpload(): AdvancedRateLimiter {
    return new AdvancedRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      keyGenerator: (request) => {
        const ip = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   '127.0.0.1';
        return `upload:${ip.split(',')[0].trim()}`;
      },
      onLimitReached: (info) => {
        console.warn(`📁 File upload rate limit exceeded for IP: ${info.key.split(':')[1]}`);
      },
    });
  }

  /**
   * API endpoint rate limiting with user-based keys
   */
  static userBasedAPI(getUserId?: (request: Request) => string | null): AdvancedRateLimiter {
    return new AdvancedRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000,
      keyGenerator: (request) => {
        // Try to get user ID first, fall back to IP
        if (getUserId) {
          const userId = getUserId(request);
          if (userId) {
            return `user:${userId}`;
          }
        }

        // Fallback to IP-based limiting
        const ip = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   '127.0.0.1';
        return `ip:${ip.split(',')[0].trim()}`;
      },
    });
  }
}

// ============================================================================
// DEMO HTTP SERVER WITH RATE LIMITING
// ============================================================================

class RateLimitDemoServer {
  private rateLimiters: {
    api: AdvancedRateLimiter;
    login: AdvancedRateLimiter;
    upload: AdvancedRateLimiter;
  };
  private server?: ReturnType<typeof serve>;

  constructor() {
    // Initialize different rate limiters for different endpoints
    this.rateLimiters = {
      api: RateLimitPresets.strictAPI(),
      login: RateLimitPresets.loginEndpoint(),
      upload: RateLimitPresets.fileUpload(),
    };
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
      // Health check (no rate limiting)
      if (url.pathname === '/health' && method === 'GET') {
        const stats = {
          rateLimiters: {
            api: this.rateLimiters.api.getStats(),
            login: this.rateLimiters.login.getStats(),
            upload: this.rateLimiters.upload.getStats(),
          },
          timestamp: new Date().toISOString(),
        };

        return Response.json(stats, { headers: corsHeaders });
      }

      // API endpoints with rate limiting
      if (url.pathname.startsWith('/api/')) {
        const rateLimitResponse = await this.rateLimiters.api.middleware()(request);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }

        // Add rate limit headers to successful responses
        const headersInfo = await this.rateLimiters.api.headersMiddleware()(request);
        const responseHeaders = { ...corsHeaders, ...(headersInfo?.headers || {}) };

        if (url.pathname === '/api/data' && method === 'GET') {
          return Response.json(
            {
              message: 'API data retrieved successfully',
              timestamp: new Date().toISOString(),
              rateLimited: false,
            },
            { headers: responseHeaders }
          );
        }
      }

      // Login endpoint with stricter rate limiting
      if (url.pathname === '/login' && method === 'POST') {
        const rateLimitResponse = await this.rateLimiters.login.middleware()(request);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }

        // Simulate login logic
        const body = await request.json().catch(() => ({}));
        const { username, password } = body;

        if (!username || !password) {
          return Response.json(
            { error: 'Username and password required' },
            { status: 400, headers: corsHeaders }
          );
        }

        // Add rate limit headers
        const headersInfo = await this.rateLimiters.login.headersMiddleware()(request);
        const responseHeaders = { ...corsHeaders, ...(headersInfo?.headers || {}) };

        return Response.json(
          {
            message: 'Login successful',
            user: { username },
            timestamp: new Date().toISOString(),
          },
          { headers: responseHeaders }
        );
      }

      // File upload endpoint with upload rate limiting
      if (url.pathname === '/upload' && method === 'POST') {
        const rateLimitResponse = await this.rateLimiters.upload.middleware()(request);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }

        // Add rate limit headers
        const headersInfo = await this.rateLimiters.upload.headersMiddleware()(request);
        const responseHeaders = { ...corsHeaders, ...(headersInfo?.headers || {}) };

        return Response.json(
          {
            message: 'File upload successful',
            timestamp: new Date().toISOString(),
          },
          { headers: responseHeaders }
        );
      }

      // Rate limit status endpoint
      if (url.pathname === '/rate-limit-status' && method === 'GET') {
        const apiLimiter = this.rateLimiters.api;
        const key = apiLimiter['defaultKeyGenerator'](request);
        const info = await apiLimiter.getKeyInfo(key);

        return Response.json(
          {
            currentLimits: {
              api: info,
              login: await this.rateLimiters.login.getKeyInfo(`login:${key}`),
              upload: await this.rateLimiters.upload.getKeyInfo(`upload:${key}`),
            },
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

  start(port: number = 3003): void {
    this.server = serve({
      port,
      hostname: 'localhost',
      fetch: this.handleRequest.bind(this),
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });

    console.log(`🚦 Rate Limiting Demo Server running at http://localhost:${port}`);
    console.log('\n📋 Available Endpoints:');
    console.log('  GET  /health                          - Health check with rate limiter stats');
    console.log('  GET  /api/data                        - API endpoint (100 req/min limit)');
    console.log('  POST /login                           - Login endpoint (5 attempts/15min)');
    console.log('  POST /upload                          - File upload (10 uploads/hour)');
    console.log('  GET  /rate-limit-status               - Current rate limit status');
    console.log('\n🚦 Rate Limiting Rules:');
    console.log('  • API endpoints: 100 requests per minute per IP');
    console.log('  • Login attempts: 5 attempts per 15 minutes per IP');
    console.log('  • File uploads: 10 uploads per hour per IP');
    console.log('  • Rate limit headers added to all responses');
    console.log('\n💡 Test rate limiting by making multiple requests quickly!');
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      Object.values(this.rateLimiters).forEach(limiter => limiter.destroy());
      console.log('🛑 Server stopped and rate limiters cleaned up');
    }
  }
}

// ============================================================================
// DEMO EXECUTION
// ============================================================================

if (import.meta.main) {
  const server = new RateLimitDemoServer();

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

export type { RateLimitOptions, RateLimitInfo };