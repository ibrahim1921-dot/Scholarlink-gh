import axios from 'axios';
import Constants from 'expo-constants';
import { router } from 'expo-router';

import { tokenStore } from './tokenStore';
import { refreshAccessToken } from './tokenRefresh';
import { authEvents } from './authEvents';

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

export const API_BASE_URL = extra?.apiUrl ?? 'http://10.31.55.133:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Auto-refresh token on 401
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/api/v1/auth/refresh' &&
      originalRequest.url !== '/api/v1/auth/login'
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        authEvents.emitSignOut();
        throw refreshError;
      }
    }

    throw error;
  }
);

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
