// src/middleware/rateLimit.ts
/**
 * SPEC: Rate Limiting Middleware v1.0
 * Algorithm: Sliding Window Log (Simplified)
 * Tracks: Client IP address
 * Constraints: Uses limits defined in src/constants/limits.ts
 */

import { RATE_LIMITS } from "../constants/limits";
import type { EndpointConfig } from "../constants/api";
import { applyHeadersToError } from "./applyHeaders";

// ────────── TYPE DEFINITIONS ──────────

/**
 * Rate limit store entry for tracking requests per IP
 */
interface RateLimitEntry {
  timestamps: number[]; // Array of request timestamps (ms)
  lastCleanup: number;  // Last cleanup timestamp
}

/**
 * Rate limit result
 */
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // When the window resets (ms)
  retryAfter?: number; // Seconds to wait if rate limited
}

// ────────── RATE LIMIT STORE ──────────

/**
 * In-memory store for rate limiting data
 * In production, this should be replaced with Redis or similar
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired timestamps from the store
 * This prevents memory leaks and keeps the store efficient
 */
function cleanupStore(ip: string, windowMs: number, currentTime: number): void {
  const entry = rateLimitStore.get(ip);
  if (!entry) return;

  const windowStart = currentTime - windowMs;
  entry.timestamps = entry.timestamps.filter(ts => ts >= windowStart);
  entry.lastCleanup = currentTime;

  // Remove empty entries
  if (entry.timestamps.length === 0) {
    rateLimitStore.delete(ip);
  } else {
    rateLimitStore.set(ip, entry);
  }
}

/**
 * Periodic cleanup to prevent memory leaks
 * In production, this should run on a timer or cron job
 */
function periodicCleanup(windowMs: number): void {
  const currentTime = Date.now();
  const maxAge = windowMs * 2; // Keep entries for 2x the window size

  for (const [ip, entry] of rateLimitStore.entries()) {
    if (currentTime - entry.lastCleanup > maxAge) {
      cleanupStore(ip, windowMs, currentTime);
    }
  }
}

// ────────── IP EXTRACTION ──────────

/**
 * Extract client IP address from request headers
 * Prefers proxy headers (X-Forwarded-For) for production deployments
 */
function getClientIp(req: Request): string {
  // Check for common proxy headers first (most reliable in production)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(",")[0].trim();
  }

  // Check for other proxy headers
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Check for CF-Connecting-IP (Cloudflare)
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  // Fallback: use host header (not reliable, but better than nothing)
  const host = req.headers.get("host");
  if (host) {
    // Extract IP from host:port format
    const ipMatch = host.match(/^(\d+\.\d+\.\d+\.\d+)/);
    if (ipMatch) return ipMatch[1];
  }

  // Last resort: unknown identifier
  return "unknown-ip";
}

// ────────── RATE LIMITING LOGIC ──────────

/**
 * Check if a request should be rate limited
 * Uses sliding window algorithm for fair rate limiting
 */
function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number,
  currentTime: number
): RateLimitResult {
  // Get or create entry for this IP
  let entry = rateLimitStore.get(ip);
  if (!entry) {
    entry = { timestamps: [], lastCleanup: currentTime };
    rateLimitStore.set(ip, entry);
  }

  // Clean up old timestamps
  cleanupStore(ip, windowMs, currentTime);

  // Check if under limit
  const requestCount = entry.timestamps.length;
  if (requestCount < maxRequests) {
    // Allow request
    entry.timestamps.push(currentTime);
    rateLimitStore.set(ip, entry);

    return {
      allowed: true,
      remaining: maxRequests - requestCount - 1,
      resetTime: currentTime + windowMs
    };
  }

  // Rate limited - calculate retry time
  const oldestTimestamp = Math.min(...entry.timestamps);
  const resetTime = oldestTimestamp + windowMs;
  const retryAfter = Math.ceil((resetTime - currentTime) / 1000);

  return {
    allowed: false,
    remaining: 0,
    resetTime,
    retryAfter
  };
}

// ────────── MIDDLEWARE FUNCTION ──────────

/**
 * Rate limiting middleware for HTTP requests
 * @param req The incoming Request object
 * @param endpointConfig Configuration for the matched endpoint
 * @returns Response if rate limited, null if allowed
 */
export function rateLimitMiddleware(
  req: Request,
  endpointConfig: EndpointConfig
): Response | null {
  const ip = getClientIp(req);
  const currentTime = Date.now();

  // Determine rate limits (use endpoint-specific or default)
  const windowMs = RATE_LIMITS.DEFAULT_API_WINDOW_MS;
  const maxRequests = endpointConfig.rateLimit ?? RATE_LIMITS.DEFAULT_API_MAX_REQUESTS;

  // Periodic cleanup (run occasionally to prevent memory leaks)
  if (Math.random() < 0.01) { // 1% chance per request
    periodicCleanup(windowMs);
  }

  // Check rate limit
  const result = checkRateLimit(ip, maxRequests, windowMs, currentTime);

  if (!result.allowed) {
    // Rate limited - return 429 response
    const retryAfter = result.retryAfter || 60;

    const response = applyHeadersToError(
      429,
      `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`
    );

    // Add rate limit headers (RFC 6585)
    response.headers.set("Retry-After", retryAfter.toString());
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000).toString());

    return response;
  }

  // Request allowed - add rate limit headers for client awareness
  req.headers.set("X-RateLimit-Limit", maxRequests.toString());
  req.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  req.headers.set("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000).toString());

  return null; // Allow the request
}

// ────────── UTILITY FUNCTIONS ──────────

/**
 * Get current rate limit status for an IP (for monitoring/debugging)
 */
export function getRateLimitStatus(ip: string): RateLimitEntry | null {
  return rateLimitStore.get(ip) || null;
}

/**
 * Clear rate limit data for an IP (admin function)
 */
export function clearRateLimit(ip: string): boolean {
  return rateLimitStore.delete(ip);
}

/**
 * Get rate limit statistics (for monitoring)
 */
export function getRateLimitStats(): {
  totalTrackedIPs: number;
  totalRequests: number;
  averageRequestsPerIP: number;
} {
  const entries = Array.from(rateLimitStore.values());
  const totalRequests = entries.reduce((sum, entry) => sum + entry.timestamps.length, 0);

  return {
    totalTrackedIPs: rateLimitStore.size,
    totalRequests,
    averageRequestsPerIP: rateLimitStore.size > 0 ? totalRequests / rateLimitStore.size : 0
  };
}