#!/usr/bin/env bun

/**
 * 🔥 Hot Reloading YAML Server
 * 
 * Zero-downtime configuration updates using Bun.serve().reload()
 * Demonstrates live configuration changes without server restart
 */

import { readYamlFile } from "./bun-yaml-utils";
import { watch } from "fs";

// Server configuration interface
interface ServerConfig {
    server: {
        port: number;
        host: string;
    };
    features: {
        debug: boolean;
        verbose: boolean;
    };
    routes: Record<string, {
        method: string;
        handler: string;
        enabled: boolean;
    }>;
}

// Global server instance for hot reloading
let server: ReturnType<typeof Bun.serve>;
let currentConfig: ServerConfig;

/**
 * 🔄 Create request handler from YAML configuration
 */
function createHandlerFromConfig(config: ServerConfig) {
    return async (req: Request): Promise<Response> => {
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;

        // Debug logging if enabled
        if (config.features.verbose) {
            console.log(`📝 ${method} ${path}`);
        }

        // Dynamic route handling from YAML config
        for (const [routePath, route] of Object.entries(config.routes)) {
            if (routePath === path && route.method === method && route.enabled) {
                switch (route.handler) {
                    case "config":
                        return Response.json({
                            message: "Current configuration",
                            config: config,
                            timestamp: new Date().toISOString()
                        });

                    case "status":
                        return Response.json({
                            status: "healthy",
                            server: config.server,
                            features: config.features,
                            routes: Object.keys(config.routes).length,
                            uptime: process.uptime(),
                            timestamp: new Date().toISOString()
                        });

                    case "debug":
                        if (config.features.debug) {
                            return Response.json({
                                debug: true,
                                config: config,
                                memory: process.memoryUsage(),
                                uptime: process.uptime(),
                                timestamp: new Date().toISOString()
                            });
                        } else {
                            return Response.json({
                                error: "Debug mode is disabled",
                                enable: "Set features.debug to true in config.yaml"
                            }, { status: 403 });
                        }

                    case "reload":
                        return Response.json({
                            message: "Hot reload is active",
                            config: config,
                            note: "Modify config.yaml to see live changes"
                        });
                }
            }
        }

        // Default 404 for unknown routes
        return Response.json({
            error: "Route not found",
            path: path,
            method: method,
            availableRoutes: Object.entries(config.routes)
                .filter(([_, route]) => route.enabled)
                .map(([path, route]) => `${route.method} ${path}`)
        }, { status: 404 });
    };
}

/**
 * 🚀 Initialize server with YAML configuration
 */
async function initializeServer() {
    try {
        // Load initial configuration
        currentConfig = await readYamlFile<ServerConfig>("./config.yaml");

        console.log("📋 Initial configuration loaded:");
        console.log(`   Server: ${currentConfig.server.host}:${currentConfig.server.port}`);
        console.log(`   Debug: ${currentConfig.features.debug ? '✅' : '❌'}`);
        console.log(`   Verbose: ${currentConfig.features.verbose ? '✅' : '❌'}`);
        console.log(`   Routes: ${Object.keys(currentConfig.routes || {}).length}`);

        // Create initial server
        server = Bun.serve({
            port: currentConfig.server.port,
            hostname: currentConfig.server.host,
            fetch: createHandlerFromConfig(currentConfig),
            development: true // Enable hot reloading
        });

        console.log(`🔥 Server started at http://${currentConfig.server.host}:${currentConfig.server.port}`);
        console.log("💡 Modify config.yaml to see live configuration changes!");

        return server;

    } catch (error) {
        console.error("❌ Failed to initialize server:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

/**
 * 🔄 Hot reload configuration without server restart
 */
async function hotReloadConfig() {
    try {
        console.log("🔄 Detecting configuration changes...");

        // Load new configuration
        const newConfig = await readYamlFile<ServerConfig>("./config.yaml");

        // Check if configuration actually changed
        const configChanged = JSON.stringify(currentConfig) !== JSON.stringify(newConfig);

        if (!configChanged) {
            console.log("ℹ️ Configuration unchanged, skipping reload");
            return;
        }

        console.log("🔄 Configuration changed, reloading server...");

        // Update current configuration
        const oldConfig = currentConfig;
        currentConfig = newConfig;

        // Reload server with new configuration (zero downtime)
        server.reload({
            port: newConfig.server.port,
            hostname: newConfig.server.host,
            fetch: createHandlerFromConfig(newConfig)
        });

        console.log("✅ Server reloaded successfully!");
        console.log(`📊 Changes detected:`);

        // Show what changed
        if (oldConfig.server.port !== newConfig.server.port) {
            console.log(`   Port: ${oldConfig.server.port} → ${newConfig.server.port}`);
        }
        if (oldConfig.features.debug !== newConfig.features.debug) {
            console.log(`   Debug: ${oldConfig.features.debug} → ${newConfig.features.debug}`);
        }
        if (oldConfig.features.verbose !== newConfig.features.verbose) {
            console.log(`   Verbose: ${oldConfig.features.verbose} → ${newConfig.features.verbose}`);
        }

        const routeCount = Object.keys(newConfig.routes || {}).length;
        console.log(`   Routes: ${routeCount} configured`);

    } catch (error) {
        console.error("❌ Failed to reload configuration:", error instanceof Error ? error.message : String(error));
    }
}

/**
 * 👀 File watcher for configuration changes
 */
function setupFileWatcher() {
    console.log("👀 Setting up file watcher for config.yaml...");

    // Watch for changes to config.yaml
    const watcher = watch("./config.yaml", { recursive: false }, (eventType, filename) => {
        if (eventType === "change" && filename === "config.yaml") {
            console.log(`📝 File changed: ${filename}`);

            // Debounce rapid changes
            setTimeout(hotReloadConfig, 100);
        }
    });

    // Handle watcher errors
    watcher.on("error", (error) => {
        console.error("❌ File watcher error:", error);
    });

    console.log("✅ File watcher active - monitoring config.yaml");
}

/**
 * 🛑 Graceful shutdown
 */
function setupGracefulShutdown() {
    const shutdown = () => {
        console.log("\n🛑 Shutting down server...");
        server.stop();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

/**
 * 🚀 Main execution
 */
async function main() {
    console.log("🔥 Hot Reloading YAML Server");
    console.log("==============================");

    // Initialize server
    await initializeServer();

    // Setup file watching
    setupFileWatcher();

    // Setup graceful shutdown
    setupGracefulShutdown();

    console.log("\n🌐 Available endpoints:");
    console.log(`   GET http://${currentConfig.server.host}:${currentConfig.server.port}/config - View configuration`);
    console.log(`   GET http://${currentConfig.server.host}:${currentConfig.server.port}/status - Server status`);
    console.log(`   GET http://${currentConfig.server.host}:${currentConfig.server.port}/debug - Debug info`);
    console.log(`   GET http://${currentConfig.server.host}:${currentConfig.server.port}/reload - Reload info`);

    console.log("\n💡 Try these commands:");
    console.log("   curl http://localhost:3000/config");
    console.log("   curl http://localhost:3000/status");
    console.log("   # Then modify config.yaml to see live changes!");
}

// Start the server
main().catch(console.error);
