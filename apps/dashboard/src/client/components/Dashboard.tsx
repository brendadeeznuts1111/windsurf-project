/**
 * @fileoverview Main dashboard application component
 * @description React-based dashboard with real-time monitoring and RSS integration
 */

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { MetricsOverview } from './MetricsOverview';
import { SystemCards } from './SystemCards';
// import { ActivityLog } from './ActivityLog';
// import { RSSFeed } from './RSSFeed';
import { DashboardProvider } from '../hooks/useDashboard';
import '../../styles/dashboard.css';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'systems' | 'rss'>('overview');

  return (
    <DashboardProvider>
      <div className="dashboard">
        <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="dashboard-main">
          {activeTab === 'overview' && (
            <div className="tab-content">
              <MetricsOverview />
              <div className="overview-grid">
                <SystemCards />
                <div className="placeholder-card">
                  <h3>📋 Activity Log</h3>
                  <p>Activity log component coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'systems' && (
            <div className="tab-content">
              <SystemCards detailed />
            </div>
          )}

          {activeTab === 'rss' && (
            <div className="tab-content">
              <div className="placeholder-card">
                <h3>📰 Bun Updates</h3>
                <p>RSS feed component coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </DashboardProvider>
  );
};

export default Dashboard;