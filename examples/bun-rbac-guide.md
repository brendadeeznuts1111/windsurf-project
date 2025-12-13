# Bun RBAC (Role-Based Access Control) Guide

> Complete guide to implementing role-based access control in Bun applications with database integration, middleware, and best practices

## Overview

Role-Based Access Control (RBAC) is a security approach that restricts system access based on user roles and permissions. This guide covers implementing RBAC in Bun applications using SQLite/PostgreSQL with practical examples.

## Core Concepts

### Roles vs Permissions

```typescript
// Roles define user types
enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest'
}

// Permissions define specific actions
enum Permission {
  READ_POSTS = 'read:posts',
  WRITE_POSTS = 'write:posts',
  DELETE_POSTS = 'delete:posts',
  MANAGE_USERS = 'manage:users',
  VIEW_ANALYTICS = 'view:analytics'
}
```

### Role-Permission Mapping

```typescript
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.READ_POSTS,
    Permission.WRITE_POSTS,
    Permission.DELETE_POSTS,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS
  ],
  [UserRole.MODERATOR]: [
    Permission.READ_POSTS,
    Permission.WRITE_POSTS,
    Permission.DELETE_POSTS
  ],
  [UserRole.USER]: [
    Permission.READ_POSTS,
    Permission.WRITE_POSTS
  ],
  [UserRole.GUEST]: [
    Permission.READ_POSTS
  ]
};
```

## Database Schema

### SQLite Schema

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for stateless auth
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Permissions table (optional - for dynamic permissions)
CREATE TABLE permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Role permissions junction table
CREATE TABLE role_permissions (
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  PRIMARY KEY (role, permission)
);

-- Insert default permissions
INSERT INTO role_permissions (role, permission) VALUES
  ('admin', 'read:posts'),
  ('admin', 'write:posts'),
  ('admin', 'delete:posts'),
  ('admin', 'manage:users'),
  ('admin', 'view:analytics'),
  ('moderator', 'read:posts'),
  ('moderator', 'write:posts'),
  ('moderator', 'delete:posts'),
  ('user', 'read:posts'),
  ('user', 'write:posts'),
  ('guest', 'read:posts');
```

### PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom enum type
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user', 'guest');

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Role permissions
CREATE TABLE role_permissions (
  role user_role NOT NULL,
  permission TEXT NOT NULL,
  PRIMARY KEY (role, permission)
);
```

## RBAC Implementation

### Permission Checker Class

```typescript
import { Database } from 'bun:sqlite';

export class RBAC {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
    this.initializePermissions();
  }

  private initializePermissions() {
    // Initialize default role permissions if not exists
    const existing = this.db.prepare('SELECT COUNT(*) as count FROM role_permissions').get() as { count: number };

    if (existing.count === 0) {
      const defaultPermissions = [
        ['admin', 'read:posts'],
        ['admin', 'write:posts'],
        ['admin', 'delete:posts'],
        ['admin', 'manage:users'],
        ['admin', 'view:analytics'],
        ['moderator', 'read:posts'],
        ['moderator', 'write:posts'],
        ['moderator', 'delete:posts'],
        ['user', 'read:posts'],
        ['user', 'write:posts'],
        ['guest', 'read:posts']
      ];

      const insert = this.db.prepare('INSERT INTO role_permissions (role, permission) VALUES (?, ?)');
      for (const [role, permission] of defaultPermissions) {
        insert.run(role, permission);
      }
    }
  }

  // Check if user has permission
  hasPermission(userId: number, permission: string): boolean {
    const result = this.db.prepare(`
      SELECT 1
      FROM users u
      JOIN role_permissions rp ON u.role = rp.role
      WHERE u.id = ? AND rp.permission = ?
      LIMIT 1
    `).get(userId, permission);

    return !!result;
  }

  // Check if user has role
  hasRole(userId: number, role: string): boolean {
    const result = this.db.prepare(`
      SELECT 1 FROM users WHERE id = ? AND role = ? LIMIT 1
    `).get(userId, role);

    return !!result;
  }

  // Get user permissions
  getUserPermissions(userId: number): string[] {
    const results = this.db.prepare(`
      SELECT rp.permission
      FROM users u
      JOIN role_permissions rp ON u.role = rp.role
      WHERE u.id = ?
    `).all(userId) as { permission: string }[];

    return results.map(r => r.permission);
  }

  // Get user role
  getUserRole(userId: number): string | null {
    const result = this.db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined;
    return result?.role || null;
  }
}
```

