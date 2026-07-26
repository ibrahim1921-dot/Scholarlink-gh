import axios from 'axios';
import Constants from 'expo-constants';
import { tokenStore } from './tokenStore';
import { AuthResponse } from '../types/api';

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
const API_BASE_URL = extra?.apiUrl ?? 'http://10.31.55.133:8080';

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) {
      await tokenStore.clearTokens();
      throw new Error('No refresh token available');
    }

    try {
      const response = await refreshClient.post<AuthResponse>('/api/v1/auth/refresh', { refreshToken });
      await tokenStore.setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data.accessToken;
    } catch (error: any) {
      await tokenStore.clearTokens();
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
