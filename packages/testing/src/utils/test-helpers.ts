// Test Utilities and Helpers
// Common utilities used across all test suites

import { OddsTick, ArbitrageOpportunity, WebSocketMessage } from "@odds-core/types";

// ===== ASSERTION HELPERS =====

/**
 * Custom assertion helpers for domain-specific testing
 */
export class DomainAssertions {
    /**
     * Assert that an odds tick has valid structure and data
     */
    static assertValidOddsTick(oddsTick: OddsTick) {
        expect(oddsTick).toBeDefined();
        expect(oddsTick.id).toBeDefined();
        expect(typeof oddsTick.id).toBe('string');

        expect(oddsTick.sport).toBeDefined();
        expect(typeof oddsTick.sport).toBe('string');
        expect(['basketball', 'football', 'baseball', 'soccer']).toContain(oddsTick.sport);

        expect(oddsTick.event).toBeDefined();
        expect(typeof oddsTick.event).toBe('string');

        expect(oddsTick.odds).toBeDefined();
        expect(oddsTick.odds).toHaveProperty('home');
        expect(oddsTick.odds).toHaveProperty('away');
        expect(typeof oddsTick.odds.home).toBe('number');
        expect(typeof oddsTick.odds.away).toBe('number');

        expect(oddsTick.timestamp).toBeDefined();
        expect(typeof oddsTick.timestamp).toBe('string');
        const timestamp = new Date(oddsTick.timestamp);
        expect(timestamp.getTime()).not.toBeNaN();

        expect(oddsTick.bookmaker).toBeDefined();
        expect(typeof oddsTick.bookmaker).toBe('string');
    }

    /**
     * Assert that American odds are in valid format
     */
    static assertValidAmericanOdds(odds: number) {
        expect(typeof odds).toBe('number');
        expect(Number.isFinite(odds)).toBe(true);

        if (odds < 0) {
            expect(odds).toBeLessThanOrEqual(-100);
        } else {
            expect(odds).toBeGreaterThan(0);
        }
    }

    /**
     * Assert that arbitrage opportunity is mathematically valid
     */
    static assertValidArbitrageOpportunity(opportunity: ArbitrageOpportunity) {
        expect(opportunity).toBeDefined();
        expect(opportunity.id).toBeDefined();
        expect(opportunity.sport).toBeDefined();
        expect(opportunity.event).toBeDefined();
        expect(opportunity.opportunities).toBeDefined();
        expect(opportunity.profit).toBeDefined();
        expect(opportunity.timestamp).toBeDefined();

        expect(Array.isArray(opportunity.opportunities)).toBe(true);
        expect(opportunity.opportunities.length).toBeGreaterThan(1);
        expect(opportunity.profit).toBeGreaterThanOrEqual(0);

        // Validate each opportunity
        opportunity.opportunities.forEach(opp => {
            expect(opp.bookmaker).toBeDefined();
            expect(opp.odds).toBeDefined();
            expect(opp.commission).toBeDefined();
            expect(opp.commission).toBeGreaterThanOrEqual(0);
            expect(opp.commission).toBeLessThan(1);
        });
    }

    /**
     * Assert WebSocket message structure
     */
    static assertValidWebSocketMessage(message: WebSocketMessage) {
        expect(message).toBeDefined();
        expect(message.type).toBeDefined();
        expect(typeof message.type).toBe('string');
        expect(['odds-update', 'arbitrage-alert', 'market-data']).toContain(message.type);

        expect(message.timestamp).toBeDefined();
        expect(typeof message.timestamp).toBe('string');
        const timestamp = new Date(message.timestamp);
        expect(timestamp.getTime()).not.toBeNaN();

        expect(message.data).toBeDefined();
        expect(typeof message.data).toBe('object');
    }

    /**
     * Assert performance metrics are within acceptable bounds
     */
    static assertPerformanceMetrics(metrics: {
        duration: number;
        operations?: number;
        memory?: number;
    }, thresholds: {
        maxDuration: number;
        minOpsPerSec?: number;
        maxMemoryIncrease?: number;
    }) {
        expect(metrics.duration).toBeLessThan(thresholds.maxDuration);

        if (thresholds.minOpsPerSec && metrics.operations) {
            const opsPerSec = metrics.operations / (metrics.duration / 1000);
            expect(opsPerSec).toBeGreaterThan(thresholds.minOpsPerSec);
        }

        if (thresholds.maxMemoryIncrease && metrics.memory) {
            expect(metrics.memory).toBeLessThan(thresholds.maxMemoryIncrease);
        }
    }
}

// ===== MOCK HELPERS =====

/**
 * Mock WebSocket client for testing
 */
