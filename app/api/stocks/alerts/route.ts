import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/stocks/alerts - Get stock alerts from audit log
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // WARNING, CRITICAL, EXPIRED

    const where: Record<string, unknown> = {
      entityType: 'StockBatch',
      action: 'ALERT',
    };

    if (type) {
      where.details = { alertType: type };
    }

    const alerts = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unacknowledgedCount = await prisma.auditLog.count({
      where: {
        entityType: 'StockBatch',
        action: 'ALERT',
      },
    });

    // Transform audit log entries to alert format
    const formattedAlerts = alerts.map((log) => ({
      id: log.id,
      stockId: log.entityId,
      productName: (log.details as Record<string, unknown>)?.productName || 'Unknown',
      alertType: (log.details as Record<string, unknown>)?.alertType || 'WARNING',
      daysRemaining: (log.details as Record<string, unknown>)?.daysRemaining ?? 0,
      sentAt: log.createdAt,
      acknowledgedBy: log.details ? (log.details as Record<string, unknown>).acknowledgedBy : null,
      acknowledgedAt: log.details ? (log.details as Record<string, unknown>).acknowledgedAt : null,
    }));

    return NextResponse.json({
      alerts: formattedAlerts,
      unacknowledgedCount,
      total: alerts.length,
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/stocks/alerts - Mark alerts as acknowledged
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const { alertId, acknowledgeAll } = body;

    const userName = (session.user as { name?: string })?.name || 'Admin';

    if (acknowledgeAll) {
      // Add acknowledgment to all recent alert audit logs
      // Note: AuditLog entries are immutable, so we create a follow-up log entry
      await prisma.auditLog.createMany({
        data: [{
          userId: (session.user as { id?: string })?.id || 'system',
          action: 'ACKNOWLEDGE',
          entityType: 'StockBatch',
          entityId: 'bulk',
          details: {
            acknowledgedBy: userName,
            acknowledgedAt: new Date().toISOString(),
            note: 'All alerts acknowledged',
          },
        }],
      });

      return NextResponse.json({
        success: true,
        message: 'All alerts acknowledged (logged)',
      });
    }

    if (!alertId) {
      return NextResponse.json({ error: 'ID Alert harus diisi' }, { status: 400 });
    }

    // Add acknowledgment as a follow-up audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as { id?: string })?.id || 'system',
        action: 'ACKNOWLEDGE',
        entityType: 'StockBatch',
        entityId: alertId,
        details: {
          acknowledgedBy: userName,
          acknowledgedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Alert acknowledged' });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
