import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Store push subscriptions
// POST /api/push/subscribe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // For authenticated users, associate subscription with user
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: (session.user as any).email },
      });

      if (!user) {
        return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 401 });
      }

      const subscription = await request.json();

      // Validate subscription object
      if (!subscription.endpoint || !subscription.keys) {
        return NextResponse.json(
          { error: 'Objek langganan tidak valid' },
          { status: 400 }
        );
      }

      // Store or update subscription in database
      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId: user.id,
            endpoint: subscription.endpoint,
          },
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          expirationTime: subscription.expirationTime
            ? new Date(subscription.expirationTime)
            : null,
        },
        create: {
          userId: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          expirationTime: subscription.expirationTime
            ? new Date(subscription.expirationTime)
            : null,
        },
      });

      return NextResponse.json({ success: true });
    }

    // For members with portal token, associate with member
    const token = request.headers.get('x-portal-token');

    if (token) {
      const member = await prisma.member.findUnique({
        where: { portalToken: token },
      });

      if (!member) {
        return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 401 });
      }

      const subscription = await request.json();

      if (!subscription.endpoint || !subscription.keys) {
        return NextResponse.json(
          { error: 'Objek langganan tidak valid' },
          { status: 400 }
        );
      }

      await prisma.pushSubscription.upsert({
        where: {
          memberId_endpoint: {
            memberId: member.id,
            endpoint: subscription.endpoint,
          },
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          expirationTime: subscription.expirationTime
            ? new Date(subscription.expirationTime)
            : null,
        },
        create: {
          memberId: member.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          expirationTime: subscription.expirationTime
            ? new Date(subscription.expirationTime)
            : null,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Autentikasi wajib' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { error: 'Gagal berlangganan' },
      { status: 500 }
    );
  }
}

// Get subscriptions for current user
// GET /api/push/subscribe
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Autentikasi wajib' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: (session.user as any).email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 401 });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil langganan' },
      { status: 500 }
    );
  }
}