export class MockWebSocket {
    public sentMessages: any[] = [];
    public receivedMessages: any[] = [];
    public isOpen = false;

    private eventHandlers: Record<string, Function[]> = {};

    constructor(public url: string) { }

    send(data: any) {
        this.sentMessages.push(data);
    }

    on(event: string, handler: Function) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    emit(event: string, data?: any) {
        const handlers = this.eventHandlers[event] || [];
        handlers.forEach(handler => handler(data));
    }

    simulateMessage(message: any) {
        this.receivedMessages.push(message);
        this.emit('message', JSON.stringify(message));
    }

    simulateOpen() {
        this.isOpen = true;
        this.emit('open');
    }

    simulateClose(code?: number, reason?: string) {
        this.isOpen = false;
        this.emit('close', code, reason);
    }

    simulateError(error: Error) {
        this.emit('error', error);
    }

    close() {
        this.simulateClose(1000, 'Normal closure');
    }
}

/**
 * Mock HTTP client for API testing
 */
export class MockAPIClient {
    private responses = new Map<string, any>();
    private requestHistory: any[] = [];

    constructor() {
        this.setupDefaultResponses();
    }

    private setupDefaultResponses() {
        this.responses.set('/api/odds', {
            status: 200,
            data: [],
            pagination: { page: 1, total: 0, limit: 20 }
        });

        this.responses.set('/api/arbitrage', {
            status: 200,
            data: []
        });

        this.responses.set('/api/health', {
            status: 200,
            data: { status: 'healthy', timestamp: new Date().toISOString() }
        });
    }

    setResponse(endpoint: string, response: any) {
        this.responses.set(endpoint, response);
    }

    async get(endpoint: string, options?: any): Promise<any> {
        this.requestHistory.push({ method: 'GET', endpoint, options });

        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));

        return this.responses.get(endpoint) || { status: 404, data: null };
    }

    async post(endpoint: string, data?: any): Promise<any> {
        this.requestHistory.push({ method: 'POST', endpoint, data });

        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

        if (endpoint.includes('/calculate')) {
            return {
                status: 200,
                data: { success: true, calculation: { profit: 2.5, confidence: 0.95 } }
            };
        }

        return this.responses.get(endpoint) || { status: 404, data: null };
    }

    getRequestHistory() {
        return this.requestHistory;
    }

    clearHistory() {
        this.requestHistory = [];
    }
}

// ===== PERFORMANCE HELPERS =====

/**
 * Performance measurement utilities
 */
export class PerformanceHelper {
    private measurements: Array<{ name: string; duration: number; timestamp: number }> = [];

    startTimer(name: string): () => number {
        const startTime = performance.now();
        return () => {
            const duration = performance.now() - startTime;
            this.measurements.push({ name, duration, timestamp: Date.now() });
            return duration;
        };
    }

    getAverageDuration(name: string): number {
        const measurements = this.measurements.filter(m => m.name === name);
        if (measurements.length === 0) return 0;
        return measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
    }

    getMeasurements(name?: string) {
        return name
            ? this.measurements.filter(m => m.name === name)
            : this.measurements;
    }

    reset() {
        this.measurements = [];
    }

    assertPerformance(name: string, maxDuration: number) {
        const avg = this.getAverageDuration(name);
        expect(avg).toBeLessThan(maxDuration);
    }
}

/**
 * Memory monitoring utilities
 */
export class MemoryHelper {
    private initialMemory: NodeJS.MemoryUsage;

    constructor() {
        this.initialMemory = process.memoryUsage();
    }

    getCurrentMemory(): NodeJS.MemoryUsage {
        return process.memoryUsage();
    }

    getMemoryIncrease(): NodeJS.MemoryUsage {
        const current = this.getCurrentMemory();
        return {
            rss: current.rss - this.initialMemory.rss,
            heapTotal: current.heapTotal - this.initialMemory.heapTotal,
            heapUsed: current.heapUsed - this.initialMemory.heapUsed,
            external: current.external - this.initialMemory.external,
            arrayBuffers: current.arrayBuffers - this.initialMemory.arrayBuffers
        };
    }

    assertMemoryIncrease(maxIncreaseMB: number) {
        const increase = this.getMemoryIncrease();
        const increaseMB = increase.heapUsed / 1024 / 1024;
        expect(increaseMB).toBeLessThan(maxIncreaseMB);
    }

    forceGC() {
        if (global.gc) {
            global.gc();
        }
    }
}

// ===== TEST SCENARIO HELPERS =====

/**
 * Test scenario builders
 */
