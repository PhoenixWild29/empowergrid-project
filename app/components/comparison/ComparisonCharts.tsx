/**
 * ComparisonCharts Component
 * 
 * WO-82: Project Comparison Tool
 * Visual charts comparing key metrics
 * 
 * Features:
 * - Funding progress bar chart
 * - Energy capacity comparison
 * - ROI projection chart
 * - Risk assessment radar chart
 */

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import {
  ComparisonProject,
  calculateInvestmentScore,
  calculateROIProjection,
  calculateRiskScore,
} from '../../hooks/useProjectComparison';

interface ComparisonChartsProps {
  projects: ComparisonProject[];
}

export default function ComparisonCharts({ projects }: ComparisonChartsProps) {
  if (projects.length === 0) {
    return null;
  }

  // Prepare data for funding progress chart
  const fundingData = projects.map(p => ({
    name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
    fullName: p.title,
    'Funding Progress': p.fundingProgress.toFixed(1),
    'Current Amount': p.currentAmount,
    'Target Amount': p.targetAmount,
  }));

  // Prepare data for energy capacity chart
  const capacityData = projects.map(p => ({
    name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
    fullName: p.title,
    'Energy Capacity (kW)': p.energyCapacity || 0,
  }));

  // Prepare data for ROI projection chart
  const roiData = projects.map(p => ({
    name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
    fullName: p.title,
    'ROI Projection (%)': calculateROIProjection(p),
  }));

  // Prepare data for investment score chart
  const scoreData = projects.map(p => ({
    name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
    fullName: p.title,
    'Investment Score': calculateInvestmentScore(p),
    'Risk Score': 100 - calculateRiskScore(p), // Invert for better visualization (higher = better)
  }));

  // Prepare data for radar chart (multi-dimensional comparison)
  const radarData = [
    {
      metric: 'Funding',
      ...projects.reduce((acc, p, i) => ({
        ...acc,
        [`Project ${i + 1}`]: p.fundingProgress,
      }), {}),
    },
    {
      metric: 'Capacity',
      ...projects.reduce((acc, p, i) => ({
        ...acc,
        [`Project ${i + 1}`]: p.energyCapacity ? Math.min((p.energyCapacity / 10000) * 100, 100) : 0,
      }), {}),
    },
    {
      metric: 'Reputation',
      ...projects.reduce((acc, p, i) => ({
        ...acc,
        [`Project ${i + 1}`]: (p.creator.reputation / 1000) * 100,
      }), {}),
    },
    {
      metric: 'Community',
      ...projects.reduce((acc, p, i) => ({
        ...acc,
        [`Project ${i + 1}`]: Math.min(p.funderCount * 5, 100),
      }), {}),
    },
    {
      metric: 'Investment Score',
      ...projects.reduce((acc, p, i) => ({
        ...acc,
        [`Project ${i + 1}`]: calculateInvestmentScore(p),
      }), {}),
    },
  ];

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-sm">{payload[0]?.payload?.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Funding Progress Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Funding Progress Comparison
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fundingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Funding %', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Funding Progress" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Energy Capacity Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Energy Capacity Comparison
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={capacityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Capacity (kW)', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Energy Capacity (kW)" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROI Projection Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ROI Projection Comparison
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={roiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'ROI %', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="ROI Projection (%)" stroke="#f59e0b" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 mt-2">
          * ROI projections are estimates based on project metrics and may vary
        </p>
      </div>

      {/* Investment Score vs Risk Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Investment Score vs Risk Assessment
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Score (0-100)', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Investment Score" fill="#10b981" />
            <Bar dataKey="Risk Score" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 mt-2">
          * Risk Score inverted for visualization (higher = lower risk)
        </p>
      </div>

      {/* Multi-Dimensional Radar Chart */}
      {projects.length >= 2 && projects.length <= 5 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Multi-Dimensional Comparison
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              {projects.map((project, index) => (
                <Radar
                  key={project.id}
                  name={project.title.length > 20 ? project.title.substring(0, 20) + '...' : project.title}
                  dataKey={`Project ${index + 1}`}
                  stroke={colors[index]}
                  fill={colors[index]}
                  fillOpacity={0.3}
                />
              ))}
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2">
            * All metrics normalized to 0-100 scale for comparison
          </p>
        </div>
      )}

      {/* Chart Legend Explanation */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <h4 className="font-semibold text-gray-900 mb-2">Chart Guide</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Funding Progress:</strong> Percentage of funding goal achieved</li>
          <li><strong>Energy Capacity:</strong> Total energy generation capacity in kilowatts</li>
          <li><strong>ROI Projection:</strong> Estimated annual return on investment</li>
          <li><strong>Investment Score:</strong> Composite score based on multiple factors (0-100)</li>
          <li><strong>Risk Score:</strong> Risk assessment (higher bar = lower risk)</li>
          <li><strong>Multi-Dimensional:</strong> Holistic comparison across all metrics</li>
        </ul>
      </div>
    </div>
  );
}

