#!/usr/bin/env bun

/**
 * 🛠️ YAML Utilities Demo
 * 
 * Comprehensive demonstration of the YAML utilities library
 * showcasing production-ready error handling patterns
 */

import {
    parseYamlSafely,
    parseYamlFile,
    parseYamlWithValidation,
    parseYamlWithFallback,
    parseYamlBatch,
    parseYamlWithLogging,
    commonValidationRules,
    benchmarkYamlParsing,
    yamlUtils,
    examples,
    type ParseResult,
    type ValidationRule
} from "./yaml-utils";

export { }; // Make this file a module

console.log("🛠️ YAML Utilities Demo");
console.log("=======================");

// Example 1: Basic Safe Parsing
console.log("\n📄 Example 1: Basic Safe Parsing");
console.log("-----------------------------------");

const validYaml = `
name: John Doe
age: 30
email: john@example.com
hobbies:
  - reading
  - coding
  - hiking
`;

const invalidYaml = "invalid: yaml: content:";

console.log("✅ Parsing valid YAML:");
const validResult = parseYamlSafely(validYaml, "user-profile");
if (validResult.success) {
    console.log(`   Name: ${validResult.data.name}`);
    console.log(`   Age: ${validResult.data.age}`);
    console.log(`   Email: ${validResult.data.email}`);
    console.log(`   Hobbies: ${validResult.data.hobbies.join(", ")}`);
} else {
    console.log(`   Error: ${validResult.error}`);
}

console.log("\n❌ Parsing invalid YAML:");
const invalidResult = parseYamlSafely(invalidYaml, "broken-profile");
if (!invalidResult.success) {
    console.log(`   Error: ${invalidResult.error}`);
    console.log(`   Type: ${invalidResult.type}`);
    console.log(`   Source: ${invalidResult.source}`);
    console.log(`   Timestamp: ${invalidResult.timestamp}`);
}

// Example 2: File Operations
console.log("\n📁 Example 2: File Operations");
console.log("--------------------------------");

console.log("✅ Reading existing file:");
const fileResult = await parseYamlFile("./env-config.yaml");
if (fileResult.success) {
    console.log(`   File loaded successfully from ${fileResult.source}`);
    console.log(`   Environment: development`);
    console.log(`   API URL: ${fileResult.data.development.api.url}`);
} else {
    console.log(`   Error: ${fileResult.error}`);
}

console.log("\n❌ Reading non-existent file:");
const missingFileResult = await parseYamlFile("./non-existent.yaml");
if (!missingFileResult.success) {
    console.log(`   Error: ${missingFileResult.error}`);
    console.log(`   Type: ${missingFileResult.type}`);
}

// Example 3: Validation with Rules
console.log("\n✅ Example 3: Validation with Rules");
console.log("-------------------------------------");

const configYaml = `
timeout: 5000
retries: 3
api:
  url: https://api.example.com
  key: secret_key_12345
logging:
  level: info
  pretty: false
`;

const invalidConfigYaml = `
timeout: 500
retries: 0
api:
  url: not-a-valid-url
  key: ""
logging:
  level: ""
`;

interface AppConfig {
    timeout: number;
    retries: number;
    api: {
        url: string;
        key: string;
    };
    logging: {
        level: string;
        pretty: boolean;
    };
}

const configRules: ValidationRule<AppConfig>[] = [
    commonValidationRules.requiredNumber("timeout", 1000),
    commonValidationRules.requiredNumber("retries", 1),
    commonValidationRules.requiredObject("api"),
    commonValidationRules.url("api.url"),
    commonValidationRules.requiredString("api.key"),
    commonValidationRules.requiredObject("logging"),
    commonValidationRules.requiredString("logging.level"),
    commonValidationRules.requiredBoolean("logging.pretty")
];

console.log("✅ Validating good config:");
const validConfigResult = parseYamlWithValidation<AppConfig>(configYaml, configRules, "app-config");
if (validConfigResult.success && validConfigResult.data) {
    console.log("   ✅ Configuration is valid");
    console.log(`   Timeout: ${validConfigResult.data.timeout}ms`);
    console.log(`   API URL: ${validConfigResult.data.api.url}`);
} else {
    console.log(`   ❌ ${validConfigResult.error}`);
}

