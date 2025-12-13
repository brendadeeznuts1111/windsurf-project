/**
 * @fileoverview Session Manager with HttpOnly Cookies
 * @description Secure session management using Bun.CookieMap and HttpOnly cookies
 * @author Bun Authentication Team
 * @version 1.0.0
 * @since 2025
 */

import { UserContext } from '../rbac/rbac-engine';
import { JWTService, TokenPair } from './jwt-service';

export interface SessionConfig {
  sessionName: string;
  refreshTokenName: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  domain?: string;
  maxAge: number; // seconds
}

export interface SessionData {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  teamId?: string;
  organizationId?: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
}

export class SessionManager {
  private jwtService: JWTService;
  private config: SessionConfig;

  constructor(jwtService: JWTService, config?: Partial<SessionConfig>) {
    this.jwtService = jwtService;
    this.config = {
      sessionName: 'auth_session',
      refreshTokenName: 'auth_refresh',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60, // 15 minutes (matches JWT access token)
      ...config
    };
  }

  /**
   * Create session cookies for authenticated user
   */
  async createSessionCookies(userContext: UserContext): Promise<{
    accessTokenCookie: string;
    refreshTokenCookie: string;
    sessionData: SessionData;
  }> {
    // Generate JWT token pair
    const tokenPair = await this.jwtService.generateTokenPair(userContext);

    // Create access token cookie
    const accessTokenCookie = this.createCookie(
      this.config.sessionName,
      tokenPair.accessToken,
      this.config.maxAge
    );

    // Create refresh token cookie
    const refreshTokenCookie = this.createCookie(
      this.config.refreshTokenName,
      tokenPair.refreshToken,
      7 * 24 * 60 * 60 // 7 days
    );

    // Create session data
    const sessionData: SessionData = {
      userId: userContext.userId,
      username: userContext.username,
      email: userContext.email,
      roles: userContext.roles.map(r => r.toString()),
      teamId: userContext.teamId,
      organizationId: userContext.organizationId,
      sessionId: crypto.randomUUID(),
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.config.maxAge * 1000)
    };

    return {
      accessTokenCookie,
      refreshTokenCookie,
      sessionData
    };
  }

  /**
   * Extract session data from request cookies
   */
  async getSessionFromCookies(cookies: any): Promise<SessionData | null> {
    try {
      const accessToken = cookies.get(this.config.sessionName);
      if (!accessToken) {
        return null;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyToken(accessToken, 'access');

      return {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        roles: payload.roles || [],
        teamId: payload.teamId,
        organizationId: payload.organizationId,
        sessionId: payload.jti,
        createdAt: payload.iat * 1000,
        expiresAt: payload.exp * 1000
      };
    } catch (error) {
      console.warn('Session verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh session using refresh token cookie
   */
  async refreshSession(cookies: any): Promise<{
    accessTokenCookie: string;
    refreshTokenCookie: string;
    sessionData: SessionData;
  } | null> {
    try {
      const refreshToken = cookies.get(this.config.refreshTokenName);
      if (!refreshToken) {
        return null;
      }

      // Refresh tokens
      const newTokenPair = await this.jwtService.refreshAccessToken(refreshToken);

      // Create new cookies
      const accessTokenCookie = this.createCookie(
        this.config.sessionName,
        newTokenPair.accessToken,
        this.config.maxAge
      );

      const refreshTokenCookie = this.createCookie(
        this.config.refreshTokenName,
        newTokenPair.refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );

      // Extract session data from new access token
      const payload = await this.jwtService.verifyToken(newTokenPair.accessToken, 'access');

      const sessionData: SessionData = {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        roles: payload.roles || [],
        teamId: payload.teamId,
        organizationId: payload.organizationId,
        sessionId: payload.jti,
        createdAt: Date.now(),
        expiresAt: Date.now() + (this.config.maxAge * 1000)
      };

      return {
        accessTokenCookie,
        refreshTokenCookie,
        sessionData
      };
    } catch (error) {
      console.warn('Session refresh failed:', error);
      return null;
    }
  }

  /**
   * Clear session cookies (logout)
   */
  getLogoutCookies(): {
    accessTokenCookie: string;
    refreshTokenCookie: string;
  } {
    // Create expired cookies to clear them
    const accessTokenCookie = this.createCookie(this.config.sessionName, '', 0);
    const refreshTokenCookie = this.createCookie(this.config.refreshTokenName, '', 0);

    return {
      accessTokenCookie,
      refreshTokenCookie
    };
  }

  /**
   * Revoke session by token
   */
  async revokeSession(cookies: any): Promise<void> {
    try {
      const accessToken = cookies.get(this.config.sessionName);
      const refreshToken = cookies.get(this.config.refreshTokenName);

      if (accessToken) {
        await this.jwtService.revokeToken(accessToken);
      }

      if (refreshToken) {
        await this.jwtService.revokeToken(refreshToken);
      }
    } catch (error) {
      console.warn('Session revocation failed:', error);
    }
  }

  /**
   * Create HttpOnly cookie string
   */
  private createCookie(name: string, value: string, maxAge: number): string {
    const cookie = new Bun.Cookie(name, value);

    cookie.httpOnly = this.config.httpOnly;
    cookie.secure = this.config.secure;
    cookie.sameSite = this.config.sameSite;
    cookie.path = this.config.path;
    cookie.maxAge = maxAge;

    if (this.config.domain) {
      cookie.domain = this.config.domain;
    }

    return cookie.serialize();
  }

  /**
   * Validate session is still active
   */
  isSessionValid(sessionData: SessionData): boolean {
    return sessionData.expiresAt > Date.now();
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    config: SessionConfig;
    jwtStats: any;
  } {
    return {
      config: this.config,
      jwtStats: this.jwtService.getTokenStats()
    };
  }
}

export default SessionManager;