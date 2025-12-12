# Windsurf Production Deployment

## Docker Configuration

FROM oven/bun:1.3.4

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY examples/ ./examples/
COPY benchmarks/ ./benchmarks/

# Build for production
RUN bun run build

# Expose port (if running dashboard)
EXPOSE 3000

# Run the application
CMD ["bun", "run", "dashboard.ts"]