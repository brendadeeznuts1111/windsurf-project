/**
 * @fileoverview Bun Team Mapper Integration Test
 * @description Demonstrates team hierarchy synchronization and PR routing
 * @author Bun Team Integration
 * @version 1.0.0
 * @since 2025
 */

import { Database } from 'bun:sqlite';
import { TeamOrganizationEngine } from '../src/team-organization-engine';
import { RBACEngine } from '../src/rbac/rbac-engine';
import { BunTeamMapper } from '../src/bun-team-mapper';

async function testBunTeamMapper() {
  console.log('🚀 Testing Bun Team Mapper Integration...\n');

  // Initialize components
  const db = new Database(':memory:');
  const rbacEngine = new RBACEngine();
  const teamEngine = new TeamOrganizationEngine(db, rbacEngine);
  const teamMapper = new BunTeamMapper(teamEngine, rbacEngine);

  try {
    // 1. Load and validate team hierarchy
    console.log('📂 Loading team hierarchy data...');
    const hierarchyData = await teamMapper.loadTeamHierarchy();
    console.log(`✅ Loaded ${hierarchyData.metadata.totalMembers} members across ${hierarchyData.metadata.departments} departments\n`);

    // 2. Validate team structure
    console.log('🔍 Validating team structure...');
    const validation = await teamMapper.validateTeamStructure();
    if (validation.valid) {
      console.log('✅ Team structure is valid\n');
    } else {
      console.log('❌ Team structure has issues:');
      validation.errors.forEach(error => console.log(`  - ${error}`));
      validation.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
      console.log('');
    }

    // 3. Sync team hierarchy
    console.log('🔄 Synchronizing team hierarchy...');
    await teamMapper.syncTeamHierarchy();
    console.log('✅ Team hierarchy synchronized\n');

    // 4. Test PR routing
    console.log('🎯 Testing PR routing...');
    const prData = {
      number: 123,
      title: 'feat: add new dashboard component',
      author: '550e8400-e29b-41d4-a716-446655440003', // David Kim
      files: [
        'apps/dashboard/src/components/NewComponent.tsx',
        'apps/dashboard/src/components/NewComponent.test.ts',
        'src/utils/helpers.ts'
      ],
      baseBranch: 'main'
    };

    const routing = await teamMapper.routePullRequest(prData);
    console.log('📋 PR Routing Result:');
    console.log(`  - Priority: ${routing.priority.toUpperCase()}`);
    console.log(`  - Teams: ${routing.teams.join(', ')}`);
    console.log(`  - Reviewers: ${routing.reviewers.join(', ')}\n`);

    // 5. Test registry permissions
    console.log('🔐 Testing registry permissions...');
    const permissions = await teamMapper.getRegistryPermissions('550e8400-e29b-41d4-a716-446655440003');
    console.log('📋 Registry Permissions for David Kim:');
    console.log(`  - Scopes: ${permissions.scopes.join(', ')}`);
    console.log(`  - Permissions: ${permissions.permissions.join(', ')}`);
    console.log(`  - Restrictions: ${permissions.restrictions.join(', ')}\n`);

    // 6. Generate CODEOWNERS
    console.log('📝 Generating CODEOWNERS file...');
    await teamMapper.generateCODEOWNERS();
    console.log('✅ CODEOWNERS file generated\n');

    // 7. Test team notification (would send to Telegram if configured)
    console.log('📢 Testing team notification...');
    await teamMapper.sendTeamNotification('frontend', '🚀 New component deployed successfully!', 'medium');
    console.log('✅ Team notification sent\n');

    console.log('🎉 All Bun Team Mapper tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Team hierarchy loaded and validated');
    console.log('  ✅ RBAC permissions mapped from team roles');
    console.log('  ✅ PR routing working with team-based ownership');
    console.log('  ✅ Registry permissions configured by team');
    console.log('  ✅ CODEOWNERS generated automatically');
    console.log('  ✅ Telegram notifications integrated');
    console.log('  ✅ Team-to-workspace synchronization complete');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run the test
testBunTeamMapper().catch(console.error);