# Windsurf - Bun-Based Development Platform

**Enterprise-grade development platform built with Bun runtime**

> High-performance development tools and utilities replacing traditional Node.js patterns with Bun-native APIs

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development dashboard
bun run dev

# Run all tests
bun test

# Run integration demo
bun run integration

# View examples
bun run examples

# Type checking
bun run typecheck
```

## 📁 Project Structure

```
windsurf-project/
├── 🔧 src/               # Core Windsurf system components
│   ├── utils/            # Utility modules and tools
│   │   ├── bun-text-loader.ts      # Text file loading system
│   │   ├── bun-env-synchronizer.ts # Environment management
│   │   ├── bun-unix-socket-proxy.ts # Socket proxying
│   │   ├── config-manager.ts       # Configuration management
│   │   ├── metrics-collector.ts    # System metrics
│   │   ├── performance-profiler.ts # Performance analysis
│   │   └── settings-loader.ts      # Local settings
│   ├── core/             # Core system components
│   ├── workers/          # Worker thread management
│   ├── security/         # Security validation
│   ├── monitoring/       # System monitoring
│   └── cli/              # Command-line interfaces
├── 🎯 examples/          # Usage examples and demos
├── 🧪 benchmarks/        # Performance benchmarks
├── 📊 reports/           # Test and benchmark reports
├── ⚙️ scripts/           # Build and automation scripts
├── 🏗️ mcp-server/        # Model Context Protocol server
├── 📦 packages/          # Additional packages
├── 🚀 apps/              # Application entry points
├── 📝 docs/              # Technical documentation
├── 📚 Odds-mono-map/     # Knowledge management vault
└── 🗂️ .root/             # Historical docs and archives
```

## Updated Top‑Level Directory Layout

- `docs/` – primary technical documentation.
- `reports/` – test results, performance benchmarks, and other reports.
- `.root/` – archived documentation, guides, and historical files (kept for reference only).

These directories are now reflected in the tree above.


## 🎯 Core Systems

### 🚀 **10 Enterprise-Grade Systems**

1. **📄 Bun Text File Loader** - Replaces Node.js `require.extensions` with sub-millisecond performance
2. **🔄 Environment Synchronizer** - Bidirectional sync between `process.env` and `Bun.env`
3. **🔗 Unix Socket Proxy** - TCP ↔ Unix socket proxying for container services
4. **👷 Worker Spawn System** - Extended Worker class with external tool execution
5. **🎯 Tension Scoring Engine** - Real-time system health monitoring with configurable rules
6. **🔒 Security Validation** - Tool whitelisting, environment sanitization, audit logging
7. **📊 Metrics Collector** - Comprehensive system statistics and performance monitoring
8. **⚙️ Configuration Manager** - Multi-format config support with hot reloading
9. **📈 Performance Profiler** - CPU/memory profiling with memory leak detection
10. **🔧 Settings Loader** - Local configuration management with type safety

### ⚡ **Performance Benchmarks**
- **Text File Loading**: 0.005ms for 11-byte files, 0.019ms for 100KB files
- **Memory Usage**: Efficient caching with automatic cleanup
- **System Health**: Real-time monitoring with sub-millisecond overhead

## 🛠️ Technology Stack

- **Runtime**: Bun 1.3.4+ with native TypeScript execution
- **Language**: TypeScript 5.4+ with strict type checking
- **Architecture**: ESM-only, Bun-native APIs preferred over Node.js polyfills
- **Testing**: Bun test framework with comprehensive test utilities
- **Performance**: Sub-millisecond file operations, efficient memory management
- **Configuration**: YAML/JSON/TOML/env support with hot reloading

## 📋 Available Scripts

### Development
```bash
bun run dev              # Start development dashboard
bun run examples         # View interactive examples
bun run integration      # Run integration demo
```

### Testing & Quality
```bash
bun test                 # Run all tests
bun run typecheck        # TypeScript type checking
```

### Building
```bash
bun run build            # Production build
```

## 💡 Usage Examples

### Text File Loading
```typescript
import { BunTextLoader } from './src/utils/bun-text-loader';

// Load a text file with caching
const result = await BunTextLoader.load('./config.txt', { cache: true });
console.log(result.content); // File content
console.log(result.loadTime); // Load time in milliseconds
```

### Environment Synchronization
```typescript
import { BunEnvironmentSynchronizer } from './src/utils/bun-env-synchronizer';

// Sync environment variables bidirectionally
const sync = new BunEnvironmentSynchronizer();
await sync.synchronize();

// Now process.env and Bun.env are in sync
```

### Performance Monitoring
```typescript
import { MetricsCollector } from './src/utils/metrics-collector';

