/**
 * @fileoverview Metrics API route handler
 * @description Handles requests for dashboard metrics data
 */

import type { DashboardMetrics } from '../../shared/types/dashboard';
import type { DashboardState } from '../state/dashboard-state';

export class MetricsRoute {
  constructor(private dashboardState: DashboardState) {}

  /**
   * Handle metrics API requests
   */
  async handle(request: Request): Promise<Response> {
    try {
      const metrics: DashboardMetrics = this.dashboardState.getMetrics();

      return new Response(JSON.stringify(metrics), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    } catch (error) {
      console.error('Metrics API error:', error);

      return new Response(JSON.stringify({
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
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