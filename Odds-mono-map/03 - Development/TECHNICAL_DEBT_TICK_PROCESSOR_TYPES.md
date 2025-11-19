# Technical Debt: Monolithic Type Definition File

**Status:** Open
**Priority:** High
**Created:** 2025-11-19

## Issue Description
The file `src/types/tick-processor-types.ts` (formerly `vault-types.ts`) has grown to over 8000 lines of code. It contains a monolithic collection of type definitions that spans multiple domains (Vault, Canvas, Analytics, Templates, etc.).

## Impact
- **Maintainability:** Extremely difficult to navigate and modify.
- **Performance:** TypeScript language server performance may degrade.
- **Cognitive Load:** Developers cannot easily find relevant types.
- **Naming Collisions:** High risk of naming conflicts within the single namespace.

## Proposed Refactoring Plan
Split the file into domain-specific type modules under `src/types/`:

1.  `src/types/vault/` - Core vault types
2.  `src/types/canvas/` - Canvas integration types
3.  `src/types/analytics/` - Analytics and metrics types
4.  `src/types/templates/` - Template system types
5.  `src/types/config/` - Configuration interfaces

## Action Items
- [ ] Analyze dependencies to determine split boundaries.
- [ ] Create new directory structure.
- [ ] incrementally move types and update imports.
- [ ] Deprecate and eventually remove `tick-processor-types.ts`.
