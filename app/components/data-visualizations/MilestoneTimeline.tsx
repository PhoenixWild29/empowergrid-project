/**
 * Milestone Timeline
 * 
 * Visualizes project milestones with progress indicators
 */

import React from 'react';

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'REJECTED';
  targetAmount: number;
  dueDate: string;
  completedAt?: string;
}

export interface MilestoneTimelineProps {
  milestones: MilestoneItem[];
  currentMilestone?: string;
}

const STATUS_CONFIG = {
  PENDING: {
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    icon: '○',
  },
  SUBMITTED: {
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    icon: '◐',
  },
  APPROVED: {
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: '◑',
  },
  RELEASED: {
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: '●',
  },
  REJECTED: {
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: '✕',
  },
};

export default function MilestoneTimeline({
  milestones,
  currentMilestone,
}: MilestoneTimelineProps) {
  // Sort milestones by due date
  const sortedMilestones = [...milestones].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  
  // Calculate progress
  const completedCount = milestones.filter((m) => m.status === 'RELEASED').length;
  const progressPercent = (completedCount / milestones.length) * 100;
  
  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Check if milestone is overdue
  const isOverdue = (milestone: MilestoneItem) => {
    if (milestone.status === 'RELEASED') return false;
    return new Date(milestone.dueDate) < new Date();
  };
  
  if (!milestones || milestones.length === 0) {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-gray-600 text-lg font-medium">No milestones defined</p>
        <p className="text-gray-500 text-sm mt-1">
          Project milestones will appear here once they are created
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Milestone Progress</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {completedCount} of {milestones.length} Completed
            </p>
          </div>
          <div className="text-5xl font-bold text-blue-600">
            {progressPercent.toFixed(0)}%
          </div>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Milestone Timeline
        </h3>
        
        <div className="space-y-8">
          {sortedMilestones.map((milestone, index) => {
            const config = STATUS_CONFIG[milestone.status];
            const isCurrent = milestone.id === currentMilestone;
            const overdue = isOverdue(milestone);
            
            return (
              <div key={milestone.id} className="relative">
                {/* Timeline Line */}
                {index < sortedMilestones.length - 1 && (
                  <div
                    className={`absolute left-6 top-12 w-0.5 h-16 ${
                      milestone.status === 'RELEASED'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                )}
                
                <div className="flex gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center text-2xl ${config.textColor} font-bold shadow-sm`}
                    >
                      {config.icon}
                    </div>
                  </div>
                  
                  {/* Milestone Content */}
                  <div
                    className={`flex-1 bg-white rounded-lg border-2 p-4 transition-all ${
                      isCurrent
                        ? 'border-blue-500 shadow-lg scale-105'
                        : `${config.borderColor}`
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {milestone.title}
                        </h4>
                        {isCurrent && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mt-1">
                            Current Milestone
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold ${config.textColor} ${config.bgColor} rounded-full`}
                      >
                        {milestone.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">
                      {milestone.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-gray-700">
                          {formatCurrency(milestone.targetAmount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span
                          className={`font-medium ${
                            overdue ? 'text-red-600' : 'text-gray-700'
                          }`}
                        >
                          {formatDate(milestone.dueDate)}
                          {overdue && ' (Overdue)'}
                        </span>
                      </div>
                      
                      {milestone.completedAt && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="font-medium text-green-700">
                            Completed {formatDate(milestone.completedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}






