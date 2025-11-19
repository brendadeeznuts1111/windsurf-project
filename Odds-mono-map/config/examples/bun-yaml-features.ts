#!/usr/bin/env bun

/**
 * 🎯 Bun YAML Features Demo
 * 
 * Comprehensive demonstration of Bun 1.3 YAML capabilities
 * including parsing, stringifying, and direct imports
 */

import { YAML } from "bun";

export { }; // Make this file a module

console.log("🎯 Bun YAML Features Demo");
console.log("=========================");

// Example 1: Basic YAML Parsing
console.log("\n📄 Example 1: Basic YAML Parsing");
console.log("----------------------------------");

const yamlString = `
name: John Doe
age: 30
email: john@example.com
hobbies:
  - reading
  - coding
  - hiking
address:
  street: 123 Main St
  city: Anytown
  country: USA
`;

const parsed = YAML.parse(yamlString);
console.log("✅ Parsed YAML object:");
console.log(JSON.stringify(parsed, null, 2));

// Example 2: YAML Stringification
console.log("\n📝 Example 2: YAML Stringification");
console.log("------------------------------------");

const obj = {
    name: "Jane Smith",
    age: 25,
    skills: ["JavaScript", "TypeScript", "Bun"],
    config: {
        theme: "dark",
        notifications: true,
        timeout: 5000
    }
};

const yamlOutput = YAML.stringify(obj);
console.log("✅ Stringified YAML:");
console.log(yamlOutput);

// Example 3: Direct YAML Import
console.log("\n📁 Example 3: Direct YAML Import");
console.log("----------------------------------");

try {
    // Import YAML file directly
    const config = await import("./env-config.yaml");
    console.log("✅ Direct import successful:");
    console.log(`   Environment: development`);
    console.log(`   API URL: ${config.default.development.api.url}`);
    console.log(`   Configuration loaded: ${Object.keys(config.default).length} sections`);
} catch (error) {
    console.log(`❌ Import failed: ${(error as Error).message}`);
}

// Example 4: Advanced YAML Features
console.log("\n🔧 Example 4: Advanced YAML Features");
console.log("--------------------------------------");

const advancedYaml = `
# Configuration with anchors and aliases
defaults: &default_settings
  timeout: 5000
  retries: 3
  logging: true

development:
  <<: *default_settings
  debug: true
  database: dev_db

production:
  <<: *default_settings
  debug: false
  database: prod_db
  ssl: true

# Multi-line strings
description: |
  This is a multi-line
  string that preserves
  formatting and indentation

# Explicit types
numbers:
  - 42
  - 3.14
  - -10
booleans:
  - true
  - false
  - on
  - off
`;

const advancedParsed = YAML.parse(advancedYaml);
console.log("✅ Advanced YAML with anchors:");
console.log(JSON.stringify(advancedParsed, null, 2));

// Example 5: Type-safe YAML Processing
console.log("\n🛡️ Example 5: Type-safe YAML Processing");
console.log("----------------------------------------");

interface AppConfig {
    server: {
        host: string;
        port: number;
        ssl: boolean;
    };
    database: {
        url: string;
        timeout: number;
    };
    features: {
        auth: boolean;
        logging: boolean;
        metrics: boolean;
    };
}

const configYaml = `
server:
  host: localhost
  port: 3000
  ssl: false
database:
  url: postgresql://localhost:5432/myapp
  timeout: 5000
features:
  auth: true
  logging: true
  metrics: false
`;

const config = YAML.parse(configYaml) as AppConfig;
console.log("✅ Type-safe configuration:");
console.log(`   Server: ${config.server.host}:${config.server.port}`);
console.log(`   SSL enabled: ${config.server.ssl}`);
console.log(`   Database timeout: ${config.database.timeout}ms`);

// Example 6: YAML Transformation Pipeline
console.log("\n🔄 Example 6: YAML Transformation Pipeline");
console.log("--------------------------------------------");

function transformYaml(input: string, transformer: (obj: any) => any): string {
    const parsed = YAML.parse(input);
    const transformed = transformer(parsed);
    return YAML.stringify(transformed);
}

const inputYaml = `
users:
  - name: John
    age: 30
    role: user
  - name: Jane
    age: 25
    role: user
  - name: Admin
    age: 35
    role: admin
`;

const transformedYaml = transformYaml(inputYaml, (data) => {
    return {
        userCount: data.users.length,
        averageAge: Math.round(data.users.reduce((sum: number, user: any) => sum + user.age, 0) / data.users.length),
        roles: [...new Set(data.users.map((user: any) => user.role))],
        users: data.users.map((user: any) => ({
            ...user,
            status: user.role === 'admin' ? 'elevated' : 'standard'
        }))
    };
});

