# PRD — Transparansi Setoran Anggota KUD
**Segmen:** 03 · Agrobisnis & Pertanian
**Target:** Koperasi Unit Desa (KUD), Distributor Sayur & Buah Segar Skala Besar
**Status:** MVP Demo · Pytagotech 2026

---

## 1. Problem Statement

Anggota KUD (khususnya peternak susu) menyetor produk setiap hari. Catatan setoran dikelola admin secara manual — buku tulis, Excel sederhana, atau bahkan ingatan. Ketika anggota mempertanyakan catatan setoran mereka, tidak ada sistem yang bisa membuktikan kebenarannya secara transparan. Konflik berulang, kepercayaan erosi, dan anggota tidak merasa aman. Di sisi distributor sayur/buah: produk perishable harus dirotasi cepat, tapi tanpa tracking shelf-life otomatis, kerugian karena expired tidak bisa dihindari.

**Root cause:** Tidak ada platform yang memisahkan akses antara admin (input) dan anggota (verifikasi) dengan transparansi penuh.

---

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Konflik setoran berkurang | Jumlah dispute setoran turun >70% dalam 2 bulan |
| Anggota aktif cek riwayat sendiri | >60% anggota akses portal minimal 1x/minggu |
| Admin lebih cepat rekap | Rekap bulanan dari >4 jam menjadi <30 menit |
| Alert expired berfungsi | 0 produk expired yang tidak terdeteksi >12 jam sebelum batas |

---

## 3. User Personas

### 3A. Admin Koperasi

| Attribute | Description |
|-----------|-------------|
| **Tugas** | Catat setoran harian semua anggota |
| **Pain** | Input manual lambat, sering terjadi typo, tidak ada backup |
| **Need** | Input cepat per anggota, auto-kalkulasi total harian |
| **Tech level** | Menengah, familiar Excel |

### 3B. Anggota Koperasi (Peternak)

| Attribute | Description |
|-----------|-------------|
| **Tugas** | Setor susu setiap pagi, terima pembayaran bulanan |
| **Pain** | Tidak bisa verifikasi catatan setoran — harus percaya buta ke admin |
| **Need** | Akses riwayat setoran sendiri kapanpun dari HP |
| **Tech level** | Rendah-menengah, familiar WhatsApp |

### 3C. Ketua / Pengurus Koperasi

| Attribute | Description |
|-----------|-------------|
| **Tugas** | Audit, laporan ke anggota, keputusan distribusi hasil |
| **Pain** | Laporan rekap selalu terlambat, dibuat manual |
| **Need** | Dashboard real-time, rekap bisa di-export untuk RAT |
| **Tech level** | Menengah-tinggi |

### 3D. Manajer Gudang Distributor

| Attribute | Description |
|-----------|-------------|
| **Tugas** | Terima produk, kelola stok perishable |
| **Need** | Alert otomatis saat produk mendekati batas shelf-life |
| **Tech level** | Menengah |

---

## 4. Scope MVP

### 4.1 In Scope

- Input setoran harian per anggota (oleh admin)
- Notifikasi otomatis ke anggota setiap setoran tercatat
- Portal akses riwayat anggota (via link unik / QR card)
- Dashboard admin: rekap harian, mingguan, bulanan
- Alert stok perishable (untuk distributor)
- Export laporan (CSV, PDF)
- Akun admin multi-level (admin input + ketua audit)

### 4.2 Out of Scope

- Kalkulasi pembayaran / penggajian anggota
- Integrasi ke sistem keuangan koperasi
- Mobile app native
- Anggota bisa edit/dispute setoran langsung

---

## 5. Feature Specification

### F-01 · Input Setoran Harian

**As a** admin
**I want to** input daily deposits for all members quickly
**So that** I can complete daily recording in under 5 minutes

**Input Modes:**

| Mode | Description | Best For |
|------|-------------|----------|
| Bulk | Semua anggota dalam satu tabel | Daily routine input |
| Single | Satu per satu dengan search | Input tambahan / edit |

**Fields per Deposit:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| memberId | FK | yes | dari master anggota |
| depositDate | date | yes | default: today |
| qty | decimal | yes | liter atau kg |
| unit | string | yes | liter/kg |
| grade | enum | no | A / B |
| notes | string | no | max 200 chars |

**Business Rules:**

- Setoran hari ini bisa diedit sampai pukul 20:00 (configurable)
- Setelah locked, butuh akses tingkat chairman untuk edit + wajib isi alasan
- Auto-save draft setiap 30 detik
- Unique constraint: satu setoran per anggota per hari

**Acceptance Criteria:**
- [ ] Bulk input table menampilkan semua anggota
- [ ] Input qty dengan keyboard numerik besar
- [ ] Baris terisi highlight hijau, kosong putih
- [ ] Total qty auto-sum di footer
- [ ] Auto-lock setelah jam threshold
- [ ] Edit log tersimpan untuk perubahan setelah lock

---

### F-02 · Notifikasi Anggota

**As a** admin
**I want to** send automatic notifications to members after recording
**So that** they know their deposit was recorded and can verify

