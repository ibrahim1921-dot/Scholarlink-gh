import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackerService } from '../services/trackerService';
import { ApplicationStatus } from '../types/api';

export const useTrackers = () => {
  return useQuery({
    queryKey: ['trackers'],
    queryFn: () => trackerService.getTrackers(),
  });
};

export const useApplicationDetail = (trackerId: number) => {
  return useQuery({
    queryKey: ['trackerDetail', trackerId],
    queryFn: () => trackerService.getTrackerDetail(trackerId),
    enabled: !!trackerId,
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { status?: ApplicationStatus; notes?: string };
    }) => trackerService.updateTracker(id, payload),
    onSuccess: (data, variables) => {
      // Invalidate both the detail query and the list of applications
      queryClient.invalidateQueries({ queryKey: ['trackerDetail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['trackers'] });
    },
  });
};
