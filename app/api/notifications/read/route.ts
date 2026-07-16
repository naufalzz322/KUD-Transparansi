import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/notifications/read - Mark notifications as read
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const { ids, readAll } = body;

    // Get user ID from session
    const userEmail = (session.user as any)?.email || session.user?.email;
    const currentUser = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;

    if (!currentUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (readAll) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: currentUser.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' });
    }

    if (ids && Array.isArray(ids)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: currentUser.id },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: `${ids.length} notifikasi ditandai sudah dibaca` });
    }

    return NextResponse.json({ error: 'ids atau readAll wajib diisi' }, { status: 400 });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
