import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';

// GET /api/stock/summary
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId'); // Optional: filter by stock item

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Get all stock items with their latest batches
    const stockItems = await prisma.stockItem.findMany({
      where: itemId ? { id: itemId, isActive: true } : { isActive: true },
      include: {
        stockBatches: {
          orderBy: { receivedDate: 'desc' },
        },
      },
    });

    // Build where clause for today's deposits
    const todayWhere: any = {
      receivedDate: {
        gte: todayStart,
        lte: todayEnd,
      },
      type: 'DEPOSIT',
    };
    if (itemId) todayWhere.stockItemId = itemId;

    // Get today's deposits grouped by stock item
    const todayBatchesAll = await prisma.stockBatch.findMany({
      where: todayWhere,
    });

    // Group today's deposits by stockItemId
    const todayByItem = new Map<string, { qty: number; gradeA: number; gradeB: number; memberIds: Set<string> }>();
    // Track unique members across ALL products for the overall deposit rate
    const allTodayMemberIds = new Set<string>();

    for (const batch of todayBatchesAll) {
      allTodayMemberIds.add(batch.memberId || '');
      const existing = todayByItem.get(batch.stockItemId) || { qty: 0, gradeA: 0, gradeB: 0, memberIds: new Set() };
      existing.qty += Number(batch.qty);
      existing.memberIds.add(batch.memberId || '');
      if (batch.grade === 'A') existing.gradeA += Number(batch.qty);
      else if (batch.grade === 'B') existing.gradeB += Number(batch.qty);
      todayByItem.set(batch.stockItemId, existing);
    }

    // Calculate stock summary per item
    const stockSummary = stockItems.map((item) => {
      // Get today's stats for this item
      const t = todayByItem.get(item.id) || { qty: 0, gradeA: 0, gradeB: 0, memberIds: new Set() };

      // Get all active (non-expired) batches for this item
      const activeBatches = item.stockBatches.filter(
        (b) => b.status !== 'EXPIRED'
      );

      // Calculate total qty
      const totalQty = activeBatches.reduce(
        (sum, b) => sum + Number(b.qty),
        0
      );

      // Calculate grade breakdown
      const gradeABatch = activeBatches.filter((b) => b.grade === 'A');
      const gradeBBatch = activeBatches.filter((b) => b.grade === 'B');
      const gradeAQty = gradeABatch.reduce(
        (sum, b) => sum + Number(b.qty),
        0
      );
      const gradeBQty = gradeBBatch.reduce(
        (sum, b) => sum + Number(b.qty),
        0
      );

      // Find nearest expiry
      const nonExpiredBatches = activeBatches.filter(
        (b) => new Date(b.expiryDate) >= todayStart
      );
      const nearestExpiry = nonExpiredBatches.reduce(
        (nearest, b) => {
          const expiryDate = new Date(b.expiryDate);
          if (!nearest || expiryDate < nearest) {
            return expiryDate;
          }
          return nearest;
        },
        null as Date | null
      );

      // Calculate days remaining
      let daysRemaining = null;
      let status: 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED' = 'OK';

      if (nearestExpiry) {
        daysRemaining = Math.ceil(
          (nearestExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining <= 0) status = 'EXPIRED';
        else if (daysRemaining === 1) status = 'CRITICAL';
        else if (daysRemaining <= 3) status = 'WARNING';
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        defaultUnit: item.defaultUnit,
        shelfLifeDays: item.shelfLifeDays,
        totalQty,
        gradeA: gradeAQty,
        gradeB: gradeBQty,
        batchCount: activeBatches.length,
        nearestExpiry,
        daysRemaining,
        status,
      };
    });

    // Sort by status (critical first, then warning, then ok)
    const statusOrder = { CRITICAL: 0, WARNING: 1, OK: 2, EXPIRED: 3 };
    stockSummary.sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    );

    // Count alerts
    const alerts = {
      critical: stockSummary.filter((s) => s.status === 'CRITICAL').length,
      warning: stockSummary.filter((s) => s.status === 'WARNING').length,
      expired: stockSummary.filter((s) => s.status === 'EXPIRED').length,
      ok: stockSummary.filter((s) => s.status === 'OK').length,
    };

    // Get expiring items (warning + critical)
    const expiringItems = stockSummary
      .filter((s) => s.status === 'WARNING' || s.status === 'CRITICAL')
      .map((s) => ({
        id: s.id,
        name: s.name,
        daysRemaining: s.daysRemaining,
        status: s.status,
        nearestExpiry: s.nearestExpiry,
      }));

    // Get all active stock items for the selector
    const allStockItems = await prisma.stockItem.findMany({
      where: { isActive: true },
      select: { id: true, name: true, defaultUnit: true },
      orderBy: { name: 'asc' },
    });

    // Get total active members
    const totalMembers = await prisma.member.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      stockSummary,
      todayByItem: Array.from(todayByItem.entries()).map(([stockItemId, data]) => ({
        stockItemId,
        qty: data.qty,
        gradeA: data.gradeA,
        gradeB: data.gradeB,
        memberCount: data.memberIds.size,
      })),
      uniqueTodayMembers: allTodayMemberIds.size,
      totalMembers,
      alerts,
      expiringItems,
      stockItems: allStockItems,
    });
  } catch (error) {
    console.error('Stock summary error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
