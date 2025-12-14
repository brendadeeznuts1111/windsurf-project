#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/networking
 * @difficulty intermediate
 * @prerequisites bun-serve-advanced.ts
 * @related-examples
 *   - bun-rest-crud-api.ts (uses this for authentication)
 *   - bun-rate-limiting.ts (often used together)
 *   - bun-cors-middleware.ts (security stack)
 * @guides bun-http-authentication-guide.md, bun-session-management.md
 * @tests bun-http-session-testing.test.ts
 * @benchmarks bun-session-performance.bench.ts
 * @tags http, authentication, sessions, security, middleware
 * @description Secure HTTP session management with automatic cleanup and configurable options
 */

import { serve } from "bun";

// ============================================================================
// SESSION MANAGEMENT TYPES
// ============================================================================

interface SessionData {
  userId: string;
  username: string;
  roles: string[];
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
}

interface SessionOptions {
  maxAge?: number;           // Session max age in milliseconds (default: 24 hours)
  secure?: boolean;          // HTTPS only (default: true in production)
  httpOnly?: boolean;        // Prevent JavaScript access (default: true)
  sameSite?: 'strict' | 'lax' | 'none'; // CSRF protection (default: 'lax')
  domain?: string | undefined; // Cookie domain
  path?: string;             // Cookie path (default: '/')
  cleanupInterval?: number;  // Cleanup interval in milliseconds (default: 5 minutes)
}

interface LoginRequest {
  username: string;
  password: string;
}

interface SessionStore {
  get(sessionId: string): SessionData | null;
  set(sessionId: string, data: SessionData): void;
  delete(sessionId: string): void;
  cleanup(): void;
  size(): number;
}

// ============================================================================
// IN-MEMORY SESSION STORE
// ============================================================================

