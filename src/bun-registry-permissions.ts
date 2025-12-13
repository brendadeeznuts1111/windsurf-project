/**
 * @fileoverview Bun Registry Permissions - Team-based package publishing controls
 * @description Controls package publishing permissions based on team hierarchy and scopes
 * @author Bun Team Integration
 * @version 1.0.0
 * @since 2025
 */

import { BunTeamMapper } from './bun-team-mapper';

export interface RegistryPermission {
  scope: string;
  team: string;
  permission: 'publish' | 'install' | 'admin';
  restrictions?: string[];
}

export interface PackagePublishRequest {
  packageName: string;
  version: string;
  userId: string;
  teamId?: string;
  scope?: string;
}

export interface PublishDecision {
  allowed: boolean;
  reason: string;
  requiredPermissions?: string[];
  suggestedTeams?: string[];
}

export class BunRegistryPermissions {
  private teamMapper: BunTeamMapper;
  private permissions: Map<string, RegistryPermission[]> = new Map();

  constructor(teamMapper: BunTeamMapper) {
    this.teamMapper = teamMapper;
    // Permissions will be initialized when refreshPermissions is called
  }

  /**
   * Initialize registry permissions based on team hierarchy
   */
  private initializePermissions(): void {
    const hierarchyData = this.teamMapper.getHierarchyData();
    if (!hierarchyData) return;

    // Clear existing permissions
    this.permissions.clear();

    // Set up permissions for each team
    for (const [teamKey, teamConfig] of Object.entries(hierarchyData.teams)) {
      const teamPermissions: RegistryPermission[] = [];

      // Core permissions based on registry scope
      if (teamConfig.registry_scope) {
        teamPermissions.push({
          scope: teamConfig.registry_scope,
          team: teamKey,
          permission: 'publish',
          restrictions: this.getScopeRestrictions(teamConfig.registry_scope)
        });
      }

      // Additional permissions based on team type
      if (teamKey === 'core_api') {
        teamPermissions.push({
          scope: '@core/*',
          team: teamKey,
          permission: 'admin'
        });
      } else if (teamKey === 'frontend') {
        teamPermissions.push({
          scope: '@features/frontend',
          team: teamKey,
          permission: 'publish'
        });
      } else if (teamKey === 'quality_assurance') {
        teamPermissions.push({
          scope: '@testing/*',
          team: teamKey,
          permission: 'publish'
        });
      }

      // Add install permissions for all teams
      teamPermissions.push({
        scope: '*',
        team: teamKey,
        permission: 'install'
      });

      this.permissions.set(teamKey, teamPermissions);
    }

    console.log(`🔐 Initialized registry permissions for ${this.permissions.size} teams`);
  }

  /**
   * Check if a user can publish a package
   */
  async checkPublishPermission(request: PackagePublishRequest): Promise<PublishDecision> {
    const { packageName, version, userId, teamId, scope } = request;

    // Get user's team membership and permissions
    const userPermissions = await this.teamMapper.getRegistryPermissions(userId);

    // Determine the scope from package name if not provided
    const packageScope = scope || this.extractScopeFromPackageName(packageName);

    // Check if user has permission for this scope
    const hasPermission = userPermissions.scopes.some(userScope =>
      this.scopeMatches(packageScope, userScope)
    );

    if (!hasPermission) {
      // Find teams that could publish this package
      const suggestedTeams = this.findTeamsForScope(packageScope);

      return {
        allowed: false,
        reason: `User does not have publish permission for scope ${packageScope}`,
        suggestedTeams
      };
    }

    // Check restrictions
    const restrictions = userPermissions.restrictions;
    if (restrictions.includes('no-publish')) {
      return {
        allowed: false,
        reason: 'User account has publish restrictions'
      };
    }

    if (restrictions.includes('team-approval-required')) {
      return {
        allowed: false,
        reason: 'Package requires team approval before publishing',
        requiredPermissions: ['team-approval']
      };
    }

    // Check version format and other validations
    const versionValidation = this.validatePackageVersion(version);
    if (!versionValidation.valid) {
      return {
        allowed: false,
        reason: versionValidation.reason || 'Invalid version format'
      };
    }

    // Check package name format
    const nameValidation = this.validatePackageName(packageName);
    if (!nameValidation.valid) {
      return {
        allowed: false,
        reason: nameValidation.reason || 'Invalid package name format'
      };
    }

    return {
      allowed: true,
      reason: 'Package publish approved'
    };
  }

