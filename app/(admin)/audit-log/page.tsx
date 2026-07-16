'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SkeletonTable } from '@/components/ui/Skeleton';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  VIEW: 'bg-gray-100 text-gray-700',
  EXPORT: 'bg-purple-100 text-purple-700',
  LOGIN: 'bg-cyan-100 text-cyan-700',
  LOGOUT: 'bg-amber-100 text-amber-700',
};

const entityLabels: Record<string, { label: string; bg: string; text: string }> = {
  Member:    { label: 'Member',     bg: 'bg-blue-100',   text: 'text-blue-700' },
  Deposit:    { label: 'Deposit',    bg: 'bg-green-100',  text: 'text-green-700' },
  Settlement: { label: 'Settlement', bg: 'bg-purple-100', text: 'text-purple-700' },
  User:      { label: 'User',       bg: 'bg-gray-100',   text: 'text-gray-700' },
  Stock:     { label: 'Stock',      bg: 'bg-amber-100', text: 'text-amber-700' },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN'>('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/api/audit-log?limit=50';
      if (filter !== 'all') url += `&action=${filter}`;

      const response = await fetch(url);
      const result = await response.json();
      setLogs(result.logs || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const colorClass = actionColors[action] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {action}
      </span>
    );
  };

  const formatDetails = (details: any) => {
    if (!details) return '-';
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch {
        return details;
      }
    }
    if (details.name) return details.name;
    if (details.period) return `Periode ${details.period}`;
    if (details.memberCount) return `${details.memberCount} records`;
    return JSON.stringify(details).slice(0, 50);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Audit Log
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {total} aktivitas tercatat
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'] as const).map((action) => (
          <button
            key={action}
            onClick={() => setFilter(action)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === action
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-text-secondary hover:bg-cream'
            }`}
          >
            {action === 'all' ? 'Semua' : action}
          </button>
        ))}
      </div>

      {/* Log List */}
      {loading ? (
        <SkeletonTable rows={10} />
      ) : logs.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-medium text-text-primary mb-2">
            Belum ada aktivitas
          </h3>
          <p className="text-text-secondary">
            Aktivitas sistem akan ditampilkan di sini
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-warm">
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-cream/30 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    entityLabels[log.entityType]?.bg ?? 'bg-gray-100'
                  } ${entityLabels[log.entityType]?.text ?? 'text-gray-600'}`}>
                    {entityLabels[log.entityType]?.label ?? log.entityType.slice(0, 3).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActionBadge(log.action)}
                      <span className="text-sm font-medium text-text-primary">
                        {log.entityType}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary truncate">
                      {formatDetails(log.details)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                      <span>{log.user.name}</span>
                      <span>•</span>
                      <span>{format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
