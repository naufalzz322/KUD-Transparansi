import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/settlements/[id] - Update settlement status (mark as PAID, PARSIAL, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, paidAmount, paidAt } = body;

    const validStatuses = ['PENDING', 'PARSIAL', 'PAID'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status harus salah satu dari: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user for audit
    const userEmail = (session.user as any)?.email || session.user?.email;
    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    const updateData: Record<string, unknown> = { status };
    if (status === 'PAID' && paidAt) {
      updateData.paidAt = new Date(paidAt);
    }
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
    }

    const settlement = await prisma.monthlySettlement.update({
      where: { id },
      data: updateData,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
          },
        },
        processedBy: {
          select: { name: true },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser?.id || 'unknown',
        action: status === 'PAID' ? 'PAYMENT' : 'UPDATE',
        entityType: 'Settlement',
        entityId: id,
        details: {
          previousStatus: 'N/A',
          newStatus: status,
          paidAmount: paidAmount,
          memberName: settlement.member.name,
          period: settlement.period,
          totalPayment: Number(settlement.totalPayment),
        },
      },
    });

    return NextResponse.json({ settlement });
  } catch (error) {
    console.error('Update settlement error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