### Authentication Middleware

```typescript
import { RBAC } from './rbac';

// Session-based auth middleware
export function requireAuth(requiredPermission?: string) {
  return async (request: Request): Promise<Response> => {
    // Extract session token from cookie or header
    const cookies = request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);

    if (!sessionMatch) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionId = sessionMatch[1];

    // Validate session and get user
    const db = new Database('auth.db');
    const rbac = new RBAC(db);

    try {
      const session = db.prepare(`
        SELECT user_id FROM sessions
        WHERE id = ? AND expires_at > datetime('now')
      `).get(sessionId) as { user_id: number } | undefined;

      if (!session) {
        return new Response(JSON.stringify({ error: 'Session expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check permission if required
      if (requiredPermission && !rbac.hasPermission(session.user_id, requiredPermission)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Add user info to request for handlers
      (request as any).userId = session.user_id;
      (request as any).userRole = rbac.getUserRole(session.user_id);

      // Continue to next handler
      return await handleRequest(request);

    } finally {
      db.close();
    }
  };
}

// Usage in routes
const routes = [
  {
    path: '/api/posts',
    method: 'GET',
    handler: requireAuth('read:posts')
  },
  {
    path: '/api/posts',
    method: 'POST',
    handler: requireAuth('write:posts')
  },
  {
    path: '/api/admin/users',
    method: 'GET',
    handler: requireAuth('manage:users')
  }
];
```

## User Management API

### User Registration

```typescript
import { Database } from 'bun:sqlite';
import { hash } from 'bcrypt';

export async function registerUser(email: string, password: string, role: string = 'user') {
  const db = new Database('auth.db');

  try {
    // Hash password
    const passwordHash = await hash(password, 10);

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, role)
      VALUES (?, ?, ?)
    `).run(email, passwordHash, role);

    return { id: result.lastInsertRowid, email, role };
  } finally {
    db.close();
  }
}
```

### User Login

```typescript
import { Database } from 'bun:sqlite';
import { compare } from 'bcrypt';
import { randomUUID } from 'crypto';

export async function loginUser(email: string, password: string) {
  const db = new Database('auth.db');

  try {
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isValid = await compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Create session
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(sessionId, user.id, expiresAt.toISOString());

    return {
      sessionId,
      user: { id: user.id, email: user.email, role: user.role }
    };
  } finally {
    db.close();
  }
}
```

## API Endpoints with RBAC

### Protected Routes

```typescript
import { RBAC } from './rbac';

// Initialize RBAC
const db = new Database('auth.db');
const rbac = new RBAC(db);

// API handlers with RBAC checks
async function getPosts(request: Request) {
  const userId = (request as any).userId;

  // User can read posts (checked by middleware)
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();

  return Response.json({ posts });
}

