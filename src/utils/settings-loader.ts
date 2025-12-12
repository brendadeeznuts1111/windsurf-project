#!/usr/bin/env bun

/**
 * 🎛️ Settings Loader - Local Configuration Management
 *
 * Loads and validates settings.local.json with integration to the config manager.
 * Provides type-safe access to local development settings.
 */

import { BunTextLoader } from '../src/utils/bun-text-loader';
import { BunConfigManager, APP_CONFIG_SCHEMA } from '../src/utils/config-manager';
import path from 'node:path';

export interface LocalSettings {
  project: {
    name: string;
    version: string;
    description: string;
    environment: string;
  };
  bun: {
    version: string;
    features: Record<string, boolean>;
  };
  server: {
    host: string;
    port: number;
    protocol: string;
    cors: {
      enabled: boolean;
      origins: string[];
      methods: string[];
      headers: string[];
    };
    compression: {
      enabled: boolean;
      level: number;
    };
    rateLimit: {
      enabled: boolean;
      windowMs: number;
      maxRequests: number;
    };
  };
  dashboard: {
    enabled: boolean;
    port: number;
    autoStart: boolean;
    refreshInterval: number;
    theme: string;
    metrics: {
      retentionHours: number;
      collectionInterval: number;
    };
  };
  textLoader: {
    cache: {
      enabled: boolean;
      maxSize: number;
      ttlMs: number;
    };
    encodings: string[];
    maxFileSize: number;
    allowedExtensions: string[];
  };
  envSync: {
    enabled: boolean;
    excludeKeys: string[];
    transformers: Record<string, boolean>;
    validation: {
      enabled: boolean;
      strict: boolean;
    };
  };
  unixProxy: {
    enabled: boolean;
    cleanupOnExit: boolean;
    connectionTimeout: number;
    maxConnections: number;
    bufferSize: number;
    services: Record<string, {
      host: string;
      port: number;
      enabled: boolean;
    }>;
  };
  workerSystem: {
    enabled: boolean;
    maxWorkers: number;
    workerTimeout: number;
    healthCheckInterval: number;
    spawnConfig: {
      allowedTools: string[];
      defaultTimeout: number;
      maxBufferMB: number;
      maxSpawnsPerMinute: number;
    };
    tensionConfig: {
      enabled: boolean;
      alertThreshold: number;
      circuitBreakerThreshold: number;
      respawnEnabled: boolean;
      maxRespawnAttempts: number;
    };
  };
  tensionEngine: {
    enabled: boolean;
    rules: Record<string, { weight: number; severity: string }>;
    thresholds: Record<string, number>;
    monitoring: {
      enabled: boolean;
      intervalMs: number;
      retentionHours: number;
    };
  };
  security: {
    enabled: boolean;
    validation: {
      enabled: boolean;
      validateToolsOnStartup: boolean;
      auditAllSpawns: boolean;
    };
    sanitization: {
      allowedEnvVars: string[];
      sanitizePath: boolean;
      restrictWorkingDirectory: boolean;
    };
    resourceLimits: {
      maxConcurrentSpawns: number;
      maxTotalSpawnsPerHour: number;
      maxMemoryPerSpawnMB: number;
      maxCpuTimePerSpawnSeconds: number;
    };
    audit: {
      enabled: boolean;
      logFile: string;
      maxLogSizeMB: number;
      retentionDays: number;
    };
  };
  metrics: {
    enabled: boolean;
    collection: {
      intervalMs: number;
      retentionHours: number;
    };
    export: {
      prometheus: {
        enabled: boolean;
        port: number;
        path: string;
      };
      json: {
        enabled: boolean;
        filePath: string;
      };
    };
    alerts: {
      enabled: boolean;
      thresholds: Record<string, number>;
    };
  };
  configManager: {
    enabled: boolean;
    paths: string[];
    hotReload: boolean;
    validation: {
      enabled: boolean;
      strict: boolean;
    };
    environments: Record<string, Record<string, any>>;
  };
  performance: {
    profiling: {
      enabled: boolean;
      cpuProfiling: boolean;
      memoryProfiling: boolean;
      outputDir: string;
    };
    benchmarking: {
      enabled: boolean;
      iterations: number;
      outputDir: string;
    };
    thresholds: Record<string, number>;
  };
  logging: {
    level: string;
    format: string;
    outputs: Array<{
      type: string;
      enabled: boolean;
      path?: string;
      maxSize?: string;
      maxFiles?: number;
    }>;
    categories: Record<string, string>;
  };
  development: {
    hotReload: boolean;
    debugMode: boolean;
    testMode: boolean;
    mockServices: Record<string, boolean>;
    devTools: Record<string, boolean>;
  };
  testing: {
    enabled: boolean;
    timeout: number;
    parallel: boolean;
    coverage: {
      enabled: boolean;
      reporter: string[];
      exclude: string[];
    };
    fixtures: {
      tempDir: string;
      cleanup: boolean;
    };
  };
  deployment: {
    docker: {
      enabled: boolean;
      image: string;
      ports: number[];
      volumes: string[];
    };
    kubernetes: {
      enabled: boolean;
      namespace: string;
      replicas: number;
      resources: {
        requests: Record<string, string>;
        limits: Record<string, string>;
      };
    };
  };
  integrations: {
    azure: {
      enabled: boolean;
      organization: string;
      project: string;
      repository: string;
    };
    claude: {
      enabled: boolean;
      contextFiles: string[];
    };
    monitoring: {
      prometheus: {
        enabled: boolean;
        endpoint: string;
      };
      grafana: {
        enabled: boolean;
        dashboard: string;
      };
    };
  };
  overrides: {
    env: Record<string, string>;
    features: Record<string, boolean>;
  };
}

