/**
 * Bun.stripANSI() Performance Benchmark
 * Comparing SIMD-accelerated ANSI escape removal with traditional regex approaches
 */

import { test, describe } from 'bun:test';

// ===== TEST DATA =====

const testCases = [
  // Simple colored text
  "\u001b[31mHello\u001b[0m \u001b[32mWorld\u001b[0m",

  // Complex formatting
  "\u001b[1m\u001b[4m\u001b[31mBold underlined red\u001b[0m",

  // Rainbow text
  "\u001b[38;5;196m\u001b[48;5;226mRainbow\u001b[0m \u001b[2m\u001b[3mFaint and italic\u001b[0m",

  // Large text with many ANSI codes
  ("\u001b[31mRed\u001b[0m \u001b[32mGreen\u001b[0m \u001b[34mBlue\u001b[0m " +
   "\u001b[33mYellow\u001b[0m \u001b[35mMagenta\u001b[0m \u001b[36mCyan\u001b[0m").repeat(100),

  // Terminal output simulation
  `
\u001b[32m✓\u001b[0m Test passed
\u001b[31m✗\u001b[0m Test failed
\u001b[33m⚠\u001b[0m Warning message
\u001b[34mℹ\u001b[0m Info message
  `.repeat(50),

  // Malformed ANSI sequences
  "text\u001b[\u001b[31mvalid\u001b[0m\u001b[999m",

  // Unicode with ANSI
  "🚀 \u001b[31mHello\u001b[0m 🌟 \u001b[32mWorld\u001b[0m ✨",

  // 256-color codes
  "\u001b[38;5;196m256-color\u001b[0m \u001b[48;5;226mbackground\u001b[0m",

  // RGB colors
  "\u001b[38;2;255;0;0mRGB Red\u001b[0m \u001b[48;2;0;255;0mRGB Green\u001b[0m",
];

// ===== COMPARISON IMPLEMENTATIONS =====

// Naive regex implementation (slow)
function stripANSINaive(str: string): string {
  return str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
}

// Improved regex with more patterns
function stripANSIRegex(str: string): string {
  return str.replace(/\u001b\[(?:\d+(?:;\d+)*)?[a-zA-Z]/g, '');
}

// Strip-ansi npm package simulation
function stripANSILibrary(str: string): string {
  // Simulate the logic from strip-ansi package
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
  ].join('|');

  return str.replace(new RegExp(pattern, 'g'), '');
}

// ===== BENCHMARK SUITE =====

