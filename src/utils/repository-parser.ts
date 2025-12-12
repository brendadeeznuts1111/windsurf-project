#!/usr/bin/env bun

/**
 * 🏗️ Repository.toml Enhanced Parser & Query Tool
 *
 * Advanced tool for parsing and querying the enhanced Repository.toml
 * with PR metadata, domain scoping, and comprehensive tagging system.
 */

import { readFileSync } from 'fs';

export interface Specification {
  domain: string;
  scope: string;
  type: string;
  status: string;
  tags: string[];
  spec: any;
  prNumber?: string;
  commit?: string;
  reviewedBy?: string[];
  comments?: string[];
}

export interface QueryOptions {
  domain?: string;
  scope?: string;
  tags?: string[];
  status?: string;
  prStatus?: 'draft' | 'review' | 'approved' | 'merged' | 'blocked' | 'closed';
  excludeTags?: string[];
}

export class RepositoryParser {
  private data: any;
  private specifications: Map<string, Specification> = new Map();

  constructor(tomlPath: string = '../../Repository.toml') {
    this.loadRepository(tomlPath);
    this.parseSpecifications();
  }

  private loadRepository(path: string): void {
    try {
      const content = readFileSync(path, 'utf-8');
      // Simple TOML-like parser for our specific format
      this.data = this.parseSimpleToml(content);
    } catch (error) {
      throw new Error(`Failed to load Repository.toml: ${error}`);
    }
  }

  private parseSimpleToml(content: string): any {
    const result: any = {};
    const lines = content.split('\n');
    let currentSection = '';
    let currentTable: any = {};
    let inMultilineString = false;
    let multilineKey = '';
    let multilineValue: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Handle multiline strings (basic support)
      if (inMultilineString) {
        if (line.includes('"""')) {
          inMultilineString = false;
          currentTable[multilineKey] = multilineValue.join('\n');
          multilineValue = [];
          continue;
        } else {
          multilineValue.push(line);
          continue;
        }
      }

      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // Handle comments (preserve metadata comments)
      if (trimmed.startsWith('#')) {
        if (trimmed.includes('=') ||
            trimmed.includes('#COMMENT') ||
            trimmed.includes('# STATUS') ||
            trimmed.includes('# TAGS') ||
            trimmed.includes('#REVIEWED-BY') ||
            trimmed.includes('#COMMIT')) {
          // This is a metadata comment with value
          const [key, ...valueParts] = trimmed.split('=');
          if (valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            currentTable[key.trim()] = value;
          }
        }
        continue;
      }

      // Section headers
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        if (currentSection) {
          result[currentSection] = currentTable;
        }
        currentSection = trimmed.slice(1, -1);
        currentTable = {};
        continue;
      }

