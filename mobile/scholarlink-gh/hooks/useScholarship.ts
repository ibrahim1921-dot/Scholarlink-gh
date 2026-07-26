import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { scholarshipService } from '../services/scholarshipService';
import { aiService } from '../services/aiService';

export function useScholarshipDetail(scholarshipId: number) {
  return useQuery({
    queryKey: ['scholarship', scholarshipId],
    queryFn: () => scholarshipService.getScholarship(scholarshipId),
  });
}

export function useScholarshipEligibility(scholarshipId: number) {
  return useQuery({
    queryKey: ['eligibility', scholarshipId],
    queryFn: () => scholarshipService.checkEligibility(scholarshipId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSavedScholarships() {
  return useQuery({
    queryKey: ['savedScholarships'],
    queryFn: () => scholarshipService.getSavedScholarships(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleSaveScholarship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (scholarshipId: number) => scholarshipService.toggleSaveScholarship(scholarshipId),
    onMutate: async (scholarshipId) => {
      await queryClient.cancelQueries({ queryKey: ['savedScholarships'] });
      const previousSaved = queryClient.getQueryData<any[]>(['savedScholarships']);
      
      if (previousSaved) {
        const isSaved = previousSaved.some(s => s.id === scholarshipId);
        const newSaved = isSaved 
          ? previousSaved.filter(s => s.id !== scholarshipId)
          : [...previousSaved, { id: scholarshipId }];
        queryClient.setQueryData(['savedScholarships'], newSaved);
      }
      
      return { previousSaved };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousSaved) {
        queryClient.setQueryData(['savedScholarships'], context.previousSaved);
      }
      Alert.alert('Error', err?.message ?? 'Failed to save scholarship');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['savedScholarships'] });
      queryClient.invalidateQueries({ queryKey: ['scholarship', variables] });
    },
  });
}

export function useReportScholarship() {
  return useMutation({
    mutationFn: (scholarshipId: number) => scholarshipService.reportScholarship(scholarshipId),
  });
}

export function useScholarshipMatches() {
  return useQuery({
    queryKey: ['scholarshipMatches'],
    queryFn: () => aiService.getScholarshipMatches(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTriggerMatching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => aiService.getScholarshipMatches(),
    onSuccess: (data) => {
      // Directly update the cache with fresh results
      queryClient.setQueryData(['scholarshipMatches'], data);
    },
    onError: (err: any) => {
      Alert.alert('Matching Error', err?.message ?? 'Failed to find matches');
    },
  });
}
