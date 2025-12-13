// src/constants/headers.test.ts
/**
 * SPEC: Security Headers Test Suite v1.0
 * Purpose: Validate CSP headers and security configurations
 * Standards: OWASP Security Headers, CSP Level 3 compliance
 */

import { describe, test, expect } from "bun:test";
import { CSP_HEADER, SECURITY_HEADERS, validateCSP } from "../middleware/applyHeaders";

describe("Content Security Policy (CSP)", () => {
  test("CSP header contains required directives", () => {
    expect(CSP_HEADER).toContain("default-src 'self'");
    expect(CSP_HEADER).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(CSP_HEADER).toContain("style-src 'self' 'unsafe-inline'");
    expect(CSP_HEADER).toContain("img-src 'self' data: https:");
    expect(CSP_HEADER).toContain("connect-src 'self' ws: wss:");
    expect(CSP_HEADER).toContain("object-src 'none'");
    expect(CSP_HEADER).toContain("base-uri 'self'");
    expect(CSP_HEADER).toContain("form-action 'self'");
    expect(CSP_HEADER).toContain("upgrade-insecure-requests");
  });

  test("CSP header does not contain dangerous patterns", () => {
    // Should not allow unsafe patterns
    expect(CSP_HEADER).not.toContain("javascript:");
    expect(CSP_HEADER).not.toContain("data:text/html");
    expect(CSP_HEADER).not.toContain("vbscript:");
    expect(CSP_HEADER).not.toMatch(/on\w+\s*=/); // Event handlers
  });

  test("CSP validation function works correctly", () => {
    // Valid CSP should pass
    expect(validateCSP(CSP_HEADER)).toBe(true);

    // CSP with dangerous patterns should fail
    const dangerousCSP = "default-src 'self' javascript: data:text/html";
    expect(validateCSP(dangerousCSP)).toBe(false);

    // CSP with event handlers should fail
    const eventHandlerCSP = "default-src 'self'; script-src onclick=alert(1)";
    expect(validateCSP(eventHandlerCSP)).toBe(false);
  });

  test("CSP header is properly formatted", () => {
    // Should be semicolon-separated directives
    const directives = CSP_HEADER.split(";").map(d => d.trim()).filter(d => d.length > 0);
    expect(directives.length).toBeGreaterThan(5); // Should have multiple directives

    // Each directive should have proper syntax (directive-name value)
    directives.forEach(directive => {
      expect(directive).toMatch(/^[a-z-]+(\s+.+)?$/);
    });
  });
});

