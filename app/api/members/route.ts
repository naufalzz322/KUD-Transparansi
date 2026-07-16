import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/members - List all members
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');

    const where = isActive && isActive !== 'all' ? { isActive: isActive === 'true' } : undefined;
    const members = await prisma.member.findMany({
      where,
      orderBy: { memberNumber: 'asc' },
      select: {
        id: true,
        memberNumber: true,
        name: true,
        phone: true,
        email: true,
        portalToken: true,
        qrCodeData: true,
        isActive: true,
        joinDate: true,
      },
    });

    return NextResponse.json({ members }, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/members - Create member
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const { memberNumber, name, phone, email, joinDate } = body;

    if (!memberNumber || !name || !phone) {
      return NextResponse.json(
        { error: 'memberNumber, nama, telepon wajib diisi' },
        { status: 400 }
      );
    }

    // Generate PIN (default: 123456 - should be changed by member)
    const hashedPin = await bcrypt.hash('123456', 12);

    const member = await prisma.member.create({
      data: {
        memberNumber,
        name,
        phone,
        email: email || null,
        joinDate: new Date(joinDate),
        portalPin: hashedPin,
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Create member error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
