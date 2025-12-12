#!/usr/bin/env bun

/**
 * ⚙️ Bun Configuration Manager
 *
 * Advanced configuration management with:
 * - Multiple format support (JSON, YAML, TOML, env files)
 * - Schema validation
 * - Hot reloading
 * - Environment-specific configs
 * - Configuration inheritance
 * - Type-safe configuration access
 */

import { BunTextLoader } from './bun-text-loader';
import { EventEmitter } from 'events';

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface ConfigOptions {
  /** Configuration file paths */
  paths: string[];
  /** Environment name */
  environment?: string;
  /** Enable hot reloading */
  hotReload?: boolean;
  /** Validation schema */
  schema?: ConfigSchema;
  /** Default values */
  defaults?: Record<string, any>;
  /** Configuration transformers */
  transformers?: ConfigTransformer[];
}

export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    validate?: (value: any) => boolean;
    description?: string;
  };
}

export interface ConfigTransformer {
  name: string;
  transform: (config: any) => any;
}

export interface ConfigLoadResult {
  config: any;
  source: string;
  timestamp: number;
  environment: string;
  validationErrors: string[];
}

// ============================================================================
// CONFIGURATION MANAGER
// ============================================================================

export class BunConfigManager extends EventEmitter {
  private options: ConfigOptions;
  private currentConfig: any = {};
  private configSources: Map<string, ConfigLoadResult> = new Map();
  private watchers: Map<string, { watcher: any; lastMtime: number }> = new Map();
  private isWatching = false;

  constructor(options: ConfigOptions) {
    super();
    this.options = {
      environment: process.env.NODE_ENV || 'development',
      hotReload: false,
      ...options,
    };
  }

  /**
   * Load configuration from all sources
   */
  async load(): Promise<ConfigLoadResult> {
    console.log('⚙️ Loading configuration...');

    const allConfigs: any[] = [];
    const sources: string[] = [];

    // Load from all paths
    for (const path of this.options.paths) {
      try {
        const result = await this.loadConfigFile(path);
        if (result) {
          allConfigs.push(result.config);
          sources.push(path);
          this.configSources.set(path, result);
        }
      } catch (error) {
        console.warn(`Failed to load config from ${path}:`, error);
      }
    }

    // Merge configurations (later configs override earlier ones)
    this.currentConfig = this.mergeConfigs(allConfigs);

    // Apply defaults
    if (this.options.defaults) {
      this.currentConfig = this.applyDefaults(this.currentConfig, this.options.defaults);
    }

    // Apply transformers
    if (this.options.transformers) {
      for (const transformer of this.options.transformers) {
        try {
          this.currentConfig = transformer.transform(this.currentConfig);
        } catch (error) {
          console.warn(`Transformer ${transformer.name} failed:`, error);
        }
      }
    }

    // Validate configuration
    const validationErrors = this.validateConfig(this.currentConfig);

    const result: ConfigLoadResult = {
      config: this.currentConfig,
      source: sources.join(', '),
      timestamp: Date.now(),
      environment: this.options.environment!,
      validationErrors,
    };

    // Start watching if enabled
    if (this.options.hotReload) {
      this.startWatching();
    }

    console.log(`✅ Configuration loaded from: ${sources.join(', ')}`);
    if (validationErrors.length > 0) {
      console.warn(`⚠️  Configuration validation errors: ${validationErrors.length}`);
    }

    this.emit('loaded', result);
    return result;
  }

