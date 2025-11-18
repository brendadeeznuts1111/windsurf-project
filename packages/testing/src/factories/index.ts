// Test Data Factories - Centralized mock generation
// Provides consistent, realistic test data across all test suites

import { faker } from '@faker-js/faker';
import { OddsTick, ArbitrageOpportunity, WebSocketMessage, MarketData } from '@odds-core/types';

// ===== CORE DATA FACTORIES =====

/**
 * Factory for generating OddsTick objects
 */
export class OddsTickFactory {
    static create(overrides: Partial<OddsTick> = {}): OddsTick {
        const baseTick: OddsTick = {
            id: faker.string.uuid(),
            sport: faker.helpers.arrayElement(['basketball', 'football', 'baseball', 'soccer']),
            event: `${faker.team.name()} vs ${faker.team.name()}`,
            odds: {
                home: faker.number.int({ min: -200, max: -100 }),
                away: faker.number.int({ min: -200, max: -100 })
            },
            timestamp: faker.date.recent().toISOString(),
            bookmaker: faker.helpers.arrayElement(['BookMakerA', 'BookMakerB', 'BookMakerC']),
            exchange: faker.helpers.arrayElement(['Exchange1', 'Exchange2']),
            gameId: faker.string.alphanumeric(10),
            line: faker.number.int({ min: -5, max: 5 }),
            juice: faker.number.int({ min: -110, max: -105 })
        };

        return { ...baseTick, ...overrides };
    }

    static createBatch(count: number, overrides: Partial<OddsTick> = {}): OddsTick[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }

    static createWithSpecificOdds(homeOdds: number, awayOdds: number): OddsTick {
        return this.create({
            odds: { home: homeOdds, away: awayOdds }
        });
    }

    static createArbitrageOpportunity(): OddsTick[] {
        return [
            this.create({ bookmaker: 'BookMakerA', odds: { home: -110, away: -110 } }),
            this.create({ bookmaker: 'BookMakerB', odds: { home: -105, away: -115 } })
        ];
    }
}

/**
 * Factory for generating ArbitrageOpportunity objects
 */
export class ArbitrageOpportunityFactory {
    static create(overrides: Partial<ArbitrageOpportunity> = {}): ArbitrageOpportunity {
        const baseOpportunity: ArbitrageOpportunity = {
            id: faker.string.uuid(),
            sport: faker.helpers.arrayElement(['basketball', 'football', 'baseball']),
            event: `${faker.team.name()} vs ${faker.team.name()}`,
            opportunities: [
                {
                    bookmaker: faker.company.name(),
                    odds: faker.number.int({ min: -150, max: -100 }),
                    commission: faker.number.float({ min: 0.01, max: 0.05, precision: 0.001 })
                },
                {
                    bookmaker: faker.company.name(),
                    odds: faker.number.int({ min: -150, max: -100 }),
                    commission: faker.number.float({ min: 0.01, max: 0.05, precision: 0.001 })
                }
            ],
            profit: faker.number.float({ min: 0.5, max: 5.0, precision: 0.1 }),
            timestamp: faker.date.recent().toISOString()
        };

        return { ...baseOpportunity, ...overrides };
    }

    static createProfitable(): ArbitrageOpportunity {
        return this.create({
            profit: faker.number.float({ min: 1.0, max: 5.0, precision: 0.1 }),
            opportunities: [
                { bookmaker: 'BookMakerA', odds: -110, commission: 0.02 },
                { bookmaker: 'BookMakerB', odds: -105, commission: 0.025 }
            ]
        });
    }

    static createNonProfitable(): ArbitrageOpportunity | null {
        return null; // Represents scenarios with no arbitrage opportunity
    }
}

/**
 * Factory for generating WebSocketMessage objects
 */
