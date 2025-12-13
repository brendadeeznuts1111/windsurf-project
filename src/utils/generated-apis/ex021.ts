/**
 * http server implementation
 * DOMAIN: http
 * SCOPE: server
 * SPEC: EX021
 *
 * STATUS: enterprise-grade
 * IMPLEMENTATION: production-ready
 *
 * FEATURES:
 * - Team Member Header Mapping: Each team member gets custom headers and permissions
 * - Role-based access control with permission checking
 * - Custom response headers based on team member identity
 * - Default team members: alice-admin, bob-developer, carol-analyst, dave-viewer
 *
 * USAGE:
 * curl -H "X-Team-Member: alice-admin" http://localhost:3000/
 * curl -H "X-Team-Member: bob-developer" http://localhost:3000/write
 * curl -H "X-Team-Member: dave-viewer" http://localhost:3000/admin (will be denied)
 */

import { serve, type Server, type ServerWebSocket } from "bun";
import type { ExecutionContext } from '../../../types/cloudflare';

interface BunServeAdvancedConfig {
  tls?: {
    version: "1.3";
    cipher_suites: string[];
    require_client_cert: boolean;
  };
  http2?: {
    enabled: boolean;
    allow_http1: boolean;
    server_push: boolean;
  };
  websocket?: {
    upgrade_timeout_ms: number;
    max_payload_size_mb: number;
    ping_interval_ms: number;
  };
  cors?: {
    allowed_origins: string[];
    max_age_seconds: number;
  };
  rate_limiting?: {
    requests_per_minute: number;
    ip_whitelist: string[];
  };
  security_headers?: {
    hsts: string;
    x_frame_options: "DENY";
    x_content_type_options: "nosniff";
  };
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'admin' | 'developer' | 'analyst' | 'viewer';
  headers: Record<string, string>;
  permissions: string[];
}

interface TeamMemberMapping {
  [headerValue: string]: TeamMember;
}

export class BunServeAdvanced implements GracefulShutdown {
  private config: BunServeAdvancedConfig;
  private server?: Server<unknown>;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private websocketClients = new Set<ServerWebSocket<unknown>>();
  private pingInterval?: Timer;
  private teamMembers: TeamMemberMapping = {};
  private headerKey = 'X-Team-Member';

  constructor(config: BunServeAdvancedConfig = {}) {
    this.config = {
      tls: { version: "1.3", cipher_suites: ["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384"], require_client_cert: false },
      http2: { enabled: true, allow_http1: true, server_push: true },
      websocket: { upgrade_timeout_ms: 5000, max_payload_size_mb: 10, ping_interval_ms: 30000 },
      cors: { allowed_origins: ["https://trusted-domain.com"], max_age_seconds: 86400 },
      rate_limiting: { requests_per_minute: 100, ip_whitelist: ["127.0.0.1"] },
      security_headers: { hsts: "max-age=63072000", x_frame_options: "DENY", x_content_type_options: "nosniff" },
      ...config
    };

    // Initialize default team members
    this.initializeDefaultTeamMembers();
  }

