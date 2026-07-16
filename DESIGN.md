# DESIGN.md — Transparansi Setoran Anggota KUD
**Segmen 03 · Agrobisnis & Pertanian**

---

## 1. Design Principles

**Dua audience, dua antarmuka.** Admin di PC/laptop, anggota di HP jadul. Desain harus ramah untuk keduanya — prioritas anggota adalah mobile-first, simpel, dan tidak ada learning curve.

### 1.1 Core Principles

1. **Trust by visibility** — angka setoran harus terbaca besar, jelas, tidak bisa disalahartikan
2. **Mobile-first untuk portal anggota** — anggota peternak akses dari HP Android entry-level
3. **Warna earthy, bukan tech** — konteks pertanian/koperasi butuh rasa "hangat", bukan dingin corporate
4. **Accessibility for all ages** — font besar, tombol besar, kontras tinggi

---

## 2. Color System

### 2.1 Admin Interface

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#F7F8F5` | Page background (off-white kehijau-hijauan) |
| `surface` | `#FFFFFF` | Cards, panels |
| `border` | `#D9DDD4` | Dividers, inputs |
| `primary` | `#2D6A4F` | Teal green — pertanian/alam |
| `primary-hover` | `#245A40` | Hover state |
| `text-primary` | `#1B4332` | Headings |
| `text-secondary` | `#52796F` | Body text |

### 2.2 Member Portal (Mobile)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#F0FDF4` | Very light green |
| `surface` | `#FFFFFF` | Cards |
| `primary` | `#2D6A4F` | Teal green |
| `accent` | `#4ADE80` | Bright green for positive elements |
| `text` | `#14532D` | Dark green (not black — warmer) |

### 2.3 Status Colors

| Status | Color | Background | Usage |
|--------|-------|------------|-------|
| `deposited` | `#16A34A` | `#DCFCE7` | Sudah setor hari ini |
| `not-deposited` | `#D97706` | `#FEF3C7` | Belum setor |
| `warning` | `#D97706` | `#FFFBEB` | Alert perishable kuning |
| `critical` | `#DC2626` | `#FEF2F2` | Alert perishable merah |
| `expired` | `#DC2626` | `#FEE2E2` | Produk expired |

### 2.4 Bulk Input Table

| Row State | Background | Border |
|-----------|------------|--------|
| Has deposit | `#F0FDF4` | `#BBF7D0` |
| Empty | `#FFFFFF` | `#E5E7EB` |
| Locked | `#F9FAFB` | `#E5E7EB` (opacity 0.5) |

---

## 3. Typography

### 3.1 Font Stack

```
Primary: Inter (system fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI')
```

### 3.2 Admin Type Scale

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| `page-title` | 24px | 700 | Page headings |
| `section-title` | 18px | 600 | Section headers |
| `body` | 14px | 400 | Primary text |
| `body-small` | 13px | 400 | Secondary text |
| `label` | 12px | 500 | Form labels |
| `caption` | 11px | 400 | Helper text |

### 3.3 Member Portal Type Scale (Larger for Accessibility)

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| `display` | 36px | 800 | Main quantity display |
| `heading` | 20px | 600 | Page titles |
| `name` | 18px | 600 | Member name |
| `body` | 16px | 400 | Primary text |
| `label` | 14px | 500 | Form labels |

---

## 4. Admin Interface

### 4.1 Bulk Input Page Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  Header:                                                              │
│  [← Back]  Setoran Harian                    [Pilih Tanggal: 📅 Hari ini]
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Progress: ████████████████████████░░░░░░  12 / 15 anggota           │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ No │ Nama Anggota    │ No. Anggota │ Qty (L) │ Grade │ Status  │  │
│  ├─────┼─────────────────┼─────────────┼─────────┼───────┼─────────┤  │
│  │  1  │ Pak Slamet      │ KUD-001     │ [  22  ]│ [A ▼] │   ✅    │  │
│  │  2  │ Bu Wati         │ KUD-002     │ [  20  ]│ [A ▼] │   ✅    │  │
│  │  3  │ Pak Hasan       │ KUD-003     │ [   -  ]│ [ - ▼] │   ⏳    │  │
│  │ ... │ ...             │ ...         │   ...   │  ...  │   ...   │  │
│  ├─────┴─────────────────┴─────────────┴─────────┴───────┴─────────┤  │
│  │  TOTAL HARI INI: 487 liter                    Avg: 20.3 liter   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [Simpan Draft]                                        [💬 Kirim WA]  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Dashboard Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  🏠 Dashboard                              Admin KUD | [🔔] [Avatar]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │ Sudah      │ │ Belum      │ │ Total Qty  │ │ Total      │        │
│  │ Setor     │ │ Setor      │ │ Hari Ini   │ │ Anggota   │        │
│  │            │ │            │ │            │ │ Aktif     │        │
│  │  12       │ │  3        │ │  487 L    │ │  15       │        │
│  │  ↑ 2      │ │  ↓ 1      │ │            │ │           │        │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
│                                                                        │
│  Rekap Bulan Ini                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Total Setoran: 14,610 liter                                     │  │
│  │  Rata-rata/Hari: 487 liter                                      │  │
│  │  [Grafik Chart Area]                                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Alert                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ 3 produk akan expired dalam 2 hari                          │  │
│  │ ⏰ 2 anggota belum setor lebih dari 3 hari                     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Member Portal (Mobile)

