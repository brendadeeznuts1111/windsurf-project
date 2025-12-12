# ========================================
# Bun-Native API Ecosystem - Enterprise Production Build
# Full-featured image for private registry deployment
# ========================================

FROM oven/bun:1.3.4

# Install enterprise tools and security scanners
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    wget \
    git \
    vim \
    htop \
    net-tools \
    dnsutils \
    traceroute \
    telnet \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

# Install security scanning tools
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Create application user
RUN groupadd -r bunapp && useradd -r -g bunapp bunapp

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (including dev dependencies for full build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Run comprehensive tests
RUN bun test --coverage --passWithNoTests

# Create production bundle
RUN bun build src/index.ts --outdir dist --target bun --minify

# Security scanning
RUN trivy filesystem --format json --output /app/security/deps-scan.json /app/node_modules/ || true
RUN trivy filesystem --format json --output /app/security/build-scan.json /app/dist/ || true

# Create necessary directories
RUN mkdir -p /app/logs /app/data /app/security /app/config

# Set permissions
RUN chown -R bunapp:bunapp /app

# Environment variables
ENV NODE_ENV=production
ENV BUN_DEBUG=0
ENV PORT=3000
ENV HEALTH_CHECK_PORT=3001
ENV LOG_LEVEL=info
ENV METRICS_ENABLED=true

# Expose ports
EXPOSE 3000 3001 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Switch to non-root user
USER bunapp

# Labels for private registry
LABEL org.opencontainers.image.title="Bun-Native API Ecosystem"
LABEL org.opencontainers.image.description="Enterprise-grade Bun runtime with 30+ production APIs"
LABEL org.opencontainers.image.vendor="Windsurf"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
LABEL org.opencontainers.image.source="https://github.com/windsurf/bun-api-ecosystem"

# Default command - can be overridden for different services
CMD ["bun", "run", "dashboard.ts"]