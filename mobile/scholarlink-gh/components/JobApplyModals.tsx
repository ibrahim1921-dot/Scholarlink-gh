import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, SafeAreaView, Linking, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useJobApplyFlow } from '../hooks/useJobApplyFlow';

type JobApplyModalsProps = ReturnType<typeof useJobApplyFlow>;

export function JobApplyModals({
  applyModalVisible, setApplyModalVisible,
  selectedJob,
  documents,
  selectedDocumentIds, setSelectedDocumentIds,
  draftCoverLetter, setDraftCoverLetter,
  draftLoading,
  docsLoading,
  applyMethodSheetVisible, setApplyMethodSheetVisible,
  applyingId,
  openAssistedFlow,
  handleGenerateDraft,
  handleFinalSubmit
}: JobApplyModalsProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Modal visible={applyMethodSheetVisible} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose Application Method</Text>
              <Pressable onPress={() => setApplyMethodSheetVisible(false)}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>
            <Text style={styles.sheetSubtitle}>How would you like to apply for this job?</Text>

            <Pressable 
              style={[styles.sheetItem, !selectedJob?.applicationUrl && { opacity: 0.5 }]}
              disabled={!selectedJob?.applicationUrl}
              onPress={() => {
                setApplyMethodSheetVisible(false);
                if (selectedJob?.applicationUrl) {
                  const url = selectedJob.applicationUrl.startsWith('http') ? selectedJob.applicationUrl : `https://${selectedJob.applicationUrl}`;
                  Linking.openURL(url).catch(() => Alert.alert('Error', "Couldn't open link"));
                }
              }}
            >
              <Ionicons name="open-outline" size={24} color={!selectedJob?.applicationUrl ? colors.muted : colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.sheetItemText, !selectedJob?.applicationUrl && { color: colors.muted }]}>Apply Directly (External Portal)</Text>
                <Text style={styles.sheetItemSubtext}>
                  {!selectedJob?.applicationUrl ? "Not available for this job" : "Takes you to the company's website"}
                </Text>
              </View>
            </Pressable>

            <Pressable 
              style={[styles.sheetItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setApplyMethodSheetVisible(false);
                if (selectedJob) openAssistedFlow(selectedJob);
              }}
            >
              <Ionicons name="sparkles-outline" size={24} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetItemText}>Apply via ScholarLink GH</Text>
                <Text style={styles.sheetItemSubtext}>Assisted Application with AI features</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Assisted Application Modal */}
      <Modal
        visible={applyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply: {selectedJob?.title}</Text>
            <Pressable onPress={() => setApplyModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentInner}>
            <Text style={styles.sectionTitle}>1. Attach Documents</Text>
            {docsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : documents.length > 0 ? (
              <View style={styles.docsList}>
                {documents.map(doc => {
                  const isSelected = selectedDocumentIds.includes(doc.id);
                  return (
                    <Pressable
                      key={doc.id}
                      style={[styles.docItem, isSelected && styles.docItemActive]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedDocumentIds(prev => prev.filter(id => id !== doc.id));
                        } else {
                          setSelectedDocumentIds(prev => [...prev, doc.id]);
                        }
                      }}
                    >
                      <Ionicons 
                        name={isSelected ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={isSelected ? colors.primary : colors.muted} 
                      />
                      <View style={styles.docItemTextWrap}>
                        <Text style={[styles.docItemTitle, isSelected && { color: colors.primary }]}>{doc.filename}</Text>
                        <Text style={styles.docItemSubtitle}>{doc.document_type}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyDocsText}>No documents in your Vault. You can submit without documents or add them in your Profile.</Text>
            )}

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>2. Cover Letter</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.subsectionSubtitle}>Review and edit your cover letter.</Text>
              <Pressable style={styles.btnSmallGenerate} onPress={handleGenerateDraft} disabled={draftLoading}>
                {draftLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="color-wand" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.btnSmallGenerateText}>AI Draft</Text>
                  </>
                )}
              </Pressable>
            </View>
            <TextInput
              style={styles.coverLetterInput}
              multiline
              placeholder="Write your cover letter here..."
              placeholderTextColor={colors.muted}
              value={draftCoverLetter}
              onChangeText={setDraftCoverLetter}
              textAlignVertical="top"
            />
          </ScrollView>
          <View style={styles.modalFooter}>
            <Pressable 
              style={[styles.btnPrimaryLg, applyingId === selectedJob?.id && { opacity: 0.7 }]} 
              onPress={handleFinalSubmit}
              disabled={applyingId === selectedJob?.id}
            >
              <Text style={styles.btnPrimaryLgText}>Submit Application</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 198, 209, 0.3)',
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: colors.ink,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: colors.primary,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(195, 198, 209, 0.3)',
    marginVertical: 16,
  },
  docsList: {
    gap: 8,
    marginBottom: 16,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.4)',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  docItemActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 51, 102, 0.05)',
  },
  docItemTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  docItemTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  docItemSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
  emptyDocsText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  subsectionSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    color: colors.muted,
    flex: 1,
  },
  btnSmallGenerate: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnSmallGenerateText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
  coverLetterInput: {
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.5)',
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.ink,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 198, 209, 0.3)',
    backgroundColor: '#ffffff',
  },
  btnPrimaryLg: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryLgText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: colors.ink,
  },
  sheetSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    marginBottom: 16,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 198, 209, 0.3)',
  },
  sheetItemText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  sheetItemSubtext: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
});
