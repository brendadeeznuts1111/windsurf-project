/**
 * @fileoverview Main dashboard server
 * @description Bun server for the modular dashboard application
 */

import { serve } from 'bun';
import { DashboardState } from './state/dashboard-state';
import { configManager } from './config';
import { MetricsRoute } from './routes/metrics';
import { HealthRoute } from './routes/health';
import { RSSRoute } from './routes/rss';

export class DashboardServer {
  private server: ReturnType<typeof serve> | null = null;
  private dashboardState: DashboardState;
  private metricsRoute: MetricsRoute;
  private healthRoute: HealthRoute;
  private rssRoute: RSSRoute;

  constructor() {
    this.dashboardState = new DashboardState();
    this.metricsRoute = new MetricsRoute(this.dashboardState);
    this.healthRoute = new HealthRoute(this.dashboardState);
    this.rssRoute = new RSSRoute();
  }

  /**
   * Start the server
   */
  async start(): Promise<{ port: number; url: string }> {
    const config = configManager.getServerConfig();

    this.server = serve({
      port: config.port,
      hostname: config.host,
      fetch: this.handleRequest.bind(this),
      error: this.handleError.bind(this)
    });

    const port = this.server.port || config.port;
    const url = `http://${config.host}:${port}`;

    console.log('🚀 Dashboard server started');
    console.log(`📊 Server: ${url}`);
    console.log(`📈 Metrics: ${url}/api/metrics`);
    console.log(`💚 Health: ${url}/api/health`);
    console.log(`📰 RSS: ${url}/api/rss`);

    return { port, url };
  }

  /**
   * Handle incoming requests
   */
  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Increment request counter
    this.dashboardState.incrementRequests();

    // Route handling
    try {
      switch (url.pathname) {
        case '/api/metrics':
          return await this.metricsRoute.handle(request);

        case '/api/health':
          return await this.healthRoute.handle(request);

        case '/api/rss':
          return await this.rssRoute.handle(request);

        case '/api/systems':
          // Return systems data from metrics
          const metrics = this.dashboardState.getMetrics();
          return new Response(JSON.stringify(metrics.systems), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });

            case '/':
            case '/dashboard':
              return await this.serveDashboard();

            case '/dashboard.css':
              return await this.serveCSS();

        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Server error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle server errors
   */
  private handleError(error: Error): void {
    console.error('Server error:', error);
  }

  /**
   * Serve the main dashboard HTML
   */
  private async serveDashboard(): Promise<Response> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Bun Systems Dashboard</title>
    <link rel="stylesheet" href="/dashboard.css">
</head>
<body>
    <div id="dashboard-root"></div>
    <script type="module">
        import React from 'https://esm.sh/react@18';
        import ReactDOM from 'https://esm.sh/react-dom@18';
        import { Dashboard } from './client/components/Dashboard.js';

        ReactDOM.createRoot(document.getElementById('dashboard-root')).render(
            React.createElement(Dashboard)
        );
    </script>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  /**
   * Serve the dashboard CSS
   */
  private async serveCSS(): Promise<Response> {
    try {
      // For now, return inline CSS - in production this would be a static file
      const css = `
        .dashboard { min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%); color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .dashboard-header { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 1rem 2rem; }
        .header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .header-main h1 { margin: 0; font-size: 1.8rem; font-weight: 700; background: linear-gradient(45deg, #00ff88, #00d4aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .dashboard-nav { display: flex; gap: 0.5rem; }
        .dashboard-nav button { padding: 0.75rem 1.5rem; background: transparent; color: #a0aec0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
        .dashboard-nav button:hover { background: rgba(255, 255, 255, 0.05); color: #e2e8f0; }
        .dashboard-nav button.active { background: linear-gradient(45deg, #00ff88, #00d4aa); color: #0f0f23; border-color: #00ff88; }
        .dashboard-main { padding: 2rem; }
        .tab-content { max-width: 1400px; margin: 0 auto; }
        .metrics-overview { margin-bottom: 2rem; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .metric-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; transition: all 0.3s ease; }
        .metric-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2); }
        .metric-icon { font-size: 2rem; opacity: 0.8; }
        .metric-content { flex: 1; }
        .metric-value { font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem; color: #ffffff; }
        .metric-label { font-size: 0.9rem; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.5px; }
        .system-cards { margin-bottom: 2rem; }
        .cards-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        .system-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem; transition: all 0.3s ease; }
        .system-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2); }
        .system-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .system-header h3 { margin: 0; font-size: 1.2rem; color: #e2e8f0; display: flex; align-items: center; gap: 0.5rem; }
        .status-badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-badge.status-healthy { background: rgba(0, 255, 136, 0.2); color: #00ff88; border: 1px solid rgba(0, 255, 136, 0.3); }
        .status-badge.status-warning { background: rgba(255, 170, 0, 0.2); color: #ffaa00; border: 1px solid rgba(255, 170, 0, 0.3); }
        .status-badge.status-error { background: rgba(255, 68, 68, 0.2); color: #ff4444; border: 1px solid rgba(255, 68, 68, 0.3); }
        .last-check { color: #a0aec0; font-size: 0.85rem; }
        .loading-spinner { text-align: center; padding: 2rem; color: #a0aec0; }
        .error-message { background: rgba(255, 68, 68, 0.1); border: 1px solid rgba(255, 68, 68, 0.3); border-radius: 8px; padding: 1.5rem; text-align: center; }
        .error-message h3 { margin: 0 0 0.5rem 0; color: #ff4444; }
        .error-message p { margin: 0; color: #a0aec0; }
        .placeholder-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 2rem; text-align: center; }
        .placeholder-card h3 { margin: 0 0 1rem 0; color: #e2e8f0; }
        .placeholder-card p { color: #a0aec0; margin: 0; }
        .overview-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
        @media (max-width: 768px) { .overview-grid { grid-template-columns: 1fr; } .metrics-grid { grid-template-columns: 1fr; } .cards-grid { grid-template-columns: 1fr; } }
      `;

      return new Response(css, {
        headers: { 'Content-Type': 'text/css' }
      });
    } catch (error) {
      console.error('CSS serving error:', error);
      return new Response('/* Error loading CSS */', {
        status: 500,
        headers: { 'Content-Type': 'text/css' }
      });
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
    this.dashboardState.destroy();
  }

  /**
   * Get server info
   */
  getInfo() {
    return {
      port: this.server?.port,
      config: configManager.getConfig(),
      metrics: this.dashboardState.getMetrics()
    };
  }
}

// Export is already declared in the class declaration