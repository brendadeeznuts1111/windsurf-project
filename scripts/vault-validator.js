#!/usr/bin/env bun

// scripts/vault-validator.js - Vault validation and monitoring system

import fs from 'fs';
import path from 'path';

class VaultValidator {
    constructor(vaultPath) {
        this.vaultPath = vaultPath;
        this.issues = [];
        this.warnings = [];
        this.stats = {
            totalFiles: 0,
            validFiles: 0,
            invalidFiles: 0,
            orphanedFiles: 0
        };
    }

    async validate() {
        console.log('🔍 Starting vault validation...');

        try {
            await this.validateStructure();
            await this.validateNaming();
            await this.validateLinks();
            await this.validateTags();
            await this.validateContent();
            await this.generateValidationReport();

            console.log('✅ Vault validation completed!');

        } catch (error) {
            console.error('❌ Validation failed:', error);
            this.issues.push(`Validation error: ${error.message}`);
        }
    }

    async validateStructure() {
        console.log('📁 Validating vault structure...');

        const requiredFolders = [
            '01 - Daily Notes',
            '02 - Architecture',
            '03 - Development',
            '04 - Documentation',
            '05 - Assets',
            '06 - Templates',
            '07 - Archive'
        ];

        const requiredSubfolders = [
            '02 - Architecture/System Design',
            '02 - Architecture/Data Models',
            '03 - Development/Code Snippets',
            '03 - Development/Testing',
            '04 - Documentation/Guides',
            '04 - Documentation/API',
            '05 - Assets/Excalidraw',
            '05 - Assets/Images',
            '07 - Archive/Old Notes'
        ];

        // Check main folders
        for (const folder of requiredFolders) {
            const folderPath = path.join(this.vaultPath, folder);
            if (!fs.existsSync(folderPath)) {
                this.issues.push(`Missing required folder: ${folder}`);
            }
        }

        // Check subfolders
        for (const folder of requiredSubfolders) {
            const folderPath = path.join(this.vaultPath, folder);
            if (!fs.existsSync(folderPath)) {
                this.warnings.push(`Missing recommended subfolder: ${folder}`);
            }
        }

        // Check for files in root that should be organized
        const rootFiles = fs.readdirSync(this.vaultPath);
        for (const file of rootFiles) {
            if (file.endsWith('.md') && file !== '🏠 Home.md') {
                this.warnings.push(`Markdown file in root directory should be organized: ${file}`);
                this.stats.orphanedFiles++;
            }
        }
    }

    async validateNaming() {
        console.log('📝 Validating file naming conventions...');

        const namingRules = {
            '01 - Daily Notes': /^(\d{4}-\d{2}-\d{2})(?:-.*)?\.md$/,
            '02 - Architecture/System Design': /^[A-Z][a-zA-Z0-9\s-]+\.md$/,
            '02 - Architecture/Data Models': /^[A-Z][a-zA-Z0-9\s-]+\s+(Model|Schema|Interface|Type)\.md$/,
            '03 - Development/Code Snippets': /^[a-z][a-zA-Z0-9-]*\s+(Examples|Implementation|Usage|Pattern)\.md$/,
            '03 - Development/Testing': /^[A-Z][a-zA-Z0-9\s-]+\s+(Test|Testing|Spec)\.md$/,
            '04 - Documentation/Guides': /^[A-Z][a-zA-Z0-9\s-]+\.md$/,
            '04 - Documentation/API': /^[A-Z][a-zA-Z0-9\s-]+\s+(API|Interface|Endpoint|Reference)\.md$/,
            '06 - Templates': /^[A-Z][a-zA-Z0-9\s-]+\s+Template\.md$/
        };

        for (const [folder, pattern] of Object.entries(namingRules)) {
            const folderPath = path.join(this.vaultPath, folder);

            if (!fs.existsSync(folderPath)) continue;

            const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md'));

            for (const file of files) {
                this.stats.totalFiles++;

                if (!pattern.test(file)) {
                    this.issues.push(`Invalid naming in ${folder}: ${file} (expected: ${pattern})`);
                    this.stats.invalidFiles++;
                } else {
                    this.stats.validFiles++;
                }
            }
        }
    }

