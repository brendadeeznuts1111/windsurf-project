#!/usr/bin/env bun

/**
 * Template Utilities for Odds Protocol Vault
 * Enhanced with Bun-native performance and semantic versioning
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { parse as parseYaml } from 'yaml';
import { logger } from '../src/core/error-handler.js';

// Bun-native datetime utilities (faster and more efficient)
function getBunDateTime(format = "YYYY-MM-DDTHH:mm:ssZ") {
    const now = new Bun.Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
        .replace('Z', 'Z');
}

function getBunTimestamp() {
    return Bun.nanoseconds(); // High-precision timestamp
}

function getBunFileStats(filePath) {
    try {
        const stats = Bun.file(filePath);
        return {
            size: stats.size,
            lastModified: new Date(stats.lastModified).toISOString(),
            type: stats.type
        };
    } catch (error) {
        return null;
    }
}

// Standard JavaScript utilities (fallback)
function getCurrentDate(format = "YYYY-MM-DD") {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day);
}

function getCurrentDateTime(format = "YYYY-MM-DDTHH:mm:ssZ") {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
        .replace('Z', 'Z');
}

function getCurrentTime(format = "HH:mm") {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return format
        .replace('HH', hours)
        .replace('mm', minutes);
}

// File utilities with Bun-native optimizations
function generateFileName(title, prefix = "") {
    const cleanTitle = title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const date = getCurrentDate();
    const prefixStr = prefix ? `${prefix} - ` : "";

    return `${prefixStr}${cleanTitle} - ${date}`;
}

// Bun-native file operations
async function readTemplateFile(templatePath) {
    try {
        const content = await Bun.file(templatePath).text();
        return content;
    } catch (error) {
        logger.error('Failed to read template file', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'readTemplateFile',
                templatePath
            }
        });
        throw error;
    }
}

async function writeTemplateFile(filePath, content) {
    try {
        await Bun.write(filePath, content);
        return true;
    } catch (error) {
        logger.error('Failed to write template file', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'writeTemplateFile',
                filePath
            }
        });
        return false;
    }
}

// Bun-native crypto utilities
function generateBunUUID() {
    return Bun.randomUUIDv7(); // UUID v7 with timestamp
}

function generateBunHash(content) {
    return Bun.hash(content); // Fast hash function
}

// Project utilities with Bun optimizations
function generateProjectId(projectName) {
    const clean = projectName
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .substring(0, 8);

    // Use Bun's crypto for better randomness
    const random = Bun.randomUUIDv7().substring(0, 8);
    return `${clean}-${random}`;
}

// Content utilities
function generateTableOfContents(headings) {
    return headings
        .map((heading, index) => {
            const indent = '  '.repeat(heading.level - 1);
            const anchor = heading.heading.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return `${indent}- [${heading.heading}](#${anchor})`;
        })
        .join('\n');
}

function generateTags(context) {
    const baseTags = ['odds-protocol'];
    const contextTags = {
        'project': ['project', 'development'],
        'meeting': ['meeting', 'collaboration'],
        'research': ['research', 'analysis'],
        'api': ['api', 'documentation'],
        'design': ['design', 'ui-ux'],
        'dashboard': ['dashboard', 'analytics']
    };

    return [...baseTags, ...(contextTags[context] || [])].join(', ');
}

// Bun-native performance utilities
function getBunPerformanceMetrics() {
    const start = Bun.nanoseconds();
    return {
        start,
        getElapsed: () => Bun.nanoseconds() - start,
        getElapsedMs: () => (Bun.nanoseconds() - start) / 1000000
    };
}

// Registry-aware utilities
function getTemplateRegistry() {
    return {
        templates: new Map(),
        versions: new Map(),
        conflicts: new Set(),
        dependencies: new Map()
    };
}

// Semantic versioning with Bun.semver
function parseVersion(version) {
    try {
        return Bun.semver.parse(version);
    } catch (error) {
        logger.warn('Invalid semver', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'parseSemVer',
                version
            }
        });
        return null;
    }
}

function compareVersions(version1, version2) {
    // Use Bun.semver.order() for more efficient comparison
    try {
        return Bun.semver.order(version1, version2);
    } catch (error) {
        logger.warn('Version comparison failed', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'compareVersions',
                version1,
                version2
            }
        });
        return 0;
    }
}

function satisfiesVersion(version, range) {
    const v = parseVersion(version);
    if (!v) return false;

    try {
        return Bun.semver.satisfies(v, range);
    } catch (error) {
        logger.warn('Invalid range', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'satisfiesVersion',
                range
            }
        });
        return false;
    }
}

// Advanced version utilities using Bun.semver.order()
function sortVersions(versions) {
    try {
        return [...versions].sort(Bun.semver.order);
    } catch (error) {
        logger.warn('Version sorting failed', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'sortVersions'
            }
        });
        return versions; // Return original order
    }
}

function getLatestVersion(versions) {
    if (versions.length === 0) return null;
    try {
        return [...versions].sort(Bun.semver.order).pop();
    } catch (error) {
        logger.warn('Latest version detection failed', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'getLatestVersion'
            }
        });
        return versions[0];
    }
}

function isVersionGreater(versionA, versionB) {
    try {
        return Bun.semver.order(versionA, versionB) === 1;
    } catch (error) {
        logger.warn('Version comparison failed', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'isVersionGreater',
                versionA,
                versionB
            }
        });
        return false;
    }
}

function isVersionLess(versionA, versionB) {
    try {
        return Bun.semver.order(versionA, versionB) === -1;
    } catch (error) {
        logger.warn('Version comparison failed', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'isVersionLess',
                versionA,
                versionB
            }
        });
        return false;
    }
}

function areVersionsEqual(versionA, versionB) {
    try {
        return Bun.semver.order(versionA, versionB) === 0;
    } catch (error) {
        logger.warn('Version comparison failed', {
            error,
            context: {
                script: 'template-utils.js',
                function: 'areVersionsEqual',
                versionA,
                versionB
            }
        });
        return false;
    }
}

// Naming conflict prevention
function generateSafeTemplateName(baseName, registry = null) {
    const reg = registry || getTemplateRegistry();
    let safeName = baseName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    let counter = 1;
    let finalName = safeName;

    while (reg.templates.has(finalName)) {
        finalName = `${safeName}-${counter}`;
        counter++;
    }

    return finalName;
}

function checkNamingConflicts(templateName, registry = null) {
    const reg = registry || getTemplateRegistry();
    const conflicts = [];

    // Check for exact matches
    if (reg.templates.has(templateName)) {
        conflicts.push({
            type: 'exact_match',
            name: templateName,
            severity: 'error'
        });
    }

    // Check for similar names (Levenshtein distance)
    for (const [existingName] of reg.templates) {
        if (existingName !== templateName) {
            const distance = levenshteinDistance(templateName, existingName);
            if (distance <= 2 && distance > 0) {
                conflicts.push({
                    type: 'similar_name',
                    name: existingName,
                    distance,
                    severity: distance === 1 ? 'warning' : 'info'
                });
            }
        }
    }

    return conflicts;
}

// Version-aware template management
function registerTemplate(templateName, version, templatePath, registry = null) {
    const reg = registry || getTemplateRegistry();

    // Check for naming conflicts
    const conflicts = checkNamingConflicts(templateName, reg);
    if (conflicts.some(c => c.severity === 'error')) {
        throw new Error(`Template name conflicts: ${conflicts.map(c => c.name).join(', ')}`);
    }

    // Parse and validate version
    const parsedVersion = parseVersion(version);
    if (!parsedVersion) {
        throw new Error(`Invalid semantic version: ${version}`);
    }

    // Check if template exists and compare versions
    if (reg.templates.has(templateName)) {
        const existingVersion = reg.versions.get(templateName);
        const comparison = compareVersions(version, existingVersion);

        if (comparison <= 0) {
            import { logger } from '../src/core/error-handler.js';
            logger.error(`Version ${version} is not greater than existing version ${existingVersion}`);
            throw new Error(`Version ${version} is not greater than existing version ${existingVersion}`);
        }
    }

    // Register template
    reg.templates.set(templateName, {
        name: templateName,
        version,
        path: templatePath,
        registeredAt: new Date().toISOString(),
        parsedVersion
    });

    reg.versions.set(templateName, version);

    return {
        templateName,
        version,
        registered: true,
        conflicts: conflicts.filter(c => c.severity !== 'error')
    };
}

function getTemplateVersion(templateName, registry = null) {
    const reg = registry || getTemplateRegistry();
    return reg.versions.get(templateName) || null;
}

function listTemplatesByVersion(registry = null) {
    const reg = registry || getTemplateRegistry();
    const templates = Array.from(reg.templates.entries());

    return templates
        .map(([name, info]) => ({
            name,
            version: info.version,
            path: info.path,
            registeredAt: info.registeredAt
        }))
        .sort((a, b) => Bun.semver.order(a.version, b.version));
}

// Dependency management
function addTemplateDependency(templateName, dependencyName, versionRange, registry = null) {
    const reg = registry || getTemplateRegistry();

    if (!reg.dependencies.has(templateName)) {
        reg.dependencies.set(templateName, new Map());
    }

    reg.dependencies.get(templateName).set(dependencyName, versionRange);
}

function checkTemplateDependencies(templateName, registry = null) {
    const reg = registry || getTemplateRegistry();
    const deps = reg.dependencies.get(templateName);

    if (!deps) return { satisfied: [], missing: [] };

    const satisfied = [];
    const missing = [];

    for (const [depName, versionRange] of deps) {
        const depVersion = getTemplateVersion(depName, reg);
        if (depVersion && satisfiesVersion(depVersion, versionRange)) {
            satisfied.push({ name: depName, version: depVersion, range: versionRange });
        } else {
            missing.push({ name: depName, range: versionRange, current: depVersion });
        }
    }

    return { satisfied, missing };
}

// Utility function for Levenshtein distance
function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

// Template lifecycle management
function createTemplateVersion(templateName, newVersion, templatePath, registry = null) {
    const reg = registry || getTemplateRegistry();

    // Auto-generate safe name if needed
    const safeName = generateSafeTemplateName(templateName, reg);

    return registerTemplate(safeName, newVersion, templatePath, reg);
}

function deprecateTemplate(templateName, reason, registry = null) {
    const reg = registry || getTemplateRegistry();
    const template = reg.templates.get(templateName);

    if (template) {
        template.deprecated = true;
        template.deprecationReason = reason;
        template.deprecatedAt = new Date().toISOString();
    }
}

function getActiveTemplates(registry = null) {
    const reg = registry || getTemplateRegistry();
    return Array.from(reg.templates.entries())
        .filter(([name, info]) => !info.deprecated)
        .map(([name, info]) => ({ name, ...info }));
}

// Export for use in templates
module.exports = {
    // Standard JavaScript utilities
    getCurrentDate,
    getCurrentDateTime,
    getCurrentTime,
    generateFileName,
    generateProjectId,
    generateTableOfContents,
    generateTags,

    // Bun-native utilities
    getBunDateTime,
    getBunTimestamp,
    getBunFileStats,
    readTemplateFile,
    writeTemplateFile,
    generateBunUUID,
    generateBunHash,
    getBunPerformanceMetrics,

    // Registry-aware utilities
    getTemplateRegistry,
    generateSafeTemplateName,
    checkNamingConflicts,
    registerTemplate,
    getTemplateVersion,
    listTemplatesByVersion,

    // Semantic versioning with Bun.semver
    parseVersion,
    compareVersions,
    satisfiesVersion,
    sortVersions,
    getLatestVersion,
    isVersionGreater,
    isVersionLess,
    areVersionsEqual,

    // Dependency management
    addTemplateDependency,
    checkTemplateDependencies,

    // Template lifecycle management
    createTemplateVersion,
    deprecateTemplate,
    getActiveTemplates
};
