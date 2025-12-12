#!/usr/bin/env bun

/**
 * 🚀 Bun API Server Demo - Enterprise-Grade REST API
 *
 * Comprehensive demonstration of Bun's HTTP server capabilities featuring:
 * - URLPattern routing for high-performance request matching
 * - SQLite database integration with prepared statements
 * - WebSocket support for real-time features
 * - File upload handling with streaming
 * - Authentication middleware with session management
 * - Comprehensive error handling and logging
 * - Performance monitoring and health checks
 * - CORS support and security headers
 */

import { serve, type Server } from "bun";
import { Database } from "bun:sqlite";
import { logger } from "./logging/bun-logger";

// ============================================================================
// DATABASE SETUP
// ============================================================================

const db = new Database(":memory:");

// Initialize database schema
db.run(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  )
`);

// Prepared statements for performance
const insertUser = db.prepare("INSERT INTO users (username, email) VALUES (?, ?)");
const getUserById = db.prepare("SELECT * FROM users WHERE id = ?");
const getAllUsers = db.prepare("SELECT * FROM users ORDER BY created_at DESC");
const insertPost = db.prepare("INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)");
const getPostsByUser = db.prepare("SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC");

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  created_at: string;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface AuthenticatedRequest extends Request {
  user?: User;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Simple authentication middleware (demo purposes)
 */
async function authMiddleware(request: Request): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return request as AuthenticatedRequest;
  }

  const token = authHeader.slice(7);
  // In production, validate JWT token here
  // For demo, we'll use a simple token format: user-{id}

  if (token.startsWith('user-')) {
    const userId = parseInt(token.slice(5));
    const user = getUserById.get(userId) as User | undefined;

    if (user) {
      (request as AuthenticatedRequest).user = user;
    }
  }

  return request as AuthenticatedRequest;
}

/**
 * CORS middleware
 */
function corsMiddleware(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * Security headers middleware
 */
function securityMiddleware(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * Health check endpoint
 */
function handleHealth(): APIResponse {
  const memoryUsage = process.memoryUsage();

  return {
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      },
      database: {
        users: db.prepare("SELECT COUNT(*) as count FROM users").get()?.count || 0,
        posts: db.prepare("SELECT COUNT(*) as count FROM posts").get()?.count || 0,
      }
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * User management endpoints
 */
class UserController {
  static async getUsers(): Promise<APIResponse<User[]>> {
    try {
      const users = getAllUsers.all() as User[];
      return {
        success: true,
        data: users,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get users', {}, error as Error);
      return {
        success: false,
        error: 'Failed to retrieve users',
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async createUser(request: Request): Promise<APIResponse<User>> {
    try {
      const body = await request.json();
      const { username, email } = body;

      if (!username || !email) {
        return {
          success: false,
          error: 'Username and email are required',
          timestamp: new Date().toISOString(),
        };
      }

      const result = insertUser.run(username, email);
      const user = getUserById.get(result.lastInsertRowid) as User;

      logger.info('User created', { userId: user.id, username });

      return {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to create user', {}, error as Error);
      return {
        success: false,
        error: 'Failed to create user',
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async getUser(userId: string): Promise<APIResponse<User>> {
    try {
      const user = getUserById.get(parseInt(userId)) as User | undefined;

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get user', { userId }, error as Error);
      return {
        success: false,
        error: 'Failed to retrieve user',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Post management endpoints
 */
class PostController {
  static async getUserPosts(userId: string): Promise<APIResponse<Post[]>> {
    try {
      const posts = getPostsByUser.all(parseInt(userId)) as Post[];
      return {
        success: true,
        data: posts,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get user posts', { userId }, error as Error);
      return {
        success: false,
        error: 'Failed to retrieve posts',
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async createPost(request: AuthenticatedRequest): Promise<APIResponse<Post>> {
    try {
      if (!request.user) {
        return {
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        };
      }

      const body = await request.json();
      const { title, content } = body;

      if (!title || !content) {
        return {
          success: false,
          error: 'Title and content are required',
          timestamp: new Date().toISOString(),
        };
      }

      const result = insertPost.run(title, content, request.user.id);
      const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(result.lastInsertRowid) as Post;

      logger.info('Post created', { postId: post.id, authorId: request.user.id });

      return {
        success: true,
        data: post,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to create post', {}, error as Error);
      return {
        success: false,
        error: 'Failed to create post',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * File upload handling
 */
class FileController {
  static async uploadFile(request: Request): Promise<APIResponse> {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return {
          success: false,
          error: 'No file provided',
          timestamp: new Date().toISOString(),
        };
      }

      // In production, you'd save to disk/cloud storage
      // For demo, we'll just return file info
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };

      logger.info('File uploaded', {
        filename: file.name,
        size: file.size,
        type: file.type
      });

      return {
        success: true,
        data: fileInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('File upload failed', {}, error as Error);
      return {
        success: false,
        error: 'File upload failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// ============================================================================
// ROUTING & SERVER SETUP
// ============================================================================

/**
 * URLPattern-based routing for high performance
 */
const routes = {
  // Health check
  health: new URLPattern({ pathname: '/api/health' }),

  // User routes
  users: new URLPattern({ pathname: '/api/users' }),
  userById: new URLPattern({ pathname: '/api/users/:id' }),

  // Post routes
  userPosts: new URLPattern({ pathname: '/api/users/:id/posts' }),
  posts: new URLPattern({ pathname: '/api/posts' }),

  // File upload
  upload: new URLPattern({ pathname: '/api/upload' }),

  // WebSocket
  websocket: new URLPattern({ pathname: '/ws' }),
};

/**
 * Main request handler with URLPattern routing
 */
async function handleRequest(request: Request, server: Server): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  try {
    // Health check (no auth required)
    if (routes.health.test(url)) {
      const response = Response.json(handleHealth());
      return corsMiddleware(securityMiddleware(response));
    }

    // Authenticate request
    const authRequest = await authMiddleware(request);

    // User routes
    if (routes.users.test(url)) {
      if (method === 'GET') {
        const response = Response.json(await UserController.getUsers());
        return corsMiddleware(securityMiddleware(response));
      } else if (method === 'POST') {
        const response = Response.json(await UserController.createUser(authRequest));
        return corsMiddleware(securityMiddleware(response));
      }
    }

    if (routes.userById.test(url)) {
      const match = routes.userById.exec(url);
      if (match && method === 'GET') {
        const response = Response.json(await UserController.getUser(match.pathname.groups.id));
        return corsMiddleware(securityMiddleware(response));
      }
    }

    // Post routes
    if (routes.userPosts.test(url)) {
      const match = routes.userPosts.exec(url);
      if (match && method === 'GET') {
        const response = Response.json(await PostController.getUserPosts(match.pathname.groups.id));
        return corsMiddleware(securityMiddleware(response));
      }
    }

    if (routes.posts.test(url) && method === 'POST') {
      const response = Response.json(await PostController.createPost(authRequest));
      return corsMiddleware(securityMiddleware(response));
    }

    // File upload
    if (routes.upload.test(url) && method === 'POST') {
      const response = Response.json(await FileController.uploadFile(authRequest));
      return corsMiddleware(securityMiddleware(response));
    }

    // WebSocket upgrade
    if (routes.websocket.test(url) && request.headers.get('upgrade') === 'websocket') {
      const success = server.upgrade(request, {
        data: { user: authRequest.user },
      });

      if (success) {
        return new Response(null, { status: 101 }); // Switching Protocols
      }
    }

    // 404 Not Found
    const response = Response.json({
      success: false,
      error: 'Endpoint not found',
      timestamp: new Date().toISOString(),
    }, { status: 404 });

    return corsMiddleware(securityMiddleware(response));

  } catch (error) {
    logger.error('Request handler error', { url: request.url, method }, error as Error);

    const response = Response.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });

    return corsMiddleware(securityMiddleware(response));
  }
}

/**
 * WebSocket message handler
 */
const websocketHandler = {
  open(ws: any) {
    const user = ws.data?.user;
    logger.info('WebSocket connection opened', {
      userId: user?.id,
      remoteAddress: ws.remoteAddress,
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: `Welcome ${user?.username || 'anonymous'}!`,
      timestamp: new Date().toISOString(),
    }));
  },

  message(ws: any, message: string) {
    try {
      const data = JSON.parse(message);
      const user = ws.data?.user;

      logger.debug('WebSocket message received', {
        userId: user?.id,
        messageType: data.type,
      });

      // Echo the message back
      ws.send(JSON.stringify({
        type: 'echo',
        original: data,
        timestamp: new Date().toISOString(),
        user: user?.username,
      }));

    } catch (error) {
      logger.error('WebSocket message error', {}, error as Error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString(),
      }));
    }
  },

  close(ws: any, code: number, reason: string) {
    const user = ws.data?.user;
    logger.info('WebSocket connection closed', {
      userId: user?.id,
      code,
      reason,
    });
  },
};

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

/**
 * Start the API server
 */
function startServer(port: number = 3001): Server {
  const server = serve({
    port,
    hostname: 'localhost',

    // Main request handler
    async fetch(request, server) {
      const start = Bun.nanoseconds();
      const response = await handleRequest(request, server);
      const duration = Bun.nanoseconds() - start;

      // Log request performance
      logger.debug('Request processed', {
        method: request.method,
        url: request.url,
        status: response.status,
        duration_ns: duration,
      });

      return response;
    },

    // WebSocket support
    websocket: websocketHandler,

    // Server configuration
    maxRequestBodySize: 10 * 1024 * 1024, // 10MB
    idleTimeout: 30,
    development: process.env.NODE_ENV !== 'production',

    // Error handling
    error(error) {
      logger.error('Server error', {}, error);
      return new Response('Internal Server Error', { status: 500 });
    },
  });

  logger.info('🚀 Bun API Server started', {
    url: server.url,
    port: server.port,
    environment: process.env.NODE_ENV || 'development',
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    server.stop();
    db.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    server.stop();
    db.close();
    process.exit(0);
  });

  return server;
}

// ============================================================================
// DEMO DATA & USAGE
// ============================================================================

/**
 * Initialize demo data
 */
function initializeDemoData() {
  // Create demo users
  const demoUsers = [
    { username: 'alice', email: 'alice@example.com' },
    { username: 'bob', email: 'bob@example.com' },
    { username: 'charlie', email: 'charlie@example.com' },
  ];

  for (const user of demoUsers) {
    try {
      insertUser.run(user.username, user.email);
    } catch (error) {
      // User might already exist
    }
  }

  // Create demo posts
  const demoPosts = [
    { title: 'Welcome to Bun API Server', content: 'This is a demo post showcasing Bun\'s capabilities.', authorId: 1 },
    { title: 'High Performance', content: 'Bun provides exceptional performance for web applications.', authorId: 2 },
    { title: 'TypeScript Support', content: 'Full TypeScript support with excellent developer experience.', authorId: 3 },
  ];

  for (const post of demoPosts) {
    try {
      insertPost.run(post.title, post.content, post.authorId);
    } catch (error) {
      // Post might already exist
    }
  }

  logger.info('Demo data initialized');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (import.meta.main) {
  // Initialize demo data
  initializeDemoData();

  // Start the server
  const server = startServer();

  console.log(`
