#!/usr/bin/env bun

/**
 * @fileoverview Unified API Hub - api.example.com
 * @description [PATTERN20] ⊗ [PATTERN1] ∞⃰ [PATTERN19] ≻ Complete API Ecosystem Gateway
 * @version Ω.∞.φ.∞.7
 * @since The Unified API Hub
 *
 * A comprehensive API gateway that unifies all dashboards and APIs into a single
 * entry point at local api.example.com, providing discovery, routing, and orchestration
 * for the entire Bun ecosystem.
 */

import { serve, Server } from "bun";

// ===== UNIFIED API HUB CONFIGURATION =====

const HUB_CONFIG = {
  port: 8080,
  hostname: "0.0.0.0",
  domain: "api.example.com",
  services: {
    // Main dashboards
    mainDashboard: { port: 3000, path: "/dashboard", name: "Main Dashboard" },
    reactDashboard: { port: 6969, path: "/react-dashboard", name: "React Dashboard" },
    monitoringDashboard: { port: 5173, path: "/monitoring", name: "Monitoring Dashboard" },

    // API servers
    selfOptimizingServer: { port: 8443, path: "/conscious", name: "Self-Optimizing Server" },
    completeIntegration: { port: 8444, path: "/integration", name: "Complete Integration" },

    // WebSocket servers
    websocketServer: { port: 8080, path: "/ws", name: "WebSocket Server" },

    // MCP servers
    mcpServer: { port: 3001, path: "/mcp", name: "MCP Server" },

    // Legacy servers
    apiDashboard: { port: 3000, path: "/api-dashboard", name: "API Dashboard" }
  },
  healthCheckInterval: 30000, // 30 seconds
  corsEnabled: true,
  rateLimiting: {
    enabled: true,
    requestsPerMinute: 1000,
    burstLimit: 100
  }
};

// ===== SERVICE DISCOVERY & HEALTH MONITORING =====

class ServiceRegistry {
  private services = new Map<string, ServiceInfo>();
  private healthStatus = new Map<string, HealthStatus>();

  constructor() {
    this.initializeServices();
    this.startHealthMonitoring();
  }

  private initializeServices() {
    Object.entries(HUB_CONFIG.services).forEach(([key, config]) => {
      this.services.set(key, {
        id: key,
        name: config.name,
        internalPort: config.port,
        externalPath: config.path,
        url: `http://localhost:${config.port}`,
        status: 'unknown',
        lastHealthCheck: 0,
        responseTime: 0
      });
    });
  }

  private async startHealthMonitoring() {
    setInterval(async () => {
      for (const [key, service] of this.services) {
        await this.checkServiceHealth(key, service);
      }
    }, HUB_CONFIG.healthCheckInterval);
  }

  private async checkServiceHealth(serviceKey: string, service: ServiceInfo): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${service.url}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      const responseTime = Date.now() - startTime;

      const isHealthy = response.ok;
      this.healthStatus.set(serviceKey, {
        healthy: isHealthy,
        statusCode: response.status,
        responseTime,
        lastCheck: Date.now(),
        message: isHealthy ? 'OK' : `HTTP ${response.status}`
      });

