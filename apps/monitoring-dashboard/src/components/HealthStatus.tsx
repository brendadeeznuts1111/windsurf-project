import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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

interface HealthStatusProps {
  metrics: SystemMetrics | null;
}

const HealthStatus: React.FC<HealthStatusProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading health status...</p>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score < 30) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score < 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getHealthIcon(metrics.tension_score)}
          <span>System Health</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Status</span>
          <Badge variant={metrics.status === 'healthy' ? 'success' : 'error'}>
            {metrics.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tension Score</span>
          <span className={`text-lg font-bold ${getHealthColor(metrics.tension_score)}`}>
            {metrics.tension_score}
          </span>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">System Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Peak Tension:</span>
              <span className="ml-2 font-medium">{metrics.system_metrics.peakTension}</span>
            </div>
            <div>
              <span className="text-gray-600">Average:</span>
              <span className="ml-2 font-medium">{metrics.system_metrics.averageTension.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-gray-600">Events:</span>
              <span className="ml-2 font-medium">{metrics.system_metrics.eventCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Version:</span>
              <span className="ml-2 font-medium">{metrics.version}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Services</h4>
          <div className="space-y-1">
            {Object.entries(metrics.services).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between text-sm">
                <span className="capitalize">{service.replace('_', ' ')}</span>
                <Badge variant={
                  status === 'connected' || status === 'active' || status === 'collecting'
                    ? 'success'
                    : 'error'
                }>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthStatus;