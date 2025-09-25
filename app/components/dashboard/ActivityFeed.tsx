import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  type: 'funding' | 'milestone' | 'project_created' | 'metrics_updated';
  title: string;
  description: string;
  timestamp: Date;
  projectId?: number;
  amount?: number; // in SOL (converted from lamports)
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  limit?: number;
  refreshInterval?: number;
}

export default function ActivityFeed({ limit = 10, refreshInterval = 15000 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data fetching - in real app, this would connect to WebSocket or poll API
  const fetchActivities = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock activities data
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'funding',
          title: 'Project Funded',
          description: 'Solar Farm Alpha received 50 SOL in funding',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          projectId: 1,
          amount: 50,
        },
        {
          id: '2',
          type: 'milestone',
          title: 'Milestone Released',
          description: 'Milestone 2 completed for Wind Turbine Grid - 30 SOL released',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          projectId: 2,
          amount: 30,
        },
        {
          id: '3',
          type: 'metrics_updated',
          title: 'Energy Metrics Updated',
          description: 'Hydro Power Station generated 25,000 kWh this week',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          projectId: 3,
          metadata: { kwhGenerated: 25000, co2Offset: 12.5 },
        },
        {
          id: '4',
          type: 'project_created',
          title: 'New Project Created',
          description: 'Geothermal Plant Beta project launched with 5 milestones',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          projectId: 4,
        },
        {
          id: '5',
          type: 'funding',
          title: 'Project Funded',
          description: 'Wind Turbine Grid received 75 SOL in funding',
          timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
          projectId: 2,
          amount: 75,
        },
        {
          id: '6',
          type: 'milestone',
          title: 'Milestone Released',
          description: 'Milestone 1 completed for Solar Farm Alpha - 40 SOL released',
          timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
          projectId: 1,
          amount: 40,
        },
        {
          id: '7',
          type: 'metrics_updated',
          title: 'Energy Metrics Updated',
          description: 'Solar Farm Alpha generated 150,000 kWh this month',
          timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
          projectId: 1,
          metadata: { kwhGenerated: 150000, co2Offset: 75 },
        },
        {
          id: '8',
          type: 'funding',
          title: 'Project Funded',
          description: 'Hydro Power Station received 25 SOL in funding',
          timestamp: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
          projectId: 3,
          amount: 25,
        },
      ];

      setActivities(mockActivities.slice(0, limit));
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchActivities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [limit, refreshInterval]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'funding': return '💰';
      case 'milestone': return '🎯';
      case 'project_created': return '🚀';
      case 'metrics_updated': return '📊';
      default: return '📝';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'funding': return 'text-green-600 bg-green-100';
      case 'milestone': return 'text-blue-600 bg-blue-100';
      case 'project_created': return 'text-purple-600 bg-purple-100';
      case 'metrics_updated': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="text-sm text-gray-500">
          Live updates
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl text-gray-300 mb-2">📭</div>
          <p className="text-gray-600">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
}