#!/usr/bin/env bun

/**
 * 🛡️ YAML Error Handling Demo
 * 
 * Comprehensive demonstration of Bun's YAML error handling capabilities
 * based on official Bun documentation at bun.com/docs/runtime/yaml
 */

export { }; // Make this file a module for top-level await

console.log("🛡️ YAML Error Handling Demo");
console.log("=============================");

// Example 1: Basic Error Handling
console.log("\n❌ Example 1: Basic Error Handling");
console.log("------------------------------------");

try {
    Bun.YAML.parse("invalid: yaml: content:");
} catch (error) {
    console.log("✅ Caught error:", (error as Error).message);
    console.log("   Error type:", (error as Error).constructor.name);
}

// Example 2: Different Types of YAML Errors
console.log("\n🔍 Example 2: Different Types of YAML Errors");
console.log("---------------------------------------------");

const invalidYamlExamples = [
    {
        name: "Invalid syntax",
        yaml: "invalid: yaml: content:",
        description: "Invalid YAML syntax with extra colon"
    },
    {
        name: "Unbalanced brackets",
        yaml: "unbalanced: [1, 2, 3",
        description: "Missing closing bracket"
    },
    {
        name: "Unbalanced braces",
        yaml: "unbalanced: {key: value",
        description: "Missing closing brace"
    },
    {
        name: "Missing quote",
        yaml: 'missing: "unclosed string',
        description: "Unclosed string literal"
    },
    {
        name: "Bad indentation",
        yaml: "bad_indent:\nitem1\n item2",
        description: "Inconsistent indentation"
    },
    {
        name: "Unexpected EOF",
        yaml: "incomplete: ",
        description: "Unexpected end of file"
    }
];

console.log("🧪 Testing different error types:");
invalidYamlExamples.forEach((example, index) => {
    try {
        Bun.YAML.parse(example.yaml);
        console.log(`   ${index + 1}. ❌ Expected error but parsing succeeded`);
    } catch (error) {
        console.log(`   ${index + 1}. ✅ ${example.name}: ${(error as Error).message}`);
    }
});

// Example 3: Error Handling with File Operations
console.log("\n📁 Example 3: Error Handling with File Operations");
console.log("--------------------------------------------------");

async function parseYamlFile(filePath: string): Promise<any> {
    try {
        // Check if file exists
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Read and parse file
        const content = await file.text();
        const data = Bun.YAML.parse(content);

        console.log(`✅ Successfully parsed ${filePath}`);
        return data;
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error(`❌ YAML syntax error in ${filePath}: ${(error as Error).message}`);
        } else if (error instanceof Error) {
            console.error(`❌ File operation error: ${(error as Error).message}`);
        }
        throw error;
    }
}

// Test with existing file
try {
    await parseYamlFile("./env-config.yaml");
} catch (error) {
    // Expected to work
}

// Test with non-existent file
try {
    await parseYamlFile("./non-existent.yaml");
} catch (error) {
    console.log("✅ Properly handled non-existent file error");
}

// Example 4: Validation with Error Handling
console.log("\n✅ Example 4: Validation with Error Handling");
console.log("---------------------------------------------");

interface AppConfig {
    timeout: number;
    retries: number;
    api: {
        url: string;
        key: string;
    };
    logging: {
        level: string;
        pretty: boolean;
    };
}

function validateAndParseConfig(yamlContent: string): AppConfig {
    try {
        const data = Bun.YAML.parse(yamlContent) as AppConfig;

        // Validate required fields
        if (!data.timeout || data.timeout < 1000) {
            throw new Error("Timeout must be at least 1000ms");
        }

        if (!data.api?.url) {
            throw new Error("API URL is required");
        }

        if (!data.api?.key) {
            throw new Error("API key is required");
        }

        if (!data.logging?.level) {
            throw new Error("Log level is required");
        }

        console.log("✅ Configuration validation passed");
        return data;
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error("❌ YAML parsing failed:", (error as Error).message);
        } else if (error instanceof Error) {
            console.error("❌ Validation failed:", (error as Error).message);
        }
        throw error;
    }
}

// Test valid configuration
const validConfig = `
timeout: 5000
retries: 3
api:
  url: https://api.example.com
  key: secret_key
logging:
  level: info
  pretty: false
`;

try {
    validateAndParseConfig(validConfig);
} catch (error) {
    // Should not reach here
}

// Test invalid YAML
const invalidYamlConfig = `
timeout: 5000
retries: 3
api:
  url: https://api.example.com
  key: secret_key
logging:
  level: info
  pretty: false
invalid: yaml: content
`;

try {
    validateAndParseConfig(invalidYamlConfig);
} catch (error) {
    console.log("✅ Properly caught invalid YAML error");
}

// Test invalid configuration
const invalidConfig = `
timeout: 500
retries: 3
api:
  url: https://api.example.com
  key: secret_key
logging:
  level: info
  pretty: false
`;

try {
    validateAndParseConfig(invalidConfig);
} catch (error) {
    console.log("✅ Properly caught validation error");
}

// Example 5: Graceful Error Recovery
console.log("\n🔄 Example 5: Graceful Error Recovery");
console.log("--------------------------------------");

function parseWithFallback<T>(
    yamlContent: string,
    fallback: T,
    validator?: (data: any) => data is T
): T {
    try {
        const data = Bun.YAML.parse(yamlContent);

        if (validator && !validator(data)) {
            console.log("⚠️  Data validation failed, using fallback");
            return fallback;
        }

        console.log("✅ Successfully parsed and validated");
        return data as T;
    } catch (error) {
        console.log(`⚠️  Parsing failed (${(error as Error).message}), using fallback`);
        return fallback;
    }
}

