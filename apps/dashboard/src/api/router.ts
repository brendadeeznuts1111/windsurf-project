/**
 * URLPattern-based API Router for Bun Dashboard
 * High-performance routing using Bun's native URLPattern implementation
 * Provides RESTful endpoints for dashboard data and operations
 */

// URLPattern is natively available in Bun v1.3.4+
import { Database } from 'bun:sqlite';
import { BunLogger } from '../utils/logger';
import { HB47MegaRegistry } from '@odds-protocol/odds-core';

// Initialize HB47 Registry
HB47MegaRegistry.initialize();

// Types for API responses
interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  profit: number;
  risk: number;
  timestamp: number;
  status: 'active' | 'claimed' | 'expired';
}

// Mock database for demo (replace with real DB in production)
const db = new Database(':memory:');

// Initialize mock data
db.exec(`
  CREATE TABLE opportunities (
    id TEXT PRIMARY KEY,
    symbol TEXT,
    profit REAL,
    risk REAL,
    timestamp INTEGER,
    status TEXT
  );

  INSERT INTO opportunities VALUES
    ('arb-001', 'ESZ4', 1250.50, 0.02, ${Date.now()}, 'active'),
    ('arb-002', 'NQZ4', 890.75, 0.015, ${Date.now() - 300000}, 'active'),
    ('arb-003', 'CLZ4', 2100.25, 0.03, ${Date.now() - 600000}, 'claimed');
`);

