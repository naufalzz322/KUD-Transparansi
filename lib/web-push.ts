import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// VAPID keys should be generated once and stored securely
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:notify@kud-transparansi.id';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<boolean> {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId);
      return false;
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushToSubscription(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    // Check if at least one succeeded
    return results.some((result) => result.status === 'fulfilled');
  } catch (error) {
    console.error('Error sending push to user:', error);
    return false;
  }
}

export async function sendPushToMember(
  memberId: string,
  payload: PushPayload
): Promise<boolean> {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { memberId },
    });

    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for member:', memberId);
      return false;
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushToSubscription(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    return results.some((result) => result.status === 'fulfilled');
  } catch (error) {
    console.error('Error sending push to member:', error);
    return false;
  }
}

async function sendPushToSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification');
    return;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    );
  } catch (error: unknown) {
    // Handle expired or invalid subscriptions
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const pushError = error as { statusCode: number };
      if (pushError.statusCode === 404 || pushError.statusCode === 410) {
        // Subscription expired or no longer valid
        console.log('Removing invalid subscription:', subscription.endpoint);
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
      }
    }
    throw error;
  }
}

export async function sendBulkPush(
  memberIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    memberIds.map((memberId) => sendPushToMember(memberId, payload))
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
