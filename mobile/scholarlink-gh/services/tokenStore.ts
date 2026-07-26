import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'scholarlink_access_token';
const REFRESH_TOKEN_KEY = 'scholarlink_refresh_token';

// Platform-aware token storage:
// - Native (iOS/Android): uses expo-secure-store
// - Web: uses localStorage

let SecureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
  // Dynamically import SecureStore only on native platforms
  SecureStore = require('expo-secure-store');
}

const webStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const tokenStore = {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return webStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return SecureStore!.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return webStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return SecureStore!.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      webStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      return;
    }
    await SecureStore!.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore!.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clearTokens(): Promise<void> {
    if (Platform.OS === 'web') {
      webStorage.removeItem(ACCESS_TOKEN_KEY);
      webStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    await SecureStore!.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore!.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
