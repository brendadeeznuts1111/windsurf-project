#!/usr/bin/env bun

/**
 * 🧪 Bun Test Runner - YAML Integration Tests
 * 
 * Comprehensive testing using Bun's native test runner
 * Tests YAML parsing, hot reloading, and configuration management
 */

import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { readYamlFile, writeYamlFile, validateYamlFile, measureYamlPerformance } from "./bun-yaml-utils";
import { readFileSync } from "fs";

// Test fixtures
const testConfig = {
    server: { port: 3000, host: "localhost" },
    features: { debug: true, verbose: false },
    database: { type: "postgres", host: "localhost" }
};

const testYamlContent = `
server:
  port: 3000
  host: localhost

features:
  debug: true
  verbose: false

database:
  type: postgres
  host: localhost
`;

describe("🧪 YAML File Operations", () => {

    test("✅ should read YAML file using Bun.file()", async () => {
        const config = await readYamlFile("./config.yaml");

        expect(config).toBeDefined();
        expect(config.server).toBeDefined();
        expect(config.server.port).toBe(3000);
        expect(config.server.host).toBe("localhost");
        expect(config.features).toBeDefined();
        expect(config.features.debug).toBe(true);
    });

    test("✅ should write YAML file using Bun.write()", async () => {
        const testFile = "./test-output.yaml";

        await writeYamlFile(testFile, testConfig);

        // Verify the file was written correctly
        const written = await readYamlFile(testFile);
        expect(written).toEqual(testConfig);

        // Cleanup
        await Bun.file(testFile).delete();
    });

    test("✅ should validate YAML syntax", async () => {
        // Valid YAML
        const validResult = await validateYamlFile("./config.yaml");
        expect(validResult.valid).toBe(true);
        expect(validResult.error).toBeUndefined();

        // Invalid YAML
        const invalidResult = await validateYamlFile("./nonexistent.yaml");
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.error).toBeDefined();
    });

    test("✅ should measure YAML performance", async () => {
        const metrics = await measureYamlPerformance("./config.yaml");

        expect(metrics.path).toBe("./config.yaml");
        expect(metrics.fileSize).toBeGreaterThan(0);
        expect(metrics.readTime).toBeGreaterThanOrEqual(0);
        expect(metrics.parseTime).toBeGreaterThanOrEqual(0);
        expect(metrics.totalTime).toBeGreaterThanOrEqual(0);
        expect(metrics.keyCount).toBeGreaterThan(0);
        expect(metrics.estimatedDepth).toBeGreaterThan(0);
    });

    test("✅ should handle non-existent files gracefully", async () => {
        await expect(readYamlFile("./nonexistent-file.yaml")).rejects.toThrow();
    });
});

describe("🔥 Hot Reloading Tests", () => {

    test("✅ should load server configuration from YAML", async () => {
        const { server, features, routes } = await import("./server-config.yaml");

        expect(server.port).toBe(3000);
        expect(server.host).toBe("localhost");
        expect(features.debug).toBe(true);
        expect(features.verbose).toBe(false);
        expect(routes).toBeDefined();
        expect(Object.keys(routes)).toContain("/config");
    });

    test("✅ should handle configuration changes", async () => {
        // Create a temporary config file
        const tempConfig = "./temp-config.yaml";
        const initialConfig = { test: { value: "initial" } };

        await writeYamlFile(tempConfig, initialConfig);

        // Load and verify
        const loaded = await readYamlFile(tempConfig);
        expect(loaded.test.value).toBe("initial");

        // Update config
        const updatedConfig = { test: { value: "updated" } };
        await writeYamlFile(tempConfig, updatedConfig);

        // Reload and verify
        const reloaded = await readYamlFile(tempConfig);
        expect(reloaded.test.value).toBe("updated");

        // Cleanup
        await Bun.file(tempConfig).delete();
    });
});

