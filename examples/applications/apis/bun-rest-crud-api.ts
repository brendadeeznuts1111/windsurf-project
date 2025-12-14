#!/usr/bin/env bun

/**
 * @example-metadata
 * @category applications/apis
 * @difficulty intermediate
 * @prerequisites bun-serve-advanced.ts, bun-file-mime-demo.test.ts
 * @related-examples
 *   - bun-http-session.ts (authentication patterns)
 *   - bun-rate-limiting.ts (traffic control)
 *   - bun-cors-middleware.ts (security)
 *   - bun-file-upload-api.ts (file handling)
 *   - bun-api-validation.ts (input validation)
 * @guides bun-http-api-guide.md, bun-rest-api-best-practices.md
 * @tests bun-rest-api-testing.test.ts
 * @benchmarks bun-api-benchmark.test.ts, bun-rest-performance.bench.ts
 * @tags http, server, api, middleware, rest, crud
 * @description Complete REST API with CRUD operations, authentication, and comprehensive middleware
 */

import { serve } from "bun";
import { Database } from "bun:sqlite";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
  lastLogin?: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: number;
  updatedAt: number;
  published: boolean;
  tags: string[];
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: number;
    requestId: string;
    version: string;
  };
}

// ============================================================================
// DATABASE SETUP
// ============================================================================

class DatabaseManager {
  private db: Database;

  constructor() {
    this.db = new Database(":memory:");
    this.initializeTables();
  }

  private initializeTables(): void {
    // Users table
    this.db.run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL,
        last_login INTEGER
      )
    `);

    // Posts table
    this.db.run(`
      CREATE TABLE posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        published BOOLEAN DEFAULT FALSE,
        tags TEXT, -- JSON string
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);

    // Indexes for performance
    this.db.run("CREATE INDEX idx_users_username ON users(username)");
    this.db.run("CREATE INDEX idx_users_email ON users(email)");
    this.db.run("CREATE INDEX idx_posts_author ON posts(author_id)");
    this.db.run("CREATE INDEX idx_posts_published ON posts(published)");
    this.db.run("CREATE INDEX idx_posts_created ON posts(created_at DESC)");
  }

  // User operations
  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const id = crypto.randomUUID();
    const createdAt = Date.now();

    this.db.run(
      "INSERT INTO users (id, username, email, created_at) VALUES (?, ?, ?, ?)",
      [id, user.username, user.email, createdAt]
    );

    return { id, ...user, createdAt };
  }

  getUserById(id: string): User | null {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      createdAt: row.created_at,
      lastLogin: row.last_login
    };
  }

  getUserByUsername(username: string): User | null {
    const row = this.db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      createdAt: row.created_at,
      lastLogin: row.last_login
    };
  }

  getUserByEmail(email: string): User | null {
    const row = this.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      createdAt: row.created_at,
      lastLogin: row.last_login
    };
  }

  updateUserLastLogin(id: string): void {
    this.db.run("UPDATE users SET last_login = ? WHERE id = ?", [Date.now(), id]);
  }

  // Post operations
  createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Post {
    const id = crypto.randomUUID();
    const now = Date.now();

    this.db.run(
      "INSERT INTO posts (id, title, content, author_id, created_at, updated_at, published, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, post.title, post.content, post.authorId, now, now, post.published, JSON.stringify(post.tags)]
    );

    return { id, ...post, createdAt: now, updatedAt: now };
  }

  getPostById(id: string): Post | null {
    const row = this.db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      authorId: row.author_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      published: Boolean(row.published),
      tags: JSON.parse(row.tags || '[]')
    };
  }

  getPostsByAuthor(authorId: string, limit: number = 50): Post[] {
    const rows = this.db.prepare("SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(authorId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      authorId: row.author_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      published: Boolean(row.published),
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  getPublishedPosts(limit: number = 50, offset: number = 0): Post[] {
    const rows = this.db.prepare("SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .all(limit, offset) as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      authorId: row.author_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      published: Boolean(row.published),
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  updatePost(id: string, updates: Partial<Pick<Post, 'title' | 'content' | 'published' | 'tags'>>): Post | null {
    const existing = this.getPostById(id);
    if (!existing) return null;

    const updatedPost = { ...existing, ...updates, updatedAt: Date.now() };

    this.db.run(
      "UPDATE posts SET title = ?, content = ?, updated_at = ?, published = ?, tags = ? WHERE id = ?",
      [updatedPost.title, updatedPost.content, updatedPost.updatedAt, updatedPost.published, JSON.stringify(updatedPost.tags), id]
    );

    return updatedPost;
  }

  deletePost(id: string): boolean {
    const result = this.db.run("DELETE FROM posts WHERE id = ?", [id]);
    return result.changes > 0;
  }
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

class Middleware {
  static cors(): (request: Request) => Response | null {
    return (request: Request) => {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          },
        });
      }
      return null;
    };
  }

  static json(): (request: Request) => Promise<any> {
    return async (request: Request) => {
      if (request.method !== 'GET' && request.method !== 'DELETE') {
        try {
          return await request.json();
        } catch (error) {
          throw new Error('Invalid JSON in request body');
        }
      }
      return null;
    };
  }

  static auth(db: DatabaseManager): (request: Request) => User | null {
    return (request: Request) => {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      // Simple token-based auth (in production, use proper JWT)
      const token = authHeader.substring(7);
      const user = db.getUserByUsername(token); // Simplified for demo
      return user || null;
    };
  }

  static rateLimit(): (request: Request) => boolean {
    return (request: Request) => {
      // Simple in-memory rate limiting (use Redis in production)
      const clientIP = request.headers.get('CF-Connecting-IP') ||
                      request.headers.get('X-Forwarded-For') ||
                      'unknown';

      // Simplified rate limiting - allow 100 requests per minute
      const now = Date.now();
      const windowStart = now - 60000; // 1 minute ago

      // In production, store this in Redis or similar
      // For demo, we'll just allow all requests
      return true;
    };
  }
}

