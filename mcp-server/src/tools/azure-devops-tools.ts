#!/usr/bin/env bun

/**
 * Azure DevOps MCP Tools
 * Comprehensive CLI integration for Azure DevOps operations
 */

import { z } from "zod";

// Azure DevOps Configuration
const AZURE_ORG = "https://dev.azure.com/brendawill2233";
const AZURE_PROJECT = "brendawill2233";

// Schemas
export const WorkItemSchema = z.object({
  title: z.string(),
  type: z.enum(["Task", "Bug", "User Story", "Feature", "Epic"]),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.number().min(1).max(4).optional(),
  areaPath: z.string().optional(),
  iterationPath: z.string().optional(),
});

export const PipelineSchema = z.object({
  name: z.string(),
  branch: z.string().default("main"),
  variables: z.record(z.string()).optional(),
});

export const PRSchema = z.object({
  title: z.string(),
  description: z.string(),
  sourceBranch: z.string(),
  targetBranch: z.string().default("main"),
  reviewers: z.array(z.string()).optional(),
  workItems: z.array(z.number()).optional(),
  isDraft: z.boolean().default(false),
});

// Tool Definitions
export const azureDevOpsTools = {
  // Work Item Management
  createWorkItem: {
    name: "azure-create-work-item",
    description: "Create a new work item in Azure DevOps (Task, Bug, User Story, Feature, or Epic)",
    schema: WorkItemSchema,
    handler: async (args: z.infer<typeof WorkItemSchema>) => {
      const validation = WorkItemSchema.parse(args);

      const cliCommand = [
        "az boards work-item create",
        `--title "${validation.title}"`,
        `--type "${validation.type}"`,
        `--org "${AZURE_ORG}"`,
        `--project "${AZURE_PROJECT}"`,
      ];

      if (validation.description) {
        cliCommand.push(`--description "${validation.description}"`);
      }
      if (validation.assignedTo) {
        cliCommand.push(`--assigned-to "${validation.assignedTo}"`);
      }
      if (validation.areaPath) {
        cliCommand.push(`--area "${validation.areaPath}"`);
      }
      if (validation.iterationPath) {
        cliCommand.push(`--iteration "${validation.iterationPath}"`);
      }

      return {
        content: [{
          type: "text",
          text: `📋 **Azure DevOps Work Item Creation**

**Type:** ${validation.type}
**Title:** ${validation.title}
${validation.description ? `**Description:** ${validation.description}` : ""}
${validation.assignedTo ? `**Assigned To:** ${validation.assignedTo}` : ""}
${validation.areaPath ? `**Area Path:** ${validation.areaPath}` : ""}
${validation.iterationPath ? `**Iteration:** ${validation.iterationPath}` : ""}

**CLI Command:**
\`\`\`bash
${cliCommand.join(" \\\n  ")}
\`\`\`

**To execute:**
\`\`\`bash
${cliCommand.join(" ")}
\`\`\``,
        }],
      };
    },
  },

  listWorkItems: {
    name: "azure-list-work-items",
    description: "List work items from Azure DevOps with optional filters",
    schema: z.object({
      type: z.enum(["Task", "Bug", "User Story", "Feature", "Epic", "All"]).optional(),
      state: z.enum(["New", "Active", "Resolved", "Closed", "All"]).optional(),
      assignedTo: z.string().optional(),
      areaPath: z.string().optional(),
      limit: z.number().default(50),
    }),
    handler: async (args: any) => {
      let wiql = `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo] FROM WorkItems WHERE [System.TeamProject] = '${AZURE_PROJECT}'`;

      if (args.type && args.type !== "All") {
        wiql += ` AND [System.WorkItemType] = '${args.type}'`;
      }
      if (args.state && args.state !== "All") {
        wiql += ` AND [System.State] = '${args.state}'`;
      }
      if (args.assignedTo) {
        wiql += ` AND [System.AssignedTo] = '${args.assignedTo}'`;
      }
      if (args.areaPath) {
        wiql += ` AND [System.AreaPath] UNDER '${args.areaPath}'`;
      }

      wiql += ` ORDER BY [System.ChangedDate] DESC`;

      return {
        content: [{
          type: "text",
          text: `📋 **Azure DevOps Work Item Query**

**Filters:**
- Type: ${args.type || "All"}
- State: ${args.state || "All"}
- Assigned To: ${args.assignedTo || "Any"}
- Area Path: ${args.areaPath || "Any"}
- Limit: ${args.limit}

**WIQL Query:**
\`\`\`sql
${wiql}
\`\`\`

**CLI Command:**
\`\`\`bash
az boards query \\
  --wiql "${wiql}" \\
  --org "${AZURE_ORG}" \\
  --project "${AZURE_PROJECT}" \\
  --output table
\`\`\``,
        }],
      };
    },
  },

  // Pipeline Management
  runPipeline: {
    name: "azure-run-pipeline",
    description: "Trigger an Azure DevOps pipeline run",
    schema: PipelineSchema,
    handler: async (args: z.infer<typeof PipelineSchema>) => {
      const validation = PipelineSchema.parse(args);

      let cliCommand = `az pipelines run --name "${validation.name}" --branch "${validation.branch}" --org "${AZURE_ORG}" --project "${AZURE_PROJECT}"`;

      if (validation.variables) {
        const vars = Object.entries(validation.variables)
          .map(([k, v]) => `${k}=${v}`)
          .join(" ");
        cliCommand += ` --variables ${vars}`;
      }

      return {
        content: [{
          type: "text",
          text: `🚀 **Azure DevOps Pipeline Trigger**

**Pipeline:** ${validation.name}
**Branch:** ${validation.branch}
${validation.variables ? `**Variables:** ${JSON.stringify(validation.variables)}` : ""}

**CLI Command:**
\`\`\`bash
${cliCommand}
\`\`\`

**Monitor Build:**
\`\`\`bash
az pipelines runs list \\
  --pipeline-ids $(az pipelines show --name "${validation.name}" --query id -o tsv) \\
  --org "${AZURE_ORG}" \\
  --project "${AZURE_PROJECT}" \\
  --top 5 \\
  --output table
\`\`\``,
        }],
      };
    },
  },

  listPipelines: {
    name: "azure-list-pipelines",
    description: "List all pipelines in Azure DevOps project",
    schema: z.object({
      folder: z.string().optional(),
    }),
    handler: async (args: any) => {
      let cliCommand = `az pipelines list --org "${AZURE_ORG}" --project "${AZURE_PROJECT}" --output table`;

      if (args.folder) {
        cliCommand += ` --folder-path "${args.folder}"`;
      }

      return {
        content: [{
          type: "text",
          text: `📊 **Azure DevOps Pipelines**

**CLI Command:**
\`\`\`bash
${cliCommand}
\`\`\`

**View Recent Runs:**
\`\`\`bash
az pipelines runs list \\
  --org "${AZURE_ORG}" \\
  --project "${AZURE_PROJECT}" \\
  --top 10 \\
  --output table
\`\`\``,
        }],
      };
    },
  },

  // Pull Request Management
  createPR: {
    name: "azure-create-pr",
    description: "Create a pull request in Azure DevOps",
    schema: PRSchema,
    handler: async (args: z.infer<typeof PRSchema>) => {
      const validation = PRSchema.parse(args);

      const cliCommand = [
        "az repos pr create",
        `--title "${validation.title}"`,
        `--description "${validation.description}"`,
        `--source-branch "${validation.sourceBranch}"`,
        `--target-branch "${validation.targetBranch}"`,
        `--org "${AZURE_ORG}"`,
        `--project "${AZURE_PROJECT}"`,
      ];

      if (validation.isDraft) {
        cliCommand.push("--draft");
      }
      if (validation.reviewers && validation.reviewers.length > 0) {
        cliCommand.push(`--reviewers ${validation.reviewers.join(" ")}`);
      }
      if (validation.workItems && validation.workItems.length > 0) {
        cliCommand.push(`--work-items ${validation.workItems.join(" ")}`);
      }

      return {
        content: [{
          type: "text",
          text: `🔀 **Azure DevOps Pull Request**

**Title:** ${validation.title}
**Source:** ${validation.sourceBranch} → **Target:** ${validation.targetBranch}
**Draft:** ${validation.isDraft ? "Yes" : "No"}
${validation.reviewers ? `**Reviewers:** ${validation.reviewers.join(", ")}` : ""}
${validation.workItems ? `**Work Items:** ${validation.workItems.join(", ")}` : ""}

**CLI Command:**
\`\`\`bash
${cliCommand.join(" \\\n  ")}
\`\`\``,
        }],
      };
    },
  },

  listPRs: {
    name: "azure-list-prs",
    description: "List pull requests in Azure DevOps",
    schema: z.object({
      status: z.enum(["active", "completed", "abandoned", "all"]).default("active"),
      creatorId: z.string().optional(),
      reviewerId: z.string().optional(),
      limit: z.number().default(10),
    }),
    handler: async (args: any) => {
      let cliCommand = `az repos pr list --org "${AZURE_ORG}" --project "${AZURE_PROJECT}" --status ${args.status} --top ${args.limit} --output table`;

      return {
        content: [{
          type: "text",
          text: `🔀 **Azure DevOps Pull Requests**

**Status:** ${args.status}
**Limit:** ${args.limit}

**CLI Command:**
\`\`\`bash
${cliCommand}
\`\`\``,
        }],
      };
    },
  },

  // Repository Management
  listRepos: {
    name: "azure-list-repos",
    description: "List repositories in Azure DevOps project",
    schema: z.object({}),
    handler: async () => {
      return {
        content: [{
          type: "text",
          text: `📁 **Azure DevOps Repositories**

**CLI Command:**
\`\`\`bash
az repos list \\
  --org "${AZURE_ORG}" \\
  --project "${AZURE_PROJECT}" \\
  --output table
\`\`\`

**Clone Repository:**
\`\`\`bash
git clone git@ssh.dev.azure.com:v3/brendawill2233/brendawill2233/brendawill2233
# Or with HTTPS:
git clone https://dev.azure.com/brendawill2233/brendawill2233/_git/brendawill2233
\`\`\``,
        }],
      };
    },
  },

  // Branch Management
  listBranches: {
    name: "azure-list-branches",
    description: "List branches in Azure DevOps repository",
    schema: z.object({
      repository: z.string().default("brendawill2233"),
    }),
    handler: async (args: any) => {
      return {
        content: [{
          type: "text",
          text: `🌿 **Azure DevOps Branches**

**Repository:** ${args.repository}

**CLI Command:**
\`\`\`bash
az repos ref list \\
  --repository "${args.repository}" \\
  --org "${AZURE_ORG}" \\
  --project "${AZURE_PROJECT}" \\
  --filter heads/ \\
  --output table
\`\`\``,
        }],
      };
    },
  },

  // Artifacts Management
  listArtifacts: {
    name: "azure-list-artifacts",
    description: "List artifacts feeds in Azure DevOps",
    schema: z.object({}),
    handler: async () => {
      return {
        content: [{
          type: "text",
          text: `📦 **Azure Artifacts Feeds**

**CLI Command:**
\`\`\`bash
az artifacts universal list \\
  --org "${AZURE_ORG}" \\
  --project "${AZURE_PROJECT}" \\
  --feed "${AZURE_PROJECT}" \\
  --output table
\`\`\`

**NPM Registry Configuration (bunfig.toml):**
\`\`\`toml
[install.registry]
url = "https://pkgs.dev.azure.com/brendawill2233/_packaging/brendawill2233/npm/registry"
username = "brendawill2233"
password = "$NPM_PASSWORD"
\`\`\`

**Publish Package:**
\`\`\`bash
bun publish --registry https://pkgs.dev.azure.com/brendawill2233/_packaging/brendawill2233/npm/registry/
\`\`\``,
        }],
      };
    },
  },

  // Project Stats
  getProjectStats: {
    name: "azure-project-stats",
    description: "Get Azure DevOps project statistics and overview",
    schema: z.object({}),
    handler: async () => {
      return {
        content: [{
          type: "text",
          text: `📊 **Azure DevOps Project Statistics**

**Organization:** ${AZURE_ORG}
**Project:** ${AZURE_PROJECT}

**Get Project Info:**
\`\`\`bash
az devops project show \\
  --project "${AZURE_PROJECT}" \\
  --org "${AZURE_ORG}" \\
  --output yaml
\`\`\`

**Work Item Summary:**
\`\`\`bash
# Open work items by type
az boards query \\
  --wiql "SELECT [System.WorkItemType], COUNT(*) FROM WorkItems WHERE [System.State] <> 'Closed' GROUP BY [System.WorkItemType]" \\
  --org "${AZURE_ORG}" \\
  --project "${AZURE_PROJECT}"
\`\`\`

**Recent Activity:**
\`\`\`bash
# Recent commits
az repos ref list --repository brendawill2233 --filter heads/main --org "${AZURE_ORG}" --project "${AZURE_PROJECT}"

# Recent builds
az pipelines runs list --top 5 --org "${AZURE_ORG}" --project "${AZURE_PROJECT}" --output table

# Recent PRs
az repos pr list --status active --top 5 --org "${AZURE_ORG}" --project "${AZURE_PROJECT}" --output table
\`\`\`

**Portal Links:**
- 🏠 Project: ${AZURE_ORG}/${AZURE_PROJECT}
- 📋 Boards: ${AZURE_ORG}/${AZURE_PROJECT}/_boards
- 🚀 Pipelines: ${AZURE_ORG}/${AZURE_PROJECT}/_build
- 📁 Repos: ${AZURE_ORG}/${AZURE_PROJECT}/_git
- 📦 Artifacts: ${AZURE_ORG}/${AZURE_PROJECT}/_artifacts`,
        }],
      };
    },
  },

  // Notifications Setup
  setupNotifications: {
    name: "azure-setup-notifications",
    description: "Configure Azure DevOps notifications for the project",
    schema: z.object({
      email: z.string().email().optional(),
      events: z.array(z.enum([
        "build-completed",
        "build-failed",
        "pr-created",
        "pr-updated",
        "work-item-changed",
        "code-pushed",
      ])).default(["build-failed", "pr-created"]),
    }),
    handler: async (args: any) => {
      return {
        content: [{
          type: "text",
          text: `🔔 **Azure DevOps Notifications Setup**

**Events:** ${args.events.join(", ")}
${args.email ? `**Email:** ${args.email}` : ""}

**Configure via Portal:**
1. Go to ${AZURE_ORG}/${AZURE_PROJECT}/_settings/notifications
2. Click "New subscription"
3. Select event types: ${args.events.join(", ")}
4. Configure delivery (Email/Teams/Slack)

**CLI Commands:**
\`\`\`bash
# List existing subscriptions
az devops invoke \\
  --area notification \\
  --resource subscriptions \\
  --org "${AZURE_ORG}" \\
  --http-method GET

# Service hooks for webhooks
az devops service-endpoint list \\
  --org "${AZURE_ORG}" \\
  --project "${AZURE_PROJECT}"
\`\`\`

**Webhook Integration:**
For real-time notifications, set up service hooks at:
${AZURE_ORG}/${AZURE_PROJECT}/_settings/serviceHooks`,
        }],
      };
    },
  },
};

// Export all tool configurations for MCP server registration
export function registerAzureDevOpsTools(server: any) {
  Object.values(azureDevOpsTools).forEach(tool => {
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
  });
}

export default azureDevOpsTools;
