/**
 * Standardized Plugin Configuration System
 * Unified configuration patterns for all Obsidian plugins
 * 
 * @fileoverview Centralized plugin configuration management
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2025-11-18
 */

import {
    VaultConfig,
    PluginConfigs,
    TasksPluginConfig,
    ExportPluginConfig,
    TemplaterPluginConfig,
    LinterPluginConfig,
    DataviewPluginConfig,
    HomepagePluginConfig,
    TemplatePair,
    FolderTemplate,
    FileTemplate,
    TaskStatus,
    AutoSuggestConfig,
    DateSettings,
    ExportFeatures,
    PerformanceSettings,
    LinterRule,
    CustomLinterRule,
    ContextualHomepage
} from '../types/vault-types.js';
import { logger, ErrorHandler, ErrorSeverity, ErrorCategory, createErrorContext } from '../core/error-handler.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// CONFIGURATION SCHEMA DEFINITIONS
// ============================================================================

export interface PluginConfigurationSchema {
    name: string;
    version: string;
    description: string;
    configPath: string;
    defaultConfig: Record<string, unknown>;
    validator: (config: Record<string, unknown>) => boolean;
    migrator?: (config: Record<string, unknown>, fromVersion: string, toVersion: string) => Record<string, unknown>;
}

export interface StandardizedConfig {
    meta: {
        name: string;
        version: string;
        lastUpdated: string;
        schema: string;
    };
    config: Record<string, unknown>;
    features: {
        enabled: string[];
        disabled: string[];
        experimental: string[];
    };
    integration: {
        plugins: string[];
        scripts: string[];
        templates: string[];
    };
}

// ============================================================================
// BASE CONFIGURATION MANAGER
// ============================================================================

export abstract class BasePluginConfigManager<T = Record<string, unknown>> {
    protected readonly pluginName: string;
    protected readonly configPath: string;
    protected readonly schema: PluginConfigurationSchema;
    protected currentConfig: StandardizedConfig;

    constructor(schema: PluginConfigurationSchema) {
        this.pluginName = schema.name;
        this.configPath = schema.configPath;
        this.schema = schema;
        this.currentConfig = this.loadConfiguration();
    }

    protected loadConfiguration(): StandardizedConfig {
        try {
            if (!existsSync(this.configPath)) {
                logger.info(`Creating default configuration for ${this.pluginName}`);
                return this.createDefaultConfiguration();
            }

            const rawConfig = JSON.parse(readFileSync(this.configPath, 'utf-8'));

            if (!this.validateConfiguration(rawConfig)) {
                logger.warn(`Invalid configuration for ${this.pluginName}, using defaults`);
                return this.createDefaultConfiguration();
            }

            return this.standardizeConfiguration(rawConfig);
        } catch (error) {
            logger.error(`Failed to load configuration for ${this.pluginName}`, { error });
            return this.createDefaultConfiguration();
        }
    }

    protected createDefaultConfiguration(): StandardizedConfig {
        return {
            meta: {
                name: this.schema.name,
                version: this.schema.version,
                lastUpdated: new Date().toISOString(),
                schema: '1.0.0'
            },
            config: this.schema.defaultConfig,
            features: {
                enabled: [],
                disabled: [],
                experimental: []
            },
            integration: {
                plugins: [],
                scripts: [],
                templates: []
            }
        };
    }

    protected validateConfiguration(config: Record<string, unknown>): boolean {
        try {
            return this.schema.validator(config);
        } catch (error) {
            logger.error(`Configuration validation failed for ${this.pluginName}`, { error });
            return false;
        }
    }

    protected standardizeConfiguration(rawConfig: Record<string, unknown>): StandardizedConfig {
        // Convert old configuration format to standardized format
        if (rawConfig.meta && rawConfig.config) {
            // Already standardized
            return rawConfig;
        }

        // Convert legacy format
        return {
            meta: {
                name: this.pluginName,
                version: this.schema.version,
                lastUpdated: new Date().toISOString(),
                schema: '1.0.0'
            },
            config: rawConfig,
            features: this.extractFeatures(rawConfig),
            integration: this.extractIntegrations(rawConfig)
        };
    }