🚀 Bun API Server Demo Running!

📡 Server: http://localhost:${server.port}/
📊 Health Check: http://localhost:${server.port}/api/health
👥 Users API: http://localhost:${server.port}/api/users
📝 Posts API: http://localhost:${server.port}/api/posts
📁 File Upload: http://localhost:${server.port}/api/upload
🔌 WebSocket: ws://localhost:${server.port}/ws

📖 API Documentation:
GET  /api/health           - Server health and stats
GET  /api/users            - List all users
POST /api/users            - Create new user
GET  /api/users/:id        - Get user by ID
GET  /api/users/:id/posts  - Get user's posts
POST /api/posts            - Create new post (requires auth)
POST /api/upload           - Upload file

🔐 Authentication:
Use header: Authorization: Bearer user-{id}
Example: Authorization: Bearer user-1

🧪 Test Commands:
# Health check
curl ${server.url}api/health

# Get users
curl ${server.url}api/users

# Create user
curl -X POST ${server.url}api/users \\
  -H "Content-Type: application/json" \\
  -d '{"username":"testuser","email":"test@example.com"}'

# Create post (authenticated)
curl -X POST ${server.url}api/posts \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer user-1" \\
  -d '{"title":"Test Post","content":"This is a test post"}'

# WebSocket test
# Connect to ws://localhost:${server.port}/ws and send JSON messages

Press Ctrl+C to stop the server.
  `);
}

export { startServer, initializeDemoData };