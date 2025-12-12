// test-setup.ts
// Global test setup for comprehensive configuration

import { beforeAll, afterAll } from "bun:test";
import { BunPostgres } from '../database/bun-postgres';
import { BunRedis } from '../database/bun-redis';
import { BunServe } from 'bun';

// Test database instances
let testPostgres: BunPostgres | null = null;
let testRedis: BunRedis | null = null;
let testAPIServer: any = null;

// Real database setup
async function setupTestDatabase() {
    console.log('🗄️ Setting up test database...');

    try {
        // Setup PostgreSQL test database
        if (process.env.POSTGRES_HOST) {
            testPostgres = new BunPostgres({
                host: process.env.POSTGRES_HOST,
                port: parseInt(process.env.POSTGRES_PORT || '5432'),
                database: process.env.POSTGRES_DB || 'test_db',
                user: process.env.POSTGRES_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || 'password',
                maxConnections: 5,
                minConnections: 1
            });

            // Create test tables
            await testPostgres.query(`
                CREATE TABLE IF NOT EXISTS test_users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    age INTEGER,
                    active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Clean up any existing test data
            await testPostgres.query('DELETE FROM test_users');

            console.log('✅ PostgreSQL test database ready');
        }

        // Setup Redis test database
        if (process.env.REDIS_HOST) {
            testRedis = new BunRedis({
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                database: parseInt(process.env.REDIS_DB || '1'),
                maxConnections: 5,
                minConnections: 1
            });

            // Clean up test keys
            const keys = await testRedis.keys('test:*');
            if (keys.length > 0) {
                await testRedis.del(...keys);
            }

            console.log('✅ Redis test database ready');
        }
    } catch (error) {
        console.warn('⚠️ Database setup failed:', error.message);
        console.warn('Tests will run without database connectivity');
    }
}

async function cleanupTestDatabase() {
    console.log('🧹 Cleaning up test database...');

    try {
        if (testPostgres) {
            // Clean up test data
            await testPostgres.query('DROP TABLE IF EXISTS test_users');
            await testPostgres.close();
            testPostgres = null;
        }

        if (testRedis) {
            // Clean up test keys
            const keys = await testRedis.keys('test:*');
            if (keys.length > 0) {
                await testRedis.del(...keys);
            }
            await testRedis.close();
            testRedis = null;
        }

        console.log('✅ Test database cleanup completed');
    } catch (error) {
        console.warn('⚠️ Database cleanup failed:', error.message);
    }
}

// Real API server setup
async function setupTestAPI() {
    console.log('🌐 Setting up test API server...');

    try {
        testAPIServer = Bun.serve({
            port: 3001,
            hostname: 'localhost',
            async fetch(req) {
                const url = new URL(req.url);

                // Health check endpoint
                if (url.pathname === '/health') {
                    return Response.json({
                        status: 'ok',
                        timestamp: new Date().toISOString(),
                        services: {
                            postgres: testPostgres ? 'connected' : 'disconnected',
                            redis: testRedis ? 'connected' : 'disconnected'
                        }
                    });
                }

                // Mock API endpoints for testing
                if (url.pathname.startsWith('/api/users')) {
                    if (req.method === 'GET') {
                        // Mock user data
                        return Response.json([
                            { id: 1, name: 'Test User 1', email: 'test1@example.com' },
                            { id: 2, name: 'Test User 2', email: 'test2@example.com' }
                        ]);
                    }

                    if (req.method === 'POST') {
                        const body = await req.json();
                        return Response.json({
                            id: Date.now(),
                            ...body,
                            created_at: new Date().toISOString()
                        });
                    }
                }

                // Mock market data endpoint
                if (url.pathname.startsWith('/api/market')) {
                    return Response.json({
                        timestamp: new Date().toISOString(),
                        markets: [
                            { id: 'BTC/USD', price: 45000, change: 2.5 },
                            { id: 'ETH/USD', price: 3000, change: -1.2 }
                        ]
                    });
                }

                return new Response('Not Found', { status: 404 });
            }
        });

        console.log(`✅ Test API server running on http://localhost:3001`);
    } catch (error) {
        console.warn('⚠️ API server setup failed:', error.message);
    }
}

async function cleanupTestAPI() {
    console.log('🛑 Cleaning up test API server...');

    try {
        if (testAPIServer) {
            testAPIServer.stop();
            testAPIServer = null;
        }
        console.log('✅ Test API server stopped');
    } catch (error) {
        console.warn('⚠️ API server cleanup failed:', error.message);
    }
}

beforeAll(() => {
    console.log('🚀 Comprehensive test setup started');
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   Log Level: ${process.env.LOG_LEVEL}`);

    setupTestDatabase();
    setupTestAPI();

    // Set global test utilities
    global.testStartTime = Date.now();
    global.testEnvironment = 'comprehensive-test';

    console.log('✅ Comprehensive test setup completed');
});

afterAll(() => {
    console.log('🏁 Comprehensive test cleanup started');

    cleanupTestAPI();
    cleanupTestDatabase();

    // Log session summary
    const duration = Date.now() - (global.testStartTime || 0);
    console.log(`📊 Test session completed in ${duration}ms`);

    console.log('✅ Comprehensive test cleanup completed');
});

export { setupTestDatabase, cleanupTestDatabase, setupTestAPI, cleanupTestAPI };
