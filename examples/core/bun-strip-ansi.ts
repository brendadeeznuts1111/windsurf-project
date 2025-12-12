/**
 * Bun.stripANSI() - SIMD-Accelerated ANSI Escape Removal
 * Demonstrates the new high-performance ANSI escape code stripping
 */

import { test, expect } from 'bun:test';

// ===== ANSI ESCAPE CODE EXAMPLES =====

const coloredText = "\u001b[31mHello\u001b[0m \u001b[32mWorld\u001b[0m";
const formatted = "\u001b[1m\u001b[4mBold and underlined\u001b[0m";

// ===== BASIC USAGE =====

console.log("Original:", coloredText);
console.log("Stripped:", Bun.stripANSI(coloredText));
// Output: "Hello World"

console.log("Original:", formatted);
console.log("Stripped:", Bun.stripANSI(formatted));
// Output: "Bold and underlined"

// ===== PERFORMANCE COMPARISON =====

function stripANSINaive(str: string): string {
  // Simple regex-based approach (much slower)
  return str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
}

test('Bun.stripANSI performance vs naive implementation', () => {
  const testString = "\u001b[31mRed\u001b[0m \u001b[32mGreen\u001b[0m \u001b[34mBlue\u001b[0m".repeat(1000);

  // Time Bun.stripANSI
  const startBun = performance.now();
  for (let i = 0; i < 1000; i++) {
    Bun.stripANSI(testString);
  }
  const timeBun = performance.now() - startBun;

  // Time naive implementation
  const startNaive = performance.now();
  for (let i = 0; i < 1000; i++) {
    stripANSINaive(testString);
  }
  const timeNaive = performance.now() - startNaive;

  console.log(`Bun.stripANSI: ${timeBun.toFixed(2)}ms`);
  console.log(`Naive regex: ${timeNaive.toFixed(2)}ms`);
  console.log(`Speedup: ${(timeNaive / timeBun).toFixed(1)}x`);

  // Bun.stripANSI should be significantly faster
  expect(timeBun).toBeLessThan(timeNaive * 0.5); // At least 2x faster
});

// ===== COMPREHENSIVE ANSI CODE SUPPORT =====

test('handles all ANSI escape codes', () => {
  const ansiCodes = [
    "\u001b[0m",    // Reset
    "\u001b[1m",    // Bold
    "\u001b[2m",    // Dim
    "\u001b[3m",    // Italic
    "\u001b[4m",    // Underline
    "\u001b[5m",    // Blink
    "\u001b[7m",    // Reverse
    "\u001b[8m",    // Hidden
    "\u001b[9m",    // Strikethrough
    "\u001b[30m",   // Black foreground
    "\u001b[31m",   // Red foreground
    "\u001b[32m",   // Green foreground
    "\u001b[33m",   // Yellow foreground
    "\u001b[34m",   // Blue foreground
    "\u001b[35m",   // Magenta foreground
    "\u001b[36m",   // Cyan foreground
    "\u001b[37m",   // White foreground
    "\u001b[40m",   // Black background
    "\u001b[41m",   // Red background
    "\u001b[42m",   // Green background
    "\u001b[43m",   // Yellow background
    "\u001b[44m",   // Blue background
    "\u001b[45m",   // Magenta background
    "\u001b[46m",   // Cyan background
    "\u001b[47m",   // White background
    "\u001b[38;5;196m", // 256-color foreground
    "\u001b[48;5;226m", // 256-color background
    "\u001b[38;2;255;0;0m", // RGB foreground
    "\u001b[48;2;0;255;0m", // RGB background
  ];

  const testText = "Hello World";
  const coloredText = ansiCodes.join("") + testText + "\u001b[0m";

  const stripped = Bun.stripANSI(coloredText);
  expect(stripped).toBe(testText);
});

// ===== EDGE CASES =====

test('handles empty strings and no ANSI codes', () => {
  expect(Bun.stripANSI("")).toBe("");
  expect(Bun.stripANSI("plain text")).toBe("plain text");
  expect(Bun.stripANSI("text with \u001b[31mcolor\u001b[0m codes")).toBe("text with color codes");
});

test('handles malformed ANSI sequences', () => {
  const malformed = "text\u001b[\u001b[31mvalid\u001b[0m\u001b[999m";
  expect(Bun.stripANSI(malformed)).toBe("textvalid");
});

test('handles Unicode and emojis', () => {
  const unicodeText = "🚀 \u001b[31mHello\u001b[0m 🌟 \u001b[32mWorld\u001b[0m ✨";
  expect(Bun.stripANSI(unicodeText)).toBe("🚀 Hello 🌟 World ✨");
});

// ===== PRACTICAL USE CASES =====

test('terminal output cleaning', () => {
  // Simulate colored terminal output
  const terminalOutput = `
\u001b[32m✓\u001b[0m Test passed
\u001b[31m✗\u001b[0m Test failed
\u001b[33m⚠\u001b[0m Warning message
  `;

  const cleanOutput = Bun.stripANSI(terminalOutput);

  expect(cleanOutput).toContain("✓ Test passed");
  expect(cleanOutput).toContain("✗ Test failed");
  expect(cleanOutput).toContain("⚠ Warning message");
  expect(cleanOutput).not.toContain("\u001b[");
});

test('log file processing', () => {
  const logEntry = "[2024-01-15 10:30:45] \u001b[34mINFO\u001b[0m: User login successful";
  const cleanLog = Bun.stripANSI(logEntry);

  expect(cleanLog).toBe("[2024-01-15 10:30:45] INFO: User login successful");
});

// ===== BENCHMARK =====

test('performance benchmark', () => {
  const testCases = [
    "Simple \u001b[31mred\u001b[0m text",
    "\u001b[1m\u001b[4m\u001b[31mBold underlined red\u001b[0m",
    "Complex \u001b[38;5;196m\u001b[48;5;226mRainbow\u001b[0m text",
    "Multiple \u001b[31mcolors\u001b[0m \u001b[32mand\u001b[0m \u001b[34mstyles\u001b[0m".repeat(10),
  ];

  let totalTime = 0;
  let totalChars = 0;

  for (const testCase of testCases) {
    const start = performance.now();
    const result = Bun.stripANSI(testCase);
    const end = performance.now();

    totalTime += (end - start);
    totalChars += testCase.length;

    // Verify correctness
    expect(result).not.toContain("\u001b[");
  }

  const throughput = totalChars / totalTime; // characters per millisecond
  console.log(`Throughput: ${(throughput * 1000).toFixed(0)} chars/second`);

  // Should be very fast
  expect(throughput).toBeGreaterThan(1000); // At least 1M chars/second
});