  /**
   * Get all permissions for a team
   */
  getTeamPermissions(teamKey: string): RegistryPermission[] {
    return this.permissions.get(teamKey) || [];
  }

  /**
   * Get all teams that can publish to a scope
   */
  getTeamsForScope(scope: string): string[] {
    const teams: string[] = [];

    for (const [teamKey, permissions] of this.permissions.entries()) {
      const hasPermission = permissions.some(perm =>
        perm.permission === 'publish' && this.scopeMatches(scope, perm.scope)
      );
      if (hasPermission) {
        teams.push(teamKey);
      }
    }

    return teams;
  }

  /**
   * Add custom permission for a team
   */
  addTeamPermission(teamKey: string, permission: RegistryPermission): void {
    const teamPermissions = this.permissions.get(teamKey) || [];
    teamPermissions.push(permission);
    this.permissions.set(teamKey, teamPermissions);
  }

  /**
   * Remove permission from a team
   */
  removeTeamPermission(teamKey: string, scope: string, permission: string): void {
    const teamPermissions = this.permissions.get(teamKey) || [];
    const filtered = teamPermissions.filter(p =>
      !(p.scope === scope && p.permission === permission)
    );
    this.permissions.set(teamKey, filtered);
  }

  /**
   * Validate package version format
   */
  private validatePackageVersion(version: string): { valid: boolean; reason?: string } {
    // Semver validation
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

    if (!semverRegex.test(version)) {
      return {
        valid: false,
        reason: 'Version must follow semantic versioning (semver) format'
      };
    }

    // Check for pre-release versions
    if (version.includes('-')) {
      return {
        valid: false,
        reason: 'Pre-release versions require team approval'
      };
    }

    return { valid: true };
  }

  /**
   * Validate package name format
   */
  private validatePackageName(packageName: string): { valid: boolean; reason?: string } {
    // Basic package name validation
    if (!packageName || packageName.length === 0) {
      return { valid: false, reason: 'Package name cannot be empty' };
    }

    if (packageName.length > 214) {
      return { valid: false, reason: 'Package name too long (max 214 characters)' };
    }

    // Check for valid characters
    const validNameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!validNameRegex.test(packageName)) {
      return { valid: false, reason: 'Package name contains invalid characters' };
    }

    // Check for reserved names
    const reservedNames = ['node_modules', 'favicon.ico'];
    if (reservedNames.includes(packageName.toLowerCase())) {
      return { valid: false, reason: 'Package name is reserved' };
    }

    return { valid: true };
  }

  /**
   * Extract scope from package name
   */
  private extractScopeFromPackageName(packageName: string): string {
    if (packageName.startsWith('@')) {
      const parts = packageName.split('/');
      if (parts.length >= 2) {
        return `@${parts[0].substring(1)}/*`;
      }
    }
    return '*'; // Global scope
  }

  /**
   * Check if scope patterns match
   */
  private scopeMatches(requestScope: string, allowedScope: string): boolean {
    // Exact match
    if (requestScope === allowedScope) return true;

    // Wildcard matching
    if (allowedScope === '*') return true;

    // Scope pattern matching (e.g., @core/* matches @core/api)
    if (allowedScope.endsWith('/*')) {
      const baseScope = allowedScope.slice(0, -2); // Remove /*
      return requestScope.startsWith(baseScope + '/');
    }

    return false;
  }

  /**
   * Get restrictions for a scope
   */
  private getScopeRestrictions(scope: string): string[] {
    const restrictions: string[] = [];

    if (scope === '@core/*') {
      restrictions.push('requires-security-review');
    } else if (scope === '@internal/*') {
      restrictions.push('internal-only');
    } else if (scope.includes('testing')) {
      restrictions.push('test-environment-only');
    }

    return restrictions;
  }

  /**
   * Find teams that could publish to a scope
   */
  private findTeamsForScope(scope: string): string[] {
    return this.getTeamsForScope(scope);
  }

  /**
   * Get permission summary for all teams
   */
  getPermissionSummary(): {
    teams: Record<string, {
      publishScopes: string[];
      installScopes: string[];
      restrictions: string[];
    }>;
    totalTeams: number;
    totalScopes: number;
  } {
    const teams: Record<string, any> = {};
    let totalScopes = 0;

    for (const [teamKey, permissions] of this.permissions.entries()) {
      const publishScopes = permissions
        .filter(p => p.permission === 'publish')
        .map(p => p.scope);

      const installScopes = permissions
        .filter(p => p.permission === 'install')
        .map(p => p.scope);

      const restrictions = permissions
        .flatMap(p => p.restrictions || [])
        .filter((r, i, arr) => arr.indexOf(r) === i); // Unique

      teams[teamKey] = {
        publishScopes,
        installScopes,
        restrictions
      };

      totalScopes += publishScopes.length + installScopes.length;
    }

    return {
      teams,
      totalTeams: this.permissions.size,
      totalScopes
    };
  }

  /**
   * Refresh permissions from team hierarchy
   */
  refreshPermissions(): void {
    console.log('🔄 Refreshing registry permissions...');
    this.initializePermissions();
  }
}

