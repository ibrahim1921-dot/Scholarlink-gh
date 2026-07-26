import { ApiResponse, AuthResponse } from '../types/api';
import { apiClient } from './apiClient';
import { refreshAccessToken } from './tokenRefresh';

export type RegisterPayload = {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export const authService = {
  async register(payload: RegisterPayload): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/register', payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async verifyOtp(email: string, otpCode: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/verify-otp', { email, otpCode });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async resendOtp(email: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/resend-otp', { email });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async logout(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/logout');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async getMe(): Promise<AuthResponse> {
    try {
      const response = await apiClient.get<AuthResponse>('/api/v1/auth/me');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  refreshToken: refreshAccessToken,

  async requestPasswordReset(email: string): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/forgot-password', { email });
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/reset-password', { token, newPassword });
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/change-password', { currentPassword, newPassword });
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async logoutAllDevices(): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/logout-all-devices');
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  }
};
