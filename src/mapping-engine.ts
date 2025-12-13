/**
 * @fileoverview Team-Issue-Release Mapping Engine
 * @description Core engine for managing team member, issue, and release mappings
 * @author Bun Documentation Team
 * @version 1.0.0
 * @since 2025
 */

import { Database } from 'bun:sqlite';
import {
  TeamMember,
  Assignment,
  IssuePR,
  ReleaseMapping,
  CrossReference,
  TeamMetrics,
  MemberMetrics,
  Bottleneck,
  TeamRole,
  PriorityLevel,
  IssueStatus,
  EntityType,
  RelationshipType,
  AvailabilityStatus
} from './types/mapping-types';

export class TeamIssueReleaseMappingEngine {
  private db: Database;

  constructor(dbPath: string = 'team-mapping.db') {
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    this.db.exec(`
      -- Team members table
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        github_username TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT NOT NULL,
        team TEXT NOT NULL,
        skills TEXT, -- JSON array
        availability TEXT DEFAULT 'available',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Assignments table
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        issue_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'assigned',
        start_date TEXT NOT NULL,
        estimated_completion TEXT,
        actual_completion TEXT,
        priority TEXT DEFAULT 'medium',
        effort_estimate INTEGER DEFAULT 0,
        effort_actual INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES team_members(id)
      );

      -- Issues/PRs table
      CREATE TABLE IF NOT EXISTS issues_prs (
        id TEXT PRIMARY KEY,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL, -- 'issue' or 'pr'
        status TEXT DEFAULT 'open',
        assignee_ids TEXT, -- JSON array
        reviewer_ids TEXT, -- JSON array
        labels TEXT, -- JSON array
        component TEXT,
        priority TEXT DEFAULT 'medium',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        closed_at TEXT,
        linked_release_ids TEXT, -- JSON array
        related_issue_ids TEXT, -- JSON array
        estimated_effort INTEGER DEFAULT 0,
        actual_effort INTEGER,
        repository TEXT NOT NULL,
        milestone TEXT
      );

      -- Releases table
      CREATE TABLE IF NOT EXISTS releases (
        id TEXT PRIMARY KEY,
        version TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        release_date TEXT NOT NULL,
        contained_issue_ids TEXT, -- JSON array
        contained_pr_ids TEXT, -- JSON array
        contributor_ids TEXT, -- JSON array
        breaking_changes TEXT, -- JSON array
        new_features TEXT, -- JSON array
        bug_fixes TEXT, -- JSON array
        performance_metrics TEXT, -- JSON
        quality_score REAL DEFAULT 0,
        impact_assessment TEXT, -- JSON
        changelog TEXT
      );

      -- Cross-references table
      CREATE TABLE IF NOT EXISTS cross_references (
        id TEXT PRIMARY KEY,
        from_type TEXT NOT NULL,
        from_id TEXT NOT NULL,
        to_type TEXT NOT NULL,
        to_id TEXT NOT NULL,
        relationship TEXT NOT NULL,
        strength REAL DEFAULT 1.0,
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT -- JSON
      );

      -- Team metrics table
      CREATE TABLE IF NOT EXISTS team_metrics (
        id TEXT PRIMARY KEY,
        period TEXT NOT NULL,
        team_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        member_metrics TEXT, -- JSON
        throughput INTEGER DEFAULT 0,
        cycle_time REAL DEFAULT 0,
        quality_score REAL DEFAULT 0,
        velocity INTEGER DEFAULT 0,
        release_velocity REAL DEFAULT 0,
        defect_density REAL DEFAULT 0,
        performance_delta REAL DEFAULT 0,
        forecasted_completion TEXT, -- JSON
        bottleneck_indicators TEXT, -- JSON
        capacity_utilization REAL DEFAULT 0,
        generated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Member metrics table
      CREATE TABLE IF NOT EXISTS member_metrics (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        period TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        issues_completed INTEGER DEFAULT 0,
        prs_merged INTEGER DEFAULT 0,
        reviews_completed INTEGER DEFAULT 0,
        story_points_completed INTEGER DEFAULT 0,
        bugs_introduced INTEGER DEFAULT 0,
        reviews_rejected INTEGER DEFAULT 0,
        average_review_time REAL DEFAULT 0,
        average_cycle_time REAL DEFAULT 0,
        on_time_delivery_rate REAL DEFAULT 0,
        code_quality_score REAL DEFAULT 0,
        cross_team_contributions INTEGER DEFAULT 0,
        mentoring_sessions INTEGER DEFAULT 0,
        knowledge_sharing INTEGER DEFAULT 0,
        skills_improved TEXT, -- JSON array
        certifications_completed TEXT, -- JSON array
        generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES team_members(id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_assignments_member ON assignments(member_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_issue ON assignments(issue_id);
      CREATE INDEX IF NOT EXISTS idx_issues_prs_status ON issues_prs(status);
      CREATE INDEX IF NOT EXISTS idx_issues_prs_assignees ON issues_prs(assignee_ids);
      CREATE INDEX IF NOT EXISTS idx_releases_version ON releases(version);
      CREATE INDEX IF NOT EXISTS idx_cross_refs_from ON cross_references(from_type, from_id);
      CREATE INDEX IF NOT EXISTS idx_cross_refs_to ON cross_references(to_type, to_id);
      CREATE INDEX IF NOT EXISTS idx_team_metrics_period ON team_metrics(period, team_id);
      CREATE INDEX IF NOT EXISTS idx_member_metrics_member ON member_metrics(member_id, period);
    `);
  }

