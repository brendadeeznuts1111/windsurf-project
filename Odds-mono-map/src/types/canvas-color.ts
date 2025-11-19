import type { Bun } from 'bun';

/**
 * Validation result interface
 */
export interface ValidationIssue {
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    suggestion?: string;
    metadata?: Record<string, any>;
}

export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
    warnings: ValidationIssue[];
}

/**
 * Bun.color-powered canvas color system
 * Supports all Bun.color input/output formats
 */
export type CanvasColorInput =
    | string  // CSS names, HEX, RGB, HSL
    | number  // 0xRRGGBB
    | { r: number; g: number; b: number; a?: number }  // RGB objects
    | [number, number, number]  // RGB arrays
    | [number, number, number, number];  // RGBA arrays

export type CanvasColorOutput =
    | "css"      // "red", "#ff0000"
    | "ansi"     // "\x1b[38;2;255;0;0m"
    | "ansi-16"  // "\x1b[38;5;1m"
    | "ansi-256" // "\x1b[38;5;196m"
    | "ansi-16m" // "\x1b[38;2;255;0;0m"
    | "number"   // 16711680
    | "rgb"      // "rgb(255, 0, 0)"
    | "rgba"     // "rgba(255, 0, 0, 1)"
    | "hsl"      // "hsl(0, 100%, 50%)"
    | "hex"      // "#ff0000"
    | "HEX"      // "#FF0000"
    | "{rgb}"    // { r: 255, g: 0, b: 0 }
    | "{rgba}"   // { r: 255, g: 0, b: 0, a: 1 }
    | "[rgb]"    // [255, 0, 0]
    | "[rgba]";  // [255, 0, 0, 255]

/**
 * Canvas node color with Bun.color integration
 */
export interface CanvasNodeColor {
    input: CanvasColorInput;
    normalized: string;  // Always stored as HEX
    metadata: {
        originalInput: CanvasColorInput;
        contrastRatio: number;
        isAccessible: boolean;
        terminalSupport: {
            ansi16: boolean;
            ansi256: boolean;
            ansi16m: boolean;
        };
    };
}

/**
 * Color validation result with Bun.color error handling
 */
export interface CanvasColorValidation extends ValidationResult {
    normalizedColor?: string;
    suggestions?: string[];
    bunColorError?: string;
}

/**
 * Legacy color mapping for backward compatibility
 */
export const LEGACY_COLOR_MAP = {
    "0": "#808080", // Gray
    "1": "#3b82f6", // Blue
    "2": "#10b981", // Green
    "3": "#f59e0b", // Amber
    "4": "#ef4444", // Red
    "5": "#8b5cf6"  // Purple
} as const;

/**
 * Brand palette with automatic Bun.color normalization
 */
export const CANVAS_BRAND_COLORS = {
    // Primary palette
    primary: normalizeColor("#0F172A"),    // Deep blue
    secondary: normalizeColor("#1E40AF"),  // Medium blue
    accent: normalizeColor("#F59E0B"),     // Amber

    // Status colors
    status: {
        active: normalizeColor("#10B981"),     // Green
        beta: normalizeColor("#EAB308"),       // Yellow
        deprecated: normalizeColor("#EF4444"), // Red
        experimental: normalizeColor("#8B5CF6") // Purple
    },

    // Domain colors (auto-generated from ID prefixes)
    domain: {
        integration: normalizeColor("#6366F1"),  // Indigo
        service: normalizeColor("#14B8A6"),      // Teal
        core: normalizeColor("#059669"),         // Emerald
        ui: normalizeColor("#F97316"),           // Orange
        pipeline: normalizeColor("#06B6D4"),     // Cyan
        monitor: normalizeColor("#A855F7")       // Violet
    }
} as const;

/**
 * Normalizes any color input to HEX using Bun.color
 */
export function normalizeColor(input: CanvasColorInput): string {
    try {
        const result = Bun.color(input, "hex");
        return result || "#808080"; // Fallback to gray
    } catch {
        return "#808080"; // Fallback for invalid colors
    }
}

/**
 * Checks if input is a legacy color code
 */
export function isLegacyColor(input: unknown): input is keyof typeof LEGACY_COLOR_MAP {
    return typeof input === 'string' && input in LEGACY_COLOR_MAP;
}

/**
 * Calculates contrast ratio between two colors
 */
