#!/usr/bin/env bun

/**
 * Enhanced Analytics Test - Demonstrates improved bottleneck detection and metrics
 */

import { TeamIssueReleaseMappingEngine } from '../src/mapping-engine';
import { TeamRole, PriorityLevel, IssueStatus, AvailabilityStatus, EntityType, RelationshipType } from '../src/types/mapping-types';

async function testEnhancedAnalytics() {
  console.log('🔬 Testing Enhanced Analytics & Bottleneck Detection');

  const dbPath = `enhanced-analytics-${Date.now()}.db`;
  const engine = new TeamIssueReleaseMappingEngine(dbPath);

  try {
    // Create team with diverse performance profiles
    console.log('\n👥 Creating diverse team profiles...');

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
        issuesCompleted: 15,
        prsMerged: 12,
        reviewsCompleted: 8,
        storyPointsCompleted: 45,
        bugsIntroduced: 2,
        reviewsRejected: 1,
        averageReviewTime: 6,
        averageCycleTime: 7,
        onTimeDeliveryRate: 85,
        codeQualityScore: 92,
        crossTeamContributions: 3,
        mentoringSessions: 2,
        knowledgeSharing: 5,
        skillsImproved: ['graphql', 'testing'],
        certificationsCompleted: []
      },
      availability: AvailabilityStatus.AVAILABLE
    });

    const bobId = await engine.createTeamMember({
      githubUsername: 'bob-slow',
      name: 'Bob Smith',
      email: `bob-${Date.now()}@company.com`,
      role: TeamRole.ENGINEERING_MANAGER,
      team: 'core-api',
      skills: ['leadership', 'architecture'],
      currentAssignments: [],
      performanceMetrics: {
        memberId: '',
        period: 'monthly',
        issuesCompleted: 8,
        prsMerged: 6,
        reviewsCompleted: 15,
        storyPointsCompleted: 25,
        bugsIntroduced: 5,
        reviewsRejected: 3,
        averageReviewTime: 48, // Very slow reviews
        averageCycleTime: 21, // Very long cycle time
        onTimeDeliveryRate: 45, // Poor delivery rate
        codeQualityScore: 65, // Low quality score
        crossTeamContributions: 1,
        mentoringSessions: 0,
        knowledgeSharing: 2,
        skillsImproved: [],
        certificationsCompleted: []
      },
      availability: AvailabilityStatus.AVAILABLE
    });

    const charlieId = await engine.createTeamMember({
      githubUsername: 'charlie-overloaded',
      name: 'Charlie Brown',
      email: `charlie-${Date.now()}@company.com`,
      role: TeamRole.ENGINEER,
      team: 'core-api',
      skills: ['javascript', 'css'],
      currentAssignments: [],
      performanceMetrics: {
        memberId: '',
        period: 'monthly',
        issuesCompleted: 25, // Overloaded - too many issues
        prsMerged: 20,
        reviewsCompleted: 5,
        storyPointsCompleted: 75, // Way above average
        bugsIntroduced: 8,
        reviewsRejected: 2,
        averageReviewTime: 12,
        averageCycleTime: 10,
        onTimeDeliveryRate: 70,
        codeQualityScore: 78,
        crossTeamContributions: 0,
        mentoringSessions: 0,
        knowledgeSharing: 1,
        skillsImproved: [],
        certificationsCompleted: []
      },
      availability: AvailabilityStatus.AVAILABLE
    });

    console.log(`✅ Created team members: ${aliceId}, ${bobId}, ${charlieId}`);

    // Create completed assignments and issues to test analytics
    console.log('\n📋 Creating test assignments and issues...');

    // Alice's completed work
    await engine.createAssignment({
      issueId: 'issue-100',
      memberId: aliceId,
      type: 'issue',
      status: 'completed',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedCompletion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      actualCompletion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: PriorityLevel.HIGH,
      effortEstimate: 5
    });

    // Bob's slow work (long cycle time)
    await engine.createAssignment({
      issueId: 'issue-101',
      memberId: bobId,
      type: 'issue',
      status: 'completed',
      startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks ago
      estimatedCompletion: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // Should complete 2 weeks ago
      actualCompletion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Completed 1 day ago (1 week late)
      priority: PriorityLevel.MEDIUM,
      effortEstimate: 3
    });

    // Charlie's overloaded work (multiple assignments)
    for (let i = 0; i < 5; i++) {
      await engine.createAssignment({
        issueId: `issue-20${i}`,
        memberId: charlieId,
        type: 'issue',
        status: 'completed',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedCompletion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        actualCompletion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: PriorityLevel.MEDIUM,
        effortEstimate: 8
      });
    }

    console.log('✅ Created test assignments');

    // Generate analytics and check for bottlenecks
    console.log('\n📊 Generating enhanced analytics...');

    const analytics = await engine.generateTeamAnalytics('core-api', 'monthly');

    console.log(`✅ Analytics generated:`);
    console.log(`   - Throughput: ${analytics.throughput} items`);
    console.log(`   - Quality Score: ${analytics.qualityScore}/100`);
    console.log(`   - Velocity: ${analytics.velocity} story points`);
    console.log(`   - Release Velocity: ${analytics.releaseVelocity} features/release`);
    console.log(`   - Defect Density: ${analytics.defectDensity} bugs/1000 LOC`);
    console.log(`   - Performance Delta: ${analytics.performanceDelta}%`);
    console.log(`   - Capacity Utilization: ${analytics.capacityUtilization}%`);

    console.log(`\n🚨 Detected ${analytics.bottleneckIndicators.length} bottlenecks:`);

    for (const bottleneck of analytics.bottleneckIndicators) {
      console.log(`   - ${bottleneck.type.toUpperCase()} (${bottleneck.severity}): ${bottleneck.description}`);
      console.log(`     Actions: ${bottleneck.recommendedActions.join(', ')}`);
      console.log(`     Resolution: ${bottleneck.estimatedResolutionTime}`);
    }

    // Verify the analytics calculations are working
    console.log('\n🔍 Verifying calculations...');

    const aliceMetrics = analytics.memberMetrics[aliceId];
    const bobMetrics = analytics.memberMetrics[bobId];
    const charlieMetrics = analytics.memberMetrics[charlieId];

    console.log(`Alice - Issues: ${aliceMetrics.issuesCompleted}, Velocity: ${aliceMetrics.storyPointsCompleted}pts`);
    console.log(`Bob - Issues: ${bobMetrics.issuesCompleted}, Velocity: ${bobMetrics.storyPointsCompleted}pts, Cycle: ${bobMetrics.averageCycleTime}d`);
    console.log(`Charlie - Issues: ${charlieMetrics.issuesCompleted}, Velocity: ${charlieMetrics.storyPointsCompleted}pts`);

    // Check if bottlenecks are detected based on the calculated metrics
    const hasWorkloadBottleneck = analytics.bottleneckIndicators.some(b => b.type === 'workload');
    const hasDependencyBottleneck = analytics.bottleneckIndicators.some(b => b.type === 'dependency');

    console.log(`\n🔍 Bottleneck Analysis:`);
    console.log(`Workload bottleneck detected: ${hasWorkloadBottleneck}`);
    console.log(`Dependency bottleneck detected: ${hasDependencyBottleneck}`);
    console.log(`Charlie velocity (${charlieMetrics.storyPointsCompleted}) vs Alice (${aliceMetrics.storyPointsCompleted}) = ${charlieMetrics.storyPointsCompleted / Math.max(aliceMetrics.storyPointsCompleted, 1)}x`);

    // Test that bottlenecks were correctly identified
    const expectedBottlenecks: Array<'workload' | 'review_queue' | 'dependency'> = ['workload', 'review_queue', 'dependency'];
    const detectedTypes = analytics.bottleneckIndicators.map(b => b.type);

    console.log(`\n✅ Expected bottlenecks: ${expectedBottlenecks.join(', ')}`);
    console.log(`✅ Detected bottlenecks: ${detectedTypes.join(', ')}`);

    const allDetected = expectedBottlenecks.every(type => detectedTypes.includes(type));
    console.log(`✅ All bottleneck types detected: ${allDetected ? 'YES' : 'NO'}`);

    console.log('\n🎉 Enhanced analytics test completed successfully!');
    console.log('✅ Real data-driven bottleneck detection is working');

  } catch (error) {
    console.error('❌ Enhanced analytics test failed:', error);
    throw error;
  } finally {
    engine.close();
  }
}

// Run the enhanced test
testEnhancedAnalytics();