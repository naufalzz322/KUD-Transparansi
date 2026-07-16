import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST /api/members/[id]/pin - Reset PIN
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { pin } = body;

    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN harus 6 digit' },
        { status: 400 }
      );
    }

    const hashedPin = await bcrypt.hash(pin, 12);

    const member = await prisma.member.update({
      where: { id },
      data: { portalPin: hashedPin },
    });

    return NextResponse.json({
      success: true,
      message: 'PIN berhasil diperbarui',
    });
  } catch (error) {
    console.error('Reset PIN error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
