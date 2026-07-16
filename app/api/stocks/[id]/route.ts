import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/stocks/[id] - Update a stock batch
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Only allow updating specific fields (not relations)
    const { notes, qty } = body;

    const updateData: Record<string, unknown> = {};
    if (notes !== undefined) updateData.notes = notes;
    if (qty !== undefined) updateData.qty = qty;

    const batch = await prisma.stockBatch.update({
      where: { id },
      data: updateData,
      include: {
        stockItem: { select: { name: true, defaultUnit: true } },
        member: { select: { name: true, memberNumber: true } },
      },
    });

    return NextResponse.json({ batch });
  } catch (error) {
    console.error('Update stock batch error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/stocks/[id] - Delete a stock batch
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.stockBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete stock batch error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
