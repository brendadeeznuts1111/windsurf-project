#!/usr/bin/env bun

/**
 * 📄 Bun YAML Usage Examples
 * 
 * Demonstrates Bun's built-in YAML support with parsing,
 * imports, hot reloading, and configuration management.
 */

// Example 1: Parse YAML string with Bun.YAML.parse()
import { YAML } from "bun";

const text = `
name: John Doe
age: 30
email: john@example.com
hobbies:
  - reading
  - coding
  - hiking
`;

const data = YAML.parse(text);
console.log("Parsed YAML data:", data);

// Example 2: Import YAML files as ES modules (Native Bun API)
import config, { database, redis, features } from "./config.yaml";

console.log("Database host:", database.host);
console.log("Redis port:", redis.port);
console.log("Features auth:", features.auth);

// Example 3: Environment-based configuration
const env = process.env.NODE_ENV || "development";
const envConfig = config[env];

console.log(`Current environment (${env}) config:`, envConfig);

// Environment variable interpolation
function interpolateEnvVars(obj: any): any {
    if (typeof obj === "string") {
        return obj.replace(/\${(\w+)}/g, (_, key) => process.env[key] || "");
    }
    if (typeof obj === "object" && obj !== null) {
        for (const key in obj) {
            obj[key] = interpolateEnvVars(obj[key]);
        }
    }
    return obj;
}

export default interpolateEnvVars(envConfig);

// Example 4: Feature flags with hot reloading (Native Bun API)
import featuresConfig from "./features.yaml";
const { features: featureFlags } = featuresConfig;

export function isFeatureEnabled(featureName: string, userEmail?: string): boolean {
    const feature = featureFlags[featureName];

    if (!feature?.enabled) {
        return false;
    }

    // Check rollout percentage
    if (feature.rolloutPercentage < 100) {
        const hash = hashCode(userEmail || "anonymous");
        if (hash % 100 >= feature.rolloutPercentage) {
            return false;
        }
    }

    // Check allowed users
    if (feature.allowedUsers && userEmail) {
        return feature.allowedUsers.includes(userEmail);
    }

    return true;
}

function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

// Example 5: Database configuration with YAML (Native Bun API)
import { connections, migrations } from "./database.yaml";

console.log("Database connections:", connections);
console.log("Migration config:", migrations);

// Parse environment variables with defaults
function parseConfig(config: any) {
    return JSON.parse(
        JSON.stringify(config).replace(
            /\${([^:-]+)(?::([^}]+))?}/g,
            (_, key, defaultValue) => process.env[key] || defaultValue || "",
        ),
    );
}

const dbConfig = parseConfig(connections);

// Mock database connections for demonstration
const mockDb = {
    primary: { connected: true, config: dbConfig.primary },
    cache: { connected: true, config: dbConfig.cache },
    analytics: { connected: true, config: dbConfig.analytics },
};

console.log("Database connections established:", mockDb);

// Auto-run migrations if configured
if (parseConfig(migrations).autoRun === "true") {
    console.log("🔄 Running migrations from:", migrations.directory);
}

// Example 6: Multi-document YAML parsing
const multiDocYAML = `
---
name: Document 1
version: 1.0
---
name: Document 2
version: 2.0
---
name: Document 3
version: 3.0
`;

const documents = Bun.YAML.parse(multiDocYAML);
console.log("Multi-document YAML:", documents);

// Example 7: Hot Reloading with YAML (Native Bun API)
// Run with: bun --hot yaml-usage.ts

import serverConfig from "./config.yaml";
const { server, features: serverFeatures } = serverConfig;

console.log(`🚀 Starting server on ${server.host}:${server.port}`);

if (serverFeatures.debug) {
    console.log("🐛 Debug mode enabled");
}

// Hot-reloading server example
const httpServer = Bun.serve({
    port: server.port,
    hostname: server.host,
    fetch(req: Request) {
        if (serverFeatures.verbose) {
            console.log(`📝 ${req.method} ${req.url}`);
        }

        return new Response(JSON.stringify({
            message: "Hello from hot-reloading YAML server!",
            config: {
                port: server.port,
                host: server.host,
                debug: serverFeatures.debug,
                verbose: serverFeatures.verbose
            },
            timestamp: new Date().toISOString()
        }), {
            headers: {
                "Content-Type": "application/json"
            }
        });
    },
});

console.log(`🔥 Hot reloading server running at http://${server.host}:${server.port}`);
console.log("💡 Modify config.yaml to see live changes without restart!");

// Example 8: Error handling with YAML parsing
try {
    Bun.YAML.parse("invalid: yaml: content");  // Fixed: removed trailing colon
} catch (error: unknown) {
    console.error("Failed to parse YAML:", error instanceof Error ? error.message : String(error));
}

// Example 9: Dynamic YAML imports (Official Bun API)
// Load configuration based on environment
async function loadEnvironmentConfig() {
    const env = process.env.NODE_ENV || "development";
    const config = await import(`./configs/${env}.yaml`);
    return config.default;
}

// Load user-specific settings
async function loadUserSettings(userId: string) {
    try {
        const settings = await import(`./users/${userId}/settings.yaml`);
        return settings.default;
    } catch {
        return await import("./users/default-settings.yaml");
    }
}

// Example usage of dynamic imports
console.log("🔄 Demonstrating dynamic YAML imports...");

// Load environment-specific configuration
loadEnvironmentConfig().then(envConfig => {
    console.log("✅ Environment config loaded:", envConfig);
}).catch(err => {
    console.log("ℹ️ Environment config not found, using default");
});

// Load user settings (will fall back to default if user doesn't exist)
loadUserSettings("demo-user").then(userSettings => {
    console.log("✅ User settings loaded:", userSettings);
}).catch(err => {
    console.log("ℹ️ Using default user settings");
});

// Example 10: Hot reloading demonstration
if (process.env.NODE_ENV === "development") {
    console.log("🔥 Hot reloading enabled - modify YAML files to see changes");

    // Watch for configuration changes
    setInterval(() => {
        if (isFeatureEnabled("bunOptimizations")) {
            console.log("✅ Bun optimizations are active");
        }
    }, 5000);
}

export { httpServer, YAML, data, documents };
