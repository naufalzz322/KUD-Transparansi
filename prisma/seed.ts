import {
  PrismaClient,
  Prisma,
  StockCategory,
  StockType,
  StockStatus,
  Grade,
  SettlementStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

type SeedMode = 'reseed' | 'seed' | 'clear';

// ─── Progress Indicator ──────────────────────────────────────────────────────

function progressBar(current: number, total: number, width: number = 30): string {
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percent = Math.round((current / total) * 100);
  return `[${bar}] ${percent}%`;
}

// ─── Seed Configuration ────────────────────────────────────────────────────────

/** Deterministic pseudo-random using a seed so runs are reproducible */
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Database Operations ──────────────────────────────────────────────────────

async function clearDatabase() {
  console.log('🗑️  Clearing database...');
  // Use $executeRaw for reliable deletion on PostgreSQL with FK constraints
  await prisma.$executeRaw`DELETE FROM "AuditLog"`;
  await prisma.$executeRaw`DELETE FROM "SettlementDetail"`;
  await prisma.$executeRaw`DELETE FROM "MonthlySettlement"`;
  await prisma.$executeRaw`DELETE FROM "StockBatch"`;
  await prisma.$executeRaw`DELETE FROM "MemberProduct"`;
  await prisma.$executeRaw`DELETE FROM "Notification"`;
  await prisma.$executeRaw`DELETE FROM "PushSubscription"`;
  await prisma.$executeRaw`DELETE FROM "Member"`;
  await prisma.$executeRaw`DELETE FROM "StockItem"`;
  await prisma.$executeRaw`DELETE FROM "User"`;
  await prisma.$executeRaw`DELETE FROM "Setting"`;
  console.log('✅ Database cleared');
}

// ─── Users ───────────────────────────────────────────────────────────────────

async function createUsers() {
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kud.id' },
    update: {},
    create: { email: 'admin@kud.id', name: 'Admin KUD', role: 'ADMIN', password: adminPassword },
  });

  console.log('✅ Admin:', admin.email);
  return { admin };
}

// ─── Stock Items ─────────────────────────────────────────────────────────────

interface StockItemSeed {
  id: string;
  name: string;
  category: StockCategory;
  defaultUnit: string;
  shelfLifeDays: number;
  priceGradeA: number;
  priceGradeB: number;
  note?: string;
}

async function createStockItems(): Promise<StockItemSeed[]> {
  const items: Omit<StockItemSeed, 'id'>[] = [
    {
      name: 'Susu Sapi',
      category: 'MINUMAN',
      defaultUnit: 'liter',
      shelfLifeDays: 3,
      priceGradeA: 6500,
      priceGradeB: 5500,
      note: 'Produk utama dari peternak sapi perah',
    },
    {
      name: 'Wortel Import',
      category: 'SAYURAN',
      defaultUnit: 'kg',
      shelfLifeDays: 7,
      priceGradeA: 12000,
      priceGradeB: 10000,
      note: 'Wortel premium import',
    },
    {
      name: 'Cabai Merah Keriting',
      category: 'SAYURAN',
      defaultUnit: 'kg',
      shelfLifeDays: 5,
      priceGradeA: 25000,
      priceGradeB: 20000,
      note: 'Cabai kualitas ekspor',
    },
    {
      name: 'Tomat Cherry',
      category: 'SAYURAN',
      defaultUnit: 'kg',
      shelfLifeDays: 4,
      priceGradeA: 18000,
      priceGradeB: 15000,
    },
    {
      name: 'Kentang Granola',
      category: 'SAYURAN',
      defaultUnit: 'kg',
      shelfLifeDays: 14,
      priceGradeA: 15000,
      priceGradeB: 12000,
    },
    {
      name: 'Brokoli Segar',
      category: 'SAYURAN',
      defaultUnit: 'kg',
      shelfLifeDays: 3,
      priceGradeA: 22000,
      priceGradeB: 18000,
    },
    {
      name: 'Jeruk Manis',
      category: 'BUAH',
      defaultUnit: 'kg',
      shelfLifeDays: 10,
      priceGradeA: 18000,
      priceGradeB: 14000,
    },
    {
      name: 'Apel Fuji',
      category: 'BUAH',
      defaultUnit: 'kg',
      shelfLifeDays: 21,
      priceGradeA: 28000,
      priceGradeB: 22000,
    },
    {
      name: 'Bawang Bombay',
      category: 'LAINNYA',
      defaultUnit: 'kg',
      shelfLifeDays: 21,
      priceGradeA: 20000,
      priceGradeB: 16000,
    },
  ];

  const created: StockItemSeed[] = [];
  for (const item of items) {
    const stockItem = await prisma.stockItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
    console.log(`✅ StockItem: ${stockItem.name} (${stockItem.defaultUnit}, ${stockItem.shelfLifeDays}d)`);
    // Cast to StockItemSeed — Prisma returns the full model with id
    created.push(stockItem as unknown as StockItemSeed);
  }
  return created;
}

// ─── Members ──────────────────────────────────────────────────────────────────

interface MemberSeed {
  name: string;
  phone: string;
  email: string | null;
  region: string;
  joinDate: Date;
  isActive: boolean;
  /** 0 = High (90% attendance), 1 = Medium (75%), 2 = Low (60%) */
  tier: 0 | 1 | 2;
}