describe("📊 YAML Content Tests", () => {

    test("✅ should parse complex nested YAML", async () => {
        const database = await import("./database.yaml");

        expect(database).toBeDefined();
        expect(database.connections).toBeDefined();
        expect(database.connections.primary).toBeDefined();
        expect(database.connections.primary.type).toBe("postgres");
        expect(database.connections.primary.host).toBe("localhost");
        expect(database.connections.primary.pool).toBeDefined();
        expect(database.connections.primary.pool.min).toBe(2);
        expect(database.connections.primary.pool.max).toBe(10);
        expect(database.connections.cache).toBeDefined();
        expect(database.connections.cache.type).toBe("redis");
        expect(database.migrations).toBeDefined();
        expect(database.migrations.autoRun).toBe(false);
    });

    test("✅ should parse feature flags from YAML", async () => {
        const { features } = await import("./features.yaml");

        expect(features).toBeDefined();
        expect(features.newDashboard).toBeDefined();
        expect(features.newDashboard.enabled).toBe(true);
        expect(features.newDashboard.rolloutPercentage).toBe(50);
        expect(features.experimentalAPI).toBeDefined();
        expect(features.experimentalAPI.enabled).toBe(false);
    });

    test("✅ should handle environment-specific configurations", async () => {
        const config = await import("./config.yaml");

        expect(config.defaults).toBeDefined();
        expect(config.development).toBeDefined();
        expect(config.staging).toBeDefined();
        expect(config.production).toBeDefined();

        // Verify YAML anchors are properly resolved
        expect(config.development.timeout).toBe(5000);
        expect(config.staging.timeout).toBe(5000);
        expect(config.production.timeout).toBe(5000);
    });
});

describe("🏎️ Performance Tests", () => {

    test("✅ should load YAML files quickly", async () => {
        const startTime = performance.now();
        await readYamlFile("./config.yaml");
        const endTime = performance.now();

        // Should load in under 10ms
        expect(endTime - startTime).toBeLessThan(10);
    });

    test("✅ should handle batch operations efficiently", async () => {
        const files = ["./config.yaml", "./database.yaml", "./features.yaml"];
        const startTime = performance.now();

        const results = await Promise.all(
            files.map(file => readYamlFile(file))
        );

        const endTime = performance.now();

        expect(results).toHaveLength(3);
        expect(endTime - startTime).toBeLessThan(20);
    });
});

describe("🔍 Error Handling Tests", () => {

    test("✅ should handle malformed YAML gracefully", async () => {
        const malformedFile = "./malformed.yaml";
        const malformedContent = "invalid: yaml: content:";

        await Bun.write(malformedFile, malformedContent);

        const result = await validateYamlFile(malformedFile);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();

        // Cleanup
        await Bun.file(malformedFile).delete();
    });

    test("✅ should handle empty YAML files", async () => {
        const emptyFile = "./empty.yaml";
        await Bun.write(emptyFile, "");

        const result = await validateYamlFile(emptyFile);
        expect(result.valid).toBe(true); // Empty YAML is valid

        // Cleanup
        await Bun.file(emptyFile).delete();
    });
});

describe("📸 Snapshot Tests", () => {

    test("✅ should snapshot configuration", async () => {
        const config = await readYamlFile("./config.yaml");
        expect(config).toMatchSnapshot();
    });

    test("✅ should snapshot database configuration", async () => {
        const database = await readYamlFile("./database.yaml");
        expect(database).toMatchSnapshot();
    });

    test("✅ should snapshot feature flags", async () => {
        const features = await readYamlFile("./features.yaml");
        expect(features).toMatchSnapshot();
    });
});

// Test lifecycle hooks
beforeAll(async () => {
    console.log("🧪 Setting up YAML test environment...");
});

afterAll(async () => {
    console.log("🧹 Cleaning up YAML test environment...");

    // Clean up any test files
    const testFiles = [
        "./test-output.yaml",
        "./temp-config.yaml",
        "./malformed.yaml",
        "./empty.yaml"
    ];

    for (const file of testFiles) {
        try {
            await Bun.file(file).delete();
        } catch {
            // Ignore cleanup errors
        }
    }
});
