/**
 * usePushNotifications hook - Client-side push subscription management
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

interface PushState {
  supported: boolean;
  subscribed: boolean;
  loading: boolean;
  permission: NotificationPermission | 'unsupported';
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    supported: false,
    subscribed: false,
    loading: true,
    permission: 'unsupported',
    error: null,
  });

  // Load existing subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState(s => ({ ...s, supported: false, loading: false }));
        return;
      }

      const permission = Notification.permission;
      setState(s => ({ ...s, supported: true, permission }));

      if (permission !== 'granted') {
        setState(s => ({ ...s, loading: false }));
        return;
      }

      // Check if already subscribed
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(s => ({ ...s, subscribed: !!sub, loading: false }));
      } catch {
        setState(s => ({ ...s, loading: false }));
      }
    };

    checkStatus();
  }, []);

  const subscribe = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));

    try {
      // Request notification permission first
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(s => ({ ...s, permission, loading: false, error: 'Izin notifikasi ditolak' }));
        return false;
      }
      setState(s => ({ ...s, permission }));

      // Get VAPID public key from server
      const keyRes = await fetch('/api/push/public-key');
      if (!keyRes.ok) {
        throw new Error('Tidak dapat mengambil kunci publik');
      }
      const { publicKey } = await keyRes.json();

      // Subscribe via service worker
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      // Send subscription to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan langganan');
      }

      setState(s => ({ ...s, subscribed: true, loading: false }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengaktifkan notifikasi';
      setState(s => ({ ...s, loading: false, error: message }));
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }

      // Notify server to remove
      await fetch('/api/push/unsubscribe', { method: 'POST' });

      setState(s => ({ ...s, subscribed: false, loading: false }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menonaktifkan';
      setState(s => ({ ...s, loading: false, error: message }));
      return false;
    }
  }, []);

  return { ...state, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array(Array.from(rawData).map((char) => char.charCodeAt(0)));
}
