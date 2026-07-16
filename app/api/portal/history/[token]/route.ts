import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';
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
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');
    const rangeParam = searchParams.get('range') as 'today' | 'week' | 'month' | null;

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

    // Find member by token
    const member = await prisma.member.findUnique({
      where: { portalToken: token },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Link tidak valid' },
        { status: 404 }
      );
    }

    // Get month (default: current month)
    const month = monthParam ? new Date(monthParam) : new Date();
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    // Calculate date range based on filter
    let dateStart = monthStart;
    let dateEnd = monthEnd;

    if (rangeParam && rangeParam !== 'month') {
      const today = new Date();
      switch (rangeParam) {
        case 'today':
          dateStart = startOfDay(today);
          dateEnd = today;
          break;
        case 'week':
          dateStart = startOfWeek(today, { weekStartsOn: 1 });
          dateEnd = endOfWeek(today, { weekStartsOn: 1 });
          break;
      }
    }

    // Get stock batches (deposits) for this period
    const deposits = await prisma.stockBatch.findMany({
      where: {
        memberId: member.id,
        receivedDate: {
          gte: dateStart,
          lte: dateEnd,
        },
        type: 'DEPOSIT',
      },
      include: {
        stockItem: true,
      },
      orderBy: { receivedDate: 'asc' },
    });

    // Calculate stats
    let totalQty = 0;
    let daysCount = 0;
    let gradeA = 0;
    let gradeB = 0;

    // Group by product for breakdown
    const productStats: Record<string, { name: string; unit: string; totalQty: number; gradeA: number; gradeB: number; days: Set<string> }> = {};

    for (const deposit of deposits) {
      const qty = Number(deposit.qty);
      if (qty > 0) {
        totalQty += qty;
        daysCount++;

        if (deposit.grade === 'A') gradeA += qty;
        else if (deposit.grade === 'B') gradeB += qty;

        // Track per-product stats
        const productId = deposit.stockItemId;
        const productName = deposit.stockItem?.name || 'Unknown';
        const productUnit = deposit.stockItem?.defaultUnit || deposit.unit || 'unit';

        if (!productStats[productId]) {
          productStats[productId] = {
            name: productName,
            unit: productUnit,
            totalQty: 0,
            gradeA: 0,
            gradeB: 0,
            days: new Set(),
          };
        }

        productStats[productId].totalQty += qty;
        if (deposit.grade === 'A') productStats[productId].gradeA += qty;
        else if (deposit.grade === 'B') productStats[productId].gradeB += qty;

        const dateKey = deposit.receivedDate.toISOString().split('T')[0];
        productStats[productId].days.add(dateKey);
      }
    }

    // Convert to array sorted by totalQty descending
    const productBreakdown = Object.entries(productStats)
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        unit: stats.unit,
        totalQty: stats.totalQty,
        gradeA: stats.gradeA,
        gradeB: stats.gradeB,
        daysCount: stats.days.size,
      }))
      .sort((a, b) => b.totalQty - a.totalQty);

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        memberNumber: member.memberNumber,
      },
      month: month.toISOString(),
      stats: {
        totalQty,
        daysCount,
        avgPerDay: daysCount > 0 ? totalQty / daysCount : 0,
        gradeBreakdown: { A: gradeA, B: gradeB },
      },
      productBreakdown,
      deposits: deposits.map((d) => ({
        date: d.receivedDate,
        qty: Number(d.qty),
        unit: d.unit,
        grade: d.grade,
        expiryDate: d.expiryDate,
        status: d.status,
        notified: true, // Notification tracking removed in schema, default to true
      })),
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
