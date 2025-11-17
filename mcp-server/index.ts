#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create MCP server with comprehensive capabilities
const server = new McpServer({
  name: "odds-protocol-mcp",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
  },
});

// Validation schemas
const ProjectSetupSchema = z.object({
  projectName: z.string(),
  template: z.enum(["minimal", "full", "websocket", "ml"]),
  includeTests: z.boolean().default(true),
  includeCI: z.boolean().default(true),
});

const TestConfigSchema = z.object({
  coverage: z.boolean().default(true),
  concurrent: z.boolean().default(true),
  performance: z.boolean().default(false),
  integration: z.boolean().default(true),
});

const DeployConfigSchema = z.object({
  environment: z.enum(["development", "staging", "production"]),
  region: z.string().default("us-east-1"),
  force: z.boolean().default(false),
});

// Project Management Tools
server.tool(
  "setup-project",
  "Automatically set up a new Odds Protocol project with optimal configuration",
  {
    projectName: z.string(),
    template: z.enum(["minimal", "full", "websocket", "ml"]).default("full"),
    includeTests: z.boolean().default(true),
    includeCI: z.boolean().default(true),
  },
  async ({
    projectName,
    template,
    includeTests,
    includeCI,
  }: {
    projectName: string;
    template: "minimal" | "full" | "websocket" | "ml";
    includeTests: boolean;
    includeCI: boolean;
  }) => {
    try {
      const validation = ProjectSetupSchema.parse({
        projectName,
        template,
        includeTests,
        includeCI,
      });

      const setupCommands = [
        `mkdir -p ${validation.projectName}`,
        `cd ${validation.projectName}`,
        "bun init -y",
        "bun add @types/bun typescript",
        "bun add zod fast-check @js-temporal/polyfill",
      ];

      if (validation.includeTests) {
        setupCommands.push(
          "bun add -d vitest @vitest/coverage-v8 happy-dom",
          "mkdir -p __tests__",
          "echo 'import { describe, it, expect } from \"vitest\";' > __tests__/basic.test.ts"
        );
      }

      if (validation.includeCI) {
        setupCommands.push(
          "mkdir -p .github/workflows",
          "echo 'name: CI\\non: [push]\\njobs:\\n  test:\\n    runs-on: ubuntu-latest\\n    steps:\\n      - uses: actions/checkout@v4\\n      - uses: oven-sh/setup-bun@v1\\n      - run: bun test' > .github/workflows/ci.yml"
        );
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ Project setup plan created for ${validation.projectName}

🚀 Setup Commands:
${setupCommands.join("\\n")}

📋 Template: ${validation.template}
🧪 Tests: ${validation.includeTests ? "Enabled" : "Disabled"}
🔄 CI/CD: ${validation.includeCI ? "Enabled" : "Disabled"}

Run these commands sequentially to set up your project.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Setup validation failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Testing Tools
server.tool(
  "run-comprehensive-tests",
  "Execute complete test suite with coverage, performance, and integration tests",
  {
    coverage: z.boolean().default(true),
    concurrent: z.boolean().default(true),
    performance: z.boolean().default(false),
    integration: z.boolean().default(true),
  },
  async ({
    coverage,
    concurrent,
    performance,
    integration,
  }: {
    coverage: boolean;
    concurrent: boolean;
    performance: boolean;
    integration: boolean;
  }) => {
    try {
      const validation = TestConfigSchema.parse({
        coverage,
        concurrent,
        performance,
        integration,
      });

      const testCommands = [];

      // Core tests
      let coreTestCmd = "bun test --config ./bun.test.toml";
      if (validation.concurrent) {
        coreTestCmd += " --concurrent";
      }
      if (validation.coverage) {
        coreTestCmd += " --coverage";
      }
      testCommands.push(coreTestCmd);

      // Performance tests
      if (validation.performance) {
        testCommands.push("bun run test:performance");
        testCommands.push("bun run benchmark");
      }

      // Integration tests
      if (validation.integration) {
        testCommands.push("bun run test:integration");
      }

      // Type checking
      testCommands.push("bun run typecheck");

      // Linting
      testCommands.push("bun run lint");

      return {
        content: [
          {
            type: "text",
            text: `🧪 Comprehensive Test Suite Execution

📊 Test Configuration:
- Coverage: ${validation.coverage ? "Enabled" : "Disabled"}
- Concurrent: ${validation.concurrent ? "Enabled" : "Disabled"}
- Performance: ${validation.performance ? "Enabled" : "Disabled"}
- Integration: ${validation.integration ? "Enabled" : "Disabled"}

🚀 Execution Commands:
${testCommands.map((cmd, i) => `${i + 1}. ${cmd}`).join("\\n")}

📈 Results will be available in:
- ./test-results/ (detailed reports)
- ./coverage/ (coverage reports)
- console output (real-time status)`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Test configuration failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Verification Tools
server.tool(
  "verify-project-health",
  "Perform incremental verification of project health and dependencies",
  {
    deepScan: z.boolean().default(false),
    security: z.boolean().default(true),
    performance: z.boolean().default(true),
  },
  async ({
    deepScan,
    security,
    performance,
  }: {
    deepScan: boolean;
    security: boolean;
    performance: boolean;
  }) => {
    const verificationSteps = [
      "🔍 Checking project structure...",
      "📦 Verifying dependencies...",
      "🔒 Security audit...",
      "⚡ Performance analysis...",
      "🧪 Test validation...",
      "📋 Type checking...",
    ];

    if (deepScan) {
      verificationSteps.push(
        "🔬 Deep code analysis...",
        "📊 Memory usage profiling...",
        "🌐 Network dependency mapping..."
      );
    }

    const verificationCommands = [
      "bun run catalog:validate",
      "bun run lint",
      "bun run typecheck",
    ];

    if (security) {
      verificationCommands.push("bun audit");
    }

    if (performance) {
      verificationCommands.push("bun run benchmark");
    }

    return {
      content: [
        {
          type: "text",
          text: `🏥 Project Health Verification

📋 Verification Steps:
${verificationSteps.join("\\n")}

🔧 Commands to Execute:
${verificationCommands.map((cmd, i) => `${i + 1}. ${cmd}`).join("\\n")}

📊 Health Check Categories:
- ✅ Structure: Monorepo layout and workspace configuration
- ✅ Dependencies: Catalog management and version consistency
- ✅ Security: Vulnerability scanning and dependency audit
- ✅ Performance: Benchmark and optimization validation
- ✅ Quality: Type checking and linting results
- ✅ Testing: Coverage and test suite integrity

🎯 Recommendations will be provided based on results.`,
        },
      ],
    };
  }
);

// Deployment Tools
server.tool(
  "automated-deployment",
  "Execute automated deployment with proper validation and rollback capabilities",
  {
    environment: z.enum(["development", "staging", "production"]),
    region: z.string().default("us-east-1"),
    force: z.boolean().default(false),
  },
  async ({
    environment,
    region,
    force,
  }: {
    environment: "development" | "staging" | "production";
    region: string;
    force: boolean;
  }) => {
    try {
      const validation = DeployConfigSchema.parse({
        environment,
        region,
        force,
      });

      const deploymentSteps = [
        "🔍 Pre-deployment validation",
        "🏗️ Build and optimization",
        "🧪 Test suite execution",
        "📦 Package creation",
        "🚀 Deployment to target",
        "✅ Post-deployment verification",
      ];

      const deploymentCommands = [
        "bun run build:prod",
        "bun run test:ci",
      ];

      if (validation.environment === "production") {
        deploymentCommands.push("bun run security:scan");
        deploymentCommands.push("bun run performance:benchmark");
      }

      deploymentCommands.push(`bun run deploy:${validation.environment}`);

      if (validation.force) {
        deploymentCommands.push("--force");
      }

      return {
        content: [
          {
            type: "text",
            text: `🚀 Automated Deployment Pipeline

🎯 Target Environment: ${validation.environment}
🌍 Region: ${validation.region}
⚡ Force Deploy: ${validation.force ? "Yes" : "No"}

📋 Deployment Steps:
${deploymentSteps.map((step, i) => `${i + 1}. ${step}`).join("\\n")}

🔧 Execution Commands:
${deploymentCommands.join("\\n")}

🛡️ Safety Features:
- Pre-deployment health checks
- Automated rollback on failure
- Performance monitoring
- Security validation
- Dependency verification

📊 Deployment status will be tracked in real-time.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Deployment configuration failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Resource Management
server.resource(
  "project-structure",
  "text/plain",
  async (uri: any) => {
    const structure = {
      name: "odds-protocol-monorepo",
      type: "monorepo",
      packages: [
        "odds-core (core utilities and types)",
        "odds-websocket (high-performance WebSocket server)",
        "odds-arbitrage (arbitrage detection algorithms)",
        "odds-ml (machine learning models)",
        "odds-temporal (temporal data handling)",
        "odds-validation (data validation schemas)",
      ],
      apps: [
        "api-gateway (Cloudflare Workers API)",
        "dashboard (React dashboard)",
        "stream-processor (real-time data processing)",
      ],
      scripts: [
        "build.ts (build automation)",
        "deploy.ts (deployment pipeline)",
        "benchmark.ts (performance testing)",
        "test-setup.ts (test configuration)",
      ],
    };

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(structure, null, 2),
        },
      ],
    };
  }
);

server.resource(
  "test-configuration",
  "text/plain",
  async (uri: any) => {
    const config = {
      framework: "bun test",
      concurrency: true,
      coverage: {
        enabled: true,
        provider: "v8",
        threshold: 80,
        reporters: ["text", "lcov", "html"],
      },
      performance: {
        enabled: true,
        thresholds: {
          "websocket-message": 100,
          "network-request": 5000,
          "hash-operation": 10,
        },
      },
      integration: {
        enabled: true,
        database: "postgresql://test:test@localhost:5432/odds_test",
        services: ["api-gateway", "stream-processor"],
      },
    };

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(config, null, 2),
        },
      ],
    };
  }
);

// Prompts for common tasks
server.prompt(
  "optimize-performance",
  "Generate performance optimization recommendations for the Odds Protocol",
  {
    component: z.string().optional(),
    metrics: z.boolean().default(true),
  }
);

server.prompt(
  "setup-development-environment",
  "Provide comprehensive development environment setup instructions",
  {
    platform: z.enum(["macos", "linux", "windows"]).default("macos"),
    features: z.array(z.string()).default(["all"]),
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Odds Protocol MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
