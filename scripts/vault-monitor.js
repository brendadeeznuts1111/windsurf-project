#!/usr/bin/env bun

// scripts/vault-monitor.js - Continuous vault monitoring and auto-cleanup

import fs from 'fs';
import path from 'path';

class VaultMonitor {
    constructor(vaultPath) {
        this.vaultPath = vaultPath;
        this.monitoring = false;
        this.stats = {
            lastRun: null,
            filesProcessed: 0,
            issuesFixed: 0,
            autoArchived: 0
        };
    }

    start() {
        console.log('🚀 Starting vault monitoring service...');
        this.monitoring = true;

        // Schedule automated tasks
        this.scheduleTasks();

        // Set up file watchers
        this.setupFileWatchers();

        console.log('✅ Vault monitoring started successfully!');
        console.log('📅 Scheduled tasks:');
        console.log('  - Every hour: Auto-organization');
        console.log('  - Daily at 9 AM: Full validation');
        console.log('  - Weekly on Sunday: Deep cleanup');
    }

    scheduleTasks() {
        // Simple interval-based scheduling using Bun
        const hourlyTask = setInterval(async () => {
            if (this.monitoring) {
                console.log('⏰ Running hourly auto-organization...');
                await this.autoOrganize();
            }
        }, 60 * 60 * 1000); // 1 hour

        const dailyTask = setInterval(async () => {
            if (this.monitoring) {
                const now = new Date();
                if (now.getHours() === 9 && now.getMinutes() === 0) {
                    console.log('📅 Running daily validation...');
                    await this.dailyValidation();
                }
            }
        }, 60 * 1000); // Check every minute

        const weeklyTask = setInterval(async () => {
            if (this.monitoring) {
                const now = new Date();
                if (now.getDay() === 0 && now.getHours() === 10 && now.getMinutes() === 0) {
                    console.log('🧹 Running weekly deep cleanup...');
                    await this.weeklyCleanup();
                }
            }
        }, 60 * 1000); // Check every minute

        const orphanCheckTask = setInterval(async () => {
            if (this.monitoring) {
                console.log('🔍 Checking for orphaned files...');
                await this.checkOrphanedFiles();
            }
        }, 30 * 60 * 1000); // 30 minutes

        // Store intervals for cleanup
        this.intervals = [hourlyTask, dailyTask, weeklyTask, orphanCheckTask];
    }

    setupFileWatchers() {
        const watcher = fs.watch(this.vaultPath, { recursive: true }, (eventType, filename) => {
            if (filename && filename.endsWith('.md')) {
                this.handleFileChange(filename, eventType);
            }
        });

        watcher.on('error', (error) => {
            console.error('❌ File watcher error:', error);
        });
    }

    async handleFileChange(filename, eventType) {
        if (!this.monitoring) return;

        console.log(`📝 File ${eventType}: ${filename}`);

        // Auto-categorize new files
        if (eventType === 'rename') {
            setTimeout(async () => {
                await this.autoCategorizeFile(filename);
            }, 1000); // Wait a bit for file to be fully written
        }
    }

    async autoOrganize() {
        const VaultOrganizer = await import('./vault-organizer.js');
        const organizer = new VaultOrganizer.default(this.vaultPath);

        try {
            await organizer.organize();
            this.stats.lastRun = new Date().toISOString();
            this.stats.filesProcessed += organizer.stats.filesProcessed;
            this.stats.issuesFixed += organizer.stats.filesMoved + organizer.stats.filesRenamed;

            console.log('✅ Auto-organization completed');
        } catch (error) {
            console.error('❌ Auto-organization failed:', error);
        }
    }

    async dailyValidation() {
        const VaultValidator = await import('./vault-validator.js');
        const validator = new VaultValidator.default(this.vaultPath);

        try {
            await validator.validate();

            // Auto-fix common issues
            await this.autoFixIssues(validator);

            this.stats.lastRun = new Date().toISOString();
            console.log('✅ Daily validation completed');
        } catch (error) {
            console.error('❌ Daily validation failed:', error);
        }
    }

