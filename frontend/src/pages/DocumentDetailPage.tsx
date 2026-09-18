import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText, Shield, AlertTriangle, CheckCircle2,
  Calendar, Users, Scale, MessageSquare, ListChecks,
  Briefcase, Download, ArrowLeft, Loader2, Send,
  HelpCircle, ChevronRight, Sparkles, AlertCircle, Plus
} from 'lucide-react';
import { apiService } from '../services/api';
import {
  FullDocumentIntelligence, Clause, RiskFinding,
  Obligation, ImportantDate, DocumentAnalysis,
  AskQuestionResponse, ExplainClauseResponse,
  LawyerPrepResponse, Checklist, ChecklistItem
} from '../types';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'risks' | 'obligations' | 'dates' | 'clauses' | 'chat' | 'checklist' | 'lawyer_prep'
  >('overview');

  const [intelligence, setIntelligence] = useState<FullDocumentIntelligence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Clause Explainer state
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [customClauseText, setCustomClauseText] = useState<string>('');
  const [explainingClause, setExplainingClause] = useState<boolean>(false);
  const [customClauseResult, setCustomClauseResult] = useState<ExplainClauseResponse | null>(null);

  // RAG Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; data?: AskQuestionResponse }>>([]);
  const [questionInput, setQuestionInput] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);

  // Checklist state
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState<string>('');
  const [addingChecklistItem, setAddingChecklistItem] = useState<boolean>(false);

  // Lawyer Prep state
  const [lawyerPrep, setLawyerPrep] = useState<LawyerPrepResponse | null>(null);
  const [loadingPrep, setLoadingPrep] = useState<boolean>(false);

  // Initial Load
  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiService.getFullIntelligence(id);
      setIntelligence(res.data);
      if (res.data.clauses.length > 0) {
        setSelectedClause(res.data.clauses[0]);
      }
      // Load checklist
      const chkRes = await apiService.getChecklist(id);
      setChecklist(chkRes.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to load document intelligence.');
    } finally {
      setLoading(false);
    }
  };

  // Chat Submission
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || !id || isAsking) return;

    const q = questionInput.trim();
    setQuestionInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setIsAsking(true);

    try {
      const res = await apiService.askQuestion(id, q);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.data.answer, data: res.data },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an error while searching the document chunks. Please try again.',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // Explain Custom Clause
  const handleExplainCustomClause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClauseText.trim() || !id || explainingClause) return;

    setExplainingClause(true);
    setCustomClauseResult(null);

    try {
      const res = await apiService.explainClause(id, customClauseText);
      setCustomClauseResult(res.data);
    } catch (err) {
      console.error('Failed to explain clause:', err);
    } finally {
      setExplainingClause(false);
    }
  };

  // Toggle Checklist Item
  const handleToggleChecklistItem = async (item: ChecklistItem) => {
    if (!checklist) return;
    try {
      const updated = await apiService.updateChecklistItem(item.id, {
        is_completed: !item.is_completed,
      });
      setChecklist({
        ...checklist,
        items: checklist.items.map((i) => (i.id === item.id ? updated.data : i)),
      });
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  // Add Custom Checklist Item
  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !id || !checklist) return;

    try {
      setAddingChecklistItem(true);
      const res = await apiService.addChecklistItem(id, {
        title: newChecklistTitle.trim(),
        priority: 'MEDIUM',
        category: 'Custom Verification',
      });
      setChecklist({
        ...checklist,
        items: [...checklist.items, res.data],
      });
      setNewChecklistTitle('');
    } catch (err) {
      console.error('Failed to add checklist item:', err);
    } finally {
      setAddingChecklistItem(false);
    }
  };

  // Load Lawyer Prep
  const handleLoadLawyerPrep = async () => {
    if (!id) return;
    try {
      setLoadingPrep(true);
      const res = await apiService.prepareLawyerBrief(id);
      setLawyerPrep(res.data);
    } catch (err) {
      console.error('Failed to load lawyer prep:', err);
    } finally {
      setLoadingPrep(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!id || !intelligence) return;
    try {
      const res = await apiService.exportDocumentPdf(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LexiGuard_${intelligence.document.title.replace(/\s+/g, '_')}_Report.pdf`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-slate-800">Loading Document Intelligence...</h2>
        <p className="text-xs text-slate-500 mt-1">Retrieving semantic sections and classified risk matrices.</p>
      </div>
    );
  }

  if (errorMsg || !intelligence) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 font-serif">Unable to Load Document</h2>
        <p className="text-xs text-slate-600 mt-1 mb-4">{errorMsg || 'Document not found.'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { document: doc, analysis, risks, obligations, important_dates: dates, clauses } = intelligence;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-card">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {analysis?.document_type || doc.file_type.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{doc.page_count} pages</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{doc.word_count} words</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-serif mt-1">
              {doc.title}
            </h1>
            <p className="text-xs text-slate-500">
              File: {doc.original_filename} • Analyzed by Gemini 3.8 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/compare?docA=${doc.id}`}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Scale className="w-4 h-4 text-indigo-600" />
            Compare Document
          </Link>
          <button
            onClick={handleExportPdf}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Legal PDF Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 rounded-t-xl px-4 flex overflow-x-auto gap-1">
        {[
          { id: 'overview', label: 'Overview', icon: FileText },
          { id: 'risks', label: `Risks (${risks.length})`, icon: AlertTriangle },
          { id: 'obligations', label: `Obligations (${obligations.length})`, icon: Users },
          { id: 'dates', label: `Key Dates (${dates.length})`, icon: Calendar },
          { id: 'clauses', label: `Clause Explainer (${clauses.length})`, icon: Scale },
          { id: 'chat', label: 'AI Document Assistant (RAG)', icon: MessageSquare },
          { id: 'checklist', label: 'Checklist', icon: ListChecks },
          { id: 'lawyer_prep', label: 'Prepare for Lawyer', icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'lawyer_prep' && !lawyerPrep) {
                  handleLoadLawyerPrep();
                }
              }}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 shadow-card min-h-[500px]">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif mb-2">Executive Summary</h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {analysis?.summary || 'Summary unavailable.'}
              </p>
            </div>

            {/* Contract Vitals */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Effective Date</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {analysis?.effective_date || 'Unspecified'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Expiry / Term</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {analysis?.expiry_date || 'Unspecified'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Governing Law</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {analysis?.governing_jurisdiction || 'Unspecified'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Parties Identified</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {analysis?.parties?.length || 2} Identified Parties
                </p>
              </div>
            </div>

            {/* Contracting Parties */}
            {analysis?.parties && analysis.parties.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif mb-2">Contracting Parties</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.parties.map((p, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500">{p.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Commercial Terms Grid */}
            {analysis?.key_terms && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif mb-3">Key Terms & Clauses Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(analysis.key_terms).map(([k, v]) => (
                    <div key={k} className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        {k.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. RISKS TAB */}
        {activeTab === 'risks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">Classified Legal Risks</h3>
                <p className="text-xs text-slate-500">
                  Potential exposures, non-reciprocal clauses, and harsh liquidated penalties detected in this document.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {risks.map((risk) => (
                <div
                  key={risk.id}
                  className={`p-4 rounded-xl border ${
                    risk.level === 'HIGH'
                      ? 'bg-rose-50/40 border-rose-200'
                      : risk.level === 'MEDIUM'
                      ? 'bg-amber-50/40 border-amber-200'
                      : risk.level === 'LOW'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-sky-50/40 border-sky-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          risk.level === 'HIGH'
                            ? 'badge-high'
                            : risk.level === 'MEDIUM'
                            ? 'badge-medium'
                            : risk.level === 'LOW'
                            ? 'badge-low'
                            : 'badge-informational'
                        }`}
                      >
                        {risk.level} RISK
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{risk.title}</h4>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 shrink-0">
                      {risk.section_ref} {risk.page_number ? `(Page ${risk.page_number})` : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    {risk.explanation}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/70 p-2.5 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-800 text-[11px] block mb-0.5">Why it matters:</span>
                      <span className="text-slate-600 text-[11px] leading-relaxed">{risk.why_it_matters}</span>
                    </div>
                    {risk.mitigation_suggestion && (
                      <div className="bg-white/70 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-semibold text-blue-800 text-[11px] block mb-0.5">Mitigation Suggestion:</span>
                        <span className="text-slate-600 text-[11px] leading-relaxed">{risk.mitigation_suggestion}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. OBLIGATIONS TAB */}
        {activeTab === 'obligations' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">Contractual Obligations</h3>
              <p className="text-xs text-slate-500">
                Segregated responsibilities between your organization and the counterparty.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Obligations */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-blue-700 uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  Your Obligations ({obligations.filter((o) => o.party_type === 'USER').length})
                </div>
                {obligations
                  .filter((o) => o.party_type === 'USER')
                  .map((ob) => (
                    <div key={ob.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-slate-900">{ob.title}</h5>
                        <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {ob.section_ref}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{ob.description}</p>
                      {ob.deadline_info && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Deadline: <span className="text-slate-800">{ob.deadline_info}</span>
                        </p>
                      )}
                      {ob.consequence_of_breach && (
                        <p className="text-[11px] text-rose-600 font-medium">
                          Breach impact: {ob.consequence_of_breach}
                        </p>
                      )}
                    </div>
                  ))}
              </div>

              {/* Counterparty Obligations */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" />
                  Counterparty Obligations ({obligations.filter((o) => o.party_type !== 'USER').length})
                </div>
                {obligations
                  .filter((o) => o.party_type !== 'USER')
                  .map((ob) => (
                    <div key={ob.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-slate-900">{ob.title}</h5>
                        <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {ob.section_ref}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{ob.description}</p>
                      {ob.deadline_info && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Deadline: <span className="text-slate-800">{ob.deadline_info}</span>
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. IMPORTANT DATES TAB */}
        {activeTab === 'dates' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">Critical Deadlines & Timelines</h3>
              <p className="text-xs text-slate-500">
                Notice cutoff windows, renewal triggers, and payment deadlines extracted from the contract.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dates.map((d) => (
                <div key={d.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {d.date_type}
                    </span>
                    <span className="text-[11px] text-slate-500">{d.section_ref}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{d.event_name}</h4>
                  <div className="p-2 bg-white rounded border border-slate-200 font-semibold text-blue-900">
                    {d.date_str}
                  </div>
                  {d.action_required && (
                    <p className="text-slate-600">
                      <span className="font-semibold text-slate-800">Action:</span> {d.action_required}
                    </p>
                  )}
                  {d.consequence_if_missed && (
                    <p className="text-rose-600 text-[11px]">
                      <span className="font-semibold">If missed:</span> {d.consequence_if_missed}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. CLAUSE EXPLAINER TAB */}
        {activeTab === 'clauses' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">Interactive Clause Explainer</h3>
              <p className="text-xs text-slate-500">
                Select any clause below or paste custom legal language to get plain-English explanations and lawyer inquiry questions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Clause List Left Column */}
              <div className="lg:col-span-4 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                  Extracted Clauses
                </span>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {clauses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedClause(c);
                        setCustomClauseResult(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                        selectedClause?.id === c.id && !customClauseResult
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                        <span className="font-bold text-blue-700 uppercase">{c.category}</span>
                        <span>{c.section_ref}</span>
                      </div>
                      <p className="font-bold text-slate-900 truncate">{c.title}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clause Detail Right Column */}
              <div className="lg:col-span-8 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                {customClauseResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 uppercase">Custom Clause Explanation</span>
                      <button
                        onClick={() => setCustomClauseResult(null)}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        Back to document clause
                      </button>
                    </div>

                    <div className="p-3 bg-white rounded border border-slate-200 text-xs italic text-slate-700">
                      "{customClauseResult.original_clause}"
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <h5 className="font-bold text-slate-900 mb-1">Plain Language Translation</h5>
                        <p className="text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-200">
                          {customClauseResult.plain_language_explanation}
                        </p>
                      </div>

                      <div>
                        <h5 className="font-bold text-slate-900 mb-1">Why Does This Matter?</h5>
                        <p className="text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-200">
                          {customClauseResult.why_it_matters}
                        </p>
                      </div>

                      <div>
                        <h5 className="font-bold text-slate-900 mb-1">Potential Implications</h5>
                        <p className="text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-200">
                          {customClauseResult.potential_implications}
                        </p>
                      </div>

                      <div>
                        <h5 className="font-bold text-slate-900 mb-1">Questions for a Qualified Attorney</h5>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700 bg-white p-3 rounded border border-slate-200">
                          {customClauseResult.questions_for_lawyer.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : selectedClause ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          {selectedClause.category}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{selectedClause.title}</h4>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                        {selectedClause.section_ref} • Page {selectedClause.page_number}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">Original Clause Text:</span>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed max-h-36 overflow-y-auto">
                        {selectedClause.original_text}
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block mb-1">Explain This in Simple Language:</span>
                        <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                          {selectedClause.plain_language_explanation}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-900 block mb-1">Why Does This Matter?</span>
                        <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                          {selectedClause.why_it_matters}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-900 block mb-1">Potential Implications:</span>
                        <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                          {selectedClause.potential_implications}
                        </p>
                      </div>

                      {selectedClause.questions_for_lawyer && selectedClause.questions_for_lawyer.length > 0 && (
                        <div>
                          <span className="font-bold text-blue-900 block mb-1">Questions You May Want to Ask a Lawyer:</span>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700 bg-blue-50/40 p-3 rounded-lg border border-blue-200">
                            {selectedClause.questions_for_lawyer.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Custom Clause Input Form */}
                <div className="pt-4 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">
                    Paste Any Custom Clause or Addendum to Explain:
                  </span>
                  <form onSubmit={handleExplainCustomClause} className="space-y-2">
                    <textarea
                      rows={3}
                      value={customClauseText}
                      onChange={(e) => setCustomClauseText(e.target.value)}
                      placeholder="Paste contract clause text here..."
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!customClauseText.trim() || explainingClause}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      {explainingClause ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Explain Custom Clause
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. AI ASSISTANT (RAG) TAB */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">Grounded Document Q&A Assistant</h3>
                <p className="text-xs text-slate-500">
                  Ask any question about obligations, early termination, rent, or indemnities. All answers cite specific sections.
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                RAG Grounded in Document Chunks
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-400 self-center text-[11px]">Suggested questions:</span>
              {[
                "What happens if I terminate this contract early?",
                "What are my payment obligations and late fees?",
                "How does the renewal and notice window work?",
                "What is the governing jurisdiction and dispute venue?"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestionInput(chip)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition-colors border border-slate-200"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Conversation Scroll */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No questions asked yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                    Try asking: "What happens if I terminate this agreement early?" to see verified citations in action.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-2xl p-4 rounded-xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm space-y-3'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p>{msg.text}</p>
                      ) : (
                        <>
                          {/* ANSWER */}
                          <div>
                            <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1 text-blue-700">
                              Direct Answer
                            </span>
                            <p className="font-medium text-slate-900">{msg.text}</p>
                          </div>

                          {/* WHY / EXPLANATION */}
                          {msg.data?.why && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">
                                Explanation
                              </span>
                              <p className="text-slate-600">{msg.data.why}</p>
                            </div>
                          )}

                          {/* SOURCE CITATIONS */}
                          {msg.data && (
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-700 text-[11px]">Source:</span>
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                                  {msg.data.source_citation}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 text-[10px]">Confidence:</span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                                  {msg.data.confidence}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* RELATED CLAUSES */}
                          {msg.data?.related_clauses && msg.data.related_clauses.length > 0 && (
                            <div className="text-[10px] text-slate-500">
                              Related: {msg.data.related_clauses.join(', ')}
                            </div>
                          )}

                          {/* DISCLAIMER */}
                          <div className="text-[9px] text-slate-400 italic pt-1 border-t border-slate-100">
                            {msg.data?.disclaimer || 'Informational assistance only. Does not constitute legal advice.'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isAsking && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 max-w-xs text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Searching vector chunks & formulating citation...</span>
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleAskQuestion} className="flex gap-2">
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Ask a question about this contract (e.g. 'Can I terminate early?')..."
                className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="submit"
                disabled={!questionInput.trim() || isAsking}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
                Ask Assistant
              </button>
            </form>
          </div>
        )}

        {/* 7. CHECKLIST TAB */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">Actionable Review Checklist</h3>
                <p className="text-xs text-slate-500">
                  Verification tasks generated strictly from the document clauses. Check items off as completed.
                </p>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2.5">
              {checklist?.items && checklist.items.length > 0 ? (
                checklist.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklistItem(item)}
                    className={`p-3.5 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors text-xs ${
                      item.is_completed
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-subtle'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => {}} // Handled by container click
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${
                            item.is_completed ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              item.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.priority}
                          </span>
                          <span className="text-[10px] text-slate-400">{item.section_ref}</span>
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">{item.description}</p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-blue-700 mt-1 italic">Note: {item.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4">No checklist items generated.</p>
              )}
            </div>

            {/* Add Custom Item Form */}
            <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="Add custom legal check or task..."
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="submit"
                disabled={!newChecklistTitle.trim() || addingChecklistItem}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </form>
          </div>
        )}

        {/* 8. LAWYER PREP TAB */}
        {activeTab === 'lawyer_prep' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">Prepare for a Qualified Lawyer</h3>
                <p className="text-xs text-slate-500">
                  A structured dossier summarizing key exposures and targeted questions to maximize your consultation efficiency.
                </p>
              </div>
              <button
                onClick={handleLoadLawyerPrep}
                disabled={loadingPrep}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200"
              >
                {loadingPrep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                Refresh Dossier
              </button>
            </div>

            {loadingPrep ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <span>Formulating counsel consultation dossier...</span>
              </div>
            ) : lawyerPrep ? (
              <div className="space-y-6">
                {/* Executive Dossier Summary */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                    Counsel Briefing Summary
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{lawyerPrep.document_summary}</p>
                </div>

                {/* Questions for Lawyer */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    Targeted Questions to Ask Your Attorney
                  </h4>
                  <div className="space-y-2">
                    {lawyerPrep.questions_for_lawyer.map((q, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-800 shadow-subtle flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Legal Concerns */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Key Concerns & Ambiguities
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 bg-rose-50/30 p-3.5 rounded-lg border border-rose-100">
                    {lawyerPrep.key_concerns.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Information to Bring */}
                {lawyerPrep.information_user_needs_to_provide && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Documents & Evidence to Bring to Consultation
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {lawyerPrep.information_user_needs_to_provide.map((info, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{info}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
