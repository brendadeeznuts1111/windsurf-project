#!/usr/bin/env bun

/**
 * 🧪 YAML Error Handling Tests
 * 
 * Comprehensive testing for Bun's YAML error handling capabilities
 * based on official Bun documentation
 */

import { test, expect, describe } from "bun:test";

describe("🛡️ YAML Error Handling Tests", () => {

    test("✅ should throw SyntaxError for invalid YAML syntax", () => {
        const invalidYaml = "invalid: yaml: content:";

        expect(() => Bun.YAML.parse(invalidYaml)).toThrow(SyntaxError);
        expect(() => Bun.YAML.parse(invalidYaml)).toThrow("YAML Parse error: Unexpected token");
    });

    test("✅ should throw SyntaxError for unbalanced brackets", () => {
        const invalidYaml = "unbalanced: [1, 2, 3";

        expect(() => Bun.YAML.parse(invalidYaml)).toThrow(SyntaxError);
        expect(() => Bun.YAML.parse(invalidYaml)).toThrow("YAML Parse error: Unexpected token");
    });

    test("✅ should throw SyntaxError for unbalanced braces", () => {
        const invalidYaml = "unbalanced: {key: value";

        expect(() => Bun.YAML.parse(invalidYaml)).toThrow(SyntaxError);
        expect(() => Bun.YAML.parse(invalidYaml)).toThrow("YAML Parse error: Unexpected token");
    });

    test("✅ should throw SyntaxError for missing quotes", () => {
        const invalidYaml = 'missing: "unclosed string';

        expect(() => Bun.YAML.parse(invalidYaml)).toThrow(SyntaxError);
        expect(() => Bun.YAML.parse(invalidYaml)).toThrow("YAML Parse error: Unexpected EOF");
    });

    test("✅ should throw SyntaxError for bad indentation", () => {
        const invalidYaml = "bad_indent:\nitem1\n item2";

        expect(() => Bun.YAML.parse(invalidYaml)).toThrow(SyntaxError);
        expect(() => Bun.YAML.parse(invalidYaml)).toThrow("YAML Parse error: Unexpected token");
    });

    test("✅ should handle incomplete documents gracefully", () => {
        const incompleteYaml = "incomplete: ";

        expect(() => Bun.YAML.parse(incompleteYaml)).not.toThrow();
        const result = Bun.YAML.parse(incompleteYaml) as { incomplete: any };
        expect(result.incomplete).toBe(null);
    });

    test("✅ should handle error types correctly", () => {
        const invalidYaml = "invalid: yaml: content:";

        try {
            Bun.YAML.parse(invalidYaml);
            expect(true).toBe(false); // Force test to fail if no error thrown
        } catch (error) {
            expect(error).toBeInstanceOf(SyntaxError);
            expect((error as Error).constructor.name).toBe("SyntaxError");
            expect(typeof (error as Error).message).toBe("string");
            expect((error as Error).message).toContain("YAML Parse error");
        }
    });

    test("✅ should parse valid YAML without errors", () => {
        const validYaml = `
name: John Doe
age: 30
email: john@example.com
hobbies:
  - reading
  - coding
  - hiking
`;

        expect(() => {
            const data = Bun.YAML.parse(validYaml) as { name: string; age: number; hobbies: string[] };
            expect(data.name).toBe("John Doe");
            expect(data.age).toBe(30);
            expect(data.hobbies).toEqual(["reading", "coding", "hiking"]);
        }).not.toThrow();
    });

    test("✅ should handle empty documents", () => {
        const emptyYaml = "";

        expect(() => Bun.YAML.parse(emptyYaml)).not.toThrow();
        const result = Bun.YAML.parse(emptyYaml);
        expect(result).toBe(null);
    });

    test("✅ should handle documents with only comments", () => {
        const commentOnlyYaml = `
# Just a comment
# Another comment
`;

        expect(() => Bun.YAML.parse(commentOnlyYaml)).not.toThrow();
        const result = Bun.YAML.parse(commentOnlyYaml);
        expect(result).toBe(null);
    });

    test("✅ should handle multi-document YAML correctly", () => {
        const multiDocYaml = `
---
name: Document 1
---
name: Document 2
---
name: Document 3
`;

        expect(() => {
            const docs = Bun.YAML.parse(multiDocYaml) as { name: string }[];
            expect(Array.isArray(docs)).toBe(true);
            expect(docs).toHaveLength(3);
            expect(docs[0].name).toBe("Document 1");
            expect(docs[1].name).toBe("Document 2");
            expect(docs[2].name).toBe("Document 3");
        }).not.toThrow();
    });

    test("✅ should handle multi-document YAML with errors", () => {
        const invalidMultiDoc = `
---
name: Document 1
---
invalid: yaml: content
---
name: Document 3
`;

        expect(() => Bun.YAML.parse(invalidMultiDoc)).toThrow(SyntaxError);
    });
});

