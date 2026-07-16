import prisma from './prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Update settlement for a member in a given period
 * Called automatically when deposits are recorded
 */
export async function updateMemberSettlement(
  memberId: string,
  period: string,
  adminId: string
) {
  const [year, month] = period.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));

  // Get all deposits for this member in this period
  const batches = await prisma.stockBatch.findMany({
    where: {
      memberId,
      type: 'DEPOSIT',
      receivedDate: { gte: monthStart, lte: monthEnd },
    },
    include: { stockItem: true },
  });

  if (batches.length === 0) {
    // Delete settlement if no deposits
    await prisma.settlementDetail.deleteMany({
      where: { settlement: { memberId, period } },
    });
    await prisma.monthlySettlement.deleteMany({
      where: { memberId, period },
    });
    return null;
  }

  // Group by product
  const productTotals: Record<string, {
    gradeA: number;
    gradeB: number;
    priceA: number;
    priceB: number;
  }> = {};
  let totalGradeA = 0;
  let totalGradeB = 0;
  let totalPayment = 0;

  for (const batch of batches) {
    const pid = batch.stockItemId;
    if (!productTotals[pid]) {
      productTotals[pid] = {
        gradeA: 0,
        gradeB: 0,
        priceA: Number(batch.stockItem.priceGradeA) || 6500,
        priceB: Number(batch.stockItem.priceGradeB) || 5500,
      };
    }
    const qty = Number(batch.qty);
    if (batch.grade === 'A') {
      productTotals[pid].gradeA += qty;
      totalGradeA += qty;
    } else {
      productTotals[pid].gradeB += qty;
      totalGradeB += qty;
    }
  }

  // Calculate payments per product
  const details = Object.entries(productTotals).map(([stockItemId, totals]) => {
    const paymentA = totals.gradeA * totals.priceA;
    const paymentB = totals.gradeB * totals.priceB;
    totalPayment += paymentA + paymentB;

    return {
      stockItemId,
      gradeAQty: totals.gradeA,
      gradeBQty: totals.gradeB,
      priceGradeA: totals.priceA,
      priceGradeB: totals.priceB,
      paymentA,
      paymentB,
      totalPayment: paymentA + paymentB,
    };
  });

  // Get existing settlement to preserve paidAmount and status
  const existing = await prisma.monthlySettlement.findUnique({
    where: { memberId_period: { memberId, period } },
  });

  const totalQty = totalGradeA + totalGradeB;

  // Upsert settlement - preserve paidAmount and status if already paid
  const settlement = await prisma.monthlySettlement.upsert({
    where: { memberId_period: { memberId, period } },
    update: {
      totalQty,
      gradeAQty: totalGradeA,
      gradeBQty: totalGradeB,
      totalPayment,
      processedById: adminId,
      processedAt: new Date(),
    },
    create: {
      memberId,
      period,
      totalQty,
      gradeAQty: totalGradeA,
      gradeBQty: totalGradeB,
      totalPayment,
      processedById: adminId,
      status: 'PENDING',
    },
  });

  // Update details
  await prisma.settlementDetail.deleteMany({
    where: { settlementId: settlement.id },
  });
  await prisma.settlementDetail.createMany({
    data: details.map(d => ({ ...d, settlementId: settlement.id })),
  });

  return settlement;
}