console.log("\n❌ Validating bad config:");
const invalidConfigResult = parseYamlWithValidation<AppConfig>(invalidConfigYaml, configRules, "bad-config");
if (!invalidConfigResult.success) {
    console.log(`   ❌ ${invalidConfigResult.error}`);
    console.log(`   Type: ${invalidConfigResult.type}`);
}

// Example 4: Graceful Fallback
console.log("\n🔄 Example 4: Graceful Fallback");
console.log("---------------------------------");

const defaultConfig: AppConfig = {
    timeout: 3000,
    retries: 2,
    api: {
        url: "http://localhost:3000",
        key: "default_key"
    },
    logging: {
        level: "warn",
        pretty: true
    }
};

console.log("✅ Using valid config with fallback:");
const fallbackResult1 = parseYamlWithFallback<AppConfig>(configYaml, defaultConfig, configRules, "production-config");
console.log(`   Result timeout: ${fallbackResult1.timeout}ms`);

console.log("\n⚠️  Using invalid config with fallback:");
const fallbackResult2 = parseYamlWithFallback<AppConfig>(invalidConfigYaml, defaultConfig, configRules, "broken-config");
console.log(`   Result timeout: ${fallbackResult2.timeout}ms (fallback used)`);

// Example 5: Batch Processing
console.log("\n📦 Example 5: Batch Processing");
console.log("--------------------------------");

const batchYaml = [
    { content: "name: Alice\nage: 25", source: "user1.yaml" },
    { content: "name: Bob\nage: 30", source: "user2.yaml" },
    { content: "invalid: yaml: content", source: "broken.yaml" },
    { content: "name: Charlie\nage: 35", source: "user3.yaml" },
    { content: "name: invalid: yaml", source: "malformed.yaml" }
];

const batchResult = parseYamlBatch(batchYaml);

console.log("📊 Batch processing summary:");
console.log(`   Total files: ${batchResult.total}`);
console.log(`   Successful: ${batchResult.successful}`);
console.log(`   Failed: ${batchResult.failed}`);

console.log("\n📋 Individual results:");
batchResult.results.forEach((result, index) => {
    if (result.success) {
        console.log(`   ${index + 1}. ✅ ${result.source}: ${result.data.name}, ${result.data.age}`);
    } else {
        console.log(`   ${index + 1}. ❌ ${result.source}: ${result.error}`);
    }
});

// Example 6: Logging with Different Levels
console.log("\n📝 Example 6: Logging with Different Levels");
console.log("-------------------------------------------");

console.log("🔍 Debug level logging:");
parseYamlWithLogging(validYaml, "debug-config", "debug");

console.log("\n❌ Error level logging:");
parseYamlWithLogging(invalidYaml, "error-config", "error");

// Example 7: Performance Benchmarking
console.log("\n⚡ Example 7: Performance Benchmarking");
console.log("----------------------------------------");

const benchmarkResult = await benchmarkYamlParsing(validYaml, 1000);

console.log("📊 Performance metrics:");
console.log(`   Total time: ${benchmarkResult.totalTime.toFixed(2)}ms`);
console.log(`   Average per parse: ${benchmarkResult.avgTime.toFixed(3)}ms`);
console.log(`   Parses per second: ${benchmarkResult.parsesPerSecond.toLocaleString()}`);

// Example 8: Utility Functions
console.log("\n🔧 Example 8: Utility Functions");
console.log("----------------------------------");

const testYaml = `
# User configuration
name: John Doe
age: 30

---
# Second document
role: developer
skills:
  - javascript
  - typescript
`;

console.log("🔍 YAML analysis:");
console.log(`   Is empty: ${yamlUtils.isEmpty(testYaml)}`);
console.log(`   Is multi-document: ${yamlUtils.isMultiDocument(testYaml)}`);
console.log(`   Document count: ${yamlUtils.countDocuments(testYaml)}`);

const comments = yamlUtils.extractComments(testYaml);
console.log(`   Comments: ${comments.join(", ")}`);

