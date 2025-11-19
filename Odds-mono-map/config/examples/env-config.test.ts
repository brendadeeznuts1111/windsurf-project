#!/usr/bin/env bun

/**
 * 🧪 Environment-Based Configuration Tests
 * 
 * Comprehensive testing for Bun YAML's environment-based configuration
 * and feature flags management
 */

import { test, expect, describe, beforeAll } from "bun:test";
import configs from "./env-config.yaml";
import featuresConfig from "./features.yaml";
const { features } = featuresConfig;
import { isFeatureEnabled } from "./env-config-demo";

describe("🌍 Environment-Based Configuration Tests", () => {

    beforeAll(() => {
        // Set up test environment variables
        process.env.STAGING_API_KEY = "test_staging_key";
        process.env.PROD_API_KEY = "test_prod_key";
    });

    test("✅ should load development configuration by default", () => {
        // Reset NODE_ENV to avoid test environment interference
        const originalEnv = process.env.NODE_ENV;
        delete process.env.NODE_ENV;

        const env = process.env.NODE_ENV || "development";
        const config = configs[env];

        expect(config.timeout).toBe(5000);
        expect(config.retries).toBe(3);
        expect(config.api.url).toBe("http://localhost:4000");
        expect(config.api.key).toBe("dev_key_12345");
        expect(config.cache.enabled).toBe(true);
        expect(config.cache.ttl).toBe(3600);
        expect(config.logging.level).toBe("debug");
        expect(config.logging.pretty).toBe(true);

        // Restore original NODE_ENV
        if (originalEnv) {
            process.env.NODE_ENV = originalEnv;
        }
    });

    test("✅ should have staging configuration with env vars", () => {
        const config = configs.staging;

        expect(config.timeout).toBe(5000);
        expect(config.retries).toBe(3);
        expect(config.api.url).toBe("https://staging-api.example.com");
        expect(config.api.key).toBe("${STAGING_API_KEY}");
        expect(config.cache.enabled).toBe(true);
        expect(config.cache.ttl).toBe(3600);
        expect(config.logging.level).toBe("info");
        expect(config.logging.pretty).toBe(false);
    });

    test("✅ should have production configuration with env vars", () => {
        const config = configs.production;

        expect(config.timeout).toBe(5000);
        expect(config.retries).toBe(3);
        expect(config.api.url).toBe("https://api.example.com");
        expect(config.api.key).toBe("${PROD_API_KEY}");
        expect(config.cache.enabled).toBe(true);
        expect(config.cache.ttl).toBe(86400);
        expect(config.logging.level).toBe("error");
        expect(config.logging.pretty).toBe(false);
    });

    test("✅ should inherit defaults using merge keys", () => {
        const devConfig = configs.development;
        const stagingConfig = configs.staging;
        const prodConfig = configs.production;

        // All environments should inherit defaults
        expect(devConfig.timeout).toBe(5000);
        expect(stagingConfig.timeout).toBe(5000);
        expect(prodConfig.timeout).toBe(5000);

        expect(devConfig.retries).toBe(3);
        expect(stagingConfig.retries).toBe(3);
        expect(prodConfig.retries).toBe(3);

        expect(devConfig.cache.enabled).toBe(true);
        expect(stagingConfig.cache.enabled).toBe(true);
        expect(prodConfig.cache.enabled).toBe(true);
    });

    test("✅ should interpolate environment variables", () => {
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

        const stagingConfig = configs.staging;
        const interpolated = interpolateEnvVars(stagingConfig);

        expect(interpolated.api.key).toBe("test_staging_key");

        const prodConfig = configs.production;
        const prodInterpolated = interpolateEnvVars(prodConfig);

        expect(prodInterpolated.api.key).toBe("test_prod_key");
    });

    test("✅ should handle missing environment variables gracefully", () => {
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

        // Test with missing environment variable
        delete process.env.MISSING_VAR;
        const testYaml = { key: "${MISSING_VAR}" };
        const result = interpolateEnvVars(testYaml);

        expect(result.key).toBe("");
    });
});

