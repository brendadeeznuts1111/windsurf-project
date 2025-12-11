/**
 * @fileoverview Bun v1.3 Enhanced Features Demo Component
 * @description Interactive demonstration of Bun runtime v1.3 advanced features and APIs
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link TCPDemo} - TCP networking with socket information integration
 * @see {@link MarketTelemetryDemo} - Real-time stream processing applications
 * @see {@link PIDFileSystemDemo} - Process control and file operations
 * @see {@link Bun.listen} - Enhanced TCP server with socket info
 * @see {@link Bun.connect} - Enhanced TCP client with socket info
 * @see {@link ReadableStream} - Stream processing APIs demonstrated
 * @see {@link ProcessController} - Process lifecycle management
 */

import React, { useState, useRef, useEffect } from 'react';
import './bun-v13-features.css';
import { TEST_DATA, PROCESS_CONSTANTS, TIMING_CONSTANTS } from '../constants';

interface SocketInfo {
  localAddress: string;
  localPort: number;
  localFamily: string;
  remoteAddress: string;
  remotePort: number;
  remoteFamily: string;
  protocol: string;
  connectionTimestamp: number;
}

interface NetworkDiagnostic {
  endpoint: { hostname: string; port: number };
  success: boolean;
  data?: { info: SocketInfo };
  error?: string;
}

interface StreamChunk {
  id: string;
  data: string;
  timestamp: number;
  processed: boolean;
}

interface ProcessResult {
  success: boolean;
  stdout: string;
  stderr: string;
  pid?: number;
  exitCode?: number;
}

// Mock implementations for browser compatibility
class BunV13Features {
  // Enhanced Socket Information (Mock for browser)
  async performNetworkDiagnostics(endpoints: Array<{hostname: string, port: number}>): Promise<NetworkDiagnostic[]> {
    return Promise.all(endpoints.map(async (endpoint) => {
      // Simulate network diagnostic with realistic data
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      const success = Math.random() > 0.2; // 80% success rate

      if (success) {
        return {
          endpoint,
          success: true,
          data: {
            info: {
              localAddress: '192.168.1.100',
              localPort: Math.floor(Math.random() * PROCESS_CONSTANTS.MAX_PID_RANGE) + PROCESS_CONSTANTS.MIN_PID,
              localFamily: 'IPv4',
              remoteAddress: endpoint.hostname,
              remotePort: endpoint.port,
              remoteFamily: endpoint.port === 443 ? 'IPv4' : 'IPv4',
              protocol: endpoint.port === 443 ? 'TLSv1.3' : 'TCP',
              connectionTimestamp: Date.now() - Math.random() * 3600000 // Within last hour
            }
          }
        };
      } else {
        return {
          endpoint,
          success: false,
          error: 'Connection timeout or unreachable'
        };
      }
    }));
  }

  // Stream Processing (Mock for browser)
  async processJsonStream<T>(
    stream: ReadableStream,
    transformCmd: string[],
    parser: (data: string) => T,
    transformer: (item: T) => T
  ): Promise<T[]> {
    // Simulate stream processing
    const reader = stream.getReader();
    const results: T[] = [];

    try {
      const { value } = await reader.read();
      if (value) {
        const text = new TextDecoder().decode(value);
        const data = JSON.parse(text);

        // Apply transformation (simulate jq-like filtering)
        const filtered = data.filter((item: any) =>
          transformCmd.includes('price > 150') ? item.price > 150 : true
        );

        filtered.forEach((item: any) => {
          results.push(transformer(item));
        });
      }
    } finally {
      reader.releaseLock();
    }

    return results;
  }

  // Real-time Stream Processing
  async processRealtimeStream(
    streamName: string,
    chunks: string[],
    onChunk: (chunk: string) => void
  ): Promise<number> {
    let processedCount = 0;

    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      onChunk(chunk);
      processedCount++;
    }

