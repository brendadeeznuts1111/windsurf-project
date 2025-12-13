/**
 * API Client for Bun Dashboard
 * Client utilities for communicating with the URLPattern-based API server
 */

import { APIResponse, ArbitrageOpportunity } from './router';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:6969';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async health(): Promise<APIResponse> {
    return this.request('/api/health');
  }

  // Metrics
  async metrics(): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/metrics`);
    return response.text();
  }

  // Arbitrage opportunities
  async getOpportunities(params?: {
    status?: string;
    limit?: number;
  }): Promise<ArbitrageOpportunity[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const endpoint = `/api/opportunities${query ? `?${query}` : ''}`;

    const response = await this.request<APIResponse>(endpoint);
    return response.data || [];
  }

  async getOpportunity(id: string): Promise<ArbitrageOpportunity | null> {
    try {
      const response = await this.request<APIResponse>(`/api/opportunities/${id}`);
      return response.data || null;
    } catch (error) {
      return null;
    }
  }

  async createOpportunity(opportunity: Omit<ArbitrageOpportunity, 'id' | 'timestamp'>): Promise<ArbitrageOpportunity> {
    const response = await this.request<APIResponse>('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunity)
    });
    return response.data;
  }

  async updateOpportunity(id: string, updates: Partial<ArbitrageOpportunity>): Promise<ArbitrageOpportunity> {
    const response = await this.request<APIResponse>(`/api/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return response.data;
  }

  // Market data
  async getMarketData(symbol: string): Promise<any> {
    const response = await this.request<APIResponse>(`/api/market/${symbol}`);
    return response.data;
  }

  // Utility methods
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export { APIClient };
export type { APIResponse, ArbitrageOpportunity };