    async weeklyCleanup() {
        console.log('🧹 Starting weekly deep cleanup...');

        try {
            // Archive old daily notes (older than 90 days)
            await this.archiveOldDailyNotes();

            // Clean up empty files
            await this.cleanupEmptyFiles();

            // Optimize file structure
            await this.optimizeStructure();

            // Generate cleanup report
            await this.generateCleanupReport();

            this.stats.lastRun = new Date().toISOString();
            console.log('✅ Weekly cleanup completed');
        } catch (error) {
            console.error('❌ Weekly cleanup failed:', error);
        }
    }

    async checkOrphanedFiles() {
        const allFiles = this.getAllMarkdownFiles();
        const orphanedFiles = [];

        for (const filePath of allFiles) {
            const content = fs.readFileSync(filePath, 'utf8');
            const filename = path.basename(filePath, '.md');

            // Skip templates, home page, and daily notes
            if (filename.includes('Template') || filename === '🏠 Home' || /^\d{4}-\d{2}-\d{2}/.test(filename)) {
                continue;
            }

            // Check if file has any internal links
            const hasLinks = content.includes('[[') || content.includes('](');

            // Check if file is linked from other files
            const isLinked = this.isFileLinked(filename, allFiles);

            if (!hasLinks && !isLinked) {
                orphanedFiles.push(filePath);
            }
        }

        if (orphanedFiles.length > 0) {
            console.log(`🔍 Found ${orphanedFiles.length} orphaned files`);

            // Auto-categorize orphaned files
            for (const filePath of orphanedFiles) {
                await this.autoCategorizeFile(path.basename(filePath));
            }
        }
    }

    async autoCategorizeFile(filename) {
        const filePath = path.join(this.vaultPath, filename);

        if (!fs.existsSync(filePath)) return;

        const content = fs.readFileSync(filePath, 'utf8');

        // Determine appropriate category
        let targetFolder = null;

        if (/^\d{4}-\d{2}-\d{2}/.test(filename)) {
            targetFolder = '01 - Daily Notes';
        } else if (filename.includes('Template')) {
            targetFolder = '06 - Templates';
        } else if (filename.includes('.excalidraw.')) {
            targetFolder = '05 - Assets/Excalidraw';
        } else if (content.includes('```typescript') || content.includes('```javascript')) {
            if (content.includes('Example') || content.includes('Usage')) {
                targetFolder = '03 - Development/Code Snippets';
            } else if (content.includes('Test') || content.includes('test')) {
                targetFolder = '03 - Development/Testing';
            }
        } else if (content.includes('## Overview') && content.includes('## Architecture')) {
            targetFolder = '02 - Architecture/System Design';
        } else if (content.includes('## Step-by-Step') || content.includes('## Usage')) {
            targetFolder = '04 - Documentation/Guides';
        }

        if (targetFolder && !filePath.includes(targetFolder)) {
            const targetPath = path.join(this.vaultPath, targetFolder, filename);

            // Ensure target directory exists
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Move file
            fs.renameSync(filePath, targetPath);
            console.log(`📁 Auto-categorized: ${filename} → ${targetFolder}`);
        }
    }

    async autoFixIssues(validator) {
        // Fix common naming issues
        const namingIssues = validator.issues.filter(issue => issue.includes('Invalid naming'));

        for (const issue of namingIssues) {
            // Extract filename and apply naming fix
            const match = issue.match(/Invalid naming in .*: (.+) \(expected: (.+)\)/);
            if (match) {
                const [_, filename, expected] = match;
                await this.fixFileName(filename, expected);
            }
        }
    }

    async fixFileName(filename, expectedPattern) {
        // Find the file
        const allFiles = this.getAllMarkdownFiles();
        const filePath = allFiles.find(f => path.basename(f) === filename);

        if (!filePath) return;

        // Generate new name based on pattern and content
        const content = fs.readFileSync(filePath, 'utf8');
        let newName = filename;

        if (expectedPattern.includes('System Design')) {
            // Convert to title case
            newName = filename.replace(/\.md$/, '').replace(/\b\w/g, l => l.toUpperCase()) + '.md';
        }

        if (newName !== filename) {
            const newPath = path.join(path.dirname(filePath), newName);
            fs.renameSync(filePath, newPath);
            console.log(`✏️ Fixed filename: ${filename} → ${newName}`);
            this.stats.issuesFixed++;
        }
    }

    async archiveOldDailyNotes() {
        const dailyNotesPath = path.join(this.vaultPath, '01 - Daily Notes');

        if (!fs.existsSync(dailyNotesPath)) return;

        const files = fs.readdirSync(dailyNotesPath);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);

