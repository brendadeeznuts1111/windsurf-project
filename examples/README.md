# Bun Examples - Enhanced Organization & Cross-References

This directory contains **12 comprehensive Bun examples** with enhanced organization, cross-references, and performance benchmarks. All examples are interconnected through a sophisticated cross-reference system that helps developers discover related functionality and learning paths.

## 📁 Directory Structure

```
examples/
├── core/                    # Core Bun APIs (4 examples)
│   ├── file-system/        # File operations, MIME types, streaming
│   │   ├── bun-file-mime-advanced-demo.test.ts
│   │   ├── bun-file-mime-demo.test.ts
│   │   ├── bun-file-streaming.ts
│   │   └── bun-file-upload-api.ts
│   ├── networking/         # HTTP, WebSocket, security
│   │   ├── bun-api-validation.ts
│   │   ├── bun-cors-middleware.ts
│   │   ├── bun-http-session.ts
│   │   ├── bun-rate-limiting.ts
│   │   └── bun-tls-server.ts
│   └── runtime/            # Environment, modules, globals
├── integrations/           # External service integrations
│   ├── databases/          # SQLite, PostgreSQL, Redis
│   ├── apis/              # REST, GraphQL, WebSocket APIs
│   └── frameworks/         # React, Svelte, Express-like
├── patterns/               # Architectural patterns
│   ├── testing/           # Unit, integration, e2e testing
│   ├── performance/       # Benchmarks, optimization
│   ├── security/          # Auth, encryption, validation
│   └── deployment/        # Docker, CI/CD, monitoring
├── applications/           # Complete app examples (2 examples)
│   ├── apis/              # REST APIs, GraphQL servers
│   │   └── bun-rest-crud-api.ts
│   ├── realtime/          # Chat, gaming, live data
│   │   └── bun-websocket-chat-api.ts
│   ├── dashboards/        # Admin panels, analytics
│   └── cli-tools/         # Command-line applications
├── cross-references/       # Cross-reference system
│   ├── system.ts          # Core cross-reference logic
│   └── registry.ts        # Example and benchmark registry
└── [utility files]        # Index, tests, documentation
```

## 🔗 Cross-Reference System

Each example includes comprehensive metadata linking it to **53 total cross-references** across related examples, benchmarks, guides, and tests. The system enables intelligent discovery and learning path navigation.

### Example Metadata Structure
```typescript
/**
 * @example-metadata
 * @category applications/apis
 * @difficulty intermediate
 * @prerequisites bun-serve-advanced.ts, bun-file-mime-demo.test.ts
 * @related-examples
 *   - bun-http-session.ts (authentication patterns)
 *   - bun-rate-limiting.ts (traffic control)
 *   - bun-cors-middleware.ts (security)
 * @guides bun-http-api-guide.md, bun-rest-api-best-practices.md
 * @tests bun-rest-api-testing.test.ts
 * @benchmarks bun-api-benchmark.test.ts, bun-rest-performance.bench.ts
 * @tags http, server, api, middleware, rest, crud
 * @description Complete REST API with CRUD operations, authentication, and middleware
 */
```

### Cross-Reference CLI Tools
```bash
# Find related examples for a specific file
bun run cross-references/registry.ts related examples/applications/apis/bun-rest-crud-api.ts

# Find examples by tags (http, api, websocket, etc.)
bun run cross-references/registry.ts tags http api

# Show learning path for a topic
bun run cross-references/registry.ts path authentication

# Show benchmarks for an example
bun run cross-references/registry.ts benchmarks examples/applications/apis/bun-rest-crud-api.ts

# Show system statistics (12 examples, 53 cross-references)
bun run cross-references/registry.ts stats
```

### Cross-Reference Categories
- **Prerequisites**: 12 prerequisite relationships (what you need to know first)
- **Related Examples**: 24 related example connections (similar functionality)
- **Benchmarks**: 8 benchmark linkages (performance testing)
- **Guides**: 6 documentation connections (learning materials)
- **Tests**: 3 testing relationships (quality assurance)

## 🚀 Featured Examples

### 🏗️ Complete REST API with Authentication
**File:** `examples/applications/apis/bun-rest-crud-api.ts`
- **Features:** Full CRUD operations, JWT authentication, middleware stack, SQLite database
- **Cross-References:** 8 related examples (sessions, rate limiting, CORS, validation, file uploads)
- **Benchmarks:** Performance testing with automated load analysis
- **Demo:** Functional REST API server with 8 endpoints

```bash
bun run examples/applications/apis/bun-rest-crud-api.ts  # Port 3001
```

