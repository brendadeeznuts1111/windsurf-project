#!/usr/bin/env bun
/**
 * Template System Test Script
 * Tests the template system for errors and validates functionality
 * 
 * @fileoverview Template system testing and validation
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2025-11-18
 */

import { AbstractBaseTemplate } from './base-template.js';
import {
    TemplateContext,
    TemplateResult,
    BaseTemplate,
    TemplateConfig,
    NoteTemplateConfig
} from './template-types.js';
import { templateRegistry } from './template-registry.js';
import { templateValidator } from './template-validator.js';
import { logger } from '../core/error-handler.js';

// ============================================================================
// TEST TEMPLATE IMPLEMENTATION
// ============================================================================

class TestTemplate extends AbstractBaseTemplate {
    constructor() {
        const config: TemplateConfig = {
            name: 'Test Template',
            description: 'A simple test template for validation',
            version: '1.0.0',
            author: 'Test Author',
            category: 'test',
            tags: ['test', 'validation']
        };
        super(config);
    }

    render(context: TemplateContext): TemplateResult {
        try {
            const content = this.generateHeader(context) +
                `# Test Content

This is a test template rendered at: ${context.date.now.toISOString()}

## File Information
- Name: ${context.file.name}
- Path: ${context.file.path}
- User: ${context.user.name}
- Vault: ${context.vault.name}

## Test Results
✅ Template rendering successful
✅ Context validation passed
✅ All variables accessible

` + this.generateFooter();

            return this.createResult(content, {
                testPassed: true,
                renderTime: Date.now()
            });

        } catch (error) {
            logger.logError('Test template render failed', { error });
            return this.createError(`Test template render failed: ${(error as Error).message}`);
        }
    }
}

// ============================================================================
// TEST FUNCTIONS
// =============================================================================

