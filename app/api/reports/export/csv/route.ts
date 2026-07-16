import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// GET /api/reports/export/csv
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM
    const stockItemId = searchParams.get('itemId'); // Optional filter

    const month = monthParam ? new Date(monthParam + '-01') : new Date();
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const whereClause: any = {
      receivedDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      type: 'DEPOSIT',
    };

    if (stockItemId) {
      whereClause.stockItemId = stockItemId;
    }

    // Get all deposits (stock batches) for the month
    const deposits = await prisma.stockBatch.findMany({
      where: whereClause,
      include: {
        member: {
          select: {
            memberNumber: true,
            name: true,
          },
        },
        stockItem: {
          select: {
            name: true,
            defaultUnit: true,
          },
        },
      },
      orderBy: [
        { receivedDate: 'asc' },
        { member: { memberNumber: 'asc' } },
      ],
    });

    // Generate CSV
    const unit = deposits[0]?.unit || 'unit';
    const productName = deposits[0]?.stockItem?.name || 'Semua Produk';
    const headers = ['No', 'Tanggal', 'No. Anggota', 'Nama', `Qty (${unit})`, 'Grade', 'Status'];
    const rows = deposits.map((d, idx) => [
      idx + 1,
      format(d.receivedDate, 'dd/MM/yyyy'),
      d.member?.memberNumber || '-',
      d.member?.name || '-',
      Number(d.qty).toFixed(1),
      d.grade || '-',
      d.status,
    ]);

    const csvContent = [
      `Produk: ${productName}`,
      `Periode: ${format(month, 'MMMM yyyy')}`,
      '',
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="laporan-setoran-${format(month, 'yyyy-MM')}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
