/**
 * Real-time Monitoring Dashboard Page
 * 
 * WO-86: Real-time Monitoring Dashboard with Live Analytics
 * 
 * Features:
 * - Live energy production data
 * - Milestone progress tracking
 * - Funding activity updates
 * - Predictive analytics
 * - Performance benchmarking
 * - Configurable refresh intervals
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { RealtimeProvider } from '../../../contexts/RealtimeContext';
import {
  EnergyProductionWidget,
  MilestoneProgressWidget,
  FundingActivityWidget,
  PredictiveAnalyticsWidget,
} from '../../../components/monitoring';
import { ConnectionIndicator } from '../../../components/realtime';

export default function MonitoringDashboardPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    if (!id) return;

    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${id}`);
        const data = await response.json();
        if (data.success) {
          setProject(data.project);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [id]);

  // Auto-refresh project data
  useEffect(() => {
    if (!id || refreshInterval === 0) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/projects/${id}`);
        const data = await response.json();
        if (data.success) {
          setProject(data.project);
        }
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [id, refreshInterval]);

  if (isLoading || !project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <RealtimeProvider>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Real-time Monitoring
              </h1>
              <p className="text-gray-600">{project.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionIndicator />
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={0}>No auto-refresh</option>
                <option value={10}>Every 10s</option>
                <option value={30}>Every 30s</option>
                <option value={60}>Every 1min</option>
                <option value={300}>Every 5min</option>
              </select>
            </div>
          </div>

          {/* Widgets Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <EnergyProductionWidget
              projectId={project.id}
              energyMetrics={project.energyMetrics || []}
              energyCapacity={project.energyCapacity || 0}
            />
            <FundingActivityWidget
              projectId={project.id}
              fundings={project.fundings || []}
              targetAmount={project.targetAmount}
              currentAmount={project.currentAmount}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <MilestoneProgressWidget
              projectId={project.id}
              milestones={project.milestones || []}
            />
            <PredictiveAnalyticsWidget project={project} />
          </div>

          {/* Last Updated */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
            {refreshInterval > 0 && ` • Auto-refresh every ${refreshInterval}s`}
          </div>
        </div>
      </Layout>
    </RealtimeProvider>
  );
}

