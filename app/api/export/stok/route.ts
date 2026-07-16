import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

// GET /api/export/stok
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formatType = searchParams.get('format') || 'xlsx';

    // Fetch stock items with their batches and member info
    const stockItems = await prisma.stockItem.findMany({
      where: { isActive: true },
      include: {
        stockBatches: {
          where: { status: { not: 'EXPIRED' } },
          include: {
            member: { select: { name: true } },
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Prepare data for export
    const headers = ['Produk', 'Kategori', 'Unit', 'Member', 'Qty', 'Grade', 'Tanggal Masuk', 'Expiry', 'Sisa Hari', 'Status'];
    const dataRows: any[][] = [];

    for (const item of stockItems) {
      if (item.stockBatches.length === 0) {
        dataRows.push([
          item.name,
          item.category,
          item.defaultUnit,
          '-',
          0,
          '-',
          '-',
          '-',
          '-',
          '-',
        ]);
      } else {
        for (const batch of item.stockBatches) {
          const receivedDate = batch.receivedDate ? format(new Date(batch.receivedDate), 'dd/MM/yyyy') : '-';
          const expiryDate = batch.expiryDate ? format(new Date(batch.expiryDate), 'dd/MM/yyyy') : '-';
          const daysRemaining = batch.expiryDate
            ? Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          dataRows.push([
            item.name,
            item.category,
            item.defaultUnit,
            batch.member?.name || '-',
            Number(batch.qty),
            batch.grade || '-',
            receivedDate,
            expiryDate,
            daysRemaining !== null ? (daysRemaining > 0 ? daysRemaining : 'Kedaluwarsa') : '-',
            batch.status,
          ]);
        }
      }
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    const allRows = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 },  // Produk
      { wch: 12 },  // Kategori
      { wch: 8 },   // Unit
      { wch: 25 },  // Member
      { wch: 10 },  // Qty
      { wch: 8 },   // Grade
      { wch: 12 },  // Tanggal Masuk
      { wch: 12 },  // Expiry
      { wch: 10 },  // Sisa Hari
      { wch: 10 },  // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Stok');

    const filename = `stok-${new Date().toISOString().split('T')[0]}`;
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
    console.error('Export stok error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
