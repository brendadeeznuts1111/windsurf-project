# Bun Team-Scoped RBAC + Private Registry Guide

> Complete guide to team-scoped role-based access control, private registries, and operational workflows in Bun

## Overview

This guide covers the comprehensive team-scoped RBAC (Role-Based Access Control) system integrated with private package registries, Telegram operations, and maintainer workflows. The system provides granular access control for enterprise-scale Bun development.

## Core Concepts

### Team Hierarchy & Permissions

```typescript
enum TeamTier {
  TIER1 = 'tier1',  // CTO, VP Engineering (executive access)
  TIER2 = 'tier2',  // Staff Engineers, Team Leads (senior access)
  TIER3 = 'tier3',  // Senior Engineers (standard access)
  TIER4 = 'tier4',  // Engineers (limited access)
  TIER5 = 'tier5'   // Junior Engineers (basic access)
}

enum ResourceAction {
  PUBLISH = 'publish',
  INSTALL = 'install',
  MERGE = 'merge',
  RUN_BENCHMARK = 'run_benchmark',
  OVERRIDE_SECURITY = 'override_security'
}
```

### RBAC Policies by Resource

#### Package Publishing
```typescript
const packagePolicies = {
  tier1: { scope: 'all-packages', approval: 'none', bypass: true },
  tier2: { scope: 'team-packages', approval: 'tier1', bypass: false },
  tier3: { scope: 'none', approval: 'tier2', bypass: false },
  tier4: { scope: 'none', approval: 'tier2', bypass: false },
  tier5: { scope: 'none', approval: 'tier2', bypass: false }
};
```

#### Benchmark Execution
```typescript
const benchmarkPolicies = {
  tier1: { scope: 'all-benchmarks', approval: 'none' },
  tier2: { scope: 'team-benchmarks', approval: 'none' },
  tier3: { scope: 'feature-benchmarks', approval: 'none' },
  tier4: { scope: 'none', approval: 'tier3' },
  tier5: { scope: 'none', approval: 'tier3' }
};
```

#### PR Merge Permissions
```typescript
const prPolicies = {
  tier1: { scope: 'all-prs', approval: 'none', bypassChecks: true },
  tier2: { scope: 'team-prs', approval: 'none', bypassChecks: false },
  tier3: { scope: 'none', approval: 'tier2', bypassChecks: false },
  tier4: { scope: 'none', approval: 'tier2', bypassChecks: false },
  tier5: { scope: 'none', approval: 'tier2', bypassChecks: false }
};
```

## Private Registry Setup

### Registry Configuration

```bash
# .npmrc for private registry
@core-team:registry=https://registry.windsurf.bun.sh/
//registry.windsurf.bun.sh/:_authToken=${BUN_REGISTRY_TOKEN}

# Environment setup
export BUN_REGISTRY_TOKEN="your-registry-token"
```

### Bunfig.toml Configuration

```toml
# bunfig.toml - Team-scoped registry
[install]
registry = "https://registry.npmjs.org/"

[install.scopes]
"core-team" = "https://registry.windsurf.bun.sh/"
"feature-team" = "https://registry.windsurf.bun.sh/"
"benchmarks" = "https://registry.windsurf.bun.sh/"

[install.scopes."core-team"]
token = "${BUN_REGISTRY_TOKEN}"
```

### Registry Channels

```typescript
// Channel definitions with access control
const registryChannels = {
  '@core-team/*': {
    access: {
      publish: ['tier1', 'tier2-core-team'],
      install: ['tier1', 'tier2', 'tier3']
    },
    visibility: 'private',
    retention: '30-days-5-versions',
    auditLevel: 'full'
  },

  '@feature-team/*': {
    access: {
      publish: ['tier3-feature-leads'],
      install: ['tier3-feature-team', 'tier4-feature-engineers']
    },
    visibility: 'team',
    retention: '14-days-3-versions',
    auditLevel: 'standard'
  },

  '@benchmarks/*': {
    access: {
      publish: ['tier2-perf-team'],
      install: ['tier1', 'tier2', 'tier3']
    },
    visibility: 'private',
    retention: '90-days-all-versions',
    auditLevel: 'full'
  }
};
```

## RBAC Implementation

### Permission Checker

