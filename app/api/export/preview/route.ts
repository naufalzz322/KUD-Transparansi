import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, parseISO, format } from 'date-fns';

// GET /api/export/preview
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    let start = startOfDay(new Date());
    let end = endOfDay(new Date());

    if (startStr && endStr) {
      start = startOfDay(parseISO(startStr));
      end = endOfDay(parseISO(endStr));
    }

    let count = 0;
    let stats: Array<{ label: string; value: string }> = [];
    let rows: any[] = [];
    let headers: string[] = [];

    switch (type) {
      case 'setoran': {
        const deposits = await prisma.stockBatch.findMany({
          where: {
            receivedDate: { gte: start, lte: end },
            type: 'DEPOSIT',
          },
          include: {
            member: { select: { name: true, memberNumber: true } },
            stockItem: { select: { name: true, defaultUnit: true } },
          },
          orderBy: { receivedDate: 'desc' },
          take: 10,
        });
        count = await prisma.stockBatch.count({
          where: {
            receivedDate: { gte: start, lte: end },
            type: 'DEPOSIT',
          },
        });

        const total = await prisma.stockBatch.aggregate({
          where: { receivedDate: { gte: start, lte: end }, type: 'DEPOSIT' },
          _sum: { qty: true },
        });

        const gradeA = await prisma.stockBatch.aggregate({
          where: { receivedDate: { gte: start, lte: end }, type: 'DEPOSIT', grade: 'A' },
          _sum: { qty: true },
        });

        const gradeB = await prisma.stockBatch.aggregate({
          where: { receivedDate: { gte: start, lte: end }, type: 'DEPOSIT', grade: 'B' },
          _sum: { qty: true },
        });

        stats = [
          { label: 'Total Setoran', value: Number(total._sum.qty || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }) },
          { label: 'Grade A', value: Number(gradeA._sum.qty || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }) },
          { label: 'Grade B', value: Number(gradeB._sum.qty || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }) },
          { label: 'Batch', value: deposits.length.toLocaleString('id-ID') },
        ];

        headers = ['Tanggal', 'Anggota', 'Produk', 'Qty', 'Grade', 'Unit'];
        rows = deposits.map(d => ({
          date: format(new Date(d.receivedDate), 'dd/MM/yyyy'),
          member: d.member?.name || '-',
          product: d.stockItem?.name || '-',
          qty: d.qty,
          grade: d.grade || '-',
          unit: d.stockItem?.defaultUnit || '-',
        }));
        break;
      }

      case 'anggota': {
        const members = await prisma.member.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        count = await prisma.member.count();
        const active = await prisma.member.count({ where: { isActive: true } });
        const inactive = await prisma.member.count({ where: { isActive: false } });
        const withPortal = await prisma.member.count({ where: { isActive: true } });

        stats = [
          { label: 'Total', value: count.toLocaleString('id-ID') },
          { label: 'Aktif', value: active.toLocaleString('id-ID') },
          { label: 'Nonaktif', value: inactive.toLocaleString('id-ID') },
          { label: 'Punya Portal', value: withPortal.toLocaleString('id-ID') },
        ];

        headers = ['ID', 'Nama', 'HP', 'Email', 'Status'];
        rows = members.map(m => ({
          id: m.memberNumber,
          name: m.name,
          phone: m.phone || '-',
          email: m.email || '-',
          status: m.isActive ? 'Aktif' : 'Nonaktif',
        }));
        break;
      }

      case 'stok': {
        const stockItems = await prisma.stockItem.findMany({
          where: { isActive: true },
          include: {
            stockBatches: {
              where: { status: { not: 'EXPIRED' } },
              include: {
                member: { select: { name: true } },
              },
              orderBy: { expiryDate: 'asc' },
              take: 5,
            },
          },
          orderBy: { name: 'asc' },
        });
        count = await prisma.stockItem.count({ where: { isActive: true } });

        const batches = await prisma.stockBatch.count({
          where: { status: { not: 'EXPIRED' } },
        });

        const totalQty = await prisma.stockBatch.aggregate({
          where: { status: { not: 'EXPIRED' } },
          _sum: { qty: true },
        });

        const stockItemsWithUnits = await prisma.stockItem.findMany({
          where: { isActive: true },
          select: { defaultUnit: true },
        });
        const distinctUnits = Array.from(new Set(stockItemsWithUnits.map(i => i.defaultUnit)));
        const unitDisplay = distinctUnits.length === 1 ? distinctUnits[0] : distinctUnits.join(', ');

        const qtyValue = Number(totalQty._sum.qty || 0);
        const formattedQty = Number.isInteger(qtyValue) ? qtyValue.toLocaleString('id-ID') : qtyValue.toFixed(2).replace('.', ',');

        stats = [
          { label: 'Produk Aktif', value: count.toLocaleString('id-ID') },
          { label: 'Batch', value: batches.toLocaleString('id-ID') },
          { label: 'Total Qty', value: formattedQty },
          { label: 'Unit', value: unitDisplay },
        ];

        headers = ['Produk', 'Member', 'Qty', 'Grade', 'Tanggal Masuk', 'Expiry'];
        rows = stockItems.flatMap(item =>
          item.stockBatches.slice(0, 3).map(b => ({
            product: item.name,
            member: b.member?.name || '-',
            qty: b.qty,
            grade: b.grade || '-',
            received: format(new Date(b.receivedDate), 'dd/MM/yyyy'),
            expiry: b.expiryDate ? format(new Date(b.expiryDate), 'dd/MM/yyyy') : '-',
          }))
        ).slice(0, 10);
        break;
      }

      case 'settlement': {
        const period = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
        const settlements = await prisma.monthlySettlement.findMany({
          where: { period },
          include: { member: { select: { name: true, memberNumber: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        count = await prisma.monthlySettlement.count({ where: { period } });

        const totalPayment = await prisma.monthlySettlement.aggregate({
          where: { period },
          _sum: { totalPayment: true },
        });

        const paid = await prisma.monthlySettlement.count({
          where: { period, status: 'PAID' },
        });

        stats = [
          { label: 'Settlement', value: count.toLocaleString('id-ID') },
          { label: 'Total Bayar', value: `Rp ${Number(totalPayment._sum.totalPayment || 0).toLocaleString('id-ID')}` },
          { label: 'Lunas', value: paid.toLocaleString('id-ID') },
          { label: 'Outstanding', value: (count - paid).toLocaleString('id-ID') },
        ];

        headers = ['Periode', 'Anggota', 'Total', 'Status'];
        rows = settlements.map(s => ({
          period: s.period,
          member: s.member?.name || '-',
          total: `Rp ${Number(s.totalPayment).toLocaleString('id-ID')}`,
          status: s.status,
        }));
        break;
      }

      case 'transaksi': {
        const transactions = await prisma.stockBatch.findMany({
          where: { receivedDate: { gte: start, lte: end } },
          include: {
            member: { select: { name: true, memberNumber: true } },
            stockItem: { select: { name: true, defaultUnit: true } },
          },
          orderBy: { receivedDate: 'desc' },
          take: 10,
        });
        count = await prisma.stockBatch.count({
          where: { receivedDate: { gte: start, lte: end } },
        });

        const total = await prisma.stockBatch.aggregate({
          where: { receivedDate: { gte: start, lte: end } },
          _sum: { qty: true },
        });

        const members = await prisma.stockBatch.groupBy({
          by: ['memberId'],
          where: { receivedDate: { gte: start, lte: end } },
        });

        stats = [
          { label: 'Transaksi', value: count.toLocaleString('id-ID') },
          { label: 'Total Qty', value: Number(total._sum.qty || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }) },
          { label: 'Anggota', value: members.length.toLocaleString('id-ID') },
          { label: 'Hari', value: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)).toLocaleString('id-ID') },
        ];

        headers = ['Tanggal', 'Anggota', 'Produk', 'Qty', 'Tipe'];
        rows = transactions.map(t => ({
          date: format(new Date(t.receivedDate), 'dd/MM/yyyy'),
          member: t.member?.name || '-',
          product: t.stockItem?.name || '-',
          qty: t.qty,
          type: t.type,
        }));
        break;
      }

      default:
        return NextResponse.json({ error: 'Tipe tidak valid' }, { status: 400 });
    }

    return NextResponse.json({ count, stats, rows, headers });
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
