// public/monitorWs.js - Browser-compatible WebSocket client
// This is a simplified version for the dashboard HTML

// Connection status tracking
let connectionStatus = 'disconnected';
let statusUpdateCallback = null;

// Update connection status and notify listeners
function updateConnectionStatus(status) {
  connectionStatus = status;
  if (statusUpdateCallback) {
    statusUpdateCallback(status);
  }

  // Update UI if elements exist
  const statusElement = document.getElementById('connection-status');
  const detailsElement = document.getElementById('connection-details');

  if (statusElement) {
    statusElement.className = `status-indicator ${status}`;
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }

  if (detailsElement) {
    switch (status) {
      case 'connecting':
        detailsElement.textContent = 'Attempting to connect';
        break;
      case 'connected':
        detailsElement.textContent = 'WebSocket active';
        break;
      case 'disconnected':
        detailsElement.textContent = 'Ready to connect';
        break;
      case 'error':
        detailsElement.textContent = 'Connection failed';
        break;
      default:
        detailsElement.textContent = 'Unknown status';
    }
  }
}

// Set callback for connection status updates
export function onConnectionStatusChange(callback) {
  statusUpdateCallback = callback;
}

// Get current connection status
export function getConnectionStatus() {
  return connectionStatus;
}

// Monitor WebSocket Client Class
export class MonitorWebSocket {
  constructor(endpoint = "/ws/metrics", protocols = ["mycelial-v1"]) {
    this.endpoint = endpoint;
    this.protocols = protocols;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      connectionTime: 0,
      reconnectAttempts: 0,
      lastHeartbeat: 0
    };
  }

  connect() {
    try {
      // Build WebSocket URL from current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = `${protocol}//${host}${this.endpoint}`;

      this.ws = new WebSocket(url, this.protocols);

      this.ws.onerror = (event) => this.handleError(event);
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);

      updateConnectionStatus('connecting');
    } catch (error) {
      console.error('Connection init failed:', error);
      this.attemptReconnect();
    }
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect
      this.ws.close(1000, "Intentional disconnect");
      this.ws = null;
    }

    updateConnectionStatus('disconnected');
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      const message = JSON.stringify(data);
      this.ws.send(message);
      this.metrics.messagesSent++;
      this.metrics.bytesSent += message.length;
      return true;
    } catch (error) {
      console.error('Send failed:', error);
      return false;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  handleOpen() {
    this.reconnectAttempts = 0;
    this.metrics.connectionTime = Date.now();
    updateConnectionStatus('connected');

    // Start heartbeat
    this.startHeartbeat();

    console.log('WebSocket connected');
  }

  handleMessage(event) {
    try {
      this.metrics.messagesReceived++;
      this.metrics.bytesReceived += event.data.length;
      this.metrics.lastHeartbeat = Date.now();

      const data = JSON.parse(event.data);

      // Dispatch to dashboard
      if (window.updateDashboardMetrics) {
        window.updateDashboardMetrics(data);
      }

    } catch (error) {
      console.error('Message parse failed:', error);
    }
  }

  handleError(event) {
    console.error('WebSocket error:', event);
    updateConnectionStatus('error');
    this.attemptReconnect();
  }

  handleClose(event) {
    console.log('WebSocket closed:', event.code, event.reason);
    updateConnectionStatus('disconnected');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Reconnect if not intentional close
    if (!event.wasClean && event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, 30000); // 30 seconds
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      updateConnectionStatus('failed');
      return;
    }

    this.reconnectAttempts++;
    this.metrics.reconnectAttempts++;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// Export singleton instance
export const monitorWs = new MonitorWebSocket();

// Auto-connect on page load
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Connect after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => monitorWs.connect());
  } else {
    monitorWs.connect();
  }
}