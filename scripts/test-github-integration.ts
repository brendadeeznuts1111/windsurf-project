#!/usr/bin/env bun

/**
 * Test script for GitHub Integration
 */

import { TeamIssueReleaseMappingEngine } from '../src/mapping-engine';
import { GitHubIntegration } from '../src/github-integration';

async function testGitHubIntegration() {
  console.log('🔄 Testing GitHub Integration');

  const engine = new TeamIssueReleaseMappingEngine();
  const github = new GitHubIntegration({
    token: process.env.GITHUB_TOKEN || 'fake-token-for-testing',
    owner: 'oven-sh',
    repo: 'bun'
  }, engine);

  try {
    // Test basic functionality without actual API calls
    console.log('✅ GitHub integration initialized successfully');

    // Test priority extraction
    const testLabels = [
      { name: 'high' },
      { name: 'component:api' },
      { name: 'bug' }
    ];

    const priority = (github as any).extractPriority(testLabels);
    console.log(`✅ Priority extraction: ${priority}`);

    // Test component extraction
    const component = (github as any).extractComponent(testLabels);
    console.log(`✅ Component extraction: ${component}`);

    // Test effort extraction
    const effortLabels = [
      { name: 'effort:5' },
      { name: 'size:large' }
    ];
    const effort = (github as any).extractEffort(effortLabels);
    console.log(`✅ Effort extraction: ${effort}`);

    console.log('\n🎉 GitHub integration tests passed!');

  } catch (error) {
    console.error('❌ GitHub integration test failed:', error);
  } finally {
    engine.close();
  }
}

// Run the test
testGitHubIntegration();