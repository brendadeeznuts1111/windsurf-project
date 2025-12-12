#!/usr/bin/env bun
// tools/test-file-size-monitor.ts - Test File Size Monitoring Tool
// Monitors test file sizes and enforces Bun's organization patterns
// Based on Bun's test organization patterns

import { readdirSync, statSync } from "fs";
import { join } from "path";

interface TestFileInfo {
  path: string;
  size: number;
  lines: number;
  name: string;
}

interface SizeReport {
  totalFiles: number;
  oversizedFiles: TestFileInfo[];
  averageSize: number;
  maxSize: number;
  recommendations: string[];
}

/**
 * Analyzes test file sizes in the examples/testing directory
 */
function analyzeTestFiles(testDir = "examples/testing"): SizeReport {
  const files: TestFileInfo[] = [];

  function scanDirectory(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip __snapshots__ directory
        if (entry.name !== "__snapshots__") {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
        const stats = statSync(fullPath);
        const content = require("fs").readFileSync(fullPath, "utf-8");
        const lines = content.split("\n").length;

        files.push({
          path: fullPath,
          size: stats.size,
          lines,
          name: entry.name,
        });
      }
    }
  }

  scanDirectory(testDir);

  const oversizedFiles = files.filter((file) => file.lines > 500);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const recommendations: string[] = [];

  if (oversizedFiles.length > 0) {
    recommendations.push(
      `Found ${oversizedFiles.length} test file(s) exceeding 500 lines:`
    );
    oversizedFiles.forEach((file) => {
      recommendations.push(
        `  - ${file.name}: ${file.lines} lines (${Math.round(
          file.size / 1024
        )}KB)`
      );
    });
    recommendations.push("");
    recommendations.push(
      "Consider breaking down large test files into focused modules using Bun's naming pattern:"
    );
    recommendations.push("  test-{component}-{issue/feature}-{description}.ts");
    recommendations.push("");
    recommendations.push("Examples:");
    recommendations.push("  - test-config-randomize-seed-consistency.test.ts");
    recommendations.push("  - test-config-rerun-each-behavior.test.ts");
    recommendations.push("  - test-config-edge-cases.test.ts");
  }

  return {
    totalFiles: files.length,
    oversizedFiles,
    averageSize: Math.round(totalSize / files.length),
    maxSize: Math.max(...files.map((f) => f.size)),
    recommendations,
  };
}

/**
 * Main CLI function
 */
function main() {
  console.log("🔍 Bun Test File Size Monitor");
  console.log("=============================\n");

  const report = analyzeTestFiles();

  console.log(`📊 Analysis Results:`);
  console.log(`   Total test files: ${report.totalFiles}`);
  console.log(`   Average file size: ${Math.round(report.averageSize / 1024)}KB`);
  console.log(`   Largest file: ${Math.round(report.maxSize / 1024)}KB`);
  console.log(`   Oversized files (>500 lines): ${report.oversizedFiles.length}`);

  if (report.recommendations.length > 0) {
    console.log("\n💡 Recommendations:");
    report.recommendations.forEach((rec) => console.log(rec));
  } else {
    console.log("\n✅ All test files are within size limits!");
    console.log("   Following Bun's test organization patterns.");
  }

  // Exit with error code if oversized files found (for CI)
  if (report.oversizedFiles.length > 0) {
    console.log("\n❌ CI Check Failed: Large test files detected");
    process.exit(1);
  } else {
    console.log("\n✅ CI Check Passed: All test files properly sized");
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

export { analyzeTestFiles, type TestFileInfo, type SizeReport };