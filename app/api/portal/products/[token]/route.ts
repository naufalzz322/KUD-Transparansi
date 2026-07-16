import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Verify session cookie
    const sessionCookie = req.headers.get('cookie') || '';
    const match = sessionCookie.match(/portal_session=([^;]+)/);

    if (!match) {
      return NextResponse.json(
        { error: 'Tidak diizinkan - tidak ada sesi' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(match[1], SESSION_SECRET);
      if (payload.memberToken !== token) {
        return NextResponse.json(
          { error: 'Tidak diizinkan - sesi tidak valid' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Tidak diizinkan - sesi kadaluarsa' },
        { status: 401 }
      );
    }

    // Fetch all active stock items with prices
    const products = await prisma.stockItem.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        category: true,
        defaultUnit: true,
        priceGradeA: true,
        priceGradeB: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        defaultUnit: p.defaultUnit,
        priceGradeA: p.priceGradeA ? Number(p.priceGradeA) : null,
        priceGradeB: p.priceGradeB ? Number(p.priceGradeB) : null,
      })),
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
