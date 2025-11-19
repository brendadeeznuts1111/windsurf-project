#!/usr/bin/env bun

/**
 * 📄 Multi-Document YAML Demo
 * 
 * Demonstrates Bun's powerful multi-document YAML parsing
 * Perfect for environment configurations, feature flags, and modular configs
 */

import { readYamlFile } from "./bun-yaml-utils";

console.log("📄 Multi-Document YAML Demo");
console.log("===========================");

// Example 1: Basic multi-document parsing (your example)
console.log("\n🎯 Example 1: Basic Multi-Document Parsing");
console.log("-------------------------------------------");

const multiDoc = `
---
name: Document 1
---
name: Document 2
---
name: Document 3
`;

const docs = Bun.YAML.parse(multiDoc);
console.log("Parsed documents:");
console.log(docs);

// Example 2: Load from file with Bun.file()
console.log("\n📁 Example 2: Multi-Document from File");
console.log("--------------------------------------");

const multiDocContent = await Bun.file("./multi-document.yaml").text();
const environments = Bun.YAML.parse(multiDocContent) as Array<{
    name: string;
    database: { host: string; port: number; name: string };
    redis: { host: string; port: number };
    features: { debug: boolean; verbose: boolean; analytics: boolean; hotReload?: boolean };
}>;

console.log(`✅ Loaded ${environments.length} environment configurations:`);

environments.forEach((env, index: number) => {
    console.log(`\n📋 Environment ${index + 1}: ${env.name}`);
    console.log(`   Database: ${env.database.host}:${env.database.port}/${env.database.name}`);
    console.log(`   Redis: ${env.redis.host}:${env.redis.port}`);
    console.log(`   Features: debug=${env.features.debug}, analytics=${env.features.analytics}`);
});

// Example 3: Environment-specific configuration loading
console.log("\n🌍 Example 3: Environment-Specific Configuration");
console.log("-------------------------------------------------");

function getEnvironmentConfig(envName: string) {
    const envs = Bun.YAML.parse(multiDocContent) as Array<{
        name: string;
        database: { host: string; port: number; name: string };
        redis: { host: string; port: number };
        features: { debug: boolean; verbose: boolean; analytics: boolean; hotReload?: boolean };
    }>;
    const config = envs.find((env) => env.name === envName);

    if (!config) {
        throw new Error(`Environment '${envName}' not found`);
    }

    return config;
}

// Load different environments
const currentEnv = process.env.NODE_ENV || "development";
const envConfig = getEnvironmentConfig(currentEnv);

console.log(`🚀 Current environment: ${currentEnv}`);
console.log(`📍 Database: ${envConfig.database.host}:${envConfig.database.port}`);
console.log(`🔴 Redis: ${envConfig.redis.host}:${envConfig.redis.port}`);
console.log(`🔧 Features: ${JSON.stringify(envConfig.features)}`);

// Example 4: Configuration merging and inheritance
console.log("\n🔗 Example 4: Configuration Merging");
console.log("------------------------------------");

function mergeWithDefaults(baseConfig: any, envConfig: any) {
    return {
        ...baseConfig,
        ...envConfig,
        database: { ...baseConfig.database, ...envConfig.database },
        redis: { ...baseConfig.redis, ...envConfig.redis },
        features: { ...baseConfig.features, ...envConfig.features }
    };
}

const defaultConfig = {
    timeout: 5000,
    retries: 3,
    logging: { level: "info", format: "json" }
};

const mergedConfig = mergeWithDefaults(defaultConfig, envConfig);
console.log("🔗 Merged configuration:");
console.log(`   Timeout: ${mergedConfig.timeout}`);
console.log(`   Database: ${mergedConfig.database.host}:${mergedConfig.database.port}`);
console.log(`   Debug mode: ${mergedConfig.features.debug}`);

// Example 5: Feature flag management across environments
console.log("\n🚩 Example 5: Feature Flag Management");
console.log("--------------------------------------");

function getFeatureFlags(envName: string) {
    const envs = Bun.YAML.parse(multiDocContent) as Array<{
        name: string;
        features: { debug: boolean; analytics: boolean; verbose: boolean };
    }>;
    const env = envs.find((e) => e.name === envName);
    return env?.features || { debug: false, analytics: false, verbose: false };
}

console.log("🚩 Feature flags by environment:");
["development", "staging", "production", "testing", "local"].forEach(env => {
    const flags = getFeatureFlags(env);
    console.log(`   ${env}: debug=${flags.debug}, analytics=${flags.analytics}, verbose=${flags.verbose}`);
});

