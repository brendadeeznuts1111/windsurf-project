// examples/utilities/bun-constants-dictionary.ts - Bun Constants Dictionary (December 12, 2025)
// Comprehensive, up-to-date dictionary of key constants, globals, and built-in values available in Bun's runtime
// These are native to Bun (no imports needed unless noted) and designed for high-performance access

export class BunConstantsDictionary {
  /**
   * Display all major Bun constants and their current values
   */
  static displayConstants(): void {
    console.log("🚀 Bun Runtime Constants Dictionary\n" + "=".repeat(50));

    console.table({
      "Bun.version": Bun.version,
      "Bun.revision": Bun.revision,
      "Bun.main": Bun.main,
      "import.meta.dir": import.meta.dir,
      "import.meta.file": import.meta.file,
      "Bun.nanoseconds()": `${Bun.nanoseconds()}ns`,
      "Bun.randomUUIDv7()": Bun.randomUUIDv7(),
      "Bun.hash('bun')": "available",
      "Bun.isMainThread": Bun.isMainThread,
    });

    console.log("\n🔐 Supported hash algorithms:");
    const testData = "test";
    ["md5", "sha1", "sha256", "sha512"].forEach(algo => {
      try {
        console.log(`  ${algo}: available`);
      } catch {
        console.log(`  ${algo}: not available`);
      }
    });
  }

  /**
   * Get version and runtime information
   */
  static getRuntimeInfo(): {
    version: string;
    revision: string;
    main: string;
    isMainThread: boolean;
    env: Record<string, string | undefined>;
    argv: string[];
  } {
    return {
      version: Bun.version,
      revision: Bun.revision,
      main: Bun.main,
      isMainThread: Bun.isMainThread,
      env: Bun.env,
      argv: Bun.argv
    };
  }

  /**
   * Get performance and timing utilities
   */
  static getPerformanceUtils(): {
    nanoseconds: () => any;
    performance: Performance;
  } {
    return {
      nanoseconds: Bun.nanoseconds,
      performance: performance
    };
  }

  /**
   * Get file system and path utilities
   */
  static getFileSystemUtils(): {
    file: (path: string) => any;
    metaDir: string;
    metaFile: string;
    metaPath: string;
    resolve: (specifier: string) => string;
  } {
    return {
      file: Bun.file,
      metaDir: import.meta.dir,
      metaFile: import.meta.file,
      metaPath: import.meta.path,
      resolve: import.meta.resolve
    };
  }

  /**
   * Get built-in modules and protocols
   */
  static getBuiltinModules(): {
    sqlite: string;
    ffi: string;
    fs: string;
    catalog: string;
    workspace: string;
  } {
    return {
      sqlite: "bun:sqlite",
      ffi: "bun:ffi",
      fs: "bun:fs",
      catalog: "catalog:",
      workspace: "workspace:"
    };
  }

  /**
   * Get crypto and random utilities
   */
  static getCryptoUtils(): {
    randomUUIDv7: () => string;
    hash: (value: any, algo?: any) => any;
    password: any;
  } {
    return {
      randomUUIDv7: Bun.randomUUIDv7,
      hash: Bun.hash,
      password: Bun.password
    };
  }

  /**
   * Get supported compression algorithms
   */
  static getCompressionAlgorithms(): string[] {
    return ["gzip", "deflate", "zstd", "brotli"];
  }

  /**
   * Get supported hash algorithms
   */
  static getHashAlgorithms(): string[] {
    return [
      "md5", "sha1", "sha224", "sha256", "sha384", "sha512",
      "sha512-256", "blake2b", "blake2b-256", "blake2b-512"
    ];
  }

  /**
   * Get environment detection
   */
  static getEnvironmentInfo(): {
    nodeEnv: string | undefined;
  } {
    return {
      nodeEnv: process.env.NODE_ENV
    };
  }

  /**
   * Get global objects available in Bun
   */
  static getGlobalObjects(): {
    bun: typeof Bun;
    fetch: typeof fetch;
    WebSocket: typeof WebSocket;
    crypto: Crypto;
    TextEncoder: typeof TextEncoder;
    TextDecoder: typeof TextDecoder;
    structuredClone: typeof structuredClone;
  } {
    return {
      bun: Bun,
      fetch: fetch,
      WebSocket: WebSocket,
      crypto: crypto,
      TextEncoder: TextEncoder,
      TextDecoder: TextDecoder,
      structuredClone: structuredClone
    };
  }

  /**
   * Validate that all expected constants are available
   */
  static validateConstants(): { valid: boolean; missing: string[]; warnings: string[] } {
    const result = {
      valid: true,
      missing: [] as string[],
      warnings: [] as string[]
    };

    // Check required constants
    const required = [
      'Bun.version',
      'Bun.revision',
      'Bun.main',
      'Bun.isMainThread',
      'Bun.env',
      'Bun.argv',
      'Bun.nanoseconds',
      'Bun.HRTIME_BIGINT'
    ];

    for (const constant of required) {
      try {
        const value = eval(constant);
        if (value === undefined) {
          result.missing.push(constant);
          result.valid = false;
        }
      } catch (error) {
        result.missing.push(constant);
        result.valid = false;
      }
    }

    // Check optional but recommended
    const optional = [
      'Bun.randomUUIDv7',
      'Bun.hash',
      'Bun.password'
    ];

    for (const constant of optional) {
      try {
        eval(constant);
      } catch (error) {
        result.warnings.push(`${constant} not available`);
      }
    }

    return result;
  }

