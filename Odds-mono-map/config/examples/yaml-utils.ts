/**
 * 🛠️ YAML Utilities Library
 * 
 * Comprehensive YAML parsing utilities with error handling,
 * validation, and TypeScript type safety based on Bun's YAML runtime.
 */

export { }; // Make this file a module

// Type definitions for parse results
export interface ParseResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    type?: "SyntaxError" | "ValidationError" | "FileError" | "Unknown";
    source?: string;
    timestamp?: string;
}

export interface BatchParseResult<T = any> {
    total: number;
    successful: number;
    failed: number;
    results: ParseResult<T>[];
    summary: {
        errors: string[];
        sources: string[];
    };
}

export interface ValidationRule<T = any> {
    name: string;
    validate: (data: T) => boolean | string;
    required?: boolean;
}

/**
 * ✅ Core safe parsing function with comprehensive error handling
 */
export function parseYamlSafely<T = any>(
    yamlContent: string,
    source: string = "unknown"
): ParseResult<T> {
    const timestamp = new Date().toISOString();

    try {
        const data = Bun.YAML.parse(yamlContent) as T;

        return {
            success: true,
            data,
            source,
            timestamp
        };
    } catch (error) {
        if (error instanceof SyntaxError) {
            return {
                success: false,
                error: (error as Error).message,
                type: "SyntaxError",
                source,
                timestamp
            };
        }

        return {
            success: false,
            error: (error as Error).message,
            type: "Unknown",
            source,
            timestamp
        };
    }
}

/**
 * 📁 Parse YAML file with file operation error handling
 */
export async function parseYamlFile<T = any>(
    filePath: string
): Promise<ParseResult<T>> {
    const timestamp = new Date().toISOString();

    try {
        // Check if file exists
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
            return {
                success: false,
                error: `File not found: ${filePath}`,
                type: "FileError",
                source: filePath,
                timestamp
            };
        }

        // Read and parse file
        const content = await file.text();
        return parseYamlSafely<T>(content, filePath);

    } catch (error) {
        if (error instanceof SyntaxError) {
            return {
                success: false,
                error: `YAML syntax error in ${filePath}: ${(error as Error).message}`,
                type: "SyntaxError",
                source: filePath,
                timestamp
            };
        } else if (error instanceof Error) {
            return {
                success: false,
                error: `File operation error: ${(error as Error).message}`,
                type: "FileError",
                source: filePath,
                timestamp
            };
        }

        return {
            success: false,
            error: `Unknown error: ${(error as Error).message}`,
            type: "Unknown",
            source: filePath,
            timestamp
        };
    }
}

/**
 * ✅ Parse with validation rules
 */
export function parseYamlWithValidation<T = any>(
    yamlContent: string,
    validationRules: ValidationRule<T>[],
    source: string = "unknown"
): ParseResult<T> {
    // First, parse the YAML
    const parseResult = parseYamlSafely<T>(yamlContent, source);

    if (!parseResult.success) {
        return parseResult;
    }

    // Then validate the parsed data
    for (const rule of validationRules) {
        try {
            const result = rule.validate(parseResult.data!);

            if (result === false) {
                return {
                    success: false,
                    error: `Validation failed: ${rule.name}`,
                    type: "ValidationError",
                    source,
                    timestamp: parseResult.timestamp
                };
            }

            if (typeof result === "string") {
                return {
                    success: false,
                    error: `Validation failed: ${rule.name} - ${result}`,
                    type: "ValidationError",
                    source,
                    timestamp: parseResult.timestamp
                };
            }
        } catch (error) {
            return {
                success: false,
                error: `Validation error: ${rule.name} - ${(error as Error).message}`,
                type: "ValidationError",
                source,
                timestamp: parseResult.timestamp
            };
        }
    }

    return parseResult;
}

/**
 * 🔄 Parse with graceful fallback
 */
export function parseYamlWithFallback<T = any>(
    yamlContent: string,
    fallback: T,
    validationRules?: ValidationRule<T>[],
    source: string = "unknown"
): T {
    let result: ParseResult<T>;

    if (validationRules) {
        result = parseYamlWithValidation<T>(yamlContent, validationRules, source);
    } else {
        result = parseYamlSafely<T>(yamlContent, source);
    }

    if (result.success) {
        console.log(`✅ Successfully parsed YAML from ${source}`);
        return result.data!;
    } else {
        console.log(`⚠️  Parsing failed (${result.error}), using fallback`);
        return fallback;
    }
}

/**
 * 📦 Batch processing with comprehensive error tracking
 */
export function parseYamlBatch<T = any>(
    yamlContents: Array<{ content: string; source?: string }>,
    validationRules?: ValidationRule<T>[]
): BatchParseResult<T> {
    const results: ParseResult<T>[] = [];
    const errors: string[] = [];
    const sources: string[] = [];

    for (const item of yamlContents) {
        const source = item.source || "batch-item-" + results.length;
        sources.push(source);

        let result: ParseResult<T>;

        if (validationRules) {
            result = parseYamlWithValidation<T>(item.content, validationRules, source);
        } else {
            result = parseYamlSafely<T>(item.content, source);
        }

        results.push(result);

        if (!result.success) {
            errors.push(`${source}: ${result.error}`);
        }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
        total: results.length,
        successful,
        failed,
        results,
        summary: {
            errors,
            sources
        }
    };
}

/**
 * 📝 Parse with detailed logging
 */
