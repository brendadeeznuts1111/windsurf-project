#!/usr/bin/env bun

/**
 * [CLI][PID][CLASS][META:{utility}][PIDCommands][#REF:PIDContext,PIDAuditTrail,SecurePIDRegistry]
 *
 * Advanced PID management CLI commands:
 * - pid:elect - Force coordinator election
 * - pid:lineage - View request lineage for debugging
 * - forensics - Generate forensic report
 */

import { SecurePIDRegistry } from '../telemetry/pid-context';
import { PIDAuditTrail } from '../telemetry/pid-audit-trail';
import { LoggerManager } from '../error/error-handler';

// ──────────────────────────────────────────────────────────────
// Coordinator Election
// ──────────────────────────────────────────────────────────────

interface CoordinatorState {
  coordinatorPid: number | null;
  electedAt: number;
  term: number;
  voters: number[];
}

class PIDCoordinator {
  private static instance: PIDCoordinator;
  private state: CoordinatorState = {
    coordinatorPid: null,
    electedAt: 0,
    term: 0,
    voters: []
  };
  private logger = LoggerManager.getInstance();
  private audit = PIDAuditTrail.getInstance();
  private registry = SecurePIDRegistry.getInstance();

  static getInstance(): PIDCoordinator {
    if (!PIDCoordinator.instance) {
      PIDCoordinator.instance = new PIDCoordinator();
    }
    return PIDCoordinator.instance;
  }

  /**
   * Force a new coordinator election
   */
  async forceElection(options: { force?: boolean } = {}): Promise<CoordinatorState> {
    const pid = process.pid;
    const allProcesses = this.registry.getAllProcesses();

    console.log('\n🗳️  PID Coordinator Election');
    console.log('='.repeat(50));

    if (this.state.coordinatorPid && !options.force) {
      console.log(`   ⚠️  Current coordinator: PID ${this.state.coordinatorPid}`);
      console.log(`   Use --force to override`);
      return this.state;
    }

    // Increment term
    this.state.term++;
    console.log(`   📊 Election Term: ${this.state.term}`);

    // Gather voters (all registered PIDs)
    const voters = allProcesses.map(p => p.pid);
    console.log(`   👥 Registered Voters: ${voters.length}`);

    // Simple election: lowest PID wins (Bully algorithm simplified)
    const candidates = voters.length > 0 ? voters : [pid];
    const winner = Math.min(...candidates);

    // Record election
    this.state = {
      coordinatorPid: winner,
      electedAt: Date.now(),
      term: this.state.term,
      voters: candidates
    };

    this.audit.record(pid, 'coordinator_elected', {
      coordinator: winner,
      term: this.state.term,
      candidates: candidates.length,
      forced: options.force
    });

    console.log(`\n   ✅ Election Complete`);
    console.log(`   👑 Coordinator: PID ${winner}`);
    console.log(`   📅 Elected At: ${new Date(this.state.electedAt).toISOString()}`);
    console.log(`   🔢 Term: ${this.state.term}`);

    if (winner === pid) {
      console.log(`   🎯 This process is the coordinator`);
    }

    return this.state;
  }

  getState(): CoordinatorState {
    return { ...this.state };
  }
}

// ──────────────────────────────────────────────────────────────
// Request Lineage Tracer
// ──────────────────────────────────────────────────────────────

interface LineageNode {
  requestId: string;
  pid: number;
  instanceId?: string;
  event: string;
  timestamp: number;
  duration?: number;
  children: LineageNode[];
  data?: any;
}

class RequestLineageTracer {
  private audit = PIDAuditTrail.getInstance();
  private registry = SecurePIDRegistry.getInstance();
  private logger = LoggerManager.getInstance();

