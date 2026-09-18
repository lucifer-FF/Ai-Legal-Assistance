import React, { useState, useEffect } from 'react';
import {
  Settings, Users, FileText, MessageSquare, GitCompare,
  CheckCircle2, AlertTriangle, ShieldCheck, Clock, Loader2
} from 'lucide-react';
import { apiService } from '../services/api';
import { SystemStats, User, AuditLog } from '../types';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAdminUsers(),
        apiService.getAdminActivity(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to load administrative analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <span>Loading Administrative Telemetry...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-600 mt-1">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          System Administration
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif">
          Platform Oversight & AI Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor user registrations, document extraction throughput, AI query volumes, and audit logs.
        </p>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] text-slate-500 font-medium">Total Users</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.total_users}</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] text-slate-500 font-medium">Documents Ingested</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.total_documents}</span>
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] text-slate-500 font-medium">AI RAG Questions</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.total_questions}</span>
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] text-slate-500 font-medium">Comparisons Executed</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.total_comparisons}</span>
              <GitCompare className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] text-slate-500 font-medium">Pipeline Success Rate</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.success_rate_percent}%</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts / Breakdowns */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Type Distribution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Document Types Processed
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.documents_by_type).map(([typeName, count]) => {
                const pct = stats.total_documents > 0 ? (count / stats.total_documents) * 100 : 0;
                return (
                  <div key={typeName} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>{typeName}</span>
                      <span>{count} docs ({Math.round(pct)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Level Distribution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Identified Risk Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.risk_distribution).map(([level, count]) => {
                const colorClass =
                  level === 'HIGH'
                    ? 'bg-rose-500'
                    : level === 'MEDIUM'
                    ? 'bg-amber-500'
                    : level === 'LOW'
                    ? 'bg-emerald-500'
                    : 'bg-sky-500';

                return (
                  <div key={level} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span className="font-bold">{level}</span>
                      <span>{count} findings</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${colorClass} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(8, count * 15))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Registered Users ({users.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-emerald-600 font-medium">Active</td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            System Audit Trail ({logs.length} events)
          </h3>
          <span className="text-[10px] text-slate-400">Tamper-evident logs</span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="py-2 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-4 font-mono text-[11px] text-blue-700">
                    {l.action}
                  </td>
                  <td className="py-2 px-4 text-slate-600 text-[11px]">
                    {l.user_email || 'System'}
                  </td>
                  <td className="py-2 px-4 text-slate-600 truncate max-w-sm">
                    {l.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
