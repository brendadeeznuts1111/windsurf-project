import { describe, it, expect } from "bun:test";

describe("Windsurf WebSocket Server", () => {
  it("should export server components", async () => {
    // Test that we can import the server module
    const serverModule = await import("./src/server");
    expect(serverModule).toBeDefined();
  });

  it("should have proper package.json", () => {
    const pkg = require("./package.json");
    expect(pkg.name).toBe("windsurf-websocket-server");
    expect(pkg.version).toBe("1.0.0");
    expect(pkg.scripts.start).toBe("bun run src/server.ts");
  });

  it("should have README documentation", async () => {
    const fs = require("fs");
    const readme = fs.readFileSync("./README.md", "utf8");
    expect(readme).toContain("Windsurf WebSocket Server");
    expect(readme).toContain("Real-time WebSocket server");
    expect(readme).toContain("Bun-native");
  });
});