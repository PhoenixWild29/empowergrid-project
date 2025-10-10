/**
 * TrendingProjects Component
 * 
 * WO-97: Display trending projects
 * Shows projects with recent momentum
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TrendingProjects({ limit = 5 }: { limit?: number }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch(`/api/recommendations/trending?limit=${limit}`);
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
    fetchTrending();
  }, [limit]);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🔥</span> Trending Projects
      </h2>
      <div className="space-y-4">
        {projects.map((project, index) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <h3 className="font-semibold text-gray-900">{project.title}</h3>
                </div>
                <p className="text-sm text-gray-600 line-clamp-1 mb-2">{project.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{project.fundingProgress.toFixed(0)}% funded</span>
                  <span>•</span>
                  <span>{project.funderCount} funders</span>
                  <span>•</span>
                  <span>{project.category}</span>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="text-sm font-semibold text-green-600">
                  {project.trendingScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">score</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

