# AGENT.md — Transparansi Setoran Anggota KUD
**Segmen 03 · Agrobisnis & Pertanian**

---

## 1. Stack

```
Framework:     Next.js 14 (App Router)
Database:      PostgreSQL via Supabase
ORM:          Prisma
Auth:         NextAuth (admin) + custom PIN (member portal)
Styling:      Tailwind CSS v3
WA Notif:     Fonnte API
PDF Export:   jsPDF + autoTable
QR Code:      qrcode library
Deploy:       Vercel + Supabase
```

---

## 2. Folder Structure

```
/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx                → admin shell with sidebar
│   │   ├── page.tsx                   → redirects / to dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx               → main dashboard (shared component)
│   │   ├── setoran/
│   │   │   └── page.tsx               → bulk input
│   │   ├── anggota/
│   │   │   └── page.tsx               → member list
│   │   ├── laporan/
│   │   │   └── page.tsx               → monthly reports
│   │   ├── stok/
│   │   │   └── page.tsx               → stock management
│   │   ├── settlements/
│   │   │   └── page.tsx               → payment settlements
│   │   ├── analytics/
│   │   │   └── page.tsx               → analytics
│   │   ├── audit-log/
│   │   │   └── page.tsx               → edit history
│   │   ├── export/
│   │   │   └── page.tsx               → data export
│   │   ├── qr-card/
│   │   │   └── page.tsx               → QR card generation
│   │   └── pengaturan/
│   │       └── page.tsx                → settings
│   ├── portal/
│   │   └── [token]/
│   │       ├── page.tsx                → PIN login
│   │       ├── dashboard/page.tsx      → member dashboard
│   │       └── riwayat/page.tsx        → deposit history
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── members/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   │   ├── portal/route.ts     → regenerate portal token
│   │   │   │   └── pin/route.ts        → reset PIN
│   │   │   │   └── route.ts
│   │   │   └── qr/
│   │   │       └── generate/route.ts   → generate QR codes
│   │   ├── deposits/
│   │   │   ├── route.ts                → single deposit
│   │   │   ├── today/route.ts         → today's deposits
│   │   │   └── bulk/route.ts          → bulk input
│   │   ├── portal/
│   │   │   ├── auth/route.ts
│   │   │   └── history/[token]/route.ts
│   │   ├── notifications/
│   │   │   ├── send/route.ts          → send WA/email
│   │   │   └── reminder/route.ts      → send reminder
│   │   ├── stocks/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── summary/route.ts        → dashboard stock summary
│   │   └── cron/
│   │       └── check-expiry/route.ts
│
├── components/
│   ├── ui/
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx
│   │   ├── KUDLogo.tsx
│   │   ├── NotificationBell.tsx
│   │   └── PageHeader.tsx
│   ├── admin/
│   │   ├── DashboardContent.tsx        → shared dashboard component
│   │   ├── BulkInputTable.tsx
│   │   ├── StockTable.tsx
│   │   └── MemberTable.tsx
│   └── portal/
│       ├── PINLogin.tsx
│       ├── MemberDashboard.tsx
│       ├── DepositHistory.tsx
│       └── MemberStatsCard.tsx
│
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── wa.ts
│   ├── email.ts
│   ├── pdf.ts
│   ├── qr.ts
│   ├── portal-token.ts
│   └── calculations.ts
│
└── prisma/
    └── schema.prisma
```

---

## 3. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole
  password  String
  createdAt DateTime @default(now())

  @@map("User")
}

enum UserRole {
  ADMIN
  CHAIRMAN
}

model Member {
  id           String    @id @default(cuid())
  memberNumber String    @unique
  name         String
  phone        String
  email        String?
  portalToken  String    @unique @default(cuid())
  portalPin    String
  qrCodeData   String?
  joinDate     DateTime
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())

  stockBatches      StockBatch[]
  monthlySettlements MonthlySettlement[]

  @@map("Member")
}

model StockItem {
  id           String       @id @default(cuid())
  name         String       @unique
  category     StockCategory
  defaultUnit  String
  shelfLifeDays Int
  priceGradeA  Decimal     @db.Decimal(10, 2)
  priceGradeB  Decimal     @db.Decimal(10, 2)
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())

  stockBatches StockBatch[]

  @@map("StockItem")
}

enum StockCategory {
  MINUMAN
  SAYURAN
  BUAH
  LAINNYA
}

model StockBatch {
  id            String      @id @default(cuid())
  stockItemId   String
  stockItem     StockItem   @relation(fields: [stockItemId], references: [id])
  memberId      String
  member        Member      @relation(fields: [memberId], references: [id])
  type          StockType
  qty           Decimal     @db.Decimal(10, 2)
  unit          String
  grade         Grade?
  receivedDate  DateTime
  expiryDate    DateTime
  status        StockStatus @default(OK)
  notes         String?
  createdAt     DateTime    @default(now())

  @@map("StockBatch")
}

enum StockType {
  DEPOSIT
  PURCHASE
  ADJUSTMENT
}

enum Grade {
  A
  B
}

