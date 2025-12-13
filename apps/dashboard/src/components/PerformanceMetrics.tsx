import React, { useState, useEffect, useRef } from 'react';
import { NETWORK_CONSTANTS } from '../constants';

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

interface MetricsData {
  ticks_processed: number;
  clients_connected: number;
  uptime_seconds: number;
  memory_mb: number;
  bytes_processed: number;
  bytes_per_second: number;
  mime_types: Record<string, number>;
  file_operations: {
    reads: number;
    writes: number;
    streams: number;
  };
}

interface PerformanceMetricsProps {
  className?: string;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ className }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [latestTicks, setLatestTicks] = useState<TelemetryTick[]>([]);
  const [ticksPerSecond, setTicksPerSecond] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);
  const [serverPid, setServerPid] = useState<number | null>(null);
  const [bytesPerSecond, setBytesPerSecond] = useState(0);
  const [mimeTypeStats, setMimeTypeStats] = useState<Record<string, number>>({});
  const [fileOpStats, setFileOpStats] = useState({ reads: 0, writes: 0, streams: 0 });
  const ws = useRef<WebSocket | null>(null);
  const tickCountRef = useRef(0);
  const latencySum = useRef(0);
  const latencyCount = useRef(0);

  useEffect(() => {
    connect();

    // Calculate ticks per second every second
    const interval = setInterval(() => {
      setTicksPerSecond(tickCountRef.current);
      tickCountRef.current = 0;

      // Calculate average latency
      if (latencyCount.current > 0) {
        setAvgLatency(latencySum.current / latencyCount.current);
        latencySum.current = 0;
        latencyCount.current = 0;
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, []);

  const connect = () => {
    try {
      const wsUrl = `ws://${NETWORK_CONSTANTS.LOCALHOST}:${NETWORK_CONSTANTS.WEBSOCKET_PORT}${NETWORK_CONSTANTS.WS_PATH}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);

        // Subscribe to telemetry channels
        setTimeout(() => {
          ws.current?.send(JSON.stringify({ type: 'subscribe', data: { channel: 'market-ticks' } }));
          ws.current?.send(JSON.stringify({ type: 'subscribe', data: { channel: 'metrics' } }));
        }, 100);
      };

      ws.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'connected') {
            setServerPid(msg.data?.pid);
          }

          if (msg.type === 'telemetry') {
            if (msg.channel === 'market-ticks') {
              const tick = msg.data as TelemetryTick;
              tickCountRef.current++;
              latencySum.current += tick.telemetry.ingest_latency_ns;
              latencyCount.current++;

              setLatestTicks(prev => [...prev.slice(-9), tick]);
            }

            if (msg.channel === 'metrics') {
              const metricsData = msg.data as MetricsData;
              setMetrics(metricsData);

              // Update byte-level metrics
              if (metricsData.bytes_per_second !== undefined) {
                setBytesPerSecond(metricsData.bytes_per_second);
              }

              // Update MIME type statistics
              if (metricsData.mime_types) {
                setMimeTypeStats(metricsData.mime_types);
              }

              // Update file operation statistics
              if (metricsData.file_operations) {
                setFileOpStats(metricsData.file_operations);
              }
            }
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
    }
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close(1000, 'Component unmounted');
      ws.current = null;
    }
  };

  const formatLatency = (ns: number) => {
    if (ns < 1000) return `${ns.toFixed(0)}ns`;
    if (ns < 1000000) return `${(ns / 1000).toFixed(1)}μs`;
    return `${(ns / 1000000).toFixed(2)}ms`;
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className={`performance-metrics ${className || ''}`}>
      <div className="metrics-header">
        <h3>Real-Time Performance Metrics</h3>
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Live' : 'Disconnected'}
        </span>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Ticks/Second</div>
          <div className="metric-value">{ticksPerSecond}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Latency</div>
          <div className="metric-value">{formatLatency(avgLatency)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Server PID</div>
          <div className="metric-value">{serverPid || '-'}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Clients</div>
          <div className="metric-value">{metrics?.clients_connected || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Ticks</div>
          <div className="metric-value">{metrics?.ticks_processed?.toLocaleString() || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Memory</div>
          <div className="metric-value">{metrics?.memory_mb?.toFixed(1) || 0} MB</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Uptime</div>
          <div className="metric-value">{metrics ? formatUptime(metrics.uptime_seconds) : '-'}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">WS Port</div>
          <div className="metric-value">{NETWORK_CONSTANTS.WEBSOCKET_PORT}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Bytes/Second</div>
          <div className="metric-value">{bytesPerSecond.toLocaleString()}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Bytes</div>
          <div className="metric-value">{metrics?.bytes_processed?.toLocaleString() || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">File Reads</div>
          <div className="metric-value">{fileOpStats.reads}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">File Writes</div>
          <div className="metric-value">{fileOpStats.writes}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">File Streams</div>
          <div className="metric-value">{fileOpStats.streams}</div>
        </div>
      </div>

      {/* MIME Type Statistics */}
      {Object.keys(mimeTypeStats).length > 0 && (
        <div className="mime-stats">
          <h4>MIME Type Distribution</h4>
          <div className="mime-grid">
            {Object.entries(mimeTypeStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([mimeType, count]) => (
                <div key={mimeType} className="mime-item">
                  <span className="mime-type">{mimeType}</span>
                  <span className="mime-count">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="tick-stream">
        <h4>Live Tick Stream</h4>
        <div className="tick-list">
          {latestTicks.length === 0 ? (
            <div className="no-data">Waiting for ticks...</div>
          ) : (
            latestTicks.slice().reverse().map((tick, i) => (
              <div key={tick.tick_id} className="tick-item">
                <span className="tick-id">#{tick.tick_id}</span>
                <span className="tick-market">{tick.market_id}</span>
                <span className="tick-price">${tick.price.toFixed(2)}</span>
                <span className="tick-volume">Vol: {tick.volume}</span>
                <span className="tick-latency">{formatLatency(tick.telemetry.ingest_latency_ns)}</span>
                <span className="tick-pid">PID:{tick.pid_context.pid}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .performance-metrics {
          background: #1a1a2e;
          border-radius: 8px;
          padding: 16px;
          color: #fff;
        }

        .metrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .metrics-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .connection-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .connection-status.connected {
          background: #22c55e;
          color: #000;
        }

        .connection-status.disconnected {
          background: #ef4444;
          color: #fff;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .metric-card {
          background: #16213e;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }

        .metric-label {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: bold;
          color: #0f9d58;
          font-family: 'JetBrains Mono', monospace;
        }

        .tick-stream {
          background: #16213e;
          border-radius: 6px;
          padding: 12px;
        }

        .tick-stream h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #888;
        }

        .tick-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .tick-item {
          display: flex;
          gap: 12px;
          padding: 6px 8px;
          background: #0f0f23;
          border-radius: 4px;
          margin-bottom: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }

        .tick-id { color: #666; width: 60px; }
        .tick-market { color: #4fc3f7; width: 70px; font-weight: bold; }
        .tick-price { color: #22c55e; width: 90px; }
        .tick-volume { color: #ffc107; width: 80px; }
        .tick-latency { color: #9c27b0; width: 70px; }
        .tick-pid { color: #666; }

        .no-data {
          color: #666;
          text-align: center;
          padding: 20px;
        }

        .mime-stats {
          margin-bottom: 16px;
        }

        .mime-stats h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #fff;
        }

        .mime-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }

        .mime-item {
          background: #16213e;
          border-radius: 4px;
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mime-type {
          font-size: 11px;
          color: #60a5fa;
          font-family: monospace;
        }

        .mime-count {
          font-size: 12px;
          color: #34d399;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
