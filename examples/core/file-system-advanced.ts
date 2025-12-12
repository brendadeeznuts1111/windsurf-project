import { file, write } from "bun";
import { unlink, mkdir, rm } from "fs/promises";
import { logger } from "../logging/bun-logger";

interface OperationStats {
  processed: number;
  errors: number;
  totalSize: number;
}

interface LogEntry {
  trace_id?: string;
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  pid: number;
  hostname: string;
}

export class BunFileSystemManager {
  /**
   * Stream processing for massive files (multi-GB) with Bun.file()
   */
  async *streamProcessLogs(
    logPath: string,
    filterFn: (line: string) => boolean
  ): AsyncGenerator<string, void, unknown> {
    const logFile = file(logPath);
    const stream = logFile.stream();
    const decoder = new TextDecoder();
    let buffer = "";

    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line

        for (const line of lines) {
          if (filterFn(line)) {
            yield line;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Process remaining buffer
    if (buffer && filterFn(buffer)) {
      yield buffer;
    }
  }

  /**
   * Watch files/directories with Bun.watch
   */
  watchDirectory(
    path: string,
    callback: (event: { type: string; path: string }) => void
  ) {
    const watcher = Bun.watch(path, (event, filename) => {
      logger.debug("File system event", {
        event,
        filename,
        path,
      });
      callback({ type: event, path: filename || path });
    });

    return {
      stop: () => watcher.stop(),
      ref: () => watcher.ref(),
      unref: () => watcher.unref(),
    };
  }

  /**
   * Mass file operations with Bun.Glob and parallel processing
   */
  async bulkFileOperations(pattern: string): Promise<OperationStats> {
    const glob = new Bun.Glob(pattern);
    const files = Array.from(glob.scanSync());
    const stats = { processed: 0, errors: 0, totalSize: 0 };

    // Parallel file operations
    const results = await Promise.all(
      files.map(async (filePath) => {
        try {
          const f = Bun.file(filePath);
          const content = await f.text();
          const size = f.size;

          // Transform content
          const transformed = this.transformContent(content);

          // Write back
          await Bun.write(filePath, transformed);

          return { success: true, size };
        } catch (error) {
          logger.error(`Failed to process ${filePath}`, { error: (error as Error).message });
          return { success: false, size: 0 };
        }
      })
    );

    // Update stats
    results.forEach((r) => {
      if (r.success) {
        stats.processed++;
        stats.totalSize += r.size;
      } else {
        stats.errors++;
      }
    });

    logger.info("Bulk operation completed", stats);
    return stats;
  }

  /**
   * File integrity checking using Bun.hash()
   */
  async verifyFileIntegrity(
    filePath: string,
    expectedHash: string
  ): Promise<boolean> {
    const f = file(filePath);
    const content = await f.arrayBuffer();
    const actualHash = Bun.hash(content).toString();

    const verified = actualHash === expectedHash;

    logger.info("File integrity check", {
      file_path: filePath,
      verified,
    });

    return verified;
  }

  /**
   * Atomic file replacement with Bun.write()
   */
  async atomicReplace(
    targetPath: string,
    newContent: string | ArrayBuffer
  ): Promise<void> {
    const tempPath = `${targetPath}.tmp.${process.pid}`;

    try {
      // Write to temp file
      await write(tempPath, newContent);

      // Verify temp file
      const tempFile = file(tempPath);
      if (!(await tempFile.exists())) {
        throw new Error("Temp file creation failed");
      }

      // Atomic rename using Bun.spawn
      const proc = Bun.spawn({
        cmd: ["mv", tempPath, targetPath],
        stdout: "pipe",
        stderr: "pipe",
      });
      await proc.exited;

      logger.debug("Atomic file replacement successful", {
        target_path: targetPath,
        temp_path: tempPath,
      });
    } catch (error) {
      logger.error("Atomic replacement failed", { target_path: targetPath, error: (error as Error).message });
      // Cleanup temp file
      try {
        await unlink(tempPath);
      } catch {}
      throw error;
    }
  }

  private transformContent(content: string): string {
    // Simple transformation example - could be more complex
    return content.toUpperCase();
  }
}