import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-white font-medium">Important Legal Notice:</strong> LexiGuard provides AI-generated legal information and document analysis for informational purposes only. It does not provide legal advice, establish an attorney-client relationship, or replace a qualified legal professional.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-slate-400 shrink-0 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Grounded in Gemini 3.8 Flash & Document Context</span>
        </div>
      </div>
    </div>
  );
};
