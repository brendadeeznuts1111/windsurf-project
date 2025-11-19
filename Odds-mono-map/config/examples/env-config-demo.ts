#!/usr/bin/env bun

/**
 * 🌍 Environment-Based Configuration Demo
 * 
 * Demonstrates Bun YAML's powerful configuration management features:
 * - Environment-specific configurations with merge keys
 * - Environment variable interpolation
 * - Feature flags with rollout percentages
 * - Hot reloading support
 */

export { }; // Make this file a module for top-level await

console.log("🌍 Environment-Based Configuration Demo");
console.log("=========================================");

// Example 1: Environment-Based Configuration
console.log("\n🏗️ Example 1: Environment-Based Configuration");
console.log("-------------------------------------------------");

import configs from "./env-config.yaml";

const env = process.env.NODE_ENV || "development";

// Handle test environment by falling back to development
const config = configs[env] || configs.development;

if (!configs[env]) {
    console.log(`⚠️  Environment '${env}' not found, using development configuration`);
}

console.log(`🚀 Current environment: ${env}`);
console.log("📋 Configuration loaded:");
console.log(`   - Timeout: ${config.timeout}ms`);
console.log(`   - Retries: ${config.retries}`);
console.log(`   - API URL: ${config.api.url}`);
console.log(`   - API Key: ${config.api.key}`);
console.log(`   - Cache enabled: ${config.cache.enabled}`);
console.log(`   - Cache TTL: ${config.cache.ttl}s`);
console.log(`   - Log level: ${config.logging.level}`);
console.log(`   - Pretty logging: ${config.logging.pretty}`);

// Example 2: Environment Variable Interpolation
console.log("\n🔧 Example 2: Environment Variable Interpolation");
console.log("----------------------------------------------------");

// Environment variables in YAML values can be interpolated
function interpolateEnvVars(obj: any): any {
    if (typeof obj === "string") {
        return obj.replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] || "");
    }
    if (typeof obj === "object" && obj !== null) {
        for (const key in obj) {
            obj[key] = interpolateEnvVars(obj[key]);
        }
    }
    return obj;
}

// Set some test environment variables
process.env.STAGING_API_KEY = "staging_secret_123";
process.env.PROD_API_KEY = "prod_secret_456";

const interpolatedConfig = interpolateEnvVars(config);
console.log("🔑 Interpolated configuration:");
console.log(`   - API Key: ${interpolatedConfig.api.key}`);

// Example 3: Feature Flags Configuration
console.log("\n🚩 Example 3: Feature Flags Configuration");
console.log("--------------------------------------------");

import featuresConfig from "./features.yaml";
const { features } = featuresConfig;

console.log("🎯 Available features:");
Object.keys(features).forEach(featureName => {
    const feature = features[featureName];
    console.log(`   - ${featureName}: enabled=${feature.enabled}`);
});

// Example 4: Advanced Feature Flag Logic
console.log("\n🎲 Example 4: Advanced Feature Flag Logic");
console.log("------------------------------------------");

// Simple hash function for rollout percentage
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

export function isFeatureEnabled(featureName: string, userEmail?: string): boolean {
    const feature = features[featureName];

    if (!feature?.enabled) {
        return false;
    }

    // Check allowed users first (they bypass rollout percentage)
    if (feature.allowedUsers && userEmail) {
        return feature.allowedUsers.includes(userEmail);
    }

    // Check rollout percentage for non-allowed users
    if (feature.rolloutPercentage < 100) {
        const hash = hashCode(userEmail || "anonymous");
        if (hash % 100 >= feature.rolloutPercentage) {
            return false;
        }
    }

    return true;
}

// Test feature flags with different users
const testUsers = [
    "admin@example.com",
    "beta@example.com",
    "user@example.com",
    "anonymous"
];

console.log("🧪 Feature flag tests:");
testUsers.forEach(user => {
    console.log(`\n   User: ${user}`);
    console.log(`     - newDashboard: ${isFeatureEnabled("newDashboard", user)}`);
    console.log(`     - experimentalAPI: ${isFeatureEnabled("experimentalAPI", user)}`);
    console.log(`     - betaFeatures: ${isFeatureEnabled("betaFeatures", user)}`);
    console.log(`     - advancedSearch: ${isFeatureEnabled("advancedSearch", user)}`);
});

// Example 5: Configuration Validation
console.log("\n✅ Example 5: Configuration Validation");
console.log("---------------------------------------");

