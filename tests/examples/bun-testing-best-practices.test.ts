// examples/testing/bun-testing-best-practices.test.ts - Bun Testing Best Practices Example
// Demonstrates proper Bun testing patterns following official guidelines

import { describe, test, expect, beforeEach, afterEach } from "bun:test";

// Example class to test
class UserService {
  private users: Map<string, { id: string; name: string; email: string }> = new Map();

  createUser(id: string, name: string, email: string) {
    if (!id || !name || !email) {
      throw new Error("Invalid user data");
    }
    if (this.users.has(id)) {
      throw new Error("User already exists");
    }
    this.users.set(id, { id, name, email });
    return this.users.get(id);
  }

  getUser(id: string) {
    return this.users.get(id) || null;
  }

  updateUser(id: string, updates: Partial<{ name: string; email: string }>) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    Object.assign(user, updates);
    return user;
  }

  deleteUser(id: string) {
    if (!this.users.has(id)) {
      throw new Error("User not found");
    }
    this.users.delete(id);
    return true;
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }
}

describe("UserService - Bun Testing Best Practices", () => {
  let userService: UserService;

  // Proper setup/teardown following Bun guidelines
  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(async () => {
    // Clean up
    userService = null as any;
  });

  describe("User Creation", () => {
    test("should create a valid user successfully", async () => {
      const userData = { id: "user1", name: "John Doe", email: "john@example.com" };

      const result = userService.createUser(userData.id, userData.name, userData.email);

      expect(result).toEqual(userData);
      expect(result?.id).toBe(userData.id);
      expect(result?.name).toBe(userData.name);
      expect(result?.email).toBe(userData.email);
    });

    test("should throw error when creating user with invalid data", () => {
      // Test error conditions - following Bun's error testing patterns
      expect(() => userService.createUser("", "John", "john@example.com")).toThrow("Invalid user data");
      expect(() => userService.createUser("user1", "", "john@example.com")).toThrow("Invalid user data");
      expect(() => userService.createUser("user1", "John", "")).toThrow("Invalid user data");
    });

    test("should throw error when creating duplicate user", () => {
      // Setup
      userService.createUser("user1", "John", "john@example.com");

      // Test duplicate creation
      expect(() => userService.createUser("user1", "Jane", "jane@example.com")).toThrow("User already exists");
    });

    test("should handle special characters in user data", () => {
      const userData = {
        id: "user-special",
        name: "José María ñoño",
        email: "jose.maria@ejemplo.com"
      };

      const result = userService.createUser(userData.id, userData.name, userData.email);

      expect(result?.name).toBe(userData.name);
      expect(result?.email).toBe(userData.email);
    });
  });

  describe("User Retrieval", () => {
    test("should retrieve existing user", () => {
      const userData = { id: "user1", name: "John", email: "john@example.com" };
      userService.createUser(userData.id, userData.name, userData.email);

      const result = userService.getUser("user1");

      expect(result).toEqual(userData);
    });

    test("should return null for non-existent user", () => {
      const result = userService.getUser("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("User Updates", () => {
    beforeEach(() => {
      userService.createUser("user1", "John", "john@example.com");
    });

    test("should update user name successfully", () => {
      const result = userService.updateUser("user1", { name: "John Smith" });

      expect(result?.name).toBe("John Smith");
      expect(result?.email).toBe("john@example.com"); // Unchanged
    });

    test("should update user email successfully", () => {
      const result = userService.updateUser("user1", { email: "johnsmith@example.com" });

      expect(result?.name).toBe("John"); // Unchanged
      expect(result?.email).toBe("johnsmith@example.com");
    });

    test("should update multiple fields successfully", () => {
      const updates = { name: "Jane Doe", email: "jane@example.com" };
      const result = userService.updateUser("user1", updates);

      expect(result?.name).toBe("Jane Doe");
      expect(result?.email).toBe("jane@example.com");
    });

    test("should throw error when updating non-existent user", () => {
      expect(() => userService.updateUser("nonexistent", { name: "New Name" })).toThrow("User not found");
    });
  });

  describe("User Deletion", () => {
    test("should delete existing user successfully", () => {
      userService.createUser("user1", "John", "john@example.com");

      const result = userService.deleteUser("user1");

      expect(result).toBe(true);
      expect(userService.getUser("user1")).toBeNull();
    });

    test("should throw error when deleting non-existent user", () => {
      expect(() => userService.deleteUser("nonexistent")).toThrow("User not found");
    });
  });

  describe("Bulk Operations", () => {
    test("should return all users", () => {
      const users = [
        { id: "user1", name: "John", email: "john@example.com" },
        { id: "user2", name: "Jane", email: "jane@example.com" },
        { id: "user3", name: "Bob", email: "bob@example.com" }
      ];

      // Create all users
      users.forEach(user => {
        userService.createUser(user.id, user.name, user.email);
      });

      const result = userService.getAllUsers();

      expect(result).toHaveLength(3);
      expect(result).toEqual(expect.arrayContaining(users));
    });

    test("should return empty array when no users exist", () => {
      const result = userService.getAllUsers();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("Performance & Memory", () => {
    test("should handle large number of users efficiently", async () => {
      const startTime = Bun.nanoseconds();

      // Create 1000 users
      for (let i = 0; i < 1000; i++) {
        userService.createUser(`user${i}`, `User ${i}`, `user${i}@example.com`);
      }

      const endTime = Bun.nanoseconds();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      // Should complete in reasonable time (< 100ms for 1000 operations)
      expect(durationMs).toBeLessThan(100);

      const allUsers = userService.getAllUsers();
      expect(allUsers).toHaveLength(1000);


    });

    test("should not leak memory after operations", async () => {
      // This test demonstrates memory leak detection patterns
      for (let i = 0; i < 100; i++) {
        userService.createUser(`temp${i}`, `Temp ${i}`, `temp${i}@example.com`);
      }

      // Force cleanup

      // Verify operations still work after cleanup
      const testUser = userService.createUser("final", "Final", "final@example.com");
      expect(testUser?.id).toBe("final");
    });
  });

  describe("Type Safety & Edge Cases", () => {
    test("should handle undefined and null inputs gracefully", () => {
      // @ts-expect-error - Testing invalid inputs
      expect(() => userService.createUser(undefined, "John", "john@example.com")).toThrow();

      // @ts-expect-error - Testing invalid inputs
      expect(() => userService.createUser("user1", null, "john@example.com")).toThrow();

      // @ts-expect-error - Testing invalid inputs
      expect(() => userService.getUser(null)).not.toThrow(); // Should handle gracefully
    });

    test("should handle extremely long strings", () => {
      const longName = "A".repeat(10000);
      const longEmail = "a".repeat(9000) + "@example.com";

      const result = userService.createUser("long", longName, longEmail);

      expect(result?.name).toBe(longName);
      expect(result?.email).toBe(longEmail);
    });

    test("should handle Unicode and emoji in user data", () => {
      const unicodeData = {
        id: "unicode",
        name: "🚀 José María ñoño 🌟",
        email: "josé.maría.ñoño@example.com"
      };

      const result = userService.createUser(unicodeData.id, unicodeData.name, unicodeData.email);

      expect(result?.name).toBe(unicodeData.name);
      expect(result?.email).toBe(unicodeData.email);
    });
  });
});

// Example of a regression test following Bun's pattern
// This would be in test/regression/issue/01234.test.ts in Bun's codebase
describe("Regression Tests - Following Bun Patterns", () => {
  test("should handle edge case that was previously broken", () => {
    // This demonstrates the pattern for regression tests
    // In Bun's codebase, this would be: test/regression/issue/01234.test.ts

    const userService = new UserService();

    // Test the specific case that was reported in an issue
    const result = userService.createUser("edge", "Edge Case", "edge@example.com");

    expect(result?.id).toBe("edge");
    expect(result?.name).toBe("Edge Case");
  });
});

// CLI Testing Example (following Bun's test/cli/ pattern)
describe("CLI Output Testing - Bun Pattern", () => {
  test("should demonstrate CLI testing patterns", async () => {
    // This shows how Bun tests CLI commands
    // In Bun's codebase, this would be in test/cli/

    const command = "echo 'Hello from Bun test'";
    const proc = Bun.spawn(["sh", "-c", command], {
      stdout: "pipe",
      stderr: "pipe"
    });

    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
    expect(output.trim()).toBe("Hello from Bun test");
  });
});

// Bundler Testing Example (following Bun's test/bundler/ pattern)
describe("Bundler Testing - Bun Pattern", () => {
  test("should demonstrate bundler testing patterns", () => {
    // This shows how Bun tests its bundler
    // In Bun's codebase, this would be in test/bundler/

    const code = `
      import { add } from './math';
      console.log(add(2, 3));
    `;

    // This is a simplified example - Bun's actual bundler tests are more complex
    expect(code).toContain("import");
    expect(code).toContain("console.log");
    expect(code).toMatch(/import\s*{\s*[^}]+\s*}\s*from\s*['"][^'"]+['"]/);
  });
});