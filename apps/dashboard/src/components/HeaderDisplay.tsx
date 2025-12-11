// apps/dashboard/src/components/HeaderDisplay.tsx
import React, { useState, useMemo } from 'react';
import './header-display.css';

export interface Header {
  name: string;
  value: string;
  type: 'auth' | 'content' | 'custom' | 'api' | 'cors' | 'standard';
  required: boolean;
  sensitive: boolean;
  description?: string;
}

interface HeaderDisplayProps {
  headers: Record<string, string>;
  onHeaderCopy?: (header: Header) => void;
  onHeaderEdit?: (header: Header) => void;
  searchable?: boolean;
  editable?: boolean;
  compact?: boolean;
}

export const HeaderDisplay: React.FC<HeaderDisplayProps> = ({
  headers,
  onHeaderCopy,
  onHeaderEdit,
  searchable = false,
  editable = false,
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set());

  // Classify headers by type
  const classifiedHeaders: Header[] = useMemo(() => {
    return Object.entries(headers).map(([name, value]) => ({
      name,
      value,
      type: classifyHeaderType(name, value),
      required: isHeaderRequired(name),
      sensitive: isHeaderSensitive(name),
      description: getHeaderDescription(name)
    }));
  }, [headers]);

  // Filter headers based on search
  const filteredHeaders = useMemo(() => {
    if (!searchTerm) return classifiedHeaders;

    return classifiedHeaders.filter(header =>
      header.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      header.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      header.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classifiedHeaders, searchTerm]);

  // Group headers by type
  const groupedHeaders = useMemo(() => {
    const groups: Record<string, Header[]> = {};
    filteredHeaders.forEach(header => {
      if (!groups[header.type]) {
        groups[header.type] = [];
      }
      groups[header.type].push(header);
    });
    return groups;
  }, [filteredHeaders]);

  const toggleHeaderExpansion = (headerName: string) => {
    const newExpanded = new Set(expandedHeaders);
    if (newExpanded.has(headerName)) {
      newExpanded.delete(headerName);
    } else {
      newExpanded.add(headerName);
    }
    setExpandedHeaders(newExpanded);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleHeaderCopy = (header: Header) => {
    const headerText = `${header.name}: ${header.value}`;
    copyToClipboard(headerText);
    onHeaderCopy?.(header);
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      auth: '🔐',
      content: '📄',
      custom: '⚙️',
      api: '🔑',
      cors: '🌐',
      standard: '📋'
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      auth: '#ef4444',
      content: '#10b981',
      custom: '#8b5cf6',
      api: '#f59e0b',
      cors: '#06b6d4',
      standard: '#64748b'
    };
    return colors[type as keyof typeof colors] || '#64748b';
  };

  if (compact) {
    return (
      <div className="header-display compact">
        <div className="header-count">
          {Object.keys(headers).length} headers
        </div>
        <div className="header-badges">
          {classifiedHeaders.slice(0, 3).map(header => (
            <span
              key={header.name}
              className={`header-badge ${header.type} ${header.required ? 'required' : ''}`}
              title={`${header.name}: ${header.value}`}
            >
              {getTypeIcon(header.type)} {header.name}
            </span>
          ))}
          {classifiedHeaders.length > 3 && (
            <span className="header-badge more">
              +{classifiedHeaders.length - 3} more
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="header-display">
      {searchable && (
        <div className="header-search">
          <input
            type="text"
            placeholder="Search headers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="header-search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      )}

      <div className="header-groups">
        {Object.entries(groupedHeaders).map(([type, typeHeaders]) => (
          <div key={type} className="header-group">
            <div className="header-group-header">
              <span
                className="header-group-icon"
                style={{ color: getTypeColor(type) }}
              >
                {getTypeIcon(type)}
              </span>
              <span className="header-group-title">
                {type.charAt(0).toUpperCase() + type.slice(1)} Headers
              </span>
              <span className="header-group-count">({typeHeaders.length})</span>
            </div>

            <div className="header-list">
              {typeHeaders.map(header => {
                const isExpanded = expandedHeaders.has(header.name);
                const displayValue = header.sensitive && !isExpanded
                  ? '••••••••'
                  : header.value;

                return (
                  <div key={header.name} className="header-item">
                    <div className="header-main">
                      <div className="header-name-section">
                        <span className="header-name">{header.name}</span>
                        {header.required && (
                          <span className="required-indicator" title="Required header">
                            *
                          </span>
                        )}
                        {header.sensitive && (
                          <span className="sensitive-indicator" title="Sensitive data">
                            👁️
                          </span>
                        )}
                      </div>

                      <div className="header-value-section">
                        <span className="header-value">
                          {displayValue.length > 50 && !isExpanded
                            ? `${displayValue.substring(0, 50)}...`
                            : displayValue
                          }
                        </span>

                        <div className="header-actions">
                          {header.sensitive && (
                            <button
                              className="header-action-btn"
                              onClick={() => toggleHeaderExpansion(header.name)}
                              title={isExpanded ? 'Hide sensitive data' : 'Show sensitive data'}
                            >
                              {isExpanded ? '🙈' : '👁️'}
                            </button>
                          )}

                          <button
                            className="header-action-btn"
                            onClick={() => handleHeaderCopy(header)}
                            title="Copy header"
                          >
                            📋
                          </button>

                          {editable && onHeaderEdit && (
                            <button
                              className="header-action-btn"
                              onClick={() => onHeaderEdit(header)}
                              title="Edit header"
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {header.description && (
                      <div className="header-description">
                        {header.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredHeaders.length === 0 && searchTerm && (
        <div className="no-headers-found">
          No headers found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

// Helper functions for header classification
function classifyHeaderType(name: string, value: string): Header['type'] {
  const lowerName = name.toLowerCase();
  const lowerValue = value.toLowerCase();

  if (lowerName.includes('authorization') || lowerName.includes('auth') ||
      lowerValue.includes('bearer') || lowerValue.includes('basic')) {
    return 'auth';
  }

  if (lowerName.includes('content-type') || lowerName.includes('accept') ||
      lowerName.includes('encoding')) {
    return 'content';
  }

  if (lowerName.includes('x-api') || lowerName.includes('api-key') ||
      lowerValue.includes('sk-') || lowerValue.includes('pk-')) {
    return 'api';
  }

  if (lowerName.includes('origin') || lowerName.includes('cors') ||
      lowerName.includes('access-control')) {
    return 'cors';
  }

  if (lowerName.includes('x-') || lowerName.includes('custom')) {
    return 'custom';
  }

  return 'standard';
}

function isHeaderRequired(name: string): boolean {
  const requiredHeaders = [
    'content-type',
    'authorization',
    'host'
  ];

  return requiredHeaders.some(required =>
    name.toLowerCase().includes(required)
  );
}

function isHeaderSensitive(name: string): boolean {
  const sensitiveHeaders = [
    'authorization',
    'x-api-key',
    'api-key',
    'token',
    'secret',
    'password',
    'cookie'
  ];

  return sensitiveHeaders.some(sensitive =>
    name.toLowerCase().includes(sensitive)
  );
}

function getHeaderDescription(name: string): string | undefined {
  const descriptions: Record<string, string> = {
    'content-type': 'Specifies the media type of the request body',
    'authorization': 'Contains credentials for authenticating the client',
    'accept': 'Specifies which content types the client can understand',
    'user-agent': 'Identifies the client software making the request',
    'x-api-key': 'API key for authentication with the service',
    'origin': 'Indicates the origin of the request for CORS',
    'cache-control': 'Directives for caching mechanisms'
  };

  return descriptions[name.toLowerCase()];
}