async function createMembers(): Promise<MemberSeed[]> {
  const memberData: MemberSeed[] = [
    { name: 'H. Slamet Wijaya', phone: '0812-3456-7801', email: 'slamet.wijaya@gmail.com', region: 'Sidoarjo Barat', joinDate: new Date('2024-01-15'), isActive: true, tier: 0 },
    { name: 'Hj. Wati Rohmah', phone: '0812-3456-7802', email: 'wati.rohmah@yahoo.co.id', region: 'Sidoarjo Timur', joinDate: new Date('2024-02-20'), isActive: true, tier: 0 },
    { name: 'H. Hasan Basri', phone: '0812-3456-7803', email: null, region: 'Sidoarjo Utara', joinDate: new Date('2024-03-10'), isActive: true, tier: 1 },
    { name: 'Hj. Sri Wahyuni', phone: '0812-3456-7804', email: 'sri.wahyuni@gmail.com', region: 'Sidoarjo Selatan', joinDate: new Date('2024-04-05'), isActive: true, tier: 0 },
    { name: 'H. Budi Santoso', phone: '0812-3456-7805', email: null, region: 'Krian', joinDate: new Date('2024-05-01'), isActive: true, tier: 1 },
    { name: 'Hj. Wati Indah Sari', phone: '0812-3456-7806', email: 'wati.indah@outlook.co.id', region: 'Tarik', joinDate: new Date('2024-06-18'), isActive: true, tier: 0 },
    { name: 'H. Dedi Kurniawan', phone: '0812-3456-7807', email: null, region: 'Prambon', joinDate: new Date('2024-07-22'), isActive: false, tier: 2 }, // INACTIVE
    { name: 'Hj. Ani Kusuma Dewi', phone: '0812-3456-7808', email: 'ani.kusuma@gmail.com', region: 'Sedati', joinDate: new Date('2024-08-14'), isActive: true, tier: 1 },
    { name: 'H. Eko Prasetyo', phone: '0812-3456-7809', email: 'eko.prasetyo@yahoo.com', region: 'Waru', joinDate: new Date('2024-09-09'), isActive: true, tier: 0 },
    { name: 'Hj. Fitria Rahman', phone: '0812-3456-7810', email: null, region: 'Gedangan', joinDate: new Date('2024-10-03'), isActive: true, tier: 1 },
    { name: 'H. Gunawan Hidayat', phone: '0812-3456-7811', email: 'gunawan.h@outlook.com', region: 'Sukodono', joinDate: new Date('2024-11-11'), isActive: false, tier: 2 }, // INACTIVE
    { name: 'Hj. Heni Wulandari', phone: '0812-3456-7812', email: 'heni.wulandari@gmail.com', region: 'Porong', joinDate: new Date('2024-12-01'), isActive: true, tier: 0 },
    { name: 'H. Iwan Setiawan', phone: '0812-3456-7813', email: null, region: 'Tanggulangin', joinDate: new Date('2025-01-07'), isActive: true, tier: 1 },
    { name: 'Hj. Jumiati Halimah', phone: '0812-3456-7814', email: 'jumiati.halimah@yahoo.co.id', region: 'Candi', joinDate: new Date('2025-02-14'), isActive: false, tier: 2 }, // INACTIVE
    { name: 'H. Kadir Abdul Hakim', phone: '0812-3456-7815', email: 'kadir.hakim@gmail.com', region: 'Tulangan', joinDate: new Date('2025-03-01'), isActive: true, tier: 1 },
  ];

  const defaultPin = await bcrypt.hash('123456', 12);
  const created: MemberSeed[] = [];

  for (let i = 0; i < memberData.length; i++) {
    const { name, phone, email, region, joinDate, isActive, tier } = memberData[i];
    const memberNumber = `KUD-${String(i + 1).padStart(3, '0')}`;

    const existing = await prisma.member.findFirst({ where: { memberNumber } });
    if (existing) {
      // Update existing member with new data (phone, email, isActive)
      await prisma.member.update({
        where: { id: existing.id },
        data: { phone, email, isActive },
      });
      const statusBadge = isActive ? '✅' : '❌';
      console.log(`  ${statusBadge} Member updated: ${memberNumber} — ${name}`);
      created.push(memberData[i]);
      continue;
    }

    const portalToken = randomBytes(32).toString('hex');
    const portalUrl = `${APP_URL}/portal/${portalToken}`;
    const qrCodeData = await QRCode.toDataURL(portalUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#2D6A4F', light: '#FFFFFF' },
    });

    await prisma.member.create({
      data: {
        memberNumber,
        name,
        phone,
        email,
        joinDate,
        portalPin: defaultPin,
        portalToken,
        qrCodeData,
        isActive,
      },
    });

    const statusBadge = isActive ? '✅' : '❌';
    console.log(`  ${statusBadge} Member: ${memberNumber} — ${name} (${region})`);
    created.push(memberData[i]);
  }

  return created;
}

// ─── Stock Batches ───────────────────────────────────────────────────────────

type BatchRecord = {
  stockItemId: string;
  memberId: string | null;
  type: StockType;
  qty: number;
  unit: string;
  grade: Grade;
  receivedDate: Date;
  expiryDate: Date;
  status: StockStatus;
  notes: string;
};

function calculateStatus(expiryDate: Date, today: Date): StockStatus {
  const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'EXPIRED';
  if (diffDays === 1) return 'CRITICAL';
  if (diffDays <= 3) return 'WARNING';
  return 'OK';
}