// Pre-compile URL patterns for maximum performance
const ROUTES = [
  // Health check
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/health' }),
    handler: healthHandler
  },

  // Metrics endpoint
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/metrics' }),
    handler: metricsHandler
  },

  // Arbitrage opportunities
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/opportunities' }),
    handler: listOpportunitiesHandler
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/api/opportunities' }),
    handler: createOpportunityHandler
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/opportunities/:id' }),
    handler: getOpportunityHandler
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/api/opportunities/:id' }),
    handler: updateOpportunityHandler
  },

  // Market data
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/market/:symbol' }),
    handler: marketDataHandler
  },

  // WebSocket upgrade for real-time data
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/ws' }),
    handler: websocketUpgradeHandler
  },

  // ORCA Dashboard API endpoints
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/orca/stats' }),
    handler: orcaStatsHandler
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/orca/packages' }),
    handler: orcaPackagesHandler
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/orca/registries' }),
    handler: orcaRegistriesHandler
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/orca/endpoints' }),
    handler: orcaEndpointsHandler
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/orca/releases' }),
    handler: orcaReleasesHandler
  },

  // Azure DevOps API endpoints
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/azure/work-items' }),
    handler: azureWorkItemsHandler
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/azure/pipelines' }),
    handler: azurePipelinesHandler
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/azure/prs' }),
    handler: azurePRsHandler
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/api/azure/project-stats' }),
    handler: azureProjectStatsHandler
  },

  // Catch-all for dashboard assets
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/*' }),
    handler: staticHandler
  }
] as const;

// Route handlers
function healthHandler(request: Request): Response {
  const response: APIResponse = {
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: Date.now()
    },
    timestamp: Date.now()
  };

  return Response.json(response, {
    headers: { 'Content-Type': 'application/json' }
  });
}

function metricsHandler(request: Request): Response {
  // Prometheus-style metrics
  const metrics = `
# HELP arbitrage_opportunities_total Total number of arbitrage opportunities
# TYPE arbitrage_opportunities_total gauge
arbitrage_opportunities_total 3

# HELP arbitrage_profit_total Total profit from arbitrage (USD)
# TYPE arbitrage_profit_total counter
arbitrage_profit_total 3241.50

# HELP arbitrage_risk_average Average risk score
# TYPE arbitrage_risk_average gauge
arbitrage_risk_average 0.022

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/health"} 42
http_requests_total{method="GET",endpoint="/api/opportunities"} 15
http_requests_total{method="POST",endpoint="/api/opportunities"} 3
`;

  return new Response(metrics, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}

function listOpportunitiesHandler(request: Request): Response {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const opportunities = db.prepare(`
      SELECT * FROM opportunities
      WHERE status = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(status, limit) as ArbitrageOpportunity[];

    const response: APIResponse = {
      success: true,
      data: opportunities,
      timestamp: Date.now()
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch opportunities',
      timestamp: Date.now()
    } as APIResponse, { status: 500 });
  }
}

async function createOpportunityHandler(request: Request): Response {
  try {
    const body = await request.json() as Partial<ArbitrageOpportunity>;

    if (!body.symbol || !body.profit) {
      return Response.json({
        success: false,
        error: 'Missing required fields: symbol, profit',
        timestamp: Date.now()
      } as APIResponse, { status: 400 });
    }

    const id = `arb-${Date.now().toString(36)}`;
    const opportunity: ArbitrageOpportunity = {
      id,
      symbol: body.symbol,
      profit: body.profit,
      risk: body.risk || 0.01,
      timestamp: Date.now(),
      status: 'active'
    };

    db.prepare(`
      INSERT INTO opportunities (id, symbol, profit, risk, timestamp, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, opportunity.symbol, opportunity.profit, opportunity.risk, opportunity.timestamp, opportunity.status);

    const response: APIResponse = {
      success: true,
      data: opportunity,
      timestamp: Date.now()
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to create opportunity',
      timestamp: Date.now()
    } as APIResponse, { status: 500 });
  }
}

function getOpportunityHandler(request: Request, match: URLPatternResult): Response {
  try {
    const id = match.pathname.groups.id;
    const opportunity = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id) as ArbitrageOpportunity | undefined;

    if (!opportunity) {
      return Response.json({
        success: false,
        error: 'Opportunity not found',
        timestamp: Date.now()
      } as APIResponse, { status: 404 });
    }

    const response: APIResponse = {
      success: true,
      data: opportunity,
      timestamp: Date.now()
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch opportunity',
      timestamp: Date.now()
    } as APIResponse, { status: 500 });
  }
}

async function updateOpportunityHandler(request: Request, match: URLPatternResult): Response {
  try {
    const id = match.pathname.groups.id;
    const updates = await request.json() as Partial<ArbitrageOpportunity>;

    // Check if opportunity exists
    const existing = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id) as ArbitrageOpportunity | undefined;
    if (!existing) {
      return Response.json({
        success: false,
        error: 'Opportunity not found',
        timestamp: Date.now()
      } as APIResponse, { status: 404 });
    }

    // Update fields
    const updated = { ...existing, ...updates };
    db.prepare(`
      UPDATE opportunities
      SET profit = ?, risk = ?, status = ?
      WHERE id = ?
    `).run(updated.profit, updated.risk, updated.status, id);

    const response: APIResponse = {
      success: true,
      data: updated,
      timestamp: Date.now()
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to update opportunity',
      timestamp: Date.now()
    } as APIResponse, { status: 500 });
  }
}

function marketDataHandler(request: Request, match: URLPatternResult): Response {
  const symbol = match.pathname.groups.symbol;

  // Mock market data - in real app, fetch from exchange APIs
  const mockData = {
    symbol: symbol.toUpperCase(),
    price: Math.random() * 1000 + 100,
    volume: Math.floor(Math.random() * 10000),
    timestamp: Date.now(),
    bid: Math.random() * 1000 + 95,
    ask: Math.random() * 1000 + 105
  };

  const response: APIResponse = {
    success: true,
    data: mockData,
    timestamp: Date.now()
  };

  return Response.json(response);
}

function websocketUpgradeHandler(request: Request): Response {
  // WebSocket upgrade would be handled here
  // For now, return not implemented
  return Response.json({
    success: false,
    error: 'WebSocket not implemented',
    timestamp: Date.now()
  } as APIResponse, { status: 501 });
}

// ORCA Dashboard Handlers
function orcaStatsHandler(request: Request): Response {
  const bookies = HB47MegaRegistry.getAllBookies();
  const stats = HB47MegaRegistry.getStatistics();

  return Response.json({
    success: true,
    data: {
      totalPackages: stats.totalBookies,
      activeRegistries: 4,
      apiEndpoints: 12,
      versionReleases: stats.totalBookies,
      totalFactors: stats.totalFactors,
      totalDataPoints: stats.totalDataPoints,
      byTier: stats.byTier,
      byRegion: stats.byRegion,
      cryptoEnabled: stats.cryptoEnabled,
      websocketEnabled: stats.websocketEnabled,
      avgApiRateLimit: stats.avgApiRateLimit,
      lastUpdated: new Date().toISOString()
    },
    timestamp: Date.now()
  } as APIResponse);
}

function orcaPackagesHandler(request: Request): Response {
  const bookies = HB47MegaRegistry.getAllBookies();
  const tierScores: Record<string, number> = { hyper: 95, high: 80, medium: 60, low: 40, minimal: 20 };

  const packages = bookies.map((b, i) => {
    const baseScore = tierScores[b.priority_tier] || 50;
    const score = baseScore + Math.floor(Math.random() * 10) - 5;
    return {
      id: b.id,
      name: `@orca/${b.id}`,
      displayName: b.name,
      description: `${b.type} - ${b.region}`,
      version: `v${Math.floor(score / 30) + 1}.${i % 10}.0`,
      downloads: Math.floor(b.volume_24h_usd / 1000000),
      tier: b.priority_tier,
      megaScore: score,
      type: b.type,
      region: b.region,
      properties: b.properties,
      latency: b.latency_ms,
      uptime: b.uptime_pct,
      sharpness: b.sharpness_score,
      cryptoAccepted: b.crypto_accepted,
      websocketSupported: b.websocket.supported
    };
  });

  return Response.json({
    success: true,
    data: { packages, total: bookies.length },
    timestamp: Date.now()
  } as APIResponse);
}

async function orcaRegistriesHandler(request: Request): Promise<Response> {
  const bookies = HB47MegaRegistry.getAllBookies();

  // Check local registry
  let localOnline = false;
  try {
    const response = await fetch('http://localhost:4873/-/ping', {
      signal: AbortSignal.timeout(2000)
    });
    localOnline = response.ok;
  } catch {}

  const registries = [
    {
      name: 'HB47 Mega Registry',
      url: 'internal://hb47',
      status: 'connected',
      packages: bookies.length,
      lastSync: new Date().toISOString()
    },
    {
      name: 'Local Registry',
      url: 'http://localhost:4873',
      status: localOnline ? 'connected' : 'offline',
      packages: 0,
      lastSync: localOnline ? new Date().toISOString() : null
    },
    {
      name: 'npm Registry',
      url: 'https://registry.npmjs.org',
      status: 'external',
      packages: 0,
      lastSync: null
    },
    {
      name: 'Azure Artifacts',
      url: 'https://pkgs.dev.azure.com/brendawill2233',
      status: 'external',
      packages: 0,
      lastSync: null
    }
  ];

  return Response.json({
    success: true,
    data: { registries },
    timestamp: Date.now()
  } as APIResponse);
}

function orcaEndpointsHandler(request: Request): Response {
  const endpoints = [
    { path: '/api/health', method: 'GET', status: 'active', latency: 5, requests: 0, category: 'System' },
    { path: '/api/orca/stats', method: 'GET', status: 'active', latency: 10, requests: 0, category: 'ORCA' },
    { path: '/api/orca/packages', method: 'GET', status: 'active', latency: 15, requests: 0, category: 'ORCA' },
    { path: '/api/orca/registries', method: 'GET', status: 'active', latency: 20, requests: 0, category: 'ORCA' },
    { path: '/api/orca/endpoints', method: 'GET', status: 'active', latency: 5, requests: 0, category: 'ORCA' },
    { path: '/api/orca/releases', method: 'GET', status: 'active', latency: 10, requests: 0, category: 'ORCA' },
    { path: '/api/azure/work-items', method: 'GET', status: 'active', latency: 100, requests: 0, category: 'Azure' },
    { path: '/api/azure/pipelines', method: 'GET', status: 'active', latency: 100, requests: 0, category: 'Azure' },
    { path: '/api/azure/prs', method: 'GET', status: 'active', latency: 100, requests: 0, category: 'Azure' },
    { path: '/api/opportunities', method: 'GET', status: 'active', latency: 20, requests: 0, category: 'Arbitrage' },
    { path: '/api/market/:symbol', method: 'GET', status: 'active', latency: 15, requests: 0, category: 'Market' },
    { path: '/api/ws', method: 'WS', status: 'active', latency: 0, requests: 0, category: 'WebSocket' }
  ];

  return Response.json({
    success: true,
    data: { endpoints },
    timestamp: Date.now()
  } as APIResponse);
}

function orcaReleasesHandler(request: Request): Response {
  const bookies = HB47MegaRegistry.getAllBookies();

  const releases = bookies.slice(0, 10).map((b, i) => ({
    package: `@orca/${b.id}`,
    version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    description: `Updated ${b.name} integration`,
    releasedAt: new Date(Date.now() - i * 3600000).toISOString(),
    author: 'orca-team',
    tier: b.priority_tier,
    changes: [
      'Improved latency handling',
      'Updated API endpoints',
      'Enhanced error handling'
    ]
  }));

  return Response.json({
    success: true,
    data: { releases },
    timestamp: Date.now()
  } as APIResponse);
}

// Azure DevOps Handlers
const AZURE_ORG = 'https://dev.azure.com/brendawill2233';
const AZURE_PROJECT = 'brendawill2233';

async function runAzCommand(args: string[]): Promise<any> {
  try {
    const proc = Bun.spawn(['az', ...args], {
      stdout: 'pipe',
      stderr: 'pipe'
    });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    return JSON.parse(output || '[]');
  } catch {
    return null;
  }
}

async function azureWorkItemsHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get('state') || 'Active';

  try {
    const wiql = state.toLowerCase() === 'all'
      ? `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE [System.TeamProject] = '${AZURE_PROJECT}' ORDER BY [System.ChangedDate] DESC`
      : `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE [System.TeamProject] = '${AZURE_PROJECT}' AND [System.State] = '${state}' ORDER BY [System.ChangedDate] DESC`;

    const result = await runAzCommand([
      'boards', 'query', '--wiql', wiql,
      '--org', AZURE_ORG, '--project', AZURE_PROJECT, '--output', 'json'
    ]);

    return Response.json({
      success: true,
      data: { workItems: result || [] },
      timestamp: Date.now()
    } as APIResponse);
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch work items',
      timestamp: Date.now()
    } as APIResponse, { status: 500 });
  }
}

async function azurePipelinesHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const top = url.searchParams.get('top') || '10';

  try {
    const result = await runAzCommand([
      'pipelines', 'runs', 'list', '--top', top,
      '--org', AZURE_ORG, '--project', AZURE_PROJECT, '--output', 'json'
    ]);

    return Response.json({
      success: true,
      data: { pipelines: result || [] },
      timestamp: Date.now()
    } as APIResponse);
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch pipelines',
      timestamp: Date.now()
    } as APIResponse, { status: 500 });
  }
}

async function azurePRsHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'active';

  try {
    const result = await runAzCommand([
      'repos', 'pr', 'list', '--status', status, '--top', '10',
      '--org', AZURE_ORG, '--project', AZURE_PROJECT, '--output', 'json'
    ]);

    return Response.json({
      success: true,
      data: { pullRequests: result || [] },
      timestamp: Date.now()
    } as APIResponse);
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch pull requests',
      timestamp: Date.now()
    } as APIResponse, { status: 500 });
  }
}

async function azureProjectStatsHandler(request: Request): Promise<Response> {
  try {
    const [workItems, pipelines, prs] = await Promise.all([
      runAzCommand(['boards', 'query', '--wiql',
        `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${AZURE_PROJECT}'`,
        '--org', AZURE_ORG, '--project', AZURE_PROJECT, '--output', 'json']),
      runAzCommand(['pipelines', 'list', '--org', AZURE_ORG, '--project', AZURE_PROJECT, '--output', 'json']),
      runAzCommand(['repos', 'pr', 'list', '--status', 'all', '--top', '100',
        '--org', AZURE_ORG, '--project', AZURE_PROJECT, '--output', 'json'])
    ]);

    return Response.json({
      success: true,
      data: {
        totalWorkItems: Array.isArray(workItems) ? workItems.length : 0,
        totalPipelines: Array.isArray(pipelines) ? pipelines.length : 0,
        totalPRs: Array.isArray(prs) ? prs.length : 0,
        activePRs: Array.isArray(prs) ? prs.filter((pr: any) => pr.status === 'active').length : 0,
        org: AZURE_ORG,
        project: AZURE_PROJECT
      },
      timestamp: Date.now()
    } as APIResponse);
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch project stats',
      timestamp: Date.now()
    } as APIResponse, { status: 500 });
  }
}

function staticHandler(request: Request): Response {
  // Serve dashboard assets or redirect to main app
  return new Response('Dashboard API - Use /api/* endpoints', {
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Internal routing function
function routeRequest(request: Request): Response {
  const url = new URL(request.url);

  // Find matching route
  for (const route of ROUTES) {
    if (route.method !== request.method && route.method !== 'ALL') continue;

    const match = route.pattern.exec(url);
    if (match) {
      return route.handler(request, match);
    }
  }

  // No route found - return 404
  return Response.json({
    success: false,
    error: 'Route not found',
    timestamp: Date.now()
  } as APIResponse, { status: 404 });
}

// Main router function with logging
export function handleAPIRequest(request: Request): Response {
  const url = new URL(request.url);
  const startTime = Date.now();

  try {
    // Handle CORS for development
    if (request.method === 'OPTIONS') {
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

    // Route the request
    const response = routeRequest(request);
    const duration = Date.now() - startTime;

    // Log API request using Bun's %j format specifier
    BunLogger.api(url.pathname, request.method, response.status, duration);

    // Add CORS headers to all responses
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('X-Response-Time', `${duration}ms`);
    headers.set('X-Powered-By', 'Bun v1.3.4 + URLPattern');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error using %j format specifier
    BunLogger.error('API request failed', {
      method: request.method,
      url: url.pathname,
      duration: `${duration}ms`,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
}

// Export for use in main server
export { ROUTES };
export type { APIResponse, ArbitrageOpportunity };