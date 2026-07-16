import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';

// GET /api/export/anggota
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formatType = searchParams.get('format') || 'xlsx';

    // Fetch all members with relevant data
    const members = await prisma.member.findMany({
      select: {
        id: true,
        memberNumber: true,
        name: true,
        phone: true,
        email: true,
        isActive: true,
        joinDate: true,
        portalToken: true,
      },
      orderBy: { memberNumber: 'asc' },
    });

    // Prepare data for export
    const headers = ['No. Anggota', 'Nama', 'Telepon', 'Email', 'Status', 'Tanggal Gabung', 'Akses Portal'];
    const dataRows = members.map(m => [
      m.memberNumber,
      m.name,
      m.phone || '-',
      m.email || '-',
      m.isActive ? 'Aktif' : 'Nonaktif',
      m.joinDate ? new Date(m.joinDate).toLocaleDateString('id-ID') : '-',
      m.portalToken ? 'Ya' : 'Tidak',
    ]);

    // Create workbook
    const wb = XLSX.utils.book_new();
    const allRows = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // No. Anggota
      { wch: 25 },  // Nama
      { wch: 15 },  // Telepon
      { wch: 25 },  // Email
      { wch: 10 },  // Status
      { wch: 15 },  // Tanggal Gabung
      { wch: 12 },  // Akses Portal
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Anggota');

    const filename = `anggota-${new Date().toISOString().split('T')[0]}`;
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
    console.error('Export anggota error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
