/**
 * @fileoverview Role-Based Access Control (RBAC) System
 * @description Comprehensive RBAC implementation for Bun ecosystem security
 * @author Bun Documentation Team
 * @version 1.0.0
 * @since 2025
 */

export enum SystemRole {
  // Super Admin - Full system access
  SUPER_ADMIN = 'super_admin',

  // Organization Admin - Organization-wide management
  ORG_ADMIN = 'org_admin',

  // Team Admin - Team-specific management
  TEAM_ADMIN = 'team_admin',

  // Developer - Code contribution and CI/CD access
  DEVELOPER = 'developer',

  // Analyst - Read-only analytics and monitoring access
  ANALYST = 'analyst',

  // Viewer - Basic read-only access
  VIEWER = 'viewer',

  // Guest - Limited access for external users
  GUEST = 'guest'
}

export enum ResourceType {
  // System resources
  SYSTEM = 'system',
  ORGANIZATION = 'organization',
  TEAM = 'team',
  USER = 'user',

  // Application resources
  DASHBOARD = 'dashboard',
  API = 'api',
  ANALYTICS = 'analytics',
  MONITORING = 'monitoring',

  // CI/CD resources
  PIPELINE = 'pipeline',
  DEPLOYMENT = 'deployment',
  RELEASE = 'release',

  // Data resources
  DATABASE = 'database',
  METRICS = 'metrics',
  LOGS = 'logs'
}

export enum Permission {
  // System permissions
  SYSTEM_READ = 'system:read',
  SYSTEM_WRITE = 'system:write',
  SYSTEM_DELETE = 'system:delete',
  SYSTEM_ADMIN = 'system:admin',

  // Organization permissions
  ORG_READ = 'org:read',
  ORG_WRITE = 'org:write',
  ORG_DELETE = 'org:delete',
  ORG_ADMIN = 'org:admin',

  // Team permissions
  TEAM_READ = 'team:read',
  TEAM_WRITE = 'team:write',
  TEAM_DELETE = 'team:delete',
  TEAM_ADMIN = 'team:admin',

  // User permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_ADMIN = 'user:admin',

  // Dashboard permissions
  DASHBOARD_READ = 'dashboard:read',
  DASHBOARD_WRITE = 'dashboard:write',
  DASHBOARD_ADMIN = 'dashboard:admin',

  // API permissions
  API_READ = 'api:read',
  API_WRITE = 'api:write',
  API_EXECUTE = 'api:execute',
  API_ADMIN = 'api:admin',

  // Analytics permissions
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_WRITE = 'analytics:write',
  ANALYTICS_ADMIN = 'analytics:admin',

  // Monitoring permissions
  MONITORING_READ = 'monitoring:read',
  MONITORING_WRITE = 'monitoring:write',
  MONITORING_ADMIN = 'monitoring:admin',

  // CI/CD permissions
  PIPELINE_READ = 'pipeline:read',
  PIPELINE_WRITE = 'pipeline:write',
  PIPELINE_EXECUTE = 'pipeline:execute',
  PIPELINE_ADMIN = 'pipeline:admin',

  // Deployment permissions
  DEPLOYMENT_READ = 'deployment:read',
  DEPLOYMENT_WRITE = 'deployment:write',
  DEPLOYMENT_EXECUTE = 'deployment:execute',
  DEPLOYMENT_ADMIN = 'deployment:admin',

  // Release permissions
  RELEASE_READ = 'release:read',
  RELEASE_WRITE = 'release:write',
  RELEASE_ADMIN = 'release:admin',

  // Database permissions
  DATABASE_READ = 'database:read',
  DATABASE_WRITE = 'database:write',
  DATABASE_ADMIN = 'database:admin',

  // Metrics permissions
  METRICS_READ = 'metrics:read',
  METRICS_WRITE = 'metrics:write',
  METRICS_ADMIN = 'metrics:admin',

  // Logs permissions
  LOGS_READ = 'logs:read',
  LOGS_WRITE = 'logs:write',
  LOGS_ADMIN = 'logs:admin'
}

export interface RoleDefinition {
  name: SystemRole;
  description: string;
  permissions: Permission[];
  inherits?: SystemRole[];
  metadata?: {
    level: number; // Hierarchy level (higher = more permissions)
    scope: 'system' | 'organization' | 'team' | 'user';
    createdAt: string;
    updatedAt: string;
  };
}

