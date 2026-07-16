import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/audit-log - Get audit logs (admin/chairman only)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, limit, offset });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/audit-log - Create audit log entry
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const userEmail = (session.user as any)?.email || session.user?.email;
    const currentUser = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;

    if (!currentUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 401 });
    }

    const body = await req.json();
    const { action, entityType, entityId, details, ipAddress, userAgent } = body;

    if (!action || !entityType) {
      return NextResponse.json({ error: 'action dan entityType harus diisi' }, { status: 400 });
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action,
        entityType,
        entityId,
        details: details || {},
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ auditLog });
  } catch (error) {
    console.error('Create audit log error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
