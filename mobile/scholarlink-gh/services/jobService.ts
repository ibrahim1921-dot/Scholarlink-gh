import { ApiResponse, JobListing, Page, JobApplication } from '../types/api';
import { apiClient } from './apiClient';

export interface JobFilters {
  page?: number;
  size?: number;
  search?: string;
  employmentType?: string;
  experienceLevel?: string;
  workMode?: string;
  signal?: AbortSignal;
}

export const jobService = {
  async getJobs(filters: JobFilters = { page: 0 }): Promise<Page<JobListing>> {
    try {
      const { signal, ...params } = filters;
      const response = await apiClient.get<Page<JobListing>>('/api/v1/jobs', {
        params: { size: 20, ...params },
        signal,
      });
      return response.data;
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        throw error; // Re-throw cancel errors so the caller can handle them silently
      }
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async getJobById(id: number): Promise<JobListing> {
    try {
      const response = await apiClient.get<JobListing>(`/api/v1/jobs/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        throw error;
      }
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async getMatches(): Promise<any> {
    try {
      const response = await apiClient.get('/api/v1/jobs/matches');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async applyToJob(jobId: number, coverLetter?: string, documentIds?: number[]): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(`/api/v1/jobs/${jobId}/apply`, {
        coverLetter,
        documentIds,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async getMyApplications(): Promise<JobApplication[]> {
    try {
      const response = await apiClient.get<JobApplication[]>('/api/v1/jobs/my-applications');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async generateCv(): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/jobs/generate-cv');
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async generateCoverLetterDraft(id: number): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>(`/api/v1/jobs/${id}/generate-cover-letter`);
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async getSavedJobs(): Promise<JobListing[]> {
    try {
      const response = await apiClient.get<JobListing[]>('/api/v1/jobs/saved');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async toggleSaveJob(id: number): Promise<{ saved: boolean }> {
    try {
      const response = await apiClient.post<{ saved: boolean }>(`/api/v1/jobs/${id}/save`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async generateTailoredCv(id: number): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>(`/api/v1/jobs/${id}/generate-cv`);
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },
};