export function calculateContrastRatio(color1: string, color2: string): number {
    // Simple luminance calculation for contrast ratio
    const getLuminance = (hex: string): number => {
        const rgb = Bun.color(hex, "{rgb}");
        if (!rgb) return 0.5;

        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
            val = val / 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Validates and normalizes canvas node color with Bun.color
 */
export function validateCanvasColor(
    input: unknown,
    nodeId: string
): CanvasColorValidation {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Type check
    if (input === undefined) {
        return { valid: true, issues, warnings }; // Color is optional
    }

    if (typeof input !== 'string' && typeof input !== 'number' &&
        !Array.isArray(input) && typeof input !== 'object') {
        issues.push({
            severity: 'error',
            category: 'metadata',
            message: `Color must be string, number, array, or object, got ${typeof input}`,
            metadata: { nodeId, colorType: typeof input }
        });
        return { valid: false, issues, warnings };
    }

    // Handle legacy colors
    let colorInput = input;
    if (isLegacyColor(input)) {
        colorInput = LEGACY_COLOR_MAP[input];
        warnings.push({
            severity: 'info',
            category: 'legacy',
            message: `Using legacy color code ${input}, converted to ${colorInput}`,
            suggestion: 'Use modern color formats (hex, rgb, css names)',
            metadata: { nodeId, legacyColor: input, modernColor: colorInput }
        });
    }

    // Attempt Bun.color conversion
    let normalized: string | null;
    try {
        normalized = Bun.color(colorInput as CanvasColorInput, "hex");
    } catch (error: any) {
        issues.push({
            severity: 'error',
            category: 'color',
            message: `Bun.color failed to parse color: ${error.message}`,
            suggestion: 'Use valid CSS color format (hex, rgb, hsl, CSS name)',
            metadata: { nodeId, error: error.message }
        });
        return {
            valid: false,
            issues,
            warnings,
            bunColorError: error.message
        };
    }

    if (!normalized) {
        issues.push({
            severity: 'error',
            category: 'color',
            message: 'Invalid color: Bun.color returned null',
            suggestion: 'Check color syntax (e.g., "#ff0000", "rgb(255,0,0)")',
            metadata: { nodeId, input }
        });
        return { valid: false, issues, warnings };
    }

    // Validate against brand palette (optional strict mode)
    const isBrandColor = Object.values(CANVAS_BRAND_COLORS)
        .some(section =>
            typeof section === 'string'
                ? section === normalized
                : Object.values(section).includes(normalized)
        );

    if (!isBrandColor) {
        warnings.push({
            severity: 'warning',
            category: 'style',
            message: `Color ${normalized} not in brand palette`,
            suggestion: 'Use brand colors for consistency',
            metadata: { nodeId, brandColor: false }
        });
    }

    // Check contrast ratio for accessibility
    const contrast = calculateContrastRatio(normalized, "#FFFFFF");
    if (contrast < 4.5) {
        warnings.push({
            severity: 'warning',
            category: 'accessibility',
            message: `Low contrast ratio (${contrast.toFixed(1)}:1) against white background`,
            suggestion: 'Use color with higher contrast for better readability',
            metadata: { nodeId, contrastRatio: contrast }
        });
    }

    return {
        valid: true,
        issues,
        warnings,
        normalizedColor: normalized
    };
}

/**
 * Gets terminal-appropriate ANSI color for canvas node
 */
export function getTerminalColor(
    node: { color?: string; metadata?: { status?: string } },
    outputFormat: Exclude<CanvasColorOutput, "css" | "hex" | "HEX" | "rgb" | "rgba" | "hsl" | "number" | "{rgb}" | "{rgba}" | "[rgb]" | "[rgba]"> = "ansi"
): string {
    if (!node.color) return ""; // No color

    const colorInput = isLegacyColor(node.color)
        ? LEGACY_COLOR_MAP[node.color as "0" | "1" | "2" | "3" | "4" | "5"]
        : node.color;

    return Bun.color(colorInput, outputFormat) || "";
}

/**
 * Renders colored text in terminal with node metadata
 */
export function renderColoredNode(
    node: { id: string; text: string; color?: string },
    options: { showMetadata?: boolean; compact?: boolean } = {}
): string {
    const { showMetadata = false, compact = false } = options;

    if (!node.color) {
        return compact
            ? `[${node.id}]`
            : `Node: ${node.id}\n${node.text.substring(0, 50)}...`;
    }

    // Get ANSI color code
    const ansiColor = getTerminalColor(
        { color: node.color },
        "ansi" // Auto-detects terminal capability
    );

    const reset = "\x1b[0m";

    if (compact) {
        return `${ansiColor}[${node.id}]${reset}`;
    }

    const header = node.text.split('\n')[0]; // First line
    const content = showMetadata
        ? `${header}\n${node.text.substring(0, 100)}...`
        : header;

    return `${ansiColor}${content}${reset}`;
}

/**
 * Batch convert all canvas colors to a specific format
 */
export function convertAllCanvasColors(
    canvas: { nodes: Array<{ id?: string; color?: string }> },
    targetFormat: CanvasColorOutput
): Map<string, string | null> {
    const conversions = new Map<string, string | null>();

    for (const node of canvas.nodes) {
        if (!node.color) {
            conversions.set(node.id || 'unknown', null);
            continue;
        }

        const input = isLegacyColor(node.color)
            ? LEGACY_COLOR_MAP[node.color as "0" | "1" | "2" | "3" | "4" | "5"]
            : node.color;

        const converted = Bun.color(input, targetFormat);
        conversions.set(node.id || 'unknown', converted);
    }

    return conversions;
}

/**
 * Creates enhanced color metadata for a node
 */
export function createColorMetadata(
    colorInput: CanvasColorInput,
    nodeId: string
): CanvasNodeColor {
    const normalized = normalizeColor(colorInput);
    const contrast = calculateContrastRatio(normalized, "#FFFFFF");

    // Test terminal support
    const terminalSupport = {
        ansi16: !!Bun.color(normalized, "ansi-16"),
        ansi256: !!Bun.color(normalized, "ansi-256"),
        ansi16m: !!Bun.color(normalized, "ansi-16m")
    };

    return {
        input: colorInput,
        normalized,
        metadata: {
            originalInput: colorInput,
            contrastRatio: contrast,
            isAccessible: contrast >= 4.5,
            terminalSupport
        }
    };
}
