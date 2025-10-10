import React, { useState, useEffect } from 'react';

interface ReputationData {
  userId: string;
  username: string;
  reputation: number;
  verified: boolean;
  role: string;
}

interface ReputationDisplayProps {
  userId: string;
}

/**
 * Reputation Display Component
 * 
 * Features:
 * - Prominent reputation score
 * - Visual tier indicators
 * - Responsive design
 * - Loading/error states
 */
export default function ReputationDisplay({ userId }: ReputationDisplayProps) {
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReputation();
  }, [userId]);

  const loadReputation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reputation/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load reputation');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reputation');
    } finally {
      setLoading(false);
    }
  };

  const getReputationTier = (score: number): {
    name: string;
    color: string;
    icon: string;
    minScore: number;
  } => {
    if (score >= 1000) return { name: 'Legend', color: '#ffd700', icon: '👑', minScore: 1000 };
    if (score >= 500) return { name: 'Expert', color: '#9b59b6', icon: '🏆', minScore: 500 };
    if (score >= 250) return { name: 'Advanced', color: '#3498db', icon: '⭐', minScore: 250 };
    if (score >= 100) return { name: 'Intermediate', color: '#2ecc71', icon: '✓', minScore: 100 };
    if (score >= 50) return { name: 'Rising', color: '#95a5a6', icon: '↗', minScore: 50 };
    return { name: 'Newcomer', color: '#bdc3c7', icon: '🌱', minScore: 0 };
  };

  const getProgressToNextTier = (score: number): number => {
    const tiers = [0, 50, 100, 250, 500, 1000];
    const nextTier = tiers.find(t => t > score);
    
    if (!nextTier) return 100; // Max tier reached
    
    const currentTier = tiers.reverse().find(t => t <= score) || 0;
    const progress = ((score - currentTier) / (nextTier - currentTier)) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div className="reputation-display loading">
        <div className="spinner"></div>
        <p>Loading reputation...</p>

        <style jsx>{`
          .reputation-display.loading {
            text-align: center;
            padding: 2rem;
            color: #6c757d;
          }

          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e9ecef;
            border-top-color: #0d6efd;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            margin: 0 auto 1rem;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reputation-display error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={loadReputation} className="retry-btn">
          Try Again
        </button>

        <style jsx>{`
          .reputation-display.error {
            text-align: center;
            padding: 2rem;
          }

          .error-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }

          .error p {
            color: #6c757d;
            margin-bottom: 1rem;
          }

          .retry-btn {
            padding: 0.5rem 1rem;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }

          .retry-btn:hover {
            background: #0b5ed7;
          }
        `}</style>
      </div>
    );
  }

  if (!data) return null;

  const tier = getReputationTier(data.reputation);
  const progress = getProgressToNextTier(data.reputation);

  return (
    <div className="reputation-display">
      <div className="reputation-header">
        <div className="tier-badge" style={{ borderColor: tier.color }}>
          <span className="tier-icon">{tier.icon}</span>
          <span className="tier-name" style={{ color: tier.color }}>{tier.name}</span>
        </div>
      </div>

      <div className="score-container">
        <div className="score-value" style={{ color: tier.color }}>
          {data.reputation}
        </div>
        <div className="score-label">Reputation Points</div>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: tier.color }}></div>
        </div>
        <div className="progress-label">
          {progress < 100 ? `${progress.toFixed(0)}% to next tier` : 'Max tier reached!'}
        </div>
      </div>

      <style jsx>{`
        .reputation-display {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .reputation-header {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .tier-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          border: 3px solid;
          border-radius: 25px;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .tier-icon {
          font-size: 1.5rem;
        }

        .score-container {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .score-value {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .score-label {
          color: #6c757d;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .progress-container {
          margin-top: 1.5rem;
        }

        .progress-bar {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-label {
          text-align: center;
          font-size: 0.85rem;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .score-value {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
}




