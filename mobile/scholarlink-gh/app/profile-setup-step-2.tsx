import { router, Stack } from "expo-router";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { AppButton } from "../components/AppButton";
import { profileService } from "../services/profileService";
import { useQueryClient } from "@tanstack/react-query";

const COUNTRIES = ["Ghana", "USA", "UK", "Canada", "Germany"];

const NEEDS = [
  {
    id: "LOW",
    title: "Partial Support (Low)",
    description: "I have significant personal funding.",
  },
  {
    id: "MEDIUM",
    title: "Balanced (Medium)",
    description: "I need roughly 50% tuition coverage.",
  },
  {
    id: "HIGH",
    title: "Full Support (High)",
    description: "I require a full scholarship and stipend.",
  },
];

const SEMESTERS = [
  { id: "fall2024", label: "Fall 2024 (August/September)" },
  { id: "spring2025", label: "Spring 2025 (January/February)" },
  { id: "fall2025", label: "Fall 2025 (August/September)" },
  { id: "spring2026", label: "Spring 2026 (January/February)" },
];

export default function ProfileSetupStep2Screen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["USA"]);
  const [selectedNeed, setSelectedNeed] = useState("MEDIUM");
  const [selectedSemester, setSelectedSemester] = useState("fall2025");
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        if (profile.countryPreference) {
          setSelectedCountries(profile.countryPreference.split(',').map(s => s.trim()));
        }
        if (profile.intendedStartDate) {
          setSelectedSemester(profile.intendedStartDate);
        }
        if (profile.financialNeed) {
          setSelectedNeed(profile.financialNeed);
        }
      } catch (e) {
        // Ignore if profile doesn't exist
      } finally {
        setFetching(false);
      }
    };
    loadProfile();
  }, []);

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter((c) => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      await profileService.updateProfile({
        country_preference: selectedCountries.join(','),
        financial_need: selectedNeed,
        intended_start_date: selectedSemester,
      });
      queryClient.invalidateQueries({ queryKey: ['profileCompleteness'] });
      router.push("/profile-setup-step-3");
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {fetching && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.primary }}>Loading...</Text>
        </View>
      )}
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Preferences</Text>
        </View>
        <Text style={styles.headerRight}>ScholarLink GH</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressStep}>Step 2 of 3</Text>
            <Text style={styles.progressPercent}>66% complete</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: "66%" }]} />
          </View>
        </View>

        {/* Headline */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>Where do you want to go?</Text>
          <Text style={styles.subhead}>Tell us about your study goals and financial needs.</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Country Preference */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Ionicons name="earth" size={20} color={colors.primary} />
              <Text style={styles.sectionLabel}>Country Preference</Text>
            </View>
            <View style={styles.chipContainer}>
              {COUNTRIES.map((country) => {
                const isSelected = selectedCountries.includes(country);
                return (
                  <Pressable
                    key={country}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleCountry(country)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {country}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Financial Need Level */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionLabel}>Financial Need Level</Text>
            </View>
            <View style={styles.needsContainer}>
              {NEEDS.map((need) => {
                const isSelected = selectedNeed === need.id;
                return (
                  <Pressable
                    key={need.id}
                    style={[styles.needCard, isSelected && styles.needCardSelected]}
                    onPress={() => setSelectedNeed(need.id)}
                  >
                    <View style={styles.needCardText}>
                      <Text style={styles.needTitle}>{need.title}</Text>
                      <Text style={styles.needDescription}>{need.description}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Intended Start Date */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionLabel}>Intended Start Date</Text>
            </View>
            <Pressable
              style={styles.dropdownButton}
              onPress={() => setShowSemesterPicker(!showSemesterPicker)}
            >
              <Text style={styles.dropdownText}>
                {SEMESTERS.find((s) => s.id === selectedSemester)?.label || "Select Semester/Year"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </Pressable>
            {showSemesterPicker && (
              <View style={styles.dropdownMenu}>
                {SEMESTERS.map((sem) => (
                  <Pressable
                    key={sem.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedSemester(sem.id);
                      setShowSemesterPicker(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedSemester === sem.id && styles.dropdownItemTextSelected]}>
                      {sem.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Supportive Message */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.infoText}>
              Your preferences help us prioritize scholarships that match your specific timeline and financial situation.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Nav */}
      <View style={[styles.footerNav, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.navButtonSecondary} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.navButtonSecondaryText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.navButtonPrimary, loading && { opacity: 0.7 }]}
          onPress={handleNext}
          disabled={loading}
        >
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          <Text style={styles.navButtonPrimaryText}>{loading ? 'Saving...' : 'Next'}</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    minHeight: 56,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: colors.ink,
  },
  headerRight: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressStep: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.border,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 14,
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  headlineContainer: {
    marginBottom: 24,
  },
  headline: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 32,
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subhead: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 16,
    color: colors.muted,
  },
  formContainer: {
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: colors.primary,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: "#d5e3ff", // Primary fixed
  },
  chipText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
  needsContainer: {
    gap: 12,
  },
  needCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
  },
  needCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#d5e3ff",
  },
  needCardText: {
    flex: 1,
  },
  needTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: colors.primary,
    marginBottom: 4,
  },
  needDescription: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: colors.muted,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 48,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  dropdownText: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 16,
    color: colors.ink,
  },
  dropdownMenu: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 4,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  dropdownItemText: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 16,
    color: colors.ink,
  },
  dropdownItemTextSelected: {
    fontFamily: "BeVietnamPro_600SemiBold",
    color: colors.primary,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#d5e3ff",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: "#1f477b", // on-primary-fixed-variant
    lineHeight: 20,
  },
  footerNav: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
    gap: 16,
  },
  navButtonSecondary: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  navButtonSecondaryText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  navButtonPrimary: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  navButtonPrimaryText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: "#ffffff",
    marginTop: 2,
  },
});
