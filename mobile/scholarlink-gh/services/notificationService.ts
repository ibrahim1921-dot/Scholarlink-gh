import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';

import { profileService } from './profileService';
import { apiClient } from './apiClient';
import { Page, Notification } from '../types/api';

// ── Notification service ───────────────────────────────────────────────────────

export const notificationService = {
  /**
   * Requests permissions and retrieves an Expo Push Token.
   * Returns the token string (e.g. "ExponentPushToken[xxx]") or null.
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.error('Expo project ID not found — cannot get push token');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      return tokenData.data; // e.g. "ExponentPushToken[xxxxx]"
    } catch (error) {
      console.error('Error fetching Expo push token:', error);
      return null;
    }
  },

  /**
   * Sends the Expo push token to the backend for storage.
   */
  async savePushTokenToBackend(token: string): Promise<void> {
    try {
      await profileService.registerPushToken(token);
    } catch (error) {
      console.error('Failed to save push token to backend:', error);
    }
  },

  /**
   * Sets up foreground + tap listeners using expo-notifications.
   * Returns a cleanup function.
   * @param onNotificationReceived Optional callback invoked when a notification arrives in the foreground.
   */
  setupNotificationListeners(onNotificationReceived?: () => void): () => void {
    // Fires when a notification is received while the app is in the foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (onNotificationReceived) {
          onNotificationReceived();
        }
      }
    );

    // Fires when the user taps on a notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        // Note: the backend 'read' state should ideally be updated here, but since the user
        // tapped it, they will be navigated to the screen where it gets marked read or we
        // can do it implicitly. We'll leave the markRead to the UI or specific logic.

        // Navigate to scholarship detail if a scholarshipId is present
        if (data?.scholarshipId) {
          router.push(`/scholarship/${data.scholarshipId}`);
        } else if (data?.entity_id) {
          router.push(`/scholarship/${data.entity_id}`);
        }
      }
    );

    // Check if app was opened from a killed state via notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        if (data?.scholarshipId) {
          router.push(`/scholarship/${data.scholarshipId}`);
        } else if (data?.entity_id) {
          router.push(`/scholarship/${data.entity_id}`);
        }
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },

  // ── Backend API calls ──

  async getNotifications(page: number = 0, size: number = 20): Promise<Page<Notification>> {
    const response = await apiClient.get<Page<Notification>>('/api/v1/notifications', {
      params: { page, size },
    });
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/api/v1/notifications/unread-count');
    return response.data.count;
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.patch(`/api/v1/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/api/v1/notifications/read-all');
  },

  async deleteNotification(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/notifications/${id}`);
  },

  async deleteAllNotifications(): Promise<void> {
    await apiClient.delete('/api/v1/notifications');
  },
};
