import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type CommunicationType = 'email' | 'push' | 'sms';
type CommunicationCategory = 'account' | 'promotional' | 'system' | 'social';
type FrequencyOption = 'immediate' | 'daily' | 'weekly' | 'never';

interface CommunicationPreference {
  id: string;
  type: CommunicationType;
  category: CommunicationCategory;
  label: string;
  description: string;
  enabled: boolean;
  frequency: FrequencyOption;
}

/**
 * Communication Preferences Component
 * 
 * Features:
 * - Enable/disable notification types
 * - Granular controls by category
 * - Frequency options (immediate, daily, weekly)
 * - Clear descriptive labels
 * - Immediate visual feedback
 * - Error handling with retry
 */
export default function CommunicationPreferences() {
  const { isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<CommunicationPreference[]>([
    // Account Updates
    {
      id: 'email_account_security',
      type: 'email',
      category: 'account',
      label: 'Security Alerts',
      description: 'Receive alerts about security events, login attempts, and session changes',
      enabled: true,
      frequency: 'immediate',
    },
    {
      id: 'email_account_changes',
      type: 'email',
      category: 'account',
      label: 'Account Changes',
      description: 'Notifications when your profile, settings, or preferences are updated',
      enabled: true,
      frequency: 'immediate',
    },
    
    // Promotional Content
    {
      id: 'email_promotional_newsletter',
      type: 'email',
      category: 'promotional',
      label: 'Newsletter',
      description: 'Receive our weekly newsletter with platform updates and featured projects',
      enabled: false,
      frequency: 'weekly',
    },
    {
      id: 'email_promotional_offers',
      type: 'email',
      category: 'promotional',
      label: 'Special Offers',
      description: 'Get notified about special promotions and platform benefits',
      enabled: false,
      frequency: 'weekly',
    },
    
    // System Alerts
    {
      id: 'email_system_maintenance',
      type: 'email',
      category: 'system',
      label: 'System Maintenance',
      description: 'Important notifications about scheduled maintenance and downtime',
      enabled: true,
      frequency: 'immediate',
    },
    {
      id: 'push_system_updates',
      type: 'push',
      category: 'system',
      label: 'Platform Updates',
      description: 'Push notifications for new features and platform improvements',
      enabled: true,
      frequency: 'immediate',
    },
    
    // Social
    {
      id: 'email_social_comments',
      type: 'email',
      category: 'social',
      label: 'Comments & Replies',
      description: 'Notifications when someone comments on your projects or replies to you',
      enabled: true,
      frequency: 'daily',
    },
    {
      id: 'email_social_followers',
      type: 'email',
      category: 'social',
      label: 'New Followers',
      description: 'Get notified when someone starts following you',
      enabled: false,
      frequency: 'weekly',
    },
  ]);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load preferences
  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    }
  }, [isAuthenticated]);

  const loadPreferences = async () => {
    try {
      // In production, fetch from API
      // const response = await fetch('/api/users/communication-preferences');
      // const data = await response.json();
      // setPreferences(data.preferences);
    } catch (err) {
      console.error('Failed to load communication preferences:', err);
    }
  };

  // Handle toggle change
  const handleToggle = async (prefId: string) => {
    setLoading(prefId);
    setError(null);
    setSuccessMessage(null);

    // Optimistically update UI
    setPreferences(prev =>
      prev.map(p =>
        p.id === prefId ? { ...p, enabled: !p.enabled } : p
      )
    );

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setSuccessMessage('Preference updated');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      // Revert on error
      setPreferences(prev =>
        prev.map(p =>
          p.id === prefId ? { ...p, enabled: !p.enabled } : p
        )
      );
      setError('Failed to update preference. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // Handle frequency change
  const handleFrequencyChange = async (prefId: string, frequency: FrequencyOption) => {
    setLoading(prefId);
    setError(null);

    // Update UI
    setPreferences(prev =>
      prev.map(p =>
        p.id === prefId ? { ...p, frequency } : p
      )
    );

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccessMessage('Frequency updated');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      setError('Failed to update frequency. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // Group by category
  const categoryInfo = {
    account: {
      title: 'Account Updates',
      description: 'Important notifications about your account and security',
      icon: '🔐',
    },
    promotional: {
      title: 'Promotional Content',
      description: 'Marketing communications and special offers',
      icon: '📢',
    },
    system: {
      title: 'System Alerts',
      description: 'Platform maintenance and important system notifications',
      icon: '⚙️',
    },
    social: {
      title: 'Social Notifications',
      description: 'Updates about your community interactions',
      icon: '👥',
    },
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<CommunicationCategory, CommunicationPreference[]>);

  if (!isAuthenticated) {
    return (
      <div className="communication-preferences">
        <p>Please log in to manage your communication preferences.</p>
      </div>
    );
  }

  return (
    <div className="communication-preferences">
      <div className="preferences-header">
        <h2>Communication Preferences</h2>
        <p>Choose how you want to receive updates and notifications</p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="status">
          ✓ {successMessage}
        </div>
      )}

      <div className="preferences-container">
        {Object.entries(groupedPreferences).map(([category, prefs]) => {
          const info = categoryInfo[category as CommunicationCategory];
          
          return (
            <div key={category} className="preference-category">
              <div className="category-header">
                <div className="category-icon">{info.icon}</div>
                <div className="category-info">
                  <h3>{info.title}</h3>
                  <p>{info.description}</p>
                </div>
              </div>

              <div className="preference-list">
                {prefs.map((pref) => (
                  <div key={pref.id} className="preference-item">
                    <div className="preference-main">
                      <div className="preference-info">
                        <label htmlFor={pref.id} className="preference-label">
                          {pref.label}
                        </label>
                        <p className="preference-description">{pref.description}</p>
                      </div>

                      <div className="preference-control">
                        <button
                          id={pref.id}
                          type="button"
                          role="switch"
                          aria-checked={pref.enabled}
                          className={`toggle-switch ${pref.enabled ? 'on' : 'off'}`}
                          onClick={() => handleToggle(pref.id)}
                          disabled={loading === pref.id}
                        >
                          <span className="toggle-slider">
                            {loading === pref.id && (
                              <span className="toggle-spinner"></span>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>

                    {pref.enabled && (
                      <div className="frequency-selector">
                        <label htmlFor={`${pref.id}-frequency`}>
                          Frequency:
                        </label>
                        <select
                          id={`${pref.id}-frequency`}
                          value={pref.frequency}
                          onChange={(e) => handleFrequencyChange(pref.id, e.target.value as FrequencyOption)}
                          disabled={loading === pref.id}
                          className="frequency-select"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Summary</option>
                          <option value="never">Never</option>
                        </select>
                        <span className="frequency-help">
                          {pref.frequency === 'immediate' && '📨 Receive notifications as they happen'}
                          {pref.frequency === 'daily' && '📅 Once per day summary'}
                          {pref.frequency === 'weekly' && '📆 Weekly roundup'}
                          {pref.frequency === 'never' && '🔕 Disabled'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .communication-preferences {
          max-width: 900px;
        }

        .preferences-header {
          margin-bottom: 2rem;
        }

        .preferences-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .preferences-header p {
          color: #6c757d;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .alert-error {
          background: #f8d7da;
          color: #842029;
          border: 1px solid #f5c2c7;
        }

        .alert-success {
          background: #d1e7dd;
          color: #0f5132;
          border: 1px solid #badbcc;
        }

        .preferences-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .preference-category {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .category-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .category-icon {
          font-size: 2.5rem;
        }

        .category-info h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .category-info p {
          color: #6c757d;
          font-size: 0.9rem;
          margin: 0;
        }

        .preference-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .preference-item {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .preference-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        .preference-info {
          flex: 1;
        }

        .preference-label {
          display: block;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #212529;
          cursor: pointer;
        }

        .preference-description {
          color: #6c757d;
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.5;
        }

        .preference-control {
          flex-shrink: 0;
        }

        .toggle-switch {
          position: relative;
          width: 56px;
          height: 28px;
          background: #6c757d;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.3s;
          padding: 0;
        }

        .toggle-switch.on {
          background: #198754;
        }

        .toggle-switch:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-switch.on .toggle-slider {
          transform: translateX(28px);
        }

        .toggle-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid #e9ecef;
          border-top-color: #0d6efd;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .frequency-selector {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .frequency-selector label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #6c757d;
        }

        .frequency-select {
          padding: 0.5rem 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          background: white;
        }

        .frequency-select:focus {
          outline: none;
          border-color: #0d6efd;
        }

        .frequency-help {
          font-size: 0.85rem;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .preference-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .frequency-selector {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}