export class TestScenarioHelper {
    /**
     * Create a complete arbitrage detection scenario
     */
    static createArbitrageScenario() {
        const oddsTick1 = {
            id: 'odds-1',
            sport: 'basketball',
            event: 'Lakers vs Celtics',
            odds: { home: -110, away: -110 },
            timestamp: new Date().toISOString(),
            bookmaker: 'BookMakerA'
        };

        const oddsTick2 = {
            id: 'odds-2',
            sport: 'basketball',
            event: 'Lakers vs Celtics',
            odds: { home: -105, away: -115 },
            timestamp: new Date().toISOString(),
            bookmaker: 'BookMakerB'
        };

        const arbitrageOpportunity = {
            id: 'arb-1',
            sport: 'basketball',
            event: 'Lakers vs Celtics',
            opportunities: [oddsTick1, oddsTick2],
            profit: 2.5,
            timestamp: new Date().toISOString()
        };

        return {
            oddsTicks: [oddsTick1, oddsTick2],
            arbitrageOpportunity,
            expectedProfit: 2.5
        };
    }

    /**
     * Create a high-frequency WebSocket message scenario
     */
    static createHighFrequencyScenario(messageCount: number, intervalMs: number = 100) {
        const messages = [];
        const startTime = Date.now();

        for (let i = 0; i < messageCount; i++) {
            messages.push({
                type: 'odds-update',
                timestamp: new Date(startTime + i * intervalMs).toISOString(),
                data: {
                    id: `odds-${i}`,
                    sport: 'basketball',
                    odds: { home: -110 + i, away: -110 - i }
                }
            });
        }

        return {
            messages,
            duration: messageCount * intervalMs,
            messageRate: messageCount / ((messageCount * intervalMs) / 1000)
        };
    }

    /**
     * Create a concurrent user scenario
     */
    static createConcurrentUserScenario(userCount: number, messagesPerUser: number) {
        const users = [];

        for (let i = 0; i < userCount; i++) {
            const user = {
                id: `user-${i}`,
                messages: []
            };

            for (let j = 0; j < messagesPerUser; j++) {
                user.messages.push({
                    type: 'odds-update',
                    timestamp: new Date().toISOString(),
                    data: { userId: user.id, messageId: j }
                });
            }

            users.push(user);
        }

        return {
            users,
            totalMessages: userCount * messagesPerUser,
            userCount
        };
    }
}

// ===== DATA VALIDATION HELPERS =====

/**
 * Data validation utilities
 */
export class ValidationHelper {
    /**
     * Validate ISO 8601 timestamp
     */
    static isValidTimestamp(timestamp: string): boolean {
        const date = new Date(timestamp);
        return !isNaN(date.getTime()) && timestamp.includes('T');
    }

    /**
     * Validate American odds format
     */
    static isValidAmericanOdds(odds: number): boolean {
        if (!Number.isFinite(odds)) return false;
        if (odds < 0) return odds <= -100;
        return odds > 0;
    }

    /**
     * Validate probability (0-1)
     */
    static isValidProbability(probability: number): boolean {
        return Number.isFinite(probability) && probability >= 0 && probability <= 1;
    }

    /**
     * Validate percentage (0-100)
     */
    static isValidPercentage(percentage: number): boolean {
        return Number.isFinite(percentage) && percentage >= 0 && percentage <= 100;
    }

    /**
     * Validate UUID format
     */
    static isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
}

// ===== ASYNC TESTING HELPERS =====

/**
 * Async testing utilities
 */
export class AsyncHelper {
    /**
     * Wait for a condition to be true
     */
    static async waitFor(
        condition: () => boolean | Promise<boolean>,
        timeout: number = 5000,
        interval: number = 100
    ): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const result = await condition();
            if (result) return;
            await new Promise(resolve => setTimeout(resolve, interval));
        }

        throw new Error(`Condition not met within ${timeout}ms`);
    }

    /**
     * Wait for multiple promises with timeout
     */
    static async waitForAll<T>(
        promises: Promise<T>[],
        timeout: number = 5000
    ): Promise<T[]> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
        });

        return Promise.race([
            Promise.all(promises),
            timeoutPromise
        ]);
    }

    /**
     * Create a promise that resolves after a delay
     */
    static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export all helper classes
export {
    DomainAssertions,
    MockWebSocket,
    MockAPIClient,
    PerformanceHelper,
    MemoryHelper,
    TestScenarioHelper,
    ValidationHelper,
    AsyncHelper
};

// Default export for convenience
export default {
    DomainAssertions,
    MockWebSocket,
    MockAPIClient,
    PerformanceHelper,
    MemoryHelper,
    TestScenarioHelper,
    ValidationHelper,
    AsyncHelper
};