  /**
   * Trace the full lineage of a request across PIDs
   */
  async traceLineage(requestId: string): Promise<LineageNode | null> {
    console.log(`\n🔗 Request Lineage: ${requestId}`);
    console.log('='.repeat(50));

    // Find all audit entries with this request ID
    const entries = this.audit.getEntriesByRequestId(requestId);

    if (entries.length === 0) {
      console.log(`   ❌ No entries found for request: ${requestId}`);
      return null;
    }

    console.log(`   📜 Found ${entries.length} audit entries\n`);

    // Build lineage tree
    const root: LineageNode = {
      requestId,
      pid: entries[0].pid,
      event: 'request_start',
      timestamp: entries[0].timestamp,
      children: []
    };

    // Group by PID
    const byPid = new Map<number, typeof entries>();
    for (const entry of entries) {
      if (!byPid.has(entry.pid)) {
        byPid.set(entry.pid, []);
      }
      byPid.get(entry.pid)!.push(entry);
    }

    // Print lineage
    console.log('   Request Flow:');
    console.log('   ' + '─'.repeat(46));

    let prevTimestamp = entries[0].timestamp;
    for (const entry of entries) {
      const delta = entry.timestamp - prevTimestamp;
      const deltaStr = delta > 0 ? ` (+${delta}ms)` : '';
      const time = new Date(entry.timestamp).toISOString().slice(11, 23);

      const processInfo = this.registry.getProcess(entry.pid);
      const instance = processInfo?.instanceId?.slice(-8) || 'unknown';

      console.log(`   │`);
      console.log(`   ├─ [${time}] PID:${entry.pid} (${instance})${deltaStr}`);
      console.log(`   │  └─ ${entry.event}`);

      if (entry.data && Object.keys(entry.data).length > 0) {
        const dataStr = JSON.stringify(entry.data);
        if (dataStr.length < 50) {
          console.log(`   │     ${dataStr}`);
        }
      }

      prevTimestamp = entry.timestamp;
    }

    console.log('   │');
    console.log('   └─ [END]');

    // Summary
    const totalDuration = entries[entries.length - 1].timestamp - entries[0].timestamp;
    const uniquePids = byPid.size;

    console.log('\n   Summary:');
    console.log(`   ├─ Total Duration: ${totalDuration}ms`);
    console.log(`   ├─ Unique PIDs: ${uniquePids}`);
    console.log(`   └─ Events: ${entries.length}`);

    return root;
  }

  /**
   * List recent requests
   */
  listRecentRequests(limit = 10): void {
    console.log('\n📋 Recent Requests');
    console.log('='.repeat(50));

    const allEntries = this.audit.getEntriesInRange(
      Date.now() - 3600000, // Last hour
      Date.now()
    );

    // Extract unique request IDs
    const requestIds = new Set<string>();
    for (const entry of allEntries) {
      if (entry.context?.requestId) {
        requestIds.add(entry.context.requestId);
      }
    }

    const requests = Array.from(requestIds).slice(0, limit);

    if (requests.length === 0) {
      console.log('   (no recent requests found)');
      return;
    }

    console.log(`   Found ${requests.length} recent requests:\n`);
    for (const reqId of requests) {
      console.log(`   • ${reqId}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Forensic Report Generator
// ──────────────────────────────────────────────────────────────

interface ForensicReport {
  generatedAt: string;
  generatedBy: number;
  targetPid: number;
  processInfo: any;
  auditTrail: any[];
  resourceSnapshots: any[];
  anomalies: any[];
  timeline: any[];
  recommendations: string[];
}

class ForensicAnalyzer {
  private audit = PIDAuditTrail.getInstance();
  private registry = SecurePIDRegistry.getInstance();
  private logger = LoggerManager.getInstance();

  /**
   * Generate comprehensive forensic report for a PID
   */
  async generateReport(targetPid: number, outputPath?: string): Promise<ForensicReport> {
    console.log(`\n🔬 Forensic Analysis: PID ${targetPid}`);
    console.log('='.repeat(50));

    const processInfo = this.registry.getProcess(targetPid);
    const auditEntries = this.audit.getEntriesForPid(targetPid, 1000);

    // Build report
    const report: ForensicReport = {
      generatedAt: new Date().toISOString(),
      generatedBy: process.pid,
      targetPid,
      processInfo: processInfo || { status: 'not_found' },
      auditTrail: auditEntries,
      resourceSnapshots: [],
      anomalies: [],
      timeline: [],
      recommendations: []
    };

    // Process Info
    console.log('\n📋 Process Information:');
    if (processInfo) {
      console.log(`   Type: ${processInfo.type}`);
      console.log(`   Instance: ${processInfo.instanceId}`);
      console.log(`   Parent PID: ${processInfo.parentPid || 'N/A'}`);
      console.log(`   Start Time: ${new Date(processInfo.startTime).toISOString()}`);
      console.log(`   Uptime: ${((Date.now() - processInfo.startTime) / 1000).toFixed(0)}s`);
    } else {
      console.log(`   ❌ Process not found in registry`);
      report.recommendations.push('Process not registered - may have terminated or never registered');
    }

    // Audit Trail Analysis
    console.log('\n📜 Audit Trail Analysis:');
    console.log(`   Total Events: ${auditEntries.length}`);

    if (auditEntries.length > 0) {
      // Event frequency
      const eventCounts = new Map<string, number>();
      for (const entry of auditEntries) {
        eventCounts.set(entry.event, (eventCounts.get(entry.event) || 0) + 1);
      }

      console.log('   Event Distribution:');
      for (const [event, count] of eventCounts) {
        console.log(`     • ${event}: ${count}`);
      }

      // Timeline
      const firstEvent = auditEntries[auditEntries.length - 1];
      const lastEvent = auditEntries[0];
      console.log(`\n   Timeline:`);
      console.log(`     First: ${new Date(firstEvent.timestamp).toISOString()}`);
      console.log(`     Last:  ${new Date(lastEvent.timestamp).toISOString()}`);

      report.timeline = auditEntries.map(e => ({
        timestamp: e.timestamp,
        event: e.event,
        data: e.data
      }));
    }

    // Anomaly Detection
    console.log('\n🚨 Anomaly Detection:');
    const anomalies = this.detectAnomalies(auditEntries);
    report.anomalies = anomalies;

    if (anomalies.length === 0) {
      console.log('   ✅ No anomalies detected');
    } else {
      for (const anomaly of anomalies) {
        console.log(`   ⚠️  ${anomaly.type}: ${anomaly.description}`);
        report.recommendations.push(anomaly.recommendation);
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      for (const rec of report.recommendations) {
        console.log(`   • ${rec}`);
      }
    }

    // Save report
    if (outputPath) {
      await Bun.write(outputPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved: ${outputPath}`);
    }

    return report;
  }

