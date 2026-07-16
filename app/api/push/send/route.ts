import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushToAllAdmins, isPushConfigured } from '@/lib/push';

// POST /api/push/send - Trigger push notification to all admins
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: 'Push notifications belum dikonfigurasi' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { title, body: message, tag, url } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'title dan body wajib diisi' },
        { status: 400 }
      );
    }

    const result = await sendPushToAllAdmins({
      title,
      body: message,
      tag: tag || 'admin-alert',
      url: url || '/',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
