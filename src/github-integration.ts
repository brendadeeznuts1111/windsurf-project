/**
 * @fileoverview GitHub Integration for Team-Issue-Release Mapping System
 * @description Synchronizes GitHub issues, PRs, and releases with the mapping engine
 * @author Bun Documentation Team
 * @version 1.0.0
 * @since 2025
 */

import { TeamIssueReleaseMappingEngine } from './mapping-engine';
import { IssueStatus, EntityType, RelationshipType, PriorityLevel } from './types/mapping-types';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseUrl?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  assignee?: {
    login: string;
    id: number;
  };
  assignees: Array<{
    login: string;
    id: number;
  }>;
  labels: Array<{
    name: string;
    color: string;
  }>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  milestone?: {
    title: string;
    number: number;
  };
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
}

export interface GitHubPR extends GitHubIssue {
  merged: boolean;
  merge_commit_sha?: string;
  merged_at?: string;
  requested_reviewers: Array<{
    login: string;
    id: number;
  }>;
  reviews: Array<{
    id: number;
    user: {
      login: string;
      id: number;
    };
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
    submitted_at: string;
  }>;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body?: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at?: string;
  author: {
    login: string;
    id: number;
  };
}

export class GitHubIntegration {
  private config: GitHubConfig;
  private engine: TeamIssueReleaseMappingEngine;
  private baseUrl: string;

  constructor(config: GitHubConfig, engine: TeamIssueReleaseMappingEngine) {
    this.config = config;
    this.engine = engine;
    this.baseUrl = config.baseUrl || 'https://api.github.com';
  }

