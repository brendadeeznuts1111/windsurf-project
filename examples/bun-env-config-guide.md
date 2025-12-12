# Bun Environment & Config Guide

> Environment variables, configuration files, and runtime detection with Bun

Bun provides powerful environment and configuration management with support for `.env` files, `bunfig.toml`, and runtime environment detection.

## Environment Variables

### Reading Environment Variables

```typescript
// Basic environment variable access
const port = process.env.PORT || "3000";
const nodeEnv = process.env.NODE_ENV || "development";

// Bun-specific environment detection
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";
```

### .env File Support

Bun automatically loads `.env` files in the following order:

1. `.env.local` (highest priority, gitignored)
2. `.env.development`, `.env.test`, `.env.production` (based on NODE_ENV)
3. `.env` (fallback)

```bash
# .env
DATABASE_URL=postgresql://localhost:5432/myapp
API_KEY=sk-1234567890abcdef
DEBUG=true

# .env.local (overrides .env)
DATABASE_URL=postgresql://localhost:5432/myapp_dev
```

```typescript
// Access environment variables
console.log(process.env.DATABASE_URL); // postgresql://localhost:5432/myapp_dev
console.log(process.env.API_KEY);      // sk-1234567890abcdef
console.log(process.env.DEBUG);        // true
```

### Environment Variable Types

```typescript
// String values
const apiUrl = process.env.API_URL!;

// Boolean conversion
const debug = process.env.DEBUG === "true";
const verbose = process.env.VERBOSE === "1";

// Number conversion
const port = parseInt(process.env.PORT || "3000");
const timeout = parseFloat(process.env.TIMEOUT || "5.0");

// JSON parsing
const config = JSON.parse(process.env.CONFIG || "{}");

// Array parsing
const allowedHosts = (process.env.ALLOWED_HOSTS || "").split(",");
```

## bunfig.toml Configuration

Bun uses `bunfig.toml` for project-wide configuration. This file supports TOML syntax and allows you to configure various Bun behaviors.

### Basic Configuration

```toml
# bunfig.toml
[install]
# Package manager settings
registry = "https://registry.npmjs.org"
saveTextLockfile = true
cacheDir = "./node_modules/.cache"

[run]
# Runtime settings
hot = false
port = "3000"
envFile = ".env.production"

[build]
# Build settings
outdir = "./dist"
minify = true
sourcemap = "linked"
```

### Advanced Configuration

```toml
# Complete bunfig.toml example
[install]
# Registry and authentication
registry = "https://registry.npmjs.org"
token = "npm_XXXXXXXXXXXXXXXXXXXX"
saveTextLockfile = true
cacheDir = "./node_modules/.cache"

# Dependency management
production = false
frozenLockfile = false
lockfileOnly = false

[install.scopes]
# Scoped registry configuration
"@myorg" = { url = "https://npm.pkg.github.com", token = "github_XXXXXXXXXXXXXXXXXXXX" }

[run]
# Development server settings
hot = true
port = "3000"
hostname = "0.0.0.0"
envFile = ".env.local"

[build]
# Bundler configuration
outdir = "./dist"
root = "./src"
target = "browser"
minify = true
minifySyntax = true
minifyWhitespace = true
minifyIdentifiers = true
sourcemap = "linked"
splitting = true
publicPath = "/assets/"

# External dependencies
external = ["react", "react-dom"]

# Define global constants
[build.define]
"process.env.NODE_ENV" = "\"production\""
"__VERSION__" = "\"1.0.0\""
"__BUILD_TIME__" = "\"2024-01-01T00:00:00Z\""

# Loader configuration
[build.loaders]
".png" = "file"
".jpg" = "file"
".svg" = "dataurl"
".css" = "text"
".toml" = "toml"
".json" = "json"

# Plugin configuration
[build.plugins]
# Plugin settings would go here

[test]
# Test runner configuration
timeout = 5000
grep = ""
bail = false
coverage = false
coverageReporters = ["text", "html"]
coverageDirectory = "coverage"

# Environment setup
[test.setup]
files = ["./test/setup.ts"]

# Test patterns
[test.include]
patterns = ["**/*.test.ts", "**/*.spec.ts"]
ignore = ["node_modules/**", "dist/**"]
```

## Runtime Environment Detection

### Platform Detection

```typescript
// Operating system detection
const isWindows = process.platform === "win32";
const isMacOS = process.platform === "darwin";
const isLinux = process.platform === "linux";
const isFreeBSD = process.platform === "freebsd";

// Architecture detection
const isX64 = process.arch === "x64";
const isArm64 = process.arch === "arm64";
const isIA32 = process.arch === "ia32";

// Runtime detection
const isBun = typeof Bun !== "undefined";
const isNode = typeof global !== "undefined" && !isBun;
const isDeno = typeof Deno !== "undefined";
```

### Conditional Logic

```typescript
// Platform-specific imports
let fs: any;
if (isBun) {
  // Use Bun's native file API
  fs = { readFile: Bun.file };
} else if (isNode) {
  // Use Node.js fs module
  const { readFileSync } = require("fs");
  fs = { readFile: (path: string) => readFileSync(path, "utf8") };
}

// Environment-specific configuration
const config = {
  database: {
    host: isProduction ? "prod-db.example.com" : "localhost",
    port: isProduction ? 5432 : 5433,
  },
  cache: {
    enabled: !isTest,
    ttl: isDevelopment ? 60 : 3600,
  },
};
```

## Configuration Management

### Configuration Classes

