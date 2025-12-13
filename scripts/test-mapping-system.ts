#!/usr/bin/env bun

/**
 * Test script for Team-Issue-Release Mapping System
 */

import { TeamIssueReleaseMappingEngine } from '../src/mapping-engine';
import { TeamRole, PriorityLevel, IssueStatus, AvailabilityStatus, EntityType, RelationshipType } from '../src/types/mapping-types';

async function testMappingSystem() {
  console.log('🧪 Testing Team-Issue-Release Mapping System');

  // Use a unique database for each test run
  const dbPath = `test-mapping-${Date.now()}.db`;
  const engine = new TeamIssueReleaseMappingEngine(dbPath);

  try {
    // Test 1: Create team members
    console.log('\n📝 Creating team members...');

    const member1Id = await engine.createTeamMember({
      githubUsername: 'alice-dev',
      name: 'Alice Johnson',
      email: 'alice@company.com',
      role: TeamRole.SENIOR_ENGINEER,
      team: 'core-api',
      skills: ['typescript', 'node.js', 'postgresql'],
      currentAssignments: [],
      performanceMetrics: {
        memberId: '', // Will be set by engine
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

    const member2Id = await engine.createTeamMember({
      githubUsername: 'bob-lead',
      name: 'Bob Smith',
      email: 'bob@company.com',
      role: TeamRole.ENGINEERING_MANAGER,
      team: 'core-api',
      skills: ['leadership', 'architecture', 'typescript'],
      currentAssignments: [],
      performanceMetrics: {
        memberId: '', // Will be set by engine
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

    console.log(`✅ Created members: ${member1Id}, ${member2Id}`);

    // Test 2: Create assignments
    console.log('\n📋 Creating assignments...');

    const assignmentId = await engine.createAssignment({
      issueId: 'issue-123',
      memberId: member1Id,
      type: 'issue',
      status: 'in_progress',
      startDate: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: PriorityLevel.HIGH,
      effortEstimate: 5
    });

    console.log(`✅ Created assignment: ${assignmentId}`);

    // Test 3: Create issues/PRs
    console.log('\n🐛 Creating issues and PRs...');

    const issueId = await engine.createIssuePR({
      number: 123,
      title: 'Fix authentication bug in API',
      description: 'Users cannot log in with valid credentials',
      type: 'issue',
      status: IssueStatus.IN_PROGRESS,
      assigneeIds: [member1Id],
      reviewerIds: [member2Id],
      labels: ['bug', 'auth', 'high-priority'],
      component: 'authentication',
      priority: PriorityLevel.HIGH,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedReleaseIds: [],
      relatedIssueIds: [],
      repository: 'company/api-server',
      estimatedEffort: 3
    });

    const prId = await engine.createIssuePR({
      number: 124,
      title: 'Add authentication middleware',
      description: 'Implement JWT authentication middleware',
      type: 'pr',
      status: IssueStatus.IN_REVIEW,
      assigneeIds: [member1Id],
      reviewerIds: [member2Id],
      labels: ['feature', 'auth', 'middleware'],
      component: 'authentication',
      priority: PriorityLevel.MEDIUM,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedReleaseIds: [],
      relatedIssueIds: [],
      repository: 'company/api-server',
      estimatedEffort: 8
    });

    console.log(`✅ Created issue: ${issueId}, PR: ${prId}`);

    // Test 4: Create cross-references
    console.log('\n🔗 Creating cross-references...');

    const xref1Id = await engine.createCrossReference({
      fromType: EntityType.ISSUE,
      fromId: issueId,
      toType: EntityType.PR,
      toId: prId,
      relationship: RelationshipType.FIXES,
      strength: 1.0,
      createdBy: member1Id,
      createdAt: new Date().toISOString()
    });

    const xref2Id = await engine.createCrossReference({
      fromType: EntityType.TEAM_MEMBER,
      fromId: member1Id,
      toType: EntityType.ISSUE,
      toId: issueId,
      relationship: RelationshipType.ASSIGNED_TO,
      strength: 1.0,
      createdBy: member2Id,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Created cross-references: ${xref1Id}, ${xref2Id}`);

    // Test 5: Generate team analytics
    console.log('\n📊 Generating team analytics...');

    const analytics = await engine.generateTeamAnalytics('core-api', 'weekly');
    console.log(`✅ Generated analytics for team ${analytics.teamId}`);
    console.log(`   - Throughput: ${analytics.throughput} items`);
    console.log(`   - Quality Score: ${analytics.qualityScore}/100`);
    console.log(`   - Velocity: ${analytics.velocity} story points`);

    // Test 6: Query operations
    console.log('\n🔍 Testing queries...');

    const member = await engine.getTeamMember(member1Id);
    console.log(`✅ Retrieved member: ${member?.name}`);

    const assignments = await engine.getMemberAssignments(member1Id);
    console.log(`✅ Retrieved ${assignments.length} assignments`);

    const issue = await engine.getIssuePR(issueId);
    console.log(`✅ Retrieved issue: ${issue?.title}`);

    const xrefs = await engine.getCrossReferences(EntityType.ISSUE, issueId);
    console.log(`✅ Retrieved ${xrefs.length} cross-references`);

    console.log('\n🎉 All mapping system tests passed!');

  } catch (error) {
    console.error('❌ Mapping system test failed:', error);
  } finally {
    engine.close();
  }
}

// Run the test
testMappingSystem();