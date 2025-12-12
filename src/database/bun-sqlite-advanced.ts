import { Database, Statement } from "bun:sqlite";
import { logger } from "../../examples/logging/bun-logger";

interface LogEntry {
  trace_id?: string;
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  pid: number;
  hostname: string;
  // Common identifier properties
  propterid?: string;
  crossReferenceId?: string;
  logId?: string;
}

export class BunSQLiteAdvanced {
  private db: Database;
  private preparedStatements: Map<string, Statement>;

  constructor(path: string) {
    // Open with advanced options
    this.db = new Database(path, {
      create: true,
      readwrite: true,
    });

    // Enable Write-Ahead Logging for concurrent access
    this.db.run("PRAGMA journal_mode = WAL");

    // Enable foreign keys
    this.db.run("PRAGMA foreign_keys = ON");

    // Performance tuning
    this.db.run("PRAGMA synchronous = NORMAL");
    this.db.run("PRAGMA cache_size = -64000"); // 64MB cache

    this.preparedStatements = new Map();

    // Create logs table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        level TEXT,
        message TEXT,
        context TEXT,
        error TEXT,
        pid INTEGER,
        hostname TEXT
      )
    `);

    logger.info("SQLite advanced connection established", {
      path,
      journal_mode: "WAL",
    });
  }

  /**
   * Prepared statement caching for performance
   */
  getPreparedStatement(sql: string): Statement {
    if (!this.preparedStatements.has(sql)) {
      const stmt = this.db.prepare(sql);
      this.preparedStatements.set(sql, stmt);
      logger.trace("Prepared statement created", { sql: sql.slice(0, 50) });
    }

    return this.preparedStatements.get(sql)!;
  }

  /**
   * Bulk insert with transactions
   */
  async bulkInsertLogs(logs: LogEntry[]): Promise<number> {
    const stmt = this.getPreparedStatement(`
      INSERT INTO logs (id, timestamp, level, message, context, error, pid, hostname)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;

    this.db.transaction(() => {
      for (const log of logs) {
        stmt.run(
          log.trace_id || Bun.randomUUIDv7(),
          log.timestamp,
          log.level,
          log.message,
          log.context ? JSON.stringify(log.context) : null,
          log.error ? JSON.stringify(log.error) : null,
          log.pid,
          log.hostname
        );
        inserted++;
      }
    })();

    logger.debug("Bulk insert completed", { inserted, total: logs.length });
    return inserted;
  }

  /**
   * Streaming query results for large datasets
   */
  async *streamQuery(sql: string, params: any[] = []): AsyncGenerator<any, void, unknown> {
    const stmt = this.getPreparedStatement(sql);
    const iter = stmt.iterate(...params);

    for (const row of iter) {
      yield row;
    }

    logger.trace("Stream query completed", { sql: sql.slice(0, 50) });
  }

  /**
   * Custom SQLite function for log parsing
   */
  registerLogParser(): void {
    // Register custom SQL function
    this.db.createFunction("PARSE_LOG", (logLine: string) => {
      const match = logLine.match(/\[([^\]]+)\] (\w+): (.+)/);
      if (!match) return null;

      return JSON.stringify({
        timestamp: match[1],
        level: match[2],
        message: match[3],
      });
    });

    logger.info("Custom SQLite function registered: PARSE_LOG");
  }

  /**
   * Backup database using SQLite backup API
   */
  async backup(backupPath: string): Promise<void> {
    const start = Bun.nanoseconds();

    // Use backup API
    this.db.backup(backupPath, {
      progress: (status) => {
        logger.debug("Backup progress", {
          remaining: status.remaining,
          page_count: status.pageCount,
        });
      },
    });

    const duration = Bun.nanoseconds() - start;

    logger.info("Database backup completed", {
      backup_path: backupPath,
      duration_ns: duration,
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    logger.info("SQLite connection closed");
  }
}