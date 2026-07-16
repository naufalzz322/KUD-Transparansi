import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/settings - Get all settings
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const where = category ? { category } : {};
    const settings = await prisma.setting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Convert to key-value object
    const settingsObj: Record<string, string> = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }

    return NextResponse.json({ settings: settingsObj, list: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/settings - Update settings
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const { key, value, category = 'general', label, description } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key harus diisi' }, { status: 400 });
    }

    // Upsert setting
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, category, label, description },
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Update setting error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/settings - Bulk update settings
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: 'Settings harus array' }, { status: 400 });
    }

    // Update multiple settings in transaction
    const results = await prisma.$transaction(
      settings.map((s: { key: string; value: string; category?: string; label?: string; description?: string }) =>
        prisma.setting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: {
            key: s.key,
            value: s.value,
            category: s.category || 'general',
            label: s.label,
            description: s.description,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
