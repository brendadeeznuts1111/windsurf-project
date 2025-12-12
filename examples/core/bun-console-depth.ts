/**
 * Bun Console Depth Configuration
 * Demonstrates the new --console-depth flag and bunfig.toml configuration
 */

import { test, describe } from 'bun:test';

// ===== NESTED DATA STRUCTURES =====

const deeplyNestedObject = {
  level1: {
    level2: {
      level3: {
        level4: {
          level5: {
            level6: {
              level7: {
                level8: {
                  level9: {
                    level10: {
                      value: "Deeply nested value",
                      array: [1, 2, { nested: { more: "data" } }],
                      function: () => "test",
                      symbol: Symbol("test"),
                      buffer: Buffer.from("test"),
                      date: new Date(),
                      regex: /test/g,
                      null: null,
                      undefined: undefined,
                      boolean: true,
                      number: 42,
                      string: "test string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

const circularReference = { self: null as any };
circularReference.self = circularReference;

// ===== CONSOLE DEPTH DEMONSTRATIONS =====

console.log('🔍 Console Depth Demonstrations\n');

// Default depth (2)
console.log('📊 Default depth (2):');
console.log(deeplyNestedObject);
console.log();

// Depth 4
console.log('📊 Depth 4:');
console.log(deeplyNestedObject);
console.log();

// Depth 10 (full)
console.log('📊 Depth 10 (full):');
console.log(deeplyNestedObject);
console.log();

// ===== CLI USAGE EXAMPLES =====

// To run with different depths:
// bun run examples/core/bun-console-depth.ts          # Uses bunfig.toml setting (depth 4)
// bun --console-depth=2 run examples/core/bun-console-depth.ts  # Override to depth 2
// bun --console-depth=10 run examples/core/bun-console-depth.ts # Override to depth 10

// ===== PRACTICAL DEBUGGING SCENARIOS =====

test('Debugging complex data structures', () => {
  const complexData = {
    user: {
      profile: {
        personal: {
          name: "John Doe",
          details: {
            age: 30,
            preferences: {
              theme: "dark",
              notifications: {
                email: true,
                push: {
                  enabled: true,
                  schedule: {
                    morning: true,
                    evening: false,
                    quiet: {
                      start: "22:00",
                      end: "08:00"
                    }
                  }
                }
              }
            }
          }
        },
        account: {
          status: "active",
          permissions: ["read", "write", "admin"]
        }
      }
    },
    metadata: {
      created: new Date(),
      version: "1.0.0",
      features: ["console-depth", "debugging", "logging"]
    }
  };

  console.log('🐛 Debugging complex user data:');
  console.log(complexData);
  console.log();

  // With depth 4, you can see:
  // - user.profile.personal.name
  // - user.profile.personal.details.age
  // - user.profile.personal.details.preferences.theme
  // - user.profile.account.status
  // But not deeper nested items like quiet hours
});

test('API response debugging', () => {
  const apiResponse = {
    success: true,
    data: {
      users: [
        {
          id: 1,
          name: "Alice",
          profile: {
            avatar: "avatar1.jpg",
            settings: {
              theme: "light",
              language: "en",
              preferences: {
                notifications: {
                  email: true,
                  sms: false,
                  push: {
                    enabled: true,
                    quietHours: {
                      enabled: true,
                      start: "22:00",
                      end: "08:00"
                    }
                  }
                }
              }
            }
          }
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 100,
        links: {
          next: "/api/users?page=2",
          prev: null,
          first: "/api/users?page=1",
          last: "/api/users?page=10"
        }
      }
    },
    metadata: {
      requestId: "req-12345",
      timestamp: new Date().toISOString(),
      version: "v1",
      environment: "production"
    }
  };

  console.log('🔗 API Response debugging:');
  console.log(apiResponse);
  console.log();
});

test('Configuration object inspection', () => {
  const config = {
    database: {
      connection: {
        host: "localhost",
        port: 5432,
        credentials: {
          username: "admin",
          password: "secret",
          ssl: {
            enabled: true,
            ca: "path/to/ca.pem",
            cert: "path/to/client.crt",
            key: "path/to/client.key",
            options: {
              rejectUnauthorized: true,
              checkServerIdentity: true
            }
          }
        },
        pool: {
          min: 2,
          max: 10,
          idle: 30000,
          acquire: 60000
        }
      }
    },
    cache: {
      redis: {
        host: "redis-server",
        port: 6379,
        password: "redis-pass",
        db: 0,
        cluster: {
          enabled: false,
          nodes: ["redis-1", "redis-2", "redis-3"]
        }
      }
    },
    logging: {
      level: "info",
      format: "json",
      outputs: [
        {
          type: "file",
          path: "/var/log/app.log",
          rotation: {
            maxSize: "10m",
            maxFiles: 5,
            compress: true
          }
        },
        {
          type: "console",
          colorize: true,
          timestamp: true
        }
      ]
    }
  };

  console.log('⚙️ Configuration inspection:');
  console.log(config);
  console.log();
});

// ===== DEPTH COMPARISON =====

test('Depth comparison demonstration', () => {
  console.log('📏 Depth Comparison:\n');

  console.log('Depth 1 (very shallow):');
  console.log(deeplyNestedObject);
  console.log();

  console.log('Depth 3 (moderate):');
  console.log(deeplyNestedObject);
  console.log();

  console.log('Depth 6 (deep):');
  console.log(deeplyNestedObject);
  console.log();

  console.log('Depth null (unlimited):');
  console.log(deeplyNestedObject);
  console.log();
});

// ===== PERFORMANCE CONSIDERATIONS =====

test('Performance impact of depth', () => {
  const largeObject = {
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      nested: {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: `item-${i}`,
                  metadata: {
                    created: new Date(),
                    tags: ["test", "data", "large"],
                    config: {
                      enabled: true,
                      settings: {
                        timeout: 5000,
                        retries: 3,
                        backoff: {
                          initial: 100,
                          multiplier: 2,
                          max: 10000
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }))
  };

  console.log('⚡ Performance test with large object:');

  const start = performance.now();
  console.log(largeObject); // This will respect console.depth setting
  const time = performance.now() - start;

  console.log(`⏱️ Console logging took: ${time.toFixed(2)}ms`);
  console.log('💡 Higher depth = more processing time for large objects\n');
});

// ===== CONFIGURATION EXAMPLES =====

// bunfig.toml configuration:
// [run]
// console.depth = 4

// CLI overrides:
// bun --console-depth=2 run script.ts  # Shallow inspection
// bun --console-depth=10 run script.ts # Deep inspection
// bun --console-depth=0 run script.ts  # No inspection (shows [Object])

// ===== DEBUGGING WORKFLOWS =====

test('Debugging workflow example', () => {
  console.log('🔧 Debugging Workflow:\n');

  // Simulate debugging a complex issue
  const debugData = {
    request: {
      id: "req-123",
      method: "POST",
      url: "/api/users",
      headers: {
        "content-type": "application/json",
        "authorization": "Bearer token...",
        "user-agent": "TestClient/1.0"
      },
      body: {
        user: {
          name: "John Doe",
          email: "john@example.com",
          profile: {
            avatar: null,
            bio: "Software developer",
            location: {
              city: "San Francisco",
              state: "CA",
              coordinates: {
                lat: 37.7749,
                lng: -122.4194,
                accuracy: "high"
              }
            }
          }
        }
      }
    },
    response: {
      status: 201,
      headers: {
        "content-type": "application/json",
        "location": "/api/users/456"
      },
      body: {
        user: {
          id: 456,
          name: "John Doe",
          email: "john@example.com",
          created: "2024-01-15T10:30:00Z"
        },
        links: {
          self: "/api/users/456",
          profile: "/api/users/456/profile",
          posts: "/api/users/456/posts"
        }
      }
    },
    metadata: {
      duration: 150,
      databaseQueries: 3,
      cacheHits: 1,
      cacheMisses: 2,
      externalCalls: [
        {
          service: "email",
          endpoint: "/send-welcome",
          duration: 45,
          status: 200
        }
      ]
    }
  };

  console.log('🐛 Full debug information:');
  console.log(debugData);
  console.log();

  // With console.depth = 4, you can see:
  // - request.method, request.url
  // - request.body.user.name, request.body.user.profile.bio
  // - request.body.user.profile.location.city
  // - response.status, response.body.user.id
  // - metadata.duration, metadata.databaseQueries
  // But not the deepest nested items like coordinates or links
});

// ===== SUMMARY =====

console.log('🎯 Console Depth Configuration Summary:');
console.log('• Default depth: 2 levels');
console.log('• Configurable via --console-depth=N flag');
console.log('• Persistent config in bunfig.toml [run] console.depth = N');
console.log('• Higher depth = more detailed debugging');
console.log('• Performance consideration for large objects');
console.log('• Essential for complex data structure debugging');

export { deeplyNestedObject, circularReference };