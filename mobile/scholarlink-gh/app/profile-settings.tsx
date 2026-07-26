import { router, Stack } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import { UserAvatar } from "../components/UserAvatar";
import { profileService } from "../services/profileService";
import { StudentProfile } from "../types/api";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";

type SettingsItem = {
  id: string;
  title: string;
  icon: string;
  route?: string;
  disabled?: boolean;
};

const SETTINGS_ITEMS: SettingsItem[] = [
  { id: 'vault', title: 'Document Vault', icon: 'folder-open-outline', route: '/documents' },
  { id: 'security', title: 'Security & Password', icon: 'lock-closed-outline', route: '/security' },
];

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, updateUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (e) {
      console.warn("Failed to load profile:", e);
    }
  };

  const handleLogout = async () => {
    await signOut();
    // Redirect handled by root layout
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploading(true);
        const res = await profileService.uploadProfilePicture({
          uri: asset.uri,
          name: asset.fileName || 'profile.jpg',
          mimeType: asset.mimeType || 'image/jpeg',
        });

        // Optimistically update the UI, or just reload profile
        if (res.success && res.message) {
          setProfile(prev => prev ? { ...prev, profilePictureUrl: res.message } : null);
          updateUser({ profilePictureUrl: res.message });
        } else {
          Alert.alert("Error", "Could not upload profile picture.");
        }
      }
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message || "Something went wrong while uploading the picture.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        {/* Placeholder for balance, if needed. Or just leave empty. */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <UserAvatar size={128} style={styles.avatar} imageUrl={profile?.profilePictureUrl} />
            <Pressable
              style={[styles.editAvatarButton, uploading && { opacity: 0.5 }]}
              onPress={pickImage}
              disabled={uploading}
            >
              <Ionicons name="pencil" size={16} color="#ffffff" />
            </Pressable>
          </View>

          <Text style={styles.userName}>{user?.username || "Student"}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={colors.muted} />
            <Text style={styles.locationText}>{profile?.countryPreference || "Location not set"}</Text>
          </View>

          <Pressable
            style={styles.editProfileButton}
            onPress={() => router.push('/profile-summary')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </Pressable>
        </View>



        {/* Settings List */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT SETTINGS</Text>
          <View style={styles.card}>
            {SETTINGS_ITEMS.map((item, index) => (
              <Pressable
                key={item.id}
                style={[
                  styles.settingsItem,
                  index < SETTINGS_ITEMS.length - 1 && styles.borderBottom,
                  item.disabled && { opacity: 0.5 }
                ]}
                onPress={() => {
                  if (item.disabled) {
                    Alert.alert('Coming Soon', 'This feature will be available in a future update.');
                    return;
                  }
                  if (item.route) {
                    router.push(item.route as any);
                  }
                }}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={styles.settingsIconContainer}>
                    <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.settingsItemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.border} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.card}>
            <Pressable
              style={styles.settingsItem}
              onPress={() => Linking.openURL('mailto:support@scholarlinkgh.com')}
            >
              <View style={styles.settingsItemLeft}>
                <View style={styles.settingsIconContainer}>
                  <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingsItemText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </Pressable>
          </View>
        </View>



      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    minHeight: 56,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "#d5e3ff",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 24,
    color: colors.primary,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  locationText: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: colors.muted,
  },
  editProfileButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: "100%",
    maxWidth: 240,
    alignItems: "center",
  },
  editProfileText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: "#ffffff",
  },

  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.surface,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsItemText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: colors.ink,
  },
  logoutSection: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  logoutButton: {
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.2)",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: colors.danger,
  },
  versionText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    marginTop: 24,
  },
});
