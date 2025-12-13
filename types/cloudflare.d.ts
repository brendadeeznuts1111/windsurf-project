/**
 * Cloudflare Workers Type Definitions
 * Provides compatibility types for Cloudflare Workers runtime
 */

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  // Common environment variables for Cloudflare Workers
  DATABASE_URL?: string;
  API_KEY?: string;
  REDIS_URL?: string;
  [key: string]: string | undefined;
}