    protected extractFeatures(config: Record<string, unknown>): { enabled: string[], disabled: string[], experimental: string[] } {
        // Override in subclasses to extract plugin-specific features
        return { enabled: [], disabled: [], experimental: [] };
    }

    protected extractIntegrations(config: Record<string, unknown>): { plugins: string[], scripts: string[], templates: string[] } {
        // Override in subclasses to extract plugin-specific integrations
        return { plugins: [], scripts: [], templates: [] };
    }

    public saveConfiguration(): void {
        try {
            this.currentConfig.meta.lastUpdated = new Date().toISOString();
            writeFileSync(this.configPath, JSON.stringify(this.currentConfig, null, 2));
            logger.info(`Configuration saved for ${this.pluginName}`);
        } catch (error) {
            ErrorHandler.handleError(
                error as Error,
                ErrorSeverity.HIGH,
                ErrorCategory.CONFIGURATION,
                createErrorContext()
                    .script('plugin-config-manager.ts')
                    .function('saveConfiguration')
                    .filePath(this.configPath)
                    .build()
            );
        }
    }

    public getConfig(): T {
        return this.currentConfig.config as T;
    }

    public getStandardizedConfig(): StandardizedConfig {
        return this.currentConfig;
    }

    public updateConfig(updates: Partial<T>): void {
        this.currentConfig.config = { ...this.currentConfig.config, ...updates };
        this.saveConfiguration();
    }

    public enableFeature(feature: string): void {
        if (!this.currentConfig.features.enabled.includes(feature)) {
            this.currentConfig.features.enabled.push(feature);
            this.currentConfig.features.disabled = this.currentConfig.features.disabled.filter(f => f !== feature);
            this.saveConfiguration();
        }
    }

    public disableFeature(feature: string): void {
        if (!this.currentConfig.features.disabled.includes(feature)) {
            this.currentConfig.features.disabled.push(feature);
            this.currentConfig.features.enabled = this.currentConfig.features.enabled.filter(f => f !== feature);
            this.saveConfiguration();
        }
    }

    public isFeatureEnabled(feature: string): boolean {
        return this.currentConfig.features.enabled.includes(feature) &&
            !this.currentConfig.features.disabled.includes(feature);
    }
}

// ============================================================================
// TASKS PLUGIN CONFIGURATION MANAGER
// ============================================================================

export class TasksPluginConfigManager extends BasePluginConfigManager<TasksPluginConfig> {
    constructor() {
        const schema: PluginConfigurationSchema = {
            name: 'obsidian-tasks-plugin',
            version: '1.0.0',
            description: 'Advanced task management plugin',
            configPath: join(process.cwd(), '.obsidian', 'plugins', 'obsidian-tasks-plugin', 'data.json'),
            defaultConfig: {
                globalQuery: 'not done',
                globalFilter: '#task',
                taskFormat: 'tasksPluginEmoji',
                customStatuses: [
                    {
                        symbol: ' ',
                        name: 'Todo',
                        nextStatusSymbol: 'x',
                        availableAsCommand: true,
                        type: 'TODO'
                    },
                    {
                        symbol: 'x',
                        name: 'Done',
                        nextStatusSymbol: ' ',
                        availableAsCommand: true,
                        type: 'DONE'
                    },
                    {
                        symbol: '/',
                        name: 'In Progress',
                        nextStatusSymbol: 'x',
                        availableAsCommand: true,
                        type: 'IN_PROGRESS'
                    },
                    {
                        symbol: '-',
                        name: 'Cancelled',
                        nextStatusSymbol: ' ',
                        availableAsCommand: true,
                        type: 'CANCELLED'
                    }
                ],
                autoSuggest: {
                    enabled: true,
                    minMatch: 0,
                    maxItems: 25
                },
                dateSettings: {
                    setCreatedDate: true,
                    setDoneDate: true,
                    setCancelledDate: true,
                    useFilenameAsScheduledDate: true,
                    filenameAsDateFolders: ['01 - Daily Notes', '02 - Projects', '03 - Development']
                }
            },
            validator: (config: Record<string, unknown>) => {
                return config &&
                    typeof config.globalQuery === 'string' &&
                    typeof config.globalFilter === 'string' &&
                    Array.isArray(config.customStatuses) &&
                    config.autoSuggest &&
                    config.dateSettings;
            }
        };
        super(schema);
    }

