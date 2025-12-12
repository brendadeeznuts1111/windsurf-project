/**
 * @fileoverview ORCA Dashboard Component
 * @description Displays HB47 Mega Registry data with packages, registries, APIs, and versioning
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import './orca-dashboard.css';

interface OrcaStats {
  totalPackages: number;
  activeRegistries: number;
  apiEndpoints: number;
  versionReleases: number;
  totalFactors: number;
  totalDataPoints: number;
  byTier: Record<string, number>;
  byRegion: Record<string, number>;
  cryptoEnabled: number;
  websocketEnabled: number;
  avgApiRateLimit: number;
  lastUpdated: string;
}

interface OrcaPackage {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  downloads: number;
  tier: string;
  megaScore: number;
  type: string;
  region: string;
  properties: string[];
  latency: number;
  uptime: number;
  sharpness: number;
  cryptoAccepted: boolean;
  websocketSupported: boolean;
}

interface OrcaRegistry {
  name: string;
  url: string;
  status: string;
  packages: number;
  lastSync: string | null;
}

interface OrcaEndpoint {
  path: string;
  method: string;
  status: string;
  latency: number;
  requests: number;
  category: string;
}

interface OrcaRelease {
  package: string;
  version: string;
  description: string;
  releasedAt: string;
  author: string;
  tier: string;
  changes: string[];
}

type TabType = 'packages' | 'registries' | 'apis' | 'versioning';

const OrcaDashboard: React.FC = () => {
  const [stats, setStats] = useState<OrcaStats | null>(null);
  const [packages, setPackages] = useState<OrcaPackage[]>([]);
  const [registries, setRegistries] = useState<OrcaRegistry[]>([]);
  const [endpoints, setEndpoints] = useState<OrcaEndpoint[]>([]);
  const [releases, setReleases] = useState<OrcaRelease[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('packages');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, packagesRes, registriesRes, endpointsRes, releasesRes] = await Promise.all([
        fetch('/api/orca/stats'),
        fetch('/api/orca/packages'),
        fetch('/api/orca/registries'),
        fetch('/api/orca/endpoints'),
        fetch('/api/orca/releases')
      ]);

      if (!statsRes.ok || !packagesRes.ok || !registriesRes.ok || !endpointsRes.ok || !releasesRes.ok) {
        throw new Error('Failed to fetch ORCA data');
      }

      const [statsData, packagesData, registriesData, endpointsData, releasesData] = await Promise.all([
        statsRes.json(),
        packagesRes.json(),
        registriesRes.json(),
        endpointsRes.json(),
        releasesRes.json()
      ]);

      setStats(statsData.data);
      setPackages(packagesData.data.packages);
      setRegistries(registriesData.data.registries);
      setEndpoints(endpointsData.data.endpoints);
      setReleases(releasesData.data.releases);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeClass = (tier: string): string => {
    const classes: Record<string, string> = {
      hyper: 'badge-hyper',
      high: 'badge-high',
      medium: 'badge-medium',
      low: 'badge-low',
      minimal: 'badge-minimal'
    };
    return classes[tier] || 'badge-default';
  };

  const getStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      connected: 'status-ok',
      active: 'status-ok',
      online: 'status-ok',
      offline: 'status-error',
      external: 'status-warn'
    };
    return classes[status] || 'status-default';
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pkg.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'all' || pkg.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  if (loading && !stats) {
    return (
      <div className="orca-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading ORCA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orca-dashboard">
      <header className="orca-header">
        <h1>ORCA API Dashboard</h1>
        <p className="subtitle">Packages - Registries - APIs - Versioning</p>
        {stats && (
          <p className="timestamp">Last updated: {new Date(stats.lastUpdated).toLocaleString()}</p>
        )}
        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Packages</h3>
            <span className="stat-value">{stats.totalPackages}</span>
          </div>
          <div className="stat-card">
            <h3>Active Registries</h3>
            <span className="stat-value">{stats.activeRegistries}</span>
          </div>
          <div className="stat-card">
            <h3>API Endpoints</h3>
            <span className="stat-value">{stats.apiEndpoints}</span>
          </div>
          <div className="stat-card">
            <h3>Data Points</h3>
            <span className="stat-value">{stats.totalDataPoints}</span>
          </div>
          <div className="stat-card">
            <h3>Crypto Enabled</h3>
            <span className="stat-value">{stats.cryptoEnabled}</span>
          </div>
          <div className="stat-card">
            <h3>WebSocket Enabled</h3>
            <span className="stat-value">{stats.websocketEnabled}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="orca-tabs">
        <button
          className={activeTab === 'packages' ? 'active' : ''}
          onClick={() => setActiveTab('packages')}
        >
          Packages ({packages.length})
        </button>
        <button
          className={activeTab === 'registries' ? 'active' : ''}
          onClick={() => setActiveTab('registries')}
        >
          Registries ({registries.length})
        </button>
        <button
          className={activeTab === 'apis' ? 'active' : ''}
          onClick={() => setActiveTab('apis')}
        >
          API Endpoints ({endpoints.length})
        </button>
        <button
          className={activeTab === 'versioning' ? 'active' : ''}
          onClick={() => setActiveTab('versioning')}
        >
          Releases ({releases.length})
        </button>
      </nav>

      {/* Tab Content */}
      <div className="orca-content">
        {activeTab === 'packages' && (
          <div className="packages-panel">
            <div className="filter-bar">
              <input
                type="text"
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="tier-select"
              >
                <option value="all">All Tiers</option>
                <option value="hyper">Hyper</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="packages-grid">
              {filteredPackages.map(pkg => (
                <div key={pkg.id} className="package-card">
                  <div className="package-header">
                    <h4>{pkg.displayName}</h4>
                    <span className={`badge ${getTierBadgeClass(pkg.tier)}`}>{pkg.tier}</span>
                  </div>
                  <code className="package-name">{pkg.name}</code>
                  <p className="package-desc">{pkg.description}</p>
                  <div className="package-meta">
                    <span>Version: {pkg.version}</span>
                    <span>Score: {pkg.megaScore}</span>
                    <span>Latency: {pkg.latency}ms</span>
                  </div>
                  <div className="package-features">
                    {pkg.cryptoAccepted && <span className="feature-badge">Crypto</span>}
                    {pkg.websocketSupported && <span className="feature-badge">WebSocket</span>}
                  </div>
                  <div className="package-tags">
                    {pkg.properties.slice(0, 3).map(prop => (
                      <span key={prop} className="tag">{prop}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'registries' && (
          <div className="registries-panel">
            <table className="orca-table">
              <thead>
                <tr>
                  <th>Registry</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Packages</th>
                  <th>Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {registries.map(reg => (
                  <tr key={reg.name}>
                    <td>{reg.name}</td>
                    <td><code>{reg.url}</code></td>
                    <td className={getStatusClass(reg.status)}>{reg.status}</td>
                    <td>{reg.packages}</td>
                    <td>{reg.lastSync ? new Date(reg.lastSync).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'apis' && (
          <div className="apis-panel">
            <table className="orca-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map(ep => (
                  <tr key={ep.path}>
                    <td><code>{ep.path}</code></td>
                    <td>
                      <span className={`method-badge method-${ep.method.toLowerCase()}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td>{ep.category}</td>
                    <td className={getStatusClass(ep.status)}>{ep.status}</td>
                    <td>{ep.latency}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'versioning' && (
          <div className="versioning-panel">
            <div className="releases-list">
              {releases.map((release, i) => (
                <div key={`${release.package}-${i}`} className="release-card">
                  <div className="release-header">
                    <h4>{release.package}</h4>
                    <span className={`badge ${getTierBadgeClass(release.tier)}`}>{release.tier}</span>
                  </div>
                  <div className="release-meta">
                    <span className="version">{release.version}</span>
                    <span className="date">{new Date(release.releasedAt).toLocaleDateString()}</span>
                    <span className="author">by {release.author}</span>
                  </div>
                  <p className="release-desc">{release.description}</p>
                  <ul className="release-changes">
                    {release.changes.map((change, j) => (
                      <li key={j}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrcaDashboard;
