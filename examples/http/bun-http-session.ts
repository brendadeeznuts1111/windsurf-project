import { serve } from 'bun';
import { logger } from '../logging/bun-logger';

export class SecureSessionManager {
  private sessions = new Map<string, SessionData>();
  private cookieName = 'session_id';
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private encryptionKey = process.env.SESSION_KEY || 'fallback-key-change-in-prod';

  constructor() {
    // Cleanup expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  createSession(userId: string, metadata: Record<string, any> = {}): SessionCookie {
    const sessionId = Bun.randomUUIDv7();
    const now = Date.now();

    const session: SessionData = {
      id: sessionId,
      userId,
      createdAt: now,
      expiresAt: now + this.maxAge,
      lastActive: now,
      metadata,
    };

    this.sessions.set(sessionId, session);

    logger.debug('Session created', { sessionId, userId });

    return {
      name: this.cookieName,
      value: this.encryptSessionId(sessionId),
      expires: new Date(session.expiresAt),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    };
  }

  getSession(cookieHeader: string | null): SessionData | null {
    if (!cookieHeader) return null;

    // Parse cookie header manually (Bun doesn't have built-in CookieMap)
    const cookies = this.parseCookies(cookieHeader);
    const encryptedSessionId = cookies[this.cookieName];

    if (!encryptedSessionId) return null;

    try {
      const sessionId = this.decryptSessionId(encryptedSessionId);
      const session = this.sessions.get(sessionId);

      if (!session) return null;

      // Check expiration
      if (Date.now() > session.expiresAt) {
        this.sessions.delete(sessionId);
        return null;
      }

      // Update last active
      session.lastActive = Date.now();

      return session;
    } catch (error) {
      logger.warn('Session decryption failed', { error: (error as Error).message });
      return null;
    }
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
    logger.debug('Session destroyed', { sessionId });
  }

  private encryptSessionId(sessionId: string): string {
    // In production, use proper encryption like AES-GCM
    const text = `${sessionId}:${Date.now()}`;
    const buffer = Buffer.from(text);
    return buffer.toString('base64');
  }

  private decryptSessionId(encrypted: string): string {
    const buffer = Buffer.from(encrypted, 'base64');
    const decrypted = buffer.toString();
    return decrypted.split(':')[0]; // Extract session ID
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    const pairs = cookieHeader.split(';');

    for (const pair of pairs) {
      const [name, ...valueParts] = pair.trim().split('=');
      if (name && valueParts.length > 0) {
        cookies[name] = valueParts.join('=');
      }
    }

    return cookies;
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Expired sessions cleaned', { cleaned });
    }
  }
}

export class BunHTTPSessionServer {
  private server?: ReturnType<typeof serve>;
  private sessionManager = new SecureSessionManager();

  start(port: number = 3000): void {
    this.server = serve({
      port,
      async fetch(req) {
        const session = this.sessionManager.getSession(req.headers.get('cookie'));
        const url = new URL(req.url);

        // Auth middleware
        if (!session && !url.pathname.startsWith('/auth')) {
          return new Response('Unauthorized', { status: 401 });
        }

        // Update session activity
        if (session) {
          session.lastActive = Date.now();
        }

        // Route handling
        switch (url.pathname) {
          case '/auth/login':
            return await this.handleLogin(req);
          case '/auth/logout':
            return await this.handleLogout(req);
          case '/api/data':
            return await this.handleData(req, session!);
          default:
            return new Response('Not Found', { status: 404 });
        }
      }.bind(this),
    });

    logger.info('Session server started', {
      url: this.server.url,
      port,
    });
  }

  private async handleLogin(req: Request): Promise<Response> {
    // In production, validate credentials against database
    const body = await req.json().catch(() => ({}));
    const { username = 'demo' } = body;

    const sessionCookie = this.sessionManager.createSession(username, {
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return new Response(JSON.stringify({ success: true, message: 'Logged in' }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': this.formatCookie(sessionCookie),
      },
    });
  }

  private async handleLogout(req: Request): Promise<Response> {
    const session = this.sessionManager.getSession(req.headers.get('cookie'));

    if (session) {
      this.sessionManager.destroySession(session.id);
    }

    return new Response(JSON.stringify({ success: true, message: 'Logged out' }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${this.sessionManager.cookieName}=; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
      },
    });
  }

  private async handleData(req: Request, session: SessionData): Promise<Response> {
    return new Response(JSON.stringify({
      success: true,
      data: {
        sessionId: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        metadata: session.metadata,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private formatCookie(cookie: SessionCookie): string {
    const parts = [
      `${cookie.name}=${cookie.value}`,
      `Expires=${cookie.expires.toUTCString()}`,
      `Path=${cookie.path}`,
      `HttpOnly`,
    ];

    if (cookie.secure) parts.push('Secure');
    if (cookie.sameSite) parts.push(`SameSite=${cookie.sameSite}`);

    return parts.join('; ');
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      logger.info('Session server stopped');
    }
  }
}

interface SessionData {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastActive: number;
  metadata: Record<string, any>;
}

interface SessionCookie {
  name: string;
  value: string;
  expires: Date;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
}