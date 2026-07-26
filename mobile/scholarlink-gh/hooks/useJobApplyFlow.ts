import { useState } from 'react';
import { Alert } from 'react-native';
import { jobService } from '../services/jobService';
import { documentService } from '../services/documentService';
import { JobListing, DocumentUpload } from '../types/api';

export function useJobApplyFlow() {
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [draftCoverLetter, setDraftCoverLetter] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [applyMethodSheetVisible, setApplyMethodSheetVisible] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  const openAssistedFlow = async (job: JobListing) => {
    setSelectedJob(job);
    setDraftCoverLetter('');
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

  const handleApply = (job: JobListing) => {
    setSelectedJob(job);
    setApplyMethodSheetVisible(true);
  };

  const handleGenerateDraft = async () => {
    if (!selectedJob) return;
    setDraftLoading(true);
    try {
      const draft = await jobService.generateCoverLetterDraft(selectedJob.id);
      setDraftCoverLetter(draft);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not generate draft');
    } finally {
      setDraftLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedJob) return;
    setApplyingId(selectedJob.id);
    setApplyModalVisible(false);
    try {
      await jobService.applyToJob(selectedJob.id, draftCoverLetter, selectedDocumentIds);
      Alert.alert('Applied!', `Your application for ${selectedJob.title} has been submitted.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not apply');
    } finally {
      setApplyingId(null);
    }
  };

  return {
    applyModalVisible, setApplyModalVisible,
    selectedJob, setSelectedJob,
    documents, setDocuments,
    selectedDocumentIds, setSelectedDocumentIds,
    draftCoverLetter, setDraftCoverLetter,
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
