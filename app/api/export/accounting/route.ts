import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import * as XLSX from 'xlsx';

// GET /api/export/accounting - Export settlements to XLSX for accounting software
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period'); // YYYY-MM format

    if (!period) {
      return NextResponse.json({ error: 'Periode harus diisi (format: YYYY-MM)' }, { status: 400 });
    }

    // Get user ID from session
    const userEmail = (session.user as any)?.email || session.user?.email;
    const currentUser = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;

    if (!currentUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 401 });
    }

    // Parse period
    const [year, month] = period.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    // Get settlements for the period
    const settlements = await prisma.monthlySettlement.findMany({
      where: { period },
      include: {
        member: {
          select: {
            memberNumber: true,
            name: true,
            joinDate: true,
          },
        },
        processedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { member: { memberNumber: 'asc' } },
      ],
    });

    if (settlements.length === 0) {
      return NextResponse.json({ error: 'Tidak ada settlement untuk periode ini' }, { status: 404 });
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
    const periodDate = new Date(year, month - 1);
    const periodLabel = format(periodDate, 'MMMM yyyy', { locale: idLocale });

    // Prepare data for accounting format
    // Compatible with Jurnal, Mekar, and similar Indonesian accounting software
    const accountingData = settlements.map((s, idx) => ({
      'No': idx + 1,
      'No. Anggota': s.member.memberNumber,
      'Nama Anggota': s.member.name,
      'Periode': period,
      'Total Qty (L)': Number(s.totalQty),
      'Grade A (L)': Number(s.gradeAQty),
      'Grade B (L)': Number(s.gradeBQty),
      'Jumlah Bayar (Rp)': Number(s.totalPayment),
      'Status': s.status === 'PAID' ? 'Lunas' : s.status === 'PARSIAL' ? 'Parsial' : 'Menunggu',
      'Tanggal Bayar': s.paidAt ? format(new Date(s.paidAt), 'dd/MM/yyyy') : '-',
      'Diproses Oleh': s.processedBy?.name || '-',
      'Tanggal Proses': s.processedAt ? format(new Date(s.processedAt), 'dd/MM/yyyy') : '-',
    }));

    // Summary rows
    const summaryRows = [
      { 'No': '', 'No. Anggota': '', 'Nama Anggota': '', 'Periode': '', 'Total Qty (L)': '', 'Grade A (L)': '', 'Grade B (L)': '', 'Jumlah Bayar (Rp)': '', 'Status': '', 'Tanggal Bayar': '', 'Diproses Oleh': '', 'Tanggal Proses': '' },
      { 'No': '', 'No. Anggota': 'TOTAL', 'Nama Anggota': `${settlements.length} Anggota`, 'Periode': periodLabel, 'Total Qty (L)': totals.totalQty, 'Grade A (L)': totals.totalGradeA, 'Grade B (L)': totals.totalGradeB, 'Jumlah Bayar (Rp)': totals.totalPayment, 'Status': '', 'Tanggal Bayar': '', 'Diproses Oleh': '', 'Tanggal Proses': '' },
    ];

    // Combine data with summary
    const allData = [...accountingData, ...summaryRows];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(allData);

    // Set column widths for better readability
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
      { wch: 18 },  // Diproses Oleh
      { wch: 12 },  // Tanggal Proses
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Settlement');

    // Create summary sheet
    const summaryData = [
      { 'Keterangan': 'Detail' },
      { 'Keterangan': 'Periode', 'Nilai': periodLabel },
      { 'Keterangan': 'Jumlah Anggota', 'Nilai': settlements.length },
      { 'Keterangan': 'Total Qty (Liter)', 'Nilai': totals.totalQty },
      { 'Keterangan': 'Total Grade A (Liter)', 'Nilai': totals.totalGradeA },
      { 'Keterangan': 'Total Grade B (Liter)', 'Nilai': totals.totalGradeB },
      { 'Keterangan': 'Total Pembayaran (Rp)', 'Nilai': totals.totalPayment },
      { 'Keterangan': '' },
      { 'Keterangan': 'Rincian Status' },
      { 'Keterangan': 'Pending', 'Nilai': settlements.filter(s => s.status === 'PENDING').length },
      { 'Keterangan': 'Parsial', 'Nilai': settlements.filter(s => s.status === 'PARSIAL').length },
      { 'Keterangan': 'Lunas', 'Nilai': settlements.filter(s => s.status === 'PAID').length },
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'EXPORT',
        entityType: 'Settlement',
        entityId: period,
        details: {
          period,
          memberCount: settlements.length,
          totalAmount: totals.totalPayment,
          format: 'xlsx',
        },
      },
    });

    // Return as download
    const filename = `settlement-${period}-${format(new Date(), 'yyyyMMdd')}.xlsx`;
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Accounting export error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
