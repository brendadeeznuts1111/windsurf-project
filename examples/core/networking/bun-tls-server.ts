#!/usr/bin/env bun

/**
 * @example-metadata
 * @category core/networking
 * @difficulty advanced
 * @prerequisites bun-serve-advanced.ts, bun-file-mime-demo.test.ts
 * @related-examples
 *   - bun-serve-advanced.ts (basic HTTP server with TLS support)
 *   - bun-http-session.ts (secure session management)
 *   - bun-cors-middleware.ts (security middleware)
 * @guides bun-tls-guide.md, bun-https-server.md, bun-ssl-certificates.md
 * @tests bun-tls-server-testing.test.ts
 * @benchmarks bun-tls-performance.bench.ts
 * @tags tls, ssl, https, security, certificates, encryption
 * @description Advanced TLS/HTTPS server with automatic certificate generation, HSTS, and security headers
 */

import { serve } from "bun";

// ============================================================================
// TLS CONFIGURATION & CERTIFICATES
// ============================================================================

interface TLSConfig {
  key?: string;           // Private key (PEM format)
  cert?: string;          // Certificate (PEM format)
  ca?: string;            // Certificate Authority (PEM format)
  passphrase?: string;    // Private key passphrase
  secureOptions?: number; // OpenSSL security options
  ciphers?: string;       // Allowed cipher suites
  minVersion?: string;    // Minimum TLS version ('TLSv1.2', 'TLSv1.3')
  maxVersion?: string;    // Maximum TLS version
  requestCert?: boolean;  // Request client certificate
  rejectUnauthorized?: boolean; // Reject unauthorized certificates
}

interface CertificateInfo {
  subject: {
    commonName: string;
    organizationName?: string;
    organizationalUnitName?: string;
    countryName?: string;
    stateOrProvinceName?: string;
    localityName?: string;
  };
  issuer: {
    commonName: string;
    organizationName?: string;
  };
  validity: {
    notBefore: Date;
    notAfter: Date;
  };
  serialNumber: string;
  fingerprint: string;
  publicKeyAlgorithm: string;
  signatureAlgorithm: string;
}

class CertificateManager {
  /**
   * Generate self-signed certificate for development
   */
  static async generateSelfSignedCertificate(options: {
    commonName: string;
    organizationName?: string;
    validityDays?: number;
    keySize?: number;
  }): Promise<{ key: string; cert: string }> {
    const {
      commonName,
      organizationName = 'Development',
      validityDays = 365,
      keySize = 2048
    } = options;

    // Generate private key
    const key = await this.generatePrivateKey(keySize);

    // Generate certificate
    const cert = await this.generateCertificate(key, {
      commonName,
      organizationName,
      validityDays
    });

    return { key, cert };
  }

  /**
   * Generate RSA private key
   */
  private static async generatePrivateKey(keySize: number): Promise<string> {
    // In a real implementation, this would use crypto APIs
    // For demo purposes, we'll create a mock key
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';

    // Generate mock key data (base64 encoded)
    const keyData = btoa('mock-private-key-data-' + Date.now() + '-' + Math.random());

    return `${header}\n${keyData}\n${footer}`;
  }

  /**
   * Generate self-signed certificate
   */
  private static async generateCertificate(privateKey: string, options: {
    commonName: string;
    organizationName: string;
    validityDays: number;
  }): Promise<string> {
    const { commonName, organizationName, validityDays } = options;
    const notBefore = new Date();
    const notAfter = new Date();
    notAfter.setDate(notAfter.getDate() + validityDays);

    const header = '-----BEGIN CERTIFICATE-----';
    const footer = '-----END CERTIFICATE-----';

    // Generate mock certificate data
    const certData = btoa(JSON.stringify({
      version: 3,
      serialNumber: Date.now().toString(),
      subject: {
        commonName,
        organizationName,
        organizationalUnitName: 'Development',
        countryName: 'US',
        stateOrProvinceName: 'CA',
        localityName: 'San Francisco'
      },
      issuer: {
        commonName,
        organizationName
      },
      validity: {
        notBefore: notBefore.toISOString(),
        notAfter: notAfter.toISOString()
      },
      publicKey: 'mock-public-key',
      signature: 'mock-signature'
    }));

    return `${header}\n${certData}\n${footer}`;
  }

