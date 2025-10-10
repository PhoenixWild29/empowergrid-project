import React from 'react';
import { useAutoRenewal } from '../hooks/useAutoRenewal';

/**
 * RenewalPreferences Component
 * 
 * User interface for managing automatic renewal preferences
 * 
 * Features:
 * - Toggle automatic renewal
 * - Set reminder timing
 * - Display renewal statistics
 */
export default function RenewalPreferences() {
  const {
    autoRenewalEnabled,
    reminderMinutes,
    renewalCount,
    failureCount,
    setAutoRenewal,
    setReminderMinutes,
  } = useAutoRenewal();

  const handleReminderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReminderMinutes(Number(e.target.value));
  };

  return (
    <div className="renewal-preferences">
      <h3>Session Renewal Preferences</h3>

      <div className="preference-section">
        <div className="preference-item">
          <label className="preference-label">
            <input
              type="checkbox"
              checked={autoRenewalEnabled}
              onChange={(e) => setAutoRenewal(e.target.checked)}
            />
            <span>
              <strong>Automatic Session Renewal</strong>
              <p className="preference-description">
                Automatically renew your session when you&apos;re actively using the application
              </p>
            </span>
          </label>
        </div>

        <div className="preference-item">
          <label htmlFor="reminder-timing">
            <strong>Renewal Reminder Timing</strong>
          </label>
          <select
            id="reminder-timing"
            value={reminderMinutes}
            onChange={handleReminderChange}
            className="reminder-select"
          >
            <option value={1}>1 minute before expiration</option>
            <option value={2}>2 minutes before expiration</option>
            <option value={3}>3 minutes before expiration</option>
            <option value={5}>5 minutes before expiration</option>
            <option value={10}>10 minutes before expiration</option>
          </select>
          <p className="preference-description">
            When to show renewal reminder if automatic renewal is disabled
          </p>
        </div>
      </div>

      <div className="stats-section">
        <h4>Renewal Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Renewals:</span>
            <span className="stat-value">{renewalCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Failed Attempts:</span>
            <span className="stat-value">{failureCount}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .renewal-preferences {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .renewal-preferences h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .preference-section {
          margin-bottom: 2rem;
        }

        .preference-item {
          margin-bottom: 1.5rem;
        }

        .preference-label {
          display: flex;
          align-items: start;
          gap: 1rem;
          cursor: pointer;
        }

        .preference-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          cursor: pointer;
        }

        .preference-label strong {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 1rem;
        }

        .preference-description {
          font-size: 0.85rem;
          color: #6c757d;
          margin: 0.25rem 0 0 0;
        }

        .preference-item label:not(.preference-label) {
          display: block;
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .reminder-select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .stats-section {
          padding-top: 1.5rem;
          border-top: 2px solid #e9ecef;
        }

        .stats-section h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #6c757d;
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #212529;
        }
      `}</style>
    </div>
  );
}

