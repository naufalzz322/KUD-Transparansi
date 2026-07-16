/**
 * SMS Library - Fonnte API only (WhatsApp-focused, works as SMS too)
 *
 * Fonnte is primarily WhatsApp but can deliver as SMS to Indonesian numbers.
 * This is the most cost-effective option for Indonesian cooperatives.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

interface DepositInfo {
  depositDate: Date;
  qty: number;
  unit: string;
  grade: string | null;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Format phone number to international format (62 for Indonesia)
 */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '62' + digits.substring(1);
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  return '62' + digits;
}

/**
 * Generate deposit notification message
 */
export function generateDepositMessage(
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

Lihat riwayat: ${portalUrl}

Ada pertanyaan? Hubungi admin.`;
}

/**
 * Generate reminder message for members who haven't deposited
 */
export function generateReminderMessage(
  memberName: string,
  portalToken: string,
  totalNotDeposited: number
): string {
  const portalUrl = `${APP_URL}/portal/${portalToken}`;

  return `🥛 Pengingat Setoran

Halo ${memberName},

📢 Belum ada setoran hari ini.

Silakan segera antar susu Anda ke KUD.
Semakin cepat, semakin baik kualitasnya!

Portal Info: ${portalUrl}

Terima kasih 🙏`;
}

/**
 * Generate bulk reminder message
 */
export function generateBulkReminderMessage(
  memberName: string,
  portalToken: string
): string {
  const portalUrl = `${APP_URL}/portal/${portalToken}`;

  return `🥛 Pengingat: Belum Setor Hari Ini

Halo ${memberName},

📢 Kami belum menerima setoran susu dari Anda hari ini.

Segera antar susu Anda ke KUD sebelum jam ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.

Catat setoran & lihat riwayat: ${portalUrl}

Terima kasih 🙏`;
}

/**
 * Send message via Fonnte API
 */
export async function sendViaFonnte(
  phone: string,
  message: string
): Promise<SMSResult> {
  if (!FONNTE_TOKEN) {
    return { success: false, error: 'Fonnte not configured' };
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formatPhone(phone).substring(2), // Remove 62 prefix for Fonnte
        message,
        countryCode: '62',
      }),
    });

    const result = await response.json();

    if (result.status === true) {
      return {
        success: true,
        messageId: result.message_id,
      };
    } else {
      return {
        success: false,
        error: result.reason || result.message || 'Fonnte API error',
      };
    }
  } catch (error) {
    console.error('Fonnte error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send',
    };
  }
}

/**
 * Send SMS - Fonnte only
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<SMSResult> {
  return sendViaFonnte(phone, message);
}

/**
 * Send deposit notification via SMS
 */
export async function sendDepositSMS(
  memberName: string,
  phone: string,
  deposit: DepositInfo,
  recordedBy: string,
  portalToken: string
): Promise<SMSResult> {
  const message = generateDepositMessage(memberName, deposit, recordedBy, portalToken);
  return sendSMS(phone, message);
}

/**
 * Check if Fonnte is configured
 */
export function isSMSConfigured(): boolean {
  return !!FONNTE_TOKEN;
}
