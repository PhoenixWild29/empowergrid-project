import React from 'react';
import { GetServerSideProps } from 'next';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

interface AnalyticsPageProps {
  initialData?: any;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ initialData }) => {
  const { user, isLoading } = useAuth();

  // Only allow admin users to access analytics
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">
              You need administrator privileges to access the analytics dashboard.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard />
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  // You can optionally pre-fetch analytics data here for better performance
  // For now, we'll let the component load the data client-side
  return {
    props: {},
  };
};

export default AnalyticsPage;