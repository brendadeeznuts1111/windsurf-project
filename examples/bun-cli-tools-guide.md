# Bun CLI Tools & Enhancements Guide

> Comprehensive guide to Bun's command-line interface, package management, and development tools

Bun provides a powerful CLI with fast package management, script running, and development tools. This guide covers all major CLI commands and recent enhancements.

## Package Management

### bun install - Fast Package Installation

```bash
# Install all dependencies
bun install

# Install specific packages
bun install lodash axios

# Install dev dependencies
bun install -d typescript @types/node

# Install from GitHub
bun install github:user/repo

# Install with alias
bun install my-package@npm:other-package

# Force reinstall
bun install --force

# Use specific registry
bun install --registry https://registry.npmjs.org
```

### bun add - Add Dependencies

```bash
# Add to dependencies
bun add react react-dom

# Add to devDependencies
bun add -d @types/react

# Add specific version
bun add lodash@4.17.21

# Add from Git
bun add github:user/repo#branch
```

### bun remove - Remove Dependencies

```bash
# Remove packages
bun remove lodash axios

# Remove dev dependencies
bun remove -d typescript
```

### bun update - Update Dependencies

```bash
# Update all packages
bun update

# Update specific packages
bun update react axios

# Update to latest versions
bun update --latest

# Interactive update mode
bun update --interactive
```

## Script Execution

### bun run - Run Scripts

```bash
# Run package.json scripts
bun run build
bun run dev
bun run test

# Run arbitrary commands
bun run "echo hello"

# Run with environment variables
NODE_ENV=production bun run build

# Run TypeScript files directly
bun run src/index.ts

# Run with watch mode
bun run --watch dev
```

### bunx - Execute Binaries

`bunx` is Bun's equivalent of `npx`, providing fast execution of package binaries.

```bash
# Run create-react-app
bunx create-react-app my-app

# Run TypeScript compiler
bunx tsc --version

# Run ESLint
bunx eslint src/

# Execute binary from specific package
bunx --package renovate renovate-config-validator

# Short form
bunx -p @angular/cli ng new my-app
```

#### --package Flag

The `--package` (or `-p`) flag allows running binaries from packages where the binary name differs from the package name:

```bash
# Run renovate-config-validator from renovate package
bunx --package renovate renovate-config-validator

# Run ng from @angular/cli package
bunx -p @angular/cli ng new my-app

# Run jest from react-scripts
bunx -p react-scripts jest
```

This is particularly useful for:
- **Scoped packages**: `@angular/cli` provides `ng`
- **Multi-binary packages**: `renovate` provides `renovate-config-validator`
- **Dev tools**: Various packages ship multiple executables

## Development Tools

### bun dev - Development Server

```bash
# Start development server
bun dev

# Specify port
bun dev --port 3001

# Hot reload (default)
bun dev --hot

# Disable hot reload
bun dev --no-hot
```

### bun test - Test Runner

```bash
# Run all tests
bun test

# Run specific test file
bun test src/components/Button.test.ts

# Run with coverage
bun test --coverage

# Run in watch mode
bun test --watch

# Run specific test pattern
bun test --grep "Button component"

# Run with timeout
bun test --timeout 10000

# Bail on first failure
bun test --bail

# Run in verbose mode
bun test --verbose
```

### bun build - Bundler

```bash
# Build for production
bun build src/index.ts

# Specify output file
bun build src/index.ts --outfile dist/bundle.js

# Build to directory
bun build src/index.ts --outdir dist

# Minify output
bun build --minify

# Watch mode
bun build --watch

# Target environment
bun build --target node
bun build --target browser

# Create standalone executable
bun build --compile cli.ts
```

## File Operations

### bun create - Project Templates

```bash
# Create from template
bun create react my-app
bun create next my-app
bun create svelte my-app

# Create from GitHub
bun create user/repo my-app
```

### Direct File Execution

```bash
# Run TypeScript directly
bun index.ts
bun src/server.ts

# Run JavaScript
bun script.js

# Execute with arguments
bun script.ts arg1 arg2
```

## Debugging & Inspection

### bun --inspect - Debug Mode

```bash
# Start with debugger
bun --inspect index.ts

# Specify debugger port
bun --inspect=9229 index.ts

# Connect to debugger
bun --inspect-brk index.ts
```

### bun --print - Evaluate Expressions

