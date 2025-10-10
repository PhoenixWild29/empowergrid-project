/**
 * Energy Production Widget
 * 
 * WO-86: Real-time Monitoring Dashboard
 * Live energy production tracking
 * 
 * Features:
 * - Current power output
 * - Daily and monthly totals
 * - Performance efficiency metrics
 * - Real-time updates via WebSocket
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
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
} from 'recharts';

interface EnergyProductionWidgetProps {
  projectId: string;
  energyMetrics?: any[];
  energyCapacity?: number;
}

export default function EnergyProductionWidget({
  projectId,
  energyMetrics = [],
  energyCapacity = 0,
}: EnergyProductionWidgetProps) {
  const [currentOutput, setCurrentOutput] = useState(0);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [efficiency, setEfficiency] = useState(0);
  const { subscribe, isConnected } = useRealtime();

  useEffect(() => {
    // Calculate initial values from historical data
    calculateMetrics();

    // Subscribe to real-time energy updates
    const unsubscribe = subscribe('energy:produced', (data) => {
      if (data.projectId === projectId) {
        setCurrentOutput(data.currentOutput);
        setDailyTotal(prev => prev + data.energyProduced);
        calculateMetrics();
      }
    });

    return unsubscribe;
  }, [projectId, subscribe, energyMetrics]);

  function calculateMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate daily total
    const todayMetrics = energyMetrics.filter(m => 
      new Date(m.reportedAt) >= today
    );
    const dailySum = todayMetrics.reduce((sum, m) => sum + m.energyProduced, 0);
    setDailyTotal(dailySum);

    // Calculate monthly total
    const monthMetrics = energyMetrics.filter(m =>
      new Date(m.reportedAt) >= thisMonth
    );
    const monthlySum = monthMetrics.reduce((sum, m) => sum + m.energyProduced, 0);
    setMonthlyTotal(monthlySum);

    // Calculate efficiency (daily actual vs expected)
    const expectedDaily = energyCapacity * 24 * 0.25; // 25% capacity factor
    const eff = expectedDaily > 0 ? (dailySum / expectedDaily) * 100 : 0;
    setEfficiency(Math.min(eff, 100));
  }

  // Prepare chart data (last 30 days)
  const chartData = prepareChartData(energyMetrics);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>⚡</span> Live Energy Production
        </h3>
        {isConnected && (
          <span className="flex items-center gap-2 text-sm text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </span>
        )}
      </div>

      {/* Current Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Current Output"
          value={`${currentOutput.toFixed(1)} kW`}
          icon="⚡"
          color="text-yellow-600"
        />
        <MetricCard
          label="Today's Total"
          value={`${dailyTotal.toFixed(0)} kWh`}
          icon="☀️"
          color="text-blue-600"
        />
        <MetricCard
          label="This Month"
          value={`${monthlyTotal.toLocaleString()} kWh`}
          icon="📊"
          color="text-green-600"
        />
        <MetricCard
          label="Efficiency"
          value={`${efficiency.toFixed(1)}%`}
          icon="📈"
          color={efficiency > 80 ? 'text-green-600' : efficiency > 60 ? 'text-yellow-600' : 'text-red-600'}
        />
      </div>

      {/* Production Chart */}
      <div className="h-64 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">30-Day Production History</h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="energy"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              name="Energy Produced (kWh)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Indicator */}
      <div className={`p-4 rounded-lg ${
        efficiency > 80 ? 'bg-green-50 border border-green-200' :
        efficiency > 60 ? 'bg-yellow-50 border border-yellow-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <p className="text-sm font-medium">
          {efficiency > 80 ? '✅ Excellent Performance' :
           efficiency > 60 ? '⚠️ Below Expected Performance' :
           '🔴 Significant Underperformance'}
        </p>
        <p className="text-xs mt-1 opacity-75">
          {efficiency > 80 ? 'Operating above industry standard' :
           efficiency > 60 ? 'Consider maintenance check' :
           'Immediate attention recommended'}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: any) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function prepareChartData(metrics: any[]) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  return last30Days.map(date => {
    const dayMetrics = metrics.filter(m => 
      m.reportedAt.startsWith(date)
    );
    const energy = dayMetrics.reduce((sum, m) => sum + m.energyProduced, 0);
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      energy,
    };
  });
}