  private detectAnomalies(entries: any[]): any[] {
    const anomalies: any[] = [];

    if (entries.length === 0) return anomalies;

    // Check for high error rate
    const errorEvents = entries.filter(e =>
      e.event.includes('error') || e.event.includes('failed')
    );
    if (errorEvents.length > entries.length * 0.1) {
      anomalies.push({
        type: 'HIGH_ERROR_RATE',
        description: `${errorEvents.length}/${entries.length} events are errors (>${10}%)`,
        recommendation: 'Investigate error patterns and root causes'
      });
    }

    // Check for rapid events (possible loop)
    const timestamps = entries.map(e => e.timestamp).sort((a, b) => a - b);
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] - timestamps[i - 1] < 10) { // Less than 10ms apart
        anomalies.push({
          type: 'RAPID_EVENTS',
          description: 'Multiple events within 10ms - possible tight loop',
          recommendation: 'Check for infinite loops or excessive logging'
        });
        break;
      }
    }

    // Check for integrity failures
    const integrityFailures = entries.filter(e =>
      e.event.includes('integrity') && e.data?.valid === false
    );
    if (integrityFailures.length > 0) {
      anomalies.push({
        type: 'INTEGRITY_FAILURES',
        description: `${integrityFailures.length} integrity check failures`,
        recommendation: 'Investigate potential tampering or data corruption'
      });
    }

    return anomalies;
  }
}

// ──────────────────────────────────────────────────────────────
// Cluster Monitor
// ──────────────────────────────────────────────────────────────

class ClusterMonitor {
  private coordinator = PIDCoordinator.getInstance();
  private registry = SecurePIDRegistry.getInstance();
  private audit = PIDAuditTrail.getInstance();

