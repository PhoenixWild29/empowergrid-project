import React from 'react';

interface ReputationFactor {
  activity: string;
  label: string;
  points: number;
  count: number;
  icon: string;
}

interface ReputationFactorBreakdownProps {
  userId: string;
}

/**
 * Reputation Factor Breakdown
 * 
 * Shows individual contributions to reputation score
 */
export default function ReputationFactorBreakdown({ userId }: ReputationFactorBreakdownProps) {
  // Mock data - in production, fetch from API
  const factors: ReputationFactor[] = [
    { activity: 'PROJECT_CREATED', label: 'Projects Created', points: 10, count: 3, icon: '🏗️' },
    { activity: 'PROJECT_COMPLETED', label: 'Projects Completed', points: 25, count: 1, icon: '✅' },
    { activity: 'PROJECT_FUNDED', label: 'Projects Funded', points: 5, count: 5, icon: '💰' },
    { activity: 'PROFILE_VERIFIED', label: 'Profile Verified', points: 20, count: 1, icon: '✓' },
  ];

  const totalPoints = factors.reduce((sum, f) => sum + (f.points * f.count), 0);

  return (
    <div className="reputation-breakdown">
      <h3>Reputation Breakdown</h3>
      <p className="breakdown-description">
        How you earned your {totalPoints} reputation points
      </p>

      <div className="factors-list">
        {factors.map((factor) => {
          const contribution = factor.points * factor.count;
          const percentage = (contribution / totalPoints) * 100;

          return (
            <div key={factor.activity} className="factor-item">
              <div className="factor-header">
                <span className="factor-icon">{factor.icon}</span>
                <span className="factor-label">{factor.label}</span>
                <span className="factor-count">×{factor.count}</span>
              </div>
              <div className="factor-details">
                <div className="factor-bar">
                  <div className="factor-fill" style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="factor-points">+{contribution} points</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="total-summary">
        <strong>Total: {totalPoints} points</strong>
      </div>

      <style jsx>{`
        .reputation-breakdown {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .breakdown-description {
          color: #6c757d;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .factors-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .factor-item {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .factor-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .factor-icon {
          font-size: 1.5rem;
        }

        .factor-label {
          flex: 1;
          font-weight: 600;
        }

        .factor-count {
          background: #e9ecef;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .factor-details {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .factor-bar {
          flex: 1;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .factor-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .factor-points {
          font-weight: 700;
          color: #198754;
          min-width: 80px;
          text-align: right;
        }

        .total-summary {
          padding: 1rem;
          background: #e7f3ff;
          border-radius: 8px;
          text-align: center;
          color: #0d6efd;
        }
      `}</style>
    </div>
  );
}






