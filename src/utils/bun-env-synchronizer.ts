#!/usr/bin/env bun

/**
 * 🎯 Bun Environment Synchronization Utility
 *
 * Ensures process.env and Bun.env stay synchronized for consistent behavior.
 * Handles special cases like TZ and undefined values.
 */

export interface EnvSyncOptions {
  /** Keys to exclude from synchronization */
  excludeKeys?: string[];
  /** Whether to make Bun.env read-only */
  makeBunEnvReadOnly?: boolean;
  /** Whether to update Bun.$?.env */
  updateBunShell?: boolean;
  /** Custom value transformer */
  valueTransformer?: (value: any) => string;
}

/**
 * Synchronize process.env with Bun.env to ensure consistency
 *
 * This utility ensures that environment variables accessed via process.env
 * match those accessed via Bun.env, which is important for cross-platform
 * compatibility and testing consistency.
 */
export class BunEnvSynchronizer {
  private options: Required<EnvSyncOptions>;

  constructor(options: EnvSyncOptions = {}) {
    this.options = {
      excludeKeys: options.excludeKeys ?? ['TZ'],
      makeBunEnvReadOnly: options.makeBunEnvReadOnly ?? true,
      updateBunShell: options.updateBunShell ?? true,
      valueTransformer: options.valueTransformer ?? ((value: any) => String(value)),
    };
  }

  /**
   * Synchronize environment variables
   *
   * @param sourceEnv Source environment (defaults to Bun.env if available)
   * @param targetEnv Target environment (defaults to process.env)
   */
  sync(
    sourceEnv: Record<string, any> = (globalThis as any).Bun?.env || process.env,
    targetEnv: Record<string, string> = process.env
  ): void {
    console.log('🔄 Synchronizing environment variables...');

    // Remove keys from target that don't exist in source (except excluded)
    this.cleanupTargetEnv(targetEnv, sourceEnv);

    // Add/update keys from source to target
    this.updateTargetEnv(sourceEnv, targetEnv);

    // Update Bun shell environment if requested
    if (this.options.updateBunShell) {
      this.updateBunShell(targetEnv);
    }

    console.log('✅ Environment synchronization complete');
  }

  /**
   * Validate environment synchronization
   */
  validate(sourceEnv?: Record<string, any>): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Use provided source or default to Bun.env
    const bunEnv = sourceEnv || (globalThis as any).Bun?.env;
    if (!bunEnv) {
      issues.push('Source environment not available');
      return { isValid: false, issues };
    }

    // Check synchronization
    for (const [key, value] of Object.entries(bunEnv)) {
      if (this.options.excludeKeys.includes(key)) continue;

      const processValue = process.env[key];
      const expectedValue = value === undefined ? undefined : this.options.valueTransformer(value);

      if (processValue !== expectedValue) {
        issues.push(`Key '${key}': process.env has '${processValue}', expected '${expectedValue}'`);
      }
    }

