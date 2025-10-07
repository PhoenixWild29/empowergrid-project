import { databaseService } from './databaseService';
import { performanceMonitor, memoryMonitor } from '../monitoring/performance';
import { errorTracker } from '../monitoring/errorTracker';

export interface ProjectAnalytics {
  totalProjects: number;
  activeProjects: number;
  fundedProjects: number;
  completedProjects: number;
  totalFunding: number;
  averageFunding: number;
  fundingByCategory: Record<string, number>;
  projectsByStatus: Record<string, number>;
  fundingTrends: Array<{
    date: string;
    amount: number;
    projectCount: number;
  }>;
  topCategories: Array<{
    category: string;
    projectCount: number;
    totalFunding: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  userGrowth: Array<{
    date: string;
    count: number;
    cumulative: number;
  }>;
  topFunders: Array<{
    userId: string;
    username: string;
    totalFunded: number;
    projectsFunded: number;
  }>;
  topCreators: Array<{
    userId: string;
    username: string;
    projectsCreated: number;
    totalRaised: number;
    successRate: number;
  }>;
  reputationDistribution: Array<{
    range: string;
    count: number;
  }>;
}

export interface PlatformAnalytics {
  totalVolume: number;
  monthlyVolume: Array<{
    month: string;
    volume: number;
    transactions: number;
  }>;
  averageProjectDuration: number;
  fundingSuccessRate: number;
  averageTimeToFund: number;
  geographicDistribution: Array<{
    region: string;
    projectCount: number;
    totalFunding: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    activity: number;
  }>;
}

export interface SystemAnalytics {
  uptime: number;
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  databaseConnections: number;
  apiRequests: {
    total: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
  };
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Project Analytics
  async getProjectAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<ProjectAnalytics> {
    try {
      const projectStats = await databaseService.getProjectStats();

      // Get funding trends (last 30 days)
      const fundingTrends = await this.getFundingTrends(30);

      // Get category breakdown
      const fundingByCategory = await this.getFundingByCategory();
      const projectsByStatus = await this.getProjectsByStatus();

      // Get top categories
      const topCategories = await this.getTopCategories(10);

      return {
        totalProjects: projectStats.totalProjects,
        activeProjects: projectStats.activeProjects,
        fundedProjects: projectStats.fundedProjects,
        completedProjects: projectStats.completedProjects,
        totalFunding: projectStats.totalFunding,
        averageFunding:
          projectStats.totalProjects > 0
            ? projectStats.totalFunding / projectStats.totalProjects
            : 0,
        fundingByCategory,
        projectsByStatus,
        fundingTrends,
        topCategories,
      };
    } catch (error) {
      console.error('Error getting project analytics:', error);
      throw new Error('Failed to get project analytics');
    }
  }

  // User Analytics
  async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      // Get user stats from database
      const userStats = await this.getUserStats();

      // Get user growth trends
      const userGrowth = await this.getUserGrowthTrends(90);

      // Get top funders and creators
      const topFunders = await this.getTopFunders(10);
      const topCreators = await this.getTopCreators(10);

      // Get reputation distribution
      const reputationDistribution = await this.getReputationDistribution();

      return {
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        verifiedUsers: userStats.verifiedUsers,
        newUsersToday: userStats.newUsersToday,
        newUsersThisWeek: userStats.newUsersThisWeek,
        newUsersThisMonth: userStats.newUsersThisMonth,
        userGrowth,
        topFunders,
        topCreators,
        reputationDistribution,
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw new Error('Failed to get user analytics');
    }
  }