describe("🔄 Error Recovery and Fallback Tests", () => {

    test("✅ should implement graceful fallback", () => {
        const defaultConfig = {
            timeout: 3000,
            retries: 2,
            api: { url: "http://localhost:3000", key: "default" }
        };

        function parseWithFallback(yamlContent: string, fallback: any): any {
            try {
                return Bun.YAML.parse(yamlContent);
            } catch (error) {
                return fallback;
            }
        }

        const validYaml = "timeout: 5000\nretries: 3";
        const invalidYaml = "invalid: yaml: content";

        const validResult = parseWithFallback(validYaml, defaultConfig);
        expect(validResult.timeout).toBe(5000);

        const invalidResult = parseWithFallback(invalidYaml, defaultConfig);
        expect(invalidResult).toBe(defaultConfig);
    });

    test("✅ should validate after successful parsing", () => {
        interface Config {
            timeout: number;
            retries: number;
        }

        function validateAndParse(yamlContent: string): Config {
            try {
                const data = Bun.YAML.parse(yamlContent) as Config;

                if (!data.timeout || data.timeout < 1000) {
                    throw new Error("Timeout must be at least 1000ms");
                }

                return data;
            } catch (error: any) {
                if (error instanceof SyntaxError) {
                    throw new Error(`YAML parsing failed: ${error.message}`);
                }
                throw error;
            }
        }

        const validYaml = "timeout: 5000\nretries: 3";
        const invalidTimeoutYaml = "timeout: 500\nretries: 3";
        const invalidYaml = "invalid: yaml: content";

        expect(() => validateAndParse(validYaml)).not.toThrow();

        expect(() => validateAndParse(invalidTimeoutYaml))
            .toThrow("Timeout must be at least 1000ms");

        expect(() => validateAndParse(invalidYaml))
            .toThrow("YAML parsing failed: YAML Parse error: Unexpected token");
    });
});

describe("📦 Batch Processing Tests", () => {

    test("✅ should handle batch parsing with mixed results", () => {
        interface BatchResult {
            success: boolean;
            data?: any;
            error?: string;
            index: number;
        }

        function parseBatch(yamlContents: string[]): BatchResult[] {
            return yamlContents.map((content, index) => {
                try {
                    const data = Bun.YAML.parse(content);
                    return {
                        success: true,
                        data,
                        index
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        index
                    };
                }
            });
        }

        const batchYaml = [
            "name: John\nage: 30",
            "invalid: yaml: content",
            "timeout: 5000",
            "unbalanced: [1, 2, 3"
        ];

        const results = parseBatch(batchYaml);

        expect(results).toHaveLength(4);
        expect(results[0].success).toBe(true);
        expect(results[0].data.name).toBe("John");

        expect(results[1].success).toBe(false);
        expect(results[1].error).toContain("YAML Parse error");

        expect(results[2].success).toBe(true);
        expect(results[2].data.timeout).toBe(5000);

        expect(results[3].success).toBe(false);
        expect(results[3].error).toContain("YAML Parse error");
    });
});

