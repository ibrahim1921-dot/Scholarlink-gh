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
import { useJobDetail } from '../../hooks/useJob';
import { ApplicationStatus, JobApplication } from '../../types/api';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '../../services/jobService';

const statusDisplayNames: Record<ApplicationStatus, string> = {
  RESEARCHING: 'Researching',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  INTERVIEW: 'Interview',
  AWARDED: 'Offer',
  REJECTED: 'Rejected',
};

// Custom hook to fetch a specific job application
function useJobApplicationDetail(id: number) {
  return useQuery({
    queryKey: ['jobApplication', id],
    queryFn: async () => {
      const apps = await jobService.getMyApplications();
      const app = apps.find((a: JobApplication) => a.id === id);
      if (!app) throw new Error('Job application not found');
      return app;
    },
  });
}

export default function JobApplicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id: jobIdParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(jobIdParam);

  const { data: application, isLoading, error, isError } = useJobApplicationDetail(id);

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (isError || !application) return <Screen scroll={false}><ErrorState message={(error as Error)?.message ?? 'Application not found'} /></Screen>;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const job = application.job;

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
        {/* Job Linked Section */}
        <Pressable 
          style={styles.heroSection}
          onPress={() => router.push(`/job/${job.id}`)}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.logoBox}>
              <Ionicons name="briefcase" size={32} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.heroTitle}>{job.title}</Text>
          <Text style={styles.heroSubtitle}>{job.company}</Text>
          <View style={styles.viewDetailsRow}>
             <Text style={styles.viewDetailsText}>View Job Details</Text>
             <Ionicons name="chevron-forward" size={16} color="#d5e3ff" />
          </View>
        </Pressable>

        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Status</Text>
          <View style={styles.statusGrid}>
            {applicationStatuses.map((status) => {
              const isActive = application.status === status;
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
              <Text style={styles.dateValue}>{formatDate(job.applicationDeadline)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Applied At</Text>
              <Text style={styles.dateValue}>{formatDate(application.appliedAt)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Last Updated</Text>
              <Text style={styles.dateValue}>{formatDate(application.updatedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.notesHeaderRow}>
            <Text style={styles.sectionTitle}>My Notes</Text>
          </View>
          <View style={styles.notesCard}>
            <Text style={[styles.notesText, application.notes ? undefined : styles.notesPlaceholder]}>
              {application.notes ? application.notes : 'No notes added for this job application.'}
            </Text>
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
    backgroundColor: '#003366',
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
    color: '#d5e3ff',
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
  }
});