### 💬 Real-Time WebSocket Chat API
**File:** `examples/applications/realtime/bun-websocket-chat-api.ts`
- **Features:** Multi-room chat, user authentication, message history, private messaging
- **Cross-References:** HTTP servers, session management, rate limiting
- **Demo:** Live chat server with room management and user tracking

```bash
bun run examples/applications/realtime/bun-websocket-chat-api.ts  # Port 3007
```

### 🔐 HTTP Session Management
**File:** `examples/core/networking/bun-http-session.ts`
- **Features:** Secure session storage, automatic cleanup, configurable cookies
- **Cross-References:** REST API, rate limiting, CORS middleware
- **Demo:** Session-based authentication with cookie management

```bash
bun run examples/core/networking/bun-http-session.ts  # Port 3002
```

### 🛡️ Rate Limiting Middleware
**File:** `examples/core/networking/bun-rate-limiting.ts`
- **Features:** Multiple algorithms, IP/user-based limiting, custom handlers
- **Cross-References:** All API examples, session management
- **Demo:** Rate-limited endpoints with configurable strategies

```bash
bun run examples/core/networking/bun-rate-limiting.ts  # Port 3003
```

### 🌐 CORS Middleware
**File:** `examples/core/networking/bun-cors-middleware.ts`
- **Features:** Preflight handling, dynamic origins, security headers
- **Cross-References:** REST API, WebSocket chat, session management
- **Demo:** CORS testing with different origin configurations

```bash
bun run examples/core/networking/bun-cors-middleware.ts  # Port 3004
```

### ✅ API Input Validation
**File:** `examples/core/networking/bun-api-validation.ts`
- **Features:** Schema-based validation, sanitization, custom rules
- **Cross-References:** REST API, file upload, rate limiting
- **Demo:** Validated API endpoints with comprehensive error reporting

```bash
bun run examples/core/networking/bun-api-validation.ts  # Port 3006
```

### 📁 File Upload API
**File:** `examples/core/file-system/bun-file-upload-api.ts`
- **Features:** Multipart parsing, validation, streaming uploads
- **Cross-References:** MIME detection, file streaming, API validation
- **Demo:** File upload server with security and progress tracking

```bash
bun run examples/core/file-system/bun-file-upload-api.ts  # Port 3005
```

### 🔍 Advanced MIME Detection
**File:** `examples/core/file-system/bun-file-mime-advanced-demo.test.ts`
- **Features:** Multi-method detection, content analysis, metadata extraction
- **Cross-References:** File upload, streaming, security validation
- **Demo:** Comprehensive file analysis with security scanning

```bash
bun run examples/core/file-system/bun-file-mime-advanced-demo.test.ts
```

### 🌊 File Streaming Utilities
**File:** `examples/core/file-system/bun-file-streaming.ts`
- **Features:** Memory-efficient streaming, resumable transfers, progress tracking
- **Cross-References:** File upload, MIME detection, performance monitoring
- **Demo:** Advanced streaming operations with transformation pipelines

```bash
bun run examples/core/file-system/bun-file-streaming.ts  # Port 3008
```

### 🔒 TLS/HTTPS Server
**File:** `examples/core/networking/bun-tls-server.ts`
- **Features:** Auto-certificates, HSTS, security headers, HTTPS simulation
- **Cross-References:** HTTP session, CORS, API validation
- **Demo:** Secure server with comprehensive security features

```bash
bun run examples/core/networking/bun-tls-server.ts  # Port 3443
```

### 📊 Enhanced MIME Metrics (Original)
**File:** `examples/enhanced-mime-metrics-demo.ts`
- **Features:** MIME type detection, byte tracking, performance analytics
- **Cross-References:** File system examples, performance benchmarks

## 📊 Benchmark Integration

## 📊 Performance & Benchmarks

The benchmark system provides **performance baselines and regression detection** for all major examples. Currently **1 comprehensive benchmark** is implemented with plans for expansion to cover all 12 examples.

### REST API Performance Benchmark
**File:** `benchmarks/bun-rest-performance.bench.ts`
- **Metrics:** Response time, throughput, error rate, memory usage
- **Baselines:** <10ms response time, >1000 req/sec throughput
- **Linked Examples:** `bun-rest-crud-api.ts`
- **Features:** Automated load testing, performance regression detection

```bash
# Run REST API performance benchmark
bun run benchmarks/bun-rest-performance.bench.ts

# Run all benchmarks
bun run benchmarks/run-benchmarks.ts

# Check for performance regressions
bun run benchmarks/regression-detection.ts
```

