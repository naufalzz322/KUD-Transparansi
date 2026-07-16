import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

// GET /api/deposits/today
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const stockItemId = searchParams.get('stockItemId');

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Date ranges for comparison
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const yesterdayStart = startOfDay(subDays(targetDate, 1));
    const yesterdayEnd = endOfDay(subDays(targetDate, 1));

    // Get members assigned to the selected product
    const memberProductWhere: any = stockItemId ? { stockItemId } : {};

    const memberProductAssignments = await prisma.memberProduct.findMany({
      where: memberProductWhere,
      select: {
        memberId: true,
        isPrimary: true,
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
          },
        },
      },
    });

    const memberIds = memberProductAssignments.map((mp) => mp.memberId);
    const primaryMembers = memberProductAssignments
      .filter((mp) => mp.isPrimary)
      .map((mp) => mp.memberId);

    // Get all active members (filter by product assignment if stockItemId provided)
    const memberWhere: any = { isActive: true };
    if (stockItemId && memberIds.length > 0) {
      memberWhere.id = { in: memberIds };
    }

    const members = await prisma.member.findMany({
      where: memberWhere,
      orderBy: { memberNumber: 'asc' },
      select: {
        id: true,
        name: true,
        memberNumber: true,
        phone: true,
        stockBatches: {
          where: {
            receivedDate: {
              gte: dayStart,
              lte: dayEnd,
            },
            type: 'DEPOSIT',
            ...(stockItemId && { stockItemId }),
          },
        },
      },
    });

    // Calculate totals for today
    let totalQty = 0;
    let gradeA = 0;
    let gradeB = 0;
    const depositsMap: Record<string, { qty: number; grade?: string }> = {};

    for (const member of members) {
      if (member.stockBatches.length > 0) {
        const deposit = member.stockBatches[0];
        const qty = Number(deposit.qty);
        totalQty += qty;
        depositsMap[member.id] = {
          qty,
          grade: deposit.grade || undefined,
        };
        if (deposit.grade === 'A') gradeA += qty;
        else gradeB += qty;
      }
    }

    // Get weekly total
    const weekDepositsWhere: any = {
      receivedDate: {
        gte: weekStart,
        lte: weekEnd,
      },
      type: 'DEPOSIT',
      ...(stockItemId && { stockItemId }),
      ...(stockItemId && memberIds.length > 0 && { memberId: { in: memberIds } }),
    };

    const weekDeposits = await prisma.stockBatch.aggregate({
      where: weekDepositsWhere,
      _sum: { qty: true },
    });

    // Get monthly total
    const monthDepositsWhere: any = {
      receivedDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      type: 'DEPOSIT',
      ...(stockItemId && { stockItemId }),
      ...(stockItemId && memberIds.length > 0 && { memberId: { in: memberIds } }),
    };

    const monthDeposits = await prisma.stockBatch.aggregate({
      where: monthDepositsWhere,
      _sum: { qty: true },
    });

    // Get yesterday's total for comparison
    const yesterdayWhere: any = {
      receivedDate: {
        gte: yesterdayStart,
        lte: yesterdayEnd,
      },
      type: 'DEPOSIT',
      ...(stockItemId && { stockItemId }),
      ...(stockItemId && memberIds.length > 0 && { memberId: { in: memberIds } }),
    };

    const yesterdayDeposits = await prisma.stockBatch.aggregate({
      where: yesterdayWhere,
      _sum: { qty: true },
    });

    const yesterdayQty = Number(yesterdayDeposits._sum.qty) || 0;
    const qtyChange = yesterdayQty > 0 ? ((totalQty - yesterdayQty) / yesterdayQty) * 100 : 0;

    return NextResponse.json({
      date: targetDate.toISOString(),
      totalQty,
      depositedCount: Object.keys(depositsMap).length,
      totalMembers: members.length,
      gradeBreakdown: { A: gradeA, B: gradeB },
      weeklyTotal: Number(weekDeposits._sum.qty) || 0,
      monthlyTotal: Number(monthDeposits._sum.qty) || 0,
      yesterdayQty,
      qtyChange: Math.round(qtyChange * 10) / 10,
      members,
      deposits: depositsMap,
      memberProductAssignments,
    });
  } catch (error) {
    console.error('Get today deposits error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
