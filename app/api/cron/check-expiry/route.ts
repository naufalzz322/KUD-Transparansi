import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendExpiryAlert } from '@/lib/wa';
import { sendPushToAllAdmins, isPushConfigured } from '@/lib/push';
import { differenceInDays, startOfDay } from 'date-fns';
import { notifyAllAdmins } from '@/lib/notifications';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    const today = startOfDay(new Date());

    // Get all non-expired stock batches
    const batches = await prisma.stockBatch.findMany({
      where: {
        status: { not: 'EXPIRED' },
      },
      include: {
        stockItem: {
          select: { name: true, shelfLifeDays: true },
        },
      },
    });

    // Get admin phone from settings
    const settings = await prisma.settings.findFirst();
    const adminPhone = settings?.adminPhone;

    const alerts: Array<{ batchId: string; productName: string; type: string; sent: boolean }> = [];

    for (const batch of batches) {
      const daysRemaining = differenceInDays(new Date(batch.expiryDate), today);
      let newStatus: 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED' = 'OK';

      // Determine new status
      if (daysRemaining <= 0) {
        newStatus = 'EXPIRED';
      } else if (daysRemaining <= 1) {
        newStatus = 'CRITICAL';
      } else if (daysRemaining <= 3) {
        newStatus = 'WARNING';
      } else {
        newStatus = 'OK';
      }

      // Update status if changed
      if (newStatus !== batch.status) {
        await prisma.stockBatch.update({
          where: { id: batch.id },
          data: { status: newStatus },
        });

        // Send alert if needed
        if ((newStatus === 'WARNING' || newStatus === 'CRITICAL' || newStatus === 'EXPIRED') && adminPhone) {
          try {
            const sent = await sendExpiryAlert(
              adminPhone,
              batch.stockItem.name,
              daysRemaining,
              `Batch-${batch.id.slice(-8)}`
            );

            // Log to audit trail (userId is optional in schema, system uses 'system')
            await prisma.auditLog.create({
              data: {
                userId: 'system',
                action: 'ALERT',
                entityType: 'StockBatch',
                entityId: batch.id,
                details: {
                  alertType: newStatus,
                  daysRemaining: Math.max(0, daysRemaining),
                  productName: batch.stockItem.name,
                  sent,
                },
              },
            });

            alerts.push({ batchId: batch.id, productName: batch.stockItem.name, type: newStatus, sent });
          } catch (error) {
            console.error(`Failed to alert for batch ${batch.id}:`, error);
            alerts.push({ batchId: batch.id, productName: batch.stockItem.name, type: newStatus, sent: false });
          }
        }
      }
    }

    // Send push notification to admins if there are any alerts
    let pushResult = null;
    let notificationCount = 0;

    if (alerts.length > 0) {
      // Send browser push if configured
      if (isPushConfigured()) {
        const warningCount = alerts.filter(a => a.type === 'WARNING').length;
        const criticalCount = alerts.filter(a => a.type === 'CRITICAL' || a.type === 'EXPIRED').length;

        try {
          pushResult = await sendPushToAllAdmins({
            title: criticalCount > 0 ? '🚨 Stok Akan/Baru Kadaluarsa' : '⚠️ Stok Akan Kadaluarsa',
            body: criticalCount > 0
              ? `${criticalCount} batch kritis + ${warningCount} warning. Cek halaman stok.`
              : `${warningCount} batch akan kadaluarsa dalam 3 hari. Cek halaman stok.`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'expiry-alert',
            url: '/stok',
          });
        } catch (err) {
          console.error('Push notification failed:', err);
        }
      }

      // Create in-app notifications for admins
      const criticalBatches = alerts.filter(a => a.type === 'CRITICAL' || a.type === 'EXPIRED');
      const warningBatches = alerts.filter(a => a.type === 'WARNING');

      if (criticalBatches.length > 0) {
        const productNames = criticalBatches.map(b => b.productName).join(', ');
        await notifyAllAdmins(
          'EXPIRY_ALERT',
          '🚨 Stok KritIS/Akan Kadaluarsa',
          `${criticalBatches.length} batch memerlukan perhatian segera: ${productNames}`,
          { url: '/stok', type: 'CRITICAL', batches: criticalBatches.length }
        );
        notificationCount += criticalBatches.length;
      }

      if (warningBatches.length > 0) {
        const productNames = warningBatches.map(b => b.productName).join(', ');
        await notifyAllAdmins(
          'WARNING',
          '⚠️ Stok Akan Kadaluarsa',
          `${warningBatches.length} batch akan kadaluarsa dalam 3 hari: ${productNames}`,
          { url: '/stok', type: 'WARNING', batches: warningBatches.length }
        );
        notificationCount += warningBatches.length;
      }
    }

    return NextResponse.json({
      processed: batches.length,
      alerts,
      push: pushResult,
      notifications: notificationCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Check expiry error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