    protected extractFeatures(config: Record<string, unknown>): { enabled: string[], disabled: string[], experimental: string[] } {
        const features: string[] = [];

        if (config.customStatuses && config.customStatuses.length > 4) {
            features.push('enhanced-statuses');
        }

        if (config.autoSuggest && config.autoSuggest.enabled) {
            features.push('auto-suggest');
        }

        if (config.dateSettings && config.dateSettings.useFilenameAsScheduledDate) {
            features.push('filename-dates');
        }

        return {
            enabled: features,
            disabled: [],
            experimental: []
        };
    }

    protected extractIntegrations(config: Record<string, unknown>): { plugins: string[], scripts: string[], templates: string[] } {
        return {
            plugins: ['templater-obsidian', 'dataview'],
            scripts: ['tasks-cli.ts', 'task-analytics.ts'],
            templates: ['📋 Tasks Plugin Integration & Enhancement.md']
        };
    }
}

// ============================================================================
// EXPORT PLUGIN CONFIGURATION MANAGER
// ============================================================================

export class ExportPluginConfigManager extends BasePluginConfigManager<ExportPluginConfig> {
    constructor() {
        const schema: PluginConfigurationSchema = {
            name: 'webpage-html-export',
            version: '1.0.0',
            description: 'Professional website export plugin',
            configPath: join(process.cwd(), '.obsidian', 'plugins', 'webpage-html-export', 'data.json'),
            defaultConfig: {
                siteName: 'Odds Protocol Knowledge Vault',
                exportPath: '',
                preset: 'online',
                features: {
                    search: true,
                    navigation: true,
                    graphView: true,
                    backlinks: true,
                    tags: true,
                    outline: true
                },
                performance: {
                    inlineResources: false,
                    combineFiles: false,
                    offlineMode: false,
                    maxTasksToShow: 100
                }
            },
            validator: (config: Record<string, unknown>) => {
                return config &&
                    typeof config.siteName === 'string' &&
                    config.features &&
                    config.performance;
            }
        };
        super(schema);
    }

    protected extractFeatures(config: Record<string, unknown>): { enabled: string[], disabled: string[], experimental: string[] } {
        const features: string[] = [];

        if (config.features?.search) features.push('search');
        if (config.features?.navigation) features.push('navigation');
        if (config.features?.graphView) features.push('graph-view');
        if (config.features?.backlinks) features.push('backlinks');
        if (config.features?.tags) features.push('tags');
        if (config.features?.outline) features.push('outline');

        return {
            enabled: features,
            disabled: [],
            experimental: []
        };
    }

    protected extractIntegrations(config: Record<string, unknown>): { plugins: string[], scripts: string[], templates: string[] } {
        return {
            plugins: ['dataview', 'obsidian-linter'],
            scripts: [],
            templates: ['🌐 Webpage HTML Export Configuration Guide.md']
        };
    }
}

// ============================================================================
// TEMPLATER PLUGIN CONFIGURATION MANAGER
// ============================================================================

