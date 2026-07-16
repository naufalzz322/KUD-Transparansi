/**
 * Push Notification Library - Admin browser push via Web Push
 *
 * Sends push notifications to admin browsers using Web Push (web-push).
 * This is for silent in-app notifications to admin users.
 */

import webpush from 'web-push';
import prisma from './prisma';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || process.env.NEXT_PUBLIC_APP_URL || '';

// Only configure if keys exist
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export const isPushConfigured = () => !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send push notification to a single subscription endpoint
 */
async function sendToSubscription(sub: PushSubscriptionRecord, payload: PushPayload): Promise<{ success: boolean; id: string; error?: string }> {
  if (!isPushConfigured()) {
    return { success: false, id: sub.id, error: 'Push not configured' };
  }

  const subscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true, id: sub.id };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    // 410 = subscription expired, 404 = not found — clean up
    if (err.statusCode === 410 || err.statusCode === 404) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      return { success: false, id: sub.id, error: 'Subscription expired' };
    }
    return { success: false, id: sub.id, error: err.message || 'Send failed' };
  }
}

/**
 * Send push notification to all subscribed admin users
 */
export async function sendPushToAllAdmins(payload: PushPayload): Promise<{ success: number; failed: number; total: number }> {
  const subscriptions = await prisma.pushSubscription.findMany();

  if (subscriptions.length === 0) {
    return { success: 0, failed: 0, total: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const result = await sendToSubscription(sub, payload);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed, total: subscriptions.length };
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ success: boolean; failed: boolean }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { success: false, failed: false };
  }

  let hasSuccess = false;
  for (const sub of subscriptions) {
    const result = await sendToSubscription(sub, payload);
    if (result.success) hasSuccess = true;
  }

  return { success: hasSuccess, failed: !hasSuccess };
}

/**
 * Build a standard expiry alert payload
 */
export function expiryAlertPayload(batchCount: number, itemName: string): PushPayload {
  return {
    title: '⚠️ Stok Akan Kadaluarsa',
    body: `${batchCount}批次${itemName}即将过期，请尽快处理。`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'expiry-alert',
    url: '/stok',
  };
}

/**
 * Build a standard settlement ready payload
 */
export function settlementReadyPayload(memberCount: number, period: string, totalAmount: number): PushPayload {
  return {
    title: '📊 Settlements Siap',
    body: `${memberCount} anggota — Periode ${period} — Total Rp${totalAmount.toLocaleString('id-ID')}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'settlement-ready',
    url: '/settlements',
  };
}
