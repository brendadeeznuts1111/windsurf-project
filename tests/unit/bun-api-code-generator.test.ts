import { describe, it, expect } from "bun:test";
import { BunAPICodeGenerator } from "./bun-api-code-generator";

describe("Bun API Code Generator", () => {
  it("should generate code for a specification", () => {
    const generator = new BunAPICodeGenerator('../../Repository.toml');
    const code = generator.generateSpecification('EX021');
    expect(code).toContain('DOMAIN: http');
    expect(code).toContain('SPEC: EX021');
    expect(code).toContain('export class');
    expect(code).toContain('constructor');
  });

  it("should generate batch code", () => {
    const generator = new BunAPICodeGenerator('../../Repository.toml');
    const batch = generator.generateBatch(['EX021']);
    expect(batch.size).toBe(1);
    expect(batch.has('EX021')).toBe(true);
  });

  it("should handle non-existent specifications", () => {
    const generator = new BunAPICodeGenerator('../../Repository.toml');
    expect(() => {
      generator.generateSpecification('EX999');
    }).toThrow('Specification EX999 not found');
  });

  it("should generate code with different options", () => {
    const generator = new BunAPICodeGenerator('../../Repository.toml');
    const codeWithOptions = generator.generateSpecification('EX021', {
      includeBenchmarks: true,
      includeValidation: true
    });
    expect(codeWithOptions).toContain('export class');

    const codeBasic = generator.generateSpecification('EX021', {
      includeBenchmarks: false,
      includeValidation: false
    });
    expect(codeBasic).toContain('export class');
    // Both should be valid since current spec doesn't have methods
  });

  it("should generate all specifications", () => {
    const generator = new BunAPICodeGenerator('../../Repository.toml');
    const all = generator.generateAll();
    expect(all.size).toBeGreaterThan(0);
    // Should include all specifications from the parser
  });

  it("should include proper JSDoc headers", () => {
    const generator = new BunAPICodeGenerator('../../Repository.toml');
    const code = generator.generateSpecification('EX021');
    expect(code).toContain('/**');
    expect(code).toContain('* DOMAIN: http');
    expect(code).toContain('* SCOPE: server');
    expect(code).toContain('*/');
  });

  it("should include Bun imports", () => {
    const generator = new BunAPICodeGenerator('../../Repository.toml');
    const code = generator.generateSpecification('EX021');
    expect(code).toContain('import { Bun, type BunAPI } from "bun";');
  });

  it("should generate class with proper structure", () => {
    const generator = new BunAPICodeGenerator('../../Repository.toml');
    const code = generator.generateSpecification('EX021');
    expect(code).toContain('export class');
    expect(code).toContain('constructor(');
    expect(code).toContain('private config = {');
  });

  it("should generate valid TypeScript class", () => {
    const generator = new BunAPICodeGenerator('../../Repository.toml');
    const code = generator.generateSpecification('EX021');
    expect(code).toContain('export class');
    expect(code).toContain('constructor(');
    expect(code).toContain('private config = {');
    expect(code).toContain('console.log(');
  });
});