// Define a type guard for our configuration
function isValidConfig(data: any): data is AppConfig {
    return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.timeout === 'number' &&
        typeof data.retries === 'number' &&
        typeof data.api === 'object' &&
        typeof data.api.url === 'string' &&
        typeof data.api.key === 'string' &&
        typeof data.logging === 'object' &&
        typeof data.logging.level === 'string' &&
        typeof data.logging.pretty === 'boolean'
    );
}

const defaultConfig: AppConfig = {
    timeout: 3000,
    retries: 2,
    api: {
        url: "http://localhost:3000",
        key: "default_key"
    },
    logging: {
        level: "warn",
        pretty: true
    }
};

// Test with valid config
const result1 = parseWithFallback(validConfig, defaultConfig, isValidConfig);
console.log("Result 1 timeout:", result1.timeout);

// Test with invalid YAML
const result2 = parseWithFallback(invalidYamlConfig, defaultConfig, isValidConfig);
console.log("Result 2 timeout:", result2.timeout);

// Test with invalid structure
const invalidStructure = `
timeout: "not a number"
retries: 3
api: "should be object"
logging:
  level: info
  pretty: false
`;

const result3 = parseWithFallback(invalidStructure, defaultConfig, isValidConfig);
console.log("Result 3 timeout:", result3.timeout);

// Example 6: Batch Error Handling
console.log("\n📦 Example 6: Batch Error Handling");
console.log("------------------------------------");

interface BatchResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    index: number;
}

function parseBatch<T>(yamlContents: string[], validator?: (data: any) => data is T): BatchResult<T>[] {
    return yamlContents.map((content, index) => {
        try {
            const data = Bun.YAML.parse(content);

            if (validator && !validator(data)) {
                return {
                    success: false,
                    error: "Data validation failed",
                    index
                };
            }

            return {
                success: true,
                data: data as T,
                index
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
                index
            };
        }
    });
}

const batchYaml = [
    validConfig,
    invalidYamlConfig,
    invalidStructure,
    `
timeout: 10000
retries: 5
api:
  url: https://production.api.com
  key: prod_key
logging:
  level: error
  pretty: false
`
];

const batchResults = parseBatch<AppConfig>(batchYaml, isValidConfig);

console.log("📊 Batch processing results:");
batchResults.forEach((result, index) => {
    if (result.success) {
        console.log(`   ${index + 1}. ✅ Success - timeout: ${result.data?.timeout}ms`);
    } else {
        console.log(`   ${index + 1}. ❌ Failed - ${result.error}`);
    }
});

// Example 7: Error Handling with Logging
console.log("\n📝 Example 7: Error Handling with Logging");
console.log("-----------------------------------------");

interface ParseResult {
    success: boolean;
    data?: any;
    error?: {
        type: string;
        message: string;
        timestamp: string;
    };
}

function parseWithLogging(yamlContent: string, source: string = "unknown"): ParseResult {
    const timestamp = new Date().toISOString();

    try {
        const data = Bun.YAML.parse(yamlContent);

        console.log(`[${timestamp}] ✅ Successfully parsed YAML from ${source}`);

        return {
            success: true,
            data
        };
    } catch (error) {
        const errorInfo = {
            type: (error as Error).constructor.name,
            message: (error as Error).message,
            timestamp
        };

        console.error(`[${timestamp}] ❌ Failed to parse YAML from ${source}:`, errorInfo);

        return {
            success: false,
            error: errorInfo
        };
    }
}

// Test logging functionality
const logResults = [
    { content: validConfig, source: "config.yaml" },
    { content: invalidYamlConfig, source: "broken-config.yaml" },
    { content: invalidStructure, source: "malformed.yaml" }
];

logResults.forEach(({ content, source }) => {
    const result = parseWithLogging(content, source);
    // Results are logged in the function
});

// Example 8: Performance with Error Handling
console.log("\n⚡ Example 8: Performance with Error Handling");
console.log("----------------------------------------------");

function benchmarkErrorHandling(iterations: number = 1000) {
    const validYaml = validConfig;
    const invalidYaml = invalidYamlConfig;

    let successCount = 0;
    let errorCount = 0;

    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
        try {
            // Alternate between valid and invalid YAML
            const yaml = i % 2 === 0 ? validYaml : invalidYaml;
            Bun.YAML.parse(yaml);
            successCount++;
        } catch (error) {
            errorCount++;
        }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log("📊 Error handling performance:");
    console.log(`   - Total iterations: ${iterations}`);
    console.log(`   - Successful parses: ${successCount}`);
    console.log(`   - Failed parses: ${errorCount}`);
    console.log(`   - Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   - Average per parse: ${avgTime.toFixed(3)}ms`);
    console.log(`   - Parses per second: Math.round(1000 / avgTime)}`);
}

benchmarkErrorHandling(1000);

console.log("\n✅ YAML Error Handling demonstration complete!");
console.log("💡 Key takeaways:");
console.log("   • Always wrap Bun.YAML.parse() in try/catch blocks");
console.log("   • Use instanceof SyntaxError to detect YAML parsing errors");
console.log("   • Implement validation after successful parsing");
console.log("   • Provide fallbacks for graceful degradation");
console.log("   • Log errors with timestamps and source information");
console.log("   • Handle both parsing errors and validation errors separately");
console.log("   • Use batch processing for multiple YAML documents");
console.log("   • Performance remains excellent even with error handling");
