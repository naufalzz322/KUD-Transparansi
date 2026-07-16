import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { generateQRDataUrl } from '@/lib/qr';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// POST /api/members/[id]/portal - Regenerate portal token and QR code
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { id } = await params;

    // Generate new token
    const newToken = randomBytes(32).toString('hex');

    // Generate QR code for the portal URL
    // Note: No cache-busting - stored QR should be consistent
    const portalUrl = `${APP_URL}/portal/${newToken}`;
    const qrCodeData = await generateQRDataUrl(portalUrl);

    const member = await prisma.member.update({
      where: { id },
      data: { portalToken: newToken, qrCodeData },
    });

    return NextResponse.json({
      success: true,
      message: 'Token dan QR code berhasil di-regenerate',
      member: {
        id: member.id,
        name: member.name,
        memberNumber: member.memberNumber,
        portalToken: member.portalToken,
        qrCodeData: member.qrCodeData,
      },
    });
  } catch (error) {
    console.error('Regenerate token error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
