#!/usr/bin/env bun

/**
 * 🧪 Bun YAML Features Tests
 * 
 * Comprehensive testing for Bun 1.3 YAML capabilities
 */

import { test, expect, describe } from "bun:test";
import { YAML } from "bun";

describe("🎯 Bun YAML Features Tests", () => {

    describe("📄 Basic YAML Parsing", () => {

        test("✅ should parse simple key-value pairs", () => {
            const yaml = "name: John\nage: 30";
            const result = YAML.parse(yaml) as any;

            expect(result.name).toBe("John");
            expect(result.age).toBe(30);
        });

        test("✅ should parse arrays", () => {
            const yaml = "items:\n  - apple\n  - banana\n  - cherry";
            const result = YAML.parse(yaml) as any;

            expect(Array.isArray(result.items)).toBe(true);
            expect(result.items).toEqual(["apple", "banana", "cherry"]);
        });

        test("✅ should parse nested objects", () => {
            const yaml = `
user:
  name: John
  profile:
    age: 30
    city: New York
`;
            const result = YAML.parse(yaml) as any;

            expect(result.user.name).toBe("John");
            expect(result.user.profile.age).toBe(30);
            expect(result.user.profile.city).toBe("New York");
        });

        test("✅ should parse different data types", () => {
            const yaml = `
string: hello world
number: 42
float: 3.14
boolean_true: true
boolean_false: false
null_value: null
`;
            const result = YAML.parse(yaml) as any;

            expect(typeof result.string).toBe("string");
            expect(typeof result.number).toBe("number");
            expect(typeof result.float).toBe("number");
            expect(typeof result.boolean_true).toBe("boolean");
            expect(typeof result.boolean_false).toBe("boolean");
            expect(result.null_value).toBe(null);
        });
    });

    describe("📝 YAML Stringification", () => {

        test("✅ should stringify simple objects", () => {
            const obj = { name: "John", age: 30 };
            const result = YAML.stringify(obj) as any;

            expect(result).toBe("{name: John,age: 30}");
        });

        test("✅ should stringify arrays", () => {
            const obj = { items: ["apple", "banana"] };
            const result = YAML.stringify(obj) as any;

            expect(result).toBe("{items: [apple,banana]}");
        });

        test("✅ should stringify nested objects", () => {
            const obj = {
                user: {
                    name: "John",
                    profile: { age: 30 }
                }
            };
            const result = YAML.stringify(obj) as any;

            expect(result).toBe("{user: {name: John,profile: {age: 30}}}");
        });

        test("✅ should stringify different data types", () => {
            const obj = {
                string: "hello",
                number: 42,
                boolean: true,
                null_value: null
            };
            const result = YAML.stringify(obj) as any;

            expect(result).toBe("{string: hello,number: 42,boolean: true,null_value: null}");
        });
    });

    describe("🔧 Advanced YAML Features", () => {

        test("✅ should handle anchors and aliases", () => {
            const yaml = `
defaults: &settings
  timeout: 5000
  retries: 3

development:
  <<: *settings
  debug: true

production:
  <<: *settings
  debug: false
  ssl: true
`;
            const result = YAML.parse(yaml) as any;

            expect(result.defaults.timeout).toBe(5000);
            expect(result.development.timeout).toBe(5000);
            expect(result.development.debug).toBe(true);
            expect(result.production.timeout).toBe(5000);
            expect(result.production.debug).toBe(false);
        });

        test("✅ should handle multi-line strings", () => {
            const yaml = `
description: |
  This is a multi-line
  string that preserves
  formatting
`;
            const result = YAML.parse(yaml) as any;

            expect(result.description).toContain("This is a multi-line");
            expect(result.description).toContain("formatting");
        });

        test("✅ should handle multi-document YAML", () => {
            const yaml = `
---
name: Document 1
---
name: Document 2
`;
            const result = YAML.parse(yaml) as any;

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe("Document 1");
            expect(result[1].name).toBe("Document 2");
        });
    });

    describe("❌ Error Handling", () => {

        test("❌ should throw on invalid YAML syntax", () => {
            const invalidYaml = "invalid: yaml: content:";

            expect(() => YAML.parse(invalidYaml)).toThrow("YAML Parse error");
        });

        test("❌ should throw on unbalanced brackets", () => {
            const invalidYaml = "array: [item1, item2";

            expect(() => YAML.parse(invalidYaml)).toThrow("YAML Parse error");
        });

        test("❌ should throw on bad indentation", () => {
            const invalidYaml = "bad:\nitem1\n item2";

            expect(() => YAML.parse(invalidYaml)).toThrow("YAML Parse error");
        });
    });

    describe("🔄 YAML/JSON Conversion", () => {

        test("✅ should convert YAML to JSON", () => {
            const yaml = "name: John\nage: 30";
            const parsed = YAML.parse(yaml) as any;
            const json = JSON.stringify(parsed, null, 2);

            expect(json).toBe('{\n  "name": "John",\n  "age": 30\n}');
        });

        test("✅ should convert JSON to YAML", () => {
            const json = '{"name": "John", "age": 30}';
            const parsed = JSON.parse(json);
            const yaml = YAML.stringify(parsed) as any;

            expect(yaml).toBe("{name: John,age: 30}");
        });

        test("✅ should handle complex nested conversions", () => {
            const yaml = `
users:
  - name: John
    age: 30
    skills:
      - JavaScript
      - TypeScript
  - name: Jane
    age: 25
    skills:
      - Python
      - React
`;

            const parsed = YAML.parse(yaml) as any;
            const json = JSON.stringify(parsed, null, 2);
            const reparsed = JSON.parse(json);
            const newYaml = YAML.stringify(reparsed) as any;

            expect(parsed.users).toHaveLength(2);
            expect(parsed.users[0].name).toBe("John");
            expect(parsed.users[0].skills).toEqual(["JavaScript", "TypeScript"]);
            expect(newYaml).toContain("John");
            expect(newYaml).toContain("JavaScript");
        });
    });

    describe("⚡ Performance", () => {

        test("✅ should handle large YAML documents efficiently", () => {
            const largeYaml = `
items:
${Array.from({ length: 1000 }, (_, i) => `  - id: ${i + 1}\n    name: Item ${i + 1}\n    value: ${Math.random() * 100}`).join('\n')}
`;

            const startTime = performance.now();
            const result = YAML.parse(largeYaml) as any;
            const endTime = performance.now();

            expect(result.items).toHaveLength(1000);
            expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
        });

        test("✅ should handle repeated parsing efficiently", () => {
            const yaml = "name: Test\nvalue: 42";
            const iterations = 1000;

            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                YAML.parse(yaml);
            }

            const endTime = performance.now();
            const avgTime = (endTime - startTime) / iterations;

            expect(avgTime).toBeLessThan(0.01); // Average should be very fast
        });
    });

    describe("🛡️ Type Safety", () => {

        test("✅ should maintain type information with TypeScript", () => {
            interface User {
                name: string;
                age: number;
                active: boolean;
            }

            const yaml = "name: John\nage: 30\nactive: true";
            const user = YAML.parse(yaml) as User;

            expect(typeof user.name).toBe("string");
            expect(typeof user.age).toBe("number");
            expect(typeof user.active).toBe("boolean");
        });

        test("✅ should handle complex type structures", () => {
            interface Config {
                server: {
                    host: string;
                    port: number;
                    ssl: boolean;
                };
                database: {
                    url: string;
                    timeout: number;
                };
            }

            const yaml = `
server:
  host: localhost
  port: 3000
  ssl: false
database:
  url: postgresql://localhost:5432/myapp
  timeout: 5000
`;

            const config = YAML.parse(yaml) as Config;

            expect(config.server.host).toBe("localhost");
            expect(config.server.port).toBe(3000);
            expect(config.server.ssl).toBe(false);
            expect(config.database.url).toContain("postgresql");
            expect(config.database.timeout).toBe(5000);
        });
    });

    describe("🔍 Edge Cases", () => {

        test("✅ should handle empty documents", () => {
            const result = YAML.parse("");
            expect(result).toBe(null);
        });

        test("✅ should handle documents with only comments", () => {
            const yaml = "# This is just a comment\n# Another comment";
            const result = YAML.parse(yaml) as any;
            expect(result).toBe(null);
        });

        test("✅ should handle special characters", () => {
            const yaml = `
unicode: "Hello \u4E16\u754C"
special: 'Special chars: !@#$%^&*()'
quotes: 'Single '' and double "" quotes'
`;
            const result = YAML.parse(yaml) as any;

            expect(result.unicode).toBe("Hello 世界");
            expect(result.special).toBe("Special chars: !@#$%^&*()");
            expect(result.quotes).toBe("Single ' and double \"\" quotes");
        });

        test("✅ should handle very long strings", () => {
            const longString = "a".repeat(10000);
            const yaml = `long: "${longString}"`;
            const result = YAML.parse(yaml) as any;

            expect(result.long).toBe(longString);
            expect(result.long.length).toBe(10000);
        });
    });

    describe("📁 Direct File Import", () => {

        test("✅ should import YAML files directly", async () => {
            const config = await import("./env-config.yaml");

            expect(config.default).toBeDefined();
            expect(typeof config.default).toBe("object");
        });

        test("✅ should handle imported YAML structure", async () => {
            const config = await import("./env-config.yaml");

            expect(config.default.development).toBeDefined();
            expect(config.default.development.api).toBeDefined();
            expect(typeof config.default.development.api.url).toBe("string");
        });
    });
});
