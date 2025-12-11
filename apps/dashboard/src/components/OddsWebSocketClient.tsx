import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NETWORK_CONSTANTS, TIMING_CONSTANTS, STATUS_CODES } from '../constants';

interface WebSocketMessage {
  type: string;
  channel?: string;
  data: any;
  timestamp: number;
  sequence: number;
  pid?: number;
}

interface TelemetryTick {
  tick_id: number;
  market_id: string;
  price: number;
  volume: number;
  bid: number;
  ask: number;
  tick_timestamp: number;
  pid_context: {
    pid: number;
    parent_pid: number;
    instance_id: string;
  };
  telemetry: {
    ingest_latency_ns: number;
    queue_depth: number;
    buffer_utilization: number;
  };
}

interface OddsWebSocketClientProps {
  onConnectionChange: (connected: boolean) => void;
  onTelemetryTick?: (tick: TelemetryTick) => void;
}

export const OddsWebSocketClient: React.FC<OddsWebSocketClientProps> = ({
  onConnectionChange,
  onTelemetryTick
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [serverPid, setServerPid] = useState<number | null>(null);
  const [tickCount, setTickCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  const connect = () => {
    try {
      // Connect to unified server on port 6969 with /ws path
      const wsUrl = `ws://${NETWORK_CONSTANTS.LOCALHOST}:${NETWORK_CONSTANTS.WEBSOCKET_PORT}${NETWORK_CONSTANTS.WS_PATH}`;
      ws.current = new WebSocket(wsUrl);
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      
      ws.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        onConnectionChange(true);
        console.log('WebSocket connected to unified server');

        // Auto-subscribe to telemetry channels
        setTimeout(() => {
          subscribeToChannel('market-ticks');
          subscribeToChannel('metrics');
        }, 100);
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setMessages((prev: WebSocketMessage[]) => [...prev.slice(-99), message]);

          // Handle specific message types
          switch (message.type) {
            case 'connected':
              setClientId(message.data?.clientId);
              setServerPid(message.data?.pid);
              console.log(`Connected as ${message.data?.clientId}, server PID: ${message.data?.pid}`);
              break;

            case 'telemetry':
              if (message.channel === 'market-ticks' && onTelemetryTick) {
                setTickCount(prev => prev + 1);
                onTelemetryTick(message.data as TelemetryTick);
              }
              break;

            case 'subscribed':
              console.log(`Subscribed to channel: ${message.data?.channel}`);
              break;
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };
      
      ws.current.onclose = (event: CloseEvent) => {
        setIsConnected(false);
        onConnectionChange(false);
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        // Auto-reconnect after 3 seconds
        if (event.code !== STATUS_CODES.NORMAL_CLOSURE) {
          reconnectTimeout.current = window.setTimeout(connect, TIMING_CONSTANTS.THREE_SECONDS);
        }
      };
      
      ws.current.onerror = (event: Event) => {
        setError('WebSocket connection error');
        console.error('WebSocket error:', event);
      };
      
    } catch (err) {
      setError('Failed to create WebSocket connection');
      console.error('Connection error:', err);
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current !== null) {
      window.clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current) {
      ws.current.close(STATUS_CODES.NORMAL_CLOSURE, 'User disconnected');
      ws.current = null;
    }
    
    setIsConnected(false);
    onConnectionChange(false);
  };

  const sendMessage = (type: string, data: any) => {
    if (ws.current && isConnected) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now(),
        sequence: messages.length
      };
      
      ws.current.send(JSON.stringify(message));
    }
  };

  const subscribeToSymbol = (symbol: string) => {
    sendMessage('subscribe', { symbol });
  };

  const unsubscribeFromSymbol = (symbol: string) => {
    sendMessage('unsubscribe', { symbol });
  };

  const subscribeToChannel = (channel: string) => {
    sendMessage('subscribe', { channel });
  };

  const unsubscribeFromChannel = (channel: string) => {
    sendMessage('unsubscribe', { channel });
  };

  const clearMessages = () => {
    setMessages([]);
    setTickCount(0);
  };

  return (
    <div className="websocket-client">
      <div className="client-header">
        <h3>WebSocket Client</h3>
        <div className="connection-controls">
          <button 
            onClick={isConnected ? disconnect : connect}
            className={isConnected ? 'disconnect' : 'connect'}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
          <button onClick={clearMessages} className="clear">
            Clear Messages
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="client-status">
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {clientId && <span className="client-id">ID: {clientId}</span>}
        {serverPid && <span className="server-pid">PID: {serverPid}</span>}
        <span className="message-count">
          {messages.length} msgs | {tickCount} ticks
        </span>
      </div>
      
      <div className="subscription-controls">
        <h4>Subscriptions</h4>
        <div className="symbol-controls">
          <input 
            type="text" 
            placeholder="Symbol (e.g., AAPL)"
            id="symbol-input"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                const input = e.currentTarget;
                if (input.value.trim()) {
                  subscribeToSymbol(input.value.trim());
                  input.value = '';
                }
              }
            }}
          />
          <button onClick={() => {
            const input = document.getElementById('symbol-input') as HTMLInputElement;
            if (input?.value.trim()) {
              subscribeToSymbol(input.value.trim());
              input.value = '';
            }
          }}>
            Subscribe
          </button>
        </div>
      </div>
      
      <div className="message-log">
        <h4>Message Log</h4>
        <div className="messages">
          {messages.length === 0 ? (
            <div className="no-messages">No messages received</div>
          ) : (
            messages.slice(-20).reverse().map((message: WebSocketMessage, index: number) => (
              <div key={index} className="message">
                <div className="message-header">
                  <span className="message-type">{message.type}</span>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="message-sequence">#{message.sequence}</span>
                </div>
                <div className="message-content">
                  {JSON.stringify(message.data, null, 2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
