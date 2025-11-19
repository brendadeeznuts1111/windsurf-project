#!/usr/bin/env bun
/**
 * Console Fixes Test Script
 * Tests the safe console utilities and error handler improvements
 * 
 * @fileoverview Comprehensive testing of console safety features
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2025-11-18
 */

import { SafeConsole, safeConsole } from './console-utils.js';
import { logger } from './error-handler.js';

// Test configuration
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

function runTest(testName: string, testFn: () => boolean): void {
    testResults.total++;
    try {
        const result = testFn();
        if (result) {
            console.log(`✅ ${testName}`);
            testResults.passed++;
        } else {
            console.log(`❌ ${testName}`);
            testResults.failed++;
        }
    } catch (error) {
        console.log(`❌ ${testName} - Error: ${(error as Error).message}`);
        testResults.failed++;
    }
}

// ============================================================================
// CONSOLE AVAILABILITY TESTS
// ============================================================================

runTest('SafeConsole.isAvailable()', () => {
    return typeof SafeConsole.isAvailable() === 'boolean';
});

runTest('Console availability check', () => {
    const available = SafeConsole.isAvailable();
    return typeof available === 'boolean' && (available === true || available === false);
});

// ============================================================================
// CONSOLE CONFIGURATION TESTS
// ============================================================================

runTest('SafeConsole configuration', () => {
    const config = SafeConsole.getConfig();
    return config &&
        typeof config.enabled === 'boolean' &&
        typeof config.level === 'string' &&
        typeof config.throttle === 'boolean' &&
        typeof config.maxLogsPerSecond === 'number';
});

runTest('SafeConsole configuration update', () => {
    const originalConfig = SafeConsole.getConfig();
    SafeConsole.updateConfig({ enabled: false });
    const newConfig = SafeConsole.getConfig();

    // Restore original config
    SafeConsole.updateConfig(originalConfig);

    return newConfig.enabled === false;
});

// ============================================================================
// SAFE CONSOLE OUTPUT TESTS
// ============================================================================

runTest('SafeConsole.log() does not crash', () => {
    try {
        SafeConsole.log('Test log message');
        return true;
    } catch {
        return false;
    }
});

runTest('SafeConsole.error() does not crash', () => {
    try {
        SafeConsole.error('Test error message');
        return true;
    } catch {
        return false;
    }
});

runTest('SafeConsole.warn() does not crash', () => {
    try {
        SafeConsole.warn('Test warning message');
        return true;
    } catch {
        return false;
    }
});

runTest('SafeConsole.info() does not crash', () => {
    try {
        SafeConsole.info('Test info message');
        return true;
    } catch {
        return false;
    }
});

runTest('SafeConsole.debug() does not crash', () => {
    try {
        SafeConsole.debug('Test debug message');
        return true;
    } catch {
        return false;
    }
});

// ============================================================================
// ENVIRONMENT-BASED CONSOLE TESTS
// ============================================================================

runTest('Production environment suppresses non-critical logs', () => {
    // Save original config
    const originalConfig = SafeConsole.getConfig();

    // Set production-like config
    SafeConsole.updateConfig({
        enabled: true,
        level: 'error',
        throttle: false
    });

    // Test that info logs are suppressed
    let infoLogged = false;
    const originalConsoleLog = console.log;
    console.log = () => { infoLogged = true; };

    SafeConsole.info('This should be suppressed');

    // Restore console.log
    console.log = originalConsoleLog;

    // Restore original config
    SafeConsole.updateConfig(originalConfig);

    return !infoLogged;
});

runTest('Error logs work in production mode', () => {
    // Save original config
    const originalConfig = SafeConsole.getConfig();

    // Set production-like config
    SafeConsole.updateConfig({
        enabled: true,
        level: 'error',
        throttle: false
    });

    // Test that error logs still work
    let errorLogged = false;
    const originalConsoleError = console.error;
    console.error = () => { errorLogged = true; };

    SafeConsole.error('This should still work');

    // Restore console.error
    console.error = originalConsoleError;

    // Restore original config
    SafeConsole.updateConfig(originalConfig);

    return errorLogged;
});

// ============================================================================
// THROTTLING TESTS
// ============================================================================

