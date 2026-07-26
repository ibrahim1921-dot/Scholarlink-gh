import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { authService, RegisterPayload } from '../services/authService';
import { authEvents } from '../services/authEvents';
import { tokenStore } from '../services/tokenStore';
import { profileService } from '../services/profileService';
import { AuthResponse } from '../types/api';

type AuthContextValue = {
  user: Pick<AuthResponse, 'email' | 'username' | 'role' | 'profilePictureUrl'> | null;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyOtp: (email: string, otpCode: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<AuthContextValue['user']>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [isBootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    tokenStore.getAccessToken().then(async (token) => {
      if (!token) {
        setUser(null);
        setBootstrapping(false);
        return;
      }

      try {
        const response = await authService.getMe();
        let profilePictureUrl = null;
        try {
          const profile = await profileService.getProfile();
          profilePictureUrl = profile.profilePictureUrl || null;
        } catch (e) {
          // ignore if profile not created yet
        }
        setUser({ email: response.email, username: response.username, role: response.role, profilePictureUrl });
      } catch (error) {
        // If /me fails (e.g. token expired and refresh failed), fall back to null
        setUser(null);
      } finally {
        setBootstrapping(false);
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = authEvents.onSignOut(async () => {
      await tokenStore.clearTokens();
      setUser(null);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      async signIn(email, password) {
        const response = await authService.login(email, password);
        await tokenStore.setTokens(response.accessToken, response.refreshToken);
        let profilePictureUrl = null;
        try {
          const profile = await profileService.getProfile();
          profilePictureUrl = profile.profilePictureUrl || null;
        } catch (e) {}
        setUser({ email: response.email, username: response.username, role: response.role, profilePictureUrl });
      },
      async register(payload) {
        await authService.register(payload);
      },
      async verifyOtp(email, otpCode) {
        const response = await authService.verifyOtp(email, otpCode);
        await tokenStore.setTokens(response.accessToken, response.refreshToken);
        let profilePictureUrl = null;
        try {
          const profile = await profileService.getProfile();
          profilePictureUrl = profile.profilePictureUrl || null;
        } catch (e) {}
        setUser({ email: response.email, username: response.username, role: response.role, profilePictureUrl });
      },
      async resendOtp(email) {
        await authService.resendOtp(email);
      },
      async signOut() {
        try {
          await authService.logout();
        } finally {
          await tokenStore.clearTokens();
          setUser(null);
        }
      },
      updateUser(updates) {
        setUser((prev) => (prev ? { ...prev, ...updates } : null));
      },
    }),
    [isBootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
