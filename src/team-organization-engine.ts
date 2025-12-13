/**
 * @fileoverview Team Organization Management API
 * @description Complete team and organizational structure management with Telegram notifications
 * @author Bun Documentation Team
 * @version 1.0.0
 * @since 2025
 */

import { RBACEngine, SystemRole, ResourceType, Permission } from './rbac/rbac-engine';

// ============================================================================
// TEAM ORGANIZATION TYPES
// ============================================================================

export enum TeamRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  LEAD = 'LEAD',
  CONTRIBUTOR = 'CONTRIBUTOR'
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  roleLevel: TeamRole;
  email: string;
  websiteUrl?: string;
  repositoryUrl?: string;
  dashboardUrl?: string;
  telegramChannel?: string; // Changed from slackChannel
  githubMaintainer?: string;
  contactPerson?: string;
  contactEmail?: string;
  memberCount: number;
  serviceCount: number;
  parentTeamId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  roleInTeam: 'LEAD' | 'CONTRIBUTOR' | 'MEMBER';
  joinedAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
  };
}

export interface TeamService {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  serviceUrl?: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
  lastChecked?: string;
  createdAt: string;
}

export interface TeamHierarchy {
  team: Team;
  children: TeamHierarchy[];
  members: TeamMember[];
  services: TeamService[];
}

// ============================================================================
// TEAM ORGANIZATION ENGINE
// ============================================================================

export class TeamOrganizationEngine {
  private db: any;
  private rbacEngine: RBACEngine;
  private telegramBotToken?: string;
  private telegramChatIds: Map<string, string> = new Map();

  constructor(dbConnection: any, rbacEngine: RBACEngine) {
    this.db = dbConnection;
    this.rbacEngine = rbacEngine;
    this.initializeDatabase();
    this.initializeTelegramConfig();
  }

