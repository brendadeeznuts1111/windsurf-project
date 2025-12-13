/**
 * SPEC: Error Sanitization for Client-Side Logging
 * Must redact: Authorization tokens, session IDs, PII
 */

import type { WsErrorEvent } from "../types/websocket";

export function sanitizeWsError(error: unknown): Record<string, unknown> {
  const redacted = '[REDACTED]';

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message, // Messages are generally safe
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      // Never log: error.cause if it contains request data
    };
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    return {
      type: obj.type || 'UnknownError',
      // Redact sensitive properties
      url: obj.url ? '[URL_REDACTED]' : undefined,
      headers: obj.headers ? '[HEADERS_REDACTED]' : undefined,
      data: obj.data ? '[DATA_REDACTED]' : undefined,
      // Keep safe properties
      message: obj.message,
      code: obj.code,
      timestamp: obj.timestamp
    };
  }

  return { error: String(error) };
}

/**
 * Sanitize WebSocket error event for logging
 */
export function sanitizeWebSocketError(event: WsErrorEvent): Record<string, unknown> {
  return {
    type: 'WebSocketError',
    message: event.message || 'Unknown WebSocket error',
    code: event.code,
    timestamp: Date.now(),
    // Never log: connection details, auth tokens, etc.
  };
}

/**
 * Check if error contains sensitive information
 */
export function containsSensitiveData(error: unknown): boolean {
  if (typeof error === 'string') {
    const sensitive = ['token', 'password', 'secret', 'key', 'auth'];
    return sensitive.some(word => error.toLowerCase().includes(word));
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    return Object.keys(obj).some(key =>
      ['token', 'password', 'secret', 'key', 'auth', 'authorization'].includes(key.toLowerCase())
    );
  }

  return false;
}

/**
 * Safe error message extraction
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return containsSensitiveData(error) ? '[REDACTED]' : error;
  }

  return 'Unknown error';
}