**Notification Channels:**

| Channel | Setup | Cost |
|---------|-------|------|
| WhatsApp | Fonnte API | Rp 200/pesan |
| SMS | Twilio fallback | Rp 150/pesan |

**Message Template:**
```
🥛 Konfirmasi Setoran KUD [Nama_Koperasi]

Halo Pak/Bu [Nama_Anggota],

📅 Tanggal: [tanggal_format]
📦 Qty: [X] [unit] | Grade: [A/B/null]
✅ Tercatat oleh: [Nama_Admin]

Lihat riwayat lengkap:
[Portal_Link]

Ada pertanyaan? Hubungi admin: [No_HP_Admin]
```

**Acceptance Criteria:**
- [ ] Bulk send: kirim notifikasi ke semua anggota yang sudah diinput
- [ ] Preview pesan sebelum kirim
- [ ] Status terkirim tercatat di sistem
- [ ] Retry otomatis jika gagal

---

### F-03 · Portal Anggota

**As a** member
**I want to** access my deposit history from my phone
**So that** I can verify my records anytime without asking admin

**Access Flow:**

```
1. Admin generate portal link atau print QR card
2. Member scan QR atau klik link
3. Enter 6-digit PIN
4. View history (no login required after first time)
```

**URL Format:** `/portal/[unique-token]`

**Portal Pages:**

| Page | Description |
|------|-------------|
| Dashboard | Summary bulan ini, quick stats |
| Riwayat | Tabel setoran per bulan |

**Dashboard Display:**

| Metric | Calculation |
|--------|-------------|
| Total setoran bulan ini | Sum qty bulan berjalan |
| Total hari setor | Count where qty > 0 |
| Rata-rata per hari | Total / hari setor |

**History Table:**

| Column | Source |
|--------|--------|
| Tanggal | depositDate |
| Qty | qty |
| Grade | grade (A/B/-) |
| Status | notified / not_notified |

**Business Rules:**
- Anggota TIDAK bisa edit — read-only
- Tampilan mobile-first
- No email login — cukup link + PIN
- Session expires: 7 hari

**Acceptance Criteria:**
- [ ] Link + PIN memberikan akses valid
- [ ] Dashboard menampilkan stats akurat
- [ ] Filter bulan berfungsi
- [ ] Download PDF riwayat berfungsi
- [ ] Empty state jika tidak ada setoran

---

### F-04 · Dashboard Admin

**As a** admin
**I want to** see today's deposit status at a glance
**So that** I know who has and hasn't deposited

**Dashboard Cards:**

| Card | Metric |
|------|--------|
| Sudah setor hari ini | Count where depositDate = today AND qty > 0 |
| Belum setor | Count total members - sudah setor |
| Total qty hari ini | Sum qty where depositDate = today |
| Total anggota aktif | Count where isActive = true |

**Daily Input Table:**

| Column | Description |
|--------|-------------|
| No. Anggota | memberNumber |
| Nama | name |
| Qty | input field / display |
| Grade | dropdown (A/B) |
| Status | Terdeposit / Belum |

**Row Styling:**
- Sudah setor: `bg: #F0FDF4` (light green)
- Belum setor: `bg: #FFFFFF` (white)
- Edit locked: `bg: #F3F4F6`, `opacity: 0.7`

**Monthly Report:**
- Total qty per anggota per bulan
- Grafik setoran harian sepanjang bulan
- Export CSV/PDF

**Acceptance Criteria:**
- [ ] Dashboard load < 2 detik
- [ ] Progress bar akurat (x/y anggota)
- [ ] Klik baris → input setoran modal
- [ ] Rekap export akurat

---

### F-05 · Alert Stok Perishable

**As a** warehouse manager
**I want to** receive alerts before products expire
**So that** I can rotate stock before losses occur

**Stock Entry:**

| Field | Type | Required |
|-------|------|----------|
| productName | string | yes |
| batchNumber | string | yes |
| dateIn | date | yes |
| qty | decimal | yes |
| unit | string | yes |
| shelfLifeDays | integer | yes |

**Computed Fields:**
- `expiryDate = dateIn + shelfLifeDays`

**Alert Logic:**

| Days to Expiry | Status | Color | Action |
|----------------|--------|-------|--------|
| > 3 days | OK | Green | None |
| 2-3 days | WARNING | Amber | Alert to manager |
| 1 day | CRITICAL | Red | Urgent alert to manager |
| 0 days | EXPIRED | Red + strikethrough | Auto-mark, cannot release |

**Alert Notification:**
- WhatsApp to warehouse manager
- In-app badge
- Email fallback

**Acceptance Criteria:**
- [ ] Entry form berfungsi
- [ ] Expiry date dihitung otomatis
- [ ] Status update setiap jam via cron
- [ ] Alert terkirim di waktu yang benar
- [ ] Expired products cannot be released

---

## 6. User Story (INVEST Format)

### US-01: Bulk Daily Input

```
As an admin
I want to input today's deposits for all members in one table
So that I can complete daily recording in under 3 minutes
```