/**
 * CLI tool for testing registry permissions
 */
export async function testRegistryPermissions(): Promise<void> {
  console.log('🧪 Testing Bun Registry Permissions...\n');

  // Initialize components
  const { Database } = require('bun:sqlite');
  const db = new Database(':memory:');
  const { RBACEngine } = require('./rbac/rbac-engine');
  const { TeamOrganizationEngine } = require('./team-organization-engine');

  const rbacEngine = new RBACEngine();
  const teamEngine = new TeamOrganizationEngine(db, rbacEngine);
  const teamMapper = new BunTeamMapper(teamEngine, rbacEngine);
  const registryPerms = new BunRegistryPermissions(teamMapper);

  try {
    // Load team hierarchy
    await teamMapper.loadTeamHierarchy();
    await teamMapper.syncTeamHierarchy();

    // Initialize registry permissions
    registryPerms.refreshPermissions();

    console.log('📋 Testing package publish permissions...\n');

    // Test cases
    const testCases: PackagePublishRequest[] = [
      {
        packageName: '@core/api-client',
        version: '1.0.0',
        userId: '550e8400-e29b-41d4-a716-446655440003', // David Kim (frontend team)
        scope: '@core/*'
      },
      {
        packageName: '@features/frontend-components',
        version: '2.1.0',
        userId: '550e8400-e29b-41d4-a716-446655440003', // David Kim (frontend team)
        scope: '@features/frontend'
      },
      {
        packageName: '@testing/utils',
        version: '1.0.0-beta.1',
        userId: '550e8400-e29b-41d4-a716-446655440010', // Daniel Brown (QA team)
        scope: '@testing/*'
      },
      {
        packageName: 'invalid-package-name',
        version: '1.0.0',
        userId: '550e8400-e29b-41d4-a716-446655440017', // Ryan Martinez (intern)
      }
    ];

    for (const testCase of testCases) {
      console.log(`📦 Testing: ${testCase.packageName}@${testCase.version}`);
      console.log(`👤 User: ${testCase.userId}`);

      const decision = await registryPerms.checkPublishPermission(testCase);

      if (decision.allowed) {
        console.log(`✅ ALLOWED: ${decision.reason}`);
      } else {
        console.log(`❌ DENIED: ${decision.reason}`);
        if (decision.suggestedTeams?.length) {
          console.log(`💡 Suggested teams: ${decision.suggestedTeams.join(', ')}`);
        }
      }
      console.log('');
    }

    // Show permission summary
    const summary = registryPerms.getPermissionSummary();
    console.log('📊 Registry Permissions Summary:');
    console.log(`   Teams: ${summary.totalTeams}`);
    console.log(`   Total scopes: ${summary.totalScopes}`);

    console.log('\n🎉 Registry permissions test completed successfully!');

  } catch (error) {
    console.error('❌ Registry permissions test failed:', error);
  } finally {
    db.close();
  }
}

// CLI runner
if (import.meta.main) {
  testRegistryPermissions();
}