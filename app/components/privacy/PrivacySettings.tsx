import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PrivacySetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  category: string;
}

/**
 * Privacy Settings Component
 * 
 * Features:
 * - Toggle controls for privacy options
 * - Descriptive labels and help text
 * - Immediate visual feedback
 * - Loading states during updates
 * - Error handling with retry
 * - Grouped by category
 */
export default function PrivacySettings() {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'profile_visible',
      label: 'Public Profile',
      description: 'Make your profile visible to other users',
      enabled: true,
      category: 'Profile Visibility',
    },
    {
      id: 'show_email',
      label: 'Show Email',
      description: 'Display your email address on your public profile',
      enabled: false,
      category: 'Profile Visibility',
    },
    {
      id: 'show_stats',
      label: 'Show Statistics',
      description: 'Display your project statistics on your profile',
      enabled: true,
      category: 'Profile Visibility',
    },
    {
      id: 'activity_tracking',
      label: 'Activity Tracking',
      description: 'Allow tracking of your activity for analytics and personalization',
      enabled: true,
      category: 'Data & Analytics',
    },
    {
      id: 'analytics_cookies',
      label: 'Analytics Cookies',
      description: 'Enable cookies for analytics and usage statistics',
      enabled: true,
      category: 'Data & Analytics',
    },
    {
      id: 'searchable',
      label: 'Searchable Profile',
      description: 'Allow your profile to appear in search results',
      enabled: true,
      category: 'Discoverability',
    },
    {
      id: 'show_activity_feed',
      label: 'Public Activity Feed',
      description: 'Show your recent activities on your profile',
      enabled: false,
      category: 'Discoverability',
    },
  ]);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load privacy settings
  useEffect(() => {
    if (isAuthenticated) {
      loadPrivacySettings();
    }
  }, [isAuthenticated]);

  const loadPrivacySettings = async () => {
    try {
      // In production, fetch from API
      // const response = await fetch('/api/users/privacy');
      // const data = await response.json();
      // setSettings(data.settings);
    } catch (err) {
      console.error('Failed to load privacy settings:', err);
    }
  };

  // Handle toggle change
  const handleToggle = async (settingId: string) => {
    setLoading(settingId);
    setError(null);
    setSuccessMessage(null);

    // Optimistically update UI
    setSettings(prev =>
      prev.map(s =>
        s.id === settingId ? { ...s, enabled: !s.enabled } : s
      )
    );

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // In production:
      // const response = await fetch('/api/users/privacy', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify({ settingId, enabled: newValue }),
      // });

      setSuccessMessage('Privacy setting updated');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      // Revert on error
      setSettings(prev =>
        prev.map(s =>
          s.id === settingId ? { ...s, enabled: !s.enabled } : s
        )
      );
      setError('Failed to update setting. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, PrivacySetting[]>);

  if (!isAuthenticated) {
    return (
      <div className="privacy-settings">
        <p>Please log in to manage your privacy settings.</p>
      </div>
    );
  }

  return (
    <div className="privacy-settings">
      <div className="privacy-header">
        <h2>Privacy Settings</h2>
        <p>Control what information is visible to others and how your data is used</p>
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

      <div className="settings-container">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <div key={category} className="settings-category">
            <h3>{category}</h3>

            <div className="settings-list">
              {categorySettings.map((setting) => (
                <div key={setting.id} className="setting-item">
                  <div className="setting-info">
                    <label htmlFor={setting.id} className="setting-label">
                      {setting.label}
                    </label>
                    <p className="setting-description">{setting.description}</p>
                  </div>

                  <div className="setting-control">
                    <button
                      id={setting.id}
                      type="button"
                      role="switch"
                      aria-checked={setting.enabled}
                      aria-label={`${setting.label}: ${setting.enabled ? 'enabled' : 'disabled'}`}
                      className={`toggle-switch ${setting.enabled ? 'on' : 'off'} ${loading === setting.id ? 'loading' : ''}`}
                      onClick={() => handleToggle(setting.id)}
                      disabled={loading === setting.id}
                    >
                      <span className="toggle-slider">
                        {loading === setting.id && (
                          <span className="toggle-spinner"></span>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .privacy-settings {
          max-width: 800px;
        }

        .privacy-header {
          margin-bottom: 2rem;
        }

        .privacy-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .privacy-header p {
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

        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .settings-category {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .settings-category h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #0d6efd;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .setting-item:hover {
          background: #e9ecef;
        }

        .setting-info {
          flex: 1;
        }

        .setting-label {
          display: block;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #212529;
          cursor: pointer;
        }

        .setting-description {
          color: #6c757d;
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.5;
        }

        .setting-control {
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

        .toggle-switch.off {
          background: #6c757d;
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

        .toggle-switch:focus-visible {
          outline: 2px solid #0d6efd;
          outline-offset: 2px;
        }

        @media (max-width: 768px) {
          .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}






