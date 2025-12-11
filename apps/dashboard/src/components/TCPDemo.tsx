/**
 * @fileoverview TCP API Demo Component
 * @description Interactive demonstration of Bun's high-performance TCP networking capabilities
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link MarketTelemetryDemo} - Market data telemetry with networking integration
 * @see {@link BunV13Demo} - Bun v1.3 socket information and stream processing
 * @see {@link FetchDemo} - HTTP networking comparison and contrast
 * @see {@link BunFileAPIDocs} - File I/O operations that complement networking
 * @see {@link Bun.listen} - Bun's TCP server API reference
 * @see {@link Bun.connect} - Bun's TCP client API reference
 */

import React, { useState, useRef, useEffect } from 'react';
import './tcp-demo.css';
import { NETWORK_CONSTANTS, TIMING_CONSTANTS } from '../constants';

/**
 * TCP operation data structure for display and tracking
 * @interface TCPOperation
 * @property {string} id - Unique operation identifier
 * @property {string} type - Operation type (server_start, connecting, send, receive, etc.)
 * @property {'client' | 'server'} direction - Whether operation is from client or server perspective
 * @property {'connecting' | 'connected' | 'sending' | 'receiving' | 'closed' | 'error'} status - Current operation status
 * @property {any} data - Operation-specific data (message content, connection info, etc.)
 * @property {number} timestamp - Operation timestamp in milliseconds
 * @property {number} [latency] - Operation latency in milliseconds (for data operations)
 */
interface TCPOperation {
  id: string;
  type: string;
  direction: 'client' | 'server';
  status: 'connecting' | 'connected' | 'sending' | 'receiving' | 'closed' | 'error';
  data: any;
  timestamp: number;
  latency?: number;
}

/**
 * TCP connection data structure
 * @interface TCPConnection
 * @property {string} id - Unique connection identifier
 * @property {'client' | 'server'} type - Connection type
 * @property {string} hostname - Target hostname for connection
 * @property {number} port - Target port for connection
 * @property {'disconnected' | 'connecting' | 'connected' | 'listening'} status - Connection status
 * @property {any} [socket] - Socket instance (mock implementation)
 * @property {TCPOperation[]} operations - Array of operations performed on this connection
 */
interface TCPConnection {
  id: string;
  type: 'client' | 'server';
  hostname: string;
  port: number;
  status: 'disconnected' | 'connecting' | 'connected' | 'listening';
  socket?: any;
  operations: TCPOperation[];
}

// Enhanced Mock TCP implementation for browser demo
class MockTCPDemo {
  private connections = new Map<string, TCPConnection>();
  private operationId = 0;
  private messageQueue = new Map<string, Array<{data: string, timestamp: number}>>();
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>();

  createServer(hostname: string, port: number): TCPConnection {
    const id = `server_${Date.now()}`;
    const connection: TCPConnection = {
      id,
      type: 'server',
      hostname,
      port,
      status: 'listening',
      operations: []
    };

    this.connections.set(id, connection);
    this.messageQueue.set(id, []);

    // Simulate server starting
    setTimeout(() => {
      this.addOperation(connection, 'server_start', 'server', { message: 'TCP server listening' });

      // Start heartbeat monitoring for server
      this.startHeartbeat(connection.id, 'server');
    }, 100);

    return connection;
  }