export class WebSocketMessageFactory {
    static create(overrides: Partial<WebSocketMessage> = {}): WebSocketMessage {
        const baseMessage: WebSocketMessage = {
            type: faker.helpers.arrayElement(['odds-update', 'arbitrage-alert', 'market-data']),
            timestamp: faker.date.recent().toISOString(),
            data: {
                id: faker.string.uuid(),
                odds: { home: -110, away: -110 }
            }
        };

        return { ...baseMessage, ...overrides };
    }

    static createOddsUpdate(oddsTick: OddsTick): WebSocketMessage {
        return this.create({
            type: 'odds-update',
            data: oddsTick
        });
    }

    static createArbitrageAlert(opportunity: ArbitrageOpportunity): WebSocketMessage {
        return this.create({
            type: 'arbitrage-alert',
            data: opportunity
        });
    }

    static createBatch(count: number): WebSocketMessage[] {
        return Array.from({ length: count }, () => this.create());
    }
}

/**
 * Factory for generating MarketData objects
 */
export class MarketDataFactory {
    static create(overrides: Partial<MarketData> = {}): MarketData {
        const baseMarket: MarketData = {
            sport: faker.helpers.arrayElement(['basketball', 'football', 'baseball', 'soccer']),
            league: faker.helpers.arrayElement(['NBA', 'NFL', 'MLB', 'Premier League']),
            event: `${faker.team.name()} vs ${faker.team.name()}`,
            startTime: faker.date.future().toISOString(),
            status: faker.helpers.arrayElement(['upcoming', 'live', 'completed']),
            markets: [
                {
                    type: 'moneyline',
                    outcomes: [
                        { name: 'Home', odds: -110, impliedProbability: 0.476 },
                        { name: 'Away', odds: -110, impliedProbability: 0.476 }
                    ]
                },
                {
                    type: 'spread',
                    outcomes: [
                        { name: 'Home -2.5', odds: -110, impliedProbability: 0.476 },
                        { name: 'Away +2.5', odds: -110, impliedProbability: 0.476 }
                    ]
                }
            ]
        };

        return { ...baseMarket, ...overrides };
    }
}

// ===== SPECIALIZED FACTORIES =====

/**
 * Factory for performance testing data
 */
export class PerformanceDataFactory {
    static createLargeDataset(size: number): OddsTick[] {
        return OddsTickFactory.createBatch(size);
    }

    static createHighFrequencyData(durationMs: number, intervalMs: number = 100): OddsTick[] {
        const dataPoints = Math.floor(durationMs / intervalMs);
        return Array.from({ length: dataPoints }, (_, i) =>
            OddsTickFactory.create({
                timestamp: new Date(Date.now() - (durationMs - i * intervalMs)).toISOString()
            })
        );
    }

    static createMemoryPressureData(): any[] {
        return Array.from({ length: 1000 }, () =>
            new Array(10000).fill(null).map(() => ({
                data: faker.lorem.words(100),
                timestamp: faker.date.recent().getTime()
            }))
        );
    }
}

/**
 * Factory for network/API testing
 */
export class NetworkDataFactory {
    static createAPIResponse(success: boolean = true): any {
        return {
            success,
            data: success ? OddsTickFactory.createBatch(10) : null,
            error: success ? null : { message: 'API Error', code: 500 },
            timestamp: faker.date.recent().toISOString()
        };
    }

    static createWebSocketFrame(message: WebSocketMessage): Buffer {
        const messageStr = JSON.stringify(message);
        return Buffer.from(messageStr, 'utf-8');
    }

    static createMockEndpoints(): Array<{ url: string, response: any }> {
        return [
            {
                url: '/api/odds/basketball',
                response: OddsTickFactory.createBatch(20)
            },
            {
                url: '/api/arbitrage/opportunities',
                response: ArbitrageOpportunityFactory.createBatch(5)
            },
            {
                url: '/api/markets/live',
                response: MarketDataFactory.createBatch(10)
            }
        ];
    }
}

// ===== CONTRACT TESTING FACTORIES =====

/**
 * Factory for contract testing scenarios
 */
