import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView, Pressable, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Screen } from '../../components/Screen';
import { CountdownBadge } from '../../components/CountdownBadge';
import { ErrorState, LoadingState } from '../../components/StateView';
import { colors } from '../../constants/colors';
import { applicationStatuses } from '../../constants/options';
import { useApplicationDetail, useUpdateApplication } from '../../hooks/useTracker';
import { ApplicationStatus } from '../../types/api';

const statusDisplayNames: Record<ApplicationStatus, string> = {
  RESEARCHING: 'Researching',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  INTERVIEW: 'Interview',
  AWARDED: 'Awarded',
  REJECTED: 'Rejected',
};

export default function ApplicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { trackerId } = useLocalSearchParams<{ trackerId: string }>();
  const id = Number(trackerId);

  const { data: tracker, isLoading, error, isError } = useApplicationDetail(id);
  const updateMutation = useUpdateApplication();

  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    if (tracker) {
      setNotes(tracker.notes || '');
    }
  }, [tracker]);

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (isError || !tracker) return <Screen scroll={false}><ErrorState message={(error as Error)?.message ?? 'Tracker not found'} /></Screen>;

  const handleSaveNotes = () => {
    updateMutation.mutate(
      { id, payload: { status: tracker.status, notes } },
      {
        onSuccess: () => {
          setIsEditingNotes(false);
          Alert.alert('Success', 'Notes saved successfully');
        },
        onError: (err: any) => {
          Alert.alert('Error', err.message || 'Failed to save notes');
        }
      }
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Application Progress</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Scholarship Linked Section */}
        <Pressable 
          style={styles.heroSection}
          onPress={() => router.push(`/scholarship/${tracker.scholarshipId}`)}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.logoBox}>
              <Ionicons name="school" size={32} color={colors.primary} />
            </View>
            <CountdownBadge days={tracker.deadlineCountdown} />
          </View>
          <Text style={styles.heroTitle}>{tracker.scholarshipName}</Text>
          <Text style={styles.heroSubtitle}>{tracker.scholarshipProvider}</Text>
          <View style={styles.viewDetailsRow}>
             <Text style={styles.viewDetailsText}>View Scholarship Details</Text>
             <Ionicons name="chevron-forward" size={16} color="#d5e3ff" />
          </View>
        </Pressable>

        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Status</Text>
          <View style={styles.statusGrid}>
            {applicationStatuses.map((status) => {
              const isActive = tracker.status === status;
              return (
                <View
                  key={status}
                  style={[styles.statusChip, isActive ? styles.statusChipActive : undefined]}
                >
                  <Text style={[styles.statusChipText, isActive ? styles.statusChipTextActive : undefined]}>
                    {statusDisplayNames[status]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Key Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Dates</Text>
          <View style={styles.genericCard}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Deadline</Text>
              <Text style={styles.dateValue}>{formatDate(tracker.scholarshipDeadline)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Submitted At</Text>
              <Text style={styles.dateValue}>{formatDate(tracker.submittedAt)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Awarded At</Text>
              <Text style={styles.dateValue}>{formatDate(tracker.awardedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.notesHeaderRow}>
            <Text style={styles.sectionTitle}>My Notes</Text>
            {!isEditingNotes ? (
              <Pressable onPress={() => setIsEditingNotes(true)}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.notesCard}>
            {isEditingNotes ? (
              <View>
                <TextInput
                  style={[styles.notesInput, { minHeight: 100 }]}
                  multiline
                  textAlignVertical="top"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add your personal notes, interview prep, or to-dos here..."
                  placeholderTextColor={colors.muted}
                />
                <View style={styles.notesActions}>
                  <Pressable 
                    style={styles.cancelBtn} 
                    onPress={() => {
                      setNotes(tracker.notes || '');
                      setIsEditingNotes(false);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.saveBtn} 
                    onPress={handleSaveNotes}
                    disabled={updateMutation.isPending}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setIsEditingNotes(true)}>
                <Text style={[styles.notesText, tracker.notes ? undefined : styles.notesPlaceholder]}>
                  {tracker.notes ? tracker.notes : 'Tap to add notes...'}
                </Text>
              </Pressable>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
        paddingBottom: 10,
    backgroundColor: colors.surface,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: colors.primary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(226, 226, 231, 0.5)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: '#003366', // primary-container
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoBox: {
    backgroundColor: '#ffffff',
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 32,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: '#d5e3ff', // primary-fixed-dim
    marginBottom: 16,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 14,
    color: '#d5e3ff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: colors.primary,
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusChip: {
    backgroundColor: '#f4f3f8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.3)',
  },
  statusChipActive: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  statusChipText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 14,
    color: colors.muted,
  },
  statusChipTextActive: {
    color: '#ffffff',
  },
  genericCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.3)',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  dateValue: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(195, 198, 209, 0.3)',
    marginVertical: 12,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notesCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.3)',
    minHeight: 120,
  },
  notesText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.primary,
    lineHeight: 22,
  },
  notesPlaceholder: {
    color: colors.muted,
    fontStyle: 'italic',
  },
  notesInput: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.primary,
    backgroundColor: '#f4f3f8',
    borderRadius: 12,
    padding: 12,
    lineHeight: 22,
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.muted,
  },
  saveBtn: {
    backgroundColor: '#003366',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
});
