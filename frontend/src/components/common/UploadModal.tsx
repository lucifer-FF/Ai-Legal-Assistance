import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Loader2, X, Sparkles, ArrowRight
} from 'lucide-react';
import { apiService } from '../../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentUploaded?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentUploaded,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<'UPLOADING' | 'EXTRACTING' | 'ANALYZING' | 'COMPLETED' | 'FAILED'>('UPLOADING');
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setDocTitle('');
      setIsProcessing(false);
      setErrorMsg(null);
      setUploadedDocId(null);
    }
  }, [isOpen]);

  // Poll status while processing
  useEffect(() => {
    if (!isProcessing || !uploadedDocId || currentStep === 'COMPLETED' || currentStep === 'FAILED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await apiService.getDocumentStatus(uploadedDocId);
        const status = res.data.processing_status;
        setCurrentStep(status);

        if (status === 'COMPLETED') {
          clearInterval(interval);
          if (onDocumentUploaded) onDocumentUploaded();
        } else if (status === 'FAILED') {
          clearInterval(interval);
          setErrorMsg(res.data.error_message || 'Document processing failed.');
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isProcessing, uploadedDocId, currentStep, onDocumentUploaded]);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['pdf', 'docx', 'txt', 'md'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file type (.${ext}). Please upload a PDF, DOCX, or TXT file.`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 20MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!docTitle) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsProcessing(true);
    setCurrentStep('UPLOADING');
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (docTitle.trim()) {
      formData.append('title', docTitle.trim());
    }

    try {
      const res = await apiService.uploadDocument(formData);
      setUploadedDocId(res.data.id);
      setCurrentStep('EXTRACTING');
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.response?.data?.detail || 'Failed to upload document.');
    }
  };

  const handleLoadDemoContract = async (version: number = 1) => {
    setIsProcessing(true);
    setCurrentStep('UPLOADING');
    setErrorMsg(null);

    try {
      const res = await apiService.seedDemoDocument(version);
      setUploadedDocId(res.data.id);
      setCurrentStep('EXTRACTING');
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.response?.data?.detail || 'Failed to seed demo document.');
    }
  };

  const handleViewAnalysis = () => {
    if (uploadedDocId) {
      onClose();
      navigate(`/documents/${uploadedDocId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {isProcessing ? 'Document Intelligence Pipeline' : 'Upload Legal Document'}
            </h3>
            <p className="text-xs text-slate-500">
              PDF, DOCX, or TXT contracts up to 20MB
            </p>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {isProcessing ? (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-3">
                  {currentStep === 'COMPLETED' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-in zoom-in-75" />
                  ) : currentStep === 'FAILED' ? (
                    <AlertCircle className="w-8 h-8 text-rose-600" />
                  ) : (
                    <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  )}
                </div>
                <h4 className="text-base font-semibold text-slate-900">
                  {currentStep === 'UPLOADING' && 'Securing & Storing Document...'}
                  {currentStep === 'EXTRACTING' && 'Extracting Clauses & Structure...'}
                  {currentStep === 'ANALYZING' && 'Analyzing Risks & Gemini Reasoning...'}
                  {currentStep === 'COMPLETED' && 'Analysis Ready!'}
                  {currentStep === 'FAILED' && 'Processing Failed'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {currentStep === 'COMPLETED'
                    ? 'Document categorized, risks classified, and clauses indexed for RAG Q&A.'
                    : currentStep === 'FAILED'
                    ? errorMsg || 'An error occurred during extraction.'
                    : 'Parsing document sections, calculating vector embeddings, and structuring key terms.'}
                </p>
              </div>

              {/* Step Progress Checklist */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${['EXTRACTING', 'ANALYZING', 'COMPLETED'].includes(currentStep) ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                  <span className={['EXTRACTING', 'ANALYZING', 'COMPLETED'].includes(currentStep) ? 'text-slate-700 font-medium' : 'text-slate-900 font-semibold'}>
                    1. Document validation & chunk extraction
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${['ANALYZING', 'COMPLETED'].includes(currentStep) ? 'bg-emerald-500' : currentStep === 'EXTRACTING' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className={['ANALYZING', 'COMPLETED'].includes(currentStep) ? 'text-slate-700 font-medium' : currentStep === 'EXTRACTING' ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                    2. Semantic vector embeddings calculation
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${currentStep === 'COMPLETED' ? 'bg-emerald-500' : currentStep === 'ANALYZING' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className={currentStep === 'COMPLETED' ? 'text-slate-700 font-medium' : currentStep === 'ANALYZING' ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                    3. Gemini 3.8 Flash legal intelligence & risk classification
                  </span>
                </div>
              </div>

              {/* Actions when completed or failed */}
              {currentStep === 'COMPLETED' && (
                <button
                  onClick={handleViewAnalysis}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all"
                >
                  View Legal Intelligence Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 'FAILED' && (
                <button
                  onClick={() => setIsProcessing(false)}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-sm transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 mb-2">
                  {selectedFile ? <FileText className="w-5 h-5 text-emerald-600" /> : <Upload className="w-5 h-5" />}
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 truncate max-w-xs mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <span className="inline-block mt-2 text-[11px] text-blue-600 font-medium underline">
                      Click to change file
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Drag and drop your contract here, or <span className="text-blue-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports Lease, NDA, Employment, SaaS terms (PDF, DOCX, TXT)
                    </p>
                  </div>
                )}
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Commercial Lease Agreement 2024"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedFile}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Analyze Document
              </button>

              {/* One-Click Hackathon Sample Contract Section */}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-center text-[11px] font-medium text-slate-500 mb-2">
                  Or load a pre-configured sample contract for testing:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadDemoContract(1)}
                    className="px-2.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Load Lease V1 (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadDemoContract(2)}
                    className="px-2.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Load Lease V2 (Amended)
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
