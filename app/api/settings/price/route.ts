import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/settings/price - Get current price settings from StockItem
export async function GET() {
  try {
    // Get all active stock items with prices
    const items = await prisma.stockItem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        priceGradeA: true,
        priceGradeB: true,
      },
    });

    // Transform to price format
    const prices = items.map((item) => ({
      id: item.id,
      productName: item.name,
      category: item.category,
      priceGradeA: item.priceGradeA ? Number(item.priceGradeA) : null,
      priceGradeB: item.priceGradeB ? Number(item.priceGradeB) : null,
    }));

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Get prices error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/settings/price - Update price for a stock item
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    if ((session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Dilarang' }, { status: 403 });
    }

    const { stockItemId, priceGradeA, priceGradeB } = await req.json();

    if (!stockItemId) {
      return NextResponse.json({ error: 'stockItemId wajib diisi' }, { status: 400 });
    }

    const updated = await prisma.stockItem.update({
      where: { id: stockItemId },
      data: {
        priceGradeA: priceGradeA ? parseFloat(priceGradeA) : null,
        priceGradeB: priceGradeB ? parseFloat(priceGradeB) : null,
      },
      select: {
        id: true,
        name: true,
        priceGradeA: true,
        priceGradeB: true,
      },
    });

    return NextResponse.json({
      price: {
        id: updated.id,
        productName: updated.name,
        priceGradeA: updated.priceGradeA ? Number(updated.priceGradeA) : null,
        priceGradeB: updated.priceGradeB ? Number(updated.priceGradeB) : null,
      },
    });
  } catch (error) {
    console.error('Update price error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