    return processedCount;
  }

  // Process Control Simulation
  async demonstrateProcessControl(): Promise<{
    initialState: boolean;
    withRefState: boolean;
    withUnrefState: boolean;
    finalState: boolean;
  }> {
    // Simulate process control states
    let refState = true; // Initially referenced

    await new Promise(resolve => setTimeout(resolve, 100));
    const withRefState = true; // Keeps process alive

    await new Promise(resolve => setTimeout(resolve, 100));
    const withUnrefState = false; // Allows process to exit

    const finalState = false; // Process can exit

    return {
      initialState: refState,
      withRefState,
      withUnrefState,
      finalState
    };
  }

  // Enhanced Process Spawning (Mock)
  async spawnProcessWithArgs(
    command: string[],
    options: { env?: Record<string, string>; timeout?: number; ref?: boolean }
  ): Promise<ProcessResult> {
    // Simulate process execution
    await new Promise(resolve => setTimeout(resolve, 200));

    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        stdout: command.join(' ') + ' executed successfully',
        stderr: '',
        pid: Math.floor(Math.random() * PROCESS_CONSTANTS.MAX_PID_RANGE) + PROCESS_CONSTANTS.MIN_PID,
        exitCode: 0
      };
    } else {
      return {
        success: false,
        stdout: '',
        stderr: 'Command execution failed',
        exitCode: 1
      };
    }
  }

  // Advanced Stream Piping (Mock)
  async pipeToProcess(
    stream: ReadableStream,
    transformCmd: string[],
    options: any
  ): Promise<{ stdout: ReadableStream; stderr: ReadableStream }> {
    // Simulate stream piping
    const reader = stream.getReader();
    let processedData = '';

    try {
      const { value } = await reader.read();
      if (value) {
        const text = new TextDecoder().decode(value);
        const data = JSON.parse(text);

        // Apply transformation (simulate jq filtering)
        const filtered = data.filter((item: any) =>
          transformCmd.includes('type == "trade"') ? item.type === 'trade' : true
        );

        processedData = JSON.stringify(filtered, null, 2);
      }
    } finally {
      reader.releaseLock();
    }

    // Create new streams with processed data
    const stdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(processedData));
        controller.close();
      }
    });

    const stderr = new ReadableStream({
      start(controller) {
        controller.close();
      }
    });

    return { stdout, stderr };
  }
}

const bunV13 = new BunV13Features();

