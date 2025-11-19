#!/usr/bin/env bun

// scripts/vault-organizer.js - Automated vault organization system

import fs from 'fs';
import path from 'path';

class VaultOrganizer {
    constructor(vaultPath) {
        this.vaultPath = vaultPath;
        this.rules = this.initializeRules();
        this.stats = {
            filesProcessed: 0,
            filesMoved: 0,
            filesRenamed: 0,
            errors: []
        };
    }

    initializeRules() {
        return {
            // File naming conventions
            naming: {
                dailyNotes: /^(\d{4}-\d{2}-\d{2})\.md$/,
                systemDesign: /^[A-Z][a-zA-Z0-9\s-]+\.md$/,
                codeSnippets: /^[a-z][a-zA-Z0-9-]*\s+(Examples|Implementation|Usage)\.md$/,
                guides: /^[A-Z][a-zA-Z0-9\s-]+\.md$/,
                templates: /^[A-Z][a-zA-Z0-9\s-]+\s+Template\.md$/
            },

            // Folder structure rules
            folders: {
                '01 - Daily Notes': {
                    pattern: /^(\d{4}-\d{2}-\d{2})\.md$/,
                    required: true
                },
                '02 - Architecture/System Design': {
                    pattern: /^[A-Z][a-zA-Z0-9\s-]+\.md$/,
                    required: ['🏠 Home.md']
                },
                '02 - Architecture/Data Models': {
                    pattern: /^[A-Z][a-zA-Z0-9\s-]+\s+(Model|Schema|Interface)\.md$/
                },
                '03 - Development/Code Snippets': {
                    pattern: /^[a-z][a-zA-Z0-9-]*\s+(Examples|Implementation|Usage)\.md$/
                },
                '03 - Development/Testing': {
                    pattern: /^[A-Z][a-zA-Z0-9\s-]+\s+(Test|Testing|Spec)\.md$/
                },
                '04 - Documentation/Guides': {
                    pattern: /^[A-Z][a-zA-Z0-9\s-]+\.md$/,
                    exclude: [/Getting Started\.md$/]
                },
                '04 - Documentation/API': {
                    pattern: /^[A-Z][a-zA-Z0-9\s-]+\s+(API|Interface|Endpoint)\.md$/
                },
                '05 - Assets/Excalidraw': {
                    pattern: /^.*\.excalidraw\.md$/
                },
                '05 - Assets/Images': {
                    pattern: /\.(png|jpg|jpeg|gif|svg|webp)$/i
                },
                '06 - Templates': {
                    pattern: /^[A-Z][a-zA-Z0-9\s-]+\s+Template\.md$/,
                    required: ['Daily Note Template.md', 'System Design Template.md']
                },
                '07 - Archive/Old Notes': {
                    pattern: /^(Untitled|OLD|ARCHIVE)/i
                }
            },

            // Content validation rules
            content: {
                requiredFrontmatter: ['type', 'tags'],
                requiredHeaders: ['## Overview'],
                maxLength: 50000, // characters
                maxFileSize: 1024 * 1024 // 1MB
            }
        };
    }

    async organize() {
        console.log('🚀 Starting vault organization...');

        try {
            // Step 1: Validate folder structure
            await this.validateFolderStructure();

            // Step 2: Process root files
            await this.processRootFiles();

            // Step 4: Rename files to match conventions
            await this.renameFiles();

            // Step 5: Validate content
            await this.validateContent();

            // Step 6: Generate organization report
            await this.generateReport();

            console.log('✅ Vault organization completed successfully!');

        } catch (error) {
            console.error('❌ Organization failed:', error);
            this.stats.errors.push(error.message);
        }
    }

    async validateFolderStructure() {
        console.log('📁 Validating folder structure...');

        const requiredFolders = Object.keys(this.rules.folders);

        for (const folder of requiredFolders) {
            const folderPath = path.join(this.vaultPath, folder);

            if (!fs.existsSync(folderPath)) {
                console.log(`📁 Creating missing folder: ${folder}`);
                fs.mkdirSync(folderPath, { recursive: true });
            }
        }
    }

    async processRootFiles() {
        console.log('📄 Processing root files...');

        const rootFiles = fs.readdirSync(this.vaultPath);

        for (const file of rootFiles) {
            if (file.startsWith('.') || file === 'node_modules') continue;

            const filePath = path.join(this.vaultPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile()) {
                await this.categorizeFile(file, filePath);
            }
        }
    }

    async categorizeFile(filename, filePath) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for daily notes
        if (this.rules.naming.dailyNotes.test(filename)) {
            await this.moveFile(filePath, '01 - Daily Notes', filename);
            return;
        }

        // Check for templates
        if (this.rules.naming.templates.test(filename)) {
            await this.moveFile(filePath, '06 - Templates', filename);
            return;
        }

        // Check for Excalidraw files
        if (filename.includes('.excalidraw.')) {
            await this.moveFile(filePath, '05 - Assets/Excalidraw', filename);
            return;
        }

        // Check for images
        if (this.rules.folders['05 - Assets/Images'].pattern.test(filename)) {
            await this.moveFile(filePath, '05 - Assets/Images', filename);
            return;
        }

        // Check for archive candidates
        if (this.rules.folders['07 - Archive/Old Notes'].pattern.test(filename)) {
            await this.moveFile(filePath, '07 - Archive/Old Notes', filename);
            return;
        }