function validateConfig(config: any, env: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!config.timeout || config.timeout < 1000) {
        errors.push("Timeout must be at least 1000ms");
    }

    if (!config.api?.url) {
        errors.push("API URL is required");
    }

    if (!config.api?.key) {
        errors.push("API key is required");
    }

    if (!config.logging?.level) {
        errors.push("Log level is required");
    }

    // Environment-specific validation
    if (env === "production" && config.logging?.level === "debug") {
        errors.push("Debug logging should not be used in production");
    }

    if (env === "production" && config.api?.url?.includes("localhost")) {
        errors.push("Localhost URLs should not be used in production");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

const validation = validateConfig(config, env);
console.log(`🔍 Configuration validation for ${env}:`);
if (validation.valid) {
    console.log("   ✅ Configuration is valid");
} else {
    console.log("   ❌ Configuration has errors:");
    validation.errors.forEach(error => console.log(`      - ${error}`));
}

// Example 6: Configuration Comparison
console.log("\n📊 Example 6: Configuration Comparison");
console.log("----------------------------------------");

const environments = ["development", "staging", "production"];
console.log("🔍 Environment comparison:");

environments.forEach(envName => {
    const envConfig = configs[envName];
    console.log(`\n   ${envName.toUpperCase()}:`);
    console.log(`     - API: ${envConfig.api.url}`);
    console.log(`     - Cache TTL: ${envConfig.cache.ttl}s`);
    console.log(`     - Log level: ${envConfig.logging.level}`);
    console.log(`     - Pretty logs: ${envConfig.logging.pretty}`);
});

// Example 7: Hot Reloading Simulation
console.log("\n🔥 Example 7: Hot Reloading Support");
console.log("------------------------------------");

console.log("💡 Hot reloading is enabled with:");
console.log("   bun --hot your-app.ts");
console.log("");
console.log("🔄 Changes to configuration files will be detected automatically:");
console.log("   - Modify env-config.yaml to see environment changes");
console.log("   - Modify features.yaml to toggle features in real-time");
console.log("   - Environment variables are re-interpolated on change");

// Example 8: Practical Application
console.log("\n💼 Example 8: Practical Application");
console.log("------------------------------------");

function createAppConfig(env: string) {
    const baseConfig = configs[env] || configs.development; // Fallback to development

    if (!configs[env]) {
        console.log(`⚠️  Environment '${env}' not found, using development configuration`);
    }

    const interpolated = interpolateEnvVars(baseConfig);
    const validation = validateConfig(interpolated, env);

    if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
    }

    return {
        environment: env,
        api: {
            baseURL: interpolated.api.url,
            headers: {
                "Authorization": `Bearer ${interpolated.api.key}`,
                "Content-Type": "application/json"
            },
            timeout: interpolated.timeout
        },
        cache: {
            enabled: interpolated.cache.enabled,
            ttl: interpolated.cache.ttl * 1000 // Convert to milliseconds
        },
        logging: {
            level: interpolated.logging.level,
            pretty: interpolated.logging.pretty
        },
        features: {
            newDashboard: isFeatureEnabled("newDashboard"),
            experimentalAPI: isFeatureEnabled("experimentalAPI"),
            darkMode: isFeatureEnabled("darkMode"),
            advancedSearch: isFeatureEnabled("advancedSearch")
        }
    };
}

try {
    const appConfig = createAppConfig(env);
    console.log("🚀 Application configuration created:");
    console.log(`   - Environment: ${appConfig.environment}`);
    console.log(`   - API Base URL: ${appConfig.api.baseURL}`);
    console.log(`   - Request timeout: ${appConfig.api.timeout}ms`);
    console.log(`   - Cache enabled: ${appConfig.cache.enabled}`);
    console.log(`   - Cache TTL: ${appConfig.cache.ttl}ms`);
    console.log(`   - Log level: ${appConfig.logging.level}`);
    console.log(`   - Features enabled: ${Object.values(appConfig.features).filter(Boolean).length}/${Object.keys(appConfig.features).length}`);
} catch (error) {
    console.error("❌ Failed to create application config:", error instanceof Error ? error.message : String(error));
}

console.log("\n✅ Environment-based configuration demonstration complete!");
console.log("💡 Perfect for:");
console.log("   • Multi-environment deployments");
console.log("   • Feature flag management");
console.log("   • Hot-reloading configurations");
console.log("   • Environment variable interpolation");
console.log("   • Configuration validation");
