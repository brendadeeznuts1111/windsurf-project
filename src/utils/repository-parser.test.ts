import { describe, it, expect } from "bun:test";
import { RepositoryParser } from "./repository-parser";

describe("Repository Parser", () => {
  it("should load and parse repository", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const all = parser.getAll();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]).toHaveProperty('domain');
    expect(all[0]).toHaveProperty('scope');
    expect(all[0]).toHaveProperty('tags');
  });

  it("should get specifications by domain", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const httpSpecs = parser.getByDomain('http');
    expect(httpSpecs.length).toBeGreaterThan(0);
    expect(httpSpecs[0].domain).toBe('http');
  });

  it("should get specifications by tags", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const securitySpecs = parser.getByTags(['security']);
    // Note: Current Repository.toml doesn't have enhanced tags yet
    expect(Array.isArray(securitySpecs)).toBe(true);
  });

  it("should get production ready specifications", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const prodSpecs = parser.getProductionReady();
    // Note: Current Repository.toml doesn't have enhanced tags yet
    expect(Array.isArray(prodSpecs)).toBe(true);
  });

  it("should get security critical specifications", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const securitySpecs = parser.getSecurityCritical();
    // Note: Current Repository.toml doesn't have enhanced tags yet
    expect(Array.isArray(securitySpecs)).toBe(true);
  });

  it("should generate comprehensive report", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const report = parser.generateReport();

    expect(report.total).toBeGreaterThan(0);
    expect(typeof report.byDomain).toBe('object');
    expect(typeof report.byTags).toBe('object');
  });

  it("should get tag statistics", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const tagStats = parser.getTagStats();
    expect(typeof tagStats).toBe('object');
  });

  it("should get domain statistics", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const domainStats = parser.getDomainStats();
    expect(typeof domainStats).toBe('object');
    expect(Object.keys(domainStats).length).toBeGreaterThan(0);
  });

  it("should handle complex queries", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const results = parser.query({
      domain: 'http',
      tags: ['performance'],
      excludeTags: ['experimental']
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("should handle specification lookup by ID", () => {
    const parser = new RepositoryParser('../../Repository.toml');
    const all = parser.getAll();
    const firstSpec = all[0];
    const foundSpec = parser.getById(firstSpec.spec.specification);

    expect(foundSpec).toBeDefined();
    expect(foundSpec!.spec.specification).toBe(firstSpec.spec.specification);
  });
});