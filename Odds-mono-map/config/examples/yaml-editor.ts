#!/usr/bin/env bun

/**
 * 📝 Interactive YAML Configuration Editor
 * 
 * Uses Bun's console stdin feature to create an interactive
 * configuration editor for YAML files.
 */

import config from "./config.yaml";
import databaseConfig from "./database.yaml";
import featureFlags from "./features.yaml";

// Destructure the properties we need (native Bun pattern)
const { connections } = databaseConfig;

console.log("📝 Interactive YAML Configuration Editor");
console.log("======================================");

// Display current configuration
function showConfig() {
    console.log("\n📊 Current Configuration:");
    console.log("========================");
    console.log(`Server: ${config.server.host}:${config.server.port}`);
    console.log(`Debug: ${config.features.debug ? '✅ ON' : '❌ OFF'}`);
    console.log(`Verbose: ${config.features.verbose ? '✅ ON' : '❌ OFF'}`);
    console.log(`Database: ${connections.primary.type} on ${connections.primary.host}`);
    console.log(`Features: ${Object.keys(featureFlags.features).length} feature flags configured`);
}

showConfig();

console.log("\n🎮 Interactive Commands:");
console.log("======================");
console.log("1. server <host> <port> - Update server configuration");
console.log("2. debug <on|off> - Toggle debug mode");
console.log("3. verbose <on|off> - Toggle verbose logging");
console.log("4. database <host> - Update database host");
console.log("5. show - Display current configuration");
console.log("6. save - Save configuration to file");
console.log("7. quit - Exit editor");

console.log("\n💡 Example: server localhost 8080");
console.log("💡 Example: debug on");
console.log("\n🚀 Ready for commands:");
console.write("> ");

// Interactive command processing
let editingConfig = JSON.parse(JSON.stringify(config)); // Deep copy

for await (const line of console) {
    const input = line.trim();
    const parts = input.split(' ');
    const command = parts[0]?.toLowerCase();

    try {
        switch (command) {
            case 'server':
                if (parts.length >= 3) {
                    editingConfig.server.host = parts[1];
                    editingConfig.server.port = parseInt(parts[2]);
                    console.log(`✅ Server updated to ${parts[1]}:${parts[2]}`);
                } else {
                    console.log("❌ Usage: server <host> <port>");
                }
                break;

            case 'debug':
                if (parts[1] === 'on') {
                    editingConfig.features.debug = true;
                    console.log("✅ Debug mode enabled");
                } else if (parts[1] === 'off') {
                    editingConfig.features.debug = false;
                    console.log("❌ Debug mode disabled");
                } else {
                    console.log("❌ Usage: debug <on|off>");
                }
                break;

            case 'verbose':
                if (parts[1] === 'on') {
                    editingConfig.features.verbose = true;
                    console.log("✅ Verbose logging enabled");
                } else if (parts[1] === 'off') {
                    editingConfig.features.verbose = false;
                    console.log("❌ Verbose logging disabled");
                } else {
                    console.log("❌ Usage: verbose <on|off>");
                }
                break;

            case 'database':
                if (parts[1]) {
                    connections.primary.host = parts[1];
                    console.log(`✅ Database host updated to ${parts[1]}`);
                } else {
                    console.log("❌ Usage: database <host>");
                }
                break;

            case 'show':
                console.log("\n📊 Edited Configuration:");
                console.log("=======================");
                console.log(`Server: ${editingConfig.server.host}:${editingConfig.server.port}`);
                console.log(`Debug: ${editingConfig.features.debug ? '✅ ON' : '❌ OFF'}`);
                console.log(`Verbose: ${editingConfig.features.verbose ? '✅ ON' : '❌ OFF'}`);
                console.log(`Database: ${connections.primary.type} on ${connections.primary.host}`);
                break;

            case 'save':
                console.log("💾 Configuration would be saved to config.yaml");
                console.log("📝 Edited configuration:");
                console.log(JSON.stringify(editingConfig, null, 2));
                break;

            case 'quit':
            case 'exit':
                console.log("👋 Goodbye!");
                process.exit(0);
                break;

            case '':
                // Empty line, just show prompt
                break;

            default:
                if (input) {
                    console.log(`❓ Unknown command: "${command}"`);
                    console.log("💡 Available: server, debug, verbose, database, show, save, quit");
                }
        }
    } catch (error) {
        console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.write("> ");
}
