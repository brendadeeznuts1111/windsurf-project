# Windsurf REST API Server

Enterprise-grade REST API server built with Bun-native APIs, featuring URLPattern routing, SQLite persistence, and comprehensive endpoint coverage.

## Features

- 🚀 **Bun-native**: Built entirely with Bun runtime APIs
- 🗄️ **SQLite Database**: Fast, embedded database with full SQL support
- 🛣️ **URLPattern Routing**: Modern, performant routing with pattern matching
- 🔐 **Session Management**: Encrypted session handling with Redis-like storage
- 🍪 **Advanced Cookies**: Signed and encrypted cookies with security features
- 📊 **Metrics Collection**: Real-time system monitoring and analytics
- 🏥 **Health Monitoring**: Tension scoring engine for system health assessment
- 🗜️ **Compression**: Automatic content compression for responses
- 🆔 **UUID Generation**: Time-sortable v7 UUIDs for identifiers
- 🔄 **CORS Support**: Cross-origin resource sharing enabled
- 📈 **Analytics**: Comprehensive API usage analytics

## Quick Start

```bash
# Install dependencies
bun install

# Start the server
bun run start

# Development mode with hot reload
bun run dev
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Health Check
```http
GET /api/health
```

Returns system health status and service availability.

### Users Management
```http
GET    /api/users              # List users (paginated)
POST   /api/users              # Create new user
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user
```

### Posts Management
```http
GET    /api/posts              # List posts (paginated)
POST   /api/posts              # Create new post
GET    /api/posts/:id          # Get post by ID (TODO)
PUT    /api/posts/:id          # Update post (TODO)
DELETE /api/posts/:id          # Delete post (TODO)
GET    /api/users/:userId/posts # Get posts by user (TODO)
```

### Analytics & Monitoring
```http
GET /api/analytics             # System analytics
GET /api/metrics               # Real-time metrics
```

## Request/Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "request_id": "uuid-v7-identifier"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "request_id": "uuid-v7-identifier"
}
```

## Data Models

### User
```typescript
{
  id: string;          // UUID v7
  email: string;       // Unique email address
  name: string;        // Display name
  created_at: string;  // ISO 8601 timestamp
  updated_at: string;  // ISO 8601 timestamp
}
```

### Post
```typescript
{
  id: string;          // UUID v7
  title: string;       // Post title
  content: string;     // Post content
  author_id: string;   // Reference to User.id
  created_at: string;  // ISO 8601 timestamp
  updated_at: string;  // ISO 8601 timestamp
}
```

## Example Usage

### Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe"
  }'
```

### Get Users
```bash
curl http://localhost:3000/api/users?page=1&limit=10
```

### Create a Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my post",
    "author_id": "user-uuid-here"
  }'
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Configuration

The server uses the following environment variables:

- `PORT`: Server port (default: 3000)

## Database

The server uses SQLite with the following schema:

- `users`: User accounts
- `posts`: User posts
- `sessions`: Session data

Database file: `api-server.db`

## Built with Windsurf APIs

This server demonstrates the following Windsurf APIs:

- **Bun.serve**: HTTP server with URLPattern routing
- **Bun SQLite**: Database operations
- **Bun UUID**: Identifier generation
- **Bun Compression**: Response compression
- **Bun Cookies**: Cookie management
- **Bun Session**: Session handling
- **Metrics Collector**: System monitoring
- **Tension Engine**: Health scoring

## Development

```bash
# Run tests
bun test

# Type checking
bun run typecheck

# Linting
bun run lint

# Build for production
bun run build
```

## License

MIT