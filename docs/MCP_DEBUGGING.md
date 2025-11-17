# Bun MCP Server Debugging Guide

This guide provides comprehensive debugging setup for the Bun Model Context Protocol (MCP) server in VS Code.

## 🚀 Quick Start

### Prerequisites
- **Bun** v1.3.0+ installed
- **VS Code** with Bun extension
- **Node.js** for MCP SDK compatibility

### Installation
```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
cd mcp-server
bun install

# Install VS Code Bun extension
code --install-extension oven.bun
```

## 🐛 Debugging Configurations

### MCP Server Debugging

#### Development Mode
- **Configuration**: "Debug MCP Server (Development)"
- **Environment**: Development with debug logging
- **Features**: 
  - `BUN_DEBUG=1` for Bun runtime debugging
  - `MCP_LOG_LEVEL=debug` for verbose MCP logging
  - Source map support
  - Hot reload capabilities

#### Production Mode
- **Configuration**: "Debug MCP Server (Production)"
- **Environment**: Production settings
- **Features**:
  - Optimized performance
  - Production logging levels
  - Error handling only

#### Test Mode
- **Configuration**: "Debug MCP Server with Test Input"
- **Environment**: Test mode with mock data
- **Features**:
  - Pre-build task execution
  - Test environment variables
  - Mock MCP client simulation

### Automation Script Debugging

#### Script Execution
- **Configuration**: "Debug Bun Script Execution"
- **Input**: Prompt for script path
- **Use Cases**: 
  - Debug individual automation scripts
  - Test script parameters
  - Performance profiling

#### Automation Scripts
- **Configuration**: "Debug Automation Scripts"
- **Input**: Dropdown selection of available scripts
- **Available Scripts**:
  - `automated-setup.ts` - Project scaffolding
  - `continuous-testing.ts` - Test pipeline
  - `incremental-verification.ts` - Health checks
  - `monitoring-dashboard.ts` - Real-time monitoring

## 🔧 Debugging Features

### Breakpoints
Set breakpoints directly in VS Code:
- **Tool Functions**: Debug MCP tool implementations
- **Resource Handlers**: Debug resource access
- **Prompt Handlers**: Debug prompt generation
- **Error Handling**: Debug error scenarios

### Variable Inspection
- **Local Variables**: Inspect function parameters and local state
- **Global State**: Monitor MCP server state
- **Environment Variables**: Debug configuration issues
- **Process State**: Monitor Bun runtime information

### Console Output
- **Standard Output**: View MCP protocol messages
- **Error Output**: Debug error conditions
- **Debug Logs**: Detailed runtime information
- **Performance Metrics**: Monitor execution times

## 📊 Debugging Scenarios

### 1. MCP Tool Debugging
```typescript
// Set breakpoint in tool implementation
server.tool(
  "search-bun-docs",
  "Search Bun documentation",
  { query: z.string() },
  async ({ query }) => {
    // Breakpoint here to inspect search parameters
    const results = await searchBunDocumentation(query);
    return { content: [{ type: "text", text: results }] };
  }
);
```

### 2. Resource Handler Debugging
```typescript
// Debug resource access
server.resource("bun-features", "text/plain", async (uri) => {
  // Breakpoint to inspect resource requests
  const features = getBunFeatures();
  return { contents: [{ uri: uri.href, text: JSON.stringify(features) }] };
});
```

### 3. Error Handling
```typescript
// Debug error scenarios
try {
  const result = await riskyOperation();
  return result;
} catch (error: any) {
  // Breakpoint to inspect error conditions
  console.error("Operation failed:", error);
  return { isError: true, content: [{ type: "text", text: error.message }] };
}
```

## 🛠️ Advanced Debugging

### Memory Profiling
```bash
# Enable memory profiling
BUN_DEBUG=1 bun --inspect index.ts

# Generate heap snapshot
# Use Chrome DevTools to analyze memory usage
```

### Performance Debugging
```bash
# Enable performance monitoring
BUN_DEBUG=perf bun run index.ts

# Profile specific functions
bun --prof index.ts
```

### Network Debugging
```bash
# Debug MCP protocol communication
MCP_LOG_LEVEL=trace bun run index.ts

# Monitor WebSocket connections
BUN_DEBUG=net bun run index.ts
```

## 🔍 Common Issues

### 1. Module Resolution
```bash
# Error: Cannot find module
# Solution: Check bun.lockb and reinstall
bun install --force
```

### 2. TypeScript Compilation
```bash
# Error: TypeScript compilation failed
# Solution: Check types and rebuild
bun run build
bun run typecheck
```

### 3. MCP Protocol Errors
```bash
# Error: MCP protocol violation
# Solution: Enable debug logging
MCP_LOG_LEVEL=debug bun run index.ts
```

### 4. Port Conflicts
```bash
# Error: Port already in use
# Solution: Kill existing process or change port
lsof -ti:3000 | xargs kill -9
```

## 📝 Debugging Checklist

### Before Debugging
- [ ] Install all dependencies (`bun install`)
- [ ] Build the project (`bun run build`)
- [ ] Check TypeScript compilation (`bun run typecheck`)
- [ ] Verify MCP server configuration

### During Debugging
- [ ] Set appropriate breakpoints
- [ ] Configure environment variables
- [ ] Enable debug logging
- [ ] Monitor console output

### After Debugging
- [ ] Fix identified issues
- [ ] Run tests to verify fixes
- [ ] Update documentation
- [ ] Commit changes

## 🎯 Best Practices

### 1. Environment Setup
- Use consistent environment variables
- Separate development and production configs
- Enable debug logging only when needed

### 2. Breakpoint Strategy
- Set breakpoints at logical boundaries
- Use conditional breakpoints for specific scenarios
- Monitor variable changes over time

### 3. Error Handling
- Log errors with context
- Use try-catch blocks for risky operations
- Provide meaningful error messages

### 4. Performance Monitoring
- Profile critical code paths
- Monitor memory usage
- Track execution times

## 🔗 Additional Resources

### Documentation
- [Bun Debugging Guide](https://bun.com/docs/guides/runtime/debugging)
- [VS Code Bun Extension](https://bun.com/docs/guides/runtime/vscode)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

### Tools
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Bun Inspector](https://bun.com/docs/guides/runtime/debugging)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)

### Community
- [Bun Discord](https://discord.bun.sh)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [VS Code Marketplace](https://marketplace.visualstudio.com/)

---

This debugging guide provides comprehensive coverage for developing and troubleshooting the Bun MCP server. Use these configurations and techniques to efficiently debug issues and optimize performance.
