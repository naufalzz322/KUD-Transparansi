import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/stocks - Get all stock items with their batches
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // OK, WARNING, CRITICAL, EXPIRED
    const category = searchParams.get('category'); // MINUMAN, SAYURAN, BUAH, LAINNYA

    const where: any = {};
    if (category) where.category = category;

    const stockItems = await prisma.stockItem.findMany({
      where,
      include: {
        stockBatches: {
          orderBy: { receivedDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate summary for each item
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const itemsWithSummary = stockItems.map((item) => {
      // Filter non-expired batches
      const activeBatches = item.stockBatches.filter(
        (b) => b.status !== 'EXPIRED'
      );

      // Calculate totals
      const totalQty = activeBatches.reduce(
        (sum, b) => sum + Number(b.qty),
        0
      );

      const gradeA = activeBatches
        .filter((b) => b.grade === 'A')
        .reduce((sum, b) => sum + Number(b.qty), 0);

      const gradeB = activeBatches
        .filter((b) => b.grade === 'B')
        .reduce((sum, b) => sum + Number(b.qty), 0);

      // Find nearest expiry
      const nonExpiredBatches = activeBatches.filter(
        (b) => new Date(b.expiryDate) >= todayStart
      );

      let nearestExpiry = null;
      let daysRemaining = null;
      let worstStatus: 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED' = 'OK';

      if (nonExpiredBatches.length > 0) {
        nearestExpiry = nonExpiredBatches.reduce((nearest, b) => {
          const expDate = new Date(b.expiryDate);
          if (!nearest || expDate < nearest) return expDate;
          return nearest;
        }, nonExpiredBatches[0].expiryDate);

        const days = Math.ceil(
          (new Date(nearestExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysRemaining = days;

        if (days <= 0) worstStatus = 'EXPIRED';
        else if (days === 1) worstStatus = 'CRITICAL';
        else if (days <= 3) worstStatus = 'WARNING';
      }

      // Check for expired batches
      const expiredBatches = item.stockBatches.filter(
        (b) => b.status === 'EXPIRED'
      );
      if (expiredBatches.length > 0) {
        worstStatus = 'EXPIRED';
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        defaultUnit: item.defaultUnit,
        shelfLifeDays: item.shelfLifeDays,
        priceGradeA: item.priceGradeA ? Number(item.priceGradeA) : null,
        priceGradeB: item.priceGradeB ? Number(item.priceGradeB) : null,
        totalQty,
        gradeA,
        gradeB,
        batchCount: activeBatches.length,
        expiredBatchCount: expiredBatches.length,
        nearestExpiry,
        daysRemaining,
        status: worstStatus,
        batches: activeBatches.slice(0, 10), // Latest 10 batches
      };
    });

    // Filter by status if requested
    let filteredItems = itemsWithSummary;
    if (status) {
      filteredItems = itemsWithSummary.filter((item) => item.status === status);
    }

    // Sort by status (critical first)
    const statusOrder = { CRITICAL: 0, WARNING: 1, EXPIRED: 2, OK: 3 };
    filteredItems.sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    );

    return NextResponse.json({
      items: filteredItems,
      total: filteredItems.length,
      totalAll: itemsWithSummary.length,
      byStatus: {
        ok: itemsWithSummary.filter((i) => i.status === 'OK').length,
        warning: itemsWithSummary.filter((i) => i.status === 'WARNING').length,
        critical: itemsWithSummary.filter((i) => i.status === 'CRITICAL').length,
        expired: itemsWithSummary.filter((i) => i.status === 'EXPIRED').length,
      },
    });
  } catch (error) {
    console.error('Get stocks error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/stocks - Create new stock item
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      category = 'LAINNYA',
      defaultUnit = 'unit',
      shelfLifeDays = 3,
      priceGradeA,
      priceGradeB,
      note,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nama produk harus diisi' },
        { status: 400 }
      );
    }

    // Check if item already exists
    const existing = await prisma.stockItem.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Produk dengan nama ini sudah ada' },
        { status: 400 }
      );
    }

    const stockItem = await prisma.stockItem.create({
      data: {
        name,
        category,
        defaultUnit,
        shelfLifeDays: parseInt(shelfLifeDays) || 3,
        priceGradeA: priceGradeA ? parseFloat(priceGradeA) : null,
        priceGradeB: priceGradeB ? parseFloat(priceGradeB) : null,
        note,
      },
    });

    return NextResponse.json({ item: stockItem }, { status: 201 });
  } catch (error) {
    console.error('Create stock error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/stocks - Update stock item
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      category,
      defaultUnit,
      shelfLifeDays,
      priceGradeA,
      priceGradeB,
      note,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID harus diisi' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (defaultUnit !== undefined) updateData.defaultUnit = defaultUnit;
    if (shelfLifeDays !== undefined) updateData.shelfLifeDays = parseInt(shelfLifeDays);
    if (priceGradeA !== undefined) updateData.priceGradeA = priceGradeA ? parseFloat(priceGradeA) : null;
    if (priceGradeB !== undefined) updateData.priceGradeB = priceGradeB ? parseFloat(priceGradeB) : null;
    if (note !== undefined) updateData.note = note;
    if (isActive !== undefined) updateData.isActive = isActive;

    const stockItem = await prisma.stockItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ item: stockItem });
  } catch (error) {
    console.error('Update stock error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/stocks - Delete stock item
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID harus diisi' }, { status: 400 });
    }

    // Delete associated batches first
    await prisma.stockBatch.deleteMany({
      where: { stockItemId: id },
    });

    // Delete the item
    await prisma.stockItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete stock error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
