/**
 * @fileoverview Azure DevOps Dashboard Component
 * @description Displays Azure DevOps work items, pipelines, and pull requests
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import './azure-devops.css';

interface WorkItem {
  id: number;
  fields: {
    'System.Title': string;
    'System.State': string;
    'System.WorkItemType': string;
    'System.AssignedTo'?: { displayName: string };
    'System.CreatedDate': string;
  };
}

interface Pipeline {
  id: number;
  buildNumber: string;
  status: string;
  result: string;
  sourceBranch: string;
  queueTime: string;
  finishTime?: string;
  definition?: { name: string };
}

interface PullRequest {
  pullRequestId: number;
  title: string;
  status: string;
  createdBy: { displayName: string };
  sourceRefName: string;
  targetRefName: string;
  creationDate: string;
}

interface ProjectStats {
  totalWorkItems: number;
  totalPipelines: number;
  totalPRs: number;
  activePRs: number;
  org: string;
  project: string;
}

type TabType = 'overview' | 'work-items' | 'pipelines' | 'pull-requests';

const AzureDevOpsDashboard: React.FC = () => {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workItemFilter, setWorkItemFilter] = useState('Active');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'work-items') {
      fetchWorkItems(workItemFilter);
    }
  }, [workItemFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, workItemsRes, pipelinesRes, prsRes] = await Promise.all([
        fetch('/api/azure/project-stats'),
        fetch('/api/azure/work-items'),
        fetch('/api/azure/pipelines'),
        fetch('/api/azure/prs')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (workItemsRes.ok) {
        const workItemsData = await workItemsRes.json();
        setWorkItems(workItemsData.data?.workItems || []);
      }

      if (pipelinesRes.ok) {
        const pipelinesData = await pipelinesRes.json();
        setPipelines(pipelinesData.data?.pipelines || []);
      }

      if (prsRes.ok) {
        const prsData = await prsRes.json();
        setPullRequests(prsData.data?.pullRequests || []);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Azure DevOps data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkItems = async (state: string) => {
    try {
      const res = await fetch(`/api/azure/work-items?state=${state}`);
      if (res.ok) {
        const data = await res.json();
        setWorkItems(data.data?.workItems || []);
      }
    } catch {}
  };

  const getStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      succeeded: 'status-success',
      completed: 'status-success',
      active: 'status-active',
      inProgress: 'status-active',
      failed: 'status-error',
      abandoned: 'status-error',
      notStarted: 'status-pending',
      queued: 'status-pending'
    };
    return classes[status] || 'status-default';
  };

  const getWorkItemTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'Bug': 'bug',
      'Task': 'task',
      'User Story': 'story',
      'Feature': 'feature',
      'Epic': 'epic'
    };
    return icons[type] || 'item';
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !stats) {
    return (
      <div className="azure-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Connecting to Azure DevOps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="azure-dashboard">
      <header className="azure-header">
        <h1>Azure DevOps Dashboard</h1>
        {stats && (
          <p className="org-info">
            <span className="org">{stats.org}</span>
            <span className="separator">/</span>
            <span className="project">{stats.project}</span>
          </p>
        )}
        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
          {loading ? 'Syncing...' : 'Sync'}
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
        <div className="azure-stats">
          <div className="stat-card">
            <div className="stat-icon work-items-icon"></div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalWorkItems}</span>
              <span className="stat-label">Work Items</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pipelines-icon"></div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalPipelines}</span>
              <span className="stat-label">Pipelines</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon prs-icon"></div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalPRs}</span>
              <span className="stat-label">Pull Requests</span>
            </div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-icon active-prs-icon"></div>
            <div className="stat-info">
              <span className="stat-value">{stats.activePRs}</span>
              <span className="stat-label">Active PRs</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="azure-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'work-items' ? 'active' : ''}
          onClick={() => setActiveTab('work-items')}
        >
          Work Items
        </button>
        <button
          className={activeTab === 'pipelines' ? 'active' : ''}
          onClick={() => setActiveTab('pipelines')}
        >
          Pipelines
        </button>
        <button
          className={activeTab === 'pull-requests' ? 'active' : ''}
          onClick={() => setActiveTab('pull-requests')}
        >
          Pull Requests
        </button>
      </nav>

      {/* Tab Content */}
      <div className="azure-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <div className="overview-grid">
              <div className="overview-section">
                <h3>Recent Work Items</h3>
                {workItems.slice(0, 5).map(wi => (
                  <div key={wi.id} className="overview-item">
                    <span className={`wi-type wi-${getWorkItemTypeIcon(wi.fields['System.WorkItemType'])}`}>
                      {wi.fields['System.WorkItemType']}
                    </span>
                    <span className="wi-title">#{wi.id} {wi.fields['System.Title']}</span>
                    <span className={`wi-state ${wi.fields['System.State'].toLowerCase().replace(' ', '-')}`}>
                      {wi.fields['System.State']}
                    </span>
                  </div>
                ))}
              </div>

              <div className="overview-section">
                <h3>Recent Pipeline Runs</h3>
                {pipelines.slice(0, 5).map(pl => (
                  <div key={pl.id} className="overview-item">
                    <span className={`pipeline-status ${getStatusClass(pl.result || pl.status)}`}>
                      {pl.result || pl.status}
                    </span>
                    <span className="pipeline-name">{pl.definition?.name || 'Pipeline'}</span>
                    <span className="pipeline-build">#{pl.buildNumber}</span>
                  </div>
                ))}
              </div>

              <div className="overview-section">
                <h3>Active Pull Requests</h3>
                {pullRequests.filter(pr => pr.status === 'active').slice(0, 5).map(pr => (
                  <div key={pr.pullRequestId} className="overview-item">
                    <span className="pr-id">#{pr.pullRequestId}</span>
                    <span className="pr-title">{pr.title}</span>
                    <span className="pr-author">{pr.createdBy?.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'work-items' && (
          <div className="work-items-panel">
            <div className="filter-bar">
              <select
                value={workItemFilter}
                onChange={(e) => setWorkItemFilter(e.target.value)}
                className="state-filter"
              >
                <option value="Active">Active</option>
                <option value="New">New</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="all">All</option>
              </select>
            </div>
            <table className="azure-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>State</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {workItems.map(wi => (
                  <tr key={wi.id}>
                    <td>#{wi.id}</td>
                    <td>
                      <span className={`wi-type-badge wi-${getWorkItemTypeIcon(wi.fields['System.WorkItemType'])}`}>
                        {wi.fields['System.WorkItemType']}
                      </span>
                    </td>
                    <td>{wi.fields['System.Title']}</td>
                    <td>
                      <span className={`state-badge ${wi.fields['System.State'].toLowerCase().replace(' ', '-')}`}>
                        {wi.fields['System.State']}
                      </span>
                    </td>
                    <td>{wi.fields['System.AssignedTo']?.displayName || 'Unassigned'}</td>
                    <td>{formatDate(wi.fields['System.CreatedDate'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pipelines' && (
          <div className="pipelines-panel">
            <table className="azure-table">
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Build</th>
                  <th>Status</th>
                  <th>Result</th>
                  <th>Branch</th>
                  <th>Started</th>
                  <th>Finished</th>
                </tr>
              </thead>
              <tbody>
                {pipelines.map(pl => (
                  <tr key={pl.id}>
                    <td>{pl.definition?.name || 'Pipeline'}</td>
                    <td>#{pl.buildNumber}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(pl.status)}`}>
                        {pl.status}
                      </span>
                    </td>
                    <td>
                      <span className={`result-badge ${getStatusClass(pl.result)}`}>
                        {pl.result || 'Running'}
                      </span>
                    </td>
                    <td><code>{pl.sourceBranch?.replace('refs/heads/', '')}</code></td>
                    <td>{formatDate(pl.queueTime)}</td>
                    <td>{pl.finishTime ? formatDate(pl.finishTime) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pull-requests' && (
          <div className="prs-panel">
            <table className="azure-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Source</th>
                  <th>Target</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {pullRequests.map(pr => (
                  <tr key={pr.pullRequestId}>
                    <td>#{pr.pullRequestId}</td>
                    <td>{pr.title}</td>
                    <td>
                      <span className={`pr-status ${pr.status}`}>
                        {pr.status}
                      </span>
                    </td>
                    <td>{pr.createdBy?.displayName}</td>
                    <td><code>{pr.sourceRefName?.replace('refs/heads/', '')}</code></td>
                    <td><code>{pr.targetRefName?.replace('refs/heads/', '')}</code></td>
                    <td>{formatDate(pr.creationDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AzureDevOpsDashboard;
