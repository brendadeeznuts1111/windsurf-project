// apps/dashboard/src/components/CrossReferenceGuide.tsx
import React from 'react';
import './cross-reference-guide.css';

/**
 * @fileoverview Cross-Reference Guide Component
 * @description Visual guide showing relationships and integrations between all Bun API demos
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link App} - Main application component that orchestrates all demos
 * @see {@link MarketTelemetryDemo} - Telemetry system demonstration
 * @see {@link TCPDemo} - TCP networking demonstration
 * @see {@link BunV13Demo} - Bun v1.3 features demonstration
 */

interface ComponentRelationship {
  from: string;
  to: string;
  type: 'uses' | 'extends' | 'integrates' | 'demonstrates' | 'complements';
  description: string;
}

interface ComponentInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  technologies: string[];
  relatedComponents: string[];
}

const components: ComponentInfo[] = [
  {
    id: 'market-telemetry',
    name: 'Market Telemetry',
    category: 'Telemetry',
    description: 'PID-aware high-frequency market data telemetry with anomaly detection',
    technologies: ['PID Context', 'Audit Trail', 'Rolling Statistics', 'HFT Metrics'],
    relatedComponents: ['tcp-demo', 'bun-v13', 'pid-file-system']
  },
  {
    id: 'tcp-demo',
    name: 'TCP API Demo',
    category: 'Networking',
    description: 'High-performance TCP server/client with connection management',
    technologies: ['Bun.listen', 'Bun.connect', 'TLS', 'Heartbeat', 'Load Testing'],
    relatedComponents: ['market-telemetry', 'bun-v13', 'fetch-demo']
  },
  {
    id: 'bun-v13',
    name: 'Bun v1.3 Enhanced',
    category: 'Runtime Features',
    description: 'Advanced Bun runtime features and stream processing',
    technologies: ['Socket Info', 'Stream Piping', 'Process Control', 'JSON Processing'],
    relatedComponents: ['tcp-demo', 'market-telemetry', 'pid-file-system']
  },
  {
    id: 'fetch-demo',
    name: 'Fetch API Demo',
    category: 'Networking',
    description: 'HTTP networking with comprehensive API testing',
    technologies: ['Bun.fetch', 'REST APIs', 'Performance Testing', 'Error Handling'],
    relatedComponents: ['tcp-demo', 'market-telemetry']
  },
  {
    id: 'pid-file-system',
    name: 'PID File System',
    category: 'File I/O',
    description: 'Process-aware file operations with attribution',
    technologies: ['PID Context', 'File Operations', 'Process Attribution'],
    relatedComponents: ['market-telemetry', 'bun-v13']
  },
  {
    id: 'bun-file-api',
    name: 'Bun File API Docs',
    category: 'File I/O',
    description: 'Complete reference for Bun file I/O operations',
    technologies: ['Bun.file', 'File System', 'Path Operations', 'Streaming'],
    relatedComponents: ['pid-file-system', 'bun-v13']
  }
];

const relationships: ComponentRelationship[] = [
  {
    from: 'market-telemetry',
    to: 'tcp-demo',
    type: 'integrates',
    description: 'Uses TCP for telemetry data transmission'
  },
  {
    from: 'market-telemetry',
    to: 'bun-v13',
    type: 'uses',
    description: 'Leverages stream processing and socket info'
  },
  {
    from: 'market-telemetry',
    to: 'pid-file-system',
    type: 'extends',
    description: 'Extends PID context to file operations'
  },
  {
    from: 'tcp-demo',
    to: 'bun-v13',
    type: 'demonstrates',
    description: 'Shows socket information and stream piping'
  },
  {
    from: 'tcp-demo',
    to: 'fetch-demo',
    type: 'complements',
    description: 'Contrasts TCP vs HTTP networking patterns'
  },
  {
    from: 'bun-v13',
    to: 'pid-file-system',
    type: 'integrates',
    description: 'Process control works with PID file operations'
  },
  {
    from: 'bun-v13',
    to: 'tcp-demo',
    type: 'extends',
    description: 'Enhanced socket APIs improve TCP performance'
  },
  {
    from: 'pid-file-system',
    to: 'bun-file-api',
    type: 'extends',
    description: 'Adds PID attribution to file operations'
  },
  {
    from: 'fetch-demo',
    to: 'market-telemetry',
    type: 'complements',
    description: 'HTTP APIs complement telemetry data sources'
  }
];

