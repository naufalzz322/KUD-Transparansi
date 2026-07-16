import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateSessionToken } from '@/lib/portal-token';

export async function POST(req: NextRequest) {
  try {
    const { token, pin } = await req.json();

    if (!token || !pin) {
      return NextResponse.json(
        { error: 'Token dan PIN diperlukan' },
        { status: 400 }
      );
    }

    // Find member by portal token
    const member = await prisma.member.findUnique({
      where: { portalToken: token },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Link tidak valid' },
        { status: 401 }
      );
    }

    // Verify PIN
    const pinValid = await bcrypt.compare(pin, member.portalPin);
    if (!pinValid) {
      return NextResponse.json(
        { error: 'PIN salah' },
        { status: 401 }
      );
    }

    // Generate session token with member token for verification
    const sessionToken = await generateSessionToken(
      member.id,
      member.portalToken,
      member.memberNumber,
      member.name
    );

    const response = NextResponse.json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        memberNumber: member.memberNumber,
      },
    });

    // Set httpOnly cookie
    response.cookies.set('portal_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Portal auth error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
