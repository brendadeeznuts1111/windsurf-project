// src/middleware/applyHeaders.ts
/**
 * SPEC: Security Headers Middleware v1.0
 * Purpose: Apply comprehensive security headers to all HTTP responses
 * Standards: OWASP Security Headers, CSP Level 3, HSTS preload ready
 */

import type { EndpointConfig } from "../constants/api";

// ────────── SECURITY HEADER CONSTANTS ──────────

/**
 * Content Security Policy - Strict CSP with fallbacks
 * Prevents XSS, data injection, and other code injection attacks
 */
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for now (review for production)
  "style-src 'self' 'unsafe-inline'", // Allow inline styles
  "img-src 'self' data: https:", // Allow data URIs and HTTPS images
  "font-src 'self' data:", // Allow data URIs for fonts
  "connect-src 'self' ws: wss:", // Allow WebSocket connections
  "media-src 'self'",
  "object-src 'none'", // Block plugins
  "frame-src 'none'", // Block iframes
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests" // Force HTTPS in production
].join("; ");

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": CSP_HEADER,

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS filtering
  "X-XSS-Protection": "1; mode=block",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Feature policy (permissions)
  "Permissions-Policy": [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "magnetometer=()",
    "accelerometer=()",
    "gyroscope=()",
    "speaker=()",
    "fullscreen=(self)",
    "ambient-light-sensor=()",
    "autoplay=(self)",
    "encrypted-media=(self)"
  ].join(", "),

  // HSTS - HTTP Strict Transport Security
  // NOTE: Only enable in production with HTTPS
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

  // Prevent caching of sensitive content
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
} as const;

/**
 * CORS headers for cross-origin requests
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Configure for specific origins in production
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400" // 24 hours
} as const;

// ────────── HEADER APPLICATION FUNCTIONS ──────────

/**
 * Apply security headers to a Response object
 * @param response The Response to enhance with security headers
 * @param request Optional Request object for conditional headers
 * @returns Enhanced Response with security headers
 */
export function applySecurityHeaders(
  response: Response,
  request?: Request
): Response {
  const headers = new Headers(response.headers);

  // Apply all security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  // Apply CORS headers if this is a CORS request
  if (request && isCorsRequest(request)) {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  // Create new response with enhanced headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Apply headers to error responses with appropriate security measures
 * @param status HTTP status code
 * @param message Error message
 * @param request Optional Request object
 * @returns Error Response with security headers
 */
export function applyHeadersToError(
  status: number,
  message: string,
  request?: Request
): Response {
  const errorResponse = new Response(
    JSON.stringify({
      error: {
        code: status,
        message: sanitizeErrorMessage(message),
        timestamp: new Date().toISOString()
      }
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );

  return applySecurityHeaders(errorResponse, request);
}

/**
 * Apply team member specific headers based on authentication
 * @param response Response to enhance
 * @param teamMemberId Team member identifier (e.g., "alice-admin")
 * @returns Response with team member headers
 */
export function applyTeamMemberHeaders(
  response: Response,
  teamMemberId: string
): Response {
  const headers = new Headers(response.headers);

  // Add team member specific headers
  headers.set("X-Team-Member", teamMemberId);

  // Add role-based custom headers (example implementation)
  const customHeaders = getTeamMemberCustomHeaders(teamMemberId);
  Object.entries(customHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// ────────── HELPER FUNCTIONS ──────────

/**
 * Check if request requires CORS headers
 */
function isCorsRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  return origin !== null && origin !== `http://${host}` && origin !== `https://${host}`;
}

/**
 * Sanitize error messages to prevent information leakage
 */
function sanitizeErrorMessage(message: string): string {
  // Remove sensitive information, stack traces, etc.
  // This is a basic implementation - enhance based on security requirements
  if (message.includes("stack")) {
    return "Internal server error";
  }
  return message;
}

/**
 * Get custom headers for team members
 * This would typically come from a database or configuration
 */
function getTeamMemberCustomHeaders(teamMemberId: string): Record<string, string> {
  // Example implementation - replace with actual team member data
  const teamMembers: Record<string, Record<string, string>> = {
    "alice-admin": {
      "X-Role": "admin",
      "X-Permissions": "read,write,delete,admin",
      "X-Custom-Header": "Alice's Special Header"
    },
    "bob-developer": {
      "X-Role": "developer",
      "X-Permissions": "read,write",
      "X-Custom-Header": "Bob's Development Header"
    },
    "carol-analyst": {
      "X-Role": "analyst",
      "X-Permissions": "read",
      "X-Custom-Header": "Carol's Analytics Header"
    },
    "dave-viewer": {
      "X-Role": "viewer",
      "X-Permissions": "read",
      "X-Custom-Header": "Dave's Viewer Header"
    }
  };

  return teamMembers[teamMemberId] || {};
}

/**
 * Validate CSP header to ensure it doesn't contain XSS vectors
 * @param csp CSP header value to validate
 * @returns true if valid, false if potentially dangerous
 */
export function validateCSP(csp: string): boolean {
  // Basic validation - check for dangerous patterns
  const dangerous = [
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /on\w+\s*=/i // Event handlers
  ];

  return !dangerous.some(pattern => pattern.test(csp));
}