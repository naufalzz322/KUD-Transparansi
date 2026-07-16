'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

type FilterType = 'all' | 'unread' | 'EXPIRY_ALERT' | 'WARNING' | 'SETTLEMENT_READY' | 'INFO' | 'SYSTEM';

export default function NotificationsPage() {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const limit = 20;

  const fetchNotifications = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 0 : page;

    try {
      let url = `/api/notifications?limit=${limit}&offset=${currentPage * limit}`;
      if (filter === 'unread') {
        url += '&unread=true';
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
        }
        setTotal(data.total || 0);
        setUnreadCount(data.unreadCount || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      addToast('Gagal memuat notifikasi', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filter, addToast]);

  // Fetch notifications when filter or page changes
  useEffect(() => {
    fetchNotifications(true);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleMarkAsRead = async (id?: string) => {
    try {
      const body = id ? { ids: [id] } : { readAll: true };
      const res = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (id) {
          setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
        }
        addToast(id ? 'Notifikasi ditandai dibaca' : 'Semua notifikasi ditandai dibaca', 'success');
      }
    } catch (error) {
      addToast('Gagal menandai notifikasi', 'error');
    }
  };

  const handleDelete = async (id?: string) => {
    try {
      const params = id
        ? `?ids=${id}`
        : `?deleteAll=true`;

      const res = await fetch(`/api/notifications${params}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (id) {
          setNotifications(prev => prev.filter(n => n.id !== id));
          setTotal(prev => prev - 1);
        } else {
          setNotifications([]);
          setTotal(0);
          setUnreadCount(0);
        }
        setDeleteModal({ open: false });
        setSelectMode(false);
        setSelectedIds(new Set());
        addToast(id ? 'Notifikasi dihapus' : 'Semua notifikasi dihapus', 'success');
      }
    } catch (error) {
      addToast('Gagal menghapus notifikasi', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EXPIRY_ALERT':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'WARNING':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'SETTLEMENT_READY':
        return (
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'DEPOSIT_CONFIRMED':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EXPIRY_ALERT': return 'bg-red-50 border-red-200';
      case 'WARNING': return 'bg-amber-50 border-amber-200';
      case 'SETTLEMENT_READY': return 'bg-green-50 border-green-200';
      case 'DEPOSIT_CONFIRMED': return 'bg-blue-50 border-blue-200';
      case 'INFO': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'EXPIRY_ALERT': return 'Kadaluarsa';
      case 'WARNING': return 'Peringatan';
      case 'SETTLEMENT_READY': return 'Settlement';
      case 'DEPOSIT_CONFIRMED': return 'Setoran';
      case 'INFO': return 'Info';
      case 'SYSTEM': return 'System';
      default: return type;
    }
  };

  const filteredNotifications = filter === 'all' || filter === 'unread'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const filterTabs: { value: FilterType; label: string; count?: number }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'unread', label: 'Belum Dibaca', count: unreadCount },
    { value: 'EXPIRY_ALERT', label: 'Kadaluarsa' },
    { value: 'WARNING', label: 'Peringatan' },
    { value: 'SETTLEMENT_READY', label: 'Settlement' },
    { value: 'INFO', label: 'Info' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Notifikasi</h1>
        <p className="text-sm text-text-secondary mt-1">{total} notifikasi, {unreadCount} belum dibaca</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                filter === tab.value
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-cream'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.value
                    ? 'bg-white/20'
                    : 'bg-accent text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {unreadCount > 0 && (
            <button
              onClick={() => handleMarkAsRead()}
              className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Baca Semua
            </button>
          )}
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedIds(new Set());
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              selectMode
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'text-text-secondary hover:bg-cream'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {selectMode ? 'Batal' : 'Pilih'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectMode && selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-cream rounded-xl border border-border flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {selectedIds.size} notifikasi dipilih
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAsRead()}
              className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Tandai Dibaca
            </button>
            <button
              onClick={() => setDeleteModal({ open: true })}
              className="px-3 py-1.5 text-sm font-medium text-status-critical hover:bg-status-critical/10 rounded-lg transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="space-y-3">
        {loading && notifications.length === 0 ? (
          // Skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 bg-surface rounded-xl border border-border animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-text-muted">Tidak ada notifikasi</p>
          </div>
        ) : (
          <>
            {selectMode && (
              <div className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-border">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredNotifications.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="text-sm text-text-secondary">Pilih semua</span>
              </div>
            )}

            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-colors ${getTypeColor(notif.type)} ${
                  selectMode ? 'cursor-pointer' : ''
                }`}
                onClick={() => selectMode && toggleSelect(notif.id)}
              >
                <div className="flex items-start gap-3">
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notif.id)}
                      onChange={() => toggleSelect(notif.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary mt-1"
                    />
                  )}

                  {getTypeIcon(notif.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!notif.read && (
                            <span className="w-2 h-2 bg-primary rounded-full" />
                          )}
                          <h4 className="font-medium text-text-primary">
                            {notif.title}
                          </h4>
                          <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full text-text-secondary">
                            {getTypeLabel(notif.type)}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">
                          {notif.body}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-text-muted">
                            {format(new Date(notif.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                          </span>
                          <span className="text-xs text-text-muted/70">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: idLocale })}
                          </span>
                        </div>
                      </div>

                      {!selectMode && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                              title="Tandai dibaca"
                            >
                              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <Link
                            href={notif.data?.url || '#'}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            title="Buka"
                          >
                            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => setDeleteModal({ open: true, id: notif.id })}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <svg className="w-4 h-4 text-status-critical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="w-full py-3 text-sm font-medium text-primary hover:bg-cream rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onCancel={() => setDeleteModal({ open: false })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Hapus Notifikasi"
        message={deleteModal.id
          ? 'Apakah Anda yakin ingin menghapus notifikasi ini?'
          : `Apakah Anda yakin ingin menghapus ${selectedIds.size} notifikasi yang dipilih?`}
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
}
