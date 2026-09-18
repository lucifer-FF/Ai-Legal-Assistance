import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GitCompare, FileText, ArrowRight, Loader2,
  CheckCircle2, AlertTriangle, Sparkles, Scale, Info
} from 'lucide-react';
import { apiService } from '../services/api';
import { Document, ComparisonResponse, ClauseDiffItem } from '../types';

export const ComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDocA = searchParams.get('docA') || '';
  const initialDocB = searchParams.get('docB') || '';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [docAId, setDocAId] = useState<string>(initialDocA);
  const [docBId, setDocBId] = useState<string>(initialDocB);
  const [comparisonTitle, setComparisonTitle] = useState<string>('');

  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [comparing, setComparing] = useState<boolean>(false);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await apiService.listDocuments();
      setDocuments(res.data);
      // Auto trigger if query params provided
      if (initialDocA && initialDocB && initialDocA !== initialDocB) {
        executeComparison(initialDocA, initialDocB);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const executeComparison = async (idA: string, idB: string, title?: string) => {
    if (!idA || !idB || idA === idB) {
      setErrorMsg('Please select two distinct contracts to compare.');
      return;
    }
    setComparing(true);
    setErrorMsg(null);

    try {
      const res = await apiService.createComparison(idA, idB, title);
      setComparison(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to generate contract comparison.');
    } finally {
      setComparing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeComparison(docAId, docBId, comparisonTitle);
  };

  const handleQuickSeedCompare = async () => {
    try {
      setComparing(true);
      setErrorMsg(null);
      // Seed both V1 and V2
      const docARes = await apiService.seedDemoDocument(1);
      const docBRes = await apiService.seedDemoDocument(2);
      setDocAId(docARes.data.id);
      setDocBId(docBRes.data.id);
      await loadDocuments();
      await executeComparison(
        docARes.data.id,
        docBRes.data.id,
        'Commercial Lease V1 (Standard) vs V2 (Negotiated)'
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to load sample comparison.');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">
            Side-by-Side Contract Comparison
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Detect modifications, additions, and removals between two contract versions across legal categories.
          </p>
        </div>
        <button
          onClick={handleQuickSeedCompare}
          disabled={comparing}
          className="px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Load Demo: Lease V1 vs Lease V2
        </button>
      </div>

      {/* Contract Selector Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document A Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document A (Baseline Contract)
              </label>
              <select
                value={docAId}
                onChange={(e) => setDocAId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Document A...</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.original_filename})
                  </option>
                ))}
              </select>
            </div>

            {/* Document B Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document B (Revised / Counterparty Contract)
              </label>
              <select
                value={docBId}
                onChange={(e) => setDocBId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Document B...</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.original_filename})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!docAId || !docBId || docAId === docBId || comparing}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              {comparing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Structured Comparison...
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" />
                  Compare Contracts
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Comparison Summary */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {comparison.title}
              </h2>
              <span className="text-xs text-slate-500">
                Generated: {new Date(comparison.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
              {comparison.summary}
            </p>

            {/* Key Takeaways */}
            {comparison.key_takeaways && comparison.key_takeaways.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
                  Key Strategic Takeaways
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {comparison.key_takeaways.map((takeaway, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 shadow-subtle flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-slate-800 leading-relaxed">{takeaway}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clause-by-Clause Categorized Comparison */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              Clause-by-Clause Analysis ({comparison.diff_data.length} Categories)
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {comparison.diff_data.map((item, idx) => {
                const statusBadge =
                  item.status === 'MODIFIED'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : item.status === 'ADDED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : item.status === 'REMOVED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusBadge}`}>
                          {item.status}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{item.category}</h4>
                      </div>
                      <div className="text-[11px] text-slate-400 space-x-2">
                        {item.source_doc_a && <span>A: {item.source_doc_a}</span>}
                        {item.source_doc_b && <span>• B: {item.source_doc_b}</span>}
                      </div>
                    </div>

                    {/* Side-by-side text versions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Document A Version
                        </span>
                        <p className="text-slate-800 leading-relaxed">
                          {item.old_version || <span className="italic text-slate-400">Not present in Document A</span>}
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-blue-700 block">
                          Document B Version
                        </span>
                        <p className="text-slate-800 leading-relaxed">
                          {item.new_version || <span className="italic text-slate-400">Not present in Document B</span>}
                        </p>
                      </div>
                    </div>

                    {/* What changed & Potential significance */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 text-[11px] block mb-0.5">
                          What Changed?
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{item.what_changed}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-semibold text-indigo-900 text-[11px] block mb-0.5">
                          Potential Legal & Commercial Significance:
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{item.potential_significance}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