  connectClient(hostname: string, port: number): Promise<TCPConnection> {
    return new Promise((resolve, reject) => {
      const id = `client_${Date.now()}`;
      const connection: TCPConnection = {
        id,
        type: 'client',
        hostname,
        port,
        status: 'connecting',
        operations: []
      };

      this.connections.set(id, connection);
      this.messageQueue.set(id, []);
      this.addOperation(connection, 'connecting', 'client', { message: 'Connecting to server...' });

      // Simulate connection with possible failure
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          connection.status = 'connected';
          this.addOperation(connection, 'connected', 'client', { message: 'Connected successfully' });

          // Start heartbeat monitoring for client
          this.startHeartbeat(connection.id, 'client');

          resolve(connection);
        } else {
          connection.status = 'disconnected';
          this.addOperation(connection, 'error', 'client', { message: 'Connection failed - network timeout' });
          reject(new Error('Connection failed'));
        }
      }, 300 + Math.random() * 700); // 300-1000ms connection time
    });
  }

  sendData(connection: TCPConnection, data: string): void {
    const queue = this.messageQueue.get(connection.id) || [];
    const message = { data, timestamp: Date.now() };

    // Simulate backpressure - queue messages if connection is slow
    if (queue.length > 5) {
      this.addOperation(connection, 'backpressure', connection.type, {
        message: 'Message queued due to backpressure',
        queueLength: queue.length
      });
    }

    queue.push(message);
    this.messageQueue.set(connection.id, queue);

    this.addOperation(connection, 'send', connection.type, {
      data,
      bytes: data.length,
      message: `Sent ${data.length} bytes`
    });

    // Process message queue
    this.processMessageQueue(connection);
  }

  private processMessageQueue(connection: TCPConnection): void {
    const queue = this.messageQueue.get(connection.id) || [];
    if (queue.length === 0 || connection.status !== 'connected') return;

    const message = queue.shift();
    if (!message) return;

    // Simulate network latency and processing
    const latency = 50 + Math.random() * 150; // 50-200ms

    setTimeout(() => {
      if (connection.type === 'client') {
        // Simulate server echo response
        this.receiveData(connection, `Echo: ${message.data}`);
      } else {
        // Server broadcasts to all connected clients
        this.broadcastToClients(connection, message.data);
      }
    }, latency);

    this.messageQueue.set(connection.id, queue);
  }

  private broadcastToClients(serverConnection: TCPConnection, data: string): void {
    // Find all connected clients and simulate receiving the message
    const clients = Array.from(this.connections.values())
      .filter(conn => conn.type === 'client' && conn.status === 'connected');

    clients.forEach(client => {
      setTimeout(() => {
        this.receiveData(client, `Broadcast from server: ${data}`);
      }, Math.random() * 100); // Staggered delivery
    });
  }

  private startHeartbeat(connectionId: string, type: 'client' | 'server'): void {
    const interval = setInterval(() => {
      const connection = this.connections.get(connectionId);
      if (!connection || connection.status !== 'connected' && connection.status !== 'listening') {
        this.stopHeartbeat(connectionId);
        return;
      }

      // Simulate heartbeat
      this.addOperation(connection, 'heartbeat', type, {
        message: 'Heartbeat sent',
        timestamp: Date.now()
      });

      // Occasionally simulate heartbeat response
      if (Math.random() > 0.7) {
        setTimeout(() => {
          const conn = this.connections.get(connectionId);
          if (conn) {
            this.addOperation(conn, 'heartbeat_ack', type, {
              message: 'Heartbeat acknowledged',
              latency: Math.floor(Math.random() * 20) + 5
            });
          }
        }, 10 + Math.random() * 30);
      }
    }, TIMING_CONSTANTS.THREE_SECONDS); // Every 3 seconds

    this.heartbeatIntervals.set(connectionId, interval);
  }

  private stopHeartbeat(connectionId: string): void {
    const interval = this.heartbeatIntervals.get(connectionId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(connectionId);
    }
  }

  receiveData(connection: TCPConnection, data: string): void {
    this.addOperation(connection, 'receive', connection.type, {
      data,
      bytes: data.length,
      message: `Received ${data.length} bytes`
    });
  }

  closeConnection(connection: TCPConnection): void {
    connection.status = 'disconnected';
    this.addOperation(connection, 'close', connection.type, { message: 'Connection closed' });

    // Clean up resources
    this.stopHeartbeat(connection.id);
    this.messageQueue.delete(connection.id);

    // Notify other connections if this was a server
    if (connection.type === 'server') {
      const clients = Array.from(this.connections.values())
        .filter(conn => conn.type === 'client' && conn.status === 'connected');

      clients.forEach(client => {
        setTimeout(() => {
          this.receiveData(client, 'Server disconnected');
          client.status = 'disconnected';
          this.addOperation(client, 'server_disconnect', 'client', { message: 'Server disconnected' });
          this.stopHeartbeat(client.id);
        }, Math.random() * 200);
      });
    }
  }

  private addOperation(connection: TCPConnection, type: string, direction: 'client' | 'server', data: any): void {
    const operation: TCPOperation = {
      id: `op_${++this.operationId}`,
      type,
      direction,
      status: type === 'error' ? 'error' : 'connected',
      data,
      timestamp: Date.now(),
      latency: type === 'receive' ? Math.floor(Math.random() * 50) + 10 : undefined
    };

    connection.operations.unshift(operation);
    if (connection.operations.length > 20) {
      connection.operations = connection.operations.slice(0, 20);
    }
  }

  getConnections(): TCPConnection[] {
    return Array.from(this.connections.values());
  }
}