// Example 9: Real-World Configuration Scenario
console.log("\n🌍 Example 9: Real-World Configuration Scenario");
console.log("------------------------------------------------");

interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    pool: {
        min: number;
        max: number;
    };
}

const databaseYaml = `
host: localhost
port: 5432
database: myapp
username: user
password: secret
ssl: true
pool:
  min: 2
  max: 10
`;

const databaseRules: ValidationRule<DatabaseConfig>[] = [
    commonValidationRules.requiredString("host"),
    commonValidationRules.requiredNumber("port", 1),
    commonValidationRules.requiredString("database"),
    commonValidationRules.requiredString("username"),
    commonValidationRules.requiredString("password"),
    commonValidationRules.requiredBoolean("ssl"),
    commonValidationRules.requiredObject("pool"),
    commonValidationRules.requiredNumber("pool.min", 1),
    commonValidationRules.requiredNumber("pool.max", 1)
];

console.log("🗄️  Database configuration validation:");
const dbResult = parseYamlWithValidation<DatabaseConfig>(databaseYaml, databaseRules, "database.yaml");

if (dbResult.success && dbResult.data) {
    console.log("   ✅ Database configuration is valid");
    console.log(`   Host: ${dbResult.data.host}:${dbResult.data.port}`);
    console.log(`   Database: ${dbResult.data.database}`);
    console.log(`   Pool: ${dbResult.data.pool.min}-${dbResult.data.pool.max} connections`);
} else {
    console.log(`   ❌ ${dbResult.error}`);
}

// Example 10: Error Recovery Patterns
console.log("\n🔄 Example 10: Error Recovery Patterns");
console.log("--------------------------------------");

function loadConfigurationWithRecovery<T>(
    configPaths: string[],
    fallback: T,
    validationRules?: ValidationRule<T>[]
): Promise<{ config: T; source: string; usedFallback: boolean }> {
    return new Promise(async (resolve) => {
        let lastError: string | undefined;

        for (const configPath of configPaths) {
            const result = await parseYamlFile<T>(configPath);

            if (result.success) {
                // Validate if rules provided
                if (validationRules) {
                    const validationResult = parseYamlWithValidation(
                        JSON.stringify(result.data), // Convert back to YAML-like string for validation
                        validationRules,
                        configPath
                    );

                    if (validationResult.success) {
                        resolve({ config: result.data!, source: configPath, usedFallback: false });
                        return;
                    } else {
                        lastError = validationResult.error;
                        continue;
                    }
                } else {
                    resolve({ config: result.data!, source: configPath, usedFallback: false });
                    return;
                }
            } else {
                lastError = result.error;
                continue;
            }
        }

        console.log(`⚠️  All configuration sources failed, using fallback. Last error: ${lastError}`);
        resolve({ config: fallback, source: "fallback", usedFallback: true });
    });
}

console.log("🔄 Configuration recovery:");
const configPaths = ["./production.yaml", "./staging.yaml", "./development.yaml"];
const defaultDbConfig: DatabaseConfig = {
    host: "localhost",
    port: 5432,
    database: "default",
    username: "default",
    password: "default",
    ssl: false,
    pool: { min: 1, max: 5 }
};

const recoveryResult = await loadConfigurationWithRecovery<DatabaseConfig>(
    configPaths,
    defaultDbConfig,
    databaseRules
);

console.log(`   Configuration loaded from: ${recoveryResult.source}`);
console.log(`   Used fallback: ${recoveryResult.usedFallback}`);
console.log(`   Database: ${recoveryResult.config.database}`);

console.log("\n✅ YAML Utilities demonstration complete!");
console.log("💡 Key features demonstrated:");
console.log("   • Safe parsing with comprehensive error handling");
console.log("   • File operations with existence checking");
console.log("   • Validation with reusable rule system");
console.log("   • Graceful fallback mechanisms");
console.log("   • Batch processing with detailed reporting");
console.log("   • Configurable logging levels");
console.log("   • Performance benchmarking");
console.log("   • Utility functions for YAML analysis");
console.log("   • Real-world configuration scenarios");
console.log("   • Error recovery patterns");
