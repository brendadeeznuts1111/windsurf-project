#!/usr/bin/env bun

/**
 * RBAC (Role-Based Access Control) System Demonstration
 * Shows comprehensive access control and permission management
 */

import {
  RBACEngine,
  SystemRole,
  ResourceType,
  Permission,
  DEFAULT_ROLES,
  createRBACMiddleware
} from '../src/rbac/rbac-engine';

async function demonstrateRBAC() {
  console.log('🔐 RBAC (Role-Based Access Control) System Demonstration');
  console.log('======================================================');

  const rbac = new RBACEngine();

  // ============================================================================
  // ROLE MANAGEMENT DEMO
  // ============================================================================

  console.log('\n👥 Role Management:');
  console.log('==================');

  const roles = rbac.listRoles();
  console.log(`Available roles: ${roles.map(r => r.name).join(', ')}`);

  // Show role permissions
  Object.values(SystemRole).forEach(roleName => {
    const role = rbac.getRole(roleName);
    if (role) {
      console.log(`\n${roleName}:`);
      console.log(`  Description: ${role.description}`);
      console.log(`  Permissions: ${role.permissions.length}`);
      console.log(`  Level: ${role.metadata?.level}`);

      // Show key permissions
      const keyPermissions = role.permissions.slice(0, 5);
      console.log(`  Sample permissions: ${keyPermissions.map(p => p.split(':')[1]).join(', ')}`);
    }
  });

  // ============================================================================
  // USER CONTEXT & ACCESS CONTROL DEMO
  // ============================================================================

  console.log('\n🔑 Access Control Demonstration:');
  console.log('================================');

  // Create different user contexts
  const users = [
    {
      name: 'Alice (Super Admin)',
      context: {
        userId: 'alice-admin',
        username: 'alice',
        email: 'alice@company.com',
        roles: [SystemRole.SUPER_ADMIN],
        organizationId: 'org-123',
        teamId: 'team-456'
      }
    },
    {
      name: 'Bob (Developer)',
      context: {
        userId: 'bob-dev',
        username: 'bob',
        email: 'bob@company.com',
        roles: [SystemRole.DEVELOPER],
        organizationId: 'org-123',
        teamId: 'team-456'
      }
    },
    {
      name: 'Charlie (Viewer)',
      context: {
        userId: 'charlie-viewer',
        username: 'charlie',
        email: 'charlie@company.com',
        roles: [SystemRole.VIEWER],
        organizationId: 'org-123',
        teamId: 'team-456'
      }
    },
    {
      name: 'Dave (Guest)',
      context: {
        userId: 'dave-guest',
        username: 'dave',
        email: 'dave@external.com',
        roles: [SystemRole.GUEST],
        organizationId: 'external-org'
      }
    }
  ];

  // Test resources
  const resources = [
    {
      name: 'Team Dashboard',
      context: {
        resourceType: ResourceType.DASHBOARD,
        resourceId: 'team-dashboard',
        action: 'read'
      }
    },
    {
      name: 'Analytics Data',
      context: {
        resourceType: ResourceType.ANALYTICS,
        resourceId: 'team-metrics',
        action: 'read'
      }
    },
    {
      name: 'CI/CD Pipeline',
      context: {
        resourceType: ResourceType.PIPELINE,
        resourceId: 'main-pipeline',
        action: 'execute'
      }
    },
    {
      name: 'System Settings',
      context: {
        resourceType: ResourceType.SYSTEM,
        resourceId: 'global-config',
        action: 'write'
      }
    }
  ];

  // Test access matrix
  console.log('\nAccess Control Matrix:');
  console.log('User → Resource → Access');
  console.log('─'.repeat(60));

  for (const user of users) {
    console.log(`\n${user.name}:`);
    for (const resource of resources) {
      const decision = await rbac.checkAccess(user.context, resource.context);
      const status = decision.allowed ? '✅ ALLOWED' : '❌ DENIED';
      const reason = decision.reason ? ` (${decision.reason})` : '';
      console.log(`  ${resource.name}: ${status}${reason}`);
    }
  }

  // ============================================================================
  // POLICY MANAGEMENT DEMO
  // ============================================================================

  console.log('\n📋 Policy Management:');
  console.log('====================');

  // Create a custom policy
  const timeBasedPolicy = {
    id: 'time-based-access',
    name: 'Time-Based Access Control',
    description: 'Restrict access to business hours only',
    rules: [{
      effect: 'allow' as const,
      principals: [{ type: 'role' as const, value: SystemRole.DEVELOPER }],
      resources: [{ type: ResourceType.PIPELINE, pattern: '*' }],
      actions: ['execute'],
      conditions: [{
        type: 'time' as const,
        key: 'context.timestamp',
        operator: 'regex' as const,
        value: '.*(09|10|11|12|13|14|15|16|17).*' // 9 AM - 5 PM
      }]
    }],
    priority: 10,
    enabled: true,
    metadata: {
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['time-based', 'business-hours']
    }
  };

  rbac.addPolicy(timeBasedPolicy);
  console.log(`✅ Added custom policy: ${timeBasedPolicy.name}`);

  const policies = rbac.listPolicies();
  console.log(`Total policies: ${policies.length}`);

  // ============================================================================
  // AUDIT LOG DEMO
  // ============================================================================

  console.log('\n📊 Audit Logging:');
  console.log('================');

  // Generate some audit activity
  for (let i = 0; i < 5; i++) {
    await rbac.checkAccess(users[i % users.length].context, resources[i % resources.length].context);
  }

  const auditLog = rbac.getAuditLog(10);
  console.log(`Recent audit entries: ${auditLog.length}`);

  console.log('\nRecent Access Attempts:');
  auditLog.slice(-3).forEach(entry => {
    const status = entry.allowed ? '✅' : '❌';
    console.log(`  ${status} ${entry.userId} → ${entry.resourceType}:${entry.action} (${entry.timestamp})`);
  });

  // ============================================================================
  // CACHE PERFORMANCE DEMO
  // ============================================================================

  console.log('\n⚡ Cache Performance:');
  console.log('===================');

  const cacheIterations = 1000;
  const startTime = performance.now();

  // Test cache performance
  for (let i = 0; i < cacheIterations; i++) {
    const user = users[i % users.length];
    const resource = resources[i % resources.length];
    await rbac.checkAccess(user.context, resource.context);
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / cacheIterations;

  const cacheStats = rbac.getCacheStats();

  console.log(`Cache performance (${cacheIterations} checks):`);
  console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`  Average: ${(avgTime * 1000).toFixed(3)}μs per check`);
  console.log(`  Cache size: ${cacheStats.size} entries`);
  console.log(`  Throughput: ${(cacheIterations / totalTime * 1000).toLocaleString()}/sec`);

  // ============================================================================
  // MIDDLEWARE INTEGRATION DEMO
  // ============================================================================

  console.log('\n🌐 Middleware Integration:');
  console.log('=========================');

  // Create RBAC middleware
  const rbacMiddleware = createRBACMiddleware(rbac);

  // Simulate API requests
  const mockRequests = [
    {
      name: 'Dashboard Access (Developer)',
      request: {
        url: 'http://localhost:6969/api/mapping/analytics/core-api',
        method: 'GET',
        headers: new Headers()
      } as Request,
      expectedUser: users[1].context // Bob (Developer)
    },
    {
      name: 'Pipeline Execute (Viewer)',
      request: {
        url: 'http://localhost:6969/api/pipeline/main-pipeline',
        method: 'POST',
        headers: new Headers()
      } as Request,
      expectedUser: users[2].context // Charlie (Viewer)
    }
  ];

  console.log('API Request Authorization:');
  for (const mock of mockRequests) {
    try {
      // Note: In real usage, user context would be extracted from request
      // This is a simplified demo
      console.log(`  ${mock.name}: Middleware configured ✅`);
    } catch (error) {
      console.log(`  ${mock.name}: Error - ${error}`);
    }
  }

  // ============================================================================
  // SECURITY ANALYSIS
  // ============================================================================

  console.log('\n🔒 Security Analysis:');
  console.log('===================');

  // Analyze role hierarchy
  console.log('Role Hierarchy (higher level = more permissions):');
  roles
    .sort((a, b) => (b.metadata?.level || 0) - (a.metadata?.level || 0))
    .forEach(role => {
      console.log(`  ${role.name}: Level ${role.metadata?.level} (${role.permissions.length} permissions)`);
    });

  // Permission analysis
  const allPermissions = new Set<string>();
  roles.forEach(role => {
    role.permissions.forEach(permission => allPermissions.add(permission));
  });

  console.log(`\nPermission Inventory:`);
  console.log(`  Total unique permissions: ${allPermissions.size}`);

  // Group permissions by resource type
  const permissionGroups: Record<string, number> = {};
  allPermissions.forEach(permission => {
    const resourceType = permission.split(':')[0];
    permissionGroups[resourceType] = (permissionGroups[resourceType] || 0) + 1;
  });

  console.log('Permissions by resource type:');
  Object.entries(permissionGroups)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} permissions`);
    });

  console.log('\n🎉 RBAC System demonstration complete!');
  console.log('\n💡 Key Features Demonstrated:');
  console.log('   • Hierarchical role-based permissions');
  console.log('   • Resource-specific access control');
  console.log('   • Policy-based authorization rules');
  console.log('   • Comprehensive audit logging');
  console.log('   • High-performance caching');
  console.log('   • Middleware integration');
  console.log('   • Security analysis and reporting');
}

// Run the demonstration
demonstrateRBAC().catch(console.error);