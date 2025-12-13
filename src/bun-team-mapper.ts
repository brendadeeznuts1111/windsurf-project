/**
 * @fileoverview Bun Team Mapper - Team Hierarchy to Bun PM Workspace Integration
 * @description Maps real team hierarchy to Bun ecosystem with automated RBAC, PR routing, and CODEOWNERS generation
 * @author Bun Team Integration
 * @version 1.0.0
 * @since 2025
 */

import { Database } from 'bun:sqlite';
import { TeamOrganizationEngine, Team, TeamRole, TeamMember } from './team-organization-engine';
import { RBACEngine, SystemRole, ResourceType, Permission } from './rbac/rbac-engine';

// ============================================================================
// TEAM HIERARCHY DATA TYPES
// ============================================================================

export interface TeamHierarchyData {
  metadata: {
    version: string;
    lastUpdated: string;
    totalMembers: number;
    departments: number;
    tiers: number;
    crossFunctionalTeams: number;
    source: string;
    pr: string;
    status: string;
  };
  executive: {
    tier: string;
    members: TeamMemberData[];
    workspace_packages: string[];
    telegram_channel: string;
  };
  leadership: {
    tier: string;
    engineering: TeamMemberData[];
    non_engineering: TeamMemberData[];
  };
  senior: {
    tier: string;
    engineering: TeamMemberData[];
  };
  midlevel: {
    tier: string;
    engineering: TeamMemberData[];
  };
  associate: {
    tier: string;
    engineering: TeamMemberData[];
  };
  teams: Record<string, TeamConfig>;
}

export interface TeamMemberData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'lead' | 'senior' | 'member' | 'intern';
  department: string;
  tier: string;
  title?: string;
  directs?: string[];
  bun_pm_scope: string;
  rbac_permissions: string[];
  telegram_channel: string;
  status: 'active' | 'busy' | 'away';
  timezone: string;
  review_capacity: number;
  tags: string[];
}

export interface TeamConfig {
  members: string[];
  channel: string;
  registry_scope: string;
  specs: string[];
  maintainer: string;
  tags: string[];
}

// ============================================================================
// BUN TEAM MAPPER
// ============================================================================

export class BunTeamMapper {
  private teamEngine: TeamOrganizationEngine;
  private rbacEngine: RBACEngine;
  private hierarchyData: TeamHierarchyData | null = null;
  private telegramBotToken?: string;
  private githubToken?: string;

  constructor(teamEngine: TeamOrganizationEngine, rbacEngine: RBACEngine) {
    this.teamEngine = teamEngine;
    this.rbacEngine = rbacEngine;
    this.initializeConfig();
  }

