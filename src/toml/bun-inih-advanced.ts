import { TOML } from "bun";
import { logger } from "../../examples/logging/bun-logger";

interface ParsedTOML {
  data: any;
  metadata: {
    parse_duration_ns: number;
    size: number;
    line_count: number;
  };
}

interface ParseResult {
  success: boolean;
  data: ParsedTOML | null;
  errors: Array<{
    message: string;
    line: number;
    column: number;
  }>;
}

interface TOMLError {
  message: string;
  line: number;
  column: number;
}

/**
 * Advanced TOML parsing with Bun.TOML (native parser)
 */
export class BunTOMLAdvanced {
  /**
   * Parse with custom validation and line tracking
   */
  parseWithMetadata(tomlContent: string): ParsedTOML {
    const start = Bun.nanoseconds();

    // Bun.TOML.parse is the native implementation
    const parsed = Bun.TOML.parse(tomlContent);

    const duration = Bun.nanoseconds() - start;

    logger.debug("TOML parsed", {
      duration_ns: duration,
      top_level_keys: Object.keys(parsed),
    });

    // Add metadata
    return {
      data: parsed,
      metadata: {
        parse_duration_ns: duration,
        size: tomlContent.length,
        line_count: tomlContent.split("\n").length,
      },
    };
  }

  /**
   * Parse with error recovery and detailed diagnostics
   */
  parseWithRecovery(tomlContent: string): ParseResult {
    try {
      return {
        success: true,
        data: this.parseWithMetadata(tomlContent),
        errors: [],
      };
    } catch (error) {
      // Bun provides detailed TOML parse errors
      const tomlError = error as TOMLError;

      logger.warn("TOML parse error", {
        message: tomlError.message,
        line: tomlError.line,
        column: tomlError.column,
      });

      return {
        success: false,
        data: null,
        errors: [{
          message: tomlError.message,
          line: tomlError.line,
          column: tomlError.column,
        }],
      };
    }
  }

  /**
   * Validate TOML schema
   */
  validateTOML(content: string, schema: Record<string, any>): boolean {
    try {
      const parsed = this.parseWithMetadata(content);

      // Simple schema validation
      for (const [key, expectedType] of Object.entries(schema)) {
        if (!(key in parsed.data)) {
          logger.warn("TOML validation failed: missing key", { key });
          return false;
        }

        const actualType = typeof parsed.data[key];
        if (actualType !== expectedType) {
          logger.warn("TOML validation failed: type mismatch", {
            key,
            expected: expectedType,
            actual: actualType,
          });
          return false;
        }
      }

      logger.debug("TOML validation passed");
      return true;
    } catch (error) {
      logger.error("TOML validation failed", {}, error as Error);
      return false;
    }
  }

  /**
   * Convert TOML to other formats
   */
  toJSON(tomlContent: string): string {
    const parsed = this.parseWithMetadata(tomlContent);
    return JSON.stringify(parsed.data, null, 2);
  }

  toYAML(tomlContent: string): string {
    const parsed = this.parseWithMetadata(tomlContent);
    // Simple YAML conversion (in real implementation, use a YAML library)
    return Object.entries(parsed.data)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
  }
}