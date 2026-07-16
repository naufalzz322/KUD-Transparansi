import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendDepositNotification } from '@/lib/wa';
import { sendDepositEmail } from '@/lib/email';

const EMAIL_ENABLED = !!process.env.RESEND_API_KEY;

// POST /api/notifications/send
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const { batchIds, channel } = body;

    if (!batchIds || !Array.isArray(batchIds)) {
      return NextResponse.json(
        { error: 'Array batchIds wajib diisi' },
        { status: 400 }
      );
    }

    // Get batches with member info
    const batches = await prisma.stockBatch.findMany({
      where: { id: { in: batchIds } },
      include: { member: true, stockItem: true },
    });

    if (batches.length === 0) {
      return NextResponse.json({ error: 'Batch tidak ditemukan' }, { status: 404 });
    }

    const recordedBy = session.user?.name || 'Admin';
    const sendWa = !channel || channel === 'whatsapp' || channel === 'both';
    const sendEmailOnly = channel === 'email';

    // Send WhatsApp notifications
    let whatsappResults = { success: 0, failed: 0, failedMembers: [] as string[] };
    const emailCandidates = [];

    if (sendWa) {
      for (const batch of batches) {
        if (!batch.member) continue;

        const member = {
          name: batch.member.name,
          phone: batch.member.phone,
          portalToken: batch.member.portalToken,
        };

        const deposit = {
          depositDate: batch.receivedDate,
          qty: Number(batch.qty),
          unit: batch.unit,
          grade: batch.grade,
        };

        const result = await sendDepositNotification(member, deposit, recordedBy);

        if (result.success) {
          whatsappResults.success++;
        } else {
          whatsappResults.failed++;
          whatsappResults.failedMembers.push(batch.member.name);
          // Collect for email fallback if has email
          if (batch.member.email && EMAIL_ENABLED) {
            emailCandidates.push(batch);
          }
        }
      }
    }

    // Email: send only if email-only mode or as WA fallback
    let emailResults = { success: 0, failed: 0, fallbackCount: 0 };

    if (sendEmailOnly || emailCandidates.length > 0) {
      const targets = sendEmailOnly ? batches : emailCandidates;

      for (const batch of targets) {
        if (!batch.member?.email) continue;

        const member = {
          name: batch.member.name,
          email: batch.member.email,
          phone: batch.member.phone,
          portalToken: batch.member.portalToken,
        };

        const deposit = {
          depositDate: batch.receivedDate,
          qty: Number(batch.qty),
          unit: batch.unit,
          grade: batch.grade,
        };

        const result = await sendDepositEmail(member, deposit, recordedBy);

        if (result.success) {
          emailResults.success++;
        } else {
          emailResults.failed++;
        }
      }

      if (!sendEmailOnly) {
        emailResults.fallbackCount = emailCandidates.length;
      }
    }

    return NextResponse.json({
      whatsapp: sendWa
        ? whatsappResults
        : { success: 0, failed: 0, note: 'Not requested' },
      email: EMAIL_ENABLED
        ? emailResults
        : { success: 0, failed: 0, note: 'Not configured' },
      total: {
        success: (sendWa ? whatsappResults.success : 0) + emailResults.success,
        failed: (sendWa ? whatsappResults.failed : 0) + emailResults.failed,
      },
    });
  } catch (error) {
    console.error('Send notifications error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
