'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=6&unread=false');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleToggle = () => {
    setIsAnimating(true);
    setOpen(!open);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EXPIRY_ALERT':
        return (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'WARNING':
        return (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'SETTLEMENT_READY':
        return (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'DEPOSIT_CONFIRMED':
        return (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'SYSTEM':
        return (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className={`
          relative p-2.5 rounded-2xl transition-all duration-200 group
          ${open
            ? 'bg-primary/10 text-primary shadow-lg shadow-primary/20'
            : 'hover:bg-cream text-text-secondary hover:text-primary'
          }
          ${unreadCount > 0 && !open ? 'ring-2 ring-primary/20 ring-offset-2 ring-offset-surface' : ''}
        `}
        title="Notifikasi"
      >
        {/* Background glow for unread */}
        {unreadCount > 0 && (
          <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse" />
        )}

        <svg
          className={`w-5 h-5 relative z-10 transition-transform duration-200 ${open ? 'scale-110' : 'group-hover:scale-110'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-gradient-to-br from-accent to-accent-hover text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg shadow-accent/30 animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-3 w-96 bg-surface border border-border rounded-2xl shadow-warm-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Notifikasi</h3>
                  <p className="text-xs text-text-muted">
                    {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
                  </p>
                </div>
              </div>
              {unreadCount === 0 && (
                <span className="flex items-center gap-1.5 text-xs text-status-success bg-status-success/10 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse" />
                  Terbarui
                </span>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm text-text-muted font-medium">Belum ada notifikasi</p>
                <p className="text-xs text-text-muted/70 mt-1">Notifikasi akan muncul di sini</p>
              </div>
            ) : (
              notifications.map((notif, index) => (
                <Link
                  key={notif.id}
                  href={notif.data?.url || '/notifications'}
                  onClick={(e) => {
                    if (!notif.read) markAsRead(notif.id);
                    setOpen(false);
                  }}
                  className={`
                    block px-5 py-4 border-b border-border/50 last:border-0
                    hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent
                    transition-all duration-150 cursor-pointer
                    ${!notif.read ? 'bg-primary/5' : ''}
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {getTypeIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm font-semibold truncate ${!notif.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1 shadow-sm shadow-primary/50" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-text-muted/60">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: idLocale })}
                        </span>
                        {notif.type !== 'INFO' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-text-muted/10 rounded text-text-muted/70">
                            {notif.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block px-5 py-4 text-center text-sm font-semibold text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-150 border-t border-border bg-cream/30"
          >
            <span className="flex items-center justify-center gap-2">
              Lihat Semua Notifikasi
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
