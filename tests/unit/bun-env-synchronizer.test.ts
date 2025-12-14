#!/usr/bin/env bun

/**
 * 🧪 Bun Environment Synchronizer Tests
 *
 * Tests for environment variable synchronization between process.env and Bun.env
 */

import { test, describe, beforeEach, afterEach } from 'bun:test';
import { expect } from 'bun:test';
import {
  BunEnvSynchronizer,
  syncEnvironments,
  validateEnvSync,
  createEnvSnapshot,
  legacyEnvSync,
  WorkerEnvSynchronizer,
  testEnvSynchronization,
} from '../src/utils/bun-env-synchronizer';

describe('BunEnvSynchronizer', () => {
  let synchronizer: BunEnvSynchronizer;
  let originalEnv: Record<string, string>;

  beforeEach(() => {
    synchronizer = new BunEnvSynchronizer({
      excludeKeys: ['TZ'],
    });
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  });

  test('synchronizes environments correctly', () => {
    const testBunEnv = {
      TEST_VAR: 'test_value',
      ANOTHER_VAR: 'another_value',
      UNDEFINED_VAR: undefined,
      TZ: 'America/New_York', // Should be excluded
    };

    synchronizer.sync(testBunEnv, process.env);

    expect(process.env.TEST_VAR).toBe('test_value');
    expect(process.env.ANOTHER_VAR).toBe('another_value');
    expect(process.env.UNDEFINED_VAR).toBeUndefined();
    expect(process.env.TZ).toBe(originalEnv.TZ); // Should not be changed
  });

  test('validates synchronization correctly', () => {
    const testBunEnv = {
      TEST_VAR: 'test_value',
      ANOTHER_VAR: 'another_value',
    };

    synchronizer.sync(testBunEnv, process.env);

    const validation = synchronizer.validate();
    expect(validation.isValid).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });

  test('detects synchronization issues', () => {
    // Manually set an out-of-sync value
    process.env.OUT_OF_SYNC = 'wrong_value';

    const testBunEnv = {
      OUT_OF_SYNC: 'correct_value',
    };

    synchronizer.sync(testBunEnv, process.env);

    // Now manually break sync
    process.env.OUT_OF_SYNC = 'wrong_again';

    const validation = synchronizer.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.issues).toContain("Key 'OUT_OF_SYNC': process.env has 'wrong_again', expected 'correct_value'");
  });

  test('excludes specified keys', () => {
    const testBunEnv = {
      TZ: 'Europe/London',
      INCLUDED_VAR: 'should_be_included',
    };

    synchronizer.sync(testBunEnv, process.env);

    expect(process.env.TZ).toBe(originalEnv.TZ); // Should not change
    expect(process.env.INCLUDED_VAR).toBe('should_be_included');
  });

  test('handles undefined values correctly', () => {
    const testBunEnv = {
      UNDEFINED_VAR: undefined,
      NULL_VAR: null,
      VALID_VAR: 'valid',
    };

    synchronizer.sync(testBunEnv, process.env);

    expect(process.env.UNDEFINED_VAR).toBeUndefined();
    expect(process.env.NULL_VAR).toBe('null'); // null becomes string
    expect(process.env.VALID_VAR).toBe('valid');
  });
});

describe('Utility Functions', () => {
  let originalEnv: Record<string, string>;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  });

  test('syncEnvironments works', () => {
    const testEnv = {
      TEST_SYNC: 'synced_value',
      TZ: 'should_be_ignored',
    };

    syncEnvironments(testEnv);

    expect(process.env.TEST_SYNC).toBe('synced_value');
    expect(process.env.TZ).toBe(originalEnv.TZ); // Should not change
  });

  test('validateEnvSync works', () => {
    const testEnv = {
      TEST_VALIDATE: 'validate_value',
    };

    syncEnvironments(testEnv);

    const validation = validateEnvSync();
    expect(validation.isValid).toBe(true);
  });

  test('createEnvSnapshot works', () => {
    const snapshot = createEnvSnapshot();

    expect(snapshot).toHaveProperty('processEnv');
    expect(snapshot).toHaveProperty('bunEnv');
    expect(snapshot).toHaveProperty('synchronized');
    expect(snapshot).toHaveProperty('issues');
    expect(typeof snapshot.synchronized).toBe('boolean');
  });
});