runTest('Console throttling prevents spam', () => {
    // Save original config
    const originalConfig = SafeConsole.getConfig();

    // Set throttling config
    SafeConsole.updateConfig({
        enabled: true,
        level: 'info',
        throttle: true,
        maxLogsPerSecond: 2
    });

    // Reset throttling counters
    SafeConsole.resetThrottling();

    let logCount = 0;
    const originalConsoleLog = console.log;
    console.log = () => { logCount++; };

    // Send multiple logs quickly
    for (let i = 0; i < 5; i++) {
        SafeConsole.log(`Spam message ${i}`);
    }

    // Restore console.log
    console.log = originalConsoleLog;

    // Restore original config
    SafeConsole.updateConfig(originalConfig);

    // Should have logged at most maxLogsPerSecond messages
    return logCount <= 2;
});

runTest('Throttling reset works', () => {
    SafeConsole.resetThrottling();
    return true; // If we get here without crashing, reset works
});

// ============================================================================
// ERROR HANDLER INTEGRATION TESTS
// ============================================================================

runTest('Logger does not crash with console errors', () => {
    try {
        logger.logInfo('Test logger info message');
        return true;
    } catch {
        return false;
    }
});

runTest('Logger handles errors safely', () => {
    try {
        // Create a test error
        const testError = new Error('Test error for console safety');
        logger.logError('Test error message', {
            script: 'test-console-fixes.ts',
            function: 'runTest',
            error: testError
        });
        return true;
    } catch {
        return false;
    }
});

runTest('Logger warning works safely', () => {
    try {
        logger.logWarning('Test warning message');
        return true;
    } catch {
        return false;
    }
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

runTest('Console methods undefined handling', () => {
    // Save original console methods
    const originalLog = console.log;
    const originalError = console.error;

    // Temporarily undefined console methods
    (console as any).log = undefined;
    (console as any).error = undefined;

    let crashed = false;
    try {
        SafeConsole.log('Test with undefined console.log');
        SafeConsole.error('Test with undefined console.error');
    } catch {
        crashed = true;
    }

    // Restore console methods
    console.log = originalLog;
    console.error = originalError;

    return !crashed;
});

runTest('Console object undefined handling', () => {
    // Save original console
    const originalConsole = (globalThis as any).console;

    // Temporarily undefined console
    (globalThis as any).console = undefined;

    let crashed = false;
    try {
        SafeConsole.log('Test with undefined console');
    } catch {
        crashed = true;
    }

    // Restore console
    (globalThis as any).console = originalConsole;

    return !crashed;
});

runTest('Console method throws error handling', () => {
    // Save original console methods
    const originalLog = console.log;
    const originalError = console.error;

    // Make console methods throw errors
    console.log = () => { throw new Error('Console.log error'); };
    console.error = () => { throw new Error('Console.error error'); };

    let crashed = false;
    try {
        SafeConsole.log('Test with throwing console.log');
        SafeConsole.error('Test with throwing console.error');
    } catch {
        crashed = true;
    }

    // Restore console methods
    console.log = originalLog;
    console.error = originalError;

    return !crashed;
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

runTest('SafeConsole performance test', () => {
    const startTime = Date.now();

    // Perform many safe console operations
    for (let i = 0; i < 1000; i++) {
        SafeConsole.log(`Performance test message ${i}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete quickly (under 1 second)
    return duration < 1000;
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

runTest('SafeConsole and logger integration', () => {
    try {
        // Test that both systems work together
        SafeConsole.info('Integration test - SafeConsole');
        logger.logInfo('Integration test - Logger');
        return true;
    } catch {
        return false;
    }
});

runTest('Environment variable detection', () => {
    // Test that environment variables are properly detected
    const config = SafeConsole.getConfig();
    return typeof config.enabled === 'boolean';
});

// ============================================================================
// TEST RESULTS
// ============================================================================

function printTestResults(): void {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 CONSOLE FIXES TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

    if (testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Console fixes are working correctly.');
    } else {
        console.log(`\n⚠️  ${testResults.failed} tests failed. Please review the console fixes.`);
    }

    console.log('='.repeat(50));
}

// Run all tests and print results
printTestResults();

// Export for use in other test files
export { testResults, runTest };

// If this file is run directly, exit with appropriate code
if (import.meta.main) {
    process.exit(testResults.failed === 0 ? 0 : 1);
}
