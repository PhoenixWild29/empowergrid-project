import { useState, useEffect } from 'react';

interface PlatformMetrics {
  totalProjects: number;
  activeProjects: number;
  totalFunding: number; // in SOL
  totalEnergyGenerated: number; // in kWh
  totalCO2Offset: number; // in tons
  totalMilestones: number;
  completedMilestones: number;
}

interface MetricsOverviewProps {
  refreshInterval?: number; // in milliseconds
}

export default function MetricsOverview({ refreshInterval = 30000 }: MetricsOverviewProps) {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalProjects: 0,
    activeProjects: 0,
    totalFunding: 0,
    totalEnergyGenerated: 0,
    totalCO2Offset: 0,
    totalMilestones: 0,
    completedMilestones: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data fetching - in real app, this would call API
  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - replace with actual API call
      const mockMetrics: PlatformMetrics = {
        totalProjects: 24,
        activeProjects: 18,
        totalFunding: 1250000, // 1.25M SOL
        totalEnergyGenerated: 2500000, // 2.5M kWh
        totalCO2Offset: 1250, // 1.25k tons
        totalMilestones: 156,
        completedMilestones: 89,
      };

      setMetrics(mockMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const formatNumber = (num: number, decimals: number = 0) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (amount: number) => {
    return `${formatNumber(amount / 1_000_000_000, 2)} SOL`;
  };

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon,
    trend
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      {trend && (
        <div className={`flex items-center mt-4 text-sm ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          <span className={`mr-1 ${trend.isPositive ? '↑' : '↓'}`}>
            {trend.isPositive ? '↗' : '↘'}
          </span>
          <span>{Math.abs(trend.value)}% from last month</span>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Projects"
          value={formatNumber(metrics.totalProjects)}
          subtitle={`${metrics.activeProjects} active`}
          icon="🏗️"
          trend={{ value: 12, isPositive: true }}
        />

        <MetricCard
          title="Total Funding"
          value={formatCurrency(metrics.totalFunding)}
          subtitle="Raised by projects"
          icon="💰"
          trend={{ value: 8, isPositive: true }}
        />

        <MetricCard
          title="Energy Generated"
          value={`${formatNumber(metrics.totalEnergyGenerated / 1000)}M kWh`}
          subtitle="Clean energy produced"
          icon="⚡"
          trend={{ value: 15, isPositive: true }}
        />

        <MetricCard
          title="CO₂ Offset"
          value={`${formatNumber(metrics.totalCO2Offset)} tons`}
          subtitle="Carbon emissions prevented"
          icon="🌱"
          trend={{ value: 22, isPositive: true }}
        />
      </div>

      {/* Milestone Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Progress</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Overall Completion</span>
            <span>{metrics.completedMilestones}/{metrics.totalMilestones} milestones</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${metrics.totalMilestones > 0 ? (metrics.completedMilestones / metrics.totalMilestones) * 100 : 0}%`
              }}
            />
          </div>
          <div className="text-sm text-gray-600">
            {Math.round((metrics.completedMilestones / metrics.totalMilestones) * 100)}% of all milestones completed
          </div>
        </div>
      </div>
    </div>
  );
}