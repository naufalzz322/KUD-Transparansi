import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Remove push subscription
// POST /api/push/unsubscribe
export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    if (!subscription.endpoint) {
      return NextResponse.json(
        { error: 'Endpoint wajib diisi' },
        { status: 400 }
      );
    }

    // Try to remove from user subscriptions
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: (session.user as any).email },
      });

      if (user) {
        await prisma.pushSubscription.deleteMany({
          where: {
            userId: user.id,
            endpoint: subscription.endpoint,
          },
        });
      }
    }

    // Try to remove from member subscriptions
    const token = request.headers.get('x-portal-token');

    if (token) {
      const member = await prisma.member.findUnique({
        where: { portalToken: token },
      });

      if (member) {
        await prisma.pushSubscription.deleteMany({
          where: {
            memberId: member.id,
            endpoint: subscription.endpoint,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Gagal berhenti langganan' },
      { status: 500 }
    );
  }
}

// Delete all subscriptions for current user
// DELETE /api/push/unsubscribe
export async function DELETE() {
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

    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe all error:', error);
    return NextResponse.json(
      { error: 'Gagal berhenti langganan' },
      { status: 500 }
    );
  }
}
