import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Activity, Users, FileText, TrendingUp } from 'lucide-react';
import MetricsChart from './MetricsChart';
import HealthStatus from './HealthStatus';

interface SystemMetrics {
  status: string;
  version: string;
  services: Record<string, string>;
  tension_score: number;
  system_metrics: {
    currentTension: number;
    peakTension: number;
    averageTension: number;
    eventCount: number;
  };
}

interface AnalyticsData {
  overview: {
    total_users: number;
    total_posts: number;
    posts_last_7_days: number;
  };
  system: {
    tension_score: number;
  };
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, analyticsRes] = await Promise.all([
          fetch('http://localhost:3000/api/health'),
          fetch('http://localhost:3000/api/analytics')
        ]);

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData.data);
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">System Dashboard</h1>
        <Badge variant={metrics?.status === 'healthy' ? 'success' : 'error'}>
          {metrics?.status || 'Unknown'}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.total_posts || 0}</div>
            <p className="text-xs text-muted-foreground">Published content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.posts_last_7_days || 0}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.tension_score || 0}</div>
            <p className="text-xs text-muted-foreground">Tension score</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart />
        <HealthStatus metrics={metrics} />
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics?.services && Object.entries(metrics.services).map(([service, status]) => (
              <div key={service} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'connected' || status === 'active' || status === 'collecting'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`} />
                <span className="text-sm capitalize">{service.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;