### Benchmark Categories (Planned Expansion)
- **API Performance**: REST, WebSocket, GraphQL endpoints
- **File Operations**: Upload, streaming, MIME detection speed
- **Security**: TLS handshake, validation, encryption performance
- **Memory Usage**: Heap usage, garbage collection efficiency
- **Network**: Connection handling, throughput, latency

### Current Benchmark Coverage
- ✅ **REST API Performance**: Complete load testing suite
- 🔄 **WebSocket Performance**: Planned for chat API
- 🔄 **File Upload Performance**: Planned for upload API
- 🔄 **MIME Detection Performance**: Planned for advanced MIME example

## 🧪 Testing & Quality Assurance

### Comprehensive Test Suite
```bash
# Run all example tests
bun run examples/test-examples-comprehensive.ts

# Test specific categories
bun test examples/core/
bun test examples/applications/
```

### Cross-Reference Validation
```bash
# Validate all cross-references
bun run cross-references/registry.ts stats
```

## 📚 Learning Paths

### Beginner to Advanced API Development
1. **Beginner:** `bun-serve-advanced.ts` - Basic HTTP server
2. **Intermediate:** `bun-rest-crud-api.ts` - Complete REST API
3. **Advanced:** GraphQL server (planned) - Schema-based APIs

### Performance Optimization Path
1. **Basics:** MIME type handling and file operations
2. **Intermediate:** API performance benchmarking
3. **Advanced:** Memory optimization and scaling patterns

## 🔧 Development Workflow

### Adding New Examples
1. Choose appropriate category directory
2. Add cross-reference metadata at the top
3. Register in `cross-references/registry.ts`
4. Create corresponding benchmarks if applicable
5. Update this README

### Cross-Reference Maintenance
- Run validation regularly: `bun run cross-references/registry.ts stats`
- Update references when files are moved or renamed
- Add new relationships as examples evolve

## 📈 Current Status

- ✅ **12 examples** with full cross-references implemented
- ✅ **1 benchmark** with performance baselines and regression detection
- ✅ **Cross-reference system** with validation and CLI tools
- ✅ **New directory structure** established with logical categorization
- 🔄 **53 total cross-references** linking examples and benchmarks
- ✅ **9 missing examples** created and integrated (100% completion)

### Complete Example Ecosystem

#### **🏗️ Application Examples (2)**
- **REST CRUD API**: Full-stack REST API with authentication, middleware, and database
- **WebSocket Chat API**: Real-time chat with rooms, authentication, and message history

#### **🔧 Core Networking Examples (5)**
- **HTTP Session Management**: Secure session storage with automatic cleanup
- **Rate Limiting Middleware**: Multiple algorithms with configurable strategies
- **CORS Middleware**: Comprehensive CORS handling with security features
- **API Input Validation**: Schema-based validation with sanitization
- **TLS/HTTPS Server**: Secure server with automatic certificates and HSTS

#### **📁 Core File System Examples (4)**
- **File Upload API**: Multipart handling with validation and streaming
- **Advanced MIME Detection**: Multi-method detection with content analysis
- **File Streaming Utilities**: Memory-efficient streaming with progress tracking
- **Basic MIME Demo**: Original MIME type handling example

#### **🔗 Cross-Reference System**
- **Registry**: 12 examples with comprehensive metadata
- **Validation**: Automated integrity checking (3 remaining references to non-existent examples)
- **CLI Tools**: Exploration and discovery interface
- **Learning Paths**: Difficulty-based progression guides
- Parallel streaming and transformation pipelines

## 🎯 Next Steps

1. ✅ **Create Missing Examples** - 9 examples created, cross-reference gaps filled
2. **Add More Benchmarks** - Performance tests for all major examples
3. **Build Documentation** - Guides and tutorials for learning paths
4. **Implement CI/CD** - Automated testing and benchmark regression detection
5. **Resolve Remaining References** - 3 references to non-existent websocket examples
6. **Expand Registry** - Add more examples and create comprehensive learning paths

## 🤝 Contributing

When adding new examples:
- Include comprehensive cross-reference metadata
- Create corresponding benchmarks for performance-critical code
- Update the registry and this README
- Follow the established directory structure and naming conventions

---

*This enhanced examples system provides a comprehensive, interconnected learning and reference experience for Bun development.*

---

## 📖 Related Documentation

- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Complete ecosystem integration overview
- **[ENHANCED_EXAMPLES_CATALOG.md](./ENHANCED_EXAMPLES_CATALOG.md)** - Component library catalog
- **[ENHANCED_EXAMPLES_CATALOG_v2.md](./ENHANCED_EXAMPLES_CATALOG_v2.md)** - Updated catalog with learning paths
- **[complete-integration-example.ts](./complete-integration-example.ts)** - Full system demonstration