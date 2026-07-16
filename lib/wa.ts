const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

interface MemberInfo {
  name: string;
  phone: string;
  portalToken: string;
  qrCodeData?: string | null;
}

interface DepositInfo {
  depositDate: Date;
  qty: number;
  unit: string;
  grade: string | null;
}

/**
 * Format phone number for Fonnte (remove 0 prefix, use 62)
 */
function formatPhoneForFonnte(phone: string): string {
  return phone.replace(/^0/, '62').replace(/\D/g, '');
}

/**
 * Generate deposit notification message
 */
function generateDepositMessage(
  memberName: string,
  deposit: DepositInfo,
  recordedBy: string,
  portalToken: string
): string {
  const dateStr = new Date(deposit.depositDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const portalUrl = `${APP_URL}/portal/${portalToken}`;

  return `🥛 Konfirmasi Setoran

Halo ${memberName},

📅 Tanggal: ${dateStr}
📦 Qty: ${deposit.qty} ${deposit.unit}${deposit.grade ? ` | Grade: ${deposit.grade}` : ''}
✅ Tercatat oleh: ${recordedBy}

Lihat riwayat lengkap:
${portalUrl}

Ada pertanyaan? Hubungi admin.`;
}

/**
 * Generate reminder message for members who haven't deposited
 */
function generateReminderMessage(
  memberName: string,
  currentTime: string,
  portalUrl: string
): string {
  return `🥛 Pengingat: Belum Setor

Halo Pak/Bu ${memberName},

📢 Kami belum menerima setoran susu Anda hari ini.

Segera antar susu ke KUD sebelum pukul ${currentTime}.

📱 Portal: ${portalUrl}

Terima kasih 🙏`;
}

/**
 * Send reminder with QR code attached via Fonnte
 */
export async function sendReminderWithQR(
  member: MemberInfo,
  currentTime: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const portalUrl = `${APP_URL}/portal/${member.portalToken}`;
  const message = generateReminderMessage(member.name, currentTime, portalUrl);

  try {
    // Prepare form data for Fonnte
    const formData = new FormData();
    formData.append('target', formatPhoneForFonnte(member.phone));
    formData.append('message', message);
    formData.append('countryCode', '62');
    formData.append('delay', '1');

    // Attach QR code if available
    if (member.qrCodeData) {
      // Convert base64 to blob
      const qrResponse = await fetch(member.qrCodeData);
      const qrBlob = await qrResponse.blob();
      formData.append('file', qrBlob, 'qr-code.png');
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN!,
      },
      body: formData,
    });

    const result = await response.json();

    return {
      success: result.status === true,
      messageId: result.message_id,
      error: result.reason || (result.status !== true ? 'Failed to send' : undefined),
    };
  } catch (error) {
    console.error('Failed to send reminder with QR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendDepositNotification(
  member: MemberInfo,
  deposit: DepositInfo,
  recordedBy: string
): Promise<{ success: boolean; messageId?: string }> {
  const message = generateDepositMessage(
    member.name,
    deposit,
    recordedBy,
    member.portalToken
  );

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formatPhoneForFonnte(member.phone),
        message,
        countryCode: '62',
      }),
    });

    const result = await response.json();
    return {
      success: result.status === true,
      messageId: result.message_id,
    };
  } catch (error) {
    console.error('Failed to send notification:', error);
    return { success: false };
  }
}

/**
 * Send individual reminder via Fonnte (without QR)
 */
export async function sendReminderToMember(
  member: MemberInfo,
  currentTime: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = generateReminderMessage(member.name, currentTime, `${APP_URL}/portal/${member.portalToken}`);

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formatPhoneForFonnte(member.phone),
        message,
        countryCode: '62',
        delay: '1',
      }),
    });

    const result = await response.json();

    return {
      success: result.status === true,
      messageId: result.message_id,
      error: result.reason,
    };
  } catch (error) {
    console.error('Failed to send reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send deposit expiry alert
 */
export async function sendExpiryAlert(
  phone: string,
  productName: string,
  daysRemaining: number,
  batchNumber: string
): Promise<boolean> {
  const urgency = daysRemaining <= 1 ? '⚠️ URGEN!' : '⚠️ Peringatan';

  const message = `${urgency} Stok Akan Expired

${productName}
Batch: ${batchNumber}
Sisa: ${daysRemaining} hari

Segera lakukan rotasi atau proses.
`;

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formatPhoneForFonnte(phone),
        message,
        countryCode: '62',
      }),
    });

    const result = await response.json();
    return result.status === true;
  } catch (error) {
    console.error('Failed to send expiry alert:', error);
    return false;
  }
}
