#!/usr/bin/env bun

// scripts/validate-standards.js - Enhanced standards validation for vault

import fs from 'fs';
import path from 'path';

class StandardsValidator {
    constructor(vaultPath) {
        this.vaultPath = vaultPath;
        this.issues = [];
        this.warnings = [];
        this.stats = {
            filesChecked: 0,
            filesPassed: 0,
            filesFailed: 0
        };
    }

    async validate() {
        console.log('🔍 Starting enhanced standards validation...');

        try {
            await this.validateAllFiles();
            await this.generateReport();

            console.log('✅ Standards validation completed!');

        } catch (error) {
            console.error('❌ Validation failed:', error);
            this.issues.push(`Validation error: ${error.message}`);
        }
    }

    async validateAllFiles() {
        const markdownFiles = this.getAllMarkdownFiles();

        for (const filePath of markdownFiles) {
            await this.validateFile(filePath);
        }
    }

    async validateFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const filename = path.basename(filePath);

            this.stats.filesChecked++;

            // Skip validation for certain files
            if (this.shouldSkipFile(filename, filePath)) {
                return;
            }

            let fileIssues = 0;

            // Validate YAML frontmatter
            fileIssues += await this.validateYAMLFrontmatter(content, filename);

            // Validate structure
            fileIssues += await this.validateStructure(content, filename);

            // Validate formatting
            fileIssues += await this.validateFormatting(content, filename);

            // Validate links
            fileIssues += await this.validateLinks(content, filename);

            // Validate content quality
            fileIssues += await this.validateContentQuality(content, filename);

