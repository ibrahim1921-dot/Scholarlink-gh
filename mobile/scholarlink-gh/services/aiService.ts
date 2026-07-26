import { ApiResponse, ScholarshipMatch } from '../types/api';
import { apiClient } from './apiClient';

export const aiService = {
  async getScholarshipMatches(): Promise<ScholarshipMatch[]> {
    try {
      const response = await apiClient.get<ScholarshipMatch[]>('/api/v1/ai/scholarships/matches');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async checkEligibility(scholarshipId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/api/v1/scholarships/${scholarshipId}/eligibility`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async generatePersonalStatement(scholarshipId?: number, keyPoints: string[] = []): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/ai/personal-statement', {
        scholarshipId,
        keyPoints,
      });
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async reviewEssay(essayText: string, scholarshipId?: number): Promise<any> {
    try {
      const response = await apiClient.post('/api/v1/ai/review-essay', {
        essayText,
        scholarshipId,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async checkOriginality(text: string): Promise<any> {
    try {
      const response = await apiClient.post('/api/v1/ai/check-originality', { text });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async generateCv(): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/ai/generate-cv');
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async generateCoverLetter(jobTitle: string = "", company: string = "", jobDescription: string = ""): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/ai/cover-letter', {
        job_title: jobTitle,
        company,
        job_description: jobDescription,
      });
      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(message);
    }
  },

  async askAssistant(message: string, documentId?: number): Promise<string> {
    try {
      const payload: any = { message };
      if (documentId) {
        payload.document_id = documentId;
      }
      const response = await apiClient.post<ApiResponse>('/api/v1/ai/ask', payload);
      return response.data.message;
    } catch (error: any) {
      console.error("askAssistant error:", error);
      if (error.response) {
        console.error("askAssistant error response status:", error.response.status);
        console.error("askAssistant error response data:", error.response.data);
      }
      const errMessage = error.response?.data?.message || error.message || 'Something went wrong';
      throw new Error(errMessage);
    }
  },
};