describe("🚩 Feature Flags Tests", () => {

    test("✅ should load feature flags configuration", () => {
        expect(features.newDashboard.enabled).toBe(true);
        expect(features.newDashboard.rolloutPercentage).toBe(50);
        expect(features.newDashboard.allowedUsers).toContain("admin@example.com");

        expect(features.experimentalAPI.enabled).toBe(false);
        expect(features.experimentalAPI.endpoints).toContain("/api/v2/experimental");

        expect(features.darkMode.enabled).toBe(true);
        expect(features.darkMode.default).toBe("auto");
    });

    test("✅ should check feature flag enabled status", () => {
        // Test disabled feature
        expect(isFeatureEnabled("experimentalAPI")).toBe(false);

        // Test enabled features
        expect(isFeatureEnabled("darkMode")).toBe(true);

        // Test newDashboard - should be boolean (rollout percentage based)
        const newDashboardResult = isFeatureEnabled("newDashboard");
        expect(typeof newDashboardResult).toBe("boolean");
    });

    test("✅ should respect allowed users list", () => {
        // Test allowed users - these should always be true for allowed users
        expect(isFeatureEnabled("newDashboard", "admin@example.com")).toBe(true);
        expect(isFeatureEnabled("newDashboard", "beta@example.com")).toBe(true);

        // Test non-allowed users (depends on rollout percentage)
        const result = isFeatureEnabled("newDashboard", "random@example.com");
        expect(typeof result).toBe("boolean"); // Should be either true or false based on hash
    });

    test("✅ should handle rollout percentage correctly", () => {
        // Test with rollout percentage of 0 (should always be false)
        const testFeature = {
            enabled: true,
            rolloutPercentage: 0
        };

        function isFeatureEnabledTest(featureName: string, userEmail?: string): boolean {
            const feature = testFeature;

            if (!feature?.enabled) {
                return false;
            }

            if (feature.rolloutPercentage < 100) {
                function hashCode(str: string): number {
                    let hash = 0;
                    for (let i = 0; i < str.length; i++) {
                        const char = str.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    return Math.abs(hash);
                }

                const hash = hashCode(userEmail || "anonymous");
                if (hash % 100 >= feature.rolloutPercentage) {
                    return false;
                }
            }

            return true;
        }

        // With 0% rollout, should always be false
        expect(isFeatureEnabledTest("test", "any@example.com")).toBe(false);
        expect(isFeatureEnabledTest("test")).toBe(false);
    });

    test("✅ should handle 100% rollout correctly", () => {
        // Test with rollout percentage of 100 (should always be true for enabled features)
        const result = isFeatureEnabled("darkMode", "any@example.com");
        expect(result).toBe(true);
    });
});

describe("🔧 Configuration Validation Tests", () => {

    test("✅ should validate development configuration", () => {
        function validateConfig(config: any, env: string): { valid: boolean; errors: string[] } {
            const errors: string[] = [];

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

        const devConfig = configs.development;
        const validation = validateConfig(devConfig, "development");

        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });

    test("✅ should validate production configuration", () => {
        function validateConfig(config: any, env: string): { valid: boolean; errors: string[] } {
            const errors: string[] = [];

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

        const prodConfig = configs.production;
        const validation = validateConfig(prodConfig, "production");

        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });

    test("✅ should detect invalid configurations", () => {
        function validateConfig(config: any, env: string): { valid: boolean; errors: string[] } {
            const errors: string[] = [];

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

        const invalidConfig = {
            timeout: 500, // Too low
            api: {
                url: "http://localhost:3000" // Localhost in production
            },
            logging: {
                level: "debug" // Debug in production
            }
        };

        const validation = validateConfig(invalidConfig, "production");

        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
        expect(validation.errors).toContain("Timeout must be at least 1000ms");
        expect(validation.errors).toContain("API key is required");
        expect(validation.errors).toContain("Debug logging should not be used in production");
        expect(validation.errors).toContain("Localhost URLs should not be used in production");
    });
});

describe("🚀 Performance Tests", () => {

    test("✅ should load configurations efficiently", () => {
        const startTime = performance.now();

        // Load configuration 1000 times
        for (let i = 0; i < 1000; i++) {
            const config = configs.development;
            expect(config.timeout).toBe(5000);
        }

        const endTime = performance.now();
        const avgTime = (endTime - startTime) / 1000;

        expect(avgTime).toBeLessThan(0.01); // Should be under 0.01ms per access
    });

    test("✅ should interpolate environment variables efficiently", () => {
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

        const config = configs.staging;
        const startTime = performance.now();

        // Interpolate 1000 times
        for (let i = 0; i < 1000; i++) {
            const result = interpolateEnvVars(config);
            expect(result.api.key).toBe("test_staging_key");
        }

        const endTime = performance.now();
        const avgTime = (endTime - startTime) / 1000;

        expect(avgTime).toBeLessThan(0.1); // Should be under 0.1ms per interpolation
    });

    test("✅ should check feature flags efficiently", () => {
        const startTime = performance.now();

        // Check feature flags 1000 times
        for (let i = 0; i < 1000; i++) {
            const result = isFeatureEnabled("darkMode", "test@example.com");
            expect(typeof result).toBe("boolean");
        }

        const endTime = performance.now();
        const avgTime = (endTime - startTime) / 1000;

        expect(avgTime).toBeLessThan(0.01); // Should be under 0.01ms per check
    });
});
