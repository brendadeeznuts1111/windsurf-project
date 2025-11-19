#!/usr/bin/env bun

/**
 * 📱 Bun YAML Bundler Integration Example
 * 
 * Demonstrates how Bun's bundler integrates with YAML files
 * for zero runtime overhead in production builds.
 */

// Import YAML files using default imports (Native Bun approach)
import config from "./config.yaml";
import databaseConfig from "./database.yaml";
import featureFlags from "./features.yaml";

// Destructure the properties we need (native Bun pattern)
const { database, redis, features } = config;
const { connections, migrations } = databaseConfig;

console.log("🚀 Starting application with bundled YAML configuration");

// Server configuration (bundled at build time)
const server = Bun.serve({
    port: 3000,
    hostname: "localhost",
    fetch(req) {
        const url = new URL(req.url);

        // API routes using bundled configuration
        if (url.pathname === "/api/config") {
            return Response.json({
                database: database,
                redis: redis,
                features: features,
                timestamp: new Date().toISOString()
            });
        }

        if (url.pathname === "/api/status") {
            return Response.json({
                status: "healthy",
                connections: Object.keys(connections),
                migrations: migrations.autoRun,
                features: featureFlags.features,
                buildTime: new Date().toISOString()
            });
        }

        if (url.pathname === "/api/health") {
            return Response.json({
                message: "Application is running with bundled YAML configuration",
                environment: process.env.NODE_ENV || "development",
                configLoaded: true
            });
        }

        return new Response("Bun YAML Bundler Example - Try /api/config or /api/status");
    },
});

console.log(`🔥 Server running at http://localhost:3000`);
console.log("📊 Configuration was bundled at build time - zero runtime parsing overhead!");
console.log("🔍 Available endpoints:");
console.log("  GET /api/config - View bundled configuration");
console.log("  GET /api/status - View application status");
console.log("  GET /api/health - Health check");

// Export for potential use in other modules
export { server, config, database, redis, features, connections, migrations, featureFlags };