/**
 * Settings loader with validation and type safety
 */
export class SettingsLoader {
  private static instance: SettingsLoader | null = null;
  private settings: LocalSettings | null = null;
  private configManager: BunConfigManager | null = null;

  private constructor() {}

  static getInstance(): SettingsLoader {
    if (!SettingsLoader.instance) {
      SettingsLoader.instance = new SettingsLoader();
    }
    return SettingsLoader.instance;
  }

  /**
   * Load settings from settings.local.json
   */
  async load(): Promise<LocalSettings> {
    if (this.settings) {
      return this.settings;
    }

    try {
      const settingsPath = './settings.local.json';

      // Load and parse settings file
      const result = await BunTextLoader.load(settingsPath);
      const parsed = JSON.parse(result.content);

      // Validate settings structure
      this.validateSettings(parsed);

      // Apply environment overrides
      this.applyOverrides(parsed);

      this.settings = parsed as LocalSettings;

      // Initialize config manager if enabled
      if (this.settings.configManager.enabled) {
        await this.initializeConfigManager();
      }

      console.log('✅ Local settings loaded successfully');
      return this.settings;

    } catch (error) {
      console.error('❌ Failed to load local settings:', error);
      throw new Error(`Settings loading failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get current settings (loads if not already loaded)
   */
  async get(): Promise<LocalSettings> {
    if (!this.settings) {
      await this.load();
    }
    return this.settings!;
  }

  /**
   * Get specific setting value with type safety
   */
  async getSetting<T = any>(path: string): Promise<T> {
    const settings = await this.get();
    return this.getNestedValue(settings, path) as T;
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(feature: string): Promise<boolean> {
    const features = await this.getSetting('bun.features');
    return features[feature] === true;
  }

  /**
   * Get config manager instance
   */
  getConfigManager(): BunConfigManager | null {
    return this.configManager;
  }

  /**
   * Reload settings
   */
  async reload(): Promise<LocalSettings> {
    this.settings = null;
    this.configManager = null;
    return this.load();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private validateSettings(settings: any): void {
    const requiredFields = [
      'project',
      'bun',
      'server',
      'dashboard',
      'textLoader',
      'envSync',
      'unixProxy',
      'workerSystem',
      'tensionEngine',
      'security',
      'metrics',
      'configManager',
      'performance',
      'logging',
      'development',
      'testing',
      'deployment',
      'integrations',
      'overrides'
    ];

    for (const field of requiredFields) {
      if (!(field in settings)) {
        throw new Error(`Missing required settings field: ${field}`);
      }
    }

    // Validate project info
    if (!settings.project.name || !settings.project.version) {
      throw new Error('Project name and version are required');
    }

    // Validate Bun version compatibility
    if (settings.bun.version !== '1.3.4') {
      console.warn(`⚠️  Settings configured for Bun ${settings.bun.version}, but running Bun 1.3.4`);
    }
  }

  private applyOverrides(settings: any): void {
    // Apply environment overrides
    if (settings.overrides?.env) {
      Object.assign(process.env, settings.overrides.env);
    }

    // Apply feature overrides
    if (settings.overrides?.features) {
      Object.assign(settings.bun.features, settings.overrides.features);
    }

    // Apply environment-specific settings
    const env = settings.project.environment;
    if (settings.configManager.environments?.[env]) {
      this.deepMerge(settings, settings.configManager.environments[env]);
    }
  }

  private async initializeConfigManager(): Promise<void> {
    if (!this.settings) return;

    const configPaths = this.settings.configManager.paths.map(p =>
      path.resolve(p)
    );

    this.configManager = new BunConfigManager({
      paths: configPaths,
      hotReload: this.settings.configManager.hotReload,
      environment: this.settings.project.environment,
    });

    // Load initial configuration
    await this.configManager.load();
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
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
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get settings loader instance
 */
export function getSettingsLoader(): SettingsLoader {
  return SettingsLoader.getInstance();
}

/**
 * Quick settings access
 */
export async function getSettings(): Promise<LocalSettings> {
  return getSettingsLoader().get();
}

/**
 * Check if feature is enabled
 */
export async function isFeatureEnabled(feature: string): Promise<boolean> {
  return getSettingsLoader().isFeatureEnabled(feature);
}

/**
 * Get typed setting value
 */
export async function getSetting<T = any>(path: string): Promise<T> {
  return getSettingsLoader().getSetting<T>(path);
}

/**
 * Initialize settings on module load
 */
let settingsPromise: Promise<LocalSettings> | null = null;

/**
 * Get settings with caching
 */
export function getCachedSettings(): Promise<LocalSettings> {
  if (!settingsPromise) {
    settingsPromise = getSettingsLoader().load();
  }
  return settingsPromise;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * CLI command to validate settings
 */
export async function validateSettingsCommand(): Promise<void> {
  console.log('🔍 Validating local settings...');

  try {
    const loader = getSettingsLoader();
    const settings = await loader.load();

    console.log('✅ Settings validation passed');
    console.log(`📋 Project: ${settings.project.name} v${settings.project.version}`);
    console.log(`🌍 Environment: ${settings.project.environment}`);
    console.log(`🐰 Bun Version: ${settings.bun.version}`);

    const enabledFeatures = Object.entries(settings.bun.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);

    console.log(`✨ Enabled Features: ${enabledFeatures.join(', ')}`);

  } catch (error) {
    console.error('❌ Settings validation failed:', error);
    process.exit(1);
  }
}

/**
 * CLI command to show current settings
 */
export async function showSettingsCommand(): Promise<void> {
  console.log('📋 Current Local Settings:');

  try {
    const settings = await getCachedSettings();
    console.log(JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('❌ Failed to load settings:', error);
    process.exit(1);
  }
}

/**
 * CLI command to reload settings
 */
export async function reloadSettingsCommand(): Promise<void> {
  console.log('🔄 Reloading settings...');

  try {
    const loader = getSettingsLoader();
    await loader.reload();
    console.log('✅ Settings reloaded successfully');
  } catch (error) {
    console.error('❌ Failed to reload settings:', error);
    process.exit(1);
  }
}

// ============================================================================
// INTEGRATION WITH EXISTING SYSTEMS
// ============================================================================

/**
 * Apply settings to global systems
 */
export async function applySettingsToSystems(): Promise<void> {
  const settings = await getCachedSettings();

  // Apply environment variables
  if (settings.overrides?.env) {
    Object.assign(process.env, settings.overrides.env);
  }

  // Configure logging level
  if (settings.logging?.level) {
    process.env.LOG_LEVEL = settings.logging.level;
  }

  // Configure development mode
  if (settings.development?.debugMode) {
    process.env.DEBUG = 'windsurf:*';
  }

  console.log('✅ Settings applied to systems');
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default SettingsLoader;