import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySessionToken } from '@/lib/portal-token';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';

    // Find member by portal token
    const member = await prisma.member.findUnique({
      where: { portalToken: token },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });
    }

    // Count total and unread
    const [total, unreadCount] = await Promise.all([
      prisma.notification.count({
        where: { memberId: member.id },
      }),
      prisma.notification.count({
        where: { memberId: member.id, read: false },
      }),
    ]);

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: unreadOnly ? { memberId: member.id, read: false } : { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total,
    });
  } catch (error) {
    console.error('Member notifications error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    // Find member by portal token
    const member = await prisma.member.findUnique({
      where: { portalToken: token },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });
    }

    // Mark as read
    if (body.ids && Array.isArray(body.ids)) {
      await prisma.notification.updateMany({
        where: {
          memberId: member.id,
          id: { in: body.ids },
        },
        data: { read: true },
      });
    } else if (body.readAll) {
      await prisma.notification.updateMany({
        where: { memberId: member.id, read: false },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
