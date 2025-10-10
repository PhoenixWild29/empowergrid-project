import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

type ProfileSection = 'details' | 'privacy' | 'communication';

interface UserProfileData {
  id: string;
  username: string;
  email: string | null;
  role: string;
  reputation: number;
  verified: boolean;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  socialLinks: any;
  createdAt: string;
  userStats?: {
    projectsCreated: number;
    projectsFunded: number;
    totalFunded: number;
    successfulProjects: number;
    totalEarnings: number;
  };
}

/**
 * User Profile Dashboard
 * 
 * Features:
 * - Display user personal information (read-only)
 * - Navigation between profile sections
 * - Loading states
 * - Error handling with retry
 * - Responsive design
 */
export default function UserProfileDashboard() {
  const { user: authUser, isAuthenticated } = useAuth();
  const authLoading = false; // AuthContext has isLoading, not loading
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ProfileSection>('details');
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load profile data
  useEffect(() => {
    if (isAuthenticated) {
      loadProfileData();
    }
  }, [isAuthenticated]);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/profile', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load profile data');
      }

      const data = await response.json();
      setProfileData(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null; // Will redirect
  }

  if (loading) {
  return (
      <Layout>
        <div className="profile-dashboard">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
            </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="profile-dashboard">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Unable to Load Profile</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={loadProfileData}>
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <Layout>
      <div className="profile-dashboard">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="avatar-section">
            {profileData.avatar ? (
              <img src={profileData.avatar} alt={profileData.username} className="avatar" />
            ) : (
              <div className="avatar-placeholder">
                {profileData.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="user-info">
            <h1>{profileData.username}</h1>
            <p className="email">{profileData.email || 'No email provided'}</p>
            <div className="badges">
              <span className={`role-badge role-${profileData.role.toLowerCase()}`}>
                {profileData.role}
              </span>
              {profileData.verified && (
                <span className="verified-badge">✓ Verified</span>
              )}
              <span className="reputation-badge">
                ⭐ {profileData.reputation} Reputation
              </span>
            </div>
          </div>

          <div className="quick-stats">
            {profileData.userStats && (
              <>
                <div className="stat">
                  <div className="stat-value">{profileData.userStats.projectsCreated}</div>
                  <div className="stat-label">Projects</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{profileData.userStats.projectsFunded}</div>
                  <div className="stat-label">Funded</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{profileData.userStats.totalFunded.toFixed(2)} SOL</div>
                  <div className="stat-label">Contributed</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-navigation">
          <button
            className={`nav-tab ${activeSection === 'details' ? 'active' : ''}`}
            onClick={() => setActiveSection('details')}
          >
            Personal Details
          </button>
          <button
            className={`nav-tab ${activeSection === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveSection('privacy')}
          >
            Privacy Settings
          </button>
          <button
            className={`nav-tab ${activeSection === 'communication' ? 'active' : ''}`}
            onClick={() => setActiveSection('communication')}
          >
            Communication
          </button>
        </div>

        {/* Content Sections */}
        <div className="profile-content">
          {activeSection === 'details' && (
            <div className="section personal-details">
              <h2>Personal Details</h2>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Username</label>
                  <div className="detail-value">{profileData.username}</div>
                </div>

                <div className="detail-item">
                  <label>Email</label>
                  <div className="detail-value">{profileData.email || 'Not provided'}</div>
                </div>

                <div className="detail-item">
                  <label>Role</label>
                  <div className="detail-value">{profileData.role}</div>
                </div>

                <div className="detail-item">
                  <label>Member Since</label>
                  <div className="detail-value">
                    {new Date(profileData.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {profileData.website && (
                  <div className="detail-item full-width">
                    <label>Website</label>
                    <div className="detail-value">
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                        {profileData.website}
                      </a>
                    </div>
                  </div>
                )}

                {profileData.bio && (
                  <div className="detail-item full-width">
                    <label>Bio</label>
                    <div className="detail-value bio">{profileData.bio}</div>
                  </div>
                )}
              </div>

              <div className="actions">
                <button
                  className="edit-button"
                  onClick={() => router.push('/settings')}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="section privacy-settings">
              <h2>Privacy Settings</h2>
              <p className="section-description">
                Manage your privacy preferences and control who can see your information.
              </p>
              <div className="placeholder-content">
                <div className="placeholder-icon">🔒</div>
                <p>Privacy settings will be available here.</p>
                <button
                  className="placeholder-button"
                  onClick={() => {/* Will be implemented in WO#39 */}}
                >
                  Configure Privacy
                </button>
              </div>
            </div>
          )}

          {activeSection === 'communication' && (
            <div className="section communication-preferences">
              <h2>Communication Preferences</h2>
              <p className="section-description">
                Choose how you want to receive updates and notifications.
              </p>
              <div className="placeholder-content">
                <div className="placeholder-icon">📧</div>
                <p>Communication preferences will be available here.</p>
                <button
                  className="placeholder-button"
                  onClick={() => {/* Future implementation */}}
                >
                  Manage Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .profile-dashboard {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }

          .loading-state,
          .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            text-align: center;
          }

          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e9ecef;
            border-top-color: #0d6efd;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 1rem;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .error-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .error-state h2 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
          }

          .error-state p {
            color: #6c757d;
            margin-bottom: 1.5rem;
          }

          .retry-button {
            padding: 0.75rem 1.5rem;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }

          .retry-button:hover {
            background: #0b5ed7;
          }

          .profile-header {
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 2rem;
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
          }

          .avatar-section {
            display: flex;
            align-items: center;
          }

          .avatar,
          .avatar-placeholder {
            width: 120px;
            height: 120px;
            border-radius: 50%;
          }

          .avatar {
            object-fit: cover;
          }

          .avatar-placeholder {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            font-weight: 700;
            color: white;
          }

          .user-info {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .user-info h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .email {
            color: #6c757d;
            margin-bottom: 1rem;
          }

          .badges {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .role-badge,
          .verified-badge,
          .reputation-badge {
            padding: 0.375rem 0.875rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
          }

          .role-badge.role-admin { background: #f8d7da; color: #842029; }
          .role-badge.role-creator { background: #d1e7dd; color: #0f5132; }
          .role-badge.role-funder { background: #cfe2ff; color: #084298; }
          .role-badge.role-guest { background: #e9ecef; color: #495057; }

          .verified-badge { background: #d1e7dd; color: #0f5132; }
          .reputation-badge { background: #fff3cd; color: #664d03; }

          .quick-stats {
            display: flex;
            gap: 2rem;
            align-items: center;
          }

          .stat {
            text-align: center;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0d6efd;
          }

          .stat-label {
            font-size: 0.85rem;
            color: #6c757d;
            margin-top: 0.25rem;
          }

          .profile-navigation {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            border-bottom: 2px solid #e9ecef;
          }

          .nav-tab {
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            font-weight: 600;
            color: #6c757d;
            cursor: pointer;
            transition: all 0.2s;
          }

          .nav-tab:hover {
            color: #0d6efd;
          }

          .nav-tab.active {
            color: #0d6efd;
            border-bottom-color: #0d6efd;
          }

          .profile-content {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .section h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .section-description {
            color: #6c757d;
            margin-bottom: 2rem;
          }

          .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .detail-item {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .detail-item.full-width {
            grid-column: 1 / -1;
          }

          .detail-item label {
            font-weight: 600;
            color: #6c757d;
            font-size: 0.85rem;
            text-transform: uppercase;
          }

          .detail-value {
            font-size: 1rem;
            color: #212529;
            padding: 0.75rem;
            background: #f8f9fa;
            border-radius: 6px;
          }

          .detail-value.bio {
            line-height: 1.6;
          }

          .detail-value a {
            color: #0d6efd;
            text-decoration: none;
          }

          .detail-value a:hover {
            text-decoration: underline;
          }

          .actions {
            display: flex;
            justify-content: flex-end;
          }

          .edit-button {
            padding: 0.75rem 1.5rem;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .edit-button:hover {
            background: #0b5ed7;
            transform: translateY(-1px);
          }

          .placeholder-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            text-align: center;
          }

          .placeholder-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .placeholder-content p {
            color: #6c757d;
            margin-bottom: 1.5rem;
          }

          .placeholder-button {
            padding: 0.75rem 1.5rem;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }

          .placeholder-button:hover {
            background: #5a6268;
          }

          @media (max-width: 768px) {
            .profile-header {
              grid-template-columns: 1fr;
              text-align: center;
            }

            .avatar-section {
              justify-content: center;
            }

            .user-info {
              align-items: center;
            }

            .quick-stats {
              justify-content: center;
            }

            .detail-grid {
              grid-template-columns: 1fr;
            }

            .profile-navigation {
              overflow-x: auto;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}
