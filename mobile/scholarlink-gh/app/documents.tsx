import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, Pressable, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Stack, useFocusEffect } from "expo-router";

import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateView';
import { colors } from '../constants/colors';
import { documentTypes } from '../constants/options';
import { documentService } from '../services/documentService';
import { DocumentUpload } from '../types/api';
import { useDisclaimer } from '../hooks/useDisclaimer';
import { DocumentCard } from '../components/documents/DocumentCard';

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const [docs, setDocs] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocType, setSelectedDocType] = useState<string>(documentTypes[0]);
  const [refreshing, setRefreshing] = useState(false);

  const { isAccepted, isFetchingStatus, isAccepting, acceptDisclaimer, refreshStatus } = useDisclaimer();

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

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
            // ignore error while polling
          }
        }
      }

      if (updatedAny) {
        setDocs(updatedDocs);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [docs]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [documents] = await Promise.all([
        documentService.getDocuments(),
        refreshStatus(),
      ]);
      setDocs(documents);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [documents] = await Promise.all([
        documentService.getDocuments(),
        refreshStatus(),
      ]);
      setDocs(documents);
    } catch (e: any) {
      // errors handled by error state if needed, or silent for refresh
    } finally {
      setRefreshing(false);
    }
  };

  const upload = async () => {
    // expo-document-picker must be installed to use this feature
    let DocumentPicker: typeof import('expo-document-picker');
    try {
      DocumentPicker = require('expo-document-picker');
    } catch {
      Alert.alert('Not Available', 'Document picker is not installed. Please install expo-document-picker.');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({ 
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'], 
      copyToCacheDirectory: true 
    });
    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];

    // Client-side validation: Max 10MB
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
  if (loading || isFetchingStatus) return <Screen scroll={false}><LoadingState /></Screen>;
  if (error) return <Screen scroll={false}><ErrorState message={error} onRetry={fetchAll} /></Screen>;

  if (!isAccepted) {
    return (
      <Screen>
        <SectionHeader title="Document Disclaimer" subtitle="By uploading documents, you agree that AI verification will be used to confirm document authenticity." />
        <AppButton title={isAccepting ? "Accepting..." : "I understand and agree"} onPress={acceptDisclaimer} disabled={isAccepting} />
      </Screen>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Document Vault</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Introduction */}
        <View style={styles.introBox}>
          <MaterialIcons name="verified-user" size={24} color="#003366" />
          <Text style={styles.introText}>
            Your documents are protected with bank-grade encryption. We use AI verification to speed up your scholarship eligibility checks.
          </Text>
        </View>

        {/* Document Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Document Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            {documentTypes.map((tab) => (
              <Pressable 
                key={tab} 
                style={[styles.tabBtn, selectedDocType === tab ? styles.tabBtnActive : styles.tabBtnInactive]}
                onPress={() => setSelectedDocType(tab)}
              >
                <Text style={[styles.tabBtnText, selectedDocType === tab ? styles.tabBtnTextActive : styles.tabBtnTextInactive]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Upload Area */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.uploadArea} onPress={upload} disabled={uploading} activeOpacity={0.8}>
            <View style={styles.uploadIconContainer}>
              <Ionicons name={uploading ? "reload" : "cloud-upload"} size={32} color={colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>{uploading ? `Uploading... ${uploadProgress}%` : "Tap to upload files here"}</Text>
            <Text style={styles.uploadSubtitle}>PDF, JPG, or PNG (Max 10MB)</Text>
          </TouchableOpacity>
        </View>

        {/* Uploaded Documents List */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Documents</Text>
          </View>

          {docs.length === 0 ? (
            <EmptyState title="No documents found" message="Upload your first document to get started." />
          ) : (
            <View style={styles.docsList}>
              {docs.map((item) => (
                <DocumentCard key={item.id} item={item} onDelete={deleteDocument} />
              ))}
            </View>
          )}
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
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: colors.primary,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  introBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 51, 102, 0.1)', // primary-container/10
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.3)',
    gap: 12,
    marginBottom: 24,
  },
  introText: {
    flex: 1,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: colors.primary,
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabBtnInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  tabBtnText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  tabBtnTextInactive: {
    color: colors.muted,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: 'rgba(195, 198, 209, 0.8)',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#ffffff', // surface-container-lowest
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(0, 51, 102, 0.1)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.ink,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: colors.muted,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  docsList: {
    gap: 16,
  },
});