      // Update service status
      service.status = isHealthy ? 'healthy' : 'unhealthy';
      service.lastHealthCheck = Date.now();
      service.responseTime = responseTime;

    } catch (error) {
      this.healthStatus.set(serviceKey, {
        healthy: false,
        statusCode: 0,
        responseTime: 0,
        lastCheck: Date.now(),
        message: error.message
      });

      service.status = 'unreachable';
      service.lastHealthCheck = Date.now();
    }
  }

  getServiceInfo(serviceKey: string): ServiceInfo | undefined {
    return this.services.get(serviceKey);
  }

  getAllServices(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  getHealthStatus(): Record<string, HealthStatus> {
    const health: Record<string, HealthStatus> = {};
    for (const [key, status] of this.healthStatus) {
      health[key] = status;
    }
    return health;
  }

  async proxyRequest(serviceKey: string, request: Request): Promise<Response> {
    const service = this.services.get(serviceKey);
    if (!service) {
      return new Response('Service not found', { status: 404 });
    }

    try {
      // Construct the target URL
      const url = new URL(request.url);
      const targetUrl = `${service.url}${url.pathname}${url.search}`;

      // Create proxy request
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });

      // Forward the request
      const response = await fetch(proxyRequest);

      // Return proxied response
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

    } catch (error) {
      return new Response(`Service ${service.name} unavailable: ${error.message}`, {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
}

// ===== RATE LIMITING =====

class RateLimiter {
  private requests = new Map<string, RequestRecord[]>();

  isAllowed(clientId: string): boolean {
    if (!HUB_CONFIG.rateLimiting.enabled) return true;

    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get or create request history for this client
    let clientRequests = this.requests.get(clientId) || [];

    // Remove old requests outside the window
    clientRequests = clientRequests.filter(req => req.timestamp > windowStart);

    // Check if under limit
    if (clientRequests.length >= HUB_CONFIG.rateLimiting.requestsPerMinute) {
      return false;
    }

    // Add current request
    clientRequests.push({ timestamp: now });
    this.requests.set(clientId, clientRequests);

    return true;
  }

  getRemainingRequests(clientId: string): number {
    if (!HUB_CONFIG.rateLimiting.enabled) return Infinity;

    const clientRequests = this.requests.get(clientId) || [];
    const now = Date.now();
    const windowStart = now - 60000;
    const recentRequests = clientRequests.filter(req => req.timestamp > windowStart);

    return Math.max(0, HUB_CONFIG.rateLimiting.requestsPerMinute - recentRequests.length);
  }
}

// ===== UNIFIED API HUB SERVER =====

class UnifiedAPIHub {
  private server: Server | null = null;
  private serviceRegistry: ServiceRegistry;
  private rateLimiter: RateLimiter;

  constructor() {
    this.serviceRegistry = new ServiceRegistry();
    this.rateLimiter = new RateLimiter();
  }

  async start(): Promise<void> {
    console.log('🚀 [API HUB] Starting Unified API Hub...');
    console.log(`🌐 Domain: ${HUB_CONFIG.domain}`);
    console.log(`📡 Server: http://${HUB_CONFIG.hostname}:${HUB_CONFIG.port}`);
    console.log('');

    this.server = serve({
      port: HUB_CONFIG.port,
      hostname: HUB_CONFIG.hostname,

      fetch: (request: Request): Promise<Response> => {
        return this.handleRequest(request);
      }
    });

    console.log('✅ [API HUB] Unified API Hub started successfully');
    console.log('📋 Available endpoints:');
    console.log('  • /                           - Hub dashboard');
    console.log('  • /services                   - Service registry');
    console.log('  • /health                     - Hub health status');
    console.log('  • /dashboard/*                - Main dashboard');
    console.log('  • /react-dashboard/*          - React dashboard');
    console.log('  • /monitoring/*               - Monitoring dashboard');
    console.log('  • /conscious/*                - Self-optimizing server');
    console.log('  • /integration/*              - Complete integration');
    console.log('  • /ws/*                       - WebSocket services');
    console.log('  • /mcp/*                      - MCP server');
    console.log('');
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const clientId = this.getClientId(request);

    // Rate limiting check
    if (!this.rateLimiter.isAllowed(clientId)) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60'
        }
      });
    }

    // CORS handling
    if (HUB_CONFIG.corsEnabled && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    try {
      // Route to appropriate handler
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return await this.handleHubDashboard(request);
      }

      if (url.pathname === '/services') {
        return await this.handleServiceRegistry(request);
      }

      if (url.pathname === '/health') {
        return await this.handleHubHealth(request);
      }

      // Service routing
      for (const [serviceKey, serviceConfig] of Object.entries(HUB_CONFIG.services)) {
        if (url.pathname.startsWith(serviceConfig.path)) {
          return await this.serviceRegistry.proxyRequest(serviceKey, request);
        }
      }

      // Default response
      return new Response('Unified API Hub - Service not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'X-API-Hub': 'true'
        }
      });

    } catch (error) {
      console.error('❌ [API HUB] Request error:', error);
      return new Response('Internal server error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }

  private async handleHubDashboard(request: Request): Promise<Response> {
    const services = this.serviceRegistry.getAllServices();
    const healthStatus = this.serviceRegistry.getHealthStatus();

    const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unified API Hub - api.example.com</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            color: #e4e4e4;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 3rem;
            background: linear-gradient(90deg, #00d9ff, #00ff88, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.2rem;
            opacity: 0.8;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .service-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        .service-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 217, 255, 0.2);
        }
        .service-card.healthy {
            border-color: #00ff88;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
        }
        .service-card.unhealthy {
            border-color: #ff6b6b;
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.2);
        }
        .service-card.unknown {
            border-color: #ffa500;
            box-shadow: 0 0 20px rgba(255, 165, 0, 0.2);
        }
        .service-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .service-path {
            color: #00d9ff;
            font-family: monospace;
            margin-bottom: 10px;
        }
        .service-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .status-healthy { background: #00ff88; color: #000; }
        .status-unhealthy { background: #ff6b6b; color: #fff; }
        .status-unknown { background: #ffa500; color: #000; }
        .service-metrics {
            margin-top: 10px;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer p {
            opacity: 0.6;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Unified API Hub</h1>
            <p>Your gateway to the complete Bun ecosystem at <strong>api.example.com</strong></p>
        </div>

        <div class="services-grid">
            ${services.map(service => {
                const health = healthStatus[service.id];
                const statusClass = service.status === 'healthy' ? 'healthy' :
                                  service.status === 'unhealthy' ? 'unhealthy' : 'unknown';
                const statusTextClass = service.status === 'healthy' ? 'status-healthy' :
                                      service.status === 'unhealthy' ? 'status-unhealthy' : 'status-unknown';

                return `
                    <div class="service-card ${statusClass}">
                        <div class="service-title">${service.name}</div>
                        <div class="service-path">${service.externalPath}</div>
                        <div class="service-status ${statusTextClass}">${service.status.toUpperCase()}</div>
                        ${health ? `
                            <div class="service-metrics">
                                Response: ${health.responseTime}ms<br>
                                Last check: ${new Date(health.lastCheck).toLocaleTimeString()}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>

        <div class="footer">
            <p>Built with ❤️ using Bun runtime | Self-optimizing, pattern-based architecture</p>
        </div>
    </div>
</body>
</html>`;

    return new Response(dashboardHTML, {
      headers: {
        'Content-Type': 'text/html',
        'X-API-Hub': 'true',
        'X-Served-By': 'Unified API Hub'
      }
    });
  }

  private async handleServiceRegistry(request: Request): Promise<Response> {
    const services = this.serviceRegistry.getAllServices();
    const healthStatus = this.serviceRegistry.getHealthStatus();

    return Response.json({
      hub: {
        name: 'Unified API Hub',
        domain: HUB_CONFIG.domain,
        version: 'Ω.∞.φ.∞.7',
        services: services.length
      },
      services: services.map(service => ({
        ...service,
        health: healthStatus[service.id]
      })),
      timestamp: new Date().toISOString()
    });
  }

  private async handleHubHealth(request: Request): Promise<Response> {
    const services = this.serviceRegistry.getAllServices();
    const healthStatus = this.serviceRegistry.getHealthStatus();

    const hubHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        total: services.length,
        healthy: services.filter(s => s.status === 'healthy').length,
        unhealthy: services.filter(s => s.status === 'unhealthy').length,
        unreachable: services.filter(s => s.status === 'unreachable').length
      },
      healthDetails: healthStatus
    };

    return Response.json(hubHealth);
  }

  private getClientId(request: Request): string {
    // Use IP address as client identifier
    // In production, you'd use proper client identification
    return request.headers.get('CF-Connecting-IP') ||
           request.headers.get('X-Forwarded-For') ||
           request.headers.get('X-Real-IP') ||
           'unknown';
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      console.log('🛑 [API HUB] Unified API Hub stopped');
    }
  }
}

// ===== INTERFACES =====

interface ServiceInfo {
  id: string;
  name: string;
  internalPort: number;
  externalPath: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unreachable' | 'unknown';
  lastHealthCheck: number;
  responseTime: number;
}

interface HealthStatus {
  healthy: boolean;
  statusCode: number;
  responseTime: number;
  lastCheck: number;
  message: string;
}

interface RequestRecord {
  timestamp: number;
}

// ===== MAIN EXECUTION =====

async function main() {
  const hub = new UnifiedAPIHub();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⚠️ Received SIGINT, shutting down gracefully...');
    await hub.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⚠️ Received SIGTERM, shutting down gracefully...');
    await hub.stop();
    process.exit(0);
  });

  try {
    await hub.start();

    // Keep the hub running
    console.log('🔄 Unified API Hub running... Press Ctrl+C to stop');

  } catch (error) {
    console.error('❌ Failed to start Unified API Hub:', error);
    process.exit(1);
  }
}

// Run the unified API hub
if (import.meta.main) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

// ===== EXPORTS =====

export { UnifiedAPIHub, ServiceRegistry, RateLimiter };
export type { ServiceInfo, HealthStatus };