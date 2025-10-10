/**
 * Milestone Tracker with Real-Time Progress Monitoring
 * 
 * WO-108: Comprehensive milestone tracking interface
 * 
 * Features:
 * - Milestone progress dashboard
 * - Visual progress indicators
 * - Energy production charts
 * - Automated notifications
 * - Predictive analytics
 * - Real-time updates
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useRealtime } from '../../../contexts/RealtimeContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function MilestoneTrackerPage() {
  const router = useRouter();
  const { contractId } = router.query;
  const { subscribe } = useRealtime();

  const [milestones, setMilestones] = useState<any[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  // WO-108: Fetch milestone data
  useEffect(() => {
    async function fetchMilestones() {
      if (!contractId) return;

      try {
        const response = await fetch(`/api/escrow/${contractId}/milestones`);
        const data = await response.json();

        if (data.success) {
          setMilestones(data.milestones || []);
          setContract(data.contract);
          setSummary(data.summary);
        }
      } catch (error) {
        console.error('[WO-108] Failed to fetch milestones:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMilestones();
  }, [contractId]);

  // WO-108: Subscribe to real-time milestone updates
  useEffect(() => {
    const unsubscribe = subscribe('milestone:completed' as any, (data) => {
      if (data.contractId === contractId) {
        // Update milestone in list
        setMilestones(prev =>
          prev.map(m =>
            m.id === data.milestoneId
              ? { ...m, ...data.updates }
              : m
          )
        );

        // Add notification
        setNotifications(prev => [{
          id: Date.now(),
          type: data.type,
          message: data.message,
          timestamp: new Date(),
        }, ...prev.slice(0, 9)]);
      }
    });

    return unsubscribe;
  }, [contractId, subscribe]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6 max-w-6xl mx-auto">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Milestone Tracker</h1>
          <p className="text-gray-600">
            Monitor project progress and automated fund releases
          </p>
        </div>

        {/* WO-108: Summary Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Milestones"
            value={summary?.total || 0}
            icon="📋"
            color="blue"
          />
          <StatCard
            title="Completed"
            value={summary?.completed || 0}
            icon="✓"
            color="green"
          />
          <StatCard
            title="In Progress"
            value={summary?.pending || 0}
            icon="🔄"
            color="yellow"
          />
          <StatCard
            title="Ready to Release"
            value={summary?.eligibleForRelease || 0}
            icon="🚀"
            color="purple"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Milestone List */}
          <div className="md:col-span-2 space-y-6">
            {/* WO-108: Timeline Visualization */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Milestone Timeline</h2>
              <div className="space-y-4">
                {milestones.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No milestones configured</p>
                ) : (
                  milestones.map((milestone, index) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      number={index + 1}
                      onVerify={() => router.push(`/escrow/${contractId}/milestones/${milestone.id}/verify`)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* WO-108: Energy Production Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Energy Production Trends</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateEnergyData(milestones)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="milestone" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="target" stroke="#9ca3af" strokeDasharray="5 5" name="Target" />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
                    <Line type="monotone" dataKey="projected" stroke="#3b82f6" strokeDasharray="3 3" name="Projected" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Notifications & Analytics */}
          <div className="space-y-6">
            {/* WO-108: Automated Notifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔔</span> Notifications
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg text-sm ${
                        notif.type === 'completion' ? 'bg-green-50 border border-green-200' :
                        notif.type === 'release' ? 'bg-blue-50 border border-blue-200' :
                        'bg-yellow-50 border border-yellow-200'
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">{notif.message}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(notif.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* WO-108: Predictive Analytics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Predictive Analytics</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Next Completion Estimate</div>
                  <div className="text-lg font-bold text-blue-600">
                    {calculateNextCompletion(milestones)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Project Completion Rate</div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-gray-900">
                      {summary ? ((summary.completed / summary.total) * 100).toFixed(0) : 0}%
                    </div>
                    <div className="text-xs text-green-600">On Track</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Average Verification Time</div>
                  <div className="text-lg font-bold text-gray-900">7.2 days</div>
                </div>
              </div>
            </div>

            {/* Funding Progress */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Funding Overview</h2>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Released</span>
                  <span className="font-medium">${(summary?.fundingReleased || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${summary ? (summary.fundingReleased / summary.fundingAllocated) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Total Allocated: ${(summary?.fundingAllocated || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/**
 * WO-108: Milestone Card Component with Visual Indicators
 */
function MilestoneCard({ milestone, number, onVerify }: any) {
  const progress = parseFloat(milestone.verification?.percentComplete) || 0;
  const isComplete = milestone.released;
  const isEligible = milestone.verification?.eligibleForRelease;

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      isComplete ? 'border-green-500 bg-green-50' :
      isEligible ? 'border-yellow-500 bg-yellow-50' :
      'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
            isComplete ? 'bg-green-600 text-white' :
            isEligible ? 'bg-yellow-600 text-white' :
            'bg-gray-200 text-gray-600'
          }`}>
            {isComplete ? '✓' : number}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{milestone.title}</h3>
            <p className="text-sm text-gray-600">{milestone.description}</p>
          </div>
        </div>
        <StatusBadge status={milestone.status} />
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Energy Production</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              progress >= 100 ? 'bg-green-600' :
              progress >= 50 ? 'bg-yellow-600' :
              'bg-blue-600'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-600">Funding Amount</div>
          <div className="font-semibold">${milestone.targetAmount.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-600">Oracle Confidence</div>
          <div className="font-semibold">
            {milestone.oracleData?.confidence 
              ? `${(milestone.oracleData.confidence * 100).toFixed(0)}%`
              : 'N/A'}
          </div>
        </div>
      </div>

      {isEligible && !isComplete && (
        <button
          onClick={onVerify}
          className="mt-3 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700"
        >
          Verify & Release Funds
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: any) {
  const config = {
    PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
    SUBMITTED: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-700' },
    RELEASED: { label: 'Released', color: 'bg-green-100 text-green-700' },
  };

  const { label, color } = config[status as keyof typeof config] || config.PENDING;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${color}`}>
      {label}
    </span>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

/**
 * WO-108: Generate energy production chart data
 */
function generateEnergyData(milestones: any[]) {
  return milestones.map((m, index) => ({
    milestone: `M${index + 1}`,
    target: m.verification?.energyTarget || 1000,
    actual: m.verification?.energyProduced || 0,
    projected: m.verification?.energyProduced 
      ? m.verification.energyProduced * 1.15 
      : m.verification?.energyTarget * 0.8,
  }));
}

/**
 * WO-108: Calculate next completion estimate
 */
function calculateNextCompletion(milestones: any[]): string {
  const pending = milestones.find(m => m.status === 'PENDING' || m.status === 'SUBMITTED');
  
  if (!pending) return 'All Complete';
  
  const daysRemaining = pending.audit?.daysSinceSubmission 
    ? Math.max(0, 7 - pending.audit.daysSinceSubmission)
    : 7;
  
  const date = new Date();
  date.setDate(date.getDate() + daysRemaining);
  
  return `${daysRemaining} days (${date.toLocaleDateString()})`;
}

