#!/usr/bin/env bun

/**
 * [CLI][REGISTRY][CLASS][META:{utility,extends=PIDRegistryClient}][RegistryInspector][#REF:PIDContext,PIDRegistryClient,Logger]
 *
 * Interactive CLI tool for inspecting and debugging PID-aware registry operations
 */

import { PIDRegistryClient } from '../registry/pid-registry-client';
import { SecurePIDRegistry } from '../telemetry/pid-context';
import { PIDAuditTrail } from '../telemetry/pid-audit-trail';
import { LoggerManager } from '../error/error-handler';

// Get the global processes map from pid-context
const getProcesses = (): Map<number, any> => {
  // Access the registry to get process info
  const registry = SecurePIDRegistry.getInstance();
  const allProcesses = registry.getAllProcesses();
  const map = new Map<number, any>();
  for (const proc of allProcesses) {
    map.set(proc.pid, proc);
  }
  return map;
};

class RegistryInspector {
  private registry = PIDRegistryClient.getInstance();
  private logger = LoggerManager.getInstance();
  private audit = PIDAuditTrail.getInstance();

  async runInteractive(): Promise<void> {
    console.log('\n🔍 ORCA Registry Inspector');
    console.log('='.repeat(50));

    while (true) {
      console.log('\nCommands:');
      console.log('  ls              - List all registry contexts');
      console.log('  inspect <pid>   - Inspect specific PID');
      console.log('  packages <pid>  - Show packages for PID');
      console.log('  health          - Registry health check');
      console.log('  report          - Generate compliance report');
      console.log('  trace <pkg>     - Trace package across PIDs');
      console.log('  test            - Test registry authentication');
      console.log('  audit [pid]     - Show audit trail');
      console.log('  quit            - Exit');

      const input = await this.prompt('\n> ');

      try {
        const command = input.trim().toLowerCase();
        const parts = command.split(' ');

        switch (parts[0]) {
          case 'ls':
            await this.listRegistryContexts();
            break;

          case 'health':
            await this.checkRegistryHealth();
            break;

          case 'report':
            await this.generateQuickReport();
            break;

          case 'test':
            await this.testRegistryAuth();
            break;

          case 'audit':
            const auditPid = parts[1] ? parseInt(parts[1]) : undefined;
            await this.showAuditTrail(auditPid);
            break;

          case 'inspect':
            if (parts[1]) {
              const pid = parseInt(parts[1]);
              await this.inspectPID(pid);
            } else {
              console.log('Usage: inspect <pid>');
            }
            break;

          case 'packages':
            if (parts[1]) {
              const pid = parseInt(parts[1]);
              await this.listPackagesForPID(pid);
            } else {
              console.log('Usage: packages <pid>');
            }
            break;

          case 'trace':
            if (parts[1]) {
              await this.tracePackage(parts[1]);
            } else {
              console.log('Usage: trace <package-name>');
            }
            break;

          case 'quit':
          case 'exit':
          case 'q':
            console.log('👋 Goodbye!');
            return;

          case '':
            break;

          default:
            console.log("❓ Unknown command. See available commands above.");
        }
      } catch (error) {
        this.logger.error('Command failed', {
          error: (error as Error).message,
          command: input
        });
      }
    }
  }

  async listRegistryContexts(): Promise<void> {
    const processes = getProcesses();

    console.log(`\n🐋 Found ${processes.size} process contexts`);
    console.log('-'.repeat(70));

    const headers = ['PID', 'Type', 'Instance (last 8)', 'Packages', 'Uptime'];
    console.log(
      headers[0].padEnd(8) +
      headers[1].padEnd(18) +
      headers[2].padEnd(14) +
      headers[3].padEnd(10) +
      headers[4]
    );
    console.log('-'.repeat(70));

    for (const [pid, context] of processes) {
      const packages = this.registry.getPackagesForPID(pid);
      const uptime = ((Date.now() - context.startTime) / 1000).toFixed(0) + 's';
      const row = [
        pid.toString().padEnd(8),
        (context.type || 'unknown').padEnd(18),
        (context.instanceId?.slice(-8) || 'N/A').padEnd(14),
        packages.size.toString().padEnd(10),
        uptime
      ];
      console.log(row.join(''));
    }
  }