async function createStockBatches(stockItems: StockItemSeed[]) {
  console.log('\n📦 Creating stock batches (14 days of history)...');

  // Index items by name for fast lookup — contains the real Prisma UUID `id`
  const itemByName = new Map<string, StockItemSeed>();
  for (const item of stockItems) {
    itemByName.set(item.name, item);
  }

  const susu = itemByName.get('Susu Sapi')!;
  const vegetables: StockItemSeed[] = [
    'Wortel Import',
    'Cabai Merah Keriting',
    'Tomat Cherry',
    'Kentang Granola',
    'Brokoli Segar',
  ]
    .map((n) => itemByName.get(n)!)
    .filter(Boolean);
  const fruits: StockItemSeed[] = [
    'Jeruk Manis',
    'Apel Fuji',
  ]
    .map((n) => itemByName.get(n)!)
    .filter(Boolean);

  // Fruit members: indices 6, 7, 10 (0-indexed)
  const fruitMemberIndices = new Set([6, 7, 10]);

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 14);

  // Attendance miss rates per tier
  const tierMissRate = [0.10, 0.25, 0.40];

  let totalBatches = 0;

  for (let mi = 0; mi < 15; mi++) {
    const memberNumber = `KUD-${String(mi + 1).padStart(3, '0')}`;
    const dbMember = await prisma.member.findFirst({ where: { memberNumber } });
    if (!dbMember) continue;

    // Skip if already has batches
    const existing = await prisma.stockBatch.count({ where: { memberId: dbMember.id } });
    if (existing > 0) {
      console.log(`  → Skipping ${memberNumber} (already has ${existing} batches)`);
      continue;
    }

    const batches: BatchRecord[] = [];
    const iterDate = new Date(startDate);

    while (iterDate <= today) {
      // Skip Sundays
      if (iterDate.getDay() === 0) {
        iterDate.setDate(iterDate.getDate() + 1);
        continue;
      }

      const dayIndex = Math.floor((iterDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const seed = mi * 1000 + dayIndex;

      // Tier-based attendance skip
      if (seededRand(seed) < tierMissRate[mi % 3]) {
        iterDate.setDate(iterDate.getDate() + 1);
        continue;
      }

      const isSaturday = iterDate.getDay() === 6;
      const dateSeed = seed + 1;

      // ── Susu Sapi (primary — every eligible day) ──────────────────────
      {
        let qty = 3.5 + (seededRand(dateSeed) - 0.5) * 1.8;
        if (isSaturday) qty *= 0.85;
        qty = Math.round(Math.max(2.0, Math.min(4.8, qty)) * 10) / 10;

        const grade: Grade = seededRand(dateSeed + 1) < 0.8 ? 'A' : 'B';
        const expiryDate = new Date(iterDate);
        expiryDate.setDate(expiryDate.getDate() + susu.shelfLifeDays);

        batches.push({
          stockItemId: susu.id,
          memberId: dbMember.id,
          type: 'DEPOSIT',
          qty,
          unit: susu.defaultUnit,
          grade,
          receivedDate: new Date(iterDate),
          expiryDate,
          status: calculateStatus(expiryDate, today),
          notes: `Setoran harian dari ${dbMember.name}`,
        });
      }

      // ── Vegetables (~35% chance) ────────────────────────────────────
      if (seededRand(dateSeed + 2) < 0.35 && vegetables.length > 0) {
        const veg = vegetables[Math.floor(seededRand(dateSeed + 3) * vegetables.length)];
        let qty = 2 + seededRand(dateSeed + 4) * 6;
        if (isSaturday) qty *= 0.8;
        qty = Math.round(Math.max(1, qty) * 10) / 10;

        const grade: Grade = seededRand(dateSeed + 5) < 0.75 ? 'A' : 'B';
        const expiryDate = new Date(iterDate);
        expiryDate.setDate(expiryDate.getDate() + veg.shelfLifeDays);

        batches.push({
          stockItemId: veg.id,
          memberId: dbMember.id,
          type: 'DEPOSIT',
          qty,
          unit: veg.defaultUnit,
          grade,
          receivedDate: new Date(iterDate),
          expiryDate,
          status: calculateStatus(expiryDate, today),
          notes: `Setoran sayuran dari ${dbMember.name}`,
        });
      }

      // ── Fruits (~25% chance, specific members only) ─────────────────
      if (fruitMemberIndices.has(mi) && fruits.length > 0) {
        if (seededRand(dateSeed + 6) < 0.25) {
          const fruit = fruits[Math.floor(seededRand(dateSeed + 7) * fruits.length)];
          let qty = 1.5 + seededRand(dateSeed + 8) * 4;
          if (isSaturday) qty *= 0.8;
          qty = Math.round(Math.max(1, qty) * 10) / 10;

          const grade: Grade = seededRand(dateSeed + 9) < 0.7 ? 'A' : 'B';
          const expiryDate = new Date(iterDate);
          expiryDate.setDate(expiryDate.getDate() + fruit.shelfLifeDays);

          batches.push({
            stockItemId: fruit.id,
            memberId: dbMember.id,
            type: 'DEPOSIT',
            qty,
            unit: fruit.defaultUnit,
            grade,
            receivedDate: new Date(iterDate),
            expiryDate,
            status: calculateStatus(expiryDate, today),
            notes: `Setoran buah dari ${dbMember.name}`,
          });
        }
      }

      iterDate.setDate(iterDate.getDate() + 1);

      if (batches.length >= 200) {
        await flushBatches(batches);
        totalBatches += batches.length;
        batches.length = 0;
      }
    }

    if (batches.length > 0) {
      await flushBatches(batches);
      totalBatches += batches.length;
      batches.length = 0;
    }

    process.stdout.write(`\r  ${progressBar(totalBatches, 500, 20)} ${memberNumber}`);
  }
  console.log(`\n  ✅ Created ${totalBatches} deposit batches`);

  // ── Create external PURCHASE transactions ──────────────────────────────
  console.log('\n🛒 Creating external purchase transactions...');
  await createPurchaseTransactions(itemByName, today);

  // ── Create ADJUSTMENT transactions ───────────────────────────────────
  console.log('📝 Creating adjustment transactions...');
  await createAdjustmentTransactions(itemByName, today);

  // ── Create EXPIRED/WARNING/CRITICAL batches for demo ──────────────────
  console.log('⚠️  Creating demo expiring stock...');
  await createExpiringStock(itemByName, today);
}

// ─── External Purchase Transactions ──────────────────────────────────────────
async function createPurchaseTransactions(itemByName: Map<string, StockItemSeed>, today: Date) {
  const purchaseItems = [
    { name: 'Bawang Bombay', qty: 25, note: 'Pembelian dari supplier Bandung' },
    { name: 'Cabai Merah Keriting', qty: 15, note: 'Pembelian dari supplier Blitar' },
  ];

  const batches: BatchRecord[] = [];
  for (const item of purchaseItems) {
    const stockItem = itemByName.get(item.name);
    if (!stockItem) continue;

    const receivedDate = new Date(today);
    receivedDate.setDate(receivedDate.getDate() - Math.floor(stockItem.shelfLifeDays * 0.7)); // Recent purchase

    batches.push({
      stockItemId: stockItem.id,
      memberId: null,
      type: 'PURCHASE',
      qty: item.qty,
      unit: stockItem.defaultUnit,
      grade: 'A',
      receivedDate,
      expiryDate: new Date(receivedDate.getTime() + stockItem.shelfLifeDays * 24 * 60 * 60 * 1000),
      status: calculateStatus(new Date(receivedDate.getTime() + stockItem.shelfLifeDays * 24 * 60 * 60 * 1000), today),
      notes: item.note,
    });
  }

  await flushBatches(batches);
  console.log(`  ✅ Created ${batches.length} purchase transactions`);
}

// ─── Adjustment Transactions ──────────────────────────────────────────────────
async function createAdjustmentTransactions(itemByName: Map<string, StockItemSeed>, today: Date) {
  const adjustments = [
    { name: 'Susu Sapi', qty: -2.5, note: 'Koreksi stok rusak' },
    { name: 'Tomat Cherry', qty: -1.5, note: 'Stok tidak layak jual' },
    { name: 'Wortel Import', qty: -3, note: 'Penyusutan alami' },
  ];

  const batches: BatchRecord[] = [];
  for (const adj of adjustments) {
    const stockItem = itemByName.get(adj.name);
    if (!stockItem) continue;

    const receivedDate = new Date(today);
    receivedDate.setDate(receivedDate.getDate() - 7);

    batches.push({
      stockItemId: stockItem.id,
      memberId: null,
      type: 'ADJUSTMENT',
      qty: Math.abs(adj.qty),
      unit: stockItem.defaultUnit,
      grade: 'A',
      receivedDate,
      expiryDate: new Date(receivedDate.getTime() + stockItem.shelfLifeDays * 24 * 60 * 60 * 1000),
      status: 'OK',
      notes: adj.note,
    });
  }

  await flushBatches(batches);
  console.log(`  ✅ Created ${batches.length} adjustment transactions`);
}

// ─── Expiring Stock for Demo ──────────────────────────────────────────────────
async function createExpiringStock(itemByName: Map<string, StockItemSeed>, today: Date) {
  const expiringItems = [
    { name: 'Susu Sapi', qty: 8.5, daysLeft: 0, status: 'EXPIRED' as StockStatus },
    { name: 'Susu Sapi', qty: 5.0, daysLeft: 1, status: 'CRITICAL' as StockStatus },
    { name: 'Brokoli Segar', qty: 4.0, daysLeft: 2, status: 'WARNING' as StockStatus },
    { name: 'Tomat Cherry', qty: 6.5, daysLeft: 3, status: 'WARNING' as StockStatus },
  ];

  const batches: BatchRecord[] = [];
  for (const exp of expiringItems) {
    const stockItem = itemByName.get(exp.name);
    if (!stockItem) continue;

    const receivedDate = new Date(today);
    receivedDate.setDate(receivedDate.getDate() - (stockItem.shelfLifeDays - exp.daysLeft));

    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + exp.daysLeft);

    batches.push({
      stockItemId: stockItem.id,
      memberId: null,
      type: 'DEPOSIT',
      qty: exp.qty,
      unit: stockItem.defaultUnit,
      grade: 'A',
      receivedDate,
      expiryDate,
      status: exp.status,
      notes: `Demo ${exp.status.toLowerCase()} stock`,
    });
  }

  await flushBatches(batches);
  console.log(`  ✅ Created ${batches.length} expiring stock batches`);
}