  /**
   * Monitor cluster state and coordinator
   */
  async monitor(target?: string): Promise<void> {
    console.log('\n📡 PID Cluster Monitor');
    console.log('='.repeat(50));

    const state = this.coordinator.getState();
    const allProcesses = this.registry.getAllProcesses();
    const auditStats = this.audit.getStatistics();

    // Coordinator Status
    console.log('\n👑 Coordinator Status:');
    if (state.coordinatorPid) {
      const coordProcess = this.registry.getProcess(state.coordinatorPid);
      console.log(`   Leader: PID ${state.coordinatorPid}`);
      console.log(`   Instance: ${coordProcess?.instanceId?.slice(-12) || 'unknown'}`);
      console.log(`   Term: ${state.term}`);
      console.log(`   Elected: ${new Date(state.electedAt).toISOString()}`);
      console.log(`   Uptime: ${((Date.now() - state.electedAt) / 1000).toFixed(0)}s`);
    } else {
      console.log(`   ⚠️  No coordinator elected`);
      console.log(`   Run: bun run pid:elect --force`);
    }

    // Cluster Members
    console.log('\n🖥️  Cluster Members:');
    console.log(`   Total: ${allProcesses.length}`);

    if (allProcesses.length > 0) {
      console.log('   ' + '-'.repeat(46));
      for (const proc of allProcesses.slice(0, 10)) {
        const isLeader = proc.pid === state.coordinatorPid ? ' 👑' : '';
        const uptime = ((Date.now() - proc.startTime) / 1000).toFixed(0);
        console.log(`   PID ${proc.pid.toString().padEnd(8)} ${proc.type.padEnd(14)} ${uptime}s${isLeader}`);
      }
      if (allProcesses.length > 10) {
        console.log(`   ... and ${allProcesses.length - 10} more`);
      }
    }

    // Request Stats
    console.log('\n📊 Activity:');
    console.log(`   Audit Events: ${auditStats.totalEntries}`);
    console.log(`   PIDs Tracked: ${Object.keys(auditStats.entriesByPid).length}`);
    console.log(`   Event Types: ${Object.keys(auditStats.entriesByEvent).length}`);

    if (auditStats.timeRange.start > 0) {
      console.log(`   First Event: ${new Date(auditStats.timeRange.start).toISOString()}`);
      console.log(`   Last Event: ${new Date(auditStats.timeRange.end).toISOString()}`);
    }

    // Top events
    if (Object.keys(auditStats.entriesByEvent).length > 0) {
      console.log('\n📈 Top Events:');
      const sorted = Object.entries(auditStats.entriesByEvent)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      for (const [event, count] of sorted) {
        console.log(`   ${count.toString().padStart(4)} ${event}`);
      }
    }

    // Health Summary
    console.log('\n🏥 Health:');
    const healthChecks = [
      { name: 'Coordinator', ok: !!state.coordinatorPid },
      { name: 'Processes', ok: allProcesses.length > 0 },
      { name: 'Audit Trail', ok: true },
    ];

    for (const check of healthChecks) {
      console.log(`   ${check.ok ? '✅' : '❌'} ${check.name}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────
// CLI Entry Point
// ──────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Parse flags
  const flags: Record<string, string | boolean> = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value || true;
    }
  }

  switch (command) {
    case 'elect': {
      const coordinator = PIDCoordinator.getInstance();
      await coordinator.forceElection({ force: flags.force === true });
      break;
    }

    case 'lineage': {
      const tracer = new RequestLineageTracer();
      if (flags.request) {
        await tracer.traceLineage(flags.request as string);
      } else if (flags.list) {
        tracer.listRecentRequests(parseInt(flags.limit as string) || 10);
      } else {
        console.log('Usage:');
        console.log('  pid:lineage --request=<request_id>  Trace specific request');
        console.log('  pid:lineage --list                  List recent requests');
      }
      break;
    }

    case 'forensics': {
      const analyzer = new ForensicAnalyzer();
      const targetPid = parseInt(flags.pid as string) || process.pid;
      const output = flags.output as string | undefined;
      await analyzer.generateReport(targetPid, output);
      break;
    }

    case 'monitor': {
      const monitor = new ClusterMonitor();
      await monitor.monitor(flags.coordinator as string);
      break;
    }

    default:
      console.log('🔧 PID Management Commands');
      console.log('='.repeat(50));
      console.log('\nUsage:');
      console.log('  bun run pid:elect [--force]');
      console.log('    Force coordinator election');
      console.log('');
      console.log('  bun run pid:lineage --request=<id>');
      console.log('    View request lineage for debugging');
      console.log('');
      console.log('  bun run pid:lineage --list');
      console.log('    List recent requests');
      console.log('');
      console.log('  bun run pid:forensics --pid=<pid> [--output=<file>]');
      console.log('    Generate forensic report for a PID');
      console.log('');
      console.log('  bun run pid:monitor');
      console.log('    Monitor cluster state, leader, and activity');
  }
}

// Run if main
if (import.meta.path === Bun.main) {
  main().catch(error => {
    console.error('Command failed:', error);
    process.exit(1);
  });
}

export { PIDCoordinator, RequestLineageTracer, ForensicAnalyzer, ClusterMonitor };
