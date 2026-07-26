import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../services/jobService';

export function useSavedJobs() {
  return useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => jobService.getSavedJobs(),
  });
}

export function useToggleSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => jobService.toggleSaveJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });
}

export function useJobDetail(jobId: number) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.getJobById(jobId),
  });
}

export function useJobApplications() {
  return useQuery({
    queryKey: ['jobApplications'],
    queryFn: () => jobService.getMyApplications(),
  });
}