async function flushBatches(batches: BatchRecord[]) {
  // Insert in sub-chunks of 100 to avoid overwhelming PostgreSQL
  for (let i = 0; i < batches.length; i += 100) {
    await prisma.stockBatch.createMany({ data: batches.slice(i, i + 100) });
  }
}

// ─── Settlements ─────────────────────────────────────────────────────────────

async function createSettlements(adminId: string) {
  console.log('\n💰 Creating monthly settlements...');

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  const periods = [
    { year: currentYear, month: currentMonth - 1 }, // Previous month
    { year: currentYear, month: currentMonth },       // Current month
  ];

  for (const { year, month } of periods) {
    if (month < 0) continue; // Skip if prev month would be in 2025

    const period = `${year}-${String(month + 1).padStart(2, '0')}`;
    const isPast = year < currentYear || month < currentMonth - 1;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const members = await prisma.member.findMany({
      where: { isActive: true },
      include: {
        stockBatches: {
          where: {
            type: 'DEPOSIT',
            receivedDate: { gte: startDate, lte: endDate },
            grade: { in: ['A', 'B'] },
          },
          include: { stockItem: true },
        },
      },
    });

    let count = 0;
    for (const member of members) {
      const existing = await prisma.monthlySettlement.findUnique({
        where: { memberId_period: { memberId: member.id, period } },
      });
      if (existing) continue;

      let gradeAQty = 0;
      let gradeBQty = 0;
      let priceA = 6500;
      let priceB = 5500;

      for (const batch of member.stockBatches) {
        const qty = Number(batch.qty);
        if (batch.grade === 'A') gradeAQty += qty;
        else if (batch.grade === 'B') gradeBQty += qty;
        if (priceA === 6500 && batch.stockItem.priceGradeA) {
          priceA = Number(batch.stockItem.priceGradeA);
          priceB = Number(batch.stockItem.priceGradeB);
        }
      }

      const totalQty = gradeAQty + gradeBQty;
      if (totalQty === 0) continue;

      // Deterministic status: past months get ~67% PAID, current is all PENDING
      // Some past settlements get PARSIAL for demo
      const seed = year * 100 + month * 10 + members.indexOf(member);
      let status: SettlementStatus = 'PENDING';
      let paidAt: Date | undefined;
      let paidAmount = 0;

      if (isPast) {
        const rand = seededRand(seed);
        if (rand < 0.5) {
          status = 'PAID';
          paidAmount = Math.round((gradeAQty * priceA + gradeBQty * priceB) * 100) / 100;
          paidAt = new Date(year, month + 1, 0, 18, 0, 0);
        } else if (rand < 0.7) {
          // Partial payment (50% of total)
          status = 'PARSIAL';
          paidAmount = Math.round((gradeAQty * priceA + gradeBQty * priceB) * 50) / 100;
        }
        // Remaining ~30% stay PENDING
      }

      // Group batches by product for details
      const productTotals: Record<string, { gradeA: number; gradeB: number; priceA: number; priceB: number }> = {};
      for (const batch of member.stockBatches) {
        const pid = batch.stockItemId;
        if (!productTotals[pid]) {
          productTotals[pid] = {
            gradeA: 0,
            gradeB: 0,
            priceA: Number(batch.stockItem.priceGradeA) || 6500,
            priceB: Number(batch.stockItem.priceGradeB) || 5500,
          };
        }
        if (batch.grade === 'A') productTotals[pid].gradeA += Number(batch.qty);
        else if (batch.grade === 'B') productTotals[pid].gradeB += Number(batch.qty);
      }

      // Create settlement with details
      const settlement = await prisma.monthlySettlement.create({
        data: {
          memberId: member.id,
          period,
          totalQty,
          gradeAQty,
          gradeBQty,
          totalPayment: Math.round((gradeAQty * priceA + gradeBQty * priceB) * 100) / 100,
          paidAmount,
          status,
          processedById: adminId,
          processedAt: new Date(year, month + 1, 0, 10, 0, 0),
          paidAt,
          details: {
            create: Object.entries(productTotals).map(([stockItemId, data]) => ({
              stockItemId,
              gradeAQty: data.gradeA,
              gradeBQty: data.gradeB,
              priceGradeA: data.priceA,
              priceGradeB: data.priceB,
              paymentA: data.gradeA * data.priceA,
              paymentB: data.gradeB * data.priceB,
              totalPayment: data.gradeA * data.priceA + data.gradeB * data.priceB,
            })),
          },
        },
      });
      count++;
    }

    console.log(`  → ${period}: ${count} settlements created`);
  }
}

// ─── Member Products ────────────────────────────────────────────────────────