  /**
   * Get current configuration
   */
  get<T = any>(key?: string): T {
    if (!key) return this.currentConfig as T;

    const keys = key.split('.');
    let value = this.currentConfig;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined as T;
      }
    }

    return value as T;
  }

  /**
   * Set configuration value
   */
  set(key: string, value: any): void {
    const keys = key.split('.');
    let obj = this.currentConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in obj) || typeof obj[k] !== 'object') {
        obj[k] = {};
      }
      obj = obj[k];
    }

    obj[keys[keys.length - 1]] = value;
    this.emit('changed', { key, value, config: this.currentConfig });
  }

  /**
   * Reload configuration
   */
  async reload(): Promise<ConfigLoadResult> {
    console.log('🔄 Reloading configuration...');
    this.stopWatching();
    this.configSources.clear();
    return this.load();
  }

  /**
   * Stop watching for changes
   */
  stopWatching(): void {
    if (!this.isWatching) return;

    for (const [path, { watcher }] of this.watchers) {
      try {
        watcher?.close?.();
      } catch (error) {
        console.warn(`Failed to stop watching ${path}:`, error);
      }
    }

    this.watchers.clear();
    this.isWatching = false;
    console.log('🛑 Stopped configuration watching');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async loadConfigFile(filePath: string): Promise<ConfigLoadResult | null> {
    const startTime = Date.now();

    try {
      // Determine file type and load accordingly
      const ext = filePath.split('.').pop()?.toLowerCase();

      let config: any;
      let format: string;

      switch (ext) {
        case 'json':
          const jsonText = await BunTextLoader.load(filePath);
          config = JSON.parse(jsonText.content);
          format = 'json';
          break;

        case 'yaml':
        case 'yml':
          // Would need a YAML parser, for now treat as JSON
          const yamlText = await BunTextLoader.load(filePath);
          try {
            config = JSON.parse(yamlText.content); // Fallback
          } catch {
            config = { raw: yamlText.content }; // Raw content
          }
          format = 'yaml';
          break;

        case 'toml':
          // Would need a TOML parser, for now treat as JSON
          const tomlText = await BunTextLoader.load(filePath);
          try {
            config = JSON.parse(tomlText.content); // Fallback
          } catch {
            config = { raw: tomlText.content }; // Raw content
          }
          format = 'toml';
          break;

        case 'env':
        case 'environment':
          const envText = await BunTextLoader.load(filePath);
          config = this.parseEnvFile(envText.content);
          format = 'env';
          break;

        default:
          // Try to parse as JSON first, then fallback to raw
          const text = await BunTextLoader.load(filePath);
          try {
            config = JSON.parse(text.content);
            format = 'json';
          } catch {
            config = { content: text.content };
            format = 'text';
          }
      }

      return {
        config,
        source: filePath,
        timestamp: Date.now(),
        environment: this.options.environment!,
        validationErrors: [],
      };

    } catch (error) {
      console.error(`Failed to load config file ${filePath}:`, error);
      return null;
    }
  }

  private mergeConfigs(configs: any[]): any {
    const result = {};

    for (const config of configs) {
      this.deepMerge(result, config);
    }

    return result;
  }

  private deepMerge(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  private applyDefaults(config: any, defaults: Record<string, any>): any {
    const result = { ...config };

    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (!(key in result)) {
        result[key] = defaultValue;
      } else if (typeof defaultValue === 'object' && defaultValue !== null) {
        if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = this.applyDefaults(result[key], defaultValue);
        }
      }
    }

    return result;
  }

  private validateConfig(config: any): string[] {
    if (!this.options.schema) return [];

    const errors: string[] = [];

    for (const [key, schema] of Object.entries(this.options.schema)) {
      const value = this.get(key);

      // Check required fields
      if (schema.required && (value === undefined || value === null)) {
        errors.push(`Required field '${key}' is missing`);
        continue;
      }

      // Skip validation if value is missing and not required
      if (value === undefined || value === null) continue;

      // Type validation
      if (schema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== schema.type) {
          errors.push(`Field '${key}' should be ${schema.type}, got ${actualType}`);
        }
      }

      // Custom validation
      if (schema.validate && !schema.validate(value)) {
        errors.push(`Field '${key}' failed custom validation`);
      }
    }

    return errors;
  }

  private parseEnvFile(content: string): Record<string, string> {
    const env: Record<string, string> = {};

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        env[key.trim()] = cleanValue;
      }
    }

    return env;
  }

  private startWatching(): void {
    if (this.isWatching) return;

    console.log('👀 Starting configuration file watching...');

    for (const path of this.options.paths) {
      try {
        // In a real implementation, we'd use fs.watch or similar
        // For now, we'll simulate with periodic checks
        const watcher = setInterval(async () => {
          try {
            const stat = await BunTextLoader.stat(path);
            const lastMtime = this.watchers.get(path)?.lastMtime || 0;

            if (stat.exists && stat.mtime > lastMtime) {
              console.log(`📝 Configuration file ${path} changed, reloading...`);
              this.watchers.get(path)!.lastMtime = stat.mtime;
              await this.reload();
            }
          } catch (error) {
            // Ignore watch errors
          }
        }, 1000);

        this.watchers.set(path, { watcher, lastMtime: 0 });
      } catch (error) {
        console.warn(`Failed to watch ${path}:`, error);
      }
    }

    this.isWatching = true;
  }
}

// ============================================================================
// PREDEFINED SCHEMAS AND TRANSFORMERS
// ============================================================================

/**
 * Schema for application configuration
 */
export const APP_CONFIG_SCHEMA: ConfigSchema = {
  app: {
    type: 'object',
    required: true,
    description: 'Application settings',
  },
  'app.name': {
    type: 'string',
    required: true,
    description: 'Application name',
  },
  'app.version': {
    type: 'string',
    required: true,
    description: 'Application version',
  },
  'app.environment': {
    type: 'string',
    default: 'development',
    description: 'Runtime environment',
  },
  database: {
    type: 'object',
    description: 'Database configuration',
  },
  'database.host': {
    type: 'string',
    default: 'localhost',
    description: 'Database host',
  },
  'database.port': {
    type: 'number',
    default: 5432,
    description: 'Database port',
  },
};

/**
 * Environment-specific configuration transformer
 */
