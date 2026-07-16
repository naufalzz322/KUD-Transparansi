# WORKING.md — KUD Transparansi (03)

**Current:** Dashboard redesigned with tabbed view (Hari Ini / Semua Produk)

## Project Overview
KUD Transparansi is a cooperative management system for tracking daily deposits, stock inventory, member payments, and member portal access.

## Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Auth:** NextAuth (admin) + custom PIN (member portal)
- **Styling:** Tailwind CSS v3 with warm cooperative theme
- **Notifications:** Fonnte WA API, Resend email
- **PDF:** jsPDF + autoTable
- **QR:** qrcode library

## Design System
- **Colors:** Cream backgrounds (#F5F0E8), terracotta accent (#C67B4E), forest green primary (#1B4D3E)
- **Fonts:** Fraunces (display), DM Sans (body), JetBrains Mono (data)
- **UI Components:** Toast notifications, Skeleton loaders, Warm shadows

## Routes
| Route | Description |
|-------|-------------|
| `/dashboard` | Main dashboard with tabs (Hari Ini / Semua Produk) |
| `/setoran` | Bulk deposit input for daily setoran |
| `/anggota` | Member management with CRUD |
| `/laporan` | Monthly reports with chart and per-member view |
| `/stok` | Stock inventory management |
| `/settlements` | Monthly payment settlements |
| `/analytics` | Analytics dashboard |
| `/audit-log` | Edit history viewer |
| `/export` | Data export (CSV/PDF) |
| `/qr-card` | QR code generation and printing |
| `/pengaturan` | Settings page |
| `/portal/[token]` | Member PIN login |
| `/portal/[token]/dashboard` | Member dashboard |
| `/portal/[token]/riwayat` | Member deposit history |

## Key Features
- [x] Multi-product stock tracking with Grade A/B
- [x] Perishable stock with expiry alerts (Baik/Peringatan/Kritis/Kedaluwarsa)
- [x] Bulk deposit input with configurable auto-lock time (hour + minute)
- [x] Member portal with PIN login
- [x] Monthly settlements with payment tracking
- [x] WhatsApp notifications via Fonnte
- [x] Email notifications via Resend
- [x] QR code generation and printing
- [x] PDF/CSV export
- [x] Audit log for edit tracking
- [x] Edit log viewer for chairman role
- [x] Mobile responsive admin layout with fixed sidebar
- [x] Settings page with database-backed configuration

## Dashboard Redesign (Latest)
- **Tabbed view:** "Hari Ini" (compact horizontal scroll) / "Semua Produk" (full grid)
- **Hari Ini tab:** Shows products with today's setoran, sorted by qty desc
- **Semua Produk tab:** Full grid with status, today's setoran, stok tersimpan + Grade A/B breakdown
- **Stock Alerts:** Critical/Warning pills shown above "Akan Expired Soon"
- **Expiring Items:** List of products expiring within 3 days
- **No summary bar:** Removed menyetor/partisipasi summary
- **No Quick Links:** Removed bottom quick action grid
- **No averages:** Removed 30-day average calculations

## Member Product Modal
- **Visual-only selection** — Toggle checkboxes show immediate visual feedback but DB saves only on "Simpan" click
- **Batal discards changes** — Closing modal without saving reverts to original DB state

## UI Components

### ConfirmModal
- **Added 'success' variant** — Green success variant for "Tandai Lunas" confirmation
- **Fallback for unknown variants** — Prevents undefined error when using unknown variant

## Dashboard
- **Proper loading skeleton** — Matches dashboard layout with tabs, product cards, alerts, and attention section

## Settlement Page
- New workflow — Menunggu → Parsial → Lunas (replaced APPROVED/CANCELLED)
- One "Bayar" button — Handles both partial and full payment in one modal
- Smart status — If Bayar amount = remaining → Lunas, if amount < remaining → Parsial
- Money input with dots — Auto-formats with dot separators (1.000.000) for better UX
- Paid amount tracking — Shows Terbayar column with remaining amount and progress bar
- Summary cards — Shows Total Tagihan and Total Terbayar with percentage

## Stok Page
- **Localized status labels** — Filter buttons: "Baik", "Peringatan", "Kritis", "Kedaluwarsa"
- **StockCard component** — Status badges in Indonesian, "Exp. Terdekat" label

## Laporan Page
- **Improved product cards** — Show detailed Grade A/B breakdown with progress bars, percentages, and total days
- **Better navigation** — "← Kembali ke Semua Produk" back button with icon when viewing single product
- **Product header** — Shows selected product name prominently

## QR Code Modal
- **New QRCodeModal component** — Shows member QR code in a modal (not new tab)
- Displays QR card preview, portal URL with copy button, and link to print page

## Seed Data
- 15 members with realistic Indonesian names
- 9 stock items across 4 categories (MINUMAN, SAYURAN, BUAH, LAINNYA)
- 14 days of deposit history
- Realistic expiry distribution across products
- **Member-Product assignments** — Each member assigned to 1-3 products based on tier:
  - Tier 0 (KUD-001 to 006): Primary Susu Sapi + vegetables
  - Tier 1 (KUD-007 to 011): Vegetables and fruits mix
  - Tier 2 (KUD-012 to 015): Various products

## Demo Credentials
- **Admin:** admin@kud.id / admin123
- **Chairman:** ketua@kud.id / chairman123
- **Member PIN:** 123456 (all members)

## Environment Variables
```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
FONNTE_TOKEN=
WAREHOUSE_PHONE=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_KOPERASI_NAME=
RESEND_API_KEY=
```

## Development
```bash
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts reseed
npm run dev
```
