import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/member-products - Get all member-product assignments
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const stockItemId = searchParams.get('stockItemId');

    const where: any = {};
    if (memberId) where.memberId = memberId;
    if (stockItemId) where.stockItemId = stockItemId;

    const assignments = await prisma.memberProduct.findMany({
      where,
      include: {
        member: {
          select: { id: true, name: true, memberNumber: true },
        },
        stockItem: {
          select: { id: true, name: true, category: true, defaultUnit: true },
        },
      },
      orderBy: [
        { member: { memberNumber: 'asc' } },
        { isPrimary: 'desc' },
      ],
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Get member products error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/member-products - Assign product to member
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const { memberId, stockItemId, isPrimary = false } = body;

    if (!memberId || !stockItemId) {
      return NextResponse.json(
        { error: 'memberId dan stockItemId wajib diisi' },
        { status: 400 }
      );
    }

    // Check if already assigned
    const existing = await prisma.memberProduct.findUnique({
      where: {
        memberId_stockItemId: { memberId, stockItemId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Produk sudah terdaftar untuk anggota ini' },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primaries for this member
    if (isPrimary) {
      await prisma.memberProduct.updateMany({
        where: { memberId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const assignment = await prisma.memberProduct.create({
      data: { memberId, stockItemId, isPrimary },
      include: {
        member: { select: { id: true, name: true, memberNumber: true } },
        stockItem: { select: { id: true, name: true, category: true, defaultUnit: true } },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Create member product error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/member-products - Remove assignment
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const memberId = searchParams.get('memberId');
    const stockItemId = searchParams.get('stockItemId');

    if (id) {
      await prisma.memberProduct.delete({ where: { id } });
    } else if (memberId && stockItemId) {
      await prisma.memberProduct.delete({
        where: { memberId_stockItemId: { memberId, stockItemId } },
      });
    } else {
      return NextResponse.json(
        { error: 'id atau memberId+stockItemId wajib diisi' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete member product error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
