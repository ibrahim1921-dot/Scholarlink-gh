import { useState } from 'react';
import { Alert } from 'react-native';
import { scholarshipService } from '../services/scholarshipService';
import { trackerService } from '../services/trackerService';
import { documentService } from '../services/documentService';
import { Scholarship, DocumentUpload } from '../types/api';

export function useScholarshipApplyFlow() {
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [draftPersonalStatement, setDraftPersonalStatement] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [applyMethodSheetVisible, setApplyMethodSheetVisible] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  const openAssistedFlow = async (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setDraftPersonalStatement('');
    setSelectedDocumentIds([]);
    setApplyModalVisible(true);
    
    setDocsLoading(true);
    try {
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not load documents');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleApply = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setApplyMethodSheetVisible(true);
  };

  const handleGenerateDraft = async () => {
    if (!selectedScholarship) return;
    setDraftLoading(true);
    try {
      const draft = await scholarshipService.generatePersonalStatement(selectedScholarship.id);
      setDraftPersonalStatement(draft);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not generate draft');
    } finally {
      setDraftLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedScholarship) return;
    setApplyingId(selectedScholarship.id);
    setApplyModalVisible(false);
    try {
      // Backend does not currently store documents/personal statement for scholarships.
      // We start tracking the application as IN_PROGRESS via ASSISTED mode.
      await trackerService.createTracker(selectedScholarship.id, 'IN_PROGRESS', 'ASSISTED');
      Alert.alert('Applied!', `Your application for ${selectedScholarship.name} has been submitted.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not apply');
    } finally {
      setApplyingId(null);
    }
  };

  return {
    applyModalVisible, setApplyModalVisible,
    selectedScholarship, setSelectedScholarship,
    documents, setDocuments,
    selectedDocumentIds, setSelectedDocumentIds,
    draftPersonalStatement, setDraftPersonalStatement,
    draftLoading, setDraftLoading,
    docsLoading, setDocsLoading,
    applyMethodSheetVisible, setApplyMethodSheetVisible,
    applyingId, setApplyingId,
    openAssistedFlow,
    handleApply,
    handleGenerateDraft,
    handleFinalSubmit
  };
}
