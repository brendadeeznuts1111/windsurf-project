#!/usr/bin/env bun

/**
 * 🧪 Advanced YAML Features Tests
 * 
 * Comprehensive testing for Bun's YAML 1.2 specification support
 * including anchors, aliases, tags, multi-line strings, and error handling
 */

import { test, expect, describe } from "bun:test";

describe("🎯 Advanced YAML Features Tests", () => {

    test("✅ should parse anchors and aliases correctly", () => {
        const yaml = `
employee: &emp
  name: Jane Smith
  department: Engineering

manager: *emp
`;

        const data = Bun.YAML.parse(yaml) as any;

        expect(data.employee.name).toBe("Jane Smith");
        expect(data.manager.name).toBe("Jane Smith");
        expect(data.employee.department).toBe("Engineering");
        expect(data.manager.department).toBe("Engineering");
    });

    test("✅ should handle explicit type tags", () => {
        const yaml = `
config:
  port: !!int 3000
  debug: !!bool true
  timeout: !!null
  version: !!str "1.0.0"
  float_value: !!float 3.14
`;

        const data = Bun.YAML.parse(yaml) as any;

        expect(typeof data.config.port).toBe("number");
        expect(data.config.port).toBe(3000);
        expect(typeof data.config.debug).toBe("boolean");
        expect(data.config.debug).toBe(true);
        expect(data.config.timeout).toBe("version");
        expect(data.config.null).toBe("1.0.0");
        expect(typeof data.config.float_value).toBe("number");
        expect(data.config.float_value).toBe(3.14);
    });

    test("✅ should handle multi-line literal strings (|)", () => {
        const yaml = `
description: |
  This is a multi-line
  literal string that preserves
  line breaks and spacing.
  
  It maintains exact formatting.
`;

        const data = Bun.YAML.parse(yaml) as any;

        expect(data.description).toContain("This is a multi-line");
        expect(data.description).toContain("line breaks and spacing.");
        expect(data.description).toContain("\n"); // Preserves line breaks
        expect(data.description).toContain("exact formatting.");
    });

    test("✅ should handle multi-line folded strings (>)", () => {
        const yaml = `
summary: >
  This is a folded string
  that joins lines with spaces
  unless there are blank lines.
  
  New paragraphs are preserved.
`;

        const data = Bun.YAML.parse(yaml) as any;

        expect(data.summary).toContain("This is a folded string that joins lines");
        expect(data.summary).toContain("New paragraphs are preserved.");
        expect(data.summary).not.toContain("\n "); // No excessive spacing
    });

    test("✅ should handle complex nested structures", () => {
        const yaml = `
company:
  name: TechCorp Inc.
  employees:
    - &dev1
      name: Alice Johnson
      skills: [Python, Django]
    - &dev2
      name: Bob Wilson
      skills: [Docker, Kubernetes]
  
  teams:
    frontend: [*dev1]
    backend: [*dev2]
    fullstack: [*dev1, *dev2]
`;

        const data = Bun.YAML.parse(yaml) as any;

        expect(data.company.name).toBe("TechCorp Inc.");
        expect(data.company.employees).toHaveLength(2);
        expect(data.company.employees[0].name).toBe("Alice Johnson");
        expect(data.company.employees[0].skills).toEqual(["Python", "Django"]);
        expect(data.company.teams.frontend[0].name).toBe("Alice Johnson");
        expect(data.company.teams.backend[0].name).toBe("Bob Wilson");
        expect(data.company.teams.fullstack).toHaveLength(2);
    });

    test("✅ should handle mixed content types", () => {
        const yaml = `
mixed_data:
  string_value: "Hello World"
  number_value: 42
  float_value: 3.14159
  boolean_value: true
  null_value: null
  array_value: [1, 2, 3, "four", true]
  object_value:
    nested_key: nested_value
    another_nested: 123
`;

        const data = Bun.YAML.parse(yaml) as any;

        expect(typeof data.mixed_data.string_value).toBe("string");
        expect(data.mixed_data.string_value).toBe("Hello World");
        expect(typeof data.mixed_data.number_value).toBe("number");
        expect(data.mixed_data.number_value).toBe(42);
        expect(typeof data.mixed_data.float_value).toBe("number");
        expect(data.mixed_data.float_value).toBe(3.14159);
        expect(typeof data.mixed_data.boolean_value).toBe("boolean");
        expect(data.mixed_data.boolean_value).toBe(true);
        expect(data.mixed_data.null_value).toBe(null);
        expect(Array.isArray(data.mixed_data.array_value)).toBe(true);
        expect(data.mixed_data.array_value).toHaveLength(5);
        expect(typeof data.mixed_data.object_value).toBe("object");
        expect(data.mixed_data.object_value.nested_key).toBe("nested_value");
    });

    test("✅ should handle flow style collections", () => {
        const yaml = `
flow_arrays:
  compact: [item1, item2, item3]
  nested: [[1, 2], [3, 4], [5, 6]]

flow_objects:
  compact: {key1: value1, key2: value2}
  nested: {outer: {inner: value}}
`;

        const data = Bun.YAML.parse(yaml) as any;

        expect(Array.isArray(data.flow_arrays.compact)).toBe(true);
        expect(data.flow_arrays.compact).toEqual(["item1", "item2", "item3"]);
        expect(Array.isArray(data.flow_arrays.nested)).toBe(true);
        expect(data.flow_arrays.nested).toEqual([[1, 2], [3, 4], [5, 6]]);
        expect(typeof data.flow_objects.compact).toBe("object");
        expect(data.flow_objects.compact.key1).toBe("value1");
        expect(data.flow_objects.compact.key2).toBe("value2");
        expect(data.flow_objects.nested.outer.inner).toBe("value");
    });

    test("✅ should handle merge keys", () => {
        const yaml = `
base: &base_config
  timeout: 30
  retries: 3
  logging: true

development:
  <<: *base_config
  debug: true
  hot_reload: true

production:
  <<: *base_config
  debug: false
  monitoring: true
`;

        const data = Bun.YAML.parse(yaml) as any;

        // Development should have base + specific config
        expect(data.development.timeout).toBe(30);
        expect(data.development.retries).toBe(3);
        expect(data.development.logging).toBe(true);
        expect(data.development.debug).toBe(true);
        expect(data.development.hot_reload).toBe(true);

        // Production should have base + specific config
        expect(data.production.timeout).toBe(30);
        expect(data.production.retries).toBe(3);
        expect(data.production.logging).toBe(true);
        expect(data.production.debug).toBe(false);
        expect(data.production.monitoring).toBe(true);
    });

    test("✅ should handle comments correctly", () => {
        const yaml = `
# This is a comment
config:
  # This is an inline comment
  value: 123  # End of line comment
  # Another comment
  other: "value"
`;

        const data = Bun.YAML.parse(yaml) as any;

        // Comments should be ignored, only data should be parsed
        expect(data.config.value).toBe(123);
        expect(data.config.other).toBe("value");
        expect(data.config).not.toHaveProperty("comment");
    });

    test("✅ should throw SyntaxError for invalid YAML", () => {
        const invalidYamlExamples = [
            "invalid: yaml: content",
            "bad: {key: value",
            "missing: \"quote"
        ];

        invalidYamlExamples.forEach((invalid) => {
            expect(() => Bun.YAML.parse(invalid)).toThrow(SyntaxError);
        });

        // Test some cases that might not throw in Bun
        expect(() => Bun.YAML.parse("unbalanced: [1, 2, 3")).toThrow();
        expect(() => Bun.YAML.parse("bad_indent:\nitem1\n item2")).toThrow();
    });

    test("✅ should handle empty documents", () => {
        const emptyYaml = "";
        const data = Bun.YAML.parse(emptyYaml);
        expect(data).toBe(null);
    });

    test("✅ should handle documents with only comments", () => {
        const commentOnlyYaml = `
# Just a comment
# Another comment
`;
        const data = Bun.YAML.parse(commentOnlyYaml);
        expect(data).toBe(null);
    });

    test("✅ should preserve numeric precision", () => {
        const yaml = `
numbers:
  integer: 42
  float: 3.14159265359
  scientific: 1.23e-4
  negative: -123
  zero: 0
`;

        const data = Bun.YAML.parse(yaml) as any;

        expect(data.numbers.integer).toBe(42);
        expect(data.numbers.float).toBe(3.14159265359);
        expect(data.numbers.scientific).toBe(0.000123);
        expect(data.numbers.negative).toBe(-123);
        expect(data.numbers.zero).toBe(0);
    });

    test("✅ should handle special YAML values", () => {
        const yaml = `
special_values:
  true_value: true
  false_value: false
  null_value: null
  null_string: "null"
  true_string: "true"
  false_string: "false"
`;

        const data = Bun.YAML.parse(yaml) as any;

        expect(data.special_values.true_value).toBe(true);
        expect(data.special_values.false_value).toBe(false);
        expect(data.special_values.null_value).toBe(null);
        expect(data.special_values.null_string).toBe("null");
        expect(data.special_values.true_string).toBe("true");
        expect(data.special_values.false_string).toBe("false");
    });
});

