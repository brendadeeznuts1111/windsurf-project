// apps/dashboard/src/components/FetchDemo.tsx
import React, { useState, useRef, useEffect } from 'react';
import { HeaderDisplay, type Header } from './HeaderDisplay';
import { HeaderEditor } from './HeaderEditor';
import './fetch-demo.css';
import { TIMING_CONSTANTS, SIZE_CONSTANTS } from '../constants';

interface FetchExample {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'advanced' | 'bun-specific' | 'streaming' | 'websocket';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  code: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  bunFeatures: string[];
  estimatedTime: number; // ms
}

interface FetchResult {
  id: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  duration: number;
  size: number;
  timestamp: number;
  error?: string;
}

const FETCH_EXAMPLES: FetchExample[] = [
  {
    id: 'basic-get',
    title: 'Basic GET Request',
    description: 'Simple GET request to JSONPlaceholder API',
    category: 'basic',
    difficulty: 'beginner',
    code: `const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
const user = await response.json();
console.log('User:', user);`,
    endpoint: 'https://jsonplaceholder.typicode.com/users/1',
    method: 'GET',
    bunFeatures: ['native-fetch'],
    estimatedTime: 200
  },
  {
    id: 'custom-api-get',
    title: 'Custom API Endpoint',
    description: 'Make requests to your configured API endpoints (configure in Settings)',
    category: 'basic',
    difficulty: 'beginner',
    code: `// Uses your configured API endpoint from Settings
const response = await fetch('https://dev.api.example.com/users/1');
const data = await response.json();
console.log('API Response:', data);`,
    endpoint: 'https://dev.api.example.com/users/1',
    method: 'GET',
    bunFeatures: ['native-fetch', 'custom-endpoints', 'configurable'],
    estimatedTime: 300
  },
  {
    id: 'post-json',
    title: 'POST with JSON Body',
    description: 'Create a new post with JSON data',
    category: 'basic',
    difficulty: 'beginner',
    code: `const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Bun Fetch Demo',
    body: 'Testing POST requests with Bun!',
    userId: 1
  })
});
const post = await response.json();
console.log('Created post:', post);`,
    endpoint: 'https://jsonplaceholder.typicode.com/posts',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { title: 'Bun Fetch Demo', body: 'Testing POST requests with Bun!', userId: 1 },
    bunFeatures: ['json-body', 'headers'],
    estimatedTime: 300
  },
  {
    id: 'custom-api-post',
    title: 'Custom API with Auth',
    description: 'POST to your configured API with authentication headers',
    category: 'advanced',
    difficulty: 'intermediate',
    code: `const response = await fetch('https://dev.api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'developer'
  })
});

if (!response.ok) {
  throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
}

const user = await response.json();
console.log('Created user:', user);`,
    endpoint: 'https://dev.api.example.com/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_TOKEN',
      'X-API-Key': 'your-api-key'
    },
    body: { name: 'John Doe', email: 'john@example.com', role: 'developer' },
    bunFeatures: ['authentication', 'custom-headers', 'error-handling'],
    estimatedTime: 500
  },
  {
    id: 'dns-prefetch',
    title: 'DNS Prefetch + Fetch',
    description: 'Prefetch DNS before making requests for faster connections',
    category: 'bun-specific',
    difficulty: 'intermediate',
    code: `// Prefetch DNS for faster connection
await Bun.dns.prefetch('jsonplaceholder.typicode.com');

// Now fetch (should be faster due to DNS prefetch)
const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
const post = await response.json();
console.log('Post with DNS prefetch:', post);`,
    endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    bunFeatures: ['dns-prefetch', 'performance'],
    estimatedTime: 150
  },
  {
    id: 'file-upload',
    title: 'File Upload with Bun.file()',
    description: 'Upload files efficiently using Bun.file()',
    category: 'bun-specific',
    difficulty: 'intermediate',
    code: `// Create a file to upload (simulated)
const fileData = JSON.stringify({ message: 'Hello from Bun!', timestamp: Date.now() });
const file = new File([fileData], 'data.json', { type: 'application/json' });

// Upload using fetch
const response = await fetch('https://httpbin.org/post', {
  method: 'POST',
  body: file
});

const result = await response.json();
console.log('Upload result:', result);`,
    endpoint: 'https://httpbin.org/post',
    method: 'POST',
    bunFeatures: ['bun-file', 'streaming'],
    estimatedTime: 500
  },
  {
    id: 'concurrent-requests',
    title: 'Concurrent Requests',
    description: 'Make multiple requests concurrently with Promise.all',
    category: 'advanced',
    difficulty: 'intermediate',
    code: `// Make multiple concurrent requests
const urls = [
  'https://jsonplaceholder.typicode.com/users/1',
  'https://jsonplaceholder.typicode.com/users/2',
  'https://jsonplaceholder.typicode.com/users/3'
];

const startTime = Date.now();
const responses = await Promise.all(
  urls.map(url => fetch(url).then(r => r.json()))
);
const endTime = Date.now();

console.log(\`Fetched \${responses.length} users in \${endTime - startTime}ms\`);
console.log('First user:', responses[0]);`,
    endpoint: 'https://jsonplaceholder.typicode.com/users/1',
    method: 'GET',
    bunFeatures: ['concurrent', 'promise-all'],
    estimatedTime: 400
  },
  {
    id: 'error-handling',
    title: 'Error Handling & Retry',
    description: 'Handle network errors and implement retry logic',
    category: 'advanced',
    difficulty: 'advanced',
    code: `async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      return await response.json();
    } catch (error) {
      console.log(\`Attempt \${i + 1} failed:\`, error.message);
      if (i === maxRetries - 1) throw error;
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * TIMING_CONSTANTS.SECOND));
    }
  }
}

try {
  const data = await fetchWithRetry('https://httpbin.org/status/500');
  console.log('Success:', data);
} catch (error) {
  console.log('Final error:', error.message);
}`,
    endpoint: 'https://httpbin.org/status/500',
    method: 'GET',
    bunFeatures: ['error-handling', 'retry-logic'],
    estimatedTime: TIMING_CONSTANTS.TWO_SECONDS
  },
  {
    id: 'bun-file-upload',
    title: 'File Upload with Bun.file()',
    description: 'Upload files efficiently using Bun\'s native file handling',
    category: 'file-io',
    difficulty: 'intermediate',
    code: `// Create a sample file for demonstration
const sampleData = {
  message: 'Hello from Bun Fetch API Demo!',
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
};

const jsonData = JSON.stringify(sampleData, null, 2);
const file = new File([jsonData], 'demo-data.json', {
  type: 'application/json'
});

// Upload using fetch with Bun's efficient file handling
const response = await fetch('https://httpbin.org/post', {
  method: 'POST',
  body: file
});

const result = await response.json();
console.log('Upload successful!');
console.log('File size:', file.size, 'bytes');
console.log('Response:', result);`,
    endpoint: 'https://httpbin.org/post',
    method: 'POST',
    bunFeatures: ['bun-file', 'file-upload', 'streaming'],
    estimatedTime: 800
  },
  {
    id: 'large-file-handling',
    title: 'Large File Streaming',
    description: 'Handle large files with streaming and Bun.write()',
    category: 'file-io',
    difficulty: 'advanced',
    code: `// Simulate downloading a large file
const response = await fetch('https://httpbin.org/stream/1000');

// Stream processing - efficient for large files
const reader = response.body?.getReader();
let totalBytes = 0;
const chunks = [];

while (true) {
  const { done, value } = await reader?.read() || { done: true };
  if (done) break;

  chunks.push(value);
  totalBytes += value.length;

  // Process chunk (simulate real processing)
  console.log(\`Processed chunk: \${value.length} bytes\`);
}

console.log(\`Total downloaded: \${totalBytes} bytes\`);
console.log(\`Number of chunks: \${chunks.length}\`);

// In a real app, you might save to file:
// await Bun.write('./large-file.dat', new Uint8Array(totalBytes));`,
    endpoint: 'https://httpbin.org/stream/1000',
    method: 'GET',
    bunFeatures: ['streaming', 'large-files', 'memory-efficient'],
    estimatedTime: 1500
  },
  {
    id: 'concurrent-downloads',
    title: 'Concurrent File Downloads',
    description: 'Download multiple files concurrently with progress tracking',
    category: 'file-io',
    difficulty: 'advanced',
    code: `async function downloadFile(url: string, filename: string) {
  const response = await fetch(url);
  const contentLength = response.headers.get('content-length');
  const total = parseInt(contentLength || '0');

  let downloaded = 0;
  const chunks = [];

  const reader = response.body?.getReader();

  while (true) {
    const { done, value } = await reader?.read() || { done: true };
    if (done) break;

    chunks.push(value);
    downloaded += value.length;

    // Progress tracking
    const progress = total > 0 ? (downloaded / total * 100).toFixed(1) : 'unknown';
    console.log(\`\${filename}: \${progress}% complete (\${downloaded} bytes)\`);
  }

  return { filename, data: new Uint8Array(downloaded), size: downloaded };
}

// Download multiple files concurrently
const files = [
  { url: 'https://httpbin.org/json', name: 'data1.json' },
  { url: 'https://httpbin.org/xml', name: 'data2.xml' },
  { url: 'https://httpbin.org/html', name: 'data3.html' }
];

console.log('Starting concurrent downloads...');
const startTime = Date.now();

const results = await Promise.all(
  files.map(file => downloadFile(file.url, file.name))
);

const endTime = Date.now();
const totalTime = endTime - startTime;

console.log(\`All downloads completed in \${totalTime}ms\`);
results.forEach(result => {
  console.log(\`\${result.filename}: \${result.size} bytes\`);
});`,
    endpoint: 'https://httpbin.org/json',
    method: 'GET',
    bunFeatures: ['concurrent', 'progress-tracking', 'file-downloads'],
    estimatedTime: TIMING_CONSTANTS.TWO_SECONDS
  },
  {
    id: 'bun-file-operations',
    title: 'Bun File System Integration',
    description: 'Combine fetch with Bun\'s file system operations',
    category: 'file-io',
    difficulty: 'advanced',
    code: `// Fetch data and save to file using Bun.write
async function fetchAndSave(url: string, filename: string) {
  console.log(\`Fetching \${url}...\`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }

  const data = await response.arrayBuffer();
  const bytes = new Uint8Array(data);

  // Save using Bun.write (efficient system calls)
  const bytesWritten = await Bun.write(filename, bytes);

  console.log(\`Saved \${bytesWritten} bytes to \${filename}\`);

  // Verify file was created
  const file = Bun.file(filename);
  const exists = await file.exists();
  const size = file.size;

  console.log(\`File verification: exists=\${exists}, size=\${size}\`);

  return { filename, bytesWritten, verified: exists && size === bytesWritten };
}

// Demonstrate file operations
try {
  const result = await fetchAndSave(
    'https://httpbin.org/json',
    'fetched-data.json'
  );

  console.log('Operation successful:', result);

  // Read back the file to verify
  const savedFile = Bun.file('fetched-data.json');
  const content = await savedFile.text();
  console.log('File content preview:', content.substring(0, 100) + '...');

} catch (error) {
  console.error('Operation failed:', error);
}`,
    endpoint: 'https://httpbin.org/json',
    method: 'GET',
    bunFeatures: ['bun-write', 'file-system', 'verification'],
    estimatedTime: 1200
  },
  {
    id: 'proxy-headers',
    title: 'Proxy with Custom Headers (Bun v1.3.4+)',
    description: 'Use proxy servers with custom authentication headers and routing configuration',
    category: 'advanced',
    difficulty: 'advanced',
    code: `// Bun v1.3.4+ supports custom proxy headers for authentication and routing
// This is useful for corporate proxies, authenticated proxy services, etc.

// Traditional proxy string (still supported)
const response1 = await fetch('https://httpbin.org/ip', {
  proxy: 'http://proxy.example.com:8080'
});

// NEW: Proxy with custom headers for authentication
const response2 = await fetch('https://httpbin.org/ip', {
  proxy: {
    url: 'http://proxy.example.com:8080',
    headers: {
      'Proxy-Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'X-Proxy-Routing': 'us-east-1',
      'X-Custom-Header': 'custom-value',
      'User-Agent': 'Bun-Proxy-Client/1.3.4'
    }
  }
});

// For HTTPS targets, headers are sent in CONNECT requests
// For HTTP targets, headers are sent in direct proxy requests
const data = await response2.json();
console.log('📡 Proxy response:', data);

// Headers take precedence over URL-embedded credentials
const response3 = await fetch('https://httpbin.org/ip', {
  proxy: {
    url: 'http://user:pass@proxy.example.com:8080',
    headers: {
      'Proxy-Authorization': 'Bearer token' // This overrides user:pass
    }
  }
});`,
    endpoint: 'https://httpbin.org/ip',
    method: 'GET',
    bunFeatures: ['proxy-headers', 'fetch-advanced', 'authentication'],
    estimatedTime: TIMING_CONSTANTS.TWO_SECONDS
  }
];

