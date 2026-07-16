import * as QRCode from 'qrcode';

export async function generateQRDataUrl(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1B4332',
        light: '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR:', error);
    throw error;
  }
}

export async function generateQRBuffer(text: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1B4332',
        light: '#FFFFFF',
      },
      type: 'png',
    });
    return buffer;
  } catch (error) {
    console.error('Failed to generate QR buffer:', error);
    throw error;
  }
}
