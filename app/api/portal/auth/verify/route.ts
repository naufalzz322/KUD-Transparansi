import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifySessionToken } from '@/lib/portal-token';

export async function POST(req: NextRequest) {
  try {
    const { token: memberToken } = await req.json();

    // Read session cookie directly from request
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('portal_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Tidak ada sesi' }, { status: 401 });
    }

    // Verify session token (JWT)
    const session = await verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    // Verify session belongs to this member (using URL token)
    if (session.memberToken !== memberToken) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    // Get fresh member data
    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
      select: {
        id: true,
        name: true,
        memberNumber: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        memberNumber: member.memberNumber,
      },
    });
  } catch (error) {
    console.error('Session verify error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