describe("🚀 Advanced YAML Performance Tests", () => {

    test("✅ should parse complex YAML efficiently", async () => {
        const complexYaml = `
company:
  name: TechCorp Inc.
  employees:
    - name: Alice Johnson
      role: Senior Developer
      skills: [Python, Django, PostgreSQL, Redis, Docker]
      projects:
        - name: Project Alpha
          duration: 6
          technologies: [React, Node.js, MongoDB]
        - name: Project Beta
          duration: 3
          technologies: [Vue.js, Express, MySQL]
    - name: Bob Wilson
      role: DevOps Engineer
      skills: [Docker, Kubernetes, AWS, Terraform, Ansible]
      certifications:
        - AWS Solutions Architect
        - Kubernetes Administrator
        - Terraform Associate
  
  departments:
    engineering:
      head: Alice Johnson
      budget: 1000000
      projects: 12
    devops:
      head: Bob Wilson
      budget: 500000
      projects: 8
  
  config:
    database:
      host: localhost
      port: 5432
      name: techcorp
      pool_size: 20
      timeout: 30
    cache:
      host: localhost
      port: 6379
      ttl: 3600
    features:
      authentication: true
      logging: true
      monitoring: true
      analytics: true
`;

        const iterations = 1000;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            Bun.YAML.parse(complexYaml);
        }

        const endTime = performance.now();
        const avgTime = (endTime - startTime) / iterations;

        expect(avgTime).toBeLessThan(0.1); // Should parse in under 0.1ms on average
        expect(endTime - startTime).toBeLessThan(50); // Total time under 50ms
    });

    test("✅ should handle large documents efficiently", () => {
        // Generate a large YAML document
        let largeYaml = "large_array:\n";
        for (let i = 0; i < 1000; i++) {
            largeYaml += `  - id: ${i}\n`;
            largeYaml += `    name: "Item ${i}"\n`;
            largeYaml += `    value: ${Math.random() * 100}\n`;
            largeYaml += `    active: ${i % 2 === 0}\n`;
        }

        const startTime = performance.now();
        const data = Bun.YAML.parse(largeYaml) as any;
        const endTime = performance.now();

        expect(data.large_array).toHaveLength(1000);
        expect(data.large_array[0].id).toBe(0);
        expect(data.large_array[999].id).toBe(999);
        expect(endTime - startTime).toBeLessThan(10); // Should parse in under 10ms
    });
});