**Acceptance Criteria:**
- Table shows all active members
- Entering qty highlights the row green
- Total updates in real-time
- Save + notify in one click

### US-02: Member Verification

```
As a member
I want to check my deposit history from my phone
So that I can verify records without calling admin
```

**Acceptance Criteria:**
- Access via unique link or QR scan
- PIN authentication works
- History displays correctly
- PDF export generates valid file

### US-03: Transparent Reporting

```
As a chairman
I want to export monthly reports for RAT
So that I have audit-ready documentation
```

**Acceptance Criteria:**
- Report includes all required fields
- Export format readable (CSV, PDF)
- Data matches dashboard numbers

---

## 7. Data Model

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole
  password  String
  createdAt DateTime @default(now())
}

enum UserRole {
  ADMIN
  CHAIRMAN
}

model Member {
  id           String        @id @default(cuid())
  memberNumber String        @unique
  name         String
  phone        String
  portalToken  String        @unique @default(cuid())
  portalPin    String        // bcrypt hash
  joinDate     DateTime
  isActive     Boolean       @default(true)
  deposits     DailyDeposit[]
  createdAt    DateTime      @default(now())
}

model DailyDeposit {
  id                  String    @id @default(cuid())
  memberId            String
  member              Member    @relation(fields: [memberId], references: [id])
  depositDate         DateTime
  qty                 Decimal
  unit                String    @default("liter")
  grade               Grade?
  notes               String?
  recordedBy          String    // User id
  isLocked            Boolean   @default(false)
  lockedAt            DateTime?
  editLog             Json      @default("[]")
  notificationSentAt  DateTime?
  createdAt           DateTime  @default(now())

  @@unique([memberId, depositDate])
}

enum Grade {
  A
  B
}

model PerishableStock {
  id            String       @id @default(cuid())
  productName   String
  batchNumber   String
  dateIn        DateTime
  shelfLifeDays Int
  expiryDate    DateTime
  qty           Decimal
  unit          String
  status        StockStatus  @default(OK)
  createdAt     DateTime     @default(now())
}

enum StockStatus {
  OK
  WARNING
  CRITICAL
  EXPIRED
}

model StockAlert {
  id              String   @id @default(cuid())
  stockId         String
  productName     String
  alertType       String   // WARNING | CRITICAL | EXPIRED
  daysRemaining   Int
  sentAt          DateTime
  acknowledgedBy  String?
  acknowledgedAt  DateTime?
}
```

---

## 8. Technical Architecture

### 8.1 Stack

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

### 8.2 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/members` | GET/POST | List/create members |
| `/api/members/[id]` | GET/PUT/DELETE | Member CRUD |
| `/api/members/[id]/portal` | POST | Generate portal token |
| `/api/deposits` | GET/POST | List/create deposits |
| `/api/deposits/[id]` | PUT | Update deposit |
| `/api/deposits/today` | GET | Today's deposits |
| `/api/deposits/bulk` | POST | Bulk create deposits |
| `/api/portal/auth` | POST | Verify PIN |
| `/api/portal/member/[token]` | GET | Get member by token |
| `/api/portal/history/[token]` | GET | Get member history |
| `/api/notifications/send` | POST | Send WA notifications |
| `/api/stocks` | GET/POST | List/create stocks |
| `/api/stocks/[id]` | PUT | Update stock |
| `/api/cron/check-expiry` | GET | Check expiry (cron) |

---

## 9. Demo Script

**Opening Hook:** "Berapa kali dalam sebulan ada anggota yang protes catatan setoran-nya tidak benar?"

**Flow:**
1. Buka bulk input hari ini: 15 anggota, input dalam 2 menit
2. Klik "Kirim Notifikasi" → tampilkan preview WA
3. Buka portal anggota dari HP (scan QR) → riwayat tampil
4. Buka dashboard rekap: "4 jam manual → 30 detik otomatis"
5. Tunjukkan alert perishable (jika distributor)
6. Export PDF rekap bulan ini

**Close:** "Anggota percaya karena mereka bisa cek sendiri. Admin tidak perlu defend diri tiap ada dispute."

---

## 10. Timeline

| Phase | Duration |
|-------|----------|
| Setup + schema + auth | 2 hari |
| Member CRUD + portal token | 2 hari |
| PIN auth + portal pages | 2 hari |
| Bulk input table | 3 hari |
| Daily deposits CRUD | 2 hari |
| WA notification integration | 2 hari |
| Dashboard admin + rekap | 2 hari |
| Perishable stock + alert | 3 hari |
| QR card generation | 1 hari |
| Seed data + polish | 2 hari |
| **Total** | **~21 hari kerja** |

---

## 11. Definition of Done

- [ ] Admin bisa input setoran 15 anggota < 3 menit
- [ ] WA notification terkirim dan bisa dibaca
- [ ] Portal anggota berfungsi dengan PIN
- [ ] PDF export valid dan readable
- [ ] Alert perishable terkirim di waktu yang benar
- [ ] Dashboard akurat (data = laporan)
- [ ] Mobile responsive untuk portal anggota
