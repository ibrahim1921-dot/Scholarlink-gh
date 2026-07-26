import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { Notification } from "../types/api";
import {
  useNotificationsList,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "../hooks/useNotifications";

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyNotification(n: Notification) {
  const type = n.type || "";
  if (type === "DEADLINE_ALERT") return "alert";
  if (type === "NEW_MATCH") return "match";
  if (type === "WEEKLY_DIGEST") return "info";
  if (type.includes("SUCCESS") || type.includes("VERIFIED")) return "success";
  if (n.title.toLowerCase().includes("deadline")) return "alert";
  if (n.title.toLowerCase().includes("match")) return "match";
  return "info";
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function groupNotifications(notifications: Notification[]) {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const earlier: Notification[] = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  for (const n of notifications) {
    // Backend returns LocalDateTime (e.g. "2026-07-22T08:00:00"). 
    // Append 'Z' to force UTC/GMT parsing to avoid device timezone shift.
    const dateStr = n.createdAt.endsWith('Z') ? n.createdAt : n.createdAt + 'Z';
    const receivedAt = new Date(dateStr);
    
    if (receivedAt >= startOfToday) {
      today.push(n);
    } else if (receivedAt >= startOfYesterday) {
      yesterday.push(n);
    } else {
      earlier.push(n);
    }
  }

  return { today, yesterday, earlier };
}

// ── Style helper ─────────────────────────────────────────────────────────────

const getNotificationStyle = (type: string) => {
  switch (type) {
    case "alert":
      return {
        borderColor: colors.danger,
        iconBg: "#ffdad6",
        iconColor: colors.danger,
        iconName: "alarm-outline" as keyof typeof Ionicons.glyphMap,
      };
    case "success":
      return {
        borderColor: colors.success,
        iconBg: "#a0f399",
        iconColor: "#005312",
        iconName: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap,
      };
    case "match":
      return {
        borderColor: colors.info,
        iconBg: "#d5e3ff",
        iconColor: "#1f477b",
        iconName: "sparkles-outline" as keyof typeof Ionicons.glyphMap,
      };
    case "info":
    default:
      return {
        borderColor: "#ffb690",
        iconBg: "#ffdbca",
        iconColor: "#723610",
        iconName: "hardware-chip-outline" as keyof typeof Ionicons.glyphMap,
      };
  }
};

// ── Card component ───────────────────────────────────────────────────────────

const NotificationCard = ({
  item,
  onPress,
  onDelete,
}: {
  item: Notification;
  onPress: () => void;
  onDelete: () => void;
}) => {
  const type = classifyNotification(item);
  const style = getNotificationStyle(type);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: style.borderColor },
        !item.read && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: style.iconBg }]}>
        <Ionicons name={style.iconName} size={24} color={style.iconColor} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
            {item.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={styles.cardTime}>{formatTimestamp(item.createdAt)}</Text>
            <Pressable onPress={onDelete} style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.cardMessage}>{item.body}</Text>
        {!item.read && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </Pressable>
  );
};

// ── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  
  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage 
  } = useNotificationsList();
  
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();

  const allNotifications = useMemo(() => {
    return data?.pages.flatMap((page) => page.content) || [];
  }, [data]);

  const { today, yesterday, earlier } = groupNotifications(allNotifications);

  const handlePress = useCallback((item: Notification) => {
    if (!item.read) {
      markRead.mutate(item.id);
    }
    if (item.relatedScholarshipId) {
      router.push(`/scholarship/${item.relatedScholarshipId}`);
    }
  }, [markRead]);

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllRead.mutate();
    }
  };

  const handleDelete = useCallback((item: Notification) => {
    deleteNotification.mutate(item.id);
  }, [deleteNotification]);

  const handleClearAll = () => {
    deleteAll.mutate();
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn} disabled={markAllRead.isPending}>
              {markAllRead.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.markAllText}>Mark all read</Text>
              )}
            </Pressable>
          )}
          {allNotifications.length > 0 && (
            <Pressable onPress={handleClearAll} style={styles.markAllBtn} disabled={deleteAll.isPending}>
              {deleteAll.isPending ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              )}
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : allNotifications.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color={colors.muted}
            />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyDesc}>
            You'll see scholarship deadline alerts, match notifications, and
            weekly digests here.
          </Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Today */}
          {today.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today</Text>
                {today.some((n) => !n.read) && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>New</Text>
                  </View>
                )}
              </View>
              <View style={styles.list}>
                {today.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    onPress={() => handlePress(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Yesterday */}
          {yesterday.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yesterday</Text>
              <View style={styles.list}>
                {yesterday.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    onPress={() => handlePress(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Earlier */}
          {earlier.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earlier</Text>
              <View style={styles.list}>
                {earlier.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    onPress={() => handlePress(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </View>
            </View>
          )}

          {isFetchingNextPage && (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {/* Motivation Banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>You're on track!</Text>
            <Text style={styles.bannerText}>
              Complete 2 more applications this week to increase your chances by
              40%.
            </Text>
            <Pressable
              style={styles.bannerButton}
              onPress={() => router.push("/(tabs)/applications")}
            >
              <Text style={styles.bannerButtonText}>Go to Applications</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 56,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: colors.primary,
  },
  markAllBtn: {
    padding: 8,
  },
  markAllText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: colors.muted,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#d5e3ff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.primary,
  },
  list: {
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardUnread: {
    backgroundColor: "#f0f4ff",
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: colors.ink,
    marginRight: 8,
  },
  cardTitleUnread: {
    fontFamily: "PlusJakartaSans_700Bold",
  },
  cardTime: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 10,
    color: colors.muted,
  },
  cardMessage: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: colors.muted,
    marginBottom: 8,
  },
  unreadDot: {
    position: "absolute",
    top: 4,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  // ── Empty state ──
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: colors.ink,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDesc: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  // ── Banner ──
  banner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
  },
  bannerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 24,
    color: "#ffffff",
    marginBottom: 8,
  },
  bannerText: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: "#a7c8ff",
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: colors.primaryDark,
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  bannerButtonText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 14,
    color: "#ffffff",
  },
});