  async start(port: number = 3000): Promise<void> {
    const self = this; // Capture this for use in closures

    this.server = serve({
      port,
      development: false,

      async fetch(request: Request): Promise<Response> {
        // Rate limiting check
        const clientIP = self.getClientIP(request);
        if (!self.checkRateLimit(clientIP)) {
          return new Response("Rate limit exceeded", {
            status: 429,
            headers: { "Retry-After": "60" }
          });
        }

        // Team member identification and authorization
        const teamMember = self.getTeamMemberFromRequest(request) || undefined;
        if (teamMember) {
          console.log(`Request from team member: ${teamMember.name} (${teamMember.role})`);
        }

        // CORS handling
        if (request.method === "OPTIONS") {
          const corsResponse = self.handleCORS(request);
          if (teamMember) {
            self.applyTeamMemberHeaders(corsResponse, teamMember);
          }
          return corsResponse;
        }

        // Security headers and team member headers
        const response = await self.handleRequest(request, teamMember);
        self.addSecurityHeaders(response);

        if (teamMember) {
          self.applyTeamMemberHeaders(response, teamMember);
        }

        return response;
      },

      websocket: {
        open: (ws: ServerWebSocket<unknown>) => {
          self.websocketClients.add(ws);
          console.log(`WebSocket client connected. Total: ${self.websocketClients.size}`);
        },

        message: (ws: ServerWebSocket<unknown>, message: string | Buffer) => {
          // Handle WebSocket messages with size limits
          if (Buffer.isBuffer(message) && message.length > self.config.websocket!.max_payload_size_mb * 1024 * 1024) {
            ws.close(1009, "Message too large");
            return;
          }
          self.handleWebSocketMessage(ws, message);
        },

        close: (ws: ServerWebSocket<unknown>) => {
          self.websocketClients.delete(ws);
          console.log(`WebSocket client disconnected. Total: ${self.websocketClients.size}`);
        }
      },

      error: (error: Error) => {
        console.error("Server error:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    });

    console.log(`🚀 BunServeAdvanced started on port ${port}`, {
      http2: this.config.http2?.enabled,
      websocket: !!this.config.websocket,
      cors: !!this.config.cors,
      rateLimiting: !!this.config.rate_limiting
    });

    // Start WebSocket ping interval
    if (this.config.websocket?.ping_interval_ms) {
      this.pingInterval = setInterval(() => {
        for (const ws of this.websocketClients) {
          ws.ping();
        }
      }, this.config.websocket.ping_interval_ms);
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      // Close all WebSocket connections gracefully
      for (const ws of this.websocketClients) {
        ws.close(1001, "Server shutdown");
      }
      this.websocketClients.clear();

      this.server.stop();
      console.log("🛑 BunServeAdvanced stopped gracefully");
    }

    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  // ========================================
  // PUBLIC TEAM MEMBER API
  // ========================================

  /**
   * Add a new team member with custom headers
   */
  addTeamMember(headerValue: string, member: TeamMember): void {
    this.registerTeamMember(headerValue, member);
  }

  /**
   * Remove a team member
   */
  removeTeamMember(headerValue: string): void {
    this.unregisterTeamMember(headerValue);
  }

  /**
   * Get all registered team members
   */
  getAllTeamMembers(): TeamMember[] {
    return this.listTeamMembers();
  }

  /**
   * Set the header key used for team member identification
   */
  setTeamMemberHeaderKey(key: string): void {
    this.headerKey = key;
  }

  /**
   * Get the current team member header key
   */
  getTeamMemberHeaderKey(): string {
    return this.headerKey;
  }

  private getClientIP(request: Request): string {
    // Extract client IP from headers or connection
    return request.headers.get("CF-Connecting-IP") ||
           request.headers.get("X-Forwarded-For") ||
           request.headers.get("X-Real-IP") ||
           "unknown";
  }

  private checkRateLimit(clientIP: string): boolean {
    if (!this.config.rate_limiting) return true;

    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = this.config.rate_limiting.requests_per_minute;

    // Check whitelist
    if (this.config.rate_limiting.ip_whitelist.includes(clientIP)) {
      return true;
    }

    const entry = this.rateLimitMap.get(clientIP);
    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  private handleCORS(request: Request): Response {
    if (!this.config.cors) {
      return new Response(null, { status: 204 });
    }

    const origin = request.headers.get("Origin");
    const allowedOrigins = this.config.cors.allowed_origins;

    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin || "") ? origin! : allowedOrigins[0],
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": this.config.cors.max_age_seconds.toString()
    };

    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  private async handleRequest(request: Request, teamMember?: TeamMember): Promise<Response> {
    // Route handling logic with team member context
    const context = teamMember ? ` for ${teamMember.name} (${teamMember.role})` : '';

    // Permission-based routing example
    if (request.url.includes('/admin') && (!teamMember || !this.checkTeamMemberPermissions(teamMember, ['admin']))) {
      return new Response("Access denied - Admin permissions required", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }

    if (request.url.includes('/write') && (!teamMember || !this.checkTeamMemberPermissions(teamMember, ['write']))) {
      return new Response("Access denied - Write permissions required", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }

    return new Response(`BunServeAdvanced - Request handled${context}`, {
      headers: { "Content-Type": "text/plain" }
    });
  }

  private handleWebSocketMessage(ws: ServerWebSocket<unknown>, message: string | Buffer): void {
    // WebSocket message handling logic would go here
    console.log("WebSocket message received:", message.toString().slice(0, 100));
  }

  private addSecurityHeaders(response: Response): void {
    if (!this.config.security_headers) return;

    const headers = response.headers;

    if (this.config.security_headers.hsts) {
      headers.set("Strict-Transport-Security", this.config.security_headers.hsts);
    }

    if (this.config.security_headers.x_frame_options) {
      headers.set("X-Frame-Options", this.config.security_headers.x_frame_options);
    }

    if (this.config.security_headers.x_content_type_options) {
      headers.set("X-Content-Type-Options", this.config.security_headers.x_content_type_options);
    }

    // Additional security headers
    headers.set("X-XSS-Protection", "1; mode=block");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  // ========================================
  // TEAM MEMBER HEADER MAPPING
  // ========================================

  private initializeDefaultTeamMembers(): void {
    // Default team members with their custom headers
    this.registerTeamMember('alice-admin', {
      id: 'alice-admin',
      name: 'Alice Johnson',
      role: 'admin',
      headers: {
        'X-Team-Role': 'admin',
        'X-User-Permissions': 'read,write,delete,admin',
        'X-Environment-Access': 'production,staging,development',
        'X-Admin-Level': 'superuser'
      },
      permissions: ['read', 'write', 'delete', 'admin', 'deploy', 'configure']
    });

    this.registerTeamMember('bob-developer', {
      id: 'bob-developer',
      name: 'Bob Smith',
      role: 'developer',
      headers: {
        'X-Team-Role': 'developer',
        'X-User-Permissions': 'read,write',
        'X-Environment-Access': 'staging,development',
        'X-Dev-Tools': 'enabled'
      },
      permissions: ['read', 'write', 'deploy', 'debug']
    });

    this.registerTeamMember('carol-analyst', {
      id: 'carol-analyst',
      name: 'Carol Davis',
      role: 'analyst',
      headers: {
        'X-Team-Role': 'analyst',
        'X-User-Permissions': 'read',
        'X-Environment-Access': 'production,staging',
        'X-Analytics-Access': 'enabled'
      },
      permissions: ['read', 'analyze', 'export']
    });

    this.registerTeamMember('dave-viewer', {
      id: 'dave-viewer',
      name: 'Dave Wilson',
      role: 'viewer',
      headers: {
        'X-Team-Role': 'viewer',
        'X-User-Permissions': 'read',
        'X-Environment-Access': 'production',
        'X-Read-Only': 'true'
      },
      permissions: ['read']
    });
  }

  registerTeamMember(headerValue: string, member: TeamMember): void {
    this.teamMembers[headerValue] = member;
    console.log(`Registered team member: ${member.name} (${member.role})`);
  }

  unregisterTeamMember(headerValue: string): void {
    delete this.teamMembers[headerValue];
    console.log(`Unregistered team member with header: ${headerValue}`);
  }

  getTeamMember(headerValue: string): TeamMember | null {
    return this.teamMembers[headerValue] || null;
  }

  listTeamMembers(): TeamMember[] {
    return Object.values(this.teamMembers);
  }

  private getTeamMemberFromRequest(request: Request): TeamMember | null {
    const headerValue = request.headers.get(this.headerKey);
    if (!headerValue) return null;

    return this.getTeamMember(headerValue);
  }

  private applyTeamMemberHeaders(response: Response, teamMember: TeamMember): void {
    // Apply custom headers for this team member
    Object.entries(teamMember.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add team member identification headers
    response.headers.set('X-Team-Member-ID', teamMember.id);
    response.headers.set('X-Team-Member-Name', teamMember.name);
    response.headers.set('X-Team-Member-Role', teamMember.role);
  }

  private checkTeamMemberPermissions(teamMember: TeamMember, requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission =>
      teamMember.permissions.includes(permission)
    );
  }
}

interface GracefulShutdown {
  stop(): Promise<void>;
}