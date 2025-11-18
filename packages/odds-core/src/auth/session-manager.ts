// Session management with Bun v1.3 built-in cookies
import { randomUUIDv7 } from "bun";
import type { ServerWebSocket } from "bun";

export interface Session {
  id: string;
  userId?: string;
  connectedAt: number;
  lastActivity: number;
  subscriptions: Set<string>;
  metadata: Record<string, any>;
}

export class SessionManager {
  private sessions = new Map<string, Session>();
  private readonly sessionTimeout: number;

  constructor(sessionTimeout: number = 3600000) { // 1 hour default
    this.sessionTimeout = sessionTimeout;
    
    // Clean up expired sessions periodically
    setInterval(() => this.cleanupExpiredSessions(), 60000); // Every minute
  }

  /**
   * Create a new session from HTTP request
   */
  createFromRequest(request: Request, response?: Response): Session {
    // Parse cookies from request headers manually
    const cookieHeader = request.headers.get('cookie');
    const sessionId = this.parseCookieValue(cookieHeader, 'sessionId') || randomUUIDv7();
    
    const session: Session = {
      id: sessionId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      subscriptions: new Set(),
      metadata: {}
    };

    this.sessions.set(sessionId, session);
    
    // Set cookie in response if provided
    if (response) {
      const cookieValue = `sessionId=${sessionId}; HttpOnly; Secure=${Bun.env.NODE_ENV === 'production'}; SameSite=lax; Max-Age=${this.sessionTimeout / 1000}; Path=/`;
      response.headers.set('Set-Cookie', cookieValue);
    }

    return session;
  }

  /**
   * Create session for WebSocket connection
   */
  createForWebSocket(ws: ServerWebSocket<any>): Session {
    const sessionId = randomUUIDv7();
    
    const session: Session = {
      id: sessionId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      subscriptions: new Set(),
      metadata: {
        connectionType: 'websocket',
        remoteAddress: (ws as any).remoteAddress || 'unknown'
      }
    };

    this.sessions.set(sessionId, session);
    (ws as any).sessionId = sessionId;

    return session;
  }

  /**
   * Parse cookie value from cookie header
   */
  private parseCookieValue(cookieHeader: string | null, name: string): string | null {
    if (!cookieHeader) return null;
    
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
    const targetCookie = cookies.find(cookie => cookie.startsWith(`${name}=`));
    
    return targetCookie ? targetCookie.substring(name.length + 1) : null;
  }

  /**
   * Get session by ID
   */
  get(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    
    if (session && Date.now() - session.lastActivity > this.sessionTimeout) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    
    if (session) {
      session.lastActivity = Date.now();
    }
    
    return session;
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Add subscription to session
   */
  addSubscription(sessionId: string, channel: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.subscriptions.add(channel);
      session.lastActivity = Date.now();
    }
  }

  /**
   * Remove subscription from session
   */
  removeSubscription(sessionId: string, channel: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.subscriptions.delete(channel);
      session.lastActivity = Date.now();
    }
  }

  /**
   * Get all subscriptions for session
   */
  getSubscriptions(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    return session ? Array.from(session.subscriptions) : [];
  }

  /**
   * Destroy session
   */
  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.sessions.delete(sessionId);
        console.log(`🧹 Cleaned up expired session: ${sessionId}`);
      }
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    const now = Date.now();
    const activeSessions = Array.from(this.sessions.values()).filter(
      session => now - session.lastActivity <= this.sessionTimeout
    );

    return {
      total: this.sessions.size,
      active: activeSessions.length,
      expired: this.sessions.size - activeSessions.length,
      averageSubscriptions: activeSessions.reduce(
        (sum, session) => sum + session.subscriptions.size, 0
      ) / (activeSessions.length || 1),
      websocketSessions: activeSessions.filter(
        session => session.metadata.connectionType === 'websocket'
      ).length
    };
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
