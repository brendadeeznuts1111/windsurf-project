/**
 * @fileoverview Authentication Middleware with RBAC Integration
 * @description JWT authentication middleware that integrates with team hierarchy and RBAC
 * @author Bun Authentication Team
 * @version 1.0.0
 * @since 2025
 */

import { RBACEngine, UserContext, SystemRole } from '../rbac/rbac-engine';
import { BunTeamMapper } from '../bun-team-mapper';
import { SessionManager, SessionData } from './session-manager';

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
  session?: SessionData;
  teamMapper?: BunTeamMapper;
}

export interface AuthMiddlewareConfig {
  requireAuth?: boolean;
  allowedRoles?: SystemRole[];
  requiredPermissions?: string[];
  excludePaths?: string[];
  publicPaths?: string[];
}

export interface AuthResult {
  authenticated: boolean;
  user?: UserContext;
  session?: SessionData;
  error?: string;
  statusCode?: number;
}

export class AuthMiddleware {
  private rbacEngine: RBACEngine;
  private sessionManager: SessionManager;
  private teamMapper: BunTeamMapper;
  private config: AuthMiddlewareConfig;

  constructor(
    rbacEngine: RBACEngine,
    sessionManager: SessionManager,
    teamMapper: BunTeamMapper,
    config: AuthMiddlewareConfig = {}
  ) {
    this.rbacEngine = rbacEngine;
    this.sessionManager = sessionManager;
    this.teamMapper = teamMapper;
    this.config = {
      requireAuth: true,
      allowedRoles: [],
      requiredPermissions: [],
      excludePaths: [],
      publicPaths: ['/api/auth/login', '/api/auth/refresh', '/health', '/api/health'],
      ...config
    };
  }

  /**
   * Authentication middleware function
   */
  async authenticate(request: Request): Promise<AuthResult> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Check if path is public
    if (this.isPublicPath(path)) {
      return { authenticated: true };
    }

    // Check if path is excluded
    if (this.isExcludedPath(path)) {
      return { authenticated: true };
    }

    try {
      // Extract session from cookies
      const cookies = (request as any).cookies || this.parseCookies(request);
      const sessionData = await this.sessionManager.getSessionFromCookies(cookies);

      if (!sessionData) {
        return {
          authenticated: false,
          error: 'No valid session found',
          statusCode: 401
        };
      }

      // Check if session is expired
      if (!this.sessionManager.isSessionValid(sessionData)) {
        return {
          authenticated: false,
          error: 'Session expired',
          statusCode: 401
        };
      }

      // Create user context from session
      const userContext: UserContext = {
        userId: sessionData.userId,
        username: sessionData.username,
        email: sessionData.email,
        roles: sessionData.roles.map(r => r as SystemRole) || [],
        teamId: sessionData.teamId,
        organizationId: sessionData.organizationId,
        sessionId: sessionData.sessionId
      };

      // Check role-based access
      if (this.config.allowedRoles && this.config.allowedRoles.length > 0) {
        const hasAllowedRole = this.config.allowedRoles.some(role =>
          userContext.roles.includes(role)
        );

        if (!hasAllowedRole) {
          return {
            authenticated: false,
            error: 'Insufficient role permissions',
            statusCode: 403
          };
        }
      }

      // Check permission-based access
      if (this.config.requiredPermissions && this.config.requiredPermissions.length > 0) {
        // This would integrate with RBAC engine for fine-grained permissions
        const hasPermissions = await this.checkPermissions(userContext, this.config.requiredPermissions);
        if (!hasPermissions) {
          return {
            authenticated: false,
            error: 'Insufficient permissions',
            statusCode: 403
          };
        }
      }

      return {
        authenticated: true,
        user: userContext,
        session: sessionData
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return {
        authenticated: false,
        error: 'Authentication failed',
        statusCode: 500
      };
    }
  }

