#!/usr/bin/env bun

/**
 * Azure DevOps CLI Helper
 * Unified CLI for common Azure DevOps operations
 * Usage: bun run scripts/az-devops-cli.ts <command> [options]
 */

const AZURE_ORG = "https://dev.azure.com/brendawill2233";
const AZURE_PROJECT = "brendawill2233";
const AZURE_REPO = "brendawill2233";

type CommandHandler = (args: string[]) => Promise<void>;

const commands: Record<string, { description: string; handler: CommandHandler }> = {
  // Status & Info
  status: {
    description: "Show project status overview",
    handler: async () => {
      console.log("📊 Azure DevOps Project Status\n");

      // Project info
      await run("az", ["devops", "project", "show", "--project", AZURE_PROJECT, "--org", AZURE_ORG, "--output", "table"]);

      console.log("\n📋 Recent Work Items:");
      await run("az", ["boards", "query", "--wiql",
        `SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.TeamProject] = '${AZURE_PROJECT}' AND [System.State] <> 'Closed' ORDER BY [System.ChangedDate] DESC`,
        "--org", AZURE_ORG, "--project", AZURE_PROJECT, "--output", "table"]);

      console.log("\n🚀 Recent Pipeline Runs:");
      await run("az", ["pipelines", "runs", "list", "--top", "5", "--org", AZURE_ORG, "--project", AZURE_PROJECT, "--output", "table"]);

      console.log("\n🔀 Active Pull Requests:");
      await run("az", ["repos", "pr", "list", "--status", "active", "--top", "5", "--org", AZURE_ORG, "--project", AZURE_PROJECT, "--output", "table"]);
    },
  },

  // Work Items
  "wi:create": {
    description: "Create a work item: wi:create <type> <title>",
    handler: async (args) => {
      const [type, ...titleParts] = args;
      const title = titleParts.join(" ");

      if (!type || !title) {
        console.error("Usage: wi:create <Task|Bug|Story> <title>");
        process.exit(1);
      }

      const typeMap: Record<string, string> = {
        task: "Task",
        bug: "Bug",
        story: "User Story",
        feature: "Feature",
        epic: "Epic",
      };

      const workItemType = typeMap[type.toLowerCase()] || type;

      console.log(`📋 Creating ${workItemType}: ${title}`);
      await run("az", ["boards", "work-item", "create",
        "--title", title,
        "--type", workItemType,
        "--org", AZURE_ORG,
        "--project", AZURE_PROJECT,
        "--output", "table"
      ]);
    },
  },

  "wi:list": {
    description: "List work items: wi:list [state]",
    handler: async (args) => {
      const state = args[0] || "Active";
      const wiql = state.toLowerCase() === "all"
        ? `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE [System.TeamProject] = '${AZURE_PROJECT}' ORDER BY [System.ChangedDate] DESC`
        : `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE [System.TeamProject] = '${AZURE_PROJECT}' AND [System.State] = '${state}' ORDER BY [System.ChangedDate] DESC`;

      console.log(`📋 Work Items (${state}):\n`);
      await run("az", ["boards", "query", "--wiql", wiql, "--org", AZURE_ORG, "--project", AZURE_PROJECT, "--output", "table"]);
    },
  },

  "wi:show": {
    description: "Show work item details: wi:show <id>",
    handler: async (args) => {
      const id = args[0];
      if (!id) {
        console.error("Usage: wi:show <work-item-id>");
        process.exit(1);
      }

      console.log(`📋 Work Item #${id}:\n`);
      await run("az", ["boards", "work-item", "show", "--id", id, "--org", AZURE_ORG, "--output", "yaml"]);
    },
  },

  "wi:update": {
    description: "Update work item state: wi:update <id> <state>",
    handler: async (args) => {
      const [id, state] = args;
      if (!id || !state) {
        console.error("Usage: wi:update <work-item-id> <New|Active|Resolved|Closed>");
        process.exit(1);
      }

      console.log(`📋 Updating Work Item #${id} to ${state}`);
      await run("az", ["boards", "work-item", "update",
        "--id", id,
        "--state", state,
        "--org", AZURE_ORG,
        "--output", "table"
      ]);
    },
  },

  // Pipelines
  "pipe:list": {
    description: "List pipelines",
    handler: async () => {
      console.log("🚀 Pipelines:\n");
      await run("az", ["pipelines", "list", "--org", AZURE_ORG, "--project", AZURE_PROJECT, "--output", "table"]);
    },
  },

  "pipe:run": {
    description: "Run a pipeline: pipe:run <name> [branch]",
    handler: async (args) => {
      const [name, branch = "main"] = args;
      if (!name) {
        console.error("Usage: pipe:run <pipeline-name> [branch]");
        process.exit(1);
      }

      console.log(`🚀 Running pipeline: ${name} on ${branch}`);
      await run("az", ["pipelines", "run",
        "--name", name,
        "--branch", branch,
        "--org", AZURE_ORG,
        "--project", AZURE_PROJECT,
        "--output", "table"
      ]);
    },
  },

  "pipe:runs": {
    description: "Show recent pipeline runs: pipe:runs [count]",
    handler: async (args) => {
      const count = args[0] || "10";
      console.log(`🚀 Recent Pipeline Runs:\n`);
      await run("az", ["pipelines", "runs", "list",
        "--top", count,
        "--org", AZURE_ORG,
        "--project", AZURE_PROJECT,
        "--output", "table"
      ]);
    },
  },

  // Pull Requests
  "pr:create": {
    description: "Create PR: pr:create <source-branch> <title>",
    handler: async (args) => {
      const [sourceBranch, ...titleParts] = args;
      const title = titleParts.join(" ");

      if (!sourceBranch || !title) {
        console.error("Usage: pr:create <source-branch> <title>");
        process.exit(1);
      }

      console.log(`🔀 Creating PR: ${sourceBranch} → main`);
      await run("az", ["repos", "pr", "create",
        "--source-branch", sourceBranch,
        "--target-branch", "main",
        "--title", title,
        "--org", AZURE_ORG,
        "--project", AZURE_PROJECT,
        "--output", "table"
      ]);
    },
  },

  "pr:list": {
    description: "List pull requests: pr:list [status]",
    handler: async (args) => {
      const status = args[0] || "active";
      console.log(`🔀 Pull Requests (${status}):\n`);
      await run("az", ["repos", "pr", "list",
        "--status", status,
        "--org", AZURE_ORG,
        "--project", AZURE_PROJECT,
        "--output", "table"
      ]);
    },
  },

  "pr:show": {
    description: "Show PR details: pr:show <id>",
    handler: async (args) => {
      const id = args[0];
      if (!id) {
        console.error("Usage: pr:show <pr-id>");
        process.exit(1);
      }

      console.log(`🔀 Pull Request #${id}:\n`);
      await run("az", ["repos", "pr", "show", "--id", id, "--org", AZURE_ORG, "--output", "yaml"]);
    },
  },

  "pr:approve": {
    description: "Approve a PR: pr:approve <id>",
    handler: async (args) => {
      const id = args[0];
      if (!id) {
        console.error("Usage: pr:approve <pr-id>");
        process.exit(1);
      }

      console.log(`✅ Approving PR #${id}`);
      await run("az", ["repos", "pr", "set-vote",
        "--id", id,
        "--vote", "approve",
        "--org", AZURE_ORG,
        "--output", "table"
      ]);
    },
  },

  "pr:complete": {
    description: "Complete/merge a PR: pr:complete <id>",
    handler: async (args) => {
      const id = args[0];
      if (!id) {
        console.error("Usage: pr:complete <pr-id>");
        process.exit(1);
      }

      console.log(`🔀 Completing PR #${id}`);
      await run("az", ["repos", "pr", "update",
        "--id", id,
        "--status", "completed",
        "--org", AZURE_ORG,
        "--output", "table"
      ]);
    },
  },

  // Repository
  "repo:branches": {
    description: "List branches",
    handler: async () => {
      console.log("🌿 Branches:\n");
      await run("az", ["repos", "ref", "list",
        "--repository", AZURE_REPO,
        "--filter", "heads/",
        "--org", AZURE_ORG,
        "--project", AZURE_PROJECT,
        "--output", "table"
      ]);
    },
  },

  "repo:clone": {
    description: "Show clone URLs",
    handler: async () => {
      console.log("📁 Clone Repository:\n");
      console.log("SSH:");
      console.log(`  git clone git@ssh.dev.azure.com:v3/brendawill2233/${AZURE_PROJECT}/${AZURE_REPO}`);
      console.log("\nHTTPS:");
      console.log(`  git clone https://dev.azure.com/brendawill2233/${AZURE_PROJECT}/_git/${AZURE_REPO}`);
      console.log("\nAdd as remote:");
      console.log(`  git remote add azure https://dev.azure.com/brendawill2233/${AZURE_PROJECT}/_git/${AZURE_REPO}`);
    },
  },

  // Sync
  sync: {
    description: "Sync local repo with Azure DevOps",
    handler: async () => {
      console.log("🔄 Syncing with Azure DevOps...\n");

      // Check if azure remote exists
      const result = await Bun.spawn(["git", "remote", "-v"]).text();

      if (!result.includes("azure")) {
        console.log("Adding azure remote...");
        await run("git", ["remote", "add", "azure", `https://dev.azure.com/brendawill2233/${AZURE_PROJECT}/_git/${AZURE_REPO}`]);
      }

      console.log("Fetching from azure...");
      await run("git", ["fetch", "azure"]);

      console.log("Pushing to azure...");
      await run("git", ["push", "azure", "main"]);

      console.log("\n✅ Sync complete!");
    },
  },

  // Artifacts
  "artifacts:list": {
    description: "List artifact feeds",
    handler: async () => {
      console.log("📦 Artifact Feeds:\n");
      await run("az", ["artifacts", "feed", "list", "--org", AZURE_ORG, "--output", "table"]);
    },
  },

  // Help
  help: {
    description: "Show this help message",
    handler: async () => {
      console.log("Azure DevOps CLI Helper\n");
      console.log("Usage: bun run scripts/az-devops-cli.ts <command> [options]\n");
      console.log("Commands:");

      const categories: Record<string, string[]> = {
        "General": ["status", "sync", "help"],
        "Work Items": ["wi:create", "wi:list", "wi:show", "wi:update"],
        "Pipelines": ["pipe:list", "pipe:run", "pipe:runs"],
        "Pull Requests": ["pr:create", "pr:list", "pr:show", "pr:approve", "pr:complete"],
        "Repository": ["repo:branches", "repo:clone"],
        "Artifacts": ["artifacts:list"],
      };

      for (const [category, cmds] of Object.entries(categories)) {
        console.log(`\n  ${category}:`);
        for (const cmd of cmds) {
          const command = commands[cmd];
          if (command) {
            console.log(`    ${cmd.padEnd(20)} ${command.description}`);
          }
        }
      }

      console.log("\nExamples:");
      console.log("  bun run scripts/az-devops-cli.ts status");
      console.log("  bun run scripts/az-devops-cli.ts wi:create task 'Fix login bug'");
      console.log("  bun run scripts/az-devops-cli.ts pipe:run odds-protocol-ci");
      console.log("  bun run scripts/az-devops-cli.ts pr:create feature/auth 'Add authentication'");
    },
  },
};

async function run(cmd: string, args: string[]): Promise<void> {
  const proc = Bun.spawn([cmd, ...args], {
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "help" || command === "--help" || command === "-h") {
    await commands.help.handler([]);
    return;
  }

  const cmd = commands[command];
  if (!cmd) {
    console.error(`Unknown command: ${command}`);
    console.error("Run 'bun run scripts/az-devops-cli.ts help' for available commands");
    process.exit(1);
  }

  try {
    await cmd.handler(args);
  } catch (error) {
    console.error(`Error executing ${command}:`, error);
    process.exit(1);
  }
}

main();
