import React from 'react';
import { PlatformAnalytics } from '../../lib/services/analyticsService';

interface PlatformAnalyticsChartProps {
  data: PlatformAnalytics;
}

export const PlatformAnalyticsChart: React.FC<PlatformAnalyticsChartProps> = ({
  data,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className='space-y-8'>
      {/* Platform Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='text-sm font-medium text-blue-600 mb-2'>
            Total Volume
          </h4>
          <p className='text-2xl font-bold text-blue-900'>
            {formatCurrency(data.totalVolume)}
          </p>
        </div>
        <div className='bg-green-50 p-4 rounded-lg'>
          <h4 className='text-sm font-medium text-green-600 mb-2'>
            Funding Success Rate
          </h4>
          <p className='text-2xl font-bold text-green-900'>
            {data.fundingSuccessRate.toFixed(1)}%
          </p>
        </div>
        <div className='bg-yellow-50 p-4 rounded-lg'>
          <h4 className='text-sm font-medium text-yellow-600 mb-2'>
            Avg Project Duration
          </h4>
          <p className='text-2xl font-bold text-yellow-900'>
            {data.averageProjectDuration.toFixed(0)} days
          </p>
        </div>
        <div className='bg-purple-50 p-4 rounded-lg'>
          <h4 className='text-sm font-medium text-purple-600 mb-2'>
            Avg Time to Fund
          </h4>
          <p className='text-2xl font-bold text-purple-900'>
            {data.averageTimeToFund.toFixed(0)} days
          </p>
        </div>
      </div>

      {/* Monthly Volume Chart */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Monthly Funding Volume
        </h3>
        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <div className='h-64 flex items-end space-x-4'>
            {data.monthlyVolume.map((month, index) => {
              const maxVolume = Math.max(
                ...data.monthlyVolume.map(m => m.volume)
              );
              const height =
                maxVolume > 0 ? (month.volume / maxVolume) * 100 : 0;

              return (
                <div key={index} className='flex-1 flex flex-col items-center'>
                  <div
                    className='w-full bg-blue-500 rounded-t'
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className='text-xs text-gray-500 mt-2'>
                    {month.month}
                  </div>
                  <div className='text-xs text-gray-400 mt-1'>
                    {formatCurrency(month.volume)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className='mt-4 text-sm text-gray-600'>
            <div className='flex justify-between'>
              <span>Monthly funding volume and transaction count</span>
              <span>
                Total transactions:{' '}
                {data.monthlyVolume.reduce((sum, m) => sum + m.transactions, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Geographic Distribution
        </h3>
        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <div className='space-y-4'>
            {data.geographicDistribution.map((region, index) => {
              const totalProjects = data.geographicDistribution.reduce(
                (sum, r) => sum + r.projectCount,
                0
              );
              const projectPercentage =
                totalProjects > 0
                  ? (region.projectCount / totalProjects) * 100
                  : 0;

              const totalFunding = data.geographicDistribution.reduce(
                (sum, r) => sum + r.totalFunding,
                0
              );
              const fundingPercentage =
                totalFunding > 0
                  ? (region.totalFunding / totalFunding) * 100
                  : 0;

              return (
                <div key={index} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-700'>
                      {region.region}
                    </span>
                    <span className='text-sm text-gray-500'>
                      {region.projectCount} projects •{' '}
                      {formatCurrency(region.totalFunding)}
                    </span>
                  </div>
                  <div className='space-y-1'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xs text-gray-500 w-12'>
                        Projects
                      </span>
                      <div className='flex-1 bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-blue-500 h-2 rounded-full'
                          style={{ width: `${projectPercentage}%` }}
                        ></div>
                      </div>
                      <span className='text-xs text-gray-500 w-8 text-right'>
                        {projectPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xs text-gray-500 w-12'>
                        Funding
                      </span>
                      <div className='flex-1 bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-green-500 h-2 rounded-full'
                          style={{ width: `${fundingPercentage}%` }}
                        ></div>
                      </div>
                      <span className='text-xs text-gray-500 w-8 text-right'>
                        {fundingPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hourly Activity Pattern */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Hourly Activity Pattern
        </h3>
        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <div className='h-48 flex items-end space-x-1'>
            {data.hourlyActivity.map((hour, index) => {
              const maxActivity = Math.max(
                ...data.hourlyActivity.map(h => h.activity)
              );
              const height =
                maxActivity > 0 ? (hour.activity / maxActivity) * 100 : 0;

              return (
                <div key={index} className='flex-1 flex flex-col items-center'>
                  <div
                    className='w-full bg-purple-500 rounded-t'
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className='text-xs text-gray-500 mt-1'>
                    {hour.hour.toString().padStart(2, '0')}:00
                  </div>
                </div>
              );
            })}
          </div>
          <div className='mt-4 text-sm text-gray-600 text-center'>
            Platform activity throughout the day (UTC)
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Performance Metrics
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span className='text-sm text-gray-600'>
                Funding Success Rate
              </span>
              <span className='text-sm font-medium text-gray-900'>
                {data.fundingSuccessRate.toFixed(1)}%
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-sm text-gray-600'>
                Average Project Duration
              </span>
              <span className='text-sm font-medium text-gray-900'>
                {data.averageProjectDuration.toFixed(0)} days
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-sm text-gray-600'>
                Average Time to Fund
              </span>
              <span className='text-sm font-medium text-gray-900'>
                {data.averageTimeToFund.toFixed(0)} days
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Volume Breakdown
          </h3>
          <div className='space-y-3'>
            {data.monthlyVolume.slice(-3).map((month, index) => (
              <div key={index} className='flex justify-between'>
                <span className='text-sm text-gray-600'>{month.month}</span>
                <span className='text-sm font-medium text-gray-900'>
                  {formatCurrency(month.volume)} ({month.transactions} txns)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
