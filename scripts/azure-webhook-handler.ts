#!/usr/bin/env bun

/**
 * Azure DevOps Webhook Handler
 * Receives webhooks from Azure DevOps and triggers local actions
 * Usage: bun run scripts/azure-webhook-handler.ts
 */

const PORT = parseInt(process.env.WEBHOOK_PORT || "9090");

interface AzureDevOpsWebhook {
  subscriptionId: string;
  notificationId: number;
  id: string;
  eventType: string;
  publisherId: string;
  message: {
    text: string;
    html: string;
    markdown: string;
  };
  detailedMessage?: {
    text: string;
    html: string;
    markdown: string;
  };
  resource: Record<string, any>;
  resourceVersion: string;
  resourceContainers: Record<string, any>;
  createdDate: string;
}

type WebhookHandler = (webhook: AzureDevOpsWebhook) => Promise<void>;

const handlers: Record<string, WebhookHandler> = {
  // Build completed
  "build.complete": async (webhook) => {
    const build = webhook.resource;
    const status = build.status;
    const result = build.result;

    console.log(`🏗️ Build ${build.buildNumber} ${result}`);

    if (result === "failed") {
      console.log("❌ Build failed! Running diagnostics...");
      // Could trigger local test run or notification
      await Bun.spawn(["bun", "test"]).exited;
    } else if (result === "succeeded") {
      console.log("✅ Build succeeded!");
    }
  },

  // Pull request created
  "git.pullrequest.created": async (webhook) => {
    const pr = webhook.resource;
    console.log(`🔀 New PR #${pr.pullRequestId}: ${pr.title}`);
    console.log(`   From: ${pr.sourceRefName} → ${pr.targetRefName}`);
    console.log(`   Author: ${pr.createdBy?.displayName}`);

    // Could trigger local checkout and test
    const sourceBranch = pr.sourceRefName.replace("refs/heads/", "");
    console.log(`   To review locally: git fetch azure && git checkout ${sourceBranch}`);
  },

  // Pull request updated
  "git.pullrequest.updated": async (webhook) => {
    const pr = webhook.resource;
    console.log(`🔄 PR #${pr.pullRequestId} updated: ${pr.title}`);
    console.log(`   Status: ${pr.status}`);
  },

  // Pull request merged
  "git.pullrequest.merged": async (webhook) => {
    const pr = webhook.resource;
    console.log(`✅ PR #${pr.pullRequestId} merged: ${pr.title}`);

    // Sync local main
    console.log("🔄 Syncing local main branch...");
    await Bun.spawn(["git", "fetch", "azure"]).exited;
    await Bun.spawn(["git", "pull", "azure", "main"]).exited;
  },

  // Code pushed
  "git.push": async (webhook) => {
    const push = webhook.resource;
    const commits = push.commits || [];
    const branch = push.refUpdates?.[0]?.name?.replace("refs/heads/", "") || "unknown";

    console.log(`📥 Push to ${branch}: ${commits.length} commit(s)`);
    commits.forEach((commit: any) => {
      console.log(`   • ${commit.commitId.slice(0, 7)}: ${commit.comment}`);
    });

    if (branch === "main") {
      console.log("🔄 Main branch updated, syncing...");
      await Bun.spawn(["git", "fetch", "azure"]).exited;
    }
  },

  // Work item created
  "workitem.created": async (webhook) => {
    const workItem = webhook.resource;
    console.log(`📋 New ${workItem.fields?.["System.WorkItemType"]}: ${workItem.fields?.["System.Title"]}`);
    console.log(`   ID: ${workItem.id}`);
    console.log(`   State: ${workItem.fields?.["System.State"]}`);
  },

  // Work item updated
  "workitem.updated": async (webhook) => {
    const workItem = webhook.resource;
    const revision = workItem.revision;
    console.log(`📝 Work item #${workItem.id} updated`);
    console.log(`   Title: ${revision?.fields?.["System.Title"]}`);
    console.log(`   State: ${revision?.fields?.["System.State"]}`);
  },

  // Release deployment
  "ms.vss-release.deployment-completed-event": async (webhook) => {
    const deployment = webhook.resource;
    console.log(`🚀 Deployment ${deployment.deploymentStatus}: ${deployment.release?.name}`);
    console.log(`   Environment: ${deployment.environment?.name}`);
  },
};

const server = Bun.serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", timestamp: Date.now() });
    }

    // Webhook endpoint
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const webhook = await request.json() as AzureDevOpsWebhook;

        console.log(`\n📨 Received webhook: ${webhook.eventType}`);
        console.log(`   Message: ${webhook.message?.text || "N/A"}`);

        // Find and execute handler
        const handler = handlers[webhook.eventType];
        if (handler) {
          await handler(webhook);
        } else {
          console.log(`   ⚠️ No handler for event type: ${webhook.eventType}`);
        }

        return Response.json({ received: true, eventType: webhook.eventType });
      } catch (error) {
        console.error("❌ Webhook processing error:", error);
        return Response.json({ error: "Processing failed" }, { status: 500 });
      }
    }

    // List available endpoints
    if (url.pathname === "/") {
      return Response.json({
        name: "Azure DevOps Webhook Handler",
        endpoints: {
          "/webhook": "POST - Receive Azure DevOps webhooks",
          "/health": "GET - Health check",
        },
        supportedEvents: Object.keys(handlers),
        setupInstructions: `
1. Go to Azure DevOps > Project Settings > Service Hooks
2. Create a new subscription
3. Select the event type (e.g., Build completed, Pull request created)
4. Set the URL to: http://your-host:${PORT}/webhook
5. Test the webhook connection
        `.trim(),
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`
🎯 Azure DevOps Webhook Handler
================================
Listening on: http://localhost:${PORT}
Webhook endpoint: http://localhost:${PORT}/webhook
Health check: http://localhost:${PORT}/health

Supported events:
${Object.keys(handlers).map(e => `  • ${e}`).join("\n")}

To expose publicly (for testing), use:
  ngrok http ${PORT}
  # or
  cloudflared tunnel --url http://localhost:${PORT}

Then configure the webhook URL in Azure DevOps:
  Project Settings > Service Hooks > New Subscription
`);
