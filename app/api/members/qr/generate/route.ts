import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateQRDataUrl } from '@/lib/qr';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

/**
 * POST /api/members/qr/generate
 * Generate and save QR codes for members
 *
 * Body:
 * - memberIds?: string[] - Specific members to regenerate (if empty, generates for all active members without QR)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { memberIds } = body;

    // Find members that need QR codes
    const whereClause = memberIds && memberIds.length > 0
      ? { id: { in: memberIds }, isActive: true }
      : { isActive: true, qrCodeData: null };

    const members = await prisma.member.findMany({
      where: whereClause,
      select: { id: true, name: true, portalToken: true },
    });

    if (members.length === 0) {
      return NextResponse.json({
        message: 'Tidak ada anggota yang membutuhkan pembuatan QR code',
        generated: 0,
      });
    }

    const results: Array<{ memberId: string; name: string; success: boolean }> = [];
    let generated = 0;
    let failed = 0;

    for (const member of members) {
      try {
        // Generate QR code for the portal URL
        // Note: No cache-busting parameter here - QR code should be consistent
        // Fresh QR is generated in portal modal for visual uniqueness
        const portalUrl = `${APP_URL}/portal/${member.portalToken}`;
        const qrDataUrl = await generateQRDataUrl(portalUrl);

        await prisma.member.update({
          where: { id: member.id },
          data: { qrCodeData: qrDataUrl },
        });

        results.push({ memberId: member.id, name: member.name, success: true });
        generated++;
      } catch (error) {
        console.error(`Gagal membuat QR untuk ${member.name}:`, error);
        results.push({ memberId: member.id, name: member.name, success: false });
        failed++;
      }

      // Small delay between generations
      if (members.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      message: `QR code berhasil dibuat untuk ${generated} anggota`,
      generated,
      failed,
      total: members.length,
      results,
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/**
 * GET /api/members/qr/generate
 * Get status of QR code generation
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const totalMembers = await prisma.member.count({
      where: { isActive: true },
    });

    const withQR = await prisma.member.count({
      where: { isActive: true, qrCodeData: { not: null } },
    });

    const withoutQR = totalMembers - withQR;

    return NextResponse.json({
      totalMembers,
      withQR,
      withoutQR,
      progress: totalMembers > 0 ? Math.round((withQR / totalMembers) * 100) : 0,
    });
  } catch (error) {
    console.error('QR status error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