export class ContractTestFactory {
    static createValidOddsTickContract(): OddsTick {
        return OddsTickFactory.create({
            id: 'contract-test-123',
            sport: 'basketball',
            event: 'Lakers vs Celtics',
            odds: { home: -110, away: -110 },
            timestamp: '2024-01-01T12:00:00Z',
            bookmaker: 'TestBookMaker'
        });
    }

    static createInvalidOddsTickContract(): any {
        return {
            // Missing required fields for contract testing
            id: 'invalid-contract',
            sport: 'basketball'
            // Missing: event, odds, timestamp, bookmaker
        };
    }

    static createWebSocketContractMessages(): {
        valid: WebSocketMessage;
        invalid: any;
        malformed: string;
    } {
        return {
            valid: WebSocketMessageFactory.createOddsUpdate(
                this.createValidOddsTickContract()
            ),
            invalid: {
                type: 'invalid-type',
                // Missing timestamp and data
            },
            malformed: '{"type": "malformed", "incomplete": json'
        };
    }

    static createAPIContractResponses(): {
        valid: any;
        invalid: any;
        error: any;
    } {
        return {
            valid: {
                status: 200,
                body: {
                    success: true,
                    data: OddsTickFactory.createBatch(5),
                    pagination: { page: 1, total: 100 }
                }
            },
            invalid: {
                status: 200,
                body: {
                    // Missing required fields
                    data: OddsTickFactory.createBatch(5)
                }
            },
            error: {
                status: 500,
                body: {
                    success: false,
                    error: { message: 'Internal Server Error', code: 500 }
                }
            }
        };
    }
}

// ===== BATCH FACTORY HELPERS =====

/**
 * Utility class for creating complex test scenarios
 */
export class TestScenarioFactory {
    static createArbitrageScenario(): {
        marketOdds: OddsTick[];
        opportunities: ArbitrageOpportunity[];
        expectedProfit: number;
    } {
        const marketOdds = [
            OddsTickFactory.create({ bookmaker: 'BookMakerA', odds: { home: -110, away: -110 } }),
            OddsTickFactory.create({ bookmaker: 'BookMakerB', odds: { home: -105, away: -115 } }),
            OddsTickFactory.create({ bookmaker: 'BookMakerC', odds: { home: -108, away: -112 } })
        ];

        const opportunities = [
            ArbitrageOpportunityFactory.createProfitable()
        ];

        return {
            marketOdds,
            opportunities,
            expectedProfit: opportunities[0].profit
        };
    }

    static createHighVolumeScenario(): {
        ticks: OddsTick[];
        messages: WebSocketMessage[];
        duration: number;
    } {
        const ticks = PerformanceDataFactory.createLargeDataset(50000);
        const messages = ticks.map(tick =>
            WebSocketMessageFactory.createOddsUpdate(tick)
        );

        return {
            ticks,
            messages,
            duration: 60000 // 1 minute
        };
    }

    static createConcurrentUserScenario(userCount: number): {
        userIds: string[];
        connections: Array<{ userId: string, messages: WebSocketMessage[] }>;
    } {
        const userIds = Array.from({ length: userCount }, () => faker.string.uuid());
        const connections = userIds.map(userId => ({
            userId,
            messages: WebSocketMessageFactory.createBatch(
                faker.number.int({ min: 10, max: 100 })
            )
        }));

        return { userIds, connections };
    }
}

// Export all factories
export {
    OddsTickFactory,
    ArbitrageOpportunityFactory,
    WebSocketMessageFactory,
    MarketDataFactory,
    PerformanceDataFactory,
    NetworkDataFactory,
    ContractTestFactory,
    TestScenarioFactory
};

// Default export for convenience
export default {
    OddsTick: OddsTickFactory,
    ArbitrageOpportunity: ArbitrageOpportunityFactory,
    WebSocketMessage: WebSocketMessageFactory,
    MarketData: MarketDataFactory,
    Performance: PerformanceDataFactory,
    Network: NetworkDataFactory,
    Contract: ContractTestFactory,
    Scenario: TestScenarioFactory
};