        for (const file of files) {
            if (file.endsWith('.md')) {
                const match = file.match(/^(\d{4}-\d{2}-\d{2})/);
                if (match) {
                    const fileDate = new Date(match[1]);
                    if (fileDate < cutoffDate) {
                        const archivePath = path.join(this.vaultPath, '07 - Archive/Old Notes', file);
                        const sourcePath = path.join(dailyNotesPath, file);

                        fs.renameSync(sourcePath, archivePath);
                        this.stats.autoArchived++;
                        console.log(`📦 Archived old daily note: ${file}`);
                    }
                }
            }
        }
    }

    async cleanupEmptyFiles() {
        const allFiles = this.getAllMarkdownFiles();

        for (const filePath of allFiles) {
            const content = fs.readFileSync(filePath, 'utf8');

            // Skip templates
            if (filePath.includes('Template')) continue;

            // Check if file is essentially empty
            if (content.trim().length < 50) {
                const archivePath = path.join(this.vaultPath, '07 - Archive/Old Notes', path.basename(filePath));
                fs.renameSync(filePath, archivePath);
                console.log(`🗑️ Archived empty file: ${path.basename(filePath)}`);
                this.stats.autoArchived++;
            }
        }
    }

    async optimizeStructure() {
        // Ensure all folders exist
        const requiredFolders = [
            '01 - Daily Notes',
            '02 - Architecture/System Design',
            '02 - Architecture/Data Models',
            '03 - Development/Code Snippets',
            '03 - Development/Testing',
            '04 - Documentation/Guides',
            '04 - Documentation/API',
            '05 - Assets/Excalidraw',
            '05 - Assets/Images',
            '06 - Templates',
            '07 - Archive/Old Notes'
        ];

        for (const folder of requiredFolders) {
            const folderPath = path.join(this.vaultPath, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                console.log(`📁 Created missing folder: ${folder}`);
            }
        }
    }

    async generateCleanupReport() {
        const reportContent = `# 🧹 Weekly Cleanup Report - ${new Date().toISOString().split('T')[0]}

## Summary
- **Files processed**: ${this.stats.filesProcessed}
- **Issues fixed**: ${this.stats.issuesFixed}
- **Files archived**: ${this.stats.autoArchived}
- **Last run**: ${this.stats.lastRun}

## Actions Taken
- ✅ Archived old daily notes (older than 90 days)
- ✅ Cleaned up empty files
- ✅ Optimized folder structure
- ✅ Fixed naming conventions
- ✅ Auto-categorized orphaned files

## Recommendations
- Continue regular monitoring
- Review archived content for permanent deletion
- Update templates based on usage patterns
- Consider adding more automation rules

---
**Generated**: ${new Date().toISOString()}
**System**: Automated Vault Monitor
`;

        const reportPath = path.join(this.vaultPath, '01 - Daily Notes', `${new Date().toISOString().split('T')[0]}-cleanup-report.md`);
        fs.writeFileSync(reportPath, reportContent);

        console.log(`📝 Cleanup report saved: ${reportPath}`);
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

    isFileLinked(filename, allFiles) {
        for (const filePath of allFiles) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes(`[[${filename}]]`) || content.includes(`](${filename}.md)`)) {
                    return true;
                }
            } catch (error) {
                // Skip files we can't read
            }
        }
        return false;
    }

    stop() {
        this.monitoring = false;

        // Clear all intervals
        if (this.intervals) {
            this.intervals.forEach(interval => clearInterval(interval));
        }

        console.log('🛑 Vault monitoring stopped');
    }

    getStatus() {
        return {
            monitoring: this.monitoring,
            stats: this.stats,
            uptime: this.monitoring ? process.uptime() : 0
        };
    }
}

// CLI interface
if (import.meta.main) {
    const command = process.argv[2] || 'start';
    const vaultPath = process.argv[3] || process.cwd();

    const monitor = new VaultMonitor(vaultPath);

    switch (command) {
        case 'start':
            monitor.start();
            break;
        case 'stop':
            monitor.stop();
            break;
        case 'status':
            console.log('📊 Monitor Status:', monitor.getStatus());
            break;
        default:
            console.log('Usage: bun vault-monitor.js [start|stop|status] [vault-path]');
    }
}

export default VaultMonitor;
