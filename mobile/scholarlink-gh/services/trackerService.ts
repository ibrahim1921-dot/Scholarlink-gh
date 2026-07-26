import { ApplicationMode, ApplicationStatus, ApplicationTracker } from '../types/api';
import { apiClient } from './apiClient';

export const trackerService = {
  async getTrackers(): Promise<ApplicationTracker[]> {
    try {
      const response = await apiClient.get<ApplicationTracker[]>('/api/v1/trackers');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async getTrackerDetail(id: number): Promise<ApplicationTracker> {
    try {
      const response = await apiClient.get<ApplicationTracker>(`/api/v1/trackers/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async createTracker(scholarshipId: number, status?: ApplicationStatus, applicationMode?: ApplicationMode): Promise<ApplicationTracker> {
    try {
      const response = await apiClient.post<ApplicationTracker>('/api/v1/trackers', { scholarshipId, status, applicationMode });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('This scholarship is already in your tracker.');
      }
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async updateTracker(id: number, payload: { status?: ApplicationStatus; notes?: string }): Promise<ApplicationTracker> {
    try {
      const response = await apiClient.put<ApplicationTracker>(`/api/v1/trackers/${id}`, payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async deleteTracker(id: number): Promise<any> {
    try {
      const response = await apiClient.delete(`/api/v1/trackers/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },
};