        // Analyze content for categorization
        const category = this.analyzeContent(content, filename);
        if (category) {
            await this.moveFile(filePath, category, filename);
        }
    }

    analyzeContent(content, filename) {
        // Look for specific patterns in content
        if (content.includes('```typescript') || content.includes('```javascript')) {
            if (content.includes('Example') || content.includes('Usage')) {
                return '03 - Development/Code Snippets';
            }
            if (content.includes('Test') || content.includes('test')) {
                return '03 - Development/Testing';
            }
        }

        if (content.includes('## Overview') && content.includes('## Architecture')) {
            return '02 - Architecture/System Design';
        }

        if (content.includes('## Step-by-Step') || content.includes('## Usage')) {
            return '04 - Documentation/Guides';
        }

        if (content.includes('API') || content.includes('Endpoint')) {
            return '04 - Documentation/API';
        }

        return null;
    }

    async moveFile(filePath, targetFolder, filename) {
        const targetPath = path.join(this.vaultPath, targetFolder, filename);

        if (filePath !== targetPath) {
            console.log(`📝 Moving ${filename} to ${targetFolder}`);

            // Ensure target directory exists
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Move file
            fs.renameSync(filePath, targetPath);
            this.stats.filesMoved++;
        }

        this.stats.filesProcessed++;
    }

    async renameFiles() {
        console.log('✏️ Renaming files to match conventions...');

        for (const [folder, rules] of Object.entries(this.rules.folders)) {
            const folderPath = path.join(this.vaultPath, folder);

            if (!fs.existsSync(folderPath)) continue;

            const files = fs.readdirSync(folderPath);

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stat = fs.statSync(filePath);

                if (stat.isFile() && file.endsWith('.md')) {
                    await this.renameFileIfNeeded(file, filePath, folder);
                }
            }
        }
    }

    async renameFileIfNeeded(filename, filePath, folder) {
        let newName = filename;

        // Apply naming rules based on folder
        if (folder === '02 - Architecture/System Design') {
            newName = this.toTitleCase(filename.replace(/\.md$/, '')) + '.md';
        }

        if (folder === '03 - Development/Code Snippets') {
            if (!filename.includes('Examples') && !filename.includes('Implementation')) {
                const baseName = filename.replace(/\.md$/, '');
                newName = `${baseName} Examples.md`;
            }
        }

        if (newName !== filename) {
            const newPath = path.join(path.dirname(filePath), newName);
            console.log(`✏️ Renaming ${filename} to ${newName}`);
            fs.renameSync(filePath, newPath);
            this.stats.filesRenamed++;
        }
    }

    async validateContent() {
        console.log('🔍 Validating file content...');

        for (const [folder, rules] of Object.entries(this.rules.folders)) {
            const folderPath = path.join(this.vaultPath, folder);

            if (!fs.existsSync(folderPath)) continue;

            const files = fs.readdirSync(folderPath);

            for (const file of files) {
                if (file.endsWith('.md')) {
                    await this.validateFileContent(path.join(folderPath, file), file);
                }
            }
        }
    }

    async validateFileContent(filePath, filename) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Check file size
            const stat = fs.statSync(filePath);
            if (stat.size > this.rules.content.maxFileSize) {
                console.log(`⚠️ Large file detected: ${filename} (${stat.size} bytes)`);
            }

            // Check content length
            if (content.length > this.rules.content.maxLength) {
                console.log(`⚠️ Long content detected: ${filename} (${content.length} characters)`);
            }

            // Check for required headers (skip templates and daily notes)
            if (!filename.includes('Template') && !this.rules.naming.dailyNotes.test(filename)) {
                const hasOverview = content.includes('## Overview') || content.includes('# Overview');
                if (!hasOverview) {
                    console.log(`⚠️ Missing overview header in: ${filename}`);
                }
            }

        } catch (error) {
            console.log(`❌ Error validating ${filename}: ${error.message}`);
            this.stats.errors.push(`Content validation error in ${filename}: ${error.message}`);
        }
    }

    async generateReport() {
        console.log('\n📊 Organization Report');
        console.log('=======================');
        console.log(`Files processed: ${this.stats.filesProcessed}`);
        console.log(`Files moved: ${this.stats.filesMoved}`);
        console.log(`Files renamed: ${this.stats.filesRenamed}`);
        console.log(`Errors: ${this.stats.errors.length}`);

        if (this.stats.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.stats.errors.forEach(error => console.log(`  - ${error}`));
        }

        // Save report to file
        const reportPath = path.join(this.vaultPath, '01 - Daily Notes', `${new Date().toISOString().split('T')[0]}-organization-report.md`);
        const reportContent = this.generateReportMarkdown();
        fs.writeFileSync(reportPath, reportContent);

        console.log(`\n📝 Report saved to: ${reportPath}`);
    }

    generateReportMarkdown() {
        const date = new Date().toISOString().split('T')[0];

        return `# 📊 Vault Organization Report - ${date}

## Summary
- **Files processed**: ${this.stats.filesProcessed}
- **Files moved**: ${this.stats.filesMoved}
- **Files renamed**: ${this.stats.filesRenamed}
- **Errors encountered**: ${this.stats.errors.length}

## Actions Taken
${this.stats.filesMoved > 0 ? `- Moved ${this.stats.filesMoved} files to appropriate folders` : '- No files needed to be moved'}
${this.stats.filesRenamed > 0 ? `- Renamed ${this.stats.filesRenamed} files to match conventions` : '- No files needed to be renamed'}

## Issues Found
${this.stats.errors.length > 0 ?
                this.stats.errors.map(error => `- ${error}`).join('\n') :
                'No issues found'
            }

## Recommendations
- Review any files that were moved to ensure they're in the correct location
- Check files with warnings for content optimization
- Consider adding templates for frequently created content types

---
**Generated**: ${new Date().toISOString()}
**System**: Automated Vault Organizer
`;
    }

    toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) =>
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
}

// CLI interface
if (import.meta.main) {
    const vaultPath = process.argv[2] || process.cwd();
    const organizer = new VaultOrganizer(vaultPath);
    organizer.organize().catch(console.error);
}

export default VaultOrganizer;