  private initializeConfig(): void {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  // ============================================================================
  // TEAM HIERARCHY LOADING & PARSING
  // ============================================================================

  async loadTeamHierarchy(): Promise<TeamHierarchyData> {
    try {
      const file = Bun.file('test/fixtures/team-hierarchy.json');
      const data = await file.json() as TeamHierarchyData;
      this.hierarchyData = data;
      console.log(`✅ Loaded team hierarchy: ${data.metadata.totalMembers} members, ${data.metadata.departments} departments`);
      return data;
    } catch (error) {
      throw new Error(`Failed to load team hierarchy: ${error}`);
    }
  }

  private getAllMembers(): TeamMemberData[] {
    if (!this.hierarchyData) throw new Error('Team hierarchy not loaded');

    const allMembers: TeamMemberData[] = [];

    // Executive
    allMembers.push(...this.hierarchyData.executive.members);

    // Leadership
    allMembers.push(...this.hierarchyData.leadership.engineering);
    allMembers.push(...this.hierarchyData.leadership.non_engineering);

    // Senior
    allMembers.push(...this.hierarchyData.senior.engineering);

    // Mid-level
    allMembers.push(...this.hierarchyData.midlevel.engineering);

    // Associate
    allMembers.push(...this.hierarchyData.associate.engineering);

    return allMembers;
  }

  // ============================================================================
  // TEAM ROLE TO RBAC MAPPING
  // ============================================================================

  private mapRoleToTeamRole(memberRole: string): TeamRole {
    switch (memberRole) {
      case 'admin': return TeamRole.ADMIN;
      case 'lead': return TeamRole.MANAGER;
      case 'senior': return TeamRole.LEAD;
      case 'member': return TeamRole.CONTRIBUTOR;
      case 'intern': return TeamRole.CONTRIBUTOR;
      default: return TeamRole.CONTRIBUTOR;
    }
  }

  private mapPermissionsToRBAC(member: TeamMemberData): { role: SystemRole; permissions: Permission[] } {
    const permissions: Permission[] = [];

    // Map RBAC permissions from member data
    for (const perm of member.rbac_permissions) {
      switch (perm) {
        case 'publish:all':
          permissions.push(Permission.SYSTEM_ADMIN);
          break;
        case 'merge:all':
          permissions.push(Permission.PIPELINE_ADMIN);
          break;
        case 'override:security':
          permissions.push(Permission.SYSTEM_ADMIN);
          break;
        case 'override:performance':
          permissions.push(Permission.SYSTEM_ADMIN);
          break;
        case 'publish:core':
          permissions.push(Permission.PIPELINE_WRITE);
          break;
        case 'publish:features':
          permissions.push(Permission.PIPELINE_WRITE);
          break;
        case 'merge:team-prs':
          permissions.push(Permission.PIPELINE_EXECUTE);
          break;
        case 'approve:benchmarks':
          permissions.push(Permission.ANALYTICS_ADMIN);
          break;
        case 'publish:frontend':
          permissions.push(Permission.PIPELINE_WRITE);
          break;
        case 'publish:backend':
          permissions.push(Permission.PIPELINE_WRITE);
          break;
        case 'publish:testing-tools':
          permissions.push(Permission.PIPELINE_WRITE);
          break;
        case 'merge:test-prs':
          permissions.push(Permission.PIPELINE_EXECUTE);
          break;
        case 'approve:test-plans':
          permissions.push(Permission.ANALYTICS_ADMIN);
          break;
        case 'publish:internal':
          permissions.push(Permission.PIPELINE_WRITE);
          break;
        case 'approve:budget-reports':
          permissions.push(Permission.ORG_ADMIN);
          break;
        case 'install:core':
          permissions.push(Permission.PIPELINE_READ);
          break;
        case 'install:features':
          permissions.push(Permission.PIPELINE_READ);
          break;
        case 'run:benchmarks':
          permissions.push(Permission.ANALYTICS_READ);
          break;
        case 'install:testing':
          permissions.push(Permission.PIPELINE_READ);
          break;
        case 'run:security-scans':
          permissions.push(Permission.SYSTEM_READ);
          break;
        case 'run:ci':
          permissions.push(Permission.PIPELINE_EXECUTE);
          break;
        case 'install:internal':
          permissions.push(Permission.PIPELINE_READ);
          break;
        case 'install:public-only':
          permissions.push(Permission.PIPELINE_READ);
          break;
      }
    }

    // Determine system role based on permissions and role
    let systemRole = SystemRole.GUEST;
    if (member.role === 'admin') {
      systemRole = SystemRole.SUPER_ADMIN;
    } else if (member.role === 'lead') {
      systemRole = SystemRole.TEAM_ADMIN;
    } else if (member.role === 'senior') {
      systemRole = SystemRole.DEVELOPER;
    } else if (member.role === 'member') {
      systemRole = SystemRole.DEVELOPER;
    } else if (member.role === 'intern') {
      systemRole = SystemRole.VIEWER;
    }

    return { role: systemRole, permissions };
  }

  // ============================================================================
  // TEAM SYNCHRONIZATION
  // ============================================================================

  async syncTeamHierarchy(): Promise<void> {
    if (!this.hierarchyData) {
      await this.loadTeamHierarchy();
    }

    console.log('🔄 Starting team hierarchy synchronization...');

    // Create/update teams from hierarchy
    await this.syncTeams();

    // Create/update team members
    await this.syncTeamMembers();

    // Sync RBAC permissions
    await this.syncRBACPermissions();

    // Generate CODEOWNERS
    await this.generateCODEOWNERS();

    console.log('✅ Team hierarchy synchronization complete');
  }

  private async syncTeams(): Promise<void> {
    if (!this.hierarchyData) return;

    // Create executive team
    await this.createOrUpdateTeam({
      name: 'Executive Team',
      roleLevel: TeamRole.ADMIN,
      email: 'executive@company.com',
      telegramChannel: this.hierarchyData.executive.telegram_channel,
      githubMaintainer: '@company/executive-maintainer',
      contactEmail: 'cto@company.com',
      memberCount: this.hierarchyData.executive.members.length,
      serviceCount: 0
    });

    // Create engineering leadership team
    await this.createOrUpdateTeam({
      name: 'Engineering Leadership',
      roleLevel: TeamRole.MANAGER,
      email: 'engineering-leads@company.com',
      telegramChannel: '@engineering-leads',
      githubMaintainer: '@company/engineering-leads',
      contactEmail: 'vp-engineering@company.com',
      memberCount: this.hierarchyData.leadership.engineering.length,
      serviceCount: 0
    });

    // Create cross-functional teams from teams config
    for (const [teamKey, teamConfig] of Object.entries(this.hierarchyData.teams)) {
      const teamName = teamKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      await this.createOrUpdateTeam({
        name: teamName,
        roleLevel: TeamRole.LEAD,
        email: `${teamKey}@company.com`,
        telegramChannel: teamConfig.channel,
        githubMaintainer: `@company/${teamKey}-maintainer`,
        contactEmail: `${teamKey}-lead@company.com`,
        memberCount: teamConfig.members.length,
        serviceCount: 0
      });
    }
  }

  private async createOrUpdateTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      // Try to find existing team
      const existingTeams = await this.teamEngine.listTeams({ roleLevel: teamData.roleLevel });
      const existingTeam = existingTeams.find(t => t.name === teamData.name);

      if (existingTeam) {
        await this.teamEngine.updateTeam(existingTeam.id, teamData);
        console.log(`📝 Updated team: ${teamData.name}`);
      } else {
        await this.teamEngine.createTeam(teamData);
        console.log(`🏗️ Created team: ${teamData.name}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error syncing team ${teamData.name}: ${error}`);
    }
  }

