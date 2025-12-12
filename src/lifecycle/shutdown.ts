import { logger } from "../../examples/logging/bun-logger";

/**
 * Comprehensive graceful shutdown handler using Bun APIs
 */
export class BunGracefulShutdown {
  private cleanupCallbacks: Array<() => Promise<void>> = [];
  private isShuttingDown = false;

  constructor() {
    this.setupSignalHandlers();
    this.setupUnhandledHandlers();
  }

  /**
   * Register cleanup callback
   */
  onCleanup(callback: () => Promise<void>): void {
    this.cleanupCallbacks.push(callback);
    logger.trace("Cleanup callback registered", {
      total_callbacks: this.cleanupCallbacks.length,
    });
  }

  /**
   * Setup signal handlers using Bun-native process API
   */
  private setupSignalHandlers(): void {
    const signals = ["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT"] as const;

    for (const signal of signals) {
      process.on(signal, () => {
        logger.info(`Received ${signal}, initiating graceful shutdown`);
        this.shutdown(signal);
      });
    }

    logger.debug("Signal handlers registered", { signals });
  }

  /**
   * Handle unhandled errors with Bun.context
   */
  private setupUnhandledHandlers(): void {
    // Unhandled rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled promise rejection", {
        promise: promise.toString(),
      }, reason as Error);

      this.shutdown("UNHANDLED_REJECTION");
    });

    // Uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.fatal("Uncaught exception", {}, error);
      this.shutdown("UNCAUGHT_EXCEPTION");
    });
  }

  /**
   * Execute graceful shutdown sequence
   */
  private async shutdown(trigger: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn("Shutdown already in progress");
      return;
    }

    this.isShuttingDown = true;

    const start = Bun.nanoseconds();

    // 1. Stop accepting new work
    logger.info("Stopping new work acceptance");
    // (Implement work queue pause logic here)

    // 2. Wait for ongoing work to complete
    logger.info("Draining work queues");
    await this.drainQueues();

    // 3. Execute cleanup callbacks
    logger.info("Executing cleanup callbacks", {
      count: this.cleanupCallbacks.length,
    });

    for (const callback of this.cleanupCallbacks) {
      try {
        await callback();
      } catch (error) {
        logger.error("Cleanup callback failed", {}, error as Error);
      }
    }

    // 4. Close database connections
    logger.info("Closing database connections");
    await this.closeDatabases();

    // 5. Close HTTP/WebSocket servers
    logger.info("Closing network servers");
    await this.closeServers();

    // 6. Final log flush
    logger.info("Flushing logs");
    await this.flushLogs();

    const duration = Bun.nanoseconds() - start;

    logger.info("Graceful shutdown completed", {
      trigger,
      duration_ns: duration,
      uptime_ms: process.uptime() * 1000,
    });

    // Exit
    process.exit(trigger === "SIGINT" || trigger === "SIGTERM" ? 0 : 1);
  }

  private async drainQueues(): Promise<void> {
    // Wait for up to 30 seconds
    const maxWait = 30000;
    const start = Date.now();

    while (this.hasPendingWork() && Date.now() - start < maxWait) {
      await Bun.sleep(100);
    }

    if (this.hasPendingWork()) {
      logger.warn("Queues not fully drained, forcing shutdown");
    }
  }

  private hasPendingWork(): boolean {
    // Check if any queues have pending items
    return false; // Implement actual logic
  }

  private async closeDatabases(): Promise<void> {
    // Close SQLite connections
    // Implement database close logic
  }

  private async closeServers(): Promise<void> {
    // Close HTTP/WebSocket servers
    // Implement server close logic
  }

  private async flushLogs(): Promise<void> {
    // Ensure all logs are written
    await logger.flush();
  }
}