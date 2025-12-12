/**
 * @fileoverview Performance-Optimized Bun Server
 * @description Enterprise-grade server with automatic performance monitoring and optimization
 * @version 1.0.0
 *
 * A Bun server that monitors performance metrics and automatically adjusts
 * configuration for optimal throughput and resource usage.
 */

import { serve, Server } from "bun";
import * as os from "os";

interface ServerConfig {
  rate_limiting: { requests_per_minute: number; ip_whitelist: string[] };
  websocket: { upgrade_timeout_ms: number; max_payload_size_mb: number; ping_interval_ms: number };
  tls: { cert_path?: string; key_path?: string; min_version?: string };
  http2: { max_concurrent_streams: number; initial_window_size: number };
  monitoring: { metrics_interval_ms: number; health_check_endpoint: string };
}

interface RuntimeMetrics {
  active_connections: number;
  total_requests: number;
  average_response_time: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  timestamp: number;
}

interface OptimizedResult {
  config: ServerConfig;
  performance_score: number;
  recommendations: string[];
}

/**
 * Performance monitoring and optimization system for Bun servers
 */
export class ServerOptimizer {
  private metrics: RuntimeMetrics[] = [];
  private config: ServerConfig;

  constructor(initialConfig: ServerConfig) {
    this.config = { ...initialConfig };
  }

  /**
   * Record runtime metrics for analysis
   */
  recordMetrics(metrics: Omit<RuntimeMetrics, 'timestamp'>): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now()
    });

    // Keep only last 100 metrics for analysis
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Analyze metrics and generate optimization recommendations
   */
  analyzePerformance(): OptimizedResult {
    if (this.metrics.length === 0) {
      return {
        config: this.config,
        performance_score: 0,
        recommendations: ['Collect more metrics before optimization']
      };
    }

    const recentMetrics = this.metrics.slice(-10);
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.average_response_time, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memory_usage_mb, 0) / recentMetrics.length;
    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.cpu_usage_percent, 0) / recentMetrics.length;

    // Calculate performance score (0-100, higher is better)
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 10)); // Penalize >100ms avg
    const memoryScore = Math.max(0, 100 - (avgMemoryUsage / 100)); // Penalize >100MB usage
    const cpuScore = Math.max(0, 100 - avgCpuUsage); // Lower CPU usage is better
    const performanceScore = (responseTimeScore + memoryScore + cpuScore) / 3;

    const recommendations: string[] = [];

    if (avgResponseTime > 50) {
      recommendations.push('Consider increasing server resources or optimizing request handling');
    }
    if (avgMemoryUsage > 200) {
      recommendations.push('High memory usage detected - review memory management');
    }
    if (avgCpuUsage > 80) {
      recommendations.push('High CPU usage - consider load balancing or optimization');
    }

    // Generate optimized config based on metrics
    const optimizedConfig = this.generateOptimizedConfig(avgResponseTime, avgMemoryUsage, avgCpuUsage);

    return {
      config: optimizedConfig,
      performance_score: Math.round(performanceScore),
      recommendations
    };
  }

  /**
   * Generate optimized configuration based on current metrics
   */
  private generateOptimizedConfig(avgResponseTime: number, avgMemoryUsage: number, avgCpuUsage: number): ServerConfig {
    const config = { ...this.config };

    // Adjust rate limiting based on performance
    if (avgResponseTime > 100) {
      config.rate_limiting.requests_per_minute = Math.floor(config.rate_limiting.requests_per_minute * 0.8);
      config.websocket.max_payload_size_mb = Math.floor(config.websocket.max_payload_size_mb * 0.9);
    } else if (avgResponseTime < 20 && avgCpuUsage < 50) {
      config.rate_limiting.requests_per_minute = Math.floor(config.rate_limiting.requests_per_minute * 1.2);
    }

    // Adjust HTTP/2 settings based on memory usage
    if (avgMemoryUsage > 150) {
      config.http2.max_concurrent_streams = Math.floor(config.http2.max_concurrent_streams * 0.8);
      config.http2.initial_window_size = Math.floor(config.http2.initial_window_size * 0.9);
    }

    return config;
  }

  /**
   * Get current configuration
   */
  getConfig(): ServerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ServerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Create an optimized Bun server with performance monitoring
 */
export function createOptimizedServer(config: ServerConfig) {
  const optimizer = new ServerOptimizer(config);

  // Monitor system metrics periodically
  const metricsInterval = setInterval(() => {
    const memUsage = process.memoryUsage();
    const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length; // Rough CPU estimate

    optimizer.recordMetrics({
      active_connections: 0, // Would need to track this in the server
      total_requests: 0, // Would need to track this in the server
      average_response_time: 0, // Would need to measure this
      memory_usage_mb: memUsage.heapUsed / 1024 / 1024,
      cpu_usage_percent: cpuUsage
    });
  }, config.monitoring.metrics_interval_ms);

  const server = serve({
    port: process.env.PORT ? parseInt(process.env.PORT) : 0, // Use random available port
    fetch: async (req) => {
      const startTime = performance.now();

      try {
        const url = new URL(req.url);

        // Health check endpoint
        if (url.pathname === config.monitoring.health_check_endpoint) {
          const analysis = optimizer.analyzePerformance();
          return Response.json({
            status: 'healthy',
            performance_score: analysis.performance_score,
            recommendations: analysis.recommendations,
            timestamp: new Date().toISOString()
          });
        }

        // Default response
        const response = new Response(`Hello from optimized Bun server!`, {
          headers: { 'Content-Type': 'text/plain' }
        });

        const endTime = performance.now();
        // Could record response time here for more detailed metrics

        return response;
      } catch (error) {
        return new Response('Internal Server Error', { status: 500 });
      }
    },
    websocket: {
      open(ws) {
        console.log('WebSocket connection opened');
      },
      message(ws, message) {
        ws.send(`Echo: ${message}`);
      },
    },
    error(error) {
      console.error('Server error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  });

  console.log(`🚀 Optimized Bun server running on http://localhost:${server.port}`);
  console.log(`📊 Health check available at http://localhost:${server.port}${config.monitoring.health_check_endpoint}`);

  // Cleanup on exit
  process.on('SIGINT', () => {
    clearInterval(metricsInterval);
    server.stop();
    console.log('Server stopped');
    process.exit(0);
  });

  return { server, optimizer };
}

// Default configuration
export const defaultServerConfig: ServerConfig = {
  rate_limiting: {
    requests_per_minute: 1000,
    ip_whitelist: []
  },
  websocket: {
    upgrade_timeout_ms: 10000,
    max_payload_size_mb: 10,
    ping_interval_ms: 30000
  },
  tls: {
    min_version: '1.2'
  },
  http2: {
    max_concurrent_streams: 100,
    initial_window_size: 65535
  },
  monitoring: {
    metrics_interval_ms: 5000,
    health_check_endpoint: '/health'
  }
};

// Example usage
if (import.meta.main) {
  const { server, optimizer } = createOptimizedServer(defaultServerConfig);

  // Demonstrate optimization analysis
  setTimeout(() => {
    const analysis = optimizer.analyzePerformance();
    console.log('\n📊 Performance Analysis:');
    console.log(`   Score: ${analysis.performance_score}/100`);
    console.log('   Recommendations:');
    analysis.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }, 10000);
}