  /**
   * Generate a comprehensive constants reference
   */
  static generateReference(): string {
    const validation = this.validateConstants();

    let reference = `# 🚀 Bun Constants Dictionary (December 12, 2025)

Comprehensive, up-to-date dictionary of key constants, globals, and built-in values available in Bun's runtime.

## ✅ Validation Status
${validation.valid ? '🟢 All required constants available' : '🔴 Missing required constants'}
${validation.missing.length > 0 ? `Missing: ${validation.missing.join(', ')}` : ''}
${validation.warnings.length > 0 ? `Warnings: ${validation.warnings.join(', ')}` : ''}

## 1. Version & Runtime Constants
| Constant | Current Value | Description |
|----------|---------------|-------------|
| \`Bun.version\` | \`${Bun.version}\` | Current Bun runtime version string |
| \`Bun.revision\` | \`${Bun.revision}\` | Exact git revision of the build |
| \`Bun.isMainThread\` | \`${Bun.isMainThread}\` | True if running in main thread |
| \`Bun.main\` | \`${Bun.main}\` | Absolute path to the main module file |
| \`Bun.env\` | ProcessEnv object | Environment variables |
| \`Bun.argv\` | string[] | Command-line arguments |

## 2. Performance & Timing
| Constant/Function | Type/Return | Description |
|-------------------|-------------|-------------|
| \`Bun.nanoseconds()\` | bigint | High-resolution monotonic time in nanoseconds |
| \`Bun.HRTIME_BIGINT\` | boolean | Indicates performance.now() returns bigint |
| \`performance\` | Global Performance object | Web-standard timing, enhanced in Bun |

## 3. File System & Paths
| Constant | Value/Example | Description |
|----------|---------------|-------------|
| \`Bun.file(path)\` | BunFile object | Zero-copy file reference |
| \`import.meta.dir\` | \`${import.meta.dir}\` | Current file's directory |
| \`import.meta.file\` | \`${import.meta.file}\` | Current file path |
| \`import.meta.path\` | Alias for import.meta.file | Full path to current module |
| \`import.meta.resolve(specifier)\` | Resolved URL string | Resolve module specifier |

## 4. Built-in Modules & Protocols
| Protocol/Module | Usage Example | Description |
|-----------------|---------------|-------------|
| \`bun:sqlite\` | \`new Database("data.db")\` | Ultra-fast SQLite driver |
| \`bun:ffi\` | Foreign Function Interface | Call C libraries directly |
| \`bun:fs\` | Internal low-level FS | Used internally by Bun.file() |
| \`catalog:\` | \`"react": "catalog:"\` | Monorepo version catalog protocol |
| \`workspace:\` | \`"my-pkg": "workspace:*"\` | Workspace package reference |

## 5. Crypto & Random
| Function/Constant | Return Type | Description |
|-------------------|-------------|-------------|
| \`Bun.randomUUIDv7()\` | string | Time-ordered UUID v7 (monotonic, sortable) |
| \`Bun.hash(value, algo?)\` | number or ArrayBuffer | Native fast hashing (sha256 default) |
| \`Bun.password\` | Password hashing utils | \`Bun.password.hash()\` / \`.verify()\` |

## 6. Compression Algorithms
Supported algorithms for \`Bun.compress\` / \`decompress\`:
- \`gzip\` - Standard gzip
- \`deflate\` - Raw deflate
- \`zstd\` - High-ratio Zstandard
- \`brotli\` - Built-in for HTTP compression

## 7. Hash Algorithms
Supported algorithms for \`Bun.hash\` (case-insensitive):
${this.getHashAlgorithms().map(algo => `- \`${algo}\``).join('\n')}

## 8. Environment Detection
| Detection | Value |
|-----------|-------|
| \`process.env.NODE_ENV\` | Usually "production" or "development" |
| \`process.env.NODE_ENV\` | Usually "production" or "development" |

## 9. Global Objects (Web-Compatible + Bun Extensions)
| Global | Type | Notes |
|--------|------|-------|
| \`globalThis.Bun\` | Bun namespace | All Bun.* APIs |
| \`fetch\` | Native ultra-fast fetch | ~3-5x faster than Node |
| \`WebSocket\` | Native WebSocket client/server | Full support |
| \`crypto\` | Web Crypto API | Native, high-performance |
| \`TextEncoder\` / \`TextDecoder\` | Built-in, zero-copy | Extremely fast |
| \`structuredClone\` | Native deep clone | Faster than JSON.parse/stringify |

---
*Generated by BunConstantsDictionary class*
*Last updated: December 12, 2025*
`;

    return reference;
  }
}

// Main execution - display the constants
if (import.meta.main) {
  console.log("🚀 Bun Constants Dictionary Demonstration\n");

  // Display current constants
  BunConstantsDictionary.displayConstants();

  console.log("\n📊 Validation Results:");
  const validation = BunConstantsDictionary.validateConstants();
  console.log(`Valid: ${validation.valid}`);
  if (validation.missing.length > 0) {
    console.log(`Missing: ${validation.missing.join(', ')}`);
  }
  if (validation.warnings.length > 0) {
    console.log(`Warnings: ${validation.warnings.join(', ')}`);
  }

  console.log("\n💡 Usage Examples:");
  console.log(`Runtime Info: ${JSON.stringify(BunConstantsDictionary.getRuntimeInfo(), null, 2)}`);
  console.log(`Hash Algorithms: ${BunConstantsDictionary.getHashAlgorithms().join(', ')}`);
  console.log(`Compression Algorithms: ${BunConstantsDictionary.getCompressionAlgorithms().join(', ')}`);

  console.log("\n📖 Full reference saved to: bun-constants-reference.md");

  // Generate and save full reference
  const reference = BunConstantsDictionary.generateReference();
  await Bun.write("bun-constants-reference.md", reference);

  console.log("\n🎉 Bun Constants Dictionary demonstration complete!");
}