export interface UserContext {
  userId: string;
  username: string;
  email: string;
  roles: SystemRole[];
  organizationId?: string;
  teamId?: string;
  attributes?: Record<string, any>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResourceContext {
  resourceType: ResourceType;
  resourceId: string;
  action: string;
  attributes?: Record<string, any>;
  ownerId?: string;
  organizationId?: string;
  teamId?: string;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
  missingPermissions?: Permission[];
  context?: {
    user: UserContext;
    resource: ResourceContext;
    timestamp: string;
  };
}

export interface RBACPolicy {
  id: string;
  name: string;
  description: string;
  rules: AccessRule[];
  priority: number;
  enabled: boolean;
  conditions?: PolicyCondition[];
  metadata?: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
  };
}

export interface AccessRule {
  effect: 'allow' | 'deny';
  principals: Principal[];
  resources: ResourcePattern[];
  actions: string[];
  conditions?: PolicyCondition[];
}

export interface Principal {
  type: 'user' | 'role' | 'group' | 'attribute';
  value: string;
}

export interface ResourcePattern {
  type: ResourceType;
  pattern: string; // Supports wildcards like 'team:*', 'api:analytics:*'
}

export interface PolicyCondition {
  type: 'time' | 'ip' | 'attribute' | 'context';
  key: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'regex';
  value: any;
}

// ============================================================================
// DEFAULT ROLE DEFINITIONS
// ============================================================================

