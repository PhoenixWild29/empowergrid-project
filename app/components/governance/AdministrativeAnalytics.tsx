/**
 * Administrative Analytics
 * 
 * WO-112: Contract performance trends and engagement metrics with charts
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AdministrativeAnalyticsProps {
  contractId: string;
  governanceData: any;
}

export default function AdministrativeAnalytics({ contractId, governanceData }: AdministrativeAnalyticsProps) {
  // WO-112: Prepare chart data
  const performanceTrendData = [
    { month: 'Jan', modifications: 2, approvals: 5, disputes: 0 },
    { month: 'Feb', modifications: 3, approvals: 7, disputes: 1 },
    { month: 'Mar', modifications: 1, approvals: 3, disputes: 0 },
    { month: 'Apr', modifications: 4, approvals: 9, disputes: 0 },
  ];

  const parameterChangeData = Object.entries(governanceData?.modificationTracking?.changesByType || {}).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count,
  }));

  const stakeholderEngagementData = governanceData?.governanceInfo?.stakeholders?.map((s: any) => ({
    name: s.address.slice(0, 8),
    votingPower: s.votingPower,
  })) || [];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Analytics</h3>
      </div>

      {/* WO-112: Contract Performance Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Contract Performance Trends</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="modifications" stroke="#3B82F6" name="Modifications" />
            <Line type="monotone" dataKey="approvals" stroke="#10B981" name="Approvals" />
            <Line type="monotone" dataKey="disputes" stroke="#EF4444" name="Disputes" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* WO-112: Parameter Change Frequency */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Parameter Change Frequency</h4>
        {parameterChangeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={parameterChangeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No parameter changes yet
          </div>
        )}
      </div>

      {/* WO-112: Stakeholder Engagement */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Stakeholder Engagement Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stakeholderEngagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="votingPower"
              >
                {stakeholderEngagementData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Engagement Summary</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">Total Stakeholders</span>
                <span className="font-bold text-gray-900">{stakeholderEngagementData.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">Total Voting Power</span>
                <span className="font-bold text-gray-900">
                  {stakeholderEngagementData.reduce((sum: number, s: any) => sum + s.votingPower, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">Governance Model</span>
                <span className="font-bold text-gray-900">{governanceData.governanceInfo.governanceModel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



