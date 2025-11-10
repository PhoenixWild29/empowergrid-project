import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface FetchMilestonesResponse {
  success: boolean;
  milestones: any[];
  metrics: {
    pending: number;
    inReview: number;
    needsInfo: number;
    approved: number;
    flagged: number;
    slaBreaches: number;
    averageSlaHoursRemaining: number;
  };
}

interface FetchValidatorsResponse {
  success: boolean;
  validators: any[];
}

export const useValidatorMilestones = () =>
  useQuery<FetchMilestonesResponse, Error>({
    queryKey: ['validator-milestones'],
    queryFn: async () => {
      const response = await fetch('/api/validators/milestones', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load milestones');
      }
      return response.json();
    },
    staleTime: 30_000,
  });

export const useValidatorRoster = () =>
  useQuery<FetchValidatorsResponse, Error>({
    queryKey: ['validator-roster'],
    queryFn: async () => {
      const response = await fetch('/api/validators/assignments', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load validator roster');
      }
      return response.json();
    },
    staleTime: 60_000,
  });

export const useUpdateMilestoneStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { milestoneId: string; status: string; actor?: string; comment?: string }) => {
      const response = await fetch('/api/validators/milestones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? 'Failed to update milestone');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validator-milestones'] });
    },
  });
};

export const useAssignValidator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { milestoneId: string; validatorId: string; actor?: string }) => {
      const response = await fetch('/api/validators/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? 'Failed to assign validator');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validator-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['validator-roster'] });
    },
  });
};

export const useAddMilestoneComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { milestoneId: string; message: string; actor?: string }) => {
      const response = await fetch('/api/validators/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? 'Failed to add comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validator-milestones'] });
    },
  });
};