describe("📝 Error Logging Tests", () => {

    test("✅ should log errors with proper information", () => {
        const logs: string[] = [];

        function parseWithLogging(yamlContent: string, source: string): any {
            try {
                const data = Bun.YAML.parse(yamlContent);
                logs.push(`✅ Successfully parsed YAML from ${source}`);
                return data;
            } catch (error) {
                logs.push(`❌ Failed to parse YAML from ${source}: ${(error as Error).message}`);
                throw error;
            }
        }

        const validYaml = "name: John";
        const invalidYaml = "invalid: yaml: content";

        expect(() => parseWithLogging(validYaml, "valid.yaml")).not.toThrow();
        expect(logs).toContain("✅ Successfully parsed YAML from valid.yaml");

        expect(() => parseWithLogging(invalidYaml, "invalid.yaml")).toThrow();
        expect(logs).toContain("❌ Failed to parse YAML from invalid.yaml: YAML Parse error: Unexpected token");
    });
});

describe("⚡ Performance Tests", () => {

    test("✅ should handle errors efficiently", () => {
        const validYaml = "name: John\nage: 30";
        const invalidYaml = "invalid: yaml: content";

        const iterations = 1000;
        let successCount = 0;
        let errorCount = 0;

        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            try {
                Bun.YAML.parse(i % 2 === 0 ? validYaml : invalidYaml);
                successCount++;
            } catch (error) {
                errorCount++;
            }
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / iterations;

        expect(successCount).toBe(500);
        expect(errorCount).toBe(500);
        expect(avgTime).toBeLessThan(0.01); // Should be under 0.01ms per operation
        expect(totalTime).toBeLessThan(50); // Total time under 50ms
    });

    test("✅ should handle large documents with errors efficiently", () => {
        // Create a large invalid YAML document
        let largeInvalidYaml = "valid_field: value\n";
        for (let i = 0; i < 1000; i++) {
            largeInvalidYaml += `item_${i}: value_${i}\n`;
        }
        largeInvalidYaml += "invalid: yaml: content";

        const startTime = performance.now();

        expect(() => Bun.YAML.parse(largeInvalidYaml)).toThrow(SyntaxError);

        const endTime = performance.now();
        const parseTime = endTime - startTime;

        expect(parseTime).toBeLessThan(10); // Should fail quickly even for large documents
    });
});

describe("🔧 Advanced Error Handling Tests", () => {

    test("✅ should handle complex nested structure errors", () => {
        const complexInvalidYaml = `
api:
  url: https://api.example.com
  key: secret_key
  endpoints:
    - /users
    - /posts
    invalid: yaml: content
    - /comments
logging:
  level: info
  pretty: true
`;

        expect(() => Bun.YAML.parse(complexInvalidYaml)).toThrow(SyntaxError);
    });

    test("✅ should handle anchor and alias errors", () => {
        const invalidAnchorYaml = `
employees:
  - &dev1
    name: Alice
    skills: [JavaScript, TypeScript]
  - *nonexistent  # Reference to undefined anchor
`;

        expect(() => Bun.YAML.parse(invalidAnchorYaml)).toThrow(SyntaxError);
    });

    test("✅ should handle unknown tags gracefully", () => {
        const unknownTagYaml = `
value: !!unknown_tag "some value"
`;

        expect(() => Bun.YAML.parse(unknownTagYaml)).not.toThrow();
        const result = Bun.YAML.parse(unknownTagYaml) as { value: string };
        expect(result.value).toBe("some value");
    });

    test("✅ should handle incomplete multi-line strings gracefully", () => {
        const incompleteMultilineYaml = `
description: |
  This is a multi-line string
  that is properly started
  but never closed
`;

        expect(() => Bun.YAML.parse(incompleteMultilineYaml)).not.toThrow();
        const result = Bun.YAML.parse(incompleteMultilineYaml) as { description: string };
        expect(result.description).toContain("This is a multi-line string");
    });

    test("✅ should handle flow style collection errors", () => {
        const invalidFlowYaml = `
array: [item1, item2, item3
object: {key1: value1, key2: value2
`;

        expect(() => Bun.YAML.parse(invalidFlowYaml)).toThrow(SyntaxError);
    });
});