class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, SessionData>();
  private cleanupTimer?: Timer;

  constructor(private options: { maxAge: number; cleanupInterval: number }) {
    // Start automatic cleanup
    this.startCleanupTimer();
  }

  get(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if session has expired
    if (Date.now() - session.createdAt > this.options.maxAge) {
      this.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();
    return session;
  }

  set(sessionId: string, data: SessionData): void {
    this.sessions.set(sessionId, { ...data, lastActivity: Date.now() });
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanup(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.createdAt > this.options.maxAge) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => this.delete(sessionId));

    if (expiredSessions.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  size(): number {
    return this.sessions.size;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.sessions.clear();
  }
}

// ============================================================================
// SECURE SESSION MANAGER
// ============================================================================

export class SecureSessionManager {
  private store: SessionStore;
  private options: {
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    domain?: string;
    path: string;
    cleanupInterval: number;
  };

  constructor(options: SessionOptions = {}) {
    this.options = {
      maxAge: options.maxAge || 24 * 60 * 60 * 1000, // 24 hours
      secure: options.secure ?? (process.env.NODE_ENV === 'production'),
      httpOnly: options.httpOnly ?? true,
      sameSite: options.sameSite || 'lax',
      domain: options.domain || undefined,
      path: options.path || '/',
      cleanupInterval: options.cleanupInterval || 5 * 60 * 1000, // 5 minutes
    };

    this.store = new MemorySessionStore({
      maxAge: this.options.maxAge,
      cleanupInterval: this.options.cleanupInterval,
    });

    console.log('🔐 Secure Session Manager initialized', {
      maxAge: `${this.options.maxAge / 1000 / 60} minutes`,
      secure: this.options.secure,
      cleanupInterval: `${this.options.cleanupInterval / 1000 / 60} minutes`,
    });
  }

  /**
   * Create a new session
   */
  createSession(userData: {
    userId: string;
    username: string;
    roles?: string[];
    ipAddress?: string;
    userAgent?: string;
  }): { sessionId: string; sessionData: SessionData } {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const sessionData: SessionData = {
      userId: userData.userId,
      username: userData.username,
      roles: userData.roles || [],
      createdAt: now,
      lastActivity: now,
      ipAddress: userData.ipAddress || 'unknown',
      userAgent: userData.userAgent || 'unknown',
    };

    this.store.set(sessionId, sessionData);

    console.log('📝 Created session', {
      sessionId: sessionId.substring(0, 8) + '...',
      userId: userData.userId,
      username: userData.username
    });

    return { sessionId, sessionData };
  }

  /**
   * Get session data from request
   */
  getSession(request: Request): SessionData | null {
    const sessionId = this.extractSessionId(request);
    if (!sessionId) return null;

    const session = this.store.get(sessionId);
    if (!session) return null;

    // Update last activity
    session.lastActivity = Date.now();
    return session;
  }

  /**
   * Get session data by ID
   */
  getSessionById(sessionId: string): SessionData | null {
    return this.store.get(sessionId);
  }

  /**
   * Destroy a session
   */
  destroySession(request: Request): boolean {
    const sessionId = this.extractSessionId(request);
    if (!sessionId) return false;

    this.store.delete(sessionId);
    console.log('🗑️ Destroyed session', { sessionId: sessionId.substring(0, 8) + '...' });
    return true;
  }

  /**
   * Destroy session by ID
   */
  destroySessionById(sessionId: string): void {
    this.store.delete(sessionId);
    console.log('🗑️ Destroyed session by ID', { sessionId: sessionId.substring(0, 8) + '...' });
  }

  /**
   * Create session cookie
   */
  createSessionCookie(sessionId: string): string {
    const cookieParts = [
      `sessionId=${sessionId}`,
      `Path=${this.options.path}`,
      `Max-Age=${Math.floor(this.options.maxAge / 1000)}`,
      this.options.httpOnly ? 'HttpOnly' : '',
      this.options.secure ? 'Secure' : '',
      `SameSite=${this.options.sameSite}`,
    ];

    if (this.options.domain) {
      cookieParts.push(`Domain=${this.options.domain}`);
    }

    return cookieParts.filter(Boolean).join('; ');
  }

  /**
   * Create logout cookie (expires immediately)
   */
  createLogoutCookie(): string {
    const cookieParts = [
      'sessionId=',
      `Path=${this.options.path}`,
      'Max-Age=0',
      this.options.httpOnly ? 'HttpOnly' : '',
      this.options.secure ? 'Secure' : '',
      `SameSite=${this.options.sameSite}`,
    ];

    if (this.options.domain) {
      cookieParts.push(`Domain=${this.options.domain}`);
    }

    return cookieParts.filter(Boolean).join('; ');
  }

  /**
   * Get session statistics
   */
  getStats(): {
    activeSessions: number;
    maxAge: number;
    cleanupInterval: number;
  } {
    return {
      activeSessions: this.store.size(),
      maxAge: this.options.maxAge,
      cleanupInterval: this.options.cleanupInterval,
    };
  }

  /**
   * Manual cleanup of expired sessions
   */
  cleanup(): void {
    this.store.cleanup();
  }

  /**
   * Destroy the session manager
   */
  destroy(): void {
    if (this.store instanceof MemorySessionStore) {
      this.store.destroy();
    }
  }

  private generateSessionId(): string {
    // Generate a cryptographically secure random session ID
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private extractSessionId(request: Request): string | null {
    // Try to get session ID from cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const sessionCookie = cookies.find(c => c.startsWith('sessionId='));

      if (sessionCookie) {
        const sessionId = sessionCookie.split('=')[1];
        if (sessionId && sessionId.length > 0) {
          return sessionId;
        }
      }
    }

    // Try to get session ID from Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}

// ============================================================================
// DEMO HTTP SERVER WITH SESSION MANAGEMENT
// ============================================================================

class SessionDemoServer {
  private sessionManager: SecureSessionManager;
  private server?: ReturnType<typeof serve>;

  constructor() {
    this.sessionManager = new SecureSessionManager({
      maxAge: 30 * 60 * 1000, // 30 minutes for demo
      cleanupInterval: 60 * 1000, // Cleanup every minute
    });
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/health' && method === 'GET') {
        const stats = this.sessionManager.getStats();
        return Response.json({
          status: 'healthy',
          sessions: {
            active: stats.activeSessions,
            maxAge: `${stats.maxAge / 1000 / 60} minutes`,
            cleanupInterval: `${stats.cleanupInterval / 1000 / 60} minutes`,
          },
          timestamp: new Date().toISOString(),
        }, { headers: corsHeaders });
      }

      // Login endpoint
      if (url.pathname === '/login' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { username, password } = body;

        // Simple demo authentication (in production, use proper auth)
        if (!username || !password) {
          return Response.json(
            { error: 'Username and password required' },
            { status: 400, headers: corsHeaders }
          );
        }

        // Create session
        const { sessionId, sessionData } = this.sessionManager.createSession({
          userId: `user_${Date.now()}`,
          username,
          roles: ['user'],
          ipAddress: request.headers.get('CF-Connecting-IP') ||
                    request.headers.get('X-Forwarded-For') ||
                    '127.0.0.1',
          userAgent: request.headers.get('User-Agent') ?? 'unknown',
        });

        const sessionCookie = this.sessionManager.createSessionCookie(sessionId);

        return Response.json(
          {
            message: 'Login successful',
            user: {
              id: sessionData.userId,
              username: sessionData.username,
              roles: sessionData.roles,
            },
            sessionId: sessionId.substring(0, 8) + '...', // Don't expose full session ID
          },
          {
            headers: {
              ...corsHeaders,
              'Set-Cookie': sessionCookie,
            }
          }
        );
      }

      // Protected endpoint - requires authentication
      if (url.pathname === '/profile' && method === 'GET') {
        const session = this.sessionManager.getSession(request);

        if (!session) {
          return Response.json(
            { error: 'Authentication required' },
            { status: 401, headers: corsHeaders }
          );
        }

        return Response.json(
          {
            user: {
              id: session.userId,
              username: session.username,
              roles: session.roles,
              lastActivity: new Date(session.lastActivity).toISOString(),
              sessionAge: `${Math.floor((Date.now() - session.createdAt) / 1000 / 60)} minutes`,
            }
          },
          { headers: corsHeaders }
        );
      }

      // Logout endpoint
      if (url.pathname === '/logout' && method === 'POST') {
        const destroyed = this.sessionManager.destroySession(request);
        const logoutCookie = this.sessionManager.createLogoutCookie();

        return Response.json(
          {
            message: destroyed ? 'Logout successful' : 'No active session',
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              ...corsHeaders,
              'Set-Cookie': logoutCookie,
            }
          }
        );
      }

      // Session stats endpoint
      if (url.pathname === '/admin/sessions' && method === 'GET') {
        const stats = this.sessionManager.getStats();

        // Trigger manual cleanup
        this.sessionManager.cleanup();

        return Response.json(
          {
            sessions: stats,
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

  start(port: number = 3002): void {
    this.server = serve({
      port,
      hostname: 'localhost',
      fetch: this.handleRequest.bind(this),
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });

    console.log(`🔐 HTTP Session Management Server running at http://localhost:${port}`);
    console.log('\n📋 Available Endpoints:');
    console.log('  GET  /health                    - Health check with session stats');
    console.log('  POST /login                     - Login (creates session)');
    console.log('  GET  /profile                   - Get user profile (requires auth)');
    console.log('  POST /logout                    - Logout (destroys session)');
    console.log('  GET  /admin/sessions            - Session statistics');
    console.log('\n🔐 Authentication:');
    console.log('  • Login creates a session cookie');
    console.log('  • Protected endpoints require valid session');
    console.log('  • Sessions auto-expire after 30 minutes');
    console.log('  • Automatic cleanup every minute');
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      this.sessionManager.destroy();
      console.log('🛑 Server stopped and sessions cleaned up');
    }
  }
}

// ============================================================================
// DEMO EXECUTION
// ============================================================================

if (import.meta.main) {
  const server = new SessionDemoServer();

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

export type { SessionData, SessionOptions };