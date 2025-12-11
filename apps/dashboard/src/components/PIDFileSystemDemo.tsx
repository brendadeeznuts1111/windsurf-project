// apps/dashboard/src/components/PIDFileSystemDemo.tsx
import React, { useState, useRef } from 'react';
import './pid-file-system-demo.css';
import { PROCESS_CONSTANTS, SIZE_CONSTANTS, TIMING_CONSTANTS } from '../constants';

// Mock PID-aware file system for demo purposes
// In production, this would import from the actual PIDFileSystem
class MockPIDFileSystem {
  private operations: Array<{
    id: string;
    operation: string;
    path: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    duration?: number;
    result?: any;
    error?: string;
    pid: number;
    timestamp: number;
  }> = [];

  private operationId = 0;

  async openFile(path: string, options?: any, context?: any) {
    const id = `op_${++this.operationId}`;
    const pid = Math.floor(Math.random() * PROCESS_CONSTANTS.MAX_PID_RANGE) + PROCESS_CONSTANTS.MIN_PID;

    this.operations.push({
      id,
      operation: 'openFile',
      path,
      status: 'running',
      pid,
      timestamp: Date.now()
    });

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    const file = {
      name: path,
      size: Math.floor(Math.random() * 1000000),
      type: options?.type || 'text/plain',
      exists: () => Promise.resolve(true),
      text: () => Promise.resolve(`Mock file content for ${path}`),
      json: () => Promise.resolve({ mock: true, path, size: SIZE_CONSTANTS.TEST_DATA_SIZE }),
      bytes: () => Promise.resolve(new Uint8Array(SIZE_CONSTANTS.TEST_DATA_SIZE)),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(SIZE_CONSTANTS.TEST_DATA_SIZE)),
      stream: () => ({
        getReader: () => ({
          read: async () => ({ done: true, value: undefined })
        })
      }),
      writer: () => ({
        write: (chunk: any) => chunk.length || chunk.byteLength || 100,
        flush: () => Promise.resolve(SIZE_CONSTANTS.TEST_DATA_SIZE),
        end: () => Promise.resolve(SIZE_CONSTANTS.TEST_DATA_SIZE)
      })
    };

    this.operations.find(op => op.id === id)!.status = 'completed';
    this.operations.find(op => op.id === id)!.result = { size: file.size, type: file.type };

    return file;
  }

  async readFileText(file: any, context?: any) {
    const id = `op_${++this.operationId}`;
    const pid = Math.floor(Math.random() * PROCESS_CONSTANTS.MAX_PID_RANGE) + PROCESS_CONSTANTS.MIN_PID;

    this.operations.push({
      id,
      operation: 'readFileText',
      path: file.name,
      status: 'running',
      pid,
      timestamp: Date.now()
    });

    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));

    const content = `Mock content for ${file.name} - PID ${pid} read this file successfully.`;
    const duration = Math.random() * 100 + 50;

    this.operations.find(op => op.id === id)!.status = 'completed';
    this.operations.find(op => op.id === id)!.duration = duration;
    this.operations.find(op => op.id === id)!.result = { chars: content.length };

    return content;
  }

  async readFileJSON(file: any, schema?: any, context?: any) {
    const id = `op_${++this.operationId}`;
    const pid = Math.floor(Math.random() * PROCESS_CONSTANTS.MAX_PID_RANGE) + PROCESS_CONSTANTS.MIN_PID;

    this.operations.push({
      id,
      operation: 'readFileJSON',
      path: file.name,
      status: 'running',
      pid,
      timestamp: Date.now()
    });

    await new Promise(resolve => setTimeout(resolve, 75 + Math.random() * 125));

    const data = {
      file: file.name,
      pid,
      timestamp: Date.now(),
      mock: true,
      data: `Processed by PID ${pid}`
    };

    this.operations.find(op => op.id === id)!.status = 'completed';
    this.operations.find(op => op.id === id)!.result = { keys: Object.keys(data).length };

    return data;
  }

  async writeFile(destination: string, input: any, options?: any, context?: any) {
    const id = `op_${++this.operationId}`;
    const pid = Math.floor(Math.random() * PROCESS_CONSTANTS.MAX_PID_RANGE) + PROCESS_CONSTANTS.MIN_PID;
    const bytesWritten = typeof input === 'string' ? input.length : input.byteLength || SIZE_CONSTANTS.TEST_DATA_SIZE;

    this.operations.push({
      id,
      operation: 'writeFile',
      path: destination,
      status: 'running',
      pid,
      timestamp: Date.now()
    });

    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    this.operations.push({
      id: `op_${++this.operationId}`,
      operation: 'writeFile',
      path: destination,
      status: 'completed',
      pid,
      duration: Math.random() * 150 + 100,
      result: { bytesWritten },
      timestamp: Date.now()
    });

    return bytesWritten;
  }

  getOperations() {
    return [...this.operations].reverse(); // Most recent first
  }

  clearOperations() {
    this.operations = [];
  }
}