console.log("✅ Transformed YAML:");
console.log(transformedYaml);

// Example 7: Performance Comparison
console.log("\n⚡ Example 7: Performance Comparison");
console.log("--------------------------------------");

const largeYaml = `
items:
${Array.from({ length: 100 }, (_, i) => `  - id: ${i + 1}\n    name: Item ${i + 1}\n    value: ${Math.random() * 100}`).join('\n')}
`;

// Benchmark YAML parsing
const iterations = 1000;
const startTime = performance.now();

for (let i = 0; i < iterations; i++) {
    YAML.parse(largeYaml);
}

const endTime = performance.now();
const avgTime = (endTime - startTime) / iterations;

console.log(`📊 Performance metrics (${iterations} iterations):`);
console.log(`   Total time: ${(endTime - startTime).toFixed(2)}ms`);
console.log(`   Average per parse: ${avgTime.toFixed(3)}ms`);
console.log(`   Parses per second: ${Math.round(1000 / avgTime).toLocaleString()}`);

// Example 8: Error Handling with Bun YAML
console.log("\n❌ Example 8: Error Handling");
console.log("----------------------------");

const invalidYamlExamples = [
    "invalid: yaml: content:",
    "unbalanced: [item1, item2",
    "bad: indentation\n  item1\n item2",
    "missing: quote: \"unclosed string"
];

invalidYamlExamples.forEach((yaml, index) => {
    try {
        YAML.parse(yaml);
        console.log(`   ${index + 1}. ✅ Unexpectedly succeeded`);
    } catch (error) {
        console.log(`   ${index + 1}. ❌ ${(error as Error).message}`);
    }
});

// Example 9: YAML Schema Validation
console.log("\n✅ Example 9: YAML Schema Validation");
console.log("-------------------------------------");

function validateYamlSchema(yaml: string, schema: Record<string, (value: any) => boolean>): boolean {
    try {
        const data = YAML.parse(yaml) as any;

        for (const [key, validator] of Object.entries(schema)) {
            if (!(key in data) || !validator(data[key])) {
                console.log(`   ❌ Validation failed for field: ${key}`);
                return false;
            }
        }

        console.log("   ✅ Schema validation passed");
        return true;
    } catch (error) {
        console.log(`   ❌ YAML parsing failed: ${(error as Error).message}`);
        return false;
    }
}

const userSchema = {
    name: (value: any) => typeof value === "string" && value.length > 0,
    age: (value: any) => typeof value === "number" && value >= 0 && value <= 150,
    email: (value: any) => typeof value === "string" && value.includes("@"),
    active: (value: any) => typeof value === "boolean"
};

const validUserYaml = `
name: John Doe
age: 30
email: john@example.com
active: true
`;

const invalidUserYaml = `
name: 
age: -5
email: invalid-email
active: "not a boolean"
`;

console.log("Valid user YAML:");
validateYamlSchema(validUserYaml, userSchema);

console.log("\nInvalid user YAML:");
validateYamlSchema(invalidUserYaml, userSchema);

// Example 10: YAML to JSON Conversion
console.log("\n🔄 Example 10: YAML to JSON Conversion");
console.log("--------------------------------------");

function yamlToJson(yaml: string, prettify: boolean = true): string {
    const parsed = YAML.parse(yaml);
    return JSON.stringify(parsed, null, prettify ? 2 : 0);
}

function jsonToYaml(json: string): string {
    const parsed = JSON.parse(json);
    return YAML.stringify(parsed);
}

const sampleYaml = `
application:
  name: My App
  version: 1.0.0
  environment: production
services:
  - name: api
    port: 3000
    endpoints:
      - /users
      - /posts
  - name: auth
    port: 3001
    endpoints:
      - /login
      - /register
`;

console.log("✅ YAML to JSON:");
const jsonOutput = yamlToJson(sampleYaml);
console.log(jsonOutput);

console.log("\n✅ JSON back to YAML:");
const yamlFromJson = jsonToYaml(jsonOutput);
console.log(yamlFromJson);

console.log("\n✅ Bun YAML Features demonstration complete!");
console.log("💡 Key features demonstrated:");
console.log("   • Native YAML.parse() and YAML.stringify()");
console.log("   • Direct YAML file imports");
console.log("   • Advanced features (anchors, aliases, multi-line)");
console.log("   • Type-safe processing with TypeScript");
console.log("   • Transformation pipelines");
console.log("   • High-performance parsing");
console.log("   • Comprehensive error handling");
console.log("   • Schema validation");
console.log("   • YAML/JSON conversion utilities");
console.log("   • Production-ready patterns");