async function createMemberProducts(stockItems: StockItemSeed[]) {
  console.log('\n🔗 Creating member-product assignments...');

  // Index items by name
  const itemByName = new Map<string, StockItemSeed>();
  for (const item of stockItems) {
    itemByName.set(item.name, item);
  }

  const susuSapi = itemByName.get('Susu Sapi')!;
  const vegetables = [
    'Wortel Import',
    'Cabai Merah Keriting',
    'Tomat Cherry',
    'Kentang Granola',
    'Brokoli Segar',
  ].map(n => itemByName.get(n)!).filter(Boolean);
  const fruits = [
    'Jeruk Manis',
    'Apel Fuji',
  ].map(n => itemByName.get(n)!).filter(Boolean);

  // Member 0-5 (tier 0): Susu Sapi + some vegetables
  // Member 6-10 (tier 1): Mix of vegetables and fruits
  // Member 11-14 (tier 2): Various products
  const assignments: { memberNumber: string; products: string[]; primary: string }[] = [
    { memberNumber: 'KUD-001', products: ['Susu Sapi', 'Wortel Import'], primary: 'Susu Sapi' },
    { memberNumber: 'KUD-002', products: ['Susu Sapi', 'Cabai Merah Keriting'], primary: 'Susu Sapi' },
    { memberNumber: 'KUD-003', products: ['Susu Sapi', 'Tomat Cherry'], primary: 'Susu Sapi' },
    { memberNumber: 'KUD-004', products: ['Susu Sapi', 'Kentang Granola'], primary: 'Susu Sapi' },
    { memberNumber: 'KUD-005', products: ['Susu Sapi', 'Brokoli Segar'], primary: 'Susu Sapi' },
    { memberNumber: 'KUD-006', products: ['Susu Sapi', 'Wortel Import', 'Cabai Merah Keriting'], primary: 'Susu Sapi' },
    { memberNumber: 'KUD-007', products: ['Wortel Import', 'Kentang Granola', 'Jeruk Manis'], primary: 'Wortel Import' },
    { memberNumber: 'KUD-008', products: ['Cabai Merah Keriting', 'Tomat Cherry', 'Apel Fuji'], primary: 'Cabai Merah Keriting' },
    { memberNumber: 'KUD-009', products: ['Susu Sapi', 'Brokoli Segar', 'Jeruk Manis'], primary: 'Susu Sapi' },
    { memberNumber: 'KUD-010', products: ['Wortel Import', 'Tomat Cherry', 'Apel Fuji'], primary: 'Wortel Import' },
    { memberNumber: 'KUD-011', products: ['Jeruk Manis', 'Apel Fuji'], primary: 'Jeruk Manis' },
    { memberNumber: 'KUD-012', products: ['Susu Sapi', 'Wortel Import'], primary: 'Susu Sapi' },
    { memberNumber: 'KUD-013', products: ['Kentang Granola', 'Brokoli Segar'], primary: 'Kentang Granola' },
    { memberNumber: 'KUD-014', products: ['Cabai Merah Keriting', 'Tomat Cherry'], primary: 'Cabai Merah Keriting' },
    { memberNumber: 'KUD-015', products: ['Susu Sapi', 'Jeruk Manis'], primary: 'Susu Sapi' },
  ];

  for (const assignment of assignments) {
    const member = await prisma.member.findFirst({ where: { memberNumber: assignment.memberNumber } });
    if (!member) continue;

    for (const productName of assignment.products) {
      const product = itemByName.get(productName);
      if (!product) continue;

      const existing = await prisma.memberProduct.findUnique({
        where: { memberId_stockItemId: { memberId: member.id, stockItemId: product.id } },
      });

      if (existing) continue;

      await prisma.memberProduct.create({
        data: {
          memberId: member.id,
          stockItemId: product.id,
          isPrimary: productName === assignment.primary,
        },
      });
    }

    console.log(`  ✅ ${assignment.memberNumber}: ${assignment.products.join(', ')} (Primary: ${assignment.primary})`);
  }
}

// ─── Notifications ──────────────────────────────────────────────────────────────

interface NotificationSeed {
  userId?: string | null;
  memberId?: string | null;
  type: 'INFO' | 'WARNING' | 'EXPIRY_ALERT' | 'SETTLEMENT_READY' | 'DEPOSIT_CONFIRMED' | 'SYSTEM';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  daysAgo: number;
}

