/**
 * Portfolio Analytics Chart
 * 
 * Displays investment distribution and performance for funder dashboards
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface PortfolioProject {
  name: string;
  invested: number;
  returns: number;
  status: 'ACTIVE' | 'FUNDED' | 'COMPLETED';
  category: string;
}

export interface PortfolioAnalyticsChartProps {
  projects: PortfolioProject[];
  chartType?: 'distribution' | 'performance';
  height?: number;
}

const STATUS_COLORS = {
  ACTIVE: '#3b82f6',
  FUNDED: '#10b981',
  COMPLETED: '#8b5cf6',
};

const CATEGORY_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

export default function PortfolioAnalyticsChart({
  projects,
  chartType = 'distribution',
  height = 400,
}: PortfolioAnalyticsChartProps) {
  // Calculate totals
  const totalInvested = projects.reduce((sum, p) => sum + p.invested, 0);
  const totalReturns = projects.reduce((sum, p) => sum + p.returns, 0);
  const roi = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;
  
  // Prepare distribution data by category
  const distributionData = projects.reduce((acc, project) => {
    const existing = acc.find((item) => item.category === project.category);
    if (existing) {
      existing.value += project.invested;
    } else {
      acc.push({
        category: project.category,
        value: project.invested,
      });
    }
    return acc;
  }, [] as Array<{ category: string; value: number }>);
  
  // Prepare performance data
  const performanceData = projects.map((project) => ({
    name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
    invested: project.invested,
    returns: project.returns,
    roi: project.invested > 0 ? ((project.returns / project.invested) * 100) : 0,
  }));
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-gray-600 text-lg font-medium">No portfolio data available</p>
        <p className="text-gray-500 text-sm mt-1">
          Your investment portfolio will appear here once you fund projects
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-medium text-gray-600">Total Invested</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(totalInvested)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm font-medium text-gray-600">Total Returns</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(totalReturns)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-medium text-gray-600">ROI</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {roi.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <p className="text-sm font-medium text-gray-600">Projects</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {projects.length}
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Investment Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) =>
                  `${category}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Performance Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                style={{ fontSize: '10px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar
                dataKey="invested"
                name="Invested"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="returns"
                name="Returns"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}




