/**
 * @fileoverview Health API route handler
 * @description Handles requests for dashboard health status
 */

import type { SystemHealthStatus } from '../../shared/types/dashboard';
import type { DashboardState } from '../state/dashboard-state';

export class HealthRoute {
  constructor(private dashboardState: DashboardState) {}

  /**
   * Handle health API requests
   */
  async handle(request: Request): Promise<Response> {
    try {
      const healthSummary = this.dashboardState.getHealthSummary();

      const overallRaw = healthSummary.overall as unknown as string;
      const overallStatus: 'healthy' | 'warning' | 'error' =
        (overallRaw === 'unknown' || overallRaw === 'idle')
          ? 'healthy'
          : (overallRaw === 'healthy' || overallRaw === 'warning' || overallRaw === 'error')
            ? overallRaw as 'healthy' | 'warning' | 'error'
            : 'healthy';

      const health: SystemHealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        healthy: healthSummary.healthy,
        total: healthSummary.total,
        warning: healthSummary.warning,
        error: healthSummary.error
      };

      const statusCode = health.status === 'healthy' ? 200 :
                        health.status === 'warning' ? 200 : 503;

      return new Response(JSON.stringify(health), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    } catch (error) {
      console.error('Health API error:', error);

      const errorResponse: SystemHealthStatus = {
        status: 'error',
        timestamp: new Date().toISOString(),
        healthy: 0,
        total: 0,
        warning: 0,
        error: 1
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  /**
   * Handle CORS preflight requests
   */
  async handleOptions(): Promise<Response> {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
}