  /**
   * Sync all GitHub data for a repository
   */
  async syncRepository(): Promise<void> {
    console.log(`🔄 Syncing GitHub repository: ${this.config.owner}/${this.config.repo}`);

    try {
      // Sync issues and PRs
      await this.syncIssuesAndPRs();

      // Sync releases
      await this.syncReleases();

      // Create cross-references
      await this.createGitHubCrossReferences();

      console.log('✅ GitHub sync completed successfully');
    } catch (error) {
      console.error('❌ GitHub sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync issues and pull requests
   */
  private async syncIssuesAndPRs(): Promise<void> {
    const issues = await this.fetchIssuesAndPRs();

    for (const issue of issues) {
      await this.syncIssuePR(issue);
    }
  }

  /**
   * Sync releases
   */
  private async syncReleases(): Promise<void> {
    const releases = await this.fetchReleases();

    for (const release of releases) {
      await this.syncRelease(release);
    }
  }

  /**
   * Fetch all issues and PRs from GitHub
   */
  private async fetchIssuesAndPRs(): Promise<GitHubIssue[]> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues?state=all&per_page=100`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Bun-Documentation-Team/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GitHubIssue[];
    return data;
  }

  /**
   * Fetch releases from GitHub
   */
  private async fetchReleases(): Promise<GitHubRelease[]> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/releases?per_page=100`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Bun-Documentation-Team/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GitHubRelease[];
    return data;
  }

  /**
   * Sync a single issue or PR
   */
  private async syncIssuePR(githubIssue: GitHubIssue): Promise<void> {
    const isPR = !!githubIssue.pull_request;
    const type = isPR ? 'pr' : 'issue';
    const id = `${type}-${this.config.owner}-${this.config.repo}-${githubIssue.number}`;

    // Check if already exists
    const existing = await this.engine.getIssuePR(id);
    if (existing) {
      // Update if needed
      if (existing.updatedAt !== githubIssue.updated_at) {
        await this.updateIssuePR(id, githubIssue);
      }
      return;
    }

    // Create new issue/PR
    const status = this.mapGitHubStateToStatus(githubIssue.state, isPR ? await this.getPRDetails(githubIssue.number) : null);

    await this.engine.createIssuePR({
      number: githubIssue.number,
      title: githubIssue.title,
      description: githubIssue.body || '',
      type: type as 'issue' | 'pr',
      status,
      assigneeIds: githubIssue.assignees.map(a => a.login),
      reviewerIds: isPR ? await this.getPRReviewers(githubIssue.number) : [],
      labels: githubIssue.labels.map(l => l.name),
      component: this.extractComponent(githubIssue.labels),
      priority: this.extractPriority(githubIssue.labels),
      createdAt: githubIssue.created_at,
      updatedAt: githubIssue.updated_at,
      closedAt: githubIssue.closed_at,
      linkedReleaseIds: [],
      relatedIssueIds: [],
      estimatedEffort: this.extractEffort(githubIssue.labels),
      repository: `${this.config.owner}/${this.config.repo}`,
      milestone: githubIssue.milestone?.title
    });
  }

  /**
   * Update an existing issue/PR
   */
  private async updateIssuePR(id: string, githubIssue: GitHubIssue): Promise<void> {
    // For now, we'll recreate - in a full implementation, we'd have update methods
    // This is a simplified approach
    console.log(`🔄 Updating ${id}`);
  }

  /**
   * Sync a GitHub release
   */
  private async syncRelease(githubRelease: GitHubRelease): Promise<void> {
    const id = `release-${this.config.owner}-${this.config.repo}-${githubRelease.tag_name}`;

    // Check if already exists
    // For now, we'll create if not exists - in full implementation, check database

    await this.engine.createRelease({
      version: githubRelease.tag_name,
      type: this.determineReleaseType(githubRelease.tag_name),
      releaseDate: githubRelease.published_at || githubRelease.created_at,
      containedIssueIds: await this.extractIssuesFromRelease(githubRelease.body || ''),
      containedPRIds: await this.extractPRsFromRelease(githubRelease.body || ''),
      contributorIds: [githubRelease.author.login],
      breakingChanges: this.extractBreakingChanges(githubRelease.body || ''),
      newFeatures: this.extractNewFeatures(githubRelease.body || ''),
      bugFixes: this.extractBugFixes(githubRelease.body || ''),
      performanceMetrics: {
        buildTime: 0, // Would need to get from CI/CD
        bundleSize: 0,
        testCoverage: 0,
        performanceScore: 0,
        securityScore: 0,
        compatibilityScore: 0,
        bytesProcessed: 0,
        mimeTypeDistribution: {}
      },
      qualityScore: 85, // Default score
      impactAssessment: {
        breakingChanges: this.extractBreakingChanges(githubRelease.body || '').length,
        newFeatures: this.extractNewFeatures(githubRelease.body || '').length,
        bugFixes: this.extractBugFixes(githubRelease.body || '').length,
        affectedUsers: 'some',
        migrationComplexity: 'low',
        rollbackDifficulty: 'easy'
      },
      changelog: githubRelease.body || ''
    });
  }

  /**
   * Create cross-references between GitHub entities
   */
  private async createGitHubCrossReferences(): Promise<void> {
    // This would analyze the GitHub data to create relationships
    // For example, linking PRs that close issues, etc.
    console.log('🔗 Creating GitHub cross-references...');
  }

  /**
   * Get detailed PR information including reviews
   */
  private async getPRDetails(number: number): Promise<GitHubPR | null> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls/${number}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Bun-Documentation-Team/1.0'
      }
    });

    if (!response.ok) return null;
    return await response.json() as GitHubPR;
  }

  /**
   * Get PR reviewers
   */
  private async getPRReviewers(number: number): Promise<string[]> {
    const pr = await this.getPRDetails(number);
    if (!pr) return [];

    return pr.requested_reviewers.map(r => r.login);
  }

  /**
   * Map GitHub state to our status enum
   */
  private mapGitHubStateToStatus(state: string, prDetails?: GitHubPR | null): IssueStatus {
    if (state === 'closed') {
      if (prDetails?.merged) return IssueStatus.MERGED;
      return IssueStatus.CLOSED;
    }

    if (prDetails?.reviews?.some(r => r.state === 'CHANGES_REQUESTED')) {
      return IssueStatus.IN_REVIEW;
    }

    return IssueStatus.OPEN;
  }

  /**
   * Extract component from labels
   */
  private extractComponent(labels: Array<{ name: string }>): string {
    const componentLabels = labels.filter(l =>
      l.name.startsWith('component:') ||
      l.name.startsWith('area:')
    );

    return componentLabels.length > 0
      ? componentLabels[0].name.split(':')[1]
      : 'unknown';
  }

  /**
   * Extract priority from labels
   */
  private extractPriority(labels: Array<{ name: string }>): PriorityLevel {
    const priorityLabels = labels.filter(l =>
      ['critical', 'high', 'medium', 'low', 'backlog'].includes(l.name.toLowerCase())
    );

    const priorityMap: Record<string, PriorityLevel> = {
      'critical': PriorityLevel.CRITICAL,
      'high': PriorityLevel.HIGH,
      'medium': PriorityLevel.MEDIUM,
      'low': PriorityLevel.LOW,
      'backlog': PriorityLevel.BACKLOG
    };

    const priority = priorityLabels.length > 0
      ? priorityLabels[0].name.toLowerCase()
      : 'medium';

    return priorityMap[priority] || PriorityLevel.MEDIUM;
  }

  /**
   * Extract effort estimate from labels
   */
  private extractEffort(labels: Array<{ name: string }>): number {
    const effortLabels = labels.filter(l =>
      l.name.startsWith('effort:') ||
      l.name.startsWith('size:')
    );

    if (effortLabels.length === 0) return 0;

    const effort = effortLabels[0].name.split(':')[1];
    const num = parseInt(effort);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Determine release type from version
   */
  private determineReleaseType(version: string): 'major' | 'minor' | 'patch' {
    if (version.includes('breaking') || version.startsWith('v2.') || version.startsWith('v3.')) {
      return 'major';
    }
    if (version.startsWith('v1.') && version.split('.')[2] === '0') {
      return 'minor';
    }
    return 'patch';
  }

  /**
   * Extract issue IDs from release body
   */
  private async extractIssuesFromRelease(body: string): Promise<string[]> {
    const issueRegex = /#(\d+)/g;
    const matches = body.match(issueRegex) || [];
    return matches.map(match => `issue-${this.config.owner}-${this.config.repo}-${match.substring(1)}`);
  }

  /**
   * Extract PR IDs from release body
   */
  private async extractPRsFromRelease(body: string): Promise<string[]> {
    const prRegex = /#(\d+)/g; // Same regex for now
    const matches = body.match(prRegex) || [];
    return matches.map(match => `pr-${this.config.owner}-${this.config.repo}-${match.substring(1)}`);
  }

  /**
   * Extract breaking changes from release body
   */
  private extractBreakingChanges(body: string): string[] {
    const breakingSection = body.match(/###?\s*Breaking Changes?\n([\s\S]*?)(?=###|\n\n|$)/i);
    if (!breakingSection) return [];

    return breakingSection[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.startsWith('*'))
      .map(line => line.substring(1).trim());
  }

  /**
   * Extract new features from release body
   */
  private extractNewFeatures(body: string): string[] {
    const featuresSection = body.match(/###?\s*(New Features?|Features?|Enhancements?)\n([\s\S]*?)(?=###|\n\n|$)/i);
    if (!featuresSection) return [];

    return featuresSection[2]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.startsWith('*'))
      .map(line => line.substring(1).trim());
  }

  /**
   * Extract bug fixes from release body
   */
  private extractBugFixes(body: string): string[] {
    const fixesSection = body.match(/###?\s*(Bug Fixes?|Fixes?)\n([\s\S]*?)(?=###|\n\n|$)/i);
    if (!fixesSection) return [];

    return fixesSection[2]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.startsWith('*'))
      .map(line => line.substring(1).trim());
  }
}