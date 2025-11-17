# MCP Server for Odds Protocol

## Overview

This Model Context Protocol (MCP) server provides comprehensive automation and management tools for the Odds Protocol monorepo. It enables AI assistants to execute, optimize, and manage JavaScript/TypeScript projects using Bun's high-performance runtime.

## Features

### 🛠️ Project Management
- **Automated Setup**: Create new Odds Protocol projects with optimal configuration
- **Template Selection**: Choose from minimal, full, WebSocket, or ML templates
- **CI/CD Integration**: Automatic GitHub Actions setup
- **Dependency Management**: Intelligent catalog-based dependency resolution

### 🧪 Testing Automation
- **Comprehensive Test Suite**: Unit, integration, and performance tests
- **Coverage Analysis**: V8 provider with configurable thresholds
- **Concurrent Execution**: Optimized test parallelization
- **Real-time Monitoring**: Live test execution status

### 🔍 Verification System
- **Incremental Health Checks**: Continuous project validation
- **Security Auditing**: Dependency vulnerability scanning
- **Performance Profiling**: Memory and execution analysis
- **Code Quality**: Type checking and linting validation

### 🚀 Deployment Pipeline
- **Multi-environment Support**: Development, staging, and production
- **Automated Rollback**: Failure recovery mechanisms
- **Performance Monitoring**: Post-deployment verification
- **Security Validation**: Pre-deployment security checks

## Installation

```bash
cd mcp-server
bun install
```

## Usage

### Start the MCP Server
```bash
bun run start
```

### Development Mode
```bash
bun run dev
```

## Available Tools

### `setup-project`
Automatically set up a new Odds Protocol project with optimal configuration.

**Parameters:**
- `projectName` (string): Name of the project
- `template` (enum): Project template - "minimal", "full", "websocket", "ml"
- `includeTests` (boolean): Include test setup
- `includeCI` (boolean): Include CI/CD configuration

### `run-comprehensive-tests`
Execute complete test suite with coverage, performance, and integration tests.

**Parameters:**
- `coverage` (boolean): Enable coverage reporting
- `concurrent` (boolean): Enable concurrent test execution
- `performance` (boolean): Include performance tests
- `integration` (boolean): Include integration tests

### `verify-project-health`
Perform incremental verification of project health and dependencies.

**Parameters:**
- `deepScan` (boolean): Enable deep code analysis
- `security` (boolean): Include security audit
- `performance` (boolean): Include performance analysis

### `automated-deployment`
Execute automated deployment with proper validation and rollback capabilities.

**Parameters:**
- `environment` (enum): Target environment - "development", "staging", "production"
- `region` (string): Deployment region
- `force` (boolean): Force deployment without confirmation

## Resources

### `project-structure`
Provides detailed information about the Odds Protocol monorepo structure, including packages, apps, and scripts.

### `test-configuration`
Returns comprehensive test configuration including framework settings, coverage thresholds, and performance metrics.

## Prompts

### `optimize-performance`
Generate performance optimization recommendations for specific components or the entire protocol.

### `setup-development-environment`
Provide comprehensive development environment setup instructions for different platforms.

## Configuration

The MCP server uses the following configuration files:
- `package.json`: Dependencies and scripts
- `bunfig.toml`: Bun runtime configuration
- `bun.test.toml`: Test configuration
- `tsconfig.json`: TypeScript configuration

## Integration with VS Code

To use this MCP server with VS Code Copilot:

1. Add the server to your MCP client configuration
2. Configure the transport as "stdio"
3. Set the command to `bun` and args to `["run", "start"]`
4. Restart VS Code to enable the new tools

## Security Considerations

- All inputs are validated using Zod schemas
- Commands are generated but not executed automatically
- Deployment operations require explicit confirmation
- Security audits are performed before production deployments

## Performance Features

- **Bun v1.3 Optimization**: Leverages latest Bun performance features
- **Concurrent Processing**: Parallel test execution and builds
- **Memory Management**: Optimized garbage collection and memory usage
- **Fast Builds**: 60% faster builds on macOS with threadpool optimization

## Monitoring and Logging

- Real-time execution status
- Detailed error reporting with stack traces
- Performance metrics and benchmarking
- Coverage reporting with HTML output

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
