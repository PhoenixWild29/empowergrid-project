/**
 * RecommendedForYou Component
 * 
 * WO-97: Personalized Recommendation System
 * Displays personalized project recommendations
 * 
 * Features:
 * - Fetches personalized recommendations
 * - Shows recommendation reasons
 * - Thumbs up/down feedback
 * - Loading and error states
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Recommendation {
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    location: string;
    targetAmount: number;
    currentAmount: number;
    energyCapacity: number | null;
    fundingProgress: number;
    creator: {
      username: string;
      reputation: number;
      verified: boolean;
    };
    funderCount: number;
    images: string[];
  };
  score: number;
  reason: string;
  algorithm: string;
}

interface RecommendedForYouProps {
  limit?: number;
}

export default function RecommendedForYou({ limit = 6 }: RecommendedForYouProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchRecommendations();
  }, [limit]);

  async function fetchRecommendations() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/recommendations/for-you?limit=${limit}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to see personalized recommendations');
          return;
        }
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error(data.message || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('[WO-97] Fetch recommendations error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFeedback(projectId: string, feedbackValue: number) {
    try {
      const response = await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          feedback: feedbackValue,
        }),
      });

      if (response.ok) {
        setFeedback(prev => ({ ...prev, [projectId]: feedbackValue }));
      }
    } catch (err) {
      console.error('[WO-97] Submit feedback error:', err);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl text-gray-300 mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Recommendations Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Browse and interact with projects to get personalized suggestions!
          </p>
          <Link
            href="/projects/discover"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Explore Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
        <button
          onClick={fetchRecommendations}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map(({ project, score, reason }) => (
          <div key={project.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* Project Image */}
            {project.images && project.images.length > 0 && (
              <img
                src={project.images[0]}
                alt={project.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}

            {/* Project Info */}
            <div className="mb-3">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                  {project.title}
                </h3>
                <span className="ml-2 text-xs font-bold text-green-600">
                  {score.toFixed(0)}
                </span>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {project.description}
              </p>

              {/* Reason */}
              <div className="flex items-start gap-1 mb-2">
                <svg className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-600">{reason}</p>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {project.fundingProgress.toFixed(0)}%
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {project.energyCapacity ? `${project.energyCapacity}kW` : 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {project.funderCount}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <Link
                href={`/projects/${project.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Details →
              </Link>

              {/* Feedback */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleFeedback(project.id, 1)}
                  className={`p-1.5 rounded transition-colors ${
                    feedback[project.id] === 1
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400 hover:text-green-600'
                  }`}
                  title="I like this recommendation"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                  </svg>
                </button>
                <button
                  onClick={() => handleFeedback(project.id, -1)}
                  className={`p-1.5 rounded transition-colors ${
                    feedback[project.id] === -1
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-400 hover:text-red-600'
                  }`}
                  title="Not interested"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zM17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/projects/discover"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          See All Projects →
        </Link>
      </div>
    </div>
  );
}

