// YAML configuration loader with Bun v1.3
import { YAML } from "bun";
import { join } from "path";

export class ConfigLoader {
  private config: any = {};
  private environment: string;

  constructor(environment: string = process.env.NODE_ENV || 'development') {
    this.environment = environment;
  }

  /**
   * Load and merge configuration from YAML files
   */
  async load(): Promise<void> {
    // Load base configuration
    const baseConfig = await this.loadYamlFile('config/odds-protocol.yaml');
    
    // Load environment-specific configuration
    const envConfig = await this.loadYamlFile(`config/odds-protocol.${this.environment}.yaml`);
    
    // Merge configurations
    this.config = this.deepMerge(baseConfig, envConfig);
    
    // Apply environment variable substitutions
    this.applyEnvironmentSubstitutions();
    
    console.log(`✅ Configuration loaded for environment: ${this.environment}`);
  }

  private async loadYamlFile(filePath: string): Promise<any> {
    try {
      const fullPath = join(process.cwd(), filePath);
      const file = Bun.file(fullPath);
      
      if (await file.exists()) {
        const content = await file.text();
        return YAML.parse(content);
      }
      
      return {};
    } catch (error) {
      console.warn(`⚠️ Could not load config file: ${filePath}`, error);
      return {};
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private applyEnvironmentSubstitutions(): void {
    const substitute = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/\$\{([^}]+)\}/g, (match, envVar) => {
          return process.env[envVar] || match;
        });
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => substitute(item));
      }
      
      if (obj instanceof Object) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = substitute(value);
        }
        return result;
      }
      
      return obj;
    };

    this.config = substitute(this.config);
  }

  /**
   * Get configuration value by path
   */
  get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let current: any = this.config;
    
    for (const key of keys) {
      if (current?.[key] === undefined) {
        return defaultValue as T;
      }
      current = current[key];
    }
    
    return current as T;
  }

  /**
   * Get entire configuration object
   */
  getAll(): any {
    return this.config;
  }
}

// Singleton instance
export const configLoader = new ConfigLoader();
