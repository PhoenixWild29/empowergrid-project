import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import type { ActivityEvent, RecommendationCard, NotificationPreferences } from '../types/analytics';

interface ActivityResponse {
  success: boolean;
  events: ActivityEvent[];
  nextCursor: string | null;
}

export const useActivityStream = (category?: string) =>
  useInfiniteQuery<ActivityResponse, Error>({
    queryKey: ['activity-stream', category],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '20' });
      if (pageParam) params.append('cursor', pageParam);
      if (category) params.append('category', category);
      const response = await fetch(`/api/analytics/activity?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load activity');
      }
      return response.json();
    },
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });

export const useRecommendations = (audience?: 'investor' | 'developer' | 'validator') =>
  useQuery<{ success: boolean; recommendations: RecommendationCard[] }, Error>({
    queryKey: ['recommendations', audience],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (audience) params.append('audience', audience);
      const response = await fetch(`/api/recommendations/overview${params.toString() ? `?${params}` : ''}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }
      return response.json();
    },
    staleTime: 60_000,
  });

export const useNotificationPreferences = () =>
  useMutation({
    mutationFn: async (payload: Partial<NotificationPreferences>) => {
      const response = await fetch('/api/analytics/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      return response.json() as Promise<{ success: boolean; preferences: NotificationPreferences }>;
    },
  });