  private async syncTeamMembers(): Promise<void> {
    const allMembers = this.getAllMembers();

    for (const member of allMembers) {
      try {
        // Find appropriate team for member
        const teamName = this.getTeamNameForMember(member);
        const teams = await this.teamEngine.listTeams();
        const team = teams.find(t => t.name === teamName);

        if (team) {
          // Add member to team (this will handle duplicates)
          await this.teamEngine.addTeamMember(
            team.id,
            member.id,
            member.role === 'lead' ? 'LEAD' : member.role === 'senior' ? 'CONTRIBUTOR' : 'MEMBER'
          );
          console.log(`👤 Added member ${member.name} to ${teamName}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error adding member ${member.name}: ${error}`);
      }
    }
  }

  private getTeamNameForMember(member: TeamMemberData): string {
    if (member.tier === 'tier1') return 'Executive Team';
    if (member.tier === 'tier2' && member.department === 'Engineering') return 'Engineering Leadership';

    // Map to cross-functional teams
    for (const [teamKey, teamConfig] of Object.entries(this.hierarchyData!.teams)) {
      if (teamConfig.members.includes(member.id)) {
        return teamKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    return 'Engineering Team'; // Default fallback
  }

  private async syncRBACPermissions(): Promise<void> {
    const allMembers = this.getAllMembers();

    for (const member of allMembers) {
      const { role } = this.mapPermissionsToRBAC(member);

      try {
        // Assign RBAC role
        this.rbacEngine.assignRole(member.id, role);

        console.log(`🔐 Synced RBAC for ${member.name}: ${role}`);
      } catch (error) {
        console.warn(`⚠️ Error syncing RBAC for ${member.name}: ${error}`);
      }
    }
  }

  // ============================================================================
  // CODEOWNERS GENERATION
  // ============================================================================

  async generateCODEOWNERS(): Promise<void> {
    if (!this.hierarchyData) return;

    const codeowners: string[] = [
      '# This file is auto-generated by BunTeamMapper',
      '# DO NOT EDIT MANUALLY',
      '',
      '# Global owners (executive team)',
      '* @company/executive-maintainer',
      '',
      '# Core infrastructure',
      '/src/core/ @company/core-platform-maintainer',
      '/packages/odds-core/ @company/core-platform-maintainer',
      '',
      '# Frontend components',
      '/apps/dashboard/ @company/frontend-maintainer',
      '/packages/odds-websocket/ @company/frontend-maintainer',
      '',
      '# Testing and QA',
      '/tests/ @company/qa-maintainer',
      '/packages/odds-validation/ @company/qa-maintainer',
      '',
      '# Performance and benchmarks',
      '/benchmarks/ @company/core-platform-maintainer @company/qa-maintainer',
      '/performance/ @company/core-platform-maintainer',
      '',
      '# Documentation',
      '/docs/ @company/product-maintainer',
      '/README.md @company/product-maintainer',
      '',
      '# CI/CD and deployment',
      '/.github/ @company/core-platform-maintainer',
      '/scripts/deploy/ @company/core-platform-maintainer',
      '/nginx/ @company/core-platform-maintainer',
      '',
      '# Team-specific ownership'
    ];

    // Add team-specific ownership from teams config
    for (const [teamKey, teamConfig] of Object.entries(this.hierarchyData.teams)) {
      const maintainer = teamConfig.maintainer;
      const memberData = this.getAllMembers().find(m => m.id === maintainer);
      if (memberData && memberData.name) {
        const maintainerHandle = `@${memberData.name.toLowerCase().replace(' ', '')}`;
        codeowners.push(`/${teamKey}/ ${maintainerHandle}`);
      }
    }

    // Write CODEOWNERS file
    const content = codeowners.join('\n');
    await Bun.write('.github/CODEOWNERS', content);

    console.log('📝 Generated CODEOWNERS file with team-based ownership');
  }

  // ============================================================================
  // PR ROUTING SYSTEM
  // ============================================================================

  async routePullRequest(prData: {
    number: number;
    title: string;
    author: string;
    files: string[];
    baseBranch: string;
  }): Promise<{
    reviewers: string[];
    teams: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  }> {
    if (!this.hierarchyData) await this.loadTeamHierarchy();

    const reviewers: string[] = [];
    const teams: string[] = [];
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Determine affected teams based on file paths
    for (const file of prData.files) {
      if (file.startsWith('src/core/') || file.startsWith('packages/odds-core/')) {
        teams.push('core_api');
        priority = 'high';
      } else if (file.startsWith('apps/dashboard/') || file.includes('frontend')) {
        teams.push('frontend');
        priority = 'medium';
      } else if (file.startsWith('tests/') || file.includes('test')) {
        teams.push('quality_assurance');
        priority = 'medium';
      } else if (file.startsWith('benchmarks/') || file.includes('performance')) {
        teams.push('performance');
        priority = 'high';
      } else if (file.startsWith('.github/') || file.startsWith('scripts/deploy/')) {
        teams.push('core_api');
        priority = 'critical';
      }
    }

    // Get reviewers from affected teams
    for (const teamKey of teams) {
      const teamConfig = this.hierarchyData!.teams[teamKey];
      if (teamConfig) {
        // Add maintainer first
        const maintainer = this.getAllMembers().find(m => m.id === teamConfig.maintainer);
        if (maintainer && maintainer.review_capacity > 0) {
          reviewers.push(`@${maintainer.name.toLowerCase().replace(' ', '')}`);
        }

        // Add other team members with review capacity
        for (const memberId of teamConfig.members) {
          const member = this.getAllMembers().find(m => m.id === memberId);
          if (member && member.review_capacity > 0 && member.id !== teamConfig.maintainer) {
            reviewers.push(`@${member.name.toLowerCase().replace(' ', '')}`);
          }
        }
      }
    }

    // Remove duplicates and limit reviewers
    const uniqueReviewers = [...new Set(reviewers)].slice(0, 3);

    return {
      reviewers: uniqueReviewers,
      teams,
      priority
    };
  }

  // ============================================================================
  // TELEGRAM INTEGRATION
  // ============================================================================

  async sendTeamNotification(teamKey: string, message: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    if (!this.hierarchyData || !this.telegramBotToken) return;

    const teamConfig = this.hierarchyData.teams[teamKey];
    if (!teamConfig) return;

    const chatId = this.getTelegramChatId(teamConfig.channel);
    if (!chatId) return;

    const emoji = priority === 'critical' ? '🚨' : priority === 'high' ? '⚠️' : priority === 'medium' ? '📢' : 'ℹ️';
    const fullMessage = `${emoji} ${message}`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: fullMessage,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        console.warn(`Failed to send Telegram notification to ${teamConfig.channel}`);
      }
    } catch (error) {
      console.warn('Telegram notification error:', error);
    }
  }

  private getTelegramChatId(channel: string): string | undefined {
    // Map channels to chat IDs (would be configured in environment)
    const channelMap: Record<string, string | undefined> = {
      '@executive-ops': process.env.TELEGRAM_EXECUTIVE_CHAT_ID,
      '@engineering-leads': process.env.TELEGRAM_ENGINEERING_LEADS_CHAT_ID,
      '@core-api-team': process.env.TELEGRAM_CORE_API_CHAT_ID,
      '@frontend-team': process.env.TELEGRAM_FRONTEND_CHAT_ID,
      '@qa-team': process.env.TELEGRAM_QA_CHAT_ID,
      '@perf-team': process.env.TELEGRAM_PERF_CHAT_ID,
    };

    return channelMap[channel];
  }

  // ============================================================================
  // REGISTRY PERMISSIONS
  // ============================================================================

  async getRegistryPermissions(userId: string): Promise<{
    scopes: string[];
    permissions: string[];
    restrictions: string[];
  }> {
    const member = this.getAllMembers().find(m => m.id === userId);
    if (!member) {
      return { scopes: [], permissions: [], restrictions: ['public-only'] };
    }

    const scopes: string[] = [];
    const permissions: string[] = [];
    const restrictions: string[] = [];

    // Parse bun_pm_scope
    if (member.bun_pm_scope.includes('*')) {
      scopes.push(member.bun_pm_scope);
    } else {
      scopes.push(...member.bun_pm_scope.split(',').map(s => s.trim()));
    }

    // Map RBAC permissions to registry permissions
    for (const perm of member.rbac_permissions) {
      if (perm.startsWith('publish:')) {
        permissions.push(`publish:${perm.split(':')[1]}`);
      } else if (perm.startsWith('install:')) {
        permissions.push(`install:${perm.split(':')[1]}`);
      }
    }

    // Add restrictions based on role
    if (member.role === 'intern') {
      restrictions.push('no-publish', 'supervised-only');
    } else if (member.role === 'member') {
      restrictions.push('team-approval-required');
    }

    return { scopes, permissions, restrictions };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getHierarchyData(): TeamHierarchyData | null {
    return this.hierarchyData;
  }

  getMemberById(id: string): TeamMemberData | undefined {
    return this.getAllMembers().find(m => m.id === id);
  }

  getMembersByTeam(teamKey: string): TeamMemberData[] {
    if (!this.hierarchyData) return [];

    const teamConfig = this.hierarchyData.teams[teamKey];
    if (!teamConfig) return [];

    return teamConfig.members.map(id => this.getMemberById(id)).filter((m): m is TeamMemberData => m !== undefined);
  }

  async validateTeamStructure(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.hierarchyData) {
      errors.push('Team hierarchy data not loaded');
      return { valid: false, errors, warnings };
    }

    const allMembers = this.getAllMembers();
    const memberIds = new Set(allMembers.map(m => m.id));

    // Check for duplicate IDs
    if (memberIds.size !== allMembers.length) {
      errors.push('Duplicate member IDs found');
    }

    // Check team references
    for (const [teamKey, teamConfig] of Object.entries(this.hierarchyData.teams)) {
      for (const memberId of teamConfig.members) {
        if (!memberIds.has(memberId)) {
          errors.push(`Team ${teamKey} references unknown member ${memberId}`);
        }
      }

      if (!memberIds.has(teamConfig.maintainer)) {
        errors.push(`Team ${teamKey} has unknown maintainer ${teamConfig.maintainer}`);
      }
    }

    // Check reporting structure
    for (const member of allMembers) {
      if (member.directs) {
        for (const directId of member.directs) {
          if (!memberIds.has(directId)) {
            warnings.push(`Member ${member.name} directs unknown member ${directId}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default BunTeamMapper;