async function createPost(request: Request) {
  const userId = (request as any).userId;
  const body = await request.json();

  // Additional check if needed
  if (!rbac.hasPermission(userId, 'write:posts')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = db.prepare(`
    INSERT INTO posts (title, content, author_id)
    VALUES (?, ?, ?)
  `).run(body.title, body.content, userId);

  return Response.json({
    id: result.lastInsertRowid,
    title: body.title,
    content: body.content
  });
}

async function deletePost(request: Request, params: { id: string }) {
  const userId = (request as any).userId;
  const postId = params.id;

  // Check if user owns the post or has delete permission
  const post = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(postId) as any;

  if (!post) {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }

  const canDelete = post.author_id === userId || rbac.hasPermission(userId, 'delete:posts');

  if (!canDelete) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

  return Response.json({ success: true });
}
```

## Frontend Integration

### React Hook for RBAC

```typescript
import { useContext, createContext, useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  role: string;
  permissions: string[];
}

interface RBACContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const RBACContext = createContext<RBACContextType | null>(null);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setUser(data.user);

    // Set session cookie
    document.cookie = `session=${data.sessionId}; path=/; secure; samesite=strict`;
  };

  const logout = () => {
    setUser(null);
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const hasPermission = (permission: string) => {
    return user?.permissions.includes(permission) ?? false;
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  return (
    <RBACContext.Provider value={{ user, login, logout, hasPermission, hasRole }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider');
  }
  return context;
}
```

### Protected Components

```typescript
import { useRBAC } from './rbac-context';

function AdminPanel() {
  const { hasPermission, hasRole } = useRBAC();

  if (!hasRole('admin')) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      {hasPermission('view:analytics') && <AnalyticsDashboard />}
      {hasPermission('manage:users') && <UserManagement />}
    </div>
  );
}

function PostEditor() {
  const { hasPermission } = useRBAC();

  if (!hasPermission('write:posts')) {
    return <div>You don't have permission to create posts</div>;
  }

  return <PostForm />;
}
```

## Advanced Patterns

### Hierarchical Roles

```typescript
// Role hierarchy for inheritance
const roleHierarchy: Record<string, string[]> = {
  admin: ['moderator', 'user', 'guest'],
  moderator: ['user', 'guest'],
  user: ['guest'],
  guest: []
};

class HierarchicalRBAC extends RBAC {
  hasRole(userId: number, role: string): boolean {
    const userRole = this.getUserRole(userId);
    if (!userRole) return false;

    // Check direct role match
    if (userRole === role) return true;

    // Check hierarchical roles
    return roleHierarchy[userRole]?.includes(role) ?? false;
  }
}
```

### Dynamic Permissions

```typescript
// Resource-specific permissions
interface ResourcePermission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// Check resource ownership
function canAccessResource(userId: number, resourceId: string, action: string): boolean {
  // Check if user owns the resource
  const resource = db.prepare('SELECT owner_id FROM resources WHERE id = ?').get(resourceId) as any;

  if (resource.owner_id === userId) {
    return true; // Owner can do anything
  }

  // Check role-based permissions
  return rbac.hasPermission(userId, `${action}:${resource.type}`);
}
```

### Audit Logging

```typescript
// Log all permission checks
class AuditedRBAC extends RBAC {
  hasPermission(userId: number, permission: string): boolean {
    const result = super.hasPermission(userId, permission);

    // Log the check
    db.prepare(`
      INSERT INTO audit_log (user_id, action, resource, result, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'check_permission', permission, result ? 1 : 0, new Date().toISOString());

    return result;
  }
}
```

## Testing RBAC

### Unit Tests

```typescript
import { describe, test, expect } from 'bun:test';
import { RBAC } from './rbac';

describe('RBAC', () => {
  test('admin has all permissions', () => {
    const rbac = new RBAC(db);
    expect(rbac.hasPermission(1, 'read:posts')).toBe(true);
    expect(rbac.hasPermission(1, 'manage:users')).toBe(true);
  });

  test('user cannot manage users', () => {
    const rbac = new RBAC(db);
    expect(rbac.hasPermission(2, 'manage:users')).toBe(false);
  });

  test('guest can only read posts', () => {
    const rbac = new RBAC(db);
    expect(rbac.hasPermission(3, 'read:posts')).toBe(true);
    expect(rbac.hasPermission(3, 'write:posts')).toBe(false);
  });
});
```

## Security Best Practices

### Password Security

```typescript
import { hash, compare } from 'bcrypt';

// Use strong hashing
const passwordHash = await hash(password, 12); // Minimum 12 rounds

// Verify passwords securely
const isValid = await compare(plainPassword, hashedPassword);
```

### Session Security

```typescript
// Secure session configuration
const sessionConfig = {
  expiresIn: '24h',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict' as const
};
```

### Rate Limiting

```typescript
// Implement rate limiting for auth endpoints
const authLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  const record = authLimiter.get(ip);
  if (!record || now > record.resetTime) {
    authLimiter.set(ip, { count: 1, resetTime: now + window });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
```

## Performance Optimization

### Permission Caching

```typescript
class CachedRBAC extends RBAC {
  private cache = new Map<string, { result: boolean; expires: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  hasPermission(userId: number, permission: string): boolean {
    const key = `${userId}:${permission}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() < cached.expires) {
      return cached.result;
    }

    const result = super.hasPermission(userId, permission);
    this.cache.set(key, { result, expires: Date.now() + this.CACHE_TTL });

    return result;
  }
}
```

### Database Indexing

```sql
-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
```

This comprehensive RBAC implementation provides secure, scalable access control for Bun applications with database integration, middleware support, and best practices for enterprise use.