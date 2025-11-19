#!/usr/bin/env bun

/**
 * 🎮 Bun Console Features Demo
 * 
 * Demonstrates Bun's enhanced console capabilities including:
 * - Object inspection depth configuration
 * - Reading from stdin as AsyncIterable
 * - Interactive YAML configuration management
 */

import config from "./config.yaml";
import databaseConfig from "./database.yaml";
import featureFlags from "./features.yaml";

// Destructure the properties we need (native Bun pattern)
const { connections, migrations } = databaseConfig;
const { features } = config;

console.log("🎮 Bun Console Features Demo");
console.log("============================");

// Example 1: Object inspection depth demonstration
console.log("\n📊 Object Inspection Depth Demo:");
console.log("Default depth (2):");
console.log(config);

console.log("\n🔍 Deep object inspection:");
const deepConfig = {
    server: config.server,
    database: {
        primary: connections.primary,
        pool: connections.primary.pool,
        deep: {
            nested: {
                value: "This is a deeply nested value",
                features: featureFlags.features,
                migrations: migrations
            }
        }
    }
};

// This will show [Object] at depth 2 (default)
console.log("Default depth output:");
console.log(deepConfig);

// Example 2: Interactive configuration manager using stdin
console.log("\n🎯 Interactive Configuration Manager");
console.log("=====================================");
console.log("Current configuration:");
console.log(`- Server: ${config.server.host}:${config.server.port}`);
console.log(`- Debug mode: ${features.debug}`);
console.log(`- Verbose logging: ${features.verbose}`);

console.log("\n💡 Try these commands:");
console.log("- Type 'debug on' to enable debug mode");
console.log("- Type 'debug off' to disable debug mode");
console.log("- Type 'verbose on' to enable verbose logging");
console.log("- Type 'verbose off' to disable verbose logging");
console.log("- Type 'status' to show current configuration");
console.log("- Type 'quit' to exit");

console.log("\n🚀 Ready for input:");
console.write("> ");

// Interactive configuration updates
let currentConfig = { ...config };

for await (const line of console) {
    const input = line.trim().toLowerCase();

    switch (input) {
        case 'debug on':
            currentConfig.features.debug = true;
            console.log("✅ Debug mode enabled");
            break;

        case 'debug off':
            currentConfig.features.debug = false;
            console.log("❌ Debug mode disabled");
            break;

        case 'verbose on':
            currentConfig.features.verbose = true;
            console.log("📝 Verbose logging enabled");
            break;

        case 'verbose off':
            currentConfig.features.verbose = false;
            console.log("🔇 Verbose logging disabled");
            break;

        case 'status':
            console.log("📊 Current Configuration:");
            console.log(`  Server: ${currentConfig.server.host}:${currentConfig.server.port}`);
            console.log(`  Debug: ${currentConfig.features.debug ? '✅' : '❌'}`);
            console.log(`  Verbose: ${currentConfig.features.verbose ? '✅' : '❌'}`);
            console.log(`  Database: ${connections.primary.type} on ${connections.primary.host}:${connections.primary.port}`);
            console.log(`  Features enabled: ${Object.values(featureFlags.features).filter((f: any) => f.enabled).length}`);
            break;

        case 'quit':
        case 'exit':
            console.log("👋 Goodbye!");
            process.exit(0);
            break;

        default:
            if (input) {
                console.log(`❓ Unknown command: "${input}"`);
                console.log("💡 Try: debug on/off, verbose on/off, status, or quit");
            }
    }

    console.write("> ");
}

// Example 3: Real-time feature flag toggling
console.log("\n🎯 Feature Flag Management");
console.log("==========================");

// Simulate real-time feature flag updates
let featureCount = 0;

const updateFeatureFlags = () => {
    featureCount++;
    console.log(`🔄 Feature update #${featureCount}`);

    // Show current feature state with deep inspection
    const featureState: any = {
        timestamp: new Date().toISOString(),
        updateCount: featureCount,
        features: featureFlags.features,
        config: {
            server: currentConfig.server,
            database: {
                type: connections.primary.type,
                host: connections.primary.host,
                settings: {
                    pool: connections.primary.pool,
                    timeout: 5000,
                    retries: 3,
                    deep: {
                        nested: {
                            monitoring: true,
                            analytics: (featureFlags.features as any).bunOptimizations?.enabled || false,
                            experimental: {
                                beta: false,
                                alpha: {
                                    testing: true,
                                    features: ["hot-reload", "fast-startup"]
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    console.log("Current feature state:");
    console.log(featureState);
};

console.log("✅ Console demo setup complete!");
console.log("💡 Run with --console-depth 4 to see deeper object inspection");
console.log("💡 Try the interactive commands above");
