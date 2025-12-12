# Bun v1.3.5 Release Notes & Features

> Complete overview of Bun v1.3.5 enhancements including package management tools, workspace improvements, testing features, and developer experience improvements

## 🚀 Major Features

### Package Management Tools

#### `bun pm pkg` Command

A new command for programmatically managing your `package.json` file with four subcommands:

```bash
# Get properties
bun pm pkg get name
bun pm pkg get name version

# Set properties (supports dot notation and bracket notation)
bun pm pkg set name="my-package"
bun pm pkg set scripts.test="jest" version=2.0.0

# Delete properties
bun pm pkg delete description
bun pm pkg delete scripts.test contributors[0]

# Fix common errors
bun pm pkg fix
```

#### `bun pm pack --quiet` Flag

Suppresses verbose output and only prints the tarball filename:

```bash
# Verbose output (default)
bun pm pack
# bun pack v1.2.18
# packed 131B package.json
# packed 40B index.js
# my-package-1.0.0.tgz
# Total files: 2
# Shasum: f2451d6eb1e818f500a791d9aace80b394258a90
# Unpacked size: 171B
# Packed size: 249B

# Quiet output for scripting
TARBALL=$(bun pm pack --quiet)
echo "Created: $TARBALL"
# Created: my-package-1.0.0.tgz
```

#### `bun why` Command

Debug your `node_modules` by tracing dependency chains:

```bash
# See why a package is installed
bun why react
# react@18.2.0
#   └─ my-app@1.0.0 (requires ^18.0.0)

# Use glob patterns for multiple packages
bun why "@types/*"
# @types/react@18.2.15
#   └─ dev my-app@1.0.0 (requires ^18.0.0)
```

### Workspace & Dependency Management

#### Faster `bun install` in Workspaces

Fixed bug causing workspace packages to be re-evaluated multiple times, resulting in faster and more reliable installations in monorepos.

#### Dependency Resolution Priority

Ambiguity in the dependency resolution logic has been fixed that could cause an unexpected version of a package to be installed when the same package listed in multiple dependency groups, such as dependencies and devDependencies. The dependency resolution priority has been adjusted to devDependencies > optionalDependencies > dependencies > peerDependencies.

```json
{
  "dependencies": {
    "react": "18.2.0"
  },
  "devDependencies": {
    "react": "18.3.0"
  },
  "peerDependencies": {
    "react": "18.2.1"
  }
}
```

#### .npmrc Configuration Support

`bun install` and `bun add` now read `link-workspace-packages` and `save-exact` settings from `.npmrc`:

```bash
# ./.npmrc
save-exact=true

# Now saves exact versions
bun add is-odd
# "dependencies": { "is-odd": "3.0.1" }
```

#### Top-Level Catalogs

Dependency catalogs can now be defined at the root level of `package.json`:

```json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*"],

  "catalog": {
    "react": "18.2.0"
  },
  "catalogs": {
    "testing": {
      "@testing-library/react": "16.0.0"
    }
  }
}
```

## 🧪 Testing & Development Tools

### VS Code Test Explorer Integration

The official Bun VS Code extension now integrates with the native Test Explorer UI, providing real-time test discovery, progress, and results.

### Compact Output for AI Agents

`bun test` output is more compact when run in AI agents like Claude Code, conserving context window space.

### Variable Substitution in `test.each`

Support for `$variable` substitution in test titles:

```typescript
import { test, expect } from "bun:test";

const testCases = [
  { user: { name: "Alice" }, a: 1, b: 2, expected: 3 },
  { user: { name: "Bob" }, a: 5, b: 5, expected: 10 },
];

// Generates titles: "Add 1 and 2 for Alice", "Add 5 and 5 for Bob"
test.each(testCases)("Add $a and $b for $user.name", ({ a, b, expected }) => {
  expect(a + b).toBe(expected);
});
```

### Coverage Path Ignore Patterns

Exclude files from test coverage reports using `test.coveragePathIgnorePatterns` in `bun.toml`:

```toml
[test]
# Single pattern
coveragePathIgnorePatterns = "**/__tests__/**"

# Or array of patterns
coveragePathIgnorePatterns = [
  "**/__tests__/**",
  "**/test-fixtures.ts",
]
```

## 🐛 Bug Fixes & Improvements

### Snapshot Testing
- Updated snapshot file header link from deprecated goo.gl to official Bun documentation
- Header now points to `https://bun.sh/docs/test/snapshots`

### Performance
- Faster workspace installations
- Improved dependency resolution logic
- Better memory usage in monorepo scenarios

### Developer Experience
- More intuitive package management commands
- Better debugging tools (`bun why`)
- Enhanced VS Code integration
- AI-friendly test output

## 📚 Documentation & Tooling

### Enhanced Package Management
- Programmatic `package.json` manipulation
- Better workspace support
- Improved dependency analysis tools

### Testing Infrastructure
- Native VS Code integration
- Advanced test configuration options
- Better coverage reporting controls

## 🔧 Migration Guide

### From v1.3.4 to v1.3.5

1. **No breaking changes** - All features are backward compatible
2. **Package management** - New `bun pm pkg` command available
3. **Workspace performance** - Automatic improvements for monorepos
4. **Testing** - Enhanced VS Code integration and new configuration options
5. **Dependency resolution** - More predictable behavior with priority ordering

### Recommended Updates

```bash
# Update to latest version
bun update

# Try new package management commands
bun pm pkg get name version
bun pm pkg set scripts.lint="eslint src"

# Use bun why for dependency debugging
bun why react

# Configure coverage exclusions in bun.toml
echo '[test]\ncoveragePathIgnorePatterns = ["**/__tests__/**"]' >> bun.toml
```

## 🎯 Key Benefits

- **Better Package Management**: Programmatic control over package.json
- **Enhanced Workspaces**: Faster installs and better dependency resolution
- **Improved Testing**: VS Code integration and advanced configuration
- **Developer Productivity**: Better debugging tools and AI-friendly output
- **Future-Proof**: Aligns with modern JavaScript tooling expectations

This release continues Bun's focus on developer experience with powerful new tools for package management, testing, and workspace development.