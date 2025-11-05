/**
 * Funding Progress Chart
 * 
 * Interactive chart displaying funding progress over time with goal indicators
 */

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface FundingDataPoint {
  date: string;
  amount: number;
  cumulativeAmount: number;
}

export interface FundingProgressChartProps {
  data: FundingDataPoint[];
  targetAmount: number;
  currency?: string;
  showGoalLine?: boolean;
  chartType?: 'line' | 'area';
  height?: number;
}

export default function FundingProgressChart({
  data,
  targetAmount,
  currency = 'USDC',
  showGoalLine = true,
  chartType = 'area',
  height = 400,
}: FundingProgressChartProps) {
  // Calculate progress percentage
  const currentAmount = data[data.length - 1]?.cumulativeAmount || 0;
  const progressPercent = Math.min((currentAmount / targetAmount) * 100, 100);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {formatDate(label)}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Daily:</span>{' '}
              <span className="text-green-600">{formatCurrency(payload[0].value)}</span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total:</span>{' '}
              <span className="text-blue-600">{formatCurrency(payload[1].value)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };
  
  if (!data || data.length === 0) {
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
        <p className="text-gray-600 text-lg font-medium">No funding data available</p>
        <p className="text-gray-500 text-sm mt-1">
          Funding progress will appear here once contributions are made
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Current Progress</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(currentAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Goal</p>
            <p className="text-2xl font-semibold text-gray-700 mt-1">
              {formatCurrency(targetAmount)}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-2 text-center">
            {progressPercent.toFixed(1)}% Funded
          </p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Funding Over Time
        </h3>
        
        <ResponsiveContainer width="100%" height={height}>
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showGoalLine && (
                <ReferenceLine
                  y={targetAmount}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{ value: 'Goal', position: 'right', fill: '#ef4444' }}
                />
              )}
              <Area
                type="monotone"
                dataKey="amount"
                name="Daily Funding"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorDaily)"
              />
              <Area
                type="monotone"
                dataKey="cumulativeAmount"
                name="Total Raised"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showGoalLine && (
                <ReferenceLine
                  y={targetAmount}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{ value: 'Goal', position: 'right', fill: '#ef4444' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="amount"
                name="Daily Funding"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeAmount"
                name="Total Raised"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}






