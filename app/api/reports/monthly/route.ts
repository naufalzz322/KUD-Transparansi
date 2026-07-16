import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isAfter, startOfDay, subMonths, startOfWeek, endOfWeek } from 'date-fns';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// GET /api/reports/monthly
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM
    const stockItemId = searchParams.get('itemId'); // Optional: filter by stock item
    const includeTrend = searchParams.get('includeTrend') !== 'false'; // Default true

    const month = monthParam ? new Date(monthParam + '-01') : new Date();
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    // Build where clause for stock batches
    const whereClause: any = {
      receivedDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      type: 'DEPOSIT',
      qty: {
        gt: 0,
      },
    };

    // Filter by stock item if provided
    if (stockItemId) {
      whereClause.stockItemId = stockItemId;
    }

    // Get all deposits (stock batches) for the month
    const deposits = await prisma.stockBatch.findMany({
      where: whereClause,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
          },
        },
        stockItem: {
          select: {
            id: true,
            name: true,
            defaultUnit: true,
          },
        },
      },
      orderBy: { receivedDate: 'asc' },
    });

    // Get all active members count
    const activeMembersCount = await prisma.member.count({
      where: { isActive: true },
    });

    // Get available stock items for filter options
    const stockItems = await prisma.stockItem.findMany({
      where: { isActive: true },
      select: { id: true, name: true, defaultUnit: true },
      orderBy: { name: 'asc' },
    });

    // Calculate daily totals
    const today = startOfDay(new Date());
    const lastDayOfMonth = endOfMonth(month);
    // Use the earlier of today or last day of month for comparison
    const effectiveEndDate = today < lastDayOfMonth ? today : lastDayOfMonth;
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dailyData = daysInMonth.map((day) => {
      // Only include days up to the effective end date (today for current month, last day for past months)
      if (isAfter(day, effectiveEndDate)) {
        return {
          date: format(day, 'yyyy-MM-dd'),
          dayLabel: format(day, 'd'),
          dayName: format(day, 'EEE'),
          qty: 0,
          depositorCount: 0,
          isWeekend: getDay(day) === 0, // Sunday
          isFuture: true,
        };
      }

      const dayDeposits = deposits.filter(
        (d) => format(d.receivedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      const totalQty = dayDeposits.reduce((sum, d) => sum + Number(d.qty), 0);
      const depositorCount = new Set(dayDeposits.map((d) => d.memberId)).size;

      return {
        date: format(day, 'yyyy-MM-dd'),
        dayLabel: format(day, 'd'),
        dayName: format(day, 'EEE'),
        qty: totalQty,
        depositorCount,
        isWeekend: getDay(day) === 0, // Sunday
        isFuture: false,
      };
    });

    // Calculate monthly totals
    const totalQty = dailyData.reduce((sum, d) => sum + d.qty, 0);
    const activeDays = dailyData.filter((d) => d.qty > 0 && !d.isWeekend).length;
    const avgPerDay = activeDays > 0 ? totalQty / activeDays : 0;
    const totalDepositors = new Set(deposits.map((d) => d.memberId)).size;

    // Grade breakdown
    const gradeA = deposits
      .filter((d) => d.grade === 'A')
      .reduce((sum, d) => sum + Number(d.qty), 0);
    const gradeB = deposits
      .filter((d) => d.grade === 'B')
      .reduce((sum, d) => sum + Number(d.qty), 0);

    // Per-member breakdown
    const memberStats = await prisma.member.findMany({
      where: {
        isActive: true,
        stockBatches: {
          some: {
            receivedDate: {
              gte: monthStart,
              lte: monthEnd,
            },
            type: 'DEPOSIT',
            qty: {
              gt: 0,
            },
          },
        },
      },
      include: {
        stockBatches: {
          where: {
            receivedDate: {
              gte: monthStart,
              lte: monthEnd,
            },
            type: 'DEPOSIT',
          },
        },
      },
    });

    const memberBreakdown = memberStats.map((m) => {
      const total = m.stockBatches.reduce((sum, d) => sum + Number(d.qty), 0);
      const days = m.stockBatches.filter((d) => Number(d.qty) > 0).length;
      const gradeAAmount = m.stockBatches
        .filter((d) => d.grade === 'A')
        .reduce((sum, d) => sum + Number(d.qty), 0);
      const gradeBAmount = m.stockBatches
        .filter((d) => d.grade === 'B')
        .reduce((sum, d) => sum + Number(d.qty), 0);

      return {
        id: m.id,
        name: m.name,
        memberNumber: m.memberNumber,
        totalQty: total,
        daysCount: days,
        avgPerDay: days > 0 ? total / days : 0,
        gradeA: gradeAAmount,
        gradeB: gradeBAmount,
      };
    });

    // Sort by total qty descending
    memberBreakdown.sort((a, b) => b.totalQty - a.totalQty);

    // Per-item breakdown (when no itemId filter)
    const itemBreakdown: Array<{
      id: string;
      name: string;
      unit: string;
      totalQty: number;
      gradeA: number;
      gradeB: number;
      daysCount: number;
    }> = [];

    if (!stockItemId) {
      const itemMap = new Map<string, {
        id: string;
        name: string;
        unit: string;
        totalQty: number;
        gradeA: number;
        gradeB: number;
        days: Set<string>;
      }>();

      for (const d of deposits) {
        if (!d.stockItemId) continue;
        if (!itemMap.has(d.stockItemId)) {
          itemMap.set(d.stockItemId, {
            id: d.stockItemId,
            name: d.stockItem?.name || 'Unknown',
            unit: d.stockItem?.defaultUnit || 'unit',
            totalQty: 0,
            gradeA: 0,
            gradeB: 0,
            days: new Set(),
          });
        }
        const entry = itemMap.get(d.stockItemId)!;
        entry.totalQty += Number(d.qty);
        if (d.grade === 'A') entry.gradeA += Number(d.qty);
        else entry.gradeB += Number(d.qty);
        entry.days.add(format(d.receivedDate, 'yyyy-MM-dd'));
      }

      for (const entry of Array.from(itemMap.values())) {
        itemBreakdown.push({
          id: entry.id,
          name: entry.name,
          unit: entry.unit,
          totalQty: entry.totalQty,
          gradeA: entry.gradeA,
          gradeB: entry.gradeB,
          daysCount: entry.days.size,
        });
      }
      itemBreakdown.sort((a, b) => b.totalQty - a.totalQty);
    }

    // Get unit
    let unit = 'unit';
    if (stockItemId && stockItems[0]) {
      unit = stockItems.find(s => s.id === stockItemId)?.defaultUnit || 'unit';
    } else if (itemBreakdown.length > 0) {
      unit = itemBreakdown[0].unit;
    } else if (deposits.length > 0) {
      unit = deposits[0]?.stockItem?.defaultUnit || 'unit';
    }

    // Build response
    const response: any = {
      month: format(month, 'yyyy-MM'),
      monthName: `${MONTH_NAMES_ID[month.getMonth()]} ${month.getFullYear()}`,
      unit,
      stockItems,
      itemBreakdown,
      stats: {
        totalQty,
        avgPerDay,
        activeDays,
        totalDepositors,
        activeMembersCount,
        gradeA,
        gradeB,
      },
      dailyData,
      memberBreakdown,
    };

    // Include trend data if requested
    if (includeTrend) {
      // Get 6 months of trend data
      const trendMonths = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(month, 5 - i);
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, 'MMM yyyy'),
        };
      });

      // Get monthly totals for trend
      const monthlyTotals = await Promise.all(
        trendMonths.map(async (m) => {
          const result = await prisma.stockBatch.aggregate({
            where: {
              receivedDate: {
                gte: m.start,
                lte: m.end,
              },
              type: 'DEPOSIT',
            },
            _sum: {
              qty: true,
            },
          });
          return {
            label: m.label,
            total: Number(result._sum.qty || 0),
          };
        })
      );

      // Get daily batches for current month to calculate weekly pattern
      const dailyBatches = await prisma.stockBatch.groupBy({
        by: ['receivedDate'],
        where: {
          receivedDate: {
            gte: monthStart,
            lte: monthEnd,
          },
          type: 'DEPOSIT',
        },
        _sum: {
          qty: true,
        },
      });

      // Calculate average by day of week
      const dayTotals: Record<number, { sum: number; count: number }> = {
        0: { sum: 0, count: 0 },
        1: { sum: 0, count: 0 },
        2: { sum: 0, count: 0 },
        3: { sum: 0, count: 0 },
        4: { sum: 0, count: 0 },
        5: { sum: 0, count: 0 },
        6: { sum: 0, count: 0 },
      };

      dailyBatches.forEach(batch => {
        const date = new Date(batch.receivedDate);
        const dayOfWeek = date.getDay();
        const qty = Number(batch._sum.qty || 0);
        dayTotals[dayOfWeek].sum += qty;
        dayTotals[dayOfWeek].count += 1;
      });

      const weeklyPattern = DAY_NAMES_SHORT.map((day, idx) => {
        const data = dayTotals[idx];
        const avg = data.count > 0 ? data.sum / data.count : 0;
        return { day, avg: Math.round(avg * 10) / 10 };
      });

      response.trend = {
        monthly: {
          labels: monthlyTotals.map(m => m.label),
          data: monthlyTotals.map(m => Math.round(m.total * 10) / 10),
        },
        weekly: weeklyPattern,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Monthly report error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