describe("Security Headers Configuration", () => {
  test("All required security headers are present", () => {
    const requiredHeaders = [
      "X-Frame-Options",
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
      "Cache-Control",
      "Pragma",
      "Expires"
    ];

    requiredHeaders.forEach(header => {
      expect(SECURITY_HEADERS).toHaveProperty(header);
    });
  });

  test("X-Frame-Options prevents clickjacking", () => {
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
  });

  test("X-Content-Type-Options prevents MIME sniffing", () => {
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
  });

  test("X-XSS-Protection enables XSS filtering", () => {
    expect(SECURITY_HEADERS["X-XSS-Protection"]).toBe("1; mode=block");
  });

  test("Referrer-Policy is secure", () => {
    expect(SECURITY_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("Permissions-Policy blocks dangerous features", () => {
    const permissions = SECURITY_HEADERS["Permissions-Policy"];
    expect(permissions).toContain("camera=()");
    expect(permissions).toContain("microphone=()");
    expect(permissions).toContain("geolocation=()");
    expect(permissions).toContain("payment=()");
    expect(permissions).toContain("usb=()");
  });

  test("HSTS is configured for preload", () => {
    const hsts = SECURITY_HEADERS["Strict-Transport-Security"];
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });

  test("Cache-Control prevents caching of sensitive content", () => {
    const cacheControl = SECURITY_HEADERS["Cache-Control"];
    expect(cacheControl).toContain("no-cache");
    expect(cacheControl).toContain("no-store");
    expect(cacheControl).toContain("must-revalidate");
  });
});

describe("CORS Headers", () => {
  test("CORS headers are properly configured", () => {
    // Import CORS headers from the middleware
    const { CORS_HEADERS } = require("../middleware/applyHeaders");

    expect(CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
    expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toContain("GET");
    expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toContain("POST");
    expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toContain("PUT");
    expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toContain("DELETE");
    expect(CORS_HEADERS["Access-Control-Allow-Headers"]).toContain("Content-Type");
    expect(CORS_HEADERS["Access-Control-Allow-Headers"]).toContain("Authorization");
    expect(CORS_HEADERS["Access-Control-Max-Age"]).toBe("86400");
  });
});

describe("Security Header Integration", () => {
  test("Headers can be applied to Response objects", async () => {
    const { applySecurityHeaders, applyHeadersToError } = require("../middleware/applyHeaders");

    // Test normal response
    const originalResponse = new Response("Hello World", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });

    const securedResponse = applySecurityHeaders(originalResponse);
    expect(securedResponse.headers.get("X-Frame-Options")).toBe("DENY");
    expect(securedResponse.headers.get("Content-Security-Policy")).toBe(CSP_HEADER);
    expect(securedResponse.headers.get("Content-Type")).toBe("text/plain"); // Original headers preserved

    // Test error response
    const errorResponse = applyHeadersToError(404, "Not Found");
    expect(errorResponse.status).toBe(404);
    expect(errorResponse.headers.get("X-Frame-Options")).toBe("DENY");
    expect(errorResponse.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  });

  test("Team member headers are applied correctly", async () => {
    const { applyTeamMemberHeaders } = require("../middleware/applyHeaders");

    const response = new Response("Team Content");
    const teamResponse = applyTeamMemberHeaders(response, "alice-admin");

    expect(teamResponse.headers.get("X-Team-Member")).toBe("alice-admin");
    expect(teamResponse.headers.get("X-Role")).toBe("admin");
    expect(teamResponse.headers.get("X-Permissions")).toContain("read");
    expect(teamResponse.headers.get("X-Permissions")).toContain("write");
    expect(teamResponse.headers.get("X-Permissions")).toContain("delete");
  });
});

describe("Edge Cases and Security Validation", () => {
  test("CSP validation handles edge cases", () => {
    // Empty CSP
    expect(validateCSP("")).toBe(true); // Empty is technically valid but useless

    // CSP with only whitespace
    expect(validateCSP("   ")).toBe(true);

    // CSP with valid complex patterns
    const complexValidCSP = "default-src 'self'; script-src 'self' https://cdn.example.com 'nonce-abc123'";
    expect(validateCSP(complexValidCSP)).toBe(true);

    // CSP with embedded dangerous content
    const embeddedDangerous = "default-src 'self'; img-src data:image/svg+xml,<svg onload=alert(1)>";
    expect(validateCSP(embeddedDangerous)).toBe(false);
  });

  test("Headers are immutable after application", async () => {
    const { applySecurityHeaders } = require("../middleware/applyHeaders");

    const response = new Response("Test");
    const secured = applySecurityHeaders(response);

    // Original response should be unchanged
    expect(response.headers.get("X-Frame-Options")).toBeNull();

    // Secured response should have headers
    expect(secured.headers.get("X-Frame-Options")).toBe("DENY");
  });

  test("Error responses include proper security headers", async () => {
    const { applyHeadersToError } = require("../middleware/applyHeaders");

    const errorResponse = applyHeadersToError(500, "Internal Server Error");

    expect(errorResponse.status).toBe(500);
    expect(errorResponse.headers.get("X-Frame-Options")).toBe("DENY");
    expect(errorResponse.headers.get("Content-Type")).toBe("application/json; charset=utf-8");

    // Check response body contains error details
    const body = await errorResponse.json();
    expect(body.error).toHaveProperty("code", 500);
    expect(body.error).toHaveProperty("message");
    expect(body.error).toHaveProperty("timestamp");
  });
});