async function testTemplateSystem(): Promise<void> {
    console.log('🧪 Starting Template System Tests...\n');

    let testsPassed = 0;
    let totalTests = 0;

    // Test 1: Template Creation
    totalTests++;
    try {
        const testTemplate = new TestTemplate();
        console.log('✅ Test 1 PASSED: Template creation successful');
        testsPassed++;
    } catch (error) {
        console.log('❌ Test 1 FAILED: Template creation failed:', (error as Error).message);
    }

    // Test 2: Template Validation
    totalTests++;
    try {
        const testTemplate = new TestTemplate();
        const validation = templateValidator.validateTemplate(testTemplate);

        if (validation.isValid) {
            console.log('✅ Test 2 PASSED: Template validation successful');
            testsPassed++;
        } else {
            console.log('❌ Test 2 FAILED: Template validation failed:', validation.errors);
        }
    } catch (error) {
        console.log('❌ Test 2 FAILED: Template validation error:', (error as Error).message);
    }

    // Test 3: Template Registration
    totalTests++;
    try {
        const testTemplate = new TestTemplate();
        templateRegistry.register(testTemplate);

        const retrieved = templateRegistry.get('Test Template');
        if (retrieved) {
            console.log('✅ Test 3 PASSED: Template registration successful');
            testsPassed++;
        } else {
            console.log('❌ Test 3 FAILED: Template registration - could not retrieve template');
        }
    } catch (error) {
        console.log('❌ Test 3 FAILED: Template registration error:', (error as Error).message);
    }

    // Test 4: Context Validation
    totalTests++;
    try {
        const mockContext = createMockContext();
        const validation = templateValidator.validateContext(mockContext);

        if (validation.isValid) {
            console.log('✅ Test 4 PASSED: Context validation successful');
            testsPassed++;
        } else {
            console.log('❌ Test 4 FAILED: Context validation failed:', validation.errors);
        }
    } catch (error) {
        console.log('❌ Test 4 FAILED: Context validation error:', (error as Error).message);
    }

    // Test 5: Template Rendering
    totalTests++;
    try {
        const mockContext = createMockContext();
        const result = templateRegistry.render('Test Template', mockContext);

        if (result.success && result.content.length > 0) {
            console.log('✅ Test 5 PASSED: Template rendering successful');
            console.log(`   Generated ${result.content.length} characters of content`);
            testsPassed++;
        } else {
            console.log('❌ Test 5 FAILED: Template rendering failed:', result.errors);
        }
    } catch (error) {
        console.log('❌ Test 5 FAILED: Template rendering error:', (error as Error).message);
    }

    // Test 6: Registry Statistics
    totalTests++;
    try {
        const stats = templateRegistry.getUsageStats();

        if (stats.totalTemplates > 0 && stats.categories['test'] > 0) {
            console.log('✅ Test 6 PASSED: Registry statistics working');
            console.log(`   Total templates: ${stats.totalTemplates}`);
            console.log(`   Categories: ${Object.keys(stats.categories).join(', ')}`);
            testsPassed++;
        } else {
            console.log('❌ Test 6 FAILED: Registry statistics invalid');
        }
    } catch (error) {
        console.log('❌ Test 6 FAILED: Registry statistics error:', (error as Error).message);
    }

    // Test 7: Template Search
    totalTests++;
    try {
        const searchResults = templateRegistry.search('test');

        if (searchResults.length > 0) {
            console.log('✅ Test 7 PASSED: Template search working');
            console.log(`   Found ${searchResults.length} templates matching "test"`);
            testsPassed++;
        } else {
            console.log('❌ Test 7 FAILED: Template search returned no results');
        }
    } catch (error) {
        console.log('❌ Test 7 FAILED: Template search error:', (error as Error).message);
    }

    // Test 8: Usage Metrics
    totalTests++;
    try {
        const metrics = templateRegistry.getTemplateMetrics('Test Template');

        if (metrics && metrics.usageCount > 0) {
            console.log('✅ Test 8 PASSED: Usage metrics working');
            console.log(`   Usage count: ${metrics.usageCount}`);
            console.log(`   Success rate: ${metrics.successRate}%`);
            testsPassed++;
        } else {
            console.log('❌ Test 8 FAILED: Usage metrics not working');
        }
    } catch (error) {
        console.log('❌ Test 8 FAILED: Usage metrics error:', (error as Error).message);
    }

    // ============================================================================
    // TEST SUMMARY
    // ============================================================================

    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`Success Rate: ${Math.round((testsPassed / totalTests) * 100)}%`);

    if (testsPassed === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Template system is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.');
    }

    console.log('='.repeat(50));

    // Show template content if rendering was successful
    if (testsPassed >= 5) {
        console.log('\n📄 SAMPLE RENDERED CONTENT:');
        console.log('-'.repeat(30));
        try {
            const mockContext = createMockContext();
            const result = templateRegistry.render('Test Template', mockContext);
            if (result.success) {
                console.log(result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''));
            }
        } catch (error) {
            console.log('Could not display sample content:', (error as Error).message);
        }
        console.log('-'.repeat(30));
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function createMockContext(): TemplateContext {
    return {
        file: {
            name: 'test-document.md',
            path: '/test/test-document.md',
            frontmatter: {
                type: 'test',
                title: 'Test Document'
            },
            content: '# Test Content\nThis is a test document.'
        },
        vault: {
            name: 'Test Vault',
            path: '/test',
            config: {
                version: '1.0.0'
            }
        },
        user: {
            name: 'Test User',
            email: 'test@example.com',
            role: 'developer'
        },
        date: {
            now: new Date(),
            today: new Date().toISOString().split('T')[0],
            tomorrow: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        metadata: {
            testMode: true,
            timestamp: Date.now()
        }
    };
}

// ============================================================================
// RUN TESTS
// ============================================================================

// Run tests if this file is executed directly
if (import.meta.main) {
    testTemplateSystem().catch(error => {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    });
}

export { testTemplateSystem, createMockContext, TestTemplate };
