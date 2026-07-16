'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

interface EditLogEntry {
  id: string;
  depositDate: string;
  member: {
    id: string;
    name: string;
    memberNumber: string;
  };
  recordedBy: string;
  lockedAt: string | null;
  originalQty: number | null;
  edits: Array<{
    timestamp: string;
    editedBy: string;
    previousQty: number;
    newQty: number;
    reason: string;
  }>;
}

interface EditLogResponse {
  editLogs: EditLogEntry[];
  summary: {
    totalEditEvents: number;
    totalDepositsEdited: number;
    totalQtyChanged: number;
  };
}

export default function RiwayatEditPage() {
  const [editLogs, setEditLogs] = useState<EditLogEntry[]>([]);
  const [summary, setSummary] = useState<EditLogResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userRole, setUserRole] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Check user role
  useEffect(() => {
    // Get role from session (passed via props or context in real app)
    const checkRole = async () => {
      setUserRole('ADMIN');
    };
    checkRole();
  }, []);

  useEffect(() => {
    fetchEditLogs();
  }, [currentMonth]);

  const fetchEditLogs = async () => {
    setLoading(true);
    try {
      const monthStr = format(currentMonth, 'yyyy-MM');
      const response = await fetch(`/api/deposits/edit-log?month=${monthStr}&limit=100`);

      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (response.ok) {
        const data: EditLogResponse = await response.json();
        setEditLogs(data.editLogs);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch edit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate available months (last 12 months)
  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return date;
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: id });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'HH:mm:ss', { locale: id });
    } catch {
      return dateStr;
    }
  };

  const calculateDiff = (previous: number, current: number) => {
    const diff = current - previous;
    const sign = diff >= 0 ? '+' : '';
    return { diff, formatted: `${sign}${diff.toFixed(1)} L` };
  };

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Akses Ditolak</h2>
        <p className="text-text-secondary">Hanya admin yang dapat melihat riwayat edit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Riwayat Edit Setoran</h1>
          <p className="text-sm text-text-secondary mt-1">
            Catatan perubahan setelah data terkunci
          </p>
        </div>

        {/* Month Selector */}
        <select
          value={format(currentMonth, 'yyyy-MM')}
          onChange={(e) => setCurrentMonth(parseISO(e.target.value + '-01'))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          {availableMonths.map((date) => (
            <option key={format(date, 'yyyy-MM')} value={format(date, 'yyyy-MM')}>
              {format(date, 'MMMM yyyy', { locale: id })}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-admin-border p-4">
            <p className="text-sm text-text-secondary">Total Deposit Di-edit</p>
            <p className="text-2xl font-bold text-primary">{summary.totalDepositsEdited}</p>
          </div>
          <div className="bg-white rounded-lg border border-admin-border p-4">
            <p className="text-sm text-text-secondary">Total Peristiwa Edit</p>
            <p className="text-2xl font-bold text-primary">{summary.totalEditEvents}</p>
          </div>
          <div className="bg-white rounded-lg border border-admin-border p-4">
            <p className="text-sm text-text-secondary">Total Perubahan Qty</p>
            <p className="text-2xl font-bold text-primary">{summary.totalQtyChanged.toFixed(1)} L</p>
          </div>
        </div>
      )}

      {/* Edit Logs List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : editLogs.length === 0 ? (
        <div className="bg-white rounded-lg border border-admin-border p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-text-primary mb-2">Tidak Ada Edit</h3>
          <p className="text-text-secondary">
            Tidak ada perubahan setoran yang tercatat untuk bulan ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {editLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const totalDiff = log.edits.length > 0
              ? log.edits[log.edits.length - 1].newQty - (log.originalQty || 0)
              : 0;

            return (
              <div
                key={log.id}
                className="bg-white rounded-lg border border-admin-border overflow-hidden"
              >
                {/* Summary Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-text-primary">{log.member.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {log.member.memberNumber}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {formatDate(log.depositDate)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Diinput oleh: {log.recordedBy}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          totalDiff >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {totalDiff >= 0 ? '+' : ''}{totalDiff.toFixed(1)} L
                        </div>
                        <div className="text-xs text-text-secondary">
                          {log.edits.length} edit
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-admin-border bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-text-primary mb-3">Detail Perubahan</h4>

                    {/* Timeline */}
                    <div className="space-y-3">
                      {/* Original Entry */}
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-400 mt-2" />
                        <div className="flex-1">
                          <p className="text-sm text-text-secondary">
                            Input awal: <span className="font-medium text-text-primary">{(log.originalQty || 0).toFixed(1)} L</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            {log.lockedAt ? formatDate(log.lockedAt) : 'Tanggal deposit'}
                          </p>
                        </div>
                      </div>

                      {/* Edits */}
                      {log.edits.map((edit, idx) => {
                        const diff = calculateDiff(edit.previousQty, edit.newQty);
                        return (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="relative">
                              <div className="w-2 h-2 rounded-full bg-amber-400 mt-2" />
                              {idx < log.edits.length - 1 && (
                                <div className="absolute top-3 left-1 w-0.5 h-4 bg-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-text-secondary">
                                  {edit.previousQty.toFixed(1)} L
                                </p>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <p className="text-sm font-medium text-text-primary">
                                  {edit.newQty.toFixed(1)} L
                                </p>
                                <span className={`text-xs font-medium ${
                                  diff.diff >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ({diff.formatted})
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(edit.timestamp)} {formatTime(edit.timestamp)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                oleh: {edit.editedBy}
                              </p>
                              {edit.reason && (
                                <p className="text-xs text-amber-600 mt-1 italic">
                                  Alasan: {edit.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
