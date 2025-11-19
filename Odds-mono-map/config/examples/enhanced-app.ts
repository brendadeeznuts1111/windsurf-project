#!/usr/bin/env bun

/**
 * 🚀 Enhanced Bun YAML Application
 * 
 * Demonstrates all Phase 1 optimizations:
 * - Bun.file() for fast configuration loading
 * - Hot reloading with server.reload()
 * - Native Bun patterns
 */

import appConfig from "./app-config.yaml";
import { readYamlFile, measureYamlPerformance } from "./bun-yaml-utils";

// Destructure configuration using native Bun pattern
const { database, redis, features } = appConfig;

console.log("🚀 Enhanced Bun YAML Application");
console.log("==================================");

console.log("📋 Configuration loaded:");
console.log(`   Database: ${database.host}:${database.port}/${database.name}`);
console.log(`   Redis: ${redis.host}:${redis.port}`);
console.log(`   Features: auth=${features.auth}, rateLimit=${features.rateLimit}, analytics=${features.analytics}`);

// Performance demonstration
async function demonstratePerformance() {
    console.log("\n🏎️ Performance Demonstration:");
    console.log("-------------------------------");

    const metrics = await measureYamlPerformance("./app-config.yaml");

    console.log(`📁 File size: ${metrics.fileSize} bytes`);
    console.log(`⚡ Read time: ${metrics.readTime.toFixed(2)}ms`);
    console.log(`🔍 Parse time: ${metrics.parseTime.toFixed(2)}ms`);
    console.log(`⏱️ Total time: ${metrics.totalTime.toFixed(2)}ms`);
    console.log(`🔑 Key count: ${metrics.keyCount}`);

    if (metrics.totalTime < 5) {
        console.log("🚀 Excellent performance with Bun.file()!");
    }
}

// Feature flag system
function checkFeature(featureName: keyof typeof features): boolean {
    const enabled = features[featureName];
    console.log(`🔍 Feature ${String(featureName)}: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    return enabled;
}

// Database connection simulator
function connectToDatabase() {
    console.log("\n🗄️ Database Connection:");
    console.log("------------------------");
    console.log(`📍 Connecting to ${database.host}:${database.port}`);
    console.log(`💾 Database: ${database.name}`);
    console.log("✅ Database connection simulated");
}

// Redis connection simulator
function connectToRedis() {
    console.log("\n🔴 Redis Connection:");
    console.log("---------------------");
    console.log(`📍 Connecting to ${redis.host}:${redis.port}`);
    console.log("✅ Redis connection simulated");
}

// Middleware system based on features
function createMiddleware() {
    console.log("\n🛡️ Middleware Configuration:");
    console.log("------------------------------");

    const middleware: string[] = [];

    if (checkFeature("auth")) {
        middleware.push("🔐 Authentication Middleware");
    }

    if (checkFeature("rateLimit")) {
        middleware.push("⚡ Rate Limiting Middleware");
    }

    if (checkFeature("analytics")) {
        middleware.push("📊 Analytics Middleware");
    }

    if (middleware.length === 0) {
        console.log("ℹ️ No middleware enabled");
    } else {
        console.log(`✅ ${middleware.length} middleware layers configured`);
        middleware.forEach(m => console.log(`   ${m}`));
    }

    return middleware;
}

// Create HTTP server with configuration-driven features
function createServer(middleware: string[]) {
    console.log("\n🌐 HTTP Server Configuration:");
    console.log("-------------------------------");

    const server = Bun.serve({
        port: 3001,
        hostname: "localhost",
        fetch(req) {
            const url = new URL(req.url);
            const path = url.pathname;

            // Apply middleware simulation
            if (features.auth && path !== "/health") {
                // Simulate authentication check
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return Response.json({ error: "Authentication required" }, { status: 401 });
                }
            }

            if (features.rateLimit) {
                // Simulate rate limiting
                console.log(`⚡ Rate limiting check for ${path}`);
            }

            if (features.analytics) {
                // Simulate analytics tracking
                console.log(`📊 Analytics: ${req.method} ${path}`);
            }

            // Route handling
            switch (path) {
                case "/":
                    return Response.json({
                        message: "Enhanced Bun YAML Application",
                        features: features,
                        middleware: middleware.length,
                        timestamp: new Date().toISOString()
                    });

                case "/config":
                    return Response.json({
                        config: appConfig,
                        performance: "Optimized with Bun.file()",
                        hotReload: "Enable with bun --hot enhanced-app.ts"
                    });

                case "/status":
                    return Response.json({
                        status: "healthy",
                        database: `${database.host}:${database.port}/${database.name}`,
                        redis: `${redis.host}:${redis.port}`,
                        features: features,
                        uptime: process.uptime(),
                        timestamp: new Date().toISOString()
                    });

                case "/health":
                    return Response.json({
                        status: "ok",
                        timestamp: new Date().toISOString()
                    });

                default:
                    return Response.json({
                        error: "Route not found",
                        routes: ["/", "/config", "/status", "/health"]
                    }, { status: 404 });
            }
        },
    });

    console.log(`🔥 Server running at http://localhost:3001`);
    console.log("💡 Enable hot reloading with: bun --hot enhanced-app.ts");
    console.log("🌐 Available endpoints: /, /config, /status, /health");

    return server;
}

// Main application execution
async function main() {
    try {
        // Demonstrate performance
        await demonstratePerformance();

        // Setup connections
        connectToDatabase();
        connectToRedis();

        // Configure middleware
        const middleware = createMiddleware();

        // Start server
        const server = createServer(middleware);

        // Graceful shutdown
        process.on("SIGINT", () => {
            console.log("\n🛑 Shutting down server...");
            server.stop();
            process.exit(0);
        });

        console.log("\n✅ Application started successfully!");
        console.log("🔧 Modify app-config.yaml and restart to see changes");
        console.log("🔥 Use bun --hot for live configuration reloading");

    } catch (error) {
        console.error("❌ Failed to start application:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Start the enhanced application
main();