  /**
   * Parse certificate information
   */
  static parseCertificate(certPem: string): CertificateInfo | null {
    try {
      // Remove PEM headers and decode
      const certData = certPem
        .replace(/-----BEGIN CERTIFICATE-----/, '')
        .replace(/-----END CERTIFICATE-----/, '')
        .replace(/\s/g, '');

      const decoded = JSON.parse(atob(certData));

      return {
        subject: decoded.subject,
        issuer: decoded.issuer,
        validity: {
          notBefore: new Date(decoded.validity.notBefore),
          notAfter: new Date(decoded.validity.notAfter)
        },
        serialNumber: decoded.serialNumber,
        fingerprint: 'mock-fingerprint',
        publicKeyAlgorithm: 'RSA',
        signatureAlgorithm: 'SHA256withRSA'
      };
    } catch (error) {
      console.error('Failed to parse certificate:', error);
      return null;
    }
  }

  /**
   * Check if certificate is valid
   */
  static isCertificateValid(certInfo: CertificateInfo): boolean {
    const now = new Date();
    return now >= certInfo.validity.notBefore && now <= certInfo.validity.notAfter;
  }

  /**
   * Get days until certificate expires
   */
  static getDaysUntilExpiry(certInfo: CertificateInfo): number {
    const now = new Date();
    const diffTime = certInfo.validity.notAfter.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// ============================================================================
// SECURITY HEADERS MIDDLEWARE
// ============================================================================

class SecurityHeadersMiddleware {
  private headers: Record<string, string>;

  constructor(options: {
    hsts?: boolean;
    hstsMaxAge?: number;
    hstsIncludeSubdomains?: boolean;
    hstsPreload?: boolean;
    contentSecurityPolicy?: string;
    xFrameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    xContentTypeOptions?: boolean;
    referrerPolicy?: string;
    permissionsPolicy?: string;
  } = {}) {
    this.headers = {};

    // HTTP Strict Transport Security (HSTS)
    if (options.hsts !== false) {
      const maxAge = options.hstsMaxAge || 31536000; // 1 year
      let hstsValue = `max-age=${maxAge}`;

      if (options.hstsIncludeSubdomains) {
        hstsValue += '; includeSubDomains';
      }

      if (options.hstsPreload) {
        hstsValue += '; preload';
      }

      this.headers['Strict-Transport-Security'] = hstsValue;
    }

    // Content Security Policy
    if (options.contentSecurityPolicy) {
      this.headers['Content-Security-Policy'] = options.contentSecurityPolicy;
    } else {
      // Default CSP for HTTPS
      this.headers['Content-Security-Policy'] =
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss:;";
    }

    // X-Frame-Options
    if (options.xFrameOptions) {
      this.headers['X-Frame-Options'] = options.xFrameOptions;
    } else {
      this.headers['X-Frame-Options'] = 'DENY';
    }

    // X-Content-Type-Options
    if (options.xContentTypeOptions !== false) {
      this.headers['X-Content-Type-Options'] = 'nosniff';
    }

    // Referrer-Policy
    if (options.referrerPolicy) {
      this.headers['Referrer-Policy'] = options.referrerPolicy;
    } else {
      this.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    }

    // Permissions-Policy
    if (options.permissionsPolicy) {
      this.headers['Permissions-Policy'] = options.permissionsPolicy;
    } else {
      this.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';
    }

    console.log('🛡️ Security Headers Middleware configured', {
      hsts: !!this.headers['Strict-Transport-Security'],
      csp: !!this.headers['Content-Security-Policy'],
      frameOptions: this.headers['X-Frame-Options'],
    });
  }

  /**
   * Apply security headers to response
   */
  applyHeaders(response: Response): Response {
    const newHeaders = new Headers(response.headers);

    for (const [key, value] of Object.entries(this.headers)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  /**
   * Get configured headers
   */
  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }
}

// ============================================================================
// TLS/HTTPS SERVER
// ============================================================================

export class TLSServer {
  private server?: ReturnType<typeof serve>;
  private tlsConfig: TLSConfig;
  private securityHeaders: SecurityHeadersMiddleware;
  private certificateInfo?: CertificateInfo;

  constructor(tlsConfig: TLSConfig = {}, securityOptions: any = {}) {
    this.tlsConfig = {
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',
      ...tlsConfig,
    };

    this.securityHeaders = new SecurityHeadersMiddleware(securityOptions);

    console.log('🔐 TLS Server initialized', {
      tlsVersion: `${this.tlsConfig.minVersion} - ${this.tlsConfig.maxVersion}`,
      hasCertificate: !!(this.tlsConfig.cert && this.tlsConfig.key),
      securityHeaders: Object.keys(this.securityHeaders.getHeaders()).length,
    });
  }

  /**
   * Generate and use self-signed certificate for development
   */
  async generateSelfSignedCertificate(options: {
    commonName: string;
    organizationName?: string;
    validityDays?: number;
  }): Promise<void> {
    console.log('🔑 Generating self-signed certificate...');

    const { key, cert } = await CertificateManager.generateSelfSignedCertificate(options);

    this.tlsConfig.key = key;
    this.tlsConfig.cert = cert;

    // Parse certificate info
    this.certificateInfo = CertificateManager.parseCertificate(cert) || undefined;

    if (this.certificateInfo) {
      console.log('✅ Certificate generated', {
        subject: this.certificateInfo.subject.commonName,
        validUntil: this.certificateInfo.validity.notAfter.toISOString(),
        daysValid: CertificateManager.getDaysUntilExpiry(this.certificateInfo),
      });
    }
  }

  /**
   * Load certificate from files
   */
  async loadCertificateFromFiles(keyPath: string, certPath: string, caPath?: string): Promise<void> {
    try {
      this.tlsConfig.key = await Bun.file(keyPath).text();
      this.tlsConfig.cert = await Bun.file(certPath).text();

      if (caPath) {
        this.tlsConfig.ca = await Bun.file(caPath).text();
      }

      // Parse certificate info
      if (this.tlsConfig.cert) {
        this.certificateInfo = CertificateManager.parseCertificate(this.tlsConfig.cert) || undefined;
      }

      console.log('✅ Certificate loaded from files', {
        keyPath,
        certPath,
        caPath,
        valid: this.certificateInfo ? CertificateManager.isCertificateValid(this.certificateInfo) : false,
      });
    } catch (error) {
      throw new Error(`Failed to load certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check certificate validity
   */
  checkCertificateValidity(): {
    valid: boolean;
    daysUntilExpiry?: number;
    info?: CertificateInfo;
  } {
    if (!this.certificateInfo) {
      return { valid: false };
    }

    const valid = CertificateManager.isCertificateValid(this.certificateInfo);
    const daysUntilExpiry = CertificateManager.getDaysUntilExpiry(this.certificateInfo);

    return {
      valid,
      daysUntilExpiry,
      info: this.certificateInfo,
    };
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    try {
      // Health check
      if (url.pathname === '/health' && method === 'GET') {
        const certStatus = this.checkCertificateValidity();

        return this.securityHeaders.applyHeaders(
          Response.json({
            status: 'healthy',
            tls: {
              enabled: true,
              version: `${this.tlsConfig.minVersion} - ${this.tlsConfig.maxVersion}`,
              certificate: certStatus.valid ? {
                subject: certStatus.info?.subject.commonName,
                validUntil: certStatus.info?.validity.notAfter.toISOString(),
                daysUntilExpiry: certStatus.daysUntilExpiry,
              } : null,
            },
            security: {
              headers: Object.keys(this.securityHeaders.getHeaders()),
              hsts: !!this.securityHeaders.getHeaders()['Strict-Transport-Security'],
              csp: !!this.securityHeaders.getHeaders()['Content-Security-Policy'],
            },
            timestamp: new Date().toISOString(),
          })
        );
      }

      // Certificate info endpoint
      if (url.pathname === '/cert-info' && method === 'GET') {
        const certStatus = this.checkCertificateValidity();

        if (!certStatus.valid || !certStatus.info) {
          return this.securityHeaders.applyHeaders(
            Response.json(
              { error: 'Certificate not available or invalid' },
              { status: 500 }
            )
          );
        }

        return this.securityHeaders.applyHeaders(
          Response.json({
            certificate: {
              subject: certStatus.info.subject,
              issuer: certStatus.info.issuer,
              validity: {
                notBefore: certStatus.info.validity.notBefore.toISOString(),
                notAfter: certStatus.info.validity.notAfter.toISOString(),
              },
              serialNumber: certStatus.info.serialNumber,
              fingerprint: certStatus.info.fingerprint,
              algorithms: {
                publicKey: certStatus.info.publicKeyAlgorithm,
                signature: certStatus.info.signatureAlgorithm,
              },
              daysUntilExpiry: certStatus.daysUntilExpiry,
              isValid: certStatus.valid,
            },
            tls: {
              minVersion: this.tlsConfig.minVersion,
              maxVersion: this.tlsConfig.maxVersion,
              ciphers: this.tlsConfig.ciphers,
            },
          })
        );
      }

      // Security headers test
      if (url.pathname === '/security-test' && method === 'GET') {
        const testResponse = Response.json({
          message: 'Security headers test',
          tls: {
            protocol: 'TLSv1.3', // Mock - would be actual in production
            cipher: 'ECDHE-RSA-AES256-GCM-SHA384', // Mock
          },
          security: {
            hsts: true,
            csp: true,
            xFrameOptions: 'DENY',
            xContentTypeOptions: 'nosniff',
          },
          timestamp: new Date().toISOString(),
        });

        return this.securityHeaders.applyHeaders(testResponse);
      }

      // API endpoint with security
      if (url.pathname === '/api/secure' && method === 'GET') {
        // Check if request is over HTTPS
        const isSecure = request.url.startsWith('https://') ||
                        request.headers.get('x-forwarded-proto') === 'https';

        if (!isSecure) {
          return this.securityHeaders.applyHeaders(
            Response.json(
              { error: 'HTTPS required' },
              { status: 403 }
            )
          );
        }

        return this.securityHeaders.applyHeaders(
          Response.json({
            message: 'Secure API endpoint accessed over HTTPS',
            protocol: isSecure ? 'HTTPS' : 'HTTP',
            tls: {
              enabled: true,
              secure: isSecure,
            },
            headers: {
              userAgent: request.headers.get('User-Agent'),
              accept: request.headers.get('Accept'),
              acceptLanguage: request.headers.get('Accept-Language'),
            },
            timestamp: new Date().toISOString(),
          })
        );
      }

      // WebSocket upgrade (secure)
      if (url.pathname === '/wss' && request.headers.get('upgrade') === 'websocket') {
        // In a real implementation, this would upgrade to WSS
        return new Response('WebSocket upgrade not implemented in demo', { status: 501 });
      }

      // 404 for unknown routes
      return this.securityHeaders.applyHeaders(
        Response.json(
          { error: 'Endpoint not found' },
          { status: 404 }
        )
      );

    } catch (error) {
      console.error('Request error:', error);
      return this.securityHeaders.applyHeaders(
        Response.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      );
    }
  }

  start(port: number = 3443): void {
    if (!this.tlsConfig.key || !this.tlsConfig.cert) {
      throw new Error('TLS certificate and key are required. Use generateSelfSignedCertificate() or loadCertificateFromFiles() first.');
    }

    // Note: In Bun, TLS configuration is handled differently
    // This is a demonstration of how TLS would be configured
    console.log('🔐 Starting TLS Server...');
    console.log('⚠️  Note: This demo shows TLS configuration but runs on HTTP for compatibility');
    console.log('   In production, Bun would handle actual TLS termination');

    this.server = serve({
      port,
      hostname: 'localhost',
      fetch: this.handleRequest.bind(this),
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });

    console.log(`🔒 TLS Demo Server running at http://localhost:${port} (simulating HTTPS)`);
    console.log('\n📋 Available Endpoints:');
    console.log('  GET  /health              - Health check with TLS status');
    console.log('  GET  /cert-info           - Certificate information');
    console.log('  GET  /security-test       - Security headers test');
    console.log('  GET  /api/secure          - Secure API endpoint');
    console.log('\n🔐 TLS Configuration:');
    console.log('  • Certificate: Self-signed (development)');
    console.log('  • TLS Version: 1.2 - 1.3');
    console.log('  • Security Headers: HSTS, CSP, X-Frame-Options');
    console.log('  • Cipher Suites: ECDHE-RSA-AES128-GCM-SHA256');
    console.log('\n🛡️ Security Features:');
    console.log('  • HTTP Strict Transport Security (HSTS)');
    console.log('  • Content Security Policy (CSP)');
    console.log('  • X-Frame-Options: DENY');
    console.log('  • X-Content-Type-Options: nosniff');
    console.log('  • Referrer Policy: strict-origin-when-cross-origin');
    console.log('  • Permissions Policy: restrictive defaults');
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      console.log('🛑 TLS Server stopped');
    }
  }

  getTLSConfig(): TLSConfig {
    return { ...this.tlsConfig };
  }

  getSecurityHeaders(): Record<string, string> {
    return this.securityHeaders.getHeaders();
  }
}

// ============================================================================
// DEMO EXECUTION
// ============================================================================

if (import.meta.main) {
  const tlsServer = new TLSServer();

  // Generate self-signed certificate
  await tlsServer.generateSelfSignedCertificate({
    commonName: 'localhost',
    organizationName: 'Bun TLS Demo',
    validityDays: 365,
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    tlsServer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    tlsServer.stop();
    process.exit(0);
  });

  tlsServer.start();
}

export { CertificateManager, SecurityHeadersMiddleware };
export type { TLSConfig, CertificateInfo };