'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from './usePushNotifications';
import { useToast } from './Toast';

interface NotificationPromptProps {
  autoShow?: boolean; // Auto show after page load (default: true)
}

export function NotificationPrompt({ autoShow = true }: NotificationPromptProps) {
  const { supported, subscribed, loading, subscribe } = usePushNotifications();
  const { addToast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if previously dismissed
    const wasDismissed = localStorage.getItem('notification-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Auto show after delay if not subscribed
    if (autoShow && supported && !subscribed && !loading) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 2000); // Show after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [autoShow, supported, subscribed, loading]);

  const handleEnable = async () => {
    const ok = await subscribe();
    if (ok) {
      addToast('Notifikasi browser diaktifkan!', 'success');
      setVisible(false);
    } else {
      addToast('Gagal mengaktifkan notifikasi', 'error');
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setDismissed(true);
  };

  // Don't show if not supported, already subscribed, dismissed, or no autoShow
  if (!supported || subscribed || dismissed || !autoShow) {
    return null;
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-surface border border-border rounded-2xl shadow-warm-lg p-4 animate-slide-up z-50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-text-primary text-sm">
            Aktifkan Notifikasi
          </h4>
          <p className="text-xs text-text-secondary mt-1">
            Dapatkan alerte otomatis untuk stok kadaluarsa dan settlement baru langsung di browser Anda.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Mengaktifkan...' : 'Aktifkan'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-text-muted text-xs hover:text-text-secondary transition-colors"
            >
              Tidak Sekarang
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-cream rounded-lg transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