```typescript
export class TeamRBAC {
  private db: Database;

  constructor(dbPath: string = 'rbac.db') {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE,
        tier TEXT,
        team TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY,
        resource TEXT,
        action TEXT,
        tier TEXT,
        scope TEXT,
        approval_required TEXT,
        UNIQUE(resource, action, tier)
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        action TEXT,
        resource TEXT,
        result TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  checkPermission(userId: number, resource: string, action: string): boolean {
    const user = this.db.prepare('SELECT tier, team FROM users WHERE id = ?').get(userId) as any;

    if (!user) return false;

    const permission = this.db.prepare(`
      SELECT scope, approval_required
      FROM permissions
      WHERE resource = ? AND action = ? AND tier = ?
    `).get(resource, action, user.tier) as any;

    if (!permission) return false;

    // Check scope
    if (permission.scope === 'none') return false;
    if (permission.scope === 'all') return true;
    if (permission.scope === 'team' && resource.includes(user.team)) return true;

    return false;
  }

  logAccess(userId: number, action: string, resource: string, result: boolean) {
    this.db.prepare(`
      INSERT INTO audit_log (user_id, action, resource, result)
      VALUES (?, ?, ?, ?)
    `).run(userId, action, resource, result ? 'allowed' : 'denied');
  }
}
```

### Middleware Integration

```typescript
import { TeamRBAC } from './team-rbac';

const rbac = new TeamRBAC();

// Middleware for protecting routes
export function requirePermission(resource: string, action: string) {
  return async (request: Request): Promise<Response> => {
    // Extract user from session/JWT
    const userId = getUserFromRequest(request);

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const allowed = rbac.checkPermission(userId, resource, action);

    // Log access attempt
    rbac.logAccess(userId, action, resource, allowed);

    if (!allowed) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Continue to handler
    return await handleRequest(request);
  };
}

// Usage in routes
const routes = [
  {
    path: '/api/packages/publish',
    method: 'POST',
    handler: requirePermission('packages', 'publish')
  },
  {
    path: '/api/prs/merge',
    method: 'POST',
    handler: requirePermission('prs', 'merge')
  },
  {
    path: '/api/benchmarks/run',
    method: 'POST',
    handler: requirePermission('benchmarks', 'run')
  }
];
```

## Package Management

### Publishing to Private Registry

```bash
# Publish to team channel
bun pm publish --channel=@core-team --tag=EX021

# Publish with Telegram notification
bun pm publish --channel=@core-team --notify-telegram

# Publish to specific registry
bun pm publish --registry=https://registry.windsurf.bun.sh/
```

### Installing from Private Registry

```bash
# Install from team channel
bun pm install @core-team/http-server@EX021

# Install with authentication
bun pm install @core-team/database --auth-token=$BUN_REGISTRY_TOKEN

# Install from specific registry
bun pm install @core-team/utils --registry=https://registry.windsurf.bun.sh/
```

### Registry Operations

```bash
# List packages in channel
bun pm list --channel=@core-team

# Audit channel packages
bun pm audit --channel=@core-team --format=sarif

# Clean old versions
bun pm clean --channel=@core-team --retention=30-days
```

## Telegram Operations

### Bot Configuration

```typescript
// Telegram bot setup
const telegramConfig = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  webhookUrl: 'https://api.windsurf.bun.sh/telegram/webhook',
  channels: {
    'core-team': '@core-team-packages',
    'feature-team': '@feature-team-packages',
    'perf-team': '@perf-team-packages'
  }
};
```

### ChatOps Commands

```typescript
// Telegram command handlers
const commands = {
  '/publish': async (args: string[], user: User) => {
    const [packageName, channel] = args;

    // Check RBAC permission
    const canPublish = rbac.checkPermission(user.id, 'packages', 'publish');

    if (!canPublish) {
      return '❌ You do not have permission to publish packages';
    }

    // Publish package
    await publishPackage(packageName, channel);

    // Notify channel
    await telegram.sendMessage(
      telegramConfig.channels[channel],
      `🚀 ${packageName} published by @${user.username}`
    );

    return `✅ ${packageName} published successfully`;
  },

  '/run-benchmark': async (args: string[], user: User) => {
    const [benchmarkName] = args;

    const canRun = rbac.checkPermission(user.id, 'benchmarks', 'run');

    if (!canRun) {
      return '❌ You do not have permission to run benchmarks';
    }

    await runBenchmark(benchmarkName);

    return `🏃 Benchmark ${benchmarkName} started`;
  },

  '/merge-pr': async (args: string[], user: User) => {
    const [prId] = args;

    const canMerge = rbac.checkPermission(user.id, 'prs', 'merge');

    if (!canMerge) {
      return '❌ You do not have permission to merge PRs';
    }

    await mergePR(prId);

    return `📦 PR #${prId} merged successfully`;
  }
};
```

### Interactive Buttons

```typescript
// Telegram inline keyboard buttons
const actionButtons = {
  approvePR: {
    text: '✅ Approve PR',
    callback: 'approve_pr',
    permission: 'prs.approve'
  },

  runBenchmark: {
    text: '🏃 Run Benchmark',
    callback: 'run_benchmark',
    permission: 'benchmarks.run'
  },

  publishPackage: {
    text: '🚀 Publish Package',
    callback: 'publish_package',
    permission: 'packages.publish'
  }
};
```

## Maintainer Matrix

### Package Ownership

```typescript
interface Maintainer {
  primary: string;
  backup: string;
  mentor: string;
  reviewCapacity: number;
  onCallRotation: string;
}

