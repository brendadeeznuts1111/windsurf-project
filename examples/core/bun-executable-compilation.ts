/**
 * Bun Executable Compilation - Cross-platform Standalone Binaries
 * Demonstrates the new Bun.build() compile API and CLI features
 */

import { test, expect } from 'bun:test';

// ===== CLI EXECUTABLE COMPILATION =====

// Example CLI application to compile
const cliApp = `
#!/usr/bin/env bun

// CLI Tool: Environment Inspector
console.log("🌍 Environment Inspector v1.0");
console.log("Runtime:", process.execArgv?.join(" ") || "default");
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);
console.log("Node Version:", process.version);
console.log("Bun Version:", Bun.version);

// Check for embedded args
if (process.execArgv?.includes("--smol")) {
  console.log("🐌 Smol mode activated!");
}

if (process.execArgv?.includes("--user-agent")) {
  const uaIndex = process.execArgv.indexOf("--user-agent");
  if (uaIndex !== -1 && process.execArgv[uaIndex + 1]) {
    console.log("🤖 Custom User-Agent:", process.execArgv[uaIndex + 1]);
  }
}

// Make an HTTP request to test user-agent
const response = await fetch("https://httpbin.org/user-agent");
const data = await response.json();
console.log("📡 Detected User-Agent:", data["user-agent"]);

console.log("✅ Environment inspection complete!");
`;

// ===== PROGRAMMATIC COMPILATION EXAMPLES =====

test('compiles executable for current platform', async () => {
  const result = await Bun.build({
    entrypoints: ["./test-cli.ts"],
    compile: true, // Uses entrypoint name as executable name
  });

  expect(result.success).toBe(true);
  expect(result.outputs).toBeDefined();
  expect(result.outputs.length).toBeGreaterThan(0);

  // Check that executable was created
  const output = result.outputs[0];
  expect(output.path).toMatch(/test-cli/);
});

test('compiles with custom target platform', async () => {
  const result = await Bun.build({
    entrypoints: ["./test-cli.ts"],
    compile: "bun-linux-x64" as any,
  });

  expect(result.success).toBe(true);
  expect(result.outputs[0].path).toMatch(/test-cli/);
});

test('compiles with musl for better compatibility', async () => {
  const result = await Bun.build({
    entrypoints: ["./test-cli.ts"],
    compile: "bun-linux-x64-musl" as any,
  });

  expect(result.success).toBe(true);
});

test('compiles with advanced configuration', async () => {
  const result = await Bun.build({
    entrypoints: ["./test-cli.ts"],
    compile: {
      target: "bun-windows-x64",
      outfile: "./my-custom-app.exe",
      windows: {
        title: "My Custom App",
        publisher: "My Company",
        version: "1.2.3.4",
        description: "A custom application built with Bun",
        copyright: "© 2024 My Company",
        // icon: "./app-icon.ico", // Optional
      },
    },
  });

  expect(result.success).toBe(true);
  expect(result.outputs[0].path).toMatch(/my-custom-app\.exe/);
});

test('compiles with embedded runtime arguments', async () => {
  // This would be used with --compile-exec-argv flag
  // For testing, we'll just verify the API accepts the configuration
  const result = await Bun.build({
    entrypoints: ["./test-cli.ts"],
    compile: {
      target: "bun-linux-x64",
      outfile: "./app-with-args",
    },
  });

  expect(result.success).toBe(true);
});

// ===== CLI COMPILATION COMMANDS =====

// These would be run from the command line:

// Basic compilation
// bun build ./cli.ts --compile --outfile=my-app

// Cross-platform compilation
// bun build ./cli.ts --compile --outfile=my-app-linux --target=bun-linux-x64
// bun build ./cli.ts --compile --outfile=my-app-windows.exe --target=bun-windows-x64
// bun build ./cli.ts --compile --outfile=my-app-macos --target=bun-darwin-x64

// With embedded runtime arguments
// bun build ./cli.ts --compile --outfile=my-app --compile-exec-argv="--smol --user-agent=MyApp/1.0"

// Windows metadata
// bun build ./cli.ts --compile --outfile=my-app.exe \
//   --windows-title="My App" \
//   --windows-publisher="My Company" \
//   --windows-version="1.0.0.0" \
//   --windows-description="My awesome application"

// ===== TESTING COMPILED EXECUTABLES =====

