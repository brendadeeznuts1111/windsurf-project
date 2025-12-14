// src/comprehensive-test.example.ts
// Example test file to demonstrate comprehensive configuration

import { test, expect, describe } from "bun:test";

describe("Comprehensive Configuration Demo", () => {
    test("environment variables are set correctly", () => {
        expect(process.env.NODE_ENV).toBe("test");
        expect(process.env.DATABASE_URL).toBe("postgresql://localhost:5432/test_db");
        expect(process.env.API_URL).toBe("http://localhost:3001");
        expect(process.env.LOG_LEVEL).toBe("error");
    });

    test("global test utilities are available", () => {
        expect(global.testUtils).toBeDefined();
        expect(global.testEnvironment).toBe("comprehensive-test");
        expect(global.testStartTime).toBeDefined();

        // Test utility functions
        const mockUser = global.testUtils.generateMockData("user");
        expect(mockUser).toHaveProperty("id");
        expect(mockUser).toHaveProperty("name");
        expect(mockUser).toHaveProperty("email");
    });

    test("database mock works correctly", async () => {
        // Mock database functionality using test utilities
        const mockDb = global.testUtils.generateMockData("database");
        expect(mockDb).toHaveProperty("connection");
        expect(mockDb).toHaveProperty("query");

        // Simulate a database query result
        const mockResult = {
            rows: [{ id: 1, name: "Test User" }],
            rowCount: 1
        };

        expect(mockResult.rows).toHaveLength(1);
        expect(mockResult.rowCount).toBe(1);
    });

    test("API mock works correctly", async () => {
        // Create a mock API server using test utilities
        const mockServer = global.testUtils.createMockServer(async (req) => {
            if (req.method === "GET" && req.url.includes("/api/users")) {
                return new Response(JSON.stringify({
                    url: req.url,
                    method: req.method,
                    data: [{ id: 1, name: "Test User" }]
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (req.method === "POST" && req.url.includes("/api/users")) {
                const body = await req.json();
                return new Response(JSON.stringify({
                    data: { id: 2, ...body },
                    created: true
                }), {
                    status: 201,
                    headers: { "Content-Type": "application/json" }
                });
            }

            return new Response("Not Found", { status: 404 });
        });

        try {
            // Test GET request
            const getResponse = await fetch(`${mockServer.url}/api/users`);
            expect(getResponse.status).toBe(200);
            const getData = await getResponse.json();
            expect(getData).toHaveProperty("url");
            expect(getData).toHaveProperty("method");

            // Test POST request
            const postResponse = await fetch(`${mockServer.url}/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Test" })
            });
            expect(postResponse.status).toBe(201);
            const postData = await postResponse.json();
            expect(postData).toHaveProperty("data");
        } finally {
            mockServer.close();
        }
    });

    test("filesystem mock works correctly", async () => {
        // Create a temporary test file
        const testData = { path: "/test/path", content: "test content" };
        const testFilePath = "/tmp/test-file.json";

        await Bun.write(testFilePath, JSON.stringify(testData));

        const data = await Bun.file(testFilePath).text();
        const parsed = JSON.parse(data);
        expect(parsed).toHaveProperty("path");
        expect(parsed).toHaveProperty("content");

        await Bun.write("/tmp/output.json", JSON.stringify({ test: true }));
        // Should not throw error
    });

    test("global fetch mock works correctly", async () => {
        // Create a mock server for testing fetch
        const mockServer = global.testUtils.createMockServer(async (req) => {
            return new Response(JSON.stringify({
                url: req.url,
                mock: true,
                data: "test data"
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        });

        try {
            const response = await fetch(`${mockServer.url}/data`);
            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty("url");
            expect(data).toHaveProperty("mock");
        } finally {
            mockServer.close();
        }
    });

    test("external service mock works correctly", async () => {
        // Mock external service using test utilities
        const mockExternalService = {
            fetchData: async (endpoint: string) => ({
                endpoint,
                data: { items: [] },
                status: 200
            }),
            submitData: async (endpoint: string, data: any) => ({
                submitted: true,
                id: "mock-id-123",
                endpoint,
                data
            })
        };

        const result = await mockExternalService.fetchData("/api/external");
        expect(result).toHaveProperty("endpoint");
        expect(result).toHaveProperty("data");
        expect(result).toHaveProperty("status");

        const submitResult = await mockExternalService.submitData("/api/submit", { test: true });
        expect(submitResult).toHaveProperty("submitted");
        expect(submitResult).toHaveProperty("id");
    });

    test("logger mock respects log level", () => {
        // Mock logger that respects LOG_LEVEL
        const createMockLogger = (level: string) => ({
            info: (msg: string) => level === 'info' || level === 'debug' ? console.log(`INFO: ${msg}`) : undefined,
            warn: (msg: string) => ['warn', 'info', 'debug'].includes(level) ? console.log(`WARN: ${msg}`) : undefined,
            error: (msg: string) => console.error(`ERROR: ${msg}`),
            debug: (msg: string) => level === 'debug' ? console.log(`DEBUG: ${msg}`) : undefined
        });

        const logger = createMockLogger(process.env.LOG_LEVEL || 'error');

        // These should not log when LOG_LEVEL is "error"
        logger.info("Info message");
        logger.warn("Warning message");
        logger.debug("Debug message");

        // This should always log
        logger.error("Error message");
    });

    test("configuration mock works correctly", () => {
        // Mock configuration object
        const config = {
            database: {
                host: "localhost",
                port: 5432,
                url: process.env.DATABASE_URL
            },
            api: {
                url: process.env.API_URL
            },
            logging: {
                level: process.env.LOG_LEVEL
            }
        };

        expect(config.database).toHaveProperty("host");
        expect(config.database).toHaveProperty("port");
        expect(config.api).toHaveProperty("url");
        expect(config.logging).toHaveProperty("level");
    });

    test("timeout configuration works", async () => {
        // This test uses the default timeout from config (10s)
        const startTime = Date.now();

        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 100));

        const duration = Date.now() - startTime;
        expect(duration).toBeGreaterThan(50);
        expect(duration).toBeLessThan(1000); // Well under 10s timeout
    }, 5000); // Override with 5s timeout for this specific test

    test("test environment assertion", () => {
        expect(() => global.testUtils.assertEnvironment()).not.toThrow();
    });
});

describe("Coverage Configuration Demo", () => {
    test("function coverage example", () => {
        function add(a: number, b: number): number {
            return a + b;
        }

        function multiply(a: number, b: number): number {
            return a * b;
        }

        expect(add(2, 3)).toBe(5);
        expect(multiply(4, 5)).toBe(20);
    });

    test("statement coverage example", () => {
        const x = 10;
        let y: number;

        if (x > 5) {
            y = x * 2;
        } else {
            y = x / 2;
        }

        expect(y).toBe(20);
    });

    test("branch coverage example", () => {
        const isEven = (n: number) => n % 2 === 0;

        expect(isEven(2)).toBe(true);
        expect(isEven(3)).toBe(false);
    });
});
