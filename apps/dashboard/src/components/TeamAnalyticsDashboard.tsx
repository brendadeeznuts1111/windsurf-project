/**
 * @fileoverview Team Analytics Dashboard Component
 * @description React dashboard for visualizing team metrics, bottlenecks, and performance analytics
 * @author Bun Dashboard Team
 * @version 1.0.0
 * @since 2025
 */

import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title
);

interface TeamMember {
  id: string;
  githubUsername: string;
  name: string;
  email: string;
  role: string;
  team: string;
  skills: string[];
  currentAssignments: any[];
  performanceMetrics: {
    memberId: string;
    period: string;
    issuesCompleted: number;
    prsMerged: number;
    reviewsCompleted: number;
    storyPointsCompleted: number;
    bugsIntroduced: number;
    reviewsRejected: number;
    averageReviewTime: number;
    averageCycleTime: number;
    onTimeDeliveryRate: number;
    codeQualityScore: number;
    crossTeamContributions: number;
    mentoringSessions: number;
    knowledgeSharing: number;
    skillsImproved: string[];
    certificationsCompleted: string[];
  };
  availability: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamMetrics {
  id: string;
  period: string;
  teamId: string;
  startDate: string;
  endDate: string;
  memberMetrics: Record<string, any>;
  throughput: number;
  cycleTime: number;
  qualityScore: number;
  velocity: number;
  releaseVelocity: number;
  defectDensity: number;
  performanceDelta: number;
  forecastedCompletion: Record<string, string>;
  bottleneckIndicators: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    affectedItems: string[];
    recommendedActions: string[];
    estimatedResolutionTime: string;
  }>;
  capacityUtilization: number;
  generatedAt: string;
}

interface Bottleneck {
  id: string;
  type: string;
  severity: string;
  description: string;
  affectedItems: string[];
  recommendedActions: string[];
  estimatedResolutionTime: string;
}

export default function TeamAnalyticsDashboard() {
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load team members
      const membersResponse = await fetch('/api/mapping/members');
      if (!membersResponse.ok) throw new Error('Failed to load team members');
      const membersData = await membersResponse.json();
      setTeamMembers(membersData.data || []);

      // Load team analytics
      const analyticsResponse = await fetch(`/api/mapping/analytics/core-api?period=${selectedPeriod}`);
      if (!analyticsResponse.ok) throw new Error('Failed to load analytics');
      const analyticsData = await analyticsResponse.json();
      setTeamMetrics(analyticsData.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getBottleneckTypeIcon = (type: string) => {
    switch (type) {
      case 'workload': return '⚖️';
      case 'skill_gap': return '🎯';
      case 'review_queue': return '👁️';
      case 'dependency': return '🔗';
      default: return '⚠️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time insights into team performance and bottlenecks</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Throughput</dt>
                  <dd className="text-lg font-medium text-gray-900">{teamMetrics.throughput} items</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Quality Score</dt>
                  <dd className="text-lg font-medium text-gray-900">{teamMetrics.qualityScore}/100</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Velocity</dt>
                  <dd className="text-lg font-medium text-gray-900">{teamMetrics.velocity} points</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cycle Time</dt>
                  <dd className="text-lg font-medium text-gray-900">{teamMetrics.cycleTime.toFixed(1)} days</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottlenecks */}
      {teamMetrics && teamMetrics.bottleneckIndicators.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">🚨 Active Bottlenecks</h2>
          <div className="space-y-4">
            {teamMetrics.bottleneckIndicators.map((bottleneck: Bottleneck) => (
              <div key={bottleneck.id} className="border-l-4 border-red-400 bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{getBottleneckTypeIcon(bottleneck.type)}</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-red-800">{bottleneck.description}</p>
                      <span
                        className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: getSeverityColor(bottleneck.severity), color: 'white' }}
                      >
                        {bottleneck.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-red-700">
                        <strong>Actions:</strong> {bottleneck.recommendedActions.join(', ')}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        <strong>Resolution Time:</strong> {bottleneck.estimatedResolutionTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Member Performance */}
      {teamMembers.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">👥 Team Member Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Velocity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">@{member.githubUsername}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.performanceMetrics.issuesCompleted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.performanceMetrics.prsMerged}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.performanceMetrics.storyPointsCompleted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.performanceMetrics.codeQualityScore >= 80 ? 'bg-green-100 text-green-800' :
                        member.performanceMetrics.codeQualityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.performanceMetrics.codeQualityScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      {teamMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Score Distribution */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Score Distribution</h3>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: ['High (80-100)', 'Medium (60-79)', 'Low (0-59)'],
                  datasets: [{
                    data: [
                      Object.values(teamMetrics.memberMetrics).filter((m: any) => m.codeQualityScore >= 80).length,
                      Object.values(teamMetrics.memberMetrics).filter((m: any) => m.codeQualityScore >= 60 && m.codeQualityScore < 80).length,
                      Object.values(teamMetrics.memberMetrics).filter((m: any) => m.codeQualityScore < 60).length
                    ],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Velocity Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Velocity</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: teamMembers.map(m => m.name.split(' ')[0]),
                  datasets: [{
                    label: 'Story Points Completed',
                    data: teamMembers.map(m => m.performanceMetrics.storyPointsCompleted),
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}