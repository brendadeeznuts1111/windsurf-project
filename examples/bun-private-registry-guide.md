# Bun Private Registry Guide - Scoped Packages & Authentication

> Complete guide for working with private scoped registries, authentication, and package management in Bun

## Overview

Bun supports private npm registries and scoped packages, allowing you to publish and consume private packages securely. This guide covers authentication, configuration, and CLI operations for private registries.

## Registry Configuration

### Basic .npmrc Setup

```bash
# .npmrc in your project root
@your-scope:registry=https://registry.yourcompany.com/
//registry.yourcompany.com/:_authToken=your-auth-token-here
```

### Environment Variables

```bash
# Set via environment variables
export NPM_CONFIG_REGISTRY=https://registry.yourcompany.com/
export NPM_CONFIG__AUTH_TOKEN=your-auth-token-here
```

### Bun-specific Configuration

```toml
# bunfig.toml
[install]
# Default registry
registry = "https://registry.npmjs.org/"

[install.scopes]
# Scoped registry configuration
"yourcompany" = "https://registry.yourcompany.com/"

[install.scopes."yourcompany"]
token = "your-auth-token-here"
```

## Authentication Methods

### Token-based Authentication

```bash
# Login to get token
npm login --registry https://registry.yourcompany.com/

# Or set token directly
bun config set @yourcompany:registry https://registry.yourcompany.com/
bun config set //registry.yourcompany.com/:_authToken your-token-here
```

### OAuth-based Authentication

```bash
# For registries using OAuth
bun config set //registry.yourcompany.com/:_authToken oauth-token-here
```

### SSH Key Authentication

```bash
# For Git-based registries
bun config set //registry.yourcompany.com/:_authToken git-ssh-token-here
```

## CLI Operations

### Installing from Private Registry

```bash
# Install scoped package
bun add @yourcompany/api-client

# Install specific version
bun add @yourcompany/api-client@1.2.3

# Install with peer dependencies
bun add @yourcompany/react-components --dev

# Force latest version
bun add @yourcompany/utils@latest
```

### Publishing to Private Registry

```bash
# Login first
bun config set @yourcompany:registry https://registry.yourcompany.com/
bun config set //registry.yourcompany.com/:_authToken your-token

# Publish package
cd your-package/
bun publish

# Publish with specific tag
bun publish --tag beta

# Dry run
bun publish --dry-run
```

### Registry Information

```bash
# Check current registry configuration
bun config get registry
bun config get @yourcompany:registry

# List all configured registries
bun config list | grep registry

# Test registry connectivity
curl -H "Authorization: Bearer your-token" https://registry.yourcompany.com/-/ping
```

## Downloading & Caching

### Manual Package Download

```bash
# Download specific package version
curl -H "Authorization: Bearer your-token" \
  -o package.tgz \
  https://registry.yourcompany.com/@yourcompany/api-client/-/api-client-1.2.3.tgz

# Download package metadata
curl -H "Authorization: Bearer your-token" \
  https://registry.yourcompany.com/@yourcompany/api-client
```

### Bulk Download Scripts

```bash
#!/bin/bash
# bulk-download.sh - Download multiple packages

PACKAGES=(
  "@yourcompany/api-client@1.2.3"
  "@yourcompany/utils@2.1.0"
  "@yourcompany/ui-components@3.0.1"
)

REGISTRY="https://registry.yourcompany.com/"
TOKEN="your-auth-token"

for package in "${PACKAGES[@]}"; do
  echo "Downloading $package..."
  curl -H "Authorization: Bearer $TOKEN" \
    -o "${package}.tgz" \
    "$REGISTRY$package/-/$package.tgz"
done
```

### Cache Management

```bash
# Clear Bun's package cache
bun pm cache rm

# Clear npm cache (if using npm registry)
npm cache clean --force

# Check cache location
bun pm cache

# Reinstall with fresh cache
bun install --clear-cache
```

## Onboarding Guide

### Step 1: Initial Setup

```bash
# 1. Create project directory
mkdir my-private-app && cd my-private-app

# 2. Initialize with Bun
bun init -y

# 3. Configure private registry
echo "@yourcompany:registry=https://registry.yourcompany.com/" >> .npmrc
echo "//registry.yourcompany.com/:_authToken=\${PRIVATE_REGISTRY_TOKEN}" >> .npmrc
```

