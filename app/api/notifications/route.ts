import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/notifications - Get notifications
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';

    // Get user ID from session
    const userEmail = (session.user as any)?.email || session.user?.email;
    const currentUser = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;

    if (!currentUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const where: any = { userId: currentUser.id };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: currentUser.id, read: false },
    });

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ids = searchParams.get('ids')?.split(',').filter(Boolean);
    const deleteAll = searchParams.get('deleteAll') === 'true';

    // Get user ID from session
    const userEmail = (session.user as any)?.email || session.user?.email;
    const currentUser = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;

    if (!currentUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (deleteAll) {
      // Delete all notifications for user
      const result = await prisma.notification.deleteMany({
        where: { userId: currentUser.id },
      });
      return NextResponse.json({ success: true, deleted: result.count });
    }

    if (ids && ids.length > 0) {
      // Delete specific notifications
      const result = await prisma.notification.deleteMany({
        where: { id: { in: ids }, userId: currentUser.id },
      });
      return NextResponse.json({ success: true, deleted: result.count });
    }

    return NextResponse.json({ error: 'ids atau deleteAll wajib diisi' }, { status: 400 });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