### 5.1 Login Page

```
┌────────────────────────────────────────┐
│                                        │
│           🥛                           │
│                                        │
│      KUD Sumber Makmur                │
│      Sidoarjo                         │
│                                        │
│   ─────────────────────────           │
│                                        │
│   Masukkan PIN Anda                   │
│                                        │
│   ┌───┬───┬───┐                      │
│   │ • │ • │ • │                      │
│   ├───┼───┼───┤                      │
│   │ • │ • │ • │                      │
│   ├───┼───┼───┤                      │
│   │ • │ • │ • │                      │
│   └───┴───┴───┘                      │
│                                        │
│   ┌─────────────────────────────────┐ │
│   │            MASUK               │ │
│   └─────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

### 5.2 Dashboard Page

```
┌────────────────────────────────────────┐
│  🥛 KUD Sumber Makmur                  │
│  Halo, Pak Slamet!                    │
│  No. Anggota: KUD-001                 │
│  ──────────────────────────────────── │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │  Oktober 2026                  │  │
│  │                                 │  │
│  │  Total Setoran: 487 liter       │  │ ← 36px bold
│  │  Hari Setor: 23 hari            │  │
│  │  Rata-rata: 21.2 liter/hari     │  │
│  │                                 │  │
│  │  [< Sept]    [Nov >]           │  │
│  └─────────────────────────────────┘  │
│                                        │
│  Ringkasan                                                   │
│  ┌─────────────────────────────────┐  │
│  │ Grade A: 380 liter              │  │
│  │ Grade B: 107 liter              │  │
│  └─────────────────────────────────┘  │
│                                        │
│  [📥 Download PDF Bulan Ini]          │ ← full width button
│                                        │
│  ───────────────────────────────────  │
│  [Riwayat Lengkap →]                 │
│                                        │
└────────────────────────────────────────┘
```

### 5.3 History Page

```
┌────────────────────────────────────────┐
│  ← Riwayat Setoran                   │
│  Oktober 2026                         │
│  [< Sept]    [Nov >]                 │
│  ──────────────────────────────────── │
│                                        │
│  Tgl   | Qty      | Grade | Status    │
│  ──────────────────────────────────   │
│  01/10  | 22 liter |   A   |    ✅     │
│  02/10  | 20 liter |   A   |    ✅     │
│  03/10  |   -      |   -   |  Libur   │
│  04/10  | 21 liter |   A   |    ✅     │
│  ...                                │
│                                        │
│  23 entries                          │
│                                        │
│  [📥 Download PDF]                    │
│                                        │
│  ─────────────────────────────────── │
│  [Dashboard]              [Pengaturan] │
└────────────────────────────────────────┘
```

---

## 6. Portal Design Rules

### 6.1 Accessibility Rules

| Rule | Minimum | Rationale |
|------|--------|-----------|
| Font size | 16px | Prevents iOS zoom on focus |
| Touch target | 48x48px | Finger-friendly |
| Button height | 48px | Standard mobile touch |
| Contrast ratio | 4.5:1 | WCAG AA |
| PIN input | 64x64px per digit | Easy for older users |

### 6.2 PIN Input Design

```
┌─────────────────────────────────────┐
│                                     │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│   │ • │ │ • │ │ • │ │   │ │   │ │   │
│   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘
│    1     2     3     4     5     6
│                                     │
│   ┌───┐ ┌───┐ ┌───┐                │
│   │ 7 │ │ 8 │ │ 9 │                │
│   └───┘ └───┘ └───┘                │
│   ┌───┐ ┌───┐ ┌───┐                │
│   │ ← │ │ 0 │ │ ⌫ │                │
│   └───┘ └───┘ └───┘                │
│                                     │
└─────────────────────────────────────┘
```

---

## 7. QR Card Design

### 7.1 Card Layout (8.5cm x 5.5cm)

```
┌─────────────────────────────────────────────────┐
│  🥛                    KUD Sumber Makmur      │
│  ──────────────────────────────────────────── │
│                                                 │
│     ┌──────────┐                               │
│     │ ▓▓▓▓▓▓▓▓ │  ← QR Code                 │
│     │ ▓▓▓▓▓▓▓▓ │     (32mm x 32mm)          │
│     │ ▓▓▓▓▓▓▓▓ │                              │
│     └──────────┘                              │
│                                                 │
│     Pak Slamet                                │
│     No. Anggota: KUD-001                      │
│                                                 │
│     Scan untuk cek setoran Anda               │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 7.2 Print Layout (A4, 8 cards per page)

