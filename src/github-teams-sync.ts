/**
 * @fileoverview GitHub Teams Synchronization
 * @description Automated GitHub team creation and management based on team hierarchy
 * @author Bun Team Integration
 * @version 1.0.0
 * @since 2025
 */

import { BunTeamMapper } from './bun-team-mapper';

interface GitHubTeam {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  name: string;
  slug: string;
  description: string;
  privacy: 'closed' | 'secret';
  permission: 'pull' | 'push' | 'admin' | 'maintain' | 'triage';
  members_url: string;
  repositories_url: string;
  parent?: {
    id: number;
    node_id: string;
    url: string;
    html_url: string;
    name: string;
  };
}

interface GitHubTeamMembership {
  role: 'member' | 'maintainer';
  state: 'active' | 'pending';
}

export class GitHubTeamsSync {
  private teamMapper: BunTeamMapper;
  private githubToken?: string;
  private orgName?: string;

  constructor(teamMapper: BunTeamMapper) {
    this.teamMapper = teamMapper;
    this.githubToken = process.env.GITHUB_TOKEN;
    this.orgName = process.env.GITHUB_ORG || 'company';
  }

  /**
   * Synchronize all teams from hierarchy to GitHub
   */
  async syncAllTeams(): Promise<{
    success: boolean;
    created: number;
    updated: number;
    errors: string[];
  }> {
    const result = {
      success: true,
      created: 0,
      updated: 0,
      errors: [] as string[]
    };

    try {
      console.log('🔄 Starting GitHub teams synchronization...');

      // Load team hierarchy
      await this.teamMapper.loadTeamHierarchy();

      // Get existing GitHub teams
      const existingTeams = await this.getExistingTeams();
      console.log(`📋 Found ${existingTeams.length} existing GitHub teams`);

      // Sync teams from hierarchy
      const hierarchyData = this.teamMapper.getHierarchyData();
      if (!hierarchyData) {
        throw new Error('Team hierarchy not loaded');
      }

      // Sync cross-functional teams
      for (const [teamKey, teamConfig] of Object.entries(hierarchyData.teams)) {
        try {
          const teamName = this.formatTeamName(teamKey);
          const existingTeam = existingTeams.find(t => t.name === teamName);

          if (existingTeam) {
            // Update existing team
            await this.updateTeam(existingTeam.id, teamConfig);
            result.updated++;
            console.log(`📝 Updated team: ${teamName}`);
          } else {
            // Create new team
            await this.createTeam(teamKey, teamConfig);
            result.created++;
            console.log(`🏗️ Created team: ${teamName}`);
          }

          // Sync team members
          await this.syncTeamMembers(teamKey, teamConfig);

        } catch (error) {
          const errorMsg = `Failed to sync team ${teamKey}: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      console.log(`✅ GitHub teams synchronization complete: ${result.created} created, ${result.updated} updated`);

    } catch (error) {
      result.success = false;
      result.errors.push(`Synchronization failed: ${error}`);
      console.error('❌ GitHub teams sync failed:', error);
    }

    return result;
  }

  /**
   * Get all existing GitHub teams in the organization
   */
  private async getExistingTeams(): Promise<GitHubTeam[]> {
    if (!this.githubToken || !this.orgName) {
      throw new Error('GitHub token and organization name required');
    }

    const response = await fetch(`https://api.github.com/orgs/${this.orgName}/teams`, {
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BunTeamMapper/1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
    }

    return await response.json() as GitHubTeam[];
  }

  /**
   * Create a new GitHub team
   */
  private async createTeam(teamKey: string, teamConfig: any): Promise<GitHubTeam> {
    if (!this.githubToken || !this.orgName) {
      throw new Error('GitHub token and organization name required');
    }

    const teamName = this.formatTeamName(teamKey);
    const description = this.generateTeamDescription(teamKey, teamConfig);

    const response = await fetch(`https://api.github.com/orgs/${this.orgName}/teams`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BunTeamMapper/1.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: teamName,
        description,
        privacy: 'closed',
        permission: this.getTeamPermission(teamKey),
        parent_team_id: await this.getParentTeamId(teamKey)
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create team: ${response.status} ${error}`);
    }

    const newTeam = await response.json() as GitHubTeam;

    // Add repositories to the team
    await this.addTeamRepositories(newTeam.id, teamConfig.registry_scope);

    return newTeam;
  }

  /**
   * Update an existing GitHub team
   */
  private async updateTeam(teamId: number, teamConfig: any): Promise<void> {
    if (!this.githubToken || !this.orgName) {
      throw new Error('GitHub token and organization name required');
    }

    const teamName = this.formatTeamName(teamConfig.name || 'unknown');
    const description = this.generateTeamDescription(teamConfig.name || 'unknown', teamConfig);

    const response = await fetch(`https://api.github.com/teams/${teamId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BunTeamMapper/1.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: teamName,
        description,
        permission: this.getTeamPermission(teamConfig.name || 'unknown')
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update team: ${response.status} ${error}`);
    }
  }

  /**
   * Sync team members
   */
  private async syncTeamMembers(teamKey: string, teamConfig: any): Promise<void> {
    const teamMembers = this.teamMapper.getMembersByTeam(teamKey);
    const teamName = this.formatTeamName(teamKey);

    // Get existing team
    const existingTeams = await this.getExistingTeams();
    const githubTeam = existingTeams.find(t => t.name === teamName);

    if (!githubTeam) {
      throw new Error(`GitHub team ${teamName} not found`);
    }

    // Get current team members
    const currentMembers = await this.getTeamMembers(githubTeam.id);
    const currentMemberIds = currentMembers.map(m => m.id);

    // Add new members
    for (const member of teamMembers) {
      if (!currentMemberIds.includes(member.id)) {
        try {
          await this.addTeamMember(githubTeam.id, member, teamConfig.maintainer);
          console.log(`👤 Added ${member.name} to ${teamName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to add ${member.name} to ${teamName}: ${error}`);
        }
      }
    }

    // Remove members not in hierarchy (optional - commented out for safety)
    // for (const currentMember of currentMembers) {
    //   const stillMember = teamMembers.some(m => m.id === currentMember.id);
    //   if (!stillMember) {
    //     await this.removeTeamMember(githubTeam.id, currentMember.username);
    //   }
    // }
  }

  /**
   * Get team members from GitHub
   */
  private async getTeamMembers(teamId: number): Promise<any[]> {
    if (!this.githubToken) {
      throw new Error('GitHub token required');
    }

    const response = await fetch(`https://api.github.com/teams/${teamId}/members`, {
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BunTeamMapper/1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.status} ${response.statusText}`);
    }

    return await response.json() as any[];
  }

  /**
   * Add member to GitHub team
   */
  private async addTeamMember(teamId: number, member: any, maintainerId?: string): Promise<void> {
    if (!this.githubToken) {
      throw new Error('GitHub token required');
    }

    // Convert member ID to GitHub username (simplified mapping)
    const githubUsername = member.name.toLowerCase().replace(' ', '');

    const response = await fetch(`https://api.github.com/teams/${teamId}/memberships/${githubUsername}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BunTeamMapper/1.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: member.id === maintainerId ? 'maintainer' : 'member'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add team member: ${response.status} ${error}`);
    }
  }

  /**
   * Add repositories to team
   */
  private async addTeamRepositories(teamId: number, registryScope: string): Promise<void> {
    if (!this.githubToken || !this.orgName) {
      throw new Error('GitHub token and organization name required');
    }

    // Map registry scope to repository names
    const repositories = this.mapRegistryScopeToRepos(registryScope);

    for (const repo of repositories) {
      try {
        const response = await fetch(`https://api.github.com/teams/${teamId}/repos/${this.orgName}/${repo}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'BunTeamMapper/1.0.0',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            permission: 'push'
          })
        });

        if (!response.ok) {
          console.warn(`⚠️ Failed to add repo ${repo} to team: ${response.status}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error adding repo ${repo} to team: ${error}`);
      }
    }
  }

  // Helper methods

  private formatTeamName(teamKey: string): string {
    return teamKey.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private generateTeamDescription(teamKey: string, teamConfig: any): string {
    const specs = teamConfig.specs || [];
    const tags = teamConfig.tags || [];
    return `${this.formatTeamName(teamKey)} team. Specs: ${specs.join(', ')}. Tags: ${tags.join(', ')}. Auto-managed by BunTeamMapper.`;
  }

  private getTeamPermission(teamKey: string): 'pull' | 'push' | 'admin' | 'maintain' | 'triage' {
    // Different permissions based on team type
    if (teamKey.includes('core') || teamKey.includes('platform')) {
      return 'maintain';
    } else if (teamKey.includes('frontend') || teamKey.includes('api')) {
      return 'push';
    } else {
      return 'pull';
    }
  }

  private async getParentTeamId(teamKey: string): Promise<number | undefined> {
    // For hierarchical teams, find parent team ID
    // This is simplified - in practice you'd need to map hierarchy properly
    return undefined;
  }

  private getTeamMaintainer(teamKey: string): string {
    const hierarchyData = this.teamMapper.getHierarchyData();
    if (!hierarchyData) return '';

    const teamConfig = hierarchyData.teams[teamKey];
    return teamConfig?.maintainer || '';
  }

  private mapRegistryScopeToRepos(registryScope: string): string[] {
    // Map Bun registry scopes to GitHub repositories
    const scopeMappings: Record<string, string[]> = {
      '@core/*': ['odds-core', 'odds-temporal', 'odds-validation'],
      '@features/*': ['odds-arbitrage', 'odds-websocket'],
      '@testing/*': ['odds-ml', 'odds-temporal'],
      '@benchmarks/*': ['benchmarks', 'performance-tests'],
      '@internal/*': ['internal-tools', 'documentation']
    };

    return scopeMappings[registryScope] || [];
  }
}

/**
 * CLI tool for GitHub teams synchronization
 */
export async function syncGitHubTeams(): Promise<void> {
  console.log('🔄 GitHub Teams Synchronization Tool');
  console.log('=====================================\n');

  // Initialize components
  const { Database } = require('bun:sqlite');
  const db = new Database(':memory:');
  const { RBACEngine } = require('./rbac/rbac-engine');
  const { TeamOrganizationEngine } = require('./team-organization-engine');

  const rbacEngine = new RBACEngine();
  const teamEngine = new TeamOrganizationEngine(db, rbacEngine);
  const teamMapper = new BunTeamMapper(teamEngine, rbacEngine);
  const githubSync = new GitHubTeamsSync(teamMapper);

  try {
    // Load and sync team hierarchy
    await teamMapper.loadTeamHierarchy();
    await teamMapper.syncTeamHierarchy();

    // Sync GitHub teams
    console.log('🔄 Synchronizing with GitHub...');
    const result = await githubSync.syncAllTeams();

    if (result.success) {
      console.log('\n✅ GitHub teams synchronization completed!');
      console.log(`   Created: ${result.created} teams`);
      console.log(`   Updated: ${result.updated} teams`);

      if (result.errors.length > 0) {
        console.log('\n⚠️ Warnings:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      console.error('\n❌ Synchronization failed!');
      result.errors.forEach(error => console.log(`   - ${error}`));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ GitHub teams sync failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// CLI runner
if (import.meta.main) {
  syncGitHubTeams();
}