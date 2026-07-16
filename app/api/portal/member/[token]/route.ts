import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find member by token
    const member = await prisma.member.findUnique({
      where: { portalToken: token },
      select: {
        id: true,
        name: true,
        memberNumber: true,
        phone: true,
        isActive: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Link tidak valid' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      member,
      token,
    });
  } catch (error) {
    console.error('Get member by token error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