      // Key-value pairs
      if (trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();

        // Handle multiline strings
        if (value.startsWith('"""')) {
          inMultilineString = true;
          multilineKey = key.trim();
          continue;
        }

        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            currentTable[key.trim()] = JSON.parse(value);
          } catch (e) {
            // Fallback: keep as string
            currentTable[key.trim()] = value;
          }
        }
        // Handle objects
        else if (value.startsWith('{') && value.endsWith('}')) {
          try {
            currentTable[key.trim()] = JSON.parse(value);
          } catch (e) {
            // Fallback: keep as string
            currentTable[key.trim()] = value;
          }
        }
        // Handle strings
        else if ((value.startsWith('"') && value.endsWith('"')) ||
                 (value.startsWith("'") && value.endsWith("'"))) {
          currentTable[key.trim()] = value.slice(1, -1);
        }
        else {
          currentTable[key.trim()] = value;
        }
      }
    }

    // Save last section
    if (currentSection) {
      result[currentSection] = currentTable;
    }

    return result;
  }

  private parseSpecifications(): void {
    for (const [key, value] of Object.entries(this.data)) {
      if (key.includes('.') && !key.includes('index') && !key.includes('legend')) {
        const spec = this.parseSpecification(key, value);
        if (spec) {
          this.specifications.set(spec.spec.specification, spec);
        }
      }
    }
  }

  private parseSpecification(key: string, value: any): Specification | null {
    const parts = key.split('.');
    if (parts.length < 2) return null;

    const domain = parts[0];
    const scope = parts[1];
    const type = parts[2] || 'specification';

    // Extract PR metadata from comments
    const comments = this.extractComments(value);
    const prNumber = this.extractPRNumber(comments);
    const commit = this.extractCommit(comments);
    const reviewedBy = this.extractReviewedBy(comments);

    // Extract status and tags from domain header
    const status = this.extractStatus(comments);
    const tags = this.extractTags(comments);

    return {
      domain,
      scope,
      type,
      status,
      tags,
      spec: value,
      prNumber,
      commit,
      reviewedBy,
      comments
    };
  }

  private extractComments(obj: any): string[] {
    const comments: string[] = [];

    function traverse(value: any): void {
      if (typeof value === 'object' && value !== null) {
        for (const [key, val] of Object.entries(value)) {
          if (key === '#COMMENT' || key.startsWith('# ')) {
            comments.push(val as string);
          }
          traverse(val);
        }
      }
    }

    traverse(obj);
    return comments;
  }

  private extractPRNumber(comments: string[]): string | undefined {
    const prMatch = comments.find(c => c.includes('PR #'))?.match(/PR #(\d+)/);
    return prMatch ? prMatch[1] : undefined;
  }

  private extractCommit(comments: string[]): string | undefined {
    const commitMatch = comments.find(c => c.includes('COMMIT:'))?.match(/COMMIT:\s*([a-f0-9]+)/);
    return commitMatch ? commitMatch[1] : undefined;
  }

  private extractReviewedBy(comments: string[]): string[] | undefined {
    const reviewMatch = comments.find(c => c.includes('REVIEWED-BY:'));
    if (reviewMatch) {
      const reviewers = reviewMatch.split('REVIEWED-BY:')[1].trim();
      return reviewers.split(',').map(r => r.trim().replace('@', ''));
    }
    return undefined;
  }

  private extractStatus(comments: string[]): string {
    const statusMatch = comments.find(c => c.includes('STATUS:'));
    return statusMatch ? statusMatch.split('STATUS:')[1].trim() : 'unknown';
  }

  private extractTags(comments: string[]): string[] {
    const tags: string[] = [];
    const tagComments = comments.filter(c => c.includes('TAGS:'));

    for (const comment of tagComments) {
      const tagStr = comment.split('TAGS:')[1].trim();
      tags.push(...tagStr.split(',').map(t => t.trim()));
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Query specifications with advanced filtering
   */
  query(options: QueryOptions = {}): Specification[] {
    let results = Array.from(this.specifications.values());

    if (options.domain) {
      results = results.filter(spec => spec.domain === options.domain);
    }

    if (options.scope) {
      results = results.filter(spec => spec.scope === options.scope);
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(spec =>
        options.tags!.some(tag => spec.tags.includes(tag))
      );
    }

    if (options.excludeTags && options.excludeTags.length > 0) {
      results = results.filter(spec =>
        !options.excludeTags!.some(tag => spec.tags.includes(tag))
      );
    }

    if (options.status) {
      results = results.filter(spec => spec.status === options.status);
    }

    if (options.prStatus) {
      results = results.filter(spec => {
        const prStatuses = this.getPRStatuses(spec.spec.specification);
        return prStatuses && prStatuses[options.prStatus!]?.length > 0;
      });
    }

    return results;
  }

  /**
   * Get specifications by tags
   */
  getByTags(tags: string[]): Specification[] {
    return this.query({ tags });
  }

  /**
   * Get production-ready specifications
   */
  getProductionReady(): Specification[] {
    return this.query({
      tags: ['production-ready'],
      excludeTags: ['experimental', 'security-pending']
    });
  }

  /**
   * Get security-critical specifications
   */
  getSecurityCritical(): Specification[] {
    return this.query({
      tags: ['security-critical', 'audited'],
      excludeTags: ['security-pending']
    });
  }

  /**
   * Get specifications by PR status
   */
  getByPRStatus(status: 'draft' | 'review' | 'approved' | 'merged' | 'blocked' | 'closed'): Specification[] {
    return this.query({ prStatus: status });
  }

  /**
   * Get specifications by domain
   */
  getByDomain(domain: string): Specification[] {
    return this.query({ domain });
  }

  /**
   * Get specifications by scope
   */
  getByScope(scope: string): Specification[] {
    return this.query({ scope });
  }

  /**
   * Get tag statistics
   */
  getTagStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const spec of this.specifications.values()) {
      for (const tag of spec.tags) {
        stats[tag] = (stats[tag] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Get domain statistics
   */
  getDomainStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const spec of this.specifications.values()) {
      stats[spec.domain] = (stats[spec.domain] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get PR status statistics
   */
  getPRStatusStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const spec of this.specifications.values()) {
      const prStatuses = this.getPRStatuses(spec.spec.specification);
      if (prStatuses) {
        for (const [status, prs] of Object.entries(prStatuses)) {
          if (prs.length > 0) {
            stats[status] = (stats[status] || 0) + 1;
          }
        }
      }
    }

    return stats;
  }

  private getPRStatuses(specId: string): any {
    const prStatusKey = `pr.status.${specId}`;
    return this.data[prStatusKey];
  }

  /**
   * Get all specifications
   */
  getAll(): Specification[] {
    return Array.from(this.specifications.values());
  }

  /**
   * Get specification by ID
   */
  getById(id: string): Specification | undefined {
    return this.specifications.get(id);
  }

  /**
   * Generate implementation report
   */
  generateReport(): {
    total: number;
    byDomain: Record<string, number>;
    byStatus: Record<string, number>;
    byTags: Record<string, number>;
    productionReady: number;
    securityCritical: number;
    experimental: number;
  } {
    const all = this.getAll();

    return {
      total: all.length,
      byDomain: this.getDomainStats(),
      byStatus: this.getPRStatusStats(),
      byTags: this.getTagStats(),
      productionReady: this.getProductionReady().length,
      securityCritical: this.getSecurityCritical().length,
      experimental: this.query({ tags: ['experimental'] }).length
    };
  }
}

// CLI Interface
async function main() {
  const parser = new RepositoryParser();

  console.log('🏗️ Repository.toml Enhanced Parser\n');

  // Generate comprehensive report
  const report = parser.generateReport();

  console.log('📊 Implementation Report:');
  console.log('========================');
  console.log(`Total Specifications: ${report.total}`);
  console.log(`Production Ready: ${report.productionReady}`);
  console.log(`Security Critical: ${report.securityCritical}`);
  console.log(`Experimental: ${report.experimental}\n`);

  console.log('📂 By Domain:');
  Object.entries(report.byDomain).forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count}`);
  });

  console.log('\n🏷️ Top Tags:');
  Object.entries(report.byTags)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count}`);
    });

  console.log('\n🔄 PR Status:');
  Object.entries(report.byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Show some examples
  console.log('\n🎯 Examples:');
  console.log('============');

  console.log('\n🔒 Security Critical Specs:');
  const securitySpecs = parser.getSecurityCritical().slice(0, 3);
  securitySpecs.forEach(spec => {
    console.log(`  ${spec.spec.specification}: ${spec.tags.join(', ')}`);
  });

  console.log('\n🏭 Production Ready Specs:');
  const prodSpecs = parser.getProductionReady().slice(0, 3);
  prodSpecs.forEach(spec => {
    console.log(`  ${spec.spec.specification}: ${spec.domain}.${spec.scope}`);
  });

  console.log('\n🧪 Experimental Features:');
  const expSpecs = parser.query({ tags: ['experimental'] }).slice(0, 3);
  expSpecs.forEach(spec => {
    console.log(`  ${spec.spec.specification}: ${spec.status}`);
  });
}

// Run CLI if executed directly
if (import.meta.main) {
  main().catch(console.error);
}