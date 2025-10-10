/**
 * SimilarProjects Component
 * 
 * WO-97: Display similar projects
 * Shows projects similar to current project
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SimilarProjectsProps {
  projectId: string;
  limit?: number;
}

export default function SimilarProjects({ projectId, limit = 4 }: SimilarProjectsProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const response = await fetch(`/api/recommendations/similar/${projectId}?limit=${limit}`);
        const data = await response.json();
        if (data.success) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSimilar();
  }, [projectId, limit]);

  if (isLoading || projects.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Similar Projects</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map(({ project, similarityScore, similarityReason }) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 flex-1">
                {project.title}
              </h4>
              <span className="ml-2 text-xs font-bold text-blue-600">
                {similarityScore.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{project.description}</p>
            <p className="text-xs text-blue-600">{similarityReason}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

