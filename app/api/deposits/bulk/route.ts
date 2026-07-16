import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { updateMemberSettlement } from '@/lib/settlement';

// POST /api/deposits/bulk - Bulk create/update stock batches
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    // Get admin user ID
    const userEmail = (session.user as any)?.email || session.user?.email;
    const currentUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!currentUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 401 });
    }

    const body = await req.json();
    const { date, stockItemId, deposits } = body;

    if (!date || !deposits || !Array.isArray(deposits)) {
      return NextResponse.json(
        { error: 'date dan array deposits wajib diisi' },
        { status: 400 }
      );
    }

    // Get stock item to determine shelf life
    let stockItem = null;
    if (stockItemId) {
      stockItem = await prisma.stockItem.findUnique({ where: { id: stockItemId } });
    }

    // If no stock item specified, use "Susu Sapi" as default
    if (!stockItem) {
      stockItem = await prisma.stockItem.findFirst({ where: { name: 'Susu Sapi' } });
    }

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Stock item tidak ditemukan. Pastikan ada minimal 1 produk.' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    const receivedDate = startOfDay(targetDate);
    const expiryDate = new Date(receivedDate);
    expiryDate.setDate(expiryDate.getDate() + stockItem.shelfLifeDays);

    // Calculate period (YYYY-MM format)
    const period = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

    // Track affected members for settlement update
    const affectedMembers = new Set<string>();

    const results: Array<{ memberId: string; success: boolean; batchId?: string; error?: string }> = [];

    for (const item of deposits) {
      const { memberId, qty, grade, notes } = item;

      if (!memberId || qty === undefined) {
        results.push({ memberId, success: false, error: 'memberId dan qty wajib diisi' });
        continue;
      }

      try {
        if (qty === 0) {
          // Delete batch if exists
          await prisma.stockBatch.deleteMany({
            where: {
              memberId,
              receivedDate,
              stockItemId: stockItem!.id,
              type: 'DEPOSIT',
            },
          });
          affectedMembers.add(memberId);
          results.push({ memberId, success: true });
        } else {
          // Upsert batch
          const batch = await prisma.stockBatch.upsert({
            where: {
              id: item.batchId || `temp-${memberId}-${date}`, // temp id for new records
            },
            update: {
              qty,
              grade: grade || null,
              notes: notes || null,
            },
            create: {
              stockItemId: stockItem!.id,
              memberId,
              type: 'DEPOSIT',
              qty,
              unit: stockItem!.defaultUnit,
              grade: grade || null,
              receivedDate,
              expiryDate,
              notes: notes || null,
            },
          });
          affectedMembers.add(memberId);
          results.push({ memberId, success: true, batchId: batch.id });
        }
      } catch (err) {
        console.error('Deposit error:', err);
        results.push({ memberId, success: false, error: 'Error database' });
      }
    }

    // Update settlements for affected members
    const updatedSettlements = [];
    const memberIds = Array.from(affectedMembers);
    for (const memberId of memberIds) {
      const settlement = await updateMemberSettlement(memberId, period, currentUser.id);
      if (settlement) updatedSettlements.push(settlement);
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: successCount === deposits.length,
      processed: successCount,
      total: deposits.length,
      stockItem: {
        id: stockItem.id,
        name: stockItem.name,
        shelfLifeDays: stockItem.shelfLifeDays,
      },
      results,
      updatedSettlements,
    });
  } catch (error) {
    console.error('Bulk deposit error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