```bash
# Evaluate JavaScript
bun --print "Math.random()"

# Evaluate TypeScript
bun --print "const x: number = 42; x * 2"

# Format JSON
echo '{"name": "bun"}' | bun --print "JSON.parse(await Bun.stdin.text())"
```

### bun --hot - Hot Reload

```bash
# Hot reload for development
bun --hot run dev.ts

# Hot reload with custom port
bun --hot --port 3001 run server.ts
```

## Environment & Configuration

### .env File Support

Bun automatically loads `.env` files:

```bash
# .env
DATABASE_URL=postgresql://localhost/mydb
API_KEY=sk-1234567890

# .env.local (overrides .env)
DATABASE_URL=postgresql://localhost/dev

# Run with environment
bun run server.ts
```

### bunfig.toml - Configuration

```toml
# bunfig.toml
[install]
registry = "https://registry.npmjs.org"
cacheDir = "./node_modules/.cache"

[run]
hot = true
port = "3000"

[build]
outdir = "./dist"
minify = true
sourcemap = "linked"
```

## Performance & Optimization

### bun --smol - Minimal Runtime

```bash
# Use minimal runtime for smaller bundles
bun --smol build app.ts
```

### Concurrent Operations

```bash
# Run multiple commands concurrently
bun run "build:css & build:js & build:assets"

# Use workspaces
bun run --workspaces test
```

### Memory Management

```bash
# Monitor memory usage
bun run --inspect server.ts

# Garbage collection hints
bun run --gc server.ts
```

## Advanced Features

### Plugin System

```typescript
// bunfig.toml
[build.plugins]
// Plugin configuration
```

### Custom Loaders

```typescript
// Custom file loaders
export const loaders = {
  '.custom': 'text',
  '.data': 'json',
};
```

### Macro Support

```typescript
// Compile-time macros
const VERSION = Bun.macro(() => process.env.npm_package_version);
```

## CLI Reference

### Global Flags

```bash
# Version information
bun --version
bun -v

# Help
bun --help
bun -h

# Verbose output
bun --verbose

# Quiet mode
bun --silent

# CPU architecture override
bun --cpu x64
bun --cpu arm64

# Operating system override
bun --os linux
bun --os darwin
bun --os windows
```

### Environment Variables

```bash
# Disable telemetry
BUN_TELEMETRY=0 bun run build

# Custom cache directory
BUN_CACHE_DIR=/tmp/bun-cache bun install

# Maximum HTTP connections
BUN_CONFIG_MAX_HTTP_REQUESTS=256 bun run script

# Debug mode
DEBUG=* bun run server
```

## Integration Examples

### Full-Stack Development Workflow

```bash
# Initialize project
bun create react my-app
cd my-app

# Install dependencies
bun install

# Start development
bun dev

# Run tests
bun test

# Build for production
bun run build

# Create executable
bun build --compile src/index.ts
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run build
```

### Docker Integration

```dockerfile
FROM oven/bun:latest

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bun run build

# Run application
CMD ["bun", "run", "start"]
```

## Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Fix permission issues
chmod +x node_modules/.bin/*
```

#### Cache Issues
```bash
# Clear cache
rm -rf ~/.bun/cache
bun install --force
```

#### Lockfile Conflicts
```bash
# Regenerate lockfile
rm bun.lockb
bun install
```

### Performance Tuning

#### Large Projects
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" bun run build
```

#### Network Issues
```bash
# Use different registry
bun install --registry https://registry.yarnpkg.com
```

#### Build Performance
```bash
# Use more CPU cores
bun build --concurrency 8
```

## Best Practices

### Development
- Use `bun dev` for development with hot reload
- Leverage `bun --print` for quick testing
- Use `bunx` for one-off tool execution

### Production
- Use `bun build --compile` for standalone executables
- Enable minification and source maps appropriately
- Configure proper environment variables

### CI/CD
- Use `oven-sh/setup-bun` GitHub Action
- Cache `~/.bun` directory
- Use `--frozen-lockfile` for reproducible builds

### Security
- Audit dependencies regularly
- Use specific package versions
- Avoid running untrusted code with `bun --print`

## Related Documentation

For working with private scoped registries and authentication, see the [Bun Private Registry Guide](../bun-private-registry-guide.md).

This guide covers Bun's comprehensive CLI toolkit, from basic package management to advanced development workflows and production deployment strategies.