export const CrossReferenceGuide: React.FC = () => {
  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'uses': return '🔗';
      case 'extends': return '⬆️';
      case 'integrates': return '🔄';
      case 'demonstrates': return '📚';
      case 'complements': return '🤝';
      default: return '➡️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Telemetry': return '#10b981';
      case 'Networking': return '#3b82f6';
      case 'Runtime Features': return '#f59e0b';
      case 'File I/O': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="cross-reference-guide">
      <div className="guide-header">
        <h2>🔗 Cross-Reference Guide</h2>
        <p>Explore relationships and integrations between Bun API demonstrations</p>
      </div>

      <div className="guide-content">
        {/* Component Overview */}
        <div className="components-overview">
          <h3>📦 Component Overview</h3>
          <div className="components-grid">
            {components.map(component => (
              <div key={component.id} className="component-card">
                <div className="component-header">
                  <span
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(component.category) }}
                  >
                    {component.category}
                  </span>
                  <h4>{component.name}</h4>
                </div>
                <p className="component-description">{component.description}</p>
                <div className="component-tech">
                  <strong>Technologies:</strong>
                  <div className="tech-tags">
                    {component.technologies.map(tech => (
                      <span key={tech} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>
                <div className="component-relations">
                  <strong>Related Components:</strong>
                  <div className="relation-links">
                    {component.relatedComponents.map(relatedId => {
                      const related = components.find(c => c.id === relatedId);
                      return related ? (
                        <span key={relatedId} className="relation-link">
                          {related.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Map */}
        <div className="relationships-map">
          <h3>🗺️ Integration Map</h3>
          <div className="relationships-list">
            {relationships.map((rel, index) => {
              const fromComponent = components.find(c => c.id === rel.from);
              const toComponent = components.find(c => c.id === rel.to);

              return (
                <div key={index} className="relationship-item">
                  <div className="relationship-flow">
                    <span className="component-name from">
                      {fromComponent?.name}
                    </span>
                    <span className="relationship-arrow">
                      {getRelationshipIcon(rel.type)}
                      <span className="relationship-type">{rel.type}</span>
                    </span>
                    <span className="component-name to">
                      {toComponent?.name}
                    </span>
                  </div>
                  <p className="relationship-description">{rel.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Architecture Patterns */}
        <div className="architecture-patterns">
          <h3>🏗️ Architecture Patterns</h3>
          <div className="patterns-grid">
            <div className="pattern-card">
              <h4>🔄 PID Context Propagation</h4>
              <p>Process identity flows through telemetry, file operations, and networking layers</p>
              <div className="pattern-components">
                <span>MarketTelemetry</span> →
                <span>PIDFileSystem</span> →
                <span>AuditTrail</span>
              </div>
            </div>

            <div className="pattern-card">
              <h4>🌊 Stream Processing Pipeline</h4>
              <p>Data flows through stream processing, transformation, and network transmission</p>
              <div className="pattern-components">
                <span>BunV13Demo</span> →
                <span>MarketTelemetry</span> →
                <span>TCPDemo</span>
              </div>
            </div>

            <div className="pattern-card">
              <h4>📊 Real-time Analytics Stack</h4>
              <p>Live data collection, processing, and visualization with anomaly detection</p>
              <div className="pattern-components">
                <span>FetchDemo</span> →
                <span>RollingStats</span> →
                <span>MarketTelemetryDemo</span>
              </div>
            </div>

            <div className="pattern-card">
              <h4>🔐 Security & Audit Chain</h4>
              <p>End-to-end security with cryptographic integrity and audit trails</p>
              <div className="pattern-components">
                <span>PIDContext</span> →
                <span>HMAC Verification</span> →
                <span>AuditTrail</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Reference Matrix */}
        <div className="cross-reference-matrix">
          <h3>📊 Integration Matrix</h3>
          <div className="matrix-container">
            <table className="integration-matrix">
              <thead>
                <tr>
                  <th>Component</th>
                  {components.map(comp => (
                    <th key={comp.id} className="matrix-header">
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {components.map(fromComp => (
                  <tr key={fromComp.id}>
                    <td className="matrix-row-header">{fromComp.name}</td>
                    {components.map(toComp => {
                      const relationship = relationships.find(
                        rel => rel.from === fromComp.id && rel.to === toComp.id
                      );

                      return (
                        <td key={toComp.id} className="matrix-cell">
                          {relationship ? (
                            <span className={`relationship-indicator ${relationship.type}`}>
                              {getRelationshipIcon(relationship.type)}
                            </span>
                          ) : fromComp.id === toComp.id ? (
                            <span className="self-reference">●</span>
                          ) : (
                            <span className="no-relationship">―</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="matrix-legend">
            <div className="legend-item">
              <span className="legend-icon">🔗</span>
              <span>Uses</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">⬆️</span>
              <span>Extends</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🔄</span>
              <span>Integrates</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">📚</span>
              <span>Demonstrates</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🤝</span>
              <span>Complements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};