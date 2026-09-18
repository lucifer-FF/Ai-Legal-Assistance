import React, { useState, useEffect } from 'react';
import { History, FileText, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/api';
import { Document } from '../types';

export const HistoryPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await apiService.listDocuments();
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card">
        <h1 className="text-2xl font-bold text-slate-900 font-serif">
          Activity & Document History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Chronological record of uploaded contracts and intelligence extractions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading history logs...</p>
        ) : documents.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No past document activity recorded.</p>
        ) : (
          <div className="relative border-l border-slate-200 ml-4 space-y-6">
            {documents.map((d) => (
              <div key={d.id} className="relative pl-6">
                <div className="absolute -left-2.5 top-1 w-5 h-5 rounded-full bg-blue-50 border border-blue-400 flex items-center justify-center text-blue-600">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(d.created_at).toLocaleString()}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">{d.title}</h4>
                  <p className="text-[11px] text-slate-500">
                    Format: <span className="uppercase">{d.file_type}</span> • Size: {(d.file_size / 1024).toFixed(1)} KB • Status: {d.processing_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
