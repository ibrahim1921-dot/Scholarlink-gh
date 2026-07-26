import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ImageBackground, Linking, StyleSheet, Text, View, ScrollView, Pressable, Platform, Share, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { Screen } from '../../components/Screen';
import { CountdownBadge } from '../../components/CountdownBadge';
import { ErrorState, LoadingState } from '../../components/StateView';
import { colors } from '../../constants/colors';
import { trackerService } from '../../services/trackerService';
import { useScholarshipDetail, useScholarshipEligibility, useSavedScholarships, useToggleSaveScholarship, useReportScholarship } from '../../hooks/useScholarship';
import { useScholarshipApplyFlow } from '../../hooks/useScholarshipApplyFlow';
import { ScholarshipApplyModals } from '../../components/ScholarshipApplyModals';

export default function ScholarshipDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scholarshipId = Number(id);

  const { 
    data: scholarship, 
    isLoading: isScholarshipLoading, 
    error: scholarshipError,
    isError: isScholarshipError,
    refetch
  } = useScholarshipDetail(scholarshipId);

  const { data: eligibility } = useScholarshipEligibility(scholarshipId);
  const { data: savedScholarships } = useSavedScholarships();
  const toggleSaveMutation = useToggleSaveScholarship();
  const reportMutation = useReportScholarship();
  const [reported, setReported] = useState(false);

  const handleReport = () => {
    Alert.alert(
      'Report',
      'Report this scholarship?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: 'destructive',
          onPress: () => {
            reportMutation.mutate(scholarshipId, {
              onSuccess: () => {
                setReported(true);
                Alert.alert('Reported', "Thanks, we'll review this");
              },
              onError: (err: any) => {
                Alert.alert('Error', err?.message ?? 'Could not report');
              }
            });
          }
        }
      ]
    );
  };

  const loading = isScholarshipLoading;
  const error = isScholarshipError ? (scholarshipError as Error)?.message ?? 'Failed to load scholarship' : null;
  const queryClient = useQueryClient();
  const applyFlow = useScholarshipApplyFlow();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (loading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (error || !scholarship) return <Screen scroll={false}><ErrorState message={error ?? 'Not found'} /></Screen>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Scholarship Detail</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable 
            style={[styles.iconBtn, reported && { opacity: 0.5 }]} 
            disabled={reported || reportMutation.isPending}
            onPress={handleReport}
          >
            <Ionicons name={reported ? "flag" : "flag-outline"} size={20} color={reported ? "#ba1a1a" : colors.primary} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={async () => {
            try {
              await Share.share({
                message: `Check out this scholarship: ${scholarship.name}\nDeadline: ${scholarship.daysUntilDeadline != null ? (scholarship.daysUntilDeadline < 0 ? 'Expired' : scholarship.daysUntilDeadline === 0 ? 'Closing today' : scholarship.daysUntilDeadline + ' days left') : 'Varies'}\n${scholarship.officialLink}`,
              });
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }}>
            <Ionicons name="share-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero Section */}
        <ImageBackground
          source={scholarship.imageUrl ? { uri: scholarship.imageUrl } : require('../../assets/images/header-scholarships.jpg')}
          style={styles.heroSection}
          imageStyle={styles.heroImageStyle}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
              <View style={styles.logoBox}>
                <Ionicons name="school" size={32} color={colors.primary} />
              </View>
              {scholarship.status && (
                <View style={[
                  styles.statusBadge,
                  scholarship.status === 'OPEN' ? styles.statusBadgeOpen :
                  scholarship.status === 'CLOSED' ? styles.statusBadgeClosed :
                  styles.statusBadgeWarning
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    scholarship.status === 'OPEN' ? styles.statusTextOpen :
                    scholarship.status === 'CLOSED' ? styles.statusTextClosed :
                    styles.statusTextWarning
                  ]}>
                    {scholarship.status === 'CLOSING_SOON' ? 'CLOSING SOON' : scholarship.status}
                  </Text>
                </View>
              )}
            </View>
            <CountdownBadge days={scholarship.daysUntilDeadline} />
          </View>
          <Text style={styles.heroTitle}>{scholarship.name}</Text>
          <Text style={styles.heroSubtitle}>
            {scholarship.provider} {scholarship.destinationCountry ? `• ${scholarship.destinationCountry}` : ''}
            {scholarship.category ? ` • ${scholarship.category.replace(/_/g, ' ')}` : ''}
          </Text>
          {scholarship.eligibleFields && (
            <View style={styles.chipContainer}>
              {scholarship.eligibleFields.split(',').map((f, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{f.trim()}</Text>
                </View>
              ))}
            </View>
          )}
        </ImageBackground>

        {/* Eligibility Checklist */}
        {(eligibility || scholarship.gpaRequirement > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eligibility Checklist</Text>
            <View style={styles.checklistCard}>
              {scholarship.gpaRequirement > 0 && (
                <View style={styles.checklistItem}>
                  <View style={styles.checklistLeft}>
                    <View style={styles.checkIconBox}>
                      <Ionicons name="checkmark-circle" size={20} color="#1b6d24" />
                    </View>
                    <Text style={styles.checklistText}>GPA &ge; {scholarship.gpaRequirement}</Text>
                  </View>
                  <View style={styles.statusBadgeMet}>
                    <Text style={styles.statusBadgeTextMet}>Requirement</Text>
                  </View>
                </View>
              )}

              {eligibility?.criteria ? (
                eligibility.criteria.length > 0 ? (
                  eligibility.criteria.map((criterion, index) => (
                    <View key={`criterion-${index}`} style={styles.checklistItem}>
                      <View style={styles.checklistLeft}>
                        <View style={criterion.met ? styles.checkIconBox : styles.reviewIconBox}>
                          <Ionicons name={criterion.met ? "checkmark-circle" : "close-circle"} size={20} color={criterion.met ? "#1b6d24" : "#ba1a1a"} />
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={[styles.checklistText, { fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 }]}>
                            {criterion.label}
                          </Text>
                          <Text style={[styles.checklistText, { fontSize: 13, color: colors.muted }]}>
                            {criterion.reason}
                          </Text>
                        </View>
                      </View>
                      <View style={criterion.met ? styles.statusBadgeMet : styles.statusBadgeReview}>
                        <Text style={criterion.met ? styles.statusBadgeTextMet : styles.statusBadgeTextReview}>
                          {criterion.met ? 'Met' : 'Missing'}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.checklistItem}>
                    <Text style={styles.checklistText}>No eligibility criteria available.</Text>
                  </View>
                )
              ) : eligibility?.criteria_met || eligibility?.criteria_missing ? (
                <View style={styles.checklistItem}>
                  <Text style={[styles.checklistText, { color: colors.muted }]}>
                    Eligibility information format is outdated. Please update your profile to run a new check.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Benefits & Funding */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits & Funding</Text>
          <View style={styles.genericCard}>
            <View style={styles.genericCardHeader}>
              <Ionicons name="cash-outline" size={24} color={colors.primary} />
              <Text style={styles.genericCardTitle}>Funding Coverage</Text>
            </View>
            <Text style={styles.genericCardBody}>{scholarship.fundingCoverage || "Not specified."}</Text>
          </View>
        </View>

        {/* Requirements Detail */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements & Criteria</Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>{scholarship.requirements}</Text>
            
            <View style={styles.divider} />
            <Text style={styles.detailSubTitle}>Selection Criteria</Text>
            <Text style={styles.detailText}>{scholarship.selectionCriteria}</Text>

            {scholarship.additionalNotes ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.detailSubTitle}>Additional Notes</Text>
                <Text style={styles.detailText}>{scholarship.additionalNotes}</Text>
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomActions}>
        <Pressable 
          style={[styles.actionBtnSecondary, toggleSaveMutation.isPending && { opacity: 0.5 }]} 
          disabled={toggleSaveMutation.isPending}
          onPress={() => toggleSaveMutation.mutate(scholarshipId)}
        >
          <Ionicons 
            name={savedScholarships?.some(s => s.id === scholarshipId) ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={savedScholarships?.some(s => s.id === scholarshipId) ? colors.primary : colors.primary} 
          />
        </Pressable>
        {(() => {
          const isClosed = scholarship.status === 'CLOSED';
          const isFull = scholarship.status === 'FULL';
          const isDisabled = isClosed || isFull;
          
          if (!scholarship.officialLink) {
             return (
              <View style={[styles.actionBtnPrimary, styles.actionBtnDisabled]}>
                <Text style={styles.actionBtnPrimaryText}>Link unavailable</Text>
              </View>
             );
          }

          return (
            <Pressable 
              style={[styles.actionBtnPrimary, isDisabled && styles.actionBtnDisabled]} 
              disabled={isDisabled}
              onPress={() => applyFlow.handleApply(scholarship)}
            >
              <Text style={styles.actionBtnPrimaryText}>
                {isClosed ? 'Applications closed' : isFull ? 'Position full' : 'Apply Now'}
              </Text>
              {!isDisabled && <Ionicons name="open-outline" size={20} color="#ffffff" />}
            </Pressable>
          );
        })()}
      </View>
      
      <ScholarshipApplyModals {...applyFlow} />
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
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderRadius: 16,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 51, 102, 0.65)',
    borderRadius: 16,
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
    fontSize: 28,
    color: '#ffffff',
    lineHeight: 36,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: '#d5e3ff', // primary-fixed-dim
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
  checklistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(195, 198, 209, 0.3)',
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 198, 209, 0.3)',
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  checkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a0f399', // secondary-container
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffdad6', // error-container
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.primary,
  },
  statusBadgeMet: {
    backgroundColor: 'rgba(160, 243, 153, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextMet: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: '#1b6d24',
  },
  statusBadgeReview: {
    backgroundColor: '#f4f3f8', // surface-container-low
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextReview: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: '#43474f', // on-surface-variant
  },
  genericCard: {
    backgroundColor: '#f4f3f8', // surface-container-low
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.2)',
  },
  genericCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  genericCardTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  genericCardBody: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  detailBox: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.3)',
  },
  detailSubTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.primary,
    marginBottom: 8,
  },
  detailText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(195, 198, 209, 0.3)',
    marginVertical: 16,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  actionBtnSecondary: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  actionBtnPrimary: {
    flex: 1,
    height: 48,
    backgroundColor: '#003366', // primary-container
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
  actionBtnDisabled: {
    backgroundColor: '#8e9199',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeOpen: {
    backgroundColor: 'rgba(160, 243, 153, 0.2)',
  },
  statusBadgeClosed: {
    backgroundColor: 'rgba(226, 226, 231, 0.3)',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(255, 219, 202, 0.2)',
  },
  statusBadgeText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  statusTextOpen: {
    color: '#a0f399',
  },
  statusTextClosed: {
    color: '#c3c6d1',
  },
  statusTextWarning: {
    color: '#ffdbca',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chipText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
});
