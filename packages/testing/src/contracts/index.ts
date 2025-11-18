// Contract Testing Entry Point
// Exports all contract testing utilities and configurations

export * from './websocket.contract.test';
export * from './api.contract.test';

// Contract testing configuration
export const ContractTestConfig = {
    // Performance thresholds
    performance: {
        maxWebSocketLatency: 100, // ms
        maxAPILatency: 100, // ms
        maxConcurrentConnections: 50,
        maxConcurrentRequests: 10
    },

    // Schema validation settings
    validation: {
        strictMode: true,
        allowAdditionalFields: false,
        requiredFieldsOnly: false
    },

    // Test data generation
    dataGeneration: {
        batchSize: 100,
        maxRetries: 3,
        seedValue: 12345
    },

    // Network simulation
    network: {
        enableLatencySimulation: true,
        enableFailureSimulation: true,
        failureRate: 0.1
    }
};

// Contract testing utilities
export const ContractTestUtils = {
    /**
     * Create a contract test suite with custom configuration
     */
    createSuite: (name: string, config: any = {}) => {
        return {
            name,
            config: { ...ContractTestConfig, ...config },
            tests: [],

            addTest: (testName: string, testFn: Function) => {
                (this.tests as any).push({ name: testName, fn: testFn });
                return this;
            },

            run: async () => {
                console.log(`🔍 Running contract test suite: ${name}`);
                const results = [];

                for (const test of this.tests) {
                    try {
                        await test.fn();
                        results.push({ name: test.name, status: 'passed' });
                        console.log(`✅ ${test.name}`);
                    } catch (error) {
                        results.push({ name: test.name, status: 'failed', error });
                        console.log(`❌ ${test.name}: ${error}`);
                    }
                }

                return results;
            }
        };
    },

    /**
     * Generate contract violation reports
     */
    generateViolationReport: (failures: any[]) => {
        return {
            summary: {
                totalTests: failures.length,
                failedTests: failures.filter(f => f.status === 'failed').length,
                passedTests: failures.filter(f => f.status === 'passed').length,
                timestamp: new Date().toISOString()
            },
            violations: failures.filter(f => f.status === 'failed'),
            recommendations: generateRecommendations(failures)
        };
    }
};

function generateRecommendations(failures: any[]): string[] {
    const recommendations = [];

    const hasSchemaViolations = failures.some(f =>
        f.error && f.error.message && f.error.message.includes('Missing required field')
    );
    if (hasSchemaViolations) {
        recommendations.push('Review API response schemas and ensure all required fields are included');
    }

    const hasPerformanceIssues = failures.some(f =>
        f.error && f.error.message && f.error.message.includes('timeout')
    );
    if (hasPerformanceIssues) {
        recommendations.push('Optimize API endpoints and WebSocket message processing for better performance');
    }

    const hasDataValidationIssues = failures.some(f =>
        f.error && f.error.message && f.error.message.includes('validation')
    );
    if (hasDataValidationIssues) {
        recommendations.push('Strengthen input validation and data sanitization');
    }

    return recommendations;
}

export default {
    ContractTestConfig,
    ContractTestUtils,
    WebSocketContractUtils: (await import('./websocket.contract.test')).WebSocketContractUtils,
    APIContractUtils: (await import('./api.contract.test')).APIContractUtils
};
