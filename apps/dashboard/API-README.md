# Bun Dashboard API

High-performance REST API server built with Bun's native URLPattern routing for the Industrial Arbitrage Factory dashboard.

## 🚀 Quick Start

```bash
# Start the API server
bun run api

# Or with custom port/host
PORT=8080 HOST=0.0.0.0 bun run api
```

## 📡 Endpoints

### Health & Monitoring
- `GET /api/health` - Server health check
- `GET /api/metrics` - Prometheus-style metrics

### Arbitrage Opportunities
- `GET /api/opportunities` - List all opportunities
- `POST /api/opportunities` - Create new opportunity
- `GET /api/opportunities/:id` - Get specific opportunity
- `PATCH /api/opportunities/:id` - Update opportunity

### Market Data
- `GET /api/market/:symbol` - Get market data for symbol

## 🔧 Configuration

Environment variables:
- `PORT` - Server port (default: 6969)
- `HOST` - Server host (default: localhost)

## 📊 Example Usage

```bash
# Health check
curl http://localhost:6969/api/health

# Get opportunities
curl http://localhost:6969/api/opportunities

# Create opportunity
curl -X POST http://localhost:6969/api/opportunities \
  -H "Content-Type: application/json" \
  -d '{"symbol": "ESZ4", "profit": 1500.50, "risk": 0.02}'

# Get market data
curl http://localhost:6969/api/market/ESZ4
```

## 🏗️ Architecture

- **URLPattern Routing**: Native Bun URLPattern for high-performance routing
- **SQLite Database**: In-memory database for demo (easily replaceable)
- **TypeScript**: Full type safety
- **CORS Support**: Cross-origin requests enabled
- **Error Handling**: Comprehensive error responses

## 🔄 Integration

The API server can run alongside the React dashboard:

```bash
# Terminal 1: Start API server
bun run api

# Terminal 2: Start dashboard
bun run dev
```

The dashboard can then fetch data from `http://localhost:6969/api/*` endpoints.