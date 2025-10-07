'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';

interface OracleProvider {
  name: string;
  enabled: boolean;
  reputation: number;
  consecutiveFailures: number;
  lastSuccess?: number;
  lastFailure?: number;
  uptime: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
}

interface HealthStatus {
  totalProviders: number;
  enabledProviders: number;
  healthyProviders: number;
  averageReputation: number;
  lastUpdate: number;
}

interface OracleHealthData {
  timestamp: number;
  healthStatus: HealthStatus;
  providers: OracleProvider[];
  consensusConfig: {
    minSources: number;
    requiredConfidence: number;
    outlierThreshold: number;
    consensusThreshold: number;
  };
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export const OracleHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<OracleHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/meter/oracle-health');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      console.error('Error fetching oracle health:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'degraded':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
      case 'unhealthy':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'disabled':
        return <XCircle className='h-4 w-4 text-gray-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      unhealthy: 'bg-red-100 text-red-800',
      disabled: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge
        className={
          variants[status as keyof typeof variants] || variants.disabled
        }
      >
        {status}
      </Badge>
    );
  };

  const formatUptime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  if (loading && !healthData) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error && !healthData) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <AlertTriangle className='mx-auto h-12 w-12 text-red-500 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Failed to Load Oracle Health
          </h3>
          <p className='text-gray-500'>{error}</p>
          <Button onClick={fetchHealthData} className='mt-4'>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  const { healthStatus, providers, consensusConfig, overallStatus } =
    healthData;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Oracle Network Health
          </h2>
          <p className='text-gray-600 mt-1'>
            Monitor the status and reliability of multi-oracle data sources
          </p>
        </div>
        <Button
          onClick={fetchHealthData}
          variant='outline'
          className='flex items-center space-x-2'
        >
          <RefreshCw className='h-4 w-4' />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            {getStatusIcon(overallStatus)}
            <span>Network Status</span>
            {getStatusBadge(overallStatus)}
          </CardTitle>
          <CardDescription>
            Overall health of the oracle network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {healthStatus.totalProviders}
              </div>
              <div className='text-sm text-gray-600'>Total Providers</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {healthStatus.enabledProviders}
              </div>
              <div className='text-sm text-gray-600'>Enabled</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {healthStatus.healthyProviders}
              </div>
              <div className='text-sm text-gray-600'>Healthy</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {healthStatus.averageReputation.toFixed(1)}
              </div>
              <div className='text-sm text-gray-600'>Avg Reputation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consensus Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Consensus Configuration</CardTitle>
          <CardDescription>
            Parameters for oracle consensus and data validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div>
              <span className='font-medium text-gray-700'>Min Sources:</span>
              <span className='ml-2 text-gray-900'>
                {consensusConfig.minSources}
              </span>
            </div>
            <div>
              <span className='font-medium text-gray-700'>
                Required Confidence:
              </span>
              <span className='ml-2 text-gray-900'>
                {(consensusConfig.requiredConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <div>
              <span className='font-medium text-gray-700'>
                Outlier Threshold:
              </span>
              <span className='ml-2 text-gray-900'>
                {consensusConfig.outlierThreshold}σ
              </span>
            </div>
            <div>
              <span className='font-medium text-gray-700'>
                Consensus Threshold:
              </span>
              <span className='ml-2 text-gray-900'>
                {(consensusConfig.consensusThreshold * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle>Oracle Providers</CardTitle>
          <CardDescription>
            Individual oracle provider status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {providers.map(provider => (
              <div
                key={provider.name}
                className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  {getStatusIcon(provider.status)}
                  <div>
                    <div className='font-medium text-gray-900'>
                      {provider.name}
                    </div>
                    <div className='text-sm text-gray-600'>
                      Reputation: {provider.reputation}/100 • Failures:{' '}
                      {provider.consecutiveFailures}
                    </div>
                  </div>
                </div>
                <div className='flex items-center space-x-4'>
                  <div className='text-right'>
                    <div className='text-sm font-medium text-gray-900'>
                      {formatUptime(provider.uptime)}
                    </div>
                    <div className='text-xs text-gray-500'>uptime</div>
                  </div>
                  {getStatusBadge(provider.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className='text-xs text-gray-500 text-center'>
        Last updated: {new Date(healthData.timestamp).toLocaleString()}
      </div>
    </div>
  );
};
