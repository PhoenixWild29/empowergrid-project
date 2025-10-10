/**
 * NewProjectNotification Component
 * 
 * WO-89: Notifications for new projects
 * Shows toast notifications when new projects are created
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useNewProjects } from '../../hooks/useRealtimeProject';

export default function NewProjectNotification() {
  const { newProjects, clearNewProjects } = useNewProjects();

  if (newProjects.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-50 space-y-2 max-w-sm">
      {newProjects.map((project, index) => (
        <div
          key={`${project.id}-${index}`}
          className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-4 animate-slide-in"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <h4 className="font-semibold text-gray-900">New Project!</h4>
            </div>
            <button
              onClick={clearNewProjects}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-2">{project.title}</p>
          <Link
            href={`/projects/${project.id}`}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View Project →
          </Link>
        </div>
      ))}
    </div>
  );
}