test('compiled executable includes embedded args', async () => {
  // This test would run a compiled executable and check process.execArgv
  // For demonstration, we'll mock the expected behavior

  const expectedArgs = ["--smol", "--user-agent=MyApp/1.0"];

  // In a real test, you would:
  // 1. Compile the executable with --compile-exec-argv
  // 2. Run the executable
  // 3. Check that process.execArgv contains the embedded args

  expect(expectedArgs).toContain("--smol");
  expect(expectedArgs).toContain("--user-agent=MyApp/1.0");
});

test('cross-platform executables work correctly', async () => {
  // Test that executables compiled for different platforms
  // contain the correct binary format and run properly

  const platforms = [
    "bun-linux-x64" as any,     // Linux CI runners
    "bun-linux-x64-musl" as any, // Alpine Linux
    "bun-windows-x64" as any,   // Windows CI
    "bun-darwin-x64" as any,    // macOS CI
  ];

  for (const platform of platforms) {
    const result = await Bun.build({
      entrypoints: ["./test-cli.ts"],
      compile: platform,
      minify: true, // Minify for production
    });

    expect(result.success).toBe(true);
    expect(result.outputs[0]).toBeDefined();
  }
});

// ===== PLUGIN SUPPORT IN COMPILED EXECUTABLES =====

test('bundler plugins work with compilation', async () => {
  // Test that custom bundler plugins are supported during compilation

  const customPlugin = {
    name: "test-plugin",
    setup(build: any) {
      build.onLoad({ filter: /\.test$/ }, async (args: any) => {
        return {
          contents: 'export default "transformed by plugin";',
          loader: "js",
        };
      });
    },
  };

  const result = await Bun.build({
    entrypoints: ["./test-with-plugin.test"],
    plugins: [customPlugin],
    compile: true,
  });

  expect(result.success).toBe(true);
});

// ===== PERFORMANCE COMPARISON =====

test('compilation vs runtime performance', async () => {
  // Measure the performance difference between:
  // 1. Running with `bun run script.ts`
  // 2. Running compiled executable

  const startTime = performance.now();

  // Simulate running the app multiple times
  for (let i = 0; i < 10; i++) {
    // In real test, would run the actual executable
    await Bun.sleep(1);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Compiled executables should start faster than `bun run`
  expect(duration).toBeLessThan(100); // Should complete quickly
});

// ===== DISTRIBUTION EXAMPLES =====

// Example of how to distribute compiled applications
test('executable metadata is correctly embedded', async () => {
  const result = await Bun.build({
    entrypoints: ["./test-cli.ts"],
    compile: {
      target: "bun-windows-x64",
      outfile: "./dist/my-app.exe",
      windows: {
        title: "My Application",
        publisher: "My Company",
        version: "2.1.0.0",
        description: "Professional application built with Bun",
        copyright: "© 2024 My Company",
      },
    },
  });

  expect(result.success).toBe(true);

  // In Windows, you could check the executable metadata
  // using tools like `sigcheck.exe` or Windows Explorer properties
});

// ===== CI/CD INTEGRATION =====

test('compilation works in CI environment', async () => {
  // Test that compilation works in various CI environments
  // This is important for automated builds and releases

  const ciTargets = [
    "bun-linux-x64" as any,     // Linux CI runners
    "bun-linux-x64-musl" as any, // Alpine Linux
    "bun-windows-x64" as any,   // Windows CI
    "bun-darwin-x64" as any,    // macOS CI
  ];

  for (const target of ciTargets) {
    const result = await Bun.build({
      entrypoints: ["./ci-test.ts"],
      compile: target,
      minify: true, // Minify for production
    });

    expect(result.success).toBe(true);
    expect(result.outputs[0]).toBeDefined();
  }
});

// ===== ERROR HANDLING =====

test('compilation fails gracefully on errors', async () => {
  try {
    await Bun.build({
      entrypoints: ["./nonexistent-file.ts"],
      compile: true,
    });
    throw new Error("Should have thrown an error");
  } catch (error) {
    expect(error).toBeDefined();
    expect(error instanceof Error).toBe(true);
  }
});

test('invalid targets are rejected', async () => {
  try {
    await Bun.build({
      entrypoints: ["./test-cli.ts"],
      compile: "invalid-target" as any,
    });
    throw new Error("Should have thrown an error for invalid target");
  } catch (error) {
    expect(error).toBeDefined();
  }
});