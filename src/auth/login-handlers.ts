/**
 * @fileoverview Authentication API Handlers
 * @description Login, logout, and token refresh handlers for JWT authentication
 * @author Bun Authentication Team
 * @version 1.0.0
 * @since 2025
 */

import { SystemRole } from '../rbac/rbac-engine';
import { JWTService } from './jwt-service';
import { SessionManager } from './session-manager';
import { AuthMiddleware } from './auth-middleware';

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    roles: string[];
    teamId?: string;
  };
  message?: string;
  error?: string;
  timestamp: string;
}

export interface RefreshResponse {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

export class AuthHandlers {
  private jwtService: JWTService;
  private sessionManager: SessionManager;
  private authMiddleware: AuthMiddleware;

  constructor(
    jwtService: JWTService,
    sessionManager: SessionManager,
    authMiddleware: AuthMiddleware
  ) {
    this.jwtService = jwtService;
    this.sessionManager = sessionManager;
    this.authMiddleware = authMiddleware;
  }

  /**
   * Handle user login
   */
  async handleLogin(request: Request): Promise<Response> {
    try {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Method not allowed',
          timestamp: new Date().toISOString()
        }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const loginData = await request.json() as LoginRequest;

      // Validate input
      if (!loginData.username || !loginData.password) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Username and password are required',
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Authenticate user (simplified - in production use proper authentication)
      const userContext = await this.authenticateUser(loginData.username, loginData.password);

      if (!userContext) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create session cookies
      const { accessTokenCookie, refreshTokenCookie, sessionData } = await this.sessionManager.createSessionCookies(userContext);

      // Prepare response
      const responseData: LoginResponse = {
        success: true,
        user: {
          id: userContext.userId,
          username: userContext.username,
          email: userContext.email,
          roles: userContext.roles.map((r: any) => r.toString()),
          teamId: userContext.teamId
        },
        message: 'Login successful',
        timestamp: new Date().toISOString()
      };

      // Create response with cookies
      const response = new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `${accessTokenCookie}, ${refreshTokenCookie}`
        }
      });

      return response;

    } catch (error) {
      console.error('Login error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Login failed',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle token refresh
   */
  async handleRefresh(request: Request): Promise<Response> {
    try {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Method not allowed',
          timestamp: new Date().toISOString()
        }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get cookies from request
      const cookies = (request as any).cookies || this.parseCookies(request);

      // Attempt to refresh session
      const refreshResult = await this.sessionManager.refreshSession(cookies);

      if (!refreshResult) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired refresh token',
          timestamp: new Date().toISOString()
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create response with new cookies
      const responseData: RefreshResponse = {
        success: true,
        message: 'Token refreshed successfully',
        timestamp: new Date().toISOString()
      };

      const response = new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `${refreshResult.accessTokenCookie}, ${refreshResult.refreshTokenCookie}`
        }
      });

      return response;

    } catch (error) {
      console.error('Refresh error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Token refresh failed',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle user logout
   */
  async handleLogout(request: Request): Promise<Response> {
    try {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Method not allowed',
          timestamp: new Date().toISOString()
        }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get cookies from request
      const cookies = (request as any).cookies || this.parseCookies(request);

      // Revoke session
      await this.sessionManager.revokeSession(cookies);

      // Get logout cookies
      const { accessTokenCookie, refreshTokenCookie } = this.sessionManager.getLogoutCookies();

      // Prepare response
      const responseData: LogoutResponse = {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      };

      // Create response with expired cookies
      const response = new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `${accessTokenCookie}, ${refreshTokenCookie}`
        }
      });

      return response;

    } catch (error) {
      console.error('Logout error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Logout failed',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Get current user info
   */
  async handleMe(request: Request): Promise<Response> {
    try {
      // Authenticate the request
      const authResult = await this.authMiddleware.authenticate(request);

      if (!authResult.authenticated || !authResult.user) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Not authenticated',
          timestamp: new Date().toISOString()
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const responseData = {
        success: true,
        user: {
          id: authResult.user.userId,
          username: authResult.user.username,
          email: authResult.user.email,
          roles: authResult.user.roles.map(r => r.toString()),
          teamId: authResult.user.teamId,
          organizationId: authResult.user.organizationId
        },
        session: authResult.session ? {
          sessionId: authResult.session.sessionId,
          createdAt: authResult.session.createdAt,
          expiresAt: authResult.session.expiresAt
        } : null,
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Me error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get user info',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Authenticate user (simplified - replace with real authentication)
   */
  private async authenticateUser(username: string, password: string): Promise<any> {
    // This is a simplified authentication for demo purposes
    // In production, you would:
    // 1. Hash and compare passwords
    // 2. Check against user database
    // 3. Implement rate limiting
    // 4. Add 2FA support
    // 5. Log authentication attempts

    // Demo authentication using team hierarchy data
    const userContext = await this.authMiddleware.getUserContextFromTeam(username);

    if (userContext && password === 'demo-password') {
      return userContext;
    }

    // For demo purposes, allow login with any team member ID
    const hierarchyData = (this.authMiddleware as any).teamMapper?.getHierarchyData();
    if (hierarchyData) {
      // Check all tiers for the user
      for (const [tier, tierData] of Object.entries(hierarchyData)) {
        if (tier === 'executive') {
          const member = (tierData as any).members.find((m: any) => m.id === username || m.name.toLowerCase().replace(' ', '') === username);
          if (member) {
            return {
              userId: member.id,
              username: member.name.toLowerCase().replace(' ', ''),
              email: member.email,
              roles: [SystemRole.SUPER_ADMIN],
              teamId: 'executive-team',
              organizationId: 'company'
            };
          }
        }

        if (tier === 'leadership') {
          for (const dept of ['engineering', 'non_engineering']) {
            const members = (tierData as any)[dept] || [];
            const member = members.find((m: any) => m.id === username || m.name.toLowerCase().replace(' ', '') === username);
            if (member) {
              return {
                userId: member.id,
                username: member.name.toLowerCase().replace(' ', ''),
                email: member.email,
                roles: [SystemRole.TEAM_ADMIN],
                teamId: `${dept}-leadership`,
                organizationId: 'company'
              };
            }
          }
        }

        if (tier === 'senior' || tier === 'midlevel' || tier === 'associate') {
          const members = (tierData as any).engineering || [];
          const member = members.find((m: any) => m.id === username || m.name.toLowerCase().replace(' ', '') === username);
          if (member) {
            const role = tier === 'senior' ? SystemRole.DEVELOPER :
                        tier === 'midlevel' ? SystemRole.DEVELOPER :
                        SystemRole.VIEWER;
            return {
              userId: member.id,
              username: member.name.toLowerCase().replace(' ', ''),
              email: member.email,
              roles: [role],
              teamId: 'engineering-team',
              organizationId: 'company'
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Parse cookies from request headers (fallback)
   */
  private parseCookies(request: Request): Map<string, string> {
    const cookies = new Map<string, string>();
    const cookieHeader = request.headers.get('cookie');

    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie: string) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies.set(name.trim(), value.trim());
        }
      });
    }

    return cookies;
  }
}

export default AuthHandlers;