/**
 * Reputation Data Hook
 * 
 * Fetches and manages reputation data from API
 */

import { useState, useEffect } from 'react';

export interface ReputationData {
  userId: string;
  username: string;
  reputation: number;
  verified: boolean;
  role: string;
}

export interface ReputationState {
  data: ReputationData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch reputation data for a user
 */
export function useReputationData(userId: string | undefined): ReputationState {
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reputation/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load reputation');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reputation');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReputation();
  }, [userId]);

  return {
    data,
    loading,
    error,
    refetch: fetchReputation,
  };
}






