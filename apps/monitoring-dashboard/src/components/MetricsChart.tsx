import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface DataPoint {
  time: string;
  tension: number;
  users: number;
  posts: number;
}

const MetricsChart: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [healthRes, analyticsRes] = await Promise.all([
          fetch('http://localhost:3000/api/health'),
          fetch('http://localhost:3000/api/analytics')
        ]);

        if (healthRes.ok && analyticsRes.ok) {
          const healthData = await healthRes.json();
          const analyticsData = await analyticsRes.json();

          const newPoint: DataPoint = {
            time: new Date().toLocaleTimeString(),
            tension: healthData.data.tension_score,
            users: analyticsData.data.overview.total_users,
            posts: analyticsData.data.overview.total_posts,
          };

          setData(prev => {
            const updated = [...prev, newPoint];
            // Keep only last 20 points
            return updated.slice(-20);
          });
        }
      } catch (error) {
        console.error('Failed to fetch metrics for chart:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="tension"
              stroke="#ef4444"
              strokeWidth={2}
              name="Tension Score"
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Total Users"
            />
            <Line
              type="monotone"
              dataKey="posts"
              stroke="#10b981"
              strokeWidth={2}
              name="Total Posts"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MetricsChart;