// apps/dashboard/src/components/HeaderEditor.tsx
import React, { useState, useEffect } from 'react';
import { Header } from './HeaderDisplay';
import './header-editor.css';

interface HeaderEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (headers: Record<string, string>) => void;
  initialHeaders?: Record<string, string>;
  endpoint?: string;
  method?: string;
  title?: string;
}

interface HeaderSuggestion {
  name: string;
  value: string;
  description: string;
  category: string;
}

export const HeaderEditor: React.FC<HeaderEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHeaders = {},
  endpoint = '',
  method = 'GET',
  title = 'Edit Headers'
}) => {
  const [headers, setHeaders] = useState<Record<string, string>>(initialHeaders);
  const [newHeaderName, setNewHeaderName] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [suggestions, setSuggestions] = useState<HeaderSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHeaders(initialHeaders);
      generateSuggestions();
    }
  }, [isOpen, initialHeaders, endpoint, method]);

  const generateSuggestions = () => {
    const suggestedHeaders: HeaderSuggestion[] = [];

    // Method-based suggestions
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      suggestedHeaders.push({
        name: 'Content-Type',
        value: 'application/json',
        description: 'Specifies the media type of the request body',
        category: 'Content'
      });
    }

    // Endpoint-based suggestions
    if (endpoint.includes('api.github.com')) {
      suggestedHeaders.push({
        name: 'Authorization',
        value: 'Bearer YOUR_TOKEN_HERE',
        description: 'GitHub API requires authentication',
        category: 'Auth'
      }, {
        name: 'Accept',
        value: 'application/vnd.github.v3+json',
        description: 'GitHub API version specification',
        category: 'API'
      });
    }

    if (endpoint.includes('jsonplaceholder')) {
      suggestedHeaders.push({
        name: 'Content-Type',
        value: 'application/json',
        description: 'JSONPlaceholder expects JSON data',
        category: 'Content'
      });
    }

    // Common suggestions
    suggestedHeaders.push(
      {
        name: 'User-Agent',
        value: 'Bun-Fetch-Demo/1.0',
        description: 'Identifies the client application',
        category: 'Standard'
      },
      {
        name: 'Accept',
        value: 'application/json',
        description: 'Specifies acceptable response formats',
        category: 'Content'
      }
    );

    setSuggestions(suggestedHeaders);
  };

  const addHeader = (name: string, value: string) => {
    setHeaders(prev => ({ ...prev, [name]: value }));
    setNewHeaderName('');
    setNewHeaderValue('');
  };

  const removeHeader = (name: string) => {
    setHeaders(prev => {
      const newHeaders = { ...prev };
      delete newHeaders[name];
      return newHeaders;
    });
  };

  const updateHeader = (name: string, value: string) => {
    setHeaders(prev => ({ ...prev, [name]: value }));
  };

  const applySuggestion = (suggestion: HeaderSuggestion) => {
    addHeader(suggestion.name, suggestion.value);
    setShowSuggestions(false);
  };

  const handleSave = () => {
    onSave(headers);
    onClose();
  };

  const handleCancel = () => {
    setHeaders(initialHeaders);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="header-editor-overlay">
      <div className="header-editor-modal">
        <div className="header-editor-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>

        <div className="header-editor-content">
          {/* Current Headers */}
          <div className="current-headers">
            <h4>Current Headers ({Object.keys(headers).length})</h4>
            {Object.keys(headers).length === 0 ? (
              <p className="no-headers">No headers added yet</p>
            ) : (
              <div className="header-list">
                {Object.entries(headers).map(([name, value]) => (
                  <div key={name} className="header-row">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const newHeaders = { ...headers };
                        delete newHeaders[name];
                        newHeaders[newName] = value;
                        setHeaders(newHeaders);
                      }}
                      className="header-name-input"
                      placeholder="Header name"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateHeader(name, e.target.value)}
                      className="header-value-input"
                      placeholder="Header value"
                    />
                    <button
                      className="remove-btn"
                      onClick={() => removeHeader(name)}
                      title="Remove header"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Header */}
          <div className="add-header">
            <h4>Add Header</h4>
            <div className="add-header-form">
              <input
                type="text"
                value={newHeaderName}
                onChange={(e) => setNewHeaderName(e.target.value)}
                placeholder="Header name (e.g., Authorization)"
                className="header-name-input"
              />
              <input
                type="text"
                value={newHeaderValue}
                onChange={(e) => setNewHeaderValue(e.target.value)}
                placeholder="Header value"
                className="header-value-input"
              />
              <button
                className="add-btn"
                onClick={() => addHeader(newHeaderName, newHeaderValue)}
                disabled={!newHeaderName.trim() || !newHeaderValue.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="header-suggestions">
            <div className="suggestions-header">
              <h4>Suggestions</h4>
              <button
                className="toggle-suggestions"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                {showSuggestions ? 'Hide' : 'Show'} Suggestions
              </button>
            </div>

            {showSuggestions && (
              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-item">
                    <div className="suggestion-info">
                      <div className="suggestion-name">{suggestion.name}</div>
                      <div className="suggestion-value">{suggestion.value}</div>
                      <div className="suggestion-description">{suggestion.description}</div>
                      <span className="suggestion-category">{suggestion.category}</span>
                    </div>
                    <button
                      className="apply-btn"
                      onClick={() => applySuggestion(suggestion)}
                      disabled={headers.hasOwnProperty(suggestion.name)}
                    >
                      {headers.hasOwnProperty(suggestion.name) ? 'Added' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="header-editor-footer">
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save Headers
          </button>
        </div>
      </div>
    </div>
  );
};