const metrics = new MetricsCollector();
metrics.startCollection();

setInterval(() => {
  console.log('System metrics:', metrics.getSnapshot());
}, 1000);
```

### Configuration Management
```typescript
import { ConfigManager } from './src/utils/config-manager';

const config = new ConfigManager();
await config.loadFromFile('./config.yaml');

// Access configuration with type safety
const dbConfig = config.get('database');
```

## 🏗️ System Architecture

### Core Utility Systems

1. **Bun Text File Loader** (`src/utils/bun-text-loader.ts`)
   - Replaces Node.js `require.extensions` for `.txt` files
   - UTF-8/Base64 encoding with intelligent caching
   - Batch loading capabilities

2. **Environment Synchronizer** (`src/utils/bun-env-synchronizer.ts`)
   - Bidirectional synchronization between `process.env` and `Bun.env`
   - Worker isolation and legacy compatibility
   - Custom environment transformers

3. **Unix Socket Proxy** (`src/utils/bun-unix-socket-proxy.ts`)
   - TCP ↔ Unix socket proxying for container services
   - Connection management and health monitoring
   - Statistics and performance metrics

4. **Configuration Manager** (`src/utils/config-manager.ts`)
   - Multi-format support (JSON/YAML/TOML/env)
   - Schema validation and hot reloading
   - Environment inheritance and overrides

5. **Metrics Collector** (`src/utils/metrics-collector.ts`)
   - Comprehensive system statistics collection
   - Prometheus export capabilities
   - Health monitoring with configurable thresholds

### Core Engine Systems

6. **Tension Scoring Engine** (`src/core/tension-scoring/tension-engine.ts`)
   - Real-time system health monitoring
   - Configurable alerting rules
   - Performance impact assessment

7. **Worker Spawn System** (`src/workers/worker-with-spawn.ts`)
   - Extended Worker class with external tool execution
   - Security validation and resource limits
   - Circuit breaker pattern implementation

8. **Security Validation** (`src/security/spawn-validator.ts`)
   - Tool whitelisting and environment sanitization
   - Audit logging and resource monitoring
   - Input validation and sanitization

### Development Tools

9. **Performance Profiler** (`src/utils/performance-profiler.ts`)
   - CPU and memory profiling utilities
   - Memory leak detection
   - Benchmarking and export capabilities

10. **Settings Loader** (`src/utils/settings-loader.ts`)
    - Local configuration management
    - Type-safe settings access
    - Integration with config manager

### Applications & Interfaces

- **Dashboard** (`dashboard.ts`) - Real-time monitoring interface
- **Examples CLI** (`examples/index.ts`) - Interactive examples system
- **Integration Demo** (`integration.ts`) - Complete system demonstration
   - Event handling
   - Data transformation

## 🧪 Testing Strategy

- **Unit Tests**: Fast, isolated component testing
- **Integration Tests**: Cross-component functionality
- **Property Tests**: Generative testing with fast-check
- **Performance Tests**: Load and stress testing
- **Contract Tests**: API and WebSocket contract validation

## 📊 Performance Benchmarks

- **WebSocket Throughput**: 700k+ messages/second
- **Latency**: <1ms for odds updates
- **Memory Efficiency**: <100MB baseline usage
- **CPU Optimization**: 80%+ reduction vs Node.js

## 🔒 Security Features

- **Authentication**: JWT-based auth with refresh tokens
- **Authorization**: Role-based access control
- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Comprehensive schema validation
- **Audit Logging**: Complete audit trail

## 📈 Monitoring & Observability

- **Metrics**: Prometheus-compatible metrics
- **Logging**: Structured logging with Winston
- **Health Checks**: Comprehensive health endpoints
- **Performance Monitoring**: Real-time performance data
- **Error Tracking**: Detailed error reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun run test:all`
5. Validate rules: `bun run rules:validate`
6. Submit a pull request

## 📚 Documentation

- **[Technical Docs](./docs/)**: In-depth technical documentation
- **[API Reference](./docs/api/)**: Complete API documentation
- **[Guides](./.root/guides/)**: Setup and migration guides
- **[Architecture](./docs/architecture/)**: System architecture documentation
- **[Archives](./.root/)**: Historical documentation, guides, and archives (read‑only)

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🏆 Acknowledgments

- Built with [Bun](https://bun.sh) for maximum performance
- WebSocket implementation powered by [uWebSockets.js](https://github.com/uNetworking/uWebSockets.js)
- Property testing with [fast-check](https://github.com/dubzzz/fast-check)
- Monitoring with [Prometheus](https://prometheus.io/)

---

**Odds Protocol Team** | [GitHub](https://github.com/odds-protocol) | [Discord](https://discord.gg/odds-protocol)
