import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateDepositPDF } from '@/lib/pdf';
import { startOfMonth, endOfMonth } from 'date-fns';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM

    // Verify session cookie
    const sessionCookie = req.headers.get('cookie') || '';
    const match = sessionCookie.match(/portal_session=([^;]+)/);

    if (!match) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(match[1], JWT_SECRET);
      if (payload.memberToken !== token) {
        return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    // Find member by token
    const member = await prisma.member.findUnique({
      where: { portalToken: token },
    });

    if (!member) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    }

    // Get month to query
    const month = monthParam ? new Date(monthParam + '-01') : new Date();
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    // Get stock batches (deposits) for the month
    const batches = await prisma.stockBatch.findMany({
      where: {
        memberId: member.id,
        receivedDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        type: 'DEPOSIT',
      },
      include: {
        stockItem: true,
      },
      orderBy: { receivedDate: 'asc' },
    });

    // Calculate stats
    const totalQty = batches.reduce((sum, b) => sum + Number(b.qty), 0);
    const daysCount = batches.filter((b) => Number(b.qty) > 0).length;
    const avgPerDay = daysCount > 0 ? totalQty / daysCount : 0;

    // Generate PDF and get as blob
    const doc = generateDepositPDF({
      memberName: member.name,
      memberNumber: member.memberNumber,
      month,
      deposits: batches.map((b) => ({
        date: b.receivedDate,
        qty: Number(b.qty),
        unit: b.unit,
        grade: b.grade,
        status: Number(b.qty) > 0 ? 'deposited' : 'holiday',
        productName: b.stockItem?.name,
      })),
      totalQty,
      avgPerDay,
      daysCount,
    });

    // Get PDF as blob using jsPDF 2.x API
    const blob = doc.output('blob');
    console.log('PDF blob size:', blob.size);

    // Return PDF
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="riwayat-setoran-${member.memberNumber}-${month.toISOString().slice(0, 7)}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