// Example 6: Performance comparison
console.log("\n🏎️ Example 6: Performance Comparison");
console.log("--------------------------------------");

const iterations = 1000;

// Test multi-document parsing performance
const multiDocStart = performance.now();
for (let i = 0; i < iterations; i++) {
    Bun.YAML.parse(multiDocContent) as Array<any>;
}
const multiDocEnd = performance.now();

// Test single-document parsing for comparison
const singleDocContent = await Bun.file("./config.yaml").text();
const singleDocStart = performance.now();
for (let i = 0; i < iterations; i++) {
    Bun.YAML.parse(singleDocContent) as any;
}
const singleDocEnd = performance.now();

console.log(`📊 Performance test (${iterations} iterations):`);
console.log(`   Multi-document parsing: ${(multiDocEnd - multiDocStart).toFixed(2)}ms`);
console.log(`   Single-document parsing: ${(singleDocEnd - singleDocStart).toFixed(2)}ms`);
console.log(`   Difference: ${((multiDocEnd - multiDocStart) - (singleDocEnd - singleDocStart)).toFixed(2)}ms`);

// Example 7: Advanced usage - Configuration validation
console.log("\n✅ Example 7: Configuration Validation");
console.log("--------------------------------------");

function validateEnvironmentConfig(config: any): string[] {
    const errors: string[] = [];

    if (!config.name) errors.push("Environment name is required");
    if (!config.database?.host) errors.push("Database host is required");
    if (!config.database?.port || config.database.port < 1 || config.database.port > 65536) {
        errors.push("Database port must be between 1 and 65536");
    }
    if (!config.redis?.host) errors.push("Redis host is required");
    if (!config.redis?.port || config.redis.port < 1 || config.redis.port > 65536) {
        errors.push("Redis port must be between 1 and 65536");
    }
    if (typeof config.features?.debug !== 'boolean') {
        errors.push("Features.debug must be a boolean");
    }

    return errors;
}

console.log("✅ Validating all environment configurations:");
const envsForValidation = Bun.YAML.parse(multiDocContent) as Array<{
    name: string;
    database: { host: string; port: number; name: string };
    redis: { host: string; port: number };
    features: { debug: boolean; verbose: boolean; analytics: boolean; hotReload?: boolean };
}>;

envsForValidation.forEach((env, index: number) => {
    const errors = validateEnvironmentConfig(env);
    if (errors.length === 0) {
        console.log(`   ✅ ${env.name}: Valid configuration`);
    } else {
        console.log(`   ❌ ${env.name}: ${errors.length} errors`);
        errors.forEach(error => console.log(`      - ${error}`));
    }
});

// Example 8: Dynamic configuration generation
console.log("\n🔄 Example 8: Dynamic Configuration Generation");
console.log("-------------------------------------------------");

function generateConfigMatrix() {
    const envs = Bun.YAML.parse(multiDocContent) as Array<{
        name: string;
        database: { host: string; port: number; name: string };
        redis: { host: string; port: number };
        features: { debug: boolean; analytics: boolean };
    }>;

    return envs.map((env) => ({
        environment: env.name,
        connectionString: `postgresql://${env.database.host}:${env.database.port}/${env.database.name}`,
        redisUrl: `redis://${env.redis.host}:${env.redis.port}`,
        debugMode: env.features.debug,
        analyticsEnabled: env.features.analytics
    }));
}

const configMatrix = generateConfigMatrix();
console.log("🔄 Generated configuration matrix:");
configMatrix.forEach((config: any) => {
    console.log(`   ${config.environment}:`);
    console.log(`     Database: ${config.connectionString}`);
    console.log(`     Debug: ${config.debugMode}`);
    console.log(`     Analytics: ${config.analyticsEnabled}`);
});

// Example 9: Hot reloading with multi-document configs
console.log("\n🔥 Example 9: Hot Reloading Support");
console.log("-----------------------------------");

console.log("💡 Multi-document YAML supports hot reloading with:");
console.log("   bun --hot your-app.ts");
console.log("   # Modify multi-document.yaml to see live changes");
console.log("   # All environments reload automatically");

console.log("\n✅ Multi-document YAML demonstration complete!");
console.log("💡 Perfect for:");
console.log("   • Environment-specific configurations");
console.log("   • Feature flag management");
console.log("   • Modular configuration systems");
console.log("   • CI/CD pipeline configurations");
