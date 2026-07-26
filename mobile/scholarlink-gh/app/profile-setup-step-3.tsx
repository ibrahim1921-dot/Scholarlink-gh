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
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { profileService } from "../services/profileService";
import { useQueryClient } from "@tanstack/react-query";
import { documentService } from "../services/documentService";
import { DocumentUpload } from "../types/api";
import { documentTypes } from "../constants/options";
import { useDisclaimer } from "../hooks/useDisclaimer";
import { DisclaimerModal } from "../components/DisclaimerModal";
import { DocumentCard } from "../components/documents/DocumentCard";

const TESTS = ["WASSCE", "IELTS", "SAT", "GRE"];

type LanguageEntry = { language: string, level: string };

export default function ProfileSetupStep3Screen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [selectedTests, setSelectedTests] = useState<string[]>(["IELTS"]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([{ language: 'English', level: 'Fluent' }]);
  const [bio, setBio] = useState("");
  const [achievements, setAchievements] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>(documentTypes[0]);
  const [docs, setDocs] = useState<DocumentUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { isAccepted, isAccepting, acceptDisclaimer, refreshStatus } = useDisclaimer();
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  // Poll PENDING documents
  useEffect(() => {
    const pendingDocs = docs.filter((d) => d.verification_status === 'PENDING');
    if (pendingDocs.length === 0) return;

    const interval = setInterval(async () => {
      let updatedAny = false;
      const updatedDocs = [...docs];
      
      for (let i = 0; i < updatedDocs.length; i++) {
        const doc = updatedDocs[i];
        if (doc.verification_status === 'PENDING') {
          try {
            const updatedDoc = await documentService.getDocument(doc.id);
            if (updatedDoc.verification_status !== 'PENDING') {
              updatedDocs[i] = updatedDoc;
              updatedAny = true;
            }
          } catch (e) {
            // ignore
          }
        }
      }

      if (updatedAny) {
        setDocs(updatedDocs);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [docs]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        if (profile.languageProficiency) {
          try {
            const parsed = JSON.parse(profile.languageProficiency);
            if (Array.isArray(parsed)) {
              setLanguages(parsed);
            } else {
              setLanguages([]);
            }
          } catch (e) {
            if (profile.languageProficiency.includes(':')) {
              const legacyParts = profile.languageProficiency.split(',');
              const mapped = legacyParts.map(part => {
                const [lang, lvl] = part.split(':');
                return { language: lang ? lang.trim() : '', level: lvl ? lvl.trim() : 'Fluent' };
              }).filter(l => l.language !== '');
              setLanguages(mapped.length > 0 ? mapped : []);
            } else {
              setLanguages([]);
            }
          }
        } else {
          setLanguages([]);
        }
        if (profile.bio) setBio(profile.bio);
        if (profile.achievements) setAchievements(profile.achievements);
        if (profile.standardizedTests) {
          setSelectedTests(profile.standardizedTests.split(','));
        }
        if (profile.skills) {
          setSkills(profile.skills);
        }
      } catch (e) {
        // Ignore if profile doesn't exist
      } finally {
        setFetching(false);
      }
    };

    const loadDocs = async () => {
      try {
        const documents = await documentService.getDocuments();
        setDocs(documents);
      } catch (e) {
        // ignore
      }
    };

    loadProfile();
    loadDocs();
    refreshStatus();
  }, []);

  const toggleTest = (test: string) => {
    if (selectedTests.includes(test)) {
      setSelectedTests(selectedTests.filter((t) => t !== test));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const addLanguage = () => {
    setLanguages([...languages, { language: '', level: 'Basic' }]);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const updateLanguageName = (index: number, name: string) => {
    const newLangs = [...languages];
    newLangs[index].language = name;
    setLanguages(newLangs);
  };

  const updateLanguageLevel = (index: number, level: string) => {
    const newLangs = [...languages];
    newLangs[index].level = level;
    setLanguages(newLangs);
  };

  const handleLevelSelect = (index: number) => {
    Alert.alert("Select Proficiency", "Choose your language proficiency level:", [
      { text: "Basic", onPress: () => updateLanguageLevel(index, "Basic") },
      { text: "Intermediate", onPress: () => updateLanguageLevel(index, "Intermediate") },
      { text: "Fluent", onPress: () => updateLanguageLevel(index, "Fluent") },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const upload = async () => {
    if (!isAccepted) {
      setShowDisclaimerModal(true);
      return;
    }

    let DocumentPicker: typeof import('expo-document-picker');
    try {
      DocumentPicker = require('expo-document-picker');
    } catch {
      Alert.alert('Not Available', 'Document picker is not installed.');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({ 
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'], 
      copyToCacheDirectory: true 
    });
    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];

    if (file.size && file.size > 10 * 1024 * 1024) {
      Alert.alert('File Too Large', 'The selected file exceeds the 10MB limit. Please choose a smaller file.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const uploaded = await documentService.uploadDocument(file, selectedDocType, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setDocs((prev) => [uploaded, ...prev]);
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.message ?? 'Could not upload');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = (id: number) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await documentService.deleteDocument(id);
            setDocs((prev) => prev.filter((d) => d.id !== id));
          } catch (e: any) {
            Alert.alert('Delete Failed', e?.message ?? 'Could not delete document');
          }
        },
      },
    ]);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await profileService.updateProfile({
        language_proficiency: JSON.stringify(languages),
        standardized_tests: selectedTests.join(','),
        bio,
        achievements,
        skills,
      });
      queryClient.invalidateQueries({ queryKey: ['profileCompleteness'] });
      router.replace("/(tabs)");
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
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.headerCenter}>ScholarLink GH</Text>
        <View style={styles.headerRight} />
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
            <Text style={styles.progressStep}>Step 3 of 3</Text>
            <Text style={styles.progressPercent}>95% complete</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: "95%" }]} />
          </View>
        </View>

        {/* Robot Celebration Element */}
        <View style={styles.celebrationBox}>
          <View style={styles.robotIcon}>
            <Ionicons name="hardware-chip-outline" size={28} color="#ffffff" />
          </View>
          <View style={styles.celebrationTextContainer}>
            <Text style={styles.celebrationTitle}>Almost done!</Text>
            <Text style={styles.celebrationText}>You're doing great, let's wrap this up.</Text>
          </View>
        </View>

        {/* Headline */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>Final details</Text>
          <Text style={styles.subhead}>You're almost there! Just a few more details to unlock your matches.</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Language Proficiency */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Language Proficiency</Text>
            
            {languages.map((lang, index) => (
              <View key={index} style={styles.languageCard}>
                <View style={styles.languageInfo}>
                  <Ionicons name="globe-outline" size={24} color={colors.muted} />
                  <View style={styles.languageTextContainer}>
                    <TextInput
                      style={[styles.languageName, { padding: 0, margin: 0, height: 24, minWidth: 100 }]}
                      placeholder="Language (e.g. English)"
                      placeholderTextColor={colors.muted}
                      value={lang.language}
                      onChangeText={(text) => updateLanguageName(index, text)}
                    />
                  </View>
                </View>
                <Pressable style={styles.languageSelect} onPress={() => handleLevelSelect(index)}>
                  <Text style={styles.languageSelectText}>{lang.level}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => removeLanguage(index)} style={{ padding: 8, marginLeft: 4 }}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            ))}

            <Pressable style={styles.addLanguageButton} onPress={addLanguage}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.addLanguageText}>Add another language</Text>
            </Pressable>
          </View>

          {/* Personal Statement / Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Personal Bio</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                maxLength={500}
                placeholder="Write a short personal statement about yourself, your goals, and your background..."
                placeholderTextColor={colors.muted}
                value={bio}
                onChangeText={setBio}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/500</Text>
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Achievements</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                maxLength={500}
                placeholder="List your key extracurricular activities, awards, and achievements..."
                placeholderTextColor={colors.muted}
                value={achievements}
                onChangeText={setAchievements}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{achievements.length}/500</Text>
            </View>
          </View>

          {/* Skills */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Skills</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <TextInput
                style={[styles.textAreaContainer, { flex: 1, padding: 12, minHeight: 48, fontFamily: "BeVietnamPro_400Regular", fontSize: 14, color: colors.primary }]}
                placeholder="E.g. Java, Public Speaking, React"
                placeholderTextColor={colors.muted}
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={() => {
                  if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                    setSkills([...skills, skillInput.trim()]);
                    setSkillInput("");
                  }
                }}
              />
              <Pressable
                style={{ backgroundColor: colors.primary, padding: 12, borderRadius: 8, height: 48, justifyContent: 'center' }}
                onPress={() => {
                  if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                    setSkills([...skills, skillInput.trim()]);
                    setSkillInput("");
                  }
                }}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.typeChipsContainer}>
              {skills.map(skill => (
                <View key={skill} style={[styles.typeChip, styles.typeChipSelected, { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12 }]}>
                  <Text style={styles.typeChipTextSelected}>{skill}</Text>
                  <Pressable onPress={() => setSkills(skills.filter(s => s !== skill))}>
                    <Ionicons name="close-circle" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Standardized Tests */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Standardized Tests</Text>
            <View style={styles.testsGrid}>
              {TESTS.map((test) => {
                const isSelected = selectedTests.includes(test);
                return (
                  <Pressable
                    key={test}
                    style={styles.testItem}
                    onPress={() => toggleTest(test)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                    </View>
                    <Text style={styles.testItemText}>{test}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* File Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Upload Documents</Text>

            {/* Type Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChipsContainer}>
              {documentTypes.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.typeChip, selectedDocType === type && styles.typeChipSelected]}
                  onPress={() => setSelectedDocType(type)}
                >
                  <Text style={[styles.typeChipText, selectedDocType === type && styles.typeChipTextSelected]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.uploadZone} onPress={upload} disabled={uploading} activeOpacity={0.8}>
              <View style={styles.uploadIconContainer}>
                <Ionicons name={uploading ? "reload" : "cloud-upload-outline"} size={28} color={colors.primary} />
              </View>
              <Text style={styles.uploadTitle}>{uploading ? `Uploading... ${uploadProgress}%` : "Tap to upload files here"}</Text>
              <Text style={styles.uploadSubtitle}>PDF, JPG, or PNG (Max 10MB)</Text>
            </TouchableOpacity>

            {/* Uploaded Documents List */}
            {docs.length > 0 && (
              <View style={styles.docsListContainer}>
                <Text style={styles.sectionLabel}>Recently Uploaded</Text>
                <View style={styles.docsList}>
                  {[...docs]
                    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
                    .slice(0, 5)
                    .map((item) => (
                    <DocumentCard key={item.id} item={item} onDelete={deleteDocument} />
                  ))}
                </View>
              </View>
            )}
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
          style={[styles.navButtonFinish, loading && { opacity: 0.7 }]}
          onPress={handleFinish}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          <Text style={styles.navButtonFinishText}>{loading ? 'Saving...' : 'Finish'}</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>

      <DisclaimerModal
        visible={showDisclaimerModal}
        isAccepting={isAccepting}
        onAccept={async () => {
          await acceptDisclaimer();
          setShowDisclaimerModal(false);
        }}
        onClose={() => setShowDisclaimerModal(false)}
      />
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
    width: 40,
  },
  closeButton: {
    padding: 4,
  },
  headerCenter: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: colors.primary,
  },
  headerRight: {
    width: 40,
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
    alignItems: "flex-end",
    marginBottom: 8,
  },
  progressStep: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 14,
    color: colors.success,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.success,
  },
  celebrationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(160, 243, 153, 0.2)", // secondary-container/20
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(27, 109, 36, 0.1)", // secondary/10
    marginBottom: 24,
    gap: 16,
  },
  robotIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  celebrationTextContainer: {
    flex: 1,
  },
  celebrationTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: colors.primary,
    marginBottom: 2,
  },
  celebrationText: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: colors.muted,
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
    gap: 12,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: colors.primary,
    marginBottom: 4,
  },
  languageCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    padding: 16,
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageTextContainer: {
    justifyContent: "center",
  },
  languageName: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 16,
    color: colors.primary,
  },
  languageLevel: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  languageSelect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  languageSelectText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 14,
    color: colors.primary,
  },
  addLanguageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  addLanguageText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 14,
    color: colors.primary,
  },
  textAreaContainer: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    padding: 12,
  },
  textArea: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: colors.primary,
    minHeight: 100,
  },
  charCount: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 12,
    color: colors.muted,
    textAlign: "right",
    marginTop: 8,
  },
  testsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  testItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  testItemText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 14,
    color: colors.primary,
  },
  typeChipsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    flexWrap: "wrap",
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.muted,
  },
  typeChipTextSelected: {
    color: "#ffffff",
  },
  uploadZone: {
    borderWidth: 2,
    borderColor: "rgba(195, 198, 209, 0.8)",
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 51, 102, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  uploadTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: colors.ink,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.muted,
  },
  docsListContainer: {
    marginTop: 16,
  },
  docsList: {
    gap: 12,
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
  navButtonFinish: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: colors.success,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonFinishText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: "#ffffff",
    marginTop: 2,
  },
});