export class TemplaterPluginConfigManager extends BasePluginConfigManager<TemplaterPluginConfig> {
    constructor() {
        const schema: PluginConfigurationSchema = {
            name: 'templater-obsidian',
            version: '1.0.0',
            description: 'Advanced template engine plugin',
            configPath: join(process.cwd(), '.obsidian', 'plugins', 'templater-obsidian', 'data.json'),
            defaultConfig: {
                templatesFolder: '06 - Templates',
                templatePairs: [],
                folderTemplates: [],
                fileTemplates: [],
                enableSystemCommands: true,
                userScriptsFolder: 'scripts'
            },
            validator: (config: Record<string, unknown>) => {
                return config &&
                    typeof config.templatesFolder === 'string' &&
                    Array.isArray(config.templatePairs) &&
                    Array.isArray(config.folderTemplates) &&
                    Array.isArray(config.fileTemplates);
            }
        };
        super(schema);
    }

    protected extractFeatures(config: Record<string, unknown>): { enabled: string[], disabled: string[], experimental: string[] } {
        const features: string[] = [];

        if (config.enableSystemCommands) features.push('system-commands');
        if (config.templatePairs && config.templatePairs.length > 0) features.push('template-pairs');
        if (config.folderTemplates && config.folderTemplates.length > 0) features.push('folder-templates');
        if (config.fileTemplates && config.fileTemplates.length > 0) features.push('file-templates');

        return {
            enabled: features,
            disabled: [],
            experimental: []
        };
    }

    protected extractIntegrations(config: Record<string, unknown>): { plugins: string[], scripts: string[], templates: string[] } {
        const templates = config.templatePairs?.map((pair: TemplatePair) => pair.template) || [];

        return {
            plugins: ['dataview', 'obsidian-tasks-plugin'],
            scripts: ['template-utils.js'],
            templates: templates
        };
    }
}

// ============================================================================
// CONFIGURATION REGISTRY
// ============================================================================

export class PluginConfigRegistry {
    private static instance: PluginConfigRegistry;
    private managers: Map<string, BasePluginConfigManager> = new Map();

    static getInstance(): PluginConfigRegistry {
        if (!PluginConfigRegistry.instance) {
            PluginConfigRegistry.instance = new PluginConfigRegistry();
        }
        return PluginConfigRegistry.instance;
    }

    register(manager: BasePluginConfigManager): void {
        this.managers.set(manager['pluginName'], manager);
        logger.info(`Plugin configuration manager registered: ${manager['pluginName']}`);
    }

    get(pluginName: string): BasePluginConfigManager | undefined {
        return this.managers.get(pluginName);
    }

    getAll(): Map<string, BasePluginConfigManager> {
        return new Map(this.managers);
    }

    validateAll(): { valid: string[], invalid: string[] } {
        const valid: string[] = [];
        const invalid: string[] = [];

        for (const [name, manager] of this.managers) {
            if (manager['validateConfiguration'](manager.getStandardizedConfig())) {
                valid.push(name);
            } else {
                invalid.push(name);
            }
        }

        return { valid, invalid };
    }

    saveAll(): void {
        for (const [name, manager] of this.managers) {
            try {
                manager.saveConfiguration();
            } catch (error) {
                logger.error(`Failed to save configuration for ${name}`, { error });
            }
        }
    }

    getStandardizedConfigs(): Record<string, StandardizedConfig> {
        const configs: Record<string, StandardizedConfig> = {};

        for (const [name, manager] of this.managers) {
            configs[name] = manager.getStandardizedConfig();
        }

        return configs;
    }
}

// ============================================================================
// CONFIGURATION INITIALIZATION
// ============================================================================

export function initializePluginConfigs(): void {
    const registry = PluginConfigRegistry.getInstance();

    // Register all plugin configuration managers
    registry.register(new TasksPluginConfigManager());
    registry.register(new ExportPluginConfigManager());
    registry.register(new TemplaterPluginConfigManager());

    logger.info('Plugin configuration system initialized', {
        plugins: Array.from(registry.getAll().keys())
    });
}

// Export singleton instance
export const configRegistry = PluginConfigRegistry.getInstance();

export default {
    BasePluginConfigManager,
    TasksPluginConfigManager,
    ExportPluginConfigManager,
    TemplaterPluginConfigManager,
    PluginConfigRegistry,
    initializePluginConfigs,
    configRegistry
};
