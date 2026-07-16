import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, parseISO, format } from 'date-fns';
import * as XLSX from 'xlsx';

// GET /api/export/setoran
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

    // Fetch deposit data with member and stock item info
    const deposits = await prisma.stockBatch.findMany({
      where: {
        receivedDate: { gte: start, lte: end },
        type: 'DEPOSIT',
      },
      include: {
        member: {
          select: { id: true, name: true, memberNumber: true },
        },
        stockItem: {
          select: { id: true, name: true, defaultUnit: true },
        },
      },
      orderBy: { receivedDate: 'asc' },
    });

    // Prepare data for export
    const headers = ['Tanggal', 'No. Anggota', 'Nama', 'Produk', 'Grade', 'Quantity', 'Unit'];
    const dataRows = deposits.map(d => [
      format(d.receivedDate, 'dd/MM/yyyy'),
      d.member?.memberNumber || '-',
      d.member?.name || '-',
      d.stockItem?.name || '-',
      d.grade || '-',
      Number(d.qty),
      d.stockItem?.defaultUnit || '-',
    ]);

    // Create workbook with formatted worksheet
    const wb = XLSX.utils.book_new();

    // Add header row
    const allRows = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Set column widths for readability
    ws['!cols'] = [
      { wch: 12 },  // Tanggal
      { wch: 12 },  // No. Anggota
      { wch: 25 },  // Nama
      { wch: 20 },  // Produk
      { wch: 8 },   // Grade
      { wch: 12 },  // Quantity
      { wch: 8 },   // Unit
    ];

    // Add worksheet
    XLSX.utils.book_append_sheet(wb, ws, 'Setoran');

    // Generate file buffer
    const filename = `setoran-${format(start, 'yyyyMMdd')}-${format(end, 'yyyyMMdd')}`;
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
    console.error('Export setoran error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
