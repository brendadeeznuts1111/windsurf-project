/**
 * API Constants Usage Example
 * Demonstrates how to use the API constants for type-safe endpoint management
 */

import { API_BASE_PATH, API_BASE_URL, ENDPOINTS, buildFullUrl, isApiPath, stripApiBase } from '../src/constants/api';

// Example 1: Basic endpoint access
console.log('🚀 API Constants Usage Example');
console.log('=================================\n');

// Display API configuration
console.log('📋 API Configuration:');
console.log(`Base Path: ${API_BASE_PATH}`);
console.log(`Base URL: ${API_BASE_URL}`);
console.log();

// Display available endpoints
console.log('📍 Available Endpoints:');
Object.entries(ENDPOINTS).forEach(([category, endpoints]) => {
  console.log(`\n${category.toUpperCase()}:`);
  Object.entries(endpoints).forEach(([name, config]) => {
    console.log(`  ${name}: ${config.method} ${config.fullPath}`);
    console.log(`    ${config.description}`);
    if (config.auth !== undefined) {
      console.log(`    Auth: ${config.auth ? 'Required' : 'Not Required'}`);
    }
    if (config.rateLimit) {
      console.log(`    Rate Limit: ${config.rateLimit} req/min`);
    }
  });
});
console.log();

// Example 2: URL building
console.log('🔗 URL Building Examples:');
const statusUrl = buildFullUrl('monitor', 'status');
console.log(`Status URL: ${statusUrl}`);

const metricsUrl = buildFullUrl('monitor', 'metrics');
console.log(`Metrics URL: ${metricsUrl}`);

const adminUrl = buildFullUrl('admin', 'config');
console.log(`Admin Config URL: ${adminUrl}`);
console.log();

// Example 3: Path utilities
console.log('🛠️  Path Utilities:');
const testPaths = [
  '/api/v1/status',
  '/api/v1/metrics',
  '/api/v1/admin/config',
  '/health',
  '/static/app.js'
];

testPaths.forEach(path => {
  const isApi = isApiPath(path);
  const stripped = isApi ? stripApiBase(path) : 'N/A';
  console.log(`${path}:`);
  console.log(`  Is API path: ${isApi}`);
  console.log(`  Stripped path: ${stripped}`);
});
console.log();

// Example 4: Server-side usage simulation
console.log('🌐 Server-Side Usage Simulation:');
console.log('This demonstrates how the constants would be used in a Bun server:');
console.log();

console.log('```typescript');
// Simulate server routing logic
const simulateServerRouting = (pathname: string) => {
  if (!isApiPath(pathname)) {
    return 'Serve static file';
  }

  const internalPath = stripApiBase(pathname);

  switch (internalPath) {
    case ENDPOINTS.monitor.status.path:
      return `Handle status check (auth: ${ENDPOINTS.monitor.status.auth}, rate limit: ${ENDPOINTS.monitor.status.rateLimit})`;

    case ENDPOINTS.monitor.metrics.path:
      return `Handle metrics request (auth: ${ENDPOINTS.monitor.metrics.auth}, rate limit: ${ENDPOINTS.monitor.metrics.rateLimit})`;

    case ENDPOINTS.admin.config.path:
      return `Handle admin config (auth: ${ENDPOINTS.admin.config.auth}, rate limit: ${ENDPOINTS.admin.config.rateLimit})`;

    default:
      return 'Unknown API endpoint';
  }
};

console.log('Simulated routing:');
['/api/v1/status', '/api/v1/metrics', '/api/v1/admin/config', '/static/index.html'].forEach(path => {
  console.log(`  ${path} → ${simulateServerRouting(path)}`);
});
console.log('```');

console.log('\n✅ API Constants provide:');
console.log('• Type-safe endpoint definitions');
console.log('• Automatic URL construction');
console.log('• Path validation utilities');
console.log('• Server-side routing helpers');
console.log('• Client SDK generation support');
console.log('• Environment-aware configuration');