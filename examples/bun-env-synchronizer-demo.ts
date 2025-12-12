#!/usr/bin/env bun

/**
 * 🚀 Bun Environment Synchronizer Demo
 *
 * Demonstrates environment variable synchronization between process.env and Bun.env
 */

import {
  BunEnvSynchronizer,
  syncEnvironments,
  validateEnvSync,
  createEnvSnapshot,
  legacyEnvSync,
  WorkerEnvSynchronizer,
  testEnvSynchronization,
} from '../src/utils/bun-env-synchronizer';

// ============================================================================
// DEMO SCENARIOS
// ============================================================================

/**
 * Demo 1: Basic Environment Synchronization
 */
async function demoBasicSync() {
  console.log('\n🔧 Demo 1: Basic Environment Synchronization');
  console.log('='.repeat(60));

  console.log('📊 Initial environment state:');
  console.log(`   process.env keys: ${Object.keys(process.env).length}`);
  console.log(`   Bun.env available: ${!!(globalThis as any).Bun?.env}`);

  // Create test environment data
  const testEnv = {
    DEMO_VAR: 'demo_value',
    ANOTHER_VAR: 'another_value',
    UNDEFINED_VAR: undefined, // Should be ignored
    TZ: 'America/New_York',   // Should be excluded by default
    NUMERIC_VAR: 42,          // Should be converted to string
  };

  console.log('\n📝 Test environment data:');
  Object.entries(testEnv).forEach(([key, value]) => {
    console.log(`   ${key}: ${value} (${typeof value})`);
  });

  // Perform synchronization
  console.log('\n🔄 Synchronizing environments...');
  const synchronizer = new BunEnvSynchronizer();
  synchronizer.sync(testEnv, process.env);

  console.log('✅ Synchronization complete');

  // Verify results
  console.log('\n🔍 Verification:');
  console.log(`   DEMO_VAR: ${process.env.DEMO_VAR}`);
  console.log(`   ANOTHER_VAR: ${process.env.ANOTHER_VAR}`);
  console.log(`   UNDEFINED_VAR: ${process.env.UNDEFINED_VAR || 'undefined'}`);
  console.log(`   TZ: ${process.env.TZ} (should be unchanged)`);
  console.log(`   NUMERIC_VAR: ${process.env.NUMERIC_VAR} (${typeof process.env.NUMERIC_VAR})`);

  // Validate synchronization
  const validation = synchronizer.validate();
  console.log(`\n🧪 Validation: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
  if (validation.issues.length > 0) {
    console.log('Issues:');
    validation.issues.forEach(issue => console.log(`   - ${issue}`));
  }
}

/**
 * Demo 2: Legacy Compatibility Mode
 */
async function demoLegacyCompatibility() {
  console.log('\n🔧 Demo 2: Legacy Compatibility Mode');
  console.log('='.repeat(60));

  // Simulate the harness.bunEnv structure from the original code
  const harness = {
    bunEnv: {
      LEGACY_VAR: 'legacy_value',
      UPDATED_VAR: 'updated_value',
      UNDEFINED_VAR: undefined,
      TZ: 'Europe/London', // Should be ignored
      NEW_VAR: 'new_value',
    }
  };

  // Set up some existing environment variables
  process.env.EXISTING_VAR = 'existing_value';
  process.env.UPDATED_VAR = 'old_value';
  process.env.TO_BE_REMOVED = 'should_be_removed';

  console.log('📊 Before legacy sync:');
  console.log(`   EXISTING_VAR: ${process.env.EXISTING_VAR}`);
  console.log(`   UPDATED_VAR: ${process.env.UPDATED_VAR}`);
  console.log(`   TO_BE_REMOVED: ${process.env.TO_BE_REMOVED}`);
  console.log(`   TZ: ${process.env.TZ}`);

  // Perform legacy synchronization
  console.log('\n🔄 Performing legacy synchronization...');
  legacyEnvSync(harness);

  console.log('✅ Legacy synchronization complete');

  // Verify results
  console.log('\n🔍 After legacy sync:');
  console.log(`   LEGACY_VAR: ${process.env.LEGACY_VAR}`);
  console.log(`   UPDATED_VAR: ${process.env.UPDATED_VAR}`);
  console.log(`   NEW_VAR: ${process.env.NEW_VAR}`);
  console.log(`   EXISTING_VAR: ${process.env.EXISTING_VAR}`);
  console.log(`   TO_BE_REMOVED: ${process.env.TO_BE_REMOVED || 'removed'}`);
  console.log(`   TZ: ${process.env.TZ} (should be unchanged)`);
}

/**
 * Demo 3: Worker Environment Management
 */
async function demoWorkerEnvironments() {
  console.log('\n🔧 Demo 3: Worker Environment Management');
  console.log('='.repeat(60));

  const workerSync = new WorkerEnvSynchronizer();

  console.log('👷 Creating worker-specific environments...');

  // Create environments for different workers
  const worker1Env = workerSync.syncForWorker('worker-1', {
    WORKER_ROLE: 'data-processor',
    WORKER_PRIORITY: 'high',
  });

  const worker2Env = workerSync.syncForWorker('worker-2', {
    WORKER_ROLE: 'file-handler',
    WORKER_PRIORITY: 'medium',
  });

  const worker3Env = workerSync.syncForWorker('worker-3', {
    WORKER_ROLE: 'network-client',
    WORKER_PRIORITY: 'low',
  });

  console.log('\n🔍 Worker 1 Environment:');
  console.log(`   BUN_WORKER_ID: ${worker1Env.BUN_WORKER_ID}`);
  console.log(`   WORKER_ROLE: ${worker1Env.WORKER_ROLE}`);
  console.log(`   WORKER_PRIORITY: ${worker1Env.WORKER_PRIORITY}`);
  console.log(`   NODE_ENV: ${worker1Env.NODE_ENV || 'excluded'}`);
  console.log(`   TZ: ${worker1Env.TZ || 'excluded'}`);

  console.log('\n🔍 Worker 2 Environment:');
  console.log(`   BUN_WORKER_ID: ${worker2Env.BUN_WORKER_ID}`);
  console.log(`   WORKER_ROLE: ${worker2Env.WORKER_ROLE}`);
  console.log(`   WORKER_PRIORITY: ${worker2Env.WORKER_PRIORITY}`);

  console.log('\n🔍 Worker 3 Environment:');
  console.log(`   BUN_WORKER_ID: ${worker3Env.BUN_WORKER_ID}`);
  console.log(`   WORKER_ROLE: ${worker3Env.WORKER_ROLE}`);
  console.log(`   WORKER_PRIORITY: ${worker3Env.WORKER_PRIORITY}`);

  // Verify isolation
  console.log('\n🧪 Verifying environment isolation:');
  console.log(`   Worker1 and Worker2 have different roles: ${worker1Env.WORKER_ROLE !== worker2Env.WORKER_ROLE}`);
  console.log(`   All workers have unique IDs: ${new Set([worker1Env.BUN_WORKER_ID, worker2Env.BUN_WORKER_ID, worker3Env.BUN_WORKER_ID]).size === 3}`);
}

/**
 * Demo 4: Advanced Options and Customization
 */
async function demoAdvancedOptions() {
  console.log('\n🔧 Demo 4: Advanced Options and Customization');
  console.log('='.repeat(60));

  // Custom synchronizer with advanced options
  const customSync = new BunEnvSynchronizer({
    excludeKeys: ['TZ', 'HOME', 'USER'],
    valueTransformer: (value: any) => `[${String(value).toUpperCase()}]`,
    updateBunShell: false, // Skip shell update for demo
  });

  const testEnv = {
    CUSTOM_VAR: 'custom_value',
    NUMERIC_VAR: 123,
    BOOLEAN_VAR: true,
    TZ: 'should_be_ignored',
    HOME: '/home/user', // Should be ignored
  };

  console.log('📊 Test environment:');
  Object.entries(testEnv).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  console.log('\n🔄 Applying custom synchronization...');
  customSync.sync(testEnv, process.env);

  console.log('\n🔍 Results with custom transformer:');
  console.log(`   CUSTOM_VAR: ${process.env.CUSTOM_VAR}`);
  console.log(`   NUMERIC_VAR: ${process.env.NUMERIC_VAR}`);
  console.log(`   BOOLEAN_VAR: ${process.env.BOOLEAN_VAR}`);
  console.log(`   TZ: ${process.env.TZ} (excluded)`);
  console.log(`   HOME: ${process.env.HOME} (excluded)`);

  // Validate with custom options (pass the transformed env)
  const transformedEnv = {
    CUSTOM_VAR: '[CUSTOM_VALUE]',
    NUMERIC_VAR: '[123]',
    BOOLEAN_VAR: '[TRUE]',
  };
  const validation = customSync.validate(transformedEnv);
  console.log(`\n🧪 Custom validation: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
}

/**
 * Demo 5: Environment Snapshot and Monitoring
 */
async function demoEnvironmentMonitoring() {
  console.log('\n🔧 Demo 5: Environment Snapshot and Monitoring');
  console.log('='.repeat(60));

  console.log('📸 Creating environment snapshot...');
  const snapshot = createEnvSnapshot();

  console.log('📊 Snapshot Summary:');
  console.log(`   process.env keys: ${Object.keys(snapshot.processEnv).length}`);
  console.log(`   bun.env keys: ${Object.keys(snapshot.bunEnv).length}`);
  console.log(`   Synchronized: ${snapshot.synchronized ? '✅ YES' : '❌ NO'}`);

  if (snapshot.issues.length > 0) {
    console.log('🔍 Synchronization Issues:');
    snapshot.issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ No synchronization issues found');
  }

  // Demonstrate quick sync utility
  console.log('\n🔄 Testing quick sync utility...');
  const testEnv = {
    QUICK_SYNC_VAR: 'quick_sync_value',
    ANOTHER_QUICK_VAR: 'another_value',
  };

  syncEnvironments(testEnv);
  console.log(`   QUICK_SYNC_VAR: ${process.env.QUICK_SYNC_VAR}`);
  console.log(`   ANOTHER_QUICK_VAR: ${process.env.ANOTHER_QUICK_VAR}`);

  // Final validation
  const finalValidation = validateEnvSync();
  console.log(`\n🏁 Final validation: ${finalValidation.isValid ? '✅ ALL SYNCED' : '❌ ISSUES FOUND'}`);
}

/**
 * Demo 6: Error Handling and Edge Cases
 */
async function demoErrorHandling() {
  console.log('\n🔧 Demo 6: Error Handling and Edge Cases');
  console.log('='.repeat(60));

  console.log('🧪 Testing edge cases...');

  // Test with undefined values
  const synchronizer = new BunEnvSynchronizer();
  const edgeCaseEnv = {
    NORMAL_VAR: 'normal',
    UNDEFINED_VAR: undefined,
    NULL_VAR: null,
    EMPTY_STRING: '',
    ZERO_VAR: 0,
    FALSE_VAR: false,
  };

  console.log('📊 Edge case environment:');
  Object.entries(edgeCaseEnv).forEach(([key, value]) => {
    console.log(`   ${key}: ${value} (${typeof value})`);
  });

  synchronizer.sync(edgeCaseEnv, process.env);

  console.log('\n🔍 Results after sync:');
  console.log(`   NORMAL_VAR: "${process.env.NORMAL_VAR}"`);
  console.log(`   UNDEFINED_VAR: ${process.env.UNDEFINED_VAR || 'undefined'}`);
  console.log(`   NULL_VAR: "${process.env.NULL_VAR}"`);
  console.log(`   EMPTY_STRING: "${process.env.EMPTY_STRING}"`);
  console.log(`   ZERO_VAR: "${process.env.ZERO_VAR}"`);
  console.log(`   FALSE_VAR: "${process.env.FALSE_VAR}"`);

  // Test validation
  const validation = synchronizer.validate();
  console.log(`\n🧪 Edge case validation: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);

  if (validation.issues.length > 0) {
    console.log('Issues found:');
    validation.issues.forEach(issue => console.log(`   - ${issue}`));
  }
}

// ============================================================================
// MAIN DEMONSTRATION
// ============================================================================

/**
 * Run all demonstrations
 */
async function runAllDemos() {
  console.log('🚀 Bun Environment Synchronizer - Complete Demonstration');
  console.log('=========================================================');

  try {
    await demoBasicSync();
    await demoLegacyCompatibility();
    await demoWorkerEnvironments();
    await demoAdvancedOptions();
    await demoEnvironmentMonitoring();
    await demoErrorHandling();

    console.log('\n🎉 All demonstrations completed successfully!');
    console.log('\n📚 Summary:');
    console.log('   ✅ Basic environment synchronization');
    console.log('   ✅ Legacy compatibility mode');
    console.log('   ✅ Worker-specific environments');
    console.log('   ✅ Advanced customization options');
    console.log('   ✅ Environment monitoring and snapshots');
    console.log('   ✅ Error handling and edge cases');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  runAllDemos().catch(error => {
    console.error('Demo execution failed:', error);
    process.exit(1);
  });
}

export { runAllDemos };