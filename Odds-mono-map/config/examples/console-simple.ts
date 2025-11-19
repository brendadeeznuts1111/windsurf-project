#!/usr/bin/env bun

/**
 * 🎮 Simple Bun Console Demo
 * 
 * Demonstrates Bun's enhanced console features:
 * - Object inspection depth
 * - Reading from stdin as AsyncIterable
 */

import config from "./config.yaml";
import databaseConfig from "./database.yaml";

// Destructure the properties we need (native Bun pattern)
const { connections } = databaseConfig;

console.log("🎮 Bun Console Features Demo");
console.log("============================");

// Example 1: Object inspection depth
console.log("\n📊 Object Inspection Depth Demo:");
console.log("Default depth (2) - shows [Object] for deep nesting:");
console.log(config);

// Create a deeply nested object to demonstrate depth
const deepObject = {
    level1: {
        level2: {
            level3: {
                level4: "This is the deep value you'll see with depth 4",
                config: config,
                database: connections
            }
        }
    }
};

console.log("\n🔍 Deep object (will show [Object] at default depth):");
console.log(deepObject);

// Example 2: Interactive stdin demo
console.log("\n🎯 Interactive Console Demo");
console.log("==========================");
console.log("Try these commands:");
console.log("- 'config' - Show configuration");
console.log("- 'database' - Show database info");
console.log("- 'count <number>' - Add to counter");
console.log("- 'quit' - Exit");

console.log("\n🚀 Ready for input:");
console.write("> ");

let counter = 0;

for await (const line of console) {
    const input = line.trim().toLowerCase();

    switch (input) {
        case 'config':
            console.log("📊 Current Configuration:");
            console.log(`Server: ${config.server.host}:${config.server.port}`);
            console.log(`Debug: ${config.features.debug ? 'ON' : 'OFF'}`);
            console.log(`Verbose: ${config.features.verbose ? 'ON' : 'OFF'}`);
            break;

        case 'database':
            console.log("🗄️ Database Configuration:");
            console.log(`Type: ${connections.primary.type}`);
            console.log(`Host: ${connections.primary.host}:${connections.primary.port}`);
            console.log(`Database: ${connections.primary.database}`);
            console.log(`Pool: ${connections.primary.pool.min}-${connections.primary.pool.max} connections`);
            break;

        case 'quit':
        case 'exit':
            console.log("👋 Goodbye!");
            process.exit(0);
            break;

        default:
            if (input.startsWith('count ')) {
                const num = parseInt(input.substring(6));
                if (!isNaN(num)) {
                    counter += num;
                    console.log(`➕ Counter: ${counter}`);
                } else {
                    console.log("❌ Please provide a valid number");
                }
            } else if (input) {
                console.log(`❓ Unknown command: "${input}"`);
                console.log("💡 Try: config, database, count <number>, or quit");
            }
    }

    console.write("> ");
}
