import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { sendPushToAllAdmins, isPushConfigured } from '@/lib/push';

// GET /api/settlements - Get settlements list
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period'); // YYYY-MM format

    const where = period ? { period } : {};

    const settlements = await prisma.monthlySettlement.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
          },
        },
        processedBy: {
          select: {
            name: true,
          },
        },
        details: {
          include: {
            stockItem: true,
          },
        },
      },
      orderBy: { period: 'desc' },
    });

    return NextResponse.json({ settlements });
  } catch (error) {
    console.error('Get settlements error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/settlements - Calculate and create settlements for a period
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { period, stockItemId } = await req.json(); // YYYY-MM format

    if (!period) {
      return NextResponse.json({ error: 'Periode harus diisi (format: YYYY-MM)' }, { status: 400 });
    }

    // Get user ID from session - use email to look up user
    const userEmail = (session.user as any)?.email || session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Sesi pengguna tidak valid' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 401 });
    }

    const processedById = currentUser.id;

    // Parse period
    const [year, month] = period.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    // Get stock item prices (from StockItem table)
    let priceMap: Record<string, number> = { 'A': 6500, 'B': 5500 }; // Default prices

    if (stockItemId) {
      const stockItem = await prisma.stockItem.findUnique({
        where: { id: stockItemId },
      });
      if (stockItem) {
        if (stockItem.priceGradeA) priceMap['A'] = Number(stockItem.priceGradeA);
        if (stockItem.priceGradeB) priceMap['B'] = Number(stockItem.priceGradeB);
      }
    } else {
      // Get default milk prices
      const milkItem = await prisma.stockItem.findFirst({
        where: { name: 'Susu Sapi' },
      });
      if (milkItem) {
        if (milkItem.priceGradeA) priceMap['A'] = Number(milkItem.priceGradeA);
        if (milkItem.priceGradeB) priceMap['B'] = Number(milkItem.priceGradeB);
      }
    }

    // Get all stock batches for the period
    const batchWhere: any = {
      receivedDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      type: 'DEPOSIT',
    };

    if (stockItemId) {
      batchWhere.stockItemId = stockItemId;
    }

    // Get all stock batches with stock item info
    const batches = await prisma.stockBatch.findMany({
      where: batchWhere,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
          },
        },
        stockItem: true,
      },
    });

    // Calculate totals per member per product
    const memberProductTotals: Record<string, Record<string, {
      memberId: string;
      memberName: string;
      memberNumber: string;
      productId: string;
      productName: string;
      gradeA: number;
      gradeB: number;
      priceA: number;
      priceB: number;
      totalPayment: number;
    }>> = {};

    batches.forEach((b) => {
      const mid = b.memberId;
      if (!mid) return;

      const pid = b.stockItemId;
      const grade = b.grade || 'B';
      const qty = Number(b.qty);
      const productPrice = b.stockItem?.priceGradeA && b.stockItem?.priceGradeB
        ? { A: Number(b.stockItem.priceGradeA), B: Number(b.stockItem.priceGradeB) }
        : priceMap;
      const price = productPrice[grade as 'A' | 'B'] || 0;
      const payment = qty * price;

      if (!memberProductTotals[mid]) {
        memberProductTotals[mid] = {};
      }
      if (!memberProductTotals[mid][pid]) {
        memberProductTotals[mid][pid] = {
          memberId: mid,
          memberName: b.member?.name || 'Unknown',
          memberNumber: b.member?.memberNumber || 'Unknown',
          productId: pid,
          productName: b.stockItem?.name || 'Unknown',
          gradeA: 0,
          gradeB: 0,
          priceA: productPrice.A,
          priceB: productPrice.B,
          totalPayment: 0,
        };
      }

      if (grade === 'A') {
        memberProductTotals[mid][pid].gradeA += qty;
      } else {
        memberProductTotals[mid][pid].gradeB += qty;
      }
      memberProductTotals[mid][pid].totalPayment += payment;
    });

    // Create or update settlements with product details
    const results: any[] = [];
    for (const mid in memberProductTotals) {
      const products = Object.values(memberProductTotals[mid]);

      // Calculate totals
      const totalQty = products.reduce((sum, p) => sum + p.gradeA + p.gradeB, 0);
      const totalGradeA = products.reduce((sum, p) => sum + p.gradeA, 0);
      const totalGradeB = products.reduce((sum, p) => sum + p.gradeB, 0);
      const totalPayment = products.reduce((sum, p) => sum + p.totalPayment, 0);

      const settlement = await prisma.monthlySettlement.upsert({
        where: {
          memberId_period: {
            memberId: mid,
            period,
          },
        },
        update: {
          totalQty: totalQty,
          gradeAQty: totalGradeA,
          gradeBQty: totalGradeB,
          totalPayment: totalPayment,
          status: 'PENDING',
          processedById: processedById,
          processedAt: new Date(),
        },
        create: {
          memberId: mid,
          period,
          totalQty: totalQty,
          gradeAQty: totalGradeA,
          gradeBQty: totalGradeB,
          totalPayment: totalPayment,
          status: 'PENDING',
          processedById: processedById,
          processedAt: new Date(),
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              memberNumber: true,
            },
          },
          processedBy: {
            select: {
              name: true,
            },
          },
          details: {
            include: {
              stockItem: true,
            },
          },
        },
      });

      // Delete existing details and recreate
      await prisma.settlementDetail.deleteMany({
        where: { settlementId: settlement.id },
      });

      // Create new details
      for (const p of products) {
        await prisma.settlementDetail.create({
          data: {
            settlementId: settlement.id,
            stockItemId: p.productId,
            gradeAQty: p.gradeA,
            gradeBQty: p.gradeB,
            priceGradeA: p.priceA,
            priceGradeB: p.priceB,
            paymentA: p.gradeA * p.priceA,
            paymentB: p.gradeB * p.priceB,
            totalPayment: p.totalPayment,
          },
        });
      }

      // Refetch with details
      const settlementWithDetails = await prisma.monthlySettlement.findUnique({
        where: { id: settlement.id },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              memberNumber: true,
            },
          },
          processedBy: {
            select: {
              name: true,
            },
          },
          details: {
            include: {
              stockItem: true,
            },
          },
        },
      });

      results.push(settlementWithDetails);
    }

    // Create audit log
    const auditTotalAmount = results.reduce((sum, s) => sum + Number(s.totalPayment), 0);
    await prisma.auditLog.create({
      data: {
        userId: processedById,
        action: 'CREATE',
        entityType: 'Settlement',
        entityId: period,
        details: {
          period,
          stockItemId,
          memberCount: results.length,
          totalAmount: auditTotalAmount,
        },
      },
    });

    const totalAmount = results.reduce((sum, s) => sum + Number(s.totalPayment), 0);

    // Send push notification to admins
    let pushResult = null;
    if (results.length > 0 && isPushConfigured()) {
      try {
        pushResult = await sendPushToAllAdmins({
          title: '📊 Settlements Siap Diproses',
          body: `${results.length} anggota — Periode ${period} — Total Rp${totalAmount.toLocaleString('id-ID')}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'settlement-ready',
          url: '/settlements',
        });
      } catch (err) {
        console.error('Push notification failed:', err);
      }
    }

    return NextResponse.json({
      settlements: results,
      summary: {
        period,
        stockItemId,
        memberCount: results.length,
        totalAmount,
        prices: priceMap,
      },
      push: pushResult,
    });
  } catch (error) {
    console.error('Create settlements error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