export function parseYamlWithLogging<T = any>(
    yamlContent: string,
    source: string = "unknown",
    logLevel: "error" | "info" | "debug" = "info"
): ParseResult<T> {
    const result = parseYamlSafely<T>(yamlContent, source);

    const timestamp = result.timestamp || new Date().toISOString();

    if (result.success) {
        if (logLevel === "debug") {
            console.log(`[${timestamp}] ✅ Successfully parsed YAML from ${source}`);
        }
    } else {
        console.error(`[${timestamp}] ❌ Failed to parse YAML from ${source}:`, {
            error: result.error,
            type: result.type,
            source
        });
    }

    return result;
}

/**
 * 🎯 Type guard utilities
 */
export function isValidConfig<T = any>(
    data: any,
    validator: (data: any) => data is T
): data is T {
    return validator(data);
}

/**
 * 🔧 Helper function to get nested values
 */
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * 📊 Common validation rules
 */
export const commonValidationRules = {
    requiredString: (field: string): ValidationRule => ({
        name: `Required string: ${field}`,
        validate: (data: any) => {
            const value = getNestedValue(data, field);
            return typeof value === "string" && value.trim().length > 0;
        }
    }),

    requiredNumber: (field: string, min?: number): ValidationRule => ({
        name: `Required number: ${field}`,
        validate: (data: any) => {
            const value = getNestedValue(data, field);
            if (typeof value !== "number") return false;
            if (min !== undefined && value < min) return false;
            return true;
        }
    }),

    requiredBoolean: (field: string): ValidationRule => ({
        name: `Required boolean: ${field}`,
        validate: (data: any) => typeof getNestedValue(data, field) === "boolean"
    }),

    requiredArray: (field: string): ValidationRule => ({
        name: `Required array: ${field}`,
        validate: (data: any) => Array.isArray(getNestedValue(data, field))
    }),

    requiredObject: (field: string): ValidationRule => ({
        name: `Required object: ${field}`,
        validate: (data: any) => {
            const value = getNestedValue(data, field);
            return typeof value === "object" && value !== null && !Array.isArray(value);
        }
    }),

    url: (field: string): ValidationRule => ({
        name: `Valid URL: ${field}`,
        validate: (data: any) => {
            const url = getNestedValue(data, field);
            if (typeof url !== "string") return false;
            try {
                const parsed = new URL(url);
                return ["http:", "https:"].includes(parsed.protocol);
            } catch {
                return false;
            }
        }
    }),

    email: (field: string): ValidationRule => ({
        name: `Valid email: ${field}`,
        validate: (data: any) => {
            const email = getNestedValue(data, field);
            return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }
    })
};

/**
 * 🚀 Performance monitoring
 */
export async function benchmarkYamlParsing(
    yamlContent: string,
    iterations: number = 1000
): Promise<{ totalTime: number; avgTime: number; parsesPerSecond: number }> {
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
        try {
            Bun.YAML.parse(yamlContent);
        } catch {
            // Ignore errors for benchmarking
        }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    const parsesPerSecond = Math.round(1000 / avgTime);

    return {
        totalTime,
        avgTime,
        parsesPerSecond
    };
}

/**
 * 🔧 Utility functions
 */
export const yamlUtils = {
    isEmpty: (yamlContent: string): boolean => {
        const trimmed = yamlContent.trim();
        return trimmed === "" || trimmed.startsWith("#") && !trimmed.includes(":");
    },

    isMultiDocument: (yamlContent: string): boolean => {
        return yamlContent.includes("---");
    },

    countDocuments: (yamlContent: string): number => {
        const separators = (yamlContent.match(/^---$/gm) || []).length;
        return separators === 0 ? 1 : separators;
    },

    extractComments: (yamlContent: string): string[] => {
        const comments: string[] = [];
        const lines = yamlContent.split("\n");

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("#") && !trimmed.startsWith("---")) {
                comments.push(trimmed.substring(1).trim());
            }
        }

        return comments;
    }
};

/**
 * 📋 Example usage
 */
export const examples = {
    basicUsage: () => {
        const yaml = `
name: John Doe
age: 30
email: john@example.com
`;

        const result = parseYamlSafely(yaml, "user-config");

        if (result.success) {
            console.log("User:", result.data);
        } else {
            console.error("Error:", result.error);
        }
    },

    fileUsage: async () => {
        const result = await parseYamlFile("./config.yaml");

        if (result.success) {
            console.log("Config loaded:", result.data);
        } else {
            console.error("Failed to load config:", result.error);
        }
    },

    validationUsage: () => {
        const yaml = `
timeout: 5000
retries: 3
api:
  url: https://api.example.com
  key: secret_key
`;

        const rules = [
            commonValidationRules.requiredNumber("timeout", 1000),
            commonValidationRules.requiredNumber("retries", 1),
            commonValidationRules.requiredObject("api"),
            commonValidationRules.url("api.url")
        ];

        const result = parseYamlWithValidation(yaml, rules, "app-config");

        if (result.success) {
            console.log("Valid config:", result.data);
        } else {
            console.error("Invalid config:", result.error);
        }
    },

    batchUsage: () => {
        const yamlContents = [
            { content: "name: Alice", source: "user1.yaml" },
            { content: "invalid: yaml: content", source: "broken.yaml" },
            { content: "name: Bob", source: "user2.yaml" }
        ];

        const batchResult = parseYamlBatch(yamlContents);

        console.log(`Processed ${batchResult.total} files:`);
        console.log(`- Successful: ${batchResult.successful}`);
        console.log(`- Failed: ${batchResult.failed}`);

        if (batchResult.failed > 0) {
            console.log("Errors:", batchResult.summary.errors);
        }
    }
};