export default function BunV13Demo() {
  const [activeDemo, setActiveDemo] = useState<string>('socket-info');
  const [socketResults, setSocketResults] = useState<NetworkDiagnostic[]>([]);
  const [streamChunks, setStreamChunks] = useState<StreamChunk[]>([]);
  const [processStates, setProcessStates] = useState<any>({});
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [streamOutput, setStreamOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const demos = [
    { id: 'socket-info', title: 'Enhanced Socket Info', icon: '📡' },
    { id: 'stream-processing', title: 'Stream Processing', icon: '🔄' },
    { id: 'realtime-stream', title: 'Real-time Streams', icon: '⚡' },
    { id: 'process-control', title: 'Process Control', icon: '🎮' },
    { id: 'process-spawning', title: 'Process Spawning', icon: '🔧' },
    { id: 'advanced-piping', title: 'Advanced Piping', icon: '🚀' }
  ];

  const runSocketInfoDemo = async () => {
    setIsRunning(true);
    try {
      const endpoints = [
        { hostname: 'httpbin.org', port: 80 },
        { hostname: 'api.github.com', port: 443 },
        { hostname: 'example.com', port: 80 }
      ];

      const results = await bunV13.performNetworkDiagnostics(endpoints);
      setSocketResults(results);
    } catch (error) {
      console.error('Socket info demo failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runStreamProcessingDemo = async () => {
    setIsRunning(true);
    try {
      const marketData = [
        { symbol: 'AAPL', price: TEST_DATA.SAMPLE_PRICES.AAPL, volume: TEST_DATA.SAMPLE_VOLUMES.SMALL, timestamp: Date.now() },
        { symbol: 'GOOGL', price: 142.25, volume: 500, timestamp: Date.now() },
        { symbol: 'MSFT', price: 380.75, volume: 750, timestamp: Date.now() }
      ];

      const jsonString = JSON.stringify(marketData);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(jsonString));
          controller.close();
        }
      });

      const processed = await bunV13.processJsonStream(
        stream,
        ['jq', '.[] | select(.price > 150)'],
        (data) => JSON.parse(data),
        (item) => ({ ...item, processed: true })
      );

      setStreamChunks(processed.map((item, index) => ({
        id: `chunk_${index}`,
        data: JSON.stringify(item),
        timestamp: Date.now(),
        processed: true
      })));
    } catch (error) {
      console.error('Stream processing demo failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runRealtimeStreamDemo = async () => {
    setIsRunning(true);
    setStreamChunks([]);

    try {
      const chunks = [
        'chunk1: market data update',
        'chunk2: price change alert',
        'chunk3: volume spike detected'
      ];

      const processedCount = await bunV13.processRealtimeStream(
        'demo-stream',
        chunks,
        (chunk) => {
          const streamChunk: StreamChunk = {
            id: `realtime_${Date.now()}_${Math.random()}`,
            data: chunk,
            timestamp: Date.now(),
            processed: true
          };
          setStreamChunks(prev => [...prev, streamChunk]);
        }
      );

      console.log(`Processed ${processedCount} real-time chunks`);
    } catch (error) {
      console.error('Real-time stream demo failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runProcessControlDemo = async () => {
    setIsRunning(true);
    try {
      const states = await bunV13.demonstrateProcessControl();
      setProcessStates(states);
    } catch (error) {
      console.error('Process control demo failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runProcessSpawningDemo = async () => {
    setIsRunning(true);
    try {
      const result = await bunV13.spawnProcessWithArgs(
        ['echo', 'Hello from Bun v1.3!'],
        {
          env: { CUSTOM_VAR: 'odds-protocol' },
          timeout: 5000,
          ref: false
        }
      );
      setProcessResult(result);
    } catch (error) {
      console.error('Process spawning demo failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runAdvancedPipingDemo = async () => {
    setIsRunning(true);
    try {
      const dataStream = new ReadableStream({
        start(controller) {
          const data = JSON.stringify([
            { type: 'trade', symbol: 'BTC', price: TEST_DATA.SAMPLE_PRICES.BTC },
            { type: 'quote', symbol: 'ETH', price: TEST_DATA.SAMPLE_PRICES.ETH },
            { type: 'trade', symbol: 'BTC', price: TEST_DATA.SAMPLE_PRICES.BTC + 100 }
          ]);
          controller.enqueue(new TextEncoder().encode(data));
          controller.close();
        }
      });

      const result = await bunV13.pipeToProcess(dataStream, ['jq', '.[] | select(.type == "trade")'], {
        stdout: 'pipe',
        stderr: 'pipe'
      });

      const output = await new Response(result.stdout).text();
      setStreamOutput(output);
    } catch (error) {
      console.error('Advanced piping demo failed:', error);
      setStreamOutput('Demo completed (jq not available in browser environment)');
    } finally {
      setIsRunning(false);
    }
  };

  const runDemo = () => {
    switch (activeDemo) {
      case 'socket-info':
        runSocketInfoDemo();
        break;
      case 'stream-processing':
        runStreamProcessingDemo();
        break;
      case 'realtime-stream':
        runRealtimeStreamDemo();
        break;
      case 'process-control':
        runProcessControlDemo();
        break;
      case 'process-spawning':
        runProcessSpawningDemo();
        break;
      case 'advanced-piping':
        runAdvancedPipingDemo();
        break;
    }
  };

  return (
    <div className="bun-v13-demo">
      <div className="demo-header">
        <h2>🚀 Bun v1.3 Enhanced Features Demo</h2>
        <p>Experience the latest Bun runtime capabilities with advanced networking, streaming, and process management</p>
      </div>

      <div className="demo-content">
        {/* Demo Selector */}
        <div className="demo-selector">
          <h3>Select Demo</h3>
          <div className="demo-buttons">
            {demos.map(demo => (
              <button
                key={demo.id}
                className={`demo-btn ${activeDemo === demo.id ? 'active' : ''}`}
                onClick={() => setActiveDemo(demo.id)}
              >
                <span className="demo-icon">{demo.icon}</span>
                <span className="demo-title">{demo.title}</span>
              </button>
            ))}
          </div>
          <button
            className="run-demo-btn"
            onClick={runDemo}
            disabled={isRunning}
          >
            {isRunning ? '⏳ Running...' : '▶️ Run Demo'}
          </button>
        </div>

        {/* Demo Results */}
        <div className="demo-results">
          {activeDemo === 'socket-info' && (
            <div className="result-section">
              <h3>📡 Enhanced Socket Information</h3>
              <p>Detailed connection information for network diagnostics</p>
              <div className="socket-results">
                {socketResults.length === 0 ? (
                  <p className="no-results">Run the demo to see socket information</p>
                ) : (
                  socketResults.map((result, index) => (
                    <div key={index} className={`socket-result ${result.success ? 'success' : 'error'}`}>
                      <div className="endpoint">
                        {result.endpoint.hostname}:{result.endpoint.port}
                        {result.success ? ' ✅' : ' ❌'}
                      </div>
                      {result.success && result.data?.info && (
                        <div className="socket-details">
                          <div className="detail-row">
                            <span className="label">Local:</span>
                            <span className="value">
                              {result.data.info.localAddress}:{result.data.info.localPort} ({result.data.info.localFamily})
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Remote:</span>
                            <span className="value">
                              {result.data.info.remoteAddress}:{result.data.info.remotePort} ({result.data.info.remoteFamily})
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Protocol:</span>
                            <span className="value">{result.data.info.protocol}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Connected:</span>
                            <span className="value">
                              {new Date(result.data.info.connectionTimestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                      {result.error && (
                        <div className="error-message">{result.error}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeDemo === 'stream-processing' && (
            <div className="result-section">
              <h3>🔄 Stream Processing & JSON Transformation</h3>
              <p>Process JSON streams with filtering and transformation</p>
              <div className="stream-results">
                {streamChunks.length === 0 ? (
                  <p className="no-results">Run the demo to see stream processing</p>
                ) : (
                  streamChunks.map(chunk => (
                    <div key={chunk.id} className="stream-chunk">
                      <div className="chunk-header">
                        <span className="chunk-timestamp">
                          {new Date(chunk.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="chunk-status">
                          {chunk.processed ? '✅ Processed' : '⏳ Processing'}
                        </span>
                      </div>
                      <div className="chunk-data">
                        <pre>{chunk.data}</pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeDemo === 'realtime-stream' && (
            <div className="result-section">
              <h3>⚡ Real-time Stream Processing</h3>
              <p>Process streaming data in real-time with backpressure handling</p>
              <div className="realtime-results">
                {streamChunks.length === 0 ? (
                  <p className="no-results">Run the demo to see real-time processing</p>
                ) : (
                  <div className="realtime-stream">
                    {streamChunks.map(chunk => (
                      <div key={chunk.id} className="realtime-chunk">
                        <span className="chunk-time">
                          {new Date(chunk.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="chunk-content">{chunk.data}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeDemo === 'process-control' && (
            <div className="result-section">
              <h3>🎮 Process Control with ref/unref</h3>
              <p>Control process lifecycle with reference counting</p>
              <div className="process-results">
                {Object.keys(processStates).length === 0 ? (
                  <p className="no-results">Run the demo to see process control</p>
                ) : (
                  <div className="process-states">
                    <div className="state-item">
                      <span className="state-label">Initial State:</span>
                      <span className={`state-value ${processStates.initialState ? 'referenced' : 'unreferenced'}`}>
                        {processStates.initialState ? 'Referenced' : 'Unreferenced'}
                      </span>
                    </div>
                    <div className="state-item">
                      <span className="state-label">withRef() State:</span>
                      <span className={`state-value ${processStates.withRefState ? 'referenced' : 'unreferenced'}`}>
                        {processStates.withRefState ? 'Referenced (Process Kept Alive)' : 'Unreferenced'}
                      </span>
                    </div>
                    <div className="state-item">
                      <span className="state-label">withUnref() State:</span>
                      <span className={`state-value ${processStates.withUnrefState ? 'referenced' : 'unreferenced'}`}>
                        {processStates.withUnrefState ? 'Unreferenced (Process Can Exit)' : 'Referenced'}
                      </span>
                    </div>
                    <div className="state-item">
                      <span className="state-label">Final State:</span>
                      <span className={`state-value ${processStates.finalState ? 'referenced' : 'unreferenced'}`}>
                        {processStates.finalState ? 'Referenced' : 'Unreferenced (Process Can Exit)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeDemo === 'process-spawning' && (
            <div className="result-section">
              <h3>🔧 Enhanced Process Spawning</h3>
              <p>Spawn processes with custom environments and control</p>
              <div className="process-results">
                {!processResult ? (
                  <p className="no-results">Run the demo to see process spawning</p>
                ) : (
                  <div className="process-output">
                    <div className="result-status">
                      {processResult.success ? '✅ Success' : '❌ Failed'}
                    </div>
                    {processResult.stdout && (
                      <div className="stdout">
                        <strong>Output:</strong>
                        <pre>{processResult.stdout}</pre>
                      </div>
                    )}
                    {processResult.stderr && (
                      <div className="stderr">
                        <strong>Error:</strong>
                        <pre>{processResult.stderr}</pre>
                      </div>
                    )}
                    {processResult.pid && (
                      <div className="process-info">
                        <span>PID: {processResult.pid}</span>
                        <span>Exit Code: {processResult.exitCode}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeDemo === 'advanced-piping' && (
            <div className="result-section">
              <h3>🚀 Advanced Stream Piping</h3>
              <p>Pipe streams through external processes for transformation</p>
              <div className="piping-results">
                {!streamOutput ? (
                  <p className="no-results">Run the demo to see stream piping</p>
                ) : (
                  <div className="pipe-output">
                    <strong>Piped and Filtered Data:</strong>
                    <pre>{streamOutput}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feature Summary */}
        <div className="feature-summary">
          <h3>🎯 Bun v1.3 Key Features Demonstrated</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">📡</span>
              <div className="feature-content">
                <h4>Enhanced Socket Info</h4>
                <p>Detailed local/remote connection information with protocol detection</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <div className="feature-content">
                <h4>Stream Piping</h4>
                <p>Pipe streams directly to spawned processes for transformation</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <div className="feature-content">
                <h4>Real-time Processing</h4>
                <p>Process streaming data with automatic backpressure handling</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎮</span>
              <div className="feature-content">
                <h4>Process Control</h4>
                <p>Fine-grained control over process lifecycle with ref/unref</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔧</span>
              <div className="feature-content">
                <h4>Enhanced Spawning</h4>
                <p>Spawn processes with custom environments and timeout control</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <div className="feature-content">
                <h4>JSON Stream Processing</h4>
                <p>Process and transform JSON streams with external tools</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}