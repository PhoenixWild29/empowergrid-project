import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AccountSettingsForm from '../components/auth/AccountSettingsForm';
import RenewalPreferences from '../components/RenewalPreferences';

/**
 * Account Settings Page
 * 
 * Protected page for authenticated users to manage their account
 */
export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const loading = false; // AuthContext has isLoading, not loading
  const router = useRouter();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <Layout>
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <AccountSettingsForm />
          </div>

          <div className="settings-section">
            <RenewalPreferences />
          </div>
        </div>

        <style jsx>{`
          .settings-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }

          .settings-header {
            margin-bottom: 2rem;
          }

          .settings-header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .settings-header p {
            color: #6c757d;
            font-size: 1.1rem;
          }

          .settings-content {
            display: grid;
            gap: 2rem;
          }

          .settings-section {
            background: white;
            border-radius: 12px;
            padding: 0;
          }

          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: #6c757d;
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
        `}</style>
      </div>
    </Layout>
  );
}