```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   QR Card   │  │   QR Card   │  │   QR Card   │  │
│  │     #1      │  │     #2      │  │     #3      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   QR Card   │  │   QR Card   │  │   QR Card   │  │
│  │     #4      │  │     #5      │  │     #6      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   QR Card   │  │   QR Card   │  │   QR Card   │  │
│  │     #7      │  │     #8      │  │     #8      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Perishable Stock Alerts

### 8.1 Stock Table Row Styling

| Status | Left Border | Background | Badge |
|--------|-------------|------------|-------|
| OK (>3 days) | 4px green | white | none |
| WARNING (2-3 days) | 4px amber | `#FFFBEB` | `2 HARI LAGI` |
| CRITICAL (1 day) | 4px red | `#FEF2F2` | `BESOK EXPIRED` + pulse |
| EXPIRED | 4px red | `#FEE2E2` | `EXPIRED` + strikethrough qty |

### 8.2 Alert Card Component

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Peringatan Expired                                    │
│  ─────────────────────────────────────────────────── │
│                                                          │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🟡 Wortel Import              Batch: WRT-2024-001 │ │
│  │    50 kg | Expires dalam 2 hari                   │ │
│  │    [Acknowledge] [Rotasi Sekarang]                │ │
│  └──────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🔴 Cabai Merah                Batch: CMB-2024-015 │ │
│  │    30 kg | Expires BESOK                          │ │
│  │    [Acknowledge] [Segera Proses]                 │ │
│  └──────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Component Specifications

### 9.1 BulkInputRow

```tsx
interface BulkInputRowProps {
  member: Member;
  deposit?: Deposit;
  onChange: (qty: number, grade?: Grade) => void;
  disabled?: boolean;
}

// States:
// - Empty: white bg, placeholder "0"
// - Has value: green bg #F0FDF4, value displayed
// - Locked: gray bg, value but non-editable
// - Error: red border, error message below
```

### 9.2 DailyProgressBar

```tsx
interface DailyProgressBarProps {
  totalMembers: number;
  depositedCount: number;
}

// Visual:
// Progress bar fills based on depositedCount / totalMembers
// Text: "12 / 15 anggota" centered
// Color: green fill
```

### 9.3 PINInput

```tsx
interface PINInputProps {
  length?: number; // default 6
  onComplete: (pin: string) => void;
  error?: string;
}

// Large touch targets (64px)
// Numeric keypad below
// Clear/Backspace button
// Error shake animation
```

### 9.4 MemberStatsCard

```tsx
interface MemberStatsCardProps {
  month: Date;
  totalQty: number;
  daysCount: number;
  avgPerDay: number;
  gradeBreakdown?: { A: number; B: number };
}

// Large display numbers
// Month selector arrows
// Grade breakdown collapsible
```

---

## 10. Navigation

### 10.1 Admin Sidebar

```
┌─────────────────────────────┐
│  🥛 KUD [Nama]              │
├─────────────────────────────┤
│  📊 Dashboard               │
│  📝 Setoran                │
│     ├─ Hari Ini             │
│     └─ Per Tanggal          │
│  👥 Anggota                 │
│  📈 Laporan                 │
│  📦 Stok Perishable         │
│  ⚙️  Pengaturan            │
└─────────────────────────────┘
```

### 10.2 Member Portal (Bottom Tab)

```
┌────────────────────────────────────────┐
│                                        │
│  [Content Area]                        │
│                                        │
├────────────────────────────────────────┤
│  [🏠]         [📋]         [⚙️]       │
│  Dashboard   Riwayat    Pengaturan      │
└────────────────────────────────────────┘
```

---

## 11. Empty States

### 11.1 No Deposits Today

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  📝                                                  │
│                                                          │
│  Belum Ada Data Setoran                                 │
│  untuk hari ini                                        │
│                                                          │
│  [Input Setoran Hari Ini →]                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Member No Deposits

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  🥛                                                  │
│                                                          │
│  Belum Ada Setoran                                      │
│  di bulan ini                                           │
│                                                          │
│  Hubungi admin jika ada kesalahan                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Performance Targets

| Metric | Target |
|--------|--------|
| Admin page load | < 1.5s |
| Bulk input save | < 500ms |
| Portal load | < 2s |
| WA notification send | < 3s |
| PDF generation | < 5s |
