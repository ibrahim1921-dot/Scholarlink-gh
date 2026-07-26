import { ApiResponse, DisclaimerStatus, DocumentUpload } from '../types/api';
import { apiClient } from './apiClient';

export const documentService = {
  async getDisclaimerStatus(): Promise<DisclaimerStatus> {
    try {
      const response = await apiClient.get<DisclaimerStatus>('/api/v1/documents/disclaimer-status');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async acceptDisclaimer(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/documents/accept-disclaimer');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async getDocuments(): Promise<DocumentUpload[]> {
    try {
      const response = await apiClient.get<DocumentUpload[]>('/api/v1/documents');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async getDocument(id: number): Promise<DocumentUpload> {
    try {
      const response = await apiClient.get<DocumentUpload>(`/api/v1/documents/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async deleteDocument(id: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`/api/v1/documents/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async uploadDocument(
    file: { uri: string; name: string; mimeType?: string | null },
    type: string,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<DocumentUpload> {
    const form = new FormData();
    form.append('type', type);
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'application/octet-stream',
    } as any);

    try {
      const response = await apiClient.post<DocumentUpload>('/api/v1/documents/upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },
};
