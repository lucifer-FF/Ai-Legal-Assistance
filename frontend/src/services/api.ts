import axios from 'axios';
import {
  User, Document, DocumentStatus, FullDocumentIntelligence,
  AskQuestionResponse, ExplainClauseResponse, LawyerPrepResponse,
  ComparisonResponse, Checklist, ChecklistItem, SystemStats, AuditLog
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lexiguard_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lexiguard_token');
      localStorage.removeItem('lexiguard_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const apiService = {
  // Auth
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  adminLogin: (data: any) => api.post('/auth/admin/login', data),
  getMe: () => api.get<User>('/users/me'),

  // Documents
  uploadDocument: (formData: FormData) =>
    api.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  seedDemoDocument: (version: number = 1) =>
    api.post<Document>(`/documents/demo-seed?version=${version}`),
  listDocuments: () => api.get<Document[]>('/documents'),
  getDocument: (id: string) => api.get<Document>(`/documents/${id}`),
  getDocumentStatus: (id: string) => api.get<DocumentStatus>(`/documents/${id}/status`),
  deleteDocument: (id: string) => api.delete(`/documents/${id}`),
  exportDocumentPdf: (id: string) =>
    api.get(`/documents/${id}/export`, { responseType: 'blob' }),

  // Legal Intelligence
  getFullIntelligence: (id: string) =>
    api.get<FullDocumentIntelligence>(`/documents/${id}/full-intelligence`),

  // AI & RAG
  askQuestion: (documentId: string, question: string, sessionId?: string) =>
    api.post<AskQuestionResponse>(`/ai/documents/${documentId}/ask`, {
      question,
      session_id: sessionId,
    }),
  getChatHistory: (documentId: string) =>
    api.get<any[]>(`/ai/documents/${documentId}/chat-history`),
  explainClause: (documentId: string, clauseText: string, sectionRef?: string) =>
    api.post<ExplainClauseResponse>(`/ai/documents/${documentId}/explain-clause`, {
      clause_text: clauseText,
      section_ref: sectionRef,
    }),
  prepareLawyerBrief: (documentId: string) =>
    api.get<LawyerPrepResponse>(`/ai/documents/${documentId}/prepare-lawyer`),

  // Comparison
  createComparison: (docAId: string, docBId: string, title?: string) =>
    api.post<ComparisonResponse>('/comparisons', {
      doc_a_id: docAId,
      doc_b_id: docBId,
      title,
    }),
  listComparisons: () => api.get<ComparisonResponse[]>('/comparisons'),
  getComparison: (id: string) => api.get<ComparisonResponse>(`/comparisons/${id}`),

  // Checklist
  getChecklist: (documentId: string) =>
    api.get<Checklist>(`/documents/${documentId}/checklist`),
  addChecklistItem: (documentId: string, item: any) =>
    api.post<ChecklistItem>(`/documents/${documentId}/checklist/items`, item),
  updateChecklistItem: (itemId: string, data: any) =>
    api.patch<ChecklistItem>(`/checklist/items/${itemId}`, data),
  deleteChecklistItem: (itemId: string) =>
    api.delete(`/checklist/items/${itemId}`),

  // Admin
  getAdminStats: () => api.get<SystemStats>('/admin/statistics'),
  getAdminUsers: () => api.get<User[]>('/admin/users'),
  getAdminDocuments: () => api.get<Document[]>('/admin/documents'),
  getAdminActivity: () => api.get<AuditLog[]>('/admin/activity'),
};
