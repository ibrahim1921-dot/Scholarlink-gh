import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View, ScrollView, Pressable, RefreshControl } from 'react-native';

import { Screen } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/StateView';
import { colors } from '../../constants/colors';
import { useJobDetail } from '../../hooks/useJob';
import { getCountdownLabel, formatDeadline } from '../../utils/date';
import { useJobApplyFlow } from '../../hooks/useJobApplyFlow';
import { JobApplyModals } from '../../components/JobApplyModals';

const PLACEHOLDER_IMAGE = require("../../assets/images/header-scholarships.jpg");

export default function JobDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Number(id);

  const { data: job, isLoading, error, isError, refetch } = useJobDetail(jobId);
  const applyFlow = useJobApplyFlow();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (isError || !job) return <Screen scroll={false}><ErrorState message={(error as Error)?.message ?? 'Not found'} /></Screen>;

  const daysUntilDeadline = job.applicationDeadline ? Math.ceil((new Date(job.applicationDeadline).getTime() - new Date().getTime()) / 86400000) : null;
  const countdownLabel = getCountdownLabel(daysUntilDeadline);
  const formattedDeadline = job.applicationDeadline ? formatDeadline(job.applicationDeadline) : undefined;



  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Job Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero Section */}
        <ImageBackground
          source={job.imageUrl ? { uri: job.imageUrl } : PLACEHOLDER_IMAGE}
          style={styles.heroSection}
          imageStyle={styles.heroImageStyle}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />
          <Text style={styles.overlaidTitle}>{job.title}</Text>
        </ImageBackground>

        <View style={styles.bodySection}>
          <Text style={styles.providerText}>{job.company}</Text>

          <View style={styles.badgesRow}>
            {job.employmentType && (
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>{job.employmentType.replace(/_/g, ' ')}</Text>
              </View>
            )}
            {job.workMode && (
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>{job.workMode.replace(/_/g, ' ')}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <View style={styles.metaLabelRow}>
                <Ionicons name="location-outline" size={14} color={colors.muted} />
                <Text style={styles.metaLabel}>Location</Text>
              </View>
              <Text style={styles.metaValue}>{job.location || "N/A"}</Text>
            </View>

            <View style={styles.metaCol}>
              <View style={styles.metaLabelRow}>
                <MaterialCommunityIcons name="briefcase-outline" size={14} color={colors.muted} />
                <Text style={styles.metaLabel}>Field</Text>
              </View>
              <Text style={styles.metaValue}>{job.fieldOfStudy || "All Fields"}</Text>
            </View>
            
            {job.salaryRange && (
              <View style={styles.metaCol}>
                <View style={styles.metaLabelRow}>
                  <Ionicons name="cash-outline" size={14} color={colors.muted} />
                  <Text style={styles.metaLabel}>Salary</Text>
                </View>
                <Text style={styles.metaValue}>{job.salaryRange}</Text>
              </View>
            )}

            {job.requiredEducationLevel && (
              <View style={styles.metaCol}>
                <View style={styles.metaLabelRow}>
                  <Ionicons name="school-outline" size={14} color={colors.muted} />
                  <Text style={styles.metaLabel}>Education</Text>
                </View>
                <Text style={styles.metaValue}>{job.requiredEducationLevel.replace(/_/g, ' ')}</Text>
              </View>
            )}

            {job.experienceLevel && (
              <View style={styles.metaCol}>
                <View style={styles.metaLabelRow}>
                  <Ionicons name="star-outline" size={14} color={colors.muted} />
                  <Text style={styles.metaLabel}>Experience</Text>
                </View>
                <Text style={styles.metaValue}>{job.experienceLevel.replace(/_/g, ' ')}</Text>
              </View>
            )}

            {job.minimumGpa != null && (
              <View style={styles.metaCol}>
                <View style={styles.metaLabelRow}>
                  <MaterialCommunityIcons name="format-list-numbered" size={14} color={colors.muted} />
                  <Text style={styles.metaLabel}>Min GPA</Text>
                </View>
                <Text style={styles.metaValue}>{job.minimumGpa}</Text>
              </View>
            )}

            {job.applicationUrl && (
              <View style={styles.metaCol}>
                <View style={styles.metaLabelRow}>
                  <Ionicons name="open-outline" size={14} color={colors.muted} />
                  <Text style={styles.metaLabel}>Apply</Text>
                </View>
                <Text style={styles.metaValue}>External</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <View style={styles.deadlinePill}>
              <Text style={styles.deadlinePillText}>
                Deadline: {formattedDeadline || "N/A"}
              </Text>
            </View>
            {countdownLabel && (
              <View style={styles.countdownBadge}>
                <Ionicons name="time-outline" size={13} color={colors.ink} style={{ marginRight: 4 }} />
                <Text style={styles.countdownText}>{countdownLabel}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>{job.description}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <View style={styles.detailBox}>
            {job.requirements && job.requirements.length > 0 ? (
              job.requirements.map((req, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.detailText}>{req}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.detailText}>Not specified</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomActions}>
        <Pressable 
          style={styles.actionBtnPrimary} 
          onPress={() => applyFlow.handleApply(job)}
        >
          <Text style={styles.actionBtnPrimaryText}>Apply Now</Text>
          <Ionicons name="open-outline" size={20} color="#ffffff" />
        </Pressable>
      </View>

      <JobApplyModals {...applyFlow} />
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
    paddingBottom: 100, // Room for bottom actions
  },
  heroSection: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    marginBottom: 16,
    position: 'relative',
  },
  heroImageStyle: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlaidTitle: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: "#ffffff",
    lineHeight: 26,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bodySection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.3)',
  },
  providerText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 16,
    color: colors.info,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  pillBadge: {
    backgroundColor: 'rgba(0, 51, 102, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillBadgeText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaCol: {
    minWidth: 80,
  },
  metaLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 12,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(195, 198, 209, 0.3)',
    marginVertical: 16,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deadlinePill: {
    backgroundColor: "rgba(167, 200, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  deadlinePillText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.info,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countdownText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.ink,
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
  detailBox: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.3)',
  },
  detailText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 24,
    marginRight: 8,
    marginTop: 0,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  actionBtnPrimary: {
    flex: 1,
    height: 48,
    backgroundColor: '#003366',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnPrimaryText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
