/**
 * Energy Production Chart
 * 
 * Displays historical and projected energy output with trend analysis
 */

import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface EnergyDataPoint {
  date: string;
  actual: number;
  projected: number;
  trend?: number;
}

export interface EnergyProductionChartProps {
  data: EnergyDataPoint[];
  targetCapacity: number;
  unit?: string;
  showTrend?: boolean;
  height?: number;
}

export default function EnergyProductionChart({
  data,
  targetCapacity,
  unit = 'kWh',
  showTrend = true,
  height = 400,
}: EnergyProductionChartProps) {
  // Calculate total production
  const totalProduction = data.reduce((sum, point) => sum + (point.actual || 0), 0);
  const avgProduction = totalProduction / data.length;
  
  // Format energy value
  const formatEnergy = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)} GWh`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} MWh`;
    }
    return `${value.toFixed(2)} ${unit}`;
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
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm text-gray-600">
                <span className="font-medium">{entry.name}:</span>{' '}
                <span style={{ color: entry.color }}>
                  {formatEnergy(entry.value)}
                </span>
              </p>
            ))}
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <p className="text-gray-600 text-lg font-medium">No energy data available</p>
        <p className="text-gray-500 text-sm mt-1">
          Energy production metrics will appear here once data is reported
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Energy Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm font-medium text-gray-600">Total Production</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatEnergy(totalProduction)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm font-medium text-gray-600">Average Daily</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatEnergy(avgProduction)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-medium text-gray-600">Capacity</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {targetCapacity} kW
          </p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Energy Production Trend
        </h3>
        
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine
              y={avgProduction}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: 'Avg', position: 'right', fill: '#9ca3af' }}
            />
            <Bar
              dataKey="actual"
              name="Actual Production"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="projected"
              name="Projected"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
            {showTrend && (
              <Line
                type="monotone"
                dataKey="trend"
                name="Trend"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}






