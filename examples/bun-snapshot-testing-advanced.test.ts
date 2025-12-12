import { describe, test, expect } from "bun:test";

/**
 * Advanced Snapshot Testing Patterns for Bun
 * Demonstrates various snapshot testing techniques and best practices
 */

describe("Advanced Bun Snapshot Testing", () => {
  // Custom snapshot serializer for complex objects
  const customSerializer = {
    serialize(val: any): string {
      return JSON.stringify(val, (key, value) => {
        // Replace functions with their string representation
        if (typeof value === 'function') {
          return `[Function: ${value.name || 'anonymous'}]`;
        }
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          // Simple circular reference detection
          try {
            JSON.stringify(value);
          } catch {
            return '[Circular Reference]';
          }
        }
        return value;
      }, 2);
    },
    test(val: any): boolean {
      return typeof val === 'object' && val !== null;
    }
  };

  test("custom object serialization", () => {
    const complexObject = {
      id: "obj-123",
      name: "Complex Object",
      metadata: {
        created: new Date("2024-01-01"),
        tags: ["test", "complex", "snapshot"]
      },
      handler: function process() { return "processed"; },
      nested: {
        self: null as any, // Will be set to create circular reference
        data: [1, 2, { nested: true }]
      }
    };

    // Create circular reference
    complexObject.nested.self = complexObject;

    // For snapshot testing, we need to handle circular references
    const snapshotSafe = {
      ...complexObject,
      handler: "[Function: process]",
      nested: {
        ...complexObject.nested,
        self: "[Circular Reference]"
      }
    };

    expect(snapshotSafe).toMatchSnapshot();
  });

  test("snapshot testing with dynamic data", () => {
    const generateDynamicData = () => ({
      timestamp: new Date().toISOString(),
      randomId: Math.random().toString(36).substring(2),
      processId: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    });

    const data = generateDynamicData();

    // For dynamic data, we might want to snapshot the structure
    // rather than exact values
    const structure = {
      hasTimestamp: typeof data.timestamp === 'string',
      hasRandomId: typeof data.randomId === 'string' && data.randomId.length > 0,
      hasProcessId: typeof data.processId === 'number',
      hasNodeVersion: typeof data.nodeVersion === 'string',
      hasPlatform: typeof data.platform === 'string',
      hasArch: typeof data.arch === 'string'
    };

    expect(structure).toMatchSnapshot();
  });

  test("snapshot testing for data transformations", () => {
    const transformUserData = (user: any) => ({
      id: user.id,
      displayName: `${user.firstName} ${user.lastName}`,
      email: user.email.toLowerCase(),
      isActive: user.status === 'active',
      role: user.role.toUpperCase(),
      lastLogin: new Date(user.lastLogin).toISOString(),
      permissions: user.permissions.map((p: string) => p.toLowerCase()).sort()
    });

    const rawUser = {
      id: "user_123",
      firstName: "John",
      lastName: "Doe",
      email: "JOHN.DOE@EXAMPLE.COM",
      status: "active",
      role: "admin",
      lastLogin: "2024-01-01T10:30:00Z",
      permissions: ["READ", "WRITE", "DELETE", "ADMIN"]
    };

    const transformed = transformUserData(rawUser);
    expect(transformed).toMatchSnapshot();
  });

  test("snapshot testing for API responses", () => {
    const createAPIResponse = (data: any, status = 200) => ({
      status,
      success: status >= 200 && status < 300,
      data,
      timestamp: new Date().toISOString(),
      requestId: `req_${Math.random().toString(36).substring(2)}`,
      version: "v1.0.0"
    });

    const userData = {
      id: 1,
      username: "johndoe",
      email: "john@example.com",
      profile: {
        firstName: "John",
        lastName: "Doe",
        avatar: "https://example.com/avatar.jpg"
      }
    };

    const response = createAPIResponse(userData);

    // For API responses with dynamic data, snapshot the structure
    const snapshotData = {
      ...response,
      timestamp: "[DYNAMIC_TIMESTAMP]",
      requestId: "[DYNAMIC_REQUEST_ID]"
    };

    expect(snapshotData).toMatchSnapshot();
  });

  test("snapshot testing for error states", () => {
    class ValidationError extends Error {
      constructor(public field: string, public code: string, message: string) {
        super(message);
        this.name = 'ValidationError';
      }
    }

    const createErrorResponse = (error: Error) => ({
      success: false,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3), // Limit stack trace
        ...(error instanceof ValidationError && {
          field: error.field,
          code: error.code
        })
      },
      timestamp: new Date().toISOString()
    });

    const validationError = new ValidationError(
      'email',
      'INVALID_FORMAT',
      'Email address format is invalid'
    );

    const errorResponse = createErrorResponse(validationError);

    // Normalize dynamic data for snapshot
    const snapshotData = {
      ...errorResponse,
      timestamp: "[DYNAMIC_TIMESTAMP]",
      error: {
        ...errorResponse.error,
        stack: errorResponse.error.stack?.map(() => "[STACK_FRAME]")
      }
    };

    expect(snapshotData).toMatchSnapshot();
  });

  test("snapshot testing for configuration objects", () => {
    const createAppConfig = (env: string) => ({
      environment: env,
      database: {
        host: env === 'production' ? 'prod-db.example.com' : 'localhost',
        port: 5432,
        ssl: env === 'production',
        poolSize: env === 'production' ? 20 : 5
      },
      cache: {
        enabled: true,
        ttl: env === 'production' ? 3600 : 300,
        maxSize: env === 'production' ? 10000 : 1000
      },
      logging: {
        level: env === 'production' ? 'warn' : 'debug',
        format: 'json',
        outputs: env === 'production' ? ['file', 'remote'] : ['console']
      },
      features: {
        newFeature: env === 'staging',
        experimental: env === 'development'
      }
    });

    const configs = {
      development: createAppConfig('development'),
      staging: createAppConfig('staging'),
      production: createAppConfig('production')
    };

    expect(configs).toMatchSnapshot();
  });

  test("snapshot testing for HTML generation", () => {
    const generateUserCard = (user: any) => `
      <div class="user-card" data-user-id="${user.id}">
        <img src="${user.avatar}" alt="${user.name}'s avatar" class="avatar">
        <div class="user-info">
          <h3 class="name">${user.name}</h3>
          <p class="email">${user.email}</p>
          <span class="role ${user.role}">${user.role}</span>
        </div>
        <div class="stats">
          <span class="posts">${user.posts} posts</span>
          <span class="followers">${user.followers} followers</span>
        </div>
      </div>
    `.trim();

    const user = {
      id: 123,
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "https://example.com/avatar.jpg",
      role: "admin",
      posts: 42,
      followers: 1234
    };

    const html = generateUserCard(user);
    expect(html).toMatchSnapshot();
  });

  test("snapshot testing for CSS generation", () => {
    const generateButtonStyles = (variant: string, size: string) => {
      const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      };

      const variantStyles = {
        primary: {
          backgroundColor: '#007bff',
          color: 'white',
          border: '1px solid #007bff'
        },
        secondary: {
          backgroundColor: 'transparent',
          color: '#007bff',
          border: '1px solid #007bff'
        }
      };

      const sizeStyles = {
        small: { padding: '6px 12px', fontSize: '14px' },
        medium: { padding: '8px 16px', fontSize: '16px' },
        large: { padding: '12px 24px', fontSize: '18px' }
      };

      return {
        ...baseStyles,
        ...variantStyles[variant as keyof typeof variantStyles],
        ...sizeStyles[size as keyof typeof sizeStyles]
      };
    };

    const styles = {
      primarySmall: generateButtonStyles('primary', 'small'),
      primaryMedium: generateButtonStyles('primary', 'medium'),
      secondaryLarge: generateButtonStyles('secondary', 'large')
    };

    expect(styles).toMatchSnapshot();
  });

  test("snapshot testing for SQL queries", () => {
    const generateUserQueries = (tableName: string) => ({
      selectById: `SELECT * FROM ${tableName} WHERE id = $1`,
      selectByEmail: `SELECT * FROM ${tableName} WHERE email = $1`,
      insert: `INSERT INTO ${tableName} (name, email, created_at) VALUES ($1, $2, NOW()) RETURNING id`,
      update: `UPDATE ${tableName} SET name = $1, email = $2, updated_at = NOW() WHERE id = $3`,
      delete: `DELETE FROM ${tableName} WHERE id = $1`,
      count: `SELECT COUNT(*) FROM ${tableName}`,
      selectActive: `SELECT * FROM ${tableName} WHERE active = true ORDER BY created_at DESC LIMIT $1`
    });

    const queries = generateUserQueries('users');
    expect(queries).toMatchSnapshot();
  });

  test("snapshot testing for file system structures", () => {
    const createProjectStructure = (projectName: string) => ({
      [projectName]: {
        'package.json': { name: projectName, version: '1.0.0' },
        'bun.lock': 'lockfile contents',
        'src': {
          'index.ts': '// Main entry point',
          'utils.ts': '// Utility functions',
          'types.ts': '// Type definitions'
        },
        'tests': {
          'index.test.ts': '// Test suite',
          'utils.test.ts': '// Utility tests'
        },
        'docs': {
          'README.md': '# Project Documentation',
          'API.md': '# API Reference'
        }
      }
    });

    const structure = createProjectStructure('my-bun-project');
    expect(structure).toMatchSnapshot();
  });
});