enum StockStatus {
  OK
  WARNING
  CRITICAL
  EXPIRED
}

model MonthlySettlement {
  id            String           @id @default(cuid())
  memberId      String
  member        Member           @relation(fields: [memberId], references: [id])
  period        String
  totalQty      Decimal          @db.Decimal(10, 2)
  gradeAQty     Decimal          @db.Decimal(10, 2)
  gradeBQty     Decimal          @db.Decimal(10, 2)
  totalPayment  Decimal          @db.Decimal(12, 2)
  status        SettlementStatus
  processedById String?
  processedAt   DateTime?
  paidAt        DateTime?
  createdAt     DateTime         @default(now())

  @@unique([memberId, period])
  @@map("MonthlySettlement")
}

enum SettlementStatus {
  PENDING
  APPROVED
  PAID
  CANCELLED
}

model AuditLog {
  id          String   @id @default(cuid())
  entityType  String
  entityId    String
  action      String
  details     Json?
  performedBy String?
  createdAt   DateTime @default(now())

  @@map("AuditLog")
}

model PushSubscription {
  id        String   @id @default(cuid())
  memberId  String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())

  @@map("PushSubscription")
}
```

---

## 4. WhatsApp Integration (`/lib/wa.ts`)

```typescript
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

interface MemberInfo {
  name: string;
  phone: string;
  portalToken: string;
}

interface DepositInfo {
  depositDate: Date;
  qty: number;
  unit: string;
  grade: string | null;
}

export async function sendDepositNotification(
  member: MemberInfo,
  deposit: DepositInfo,
  recordedBy: string
): Promise<{ success: boolean; messageId?: string }> {
  const portalUrl = `${APP_URL}/portal/${member.portalToken}`;

  const dateStr = new Date(deposit.depositDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const message = `🥛 Konfirmasi Setoran

Halo Pak/Bu ${member.name},

📅 Tanggal: ${dateStr}
📦 Qty: ${deposit.qty} ${deposit.unit}${deposit.grade ? ` | Grade: ${deposit.grade}` : ''}
✅ Tercatat oleh: ${recordedBy}

Lihat riwayat lengkap:
${portalUrl}

Ada pertanyaan? Hubungi admin.`;

  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': FONNTE_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: member.phone.replace(/^0/, '62'), // convert to 62 format
      message,
      countryCode: '62',
    }),
  });

  const result = await response.json();
  return {
    success: result.status === true,
    messageId: result.message_id,
  };
}

export async function sendExpiryAlert(
  phone: string,
  productName: string,
  daysRemaining: number,
  batchNumber: string
): Promise<void> {
  const urgency = daysRemaining <= 1 ? '⚠️ URGEN!' : '⚠️ Peringatan';

  const message = `${urgency} Stok Akan Expired

${productName}
Batch: ${batchNumber}
Sisa: ${daysRemaining} hari

Segera lakukan rotasi atau proses.
`;

  await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': FONNTE_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: phone.replace(/^0/, '62'),
      message,
      countryCode: '62',
    }),
  });
}
```

---

## 5. Portal Auth (`/api/portal/auth/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const { token, pin } = await req.json();

  // Find member by token
  const member = await prisma.member.findUnique({
    where: { portalToken: token },
  });

  if (!member) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 401 });
  }

  // Verify PIN
  const pinValid = await bcrypt.compare(pin, member.portalPin);
  if (!pinValid) {
    return NextResponse.json({ error: 'PIN salah' }, { status: 401 });
  }

  // Generate session token (JWT)
  const sessionToken = await generateSessionToken(member.id);

  const response = NextResponse.json({
    success: true,
    member: {
      id: member.id,
      name: member.name,
      memberNumber: member.memberNumber,
    },
  });

  // Set httpOnly cookie
  response.cookies.set('portal_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
```

---

## 6. Cron Job: Check Expiry (`/api/cron/check-expiry/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendExpiryAlert } from '@/lib/wa';
import { addDays, differenceInDays, startOfDay } from 'date-fns';

