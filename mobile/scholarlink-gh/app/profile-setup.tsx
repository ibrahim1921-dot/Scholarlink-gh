import { router, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, View, Image, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '../components/AppTextInput';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profileService';
import { educationLevels } from '../constants/options';

export default function ProfileSetupScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [educationLevel, setEducationLevel] = useState('');
  const [institution, setInstitution] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [gpa, setGpa] = useState('3.5');
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear + i);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        if (profile.educationLevel) setEducationLevel(profile.educationLevel);
        if (profile.institution) setInstitution(profile.institution);
        if (profile.fieldOfStudy) setFieldOfStudy(profile.fieldOfStudy);
        if (profile.gpa) setGpa(profile.gpa.toString());
        if (profile.graduationYear) setGraduationYear(profile.graduationYear);
      } catch (e) {
        // Profile might not exist yet, that's fine
      } finally {
        setFetching(false);
      }
    };
    loadProfile();
  }, []);

  const handleSubmit = async () => {
    if (!educationLevel || !institution || !fieldOfStudy || !graduationYear) {
      Alert.alert('Missing Fields', 'Please fill in all the required fields.');
      return;
    }

    setLoading(true);
    try {
      await profileService.updateProfile({
        education_level: educationLevel as any,
        institution,
        field_of_study: fieldOfStudy,
        gpa: gpa ? parseFloat(gpa) : undefined,
        graduation_year: graduationYear,
      });
      queryClient.invalidateQueries({ queryKey: ['profileCompleteness'] });
      router.push('/profile-setup-step-2');
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
          <Ionicons name="school" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>ScholarLink GH</Text>
        </View>
        <Pressable style={styles.closeButton} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="close" size={24} color={colors.muted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.stepText}>STEP 1 OF 3</Text>
              <Text style={styles.percentageText}>33%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '33%' }]} />
            </View>
          </View>

          {/* Hero Branding */}
          <View style={styles.heroContainer}>
            <Text style={styles.heroTitle}>Let's build your profile</Text>
            <Text style={styles.heroSubtitle}>
              This helps our AI find the best scholarships for you. Your academic background is the foundation of your future success.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Ionicons name="book" size={20} color="#001b3c" />
              </View>
              <Text style={styles.cardTitle}>Academic Basics</Text>
            </View>

            <View style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Education Level</Text>
                <View style={styles.educationToggleContainer}>
                  {educationLevels.map((lvl) => {
                    const isSelected = educationLevel === lvl.value;
                    return (
                      <Pressable
                        key={lvl.value}
                        onPress={() => setEducationLevel(lvl.value)}
                        style={[
                          styles.eduBtn,
                          isSelected ? styles.eduBtnSelected : styles.eduBtnUnselected
                        ]}
                      >
                        <Text style={[
                          styles.eduBtnText, 
                          isSelected ? styles.eduBtnTextSelected : styles.eduBtnTextUnselected
                        ]}>
                          {lvl.label === "SHS Graduate" ? "SHS Graduate" : "University Student"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Institution</Text>
                <AppTextInput
                  label=""
                  value={institution}
                  onChangeText={setInstitution}
                  placeholder="e.g. University of Ghana"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Field of Study</Text>
                <AppTextInput
                  label=""
                  value={fieldOfStudy}
                  onChangeText={setFieldOfStudy}
                  placeholder="e.g. Computer Science"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.gpaHeader}>
                  <Text style={styles.label}>Cumulative GPA</Text>
                  <View style={styles.gpaBadge}>
                    <Text style={styles.gpaBadgeText}>{gpa || "0.0"}</Text>
                  </View>
                </View>
                {/* Fallback for slider since we don't have react-native-slider installed */}
                <AppTextInput
                  label=""
                  value={gpa}
                  onChangeText={setGpa}
                  placeholder="e.g. 3.5"
                  keyboardType="decimal-pad"
                />
                <View style={styles.gpaHintContainer}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
                  <Text style={styles.gpaHintText}>Estimate if you don't have your official transcript yet.</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Graduation Year</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearScrollContent}>
                  {yearOptions.map(year => {
                    const isSelected = graduationYear === year;
                    return (
                      <Pressable 
                        key={year} 
                        style={[styles.yearPill, isSelected && styles.yearPillSelected]}
                        onPress={() => setGraduationYear(year)}
                      >
                        <Text style={[styles.yearText, isSelected && styles.yearTextSelected]}>{year}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Decorative Illustration */}
          <View style={styles.decorativeContainer}>
            <Image 
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBX8rOZTnDN_BovDHzYfJARU6VhKRTy6CN_LTqi36ND_kAtBSnCY7kq3b58ewnLp3M_5kRO_m7jdRIMhSoKC3OAHd_JHkJO8lKwtzr8rJkoUmXSbnNL-50wQxqom53IRT5WOiILYsRu6doRNyjl1bfCkJy1XybRdAlGZK6ak2ep61M9nlF4CO_M3PCSx9qD-dFf7SjpWD7kTfShQkpmVrGsWyMfJbrCMYiIdZV38UX_BVgF8voGY4GWLdDOnen3oXwZzFRvYDaY01CL" }}
              style={styles.decorativeImage}
            />
            <View style={styles.decorativeOverlay} />
            <View style={styles.decorativeTextContainer}>
              <Text style={styles.decorativeTitle}>Unlock opportunities</Text>
              <Text style={styles.decorativeSubtitle}>Over 500+ specialized Ghanaian scholarships tracked.</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation Shell */}
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Pressable style={styles.nextButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    minHeight: 64,
    backgroundColor: colors.surface,
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: colors.primary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  stepText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1,
  },
  percentageText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  heroContainer: {
    marginBottom: 24,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 32,
    color: colors.primary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 16,
    color: colors.muted,
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(195, 198, 209, 0.5)",
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  cardIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#d5e3ff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: colors.primary,
  },
  formContent: {
    gap: 16,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
    marginLeft: 4,
  },
  gpaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gpaBadge: {
    backgroundColor: '#003366',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  gpaBadgeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: '#ffffff',
  },
  gpaHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  gpaHintText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    color: colors.muted,
    fontStyle: 'italic',
    flex: 1,
  },
  educationToggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  eduBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  eduBtnSelected: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(195, 198, 209, 0.3)",
  },
  eduBtnUnselected: {
    backgroundColor: "transparent",
  },
  eduBtnText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  eduBtnTextSelected: {
    color: colors.primary,
  },
  eduBtnTextUnselected: {
    color: colors.muted,
  },
  yearScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  yearPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  yearPillSelected: {
    backgroundColor: '#d5e3ff',
    borderColor: colors.primary,
  },
  yearText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.muted,
  },
  yearTextSelected: {
    color: colors.primary,
  },
  decorativeContainer: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    position: 'relative',
    backgroundColor: '#003366',
  },
  decorativeImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  decorativeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  decorativeTextContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  decorativeTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: '#ffffff',
  },
  decorativeSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backButtonText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
});