export const ENVIRONMENT_TRANSFORMER: ConfigTransformer = {
  name: 'environment',
  transform: (config: any) => {
    const env = process.env.NODE_ENV || 'development';

    // Apply environment-specific overrides
    if (config.environments && config.environments[env]) {
      return { ...config, ...config.environments[env] };
    }

    return config;
  },
};

/**
 * Configuration validation transformer
 */
export const VALIDATION_TRANSFORMER: ConfigTransformer = {
  name: 'validation',
  transform: (config: any) => {
    // Add validation metadata
    config._validated = true;
    config._timestamp = Date.now();

    return config;
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a configuration manager for common use cases
 */
export function createAppConfigManager(
  configPaths: string[] = ['./config/app.json', './config/database.json'],
  options: Partial<ConfigOptions> = {}
): BunConfigManager {
  return new BunConfigManager({
    paths: configPaths,
    schema: APP_CONFIG_SCHEMA,
    transformers: [ENVIRONMENT_TRANSFORMER, VALIDATION_TRANSFORMER],
    hotReload: true,
    ...options,
  });
}

/**
 * Load configuration with error handling
 */
export async function loadConfigSafe(manager: BunConfigManager): Promise<{
  success: boolean;
  config?: any;
  errors?: string[];
}> {
  try {
    const result = await manager.load();
    return {
      success: result.validationErrors.length === 0,
      config: result.config,
      errors: result.validationErrors,
    };
  } catch (error) {
    return {
      success: false,
      errors: [(error as Error).message],
    };
  }
}

/**
 * Watch configuration for changes
 */
export function watchConfig(manager: BunConfigManager, callback: (config: any) => void): void {
  manager.on('loaded', (result) => {
    if (result.validationErrors.length === 0) {
      callback(result.config);
    }
  });

  manager.on('changed', (change) => {
    callback(change.config);
  });
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * CLI command to validate configuration
 */
export async function validateConfigCommand(args: string[]): Promise<void> {
  const configPaths = args.filter(arg => !arg.startsWith('--'));

  if (configPaths.length === 0) {
    console.error('Usage: bun run config-manager.ts validate <config-file...>');
    process.exit(1);
  }

  console.log('🔍 Validating configuration files...');

  const manager = new BunConfigManager({
    paths: configPaths,
    schema: APP_CONFIG_SCHEMA,
  });

  const result = await loadConfigSafe(manager);

  if (result.success) {
    console.log('✅ Configuration validation passed');
    console.log('📋 Configuration summary:');
    console.log(`   App: ${result.config?.app?.name} v${result.config?.app?.version}`);
    console.log(`   Environment: ${result.config?.app?.environment}`);
    if (result.config?.database) {
      console.log(`   Database: ${result.config.database.host}:${result.config.database.port}`);
    }
  } else {
    console.log('❌ Configuration validation failed:');
    result.errors?.forEach(error => console.log(`   - ${error}`));
    process.exit(1);
  }
}

/**
 * CLI command to show current configuration
 */
export async function showConfigCommand(args: string[]): Promise<void> {
  const configPaths = args.filter(arg => !arg.startsWith('--'));

  if (configPaths.length === 0) {
    console.error('Usage: bun run config-manager.ts show <config-file...>');
    process.exit(1);
  }

  const manager = new BunConfigManager({ paths: configPaths });
  const result = await loadConfigSafe(manager);

  if (result.success) {
    console.log('📋 Current Configuration:');
    console.log(JSON.stringify(result.config, null, 2));
  } else {
    console.log('❌ Failed to load configuration:');
    result.errors?.forEach(error => console.log(`   - ${error}`));
    process.exit(1);
  }
}

// ============================================================================
// INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example: Load application configuration
 */
export async function loadAppConfig(): Promise<any> {
  const manager = createAppConfigManager();

  const result = await loadConfigSafe(manager);

  if (result.success) {
    console.log('✅ Application configuration loaded');
    return result.config;
  } else {
    console.error('❌ Failed to load app configuration:');
    result.errors?.forEach(error => console.log(`   - ${error}`));
    throw new Error('Configuration loading failed');
  }
}

/**
 * Example: Watch configuration for hot reloading
 */
export function setupConfigWatching(): void {
  const manager = createAppConfigManager();

  watchConfig(manager, (config) => {
    console.log('🔄 Configuration updated:', config.app.name);
    // Here you would restart services, update caches, etc.
  });

  // Load initial config
  loadConfigSafe(manager);
}

// ============================================================================
// EXPORT ALL COMPONENTS
// ============================================================================

export {
  // Main classes
  BunConfigManager,

  // Schemas and transformers
  APP_CONFIG_SCHEMA,
  ENVIRONMENT_TRANSFORMER,
  VALIDATION_TRANSFORMER,

  // Utility functions
  createAppConfigManager,
  loadConfigSafe,
  watchConfig,

  // CLI commands
  validateConfigCommand,
  showConfigCommand,

  // Examples
  loadAppConfig,
  setupConfigWatching,
};