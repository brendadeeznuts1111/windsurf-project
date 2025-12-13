#!/usr/bin/env bun

/**
 * Comprehensive Integration Test for Team-Issue-Release Mapping System with GitHub
 */

import { TeamIssueReleaseMappingEngine } from '../src/mapping-engine';
import { GitHubIntegration } from '../src/github-integration';
import { TeamRole, PriorityLevel, IssueStatus, AvailabilityStatus, EntityType, RelationshipType } from '../src/types/mapping-types';

async function testFullIntegration() {
  console.log('🚀 Testing Full Team-Issue-Release Mapping Integration');

  // Use unique database for this test
  const dbPath = `integration-test-${Date.now()}.db`;
  const engine = new TeamIssueReleaseMappingEngine(dbPath);

  const github = new GitHubIntegration({
    token: process.env.GITHUB_TOKEN || 'fake-token-for-testing',
    owner: 'oven-sh',
    repo: 'bun'
  }, engine);

  try {
    console.log('\n📝 Setting up test data...');

    // Create team members
    const aliceId = await engine.createTeamMember({
      githubUsername: 'alice-dev',
      name: 'Alice Johnson',
      email: `alice-${Date.now()}@company.com`,
      role: TeamRole.SENIOR_ENGINEER,
      team: 'core-api',
      skills: ['typescript', 'react', 'node.js'],
      currentAssignments: [],
      performanceMetrics: {
        memberId: '',
        period: 'monthly',
        issuesCompleted: 0,
        prsMerged: 0,
        reviewsCompleted: 0,
        storyPointsCompleted: 0,
        bugsIntroduced: 0,
        reviewsRejected: 0,
        averageReviewTime: 0,
        averageCycleTime: 0,
        onTimeDeliveryRate: 0,
        codeQualityScore: 0,
        crossTeamContributions: 0,
        mentoringSessions: 0,
        knowledgeSharing: 0,
        skillsImproved: [],
        certificationsCompleted: []
      },
      availability: AvailabilityStatus.AVAILABLE
    });

    const bobId = await engine.createTeamMember({
      githubUsername: 'bob-lead',
      name: 'Bob Smith',
      email: `bob-${Date.now()}@company.com`,
      role: TeamRole.ENGINEERING_MANAGER,
      team: 'core-api',
      skills: ['leadership', 'architecture', 'typescript'],
      currentAssignments: [],
      performanceMetrics: {
        memberId: '',
        period: 'monthly',
        issuesCompleted: 0,
        prsMerged: 0,
        reviewsCompleted: 0,
        storyPointsCompleted: 0,
        bugsIntroduced: 0,
        reviewsRejected: 0,
        averageReviewTime: 0,
        averageCycleTime: 0,
        onTimeDeliveryRate: 0,
        codeQualityScore: 0,
        crossTeamContributions: 0,
        mentoringSessions: 0,
        knowledgeSharing: 0,
        skillsImproved: [],
        certificationsCompleted: []
      },
      availability: AvailabilityStatus.AVAILABLE
    });

    console.log(`✅ Created team members: ${aliceId}, ${bobId}`);

    // Create assignments
    const assignmentId = await engine.createAssignment({
      issueId: 'issue-456',
      memberId: aliceId,
      type: 'issue',
      status: 'in_progress',
      startDate: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      priority: PriorityLevel.HIGH,
      effortEstimate: 8
    });

    console.log(`✅ Created assignment: ${assignmentId}`);

    // Create issues/PRs
    const issueId = await engine.createIssuePR({
      number: 456,
      title: 'Implement user authentication system',
      description: 'Add JWT-based authentication with refresh tokens',
      type: 'issue',
      status: IssueStatus.IN_PROGRESS,
      assigneeIds: [aliceId],
      reviewerIds: [bobId],
      labels: ['feature', 'auth', 'high-priority', 'effort:8'],
      component: 'authentication',
      priority: PriorityLevel.HIGH,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedReleaseIds: [],
      relatedIssueIds: [],
      repository: 'company/api-server',
      estimatedEffort: 8
    });

    const prId = await engine.createIssuePR({
      number: 457,
      title: 'Add authentication middleware',
      description: 'Implement JWT middleware for API routes',
      type: 'pr',
      status: IssueStatus.IN_REVIEW,
      assigneeIds: [aliceId],
      reviewerIds: [bobId],
      labels: ['feature', 'auth', 'middleware'],
      component: 'authentication',
      priority: PriorityLevel.MEDIUM,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedReleaseIds: [],
      relatedIssueIds: [issueId],
      repository: 'company/api-server',
      estimatedEffort: 5
    });

    console.log(`✅ Created issue: ${issueId}, PR: ${prId}`);

    // Create cross-references
    const xref1Id = await engine.createCrossReference({
      fromType: EntityType.ISSUE,
      fromId: issueId,
      toType: EntityType.PR,
      toId: prId,
      relationship: RelationshipType.IMPLEMENTS,
      strength: 1.0,
      createdBy: aliceId,
      createdAt: new Date().toISOString()
    });

    const xref2Id = await engine.createCrossReference({
      fromType: EntityType.TEAM_MEMBER,
      fromId: aliceId,
      toType: EntityType.ISSUE,
      toId: issueId,
      relationship: RelationshipType.ASSIGNED_TO,
      strength: 1.0,
      createdBy: bobId,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Created cross-references: ${xref1Id}, ${xref2Id}`);

    // Create a release
    const releaseId = await engine.createRelease({
      version: 'v1.2.0',
      type: 'minor',
      releaseDate: new Date().toISOString(),
      containedIssueIds: [issueId],
      containedPRIds: [prId],
      contributorIds: [aliceId, bobId],
      breakingChanges: [],
      newFeatures: ['Add JWT authentication system'],
      bugFixes: [],
      performanceMetrics: {
        buildTime: 120,
        bundleSize: 2048000,
        testCoverage: 85,
        performanceScore: 92,
        securityScore: 88,
        compatibilityScore: 95,
        bytesProcessed: 1543200,
        mimeTypeDistribution: {
          'application/javascript': 45,
          'text/css': 12,
          'image/png': 8,
          'application/json': 23
        }
      },
      qualityScore: 87,
      impactAssessment: {
        breakingChanges: 0,
        newFeatures: 1,
        bugFixes: 0,
        affectedUsers: 'some',
        migrationComplexity: 'low',
        rollbackDifficulty: 'easy'
      },
      changelog: '## New Features\n- Add JWT authentication system\n\n## Improvements\n- Enhanced security middleware'
    });

    console.log(`✅ Created release: ${releaseId}`);

    // Generate team analytics
    const analytics = await engine.generateTeamAnalytics('core-api', 'weekly');
    console.log(`✅ Generated analytics: ${analytics.throughput} throughput, ${analytics.qualityScore} quality score`);

    // Test GitHub integration features
    console.log('\n🔄 Testing GitHub integration features...');

    // Test label parsing (simulated)
    const testLabels = [
      { name: 'high' },
      { name: 'component:auth' },
      { name: 'effort:8' },
      { name: 'bug' }
    ];

    const priority = (github as any).extractPriority(testLabels);
    const component = (github as any).extractComponent(testLabels);
    const effort = (github as any).extractEffort(testLabels);

    console.log(`✅ Label parsing: priority=${priority}, component=${component}, effort=${effort}`);

    // Test release parsing (simulated)
    const testChangelog = `
## Breaking Changes
- Removed deprecated API endpoints

## New Features
- Add user authentication (#456)
- Implement JWT middleware (#457)

## Bug Fixes
- Fix login timeout issue (#123)
`;

    const breakingChanges = (github as any).extractBreakingChanges(testChangelog);
    const newFeatures = (github as any).extractNewFeatures(testChangelog);
    const bugFixes = (github as any).extractBugFixes(testChangelog);

    console.log(`✅ Changelog parsing: ${breakingChanges.length} breaking, ${newFeatures.length} features, ${bugFixes.length} fixes`);

    // Query comprehensive data
    console.log('\n🔍 Testing comprehensive queries...');

    const members = await engine.getTeamMembers('core-api');
    console.log(`✅ Retrieved ${members.length} team members`);

    const member = await engine.getTeamMember(aliceId);
    console.log(`✅ Retrieved member with ${member?.currentAssignments.length} assignments`);

    const assignments = await engine.getMemberAssignments(aliceId);
    console.log(`✅ Retrieved ${assignments.length} assignments for Alice`);

    const issue = await engine.getIssuePR(issueId);
    console.log(`✅ Retrieved issue: ${issue?.title}`);

    const xrefs = await engine.getCrossReferences(EntityType.ISSUE, issueId);
    console.log(`✅ Retrieved ${xrefs.length} cross-references for issue`);

    console.log('\n🎉 Full integration test passed!');
    console.log('✅ Team-Issue-Release Mapping System with GitHub Integration is working correctly');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  } finally {
    engine.close();
  }
}

// Run the comprehensive test
testFullIntegration();