const mockFS = new MockPIDFileSystem();

interface PIDOperation {
  id: string;
  operation: string;
  path: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  result?: any;
  error?: string;
  pid: number;
  timestamp: number;
}

export const PIDFileSystemDemo: React.FC = () => {
  const [operations, setOperations] = useState<PIDOperation[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string>('basic-read');
  const intervalRef = useRef<NodeJS.Timeout>();

  const examples = [
    {
      id: 'basic-read',
      title: 'Basic File Read with PID Tracking',
      description: 'Read a text file with full PID audit trail',
      code: `const fs = PIDFileSystem.getInstance();
const file = await fs.openFile('./data/config.json');
const content = await fs.readFileText(file);
console.log('File read by PID:', process.pid);`
    },
    {
      id: 'json-processing',
      title: 'JSON File Processing',
      description: 'Read and validate JSON with schema checking',
      code: `const fs = PIDFileSystem.getInstance();
const file = await fs.openFile('./data/feeds.json');
const data = await fs.readFileJSON(file, feedSchema);
console.log(\`Processed \${data.feeds.length} feeds\`);`
    },
    {
      id: 'file-write',
      title: 'High-Performance File Write',
      description: 'Write data using Bun\'s optimized syscalls',
      code: `const fs = PIDFileSystem.getInstance();
const data = { processed: true, timestamp: Date.now() };
await fs.writeFile('./output/result.json', JSON.stringify(data));
console.log('Data written with PID tracking');`
    },
    {
      id: 'streaming-process',
      title: 'Streaming File Processing',
      description: 'Process large files with PID-aware streaming',
      code: `const fs = PIDFileSystem.getInstance();
const file = await fs.openFile('./data/large.log');

const results = await fs.processFileStream(file,
  async (chunk) => {
    // Process each chunk
    return chunk.length;
  }
);

console.log(\`Processed \${results.length} chunks\`);`
    },
    {
      id: 'concurrent-operations',
      title: 'Concurrent File Operations',
      description: 'Multiple PID-tracked operations simultaneously',
      code: `const fs = PIDFileSystem.getInstance();

const operations = [
  fs.readFileText(await fs.openFile('./file1.txt')),
  fs.readFileText(await fs.openFile('./file2.txt')),
  fs.writeFile('./output.txt', 'concurrent data')
];

await Promise.all(operations);
console.log('All operations completed with PID tracking');`
    }
  ];

  const runExample = async (exampleId: string) => {
    setIsRunning(true);

    try {
      switch (exampleId) {
        case 'basic-read':
          const file1 = await mockFS.openFile('./data/config.json');
          await mockFS.readFileText(file1);
          break;

        case 'json-processing':
          const file2 = await mockFS.openFile('./data/feeds.json');
          await mockFS.readFileJSON(file2);
          break;

        case 'file-write':
          const data = { processed: true, timestamp: Date.now() };
          await mockFS.writeFile('./output/result.json', JSON.stringify(data));
          break;

        case 'streaming-process':
          const file3 = await mockFS.openFile('./data/large.log');
          // Simulate streaming by calling read multiple times
          for (let i = 0; i < 5; i++) {
            await mockFS.readFileText(file3);
          }
          break;

        case 'concurrent-operations':
          await Promise.all([
            mockFS.readFileText(await mockFS.openFile('./file1.txt')),
            mockFS.readFileText(await mockFS.openFile('./file2.txt')),
            mockFS.writeFile('./output.txt', 'concurrent data')
          ]);
          break;
      }
    } catch (error) {
      console.error('Example execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Update operations list periodically
  React.useEffect(() => {
    const updateOperations = () => {
      setOperations(mockFS.getOperations().slice(0, 20)); // Show last 20 operations
    };

    updateOperations();
    intervalRef.current = setInterval(updateOperations, TIMING_CONSTANTS.SECOND);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'running': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'pending': return '#64748b';
      default: return '#64748b';
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'openFile': return '📁';
      case 'readFileText': return '📖';
      case 'readFileJSON': return '📋';
      case 'writeFile': return '✏️';
      default: return '⚙️';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    return `${ms.toFixed(1)}ms`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="pid-fs-demo">
      <div className="demo-header">
        <h2>🔐 PID-Aware File System Demo</h2>
        <p>Experience Bun's file I/O with complete PID tracking and audit trails</p>
      </div>

      <div className="demo-content">
        {/* Example Selection */}
        <div className="examples-section">
          <h3>File System Examples</h3>
          <div className="example-selector">
            {examples.map(example => (
              <div
                key={example.id}
                className={`example-card ${selectedExample === example.id ? 'selected' : ''}`}
                onClick={() => setSelectedExample(example.id)}
              >
                <h4>{example.title}</h4>
                <p>{example.description}</p>
                <button
                  className="run-example-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    runExample(example.id);
                  }}
                  disabled={isRunning}
                >
                  {isRunning ? 'Running...' : 'Run Example'}
                </button>
              </div>
            ))}
          </div>

          {/* Selected Example Code */}
          <div className="code-preview">
            <h4>Code Preview</h4>
            <pre>
              <code>
                {examples.find(ex => ex.id === selectedExample)?.code}
              </code>
            </pre>
          </div>
        </div>

        {/* PID Operations Monitor */}
        <div className="operations-monitor">
          <div className="monitor-header">
            <h3>PID Operations Monitor</h3>
            <div className="monitor-controls">
              <button
                onClick={() => mockFS.clearOperations()}
                className="clear-btn"
              >
                Clear Log
              </button>
              <div className="stats">
                <span>Total: {operations.length}</span>
                <span>Running: {operations.filter(op => op.status === 'running').length}</span>
                <span>Completed: {operations.filter(op => op.status === 'completed').length}</span>
              </div>
            </div>
          </div>

          <div className="operations-list">
            {operations.length === 0 ? (
              <div className="no-operations">
                <p>No file operations yet. Run an example to see PID tracking in action!</p>
              </div>
            ) : (
              operations.map(operation => (
                <div key={operation.id} className="operation-item">
                  <div className="operation-header">
                    <span className="operation-icon">
                      {getOperationIcon(operation.operation)}
                    </span>
                    <span className="operation-name">{operation.operation}</span>
                    <span className="operation-path">{operation.path}</span>
                    <span
                      className="operation-status"
                      style={{ color: getStatusColor(operation.status) }}
                    >
                      {operation.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="operation-details">
                    <div className="operation-meta">
                      <span>PID: {operation.pid}</span>
                      <span>Time: {formatTimestamp(operation.timestamp)}</span>
                      {operation.duration && (
                        <span>Duration: {formatDuration(operation.duration)}</span>
                      )}
                    </div>

                    {operation.result && (
                      <div className="operation-result">
                        <strong>Result:</strong> {JSON.stringify(operation.result)}
                      </div>
                    )}

                    {operation.error && (
                      <div className="operation-error">
                        <strong>Error:</strong> {operation.error}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="performance-summary">
        <div className="summary-card">
          <h4>Operations Summary</h4>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-label">Total Operations</span>
              <span className="stat-value">{operations.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Success Rate</span>
              <span className="stat-value">
                {operations.length > 0
                  ? Math.round((operations.filter(op => op.status === 'completed').length / operations.length) * 100)
                  : 0
                }%
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Avg Duration</span>
              <span className="stat-value">
                {operations.length > 0
                  ? formatDuration(operations
                      .filter(op => op.duration)
                      .reduce((sum, op) => sum + (op.duration || 0), 0) /
                      operations.filter(op => op.duration).length)
                  : '-'
                }
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Active PIDs</span>
              <span className="stat-value">
                {new Set(operations.map(op => op.pid)).size}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};