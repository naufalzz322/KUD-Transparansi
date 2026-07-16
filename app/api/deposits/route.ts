import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/deposits
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diauthorize' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const stockItemId = searchParams.get('stockItemId');
    const month = searchParams.get('month');

    const where: any = {
      type: 'DEPOSIT',
    };

    if (memberId) where.memberId = memberId;
    if (stockItemId) where.stockItemId = stockItemId;
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const start = new Date(year, monthNum - 1, 1);
      const end = new Date(year, monthNum, 0);
      where.receivedDate = { gte: start, lte: end };
    }

    const deposits = await prisma.stockBatch.findMany({
      where,
      include: {
        member: true,
        stockItem: true,
      },
      orderBy: { receivedDate: 'desc' },
    });

    return NextResponse.json({ deposits });
  } catch (error) {
    console.error('Get deposits error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
