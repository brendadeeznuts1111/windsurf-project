#!/usr/bin/env bun

/**
 * 🧪 YAML Utilities Tests
 * 
 * Comprehensive testing for the YAML utilities library
 * covering all error handling patterns and validation rules
 */

import { test, expect, describe } from "bun:test";
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
    type ParseResult
} from "./yaml-utils";

describe("🛠️ YAML Utilities Tests", () => {

    describe("📄 Basic Safe Parsing", () => {

        test("✅ should parse valid YAML successfully", () => {
            const yaml = `
name: John Doe
age: 30
email: john@example.com
`;

            const result = parseYamlSafely(yaml, "test-config");

            expect(result.success).toBe(true);
            expect(result.data.name).toBe("John Doe");
            expect(result.data.age).toBe(30);
            expect(result.source).toBe("test-config");
            expect(result.timestamp).toBeDefined();
        });

        test("❌ should handle invalid YAML with proper error", () => {
            const invalidYaml = "invalid: yaml: content:";

            const result = parseYamlSafely(invalidYaml, "broken-config");

            expect(result.success).toBe(false);
            expect(result.error).toContain("YAML Parse error");
            expect(result.type).toBe("SyntaxError");
            expect(result.source).toBe("broken-config");
            expect(result.timestamp).toBeDefined();
        });

        test("✅ should handle empty documents", () => {
            const emptyYaml = "";

            const result = parseYamlSafely(emptyYaml, "empty-config");

            expect(result.success).toBe(true);
            expect(result.data).toBe(null);
        });
    });

    describe("📁 File Operations", () => {

        test("✅ should parse existing YAML file", async () => {
            const result = await parseYamlFile("./env-config.yaml");

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.source).toBe("./env-config.yaml");
            expect(result.data.development).toBeDefined();
        });

        test("❌ should handle non-existent file", async () => {
            const result = await parseYamlFile("./non-existent.yaml");

            expect(result.success).toBe(false);
            expect(result.error).toContain("File not found");
            expect(result.type).toBe("FileError");
        });
    });

    describe("✅ Validation with Rules", () => {

        interface TestConfig {
            timeout: number;
            retries: number;
            api: {
                url: string;
                key: string;
            };
        }

        test("✅ should validate configuration with all rules passing", () => {
            const yaml = `
timeout: 5000
retries: 3
api:
  url: https://api.example.com
  key: secret_key
`;

            const rules = [
                commonValidationRules.requiredNumber("timeout", 1000),
                commonValidationRules.requiredNumber("retries", 1),
                commonValidationRules.requiredObject("api"),
                commonValidationRules.url("api.url"),
                commonValidationRules.requiredString("api.key")
            ];

            const result = parseYamlWithValidation<TestConfig>(yaml, rules, "valid-config");

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            if (result.data) {
                expect(result.data.timeout).toBe(5000);
                expect(result.data.api.url).toBe("https://api.example.com");
            }
        });

        test("❌ should fail validation on missing required field", () => {
            const yaml = `
timeout: 5000
api:
  url: https://api.example.com
`;

            const rules = [
                commonValidationRules.requiredNumber("timeout", 1000),
                commonValidationRules.requiredNumber("retries", 1), // Missing retries
                commonValidationRules.requiredObject("api")
            ];

            const result = parseYamlWithValidation(yaml, rules, "incomplete-config");

            expect(result.success).toBe(false);
            expect(result.error).toContain("Required number: retries");
            expect(result.type).toBe("ValidationError");
        });

        test("❌ should fail validation on invalid URL", () => {
            const yaml = `
timeout: 5000
retries: 3
api:
  url: not-a-valid-url
  key: secret_key
`;

            const rules = [
                commonValidationRules.requiredNumber("timeout", 1000),
                commonValidationRules.url("api.url")
            ];

            const result = parseYamlWithValidation(yaml, rules, "invalid-url-config");

            expect(result.success).toBe(false);
            expect(result.error).toContain("Valid URL: api.url");
            expect(result.type).toBe("ValidationError");
        });

        test("❌ should fail validation on number below minimum", () => {
            const yaml = `
timeout: 500
retries: 3
`;

            const rules = [
                commonValidationRules.requiredNumber("timeout", 1000) // Minimum 1000
            ];

            const result = parseYamlWithValidation(yaml, rules, "low-timeout-config");

            expect(result.success).toBe(false);
            expect(result.error).toContain("Required number: timeout");
            expect(result.type).toBe("ValidationError");
        });
    });

    describe("🔄 Graceful Fallback", () => {

        test("✅ should use parsed data when validation passes", () => {
            const yaml = `
timeout: 5000
retries: 3
`;

            const fallback = { timeout: 3000, retries: 2 };
            const rules = [
                commonValidationRules.requiredNumber("timeout", 1000),
                commonValidationRules.requiredNumber("retries", 1)
            ];

            const result = parseYamlWithFallback(yaml, fallback, rules, "good-config");

            expect(result.timeout).toBe(5000); // Uses parsed data
            expect(result.retries).toBe(3);
        });

        test("✅ should use fallback when validation fails", () => {
            const yaml = `
timeout: 500
retries: 0
`;

            const fallback = { timeout: 3000, retries: 2 };
            const rules = [
                commonValidationRules.requiredNumber("timeout", 1000),
                commonValidationRules.requiredNumber("retries", 1)
            ];

            const result = parseYamlWithFallback(yaml, fallback, rules, "bad-config");

            expect(result.timeout).toBe(3000); // Uses fallback
            expect(result.retries).toBe(2);
        });
    });

    describe("📦 Batch Processing", () => {

        test("✅ should process mixed valid and invalid YAML", () => {
            const yamlContents = [
                { content: "name: Alice\nage: 25", source: "user1.yaml" },
                { content: "name: Bob\nage: 30", source: "user2.yaml" },
                { content: "invalid: yaml: content", source: "broken.yaml" },
                { content: "name: Charlie\nage: 35", source: "user3.yaml" }
            ];

            const result = parseYamlBatch(yamlContents);

            expect(result.total).toBe(4);
            expect(result.successful).toBe(3);
            expect(result.failed).toBe(1);
            expect(result.results).toHaveLength(4);
            expect(result.summary.errors).toHaveLength(1);
            expect(result.summary.sources).toEqual(["user1.yaml", "user2.yaml", "broken.yaml", "user3.yaml"]);

            // Check individual results
            expect(result.results[0].success).toBe(true);
            expect(result.results[0].data.name).toBe("Alice");

            expect(result.results[2].success).toBe(false);
            expect(result.results[2].error).toContain("YAML Parse error");
        });

        test("✅ should apply validation rules to batch processing", () => {
            const yamlContents = [
                { content: "name: Alice\nage: 25", source: "user1.yaml" },
                { content: "name: Bob\nage: -5", source: "user2.yaml" }, // Invalid age
                { content: "name: Charlie", source: "user3.yaml" } // Missing age
            ];

            const rules = [
                commonValidationRules.requiredString("name"),
                commonValidationRules.requiredNumber("age", 0)
            ];

            const result = parseYamlBatch(yamlContents, rules);

            expect(result.total).toBe(3);
            expect(result.successful).toBe(1); // Only Alice passes validation
            expect(result.failed).toBe(2);
        });
    });

    describe("📝 Logging", () => {

        test("✅ should log successful parsing", () => {
            const yaml = "name: John";

            // Mock console.log to capture output
            const originalLog = console.log;
            const logs: string[] = [];
            console.log = (...args) => logs.push(args.join(" "));

            const result = parseYamlWithLogging(yaml, "test-config", "debug");

            // Restore console.log
            console.log = originalLog;

            expect(result.success).toBe(true);
            expect(logs.some(log => log.includes("Successfully parsed YAML"))).toBe(true);
        });

        test("❌ should log parsing errors", () => {
            const invalidYaml = "invalid: yaml: content";

            // Mock console.error to capture output
            const originalError = console.error;
            const errors: string[] = [];
            console.error = (...args) => errors.push(args.join(" "));

            const result = parseYamlWithLogging(invalidYaml, "test-config", "error");

            // Restore console.error
            console.error = originalError;

            expect(result.success).toBe(false);
            expect(errors.some(log => log.includes("Failed to parse YAML"))).toBe(true);
        });
    });

    describe("🔧 Utility Functions", () => {

        test("✅ should detect empty YAML", () => {
            expect(yamlUtils.isEmpty("")).toBe(true);
            expect(yamlUtils.isEmpty("   ")).toBe(true);
            expect(yamlUtils.isEmpty("# Just a comment")).toBe(true);
            expect(yamlUtils.isEmpty("name: John")).toBe(false);
        });

        test("✅ should detect multi-document YAML", () => {
            expect(yamlUtils.isMultiDocument("name: John")).toBe(false);
            expect(yamlUtils.isMultiDocument("---\nname: Doc1\n---\nname: Doc2")).toBe(true);
        });

        test("✅ should count documents", () => {
            expect(yamlUtils.countDocuments("name: John")).toBe(1);
            expect(yamlUtils.countDocuments("---\nname: Doc1\n---\nname: Doc2")).toBe(2);
            expect(yamlUtils.countDocuments("---\nname: Doc1\n---\nname: Doc2\n---\nname: Doc3")).toBe(3);
        });

        test("✅ should extract comments", () => {
            const yaml = `
# User configuration
name: John Doe
age: 30
# End of config
`;

            const comments = yamlUtils.extractComments(yaml);
            expect(comments).toEqual(["User configuration", "End of config"]);
        });
    });

    describe("⚡ Performance", () => {

        test("✅ should benchmark parsing performance", async () => {
            const yaml = "name: John\nage: 30\nemail: john@example.com";

            const result = await benchmarkYamlParsing(yaml, 100);

            expect(result.totalTime).toBeGreaterThan(0);
            expect(result.avgTime).toBeGreaterThan(0);
            expect(result.parsesPerSecond).toBeGreaterThan(0);
            expect(result.totalTime).toBeLessThan(100); // Should complete quickly
        });

        test("✅ should handle large number of iterations", async () => {
            const yaml = "name: John\nage: 30";

            const result = await benchmarkYamlParsing(yaml, 1000);

            expect(result.totalTime).toBeLessThan(50); // Should handle 1000 parses quickly
            expect(result.avgTime).toBeLessThan(0.01); // Average should be very small
        });
    });

    describe("🎯 Validation Rules", () => {

        test("✅ should validate required strings", () => {
            const rule = commonValidationRules.requiredString("name");

            expect(rule.validate({ name: "John" })).toBe(true);
            expect(rule.validate({ name: "" })).toBe(false);
            expect(rule.validate({ name: "   " })).toBe(false);
            expect(rule.validate({})).toBe(false);
            expect(rule.validate({ name: 123 })).toBe(false);
        });

        test("✅ should validate required numbers", () => {
            const rule = commonValidationRules.requiredNumber("age", 18);

            expect(rule.validate({ age: 25 })).toBe(true);
            expect(rule.validate({ age: 18 })).toBe(true);
            expect(rule.validate({ age: 17 })).toBe(false); // Below minimum
            expect(rule.validate({ age: "25" })).toBe(false); // Not a number
            expect(rule.validate({})).toBe(false);
        });

        test("✅ should validate required booleans", () => {
            const rule = commonValidationRules.requiredBoolean("active");

            expect(rule.validate({ active: true })).toBe(true);
            expect(rule.validate({ active: false })).toBe(true);
            expect(rule.validate({ active: "true" })).toBe(false);
            expect(rule.validate({})).toBe(false);
        });

        test("✅ should validate required arrays", () => {
            const rule = commonValidationRules.requiredArray("items");

            expect(rule.validate({ items: [1, 2, 3] })).toBe(true);
            expect(rule.validate({ items: [] })).toBe(true);
            expect(rule.validate({ items: "not an array" })).toBe(false);
            expect(rule.validate({})).toBe(false);
        });

        test("✅ should validate required objects", () => {
            const rule = commonValidationRules.requiredObject("config");

            expect(rule.validate({ config: { key: "value" } })).toBe(true);
            expect(rule.validate({ config: {} })).toBe(true);
            expect(rule.validate({ config: null })).toBe(false);
            expect(rule.validate({ config: [] })).toBe(false); // Arrays are not objects
            expect(rule.validate({ config: "not an object" })).toBe(false);
            expect(rule.validate({})).toBe(false);
        });

        test("✅ should validate URLs", () => {
            const rule = commonValidationRules.url("url");

            expect(rule.validate({ url: "https://example.com" })).toBe(true);
            expect(rule.validate({ url: "http://localhost:3000" })).toBe(true);
            expect(rule.validate({ url: "ftp://example.com" })).toBe(false); // Not HTTP/HTTPS
            expect(rule.validate({ url: "not-a-url" })).toBe(false);
            expect(rule.validate({ url: 123 })).toBe(false);
            expect(rule.validate({})).toBe(false);
        });

        test("✅ should validate emails", () => {
            const rule = commonValidationRules.email("email");

            expect(rule.validate({ email: "user@example.com" })).toBe(true);
            expect(rule.validate({ email: "test.email+tag@domain.co.uk" })).toBe(true);
            expect(rule.validate({ email: "invalid-email" })).toBe(false);
            expect(rule.validate({ email: "user@" })).toBe(false);
            expect(rule.validate({ email: "@domain.com" })).toBe(false);
            expect(rule.validate({ email: 123 })).toBe(false);
            expect(rule.validate({})).toBe(false);
        });
    });

    describe("🔗 Nested Field Access", () => {

        test("✅ should validate nested fields", () => {
            const data = {
                user: {
                    profile: {
                        name: "John",
                        age: 30
                    },
                    settings: {
                        theme: "dark",
                        notifications: true
                    }
                }
            };

            const nameRule = commonValidationRules.requiredString("user.profile.name");
            const ageRule = commonValidationRules.requiredNumber("user.profile.age", 18);
            const themeRule = commonValidationRules.requiredString("user.settings.theme");
            const notificationsRule = commonValidationRules.requiredBoolean("user.settings.notifications");

            expect(nameRule.validate(data)).toBe(true);
            expect(ageRule.validate(data)).toBe(true);
            expect(themeRule.validate(data)).toBe(true);
            expect(notificationsRule.validate(data)).toBe(true);
        });

        test("❌ should handle missing nested fields", () => {
            const data = {
                user: {
                    profile: {
                        name: "John"
                        // age is missing
                    }
                }
            };

            const ageRule = commonValidationRules.requiredNumber("user.profile.age", 18);
            expect(ageRule.validate(data)).toBe(false);

            const missingRule = commonValidationRules.requiredString("user.settings.theme");
            expect(missingRule.validate(data)).toBe(false);
        });
    });
});