  // Team Member Management
  async createTeamMember(member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.db.prepare(`
      INSERT INTO team_members (id, github_username, name, email, role, team, skills, availability)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      member.githubUsername,
      member.name,
      member.email,
      member.role,
      member.team,
      JSON.stringify(member.skills),
      member.availability
    );

    return id;
  }

  async getTeamMember(id: string): Promise<TeamMember | null> {
    const row = this.db.prepare('SELECT * FROM team_members WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      githubUsername: row.github_username,
      name: row.name,
      email: row.email,
      role: row.role as TeamRole,
      team: row.team,
      skills: JSON.parse(row.skills || '[]'),
      currentAssignments: await this.getMemberAssignments(row.id),
      performanceMetrics: await this.getLatestMemberMetrics(row.id) || this.createDefaultMemberMetrics(row.id),
      availability: row.availability as AvailabilityStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.email) { fields.push('email = ?'); values.push(updates.email); }
    if (updates.role) { fields.push('role = ?'); values.push(updates.role); }
    if (updates.team) { fields.push('team = ?'); values.push(updates.team); }
    if (updates.skills) { fields.push('skills = ?'); values.push(JSON.stringify(updates.skills)); }
    if (updates.availability) { fields.push('availability = ?'); values.push(updates.availability); }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());

      this.db.prepare(`
        UPDATE team_members SET ${fields.join(', ')} WHERE id = ?
      `).run(...values, id);
    }
  }

  async getTeamMembers(team?: string): Promise<TeamMember[]> {
    const query = team
      ? 'SELECT id FROM team_members WHERE team = ?'
      : 'SELECT id FROM team_members';

    const rows = team
      ? this.db.prepare(query).all(team) as { id: string }[]
      : this.db.prepare(query).all() as { id: string }[];

    const members: TeamMember[] = [];
    for (const row of rows) {
      const member = await this.getTeamMember(row.id);
      if (member) members.push(member);
    }

    return members;
  }

  // Assignment Management
  async createAssignment(assignment: Omit<Assignment, 'id'>): Promise<string> {
    const id = `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.db.prepare(`
      INSERT INTO assignments (
        id, issue_id, member_id, type, status, start_date,
        estimated_completion, actual_completion, priority, effort_estimate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      assignment.issueId,
      assignment.memberId,
      assignment.type,
      assignment.status,
      assignment.startDate,
      assignment.estimatedCompletion,
      assignment.actualCompletion || null,
      assignment.priority,
      assignment.effortEstimate
    );

    return id;
  }

  async getMemberAssignments(memberId: string): Promise<Assignment[]> {
    const rows = this.db.prepare('SELECT * FROM assignments WHERE member_id = ?').all(memberId) as any[];

    return rows.map(row => ({
      id: row.id,
      issueId: row.issue_id,
      memberId: row.member_id,
      type: row.type,
      status: row.status,
      startDate: row.start_date,
      estimatedCompletion: row.estimated_completion,
      actualCompletion: row.actual_completion,
      priority: row.priority as PriorityLevel,
      effortEstimate: row.effort_estimate,
      effortActual: row.effort_actual
    }));
  }

  // Issue/PR Management
  async createIssuePR(issue: Omit<IssuePR, 'id'>): Promise<string> {
    const id = `issue-${issue.type}-${issue.number}`;

    this.db.prepare(`
      INSERT INTO issues_prs (
        id, number, title, description, type, status, assignee_ids,
        reviewer_ids, labels, component, priority, created_at, updated_at,
        repository, estimated_effort
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      issue.number,
      issue.title,
      issue.description,
      issue.type,
      issue.status,
      JSON.stringify(issue.assigneeIds),
      JSON.stringify(issue.reviewerIds),
      JSON.stringify(issue.labels),
      issue.component,
      issue.priority,
      issue.createdAt,
      issue.updatedAt,
      issue.repository,
      issue.estimatedEffort
    );

    return id;
  }

  async getIssuePR(id: string): Promise<IssuePR | null> {
    const row = this.db.prepare('SELECT * FROM issues_prs WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      number: row.number,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status as IssueStatus,
      assigneeIds: JSON.parse(row.assignee_ids || '[]'),
      reviewerIds: JSON.parse(row.reviewer_ids || '[]'),
      labels: JSON.parse(row.labels || '[]'),
      component: row.component,
      priority: row.priority as PriorityLevel,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at,
      linkedReleaseIds: JSON.parse(row.linked_release_ids || '[]'),
      relatedIssueIds: JSON.parse(row.related_issue_ids || '[]'),
      estimatedEffort: row.estimated_effort,
      actualEffort: row.actual_effort,
      repository: row.repository,
      milestone: row.milestone
    };
  }

  // Release Management
  async createRelease(release: Omit<ReleaseMapping, 'id'>): Promise<string> {
    const id = `release-${release.version}`;

    this.db.prepare(`
      INSERT INTO releases (
        id, version, type, release_date, contained_issue_ids, contained_pr_ids,
        contributor_ids, breaking_changes, new_features, bug_fixes,
        performance_metrics, quality_score, impact_assessment, changelog
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      release.version,
      release.type,
      release.releaseDate,
      JSON.stringify(release.containedIssueIds),
      JSON.stringify(release.containedPRIds),
      JSON.stringify(release.contributorIds),
      JSON.stringify(release.breakingChanges),
      JSON.stringify(release.newFeatures),
      JSON.stringify(release.bugFixes),
      JSON.stringify(release.performanceMetrics),
      release.qualityScore,
      JSON.stringify(release.impactAssessment),
      release.changelog
    );

    return id;
  }

  // Cross-reference Management
  async createCrossReference(ref: Omit<CrossReference, 'id'>): Promise<string> {
    const id = `xref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.db.prepare(`
      INSERT INTO cross_references (
        id, from_type, from_id, to_type, to_id, relationship,
        strength, created_by, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      ref.fromType,
      ref.fromId,
      ref.toType,
      ref.toId,
      ref.relationship,
      ref.strength,
      ref.createdBy,
      JSON.stringify(ref.metadata || {})
    );

    return id;
  }

  async getCrossReferences(entityType: EntityType, entityId: string): Promise<CrossReference[]> {
    const rows = this.db.prepare(`
      SELECT * FROM cross_references
      WHERE (from_type = ? AND from_id = ?) OR (to_type = ? AND to_id = ?)
    `).all(entityType, entityId, entityType, entityId) as any[];

    return rows.map(row => ({
      id: row.id,
      fromType: row.from_type as EntityType,
      fromId: row.from_id,
      toType: row.to_type as EntityType,
      toId: row.to_id,
      relationship: row.relationship as RelationshipType,
      strength: row.strength,
      createdBy: row.created_by,
      createdAt: row.created_at,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }

  // Metrics Management
  async saveTeamMetrics(metrics: Omit<TeamMetrics, 'id'>): Promise<string> {
    const id = `metrics-${metrics.teamId}-${metrics.period}-${Date.now()}`;

    this.db.prepare(`
      INSERT INTO team_metrics (
        id, period, team_id, start_date, end_date, member_metrics,
        throughput, cycle_time, quality_score, velocity, release_velocity,
        defect_density, performance_delta, forecasted_completion,
        bottleneck_indicators, capacity_utilization
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      metrics.period,
      metrics.teamId,
      metrics.startDate,
      metrics.endDate,
      JSON.stringify(metrics.memberMetrics),
      metrics.throughput,
      metrics.cycleTime,
      metrics.qualityScore,
      metrics.velocity,
      metrics.releaseVelocity,
      metrics.defectDensity,
      metrics.performanceDelta,
      JSON.stringify(metrics.forecastedCompletion),
      JSON.stringify(metrics.bottleneckIndicators),
      metrics.capacityUtilization
    );

    return id;
  }

  private async saveMemberMetrics(memberId: string, period: string, startDate: string, endDate: string, metrics: MemberMetrics): Promise<void> {
    const id = `member-metrics-${memberId}-${period}-${Date.now()}`;

    this.db.prepare(`
      INSERT OR REPLACE INTO member_metrics (
        id, member_id, period, start_date, end_date,
        issues_completed, prs_merged, reviews_completed, story_points_completed,
        bugs_introduced, reviews_rejected, average_review_time,
        average_cycle_time, on_time_delivery_rate, code_quality_score,
        cross_team_contributions, mentoring_sessions, knowledge_sharing,
        skills_improved, certifications_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      memberId,
      period,
      startDate,
      endDate,
      metrics.issuesCompleted,
      metrics.prsMerged,
      metrics.reviewsCompleted,
      metrics.storyPointsCompleted,
      metrics.bugsIntroduced,
      metrics.reviewsRejected,
      metrics.averageReviewTime,
      metrics.averageCycleTime,
      metrics.onTimeDeliveryRate,
      metrics.codeQualityScore,
      metrics.crossTeamContributions,
      metrics.mentoringSessions,
      metrics.knowledgeSharing,
      JSON.stringify(metrics.skillsImproved),
      JSON.stringify(metrics.certificationsCompleted)
    );
  }

  async getLatestMemberMetrics(memberId: string): Promise<MemberMetrics | null> {
    const row = this.db.prepare(`
      SELECT * FROM member_metrics
      WHERE member_id = ?
      ORDER BY generated_at DESC
      LIMIT 1
    `).get(memberId) as any;

    if (!row) return null;

    return {
      memberId: row.member_id,
      period: row.period,
      issuesCompleted: row.issues_completed,
      prsMerged: row.prs_merged,
      reviewsCompleted: row.reviews_completed,
      storyPointsCompleted: row.story_points_completed,
      bugsIntroduced: row.bugs_introduced,
      reviewsRejected: row.reviews_rejected,
      averageReviewTime: row.average_review_time,
      averageCycleTime: row.average_cycle_time,
      onTimeDeliveryRate: row.on_time_delivery_rate,
      codeQualityScore: row.code_quality_score,
      crossTeamContributions: row.cross_team_contributions,
      mentoringSessions: row.mentoring_sessions,
      knowledgeSharing: row.knowledge_sharing,
      skillsImproved: JSON.parse(row.skills_improved || '[]'),
      certificationsCompleted: JSON.parse(row.certifications_completed || '[]')
    };
  }

  private createDefaultMemberMetrics(memberId: string): MemberMetrics {
    return {
      memberId,
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
    };
  }

  // Analytics and Reporting
  async generateTeamAnalytics(teamId: string, period: string): Promise<TeamMetrics> {
    const now = new Date();
    const periodStart = this.getPeriodStart(now, period);
    const periodEnd = now.toISOString();

    // Calculate team metrics
    const memberMetrics = await this.calculateMemberMetrics(teamId, periodStart, periodEnd);
    const throughput = this.calculateThroughput(memberMetrics);
    const cycleTime = this.calculateAverageCycleTime(memberMetrics);
    const qualityScore = this.calculateQualityScore(memberMetrics);
    const velocity = this.calculateVelocity(memberMetrics);

    // Update member metrics with calculated values
    for (const [memberId, metrics] of Object.entries(memberMetrics)) {
      // Save calculated metrics to database for persistence
      await this.saveMemberMetrics(memberId, 'monthly', periodStart, periodEnd, metrics);
    }

    // Calculate bottlenecks
    const bottleneckIndicators = this.identifyBottlenecks(teamId, memberMetrics);

    // Forecast completion dates
    const forecastedCompletion = this.forecastCompletionDates(teamId);

    const metrics: TeamMetrics = {
      id: '',
      period,
      teamId,
      startDate: periodStart,
      endDate: periodEnd,
      memberMetrics,
      throughput,
      cycleTime,
      qualityScore,
      velocity,
      releaseVelocity: await this.calculateReleaseVelocity(teamId, periodStart, periodEnd),
      defectDensity: await this.calculateDefectDensity(teamId, periodStart, periodEnd),
      performanceDelta: await this.calculatePerformanceDelta(teamId, periodStart, periodEnd),
      forecastedCompletion,
      bottleneckIndicators,
      capacityUtilization: this.calculateCapacityUtilization(memberMetrics),
      generatedAt: now.toISOString()
    };

    // Save metrics
    const id = await this.saveTeamMetrics(metrics);
    metrics.id = id;

    return metrics;
  }

  private getPeriodStart(now: Date, period: string): string {
    const start = new Date(now);

    switch (period) {
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(now.getMonth() - 3);
        break;
      default:
        start.setDate(now.getDate() - 30); // Default to monthly
    }

    return start.toISOString();
  }

  private async calculateMemberMetrics(teamId: string, startDate: string, endDate: string): Promise<Record<string, MemberMetrics>> {
    const members = await this.getTeamMembers(teamId);
    const metrics: Record<string, MemberMetrics> = {};

    for (const member of members) {
      // Calculate metrics for this member
      const memberMetrics = await this.calculateIndividualMetrics(member.id, startDate, endDate);
      metrics[member.id] = memberMetrics;
    }

    return metrics;
  }

  private async calculateIndividualMetrics(memberId: string, startDate: string, endDate: string): Promise<MemberMetrics> {
    // Query assignments completed in the period
    const assignments = this.db.prepare(`
      SELECT * FROM assignments
      WHERE member_id = ? AND status = 'completed'
      AND start_date >= ? AND start_date <= ?
    `).all(memberId, startDate, endDate) as any[];



    // Query issues/PRs assigned to this member
    const issues = this.db.prepare(`
      SELECT * FROM issues_prs
      WHERE (assignee_ids LIKE ? OR reviewer_ids LIKE ?)
      AND created_at >= ? AND created_at <= ?
    `).all(`%${memberId}%`, `%${memberId}%`, startDate, endDate) as any[];

    // Calculate metrics from real data
    const issuesCompleted = assignments.filter(a => a.type === 'issue').length;
    const prsMerged = issues.filter(i => i.type === 'pr' && i.status === 'merged').length;
    const reviewsCompleted = issues.filter(i => i.reviewer_ids.includes(memberId)).length;

    // Calculate story points from assignments
    const storyPointsCompleted = assignments.reduce((sum, a) => sum + (a.effort_estimate || 0), 0);

    // Calculate cycle time (average time from assignment to completion)
    const completedAssignments = assignments.filter(a => a.actual_completion);
    const averageCycleTime = completedAssignments.length > 0
      ? completedAssignments.reduce((sum, a) => {
          const start = new Date(a.start_date).getTime();
          const end = new Date(a.actual_completion).getTime();
            return sum + (end - start) / (1000 * 60 * 60 * 24); // days
        }, 0) / completedAssignments.length
      : 0;

    // Calculate on-time delivery rate
    const onTimeDeliveries = completedAssignments.filter(a => {
      if (!a.estimated_completion) return true; // No estimate = on time
      const estimated = new Date(a.estimated_completion).getTime();
      const actual = new Date(a.actual_completion).getTime();
      return actual <= estimated;
    }).length;

    const onTimeDeliveryRate = completedAssignments.length > 0
      ? (onTimeDeliveries / completedAssignments.length) * 100
      : 0;

    // Calculate code quality score (simplified - based on review feedback)
    const codeQualityScore = Math.min(100, Math.max(0,
      80 - (issues.filter(i => i.labels.includes('needs-improvement')).length * 5)
    ));

    return {
      memberId,
      period: 'monthly',
      issuesCompleted,
      prsMerged,
      reviewsCompleted,
      storyPointsCompleted,
      bugsIntroduced: 0, // Would need bug tracking integration
      reviewsRejected: 0, // Would need review feedback integration
      averageReviewTime: 0, // Would need review time tracking
      averageCycleTime,
      onTimeDeliveryRate,
      codeQualityScore,
      crossTeamContributions: 0, // Would need cross-team assignment tracking
      mentoringSessions: 0, // Would need mentoring tracking
      knowledgeSharing: 0, // Would need knowledge sharing tracking
      skillsImproved: [], // Would need skill assessment integration
      certificationsCompleted: [] // Would need certification tracking
    };
  }

  private calculateThroughput(memberMetrics: Record<string, MemberMetrics>): number {
    return Object.values(memberMetrics).reduce((sum, metrics) =>
      sum + metrics.issuesCompleted + metrics.prsMerged, 0);
  }

  private calculateAverageCycleTime(memberMetrics: Record<string, MemberMetrics>): number {
    const cycleTimes = Object.values(memberMetrics)
      .map(m => m.averageCycleTime)
      .filter(time => time > 0);

    return cycleTimes.length > 0
      ? cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length
      : 0;
  }

  private calculateQualityScore(memberMetrics: Record<string, MemberMetrics>): number {
    const scores = Object.values(memberMetrics)
      .map(m => m.codeQualityScore)
      .filter(score => score > 0);

    return scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  }

  private calculateVelocity(memberMetrics: Record<string, MemberMetrics>): number {
    return Object.values(memberMetrics).reduce((sum, metrics) =>
      sum + metrics.storyPointsCompleted, 0);
  }

  private identifyBottlenecks(teamId: string, memberMetrics: Record<string, MemberMetrics>): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Check for workload imbalances
    const avgVelocity = this.calculateVelocity(memberMetrics) / Math.max(Object.keys(memberMetrics).length, 1);
    const highWorkloadMembers = Object.entries(memberMetrics)
      .filter(([_, metrics]) => metrics.storyPointsCompleted > avgVelocity * 1.5)
      .map(([id, _]) => id);

    if (highWorkloadMembers.length > 0) {
      bottlenecks.push({
        id: `workload-${Date.now()}`,
        type: 'workload',
        severity: 'medium',
        description: `${highWorkloadMembers.length} team members have significantly higher workloads`,
        affectedItems: highWorkloadMembers,
        recommendedActions: [
          'Redistribute work items',
          'Consider hiring additional team members',
          'Implement work-in-progress limits'
        ],
        estimatedResolutionTime: '2-4 weeks'
      });
    }

    // Check for quality issues (low code quality scores)
    const lowQualityMembers = Object.entries(memberMetrics)
      .filter(([_, metrics]) => metrics.codeQualityScore < 70)
      .map(([id, _]) => id);

    if (lowQualityMembers.length > 0) {
      bottlenecks.push({
        id: `quality-${Date.now()}`,
        type: 'skill_gap',
        severity: 'high',
        description: `${lowQualityMembers.length} team members have quality scores below 70`,
        affectedItems: lowQualityMembers,
        recommendedActions: [
          'Provide code review training',
          'Implement pair programming sessions',
          'Add automated code quality checks'
        ],
        estimatedResolutionTime: '1-2 weeks'
      });
    }

    // Check for review bottlenecks (high review times)
    const slowReviewers = Object.entries(memberMetrics)
      .filter(([_, metrics]) => metrics.averageReviewTime > 24) // > 24 hours
      .map(([id, _]) => id);

    if (slowReviewers.length > 0) {
      bottlenecks.push({
        id: `review-${Date.now()}`,
        type: 'review_queue',
        severity: 'medium',
        description: `${slowReviewers.length} team members have slow review times (>24h)`,
        affectedItems: slowReviewers,
        recommendedActions: [
          'Reduce review workload',
          'Implement review time limits',
          'Consider additional reviewers'
        ],
        estimatedResolutionTime: '1 week'
      });
    }

    // Check for dependency issues (high cycle times)
    const highCycleTimeMembers = Object.entries(memberMetrics)
      .filter(([_, metrics]) => metrics.averageCycleTime > 14) // > 2 weeks
      .map(([id, _]) => id);

    if (highCycleTimeMembers.length > 0) {
      bottlenecks.push({
        id: `dependency-${Date.now()}`,
        type: 'dependency',
        severity: 'high',
        description: `${highCycleTimeMembers.length} team members have cycle times > 2 weeks`,
        affectedItems: highCycleTimeMembers,
        recommendedActions: [
          'Break down large tasks',
          'Identify and resolve dependencies',
          'Implement agile ceremonies for blockers'
        ],
        estimatedResolutionTime: '1-3 weeks'
      });
    }

    return bottlenecks;
  }

  private forecastCompletionDates(teamId: string): Record<string, string> {
    // Simple forecasting based on current velocity
    // In a real implementation, this would use more sophisticated algorithms
    return {};
  }

  private calculateCapacityUtilization(memberMetrics: Record<string, MemberMetrics>): number {
    // Calculate based on assigned vs completed work
    // This is a simplified implementation
    return 75; // Placeholder
  }

  private async calculateReleaseVelocity(teamId: string, startDate: string, endDate: string): Promise<number> {
    // Calculate features delivered per release in the period
    const releases = this.db.prepare(`
      SELECT * FROM releases
      WHERE release_date >= ? AND release_date <= ?
    `).all(startDate, endDate) as any[];

    if (releases.length === 0) return 0;

    const totalFeatures = releases.reduce((sum, release) => {
      const newFeatures = JSON.parse(release.new_features || '[]').length;
      const breakingChanges = JSON.parse(release.breaking_changes || '[]').length;
      return sum + newFeatures + breakingChanges;
    }, 0);

    return totalFeatures / releases.length;
  }

  private async calculateDefectDensity(teamId: string, startDate: string, endDate: string): Promise<number> {
    // Calculate bugs per 1000 lines of code (simplified - using issue count as proxy)
    const issues = this.db.prepare(`
      SELECT COUNT(*) as count FROM issues_prs
      WHERE type = 'issue' AND status = 'closed'
      AND created_at >= ? AND created_at <= ?
    `).get(startDate, endDate) as { count: number };

    // Assume 10,000 lines of code as baseline (would need actual code metrics)
    const linesOfCode = 10000;
    return (issues.count / linesOfCode) * 1000;
  }

  private async calculatePerformanceDelta(teamId: string, startDate: string, endDate: string): Promise<number> {
    // Calculate performance change percentage (simplified - using cycle time improvement)
    // Avoid recursive calls - would need historical data comparison
    // For now return a small positive delta as placeholder
    return 2.5; // 2.5% improvement placeholder
  }

  close() {
    this.db.close();
  }
}