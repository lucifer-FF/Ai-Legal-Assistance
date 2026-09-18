export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'USER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  processing_status: 'UPLOADING' | 'EXTRACTING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  page_count: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentStatus {
  id: string;
  processing_status: 'UPLOADING' | 'EXTRACTING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  page_count: number;
  word_count: number;
}

export interface Clause {
  id: string;
  category: string;
  title: string;
  original_text: string;
  section_ref: string;
  page_number: number;
  plain_language_explanation: string;
  why_it_matters: string;
  potential_implications: string;
  questions_for_lawyer: string[];
}

export interface RiskFinding {
  id: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  title: string;
  explanation: string;
  why_it_matters: string;
  section_ref: string;
  page_number: number;
  mitigation_suggestion?: string;
}

export interface Obligation {
  id: string;
  party_type: 'USER' | 'COUNTERPARTY' | 'MUTUAL';
  title: string;
  description: string;
  deadline_info?: string;
  consequence_of_breach?: string;
  section_ref: string;
}

export interface ImportantDate {
  id: string;
  event_name: string;
  date_str: string;
  date_type: 'Payment' | 'Renewal' | 'Termination Notice' | 'Deadline' | 'Effective Date' | string;
  section_ref: string;
  action_required?: string;
  consequence_if_missed?: string;
}

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  document_type: string;
  summary: string;
  parties: Array<{ name: string; role: string }>;
  effective_date?: string;
  expiry_date?: string;
  governing_jurisdiction?: string;
  key_terms: Record<string, string>;
  confidence_score: string;
  created_at: string;
}

export interface FullDocumentIntelligence {
  document: Document;
  analysis?: DocumentAnalysis;
  clauses: Clause[];
  risks: RiskFinding[];
  obligations: Obligation[];
  important_dates: ImportantDate[];
}

export interface CitationItem {
  document_id: string;
  chunk_id: string;
  section: string;
  page_number: number;
  text_snippet: string;
}

export interface AskQuestionResponse {
  answer: string;
  why: string;
  source_citation: string;
  citations: CitationItem[];
  confidence: 'High' | 'Medium' | 'Low';
  related_clauses: string[];
  disclaimer: string;
  session_id: string;
}

export interface ExplainClauseResponse {
  original_clause: string;
  plain_language_explanation: string;
  why_it_matters: string;
  potential_implications: string;
  questions_for_lawyer: string[];
  uncertainty_statement: string;
}

export interface LawyerPrepResponse {
  document_summary: string;
  key_concerns: string[];
  important_clauses: Array<{ section: string; title: string; concern: string }>;
  questions_for_lawyer: string[];
  relevant_dates: Array<{ event: string; date: string; notes: string }>;
  information_user_needs_to_provide: string[];
  disclaimer: string;
}

export interface ClauseDiffItem {
  category: string;
  status: 'UNCHANGED' | 'ADDED' | 'REMOVED' | 'MODIFIED';
  old_version?: string;
  new_version?: string;
  what_changed: string;
  potential_significance: string;
  source_doc_a?: string;
  source_doc_b?: string;
}

export interface ComparisonResponse {
  id: string;
  user_id: string;
  doc_a_id: string;
  doc_b_id: string;
  doc_a_title?: string;
  doc_b_title?: string;
  title: string;
  status: string;
  summary: string;
  diff_data: ClauseDiffItem[];
  key_takeaways: string[];
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  is_completed: boolean;
  notes?: string;
  section_ref: string;
  created_at: string;
}

export interface Checklist {
  id: string;
  document_id: string;
  user_id: string;
  title: string;
  created_at: string;
  items: ChecklistItem[];
}

export interface SystemStats {
  total_users: number;
  total_documents: number;
  total_chunks: number;
  total_questions: number;
  total_comparisons: number;
  completed_documents: number;
  failed_documents: number;
  success_rate_percent: number;
  documents_by_type: Record<string, number>;
  risk_distribution: Record<string, number>;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}