const WAREHOUSE_PHONE = process.env.WAREHOUSE_PHONE!;
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = startOfDay(new Date());

  // Get all non-expired stock batches
  const stocks = await prisma.stockBatch.findMany({
    where: {
      status: { not: 'EXPIRED' },
    },
  });

  const alerts: Array<{ stockId: string; type: string; sent: boolean }> = [];

  for (const stock of stocks) {
    const daysRemaining = differenceInDays(new Date(stock.expiryDate!), today);
    let newStatus = stock.status;

    // Determine new status
    if (daysRemaining <= 0) {
      newStatus = 'EXPIRED';
    } else if (daysRemaining <= 1) {
      newStatus = 'CRITICAL';
    } else if (daysRemaining <= 2) {
      newStatus = 'WARNING';
    }

    // Update status if changed
    if (newStatus !== stock.status) {
      await prisma.stockBatch.update({
        where: { id: stock.id },
        data: { status: newStatus },
      });

      // Send alert if needed
      if (newStatus === 'WARNING' || newStatus === 'CRITICAL' || newStatus === 'EXPIRED') {
        try {
          const sent = await sendExpiryAlert(
            WAREHOUSE_PHONE,
            stock.stockItem?.name || 'Unknown',
            daysRemaining,
            stock.id
          );

          // Log alert to audit
          await prisma.auditLog.create({
            data: {
              entityType: 'StockBatch',
              entityId: stock.id,
              action: 'ALERT',
              details: JSON.stringify({
                alertType: newStatus,
                daysRemaining: Math.max(0, daysRemaining),
                messageSent: sent,
              }),
            },
          });

          alerts.push({ stockId: stock.id, type: newStatus, sent });
        } catch (error) {
          alerts.push({ stockId: stock.id, type: newStatus, sent: false });
        }
      }
    }
  }

  return NextResponse.json({
    processed: stocks.length,
    alerts,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 7. QR Card Generation (`/app/qr-card/page.tsx`)

```typescript
// Generate printable QR cards (A4, 8 per page)
interface QRCardProps {
  memberName: string;
  memberNumber: string;
  portalUrl: string;
  qrDataUrl: string;
}

function QRCard({ memberName, memberNumber, portalUrl, qrDataUrl }: QRCardProps) {
  return (
    <div className="w-[8.5cm] h-[5.5cm] border rounded-lg p-3 bg-white">
      <div className="flex items-start gap-2">
        <img src={qrDataUrl} alt="QR" className="w-20 h-20" />
        <div className="flex-1">
          <div className="text-xs font-bold text-green-800">
            {process.env.NEXT_PUBLIC_KOPERASI_NAME}
          </div>
          <div className="text-sm font-semibold mt-1">{memberName}</div>
          <div className="text-xs text-gray-600">No. Anggota: {memberNumber}</div>
          <div className="text-[10px] text-gray-500 mt-2">
            Scan untuk cek setoran Anda
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Seed Data

```typescript
const demoKoperasi = {
  name: "KUD Sumber Makmur - Sidoarjo",
  address: "Jl. Raya KUD No. 1, Sidoarjo",
};

const demoMembers = [
  { name: "Pak Slamet", phone: "6281234567001", memberNumber: "KUD-001" },
  { name: "Bu Wati", phone: "6281234567002", memberNumber: "KUD-002" },
  { name: "Pak Hasan", phone: "6281234567003", memberNumber: "KUD-003" },
  { name: "Bu Sri", phone: "6281234567004", memberNumber: "KUD-004" },
  { name: "Pak Budi", phone: "6281234567005", memberNumber: "KUD-005" },
  { name: "Bu Wati", phone: "6281234567006", memberNumber: "KUD-006" },
  { name: "Pak Dedi", phone: "6281234567007", memberNumber: "KUD-007" },
  { name: "Bu Ani", phone: "6281234567008", memberNumber: "KUD-008" },
  { name: "Pak Eko", phone: "6281234567009", memberNumber: "KUD-009" },
  { name: "Bu Fitria", phone: "6281234567010", memberNumber: "KUD-010" },
];

// 30 days of deposit data with realistic variations
// 2 members intentionally have gaps for demo
```

---

## 9. Development Sequence

### Sprint 1: Foundation (Hari 1-4)

```
[ ] Project setup + Prisma init
[ ] NextAuth configuration (admin)
[ ] Member CRUD API + UI
[ ] Portal token generation
[ ] PIN setup flow
[ ] Seed data: 15 members
```

### Sprint 2: Deposits Core (Hari 5-8)

```
[ ] Bulk input table component
[ ] Daily deposit API
[ ] Auto-lock logic (20:00)
[ ] Zustand store for draft saves
[ ] Deposit update flow
```

### Sprint 3: Portal (Hari 9-12)

```
[ ] PIN login page
[ ] Member dashboard
[ ] Deposit history table
[ ] Month selector
[ ] PDF export (jsPDF)
[ ] QR card generation
```

### Sprint 4: Notifications (Hari 13-15)

```
[ ] Fonnte integration
[ ] Single notification
[ ] Bulk notification
[ ] Notification status tracking
[ ] Retry logic
```

### Sprint 5: Reports & Stocks (Hari 16-19)

```
[ ] Monthly report API
[ ] Export CSV/PDF
[ ] Perishable stock CRUD
[ ] Alert logic
[ ] Cron job setup
[ ] WA alerts
```

### Sprint 6: Polish (Hari 20-21)

```
[ ] Seed data: 30 days + 2 gap scenarios
[ ] QR card print layout
[ ] Mobile polish
[ ] Demo walkthrough
```

---

## 10. Testing Checklist

- [ ] Bulk input 15 members < 3 minutes
- [ ] WA notification sends successfully
- [ ] PIN login grants access
- [ ] History displays correctly
- [ ] PDF export valid
- [ ] Expiry alert triggers at correct time
- [ ] Lock after 20:00 enforced
- [ ] QR card scannable
- [ ] CSV export accurate

---

## 11. Environment Variables

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

FONNTE_TOKEN=
WAREHOUSE_PHONE=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_KOPERASI_NAME=
```
