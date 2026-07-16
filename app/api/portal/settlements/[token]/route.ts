import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find member by portal token
    const member = await prisma.member.findUnique({
      where: { portalToken: token },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });
    }

    // Fetch settlement history
    const settlements = await prisma.monthlySettlement.findMany({
      where: { memberId: member.id },
      orderBy: { period: 'desc' },
      include: {
        details: {
          include: {
            stockItem: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Calculate totals
    const totalPaid = settlements
      .filter(s => s.status === 'PAID')
      .reduce((sum, s) => sum + Number(s.paidAmount), 0);

    const totalPending = settlements
      .filter(s => s.status !== 'PAID')
      .reduce((sum, s) => sum + (Number(s.totalPayment) - Number(s.paidAmount)), 0);

    return NextResponse.json({
      settlements: settlements.map(s => ({
        id: s.id,
        period: s.period,
        totalQty: Number(s.totalQty),
        gradeAQty: Number(s.gradeAQty),
        gradeBQty: Number(s.gradeBQty),
        totalPayment: Number(s.totalPayment),
        paidAmount: Number(s.paidAmount),
        remainingAmount: Number(s.totalPayment) - Number(s.paidAmount),
        status: s.status,
        processedAt: s.processedAt,
        paidAt: s.paidAt,
        details: s.details.map(d => ({
          stockItemName: d.stockItem.name,
          gradeAQty: Number(d.gradeAQty),
          gradeBQty: Number(d.gradeBQty),
          priceGradeA: Number(d.priceGradeA),
          priceGradeB: Number(d.priceGradeB),
          paymentA: Number(d.paymentA),
          paymentB: Number(d.paymentB),
          totalPayment: Number(d.totalPayment),
        })),
      })),
      summary: {
        totalPaid,
        totalPending,
        totalSettlements: settlements.length,
      },
    });
  } catch (error) {
    console.error('Member settlements error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