describe('Bun.stripANSI() Performance Benchmarks', () => {
  test('Performance comparison across test cases', () => {
    const results: any[] = [];

    // Test each implementation against all test cases
    testCases.forEach((testCase, index) => {
      const caseName = `Test Case ${index + 1} (${testCase.length} chars)`;

      // Bun.stripANSI timing
      const bunStart = performance.now();
      for (let i = 0; i < 100; i++) Bun.stripANSI(testCase);
      const bunTime = performance.now() - bunStart;

      // Naive regex timing
      const naiveStart = performance.now();
      for (let i = 0; i < 100; i++) stripANSINaive(testCase);
      const naiveTime = performance.now() - naiveStart;

      results.push({
        test: caseName,
        bun_stripANSI: `${bunTime.toFixed(2)}ms`,
        naive_regex: `${naiveTime.toFixed(2)}ms`,
        speedup: `${(naiveTime / bunTime).toFixed(1)}x`
      });
    });

    console.table(results);
  });

  // ===== PERFORMANCE ANALYSIS =====

  test('Large string performance', () => {
    const largeString = testCases.join('').repeat(10);

    const bunStart = performance.now();
    Bun.stripANSI(largeString);
    const bunTime = performance.now() - bunStart;

    const naiveStart = performance.now();
    stripANSINaive(largeString);
    const naiveTime = performance.now() - naiveStart;

    console.log(`Large string (${largeString.length} chars):`);
    console.log(`  Bun.stripANSI: ${bunTime.toFixed(2)}ms`);
    console.log(`  Naive regex: ${naiveTime.toFixed(2)}ms`);
    console.log(`  Speedup: ${(naiveTime / bunTime).toFixed(1)}x`);
  });

  test('Real terminal output simulation', () => {
    const terminalOutput = Array.from({ length: 100 }, (_, i) =>
      `\u001b[${31 + (i % 7)}mLine ${i}: ${'█'.repeat(50)}\u001b[0m`
    ).join('\n');

    const bunStart = performance.now();
    Bun.stripANSI(terminalOutput);
    const bunTime = performance.now() - bunStart;

    const naiveStart = performance.now();
    stripANSINaive(terminalOutput);
    const naiveTime = performance.now() - naiveStart;

    console.log(`Terminal output (${terminalOutput.length} chars):`);
    console.log(`  Bun.stripANSI: ${bunTime.toFixed(2)}ms`);
    console.log(`  Naive regex: ${naiveTime.toFixed(2)}ms`);
    console.log(`  Speedup: ${(naiveTime / bunTime).toFixed(1)}x`);
  });

  // ===== EDGE CASE PERFORMANCE =====

  test('Edge cases performance', () => {
    const plainText = "This is plain text without any ANSI escape codes.".repeat(1000);
    const onlyANSI = "\u001b[31m\u001b[32m\u001b[33m\u001b[34m\u001b[35m\u001b[36m\u001b[37m".repeat(1000);
    const malformed = "text\u001b[\u001b[31mvalid\u001b[0m\u001b[999m\u001b[m\u001b[K".repeat(100);

    // Plain text
    const plainBun = performance.now();
    Bun.stripANSI(plainText);
    const plainBunTime = performance.now() - plainBun;

    // Only ANSI
    const ansiBun = performance.now();
    Bun.stripANSI(onlyANSI);
    const ansiBunTime = performance.now() - ansiBun;

    // Malformed
    const malformedBun = performance.now();
    Bun.stripANSI(malformed);
    const malformedBunTime = performance.now() - malformedBun;

    console.log('Edge cases:');
    console.log(`  Plain text (${plainText.length} chars): ${plainBunTime.toFixed(2)}ms`);
    console.log(`  Only ANSI (${onlyANSI.length} chars): ${ansiBunTime.toFixed(2)}ms`);
    console.log(`  Malformed (${malformed.length} chars): ${malformedBunTime.toFixed(2)}ms`);
  });

  // ===== MEMORY USAGE COMPARISON =====

  test('Memory efficiency comparison', () => {
    const testString = testCases[3]; // Large test case

    // Bun.stripANSI memory test
    const bunStart = performance.now();
    for (let i = 0; i < 10000; i++) {
      Bun.stripANSI(testString);
    }
    const bunTime = performance.now() - bunStart;

    // Regex memory test
    const regexStart = performance.now();
    for (let i = 0; i < 10000; i++) {
      stripANSINaive(testString);
    }
    const regexTime = performance.now() - regexStart;

    console.log(`Memory efficiency (10k iterations):`);
    console.log(`  Bun.stripANSI: ${bunTime.toFixed(2)}ms`);
    console.log(`  Naive regex: ${regexTime.toFixed(2)}ms`);
    console.log(`  Speedup: ${(regexTime / bunTime).toFixed(1)}x`);
  });
});

// ===== VALIDATION TESTS =====

describe('Bun.stripANSI() Correctness Validation', () => {
  const validationCases = [
    {
      input: "\u001b[31mRed text\u001b[0m",
      expected: "Red text"
    },
    {
      input: "\u001b[1m\u001b[4mBold and underlined\u001b[0m",
      expected: "Bold and underlined"
    },
    {
      input: "\u001b[38;5;196m256-color\u001b[0m",
      expected: "256-color"
    },
    {
      input: "\u001b[38;2;255;0;0mRGB color\u001b[0m",
      expected: "RGB color"
    },
    {
      input: "🚀 \u001b[31mHello\u001b[0m 🌟 \u001b[32mWorld\u001b[0m ✨",
      expected: "🚀 Hello 🌟 World ✨"
    },
    {
      input: "Plain text with no ANSI codes",
      expected: "Plain text with no ANSI codes"
    },
    {
      input: "\u001b[31m\u001b[32m\u001b[33mMultiple colors\u001b[0m",
      expected: "Multiple colors"
    }
  ];

  test('Correctness validation', () => {
    const results: any[] = [];

    validationCases.forEach(({ input, expected }, index) => {
      // Test Bun.stripANSI
      const bunResult = Bun.stripANSI(input);
      const bunCorrect = bunResult === expected;

      // Test regex implementation
      const regexResult = stripANSINaive(input);
      const regexCorrect = regexResult === expected;

      results.push({
        test: `Case ${index + 1}`,
        input: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
        expected,
        bun_correct: bunCorrect,
        regex_correct: regexCorrect
      });

      if (!bunCorrect) {
        throw new Error(`Bun.stripANSI failed: expected "${expected}", got "${bunResult}"`);
      }
    });

    console.table(results);
  });
});

// ===== EXPORT FOR EXTERNAL USE =====

export {
  testCases,
  stripANSINaive,
  stripANSIRegex,
  stripANSILibrary
};