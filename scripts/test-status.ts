#!/usr/bin/env bun
/**
 * Test Status Summary
 * 
 * Quick overview of test results and issues
 */

import { execSync } from 'child_process';

interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    issues: string[];
}

function getTestStatus(): TestSummary {
    try {
        const output = execSync('bun test property-tests/ packages/testing/src/contracts/', {
            encoding: 'utf8',
            cwd: process.cwd()
        });

        const lines = output.split('\n');
        const summaryLine = lines.find(line => line.includes('Ran'));

        if (!summaryLine) {
            return {
                total: 0,
                passed: 0,
                failed: 0,
                errors: 0,
                issues: ['Could not parse test results']
            };
        }

        const match = summaryLine.match(/Ran (\d+) tests across (\d+) files/);
        const total = parseInt(match?.[1] || '0');

        const passed = (output.match(/✓/g) || []).length;
        const failed = (output.match(/✗/g) || []).length;
        const errors = (output.match(/error:/g) || []).length;

        const issues: string[] = [];

        // Extract specific error types
        if (output.includes('Cannot find module')) {
            issues.push('Module import errors');
        }
        if (output.includes('SyntaxError')) {
            issues.push('Syntax errors');
        }
        if (output.includes('expect(received)')) {
            issues.push('Test assertion failures');
        }
        if (output.includes('TypeError')) {
            issues.push('Type errors');
        }

        return {
            total,
            passed,
            failed,
            errors,
            issues: [...new Set(issues)] // Remove duplicates
        };

    } catch (error) {
        return {
            total: 0,
            passed: 0,
            failed: 0,
            errors: 1,
            issues: ['Failed to run tests']
        };
    }
}

function main() {
    console.log('🧪 Test Status Summary');
    console.log('====================');

    const status = getTestStatus();

    console.log(`📊 Total Tests: ${status.total}`);
    console.log(`✅ Passed: ${status.passed}`);
    console.log(`❌ Failed: ${status.failed}`);
    console.log(`💥 Errors: ${status.errors}`);

    const passRate = status.total > 0 ? (status.passed / status.total * 100).toFixed(1) : '0';
    console.log(`📈 Pass Rate: ${passRate}%`);

    if (status.issues.length > 0) {
        console.log('\n🔍 Issues to Address:');
        status.issues.forEach((issue, i) => {
            console.log(`${i + 1}. ${issue}`);
        });
    }

    if (status.errors > 0) {
        console.log('\n💡 Recommendations:');
        console.log('- Fix module import errors first');
        console.log('- Resolve syntax errors in source files');
        console.log('- Update test assertions to match expected behavior');
        console.log('- Run tests individually for detailed error messages');
    }

    console.log('\n🚀 Next Steps:');
    if (status.errors > 0) {
        console.log('  Focus on fixing errors before addressing test failures');
    } else if (status.failed > 0) {
        console.log('  Fix failing test assertions');
    } else {
        console.log('  All tests passing! Consider adding more test coverage.');
    }
}

if (import.meta.main) {
    main();
}
