#!/usr/bin/env bun

/**
 * 📚 Bun YAML Import Patterns
 * 
 * Demonstrates the two main ways to import YAML files in Bun:
 * 1. Default import (recommended for native Bun)
 * 2. Named imports (works but can cause TypeScript issues)
 */

console.log("📚 Bun YAML Import Patterns");
console.log("===========================");

// Pattern 1: Default Import (Native Bun Approach)
console.log("\n🎯 Pattern 1: Default Import (Recommended)");
console.log("-------------------------------------------");

import config from "./config.yaml";

console.log("✅ Default import loaded successfully");
console.log("📋 Full config object:", config);
console.log("📍 Access properties:");
console.log(`   - config.database.host: "${config.database.host}"`);
console.log(`   - config.redis.port: ${config.redis.port}`);
console.log(`   - config.features.auth: ${config.features.auth}`);

// Pattern 2: Named Imports (Can cause TypeScript issues)
console.log("\n⚠️  Pattern 2: Named Imports (Use with Caution)");
console.log("-----------------------------------------------");

try {
    // This works at runtime but may cause TypeScript errors
    // import { database, redis, features } from "./config.yaml";

    // For demonstration, we'll destructure from the default import
    const { database, redis, features } = config;

    console.log("✅ Named imports (via destructuring) loaded successfully");
    console.log("📍 Direct access:");
    console.log(`   - database.host: "${database.host}"`);
    console.log(`   - redis.port: ${redis.port}`);
    console.log(`   - features.auth: ${features.auth}`);

} catch (error) {
    console.error("❌ Named imports failed:", error instanceof Error ? error.message : String(error));
}

// Pattern Comparison
console.log("\n🔄 Pattern Comparison");
console.log("=====================");

console.log("🎯 Default Import Benefits:");
console.log("   ✅ Always works with Bun's native YAML support");
console.log("   ✅ No TypeScript compilation errors");
console.log("   ✅ Full access to the entire configuration object");
console.log("   ✅ Better for complex nested configurations");

console.log("\n⚠️  Named Imports Considerations:");
console.log("   ⚠️  Can cause TypeScript 'Module has no exported member' errors");
console.log("   ⚠️  Requires destructuring for native Bun compatibility");
console.log("   ⚠️  Less flexible for dynamic property access");

// Practical Examples
console.log("\n💡 Practical Usage Examples");
console.log("===========================");

// Example 1: Configuration validation with default import
function validateConfig(config: any) {
    const errors: string[] = [];

    if (!config.database?.host) {
        errors.push("Database host is required");
    }

    if (!config.redis?.port || config.redis.port < 1 || config.redis.port > 65535) {
        errors.push("Redis port must be between 1 and 65536");
    }

    if (typeof config.features?.auth !== 'boolean') {
        errors.push("Features.auth must be a boolean");
    }

    return errors;
}

const validationErrors = validateConfig(config);
if (validationErrors.length === 0) {
    console.log("✅ Configuration validation passed");
} else {
    console.log("❌ Configuration validation failed:");
    validationErrors.forEach(error => console.log(`   - ${error}`));
}

// Example 2: Dynamic configuration access
function getConfigValue(path: string, defaultValue: any = null) {
    const keys = path.split('.');
    let value = config;

    for (const key of keys) {
        value = value?.[key];
        if (value === undefined) {
            return defaultValue;
        }
    }

    return value;
}

console.log("\n🔍 Dynamic configuration access:");
console.log(`   - getConfigValue('database.host'): "${getConfigValue('database.host')}"`);
console.log(`   - getConfigValue('redis.port'): ${getConfigValue('redis.port')}`);
console.log(`   - getConfigValue('features.auth'): ${getConfigValue('features.auth')}`);
console.log(`   - getConfigValue('nonexistent.path', 'default'): "${getConfigValue('nonexistent.path', 'default')}"`);

// Example 3: Configuration merging
const defaultConfig = {
    database: { timeout: 5000 },
    redis: { timeout: 3000 },
    features: { debug: false }
};

function mergeConfig(userConfig: any, defaultConfig: any) {
    return {
        database: { ...defaultConfig.database, ...userConfig.database },
        redis: { ...defaultConfig.redis, ...userConfig.redis },
        features: { ...defaultConfig.features, ...userConfig.features }
    };
}

const mergedConfig = mergeConfig(config, defaultConfig);
console.log("\n🔗 Configuration merging:");
console.log(`   - Merged database timeout: ${mergedConfig.database.timeout}`);
console.log(`   - Merged redis timeout: ${mergedConfig.redis.timeout}`);
console.log(`   - Merged features debug: ${mergedConfig.features.debug}`);

// Performance comparison
console.log("\n🏎️ Performance Comparison");
console.log("===========================");

const iterations = 1000;

// Test default import performance
const defaultStart = performance.now();
for (let i = 0; i < iterations; i++) {
    const host = config.database.host;
    const port = config.redis.port;
    const auth = config.features.auth;
}
const defaultEnd = performance.now();

// Test destructured performance
const { database: db, redis: rd, features: ft } = config;
const destructuredStart = performance.now();
for (let i = 0; i < iterations; i++) {
    const host = db.host;
    const port = rd.port;
    const auth = ft.auth;
}
const destructuredEnd = performance.now();

console.log(`📊 Performance test (${iterations} iterations):`);
console.log(`   - Default import: ${(defaultEnd - defaultStart).toFixed(2)}ms`);
console.log(`   - Destructured access: ${(destructuredEnd - destructuredStart).toFixed(2)}ms`);
console.log(`   - Difference: ${Math.abs((defaultEnd - defaultStart) - (destructuredEnd - destructuredStart)).toFixed(2)}ms`);

// Recommendations
console.log("\n🎯 Recommendations");
console.log("==================");
console.log("✅ Use default imports for:");
console.log("   - New Bun projects");
console.log("   - Complex nested configurations");
console.log("   - Dynamic property access");
console.log("   - Maximum TypeScript compatibility");

console.log("\n🔧 Use destructuring for:");
console.log("   - Frequently accessed properties");
console.log("   - Cleaner code when you know the structure");
console.log("   - Performance-critical sections");

console.log("\n❌ Avoid direct named imports because:");
console.log("   - Can cause TypeScript compilation errors");
console.log("   - Less flexible than default + destructuring");
console.log("   - Not the recommended Bun pattern");

console.log("\n✅ Import patterns demonstration complete!");
