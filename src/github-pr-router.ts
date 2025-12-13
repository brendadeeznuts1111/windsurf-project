/**
 * @fileoverview GitHub PR Routing Integration
 * @description GitHub webhook handler for automated PR routing using BunTeamMapper
 * @author Bun Team Integration
 * @version 1.0.0
 * @since 2025
 */

import { Database } from 'bun:sqlite';
import { TeamOrganizationEngine } from '../src/team-organization-engine';
import { RBACEngine } from '../src/rbac/rbac-engine';
import { BunTeamMapper } from '../src/bun-team-mapper';

// GitHub webhook event types
interface GitHubPullRequestEvent {
  action: string;
  number: number;
  pull_request: {
    title: string;
    body?: string;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
    };
    user: {
      login: string;
      id: number;
    };
  };
  repository: {
    name: string;
    owner: {
      login: string;
    };
  };
}

interface GitHubPullRequestFiles {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

class GitHubPRRouter {
  private teamMapper: BunTeamMapper;
  private githubToken?: string;

  constructor(teamMapper: BunTeamMapper) {
    this.teamMapper = teamMapper;
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  /**
   * Handle GitHub pull request webhook
   */
  async handlePullRequestWebhook(event: GitHubPullRequestEvent): Promise<{
    success: boolean;
    routing?: any;
    actions?: string[];
    error?: string;
  }> {
    try {
      console.log(`🔄 Processing PR #${event.number}: ${event.pull_request.title}`);

      // Only process opened PRs
      if (event.action !== 'opened') {
        return { success: true, actions: ['ignored - not an opened PR'] };
      }

      // Get PR files from GitHub API
      const files = await this.getPullRequestFiles(
        event.repository.owner.login,
        event.repository.name,
        event.number
      );

      // Route the PR
      const routing = await this.teamMapper.routePullRequest({
        number: event.number,
        title: event.pull_request.title,
        author: event.pull_request.user.login,
        files: files.map(f => f.filename),
        baseBranch: event.pull_request.base.ref
      });

      // Apply routing decisions
      const actions = await this.applyPRRouting(
        event.repository.owner.login,
        event.repository.name,
        event.number,
        routing
      );

      console.log(`✅ PR #${event.number} routed successfully`);
      console.log(`   Priority: ${routing.priority.toUpperCase()}`);
      console.log(`   Teams: ${routing.teams.join(', ')}`);
      console.log(`   Reviewers: ${routing.reviewers.join(', ')}`);
      console.log(`   Actions: ${actions.join(', ')}`);

      return {
        success: true,
        routing,
        actions
      };

    } catch (error) {
      console.error(`❌ Failed to route PR #${event.number}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get PR files from GitHub API
   */
  private async getPullRequestFiles(owner: string, repo: string, prNumber: number): Promise<GitHubPullRequestFiles[]> {
    if (!this.githubToken) {
      throw new Error('GitHub token not configured');
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      {
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BunTeamMapper/1.0.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch PR files: ${response.status} ${response.statusText}`);
    }

    return await response.json() as GitHubPullRequestFiles[];
  }

  /**
   * Apply PR routing decisions to GitHub
   */
  private async applyPRRouting(
    owner: string,
    repo: string,
    prNumber: number,
    routing: { reviewers: string[]; teams: string[]; priority: string }
  ): Promise<string[]> {
    const actions: string[] = [];

    if (!this.githubToken) {
      console.warn('⚠️ GitHub token not configured - skipping PR updates');
      return ['skipped - no GitHub token'];
    }

    try {
      // Add reviewers
      if (routing.reviewers.length > 0) {
        await this.addReviewers(owner, repo, prNumber, routing.reviewers);
        actions.push(`added ${routing.reviewers.length} reviewers`);
      }

      // Add labels based on priority and teams
      const labels = this.generateLabels(routing);
      if (labels.length > 0) {
        await this.addLabels(owner, repo, prNumber, labels);
        actions.push(`added ${labels.length} labels`);
      }

      // Add comment with routing information
      const comment = this.generateRoutingComment(routing);
      await this.addComment(owner, repo, prNumber, comment);
      actions.push('added routing comment');

      // Send team notifications
      for (const team of routing.teams) {
        await this.teamMapper.sendTeamNotification(
          team,
          `📋 New PR #${prNumber} requires ${team} team review\nPriority: ${routing.priority.toUpperCase()}\nReviewers: ${routing.reviewers.join(', ')}`,
          routing.priority as 'low' | 'medium' | 'high' | 'critical'
        );
      }
      actions.push(`notified ${routing.teams.length} teams`);

    } catch (error) {
      console.error('Error applying PR routing:', error);
      actions.push('partial - some actions failed');
    }

    return actions;
  }

  /**
   * Add reviewers to PR
   */
  private async addReviewers(owner: string, repo: string, prNumber: number, reviewers: string[]): Promise<void> {
    // Convert Bun handles to GitHub usernames (simplified mapping)
    const githubReviewers = reviewers.map(r => r.replace('@', '').toLowerCase());

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/requested_reviewers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BunTeamMapper/1.0.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewers: githubReviewers
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add reviewers: ${response.status} ${error}`);
    }
  }

  /**
   * Add labels to PR
   */
  private async addLabels(owner: string, repo: string, prNumber: number, labels: string[]): Promise<void> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/labels`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BunTeamMapper/1.0.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          labels
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add labels: ${response.status} ${error}`);
    }
  }

  /**
   * Add comment to PR
   */
  private async addComment(owner: string, repo: string, prNumber: number, comment: string): Promise<void> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BunTeamMapper/1.0.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: comment
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add comment: ${response.status} ${error}`);
    }
  }

