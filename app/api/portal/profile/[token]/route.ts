import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyPortalSession } from '@/lib/portal-token';
import { z } from 'zod';
import crypto from 'crypto';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notificationPrefs: z.object({
    whatsapp: z.boolean(),
    email: z.boolean(),
    sms: z.boolean(),
  }).optional(),
  // PIN change fields
  currentPin: z.string().optional(),
  newPin: z.string().optional(),
});

const pinChangeSchema = z.object({
  currentPin: z.string().length(6),
  newPin: z.string().length(6),
});

// Helper to hash PIN with SHA-256
function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// GET /api/portal/profile/[token] - Get member profile
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('portal_session');

    // Verify session
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const session = await verifyPortalSession(sessionCookie.value, token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
      select: {
        id: true,
        name: true,
        memberNumber: true,
        phone: true,
        email: true,
        address: true,
        qrCodeData: true,
        notificationPrefs: true,
        joinDate: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      member: {
        ...member,
        notificationPrefs: typeof member.notificationPrefs === 'string'
          ? JSON.parse(member.notificationPrefs)
          : member.notificationPrefs,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/portal/profile/[token] - Update member profile
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('portal_session');

    // Verify session
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const session = await verifyPortalSession(sessionCookie.value, token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    const body = await req.json();

    // Handle PIN change
    if (body.currentPin && body.newPin) {
      const pinValidation = pinChangeSchema.safeParse(body);
      if (!pinValidation.success) {
        return NextResponse.json({ error: 'PIN harus 6 digit' }, { status: 400 });
      }

      const member = await prisma.member.findUnique({
        where: { id: session.memberId },
        select: { portalPin: true },
      });

      if (!member) {
        return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
      }

      // Verify current PIN
      const currentPinHash = hashPin(body.currentPin);
      if (member.portalPin !== currentPinHash) {
        return NextResponse.json({ error: 'PIN saat ini salah' }, { status: 400 });
      }

      // Update to new PIN
      const newPinHash = hashPin(body.newPin);
      await prisma.member.update({
        where: { id: session.memberId },
        data: { portalPin: newPinHash },
      });

      return NextResponse.json({ success: true, message: 'PIN berhasil diubah' });
    }

    const validated = updateSchema.parse(body);

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.email !== undefined) updateData.email = validated.email || null;
    if (validated.address !== undefined) updateData.address = validated.address;
    if (validated.notificationPrefs !== undefined) {
      updateData.notificationPrefs = JSON.stringify(validated.notificationPrefs);
    }

    const member = await prisma.member.update({
      where: { id: session.memberId },
      data: updateData,
      select: {
        id: true,
        name: true,
        memberNumber: true,
        phone: true,
        email: true,
        address: true,
        notificationPrefs: true,
      },
    });

    return NextResponse.json({
      member: {
        ...member,
        notificationPrefs: typeof member.notificationPrefs === 'string'
          ? JSON.parse(member.notificationPrefs)
          : member.notificationPrefs,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
