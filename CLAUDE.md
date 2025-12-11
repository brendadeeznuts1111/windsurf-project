# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

**All commands use Bun exclusively - never npm/yarn/pnpm.**

```bash
# Install dependencies
bun install

# Development
bun run dev              # Start all services
bun run dev:all          # Run all packages in parallel

# Testing
bun test                 # Run all tests
bun run test:unit        # Unit tests only
bun run test:integration # Integration tests
bun run test:performance # Performance benchmarks
bun run test:property    # Property-based tests (fast-check)

# Building
bun run build            # Development build
bun run build:prod       # Production build

# Code quality
bun run lint             # Lint all code
bun run typecheck        # Type checking
```

### Dashboard-specific (apps/dashboard/)

```bash
bun run dev              # Vite dev server with hot reload
bun run build            # Production build
bun run test:all         # Run comprehensive test suite
bun run api              # Start API server (URLPattern routing)
bun run api:dev          # API server on localhost:6969
bun run type-check       # TypeScript validation
```

### Package-specific

```bash
# odds-core
cd packages/odds-core && bun test
cd packages/odds-core && bun run build

# odds-websocket
cd packages/odds-websocket && bun run start  # Start WebSocket server
cd packages/odds-websocket && bun test
cd packages/odds-websocket && bun run test:performance

# mcp-server
cd mcp-server && bun run start  # Start MCP server
cd mcp-server && bun run dev    # Dev mode with --watch
```

## Architecture Overview

### Monorepo Structure

- **packages/odds-core** - Core types, validation, utilities, telemetry engine, error handling, YAML config, session management
- **packages/odds-websocket** - High-performance WebSocket server (700k+ msg/sec), tick processor, time management
- **packages/odds-arbitrage** - Arbitrage detection, Kelly criterion calculations
- **apps/dashboard** - React dashboard with Vite, URLPattern API server, market telemetry demos
- **mcp-server** - Model Context Protocol server for Bun documentation search and project automation

### Key Technical Patterns

**Bun Runtime (v1.3.4+)**
- Native TypeScript execution without compilation
- `Bun.serve()` for HTTP/WebSocket servers
- `Bun.file()` for file operations
- `bun:sqlite` for in-memory databases
- YAML parsing via native APIs
- `bun update --interactive` installs updates directly (no extra `bun install` needed)
- npm: alias prefixes preserved during updates

**Core Package Exports** (packages/odds-core/src/index.ts)
- Types, constants, utils, validation, errors
- `configLoader` - YAML configuration
- `sessionManager` - Auth session handling
- `compressionService` - Zstd compression
- `smartErrorHandler` - Error handling with doc search
- Telemetry and PID context management

**WebSocket Architecture**
- uWebSockets.js for maximum throughput
- Sub-millisecond latency for odds updates
- Connection management with tick processing

**Unified Dashboard Server** (apps/dashboard/src/server.ts)
- Single Bun.serve() instance on port 6969
- HTTP API routes via URLPattern routing
- WebSocket upgrade at `/ws` endpoint
- Real-time telemetry broadcasting
- PID-aware tick streaming to connected clients

**Dashboard API** (apps/dashboard/src/api/)
- URLPattern-based routing for sub-millisecond matching
- RESTful arbitrage API with SQLite
- Prometheus metrics endpoints
- CORS enabled for cross-origin

**Telemetry Integration**
- `OddsWebSocketClient` - Auto-subscribes to `market-ticks` and `metrics` channels
- `PerformanceMetrics` - Live tick display with latency tracking
- Channels: `market-ticks`, `metrics`
- Messages include PID context for process attribution

### Testing Strategy

- **Vitest** for dashboard (happy-dom environment)
- **bun test** for packages
- **fast-check** for property-based testing
- Test files follow `*.test.ts` pattern

## Code Style

- TypeScript with strict mode
- ESM imports only (`"type": "module"`)
- Target ES2022
- Bun native APIs preferred over Node.js polyfills

## Azure DevOps Integration

**Organization:** https://dev.azure.com/brendawill2233
**Project:** brendawill2233
**Repository:** brendawill2233

### CLI Tools

```bash
# Azure DevOps CLI helper
bun run scripts/az-devops-cli.ts <command>

# Common commands
bun run scripts/az-devops-cli.ts status        # Project overview
bun run scripts/az-devops-cli.ts sync          # Sync repos
bun run scripts/az-devops-cli.ts wi:create task "Title"  # Create work item
bun run scripts/az-devops-cli.ts wi:list Active         # List work items
bun run scripts/az-devops-cli.ts pipe:run odds-protocol-ci  # Run pipeline
bun run scripts/az-devops-cli.ts pr:create branch "Title"   # Create PR
bun run scripts/az-devops-cli.ts help          # All commands
```

### MCP Server with Azure DevOps

The MCP server (`mcp-server/`) includes Azure DevOps tools:
- `azure-create-work-item` - Create work items
- `azure-list-work-items` - Query work items
- `azure-run-pipeline` - Trigger pipelines
- `azure-create-pr` - Create pull requests
- `azure-project-stats` - Project statistics

Start MCP server: `cd mcp-server && bun run start`

### Webhook Handler

```bash
# Start local webhook handler
bun run scripts/azure-webhook-handler.ts

# Expose publicly for testing
ngrok http 9090
```

Supported events: build.complete, git.pullrequest.created, git.push, workitem.created

### Git Remotes

```bash
git remote add azure https://dev.azure.com/brendawill2233/brendawill2233/_git/brendawill2233
git push azure main  # Push to Azure DevOps
```

## Project-Specific Notes

- Telemetry uses PID context for process attribution across distributed systems
- Market data pipeline targets nanosecond precision
- Arbitrage detection tied to rotation number system
- Odds-mono-map/ is an Obsidian knowledge vault (separate from code)