    // Check for extra keys in process.env
    for (const key of Object.keys(process.env)) {
      if (this.options.excludeKeys.includes(key)) continue;

      if (!(key in bunEnv)) {
        issues.push(`Extra key in process.env: '${key}'`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private cleanupTargetEnv(
    targetEnv: Record<string, string>,
    sourceEnv: Record<string, any>
  ): void {
    const keysToDelete: string[] = [];

    for (const key of Object.keys(targetEnv)) {
      if (this.options.excludeKeys.includes(key)) continue;

      if (!(key in sourceEnv) || sourceEnv[key] === undefined) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      delete targetEnv[key];
    }

    if (keysToDelete.length > 0) {
      console.log(`   🧹 Cleaned up ${keysToDelete.length} environment variables`);
    }
  }

  private updateTargetEnv(
    sourceEnv: Record<string, any>,
    targetEnv: Record<string, string>
  ): void {
    let updatedCount = 0;

    for (const [key, value] of Object.entries(sourceEnv)) {
      if (this.options.excludeKeys.includes(key)) continue;
      if (value === undefined) continue;

      const stringValue = this.options.valueTransformer(value);
      if (targetEnv[key] !== stringValue) {
        targetEnv[key] = stringValue;
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`   📝 Updated ${updatedCount} environment variables`);
    }
  }

  private updateBunShell(targetEnv: Record<string, string>): void {
    try {
      // Update Bun shell environment if available
      const bunShell = (globalThis as any).Bun?.$;
      if (bunShell?.env) {
        bunShell.env(targetEnv);
        console.log('   🐚 Updated Bun shell environment');
      }
    } catch (error) {
      console.warn('   ⚠️  Failed to update Bun shell environment:', error);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick synchronization function (similar to the original code)
 */
export function syncEnvironments(
  sourceEnv: Record<string, any> = (globalThis as any).Bun?.env || process.env,
  options: EnvSyncOptions = {}
): void {
  const synchronizer = new BunEnvSynchronizer(options);
  synchronizer.sync(sourceEnv, process.env);
}

/**
 * Validate current environment synchronization
 */
export function validateEnvSync(options: EnvSyncOptions = {}): { isValid: boolean; issues: string[] } {
  const synchronizer = new BunEnvSynchronizer(options);
  return synchronizer.validate();
}

/**
 * Create a synchronized environment snapshot
 */
export function createEnvSnapshot(): {
  processEnv: Record<string, string>;
  bunEnv: Record<string, any>;
  synchronized: boolean;
  issues: string[];
} {
  const bunEnv = (globalThis as any).Bun?.env || {};
  const processEnv = { ...process.env };

  const validation = validateEnvSync();

  return {
    processEnv,
    bunEnv,
    synchronized: validation.isValid,
    issues: validation.issues,
  };
}

// ============================================================================
// COMPATIBILITY LAYER
// ============================================================================

/**
 * Compatibility function that mimics the original test harness behavior
 */
export function legacyEnvSync(harness: { bunEnv: Record<string, any> }): void {
  console.log('🔄 Performing legacy environment synchronization...');

  // Delete keys from process.env that aren't in harness.bunEnv (except TZ)
  for (const key in process.env) {
    if (key === "TZ") continue;
    if (key in harness.bunEnv) continue;
    delete process.env[key];
  }

  // Add keys from harness.bunEnv to process.env (except TZ and undefined)
  for (const key in harness.bunEnv) {
    if (key === "TZ") continue;
    if (harness.bunEnv[key] === undefined) continue;
    process.env[key] = harness.bunEnv[key] + "";
  }

  // Update Bun shell if available
  if ((globalThis as any).Bun?.$?.env) {
    (globalThis as any).Bun.$.env(process.env);
  }

  console.log('✅ Legacy environment synchronization complete');
}

// ============================================================================
// INTEGRATION WITH WORKER SYSTEM
// ============================================================================

/**
 * Environment synchronization for worker processes
 */
export class WorkerEnvSynchronizer extends BunEnvSynchronizer {
  constructor() {
    super({
      excludeKeys: ['TZ', 'NODE_ENV', 'BUN_WORKER_ID'],
      makeBunEnvReadOnly: false, // Workers might need to modify env
      updateBunShell: false, // Workers don't have shell context
    });
  }

  /**
   * Sync environment for a specific worker
   */
  syncForWorker(
    workerId: string,
    workerEnv: Record<string, any> = {}
  ): Record<string, string> {
    // Create worker-specific environment
    const baseEnv = (globalThis as any).Bun?.env || process.env;
    const workerSpecificEnv = {
      ...baseEnv,
      BUN_WORKER_ID: workerId,
      ...workerEnv,
    };

    // Create isolated environment for worker
    const workerProcessEnv: Record<string, string> = {};

    // Sync to worker environment (not process.env)
    this.sync(workerSpecificEnv, workerProcessEnv);

    // Ensure BUN_WORKER_ID is set in the result
    workerProcessEnv.BUN_WORKER_ID = workerId;

    return workerProcessEnv;
  }
}

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Test environment synchronization
 */
export async function testEnvSynchronization(): Promise<void> {
  console.log('🧪 Testing environment synchronization...');

  // Create test environments
  const testBunEnv = {
    TEST_VAR: 'test_value',
    ANOTHER_VAR: 'another_value',
    UNDEFINED_VAR: undefined,
    TZ: 'America/New_York', // Should be excluded
  };

  const originalProcessEnv = { ...process.env };

  try {
    // Test synchronization
    const synchronizer = new BunEnvSynchronizer({
      excludeKeys: ['TZ'],
    });

    synchronizer.sync(testBunEnv, process.env);

    // Validate
    const validation = synchronizer.validate();
    if (validation.isValid) {
      console.log('✅ Environment synchronization test passed');
    } else {
      console.log('❌ Environment synchronization test failed:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));
    }

  } finally {
    // Restore original environment
    Object.keys(process.env).forEach(key => {
      if (!(key in originalProcessEnv)) {
        delete process.env[key];
      } else {
        process.env[key] = originalProcessEnv[key];
      }
    });
  }
}