export const FetchDemo: React.FC = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [executingRequests, setExecutingRequests] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, FetchResult>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [headerEditorOpen, setHeaderEditorOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<FetchExample | null>(null);
  const [customEndpoint, setCustomEndpoint] = useState('https://dev.api.example.com');
  const [showSettings, setShowSettings] = useState(false);

  const filteredExamples = FETCH_EXAMPLES.filter(example => {
    if (selectedCategory !== 'all' && example.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && example.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const executeExample = async (example: FetchExample) => {
    const startTime = Date.now();
    setExecutingRequests(prev => new Set(prev).add(example.id));

    try {
      let response: Response;

      if (example.id === 'dns-prefetch') {
        // Special handling for DNS prefetch example
        await Bun.dns.prefetch('jsonplaceholder.typicode.com');
        response = await fetch(example.endpoint, {
          method: example.method,
          headers: example.headers,
          body: example.body ? JSON.stringify(example.body) : undefined
        });
      } else if (example.id === 'file-upload') {
        // Special handling for file upload
        const fileData = JSON.stringify({ message: 'Hello from Bun!', timestamp: Date.now() });
        const file = new File([fileData], 'data.json', { type: 'application/json' });
        response = await fetch(example.endpoint, {
          method: example.method,
          body: file
        });
      } else if (example.id === 'concurrent-requests') {
        // Special handling for concurrent requests
        const urls = [
          'https://jsonplaceholder.typicode.com/users/1',
          'https://jsonplaceholder.typicode.com/users/2',
          'https://jsonplaceholder.typicode.com/users/3'
        ];
        const responses = await Promise.all(urls.map(url => fetch(url)));
        const data = await Promise.all(responses.map(r => r.json()));
        response = new Response(JSON.stringify({
          message: `Fetched ${data.length} users concurrently`,
          firstUser: data[0]
        }));
      } else if (example.id === 'error-handling') {
        // Special handling for error handling example
        try {
          response = await fetch(example.endpoint);
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
          response = new Response(JSON.stringify({
            error: error.message,
            message: 'This demonstrates error handling - the endpoint returns a 500 error'
          }));
        }
      } else if (example.id === 'bun-file-upload') {
        // Special handling for Bun file upload example
        const sampleData = {
          message: 'Hello from Bun Fetch API Demo!',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        const jsonData = JSON.stringify(sampleData, null, 2);
        const file = new File([jsonData], 'demo-data.json', {
          type: 'application/json'
        });

        response = await fetch(example.endpoint, {
          method: example.method,
          body: file
        });
      } else if (example.id === 'large-file-handling') {
        // Special handling for large file streaming
        response = await fetch(example.endpoint);
        // Simulate processing chunks
        const reader = response.body?.getReader();
        let totalBytes = 0;
        let chunks = 0;

        try {
          while (true) {
            const { done, value } = await reader?.read() || { done: true };
            if (done) break;
            totalBytes += value.length;
            chunks++;
          }
        } finally {
          reader?.releaseLock();
        }

        // Return summary instead of raw data
        response = new Response(JSON.stringify({
          message: `Successfully streamed ${totalBytes} bytes in ${chunks} chunks`,
          totalBytes,
          chunks,
          averageChunkSize: Math.round(totalBytes / chunks)
        }));
      } else if (example.id === 'concurrent-downloads') {
        // Special handling for concurrent downloads
        const files = [
          { url: 'https://httpbin.org/json', name: 'data1.json' },
          { url: 'https://httpbin.org/xml', name: 'data2.xml' },
          { url: 'https://httpbin.org/html', name: 'data3.html' }
        ];

        const downloadPromises = files.map(async (file) => {
          const fileResponse = await fetch(file.url);
          const contentLength = fileResponse.headers.get('content-length');
          const total = parseInt(contentLength || '0');
          const data = await fileResponse.arrayBuffer();
          return {
            filename: file.name,
            size: data.byteLength,
            total: total || data.byteLength
          };
        });

        const results = await Promise.all(downloadPromises);
        response = new Response(JSON.stringify({
          message: `Downloaded ${results.length} files concurrently`,
          files: results,
          totalBytes: results.reduce((sum, file) => sum + file.size, 0)
        }));
      } else if (example.id === 'bun-file-operations') {
        // Special handling for Bun file operations
        response = await fetch(example.endpoint);
        const data = await response.arrayBuffer();

        response = new Response(JSON.stringify({
          message: 'File operation simulation completed',
          originalSize: data.byteLength,
          wouldSaveAs: 'fetched-data.json',
          bunFeatures: ['Bun.write', 'Bun.file', 'file.exists()', 'file.size'],
          note: 'In actual Bun runtime, this would save to disk using efficient system calls'
        }));
      } else if (example.id === 'custom-api-get') {
        // Special handling for custom API GET - use configured endpoint
        const endpoint = example.endpoint.replace('https://dev.api.example.com', customEndpoint);
        response = await fetch(endpoint, {
          method: example.method,
          headers: example.headers,
          body: example.body ? JSON.stringify(example.body) : undefined
        });
      } else if (example.id === 'custom-api-post') {
        // Special handling for custom API POST - use configured endpoint
        const endpoint = example.endpoint.replace('https://dev.api.example.com', customEndpoint);
        response = await fetch(endpoint, {
          method: example.method,
          headers: example.headers,
          body: example.body ? JSON.stringify(example.body) : undefined
        });
      } else {
        // Standard fetch request
        response = await fetch(example.endpoint, {
          method: example.method,
          headers: example.headers,
          body: example.body ? JSON.stringify(example.body) : undefined
        });
      }

      const endTime = Date.now();
      const responseText = await response.text();
      let body;
      try {
        body = JSON.parse(responseText);
      } catch {
        body = responseText;
      }

      const result: FetchResult = {
        id: example.id,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        duration: endTime - startTime,
        size: new Blob([responseText]).size,
        timestamp: endTime
      };

      setResults(prev => new Map(prev).set(example.id, result));

    } catch (error) {
      const endTime = Date.now();
      const result: FetchResult = {
        id: example.id,
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: null,
        duration: endTime - startTime,
        size: 0,
        timestamp: endTime,
        error: error.message
      };

      setResults(prev => new Map(prev).set(example.id, result));
    } finally {
      setExecutingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(example.id);
        return newSet;
      });
    }
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      basic: '#10b981',
      advanced: '#f59e0b',
      'bun-specific': '#8b5cf6',
      streaming: '#ef4444',
      websocket: '#06b6d4'
    };
    return colors[category as keyof typeof colors] || '#64748b';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[difficulty as keyof typeof colors] || '#64748b';
  };

  const handleEditHeaders = (example: FetchExample) => {
    setEditingExample(example);
    setHeaderEditorOpen(true);
  };

  const handleSaveHeaders = (newHeaders: Record<string, string>) => {
    if (editingExample) {
      // In a real app, this would update the example in state or send to server
      console.log('Saving headers for example:', editingExample.id, newHeaders);
      // For demo purposes, we'll just log the change
    }
    setHeaderEditorOpen(false);
    setEditingExample(null);
  };

  return (
    <div className="fetch-demo">
      <div className="demo-header">
        <h2>🚀 Bun Fetch API Interactive Demo</h2>
        <p>Click cards to expand and run live examples showcasing Bun's powerful fetch capabilities</p>
      </div>

      {/* Filters */}
      <div className="demo-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="basic">Basic</option>
            <option value="advanced">Advanced</option>
            <option value="bun-specific">Bun Specific</option>
            <option value="streaming">Streaming</option>
            <option value="file-io">File I/O</option>
            <option value="websocket">WebSocket</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Difficulty:</label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="filter-group">
          <button
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <h4>API Configuration</h4>
          <div className="setting-group">
            <label>Custom API Base URL:</label>
            <input
              type="url"
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              placeholder="https://your-api.example.com"
              className="endpoint-input"
            />
            <small>Used for custom API examples. Make sure CORS is enabled.</small>
          </div>
          <div className="setting-actions">
            <button
              onClick={() => setShowSettings(false)}
              className="close-settings-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Example Cards */}
      <div className="demo-cards">
        {filteredExamples.map((example) => {
          const isExpanded = expandedCard === example.id;
          const isExecuting = executingRequests.has(example.id);
          const result = results.get(example.id);

          return (
            <div
              key={example.id}
              className={`demo-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleCard(example.id)}
            >
              <div className="card-header">
                <div className="card-title-section">
                  <h3>{example.title}</h3>
                  <div className="card-badges">
                    <span
                      className="badge category"
                      style={{ backgroundColor: getCategoryColor(example.category) }}
                    >
                      {example.category}
                    </span>
                    <span
                      className="badge difficulty"
                      style={{ backgroundColor: getDifficultyColor(example.difficulty) }}
                    >
                      {example.difficulty}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="execute-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeExample(example);
                    }}
                    disabled={isExecuting}
                  >
                    {isExecuting ? 'Running...' : 'Run Example'}
                  </button>
                  <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
                </div>
              </div>

              <p className="card-description">{example.description}</p>

              {isExpanded && (
                <div className="card-expanded">
                  {/* Code Preview */}
                  <div className="code-section">
                    <h4>Code:</h4>
                    <pre className="code-block">
                      <code>{example.code}</code>
                    </pre>
                  </div>

                  {/* Bun Features */}
                  <div className="features-section">
                    <h4>Bun Features:</h4>
                    <div className="feature-tags">
                      {example.bunFeatures.map(feature => (
                        <span key={feature} className="feature-tag">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Result */}
                  {result && (
                    <div className="result-section">
                      <h4>Result:</h4>
                      <div className="result-content">
                        <div className="result-meta">
                          <span className={`status ${result.status >= 200 && result.status < 300 ? 'success' : 'error'}`}>
                            {result.status} {result.statusText}
                          </span>
                          <span className="duration">{result.duration}ms</span>
                          <span className="size">{(result.size / SIZE_CONSTANTS.KB).toFixed(2)} KB</span>
                        </div>
                        {result.error ? (
                          <div className="error-display">
                            <strong>Error:</strong> {result.error}
                          </div>
                        ) : (
                          <pre className="result-body">
                            {typeof result.body === 'string'
                              ? result.body
                              : JSON.stringify(result.body, null, 2)
                            }
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Request Details */}
                  <div className="request-details">
                    <h4>Request Details:</h4>
                    <div className="details-grid">
                      <div><strong>Method:</strong> {example.method}</div>
                      <div><strong>Endpoint:</strong> {example.endpoint}</div>
                      <div><strong>Est. Time:</strong> {example.estimatedTime}ms</div>
                    </div>

                    {example.headers && (
                      <div className="headers-section">
                        <div className="headers-header">
                          <h4>Headers:</h4>
                          <button
                            className="edit-headers-btn"
                            onClick={() => handleEditHeaders(example)}
                          >
                            ✏️ Edit Headers
                          </button>
                        </div>
                        <HeaderDisplay
                          headers={example.headers}
                          searchable={true}
                          onHeaderCopy={(header) => {
                            console.log('Copied header:', header);
                            // Could add toast notification here
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="demo-stats">
        <div className="stat-card">
          <h4>Examples</h4>
          <span className="stat-value">{filteredExamples.length}</span>
        </div>
        <div className="stat-card">
          <h4>Executed</h4>
          <span className="stat-value">{results.size}</span>
        </div>
        <div className="stat-card">
          <h4>Success Rate</h4>
          <span className="stat-value">
            {results.size > 0
              ? Math.round((Array.from(results.values()).filter(r => r.status >= 200 && r.status < 300).length / results.size) * 100)
              : 0
            }%
          </span>
        </div>
        <div className="stat-card">
          <h4>Avg Response</h4>
          <span className="stat-value">
            {results.size > 0
              ? Math.round(Array.from(results.values()).reduce((sum, r) => sum + r.duration, 0) / results.size)
              : 0
            }ms
          </span>
        </div>
      </div>

      {/* Header Editor Modal */}
      <HeaderEditor
        isOpen={headerEditorOpen}
        onClose={() => setHeaderEditorOpen(false)}
        onSave={handleSaveHeaders}
        initialHeaders={editingExample?.headers || {}}
        endpoint={editingExample?.endpoint}
        method={editingExample?.method}
        title={`Edit Headers - ${editingExample?.title || 'Custom Example'}`}
      />
    </div>
  );
};