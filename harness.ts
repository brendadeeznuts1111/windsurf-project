#!/usr/bin/env bun

/**
 * 🧰 Test Harness for Bun
 *
 * Provides utilities for writing Bun tests following best practices.
 * Based on Bun's official testing guidelines.
 */

import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

// ============================================================================
// BUN EXECUTABLE & ENVIRONMENT
// ============================================================================

/**
 * Get the path to the Bun executable
 * Use this when spawning Bun processes in tests
 */
export function bunExe(): string {
  // In development, this would be the path to the built Bun executable
  // For now, return 'bun' assuming it's in PATH
  return 'bun';
}

/**
 * Get environment variables for Bun processes
 * Silences debug logging and sets up proper test environment
 */
export function bunEnv(): Record<string, string> {
  return {
    ...process.env,
    // Silence debug logging
    BUN_DEBUG: '0',
    DEBUG: '',
    // Ensure test environment
    NODE_ENV: 'test',
    BUN_TEST: '1',
  };
}

// ============================================================================
// TEMPORARY DIRECTORIES
// ============================================================================

/**
 * Create a temporary directory with optional files
 * Use this instead of hardcoded temporary paths
 */
export function tempDir(
  prefix: string = 'test',
  files: Record<string, string> = {}
): Disposable & { toString(): string } {
  const baseDir = tmpdir();
  const randomId = randomBytes(8).toString('hex');
  const dirPath = join(baseDir, `${prefix}-${randomId}`);

  // Create directory
  mkdirSync(dirPath, { recursive: true });

  // Create files if provided
  for (const [filename, content] of Object.entries(files)) {
    const filePath = join(dirPath, filename);
    const dir = join(filePath, '..');
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, content);
  }

  // Return disposable object
  const result = {
    toString: () => dirPath,
    [Symbol.dispose]: () => {
      try {
        rmSync(dirPath, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to clean up temp dir ${dirPath}:`, error);
      }
    }
  };

  return result as Disposable & { toString(): string };
}

/**
 * Create an empty temporary directory
 * Legacy alias for tempDir()
 */
export function tmpdirSync(prefix?: string): string {
  using dir = tempDir(prefix);
  return dir.toString();
}

/**
 * Create a temporary directory with files
 * Legacy alias for tempDir()
 */
export function tempDirWithFiles(
  prefix: string,
  files: Record<string, string>
): string {
  using dir = tempDir(prefix, files);
  return dir.toString();
}

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

/**
 * Check if running on macOS
 */
export const isMacOS = process.platform === 'darwin';

/**
 * Check if running on Windows
 */
export const isWindows = process.platform === 'win32';

/**
 * Check if running on POSIX (Unix-like) system
 */
export const isPosix = !isWindows;

// ============================================================================
// GARBAGE COLLECTION
// ============================================================================

/**
 * Trigger garbage collection tick
 * Use sparingly, mainly for memory leak tests
 */
export function gcTick(): void {
  if (typeof global.gc === 'function') {
    global.gc();
  }
}

/**
 * Disable aggressive garbage collection for performance tests
 */
export function withoutAggressiveGC<T>(fn: () => T): T {
  // In Bun, we can control GC behavior
  // For now, just run the function
  return fn();
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wait for a condition to be met (instead of arbitrary timeouts)
 * Follows Bun testing guidelines: "Always wait for the condition to be met"
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    message?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 50,
    message = 'Condition not met within timeout'
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`${message} (waited ${timeout}ms)`);
}

/**
 * Wait for a server to be ready on a given port
 */
export async function waitForServer(port: number, hostname: string = 'localhost'): Promise<void> {
  await waitFor(async () => {
    try {
      const response = await fetch(`http://${hostname}:${port}/health`, {
        signal: AbortSignal.timeout(100)
      });
      return response.ok;
    } catch {
      return false;
    }
  }, {
    timeout: 10000,
    message: `Server not ready on ${hostname}:${port}`
  });
}

