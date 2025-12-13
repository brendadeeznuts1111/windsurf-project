/**
 * SPEC: WebSocket Client for Real-time Monitoring Dashboard
 * Production-ready implementation with comprehensive error handling
 */

import { WsErrorEvent, ConnectionStatus, WebSocketMessage, WebSocketMetrics, WebSocketConfig } from "../types/websocket";
import { sanitizeWsError, sanitizeWebSocketError, getSafeErrorMessage } from "../utils/sanitize";

// Browser environment declarations
declare const window: any;
declare const document: any;

// Global connection status tracking
let connectionStatus: ConnectionStatus = 'disconnected';
let statusUpdateCallback: ((status: ConnectionStatus) => void) | null = null;

/**
 * Update connection status and notify listeners
 */
function updateConnectionStatus(status: ConnectionStatus): void {
  connectionStatus = status;
  if (statusUpdateCallback) {
    statusUpdateCallback(status);
  }
}

/**
 * Set callback for connection status updates
 */
export function onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
  statusUpdateCallback = callback;
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

/**
 * Monitor WebSocket Client Class
 * Implements production-ready WebSocket connection with error handling
 */
export class MonitorWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms
  private heartbeatInterval?: NodeJS.Timeout;
  private metrics: WebSocketMetrics = {
    messagesSent: 0,
    messagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    connectionTime: 0,
    reconnectAttempts: 0,
    lastHeartbeat: 0
  };

  constructor(
    private endpoint: string = "/ws/metrics",
    private protocols: string[] = ["mycelial-v1"],
    private config: Partial<WebSocketConfig> = {}
  ) {
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
    this.reconnectDelay = config.reconnectDelay ?? 1000;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    try {
      // Build WebSocket URL from current location
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3001';
      const url = `${protocol}//${host}${this.endpoint}`;

      this.ws = new WebSocket(url, this.protocols);

      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);

      updateConnectionStatus('connecting');
    } catch (error) {
      this.logError('CONNECTION_INIT_FAILED', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect
      this.ws.close(1000, "Intentional disconnect");
      this.ws = null;
    }

    updateConnectionStatus('disconnected');
  }

  /**
   * Send message to server
   */
  send(data: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logError('SEND_FAILED', { reason: 'WebSocket not connected' });
      return false;
    }

    try {
      const message = JSON.stringify(data);
      this.ws.send(message);
      this.metrics.messagesSent++;
      this.metrics.bytesSent += message.length;
      return true;
    } catch (error) {
      this.logError('SEND_FAILED', error);
      return false;
    }
  }

  /**
   * Get connection metrics
   */
  getMetrics(): WebSocketMetrics {
    return { ...this.metrics };
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.metrics.connectionTime = Date.now();
    updateConnectionStatus('connected');

    // Start heartbeat
    this.startHeartbeat();

    this.logError('CONNECTED', {
      protocols: this.ws?.protocol,
      extensions: this.ws?.extensions
    });
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      this.metrics.messagesReceived++;
      this.metrics.bytesReceived += event.data.length;
      this.metrics.lastHeartbeat = Date.now();

      const data = JSON.parse(event.data) as WebSocketMessage;

      // Dispatch to appropriate handlers based on message type
      this.handleIncomingMessage(data);

    } catch (error) {
      this.logError('MESSAGE_PARSE_FAILED', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleIncomingMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'metrics':
        this.handleMetricsUpdate(message.data);
        break;
      case 'heartbeat':
        // Heartbeat received - connection is alive
        break;
      case 'error':
        this.logError('SERVER_ERROR', message.data);
        break;
      default:
        this.logError('UNKNOWN_MESSAGE_TYPE', { type: message.type });
    }
  }

  /**
   * Handle metrics update from server
   */
  private handleMetricsUpdate(data: unknown): void {
    // Dispatch metrics to dashboard
    if (typeof window !== 'undefined' && window.updateDashboardMetrics) {
      window.updateDashboardMetrics(data);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: WsErrorEvent): void {
    const sanitizedError = sanitizeWebSocketError(event);
    this.logError('WS_ERROR', sanitizedError);
    updateConnectionStatus('error');
    this.attemptReconnect();
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.logError('WS_CLOSED', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });

    updateConnectionStatus('disconnected');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    // Reconnect if not intentional close
    if (!event.wasClean && event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logError('WS_MAX_RECONNECT', {
        attempts: this.maxReconnectAttempts
      });
      updateConnectionStatus('failed');
      return;
    }

    this.reconnectAttempts++;
    this.metrics.reconnectAttempts++;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.logError('WS_RECONNECTING', {
      attempt: this.reconnectAttempts,
      delay: delay
    });

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Log error with sanitization
   */
  private logError(code: string, data: unknown): void {
    const sanitizedData = sanitizeWsError(data);

    // Production: Send to error tracking service (Sentry, etc.)
    // Development: Console with sanitized output
    if (process.env.NODE_ENV === 'development') {
      console.error(`[MonitorWS] ${code}:`, JSON.stringify(sanitizedData, null, 2));
    }

    // In production, use Bun's logging:
    // Bun.stderr.write(`[ERROR] ${code}: ${JSON.stringify(sanitizedData)}\n`);
  }
}

// Export singleton instance
export const monitorWs = new MonitorWebSocket();

// Auto-connect on module load (client-side only)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Connect after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => monitorWs.connect());
  } else {
    monitorWs.connect();
  }
}