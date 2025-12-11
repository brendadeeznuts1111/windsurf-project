// apps/dashboard/src/components/BunFileAPIDocs.tsx
import React, { useState } from 'react';
import './bun-file-api-docs.css';

interface APIEntry {
  name: string;
  type: 'function' | 'method' | 'property';
  parameters?: string;
  returnType: string;
  description: string;
  notes?: string;
  category: 'file' | 'file-methods' | 'write' | 'sink' | 'streams' | 'fs';
}

const BUN_FILE_APIS: APIEntry[] = [
  {
    name: 'Bun.file',
    type: 'function',
    parameters: 'path: string | number | URL, options?: { type?: string }',
    returnType: 'BunFile',
    description: 'Creates a BunFile instance representing a lazily-loaded file. Does not read the file from disk upon initialization.',
    notes: 'Can accept file path, descriptor, or file:// URL. Returns size 0 and text/plain for non-existent files.',
    category: 'file'
  },
  {
    name: 'BunFile.size',
    type: 'property',
    returnType: 'number',
    description: 'Number of bytes in the file. Returns 0 if file does not exist.',
    notes: 'Readonly property.',
    category: 'file-methods'
  },
  {
    name: 'BunFile.type',
    type: 'property',
    returnType: 'string',
    description: 'MIME type of the file. Defaults to text/plain;charset=utf-8.',
    notes: 'Readonly property.',
    category: 'file-methods'
  },
  {
    name: 'BunFile.text',
    type: 'method',
    returnType: 'Promise<string>',
    description: 'Reads file contents as a string.',
    category: 'file-methods'
  },
  {
    name: 'BunFile.json',
    type: 'method',
    returnType: 'Promise<any>',
    description: 'Parses and returns file contents as a JSON object.',
    category: 'file-methods'
  },
  {
    name: 'BunFile.bytes',
    type: 'method',
    returnType: 'Promise<Uint8Array>',
    description: 'Reads file contents as a Uint8Array.',
    category: 'file-methods'
  },
  {
    name: 'BunFile.arrayBuffer',
    type: 'method',
    returnType: 'Promise<ArrayBuffer>',
    description: 'Reads file contents as an ArrayBuffer.',
    category: 'file-methods'
  },
  {
    name: 'BunFile.stream',
    type: 'method',
    returnType: 'ReadableStream',
    description: 'Returns file contents as a ReadableStream.',
    category: 'file-methods'
  },
  {
    name: 'BunFile.exists',
    type: 'method',
    returnType: 'Promise<boolean>',
    description: 'Checks if the file exists on disk.',
    notes: 'Returns false if file does not exist.',
    category: 'file-methods'
  },
  {
    name: 'BunFile.writer',
    type: 'method',
    parameters: 'params?: { highWaterMark?: number }',
    returnType: 'FileSink',
    description: 'Returns a FileSink for incremental writing to the file.',
    notes: 'Used for streaming or chunked writes.',
    category: 'file-methods'
  },
  {
    name: 'Bun.write',
    type: 'function',
    parameters: 'destination: string | number | BunFile | URL, input: string | Blob | ArrayBuffer | SharedArrayBuffer | TypedArray | Response',
    returnType: 'Promise<number>',
    description: 'Writes data to destination using optimized system calls.',
    notes: 'Supports strings, Blobs, binary data, HTTP responses. Uses efficient syscalls based on platform.',
    category: 'write'
  },
  {
    name: 'FileSink.write',
    type: 'method',
    parameters: 'chunk: string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer',
    returnType: 'number',
    description: 'Writes a chunk to the internal buffer. Returns bytes written.',
    category: 'sink'
  },
  {
    name: 'FileSink.flush',
    type: 'method',
    returnType: 'number | Promise<number>',
    description: 'Flushes buffered data to disk. Returns bytes flushed.',
    category: 'sink'
  },
  {
    name: 'FileSink.end',
    type: 'method',
    parameters: 'error?: Error',
    returnType: 'number | Promise<number>',
    description: 'Closes writer and flushes remaining data.',
    category: 'sink'
  },
  {
    name: 'Bun.stdin',
    type: 'property',
    returnType: 'BunFile',
    description: 'BunFile instance representing standard input.',
    notes: 'Can be used with Bun.write() or read via methods.',
    category: 'streams'
  },
  {
    name: 'Bun.stdout',
    type: 'property',
    returnType: 'BunFile',
    description: 'BunFile instance representing standard output.',
    notes: 'Can be written to using Bun.write(Bun.stdout, data).',
    category: 'streams'
  },
  {
    name: 'Bun.stderr',
    type: 'property',
    returnType: 'BunFile',
    description: 'BunFile instance representing standard error.',
    notes: 'Can be written to using Bun.write(Bun.stderr, data).',
    category: 'streams'
  }
];

