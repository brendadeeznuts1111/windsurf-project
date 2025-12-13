#!/usr/bin/env bun
/**
 * Windsurf REST API Server
 * Enterprise-grade REST API built with Bun-native APIs
 * Features: URLPattern routing, SQLite persistence, comprehensive endpoints
 */

import { Database } from "bun:sqlite";
import { serve } from "bun";

// Import our custom utilities
import { BunUUIDGenerator } from "../../../src/utils/bun-uuid";
import { MetricsCollector } from "../../../src/utils/metrics-collector";
import { TensionScoringEngine } from "../../../src/core/tension-scoring/tension-engine";

// Types
interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  request_id: string;
}

// Initialize core services
const db = new Database("api-server.db");
const uuid = new BunUUIDGenerator();
const tension = new TensionScoringEngine({
  rules: {},
  thresholds: {
    warning: 50,
    critical: 75,
    circuitBreaker: 90,
  },
  monitoring: {
    enabled: true,
    intervalMs: 5000,
    retentionHours: 24,
    alertCooldownMs: 60000,
  },
});

const metrics = new MetricsCollector(tension);

// Initialize database schema
function initDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Posts table
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);

  // Sessions table for session management
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Database initialized");
}

// URL Pattern routing handlers
const routes = {
  // Health check
  health: new URLPattern({ pathname: "/api/health" }),

  // Users CRUD
  users: new URLPattern({ pathname: "/api/users" }),
  userById: new URLPattern({ pathname: "/api/users/:id" }),

  // Posts CRUD
  posts: new URLPattern({ pathname: "/api/posts" }),
  postById: new URLPattern({ pathname: "/api/posts/:id" }),
  postsByUser: new URLPattern({ pathname: "/api/users/:userId/posts" }),

  // Analytics
  analytics: new URLPattern({ pathname: "/api/analytics" }),

  // Metrics
  metrics: new URLPattern({ pathname: "/api/metrics" }),
};

