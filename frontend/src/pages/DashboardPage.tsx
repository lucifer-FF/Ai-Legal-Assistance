import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Sparkles, AlertTriangle, CheckCircle2,
  Clock, ArrowUpRight, Search, Trash2, Download,
  GitCompare, Shield, Loader2, Plus
} from 'lucide-react';
import { apiService } from '../services/api';
import { Document } from '../types';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [seedingDemo, setSeedingDemo] = useState<boolean>(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await apiService.listDocuments();
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiService.deleteDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleExportPdf = async (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    try {
      const res = await apiService.exportDocumentPdf(doc.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LexiGuard_${doc.title.replace(/\s+/g, '_')}_Report.pdf`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  const handleSeedDemo = async (version: number = 1) => {
    try {
      setSeedingDemo(true);
      await apiService.seedDemoDocument(version);
      await fetchDocs();
    } catch (err) {
      console.error('Failed to seed demo document:', err);
    } finally {
      setSeedingDemo(false);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = documents.filter((d) => d.processing_status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">
            Welcome back, {user?.full_name || 'Counsel'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            LexiGuard Legal Intelligence Dashboard • Active Role: <span className="font-semibold text-slate-700">{user?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSeedDemo(1)}
            disabled={seedingDemo}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            {seedingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
            + Load Demo Contract
          </button>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Analyze Document
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Documents Analyzed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{documents.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium">({completedCount} active)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Processing Success</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {documents.length > 0 ? `${Math.round((completedCount / documents.length) * 100)}%` : '100%'}
            </span>
            <span className="text-[11px] text-slate-400">Zero timeouts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Contract Diff Engine</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GitCompare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">Active</span>
            <Link to="/compare" className="text-[11px] text-blue-600 hover:underline">
              Compare 2 Docs →
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">AI Intelligence Core</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-900">Gemini 3.8 Flash</span>
            <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">
              Grounded
            </span>
          </div>
        </div>
      </div>

      {/* Documents Library Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">Legal Documents</h2>
            <p className="text-xs text-slate-500">Manage and inspect uploaded agreements</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs">Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No documents found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Upload an agreement or click below to seed a realistic commercial lease agreement with pre-analyzed risks and RAG citations.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => handleSeedDemo(1)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200"
              >
                Load Sample Contract
              </button>
              <button
                onClick={onOpenUpload}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Upload File
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Length</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 truncate max-w-sm">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {doc.original_filename}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 uppercase font-medium text-[11px] text-slate-500">
                      {doc.file_type}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'} ({doc.word_count} words)
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          doc.processing_status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : doc.processing_status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                        }`}
                      >
                        {doc.processing_status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                        {doc.processing_status === 'FAILED' && <AlertTriangle className="w-3 h-3" />}
                        {['UPLOADING', 'EXTRACTING', 'ANALYZING'].includes(doc.processing_status) && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                        {doc.processing_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleExportPdf(e, doc)}
                          title="Export PDF Report"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, doc.id)}
                          title="Delete Document"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Inspect
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
