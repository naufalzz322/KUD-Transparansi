import prisma from './prisma';

export type NotificationType = 'INFO' | 'WARNING' | 'EXPIRY_ALERT' | 'SETTLEMENT_READY' | 'DEPOSIT_CONFIRMED' | 'SYSTEM';

interface CreateNotificationParams {
  userId?: string;
  memberId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Create a notification for a user or member
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, memberId, type, title, body, data } = params;

  if (!userId && !memberId) {
    console.warn('Notification created without userId or memberId');
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        memberId,
        type,
        title,
        body,
        data: data || undefined,
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Create notification for all admins
 */
export async function notifyAllAdmins(
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  const notifications = admins.map((admin) => ({
    userId: admin.id,
    type,
    title,
    body,
    data: data || undefined,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }

  return notifications.length;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

/**
 * Mark notifications as read
 */
export async function markAsRead(notificationIds: string[], userId: string) {
  await prisma.notification.updateMany({
    where: { id: { in: notificationIds }, userId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/**
 * Delete old notifications (older than days)
 */
export async function cleanupOldNotifications(userId: string, days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      createdAt: { lt: cutoffDate },
      read: true, // Only delete read notifications
    },
  });

  return result.count;
}
