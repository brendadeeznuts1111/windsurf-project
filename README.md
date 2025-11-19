# Odds Protocol Monorepo

**Success = (Measurement × Algorithm × Memory × Network × Platform × Database × Testing × Monitoring × Architecture × Business × Culture × Innovation)ⁿ**

> Institutional-grade sports betting odds protocol with 700k msg/sec WebSocket throughput

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development environment
bun run dev

# Run tests
bun run test

# Build for production
bun run build:prod
```

## 📁 Project Structure

```
windsurf-project/
├── 📦 packages/           # Core packages and libraries
│   ├── odds-core/         # Core odds processing logic
│   ├── odds-websocket/    # High-performance WebSocket server
│   ├── odds-arbitrage/    # Arbitrage detection algorithms
│   ├── odds-ml/          # Machine learning models
│   └── odds-validation/  # Data validation schemas
├── 🚀 apps/              # Application entry points
│   ├── api-gateway/      # API gateway service
│   ├── dashboard/        # Web dashboard
│   └── stream-processor/ # Real-time stream processor
├── 🧪 tests/             # Test configurations and utilities
├── 📝 docs/              # Technical documentation
├── ⚙️ scripts/           # Build and automation scripts
├── 🔧 config/            # Configuration files
├── 📊 reports/           # Test and performance reports
├── 🏗️ mcp-server/        # Model Context Protocol server
├── 🎯 property-tests/    # Property-based testing
├── 📚 Odds-mono-map/     # Knowledge management vault
└── 🗂️ .root/             # Historical docs, guides, archives
    ├── docs/             # Historical documentation
    ├── guides/           # Migration and setup guides
    ├── archives/         # Archived summaries and reports
    ├── references/       # Reference materials
    └── templates/        # Project templates
```

## Updated Top‑Level Directory Layout

- `docs/` – primary technical documentation.
- `reports/` – test results, performance benchmarks, and other reports.
- `.root/` – archived documentation, guides, and historical files (kept for reference only).

These directories are now reflected in the tree above.


## 🎯 Core Features

- **🔥 Ultra-High Performance**: 700k+ messages/second WebSocket throughput
- **🧠 Machine Learning**: Advanced odds prediction and arbitrage detection
- **⚡ Real-Time Processing**: Sub-millisecond latency for odds updates
- **🔒 Enterprise Security**: Institutional-grade security and compliance
- **📊 Advanced Analytics**: Comprehensive monitoring and reporting
- **🔧 Developer Tools**: Extensive CLI and automation capabilities

## 🛠️ Technology Stack

- **Runtime**: Bun 1.3.0+ with native performance optimizations
- **Language**: TypeScript 5.4+ with strict type checking
- **WebSocket**: uWebSockets.js for maximum throughput
- **Database**: PostgreSQL, Redis, SQLite support
- **Testing**: Vitest with property-based testing (fast-check)
- **Monitoring**: Prometheus, Winston, custom dashboards
- **CI/CD**: GitHub Actions with comprehensive validation

## 📋 Available Scripts

### Development
```bash
bun run dev              # Start all services in development
bun run dev:all          # Run all packages in parallel
bun run dev:optimized    # Optimized development mode
```

### Testing
```bash
bun run test             # Run all tests
bun run test:unit        # Unit tests only
bun run test:integration # Integration tests only
bun run test:performance # Performance benchmarks
bun run test:property    # Property-based tests
```

### Building & Deployment
```bash
bun run build            # Build for development
bun run build:prod       # Build for production
bun run deploy           # Deploy to staging
bun run deploy:prod      # Deploy to production
```

### Vault Management
```bash
bun run vault:organize   # Organize knowledge vault
bun run vault:validate   # Validate vault standards
bun run vault:monitor    # Monitor vault health
bun run vault:status     # Show vault status
```

### Code Quality
```bash
bun run lint             # Lint all code
bun run typecheck        # Type checking
bun run rules:validate   # Validate golden rules
bun run security:audit   # Security audit
```

## 🏗️ Architecture

### Core Components

1. **Odds Core** (`packages/odds-core`)
   - Core odds calculation engine
   - Data models and interfaces
   - Validation schemas

2. **WebSocket Server** (`packages/odds-websocket`)
   - High-performance WebSocket implementation
   - Real-time data streaming
   - Connection management

3. **Arbitrage Engine** (`packages/odds-arbitrage`)
   - Arbitrage opportunity detection
   - Risk calculation algorithms
   - Market analysis

4. **ML Pipeline** (`packages/odds-ml`)
   - Predictive models
   - Pattern recognition
   - Performance optimization

### Applications

1. **API Gateway** (`apps/api-gateway`)
   - RESTful API endpoints
   - Authentication and authorization
   - Rate limiting and monitoring

2. **Dashboard** (`apps/dashboard`)
   - Real-time monitoring interface
   - Analytics and reporting
   - User management

3. **Stream Processor** (`apps/stream-processor`)
   - Real-time data processing
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
