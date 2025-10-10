/**
 * Predictive Analytics Widget
 * 
 * WO-86: Real-time Monitoring Dashboard
 * Trend analysis and performance forecasting
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PredictiveAnalyticsWidgetProps {
  project: any;
}

export default function PredictiveAnalyticsWidget({ project }: PredictiveAnalyticsWidgetProps) {
  // Generate forecast data
  const forecast = generateForecast(project);
  const alerts = generateAlerts(project);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🔮</span> Predictive Analytics
      </h3>

      {/* Early Warning Indicators */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, index) => (
            <div key={index} className={`p-3 rounded-lg border ${
              alert.severity === 'high' ? 'bg-red-50 border-red-200' :
              alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{alert.icon}</span>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{alert.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{alert.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Funding Forecast Chart */}
      <div className="h-64 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Funding Forecast (Next 30 Days)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecast.funding}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <ReferenceLine y={project.targetAmount} stroke="#10b981" strokeDasharray="3 3" label="Goal" />
            <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual" />
            <Line type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
            <Line type="monotone" dataKey="pessimistic" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" name="Pessimistic" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-3 gap-4">
        <TrendCard
          label="Funding Trend"
          value={forecast.fundingTrend}
          icon="📈"
        />
        <TrendCard
          label="Completion Estimate"
          value={`${forecast.daysToCompletion} days`}
          icon="🎯"
        />
        <TrendCard
          label="Confidence Level"
          value={`${forecast.confidence}%`}
          icon="🎲"
        />
      </div>
    </div>
  );
}

function TrendCard({ label, value, icon }: any) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <div className="font-bold text-gray-900">{value}</div>
    </div>
  );
}

function generateForecast(project: any) {
  const currentProgress = project.fundingProgress || 0;
  const velocity = project.fundingVelocity || 0.1;
  const remaining = project.targetAmount - project.currentAmount;

  // Generate 30-day forecast
  const funding = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const forecastAmount = project.currentAmount + (velocity * day * (project.targetAmount / project.duration));
    const pessimisticAmount = project.currentAmount + (velocity * 0.5 * day * (project.targetAmount / project.duration));
    
    return {
      day: `Day ${day}`,
      actual: i === 0 ? project.currentAmount : null,
      forecast: Math.min(forecastAmount, project.targetAmount),
      pessimistic: Math.min(pessimisticAmount, project.targetAmount),
    };
  });

  const daysToCompletion = velocity > 0 ? Math.ceil(remaining / (velocity * (project.targetAmount / project.duration))) : 999;
  const confidence = Math.min(90, 60 + (currentProgress / 2));

  return {
    funding,
    fundingTrend: velocity > 0.5 ? 'Increasing ↗️' : velocity > 0.2 ? 'Steady →' : 'Slow ↘️',
    daysToCompletion,
    confidence: confidence.toFixed(0),
  };
}

function generateAlerts(project: any) {
  const alerts = [];

  // Funding velocity alert
  if (project.fundingVelocity < 0.1) {
    alerts.push({
      severity: 'medium',
      icon: '⚠️',
      title: 'Low Funding Velocity',
      message: 'Project is receiving funding slower than average. Consider marketing efforts.',
    });
  }

  // Milestone timeline alert
  const now = Date.now();
  const overdueMilestones = (project.milestones || []).filter((m: any) => 
    m.status !== 'RELEASED' && new Date(m.dueDate).getTime() < now
  );

  if (overdueMilestones.length > 0) {
    alerts.push({
      severity: 'high',
      icon: '🔴',
      title: 'Overdue Milestones',
      message: `${overdueMilestones.length} milestone(s) past due date. Review timeline.`,
    });
  }

  // Performance alert
  if (project.efficiency && project.efficiency < 60) {
    alerts.push({
      severity: 'high',
      icon: '⚡',
      title: 'Performance Below Expected',
      message: 'Energy production significantly below projections. Equipment check recommended.',
    });
  }

  return alerts;
}

