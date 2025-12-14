# AGENTS.md - Coding Agent Guidelines

## Build & Test Commands

**Bun-exclusive commands (never npm/yarn/pnpm):**

```bash
# Testing
bun test                    # All tests
bun test <file>            # Single test file
bun test --grep "pattern"  # Run specific test
bun run test:concurrent    # Concurrent tests
bun run test:integration   # Integration tests
bun run test:api          # API tests
bun run test:performance  # Performance benchmarks

# Code Quality
bun run typecheck          # TypeScript validation
bun run lint              # Lint and typecheck
```

## Code Style Guidelines

### TypeScript & Imports
- **ESM only**: `"type": "module"`, no CommonJS
- **Strict TypeScript**: Full type safety, no `any`
- **Imports**: Group by type (builtins → external → internal)
- **Exports**: Named exports preferred, default only for main entry

### Naming & Structure
- **Files**: `kebab-case.ts`, tests as `*.test.ts`
- **Variables**: `camelCase`, descriptive names
- **Constants**: `UPPER_SNAKE_CASE as const`
- **Classes**: `PascalCase`, methods `camelCase`
- **Interfaces**: `PascalCase`, prefixed with `I` if needed

### Documentation & Comments
- **JSDoc**: All public APIs with `@param`, `@returns`
- **Comments**: Explain complex logic, not obvious code
- **Examples**: Include usage examples in docstrings

### Error Handling
- **Descriptive errors**: `throw new Error("Specific message")`
- **Try/catch**: Wrap risky operations
- **Validation**: Early returns for invalid inputs

### Formatting
- **Consistent indentation**: 2 spaces
- **Line length**: < 100 characters
- **Trailing commas**: Always in multiline structures
- **Semicolons**: Required

### Performance
- **Bun APIs**: Prefer native `Bun.*` over Node.js polyfills
- **Efficient loops**: Use `for-of` for arrays, `for-in` for objects
- **Memory**: Avoid unnecessary object creation

---

*Follow these guidelines for consistent, maintainable code.*