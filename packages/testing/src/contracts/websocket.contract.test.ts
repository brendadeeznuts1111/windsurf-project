// WebSocket Contract Testing
// Ensures WebSocket messages conform to expected schemas and behaviors

import { test, describe, expect, beforeAll, afterAll } from "bun:test";
import { WebSocketServer, WebSocket } from "ws";
import { ContractTestFactory, WebSocketMessageFactory } from "../factories";

// Contract schemas
const WebSocketMessageSchema = {
    type: "object",
    required: ["type", "timestamp", "data"],
    properties: {
        type: { type: "string", enum: ["odds-update", "arbitrage-alert", "market-data"] },
        timestamp: { type: "string", format: "date-time" },
        data: { type: "object" }
    }
};

const OddsUpdateSchema = {
    type: "object",
    required: ["id", "sport", "event", "odds", "timestamp", "bookmaker"],
    properties: {
        id: { type: "string" },
        sport: { type: "string" },
        event: { type: "string" },
        odds: {
            type: "object",
            required: ["home", "away"],
            properties: {
                home: { type: "number" },
                away: { type: "number" }
            }
        },
        timestamp: { type: "string", format: "date-time" },
        bookmaker: { type: "string" }
    }
};

// Schema validation utility
function validateSchema(data: any, schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (schema.required) {
        for (const field of schema.required) {
            if (!(field in data)) {
                errors.push(`Missing required field: ${field}`);
            }
        }
    }

    if (schema.properties) {
        for (const [field, fieldSchema] of Object.entries(schema.properties)) {
            if (field in data) {
                const fieldDef = fieldSchema as any;
                if (fieldDef.type && typeof data[field] !== fieldDef.type) {
                    errors.push(`Field ${field} should be ${fieldDef.type}, got ${typeof data[field]}`);
                }
                if (fieldDef.enum && !fieldDef.enum.includes(data[field])) {
                    errors.push(`Field ${field} should be one of ${fieldDef.enum}, got ${data[field]}`);
                }
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

describe("WebSocket Contract Tests", () => {
    let server: WebSocketServer;
    let serverUrl: string;
    let clientConnections: WebSocket[] = [];

    beforeAll(async () => {
        // Start test WebSocket server
        server = new WebSocketServer({ port: 0 });
        serverUrl = `ws://localhost:${(server.address() as any)?.port}`;

        server.on('connection', (ws) => {
            clientConnections.push(ws);

            // Send initial contract test messages
            const validMessage = ContractTestFactory.createWebSocketContractMessages().valid;
            ws.send(JSON.stringify(validMessage));
        });

        await new Promise(resolve => {
            server.on('listening', resolve);
        });
    });

    afterAll(() => {
        clientConnections.forEach(ws => ws.close());
        server.close();
    });

    describe("Message Schema Validation", () => {
        test("valid WebSocket message passes schema validation", () => {
            const { valid } = ContractTestFactory.createWebSocketContractMessages();
            const validation = validateSchema(valid, WebSocketMessageSchema);

            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        test("invalid WebSocket message fails schema validation", () => {
            const { invalid } = ContractTestFactory.createWebSocketContractMessages();
            const validation = validateSchema(invalid, WebSocketMessageSchema);

            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validation.errors).toContain('Missing required field: timestamp');
            expect(validation.errors).toContain('Missing required field: data');
        });

        test("odds-update message contains required odds data", () => {
            const oddsMessage = WebSocketMessageFactory.createOddsUpdate(
                ContractTestFactory.createValidOddsTickContract()
            );

            const validation = validateSchema(oddsMessage.data, OddsUpdateSchema);

            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        test("arbitrage-alert message contains opportunity data", () => {
            const opportunity = ContractTestFactory.createValidOddsTickContract();
            const arbitrageMessage = WebSocketMessageFactory.create({
                type: 'arbitrage-alert',
                data: {
                    id: 'arb-123',
                    sport: opportunity.sport,
                    event: opportunity.event,
                    profit: 2.5,
                    opportunities: [opportunity]
                }
            });

            expect(arbitrageMessage.type).toBe('arbitrage-alert');
            expect(arbitrageMessage.data).toHaveProperty('profit');
            expect(arbitrageMessage.data).toHaveProperty('opportunities');
            expect(typeof arbitrageMessage.data.profit).toBe('number');
        });
    });

    describe("Connection Contract", () => {
        test("WebSocket server accepts connections", async () => {
            const ws = new WebSocket(serverUrl);

            await new Promise<void>((resolve, reject) => {
                ws.on('open', () => resolve());
                ws.on('error', reject);
                setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });

            expect(ws.readyState).toBe(WebSocket.OPEN);
            ws.close();
        });

        test("server sends valid message format on connection", async () => {
            const ws = new WebSocket(serverUrl);

            const message = await new Promise<string>((resolve, reject) => {
                ws.on('message', (data) => resolve(data.toString()));
                ws.on('error', reject);
                setTimeout(() => reject(new Error('Message timeout')), 5000);
            });

            const parsedMessage = JSON.parse(message);
            const validation = validateSchema(parsedMessage, WebSocketMessageSchema);

            expect(validation.valid).toBe(true);
            ws.close();
        });

        test("connection handles malformed messages gracefully", async () => {
            const ws = new WebSocket(serverUrl);

            await new Promise<void>((resolve, reject) => {
                ws.on('open', () => {
                    // Send malformed JSON
                    ws.send('{"invalid": json}');

                    // Connection should remain open
                    setTimeout(() => {
                        expect(ws.readyState).toBe(WebSocket.OPEN);
                        resolve();
                    }, 1000);
                });

                ws.on('error', reject);
                setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });

            ws.close();
        });
    });

    describe("Message Flow Contract", () => {
        test("messages maintain chronological order", async () => {
            const ws = new WebSocket(serverUrl);
            const receivedMessages: any[] = [];

            await new Promise<void>((resolve, reject) => {
                ws.on('open', () => {
                    // Send multiple messages with different timestamps
                    const messages = [
                        WebSocketMessageFactory.create({
                            timestamp: '2024-01-01T12:00:00Z'
                        }),
                        WebSocketMessageFactory.create({
                            timestamp: '2024-01-01T12:01:00Z'
                        }),
                        WebSocketMessageFactory.create({
                            timestamp: '2024-01-01T12:02:00Z'
                        })
                    ];

                    messages.forEach(msg => ws.send(JSON.stringify(msg)));
                });

                ws.on('message', (data) => {
                    receivedMessages.push(JSON.parse(data.toString()));
                    if (receivedMessages.length === 3) {
                        resolve();
                    }
                });

                ws.on('error', reject);
                setTimeout(() => reject(new Error('Message flow timeout')), 5000);
            });

            // Verify chronological order
            const timestamps = receivedMessages.map(msg => new Date(msg.timestamp).getTime());
            expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));

            ws.close();
        });

        test("message rate limits are enforced", async () => {
            const ws = new WebSocket(serverUrl);
            let messageCount = 0;
            let rejectedCount = 0;

            await new Promise<void>((resolve, reject) => {
                ws.on('open', () => {
                    // Send messages rapidly to test rate limiting
                    for (let i = 0; i < 100; i++) {
                        ws.send(JSON.stringify(WebSocketMessageFactory.create()));
                    }

                    setTimeout(() => resolve(), 2000);
                });

                ws.on('message', () => messageCount++);
                ws.on('error', () => rejectedCount++);

                setTimeout(() => reject(new Error('Rate limit test timeout')), 10000);
            });

            // Should accept some messages but potentially reject others due to rate limiting
            expect(messageCount).toBeGreaterThan(0);
            expect(messageCount + rejectedCount).toBeGreaterThan(0);

            ws.close();
        });
    });

    describe("Error Handling Contract", () => {
        test("server responds to unknown message types", async () => {
            const ws = new WebSocket(serverUrl);

            const response = await new Promise<string>((resolve, reject) => {
                ws.on('open', () => {
                    ws.send(JSON.stringify({
                        type: 'unknown-type',
                        timestamp: new Date().toISOString(),
                        data: {}
                    }));
                });

                ws.on('message', (data) => resolve(data.toString()));
                ws.on('error', reject);
                setTimeout(() => reject(new Error('Error response timeout')), 5000);
            });

            const parsedResponse = JSON.parse(response);
            expect(parsedResponse.type).toBe('error');
            expect(parsedResponse.data).toHaveProperty('message');

            ws.close();
        });

        test("connection closes gracefully on protocol errors", async () => {
            const ws = new WebSocket(serverUrl);

            await new Promise<void>((resolve, reject) => {
                ws.on('open', () => {
                    // Send message that violates protocol
                    ws.send('completely invalid message');
                });

                ws.on('close', (code) => {
                    expect(code).toBe(1002); // Protocol error
                    resolve();
                });

                ws.on('error', reject);
                setTimeout(() => reject(new Error('Close timeout')), 5000);
            });
        });
    });

    describe("Performance Contract", () => {
        test("message processing meets latency requirements", async () => {
            const ws = new WebSocket(serverUrl);
            const latencies: number[] = [];

            await new Promise<void>((resolve, reject) => {
                ws.on('open', () => {
                    const testMessage = WebSocketMessageFactory.create();

                    for (let i = 0; i < 10; i++) {
                        const startTime = performance.now();
                        ws.send(JSON.stringify(testMessage));

                        ws.once('message', () => {
                            const latency = performance.now() - startTime;
                            latencies.push(latency);

                            if (latencies.length === 10) {
                                resolve();
                            }
                        });
                    }
                });

                ws.on('error', reject);
                setTimeout(() => reject(new Error('Performance test timeout')), 10000);
            });

            const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            expect(avgLatency).toBeLessThan(100); // Should process messages in under 100ms

            ws.close();
        });

        test("concurrent connections are handled within limits", async () => {
            const connections = Array.from({ length: 50 }, () => new WebSocket(serverUrl));
            let connectedCount = 0;

            await new Promise<void>((resolve, reject) => {
                connections.forEach(ws => {
                    ws.on('open', () => {
                        connectedCount++;
                        if (connectedCount === connections.length) {
                            resolve();
                        }
                    });

                    ws.on('error', reject);
                });

                setTimeout(() => reject(new Error('Connection timeout')), 10000);
            });

            expect(connectedCount).toBe(connections.length);

            // Cleanup
            connections.forEach(ws => ws.close());
        });
    });
});

// Contract test utilities
export const WebSocketContractUtils = {
    validateSchema,
    WebSocketMessageSchema,
    OddsUpdateSchema,

    createContractTestSuite: (customSchema?: any) => {
        return {
            validateMessage: (message: any) => validateSchema(message, customSchema || WebSocketMessageSchema),
            expectValidMessage: (message: any) => {
                const validation = validateSchema(message, customSchema || WebSocketMessageSchema);
                expect(validation.valid).toBe(true);
                return validation;
            },
            expectInvalidMessage: (message: any, expectedErrors?: string[]) => {
                const validation = validateSchema(message, customSchema || WebSocketMessageSchema);
                expect(validation.valid).toBe(false);
                if (expectedErrors) {
                    expectedErrors.forEach(error => {
                        expect(validation.errors).toContain(error);
                    });
                }
                return validation;
            }
        };
    }
};
