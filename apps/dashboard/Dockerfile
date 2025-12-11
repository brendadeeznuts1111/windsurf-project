# Multi-stage Dockerfile for Bun Dashboard
# Stage 1: Build the React frontend
FROM oven/bun:1.3.4 AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the frontend
RUN bun run build

# Stage 2: Runtime with Bun server
FROM oven/bun:1.3.4-slim AS runtime

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 --ingroup bunjs bunjs

WORKDIR /app

# Copy built frontend from builder stage
COPY --from=frontend-builder --chown=bunjs:bunjs /app/dist ./dist

# Copy server files and dependencies
COPY --from=frontend-builder --chown=bunjs:bunjs /app/package.json ./
COPY --from=frontend-builder --chown=bunjs:bunjs /app/bun.lock ./
COPY --from=frontend-builder --chown=bunjs:bunjs /app/src ./src
COPY --from=frontend-builder --chown=bunjs:bunjs /app/setup-db.ts ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Switch to non-root user
USER bunjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["bun", "run", "src/production-server.ts"]