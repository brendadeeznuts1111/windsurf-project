// examples/bun-text-file-import.test.ts - Bun Text File Import Demonstration
// Demonstrates Bun's native text file import capability

import { describe, test, expect } from "bun:test";

// Create a test text file
const testTextContent = `Hello from Bun's text file import feature!

This demonstrates Bun's ability to import text files directly as strings,
similar to how bundlers like Vite work.

Key features:
- Direct import of .txt, .md, .css, .html files
- No build step required
- TypeScript support
- Hot reload in development

This is much simpler than Node.js require() patterns!
`;

await Bun.write("text-loader-fixture-text-file.txt", testTextContent);

describe("Bun Text File Import", () => {
  test("can import text files directly", async () => {
    // This demonstrates Bun's native text file import
    // In Bun, you can directly import text files as strings
    const { default: importedText } = await import("./text-loader-fixture-text-file.txt");

    expect(typeof importedText).toBe("string");
    expect(importedText).toContain("Hello from Bun's text file import feature!");
    expect(importedText).toContain("Direct import of .txt, .md, .css, .html files");
    expect(importedText).toContain("Hot reload in development");
  });

  test("imported text matches file content", async () => {
    const { default: importedText } = await import("./text-loader-fixture-text-file.txt");

    // Read the file directly to compare
    const fileContent = await Bun.file("text-loader-fixture-text-file.txt").text();

    expect(importedText).toBe(fileContent);
    expect(importedText.length).toBe(fileContent.length);
  });

  test("supports different text file types", async () => {
    // Create different text file types
    const markdownContent = `# Markdown File

This is a markdown file that can be imported directly in Bun.

- Feature 1
- Feature 2
- Feature 3
`;

    const cssContent = `.example {
  color: red;
  font-size: 14px;
}

@media (max-width: 600px) {
  .example {
    font-size: 12px;
  }
}`;

    await Bun.write("test-markdown.md", markdownContent);
    await Bun.write("test-styles.css", cssContent);

    // Import markdown
    const { default: importedMarkdown } = await import("./test-markdown.md");
    expect(importedMarkdown).toContain("# Markdown File");
    expect(importedMarkdown).toContain("- Feature 1");

    // Import CSS
    const { default: importedCSS } = await import("./test-styles.css");
    expect(importedCSS).toContain(".example {");
    expect(importedCSS).toContain("@media (max-width: 600px)");

    // Clean up
    await Bun.spawn({ cmd: ["rm", "test-markdown.md", "test-styles.css"] });
  });

  test("works with console.write (Bun-specific)", async () => {
    const { default: importedText } = await import("./text-loader-fixture-text-file.txt");

    // In Bun, console.write is available for direct output
    // This is different from Node.js console.log
    if (typeof console.write === "function") {
      // Capture console.write output (if available)
      const originalWrite = console.write;
      let capturedOutput = "";

      console.write = (text: string) => {
        capturedOutput += text;
      };

      console.write(importedText);

      expect(capturedOutput).toContain("Hello from Bun's text file import feature!");
      expect(capturedOutput.length).toBeGreaterThan(100);

      // Restore original
      console.write = originalWrite;
    } else {
      // Fallback: just verify the text was imported
      expect(importedText).toContain("console.write");
    }
  });

  test("supports TypeScript with proper typing", async () => {
    const { default: importedText }: { default: string } = await import("./text-loader-fixture-text-file.txt");

    // TypeScript knows this is a string
    expect(typeof importedText).toBe("string");
    expect(importedText.length).toBeGreaterThan(0);

    // Can use string methods
    const upperCase = importedText.toUpperCase();
    expect(upperCase).toContain("HELLO FROM BUN'S TEXT FILE IMPORT FEATURE!");
  });

  test("handles file encoding correctly", async () => {
    // Create a file with special characters
    const unicodeContent = `Unicode test: 🚀 Hello 世界 🌍
Special chars: àáâãäå æçèéêë ìíîïðñ
Math symbols: ∑ ∏ √ ∫ ∞ ≅ ≈ ≠ ≡ ≤ ≥
`;

    await Bun.write("unicode-test.txt", unicodeContent);

    const { default: importedUnicode } = await import("./unicode-test.txt");

    expect(importedUnicode).toContain("🚀 Hello 世界 🌍");
    expect(importedUnicode).toContain("∑ ∏ √ ∫ ∞");
    expect(importedUnicode).toContain("àáâãäå æçèéêë");

    // Verify encoding is preserved
    const fileContent = await Bun.file("unicode-test.txt").text();
    expect(importedUnicode).toBe(fileContent);

    // Clean up
    await Bun.spawn({ cmd: ["rm", "unicode-test.txt"] });
  });

  test("works with dynamic imports", async () => {
    // Dynamic import of text files
    const textModule = await import("./text-loader-fixture-text-file.txt");
    const textContent = textModule.default;

    expect(typeof textContent).toBe("string");
    expect(textContent).toContain("Bun's text file import feature");
  });

  test("integrates with Bun's file API", async () => {
    const { default: importedText } = await import("./text-loader-fixture-text-file.txt");

    // Compare with Bun.file().text()
    const fileText = await Bun.file("text-loader-fixture-text-file.txt").text();

    expect(importedText).toBe(fileText);

    // Both should have same stats
    const file = Bun.file("text-loader-fixture-text-file.txt");
    const stat = await file.stat();

    expect(importedText.length).toBe(stat.size);
  });
});

// Clean up the test file
await Bun.spawn({ cmd: ["rm", "text-loader-fixture-text-file.txt"] });