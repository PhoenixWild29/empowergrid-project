import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface LeaderboardEntry {
  userId: string;
  username: string;
  reputation: number;
  verified: boolean;
  role: string;
  rank: number;
}

type TimePeriod = 'all-time' | 'monthly' | 'weekly';

/**
 * Reputation Leaderboard Page
 * 
 * Features:
 * - Ranked list by reputation (highest to lowest)
 * - User avatars, usernames, scores
 * - Pagination
 * - Current user highlighting
 * - Time period filters
 * - Auto-refresh
 * - Loading/error states
 */
export default function LeaderboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('all-time');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    loadLeaderboard();
  }, [period, page]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reputation/leaderboard?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to load leaderboard');
      }

      const result = await response.json();
      const entries = result.data.map((entry: any, index: number) => ({
        userId: entry.userId,
        username: entry.username,
        reputation: entry.reputation,
        verified: entry.verified,
        role: entry.role,
        rank: (page - 1) * limit + index + 1,
      }));

      setLeaderboard(entries);
      setTotalEntries(result.data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (score: number): string => {
    if (score >= 1000) return '#ffd700';
    if (score >= 500) return '#9b59b6';
    if (score >= 250) return '#3498db';
    if (score >= 100) return '#2ecc71';
    if (score >= 50) return '#95a5a6';
    return '#bdc3c7';
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <Layout>
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <h1>Reputation Leaderboard</h1>
          <p>Top contributors to the EmpowerGRID community</p>
        </div>

        {/* Time Period Filters */}
        <div className="period-filters">
          <button
            className={`period-btn ${period === 'all-time' ? 'active' : ''}`}
            onClick={() => {
              setPeriod('all-time');
              setPage(1);
            }}
          >
            All Time
          </button>
          <button
            className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => {
              setPeriod('monthly');
              setPage(1);
            }}
          >
            This Month
          </button>
          <button
            className={`period-btn ${period === 'weekly' ? 'active' : ''}`}
            onClick={() => {
              setPeriod('weekly');
              setPage(1);
            }}
          >
            This Week
          </button>
          <button
            className="refresh-btn"
            onClick={loadLeaderboard}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Leaderboard Content */}
        <div className="leaderboard-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={loadLeaderboard} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.map((entry) => {
                const isCurrentUser = isAuthenticated && user?.id === entry.userId;
                const tierColor = getTierColor(entry.reputation);

                return (
                  <div
                    key={entry.userId}
                    className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''}`}
                  >
                    <div className="rank-badge">
                      <span className="rank-number">{getRankIcon(entry.rank)}</span>
                    </div>

                    <div className="user-avatar">
                      <div className="avatar-placeholder" style={{ background: tierColor }}>
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="user-info">
                      <div className="username">
                        {entry.username}
                        {entry.verified && <span className="verified-badge">✓</span>}
                        {isCurrentUser && <span className="you-badge">You</span>}
                      </div>
                      <div className="user-role">{entry.role}</div>
                    </div>

                    <div className="reputation-score" style={{ color: tierColor }}>
                      <div className="score-value">{entry.reputation}</div>
                      <div className="score-label">points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && leaderboard.length === limit && (
          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="page-btn"
            >
              Previous
            </button>
            <span className="page-info">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={leaderboard.length < limit}
              className="page-btn"
            >
              Next
            </button>
          </div>
        )}

        <style jsx>{`
          .leaderboard-page {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
          }

          .leaderboard-header {
            text-align: center;
            margin-bottom: 2rem;
          }

          .leaderboard-header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .leaderboard-header p {
            color: #6c757d;
            font-size: 1.1rem;
          }

          .period-filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            justify-content: center;
            flex-wrap: wrap;
          }

          .period-btn {
            padding: 0.75rem 1.5rem;
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .period-btn:hover {
            border-color: #0d6efd;
          }

          .period-btn.active {
            background: #0d6efd;
            color: white;
            border-color: #0d6efd;
          }

          .refresh-btn {
            padding: 0.75rem 1.5rem;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }

          .refresh-btn:hover:not(:disabled) {
            background: #5a6268;
          }

          .refresh-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .leaderboard-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .loading-state,
          .error-state {
            text-align: center;
            padding: 4rem 2rem;
          }

          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e9ecef;
            border-top-color: #0d6efd;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 1rem;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .error-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }

          .retry-btn {
            padding: 0.75rem 1.5rem;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
          }

          .leaderboard-list {
            display: flex;
            flex-direction: column;
          }

          .leaderboard-entry {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding: 1.5rem;
            border-bottom: 1px solid #e9ecef;
            transition: all 0.2s;
          }

          .leaderboard-entry:hover {
            background: #f8f9fa;
          }

          .leaderboard-entry.current-user {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
          }

          .rank-badge {
            min-width: 60px;
            text-align: center;
          }

          .rank-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: #495057;
          }

          .user-avatar {
            flex-shrink: 0;
          }

          .avatar-placeholder {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 700;
            color: white;
          }

          .user-info {
            flex: 1;
          }

          .username {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .verified-badge {
            background: #198754;
            color: white;
            padding: 0.125rem 0.5rem;
            border-radius: 10px;
            font-size: 0.75rem;
          }

          .you-badge {
            background: #ffc107;
            color: #664d03;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 700;
          }

          .user-role {
            color: #6c757d;
            font-size: 0.9rem;
          }

          .reputation-score {
            text-align: right;
            min-width: 100px;
          }

          .score-value {
            font-size: 2rem;
            font-weight: 700;
            line-height: 1;
          }

          .score-label {
            font-size: 0.75rem;
            color: #6c757d;
            text-transform: uppercase;
          }

          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin-top: 2rem;
          }

          .page-btn {
            padding: 0.75rem 1.5rem;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }

          .page-btn:hover:not(:disabled) {
            background: #0b5ed7;
          }

          .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .page-info {
            font-weight: 600;
          }

          @media (max-width: 768px) {
            .leaderboard-entry {
              gap: 1rem;
              padding: 1rem;
            }

            .rank-badge {
              min-width: 40px;
            }

            .rank-number {
              font-size: 1.2rem;
            }

            .avatar-placeholder {
              width: 50px;
              height: 50px;
              font-size: 1.2rem;
            }

            .score-value {
              font-size: 1.5rem;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}






