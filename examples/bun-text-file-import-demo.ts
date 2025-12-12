// examples/bun-text-file-import-demo.ts - Bun Text File Import Demonstration
// Shows how Bun can import text files directly as strings

export {}; // Make this a module to allow top-level await

// Create a sample text file for demonstration
const sampleText = `Hello from Bun's text file import!

This demonstrates Bun's native ability to import text files directly as strings,
similar to how modern bundlers like Vite work.

Key features:
- Direct import of .txt, .md, .css, .html files
- No build step required for text files
- TypeScript support with proper typing
- Hot reload in development
- Zero-copy file reading with Bun.file()

This is much simpler than Node.js require() patterns!

Example usage:
import text from "./file.txt";
console.log(text); // Direct string content

Or with Bun's file API:
const content = await Bun.file("file.txt").text();
console.log(content); // Same result
`;

await Bun.write("demo-text-file.txt", sampleText);

// Now demonstrate the import (this works in Bun!)
const { default: importedText } = await import("./demo-text-file.txt");

console.log("🎉 Bun Text File Import Demo");
console.log("=".repeat(50));
console.log("Imported text file content:");
console.log("-".repeat(30));
console.log(importedText);
console.log("-".repeat(30));

// Compare with Bun.file() API
const fileContent = await Bun.file("demo-text-file.txt").text();
console.log("\nComparison with Bun.file().text():");
console.log("Same content?", importedText === fileContent ? "✅ Yes!" : "❌ No");

console.log("\nFile stats:");
const file = Bun.file("demo-text-file.txt");
const stat = await file.stat();
console.log(`Size: ${stat.size} bytes`);
console.log(`Modified: ${new Date(stat.mtime).toLocaleString()}`);

// Demonstrate different file types
const markdownContent = `# Bun Text Import Demo

This shows how Bun can import various text-based files:

- **Markdown** (.md) files
- **CSS** (.css) files
- **HTML** (.html) files
- **Text** (.txt) files
- **JSON** (.json) files (as text)
- **TypeScript** (.ts) files (as text)

## Benefits

1. **Zero configuration** - works out of the box
2. **TypeScript support** - proper type inference
3. **Hot reload** - changes reflect immediately in dev
4. **Performance** - optimized file reading
5. **Compatibility** - works like modern bundlers
`;

const cssContent = `/* Bun Text Import Demo CSS */
.demo-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.demo-header {
  color: #333;
  border-bottom: 2px solid #007acc;
  padding-bottom: 10px;
}

.demo-code {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  font-family: 'Monaco', 'Menlo', monospace;
  overflow-x: auto;
}

.demo-highlight {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 10px;
  margin: 10px 0;
}`;

await Bun.write("demo-markdown.md", markdownContent);
await Bun.write("demo-styles.css", cssContent);

// Demonstrate different file types exist
console.log("\n📄 Different file types created:");
console.log("Markdown file created:", await Bun.file("demo-markdown.md").exists());
console.log("CSS file created:", await Bun.file("demo-styles.css").exists());

// Read them using Bun.file() API instead of import
const markdownContent = await Bun.file("demo-markdown.md").text();
const cssContent = await Bun.file("demo-styles.css").text();
console.log("Markdown file length:", markdownContent.length, "characters");
console.log("CSS file length:", cssContent.length, "characters");

// Demonstrate console.write if available (Bun-specific)
console.log("\n🖨️  Console output methods:");
console.log("console.log():", "Standard output");
if (typeof console.write === "function") {
  console.log("console.write():", "Available in Bun!");
} else {
  console.log("console.write():", "Not available (standard Node.js/console behavior)");
}

// Clean up demo files
await Bun.spawn({ cmd: ["rm", "demo-text-file.txt", "demo-markdown.md", "demo-styles.css"] });

console.log("\n✅ Bun text file import demonstration complete!");
console.log("Bun makes importing text files as simple as importing JavaScript modules!");