'use client';

import React, { useState, useEffect } from 'react';
import {
  analyticsService,
  ProjectAnalytics,
  UserAnalytics,
  PlatformAnalytics,
  SystemAnalytics,
} from '../../lib/services/analyticsService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import {
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { ProjectAnalyticsChart } from './ProjectAnalyticsChart';
import { UserAnalyticsChart } from './UserAnalyticsChart';
import { PlatformAnalyticsChart } from './PlatformAnalyticsChart';
import { SystemAnalyticsChart } from './SystemAnalyticsChart';
import { MetricCard } from './MetricCard';
import { OracleHealthDashboard } from '../oracles/OracleHealthDashboard';

export const AnalyticsDashboard: React.FC = () => {
  const [projectAnalytics, setProjectAnalytics] =
    useState<ProjectAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(
    null
  );
  const [platformAnalytics, setPlatformAnalytics] =
    useState<PlatformAnalytics | null>(null);
  const [systemAnalytics, setSystemAnalytics] =
    useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectData, userData, platformData, systemData] =
        await Promise.all([
          analyticsService.getProjectAnalytics(),
          analyticsService.getUserAnalytics(),
          analyticsService.getPlatformAnalytics(),
          analyticsService.getSystemAnalytics(),
        ]);

      setProjectAnalytics(projectData);
      setUserAnalytics(userData);
      setPlatformAnalytics(platformData);
      setSystemAnalytics(systemData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (
    type: 'projects' | 'users' | 'platform' | 'system',
    format: 'json' | 'csv' = 'json'
  ) => {
    try {
      const data = await analyticsService.exportAnalytics(type, format);
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-analytics.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export analytics data');
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div
          className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'
          data-testid='loading-spinner'
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <AlertTriangle className='mx-auto h-12 w-12 text-red-500 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Error Loading Analytics
          </h3>
          <p className='text-gray-500'>{error}</p>
          <Button onClick={loadAnalytics} className='mt-4'>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Analytics Dashboard
          </h1>
          <p className='text-gray-600 mt-2'>
            Comprehensive insights into platform performance and user engagement
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button
            variant='outline'
            onClick={() => exportData('projects', 'json')}
            className='flex items-center space-x-2'
          >
            <Download className='h-4 w-4' />
            <span>Export Projects</span>
          </Button>
          <Button
            variant='outline'
            onClick={() => exportData('users', 'json')}
            className='flex items-center space-x-2'
          >
            <Download className='h-4 w-4' />
            <span>Export Users</span>
          </Button>
          <Button
            variant='outline'
            onClick={() => exportData('platform', 'json')}
            className='flex items-center space-x-2'
          >
            <Download className='h-4 w-4' />
            <span>Export Platform</span>
          </Button>
          <Button
            variant='outline'
            onClick={() => exportData('system', 'json')}
            className='flex items-center space-x-2'
          >
            <Download className='h-4 w-4' />
            <span>Export System</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MetricCard
          title='Total Projects'
          value={projectAnalytics?.totalProjects || 0}
          icon={<TrendingUp className='h-6 w-6' />}
          trend={
            projectAnalytics
              ? `${((projectAnalytics.fundedProjects / projectAnalytics.totalProjects) * 100).toFixed(1)}% funded`
              : ''
          }
          color='blue'
        />
        <MetricCard
          title='Total Users'
          value={userAnalytics?.totalUsers || 0}
          icon={<Users className='h-6 w-6' />}
          trend={
            userAnalytics
              ? `${userAnalytics.newUsersThisMonth} new this month`
              : ''
          }
          color='green'
        />
        <MetricCard
          title='Total Funding'
          value={`$${(projectAnalytics?.totalFunding || 0).toLocaleString()}`}
          icon={<DollarSign className='h-6 w-6' />}
          trend={
            projectAnalytics
              ? `$${(projectAnalytics.averageFunding || 0).toLocaleString()} avg per project`
              : ''
          }
          color='yellow'
        />
        <MetricCard
          title='System Uptime'
          value={`${(systemAnalytics?.uptime || 0).toFixed(1)}h`}
          icon={<Server className='h-6 w-6' />}
          trend={
            systemAnalytics
              ? `${systemAnalytics.errorRate.toFixed(2)}% error rate`
              : ''
          }
          color='purple'
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue='projects' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='projects'>Projects</TabsTrigger>
          <TabsTrigger value='users'>Users</TabsTrigger>
          <TabsTrigger value='platform'>Platform</TabsTrigger>
          <TabsTrigger value='system'>System</TabsTrigger>
          <TabsTrigger value='oracles'>Oracles</TabsTrigger>
        </TabsList>

        <TabsContent value='projects' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Project Analytics</CardTitle>
              <CardDescription>
                Detailed insights into project performance, funding trends, and
                category distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectAnalytics && (
                <ProjectAnalyticsChart data={projectAnalytics} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='users' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                User growth, engagement metrics, and reputation distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userAnalytics && <UserAnalyticsChart data={userAnalytics} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='platform' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>
                Overall platform performance, funding success rates, and
                geographic distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {platformAnalytics && (
                <PlatformAnalyticsChart data={platformAnalytics} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='system' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>
                System performance metrics, API usage, and infrastructure
                monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemAnalytics && (
                <SystemAnalyticsChart data={systemAnalytics} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='oracles' className='space-y-6'>
          <OracleHealthDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
