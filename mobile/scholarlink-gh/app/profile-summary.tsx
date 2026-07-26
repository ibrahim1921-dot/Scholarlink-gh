import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { profileService } from "../services/profileService";
import { StudentProfile } from "../types/api";

export default function ProfileSummaryScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileService.getProfile();
        setProfile(data);
      } catch (e) {
        // ignore
      } finally {
        setFetching(false);
      }
    };
    loadProfile();
  }, []);

  const formatLanguages = (langStr?: string | null) => {
    if (!langStr) return '';
    try {
      const parsed = JSON.parse(langStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(l => `${l.language} (${l.level})`).join(', ');
      }
    } catch (e) {
      if (langStr.includes(':')) {
        return langStr.split(',').map(part => {
          const [lang, lvl] = part.split(':');
          return `${lang ? lang.trim() : ''} (${lvl ? lvl.trim() : 'Fluent'})`;
        }).filter(s => !s.startsWith(' (')).join(', ');
      }
    }
    return '';
  };

  const renderField = (label: string, value?: string | number | boolean | null) => {
    const displayValue = value === null || value === undefined || value === '' ? 'Not set' : value.toString();
    return (
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{displayValue}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile Summary</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {fetching ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.heroBox}>
              <View style={styles.heroIcon}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>
              <Text style={styles.heroTitle}>Your profile is ready!</Text>
              <Text style={styles.heroDesc}>
                Our AI uses this information to match you with the best scholarships. Keep it updated for better results.
              </Text>
            </View>

            {/* Section 1: Academic Basics */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Academic Basics</Text>
                <Pressable style={styles.editBtn} onPress={() => router.push("/profile-setup")}>
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
              </View>
              <View style={styles.cardBody}>
                {renderField('Education Level', profile?.educationLevel?.replace('_', ' '))}
                {renderField('Institution', profile?.institution)}
                {renderField('Field of Study', profile?.fieldOfStudy)}
                {renderField('Cumulative GPA', profile?.gpa)}
                {renderField('Graduation Year', profile?.graduationYear)}
              </View>
            </View>

            {/* Section 2: Preferences */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Preferences</Text>
                <Pressable style={styles.editBtn} onPress={() => router.push("/profile-setup-step-2")}>
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
              </View>
              <View style={styles.cardBody}>
                {renderField('Country Preference', profile?.countryPreference)}
                {renderField('Intended Start Date', profile?.intendedStartDate)}
                {renderField('Financial Need', profile?.financialNeed)}
              </View>
            </View>

            {/* Section 3: Final Details */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Final Details</Text>
                <Pressable style={styles.editBtn} onPress={() => router.push("/profile-setup-step-3")}>
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
              </View>
              <View style={styles.cardBody}>
                {renderField('Language Proficiency', formatLanguages(profile?.languageProficiency))}
                {renderField('Standardized Tests', profile?.standardizedTests)}
                {renderField('Skills', profile?.skills?.join(', '))}
                {renderField('Personal Bio', profile?.bio)}
                {renderField('Achievements', profile?.achievements)}
              </View>
            </View>

            {/* Section 4: AI Profile Suggestions (Read-Only) */}
            {profile?.profileImprovementSuggestions ? (
              <View style={[styles.card, styles.suggestionsCard]}>
                <View style={[styles.cardHeader, styles.suggestionsHeader]}>
                  <Text style={[styles.cardTitle, styles.suggestionsTitle]}>AI Profile Insights</Text>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.suggestionsText}>{profile.profileImprovementSuggestions}</Text>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Footer Nav */}
      <View style={styles.footerNav}>
        <Pressable
          style={styles.navButtonFinish}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.navButtonFinishText}>Return to Home</Text>
        </Pressable>
      </View>
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
    padding: 4,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: colors.primary,
  },
  content: {
    gap: 20,
  },
  heroBox: {
    alignItems: "center",
    backgroundColor: "rgba(160, 243, 153, 0.2)",
    padding: 24,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(27, 109, 36, 0.1)",
  },
  heroIcon: {
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: colors.primary,
    marginBottom: 8,
  },
  heroDesc: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(195, 198, 209, 0.5)",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(195, 198, 209, 0.3)",
  },
  cardTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: colors.primary,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#d5e3ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBtnText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.primary,
  },
  cardBody: {
    padding: 16,
    gap: 16,
  },
  fieldRow: {
    flexDirection: "column",
    gap: 4,
  },
  fieldLabel: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 16,
    color: colors.ink,
  },
  footerNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  navButtonFinish: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  navButtonFinishText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
  suggestionsCard: {
    borderColor: "rgba(213, 227, 255, 0.8)",
    backgroundColor: "#f5f8ff",
  },
  suggestionsHeader: {
    backgroundColor: "#d5e3ff",
    borderBottomColor: "rgba(0, 51, 102, 0.1)",
  },
  suggestionsTitle: {
    color: colors.primary,
  },
  suggestionsText: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
  },
});
