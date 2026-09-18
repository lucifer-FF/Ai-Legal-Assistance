import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, FileText, CheckCircle2, ArrowRight,
  Scale, Lock, Search, GitCompare, HelpCircle,
  AlertTriangle, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC<{ onOpenUpload?: () => void }> = ({ onOpenUpload }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Next-Gen Legal Document Intelligence
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 font-serif max-w-4xl mx-auto leading-tight">
            Understand your legal documents.{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Ask better questions.
            </span>{' '}
            Make informed next steps.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered legal document analysis that turns complex legal language into clear, understandable information. Grounded strictly in your documents with verified citations.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                Go to Your Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  Analyze a Document
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  See How It Works
                </a>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Zero Hallucinated Citations
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Calibrated Uncertainty
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Isolated Document Storage
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Attorney Consultation Briefs
            </span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Capabilities</h2>
          <h3 className="text-3xl font-bold text-slate-900 font-serif">
            Intelligent Legal Understanding, Not Generic Chat
          </h3>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            LexiGuard decomposes complex agreements into structured obligations, classified risk matrices, and actionable consultation checklists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card hover:shadow-elevated transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Classified Risk Detection</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatically surfaces high-risk clauses such as unilateral indemnities, severe liquidated damages, and auto-renewal rollover traps.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card hover:shadow-elevated transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Grounded RAG Document Q&A</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ask specific questions about termination penalties or payment windows. Every answer includes exact section and page citations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card hover:shadow-elevated transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <GitCompare className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Side-by-Side Contract Diff</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compare versions (e.g. Standard vs Negotiated). Categorizes modifications, additions, and deletions with plain-English significance notes.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card hover:shadow-elevated transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Interactive Clause Explainer</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Click any clause to view plain language translation, real-world implications, and tailored questions to ask qualified counsel.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card hover:shadow-elevated transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Actionable Review Checklist</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generated directly from the contract. Track deadlines, verify insurance endorsements, mark tasks complete, and add custom notes.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card hover:shadow-elevated transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Prepare for a Lawyer</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate structured dossiers for attorney consultations: summary, priority concerns, relevant dates, and required documents.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Workflow</h2>
            <h3 className="text-3xl font-bold text-slate-900 font-serif">
              Four Steps from Complex Legalese to Total Clarity
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Upload Contract</h4>
              <p className="text-xs text-slate-600">
                Upload your PDF, DOCX, or TXT lease, NDA, employment agreement, or vendor contract.
              </p>
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Semantic Ingestion</h4>
              <p className="text-xs text-slate-600">
                Text is cleaned, structured into numbered sections, and indexed into dense vector embeddings.
              </p>
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Gemini Analysis</h4>
              <p className="text-xs text-slate-600">
                Gemini 3.8 Flash classifies risks, separates obligations, maps key dates, and builds the checklist.
              </p>
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Act & Consult</h4>
              <p className="text-xs text-slate-600">
                Chat with RAG citations, compare revisions, and export an executive consultation brief for your attorney.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy Section */}
      <section id="security" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 border border-slate-800 shadow-2xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-4 border border-blue-500/30">
              <Lock className="w-3.5 h-3.5" />
              Security First Architecture
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif mb-4">
              Confidentiality & Tenant Isolation by Design
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Legal documents contain sensitive proprietary and personal terms. LexiGuard ensures complete tenant data isolation, secure password hashing, strict access token verification, and non-prescriptive AI safeguards.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Encrypted JWT authentication with role-based access control</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Strict cross-user authorization guards preventing unauthorized access</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Safe file validation with extension and size checks</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>No API keys or sensitive credentials stored in client code</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">FAQ</h2>
          <h3 className="text-2xl font-bold text-slate-900 font-serif">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Does LexiGuard replace a lawyer?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. LexiGuard is an informational intelligence platform designed to help you understand contracts, spot potential risks, and prepare intelligent questions for legal counsel. It does not provide legal advice or create an attorney-client relationship.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              How are document citations verified?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              LexiGuard uses semantic vector chunking. When you ask a question, only the most relevant sections are retrieved and provided to Gemini 3.8 Flash. Answers must strictly cite the exact section and page number where the information resides.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              What file formats are supported?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              LexiGuard supports PDF, DOCX, and TXT files up to 20MB in size.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-3">
          <div className="flex items-center justify-center gap-2 text-slate-900 font-serif font-bold text-base">
            <Shield className="w-4 h-4 text-blue-600" />
            LexiGuard Platform
          </div>
          <p className="max-w-2xl mx-auto text-[11px] text-slate-400">
            LexiGuard provides AI-generated legal information and document analysis for informational purposes only. It does not provide legal advice, establish an attorney-client relationship, or replace a qualified legal professional.
          </p>
          <p className="text-[11px]">
            &copy; {new Date().getFullYear()} LexiGuard. Built with Google Gemini 3.8 Flash.
          </p>
        </div>
      </footer>
    </div>
  );
};