  async inspectPID(pid: number): Promise<void> {
    const processes = getProcesses();
    const context = processes.get(pid);

    if (!context) {
      console.log(`❌ PID ${pid} not found`);
      return;
    }

    console.log(`\n🔎 Inspecting PID ${pid}`);
    console.log('='.repeat(50));

    // Identity
    console.log('\n🆔 Identity:');
    console.log(`   Type: ${context.type}`);
    console.log(`   Instance: ${context.instanceId}`);
    console.log(`   Parent PID: ${context.parentPid || 'N/A'}`);
    console.log(`   Start Time: ${new Date(context.startTime).toISOString()}`);

    // Resources
    const memUsage = process.memoryUsage();
    console.log('\n📊 Resources (current process):');
    console.log(`   Memory RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    // Execution Chain
    if (context.executionChain && context.executionChain.length > 0) {
      console.log(`\n🔗 Execution Chain (${context.executionChain.length} links):`);
      context.executionChain.slice(-5).forEach((link: any) => {
        console.log(`   [${new Date(link.timestamp).toISOString()}] ${link.type}: ${link.id.slice(-8)}`);
      });
    }

    // Packages
    const packages = this.registry.getPackagesForPID(pid);
    console.log(`\n📦 Packages (${packages.size}):`);
    if (packages.size > 0) {
      for (const pkg of packages) {
        console.log(`   - ${pkg}`);
      }
    } else {
      console.log('   (none)');
    }

    // Recent audit events for this PID
    const auditEntries = this.audit.getEntriesForPid(pid, 5);
    console.log(`\n📜 Recent Audit Events (${auditEntries.length}):`);
    if (auditEntries.length > 0) {
      auditEntries.forEach(entry => {
        console.log(`   [${new Date(entry.timestamp).toISOString()}] ${entry.event}`);
      });
    } else {
      console.log('   (none)');
    }
  }

  async listPackagesForPID(pid: number): Promise<void> {
    const packages = this.registry.getPackagesForPID(pid);

    console.log(`\n📦 Packages for PID ${pid} (${packages.size}):`);
    console.log('-'.repeat(60));

    if (packages.size === 0) {
      console.log('   (no packages installed)');
      return;
    }

    for (const pkg of packages) {
      const parts = pkg.split('@');
      const name = parts.slice(0, -1).join('@') || parts[0];
      const version = parts[parts.length - 1];
      console.log(`   ${name.padEnd(40)} @ ${version}`);
    }
  }

  async checkRegistryHealth(): Promise<void> {
    console.log('\n🏥 Registry Health Check');
    console.log('='.repeat(50));

    const processes = getProcesses();
    const allPIDs = this.registry.getAllPIDs();

    let totalPackages = 0;
    for (const pid of allPIDs) {
      totalPackages += this.registry.getPackagesForPID(pid).size;
    }

    const auditStats = this.audit.getStatistics();

    console.log(`   ✅ Active Contexts: ${processes.size}`);
    console.log(`   ✅ PIDs with Packages: ${allPIDs.length}`);
    console.log(`   ✅ Total Packages: ${totalPackages}`);
    console.log(`   ✅ Audit Entries: ${auditStats.totalEntries}`);
    console.log(`   ✅ Current PID: ${process.pid}`);

    // Test registry connectivity
    console.log('\n   Testing registry connectivity...');
    const testResult = await this.registry.testAuthentication('lodash');
    console.log(`   ${testResult.success ? '✅' : '❌'} Registry: ${testResult.success ? 'Reachable' : 'Unreachable'}`);
    console.log(`   ⏱️  Latency: ${(testResult.duration_ns / 1_000_000).toFixed(2)}ms`);
  }

  async generateQuickReport(): Promise<void> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const report = await this.registry.generateRegistryReport(dayAgo, now);

    console.log('\n📊 Quick Registry Report (Last 24h)');
    console.log('='.repeat(50));
    console.log(`📦 Total Installs: ${report.totalInstalls}`);
    console.log(`👥 Unique PIDs: ${report.uniquePIDs}`);
    console.log(`📚 Unique Packages: ${report.uniquePackages}`);

    if (report.anomalies.length > 0) {
      console.log(`\n⚠️  ${report.anomalies.length} Anomalies:`);
      report.anomalies.forEach(a => {
        console.log(`   ${a.type}: ${a.package} has ${a.versions.length} versions`);
      });
    } else {
      console.log('\n✅ No anomalies detected');
    }

    console.log(`\n📄 Generated at: ${report.generatedAt.toISOString()}`);
    console.log(`   Generated by PID: ${report.generatedBy}`);
  }

  async testRegistryAuth(): Promise<void> {
    console.log('\n🔐 Testing Registry Authentication');
    console.log('='.repeat(50));

    const testPackages = ['lodash', 'express', 'react'];

    for (const pkg of testPackages) {
      const startTime = Bun.nanoseconds();

      try {
        const result = await this.registry.testAuthentication(pkg);
        const duration = result.duration_ns;

        console.log(`   ${result.success ? '✅' : '❌'} ${pkg.padEnd(15)} ${(duration / 1_000_000).toFixed(2)}ms`);
      } catch (error) {
        const duration = Bun.nanoseconds() - startTime;
        console.log(`   ❌ ${pkg.padEnd(15)} FAILED (${(duration / 1_000_000).toFixed(2)}ms)`);
      }
    }
  }

  async showAuditTrail(pid?: number): Promise<void> {
    console.log('\n📜 Audit Trail');
    console.log('='.repeat(50));

    const entries = pid
      ? this.audit.getEntriesForPid(pid, 20)
      : this.audit.getEntriesInRange(Date.now() - 3600000, Date.now()).slice(-20);

    if (entries.length === 0) {
      console.log('   (no audit entries found)');
      return;
    }

    console.log(`   Showing ${entries.length} entries${pid ? ` for PID ${pid}` : ''}:\n`);

    for (const entry of entries) {
      const time = new Date(entry.timestamp).toISOString().slice(11, 19);
      console.log(`   [${time}] PID:${entry.pid} ${entry.event}`);
      if (entry.data && Object.keys(entry.data).length > 0) {
        const dataStr = JSON.stringify(entry.data);
        console.log(`            ${dataStr.slice(0, 60)}${dataStr.length > 60 ? '...' : ''}`);
      }
    }
  }

  async tracePackage(packageName: string): Promise<void> {
    console.log(`\n🔍 Tracing Package: ${packageName}`);
    console.log('='.repeat(50));

    const allPIDs = this.registry.getAllPIDs();
    const versionMap = new Map<string, number[]>();

    for (const pid of allPIDs) {
      const packages = this.registry.getPackagesForPID(pid);
      for (const pkg of packages) {
        // Handle scoped packages like @types/node@20.0.0
        const lastAtIndex = pkg.lastIndexOf('@');
        const name = lastAtIndex > 0 ? pkg.slice(0, lastAtIndex) : pkg;
        const version = lastAtIndex > 0 ? pkg.slice(lastAtIndex + 1) : 'unknown';

        if (name === packageName || name.includes(packageName)) {
          if (!versionMap.has(version)) {
            versionMap.set(version, []);
          }
          versionMap.get(version)!.push(pid);
        }
      }
    }

    if (versionMap.size === 0) {
      console.log(`   ❌ Package "${packageName}" not found in any PID`);
      return;
    }

    console.log(`   📦 Found ${versionMap.size} version(s):\n`);

    const processes = getProcesses();

    for (const [version, pids] of versionMap) {
      console.log(`   📌 Version ${version}:`);
      console.log(`      PIDs: ${pids.join(', ')}`);

      const instances = pids
        .map(pid => processes.get(pid)?.instanceId?.slice(-8) || 'unknown')
        .join(', ');
      console.log(`      Instances: ${instances}`);
    }

    if (versionMap.size > 1) {
      console.log(`\n⚠️  Version Conflict Detected!`);
      console.log(`   Package "${packageName}" has ${versionMap.size} different versions installed`);
      console.log(`   Consider running: bun update ${packageName}`);
    }
  }

  private async prompt(question: string): Promise<string> {
    process.stdout.write(question);

    // Use Bun's readline-like functionality
    const reader = Bun.stdin.stream().getReader();
    const decoder = new TextDecoder();
    let input = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        input += decoder.decode(value);
        if (input.includes('\n')) {
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }

    return input.trim();
  }
}

// Non-interactive commands for scripting
async function runCommand(command: string, args: string[]): Promise<void> {
  const inspector = new RegistryInspector();

  switch (command) {
    case 'ls':
      await inspector.listRegistryContexts();
      break;
    case 'health':
      await inspector.checkRegistryHealth();
      break;
    case 'report':
      await inspector.generateQuickReport();
      break;
    case 'inspect':
      if (args[0]) await inspector.inspectPID(parseInt(args[0]));
      break;
    case 'packages':
      if (args[0]) await inspector.listPackagesForPID(parseInt(args[0]));
      break;
    case 'trace':
      if (args[0]) await inspector.tracePackage(args[0]);
      break;
    case 'test':
      await inspector.testRegistryAuth();
      break;
    default:
      await inspector.runInteractive();
  }
}

// CLI entry point
if (import.meta.path === Bun.main) {
  const args = process.argv.slice(2);
  const command = args[0] || 'interactive';
  const commandArgs = args.slice(1);

  runCommand(command, commandArgs).catch(error => {
    console.error('Inspector failed:', error);
    process.exit(1);
  });
}

export { RegistryInspector, runCommand };
