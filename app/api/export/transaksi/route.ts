import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, parseISO, format } from 'date-fns';
import * as XLSX from 'xlsx';

// GET /api/export/transaksi
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');
    const formatType = searchParams.get('format') || 'xlsx';

    let start = startOfDay(new Date());
    let end = endOfDay(new Date());

    if (startStr && endStr) {
      start = startOfDay(parseISO(startStr));
      end = endOfDay(parseISO(endStr));
    }

    // Fetch all transactions in the date range
    const transactions = await prisma.stockBatch.findMany({
      where: {
        receivedDate: { gte: start, lte: end },
      },
      include: {
        member: {
          select: { memberNumber: true, name: true },
        },
        stockItem: {
          select: { name: true, defaultUnit: true },
        },
      },
      orderBy: { receivedDate: 'asc' },
    });

    // Prepare data for export
    const headers = [
      'Tanggal',
      'No. Anggota',
      'Nama Anggota',
      'Produk',
      'Grade',
      'Quantity',
      'Unit',
      'Tipe',
    ];

    const dataRows = transactions.map(t => [
      format(t.receivedDate, 'dd/MM/yyyy'),
      t.member?.memberNumber || '-',
      t.member?.name || '-',
      t.stockItem?.name || '-',
      t.grade || '-',
      Number(t.qty),
      t.stockItem?.defaultUnit || '-',
      t.type,
    ]);

    // Create workbook
    const wb = XLSX.utils.book_new();
    const allRows = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // Tanggal
      { wch: 12 },  // No. Anggota
      { wch: 25 },  // Nama Anggota
      { wch: 20 },  // Produk
      { wch: 8 },   // Grade
      { wch: 12 },  // Quantity
      { wch: 8 },   // Unit
      { wch: 12 },  // Tipe
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');

    const filename = `transaksi-${format(start, 'yyyyMMdd')}-${format(end, 'yyyyMMdd')}`;
    const buffer = formatType === 'csv'
      ? XLSX.write(wb, { bookType: 'csv', type: 'buffer' })
      : XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': formatType === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.${formatType === 'csv' ? 'csv' : 'xlsx'}"`,
      },
    });
  } catch (error) {
    console.error('Export transaksi error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
