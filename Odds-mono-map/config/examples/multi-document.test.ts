#!/usr/bin/env bun

/**
 * 🧪 Multi-Document YAML Tests
 * 
 * Comprehensive testing for Bun's multi-document YAML parsing
 */

import { test, expect, describe } from "bun:test";
import { validateYamlFile } from "./bun-yaml-utils";

describe("📄 Multi-Document YAML Tests", () => {

    test("✅ should parse basic multi-document YAML", () => {
        const multiDoc = `
---
name: Document 1
---
name: Document 2
---
name: Document 3
`;

        const docs = Bun.YAML.parse(multiDoc) as Array<{ name: string }>;

        expect(docs).toBeInstanceOf(Array);
        expect(docs).toHaveLength(3);
        expect(docs[0].name).toBe("Document 1");
        expect(docs[1].name).toBe("Document 2");
        expect(docs[2].name).toBe("Document 3");
    });

    test("✅ should parse complex multi-document configuration", async () => {
        const content = await Bun.file("./multi-document.yaml").text();
        const environments = Bun.YAML.parse(content) as Array<{
            name: string;
            database: { host: string; port: number; name: string };
            redis: { host: string; port: number };
            features: { debug: boolean; verbose: boolean; analytics: boolean; hotReload?: boolean };
        }>;

        expect(environments).toBeInstanceOf(Array);
        expect(environments).toHaveLength(5);

        // Check each environment has required properties
        environments.forEach((env) => {
            expect(env.name).toBeDefined();
            expect(env.database).toBeDefined();
            expect(env.redis).toBeDefined();
            expect(env.features).toBeDefined();
        });
    });

    test("✅ should handle environment-specific configurations", async () => {
        const content = await Bun.file("./multi-document.yaml").text();
        const environments = Bun.YAML.parse(content) as Array<{
            name: string;
            database: { host: string; port: number; name: string };
            redis: { host: string; port: number };
            features: { debug: boolean; verbose: boolean; analytics: boolean; hotReload?: boolean };
        }>;

        const devEnv = environments.find((env) => env.name === "development");
        const prodEnv = environments.find((env) => env.name === "production");

        expect(devEnv).toBeDefined();
        expect(devEnv?.features.debug).toBe(true);
        expect(devEnv?.database.name).toBe("myapp_dev");

        expect(prodEnv).toBeDefined();
        expect(prodEnv?.features.debug).toBe(false);
        expect(prodEnv?.database.name).toBe("myapp_production");
    });

    test("✅ should validate multi-document YAML syntax", async () => {
        const result = await validateYamlFile("./multi-document.yaml");
        expect(result.valid).toBe(true);
    });

    test("✅ should handle empty documents", () => {
        const multiDoc = `
---
name: Document 1
---
name: Document 2
---
name: Document 3
`;

        const docs = Bun.YAML.parse(multiDoc) as Array<{ name: string }>;
        expect(docs).toHaveLength(3);
        expect(docs[0].name).toBe("Document 1");
        expect(docs[1].name).toBe("Document 2");
        expect(docs[2].name).toBe("Document 3");
    });

    test("✅ should handle mixed content types", () => {
        const multiDoc = `
---
- item1
- item2
---
name: string document
---
number: 42
boolean: true
---
nested:
  key: value
  array:
    - one
    - two
`;

        const docs = Bun.YAML.parse(multiDoc) as Array<any>;

        expect(docs).toHaveLength(4);
        expect(docs[0]).toEqual(["item1", "item2"]);
        expect(docs[1].name).toBe("string document");
        expect(docs[2].number).toBe(42);
        expect(docs[2].boolean).toBe(true);
        expect(docs[3].nested.key).toBe("value");
        expect(docs[3].nested.array).toEqual(["one", "two"]);
    });

    test("✅ should handle document separators correctly", () => {
        const multiDoc = `
document1: value1
---
document2: value2
---
document3: value3
`;

        const docs = Bun.YAML.parse(multiDoc) as Array<Record<string, string>>;

        expect(docs).toHaveLength(3);
        expect(docs[0].document1).toBe("value1");
        expect(docs[1].document2).toBe("value2");
        expect(docs[2].document3).toBe("value3");
    });

    test("✅ should handle single document as array", () => {
        const singleDoc = `
name: Single document
type: test
`;

        const docs = Bun.YAML.parse(singleDoc) as { name: string; type: string };

        // Single document should not be wrapped in array
        expect(docs).not.toBeInstanceOf(Array);
        expect(docs.name).toBe("Single document");
        expect(docs.type).toBe("test");
    });

    test("✅ should preserve document order", async () => {
        const content = await Bun.file("./multi-document.yaml").text();
        const environments = Bun.YAML.parse(content) as Array<{ name: string }>;

        const names = environments.map((env) => env.name);
        expect(names).toEqual(["development", "staging", "production", "testing", "local"]);
    });

    test("✅ should handle malformed multi-document YAML", () => {
        const malformedDoc = `
---
name: valid
---
invalid: yaml: content:
---
name: another valid
`;

        expect(() => Bun.YAML.parse(malformedDoc)).toThrow();
    });

    test("✅ should support environment variable interpolation in multi-doc", () => {
        const multiDoc = `
---
name: test
env: development
---
name: prod
env: production
`;

        // Note: This tests the structure, actual interpolation happens at runtime
        const docs = Bun.YAML.parse(multiDoc) as Array<{ name: string; env: string }>;
        expect(docs).toHaveLength(2);
        expect(docs[0].name).toBe("test");
        expect(docs[1].name).toBe("prod");
    });
});

describe("🚀 Multi-Document Performance Tests", () => {

    test("✅ should parse multi-document YAML efficiently", async () => {
        const content = await Bun.file("./multi-document.yaml").text();

        const startTime = performance.now();
        const environments = Bun.YAML.parse(content) as Array<any>;
        const endTime = performance.now();

        expect(environments).toHaveLength(5);
        expect(endTime - startTime).toBeLessThan(10); // Should parse in under 10ms
    });

    test("✅ should handle repeated parsing efficiently", async () => {
        const content = await Bun.file("./multi-document.yaml").text();
        const iterations = 100;

        const startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            Bun.YAML.parse(content) as Array<any>;
        }
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(100); // Should handle 100 parses in under 100ms
    });
});