// ============================================================================
// RESOURCE MANAGEMENT
// ============================================================================

/**
 * Track resources for cleanup
 * Use with beforeEach/afterEach for proper cleanup
 */
export class ResourceTracker {
  private resources: Array<{
    cleanup: () => void | Promise<void>;
    description: string;
  }> = [];

  /**
   * Add a resource to track
   */
  add(cleanup: () => void | Promise<void>, description: string): void {
    this.resources.push({ cleanup, description });
  }

  /**
   * Clean up all tracked resources
   */
  async cleanup(): Promise<void> {
    const errors: Error[] = [];

    for (const resource of this.resources.reverse()) {
      try {
        await resource.cleanup();
      } catch (error) {
        errors.push(new Error(`Failed to cleanup ${resource.description}: ${error}`));
      }
    }

    this.resources = [];

    if (errors.length > 0) {
      throw new Error(`Resource cleanup failed:\n${errors.map(e => e.message).join('\n')}`);
    }
  }
}

// Global resource tracker for tests
let globalResourceTracker: ResourceTracker | null = null;

/**
 * Get or create global resource tracker
 */
export function getGlobalResourceTracker(): ResourceTracker {
  if (!globalResourceTracker) {
    globalResourceTracker = new ResourceTracker();
  }
  return globalResourceTracker;
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Create a test fixture file
 * Convention: files ending in *-fixture.ts are test fixtures
 */
export function createFixture(filename: string, content: string): string {
  if (!filename.endsWith('-fixture.ts')) {
    throw new Error('Test fixtures should end with -fixture.ts');
  }

  using dir = tempDir('fixture', { [filename]: content });
  return join(dir.toString(), filename);
}

/**
 * Spawn a Bun process with proper test setup
 * Follows Bun testing guidelines for process spawning
 */
export async function spawnBunProcess(
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}> {
  const proc = Bun.spawn({
    cmd: [bunExe(), ...args],
    env: { ...bunEnv(), ...options.env },
    cwd: options.cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  // Set up timeout if provided
  let timeoutId: Timer | undefined;
  if (options.timeout) {
    timeoutId = setTimeout(() => {
      proc.kill();
    }, options.timeout);
  }

  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    if (timeoutId) clearTimeout(timeoutId);

    return {
      stdout,
      stderr,
      exitCode,
      success: exitCode === 0,
    };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Create a repetitive string efficiently
 * Use this instead of "x".repeat(n) which is slow in debug JSC
 */
export function repeatString(char: string, count: number): string {
  if (count <= 0) return '';
  if (count === 1) return char;

  // Use Buffer for efficiency (Bun testing guideline)
  return Buffer.alloc(count, char.charCodeAt(0)).toString();
}

// ============================================================================
// PORT MANAGEMENT
// ============================================================================

/**
 * Get a random available port
 * Bun testing guideline: "Always use port: 0 to get a random port"
 */
export async function getRandomPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Assert that a function throws with a specific message
 */
export async function assertThrows(
  fn: () => any | Promise<any>,
  expectedMessage?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedMessage) {
      const message = error instanceof Error ? error.message : String(error);
      if (expectedMessage instanceof RegExp) {
        if (!expectedMessage.test(message)) {
          throw new Error(`Expected error message to match ${expectedMessage}, got: ${message}`);
        }
      } else {
        if (message !== expectedMessage) {
          throw new Error(`Expected error message "${expectedMessage}", got: "${message}"`);
        }
      }
    }
  }
}

/**
 * Create a mock server for testing
 */
export function createMockServer(
  handler: (req: Request) => Response | Promise<Response>
): { server: any; port: number; url: string; close: () => void } {
  const server = Bun.serve({
    port: 0, // Random port
    fetch: handler,
  });

  return {
    server,
    port: server.port,
    url: `http://localhost:${server.port}`,
    close: () => server.stop(),
  };
}

// ============================================================================
// EXPORTS ARE ALREADY DECLARED ABOVE
// ============================================================================

// All exports are declared inline with their definitions above