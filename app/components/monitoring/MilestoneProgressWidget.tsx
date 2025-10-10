/**
 * Milestone Progress Widget
 * 
 * WO-86: Real-time Monitoring Dashboard
 * Milestone tracking with timeline visualization
 */

'use client';

import React from 'react';
import { useRealtimeMilestones } from '../../hooks/useRealtimeProject';

interface MilestoneProgressWidgetProps {
  projectId: string;
  milestones: any[];
}

export default function MilestoneProgressWidget({
  projectId,
  milestones = [],
}: MilestoneProgressWidgetProps) {
  const recentCompletions = useRealtimeMilestones(projectId);

  const totalMilestones = milestones.length;
  const completedCount = milestones.filter(m => m.status === 'RELEASED').length;
  const progressPercentage = totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0;

  // Get next upcoming milestone
  const upcomingMilestones = milestones
    .filter(m => m.status === 'PENDING' || m.status === 'SUBMITTED')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const nextMilestone = upcomingMilestones[0];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🎯</span> Milestone Progress
      </h3>

      {/* Progress Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-sm font-semibold text-gray-900">
            {completedCount}/{totalMilestones} Completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              progressPercentage === 100 ? 'bg-green-600' :
              progressPercentage > 50 ? 'bg-blue-600' :
              'bg-yellow-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{progressPercentage.toFixed(0)}% Complete</div>
      </div>

      {/* Next Milestone Alert */}
      {nextMilestone && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔔</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Upcoming Milestone</h4>
              <p className="text-sm text-gray-700 mb-2">{nextMilestone.title}</p>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>Due: {new Date(nextMilestone.dueDate).toLocaleDateString()}</span>
                <span>Target: ${nextMilestone.targetAmount.toLocaleString()}</span>
                {nextMilestone.energyTarget && (
                  <span>Energy: {nextMilestone.energyTarget} kWh</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone List */}
      <div className="space-y-3">
        {milestones.map((milestone, index) => {
          const isRecentlyCompleted = recentCompletions.includes(milestone.id);
          const daysUntilDue = Math.ceil(
            (new Date(milestone.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const isOverdue = daysUntilDue < 0 && milestone.status !== 'RELEASED';

          return (
            <div
              key={milestone.id}
              className={`p-3 rounded-lg border transition-all ${
                isRecentlyCompleted ? 'bg-green-50 border-green-500 animate-pulse' :
                milestone.status === 'RELEASED' ? 'bg-gray-50 border-gray-200' :
                isOverdue ? 'bg-red-50 border-red-200' :
                'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    milestone.status === 'RELEASED' ? 'bg-green-500 text-white' :
                    milestone.status === 'SUBMITTED' ? 'bg-blue-500 text-white' :
                    milestone.status === 'APPROVED' ? 'bg-purple-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {milestone.title}
                      {isRecentlyCompleted && (
                        <span className="ml-2 text-xs text-green-600 font-normal">
                          ✨ Just Completed!
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{milestone.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                      {isOverdue && (
                        <span className="text-red-600 font-medium">
                          ⚠️ {Math.abs(daysUntilDue)} days overdue
                        </span>
                      )}
                      {!isOverdue && milestone.status !== 'RELEASED' && daysUntilDue <= 7 && (
                        <span className="text-orange-600 font-medium">
                          ⏰ {daysUntilDue} days remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <StatusBadge status={milestone.status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: any = {
    PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-600' },
    SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
    APPROVED: { label: 'Approved', className: 'bg-purple-100 text-purple-700' },
    RELEASED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

