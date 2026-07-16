import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendReminderWithQR } from '@/lib/wa';

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

/**
 * POST /api/notifications/reminder
 * Send reminder notifications to members who haven't deposited today
 *
 * Body (optional):
 * - memberIds: string[] - Specific members to remind (if not provided, reminds all not deposited today)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    if (!FONNTE_TOKEN) {
      return NextResponse.json(
        {
          error: 'Fonnte not configured',
          message: 'Set FONNTE_TOKEN in .env to enable WhatsApp reminders'
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { memberIds } = body;

    // Get today date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get members who haven't deposited today
    const whereClause = memberIds && memberIds.length > 0
      ? { id: { in: memberIds }, isActive: true }
      : { isActive: true };

    const allMembers = await prisma.member.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        phone: true,
        portalToken: true,
        qrCodeData: true,
      },
    });

    // Get members who have deposited today (from stockBatch)
    const depositedToday = await prisma.stockBatch.findMany({
      where: {
        receivedDate: {
          gte: today,
          lt: tomorrow,
        },
        type: 'DEPOSIT',
      },
      select: { memberId: true },
    });

    const depositedMemberIds = new Set(depositedToday.map(d => d.memberId));

    // Filter to members who haven't deposited
    const notDepositedMembers = allMembers.filter(m => m.id && !depositedMemberIds.has(m.id));

    if (notDepositedMembers.length === 0) {
      return NextResponse.json({
        message: 'Semua anggota sudah setor hari ini',
        total: 0,
        success: 0,
        failed: 0,
        results: [],
      });
    }

    // Current time for reminder message
    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Send reminders with QR codes
    const results: Array<{ memberId: string; name: string; phone: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    for (const member of notDepositedMembers) {
      const result = await sendReminderWithQR({
        name: member.name,
        phone: member.phone,
        portalToken: member.portalToken,
        qrCodeData: member.qrCodeData,
      }, currentTime);

      results.push({
        memberId: member.id,
        name: member.name,
        phone: member.phone,
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }

      // Rate limiting - wait between messages
      if (notDepositedMembers.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      message: `Pengingat dikirim ke ${notDepositedMembers.length} anggota`,
      total: notDepositedMembers.length,
      success: successCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    console.error('Reminder notification error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/**
 * GET /api/notifications/reminder
 * Get status of members who haven't deposited today
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    // Get today date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active members
    const allMembers = await prisma.member.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    // Get members who have deposited today (from stockBatch)
    const depositedToday = await prisma.stockBatch.findMany({
      where: {
        receivedDate: {
          gte: today,
          lt: tomorrow,
        },
        type: 'DEPOSIT',
      },
      select: { memberId: true },
    });

    const depositedMemberIds = new Set(depositedToday.map(d => d.memberId));

    // Filter to members who haven't deposited
    const notDeposited = allMembers.filter(m => !depositedMemberIds.has(m.id));

    return NextResponse.json({
      totalMembers: allMembers.length,
      depositedToday: depositedToday.length,
      notDepositedToday: notDeposited.length,
      fonnteConfigured: !!FONNTE_TOKEN,
    });
  } catch (error) {
    console.error('Reminder status error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
