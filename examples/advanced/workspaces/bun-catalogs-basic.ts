#!/usr/bin/env bun
/**
 * Bun Catalogs Basic Example
 * Demonstrates fundamental catalog usage in monorepos
 *
 * This example shows how to define and use catalogs for
 * sharing dependency versions across workspace packages.
 */

import { $ } from "bun";

export class BunCatalogsBasic {
  /**
   * Demonstrate basic catalog definition and usage
   */
  static async demonstrateBasicCatalogs(): Promise<void> {
    console.log("📦 Bun Catalogs: Basic Usage\n");

    // Show root package.json with catalog
    const rootPackageJson = {
      name: "my-monorepo",
      workspaces: {
        packages: ["packages/*"],
        catalog: {
          react: "^19.1.0",
          "react-dom": "^19.1.0",
          typescript: "^5.6.2"
        }
      }
    };

    console.log("Root package.json with catalog:");
    console.log(JSON.stringify(rootPackageJson, null, 2));
    console.log();

    // Show workspace package using catalog
    const workspacePackageJson = {
      name: "my-app",
      dependencies: {
        react: "catalog:",
        "react-dom": "catalog:"
      },
      devDependencies: {
        typescript: "catalog:"
      }
    };

    console.log("Workspace package.json using catalog:");
    console.log(JSON.stringify(workspacePackageJson, null, 2));
    console.log();

    // Demonstrate catalog resolution
    console.log("🔍 Catalog Resolution:");
    console.log("• react: catalog: → ^19.1.0");
    console.log("• typescript: catalog: → ^5.6.2");
    console.log("• All packages use consistent versions!");
    console.log();

    // Show bun install command
    console.log("🚀 Installation:");
    console.log("bun install  # Resolves all catalog: references");
    console.log();

    // Demonstrate benefits
    await BunCatalogsManager.showCatalogBenefits();
  }

  /**
   * Show catalog update workflow
   */
  static async demonstrateCatalogUpdates(): Promise<void> {
    console.log("🔄 Updating Catalog Versions\n");

    console.log("Before (root package.json):");
    console.log(`  "react": "^19.1.0"`);
    console.log();

    console.log("Update to React 19.2.0:");
    console.log(`  "react": "^19.2.0"`);
    console.log(`  "react-dom": "^19.2.0"`);
    console.log();

    console.log("Run update:");
    console.log("bun install  # Updates all packages automatically");
    console.log();

    console.log("✅ All workspace packages now use React 19.2.0");
    console.log("   No manual updates needed in individual package.json files!");
  }
}

// Manager class for catalog operations
export class BunCatalogsManager {
  /**
   * Show the benefits of using catalogs
   */
  static async showCatalogBenefits(): Promise<void> {
    console.log("🎯 Why Use Bun Catalogs?\n");

    const benefits = [
      {
        Benefit: "Consistency",
        Description: "Same dependency versions across all packages",
        Traditional: "Manual sync required",
        Catalogs: "Automatic consistency"
      },
      {
        Benefit: "Maintenance",
        Description: "Update versions in one place",
        Traditional: "Update N package.json files",
        Catalogs: "Update 1 root file"
      },
      {
        Benefit: "Clarity",
        Description: "Obvious which deps are standardized",
        Traditional: "Scattered version declarations",
        Catalogs: "Clear catalog references"
      },
      {
        Benefit: "Performance",
        Description: "Fast dependency resolution",
        Traditional: "Variable resolution time",
        Catalogs: "~0.1ms overhead"
      },
      {
        Benefit: "Publishing",
        Description: "Clean published packages",
        Traditional: "Manual version resolution",
        Catalogs: "Auto semver conversion"
      }
    ];

    console.log(Bun.inspect.table(benefits, [
      'Benefit', 'Description', 'Traditional', 'Catalogs'
    ], { colors: true }));
  }

  /**
   * Validate catalog configuration
   */
  static async validateCatalogConfig(workspaceRoot: string = '.'): Promise<boolean> {
    try {
      const packageJson = await Bun.file(`${workspaceRoot}/package.json`).json();

      if (!packageJson.workspaces?.catalog && !packageJson.catalog) {
        console.log("❌ No catalog defined in root package.json");
        return false;
      }

      console.log("✅ Catalog configuration valid");
      return true;
    } catch (error) {
      console.log("❌ Error validating catalog:", (error as Error).message);
      return false;
    }
  }
}

// CLI execution
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'basic':
      await BunCatalogsBasic.demonstrateBasicCatalogs();
      break;
    case 'updates':
      await BunCatalogsBasic.demonstrateCatalogUpdates();
      break;
    case 'validate':
      const workspaceRoot = args[1] || '.';
      await BunCatalogsManager.validateCatalogConfig(workspaceRoot);
      break;
    default:
      console.log("Bun Catalogs Basic Example");
      console.log("Usage:");
      console.log("  bun run examples/advanced/workspaces/bun-catalogs-basic.ts basic");
      console.log("  bun run examples/advanced/workspaces/bun-catalogs-basic.ts updates");
      console.log("  bun run examples/advanced/workspaces/bun-catalogs-basic.ts validate [workspace-root]");
  }
}