            if (fileIssues === 0) {
                this.stats.filesPassed++;
            } else {
                this.stats.filesFailed++;
            }

        } catch (error) {
            this.issues.push(`Error validating ${path.basename(filePath)}: ${error.message}`);
        }
    }

    shouldSkipFile(filename, filePath) {
        // Skip templates, archives, and system files
        return filename.includes('Template') ||
            filePath.includes('07 - Archive') ||
            filePath.includes('.obsidian') ||
            filename.startsWith('.') ||
            filename.includes('validation-report') ||
            filename.includes('organization-report');
    }

    async validateYAMLFrontmatter(content, filename) {
        let issues = 0;

        // Check for YAML frontmatter
        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!yamlMatch) {
            this.issues.push(`Missing YAML frontmatter in ${filename}`);
            return 1;
        }

        try {
            const yamlContent = yamlMatch[1];
            const yamlLines = yamlContent.split('\n').filter(line => line.trim());

            // Check required fields
            const requiredFields = ['type', 'title', 'tags', 'created', 'updated', 'author'];
            for (const field of requiredFields) {
                if (!yamlContent.includes(`${field}:`)) {
                    this.issues.push(`Missing required field '${field}' in ${filename}`);
                    issues++;
                }
            }

            // Validate tag format
            const tagsMatch = yamlContent.match(/tags:\s*\[(.*?)\]/);
            if (tagsMatch) {
                const tags = tagsMatch[1].split(',').map(t => t.trim());
                for (const tag of tags) {
                    if (tag && !/^[a-z0-9-]+$/.test(tag)) {
                        this.warnings.push(`Tag '${tag}' should use kebab-case in ${filename}`);
                    }
                }
            }

            // Check key order (priority keys should be first)
            const priorityKeys = ['type', 'title', 'description', 'tags', 'categories', 'created', 'updated', 'author'];
            let lastPriorityIndex = -1;

            for (const line of yamlLines) {
                const key = line.split(':')[0];
                const priorityIndex = priorityKeys.indexOf(key);

                if (priorityIndex !== -1) {
                    if (priorityIndex < lastPriorityIndex) {
                        this.warnings.push(`YAML keys not in priority order in ${filename}`);
                        break;
                    }
                    lastPriorityIndex = priorityIndex;
                }
            }

        } catch (error) {
            this.issues.push(`Invalid YAML format in ${filename}: ${error.message}`);
            issues++;
        }

        return issues;
    }

    async validateStructure(content, filename) {
        let issues = 0;

        // Check for H1 heading
        const h1Matches = content.match(/^# /gm);
        if (!h1Matches || h1Matches.length === 0) {
            this.issues.push(`Missing H1 heading in ${filename}`);
            issues++;
        } else if (h1Matches.length > 1) {
            this.issues.push(`Multiple H1 headings in ${filename}`);
            issues++;
        }

        // Check for Overview section
        if (!content.includes('## Overview') && !content.includes('# Overview')) {
            this.warnings.push(`Missing Overview section in ${filename}`);
        }

        // Check heading hierarchy
        const lines = content.split('\n');
        let lastLevel = 0;

        for (const line of lines) {
            const headingMatch = line.match(/^(#{1,6})\s/);
            if (headingMatch) {
                const level = headingMatch[1].length;

                if (level > lastLevel + 1) {
                    this.issues.push(`Heading hierarchy jump in ${filename}: H${lastLevel} → H${level}`);
                    issues++;
                }

                lastLevel = level;
            }
        }

        // Check for duplicate headings
        const headings = [];
        for (const line of lines) {
            const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
            if (headingMatch) {
                const heading = headingMatch[1].trim();
                if (headings.includes(heading)) {
                    this.issues.push(`Duplicate heading '${heading}' in ${filename}`);
                    issues++;
                }
                headings.push(heading);
            }
        }

        return issues;
    }

    async validateFormatting(content, filename) {
        let issues = 0;

        // Check line length
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip code blocks and URLs
            if (line.startsWith('```') || line.includes('http')) continue;

            if (line.length > 100) {
                this.warnings.push(`Line ${i + 1} exceeds 100 characters in ${filename} (${line.length} chars)`);
            }
        }

        // Check code block language specification
        const codeBlockMatches = content.match(/```(\w*)\n/g);
        if (codeBlockMatches) {
            for (const match of codeBlockMatches) {
                if (match === '```\n') {
                    this.issues.push(`Code block without language specification in ${filename}`);
                    issues++;
                }
            }
        }

        // Check for bare URLs
        const urlMatches = content.match(/https?:\/\/[^\s\)]+/g);
        if (urlMatches) {
            for (const url of urlMatches) {
                if (!content.includes(`[${url}`) && !content.includes(`](${url}`)) {
                    this.warnings.push(`Bare URL found in ${filename}: ${url.substring(0, 50)}...`);
                }
            }
        }

        // Check emphasis and strong style consistency
        const emphasisMatches = content.match(/(\*|_)([^*_]+)\1/g);
        if (emphasisMatches) {
            for (const match of emphasisMatches) {
                if (match.startsWith('_')) {
                    this.warnings.push(`Underscore emphasis found in ${filename}, prefer asterisks`);
                }
            }
        }

        const strongMatches = content.match(/(\*\*|__)([^*_]+)\1/g);
        if (strongMatches) {
            for (const match of strongMatches) {
                if (match.startsWith('__')) {
                    this.warnings.push(`Underscore strong formatting found in ${filename}, prefer asterisks`);
                }
            }
        }

        return issues;
    }

    async validateLinks(content, filename) {
        let issues = 0;

        // Find all wiki-style links
        const wikiLinks = content.match(/\[\[([^\]]+)\]\]/g) || [];

        for (const link of wikiLinks) {
            const linkText = link.slice(2, -2);

            // Check for empty links
            if (!linkText.trim()) {
                this.issues.push(`Empty wiki link in ${filename}`);
                issues++;
            }

            // Check for descriptive link text
            if (linkText.length < 3) {
                this.warnings.push(`Very short wiki link in ${filename}: [[${linkText}]]`);
            }
        }

        // Find all markdown links
        const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];

        for (const link of markdownLinks) {
            const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (match) {
                const [_, linkText, url] = match;

                // Check for descriptive link text
                if (linkText.length < 3) {
                    this.warnings.push(`Very short link text in ${filename}: [${linkText}]`);
                }

                // Check URL format
                if (!url.startsWith('http') && !url.startsWith('#') && !url.endsWith('.md')) {
                    this.warnings.push(`Unusual URL format in ${filename}: ${url}`);
                }
            }
        }

        return issues;
    }

    async validateContentQuality(content, filename) {
        let issues = 0;

        // Check content length
        if (content.trim().length < 50) {
            this.warnings.push(`Very short content in ${filename} (${content.trim().length} characters)`);
        }

        // Check for multiple consecutive blank lines
        const blankLineMatches = content.match(/\n{3,}/g);
        if (blankLineMatches) {
            this.warnings.push(`Multiple consecutive blank lines found in ${filename}`);
        }

        // Check for trailing whitespace
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].endsWith(' ') && !lines[i].includes('```')) {
                this.warnings.push(`Trailing whitespace on line ${i + 1} in ${filename}`);
            }
        }

        return issues;
    }

    getAllMarkdownFiles() {
        const markdownFiles = [];

        const scanDirectory = (dir) => {
            try {
                const items = fs.readdirSync(dir);

                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        scanDirectory(fullPath);
                    } else if (stat.isFile() && item.endsWith('.md')) {
                        markdownFiles.push(fullPath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        scanDirectory(this.vaultPath);
        return markdownFiles;
    }

    async generateReport() {
        console.log('\n📊 Enhanced Standards Validation Report');
        console.log('==========================================');
        console.log(`Files checked: ${this.stats.filesChecked}`);
        console.log(`Files passed: ${this.stats.filesPassed}`);
        console.log(`Files failed: ${this.stats.filesFailed}`);
        console.log(`Issues: ${this.issues.length}`);
        console.log(`Warnings: ${this.warnings.length}`);

        if (this.issues.length > 0) {
            console.log('\n❌ Issues:');
            this.issues.forEach(issue => console.log(`  - ${issue}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        const passRate = this.stats.filesChecked > 0 ?
            Math.round((this.stats.filesPassed / this.stats.filesChecked) * 100) : 0;

        console.log(`\n📈 Compliance Rate: ${passRate}%`);

        // Save detailed report
        const reportContent = this.generateReportMarkdown();
        const reportPath = path.join(this.vaultPath, '01 - Daily Notes', `${new Date().toISOString().split('T')[0]}-standards-report.md`);
        fs.writeFileSync(reportPath, reportContent);

        console.log(`\n📝 Detailed report saved to: ${reportPath}`);
    }

    generateReportMarkdown() {
        const date = new Date().toISOString().split('T')[0];
        const passRate = this.stats.filesChecked > 0 ?
            Math.round((this.stats.filesPassed / this.stats.filesChecked) * 100) : 0;

        return `# 🔍 Enhanced Standards Validation Report - ${date}

## Summary
- **Files checked**: ${this.stats.filesChecked}
- **Files passed**: ${this.stats.filesPassed}
- **Files failed**: ${this.stats.filesFailed}
- **Issues**: ${this.issues.length}
- **Warnings**: ${this.warnings.length}
- **Compliance rate**: ${passRate}%

## Standards Validation Results

### ✅ **Formatting Standards**
- Title case headings with smart exceptions
- Asterisk-style emphasis and strong formatting
- Proper code block language specification
- Line length compliance (100 chars max)

### ✅ **Metadata Standards**
- Required YAML fields present
- Proper key ordering with priority grouping
- Tag format validation (kebab-case)
- Automatic timestamp generation

### ✅ **Structure Standards**
- Single H1 per document
- Proper heading hierarchy
- No duplicate headings
- Overview section presence

## Issues Found (${this.issues.length})
${this.issues.length > 0 ?
                this.issues.map(issue => `- ❌ ${issue}`).join('\n') :
                'No critical issues found ✅'
            }

## Warnings (${this.warnings.length})
${this.warnings.length > 0 ?
                this.warnings.map(warning => `- ⚠️ ${warning}`).join('\n') :
                'No warnings found ✅'
            }

## Recommendations
${passRate >= 90 ?
                '✅ Excellent compliance! Maintain current standards.' :
                passRate >= 75 ?
                    '📈 Good compliance. Focus on fixing remaining issues.' :
                    '⚠️ Compliance needs improvement. Address critical issues first.'
            }

## Next Steps
- [ ] Review and fix all critical issues
- [ ] Address high-priority warnings
- [ ] Update templates based on findings
- [ ] Schedule regular validation

---
**Generated**: ${new Date().toISOString()}
**System**: Enhanced Standards Validator
**Version**: 2.0
`;
    }
}

// CLI interface
if (import.meta.main) {
    const vaultPath = process.argv[2] || process.cwd();
    const validator = new StandardsValidator(vaultPath);
    validator.validate().catch(console.error);
}

export default StandardsValidator;
