import { $ } from "bun";
import { logger } from "../logging/bun-logger";

interface CommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  error?: Error;
}

interface GitResult {
  success: boolean;
  output: string;
  error: string;
}

export class BunShellExecutor {
  /**
   * Safe command execution with Bun.shell
   */
  async executeCommand(
    command: string,
    options: { timeout?: number; cwd?: string; env?: Record<string, string> } = {}
  ): Promise<CommandResult> {
    const start = Bun.nanoseconds();

    try {
      // Use Bun.shell ($) for safe command execution
      const proc = await $`sh -c ${command}`.cwd(options.cwd).env({ ...Bun.env, ...options.env });

      const duration = Bun.nanoseconds() - start;

      logger.info("Command executed successfully", {
        command,
        duration_ns: duration,
        exit_code: proc.exitCode,
        stdout_length: proc.stdout?.length || 0,
      });

      return {
        success: true,
        exitCode: proc.exitCode,
        stdout: proc.stdout?.toString() || "",
        stderr: proc.stderr?.toString() || "",
        duration,
      };

    } catch (error) {
      const duration = Bun.nanoseconds() - start;
      const shellError = error as any;

      logger.error("Command execution failed", {
        command,
        duration_ns: duration,
        exit_code: shellError.exitCode || 1,
      });

      return {
        success: false,
        exitCode: shellError.exitCode || 1,
        stdout: shellError.stdout?.toString() || "",
        stderr: shellError.stderr?.toString() || "",
        duration,
        error: shellError,
      };
    }
  }

  /**
   * Pipe commands with Bun.shell
   */
  async pipeCommands(commands: string[]): Promise<string> {
    // Build pipeline using shell commands
    const pipeline = commands.join(' | ');
    const result = await this.executeCommand(pipeline);

    logger.debug("Pipeline executed", { commands: commands.length });

    return result.stdout;
  }

  /**
   * Git operations with error recovery
   */
  async gitOperation(repoPath: string, operation: "pull" | "push" | "status"): Promise<GitResult> {
    const result = await this.executeCommand(
      `git -C ${repoPath} ${operation}`,
      { cwd: repoPath }
    );

    if (result.success) {
      logger.info(`Git ${operation} successful`, { repo_path: repoPath });
    } else {
      logger.warn(`Git ${operation} failed`, {
        repo_path: repoPath,
        stderr: result.stderr.slice(0, 200),
      });
    }

    return {
      success: result.success,
      output: result.stdout,
      error: result.stderr,
    };
  }
}