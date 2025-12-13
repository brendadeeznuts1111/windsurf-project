/**
 * @fileoverview Team-Issue-Release Mapping & Metrics System
 * @description Comprehensive system for mapping team members, issues, releases, and metrics
 * @author Bun Documentation Team
 * @version 1.0.0
 * @since 2025
 *
 * This system provides:
 * - Team member profiles and assignment tracking
 * - GitHub issue/PR integration and status monitoring
 * - Release-work item correlation and impact assessment
 * - Cross-reference engine for automated linking
 * - Team performance metrics and analytics dashboard
 */

import { Database } from 'bun:sqlite';

// Core data types
export interface TeamMember {
  id: string;
  githubUsername: string;
  name: string;
  email: string;
  role: TeamRole;
  team: string;
  skills: string[];
  currentAssignments: Assignment[];
  performanceMetrics: MemberMetrics;
  availability: AvailabilityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  issueId: string;
  memberId: string;
  type: 'issue' | 'pr' | 'maintenance' | 'review';
  status: 'assigned' | 'in_progress' | 'review' | 'completed';
  startDate: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  priority: PriorityLevel;
  effortEstimate: number; // Story points
  effortActual?: number;
}

export interface IssuePR {
  id: string;
  number: number;
  title: string;
  description: string;
  type: 'issue' | 'pr';
  status: IssueStatus;
  assigneeIds: string[];
  reviewerIds: string[];
  labels: string[];
  component: string;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  linkedReleaseIds: string[];
  relatedIssueIds: string[];
  estimatedEffort: number;
  actualEffort?: number;
  repository: string;
  milestone?: string;
}

export interface ReleaseMapping {
  id: string;
  version: string;
  type: 'major' | 'minor' | 'patch';
  releaseDate: string;
  containedIssueIds: string[];
  containedPRIds: string[];
  contributorIds: string[];
  breakingChanges: string[];
  newFeatures: string[];
  bugFixes: string[];
  performanceMetrics: ReleasePerformance;
  qualityScore: number;
  impactAssessment: ReleaseImpact;
  changelog: string;
}

export interface CrossReference {
  id: string;
  fromType: EntityType;
  fromId: string;
  toType: EntityType;
  toId: string;
  relationship: RelationshipType;
  strength: number; // 0-1 confidence score
  createdBy: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface TeamMetrics {
  id: string;
  period: string; // 'weekly', 'monthly', 'quarterly'
  teamId: string;
  startDate: string;
  endDate: string;

  // Individual performance
  memberMetrics: Record<string, MemberMetrics>;

  // Team performance
  throughput: number; // Issues/PRs completed per period
  cycleTime: number; // Average time from assignment to completion (days)
  qualityScore: number; // 0-100 based on bug rates, review feedback
  velocity: number; // Story points completed per period

  // Release performance
  releaseVelocity: number; // Features delivered per release
  defectDensity: number; // Bugs per 1000 lines of code
  performanceDelta: number; // Average performance change (%)

  // Predictive metrics
  forecastedCompletion: Record<string, string>; // Issue ID -> completion date
  bottleneckIndicators: Bottleneck[];
  capacityUtilization: number; // 0-100 percentage

  generatedAt: string;
}

export interface MemberMetrics {
  memberId: string;
  period: string;

  // Work metrics
  issuesCompleted: number;
  prsMerged: number;
  reviewsCompleted: number;
  storyPointsCompleted: number;

  // Quality metrics
  bugsIntroduced: number;
  reviewsRejected: number;
  averageReviewTime: number; // hours

  // Performance metrics
  averageCycleTime: number; // days
  onTimeDeliveryRate: number; // percentage
  codeQualityScore: number; // 0-100

  // Collaboration metrics
  crossTeamContributions: number;
  mentoringSessions: number;
  knowledgeSharing: number;

  // Personal development
  skillsImproved: string[];
  certificationsCompleted: string[];
}

export interface Bottleneck {
  id: string;
  type: 'skill_gap' | 'workload' | 'dependency' | 'review_queue' | 'resource_constraint';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedItems: string[];
  recommendedActions: string[];
  estimatedResolutionTime: string;
  assignedTo?: string;
}

export interface ReleasePerformance {
  buildTime: number; // seconds
  bundleSize: number; // bytes
  testCoverage: number; // percentage
  performanceScore: number; // 0-100
  securityScore: number; // 0-100
  compatibilityScore: number; // 0-100
  bytesProcessed: number; // total bytes processed
  mimeTypeDistribution: Record<string, number>; // MIME type usage stats
}

export interface ReleaseImpact {
  breakingChanges: number;
  newFeatures: number;
  bugFixes: number;
  affectedUsers: 'few' | 'some' | 'many' | 'all';
  migrationComplexity: 'low' | 'medium' | 'high' | 'critical';
  rollbackDifficulty: 'easy' | 'medium' | 'hard' | 'impossible';
}

// Enums and types
export enum TeamRole {
  ENGINEER = 'engineer',
  SENIOR_ENGINEER = 'senior_engineer',
  STAFF_ENGINEER = 'staff_engineer',
  PRINCIPAL_ENGINEER = 'principal_engineer',
  ENGINEERING_MANAGER = 'engineering_manager',
  DIRECTOR = 'director',
  VP = 'vp'
}

export enum PriorityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  BACKLOG = 'backlog'
}

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  MERGED = 'merged',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export enum EntityType {
  TEAM_MEMBER = 'team_member',
  ISSUE = 'issue',
  PR = 'pr',
  RELEASE = 'release',
  COMPONENT = 'component',
  REPOSITORY = 'repository'
}

export enum RelationshipType {
  ASSIGNED_TO = 'assigned_to',
  BLOCKS = 'blocks',
  DEPENDS_ON = 'depends_on',
  FIXES = 'fixes',
  IMPLEMENTS = 'implements',
  RELATED_TO = 'related_to',
  DUPLICATES = 'duplicates',
  CAUSES = 'causes',
  TESTED_BY = 'tested_by',
  REVIEWED_BY = 'reviewed_by'
}

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_LEAVE = 'on_leave',
  FOCUS_TIME = 'focus_time',
  OFFLINE = 'offline'
}

// Types are exported above with their interface declarations