async function createNotifications(adminId: string) {
  console.log('\n🔔 Creating notifications...');

  const notifications: NotificationSeed[] = [];

  // ════════════════════════════════════════════════════════════════════════════
  // SYSTEM NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  notifications.push(
    {
      userId: adminId,
      type: 'SYSTEM',
      title: 'Sistem Berhasil Diperbarui',
      body: 'Versi aplikasi telah diperbarui ke versi 1.3.0 dengan perbaikan bug dan peningkatan performa.',
      data: { version: '1.3.0' },
      daysAgo: 7,
    },
    {
      userId: adminId,
      type: 'SYSTEM',
      title: 'Database Backup Selesai',
      body: 'Backup database otomatis telah selesai dilakukan. Semua data tersimpan aman.',
      data: { backupId: 'bkp_2026_07_10', size: '256MB' },
      daysAgo: 1,
    },
    {
      userId: adminId,
      type: 'SYSTEM',
      title: 'Server Berhasil Restart',
      body: 'Server telah di-restart setelah maintenance terjadwal. Semua layanan berjalan normal.',
      data: { uptime: '14 days' },
      daysAgo: 3,
    },
    {
      userId: adminId,
      type: 'SYSTEM',
      title: 'SSL Certificate Renewed',
      body: 'Sertifikat SSL untuk domain kud-transparansi.id telah berhasil diperpanjang.',
      data: { validUntil: '2026-10-10' },
      daysAgo: 14,
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // INFO NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  notifications.push(
    {
      userId: adminId,
      type: 'INFO',
      title: 'Jadwal Maintenance',
      body: 'Akan ada jadwal maintenance sistem pada tanggal 15 Juli 2026 pukul 02:00-04:00 WIB.',
      data: { scheduledDate: '2026-07-15T02:00:00Z' },
      daysAgo: 3,
    },
    {
      userId: adminId,
      type: 'INFO',
      title: 'Export Laporan Selesai',
      body: 'Laporan setoran bulan Juni 2026 berhasil di-export dan siap diunduh.',
      data: { exportType: 'setoran', period: '2026-06', downloadUrl: '/exports/laporan-juni-2026.pdf' },
      daysAgo: 5,
    },
    {
      userId: adminId,
      type: 'INFO',
      title: 'Export Laporan Settlements Selesai',
      body: 'Laporan settlement bulan Mei 2026 sebanyak 25 halaman berhasil diexport.',
      data: { exportType: 'settlement', period: '2026-05', pages: 25 },
      daysAgo: 12,
    },
    {
      userId: adminId,
      type: 'INFO',
      title: 'Anggota Baru Terdaftar',
      body: 'H. Kadir Abdul Hakim (KUD-015) berhasil terdaftar sebagai anggota baru.',
      data: { memberId: null, memberNumber: 'KUD-015' },
      daysAgo: 10,
    },
    {
      userId: adminId,
      type: 'INFO',
      title: 'Data Anggota Diperbarui',
      body: 'Data Hj. Wati Rohmah (KUD-002) berhasil diperbarui: nomor HP baru ditambahkan.',
      data: { memberId: null, memberNumber: 'KUD-002', changes: ['phone'] },
      daysAgo: 4,
    },
    {
      userId: adminId,
      type: 'INFO',
      title: 'Produk Baru Ditambahkan',
      body: 'Produk "Jeruk Manis" berhasil ditambahkan ke daftar produk dengan harga grade A: Rp18.000/kg.',
      data: { stockItemId: null, name: 'Jeruk Manis' },
      daysAgo: 20,
    },
    {
      userId: adminId,
      type: 'INFO',
      title: 'Harga Produk Diperbarui',
      body: 'Harga Susu Sapi Grade A diupdate dari Rp6.000 menjadi Rp6.500 per liter.',
      data: { stockItemId: null, name: 'Susu Sapi', gradeA: { old: 6000, new: 6500 } },
      daysAgo: 15,
    },
    {
      userId: adminId,
      type: 'INFO',
      title: 'Bulk Deposit Berhasil',
      body: '12 setoran susu sapi berhasil diinput untuk tanggal 10 Juli 2026.',
      data: { date: '2026-07-10', count: 12, totalQty: 42.5 },
      daysAgo: 0,
    },
    {
      userId: adminId,
      type: 'INFO',
      title: 'Pengaturan Notifikasi Diperbarui',
      body: 'Pengaturan WhatsApp notification telah diaktifkan oleh admin.',
      data: { channel: 'whatsapp', enabled: true },
      daysAgo: 6,
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // WARNING NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  notifications.push(
    {
      userId: adminId,
      type: 'WARNING',
      title: 'Stok Critical: Susu Sapi',
      body: 'Stok Susu Sapi tinggal 8.5 kg dengan sisa 1 hari sebelum kedaluwarsa. Segera proses distribusi.',
      data: { stockItemId: null, name: 'Susu Sapi', qty: 8.5, status: 'CRITICAL' },
      daysAgo: 0,
    },
    {
      userId: adminId,
      type: 'WARNING',
      title: 'Stok Critical: Brokoli Segar',
      body: 'Stok Brokoli Segar tinggal 4.0 kg, kedaluwarsa besok. Perlu tindakan segera.',
      data: { stockItemId: null, name: 'Brokoli Segar', qty: 4.0, status: 'CRITICAL' },
      daysAgo: 1,
    },
    {
      userId: adminId,
      type: 'WARNING',
      title: 'Total Stok Menipis',
      body: 'Total stok Tomat Cherry tinggal 15.2 kg. Pertimbangkan untuk menambah pasokan.',
      data: { stockItemId: null, name: 'Tomat Cherry', qty: 15.2, threshold: 20 },
      daysAgo: 2,
    },
    {
      userId: adminId,
      type: 'WARNING',
      title: 'Settlement Tertunda',
      body: 'Settlement bulan Mei 2026 untuk 3 anggota masih tertunda. Total tunggakan Rp4.250.000.',
      data: { period: '2026-05', pendingCount: 3, totalAmount: 4250000 },
      daysAgo: 8,
    },
    {
      userId: adminId,
      type: 'WARNING',
      title: ' Anggota Tidak Aktif',
      body: 'H. Dedi Kurniawan (KUD-007) tidak menyetor selama 7 hari berturut-turut.',
      data: { memberId: null, memberNumber: 'KUD-007', absentDays: 7 },
      daysAgo: 1,
    },
    {
      userId: adminId,
      type: 'WARNING',
      title: 'Anggota Akan DNonaktifkan',
      body: 'Hj. Jumiati Halimah (KUD-014) tidak aktif selama 30 hari. Akan dinonaktifkan otomatis.',
      data: { memberId: null, memberNumber: 'KUD-014', inactiveDays: 30 },
      daysAgo: 3,
    },
    {
      userId: adminId,
      type: 'WARNING',
      title: 'Deposit Ditolak',
      body: 'Setoran H. Gunawan Hidayat (KUD-011) ditolak karena susu tidak memenuhi standar kualitas.',
      data: { memberId: null, memberNumber: 'KUD-011', reason: 'quality' },
      daysAgo: 5,
    },
    {
      userId: adminId,
      type: 'WARNING',
      title: 'Peringatan Kadaluwarsa Massal',
      body: '5 jenis produk berbeda akan kedaluwarsa dalam 3 hari ke depan. Total 45 kg.',
      data: { itemCount: 5, totalQty: 45, daysRemaining: 3 },
      daysAgo: 0,
    },
    {
      userId: adminId,
      type: 'WARNING',
      title: 'Backup Gagal',
      body: 'Backup database otomatis gagal dilakukan. Penyimpanan hampir penuh.',
      data: { error: 'storage_full', attemptedAt: '2026-07-09T02:00:00Z' },
      daysAgo: 1,
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // EXPIRY ALERT NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  const expiryItems = [
    { name: 'Susu Sapi', days: 1, qty: 8.5 },
    { name: 'Brokoli Segar', days: 2, qty: 4.0 },
    { name: 'Tomat Cherry', days: 3, qty: 6.5 },
    { name: 'Wortel Import', days: 5, qty: 12.0 },
    { name: 'Cabai Merah Keriting', days: 4, qty: 8.0 },
  ];

  for (const item of expiryItems) {
    notifications.push({
      userId: adminId,
      type: 'EXPIRY_ALERT',
      title: `Stok Akan Kedaluwarsa: ${item.name}`,
      body: `${item.name} sebanyak ${item.qty} kg akan kedaluwarsa dalam ${item.days} hari.`,
      data: { stockItemId: null, name: item.name, qty: item.qty, daysRemaining: item.days },
      daysAgo: item.days === 1 ? 0 : item.days === 2 ? 1 : item.days === 3 ? 2 : item.days === 4 ? 3 : 4,
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SETTLEMENT READY NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  notifications.push(
    {
      userId: adminId,
      type: 'SETTLEMENT_READY',
      title: 'Settlement Bulan Ini Siap Diproses',
      body: 'Data setoran bulan Juli 2026 telah siap untuk diproses settlement. Total 12 anggota menunggu.',
      data: { period: '2026-07', memberCount: 12, totalAmount: 28500000 },
      daysAgo: 1,
    },
    {
      userId: adminId,
      type: 'SETTLEMENT_READY',
      title: 'Settlement Juni 2026 Selesai',
      body: 'Settlement Juni 2026 telah selesai diproses. Total 25 anggota, nilai settlement Rp52.500.000.',
      data: { period: '2026-06', memberCount: 25, totalAmount: 52500000, status: 'COMPLETED' },
      daysAgo: 10,
    },
    {
      userId: adminId,
      type: 'SETTLEMENT_READY',
      title: 'Settlement Parsial Mei 2026',
      body: '5 anggota Mei 2026 masih dalam tahap pembayaran parsial. Total剩 Rp8.750.000.',
      data: { period: '2026-05', partialCount: 5, remainingAmount: 8750000 },
      daysAgo: 8,
    },
    {
      userId: adminId,
      type: 'SETTLEMENT_READY',
      title: 'Pembayaran Settlement Diterima',
      body: 'Hj. Sri Wahyuni (KUD-004) telah menerima pembayaran settlement Rp3.250.000.',
      data: { memberId: null, memberNumber: 'KUD-004', amount: 3250000, period: '2026-06' },
      daysAgo: 6,
    },
    {
      userId: adminId,
      type: 'SETTLEMENT_READY',
      title: 'Settlement Belum Diproses',
      body: 'settlement April 2026 untuk 8 anggota masih menunggu konfirmasi pembayaran.',
      data: { period: '2026-04', pendingCount: 8, totalAmount: 18200000 },
      daysAgo: 15,
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // GET ACTIVE MEMBERS FOR MEMBER-SPECIFIC NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  const members = await prisma.member.findMany({
    where: { isActive: true },
    take: 12,
  });

  // ════════════════════════════════════════════════════════════════════════════
  // MEMBER DEPOSIT CONFIRMATIONS
  // ════════════════════════════════════════════════════════════════════════════
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const daysAgo = Math.floor(seededRand(i * 17) * 3);
    const qty = (3 + seededRand(i * 23) * 2).toFixed(1);
    const grade = seededRand(i * 31) < 0.8 ? 'A' : 'B';

    notifications.push({
      memberId: member.id,
      type: 'DEPOSIT_CONFIRMED',
      title: 'Setoran Diterima',
      body: `Setoran ${qty} liter susu grade ${grade} dari ${member.name} telah dikonfirmasi dan masuk ke gudang.`,
      data: { stockItem: 'Susu Sapi', grade, qty: parseFloat(qty) },
      daysAgo,
    });

    // Multiple deposit confirmations for active members
    if (seededRand(i * 43) > 0.5) {
      notifications.push({
        memberId: member.id,
        type: 'DEPOSIT_CONFIRMED',
        title: 'Setoran Harian Diterima',
        body: `Setoran ${(2.5 + seededRand(i * 53) * 1.5).toFixed(1)} liter susu berhasil direkam untuk hari ini.`,
        data: { stockItem: 'Susu Sapi', source: 'daily_input' },
        daysAgo: 1,
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MEMBER SETTLEMENT NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  for (let i = 0; i < Math.min(10, members.length); i++) {
    const member = members[i];
    const amount = Math.round(seededRand(i * 41) * 500000 + 200000);

    notifications.push({
      memberId: member.id,
      type: 'SETTLEMENT_READY',
      title: 'Settlement Bulan Ini Siap',
      body: `Total setoran bulan Juli 2026 Anda: Rp${amount.toLocaleString('id-ID')}. Siap diproses.`,
      data: { period: '2026-07', totalAmount: amount, status: 'PENDING' },
      daysAgo: 1,
    });

    // Settlement paid for past months
    if (seededRand(i * 47) > 0.3) {
      const paidAmount = Math.round(amount * 0.9);
      notifications.push({
        memberId: member.id,
        type: 'SETTLEMENT_READY',
        title: 'Pembayaran Settlement Diterima',
        body: `Pembayaran settlement Juni 2026 sebesar Rp${paidAmount.toLocaleString('id-ID')} telah diterima.`,
        data: { period: '2026-06', amount: paidAmount, status: 'PAID' },
        daysAgo: 8 + i,
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MEMBER EXPIRY ALERTS
  // ════════════════════════════════════════════════════════════════════════════
  for (let i = 0; i < Math.min(6, members.length); i++) {
    const member = members[i];
    notifications.push({
      memberId: member.id,
      type: 'EXPIRY_ALERT',
      title: 'Peringatan Kadaluwarsa',
      body: `Stok susu yang Anda setorkan sebelumnya akan kedaluwarsa dalam ${i + 1} hari.`,
      data: { stockItem: 'Susu Sapi', daysRemaining: i + 1 },
      daysAgo: i,
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MEMBER INFO NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  notifications.push(
    {
      memberId: members[0]?.id,
      type: 'INFO',
      title: 'Selamat Datang di Portal',
      body: 'Hai H. Slamet Wijaya! Anda berhasil login ke Portal Anggota KUD. Pantau setoran dan settlement Anda di sini.',
      data: { portalUrl: '/portal' },
      daysAgo: 30,
    },
    {
      memberId: members[1]?.id,
      type: 'INFO',
      title: 'Data Profil Diperbarui',
      body: 'Nomor WhatsApp Anda telah diperbarui. Notifikasi setoran akan dikirim ke nomor baru.',
      data: { changes: ['phone'] },
      daysAgo: 5,
    },
    {
      memberId: members[2]?.id,
      type: 'INFO',
      title: 'Histori Setoran Tersedia',
      body: 'Histori setoran 3 bulan terakhir Anda telah tersedia di portal. Silakan cek.',
      data: { months: 3 },
      daysAgo: 7,
    },
    {
      memberId: members[3]?.id,
      type: 'INFO',
      title: 'QR Code Kartu Anggota',
      body: 'Kartu anggota digital dengan QR Code baru telah tersedia. Scan di gerai untuk kemudahan.',
      data: { hasQR: true },
      daysAgo: 14,
    },
    {
      memberId: members[4]?.id,
      type: 'INFO',
      title: 'Pengingat Setoran',
      body: 'Jangan lupa menyetor besok pagi ya! Stok gudang siap menerima hasil peternakan Anda.',
      data: { reminderType: 'daily' },
      daysAgo: 0,
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // MEMBER WARNING NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  notifications.push(
    {
      memberId: members[6]?.id,
      type: 'WARNING',
      title: 'Tidak Ada Setoran 7 Hari',
      body: 'Anda belum menyetor selama 7 hari berturut-turut. Hubungi admin jika ada kendala.',
      data: { absentDays: 7, memberNumber: 'KUD-007' },
      daysAgo: 1,
    },
    {
      memberId: members[7]?.id,
      type: 'WARNING',
      title: 'Kualitas Setoran DiBawah Standar',
      body: 'Pada setoran terakhir, kualitas susu Anda tercatat grade B. Perhatikan kebersihan alat.',
      data: { lastGrade: 'B', memberNumber: 'KUD-008' },
      daysAgo: 2,
    },
    {
      memberId: members[8]?.id,
      type: 'WARNING',
      title: 'Settlement Tertunda',
      body: 'Settlement Mei 2026 Anda belum lunas. Sisa pembayaran Rp850.000.',
      data: { period: '2026-05', remainingAmount: 850000, memberNumber: 'KUD-009' },
      daysAgo: 3,
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // BULK CREATE NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  const now = new Date();
  const toCreate: Prisma.NotificationCreateManyInput[] = notifications.map(n => ({
    userId: n.userId || null,
    memberId: n.memberId || null,
    type: n.type,
    title: n.title,
    body: n.body,
    data: (n.data as Prisma.InputJsonValue) || Prisma.JsonNull,
    read: n.daysAgo > 3, // Older notifications are marked as read
    createdAt: new Date(now.getTime() - n.daysAgo * 24 * 60 * 60 * 1000),
  }));

  // Insert in chunks
  const chunkSize = 50;
  for (let i = 0; i < toCreate.length; i += chunkSize) {
    await prisma.notification.createMany({
      data: toCreate.slice(i, i + chunkSize),
    });
  }

  console.log(`  ✅ Created ${toCreate.length} notifications`);
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

async function createAuditLogs(adminId: string) {
  console.log('\n📋 Creating audit log entries...');

  const today = new Date();
  const logs: { userId: string; action: string; entityType: string; entityId: string | null; details: object }[] = [];

  // Generate audit logs for the past 30 days
  for (let day = 30; day >= 0; day--) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);

    // Login events (1-3 per day)
    const loginCount = Math.floor(seededRand(day * 10) * 3) + 1;
    for (let i = 0; i < loginCount; i++) {
      logs.push({
        userId: adminId,
        action: 'LOGIN',
        entityType: 'User',
        entityId: null,
        details: { timestamp: date.toISOString(), device: seededRand(day * 10 + i + 100) < 0.5 ? 'Desktop' : 'Mobile' },
      });
    }

    // Deposit events (random)
    if (seededRand(day * 20) > 0.3) {
      logs.push({
        userId: adminId,
        action: 'CREATE',
        entityType: 'StockBatch',
        entityId: null,
        details: { timestamp: date.toISOString(), action: 'bulk_deposit', count: Math.floor(seededRand(day * 20 + 1) * 15) + 5 },
      });
    }

    // Settlement events (once per past months)
    if (day === 15 || day === 0) {
      logs.push({
        userId: adminId,
        action: 'PROCESS',
        entityType: 'Settlement',
        entityId: null,
        details: { timestamp: date.toISOString(), period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` },
      });
    }

    // Export events (random)
    if (seededRand(day * 30) > 0.6) {
      const exportTypes = ['Laporan Setoran', 'Data Anggota', 'Stok Inventory', 'Settlement'];
      logs.push({
        userId: adminId,
        action: 'EXPORT',
        entityType: 'Report',
        entityId: null,
        details: { timestamp: date.toISOString(), type: exportTypes[Math.floor(seededRand(day * 30 + 2) * 4)] },
      });
    }

    // Member events (rare)
    if (seededRand(day * 40) > 0.9) {
      logs.push({
        userId: adminId,
        action: seededRand(day * 40 + 1) > 0.5 ? 'CREATE' : 'UPDATE',
        entityType: 'Member',
        entityId: null,
        details: { timestamp: date.toISOString() },
      });
    }
  }

  // Batch insert logs
  const chunkSize = 100;
  for (let i = 0; i < logs.length; i += chunkSize) {
    const chunk = logs.slice(i, i + chunkSize);
    await prisma.auditLog.createMany({ data: chunk });
  }

  console.log(`  ✅ Created ${logs.length} audit log entries`);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function createSettings() {
  console.log('\n⚙️  Creating system settings...');

  const settings = [
    { key: 'lock_time', value: '20:00', category: 'deposit', label: 'Waktu Kunci Setoran', description: 'Waktu自动锁定 setoran harian (format HH:MM)' },
    { key: 'default_grade_a_price', value: '6500', category: 'price', label: 'Harga Default Grade A', description: 'Harga default per liter untuk susu grade A' },
    { key: 'default_grade_b_price', value: '5500', category: 'price', label: 'Harga Default Grade B', description: 'Harga default per liter untuk susu grade B' },
    { key: 'whatsapp_enabled', value: 'true', category: 'notification', label: 'WhatsApp Notification', description: 'Aktifkan notifikasi WhatsApp' },
    { key: 'email_enabled', value: 'true', category: 'notification', label: 'Email Notification', description: 'Aktifkan notifikasi email' },
    { key: 'auto_reminder', value: 'true', category: 'notification', label: 'Auto Reminder', description: 'Kirim pengingat otomatis setiap pagi' },
    { key: 'app_name', value: 'KUD Transparansi', category: 'general', label: 'Nama Aplikasi', description: 'Nama yang ditampilkan di header' },
    { key: 'organization_name', value: 'Koperasi Unit Desa', category: 'general', label: 'Nama Organisasi', description: 'Nama organisasi KUD' },
    { key: 'settlement_due_days', value: '5', category: 'settlement', label: 'Hari Jatuh Tempo Settlement', description: 'Jumlah hari setelah bulan berakhir untuk settlement' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`  ✅ Created ${settings.length} settings`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const mode: SeedMode = (args[0] as SeedMode) || 'reseed';

  console.log(`\n🌱 KUD Seed — Mode: ${mode.toUpperCase()}`);
  console.log('═'.repeat(50));

  if (mode === 'clear') {
    await clearDatabase();
    console.log('\n✅ Done.');
    return;
  }

  const { admin } = await createUsers();
  const stockItems = await createStockItems();
  await createMembers();
  await createStockBatches(stockItems);
  await createMemberProducts(stockItems);
  await createSettlements(admin.id);
  await createNotifications(admin.id);
  await createAuditLogs(admin.id);
  await createSettings();

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin:    admin@kud.id / admin123');
  console.log('\n📱 Member Portal:');
  console.log('   PIN: 123456 (all members)');
  console.log('\n📦 Stock Items:');
  for (const item of stockItems) {
    console.log(`   • ${item.name} (${item.defaultUnit}, ${item.shelfLifeDays}d)`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
