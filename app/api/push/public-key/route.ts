import { NextResponse } from 'next/server';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';

// GET /api/push/public-key - Return VAPID public key for client subscription
export async function GET() {
  if (!VAPID_PUBLIC_KEY) {
    return NextResponse.json({ error: 'Push not configured' }, { status: 503 });
  }

  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY });
}
