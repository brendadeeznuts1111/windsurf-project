import { describe, test, expect } from "bun:test";

describe("Bun Snapshot Testing Examples", () => {
  test("basic object snapshot", () => {
    const user = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      preferences: {
        theme: "dark",
        notifications: true,
        language: "en"
      }
    };

    expect(user).toMatchSnapshot();
  });

  test("array snapshot", () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

    expect(numbers).toMatchSnapshot();
    expect(fibonacci).toMatchSnapshot();
  });

  test("complex nested structure", () => {
    const apiResponse = {
      success: true,
      data: {
        users: [
          { id: 1, name: "Alice", role: "admin" },
          { id: 2, name: "Bob", role: "user" },
          { id: 3, name: "Charlie", role: "moderator" }
        ],
        metadata: {
          total: 3,
          page: 1,
          limit: 10,
          filters: {
            active: true,
            verified: true
          }
        }
      },
      timestamp: "2024-01-01T12:00:00Z",
      requestId: "req-12345"
    };

    expect(apiResponse).toMatchSnapshot();
  });

  test("function output snapshot", () => {
    function calculateStats(numbers: number[]) {
      const sum = numbers.reduce((a, b) => a + b, 0);
      const avg = sum / numbers.length;
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      const sorted = [...numbers].sort((a, b) => a - b);
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

      return { sum, avg, min, max, median, count: numbers.length };
    }

    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const stats = calculateStats(data);

    expect(stats).toMatchSnapshot();
  });

  test("error object snapshot", () => {
    try {
      throw new Error("Something went wrong");
    } catch (error) {
      expect(error).toMatchSnapshot();
    }
  });

  test("date and time snapshots", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

    // Test date structure without exact timestamps
    expect({
      nowFormat: now.toISOString().split('T')[0], // Just the date part
      futureFormat: future.toISOString().split('T')[0], // Just the date part
      timeDifference: future.getTime() - now.getTime(), // Should be exactly 24 hours
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isValidDate: now instanceof Date && !isNaN(now.getTime())
    }).toMatchSnapshot();
  });

  test("regular expression snapshot", () => {
    const patterns = {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      phone: /^\+?[\d\s\-\(\)]+$/,
      url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    };

    // Test the patterns against sample data
    const testResults = {
      email: patterns.email.test("user@example.com"),
      phone: patterns.phone.test("+1 (555) 123-4567"),
      url: patterns.url.test("https://example.com/path?query=value"),
      uuid: patterns.uuid.test("550e8400-e29b-41d4-a716-446655440000")
    };

    expect({ patterns: patterns.toString(), testResults }).toMatchSnapshot();
  });

  test("Map and Set snapshots", () => {
    const userMap = new Map([
      ["alice", { id: 1, role: "admin" }],
      ["bob", { id: 2, role: "user" }],
      ["charlie", { id: 3, role: "moderator" }]
    ]);

    const permissions = new Set(["read", "write", "execute"]);

    expect({
      userMap: Object.fromEntries(userMap),
      permissions: Array.from(permissions)
    }).toMatchSnapshot();
  });

  test("component-like structure snapshot", () => {
    // Simulate a component configuration
    const componentConfig = {
      type: "Button",
      props: {
        variant: "primary",
        size: "medium",
        disabled: false,
        children: "Click me",
        onClick: "handleClick", // Function reference would be serialized
        style: {
          backgroundColor: "#007bff",
          color: "white",
          padding: "8px 16px",
          borderRadius: "4px"
        }
      },
      metadata: {
        version: "1.0.0",
        lastModified: "2024-01-01",
        author: "Component Library"
      }
    };

    expect(componentConfig).toMatchSnapshot();
  });

  test("API response simulation", () => {
    const mockAPIResponse = {
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json",
        "cache-control": "max-age=300",
        "x-api-version": "v1.2.3"
      },
      data: {
        users: [
          {
            id: "user_123",
            username: "johndoe",
            email: "john@example.com",
            profile: {
              firstName: "John",
              lastName: "Doe",
              avatar: "https://example.com/avatar.jpg",
              bio: "Software developer passionate about Bun"
            },
            stats: {
              posts: 42,
              followers: 1234,
              following: 567
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          hasNext: false,
          hasPrev: false
        }
      },
      request: {
        method: "GET",
        url: "/api/users",
        timestamp: "2024-01-01T12:00:00Z"
      }
    };

    expect(mockAPIResponse).toMatchSnapshot();
  });

  test("performance metrics snapshot", () => {
    // Simulate performance metrics collection
    const metrics = {
      responseTime: 145, // ms
      throughput: 1250, // requests per second
      errorRate: 0.02, // 2%
      memoryUsage: {
        rss: 45.2, // MB
        heapUsed: 32.1, // MB
        heapTotal: 64.0, // MB
        external: 8.5 // MB
      },
      cpuUsage: {
        user: 12.5, // %
        system: 3.2, // %
        total: 15.7 // %
      },
      database: {
        connections: 8,
        queryTime: 23.4, // ms average
        slowQueries: 2
      },
      cache: {
        hitRate: 0.89, // 89%
        size: 1024, // entries
        evictions: 45
      }
    };

    expect(metrics).toMatchSnapshot();
  });
});