# Configuration Overview

This directory contains all configuration files for the Odds Protocol monorepo.

## 📁 Configuration Structure

```
config/
├── environment/         # Environment-specific configurations
│   ├── .env.example     # Environment variables template
│   ├── development.json # Development settings
│   ├── production.json  # Production settings
│   └── test.json        # Test environment settings
├── databases/          # Database configurations
├── services/           # Service-specific configurations
├── monitoring/         # Monitoring and logging configs
└── odds-protocol.yaml  # Main protocol configuration
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp config/environment/.env.example .env
```

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `API_PORT`: API server port (default: 3000)
- `WS_PORT`: WebSocket server port (default: 3001)

### Optional Variables

- `LOG_LEVEL`: Logging level (info, warn, error, debug)
- `METRICS_ENABLED`: Enable Prometheus metrics
- `RATE_LIMIT_ENABLED`: Enable rate limiting
- `BUN_OPTIONS`: Bun runtime options

## 📊 Service Configuration

Each service has its own configuration file in the `services/` directory:

- `api-gateway.json`: API gateway settings
- `websocket.json`: WebSocket server settings
- `stream-processor.json`: Stream processor settings
- `dashboard.json`: Dashboard settings

## 🗄️ Database Configuration

Database configurations are stored in `databases/`:

- `postgresql.json`: PostgreSQL settings
- `redis.json`: Redis settings
- `sqlite.json`: SQLite settings (for development)

## 📈 Monitoring Configuration

Monitoring and logging configurations in `monitoring/`:

- `prometheus.json`: Prometheus metrics configuration
- `winston.json`: Winston logging configuration
- `health-checks.json`: Health check endpoints

## 🏗️ Protocol Configuration

The main protocol configuration is in `odds-protocol.yaml`:

```yaml
protocol:
  name: "Odds Protocol"
  version: "1.0.0"
  
performance:
  max_throughput: 700000  # messages/second
  latency_target: 1       # milliseconds
  
security:
  jwt_expiry: 3600        # seconds
  rate_limit: 1000        # requests/minute
  
features:
  real_time_updates: true
  arbitrage_detection: true
  ml_predictions: true
```

## 🔒 Security Configuration

Security settings are configured per environment:

- **Development**: Relaxed security for debugging
- **Production**: Strict security settings
- **Test**: Mock security for testing

## 📝 Adding New Configuration

1. Create configuration file in appropriate subdirectory
2. Add validation schema in `schemas/`
3. Update environment examples
4. Document in service README

## 🚀 Configuration Loading

Configurations are loaded using the following priority:

1. Environment variables
2. Environment-specific JSON files
3. Default configuration files
4. Protocol-wide YAML configuration

## 📋 Validation

All configurations are validated against JSON schemas:

```bash
bun run config:validate
```

## 🔧 Configuration Templates

Use templates for consistent configuration:

```bash
# Generate new service config
bun run config:generate --service=my-service

# Validate existing config
bun run config:validate --service=my-service
```
