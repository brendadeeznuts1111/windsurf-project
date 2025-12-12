import { spawn } from "bun";
import { Database } from "bun:sqlite";
import { logger } from "../logging/bun-logger";

interface SystemMetrics {
  timestamp: string;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  cpu: {
    user: number;
    system: number;
    percent: number;
  };
  eventLoop: {
    lag: number;
  };
  collection_duration_ns: number;
}

interface ProcessTree {
  pid: number;
  command: string;
  children?: ProcessTree[];
}

interface DiskUsage {
  path: string;
  size: string;
  timestamp: string;
}

export class BunSystemMonitor {
  private db: Database;

  constructor() {
    this.db = new Database(":memory:");
    this.initMetricsSchema();
  }

  private initMetricsSchema(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        timestamp TEXT PRIMARY KEY,
        data TEXT
      )
    `);
  }

  /**
   * Real-time process monitoring with Bun.spawn()
   */
  monitorProcess(pid: number) {
    return spawn({
      cmd: ["ps", "-p", pid.toString(), "-o", "pid,pcpu,pmem,rss,vsz,time,command"],
      stdout: "pipe",
      stderr: "pipe",
      onExit: (proc, exitCode) => {
        logger.info("Process monitoring ended", { pid, exitCode });
      },
    });
  }

  /**
   * System resource usage with Bun.nanoseconds()
   */
  getSystemMetrics(): SystemMetrics {
    const start = Bun.nanoseconds();

    // Memory usage
    const memUsage = process.memoryUsage();

    // CPU usage (requires sampling)
    const cpuUsage = process.cpuUsage();
    const cpuPercent = this.calculateCpuPercent(cpuUsage);

    // Event loop lag (simplified)
    const eventLoopLag = this.measureEventLoopLag();

    const duration = Bun.nanoseconds() - start;

    const metrics = {
      timestamp: new Date().toISOString(),
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers || 0,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        percent: cpuPercent,
      },
      eventLoop: {
        lag: eventLoopLag,
      },
      collection_duration_ns: duration,
    };

    // Store in SQLite for time-series analysis
    this.db.run(
      `INSERT INTO system_metrics (timestamp, data) VALUES (?, ?)`,
      metrics.timestamp,
      JSON.stringify(metrics)
    );

    logger.trace("System metrics collected", { duration_ns: duration });
    return metrics;
  }

  private calculateCpuPercent(cpuUsage: NodeJS.CpuUsage): number {
    // Simplified CPU percentage calculation
    return (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  }

  private measureEventLoopLag(): number {
    // Simplified event loop lag measurement
    const start = Date.now();
    setImmediate(() => {
      // This is a rough approximation
    });
    return Date.now() - start;
  }

  /**
   * Process tree analysis using ps command
   */
  async analyzeProcessTree(targetPid: number): Promise<ProcessTree[]> {
    try {
      const proc = spawn({
        cmd: ["ps", "-eo", "pid,ppid,comm"],
        stdout: "pipe",
      });

      const output = await new Response(proc.stdout).text();
      const tree = this.parsePsOutput(output, targetPid);

      logger.debug("Process tree analyzed", {
        target_pid: targetPid,
        process_count: tree.length
      });

      return tree;
    } catch (error) {
      logger.warn("pstree not available, using fallback", {}, error as Error);
      return this.fallbackProcessTree(targetPid);
    }
  }

  private parsePsOutput(output: string, targetPid: number): ProcessTree[] {
    const lines = output.trim().split('\n').slice(1); // Skip header
    const processes: ProcessTree[] = [];

    for (const line of lines) {
      const [pid, ppid, comm] = line.trim().split(/\s+/);
      if (parseInt(pid) === targetPid) {
        processes.push({
          pid: parseInt(pid),
          command: comm,
        });
      }
    }

    return processes;
  }

  private fallbackProcessTree(targetPid: number): ProcessTree[] {
    // Simple fallback that just returns the target process
    return [{
      pid: targetPid,
      command: "unknown",
    }];
  }

  /**
   * Disk usage monitoring with du command
   */
  async getDiskUsage(path: string): Promise<DiskUsage> {
    const proc = spawn({
      cmd: ["du", "-sh", path],
      stdout: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    const match = output.match(/([\d.]+[KMG]?)\s+/);

    const usage = {
      path,
      size: match ? match[1] : "0",
      timestamp: new Date().toISOString(),
    };

    logger.debug("Disk usage checked", usage);
    return usage;
  }
}