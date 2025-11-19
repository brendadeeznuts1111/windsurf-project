#!/usr/bin/env bun

/**
 * 🎯 Bun YAML Import Demo
 * 
 * Demonstrates the two import patterns you showed:
 * 1. Default import with property access
 * 2. Named imports via destructuring
 */

console.log("🎯 Bun YAML Import Demo");
console.log("=======================");

// Pattern 1: Default Import
console.log("\n📋 Pattern 1: Default Import");
console.log("----------------------------");

import config from "./simple-config.yaml";

console.log("import config from './simple-config.yaml';");
console.log(`console.log(config.database.host); // "${config.database.host}"`);
console.log(`console.log(config.redis.port); // ${config.redis.port}`);
console.log(`console.log(config.features.auth); // ${config.features.auth}`);

// Pattern 2: Named Imports (via destructuring)
console.log("\n🔧 Pattern 2: Named Imports (Destructuring)");
console.log("-----------------------------------------");

// This is the native Bun way to get "named imports"
const { database, redis, features } = config;

console.log("const { database, redis, features } = config;");
console.log(`console.log(database.host); // "${database.host}"`);
console.log(`console.log(redis.port); // ${redis.port}`);
console.log(`console.log(features.auth); // ${features.auth}`);

// Why Pattern 1 is recommended
console.log("\n✅ Why Default Import is Recommended:");
console.log("------------------------------------");
console.log("• Always works with Bun's native YAML support");
console.log("• No TypeScript compilation errors");
console.log("• Full access to the entire configuration");
console.log("• Better for dynamic property access");

// When to use destructuring
console.log("\n🔧 When to Use Destructuring:");
console.log("------------------------------");
console.log("• For frequently accessed properties");
console.log("• When you know the exact structure");
console.log("• For cleaner, more readable code");
console.log("• Performance-critical sections");

// Performance comparison
console.log("\n🏎️ Performance Test (10,000 iterations):");
console.log("=========================================");

const iterations = 10000;

// Test default import access
const defaultStart = performance.now();
for (let i = 0; i < iterations; i++) {
    const host = config.database.host;
    const port = config.redis.port;
    const auth = config.features.auth;
}
const defaultEnd = performance.now();

// Test destructured access
const destructuredStart = performance.now();
for (let i = 0; i < iterations; i++) {
    const host = database.host;
    const port = redis.port;
    const auth = features.auth;
}
const destructuredEnd = performance.now();

console.log(`Default import: ${(defaultEnd - defaultStart).toFixed(2)}ms`);
console.log(`Destructured: ${(destructuredEnd - destructuredStart).toFixed(2)}ms`);
console.log(`Performance difference: ${Math.abs((defaultEnd - defaultStart) - (destructuredEnd - destructuredStart)).toFixed(2)}ms`);

console.log("\n✅ Both patterns work perfectly with Bun!");
console.log("💡 Choose based on your specific needs.");
