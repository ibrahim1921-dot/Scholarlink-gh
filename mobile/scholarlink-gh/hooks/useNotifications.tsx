import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from './useAuth';
import { notificationService } from '../services/notificationService';

export function useNotificationsSetup() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function initializeNotifications() {
      if (user) {
        const pushToken = await notificationService.registerForPushNotifications();
        if (pushToken) {
          setToken(pushToken);
          await notificationService.savePushTokenToBackend(pushToken);
        }

        cleanup = notificationService.setupNotificationListeners(() => {
          // On receiving a notification in the foreground, invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
        });
      }
    }

    initializeNotifications();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [user, queryClient]);

  return { token };
}

export function useNotificationsList() {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: ['notifications', user?.email],
    queryFn: ({ pageParam = 0 }) => notificationService.getNotifications(pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.number + 1 < lastPage.totalPages) {
        return lastPage.number + 1;
      }
      return undefined;
    },
    enabled: !!user,
  });
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['unreadNotificationCount', user?.email],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount', user?.email] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount', user?.email] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount', user?.email] });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => notificationService.deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount', user?.email] });
    },
  });
}