export const DEFAULT_ROLES: Record<SystemRole, RoleDefinition> = {
  [SystemRole.SUPER_ADMIN]: {
    name: SystemRole.SUPER_ADMIN,
    description: 'Super Administrator with full system access',
    permissions: Object.values(Permission),
    metadata: {
      level: 100,
      scope: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  [SystemRole.ORG_ADMIN]: {
    name: SystemRole.ORG_ADMIN,
    description: 'Organization Administrator with org-wide management',
    permissions: [
      // Organization permissions
      Permission.ORG_READ, Permission.ORG_WRITE, Permission.ORG_ADMIN,

      // Team permissions within org
      Permission.TEAM_READ, Permission.TEAM_WRITE, Permission.TEAM_ADMIN,

      // User management within org
      Permission.USER_READ, Permission.USER_WRITE, Permission.USER_ADMIN,

      // Dashboard access
      Permission.DASHBOARD_READ, Permission.DASHBOARD_WRITE, Permission.DASHBOARD_ADMIN,

      // Analytics access
      Permission.ANALYTICS_READ, Permission.ANALYTICS_WRITE, Permission.ANALYTICS_ADMIN,

      // Monitoring access
      Permission.MONITORING_READ, Permission.MONITORING_WRITE, Permission.MONITORING_ADMIN,

      // CI/CD access
      Permission.PIPELINE_READ, Permission.PIPELINE_WRITE, Permission.PIPELINE_EXECUTE,
      Permission.DEPLOYMENT_READ, Permission.DEPLOYMENT_WRITE, Permission.DEPLOYMENT_EXECUTE,
      Permission.RELEASE_READ, Permission.RELEASE_WRITE,

      // Limited system access
      Permission.SYSTEM_READ
    ],
    metadata: {
      level: 80,
      scope: 'organization',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  [SystemRole.TEAM_ADMIN]: {
    name: SystemRole.TEAM_ADMIN,
    description: 'Team Administrator with team-specific management',
    permissions: [
      // Team permissions
      Permission.TEAM_READ, Permission.TEAM_WRITE, Permission.TEAM_ADMIN,

      // User management within team
      Permission.USER_READ, Permission.USER_WRITE,

      // Dashboard access
      Permission.DASHBOARD_READ, Permission.DASHBOARD_WRITE,

      // Analytics access
      Permission.ANALYTICS_READ, Permission.ANALYTICS_WRITE,

      // Monitoring access
      Permission.MONITORING_READ,

      // CI/CD access (limited)
      Permission.PIPELINE_READ, Permission.PIPELINE_EXECUTE,
      Permission.DEPLOYMENT_READ, Permission.DEPLOYMENT_EXECUTE,
      Permission.RELEASE_READ
    ],
    metadata: {
      level: 60,
      scope: 'team',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  [SystemRole.DEVELOPER]: {
    name: SystemRole.DEVELOPER,
    description: 'Developer with code contribution and CI/CD access',
    permissions: [
      // Dashboard access
      Permission.DASHBOARD_READ,

      // Analytics access
      Permission.ANALYTICS_READ,

      // Monitoring access
      Permission.MONITORING_READ,

      // CI/CD access
      Permission.PIPELINE_READ, Permission.PIPELINE_WRITE, Permission.PIPELINE_EXECUTE,
      Permission.DEPLOYMENT_READ, Permission.DEPLOYMENT_EXECUTE,
      Permission.RELEASE_READ, Permission.RELEASE_WRITE,

      // Limited API access
      Permission.API_READ, Permission.API_EXECUTE,

      // Database access (read-only)
      Permission.DATABASE_READ,

      // Metrics access
      Permission.METRICS_READ,

      // Logs access
      Permission.LOGS_READ
    ],
    metadata: {
      level: 40,
      scope: 'team',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  [SystemRole.ANALYST]: {
    name: SystemRole.ANALYST,
    description: 'Analyst with read-only analytics and monitoring access',
    permissions: [
      // Dashboard access (read-only)
      Permission.DASHBOARD_READ,

      // Full analytics access
      Permission.ANALYTICS_READ, Permission.ANALYTICS_WRITE,

      // Full monitoring access
      Permission.MONITORING_READ, Permission.MONITORING_WRITE,

      // Metrics access
      Permission.METRICS_READ, Permission.METRICS_WRITE,

      // Logs access
      Permission.LOGS_READ, Permission.LOGS_WRITE,

      // Limited API access
      Permission.API_READ
    ],
    metadata: {
      level: 30,
      scope: 'organization',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  [SystemRole.VIEWER]: {
    name: SystemRole.VIEWER,
    description: 'Viewer with basic read-only access',
    permissions: [
      // Dashboard access (read-only)
      Permission.DASHBOARD_READ,

      // Analytics access (read-only)
      Permission.ANALYTICS_READ,

      // Monitoring access (read-only)
      Permission.MONITORING_READ,

      // Metrics access (read-only)
      Permission.METRICS_READ,

      // Logs access (read-only)
      Permission.LOGS_READ,

      // Limited API access
      Permission.API_READ
    ],
    metadata: {
      level: 20,
      scope: 'organization',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  [SystemRole.GUEST]: {
    name: SystemRole.GUEST,
    description: 'Guest with limited access for external users',
    permissions: [
      // Very limited dashboard access
      Permission.DASHBOARD_READ,

      // Limited analytics access
      Permission.ANALYTICS_READ,

      // No monitoring access
      // No CI/CD access
      // No API write access
      // No database access
    ],
    metadata: {
      level: 10,
      scope: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
};

// ============================================================================
// RBAC ENGINE
// ============================================================================

export class RBACEngine {
  private roles: Map<SystemRole, RoleDefinition> = new Map();
  private policies: Map<string, RBACPolicy> = new Map();
  private roleHierarchy: Map<SystemRole, SystemRole[]> = new Map();
  private cache: Map<string, AccessDecision> = new Map();
  private auditLog: AccessAuditEntry[] = [];

  constructor() {
    this.initializeDefaultRoles();
    this.initializeRoleHierarchy();
  }

  private initializeDefaultRoles(): void {
    Object.values(DEFAULT_ROLES).forEach(role => {
      this.roles.set(role.name, role);
    });
  }

  private initializeRoleHierarchy(): void {
    // Define inheritance relationships
    this.roleHierarchy.set(SystemRole.SUPER_ADMIN, []);
    this.roleHierarchy.set(SystemRole.ORG_ADMIN, [SystemRole.TEAM_ADMIN]);
    this.roleHierarchy.set(SystemRole.TEAM_ADMIN, [SystemRole.DEVELOPER, SystemRole.ANALYST]);
    this.roleHierarchy.set(SystemRole.DEVELOPER, [SystemRole.VIEWER]);
    this.roleHierarchy.set(SystemRole.ANALYST, [SystemRole.VIEWER]);
    this.roleHierarchy.set(SystemRole.VIEWER, [SystemRole.GUEST]);
    this.roleHierarchy.set(SystemRole.GUEST, []);
  }

  // ============================================================================
  // PERMISSION CHECKING
  // ============================================================================

  async checkAccess(user: UserContext, resource: ResourceContext): Promise<AccessDecision> {
    const cacheKey = this.generateCacheKey(user, resource);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const decision: AccessDecision = {
      allowed: false,
      context: {
        user,
        resource,
        timestamp: new Date().toISOString()
      }
    };

    try {
      // Get all permissions for user
      const userPermissions = this.getUserPermissions(user);

      // Check if user has required permissions
      const requiredPermissions = this.getRequiredPermissions(resource);
      const missingPermissions = requiredPermissions.filter(p => !userPermissions.has(p));

      if (missingPermissions.length === 0) {
        decision.allowed = true;
      } else {
        decision.allowed = false;
        decision.missingPermissions = missingPermissions;
        decision.requiredPermissions = requiredPermissions;
        decision.reason = `Missing permissions: ${missingPermissions.join(', ')}`;
      }

      // Apply policy-based rules
      const policyDecision = await this.evaluatePolicies(user, resource);
      if (policyDecision !== null) {
        decision.allowed = policyDecision;
      }

    } catch (error) {
      decision.allowed = false;
      decision.reason = `RBAC evaluation error: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Cache decision
    this.cache.set(cacheKey, decision);

    // Audit the access attempt
    this.auditAccess(decision);

    return decision;
  }

  private getUserPermissions(user: UserContext): Set<Permission> {
    const permissions = new Set<Permission>();

    // Add permissions from all user roles
    user.roles.forEach(roleName => {
      const role = this.roles.get(roleName);
      if (role) {
        role.permissions.forEach(permission => permissions.add(permission));

        // Add permissions from inherited roles
        const inheritedRoles = this.roleHierarchy.get(roleName) || [];
        inheritedRoles.forEach(inheritedRole => {
          const inheritedRoleDef = this.roles.get(inheritedRole);
          if (inheritedRoleDef) {
            inheritedRoleDef.permissions.forEach(permission => permissions.add(permission));
          }
        });
      }
    });

    return permissions;
  }

  private getRequiredPermissions(resource: ResourceContext): Permission[] {
    const resourceType = resource.resourceType;
    const action = resource.action;

    // Map resource type and action to permissions
    const permissionMap: Record<string, Record<string, Permission[]>> = {
      [ResourceType.DASHBOARD]: {
        'read': [Permission.DASHBOARD_READ],
        'write': [Permission.DASHBOARD_WRITE],
        'admin': [Permission.DASHBOARD_ADMIN]
      },
      [ResourceType.API]: {
        'read': [Permission.API_READ],
        'write': [Permission.API_WRITE],
        'execute': [Permission.API_EXECUTE],
        'admin': [Permission.API_ADMIN]
      },
      [ResourceType.ANALYTICS]: {
        'read': [Permission.ANALYTICS_READ],
        'write': [Permission.ANALYTICS_WRITE],
        'admin': [Permission.ANALYTICS_ADMIN]
      },
      [ResourceType.PIPELINE]: {
        'read': [Permission.PIPELINE_READ],
        'write': [Permission.PIPELINE_WRITE],
        'execute': [Permission.PIPELINE_EXECUTE],
        'admin': [Permission.PIPELINE_ADMIN]
      },
      [ResourceType.DEPLOYMENT]: {
        'read': [Permission.DEPLOYMENT_READ],
        'write': [Permission.DEPLOYMENT_WRITE],
        'execute': [Permission.DEPLOYMENT_EXECUTE],
        'admin': [Permission.DEPLOYMENT_ADMIN]
      },
      [ResourceType.MONITORING]: {
        'read': [Permission.MONITORING_READ],
        'write': [Permission.MONITORING_WRITE],
        'admin': [Permission.MONITORING_ADMIN]
      },
      [ResourceType.TEAM]: {
        'read': [Permission.TEAM_READ],
        'write': [Permission.TEAM_WRITE],
        'admin': [Permission.TEAM_ADMIN]
      },
      [ResourceType.USER]: {
        'read': [Permission.USER_READ],
        'write': [Permission.USER_WRITE],
        'admin': [Permission.USER_ADMIN]
      }
    };

    return permissionMap[resourceType]?.[action] || [];
  }

  private async evaluatePolicies(user: UserContext, resource: ResourceContext): Promise<boolean | null> {
    // Evaluate policies in priority order
    const sortedPolicies = Array.from(this.policies.values())
      .filter(policy => policy.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of sortedPolicies) {
      const matches = this.policyMatches(policy, user, resource);
      if (matches) {
        return policy.rules.some(rule => rule.effect === 'allow');
      }
    }

    return null; // No policy matched
  }

  private policyMatches(policy: RBACPolicy, user: UserContext, resource: ResourceContext): boolean {
    return policy.rules.some(rule => {
      const principalMatches = rule.principals.some(principal =>
        this.principalMatches(principal, user)
      );

      const resourceMatches = rule.resources.some(resourcePattern =>
        this.resourceMatches(resourcePattern, resource)
      );

      const actionMatches = rule.actions.includes(resource.action) || rule.actions.includes('*');

      const conditionsMatch = !rule.conditions || rule.conditions.every(condition =>
        this.conditionMatches(condition, user, resource)
      );

      return principalMatches && resourceMatches && actionMatches && conditionsMatch;
    });
  }

  private principalMatches(principal: Principal, user: UserContext): boolean {
    switch (principal.type) {
      case 'user':
        return principal.value === user.userId || principal.value === user.username;
      case 'role':
        return user.roles.includes(principal.value as SystemRole);
      case 'group':
        // Would check user's groups - placeholder
        return false;
      case 'attribute':
        return user.attributes?.[principal.value] !== undefined;
      default:
        return false;
    }
  }

  private resourceMatches(pattern: ResourcePattern, resource: ResourceContext): boolean {
    if (pattern.type !== resource.resourceType) return false;

    // Simple wildcard matching
    const patternParts = pattern.pattern.split(':');
    const resourceParts = [resource.resourceType, resource.resourceId];

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '*') continue;
      if (patternParts[i] !== resourceParts[i]) return false;
    }

    return true;
  }

  private conditionMatches(condition: PolicyCondition, user: UserContext, resource: ResourceContext): boolean {
    const context = { user, resource, timestamp: new Date() };
    const actualValue = this.getNestedValue(context, condition.key);

    switch (condition.operator) {
      case 'eq': return actualValue === condition.value;
      case 'ne': return actualValue !== condition.value;
      case 'gt': return actualValue > condition.value;
      case 'lt': return actualValue < condition.value;
      case 'gte': return actualValue >= condition.value;
      case 'lte': return actualValue <= condition.value;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(actualValue);
      case 'contains': return String(actualValue).includes(String(condition.value));
      case 'regex': return new RegExp(condition.value).test(String(actualValue));
      default: return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  addRole(role: RoleDefinition): void {
    this.roles.set(role.name, role);
    this.invalidateCache();
  }

  removeRole(roleName: SystemRole): void {
    this.roles.delete(roleName);
    this.invalidateCache();
  }

  getRole(roleName: SystemRole): RoleDefinition | undefined {
    return this.roles.get(roleName);
  }

  listRoles(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }

  // ============================================================================
  // POLICY MANAGEMENT
  // ============================================================================

  addPolicy(policy: RBACPolicy): void {
    this.policies.set(policy.id, policy);
    this.invalidateCache();
  }

  removePolicy(policyId: string): void {
    this.policies.delete(policyId);
    this.invalidateCache();
  }

  getPolicy(policyId: string): RBACPolicy | undefined {
    return this.policies.get(policyId);
  }

  listPolicies(): RBACPolicy[] {
    return Array.from(this.policies.values());
  }

  enablePolicy(policyId: string): void {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = true;
      this.invalidateCache();
    }
  }

  disablePolicy(policyId: string): void {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = false;
      this.invalidateCache();
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  assignRole(userId: string, role: SystemRole): void {
    // In a real implementation, this would update user records
    console.log(`Assigned role ${role} to user ${userId}`);
    this.invalidateCache();
  }

  revokeRole(userId: string, role: SystemRole): void {
    // In a real implementation, this would update user records
    console.log(`Revoked role ${role} from user ${userId}`);
    this.invalidateCache();
  }

  getUserRoles(userId: string): SystemRole[] {
    // In a real implementation, this would query user records
    // For demo purposes, return default roles
    return [SystemRole.DEVELOPER];
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private generateCacheKey(user: UserContext, resource: ResourceContext): string {
    return `${user.userId}:${user.roles.join(',')}:${resource.resourceType}:${resource.resourceId}:${resource.action}`;
  }

  private invalidateCache(): void {
    this.cache.clear();
  }

  private auditAccess(decision: AccessDecision): void {
    const auditEntry: AccessAuditEntry = {
      timestamp: new Date().toISOString(),
      userId: decision.context!.user.userId,
      resourceType: decision.context!.resource.resourceType,
      resourceId: decision.context!.resource.resourceId,
      action: decision.context!.resource.action,
      allowed: decision.allowed,
      reason: decision.reason,
      sessionId: decision.context!.user.sessionId,
      ipAddress: decision.context!.user.ipAddress
    };

    this.auditLog.push(auditEntry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  getAuditLog(limit: number = 100): AccessAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need hit/miss counters
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AccessAuditEntry {
  timestamp: string;
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  action: string;
  allowed: boolean;
  reason?: string;
  sessionId?: string;
  ipAddress?: string;
}

// ============================================================================
// MIDDLEWARE INTEGRATION
// ============================================================================

export function createRBACMiddleware(rbacEngine: RBACEngine) {
  return async function rbacMiddleware(request: Request): Promise<Response | null> {
    try {
      // Extract user context from request
      const userContext = extractUserContext(request);
      if (!userContext) {
        return new Response(JSON.stringify({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Extract resource context from request
      const resourceContext = extractResourceContext(request);
      if (!resourceContext) {
        return new Response(JSON.stringify({
          error: 'Invalid resource',
          code: 'INVALID_RESOURCE'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check access
      const decision = await rbacEngine.checkAccess(userContext, resourceContext);

      if (!decision.allowed) {
        return new Response(JSON.stringify({
          error: 'Access denied',
          code: 'ACCESS_DENIED',
          reason: decision.reason,
          requiredPermissions: decision.requiredPermissions,
          missingPermissions: decision.missingPermissions
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Access granted - continue to next handler
      return null;

    } catch (error) {
      console.error('RBAC middleware error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

function extractUserContext(request: Request): UserContext | null {
  try {
    // Extract from headers, JWT tokens, or session cookies
    const authHeader = request.headers.get('Authorization');
    const sessionCookie = request.headers.get('Cookie')?.split(';')
      .find(c => c.trim().startsWith('session='));

    if (!authHeader && !sessionCookie) return null;

    // In a real implementation, validate JWT or session
    // For demo, return mock user context
    return {
      userId: 'user-123',
      username: 'demo-user',
      email: 'user@example.com',
      roles: [SystemRole.DEVELOPER],
      organizationId: 'org-123',
      teamId: 'team-456',
      sessionId: 'session-789',
      ipAddress: '127.0.0.1',
      userAgent: request.headers.get('User-Agent') || 'unknown'
    };

  } catch (error) {
    console.error('Failed to extract user context:', error);
    return null;
  }
}

function extractResourceContext(request: Request): ResourceContext | null {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Map URL patterns to resource types
    if (pathParts[0] === 'api') {
      if (pathParts[1] === 'mapping') {
        if (pathParts[2] === 'members') {
          return {
            resourceType: ResourceType.USER,
            resourceId: pathParts[3] || '*',
            action: request.method === 'GET' ? 'read' : 'write'
          };
        }
        if (pathParts[2] === 'issues') {
          return {
            resourceType: ResourceType.TEAM,
            resourceId: pathParts[3] || '*',
            action: request.method === 'GET' ? 'read' : 'write'
          };
        }
        if (pathParts[2] === 'analytics') {
          return {
            resourceType: ResourceType.ANALYTICS,
            resourceId: pathParts[3] || '*',
            action: 'read'
          };
        }
      }

      if (pathParts[1] === 'pipeline') {
        return {
          resourceType: ResourceType.PIPELINE,
          resourceId: pathParts[2] || '*',
          action: request.method === 'GET' ? 'read' : 'execute'
        };
      }

      if (pathParts[1] === 'monitoring') {
        return {
          resourceType: ResourceType.MONITORING,
          resourceId: pathParts[2] || '*',
          action: 'read'
        };
      }
    }

    // Default to API access
    return {
      resourceType: ResourceType.API,
      resourceId: url.pathname,
      action: request.method === 'GET' ? 'read' : 'write'
    };

  } catch (error) {
    console.error('Failed to extract resource context:', error);
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  RBACEngine,
  SystemRole,
  ResourceType,
  Permission,
  DEFAULT_ROLES,
  createRBACMiddleware
};