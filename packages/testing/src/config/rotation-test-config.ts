// packages/testing/src/config/rotation-test-config.ts

export interface RotationTestConfig {
    propertyTests: {
        numRuns: number;
        maxConcurrency: number;
        timeout: number;
    };
    performanceTests: {
        maxExecutionTime: number; // ms
        maxPerOperationTime: number; // ms
        memoryLimit: number; // bytes
    };
    benchmarks: {
        targets: {
            singleParse: number; // ms
            batchParse10k: number; // ms
            validation: number; // ms
            search: number; // ms
            arbitrageDetection100: number; // ms
        };
    };
    coverage: {
        minimumThreshold: number; // percentage
        excludePatterns: string[];
    };
    ci: {
        strictMode: boolean;
        failOnWarnings: boolean;
        generateReports: boolean;
    };
}

export const ROTATION_TEST_CONFIG: RotationTestConfig = {
    propertyTests: {
        numRuns: 1000,
        maxConcurrency: 20,
        timeout: 30000 // 30 seconds
    },
    performanceTests: {
        maxExecutionTime: 15000, // 15 seconds total
        maxPerOperationTime: 0.1, // 0.1ms per validation
        memoryLimit: 10 * 1024 * 1024 // 10MB
    },
    benchmarks: {
        targets: {
            singleParse: 0.01, // < 0.01ms
            batchParse10k: 50, // < 50ms
            validation: 0.1, // < 0.1ms
            search: 5, // < 5ms
            arbitrageDetection100: 20 // < 20ms
        }
    },
    coverage: {
        minimumThreshold: 90, // 90%
        excludePatterns: [
            '*.test.ts',
            '*.bench.ts',
            'node_modules/**',
            'dist/**'
        ]
    },
    ci: {
        strictMode: true,
        failOnWarnings: true,
        generateReports: true
    }
};

export interface ValidationChecklist {
    propertyTests: {
        boundaryTests: boolean;
        edgeCaseTests: boolean;
        performanceTests: boolean;
        integrationTests: boolean;
        errorHandlingTests: boolean;
    };
    typeTests: {
        expectTypeOfAssertions: boolean;
        typeSafetyCoverage: boolean;
        interfaceValidation: boolean;
    };
    performanceTests: {
        benchmarkTargets: boolean;
        scalabilityTests: boolean;
        memoryEfficiency: boolean;
    };
    integrationTests: {
        databaseOperations: boolean;
        arbitrageDetection: boolean;
        concurrentOperations: boolean;
    };
    codeQuality: {
        noTestOnlyOrSkip: boolean;
        coverageThreshold: boolean;
        ciStability: boolean;
    };
}

export const ROTATION_VALIDATION_CHECKLIST: ValidationChecklist = {
    propertyTests: {
        boundaryTests: false,
        edgeCaseTests: false,
        performanceTests: false,
        integrationTests: false,
        errorHandlingTests: false
    },
    typeTests: {
        expectTypeOfAssertions: false,
        typeSafetyCoverage: false,
        interfaceValidation: false
    },
    performanceTests: {
        benchmarkTargets: false,
        scalabilityTests: false,
        memoryEfficiency: false
    },
    integrationTests: {
        databaseOperations: false,
        arbitrageDetection: false,
        concurrentOperations: false
    },
    codeQuality: {
        noTestOnlyOrSkip: false,
        coverageThreshold: false,
        ciStability: false
    }
};

export class TestValidator {
    private config: RotationTestConfig;
    private checklist: ValidationChecklist;

    constructor(config: RotationTestConfig = ROTATION_TEST_CONFIG) {
        this.config = config;
        this.checklist = { ...ROTATION_VALIDATION_CHECKLIST };
    }

    validatePropertyTests(numRuns: number, concurrency: number): boolean {
        const isValid =
            numRuns >= this.config.propertyTests.numRuns &&
            concurrency <= this.config.propertyTests.maxConcurrency;

        this.checklist.propertyTests.boundaryTests = isValid;
        this.checklist.propertyTests.edgeCaseTests = isValid;
        this.checklist.propertyTests.performanceTests = isValid;
        this.checklist.propertyTests.integrationTests = isValid;
        this.checklist.propertyTests.errorHandlingTests = isValid;

        return isValid;
    }

    validatePerformance(executionTime: number, perOperationTime: number): boolean {
        const isValid =
            executionTime <= this.config.performanceTests.maxExecutionTime &&
            perOperationTime <= this.config.performanceTests.maxPerOperationTime;

        this.checklist.performanceTests.benchmarkTargets = isValid;
        this.checklist.performanceTests.scalabilityTests = isValid;
        this.checklist.performanceTests.memoryEfficiency = isValid;

        return isValid;
    }

    validateCoverage(coverage: number): boolean {
        const isValid = coverage >= this.config.coverage.minimumThreshold;
        this.checklist.codeQuality.coverageThreshold = isValid;
        return isValid;
    }

    validateBenchmarks(results: Record<string, number>): boolean {
        const targets = this.config.benchmarks.targets;
        const isValid =
            results.singleParse <= targets.singleParse &&
            results.batchParse10k <= targets.batchParse10k &&
            results.validation <= targets.validation &&
            results.search <= targets.search &&
            results.arbitrageDetection100 <= targets.arbitrageDetection100;

        this.checklist.performanceTests.benchmarkTargets = isValid;
        return isValid;
    }

    getChecklist(): ValidationChecklist {
        return { ...this.checklist };
    }

    isFullyValidated(): boolean {
        const allChecks = [
            ...Object.values(this.checklist.propertyTests),
            ...Object.values(this.checklist.typeTests),
            ...Object.values(this.checklist.performanceTests),
            ...Object.values(this.checklist.integrationTests),
            ...Object.values(this.checklist.codeQuality)
        ];

        return allChecks.every(check => check === true);
    }

    printValidationReport(): void {
        console.log('📋 Rotation Number Test Validation Report');
        console.log('='.repeat(60));

        const sections = [
            { name: 'Property Tests', checks: this.checklist.propertyTests },
            { name: 'Type Tests', checks: this.checklist.typeTests },
            { name: 'Performance Tests', checks: this.checklist.performanceTests },
            { name: 'Integration Tests', checks: this.checklist.integrationTests },
            { name: 'Code Quality', checks: this.checklist.codeQuality }
        ];

        sections.forEach(section => {
            console.log(`\n${section.name}:`);
            Object.entries(section.checks).forEach(([check, passed]) => {
                const status = passed ? '✅' : '❌';
                const formattedName = check.replace(/([A-Z])/g, ' $1').toLowerCase();
                console.log(`  ${status} ${formattedName.charAt(0).toUpperCase() + formattedName.slice(1)}`);
            });
        });

        const overallStatus = this.isFullyValidated() ? '✅' : '❌';
        console.log(`\nOverall Status: ${overallStatus}`);

        if (this.isFullyValidated()) {
            console.log('\n🎉 All validation checks passed! Ready for production.');
        } else {
            console.log('\n⚠️  Some validation checks failed. Review and fix before production.');
        }
    }
}

export function createTestValidator(): TestValidator {
    return new TestValidator(ROTATION_TEST_CONFIG);
}

// Export configuration for use in test files
export { ROTATION_TEST_CONFIG as default };