const maintainerMatrix: Record<string, Maintainer> = {
  '@core-team/http-server': {
    primary: '@bun-core-lead',
    backup: '@senior-http-engineer',
    mentor: '@staff-engineer',
    reviewCapacity: 3,
    onCallRotation: 'week-1,week-5'
  },

  '@core-team/database': {
    primary: '@database-lead',
    backup: '@senior-db-engineer',
    mentor: '@staff-engineer',
    reviewCapacity: 2,
    onCallRotation: 'week-2,week-6'
  }
};
```

### PR Routing

```typescript
// Auto-route PRs to maintainers
function routePRToMaintainer(pr: PullRequest): string[] {
  const packageName = getPackageFromPR(pr);
  const maintainer = maintainerMatrix[packageName];

  if (!maintainer) {
    return ['@engineering-managers']; // Fallback
  }

  return [maintainer.primary, maintainer.backup];
}

// Notify maintainers via Telegram
async function notifyMaintainers(pr: PullRequest, maintainers: string[]) {
  for (const maintainer of maintainers) {
    await telegram.sendMessage(
      maintainer,
      `📋 PR #${pr.id} needs review\nPackage: ${pr.package}\nTitle: ${pr.title}`,
      'pr_review_request'
    );
  }
}
```

## Performance Gates

### Benchmark Regression Detection

```typescript
interface PerformanceGate {
  metric: string;
  baseline: number;
  threshold: number; // percentage
  requiredRuns: number;
}

const performanceGates: Record<string, PerformanceGate> = {
  latency: {
    metric: 'p50-latency',
    baseline: 100, // ms
    threshold: 5, // 5% regression allowed
    requiredRuns: 100
  },

  throughput: {
    metric: 'requests-per-second',
    baseline: 1000,
    threshold: 5,
    requiredRuns: 1000
  },

  memory: {
    metric: 'heap-used',
    baseline: 50 * 1024 * 1024, // 50MB
    threshold: 10,
    requiredRuns: 50
  }
};
```

### CI Integration

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on: [pull_request]

jobs:
  performance-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Run Benchmarks
        run: bun run benchmarks

      - name: Check Performance Regression
        run: bun run scripts/check-performance-regression.ts
        env:
          BASELINE_COMMIT: ${{ github.event.pull_request.base.sha }}

      - name: Notify on Regression
        if: failure()
        run: bun run scripts/notify-performance-regression.ts
```

## Security Pipeline

### Multi-Stage Scanning

```typescript
const securityStages = [
  {
    name: 'dependency-audit',
    command: 'bun pm audit --json',
    failOn: ['critical', 'high'],
    continueOnWarning: true
  },

  {
    name: 'secret-scanning',
    command: 'bun run scripts/secret-scanner.ts',
    failOn: ['secrets-found'],
    scanPaths: ['src/', 'config/', '.env*']
  },

  {
    name: 'license-compliance',
    command: 'bun run scripts/license-checker.ts',
    failOn: ['incompatible-license'],
    allowedLicenses: ['MIT', 'Apache-2.0', 'BSD', 'ISC']
  }
];
```

### Security Notifications

```typescript
// Notify security team on failures
async function notifySecurityFailure(stage: string, results: any) {
  await telegram.sendMessage(
    '@security-team',
    `🚨 Security scan failed: ${stage}\n${JSON.stringify(results, null, 2)}`,
    'security_alert'
  );

  // Create incident ticket
  await createIncident({
    title: `Security scan failure: ${stage}`,
    severity: 'high',
    assignee: '@security-lead'
  });
}
```

## On-Call Management

### Schedule Rotation

