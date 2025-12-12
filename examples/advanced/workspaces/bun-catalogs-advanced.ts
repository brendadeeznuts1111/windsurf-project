#!/usr/bin/env bun
/**
 * Bun Catalogs Advanced Example
 * Demonstrates advanced catalog features and publishing workflows
 */

import { $ } from "bun";

export class BunCatalogsAdvanced {
  /**
   * Demonstrate multiple catalogs and complex scenarios
   */
  static async demonstrateAdvancedCatalogs(): Promise<void> {
    console.log("🚀 Bun Catalogs: Advanced Features\n");

    // Show multiple catalogs
    const advancedPackageJson = {
      name: "enterprise-monorepo",
      workspaces: {
        packages: ["packages/*", "apps/*"],
        catalog: {
          // Core runtime dependencies
          react: "^19.1.0",
          "react-dom": "^19.1.0",
          typescript: "^5.6.2"
        },
        catalogs: {
          // Tool-specific catalogs
          testing: {
            jest: "^30.0.0",
            "@testing-library/react": "^14.3.0",
            "@testing-library/jest-dom": "^6.5.0"
          },
          build: {
            webpack: "^5.94.0",
            "@babel/core": "^7.25.0",
            "babel-loader": "^9.2.0"
          },
          linting: {
            eslint: "^9.0.0",
            "@typescript-eslint/parser": "^8.0.0",
            "@typescript-eslint/eslint-plugin": "^8.0.0"
          }
        }
      }
    };

    console.log("Advanced catalog configuration:");
    console.log(JSON.stringify(advancedPackageJson, null, 2));
    console.log();

    // Show complex workspace usage
    const complexWorkspace = {
      name: "@enterprise/app",
      dependencies: {
        react: "catalog:",
        "react-dom": "catalog:"
      },
      devDependencies: {
        typescript: "catalog:",
        jest: "catalog:testing",
        "@testing-library/react": "catalog:testing",
        webpack: "catalog:build",
        eslint: "catalog:linting"
      }
    };

    console.log("Complex workspace using multiple catalogs:");
    console.log(JSON.stringify(complexWorkspace, null, 2));
    console.log();

    await this.demonstratePublishingWorkflow();
  }

  /**
   * Demonstrate publishing with catalogs
   */
  static async demonstratePublishingWorkflow(): Promise<void> {
    console.log("📦 Publishing with Catalogs\n");

    console.log("Before publishing (workspace package.json):");
    console.log(`  "react": "catalog:"`);
    console.log(`  "jest": "catalog:testing"`);
    console.log();

    console.log("During bun publish:");
    console.log("• catalog: references → resolved semver");
    console.log("• catalog:testing references → resolved semver");
    console.log();

    console.log("Published package.json (automatic):");
    console.log(`  "react": "^19.1.0"`);
    console.log(`  "jest": "^30.0.0"`);
    console.log();

    console.log("✅ Publishing workflow:");
    console.log("1. bun publish --workspaces  # Publish all packages");
    console.log("2. Catalogs auto-resolve to versions");
    console.log("3. Published packages have standard semver");
    console.log("4. Consumers see normal dependency declarations");
  }

  /**
   * Show catalog migration from traditional approach
   */
  static async demonstrateMigration(): Promise<void> {
    console.log("🔄 Migration from Traditional Dependencies\n");

    console.log("BEFORE (Traditional approach):");
    const traditionalPackages = [
      { name: "app", react: "^19.0.0", jest: "^29.0.0" },
      { name: "ui", react: "^19.1.0", jest: "^29.0.0" },
      { name: "utils", react: "^19.0.0", jest: "^30.0.0" }
    ];
    console.log(Bun.inspect.table(traditionalPackages, undefined, { colors: true }));
    console.log("❌ Inconsistent versions, manual sync required");
    console.log();

    console.log("AFTER (With catalogs):");
    const catalogPackages = [
      { name: "app", react: "catalog:", jest: "catalog:testing" },
      { name: "ui", react: "catalog:", jest: "catalog:testing" },
      { name: "utils", react: "catalog:", jest: "catalog:testing" }
    ];
    console.log(Bun.inspect.table(catalogPackages, undefined, { colors: true }));
    console.log("✅ Consistent versions, single source of truth");
    console.log();

    console.log("Migration steps:");
    console.log("1. Define catalogs in root package.json");
    console.log("2. Replace version strings with 'catalog:' or 'catalog:name'");
    console.log("3. Run bun install to update lockfile");
    console.log("4. Test and publish with resolved versions");
  }

  /**
   * Performance analysis of catalogs
   */
  static async analyzePerformance(): Promise<void> {
    console.log("⚡ Catalog Performance Analysis\n");

    const performanceData = [
      {
        Operation: "Catalog Resolution",
        Time: "~0.1ms",
        Impact: "Negligible",
        Note: "Per package during install"
      },
      {
        Operation: "Lockfile Generation",
        Time: "~50ms",
        Impact: "Fast",
        Note: "Binary format optimization"
      },
      {
        Operation: "Version Updates",
        Time: "~100ms",
        Impact: "Instant",
        Note: "Single file change"
      },
      {
        Operation: "Publishing Resolution",
        Time: "~5ms",
        Impact: "Fast",
        Note: "Auto semver conversion"
      }
    ];

    console.log("Performance metrics:");
    console.log(Bun.inspect.table(performanceData, [
      'Operation', 'Time', 'Impact', 'Note'
    ], { colors: true }));

    console.log("\n💡 Catalogs add minimal overhead while providing significant DX benefits");
  }
}

// CLI execution
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'advanced':
      await BunCatalogsAdvanced.demonstrateAdvancedCatalogs();
      break;
    case 'publishing':
      await BunCatalogsAdvanced.demonstratePublishingWorkflow();
      break;
    case 'migration':
      await BunCatalogsAdvanced.demonstrateMigration();
      break;
    case 'performance':
      await BunCatalogsAdvanced.analyzePerformance();
      break;
    default:
      console.log("Bun Catalogs Advanced Example");
      console.log("Usage:");
      console.log("  bun run examples/advanced/workspaces/bun-catalogs-advanced.ts advanced");
      console.log("  bun run examples/advanced/workspaces/bun-catalogs-advanced.ts publishing");
      console.log("  bun run examples/advanced/workspaces/bun-catalogs-advanced.ts migration");
      console.log("  bun run examples/advanced/workspaces/bun-catalogs-advanced.ts performance");
  }
}