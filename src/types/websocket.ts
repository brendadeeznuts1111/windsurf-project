/**
 * SPEC: WebSocket Type Definitions
 * Aligns with W3C WebSocket API + Bun extensions
 */

export interface WsErrorEvent extends Event {
  readonly message?: string;
  readonly error?: Error;
  readonly code?: number;
}

export interface WsCloseEvent extends CloseEvent {
  readonly code: number;
  readonly reason: string;
  readonly wasClean: boolean;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'failed';

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
  sequence?: number;
}

export interface WebSocketMetrics {
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  connectionTime: number;
  reconnectAttempts: number;
  lastHeartbeat: number;
}

export interface WebSocketConfig {
  endpoint: string;
  protocols?: string[];
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  timeout?: number;
}