### Step 2: Environment Setup

```bash
# Set environment variable
export PRIVATE_REGISTRY_TOKEN="your-actual-token-here"

# Or create .env file
echo "PRIVATE_REGISTRY_TOKEN=your-actual-token-here" > .env
```

### Step 3: Install Private Packages

```bash
# Install your company's packages
bun add @yourcompany/api-client @yourcompany/utils

# Install additional dependencies
bun add react @types/react

# Check installation
bun pm ls
```

### Step 4: Development Workflow

```bash
# Start development server
bun run dev

# Run tests
bun test

# Build for production
bun run build

# Publish new version (if you have permissions)
bun publish
```

### Step 5: CI/CD Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Configure Private Registry
        run: |
          echo "@yourcompany:registry=https://registry.yourcompany.com/" >> .npmrc
          echo "//registry.yourcompany.com/:_authToken=${{ secrets.PRIVATE_REGISTRY_TOKEN }}" >> .npmrc

      - name: Install Dependencies
        run: bun install --frozen-lockfile

      - name: Run Tests
        run: bun test

      - name: Build
        run: bun run build
```

## Troubleshooting

### Authentication Issues

```bash
# Check if token is set
bun config get //registry.yourcompany.com/:_authToken

# Test authentication
curl -H "Authorization: Bearer your-token" https://registry.yourcompany.com/-/whoami

# Re-login if needed
bun config delete //registry.yourcompany.com/:_authToken
bun config set //registry.yourcompany.com/:_authToken new-token
```

### Network Issues

```bash
# Test registry connectivity
ping registry.yourcompany.com

# Check DNS resolution
nslookup registry.yourcompany.com

# Test with verbose output
bun install --verbose @yourcompany/package
```

### Permission Issues

```bash
# Check package permissions
curl -H "Authorization: Bearer your-token" \
  https://registry.yourcompany.com/-/package/@yourcompany/package/access

# Request access from registry admin
echo "Please grant access to @yourcompany/package"
```

### Cache Issues

```bash
# Clear all caches
bun pm cache rm
npm cache clean --force

# Force reinstall
rm -rf node_modules bun.lockb
bun install
```

## Advanced Configuration

### Multiple Registries

```toml
# bunfig.toml - Multiple scoped registries
[install.scopes]
"yourcompany" = "https://registry.yourcompany.com/"
"partner" = "https://partner-registry.com/"

[install.scopes."yourcompany"]
token = "company-token"

[install.scopes."partner"]
token = "partner-token"
username = "your-username"
```

### Conditional Configuration

```bash
# .npmrc with environment-specific config
@yourcompany:registry=https://registry.yourcompany.com/
//registry.yourcompany.com/:_authToken=${PRIVATE_REGISTRY_TOKEN:-fallback-token}
```

### Proxy Configuration

```bash
# Behind corporate proxy
bun config set proxy http://proxy.company.com:8080
bun config set https-proxy http://proxy.company.com:8080
bun config set no-proxy localhost,127.0.0.1,.company.com
```

## Security Best Practices

### Token Management

```bash
# Use read-only tokens when possible
bun config set //registry.yourcompany.com/:_authToken read-only-token

# Rotate tokens regularly
# Never commit tokens to version control
echo ".npmrc" >> .gitignore
```

### Environment Separation

```bash
# Different tokens for different environments
export DEV_REGISTRY_TOKEN="dev-token"
export PROD_REGISTRY_TOKEN="prod-token"

# Use appropriate token based on environment
if [ "$NODE_ENV" = "production" ]; then
  export PRIVATE_REGISTRY_TOKEN="$PROD_REGISTRY_TOKEN"
else
  export PRIVATE_REGISTRY_TOKEN="$DEV_REGISTRY_TOKEN"
fi
```

### Audit & Compliance

```bash
# Audit installed packages
bun pm audit

# Check for vulnerabilities
bun pm audit --audit-level high

# List all installed packages with sources
bun pm ls --all
```

## Related Documentation

For implementing role-based access control to secure your private packages and applications, see the [Bun RBAC (Role-Based Access Control) Guide](../bun-rbac-guide.md).

This guide provides everything you need to work effectively with private scoped registries in Bun, from initial setup to advanced configuration and troubleshooting.