  /**
   * Generate labels based on routing
   */
  private generateLabels(routing: { teams: string[]; priority: string }): string[] {
    const labels: string[] = [];

    // Priority labels
    switch (routing.priority) {
      case 'critical':
        labels.push('🚨 critical');
        break;
      case 'high':
        labels.push('🔴 high-priority');
        break;
      case 'medium':
        labels.push('🟡 medium-priority');
        break;
      case 'low':
        labels.push('🟢 low-priority');
        break;
    }

    // Team labels
    for (const team of routing.teams) {
      labels.push(`👥 ${team}`);
    }

    return labels;
  }

  /**
   * Generate routing comment
   */
  private generateRoutingComment(routing: { reviewers: string[]; teams: string[]; priority: string }): string {
    const emoji = {
      critical: '🚨',
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    }[routing.priority] || '📋';

    return `## ${emoji} PR Routing Information

**Priority:** ${routing.priority.toUpperCase()}
**Teams:** ${routing.teams.join(', ')}
**Reviewers:** ${routing.reviewers.join(', ')}

This PR has been automatically routed based on:
- File changes and ownership
- Team expertise areas
- Current reviewer capacity

---

*This comment was generated by BunTeamMapper - automated team and PR routing system*`;
  }
}

/**
 * GitHub webhook handler for PR routing
 */
export async function handleGitHubWebhook(request: Request): Promise<Response> {
  try {
    // Initialize components
    const db = new Database('team-organization.db');
    const rbacEngine = new RBACEngine();
    const teamEngine = new TeamOrganizationEngine(db, rbacEngine);
    const teamMapper = new BunTeamMapper(teamEngine, rbacEngine);
    const prRouter = new GitHubPRRouter(teamMapper);

    // Parse webhook payload
    const event = await request.json() as GitHubPullRequestEvent;

    // Verify webhook signature (simplified - add proper verification in production)
    const signature = request.headers.get('x-hub-signature-256');
    if (!signature) {
      return Response.json({ error: 'Missing webhook signature' }, { status: 401 });
    }

    // Handle the PR event
    const result = await prRouter.handlePullRequestWebhook(event);

    return Response.json(result, {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * CLI tool for testing PR routing
 */
export async function testPRRouting() {
  console.log('🧪 Testing GitHub PR Routing...\n');

  // Initialize components
  const db = new Database(':memory:');
  const rbacEngine = new RBACEngine();
  const teamEngine = new TeamOrganizationEngine(db, rbacEngine);
  const teamMapper = new BunTeamMapper(teamEngine, rbacEngine);
  const prRouter = new GitHubPRRouter(teamMapper);

  try {
    // Load team hierarchy
    await teamMapper.loadTeamHierarchy();
    await teamMapper.syncTeamHierarchy();

    // Test PR event
    const testEvent: GitHubPullRequestEvent = {
      action: 'opened',
      number: 123,
      pull_request: {
        title: 'feat: add new dashboard component with enhanced analytics',
        head: {
          ref: 'feature/dashboard-component',
          sha: 'abc123'
        },
        base: {
          ref: 'main'
        },
        user: {
          login: 'developer1',
          id: 12345
        }
      },
      repository: {
        name: 'windsurf-project',
        owner: {
          login: 'company'
        }
      }
    };

    console.log('📋 Test PR:', testEvent.pull_request.title);
    console.log('👤 Author:', testEvent.pull_request.user.login);
    console.log('📁 Files: (simulated frontend component files)\n');

    // Simulate PR files (since we don't have real GitHub API access)
    const mockFiles = [
      'apps/dashboard/src/components/NewAnalyticsComponent.tsx',
      'apps/dashboard/src/components/NewAnalyticsComponent.test.ts',
      'apps/dashboard/src/utils/analytics-helpers.ts',
      'docs/dashboard-components.md'
    ];

    // Route the PR
    const routing = await teamMapper.routePullRequest({
      number: testEvent.number,
      title: testEvent.pull_request.title,
      author: testEvent.pull_request.user.login,
      files: mockFiles,
      baseBranch: testEvent.pull_request.base.ref
    });

    console.log('🎯 PR Routing Result:');
    console.log(`   Priority: ${routing.priority.toUpperCase()}`);
    console.log(`   Teams: ${routing.teams.join(', ')}`);
    console.log(`   Reviewers: ${routing.reviewers.join(', ')}\n`);

    // Simulate applying routing (without actual GitHub API calls)
    const actions = [
      `added ${routing.reviewers.length} reviewers`,
      `added ${routing.teams.length + 1} labels`,
      'added routing comment',
      `notified ${routing.teams.length} teams`
    ];

    console.log('✅ Simulated Actions:');
    actions.forEach(action => console.log(`   ✓ ${action}`));

    console.log('\n🎉 PR routing test completed successfully!');

  } catch (error) {
    console.error('❌ PR routing test failed:', error);
  } finally {
    db.close();
  }
}

// CLI runner
if (import.meta.main) {
  testPRRouting();
}