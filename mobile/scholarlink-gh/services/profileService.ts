import { ApiResponse, ProfilePayload, StudentProfile } from '../types/api';
import { apiClient } from './apiClient';

export const profileService = {
  async getProfile(): Promise<StudentProfile> {
    try {
      const response = await apiClient.get<StudentProfile>('/api/v1/profile');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async getProfileCompleteness(): Promise<{ completeness: number; nextStep: string }> {
    try {
      const response = await apiClient.get<{ completeness: number; next_step: string }>('/api/v1/profile/completeness');
      return {
        completeness: response.data.completeness,
        nextStep: response.data.next_step,
      };
    } catch (error: any) {
      // In case of error (e.g. 404 or network issue), default to 0
      return { completeness: 0, nextStep: '/profile-setup' };
    }
  },

  async updateProfile(payload: ProfilePayload): Promise<ApiResponse> {
    try {
      const response = await apiClient.put<ApiResponse>('/api/v1/profile', payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async registerPushToken(token: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/profile/push-token', { token });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async uploadProfilePicture(
    file: { uri: string; name: string; mimeType?: string | null }
  ): Promise<ApiResponse> {
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'image/jpeg',
    } as any);

    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/profile/picture', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },
};
