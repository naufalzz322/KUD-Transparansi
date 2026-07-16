import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const FROM_EMAIL = process.env.EMAIL_FROM || 'KUD Transparansi <noreply@kud.id>';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

interface MemberInfo {
  name: string;
  email?: string;
  phone: string;
  portalToken: string;
}

interface DepositInfo {
  depositDate: Date;
  qty: number;
  unit: string;
  grade: string | null;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendDepositEmail(
  member: MemberInfo,
  deposit: DepositInfo,
  recordedBy: string
): Promise<EmailResult> {
  if (!member.email) {
    return { success: false, error: 'No email address' };
  }

  const portalUrl = `${APP_URL}/portal/${member.portalToken}`;

  const dateStr = new Date(deposit.depositDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Setoran</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F7F8F5;">
  <div style="background-color: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">🥛</span>
      <h1 style="color: #1B4332; margin: 8px 0 0 0; font-size: 24px;">Konfirmasi Setoran</h1>
      <p style="color: #52796F; margin: 4px 0 0 0;">KUD Transparansi</p>
    </div>

    <div style="background-color: #F0FDF4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0; color: #1B4332;">Halo <strong>${member.name}</strong>,</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #D9DDD4; color: #52796F;">Tanggal</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #D9DDD4; text-align: right; color: #1B4332; font-weight: 500;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #D9DDD4; color: #52796F;">Jumlah</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #D9DDD4; text-align: right; color: #1B4332; font-weight: 500;">${deposit.qty} ${deposit.unit}</td>
      </tr>
      ${deposit.grade ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #D9DDD4; color: #52796F;">Grade</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #D9DDD4; text-align: right; color: #1B4332; font-weight: 500;">
          <span style="background-color: ${deposit.grade === 'A' ? '#DCFCE7' : '#FEF3C7'}; color: ${deposit.grade === 'A' ? '#16A34A' : '#D97706'}; padding: 2px 8px; border-radius: 4px;">${deposit.grade}</span>
        </td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 12px 0; color: #52796F;">Tercatat oleh</td>
        <td style="padding: 12px 0; text-align: right; color: #1B4332; font-weight: 500;">${recordedBy}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${portalUrl}" style="display: inline-block; background-color: #2D6A4F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Lihat Riwayat Lengkap</a>
    </div>

    <p style="color: #52796F; font-size: 14px; text-align: center; margin: 0;">
      Ada pertanyaan? Hubungi admin kami.
    </p>
  </div>

  <p style="color: #52796F; font-size: 12px; text-align: center; margin-top: 16px;">
    © 2026 KUD Transparansi — Pytagotech
  </p>
</body>
</html>
  `.trim();

  const textContent = `
🥛 Konfirmasi Setoran KUD Transparansi

Halo ${member.name},

Setoran Anda telah tercatat:

Tanggal: ${dateStr}
Jumlah: ${deposit.qty} ${deposit.unit}${deposit.grade ? ` | Grade: ${deposit.grade}` : ''}
Tercatat oleh: ${recordedBy}

Lihat riwayat lengkap:
${portalUrl}

Ada pertanyaan? Hubungi admin.
  `.trim();

  if (!resend) {
    console.warn('Resend API key not configured, email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: member.email,
      subject: `🥛 Konfirmasi Setoran - ${new Date(deposit.depositDate).toLocaleDateString('id-ID')}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendBulkEmails(
  members: MemberInfo[],
  deposits: DepositInfo[],
  recordedBy: string
): Promise<{ success: number; failed: number; results: Array<{ memberId: string; success: boolean }> }> {
  const results: Array<{ memberId: string; success: boolean }> = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const deposit = deposits[i];

    // Skip if no email
    if (!member.email) {
      results.push({ memberId: member.email || member.phone, success: false });
      failed++;
      continue;
    }

    const result = await sendDepositEmail(member, deposit, recordedBy);
    results.push({ memberId: member.email, success: result.success });

    if (result.success) {
      success++;
    } else {
      failed++;
    }

    // Rate limiting
    if (i < members.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { success, failed, results };
}

export async function sendExpiryAlertEmail(
  emails: string[],
  productName: string,
  daysRemaining: number,
  batchNumber: string
): Promise<boolean> {
  if (!emails.length || !resend) {
    return false;
  }

  const urgency = daysRemaining <= 1 ? '🚨 URGEN!' : '⚠️ Peringatan';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Peringatan Stok Akan Expired</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: ${daysRemaining <= 1 ? '#DC2626' : '#D97706'}; margin: 0; font-size: 24px;">${urgency}</h1>
      <p style="color: #1B4332; margin: 8px 0 0 0; font-size: 18px;">Stok Akan Expired</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; color: #52796F;">Produk</td>
        <td style="padding: 8px 0; text-align: right; color: #1B4332; font-weight: 500;">${productName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #52796F;">Batch</td>
        <td style="padding: 8px 0; text-align: right; color: #1B4332; font-weight: 500;">${batchNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #52796F;">Sisa</td>
        <td style="padding: 8px 0; text-align: right; color: ${daysRemaining <= 1 ? '#DC2626' : '#D97706'}; font-weight: 600; font-size: 18px;">${daysRemaining} hari</td>
      </tr>
    </table>

    <p style="background-color: ${daysRemaining <= 1 ? '#FEF2F2' : '#FFFBEB'}; padding: 16px; border-radius: 8px; color: ${daysRemaining <= 1 ? '#DC2626' : '#D97706'}; text-align: center; margin: 0;">
      <strong>Segera lakukan rotasi atau proses sebelum produk expire!</strong>
    </p>
  </div>
</body>
</html>
  `.trim();

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emails,
      subject: `${urgency} ${productName} akan expire dalam ${daysRemaining} hari`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend expiry alert error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send expiry email alert:', error);
    return false;
  }
}
