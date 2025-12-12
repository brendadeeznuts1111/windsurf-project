/**
 * 🎯 TypeScript Declarations for Text File Imports
 *
 * Enables import assertions for text files in Bun:
 * ```typescript
 * import config from './config.txt';
 * import readme from './README.md';
 * ```
 */

// Text files
declare module '*.txt' {
  const content: string;
  export default content;
}

// Markdown files
declare module '*.md' {
  const content: string;
  export default content;
}

// CSV files
declare module '*.csv' {
  const content: string;
  export default content;
}

// JSON files (as text)
declare module '*.json.txt' {
  const content: string;
  export default content;
}

// Template files
declare module '*.template' {
  const content: string;
  export default content;
}

// Configuration files
declare module '*.config' {
  const content: string;
  export default content;
}

// Log files
declare module '*.log.txt' {
  const content: string;
  export default content;
}

// ============================================================================
// ENCODING-SPECIFIC DECLARATIONS
// ============================================================================

// Base64 encoded files
declare module '*.txt?encoding=base64' {
  const content: string;
  export default content;
}

declare module '*.md?encoding=base64' {
  const content: string;
  export default content;
}

// UTF-8 explicit (default)
declare module '*.txt?encoding=utf8' {
  const content: string;
  export default content;
}

declare module '*.md?encoding=utf8' {
  const content: string;
  export default content;
}

// ============================================================================
// UTILITY TYPE HELPERS
// ============================================================================

/**
 * Type helper for text file imports
 */
export type TextFileContent = string;

/**
 * Type helper for JSON text files
 */
export type JSONTextFileContent = string;

/**
 * Type helper for CSV text files
 */
export type CSVTextFileContent = string;

/**
 * Type helper for template text files
 */
export type TemplateTextFileContent = string;

/**
 * Type helper for configuration text files
 */
export type ConfigTextFileContent = string;