describe('Legacy Compatibility', () => {
  let originalEnv: Record<string, string>;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  });

  test('legacyEnvSync mimics original behavior', () => {
    const harness = {
      bunEnv: {
        LEGACY_TEST: 'legacy_value',
        UNDEFINED_TEST: undefined,
        TZ: 'should_be_ignored',
        EXISTING_VAR: 'updated_value',
      }
    };

    // Add an existing variable
    process.env.EXISTING_VAR = 'old_value';
    process.env.EXTRA_VAR = 'should_be_removed';

    legacyEnvSync(harness);

    expect(process.env.LEGACY_TEST).toBe('legacy_value');
    expect(process.env.UNDEFINED_TEST).toBeUndefined();
    expect(process.env.TZ).toBe(originalEnv.TZ); // Should not change
    expect(process.env.EXISTING_VAR).toBe('updated_value');
    expect(process.env.EXTRA_VAR).toBeUndefined(); // Should be removed
  });
});

describe('Worker Environment Synchronization', () => {
  test('creates worker-specific environments', () => {
    const workerSync = new WorkerEnvSynchronizer();

    const workerEnv = workerSync.syncForWorker('worker-1', {
      WORKER_VAR: 'worker_value',
    });

    expect(workerEnv.BUN_WORKER_ID).toBe('worker-1');
    expect(workerEnv.WORKER_VAR).toBe('worker_value');
    expect(workerEnv.TZ).toBe(process.env.TZ); // Should be included
    expect(workerEnv.NODE_ENV).toBeUndefined(); // Should be excluded
  });

  test('excludes worker-specific keys', () => {
    const workerSync = new WorkerEnvSynchronizer();

    const baseEnv = {
      NODE_ENV: 'development',
      TZ: 'America/New_York',
      INCLUDED_VAR: 'should_be_included',
    };

    const workerEnv = workerSync.syncForWorker('worker-1', {}, baseEnv);

    expect(workerEnv.NODE_ENV).toBeUndefined(); // Excluded
    expect(workerEnv.TZ).toBeUndefined(); // Excluded
    expect(workerEnv.INCLUDED_VAR).toBe('should_be_included');
    expect(workerEnv.BUN_WORKER_ID).toBe('worker-1');
  });
});

describe('Integration Tests', () => {
  test('handles Bun.env availability', () => {
    const bunEnv = (globalThis as any).Bun?.env;

    if (bunEnv) {
      // If Bun.env is available, test real synchronization
      const synchronizer = new BunEnvSynchronizer();
      synchronizer.sync();

      const validation = synchronizer.validate();
      expect(validation.isValid).toBe(true);
    } else {
      console.log('⚠️  Bun.env not available, skipping real sync test');
    }
  });

  test('testEnvSynchronization runs without errors', async () => {
    // This should run without throwing
    await expect(testEnvSynchronization()).resolves.toBeUndefined();
  });
});

describe('Error Handling', () => {
  test('handles missing Bun.env gracefully', () => {
    // Temporarily mock Bun.env as undefined
    const originalBun = (globalThis as any).Bun;
    (globalThis as any).Bun = undefined;

    try {
      const synchronizer = new BunEnvSynchronizer();
      synchronizer.sync();

      // Should not throw and should use process.env as source
      expect(process.env).toBeDefined();
    } finally {
      // Restore
      (globalThis as any).Bun = originalBun;
    }
  });

  test('handles Bun shell update failures gracefully', () => {
    // This should not throw even if Bun shell update fails
    const synchronizer = new BunEnvSynchronizer({
      updateBunShell: true,
    });

    expect(() => synchronizer.sync()).not.toThrow();
  });
});

describe('Custom Options', () => {
  test('custom value transformer works', () => {
    const synchronizer = new BunEnvSynchronizer({
      valueTransformer: (value: any) => `transformed_${String(value)}`,
    });

    const testEnv = {
      CUSTOM_VAR: 'test_value',
    };

    synchronizer.sync(testEnv, process.env);

    expect(process.env.CUSTOM_VAR).toBe('transformed_test_value');
  });

  test('custom exclude keys work', () => {
    const synchronizer = new BunEnvSynchronizer({
      excludeKeys: ['CUSTOM_EXCLUDE'],
    });

    const testEnv = {
      CUSTOM_EXCLUDE: 'should_not_change',
      NORMAL_VAR: 'should_change',
    };

    const originalExcludeValue = process.env.CUSTOM_EXCLUDE;
    synchronizer.sync(testEnv, process.env);

    expect(process.env.CUSTOM_EXCLUDE).toBe(originalExcludeValue); // Should not change
    expect(process.env.NORMAL_VAR).toBe('should_change');
  });
});