export const BunFileAPIDocs: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'All APIs' },
    { value: 'file', label: 'File Creation' },
    { value: 'file-methods', label: 'File Methods' },
    { value: 'write', label: 'Writing Data' },
    { value: 'sink', label: 'FileSink' },
    { value: 'streams', label: 'Streams & I/O' }
  ];

  const filteredAPIs = BUN_FILE_APIS.filter(api => {
    const matchesCategory = selectedCategory === 'all' || api.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (api.notes && api.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      file: '#10b981',
      'file-methods': '#3b82f6',
      write: '#f59e0b',
      sink: '#8b5cf6',
      streams: '#ef4444'
    };
    return colors[category as keyof typeof colors] || '#64748b';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      function: '📋',
      method: '⚙️',
      property: '🏷️'
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bun-file-api-docs">
      <div className="api-docs-header">
        <h2>📁 Bun File I/O API Reference</h2>
        <p>Complete reference for Bun's high-performance file system APIs</p>
      </div>

      <div className="api-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search APIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="api-search"
          />
        </div>

        <div className="filter-section">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="api-stats">
        <div className="stat-item">
          <span className="stat-label">Total APIs:</span>
          <span className="stat-value">{BUN_FILE_APIS.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Showing:</span>
          <span className="stat-value">{filteredAPIs.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Categories:</span>
          <span className="stat-value">{categories.length - 1}</span>
        </div>
      </div>

      <div className="api-list">
        {filteredAPIs.map((api, index) => (
          <div
            key={`${api.category}-${index}`}
            className={`api-item ${expandedItem === api.name ? 'expanded' : ''}`}
            onClick={() => setExpandedItem(expandedItem === api.name ? null : api.name)}
          >
            <div className="api-header">
              <div className="api-name-section">
                <span className="api-icon">{getTypeIcon(api.type)}</span>
                <code className="api-name">{api.name}</code>
                <span
                  className="api-category-badge"
                  style={{ backgroundColor: getCategoryColor(api.category) }}
                >
                  {api.category}
                </span>
              </div>

              <div className="api-actions">
                <button
                  className="copy-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(api.name);
                  }}
                  title="Copy API name"
                >
                  📋
                </button>
                <span className="expand-toggle">
                  {expandedItem === api.name ? '−' : '+'}
                </span>
              </div>
            </div>

            <div className="api-summary">
              <span className="api-type">{api.type}</span>
              <span className="api-return">→ {api.returnType}</span>
            </div>

            {expandedItem === api.name && (
              <div className="api-details">
                <div className="api-description">
                  <h4>Description</h4>
                  <p>{api.description}</p>
                </div>

                {api.parameters && (
                  <div className="api-parameters">
                    <h4>Parameters</h4>
                    <code className="param-code">{api.parameters}</code>
                  </div>
                )}

                {api.notes && (
                  <div className="api-notes">
                    <h4>Notes</h4>
                    <p>{api.notes}</p>
                  </div>
                )}

                <div className="api-usage">
                  <h4>Usage Example</h4>
                  <div className="usage-code">
                    {getUsageExample(api)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAPIs.length === 0 && (
        <div className="no-results">
          <p>No APIs found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="reset-filters"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

function getUsageExample(api: APIEntry): JSX.Element {
  const examples: Record<string, JSX.Element> = {
    'Bun.file': (
      <pre><code>{`// Create a BunFile instance
const file = Bun.file('./data.json');

// Check if file exists
const exists = await file.exists();
console.log('File exists:', exists);

// Read as JSON
if (exists) {
  const data = await file.json();
  console.log('File data:', data);
}`}</code></pre>
    ),
    'BunFile.text': (
      <pre><code>{`const file = Bun.file('./document.txt');
const content = await file.text();
console.log('File content:', content);`}</code></pre>
    ),
    'BunFile.json': (
      <pre><code>{`const file = Bun.file('./config.json');
const config = await file.json();
console.log('Config:', config);`}</code></pre>
    ),
    'Bun.write': (
      <pre><code>{`// Write string to file
await Bun.write('./output.txt', 'Hello, Bun!');

// Write JSON data
const data = { message: 'Hello', timestamp: Date.now() };
await Bun.write('./data.json', JSON.stringify(data));

// Write from fetch response
const response = await fetch('https://api.example.com/data');
await Bun.write('./cached-data.json', response);`}</code></pre>
    ),
    'BunFile.writer': (
      <pre><code>{`const file = Bun.file('./log.txt');
const writer = file.writer();

// Write data incrementally
writer.write('Log entry 1\\n');
writer.write('Log entry 2\\n');

// Flush to disk
await writer.flush();

// Close writer
await writer.end();`}</code></pre>
    ),
    'Bun.stdout': (
      <pre><code>{`// Write to stdout
await Bun.write(Bun.stdout, 'Hello, stdout!\\n');

// Pipe fetch response to stdout
const response = await fetch('https://api.example.com/data');
await Bun.write(Bun.stdout, response);`}</code></pre>
    )
  };

  return examples[api.name] || (
    <pre><code>{`// Example usage of ${api.name}
${api.name}(${api.parameters || ''})`}</code></pre>
  );
}