  /**
   * Create authenticated request with user context
   */
  createAuthenticatedRequest(originalRequest: Request, authResult: AuthResult): AuthenticatedRequest {
    const authenticatedRequest = originalRequest as AuthenticatedRequest;

    if (authResult.authenticated && authResult.user) {
      authenticatedRequest.user = authResult.user;
      authenticatedRequest.session = authResult.session;
      authenticatedRequest.teamMapper = this.teamMapper;
    }

    return authenticatedRequest;
  }

  /**
   * Middleware wrapper for Bun.serve
   */
  middleware() {
    return async (request: Request): Promise<Response | Request> => {
      const authResult = await this.authenticate(request);

      if (!authResult.authenticated) {
        const statusCode = authResult.statusCode || 401;
        const errorMessage = authResult.error || 'Unauthorized';

        return new Response(JSON.stringify({
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }), {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer'
          }
        });
      }

      // Return authenticated request for further processing
      return this.createAuthenticatedRequest(request, authResult);
    };
  }

  /**
   * Check if path is public (no auth required)
   */
  private isPublicPath(path: string): boolean {
    return this.config.publicPaths?.some(publicPath =>
      path === publicPath || path.startsWith(publicPath + '/')
    ) || false;
  }

  /**
   * Check if path is excluded from auth
   */
  private isExcludedPath(path: string): boolean {
    return this.config.excludePaths?.some(excludePath =>
      path === excludePath || path.startsWith(excludePath + '/')
    ) || false;
  }

  /**
   * Parse cookies from request headers (fallback for when cookies not available)
   */
  private parseCookies(request: Request): Map<string, string> {
    const cookies = new Map<string, string>();
    const cookieHeader = request.headers.get('cookie');

    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies.set(name.trim(), value.trim());
        }
      });
    }

    return cookies;
  }

  /**
   * Check permissions using RBAC engine
   */
  private async checkPermissions(userContext: UserContext, requiredPermissions: string[]): Promise<boolean> {
    // This is a simplified check - in production you'd use the full RBAC engine
    // For now, we'll do basic role-based checking

    const userRoles = userContext.roles;

    // Map permissions to roles (simplified)
    const permissionRoleMap: Record<string, SystemRole[]> = {
      'read': [SystemRole.VIEWER, SystemRole.DEVELOPER, SystemRole.TEAM_ADMIN, SystemRole.ORG_ADMIN, SystemRole.SUPER_ADMIN],
      'write': [SystemRole.DEVELOPER, SystemRole.TEAM_ADMIN, SystemRole.ORG_ADMIN, SystemRole.SUPER_ADMIN],
      'admin': [SystemRole.TEAM_ADMIN, SystemRole.ORG_ADMIN, SystemRole.SUPER_ADMIN],
      'super_admin': [SystemRole.SUPER_ADMIN]
    };

    for (const permission of requiredPermissions) {
      const allowedRoles = permissionRoleMap[permission] || [];
      const hasPermission = allowedRoles.some(role => userRoles.includes(role));

      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get user context from team hierarchy
   */
  async getUserContextFromTeam(userId: string): Promise<UserContext | null> {
    try {
      // In a real implementation, this would fetch user data from database
      // For now, we'll create a mock user context based on team hierarchy

      const hierarchyData = this.teamMapper.getHierarchyData();
      if (!hierarchyData) return null;

      // Find user in team hierarchy (simplified)
      for (const [tier, tierData] of Object.entries(hierarchyData)) {
        if (tier === 'executive') {
          const member = tierData.members.find((m: any) => m.id === userId);
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
          const member = members.find((m: any) => m.id === userId);
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
        }

        if (tier === 'senior' || tier === 'midlevel' || tier === 'associate') {
          const members = (tierData as any).engineering || [];
          const member = members.find((m: any) => m.id === userId);
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

      return null;
    } catch (error) {
      console.error('Error getting user context from team:', error);
      return null;
    }
  }

  /**
   * Get authentication statistics
   */
  getAuthStats(): {
    config: AuthMiddlewareConfig;
    sessionStats: any;
  } {
    return {
      config: this.config,
      sessionStats: this.sessionManager.getSessionStats()
    };
  }
}

export default AuthMiddleware;