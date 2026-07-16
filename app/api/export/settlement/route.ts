import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseISO, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import * as XLSX from 'xlsx';

// GET /api/export/settlement
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('start');
    const formatType = searchParams.get('format') || 'xlsx';

    // Extract year and month from start date
    let period = '';
    if (startStr) {
      const date = parseISO(startStr);
      period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    // Get user ID from session
    const userEmail = (session.user as any)?.email || session.user?.email;
    const currentUser = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;

    // Fetch settlements for the period
    const settlements = await prisma.monthlySettlement.findMany({
      where: period ? { period } : {},
      include: {
        member: {
          select: { memberNumber: true, name: true, joinDate: true },
        },
        details: {
          include: {
            stockItem: { select: { name: true, defaultUnit: true } },
          },
        },
      },
      orderBy: { member: { memberNumber: 'asc' } },
    });

    if (settlements.length === 0) {
      // Return empty file if no data
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([{ message: 'Tidak ada data settlement untuk periode ini' }]);
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="settlement-empty.xlsx"`,
        },
      });
    }

    // Calculate totals
    const totals = settlements.reduce(
      (acc, s) => ({
        totalQty: acc.totalQty + Number(s.totalQty),
        totalGradeA: acc.totalGradeA + Number(s.gradeAQty),
        totalGradeB: acc.totalGradeB + Number(s.gradeBQty),
        totalPayment: acc.totalPayment + Number(s.totalPayment),
      }),
      { totalQty: 0, totalGradeA: 0, totalGradeB: 0, totalPayment: 0 }
    );

    // Format period for display
    let periodLabel = 'Semua';
    if (period) {
      const [year, month] = period.split('-').map(Number);
      periodLabel = format(new Date(year, month - 1), 'MMMM yyyy', { locale: idLocale });
    }

    // Prepare data for accounting format (Detail Sheet)
    const accountingData = settlements.map((s, idx) => ({
      'No': idx + 1,
      'No. Anggota': s.member?.memberNumber || '',
      'Nama Anggota': s.member?.name || '',
      'Periode': s.period,
      'Total Qty (L)': Number(s.totalQty),
      'Grade A (L)': Number(s.gradeAQty),
      'Grade B (L)': Number(s.gradeBQty),
      'Jumlah Bayar (Rp)': Number(s.totalPayment),
      'Status': s.status === 'PAID' ? 'Lunas' : s.status === 'PARSIAL' ? 'Parsial' : 'Menunggu',
      'Tanggal Bayar': s.paidAt ? format(new Date(s.paidAt), 'dd/MM/yyyy') : '-',
    }));

    // Summary rows
    const summaryRows = [
      { 'No': '', 'No. Anggota': '', 'Nama Anggota': '', 'Periode': '', 'Total Qty (L)': '', 'Grade A (L)': '', 'Grade B (L)': '', 'Jumlah Bayar (Rp)': '', 'Status': '', 'Tanggal Bayar': '' },
      { 'No': '', 'No. Anggota': 'TOTAL', 'Nama Anggota': `${settlements.length} Anggota`, 'Periode': periodLabel, 'Total Qty (L)': totals.totalQty, 'Grade A (L)': totals.totalGradeA, 'Grade B (L)': totals.totalGradeB, 'Jumlah Bayar (Rp)': totals.totalPayment, 'Status': '', 'Tanggal Bayar': '' },
    ];

    // Combine data with summary
    const allData = [...accountingData, ...summaryRows];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(allData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // No
      { wch: 12 },  // No. Anggota
      { wch: 25 },  // Nama Anggota
      { wch: 12 },  // Periode
      { wch: 12 },  // Total Qty
      { wch: 10 },  // Grade A
      { wch: 10 },  // Grade B
      { wch: 18 },  // Jumlah Bayar
      { wch: 12 },  // Status
      { wch: 12 },  // Tanggal Bayar
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Detail');

    // Create summary sheet
    const summaryData = [
      { 'Keterangan': 'RINGKASAN' },
      { 'Keterangan': 'Periode', 'Nilai': periodLabel },
      { 'Keterangan': 'Jumlah Anggota', 'Nilai': settlements.length },
      { 'Keterangan': 'Total Qty (Liter)', 'Nilai': totals.totalQty },
      { 'Keterangan': 'Total Grade A (Liter)', 'Nilai': totals.totalGradeA },
      { 'Keterangan': 'Total Grade B (Liter)', 'Nilai': totals.totalGradeB },
      { 'Keterangan': 'Total Pembayaran (Rp)', 'Nilai': totals.totalPayment },
      { 'Keterangan': '' },
      { 'Keterangan': 'Rincian Status' },
      { 'Keterangan': 'Menunggu', 'Nilai': settlements.filter(s => s.status === 'PENDING').length },
      { 'Keterangan': 'Parsial', 'Nilai': settlements.filter(s => s.status === 'PARSIAL').length },
      { 'Keterangan': 'Lunas', 'Nilai': settlements.filter(s => s.status === 'PAID').length },
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

    // Add detail breakdown sheet if there are details
    if (settlements.some(s => s.details && s.details.length > 0)) {
      const detailData = settlements.flatMap(s =>
        (s.details || []).map((d) => ({
          'No. Anggota': s.member?.memberNumber || '',
          'Nama': s.member?.name || '',
          'Produk': d.stockItem?.name || '',
          'Unit': d.stockItem?.defaultUnit || '',
          'Grade A Qty': Number(d.gradeAQty),
          'Grade A Harga': Number(d.priceGradeA),
          'Grade A Subtotal': Number(d.paymentA),
          'Grade B Qty': Number(d.gradeBQty),
          'Grade B Harga': Number(d.priceGradeB),
          'Grade B Subtotal': Number(d.paymentB),
          'Total': Number(d.totalPayment),
        }))
      );

      const detailWs = XLSX.utils.json_to_sheet(detailData);
      detailWs['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, detailWs, 'Per Produk');
    }

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Log audit
    if (currentUser) {
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'EXPORT',
          entityType: 'Settlement',
          entityId: period || 'all',
          details: {
            period: period || 'all',
            memberCount: settlements.length,
            totalAmount: totals.totalPayment,
            format: formatType,
          },
        },
      });
    }

    // Return as download
    const filename = `settlement-${period || format(new Date(), 'yyyyMM')}.xlsx`;
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export settlement error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