// Request handlers
async function handleHealth(request: Request): Promise<Response> {
  const metrics = tension.getMetrics();
  const requestId = uuid.generate();

  const response: APIResponse = {
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: "connected",
        metrics: "collecting",
        uuid: "active",
      },
      tension_score: metrics.currentTension,
      system_metrics: metrics,
    },
    timestamp: new Date().toISOString(),
    request_id: requestId,
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleUsers(request: Request): Promise<Response> {
  const requestId = uuid.generate();
  const url = new URL(request.url);

  try {
    if (request.method === "GET") {
      // Get all users with pagination
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const offset = (page - 1) * limit;

      const users = db.query("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?")
        .all(limit, offset) as User[];

      const total = db.query("SELECT COUNT(*) as count FROM users").get() as { count: number };

      const response: APIResponse = {
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total: total.count,
            pages: Math.ceil(total.count / limit),
          },
        },
        timestamp: new Date().toISOString(),
        request_id: requestId,
      };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });

    } else if (request.method === "POST") {
      // Create new user
      const body = await request.json() as { email: string; name: string };

      if (!body.email || !body.name) {
        return new Response(JSON.stringify({
          success: false,
          error: "Email and name are required",
          timestamp: new Date().toISOString(),
          request_id: requestId,
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userId = uuid.generate();
      const now = new Date().toISOString();

      db.run(
        "INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [userId, body.email, body.name, now, now]
      );

      const user = db.query("SELECT * FROM users WHERE id = ?").get(userId) as User;

      const response: APIResponse = {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
        request_id: requestId,
      };

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: "Method not allowed",
      timestamp: new Date().toISOString(),
      request_id: requestId,
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
      request_id: requestId,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleUserById(request: Request, params: { id: string }): Promise<Response> {
  const requestId = uuid.generate();

  try {
    if (request.method === "GET") {
      const user = db.query("SELECT * FROM users WHERE id = ?").get(params.id) as User | undefined;

      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          error: "User not found",
          timestamp: new Date().toISOString(),
          request_id: requestId,
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const response: APIResponse = {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
        request_id: requestId,
      };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });

    } else if (request.method === "PUT") {
      const body = await request.json() as { email?: string; name?: string };

      const existing = db.query("SELECT * FROM users WHERE id = ?").get(params.id) as User | undefined;
      if (!existing) {
        return new Response(JSON.stringify({
          success: false,
          error: "User not found",
          timestamp: new Date().toISOString(),
          request_id: requestId,
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (body.email) {
        updates.push("email = ?");
        values.push(body.email);
      }
      if (body.name) {
        updates.push("name = ?");
        values.push(body.name);
      }

      if (updates.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "No valid fields to update",
          timestamp: new Date().toISOString(),
          request_id: requestId,
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      updates.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(params.id);

      db.run(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      const user = db.query("SELECT * FROM users WHERE id = ?").get(params.id) as User;

      const response: APIResponse = {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
        request_id: requestId,
      };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });

    } else if (request.method === "DELETE") {
      const existing = db.query("SELECT * FROM users WHERE id = ?").get(params.id) as User | undefined;
      if (!existing) {
        return new Response(JSON.stringify({
          success: false,
          error: "User not found",
          timestamp: new Date().toISOString(),
          request_id: requestId,
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      db.run("DELETE FROM users WHERE id = ?", [params.id]);

      const response: APIResponse = {
        success: true,
        data: { message: "User deleted successfully" },
        timestamp: new Date().toISOString(),
        request_id: requestId,
      };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: "Method not allowed",
      timestamp: new Date().toISOString(),
      request_id: requestId,
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
      request_id: requestId,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handlePosts(request: Request): Promise<Response> {
  const requestId = uuid.generate();
  const url = new URL(request.url);

  try {
    if (request.method === "GET") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const offset = (page - 1) * limit;

      const posts = db.query(`
        SELECT p.*, u.name as author_name, u.email as author_email
        FROM posts p
        JOIN users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset) as (Post & { author_name: string; author_email: string })[];

      const total = db.query("SELECT COUNT(*) as count FROM posts").get() as { count: number };

      const response: APIResponse = {
        success: true,
        data: {
          posts,
          pagination: {
            page,
            limit,
            total: total.count,
            pages: Math.ceil(total.count / limit),
          },
        },
        timestamp: new Date().toISOString(),
        request_id: requestId,
      };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });

    } else if (request.method === "POST") {
      const body = await request.json() as { title: string; content: string; author_id: string };

      if (!body.title || !body.content || !body.author_id) {
        return new Response(JSON.stringify({
          success: false,
          error: "Title, content, and author_id are required",
          timestamp: new Date().toISOString(),
          request_id: requestId,
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify author exists
      const author = db.query("SELECT id FROM users WHERE id = ?").get(body.author_id);
      if (!author) {
        return new Response(JSON.stringify({
          success: false,
          error: "Author not found",
          timestamp: new Date().toISOString(),
          request_id: requestId,
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const postId = uuid.generate();
      const now = new Date().toISOString();

      db.run(
        "INSERT INTO posts (id, title, content, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [postId, body.title, body.content, body.author_id, now, now]
      );

      const post = db.query(`
        SELECT p.*, u.name as author_name, u.email as author_email
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
      `).get(postId) as Post & { author_name: string; author_email: string };

      const response: APIResponse = {
        success: true,
        data: post,
        timestamp: new Date().toISOString(),
        request_id: requestId,
      };

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: "Method not allowed",
      timestamp: new Date().toISOString(),
      request_id: requestId,
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
      request_id: requestId,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleAnalytics(request: Request): Promise<Response> {
  const requestId = uuid.generate();

  try {
    const userCount = db.query("SELECT COUNT(*) as count FROM users").get() as { count: number };
    const postCount = db.query("SELECT COUNT(*) as count FROM posts").get() as { count: number };
    const recentPosts = db.query(`
      SELECT COUNT(*) as count FROM posts
      WHERE created_at >= datetime('now', '-7 days')
    `).get() as { count: number };

    const tensionMetrics = tension.getMetrics();

    const response: APIResponse = {
      success: true,
      data: {
        overview: {
          total_users: userCount.count,
          total_posts: postCount.count,
          posts_last_7_days: recentPosts.count,
        },
        system: {
          tension_score: tensionMetrics.currentTension,
        },
      },
      timestamp: new Date().toISOString(),
      request_id: requestId,
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
      request_id: requestId,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Main request handler
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Health check
  if (routes.health.test(url)) {
    return handleHealth(request);
  }

  // Users endpoints
  if (routes.users.test(url)) {
    return handleUsers(request);
  }

  const userMatch = routes.userById.exec(url);
  if (userMatch) {
    return handleUserById(request, userMatch.pathname.groups as { id: string });
  }

  // Posts endpoints
  if (routes.posts.test(url)) {
    return handlePosts(request);
  }

  const postMatch = routes.postById.exec(url);
  if (postMatch) {
    // TODO: Implement handlePostById
    return new Response(JSON.stringify({
      success: false,
      error: "Post by ID endpoint not implemented yet",
      timestamp: new Date().toISOString(),
      request_id: uuid.generate(),
    }), {
      status: 501,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Analytics
  if (routes.analytics.test(url)) {
    return handleAnalytics(request);
  }

  // Metrics
  if (routes.metrics.test(url)) {
    const requestId = uuid.generate();

    const response: APIResponse = {
      success: true,
      data: {
        message: "Metrics endpoint - system monitoring active",
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      request_id: requestId,
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 404 Not Found
  return new Response(JSON.stringify({
    success: false,
    error: "Endpoint not found",
    timestamp: new Date().toISOString(),
    request_id: uuid.generate(),
  }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

// Start server
function startServer() {
  const port = parseInt(process.env.PORT || "3000");

  console.log("🚀 Starting Windsurf REST API Server...");
  console.log(`📡 Server will listen on http://localhost:${port}`);
  console.log("📊 Available endpoints:");
  console.log("  GET  /api/health     - Health check");
  console.log("  GET  /api/users      - List users");
  console.log("  POST /api/users      - Create user");
  console.log("  GET  /api/users/:id  - Get user by ID");
  console.log("  PUT  /api/users/:id  - Update user");
  console.log("  DEL  /api/users/:id  - Delete user");
  console.log("  GET  /api/posts      - List posts");
  console.log("  POST /api/posts      - Create post");
  console.log("  GET  /api/analytics  - Analytics data");
  console.log("  GET  /api/metrics    - System metrics");
  console.log("");

  const server = serve({
    port,
    async fetch(request) {
      // Add CORS headers
      const response = await handleRequest(request);

      // Add common headers
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      headers.set("X-Powered-By", "Windsurf-API/1.0.0");

      if (request.method === "OPTIONS") {
        return new Response(null, { headers });
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
    error(error) {
      console.error("Server error:", error);
      return new Response(JSON.stringify({
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
        request_id: uuid.generate(),
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  console.log(`✅ Server started successfully on port ${port}`);
  console.log("💡 Press Ctrl+C to stop the server");

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down server...");
    server.stop();
    db.close();
    console.log("✅ Server stopped");
    process.exit(0);
  });

  return server;
}

// Initialize and start
initDatabase();
startServer();