const mockTCP = new MockTCPDemo();

/**
 * TCP API Demo Component
 *
 * Interactive demonstration of Bun's high-performance TCP networking capabilities.
 * Showcases server/client connections, message passing, heartbeat monitoring,
 * concurrent connections, and load testing scenarios.
 *
 * Features:
 * - TCP server creation and management
 * - Client connection with configurable parameters
 * - Real-time message sending and receiving
 * - TLS encryption simulation
 * - Concurrent client connections
 * - Load testing with automated stress scenarios
 * - Heartbeat monitoring and connection health
 * - Message queuing and backpressure handling
 * - Broadcast messaging capabilities
 *
 * @component
 * @example
 * ```tsx
 * <TCPDemo />
 * ```
 *
 * @returns {React.FC} The TCP demo component
 */
export const TCPDemo: React.FC = () => {
  // Component state
  /** @type {TCPConnection[]} Active TCP connections */
  const [connections, setConnections] = useState<TCPConnection[]>([]);

  /** @type {string | null} ID of currently selected connection for detailed view */
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  /** @type {{hostname: string, port: number, tls: boolean}} Server configuration */
  const [serverConfig, setServerConfig] = useState({
    hostname: NETWORK_CONSTANTS.LOCALHOST,
    port: NETWORK_CONSTANTS.DEFAULT_TCP_PORT,
    tls: false
  });

  /** @type {{hostname: string, port: number, tls: boolean}} Client configuration */
  const [clientConfig, setClientConfig] = useState({
    hostname: NETWORK_CONSTANTS.LOCALHOST,
    port: NETWORK_CONSTANTS.DEFAULT_TCP_PORT,
    tls: false
  });

  /** @type {string} Current message text for sending */
  const [messageText, setMessageText] = useState('Hello TCP World!');

  /** @type {number} Number of concurrent clients to create */
  const [concurrentClients, setConcurrentClients] = useState(1);

  /** @type {boolean} Whether load testing is currently running */
  const [isLoadTesting, setIsLoadTesting] = useState(false);

  /** @type {React.MutableRefObject<NodeJS.Timeout | undefined>} Reference to update interval */
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Update connections list periodically
    const updateConnections = () => {
      setConnections(mockTCP.getConnections());
    };

    updateConnections();
    const interval = setInterval(updateConnections, 500);
    return () => clearInterval(interval);
  }, []);

  const createServer = () => {
    const connection = mockTCP.createServer(serverConfig.hostname, serverConfig.port);
    setSelectedConnection(connection.id);
  };

  /**
   * Establishes TCP client connections
   *
   * Creates one or more TCP client connections based on the concurrentClients setting.
   * Handles both single and multiple concurrent connection scenarios.
   *
   * @method connectClient
   * @private
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await connectClient(); // Connect 1 or more clients based on concurrentClients setting
   * ```
   */
  const connectClient = async () => {
    try {
      if (concurrentClients === 1) {
        const connection = await mockTCP.connectClient(clientConfig.hostname, clientConfig.port);
        setSelectedConnection(connection.id);
      } else {
        // Connect multiple clients concurrently
        const promises = Array.from({ length: concurrentClients }, () =>
          mockTCP.connectClient(clientConfig.hostname, clientConfig.port)
        );

        const connections = await Promise.allSettled(promises);
        const successful = connections.filter(result => result.status === 'fulfilled');

        if (successful.length > 0) {
          setSelectedConnection((successful[0] as PromiseFulfilledResult<TCPConnection>).value.id);
        }

        console.log(`Connected ${successful.length}/${concurrentClients} clients`);
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  /**
   * Executes a comprehensive TCP load test
   *
   * Performs automated stress testing by:
   * 1. Connecting 5 clients simultaneously
   * 2. Sending 10 messages from each client
   * 3. Monitoring performance and reliability
   * 4. Gracefully closing all connections
   *
   * @method runLoadTest
   * @private
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await runLoadTest(); // Execute full TCP load testing scenario
   * ```
   */
  const runLoadTest = async () => {
    setIsLoadTesting(true);

    try {
      // Connect 5 clients simultaneously
      const promises = Array.from({ length: 5 }, () =>
        mockTCP.connectClient(clientConfig.hostname, clientConfig.port)
      );

      const connections = await Promise.allSettled(promises);
      const successfulConnections = connections
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<TCPConnection>).value);

      // Send messages from all connected clients
      const messagePromises = successfulConnections.map(async (connection, index) => {
        for (let i = 0; i < 10; i++) {
          mockTCP.sendData(connection, `Load test message ${i + 1} from client ${index + 1}`);
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms between messages
        }
      });

      await Promise.all(messagePromises);

      // Close all connections
      setTimeout(() => {
        successfulConnections.forEach(connection => {
          mockTCP.closeConnection(connection);
        });
        setIsLoadTesting(false);
      }, TIMING_CONSTANTS.TWO_SECONDS);

    } catch (error) {
      console.error('Load test failed:', error);
      setIsLoadTesting(false);
    }
  };

  const sendMessage = () => {
    const connection = connections.find(c => c.id === selectedConnection);
    if (connection && messageText.trim()) {
      mockTCP.sendData(connection, messageText.trim());
    }
  };

  const closeConnection = () => {
    const connection = connections.find(c => c.id === selectedConnection);
    if (connection) {
      mockTCP.closeConnection(connection);
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'listening': return '#3b82f6';
      case 'disconnected': return '#6b7280';
      default: return '#ef4444';
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'server_start': return '🚀';
      case 'connecting': return '🔄';
      case 'connected': return '✅';
      case 'send': return '📤';
      case 'receive': return '📥';
      case 'close': return '❌';
      case 'error': return '⚠️';
      default: return '📡';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const selectedConn = connections.find(c => c.id === selectedConnection);

  /**
   * Renders the TCP Demo component
   *
   * Provides an interactive interface for:
   * - Creating and managing TCP servers
   * - Establishing client connections
   * - Sending and receiving messages
   * - Monitoring connection health and operations
   * - Running load tests and performance analysis
   * - Configuring TLS and concurrent connections
   *
   * @returns {JSX.Element} The rendered TCP demo component
   */
  return (
    <div className="tcp-demo">
      <div className="demo-header">
        <h2>🔌 Bun TCP API Interactive Demo</h2>
        <p>Experience Bun's high-performance TCP capabilities with real-time connection monitoring</p>
      </div>

      <div className="demo-content">
        {/* Server/Client Controls */}
        <div className="tcp-controls">
          <div className="control-section">
            <h3>TCP Server</h3>
            <div className="server-controls">
              <div className="input-group">
                <label>Hostname:</label>
                <input
                  type="text"
                  value={serverConfig.hostname}
                  onChange={(e) => setServerConfig(prev => ({ ...prev, hostname: e.target.value }))}
                  placeholder="localhost"
                />
              </div>
              <div className="input-group">
                <label>Port:</label>
                <input
                  type="number"
                  value={serverConfig.port}
                  onChange={(e) => setServerConfig(prev => ({ ...prev, port: Number(e.target.value) }))}
                  placeholder={NETWORK_CONSTANTS.DEFAULT_TCP_PORT.toString()}
                />
              </div>
              <div className="input-group">
                <label>
                  <input
                    type="checkbox"
                    checked={serverConfig.tls}
                    onChange={(e) => setServerConfig(prev => ({ ...prev, tls: e.target.checked }))}
                  />
                  Enable TLS
                </label>
              </div>
              <button className="create-server-btn" onClick={createServer}>
                🚀 Start Server {serverConfig.tls && '🔒'}
              </button>
            </div>
          </div>

          <div className="control-section">
            <h3>TCP Client</h3>
            <div className="client-controls">
              <div className="input-group">
                <label>Hostname:</label>
                <input
                  type="text"
                  value={clientConfig.hostname}
                  onChange={(e) => setClientConfig(prev => ({ ...prev, hostname: e.target.value }))}
                  placeholder="localhost"
                />
              </div>
              <div className="input-group">
                <label>Port:</label>
                <input
                  type="number"
                  value={clientConfig.port}
                  onChange={(e) => setClientConfig(prev => ({ ...prev, port: Number(e.target.value) }))}
                  placeholder={NETWORK_CONSTANTS.DEFAULT_TCP_PORT.toString()}
                />
              </div>
              <div className="input-group">
                <label>
                  <input
                    type="checkbox"
                    checked={clientConfig.tls}
                    onChange={(e) => setClientConfig(prev => ({ ...prev, tls: e.target.checked }))}
                  />
                  Enable TLS
                </label>
              </div>
              <div className="input-group">
                <label>Concurrent Clients:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={concurrentClients}
                  onChange={(e) => setConcurrentClients(Number(e.target.value))}
                />
              </div>
              <div className="client-buttons">
                <button className="connect-client-btn" onClick={connectClient}>
                  🔗 Connect {concurrentClients > 1 ? `${concurrentClients} Clients` : 'Client'} {clientConfig.tls && '🔒'}
                </button>
                <button
                  className="load-test-btn"
                  onClick={runLoadTest}
                  disabled={isLoadTesting}
                >
                  {isLoadTesting ? '⏳ Testing...' : '⚡ Load Test'}
                </button>
              </div>
            </div>
          </div>

          <div className="control-section">
            <h3>Message Testing</h3>
            <div className="message-controls">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Enter message to send..."
                rows={3}
              />
              <div className="message-buttons">
                <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={!selectedConnection || !selectedConn || selectedConn.status !== 'connected'}
                >
                  📤 Send Message
                </button>
                <button
                  className="close-btn"
                  onClick={closeConnection}
                  disabled={!selectedConnection || !selectedConn || selectedConn.status === 'disconnected'}
                >
                  ❌ Close Connection
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connections Monitor */}
        <div className="connections-monitor">
          <div className="monitor-header">
            <h3>Active TCP Connections</h3>
            <div className="connection-stats">
              <span>Total: {connections.length}</span>
              <span>Servers: {connections.filter(c => c.type === 'server').length}</span>
              <span>Clients: {connections.filter(c => c.type === 'client').length}</span>
              <span>Connected: {connections.filter(c => c.status === 'connected' || c.status === 'listening').length}</span>
            </div>
          </div>

          <div className="connections-list">
            {connections.length === 0 ? (
              <div className="no-connections">
                <p>No active TCP connections. Start a server or connect a client to see TCP operations in action!</p>
              </div>
            ) : (
              connections.map(connection => (
                <div
                  key={connection.id}
                  className={`connection-item ${selectedConnection === connection.id ? 'selected' : ''}`}
                  onClick={() => setSelectedConnection(connection.id)}
                >
                  <div className="connection-header">
                    <div className="connection-info">
                      <span className="connection-type">{connection.type.toUpperCase()}</span>
                      <span className="connection-address">
                        {connection.hostname}:{connection.port}
                      </span>
                      <span
                        className="connection-status"
                        style={{ color: getConnectionStatusColor(connection.status) }}
                      >
                        {connection.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="connection-metrics">
                      <span>{connection.operations.length} ops</span>
                    </div>
                  </div>

                  {selectedConnection === connection.id && (
                    <div className="connection-details">
                      <h4>Recent Operations</h4>
                      <div className="operations-list">
                        {connection.operations.length === 0 ? (
                          <p className="no-operations">No operations yet</p>
                        ) : (
                          connection.operations.slice(0, 10).map(operation => (
                            <div key={operation.id} className="operation-item">
                              <div className="operation-header">
                                <span className="operation-icon">
                                  {getOperationIcon(operation.type)}
                                </span>
                                <span className="operation-type">{operation.type.replace('_', ' ').toUpperCase()}</span>
                                <span className="operation-direction">{operation.direction}</span>
                                <span className="operation-time">{formatTimestamp(operation.timestamp)}</span>
                              </div>

                              <div className="operation-details">
                                {operation.data.message && (
                                  <div className="operation-message">{operation.data.message}</div>
                                )}
                                {operation.data.data && (
                                  <div className="operation-data">
                                    <strong>Data:</strong> {operation.data.data}
                                  </div>
                                )}
                                {operation.data.bytes && (
                                  <div className="operation-bytes">
                                    <strong>Bytes:</strong> {operation.data.bytes}
                                  </div>
                                )}
                                {operation.latency && (
                                  <div className="operation-latency">
                                    <strong>Latency:</strong> {operation.latency}ms
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="performance-summary">
          <div className="summary-card">
            <h4>TCP Performance Metrics</h4>
            <div className="performance-metrics">
              <div className="metric">
                <span className="metric-label">Active Connections</span>
                <span className="metric-value">{connections.length}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Total Operations</span>
                <span className="metric-value">
                  {connections.reduce((sum, conn) => sum + conn.operations.length, 0)}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Messages Sent</span>
                <span className="metric-value">
                  {connections.reduce((sum, conn) =>
                    sum + conn.operations.filter(op => op.type === 'send').length, 0
                  )}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Messages Received</span>
                <span className="metric-value">
                  {connections.reduce((sum, conn) =>
                    sum + conn.operations.filter(op => op.type === 'receive').length, 0
                  )}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Avg Latency</span>
                <span className="metric-value">
                  {(() => {
                    const latencies = connections
                      .flatMap(c => c.operations)
                      .map(op => op.latency)
                      .filter(l => l !== undefined) as number[];
                    if (latencies.length === 0) return '-';
                    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
                    return `${avg.toFixed(1)}ms`;
                  })()}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Connection Success</span>
                <span className="metric-value">
                  {connections.length > 0
                    ? `${Math.round((connections.filter(c => c.status === 'connected' || c.status === 'listening').length / connections.length) * 100)}%`
                    : '100%'
                  }
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">TLS Enabled</span>
                <span className="metric-value">
                  {connections.filter(c => c.type === 'server' && serverConfig.tls).length +
                   connections.filter(c => c.type === 'client' && clientConfig.tls).length > 0 ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Heartbeat Active</span>
                <span className="metric-value">
                  {connections.filter(c => c.status === 'connected' || c.status === 'listening').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};