```typescript
// config.ts
export class Config {
  private static instance: Config;
  private data: Record<string, any> = {};

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  load() {
    // Load from environment variables
    this.data.port = parseInt(process.env.PORT || "3000");
    this.data.databaseUrl = process.env.DATABASE_URL;
    this.data.apiKey = process.env.API_KEY;

    // Load from JSON config file
    try {
      const configFile = Bun.file("config.json");
      if (configFile.exists) {
        const configData = JSON.parse(await configFile.text());
        this.data = { ...this.data, ...configData };
      }
    } catch (error) {
      console.warn("Could not load config.json:", error);
    }

    // Environment-specific overrides
    if (isDevelopment) {
      this.data.debug = true;
      this.data.logLevel = "debug";
    } else if (isProduction) {
      this.data.debug = false;
      this.data.logLevel = "error";
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    return this.data[key] ?? defaultValue;
  }

  set(key: string, value: any) {
    this.data[key] = value;
  }
}

// Usage
const config = Config.getInstance();
config.load();

const port = config.get("port", 3000);
const dbUrl = config.get("databaseUrl");
```

### Validation

```typescript
// config-validation.ts
import { z } from "zod";

const configSchema = z.object({
  port: z.number().int().min(1).max(65535),
  databaseUrl: z.string().url(),
  apiKey: z.string().min(10),
  debug: z.boolean(),
  logLevel: z.enum(["debug", "info", "warn", "error"]),
});

export function validateConfig(config: any) {
  try {
    return configSchema.parse(config);
  } catch (error) {
    console.error("Configuration validation failed:", error.errors);
    throw error;
  }
}

// Usage
const config = Config.getInstance();
config.load();
const validatedConfig = validateConfig(config.data);
```

## Development vs Production

### Development Configuration

```typescript
// dev.config.ts
export const devConfig = {
  debug: true,
  logLevel: "debug",
  hotReload: true,
  cors: {
    origin: "*",
    credentials: true,
  },
  database: {
    logging: true,
    synchronize: true,
  },
};
```

### Production Configuration

```typescript
// prod.config.ts
export const prodConfig = {
  debug: false,
  logLevel: "error",
  hotReload: false,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
    credentials: false,
  },
  database: {
    logging: false,
    synchronize: false,
  },
};
```

### Configuration Merging

```typescript
// config/index.ts
import { devConfig } from "./dev.config";
import { prodConfig } from "./prod.config";

const baseConfig = {
  appName: "MyApp",
  version: process.env.npm_package_version || "1.0.0",
};

const envConfig = isProduction ? prodConfig : devConfig;

export const config = {
  ...baseConfig,
  ...envConfig,
  // Environment variables override
  port: parseInt(process.env.PORT || "3000"),
  databaseUrl: process.env.DATABASE_URL,
};
```

## Environment-Specific Files

### Multiple Environment Files

```bash
# Directory structure
.env
.env.local
.env.development
.env.test
.env.production
.env.ci
```

```typescript
// Load environment-specific config
function loadEnvConfig() {
  const env = process.env.NODE_ENV || "development";
  const envFiles = [
    ".env",
    `.env.${env}`,
    ".env.local",
  ];

  for (const file of envFiles) {
    try {
      const content = await Bun.file(file).text();
      // Parse and load environment variables
      // (Bun automatically handles this, but you can add custom logic)
    } catch {
      // File doesn't exist, continue
    }
  }
}
```

### TOML Configuration Files

```typescript
// config.toml
[app]
name = "MyApp"
version = "1.0.0"

[database]
host = "localhost"
port = 5432
name = "myapp"

[api]
baseUrl = "https://api.example.com"
timeout = 5000
```

```typescript
// Load TOML config
import { parse } from "toml";

export async function loadTomlConfig() {
  const content = await Bun.file("config.toml").text();
  return parse(content);
}

// Usage
const config = await loadTomlConfig();
console.log(config.app.name); // "MyApp"
```

## Security Considerations

### Sensitive Data

```typescript
// Never commit sensitive data
// ❌ Bad
const apiKey = "sk-1234567890abcdef";

// ✅ Good - Use environment variables
const apiKey = process.env.API_KEY;

// ✅ Better - Validate required environment variables
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

const apiKey = requireEnv("API_KEY");
```

### Configuration Validation

```typescript
// Validate configuration on startup
function validateEnvironment() {
  const required = ["DATABASE_URL", "API_KEY", "JWT_SECRET"];

  for (const env of required) {
    if (!process.env[env]) {
      console.error(`Missing required environment variable: ${env}`);
      process.exit(1);
    }
  }

  // Validate formats
  const port = parseInt(process.env.PORT || "3000");
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error("Invalid PORT environment variable");
    process.exit(1);
  }
}

// Call at application startup
validateEnvironment();
```

## Best Practices

### Configuration Organization

1. **Use `.env.local` for local overrides** (add to `.gitignore`)
2. **Validate configuration on startup**
3. **Use typed configurations** with validation
4. **Separate concerns** (database, API, logging, etc.)
5. **Document required environment variables**

### Environment Variable Naming

```bash
# Good naming conventions
DATABASE_URL=postgresql://localhost:5432/myapp
REDIS_URL=redis://localhost:6379
API_BASE_URL=https://api.example.com
JWT_SECRET=your-secret-key
DEBUG=true
LOG_LEVEL=info
PORT=3000
```

### Configuration Loading Order

1. **Default values** (hardcoded fallbacks)
2. **Configuration files** (TOML, JSON, etc.)
3. **Environment variables** (highest priority)
4. **Runtime overrides** (command line arguments)

This guide covers Bun's comprehensive environment and configuration management. For runtime APIs and deployment, see the related guides.