  // Platform Analytics
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    try {
      const projectStats = await databaseService.getProjectStats();

      // Get monthly volume
      const monthlyVolume = await this.getMonthlyVolume(12);

      // Calculate metrics
      const averageProjectDuration = await this.getAverageProjectDuration();
      const fundingSuccessRate =
        projectStats.totalProjects > 0
          ? (projectStats.fundedProjects / projectStats.totalProjects) * 100
          : 0;
      const averageTimeToFund = await this.getAverageTimeToFund();

      // Get geographic distribution (placeholder - would need location data)
      const geographicDistribution = await this.getGeographicDistribution();

      // Get hourly activity
      const hourlyActivity = await this.getHourlyActivity();

      return {
        totalVolume: projectStats.totalFunding,
        monthlyVolume,
        averageProjectDuration,
        fundingSuccessRate,
        averageTimeToFund,
        geographicDistribution,
        hourlyActivity,
      };
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      throw new Error('Failed to get platform analytics');
    }
  }

  // System Analytics
  async getSystemAnalytics(): Promise<SystemAnalytics> {
    try {
      // Get performance metrics
      const responseTimeStats = performanceMonitor.getMetricStats(
        'api.response_time'
      ) || {
        average: 0,
        p95: 0,
        p99: 0,
      };

      // Get error rate
      const errorStats = errorTracker.getErrorStats();
      const totalRequests =
        performanceMonitor.getMetricStats('api.requests')?.count || 1;
      const errorRate = (errorStats.total / totalRequests) * 100;

      // Get memory usage
      const memoryUsage = memoryMonitor.getMemoryUsage() || {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
      };

      // Get API request stats
      const apiRequests = await this.getApiRequestStats();

      return {
        uptime: process.uptime(),
        responseTime: {
          average: responseTimeStats.average,
          p95: responseTimeStats.p95,
          p99: responseTimeStats.p99,
        },
        errorRate,
        memoryUsage,
        databaseConnections: 1, // Would need to implement connection pooling tracking
        apiRequests,
      };
    } catch (error) {
      console.error('Error getting system analytics:', error);
      throw new Error('Failed to get system analytics');
    }
  }

  // Helper methods for data aggregation
  private async getFundingTrends(days: number): Promise<
    Array<{
      date: string;
      amount: number;
      projectCount: number;
    }>
  > {
    // This would query the database for funding data over time
    // For now, return mock data
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      trends.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 10000) + 1000,
        projectCount: Math.floor(Math.random() * 5) + 1,
      });
    }

    return trends;
  }

  private async getFundingByCategory(): Promise<Record<string, number>> {
    // This would aggregate funding by project category
    return {
      Solar: 50000,
      Wind: 35000,
      Hydro: 25000,
      Biomass: 15000,
      Geothermal: 10000,
    };
  }

  private async getProjectsByStatus(): Promise<Record<string, number>> {
    const stats = await databaseService.getProjectStats();
    return {
      ACTIVE: stats.activeProjects,
      FUNDED: stats.fundedProjects,
      COMPLETED: stats.completedProjects,
      CANCELLED: 0, // Would need to add cancelled status
    };
  }

  private async getTopCategories(limit: number): Promise<
    Array<{
      category: string;
      projectCount: number;
      totalFunding: number;
    }>
  > {
    // This would query the database for category statistics
    return [
      { category: 'Solar', projectCount: 25, totalFunding: 50000 },
      { category: 'Wind', projectCount: 18, totalFunding: 35000 },
      { category: 'Hydro', projectCount: 12, totalFunding: 25000 },
      { category: 'Biomass', projectCount: 8, totalFunding: 15000 },
      { category: 'Geothermal', projectCount: 5, totalFunding: 10000 },
    ].slice(0, limit);
  }

  private async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  }> {
    // This would query user statistics from database
    return {
      totalUsers: 1250,
      activeUsers: 890,
      verifiedUsers: 650,
      newUsersToday: 12,
      newUsersThisWeek: 85,
      newUsersThisMonth: 320,
    };
  }

  private async getUserGrowthTrends(days: number): Promise<
    Array<{
      date: string;
      count: number;
      cumulative: number;
    }>
  > {
    // This would query user registration data over time
    const trends = [];
    let cumulative = 1000;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dailyCount = Math.floor(Math.random() * 10) + 1;
      cumulative += dailyCount;

      trends.push({
        date: date.toISOString().split('T')[0],
        count: dailyCount,
        cumulative,
      });
    }

    return trends;
  }

  private async getTopFunders(limit: number): Promise<
    Array<{
      userId: string;
      username: string;
      totalFunded: number;
      projectsFunded: number;
    }>
  > {
    // This would query top funders from database
    return [
      {
        userId: '1',
        username: 'alice_funder',
        totalFunded: 25000,
        projectsFunded: 8,
      },
      {
        userId: '2',
        username: 'bob_investor',
        totalFunded: 22000,
        projectsFunded: 6,
      },
      {
        userId: '3',
        username: 'charlie_green',
        totalFunded: 18000,
        projectsFunded: 5,
      },
      {
        userId: '4',
        username: 'diana_solar',
        totalFunded: 15000,
        projectsFunded: 4,
      },
      {
        userId: '5',
        username: 'eve_wind',
        totalFunded: 12000,
        projectsFunded: 3,
      },
    ].slice(0, limit);
  }

  private async getTopCreators(limit: number): Promise<
    Array<{
      userId: string;
      username: string;
      projectsCreated: number;
      totalRaised: number;
      successRate: number;
    }>
  > {
    // This would query top creators from database
    return [
      {
        userId: '1',
        username: 'farmer_joe',
        projectsCreated: 5,
        totalRaised: 45000,
        successRate: 100,
      },
      {
        userId: '2',
        username: 'solar_smith',
        projectsCreated: 4,
        totalRaised: 38000,
        successRate: 75,
      },
      {
        userId: '3',
        username: 'wind_wizard',
        projectsCreated: 3,
        totalRaised: 32000,
        successRate: 67,
      },
      {
        userId: '4',
        username: 'hydro_hero',
        projectsCreated: 2,
        totalRaised: 28000,
        successRate: 50,
      },
      {
        userId: '5',
        username: 'green_guru',
        projectsCreated: 6,
        totalRaised: 25000,
        successRate: 83,
      },
    ].slice(0, limit);
  }

  private async getReputationDistribution(): Promise<
    Array<{
      range: string;
      count: number;
    }>
  > {
    // This would query reputation distribution from database
    return [
      { range: '0-10', count: 150 },
      { range: '11-50', count: 300 },
      { range: '51-100', count: 450 },
      { range: '101-500', count: 280 },
      { range: '500+', count: 70 },
    ];
  }

  private async getMonthlyVolume(months: number): Promise<
    Array<{
      month: string;
      volume: number;
      transactions: number;
    }>
  > {
    // This would query monthly funding volume
    const volume = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      volume.push({
        month: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        }),
        volume: Math.floor(Math.random() * 50000) + 10000,
        transactions: Math.floor(Math.random() * 50) + 10,
      });
    }

    return volume;
  }

  private async getAverageProjectDuration(): Promise<number> {
    // This would calculate average time from project creation to completion
    return 45; // days
  }

  private async getAverageTimeToFund(): Promise<number> {
    // This would calculate average time to reach funding goal
    return 30; // days
  }

  private async getGeographicDistribution(): Promise<
    Array<{
      region: string;
      projectCount: number;
      totalFunding: number;
    }>
  > {
    // This would query geographic distribution of projects
    return [
      { region: 'North America', projectCount: 35, totalFunding: 75000 },
      { region: 'Europe', projectCount: 28, totalFunding: 62000 },
      { region: 'Asia', projectCount: 22, totalFunding: 48000 },
      { region: 'Africa', projectCount: 15, totalFunding: 35000 },
      { region: 'South America', projectCount: 12, totalFunding: 28000 },
    ];
  }

  private async getHourlyActivity(): Promise<
    Array<{
      hour: number;
      activity: number;
    }>
  > {
    // This would query hourly activity patterns
    const activity = [];
    for (let hour = 0; hour < 24; hour++) {
      // Simulate higher activity during business hours
      const baseActivity = hour >= 9 && hour <= 17 ? 100 : 20;
      const randomVariation = Math.floor(Math.random() * 50);
      activity.push({
        hour,
        activity: baseActivity + randomVariation,
      });
    }
    return activity;
  }

  private async getApiRequestStats(): Promise<{
    total: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
  }> {
    // This would aggregate API request statistics
    return {
      total: 15420,
      byEndpoint: {
        '/api/projects': 4520,
        '/api/auth/session': 3210,
        '/api/users/profile': 2890,
        '/api/meter/latest': 2150,
        '/api/actions/fund': 1650,
      },
      byMethod: {
        GET: 12800,
        POST: 2100,
        PUT: 450,
        DELETE: 70,
      },
    };
  }

  // Export analytics data
  async exportAnalytics(
    type: 'projects' | 'users' | 'platform' | 'system',
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      let data: any;

      switch (type) {
        case 'projects':
          data = await this.getProjectAnalytics();
          break;
        case 'users':
          data = await this.getUserAnalytics();
          break;
        case 'platform':
          data = await this.getPlatformAnalytics();
          break;
        case 'system':
          data = await this.getSystemAnalytics();
          break;
        default:
          throw new Error('Invalid analytics type');
      }

      if (format === 'csv') {
        return this.convertToCSV(data);
      }

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw new Error('Failed to export analytics');
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would need more sophisticated implementation for complex data
    const rows = [];

    // Add header
    rows.push('Metric,Value');

    // Flatten object to key-value pairs
    const flatten = (obj: any, prefix = '') => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (
            typeof obj[key] === 'object' &&
            obj[key] !== null &&
            !Array.isArray(obj[key])
          ) {
            flatten(obj[key], newKey);
          } else {
            rows.push(`${newKey},${obj[key]}`);
          }
        }
      }
    };

    flatten(data);
    return rows.join('\n');
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();
