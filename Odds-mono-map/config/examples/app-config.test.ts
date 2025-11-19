#!/usr/bin/env bun

/**
 * 🧪 Application Configuration Tests
 * 
 * Tests for the enhanced app configuration with database, redis, and features
 * Demonstrates comprehensive YAML testing with Bun
 */

import { test, expect, describe } from "bun:test";
import { readYamlFile, validateYamlFile } from "./bun-yaml-utils";

describe("🚀 Application Configuration Tests", () => {

    test("✅ should load app configuration with all sections", async () => {
        const config = await readYamlFile("./app-config.yaml");

        expect(config).toBeDefined();
        expect(config.database).toBeDefined();
        expect(config.redis).toBeDefined();
        expect(config.features).toBeDefined();
    });

    test("✅ should parse database configuration correctly", async () => {
        const config = await readYamlFile("./app-config.yaml");

        expect(config.database.host).toBe("localhost");
        expect(config.database.port).toBe(5432);
        expect(config.database.name).toBe("myapp");
    });

    test("✅ should parse redis configuration correctly", async () => {
        const config = await readYamlFile("./app-config.yaml");

        expect(config.redis.host).toBe("localhost");
        expect(config.redis.port).toBe(6379);
    });

    test("✅ should parse feature flags correctly", async () => {
        const config = await readYamlFile("./app-config.yaml");

        expect(config.features.auth).toBe(true);
        expect(config.features.rateLimit).toBe(true);
        expect(config.features.analytics).toBe(false);
    });

    test("✅ should validate app configuration syntax", async () => {
        const result = await validateYamlFile("./app-config.yaml");

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    test("✅ should handle configuration changes", async () => {
        // Create a temporary config
        const tempConfig = "./temp-app-config.yaml";
        const testConfig = {
            database: { host: "test-host", port: 3306, name: "testdb" },
            redis: { host: "test-redis", port: 6380 },
            features: { auth: false, rateLimit: false, analytics: true }
        };

        await Bun.write(tempConfig, `
database:
  host: test-host
  port: 3306
  name: testdb

redis:
  host: test-redis
  port: 6380

features:
  auth: false
  rateLimit: false
  analytics: true
`);

        // Load and verify
        const loaded = await readYamlFile(tempConfig);
        expect(loaded.database.host).toBe("test-host");
        expect(loaded.database.port).toBe(3306);
        expect(loaded.features.auth).toBe(false);
        expect(loaded.features.analytics).toBe(true);

        // Cleanup
        await Bun.file(tempConfig).delete();
    });

    test("✅ should handle missing configuration sections gracefully", async () => {
        // Test with minimal configuration
        const minimalConfig = "./minimal-config.yaml";
        await Bun.write(minimalConfig, "database:\n  host: localhost");

        const config = await readYamlFile(minimalConfig);
        expect(config.database.host).toBe("localhost");
        expect(config.redis).toBeUndefined();
        expect(config.features).toBeUndefined();

        // Cleanup
        await Bun.file(minimalConfig).delete();
    });

    test("✅ should validate feature flag types", async () => {
        const config = await readYamlFile("./app-config.yaml");

        expect(typeof config.features.auth).toBe("boolean");
        expect(typeof config.features.rateLimit).toBe("boolean");
        expect(typeof config.features.analytics).toBe("boolean");
    });

    test("✅ should validate port numbers", async () => {
        const config = await readYamlFile("./app-config.yaml");

        expect(config.database.port).toBeGreaterThan(0);
        expect(config.database.port).toBeLessThan(65536);
        expect(config.redis.port).toBeGreaterThan(0);
        expect(config.redis.port).toBeLessThan(65536);
    });

    test("✅ should validate host formats", async () => {
        const config = await readYamlFile("./app-config.yaml");

        expect(config.database.host).toMatch(/^[a-zA-Z0-9.-]+$/);
        expect(config.redis.host).toMatch(/^[a-zA-Z0-9.-]+$/);
    });
});

describe("🔥 Hot Reload Configuration Tests", () => {

    test("✅ should support configuration hot reloading", async () => {
        // Test that configuration can be dynamically imported
        const config1 = await import("./app-config.yaml");
        expect(config1.default).toBeDefined();

        // Import again to test caching
        const config2 = await import("./app-config.yaml");
        expect(config2.default).toEqual(config1.default);
    });

    test("✅ should handle configuration validation during hot reload", async () => {
        const validConfig = await validateYamlFile("./app-config.yaml");
        expect(validConfig.valid).toBe(true);

        // Test with invalid config
        const invalidConfig = "./invalid-config.yaml";
        await Bun.write(invalidConfig, "invalid: yaml: content:");

        const invalid = await validateYamlFile(invalidConfig);
        expect(invalid.valid).toBe(false);
        expect(invalid.error).toBeDefined();

        // Cleanup
        await Bun.file(invalidConfig).delete();
    });
});

describe("📊 Performance Tests", () => {

    test("✅ should load configuration quickly", async () => {
        const startTime = performance.now();
        await readYamlFile("./app-config.yaml");
        const endTime = performance.now();

        // Should load in under 5ms
        expect(endTime - startTime).toBeLessThan(5);
    });

    test("✅ should handle multiple configuration loads efficiently", async () => {
        const startTime = performance.now();

        const configs = await Promise.all([
            readYamlFile("./app-config.yaml"),
            readYamlFile("./app-config.yaml"),
            readYamlFile("./app-config.yaml")
        ]);

        const endTime = performance.now();

        expect(configs).toHaveLength(3);
        expect(endTime - startTime).toBeLessThan(10);

        // All configs should be identical
        expect(configs[0]).toEqual(configs[1]);
        expect(configs[1]).toEqual(configs[2]);
    });
});