  private initializeDatabase(): void {
    // Create teams table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        role_level TEXT NOT NULL,
        email TEXT NOT NULL,
        website_url TEXT,
        repository_url TEXT,
        dashboard_url TEXT,
        telegram_channel TEXT,
        github_maintainer TEXT,
        contact_person TEXT,
        contact_email TEXT,
        member_count INTEGER DEFAULT 0,
        service_count INTEGER DEFAULT 0,
        parent_team_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_team_id) REFERENCES teams(id)
      )
    `);

    // Create team_members table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role_in_team TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        UNIQUE(team_id, user_id)
      )
    `);

    // Create team_services table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS team_services (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        service_url TEXT,
        health_status TEXT DEFAULT 'UNKNOWN',
        last_checked DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      )
    `);

    // Create indexes for performance
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_teams_parent ON teams(parent_team_id)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_team_services_team ON team_services(team_id)`);
  }

  private initializeTelegramConfig(): void {
    // Initialize Telegram bot configuration
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

    // Map team channels to Telegram chat IDs
    this.telegramChatIds.set('#executive-team', process.env.TELEGRAM_EXECUTIVE_CHAT_ID || '');
    this.telegramChatIds.set('#engineering', process.env.TELEGRAM_ENGINEERING_CHAT_ID || '');
    this.telegramChatIds.set('#core-platform', process.env.TELEGRAM_CORE_PLATFORM_CHAT_ID || '');
    this.telegramChatIds.set('#api-team', process.env.TELEGRAM_API_CHAT_ID || '');
    this.telegramChatIds.set('#monitoring', process.env.TELEGRAM_MONITORING_CHAT_ID || '');
    this.telegramChatIds.set('#product', process.env.TELEGRAM_PRODUCT_CHAT_ID || '');
    this.telegramChatIds.set('#design', process.env.TELEGRAM_DESIGN_CHAT_ID || '');
  }

  // ============================================================================
  // TEAM CRUD OPERATIONS
  // ============================================================================

  async createTeam(teamData: Omit<Team, 'id' | 'memberCount' | 'serviceCount' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const id = `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate team data
    this.validateTeamData(teamData);

    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO teams (
        id, name, description, role_level, email, website_url, repository_url,
        dashboard_url, telegram_channel, github_maintainer, contact_person,
        contact_email, parent_team_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      teamData.name,
      teamData.description,
      teamData.roleLevel,
      teamData.email,
      teamData.websiteUrl,
      teamData.repositoryUrl,
      teamData.dashboardUrl,
      teamData.telegramChannel,
      teamData.githubMaintainer,
      teamData.contactPerson,
      teamData.contactEmail,
      teamData.parentTeamId,
      now,
      now
    );

    // Send Telegram notification
    await this.sendTelegramNotification(teamData.telegramChannel, `🏗️ New team created: ${teamData.name}`);

    const team = await this.getTeam(id);
    if (!team) throw new Error('Failed to create team');

    return team;
  }

  async getTeam(id: string): Promise<Team | null> {
    const row = this.db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      roleLevel: row.role_level as TeamRole,
      email: row.email,
      websiteUrl: row.website_url,
      repositoryUrl: row.repository_url,
      dashboardUrl: row.dashboard_url,
      telegramChannel: row.telegram_channel,
      githubMaintainer: row.github_maintainer,
      contactPerson: row.contact_person,
      contactEmail: row.contact_email,
      memberCount: row.member_count,
      serviceCount: row.service_count,
      parentTeamId: row.parent_team_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async listTeams(filters?: {
    roleLevel?: TeamRole;
    parentId?: string;
    includeMembers?: boolean;
    includeServices?: boolean;
  }): Promise<Team[]> {
    let query = 'SELECT * FROM teams WHERE 1=1';
    const params: any[] = [];

    if (filters?.roleLevel) {
      query += ' AND role_level = ?';
      params.push(filters.roleLevel);
    }

    if (filters?.parentId) {
      query += ' AND parent_team_id = ?';
      params.push(filters.parentId);
    }

    query += ' ORDER BY name';

    const rows = this.db.prepare(query).all(...params);
    const teams: Team[] = [];

    for (const row of rows) {
      const team = await this.getTeam(row.id);
      if (team) {
        if (filters?.includeMembers) {
          // Could add member data here
        }
        if (filters?.includeServices) {
          // Could add service data here
        }
        teams.push(team);
      }
    }

    return teams;
  }

  async updateTeam(id: string, updates: Partial<Omit<Team, 'id' | 'createdAt'>>): Promise<Team> {
    // Validate updates
    if (updates.roleLevel) {
      this.validateRoleLevel(updates.roleLevel);
    }

    const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
    if (fields.length === 0) throw new Error('No valid updates provided');

    const setClause = fields.map(field => `${this.camelToSnake(field)} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof typeof updates]);

    this.db.prepare(`UPDATE teams SET ${setClause}, updated_at = ? WHERE id = ?`)
      .run(...values, new Date().toISOString(), id);

    const team = await this.getTeam(id);
    if (!team) throw new Error('Team not found after update');

    // Send Telegram notification
    await this.sendTelegramNotification(team.telegramChannel, `📝 Team updated: ${team.name}`);

    return team;
  }

  async deleteTeam(id: string): Promise<void> {
    const team = await this.getTeam(id);
    if (!team) throw new Error('Team not found');

    // Check if team has children
    const children = this.db.prepare('SELECT COUNT(*) as count FROM teams WHERE parent_team_id = ?').get(id);
    if (children.count > 0) {
      throw new Error('Cannot delete team with child teams');
    }

    // Remove all members and services first
    this.db.prepare('DELETE FROM team_members WHERE team_id = ?').run(id);
    this.db.prepare('DELETE FROM team_services WHERE team_id = ?').run(id);

    // Delete the team
    this.db.prepare('DELETE FROM teams WHERE id = ?').run(id);

    // Send Telegram notification
    await this.sendTelegramNotification(team.telegramChannel, `🗑️ Team deleted: ${team.name}`);
  }

  // ============================================================================
  // TEAM HIERARCHY OPERATIONS
  // ============================================================================

  async getTeamHierarchy(rootTeamId?: string): Promise<TeamHierarchy[]> {
    const rootTeams = rootTeamId
      ? [await this.getTeam(rootTeamId)].filter((team): team is Team => team !== null)
      : await this.listTeams({ parentId: undefined });

    const hierarchies: TeamHierarchy[] = [];

    for (const team of rootTeams as Team[]) {
      hierarchies.push(await this.buildTeamHierarchy(team));
    }

    return hierarchies;
  }

  private async buildTeamHierarchy(team: Team): Promise<TeamHierarchy> {
    const children = await this.listTeams({ parentId: team.id });
    const members = await this.getTeamMembers(team.id);
    const services = await this.getTeamServices(team.id);

    const childHierarchies: TeamHierarchy[] = [];
    for (const child of children) {
      childHierarchies.push(await this.buildTeamHierarchy(child));
    }

    return {
      team,
      children: childHierarchies,
      members,
      services
    };
  }

  async moveTeam(teamId: string, newParentId?: string): Promise<void> {
    // Validate the move doesn't create cycles
    if (newParentId) {
      const wouldCreateCycle = await this.wouldCreateCycle(teamId, newParentId);
      if (wouldCreateCycle) {
        throw new Error('Cannot move team: would create circular reference');
      }
    }

    this.db.prepare('UPDATE teams SET parent_team_id = ?, updated_at = ? WHERE id = ?')
      .run(newParentId || null, new Date().toISOString(), teamId);

    const team = await this.getTeam(teamId);
    if (team) {
      await this.sendTelegramNotification(team.telegramChannel, `📦 Team moved: ${team.name}`);
    }
  }

  private async wouldCreateCycle(teamId: string, potentialParentId: string): Promise<boolean> {
    let currentId = potentialParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) return true; // Cycle detected
      if (currentId === teamId) return true; // Would create cycle

      visited.add(currentId);
      const parent = this.db.prepare('SELECT parent_team_id FROM teams WHERE id = ?').get(currentId);
      currentId = parent?.parent_team_id;
    }

    return false;
  }

  // ============================================================================
  // TEAM MEMBERSHIP OPERATIONS
  // ============================================================================

  async addTeamMember(teamId: string, userId: string, roleInTeam: 'LEAD' | 'CONTRIBUTOR' | 'MEMBER' = 'MEMBER'): Promise<TeamMember> {
    // Verify team exists
    const team = await this.getTeam(teamId);
    if (!team) throw new Error('Team not found');

    // Check if user is already a member
    const existing = this.db.prepare('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?').get(teamId, userId);
    if (existing) throw new Error('User is already a member of this team');

    const id = `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.db.prepare(`
      INSERT INTO team_members (id, team_id, user_id, role_in_team)
      VALUES (?, ?, ?, ?)
    `).run(id, teamId, userId, roleInTeam);

    // Update member count
    this.updateTeamMemberCount(teamId);

    // Send Telegram notification
    await this.sendTelegramNotification(team.telegramChannel, `👤 New member added to ${team.name}: ${userId}`);

    return await this.getTeamMember(id);
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const team = await this.getTeam(teamId);
    if (!team) throw new Error('Team not found');

    const result = this.db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId);

    if (result.changes > 0) {
      // Update member count
      this.updateTeamMemberCount(teamId);

      // Send Telegram notification
      await this.sendTelegramNotification(team.telegramChannel, `👤 Member removed from ${team.name}: ${userId}`);
    }
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const rows = this.db.prepare(`
      SELECT tm.*, u.username, u.email, u.name
      FROM team_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at
    `).all(teamId);

    return rows.map((row: any) => ({
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id,
      roleInTeam: row.role_in_team,
      joinedAt: row.joined_at,
      user: row.username ? {
        id: row.user_id,
        username: row.username,
        email: row.email,
        name: row.name
      } : undefined
    }));
  }

  async getTeamMember(memberId: string): Promise<TeamMember> {
    const row = this.db.prepare(`
      SELECT tm.*, u.username, u.email, u.name
      FROM team_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.id = ?
    `).get(memberId);

    if (!row) throw new Error('Team member not found');

    return {
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id,
      roleInTeam: row.role_in_team,
      joinedAt: row.joined_at,
      user: row.username ? {
        id: row.user_id,
        username: row.username,
        email: row.email,
        name: row.name
      } : undefined
    };
  }

  // ============================================================================
  // TEAM SERVICES OPERATIONS
  // ============================================================================

  async addTeamService(teamId: string, serviceData: Omit<TeamService, 'id' | 'teamId' | 'createdAt'>): Promise<TeamService> {
    const team = await this.getTeam(teamId);
    if (!team) throw new Error('Team not found');

    const id = `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.db.prepare(`
      INSERT INTO team_services (id, team_id, name, description, service_url, health_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      teamId,
      serviceData.name,
      serviceData.description,
      serviceData.serviceUrl,
      serviceData.healthStatus
    );

    // Update service count
    this.updateTeamServiceCount(teamId);

    // Send Telegram notification
    await this.sendTelegramNotification(team.telegramChannel, `🔧 New service added to ${team.name}: ${serviceData.name}`);

    return await this.getTeamService(id);
  }

  async getTeamServices(teamId: string): Promise<TeamService[]> {
    const rows = this.db.prepare('SELECT * FROM team_services WHERE team_id = ? ORDER BY name').all(teamId);

    return rows.map((row: any) => ({
      id: row.id,
      teamId: row.team_id,
      name: row.name,
      description: row.description,
      serviceUrl: row.service_url,
      healthStatus: row.health_status as 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN',
      lastChecked: row.last_checked,
      createdAt: row.created_at
    }));
  }

  async getTeamService(serviceId: string): Promise<TeamService> {
    const row = this.db.prepare('SELECT * FROM team_services WHERE id = ?').get(serviceId);
    if (!row) throw new Error('Team service not found');

    return {
      id: row.id,
      teamId: row.team_id,
      name: row.name,
      description: row.description,
      serviceUrl: row.service_url,
      healthStatus: row.health_status as 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN',
      lastChecked: row.last_checked,
      createdAt: row.created_at
    };
  }

  async updateServiceHealth(serviceId: string, healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN'): Promise<void> {
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE team_services
      SET health_status = ?, last_checked = ?
      WHERE id = ?
    `).run(healthStatus, now, serviceId);

    // Get service and team info for notification
    const service = await this.getTeamService(serviceId);
    const team = await this.getTeam(service.teamId);

    if (team && healthStatus !== 'HEALTHY') {
      await this.sendTelegramNotification(
        team.telegramChannel,
        `🚨 Service health alert: ${service.name} is ${healthStatus.toLowerCase()}`
      );
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private validateTeamData(teamData: Omit<Team, 'id' | 'memberCount' | 'serviceCount' | 'createdAt' | 'updatedAt'>): void {
    if (!teamData.name?.trim()) throw new Error('Team name is required');
    if (!teamData.email?.trim()) throw new Error('Team email is required');
    if (!Object.values(TeamRole).includes(teamData.roleLevel)) {
      throw new Error('Invalid role level');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(teamData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate Telegram channel format
    if (teamData.telegramChannel && !teamData.telegramChannel.startsWith('@') && !teamData.telegramChannel.startsWith('#')) {
      throw new Error('Telegram channel must start with @ or #');
    }

    // Validate GitHub maintainer format
    if (teamData.githubMaintainer && !teamData.githubMaintainer.startsWith('@')) {
      throw new Error('GitHub maintainer must start with @');
    }
  }

  private validateRoleLevel(roleLevel: TeamRole): void {
    if (!Object.values(TeamRole).includes(roleLevel)) {
      throw new Error('Invalid role level');
    }
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private updateTeamMemberCount(teamId: string): void {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(teamId).count;
    this.db.prepare('UPDATE teams SET member_count = ? WHERE id = ?').run(count, teamId);
  }

  private updateTeamServiceCount(teamId: string): void {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM team_services WHERE team_id = ?').get(teamId).count;
    this.db.prepare('UPDATE teams SET service_count = ? WHERE id = ?').run(count, teamId);
  }

  private async sendTelegramNotification(channel: string | undefined, message: string): Promise<void> {
    if (!channel || !this.telegramBotToken) return;

    const chatId = this.telegramChatIds.get(channel);
    if (!chatId) return;

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        console.warn('Failed to send Telegram notification:', await response.text());
      }
    } catch (error) {
      console.warn('Telegram notification error:', error);
    }
  }

  // ============================================================================
  // INITIALIZATION WITH PROVIDED DATA
  // ============================================================================

  async initializeWithProvidedData(): Promise<void> {
    const teams = [
      {
        name: 'Executive Team',
        roleLevel: TeamRole.ADMIN,
        email: 'executive@company.com',
        telegramChannel: '#executive-team',
        githubMaintainer: '@company/executive-maintainer',
        contactEmail: 'cto@company.com',
        memberCount: 1,
        serviceCount: 0
      },
      {
        name: 'Engineering Team',
        roleLevel: TeamRole.MANAGER,
        email: 'engineering@company.com',
        telegramChannel: '#engineering',
        githubMaintainer: '@company/engineering-maintainer',
        contactEmail: 'vp-engineering@company.com',
        memberCount: 4,
        serviceCount: 0
      },
      {
        name: 'Core Platform Team',
        roleLevel: TeamRole.LEAD,
        email: 'core-platform@company.com',
        telegramChannel: '#core-platform',
        githubMaintainer: '@company/core-platform-maintainer',
        contactEmail: 'staff-engineer@company.com',
        memberCount: 6,
        serviceCount: 2
      },
      {
        name: 'API Team',
        roleLevel: TeamRole.CONTRIBUTOR,
        email: 'api@company.com',
        telegramChannel: '#api-team',
        githubMaintainer: '@company/api-maintainer',
        contactEmail: 'api-lead@company.com',
        memberCount: 3,
        serviceCount: 4
      },
      {
        name: 'Monitoring Team',
        roleLevel: TeamRole.CONTRIBUTOR,
        email: 'monitoring@company.com',
        telegramChannel: '#monitoring',
        githubMaintainer: '@company/monitoring-maintainer',
        contactEmail: 'sre-lead@company.com',
        memberCount: 2,
        serviceCount: 3
      },
      {
        name: 'Product Team',
        roleLevel: TeamRole.MANAGER,
        email: 'product@company.com',
        telegramChannel: '#product',
        githubMaintainer: '@company/product-maintainer',
        contactEmail: 'cpo@company.com',
        memberCount: 0,
        serviceCount: 1
      },
      {
        name: 'Design Team',
        roleLevel: TeamRole.CONTRIBUTOR,
        email: 'design@company.com',
        telegramChannel: '#design',
        githubMaintainer: '@company/design-maintainer',
        contactEmail: 'head-of-design@company.com',
        memberCount: 2,
        serviceCount: 1
      }
    ];

    console.log('🏗️ Initializing team organization with provided data...');

    for (const teamData of teams) {
      try {
        await this.createTeam(teamData);
        console.log(`✅ Created team: ${teamData.name}`);
      } catch (error) {
        console.log(`⚠️ Team already exists or error: ${teamData.name} - ${error}`);
      }
    }

    console.log('🎉 Team organization initialization complete!');
  }
}

// ============================================================================
// API HANDLERS
// ============================================================================

export function createTeamAPIHandlers(teamEngine: TeamOrganizationEngine) {
  return {
    // Team CRUD
    async getTeams(request: Request): Promise<Response> {
      try {
        const url = new URL(request.url);
        const filters = {
          roleLevel: url.searchParams.get('role_level') as TeamRole,
          parentId: url.searchParams.get('parent_id') || undefined,
          includeMembers: url.searchParams.get('include_members') === 'true',
          includeServices: url.searchParams.get('include_services') === 'true'
        };

        const teams = await teamEngine.listTeams(filters);
        return Response.json({
          success: true,
          data: teams,
          count: teams.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    },

    async getTeam(request: Request, match: any): Promise<Response> {
      try {
        const team = await teamEngine.getTeam(match.pathname.groups.id);
        if (!team) {
          return Response.json({
            success: false,
            error: 'Team not found',
            timestamp: new Date().toISOString()
          }, { status: 404 });
        }

        return Response.json({
          success: true,
          data: team,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    },

    async createTeam(request: Request): Promise<Response> {
      try {
        const teamData = await request.json() as Omit<Team, 'id' | 'memberCount' | 'serviceCount' | 'createdAt' | 'updatedAt'>;
        const team = await teamEngine.createTeam(teamData);

        return Response.json({
          success: true,
          data: team,
          message: 'Team created successfully',
          timestamp: new Date().toISOString()
        }, { status: 201 });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    },

    async updateTeam(request: Request, match: any): Promise<Response> {
      try {
        const updates = await request.json() as Partial<Omit<Team, 'id' | 'createdAt'>>;
        const team = await teamEngine.updateTeam(match.pathname.groups.id, updates);

        return Response.json({
          success: true,
          data: team,
          message: 'Team updated successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    },

    async deleteTeam(request: Request, match: any): Promise<Response> {
      try {
        await teamEngine.deleteTeam(match.pathname.groups.id);

        return Response.json({
          success: true,
          message: 'Team deleted successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    },

    // Team Hierarchy
    async getTeamHierarchy(request: Request): Promise<Response> {
      try {
        const url = new URL(request.url);
        const rootTeamId = url.searchParams.get('root_team_id') || undefined;

        const hierarchy = await teamEngine.getTeamHierarchy(rootTeamId);

        return Response.json({
          success: true,
          data: hierarchy,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    },

    // Team Members
    async getTeamMembers(request: Request, match: any): Promise<Response> {
      try {
        const members = await teamEngine.getTeamMembers(match.pathname.groups.id);

        return Response.json({
          success: true,
          data: members,
          count: members.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    },

    async addTeamMember(request: Request, match: any): Promise<Response> {
      try {
        const { userId, roleInTeam } = await request.json() as { userId: string; roleInTeam?: 'LEAD' | 'CONTRIBUTOR' | 'MEMBER' };
        const member = await teamEngine.addTeamMember(match.pathname.groups.id, userId, roleInTeam);

        return Response.json({
          success: true,
          data: member,
          message: 'Team member added successfully',
          timestamp: new Date().toISOString()
        }, { status: 201 });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    },

    async removeTeamMember(request: Request, match: any): Promise<Response> {
      try {
        await teamEngine.removeTeamMember(match.pathname.groups.id, match.pathname.groups.userId);

        return Response.json({
          success: true,
          message: 'Team member removed successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    },

    // Team Services
    async getTeamServices(request: Request, match: any): Promise<Response> {
      try {
        const services = await teamEngine.getTeamServices(match.pathname.groups.id);

        return Response.json({
          success: true,
          data: services,
          count: services.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    },

    async addTeamService(request: Request, match: any): Promise<Response> {
      try {
        const serviceData = await request.json() as Omit<TeamService, 'id' | 'createdAt' | 'teamId'>;
        const service = await teamEngine.addTeamService(match.pathname.groups.id, serviceData);

        return Response.json({
          success: true,
          data: service,
          message: 'Team service added successfully',
          timestamp: new Date().toISOString()
        }, { status: 201 });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    },

    async updateServiceHealth(request: Request, match: any): Promise<Response> {
      try {
        const { healthStatus } = await request.json() as { healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN' };
        await teamEngine.updateServiceHealth(match.pathname.groups.id, healthStatus);

        return Response.json({
          success: true,
          message: 'Service health updated successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }
  };
}

export default TeamOrganizationEngine;