    async validateLinks() {
        console.log('🔗 Validating internal links...');

        const allFiles = this.getAllMarkdownFiles();
        const allFileNames = new Set(allFiles.map(f => path.basename(f, '.md')));

        for (const filePath of allFiles) {
            const content = fs.readFileSync(filePath, 'utf8');

            // Find all wiki-style links [[filename]]
            const wikiLinks = content.match(/\[\[([^\]]+)\]\]/g) || [];

            for (const link of wikiLinks) {
                const linkText = link.slice(2, -2); // Remove [[ and ]]
                const linkFile = linkText.includes('|') ? linkText.split('|')[0] : linkText;

                if (!allFileNames.has(linkFile)) {
                    this.warnings.push(`Broken link in ${path.basename(filePath)}: [[${linkFile}]]`);
                }
            }

            // Find all markdown links [text](filename.md)
            const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\.md\)/g) || [];

            for (const link of markdownLinks) {
                const match = link.match(/\[([^\]]+)\]\(([^)]+)\.md\)/);
                if (match) {
                    const linkFile = match[2];
                    if (!allFileNames.has(linkFile)) {
                        this.warnings.push(`Broken link in ${path.basename(filePath)}: [${match[1]}](${linkFile}.md)`);
                    }
                }
            }
        }
    }

    async validateTags() {
        console.log('🏷️ Validating tags...');

        const validTags = new Set([
            'architecture', 'development', 'testing', 'documentation', 'api',
            'code-snippet', 'guide', 'system-design', 'daily-note', 'bookmaker-registry',
            'synthetic-arbitrage', 'risk-management', 'exchange-management', 'rotation-numbers',
            'examples', 'implementation', 'usage', 'pattern', 'how-to', 'reference'
        ]);

        const allFiles = this.getAllMarkdownFiles();

        for (const filePath of allFiles) {
            const content = fs.readFileSync(filePath, 'utf8');

            // Find tags in content
            const tagMatches = content.match(/`#[\w-]+`/g) || [];

            for (const tagMatch of tagMatches) {
                const tag = tagMatch.slice(2, -1); // Remove `# and `

                if (!validTags.has(tag)) {
                    this.warnings.push(`Unknown tag in ${path.basename(filePath)}: #${tag}`);
                }
            }

            // Find tags in YAML frontmatter
            const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (yamlMatch) {
                const yamlContent = yamlMatch[1];
                const tagsMatch = yamlContent.match(/tags:\s*\[(.*?)\]/);

                if (tagsMatch) {
                    const tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));

                    for (const tag of tags) {
                        if (tag && !validTags.has(tag)) {
                            this.warnings.push(`Unknown tag in YAML of ${path.basename(filePath)}: ${tag}`);
                        }
                    }
                }
            }
        }
    }

    async validateContent() {
        console.log('📄 Validating content quality...');

        const allFiles = this.getAllMarkdownFiles();

        for (const filePath of allFiles) {
            const content = fs.readFileSync(filePath, 'utf8');
            const filename = path.basename(filePath);

            // Skip templates and daily notes for some checks
            if (filename.includes('Template') || /^\d{4}-\d{2}-\d{2}/.test(filename)) {
                continue;
            }

            // Check for required sections
            if (!content.includes('# ') && !content.includes('## ')) {
                this.warnings.push(`No headers found in ${filename}`);
            }

            if (!content.includes('## Overview') && !content.includes('# Overview')) {
                this.warnings.push(`Missing overview section in ${filename}`);
            }

            // Check for empty files
            if (content.trim().length < 50) {
                this.warnings.push(`Very short content in ${filename} (${content.trim().length} characters)`);
            }

            // Check for proper formatting
            if (content.includes('```') && !content.includes('```typescript') && !content.includes('```javascript') && !content.includes('```bash')) {
                this.warnings.push(`Code block without language specified in ${filename}`);
            }

            // Check for proper spacing
            if (content.includes('  \n') || content.includes('   \n')) {
                this.warnings.push(`Multiple trailing spaces detected in ${filename}`);
            }
        }
    }

    getAllMarkdownFiles() {
        const markdownFiles = [];

        const scanDirectory = (dir) => {
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
        };

        scanDirectory(this.vaultPath);
        return markdownFiles;
    }

    async generateValidationReport() {
        console.log('\n📊 Validation Report');
        console.log('====================');
        console.log(`Total files: ${this.stats.totalFiles}`);
        console.log(`Valid files: ${this.stats.validFiles}`);
        console.log(`Invalid files: ${this.stats.invalidFiles}`);
        console.log(`Orphaned files: ${this.stats.orphanedFiles}`);
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

        // Save validation report
        const reportPath = path.join(this.vaultPath, '01 - Daily Notes', `${new Date().toISOString().split('T')[0]}-validation-report.md`);
        const reportContent = this.generateValidationMarkdown();
        fs.writeFileSync(reportPath, reportContent);

        console.log(`\n📝 Validation report saved to: ${reportPath}`);
    }

    generateValidationMarkdown() {
        const date = new Date().toISOString().split('T')[0];

        return `# 🔍 Vault Validation Report - ${date}

## Summary
- **Total files**: ${this.stats.totalFiles}
- **Valid files**: ${this.stats.validFiles}
- **Invalid files**: ${this.stats.invalidFiles}
- **Orphaned files**: ${this.stats.orphanedFiles}
- **Issues**: ${this.issues.length}
- **Warnings**: ${this.warnings.length}

## Issues (${this.issues.length})
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
${this.issues.length > 0 || this.warnings.length > 0 ? `
1. Fix critical issues first to maintain vault integrity
2. Review warnings and improve content quality
3. Run organization script to clean up orphaned files
4. Consider adding missing templates or documentation
` : `
✅ Vault is well-organized and follows all conventions!
Continue maintaining current standards.
`}

## Next Steps
- [ ] Address all critical issues
- [ ] Review and fix warnings
- [ ] Update templates if needed
- [ ] Schedule regular validation

---
**Generated**: ${new Date().toISOString()}
**System**: Automated Vault Validator
`;
    }
}

// CLI interface
if (import.meta.main) {
    const vaultPath = process.argv[2] || process.cwd();
    const validator = new VaultValidator(vaultPath);
    validator.validate().catch(console.error);
}

export default VaultValidator;