```typescript
interface OnCallSchedule {
  team: string;
  rotation: 'weekly' | 'biweekly';
  handoffDay: string;
  handoffTime: string;
  timezone: string;
}

const onCallSchedules: Record<string, OnCallSchedule> = {
  'core-api': {
    team: 'core-api',
    rotation: 'weekly',
    handoffDay: 'monday',
    handoffTime: '09:00',
    timezone: 'UTC'
  }
};
```

### Escalation Policies

```typescript
const escalationPolicies = {
  level1: { responseTime: 15, notify: ['telegram', 'email'] },
  level2: { responseTime: 30, notify: ['team-lead', 'telegram'] },
  level3: { responseTime: 60, notify: ['manager', 'telegram', 'phone'] },
  level4: { responseTime: 120, notify: ['vp', 'telegram', 'phone', 'sms'] }
};
```

## Team Analytics

### Metrics Collection

```typescript
const teamMetrics = {
  reviewLatency: {
    target: 24, // hours
    measure: 'pr-created-to-first-review'
  },

  mergeVelocity: {
    target: 72, // hours
    measure: 'pr-created-to-merge'
  },

  benchmarkCoverage: {
    target: 95, // percentage
    measure: 'specs-with-benchmarks / total-specs'
  },

  securityPassRate: {
    target: 100, // percentage
    measure: 'security-scans-passed / total-scans'
  }
};
```

### Dashboard Integration

```typescript
// Send metrics to Telegram dashboard
async function sendTeamMetrics() {
  const metrics = await collectTeamMetrics();

  await telegram.sendMessage(
    '@engineering-metrics',
    `📊 Team Metrics Update:\n` +
    `Review Latency: ${metrics.reviewLatency}h (target: 24h)\n` +
    `Merge Velocity: ${metrics.mergeVelocity}h (target: 72h)\n` +
    `Benchmark Coverage: ${metrics.benchmarkCoverage}% (target: 95%)\n` +
    `Security Pass Rate: ${metrics.securityPassRate}% (target: 100%)`,
    'team_metrics'
  );
}
```

## Complete Integration Example

```typescript
// End-to-end integration
export class BunTeamIntegration {
  private rbac: TeamRBAC;
  private registry: PrivateRegistry;
  private telegram: TelegramBot;
  private maintainers: MaintainerMatrix;

  constructor() {
    this.rbac = new TeamRBAC();
    this.registry = new PrivateRegistry();
    this.telegram = new TelegramBot();
    this.maintainers = new MaintainerMatrix();
  }

  // Complete package publish flow
  async publishPackage(packageName: string, version: string, publisherId: string) {
    // 1. RBAC check
    const canPublish = this.rbac.checkPermission(publisherId, 'packages', 'publish');
    if (!canPublish) throw new Error('Unauthorized');

    // 2. Get maintainer approval if needed
    const maintainer = this.maintainers.getMaintainer(packageName);
    if (this.rbac.getUserTier(publisherId) > 2) {
      await this.telegram.requestApproval(maintainer.primary, packageName);
    }

    // 3. Publish to registry
    const result = await this.registry.publish(packageName, version);

    // 4. Notify team
    const channel = this.registry.getTeamChannel(packageName);
    await this.telegram.notify(channel, `🚀 ${packageName} v${version} published`);

    // 5. Log audit
    this.rbac.logAccess(publisherId, 'publish', packageName, true);

    return result;
  }

  // PR merge with full workflow
  async mergePR(prId: string, mergerId: string) {
    // 1. Check merge permission
    const canMerge = this.rbac.checkPermission(mergerId, 'prs', 'merge');
    if (!canMerge) throw new Error('Cannot merge PRs');

    // 2. Get maintainer approval
    const maintainer = this.maintainers.getMaintainerForPR(prId);
    await this.telegram.requestApproval(maintainer.primary, `PR #${prId}`);

    // 3. Run security scan
    await this.runSecurityScan(prId);

    // 4. Run benchmarks
    const benchResult = await this.runBenchmarks(prId);
    if (benchResult.regression) {
      await this.telegram.notify('@perf-team', `⚠️ Performance regression in PR #${prId}`);
    }

    // 5. Merge PR
    await this.mergePR(prId);

    // 6. Notify team
    await this.telegram.notify('@engineering', `📦 PR #${prId} merged by @${mergerId}`);
  }
}
```

This comprehensive system provides enterprise-grade access control, package management, and operational workflows for Bun development teams.