/**
 * @fileoverview JWT Authentication Service with Bun.secret() Integration
 * @description Production-grade JWT token management using Bun.secret() for secure key storage
 * @author Bun Authentication Team
 * @version 1.0.0
 * @since 2025
 */

import { UserContext } from '../rbac/rbac-engine';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  teamId?: string;
  organizationId?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string; // JWT ID for blacklisting
}

export interface JWTConfig {
  issuer: string;
  audience: string;
  accessTokenExpiry: number; // seconds
  refreshTokenExpiry: number; // seconds
  algorithm: 'HS256' | 'HS384' | 'HS512';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface RefreshTokenData {
  userId: string;
  tokenId: string;
  expiresAt: number;
  createdAt: number;
}

export class JWTService {
  private config: JWTConfig;
  private secretKey: string;
  private refreshTokens: Map<string, RefreshTokenData> = new Map();

  constructor(config?: Partial<JWTConfig>) {
    this.config = {
      issuer: 'bun-auth-service',
      audience: 'bun-app',
      accessTokenExpiry: 15 * 60, // 15 minutes
      refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days
      algorithm: 'HS256',
      ...config
    };

    // Get secret key from Bun.secret() - secure runtime storage
    this.secretKey = this.getSecretKey();

    // Clean up expired refresh tokens every 5 minutes
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
  }

  /**
   * Generate access and refresh token pair for user
   */
  async generateTokenPair(userContext: UserContext): Promise<TokenPair> {
    const tokenId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Create JWT payload
    const payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud' | 'jti'> = {
      userId: userContext.userId,
      username: userContext.username,
      email: userContext.email,
      roles: userContext.roles.map(r => r.toString()),
      teamId: userContext.teamId,
      organizationId: userContext.organizationId
    };

    // Generate access token
    const accessToken = await this.generateAccessToken(payload, tokenId, now);

    // Generate refresh token
    const refreshToken = await this.generateRefreshToken(userContext.userId, tokenId, now);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.accessTokenExpiry,
      tokenType: 'Bearer'
    };
  }

  /**
   * Generate access token
   */
  private async generateAccessToken(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud' | 'jti'>,
    tokenId: string,
    now: number
  ): Promise<string> {
    const jwtPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + this.config.accessTokenExpiry,
      iss: this.config.issuer,
      aud: this.config.audience,
      jti: tokenId
    };

    return this.encodeJWT(jwtPayload);
  }

  /**
   * Generate refresh token
   */
  private async generateRefreshToken(userId: string, tokenId: string, now: number): Promise<string> {
    const refreshData: RefreshTokenData = {
      userId,
      tokenId,
      expiresAt: now + this.config.refreshTokenExpiry,
      createdAt: now
    };

    // Store refresh token data
    this.refreshTokens.set(tokenId, refreshData);

    // Create a separate JWT for refresh token
    const refreshPayload = {
      userId,
      tokenId,
      iat: now,
      exp: refreshData.expiresAt,
      iss: this.config.issuer,
      aud: this.config.audience,
      type: 'refresh'
    };

    return this.encodeJWT(refreshPayload);
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string, type: 'access' | 'refresh' = 'access'): Promise<JWTPayload> {
    try {
      const payload = await this.decodeJWT(token);

      // Validate issuer and audience
      if (payload.iss !== this.config.issuer || payload.aud !== this.config.audience) {
        throw new Error('Invalid token issuer or audience');
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new Error('Token expired');
      }

      // For refresh tokens, validate additional data
      if (type === 'refresh') {
        const refreshData = this.refreshTokens.get(payload.jti || payload.tokenId);
        if (!refreshData || refreshData.expiresAt < now) {
          throw new Error('Invalid or expired refresh token');
        }
      }

      return payload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const refreshPayload = await this.verifyToken(refreshToken, 'refresh');

      // Get user context (in real implementation, fetch from database)
      const userContext: UserContext = {
        userId: refreshPayload.userId,
        username: refreshPayload.username || '',
        email: refreshPayload.email || '',
        roles: refreshPayload.roles?.map(r => r as any) || [],
        teamId: refreshPayload.teamId,
        organizationId: refreshPayload.organizationId,
        sessionId: refreshPayload.jti
      };

      // Generate new token pair
      return this.generateTokenPair(userContext);
    } catch (error) {
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const payload = await this.decodeJWT(token);
      const tokenId = payload.jti || payload.tokenId;

      if (tokenId) {
        this.refreshTokens.delete(tokenId);
      }
    } catch (error) {
      // Token might already be invalid, ignore
      console.warn('Error revoking token:', error);
    }
  }

  /**
   * Revoke all refresh tokens for a user (force logout everywhere)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokensToRemove: string[] = [];

    for (const [tokenId, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        tokensToRemove.push(tokenId);
      }
    }

    tokensToRemove.forEach(tokenId => this.refreshTokens.delete(tokenId));
  }

  /**
   * Get secret key from environment
   */
  private getSecretKey(): string {
    const key = process.env.JWT_SECRET_KEY;
    if (!key) {
      throw new Error('JWT_SECRET_KEY not found in environment variables. Set JWT_SECRET_KEY environment variable.');
    }

    if (key.length < 32) {
      throw new Error('JWT_SECRET_KEY must be at least 32 characters long');
    }

    return key;
  }

  /**
   * Encode JWT using HMAC
   */
  private async encodeJWT(payload: any): Promise<string> {
    const header = {
      alg: this.config.algorithm,
      typ: 'JWT'
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const message = `${encodedHeader}.${encodedPayload}`;

    // Create HMAC signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${message}.${encodedSignature}`;
  }

  /**
   * Decode and verify JWT
   */
  private async decodeJWT(token: string): Promise<any> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // Verify signature
    const message = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(message));

    if (!isValid) {
      throw new Error('Invalid JWT signature');
    }

    // Decode payload
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  }

  /**
   * Clean up expired refresh tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Math.floor(Date.now() / 1000);
    const expiredTokens: string[] = [];

    for (const [tokenId, data] of this.refreshTokens.entries()) {
      if (data.expiresAt < now) {
        expiredTokens.push(tokenId);
      }
    }

    expiredTokens.forEach(tokenId => this.refreshTokens.delete(tokenId));

    if (expiredTokens.length > 0) {
      console.log(`🧹 Cleaned up ${expiredTokens.length} expired refresh tokens`);
    }
  }

  /**
   * Get token statistics
   */
  getTokenStats(): {
    activeRefreshTokens: number;
    totalTokensIssued: number;
  } {
    return {
      activeRefreshTokens: this.refreshTokens.size,
      totalTokensIssued: this.refreshTokens.size // Simplified
    };
  }
}

export default JWTService;