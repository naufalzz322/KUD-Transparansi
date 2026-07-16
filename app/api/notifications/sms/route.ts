import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isSMSConfigured } from '@/lib/sms';

/**
 * POST /api/notifications/sms
 * Send SMS notifications for stock batches via Fonnte
 *
 * Body:
 * - batchIds: string[] - Array of batch IDs to send notifications for
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const { batchIds } = body;

    if (!batchIds || !Array.isArray(batchIds)) {
      return NextResponse.json(
        { error: 'Array batchIds wajib diisi' },
        { status: 400 }
      );
    }

    if (!isSMSConfigured()) {
      return NextResponse.json(
        { error: 'SMS/Fonnte belum dikonfigurasi', configured: false },
        { status: 503 }
      );
    }

    const batches = await prisma.stockBatch.findMany({
      where: { id: { in: batchIds } },
      include: { member: true },
    });

    if (batches.length === 0) {
      return NextResponse.json({ error: 'Batch tidak ditemukan' }, { status: 404 });
    }

    // SMS route is not used directly — notifications are sent via /api/notifications/send
    // This endpoint exists for legacy compatibility but notifications should use
    // /api/notifications/send with channel: 'sms'
    return NextResponse.json(
      { error: 'Gunakan /api/notifications/send dengan channel: "sms" untuk mengirim SMS' },
      { status: 400 }
    );
  } catch (error) {
    console.error('SMS notification error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/**
 * GET /api/notifications/sms
 * Get SMS provider configuration status
 */
export async function GET() {
  const configured = isSMSConfigured();

  return NextResponse.json({
    configured,
    provider: configured ? 'fonnte' : null,
    message: configured
      ? 'Fonnte SMS aktif'
      : 'SMS/Fonnte belum dikonfigurasi (atur FONNTE_TOKEN di .env)',
  });
}