// ============================================================================
// API HANDLERS
// ============================================================================

class APIHandlers {
  constructor(private db: DatabaseManager) {}

  // Health check
  async health(): Promise<APIResponse> {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: Date.now(),
        version: '1.0.0',
        database: 'connected'
      },
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    };
  }

  // User endpoints
  async createUser(data: { username: string; email: string }): Promise<APIResponse<User>> {
    try {
      const existingUser = this.db.getUserByUsername(data.username) ||
                          this.db.getUserByEmail?.(data.email);
      if (existingUser) {
        return {
          success: false,
          error: 'Username or email already exists',
          meta: {
            timestamp: Date.now(),
            requestId: crypto.randomUUID(),
            version: '1.0.0'
          }
        };
      }

      const user = this.db.createUser(data);
      return {
        success: true,
        data: user,
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create user',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    }
  }

  async getUser(id: string): Promise<APIResponse<User>> {
    const user = this.db.getUserById(id);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    }

    return {
      success: true,
      data: user,
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    };
  }

  // Post endpoints
  async createPost(user: User, data: { title: string; content: string; published?: boolean; tags?: string[] }): Promise<APIResponse<Post>> {
    try {
      const post = this.db.createPost({
        title: data.title,
        content: data.content,
        authorId: user.id,
        published: data.published || false,
        tags: data.tags || []
      });

      return {
        success: true,
        data: post,
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create post',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    }
  }

  async getPost(id: string): Promise<APIResponse<Post>> {
    const post = this.db.getPostById(id);
    if (!post) {
      return {
        success: false,
        error: 'Post not found',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    }

    return {
      success: true,
      data: post,
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    };
  }

  async getPublishedPosts(limit: number = 20, offset: number = 0): Promise<APIResponse<Post[]>> {
    try {
      const posts = this.db.getPublishedPosts(limit, offset);
      return {
        success: true,
        data: posts,
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch posts',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    }
  }

  async updatePost(user: User, id: string, data: Partial<Pick<Post, 'title' | 'content' | 'published' | 'tags'>>): Promise<APIResponse<Post>> {
    const post = this.db.getPostById(id);
    if (!post) {
      return {
        success: false,
        error: 'Post not found',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    }

    if (post.authorId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized to update this post',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    }

    const updatedPost = this.db.updatePost(id, data);
    if (!updatedPost) {
      return {
        success: false,
        error: 'Failed to update post',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    }

    return {
      success: true,
      data: updatedPost,
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
        }
      };
    }

    async deletePost(user: User, id: string): Promise<APIResponse> {
      const post = this.db.getPostById(id);
      if (!post) {
        return {
          success: false,
          error: 'Post not found',
          meta: {
            timestamp: Date.now(),
            requestId: crypto.randomUUID(),
            version: '1.0.0'
          }
        };
      }

      if (post.authorId !== user.id) {
        return {
          success: false,
          error: 'Unauthorized to delete this post',
          meta: {
            timestamp: Date.now(),
            requestId: crypto.randomUUID(),
            version: '1.0.0'
          }
        };
      }

      const deleted = this.db.deletePost(id);
      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete post',
          meta: {
            timestamp: Date.now(),
            requestId: crypto.randomUUID(),
            version: '1.0.0'
          }
        };
      }

      return {
        success: true,
        data: { message: 'Post deleted successfully' },
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };
    }
  }

// ============================================================================
// MAIN SERVER
// ============================================================================

class RESTAPIServer {
  private db: DatabaseManager;
  private handlers: APIHandlers;
  private server?: ReturnType<typeof serve>;

  constructor() {
    this.db = new DatabaseManager();
    this.handlers = new APIHandlers(this.db);
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Apply middleware
    const corsResponse = Middleware.cors()(request);
    if (corsResponse) return corsResponse;

    if (!Middleware.rateLimit()(request)) {
      return Response.json({
        success: false,
        error: 'Rate limit exceeded',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      }, { status: 429 });
    }

    let body: any = null;
    try {
      body = await Middleware.json()(request);
    } catch (error) {
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid request body',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      }, { status: 400 });
    }

    const authUser = Middleware.auth(this.db)(request);

    try {
      // Health check (no auth required)
      if (path === '/api/health' && method === 'GET') {
        const result = await this.handlers.health();
        return Response.json(result);
      }

      // User endpoints
      if (path === '/api/users' && method === 'POST') {
        const result = await this.handlers.createUser(body);
        const status = result.success ? 201 : 400;
        return Response.json(result, { status });
      }

      if (path.startsWith('/api/users/') && method === 'GET') {
        const userId = path.split('/api/users/')[1];
        const result = await this.handlers.getUser(userId);
        const status = result.success ? 200 : 404;
        return Response.json(result, { status });
      }

      // Post endpoints (require authentication)
      if (!authUser) {
        return Response.json({
          success: false,
          error: 'Authentication required',
          meta: {
            timestamp: Date.now(),
            requestId: crypto.randomUUID(),
            version: '1.0.0'
          }
        }, { status: 401 });
      }

      if (path === '/api/posts' && method === 'POST') {
        const result = await this.handlers.createPost(authUser, body);
        const status = result.success ? 201 : 400;
        return Response.json(result, { status });
      }

      if (path === '/api/posts' && method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const result = await this.handlers.getPublishedPosts(limit, offset);
        return Response.json(result);
      }

      if (path.startsWith('/api/posts/') && method === 'GET') {
        const postId = path.split('/api/posts/')[1];
        const result = await this.handlers.getPost(postId);
        const status = result.success ? 200 : 404;
        return Response.json(result, { status });
      }

      if (path.startsWith('/api/posts/') && method === 'PUT') {
        const postId = path.split('/api/posts/')[1];
        const result = await this.handlers.updatePost(authUser, postId, body);
        const status = result.success ? 200 : (result.error?.includes('not found') ? 404 : 403);
        return Response.json(result, { status });
      }

      if (path.startsWith('/api/posts/') && method === 'DELETE') {
        const postId = path.split('/api/posts/')[1];
        const result = await this.handlers.deletePost(authUser, postId);
        const status = result.success ? 200 : (result.error?.includes('not found') ? 404 : 403);
        return Response.json(result, { status });
      }

      // 404 for unknown routes
      return Response.json({
        success: false,
        error: 'Endpoint not found',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      }, { status: 404 });

    } catch (error) {
      console.error('Request error:', error);
      return Response.json({
        success: false,
        error: 'Internal server error',
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      }, { status: 500 });
    }
  }

  start(port: number = 3001): void {
    this.server = serve({
      port,
      hostname: 'localhost',
      fetch: this.handleRequest.bind(this),
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });

    console.log(`🚀 REST API Server running at http://localhost:${port}`);
    console.log('\n📋 Available Endpoints:');
    console.log('  GET  /api/health                    - Health check');
    console.log('  POST /api/users                     - Create user');
    console.log('  GET  /api/users/:id                 - Get user by ID');
    console.log('  POST /api/posts                     - Create post (auth required)');
    console.log('  GET  /api/posts                     - Get published posts');
    console.log('  GET  /api/posts/:id                 - Get post by ID');
    console.log('  PUT  /api/posts/:id                 - Update post (auth required)');
    console.log('  DELETE /api/posts/:id               - Delete post (auth required)');
    console.log('\n🔐 Authentication: Use "Authorization: Bearer <username>" header');
    console.log('💡 Create a user first, then use their username as the auth token');
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      console.log('🛑 Server stopped');
    }
  }
}

// ============================================================================
// DEMO DATA & STARTUP
// ============================================================================

if (import.meta.main) {
  const server = new RESTAPIServer();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    server.stop();
    process.exit(0);
  });

  server.start();
}

export { RESTAPIServer, DatabaseManager, APIHandlers, Middleware };