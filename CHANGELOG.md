# CHANGELOG — KUD Transparansi (03)

## [Unreleased]

### Added

#### Laporan Page Redesign
- **Conditional tabs** — Tabs (Grafik/Per-Anggota) only shown when single product selected
- **All products view** — Shows product cards directly without tab bar
- **Clickable product cards** — Enhanced with arrow icon and "Lihat Detail" hover overlay
- **Grade labels** — Changed "A/B" to "Grade A/Grade B" in product cards

#### Export Page Redesign
- **New category tabs** — Laporan Setoran, Data Anggota, Stok Inventory, Pencairan Settlement, Riwayat Transaksi
- **Date range picker** — Manual date selection with quick presets (Bulan Ini, Lalu, dll)
- **Format options** — CSV or XLSX selection
- **Live preview** — Shows count and stats before exporting
- **Export history** — Tracks last 10 exports with localStorage
- **Success animation** — Animated feedback on successful export

**New API Routes:**
- `GET /api/export/preview` — Preview data count and stats
- `GET /api/export/setoran` — Export setoran to CSV
- `GET /api/export/anggota` — Export anggota to CSV
- `GET /api/export/stok` — Export stok to CSV
- `GET /api/export/settlement` — Export settlement to CSV
- `GET /api/export/transaksi` — Export transaksi to CSV

#### Seed Data Improvements
- **Unique member data** — Each member now has unique phone numbers, varied email addresses (some null)
- **Active/Inactive mix** — 3 members (KUD-007, KUD-011, KUD-014) are marked inactive for demo
- **Transaction variety** — Added PURCHASE type (external supplier buys) and ADJUSTMENT type transactions
- **Stock status variety** — Added EXPIRED, CRITICAL, and WARNING status batches for demo
- **Progress bar** — Visual progress indicator during seed execution
- **Audit logs** — Auto-generates 30 days of audit history (logins, deposits, settlements, exports)
- **Settings seed** — Pre-populates system settings (lock time, prices, notifications, etc.)

### Removed

- **Analytics page** — Merged into Laporan page (Tren tab)
- **Analytics API** — Data now served via `/api/reports/monthly?includeTrend=true`

#### Settlement Product Breakdown
- **SettlementDetail model** — New table to track per-product breakdown in settlements
- **Detail modal** — Click "Detail" button to see product-level details
- **Grade A/B per product** — Shows qty, price, and payment per grade per product
- **Visual indicators** — Green (A) and amber (B) badges with quantities
- **Unit display** — Shows the product's default unit (liter, kg, etc.)

**Example breakdown view:**
```
┌─────────────────────────────────────────┐
│ Susu Sapi                               │
│ Grade A: 120L × Rp 6.500 = Rp 780.000  │
│ Grade B: 30L × Rp 5.500 = Rp 165.000   │
├─────────────────────────────────────────┤
│ Wortel Import                           │
│ Grade A: 50kg × Rp 12.000 = Rp 600.000 │
└─────────────────────────────────────────┘
```

#### Auto Settlement Calculation
- **Removed "Hitung settlements" button** — Settlements now calculate automatically
- **Real-time updates** — When deposits are recorded, settlements are updated immediately
- **Period-aware** — Each deposit triggers recalculation for its respective month

#### QR Code Visual Differentiation
- **Cache-busting removed** — QR codes now generate consistent URLs without cache-busting
- **Stored QR matches portal modal** — Both qr-card and anggota portal modal show the same stored QR
- **Regenerate produces new portal token** — When regenerating, a new token is generated and QR is regenerated for that token
- **No broken QR links** — Prevents mismatch between stored QR URL and portal token
- **QR button removed from anggota page** — Portal modal now displays the QR code directly, eliminating duplicate action

#### QR Code Data Sync
- **Consistent QR generation** — Both qr-card and portal regenerate use the same URL format (no cache-busting)
- **Explicit field selection** — API endpoints now explicitly select `qrCodeData` to ensure it's always included
- **Cache control headers** — Added `no-cache` headers to prevent stale data
- **Fresh data on modal open** — Portal modal fetches latest member data including QR before displaying

#### Modal UX Improvements
- **Scroll lock** — Background page scroll is disabled when modal is open
- **Click outside to close** — All modals can be closed by clicking the backdrop
- **Padding compensation** — Prevents layout shift when scrollbar disappears
- **Applied to all modals** — Portal, PIN, Member Form, WA Notification, Member Product, QR Code, Confirm, Settlement modals, and mobile sidebar

### Changed

#### Settlement Modal
- **Fixed modal height** with scrollable content for many products
- **Click outside to close** — Both Bayar and Detail modals can be closed by clicking outside
- **Removed Grade A/B column** — Details now only in the modal

#### Member QR Code Modal
- **QRCodeModal component** — Shows QR code in a modal instead of opening new tab
- Displays member QR card, portal URL with copy button, and print link
- Available in anggota page action buttons

#### Seed Data
- **Member Products** — `createMemberProducts()` function now called during seed, assigning each member to specific products based on tier
- Each member has 1-3 products assigned based on their tier:
  - Tier 0 (KUD-001 to 006): Primary Susu Sapi + vegetables
  - Tier 1 (KUD-007 to 011): Vegetables and fruits mix
  - Tier 2 (KUD-012 to 015): Various products

### Changed

#### Settlement System
- **New statuses** — Replaced APPROVED/CANCELLED with: Menunggu → Parsial → Lunas
- **Added paidAmount field** — Tracks partial payment amounts
- **One "Bayar" button** — Simplified to single button that handles both partial and full payment
- **Smart status detection** — If amount = remaining → Lunas, if amount < remaining → Parsial
- **Money input with dot formatting** — Automatically adds dot separators (e.g., 1000000 → "1.000.000") for better UX
- **Updated summary cards** — Shows Total Tagihan and Total Terbayar with progress
- **Updated table** — Shows Terbayar column with remaining amount and progress bar
- **Updated seed** — Some settlements show PARSIAL status for demo

#### Settlements Page
- **Added confirmation modal** — "Lunas" button now shows confirmation dialog before marking as paid
- **Fixed title typo** — Changed "Pen settlements" to "Settlement"
- **Localized status badges** — PENDING → "Menunggu", PARSIAL → "Parsial", PAID → "Lunas"

### Fixed

#### Dashboard Skeleton
- **Proper loading skeleton** — Matches dashboard layout with tabs, product cards, alerts, and attention section

#### ConfirmModal Component
- **Added 'success' variant** — Added green success variant for "Tandai Lunas" confirmation
- **Added fallback for unknown variants** — Prevents undefined error when using unknown variant

#### Stok Page
- **Localized status labels** — Filter buttons now use Indonesian: "Baik", "Peringatan", "Kritis", "Kedaluwarsa"
- **StockCard component** — Status badges use Indonesian labels, "Exp. Terdekat" for nearest expiry

#### Laporan Page
- **Removed "Tampilkan semua produk" link** — Redundant when viewing all products
- **Improved product cards** — Now show detailed Grade A/B breakdown with progress bars and percentages
- **Better back button** — "← Kembali ke Semua Produk" with icon when viewing single product
- **Product header** — Shows selected product name prominently when drilling down

#### Member Product Modal
- **Visual-only toggle** — Check/uncheck products shows immediate visual feedback but only saves to DB on "Simpan" click
- **No auto-save on choose** — Removed `setHasChanges(true)` on toggle; `hasChanges()` now calculates diff vs original state
- **Batal discards changes** — Closing modal without saving reverts to original DB state

#### Dashboard Redesign
- **Tabbed view** — "Hari Ini" (compact horizontal scroll) / "Semua Produk" (full grid)
- **Hari Ini tab** — Products with today's setoran, sorted by qty desc
- **Semua Produk tab** — Full grid showing: name, category badge, status badge, today's setoran, stok tersimpan with Grade A/B breakdown
- **Stock Alerts** — Critical/Warning pills moved above "Akan Expired Soon" section
- **Removed summary bar** — No more menyetor/partisipasi totals
- **Removed Quick Links** — Bottom quick action grid removed
- **Removed averages** — No more 30-day average calculations
- **Route change** — Dashboard now at `/dashboard` (both `/` and `/dashboard` work)

### Fixed
- **Sidebar disappearing on /dashboard** — Moved `app/dashboard/page.tsx` inside `(admin)` route group
- **Stale .next cache** — Deleted corrupted cache causing 404s on static chunks
- **Grade A/B display** — Re-added Grade A/B breakdown in "Semua Produk" cards

---

## [v0.2.0] — UI/UX Polish

### Added

#### Authentication
- **Login Page** (`/auth/login`)
  - Email/password form with NextAuth credentials
  - Demo credential buttons for quick login
  - Error handling and loading states
- **Session Provider** — Wraps app for session management
- **Middleware** — Protects admin routes, redirects to login

#### Member Management
- **MemberFormModal** — Full CRUD modal for add/edit members
  - Create new members with member number, name, phone, join date
  - Edit existing members (name, phone, active status)
  - Form validation and error handling
- **PortalTokenModal** — View and regenerate member portal access links
  - Copy link to clipboard
  - Regenerate token with confirmation
- **PINSetupModal** — Admin can set/reset member PIN
  - 6-digit PIN with confirmation
  - Tips for secure PIN selection

#### Deposit System
- **Auto-lock logic (20:00)** — Deposits automatically lock after 8 PM
  - Visual lock indicator on locked dates
  - Countdown timer for today's lock time
  - Warning banner when data is locked
  - Edit blocked for locked deposits
- **WANotificationModal** — Send WhatsApp notifications from bulk input
  - Preview message before sending
  - Select/deselect recipients
  - Bulk notification with progress

#### Portal
- **PDF Export API** (`/api/portal/export/[token]`)
  - Generate PDF from portal history
  - Session-verified download
  - Includes member stats and full monthly history
- **Session Verification** — Enhanced JWT verification with member token binding
  - Portal history and export require valid session cookie
  - Session token includes memberToken for cross-verification

#### Reports (Admin)
- **Monthly Report API** (`/api/reports/monthly`)
  - Daily breakdown with weekend indicators
  - Per-member statistics
  - Grade A/B breakdown
- **CSV Export** (`/api/reports/export/csv`)
  - Full monthly deposit export
  - CSV format for spreadsheet analysis
- **Enhanced Laporan Page**
  - Tab view: Chart vs Per-Member breakdown
  - Grade distribution with progress bars
  - 12-month selector
  - Real data from API (with mock fallback)

#### API Routes
- `POST /api/members/[id]/portal` — Regenerate portal token
- `POST /api/members/[id]/pin` — Reset member PIN
- `GET /api/reports/monthly` — Monthly statistics
- `GET /api/reports/export/csv` — CSV export
- `GET /api/portal/export/[token]` — PDF export for member

#### Infrastructure
- `vercel.json` — Vercel cron configuration (hourly expiry check)
- Enhanced seed script with realistic Indonesian names
- 15 members with regional data
- Perishable stock with various expiry stages

### Changed
- Updated `anggota/page.tsx` with full CRUD modals and action buttons
- Updated `setoran/page.tsx` with auto-lock and WA notifications
- Updated `dashboard/page.tsx` with PDF download functionality
- Updated `riwayat/page.tsx` with PDF download functionality
- Updated `laporan/page.tsx` with real API data and enhanced UI
- Updated `lib/portal-token.ts` with memberToken in JWT payload
- Updated `app/api/portal/history/[token]/route.ts` with session verification
- Updated `app/api/portal/export/[token]/route.ts` with session verification

### Stack
- Framework: Next.js 14 (App Router)
- Database: PostgreSQL via Supabase
- ORM: Prisma
- Auth: NextAuth (admin) + custom PIN (member portal)
- Styling: Tailwind CSS v3
- WA Notif: Fonnte API
- PDF: jsPDF + autoTable
- QR: qrcode library

### Fixed
- **JWT Secret Mismatch** — `app/api/portal/history/[token]/route.ts` now uses consistent fallback secret with token generator
- **WA Notification Bug** — `app/(admin)/setoran/page.tsx` fixed member ID filtering for notifications
- **Default PIN Consistency** — `app/api/members/route.ts` now creates members with PIN `123456` (matching seed data)
- **`setPortalSession` Signature** — `lib/portal-token.ts` added missing `memberToken` parameter

### Fixed (Schema Migration)

#### API Routes
- **stocks/[id] route** — Rewritten to use `prisma.stockBatch` instead of non-existent `PerishableStock` model
- **cron/check-expiry route** — Updated from `perishableStock` to `stockBatch`, replaced `StockAlert` with `AuditLog`, fixed `sendExpiryAlert` return type (boolean, not object)
- **deposits/today route** — Added missing `deposits` map and `members` array to response for BulkInputTable compatibility
- **portal/history/[token] route** — Set `notified: true` default (notification tracking field removed in schema)
- **stocks/route** — Added `totalAll` field to response
- **stocks/alerts route** — Completely rewritten: queries `AuditLog` with `entityType: 'StockBatch'` and `action: 'ALERT'` instead of non-existent `StockAlert` model
- **portal/profile/[token] route** — Updated to Next.js 14 async params Promise pattern
- **export/accounting route** — Fixed `date-fns/locale` import to use top-level import with `id as idLocale`
- **analytics route** — Renamed `totalBatches` to `totalDeposits` in response summary
- **settings/price route** — Completely rewritten: uses `StockItem.priceGradeA/B` fields instead of non-existent `PriceSetting` model
- **members/[id] route** — Changed `member.deposits` to `member.stockBatches` relation

#### Pages & Components
- **BulkInputTable** — Fixed `isLocked` prop type from function `(memberId: string) => boolean` to boolean
- **stok-perishable page** — Fixed filter logic to use explicit field mapping with `totalAll`
- **export/page** — Completely rewritten: fixed malformed JSX (unquoted className attributes, unclosed divs, wrong locale variable)
- **members/route** — Fixed `isActive` filter logic (was filtering out all when 'all' selected), fixed bcrypt import (was using broken dynamic import pattern)

#### Libraries
- **portal-token.ts** — Added `verifyPortalSession()` function for session verification

#### Documentation
- **AGENT.md** — Updated cron/check-expiry code example from `perishableStock`/`StockAlert` to `stockBatch`/`AuditLog`

### Added (New Features)

#### Mobile Responsive Admin
- Mobile hamburger menu with slide-out sidebar
- Responsive top bar with adaptive padding
- Mobile card layout for BulkInputTable (instead of table)
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px+)

#### Email Notifications
- **Email Library** (`lib/email.ts`) — Resend API integration for email notifications
- **Email field** — Added to Member model for optional email capture
- **Channel Selection** — WANotificationModal now supports WhatsApp, Email, or Both
- **Email Template** — Professional HTML email with KUD branding

#### Edit Log Viewer (Chairman)
- **Edit Log API** (`/api/deposits/edit-log`) — Returns edit history with chairman-only access
- **Riwayat Edit Page** (`/riwayat-edit`) — Timeline view of all deposit edits
- **Edit Tracking** — Bulk deposit API now properly tracks qty changes with timestamps
- Summary stats: total edits, deposits edited, qty changed

### Next — Future Tasks
- [ ] Payment calculation module
- [ ] Export to accounting software
- [ ] SMS fallback for notifications
- [ ] Push notifications (PWA)

### Web Push Notification System

#### In-App Notification System
- **Notification Model** — New database table for storing notifications
- **Notification API** — CRUD operations: GET, POST, PATCH (read), DELETE
- **Notification Types** — INFO, WARNING, EXPIRY_ALERT, SETTLEMENT_READY, DEPOSIT_CONFIRMED, SYSTEM
- **Auto-creation** — Cron job creates notifications when stock expiry detected

#### Notification Bell Component
- **Real-time badge** — Shows unread count with animated badge (max 99+)
- **Dropdown preview** — Shows latest 6 notifications with type icons
- **Auto-mark read** — Notifications marked as read when dropdown opens
- **Type-specific icons** — Color-coded icons for each notification type
- **Quick actions** — Mark read, open link, delete buttons

#### Notification Permission Prompt
- **Auto-show** — Appears 2 seconds after dashboard load if not subscribed
- **Browser push integration** — Links with existing push subscription system
- **Dismiss persistence** — Remembers dismissal in localStorage

#### Notifications Page (`/notifications`)
- **Filter tabs** — All, Unread, Kadaluarsa, Peringatan, Settlement, Info
- **Bulk actions** — Select multiple, mark read all, delete selected
- **Card design** — Type icon, title, body, timestamp, action buttons
- **Pagination** — Load more with infinite scroll pattern
- **Read/Delete per notification** — Individual action buttons

### UI/UX Comprehensive Redesign
#### Design System
- **New Color Palette** — Warm cream backgrounds (#F5F0E8), terracotta accent (#C67B4E), deep forest green primary (#1B4D3E)
- **Typography Upgrade** — Fraunces (serif display), DM Sans (body), JetBrains Mono (data/numbers)
- **New CSS Variables** — Full warm palette with surface, accent, muted text colors
- **Enhanced Shadows** — `shadow-warm` and `shadow-warm-lg` for softer depth

#### New UI Components
- **Toast System** (`components/ui/Toast.tsx`) — Success/error/info toasts with auto-dismiss
- **Skeleton Loaders** (`components/ui/Skeleton.tsx`) — SkeletonCard, SkeletonTable, SkeletonList
- **Page Header** (`components/ui/PageHeader.tsx`) — Consistent page headers with breadcrumbs and actions
- **Breadcrumb** (`components/ui/Breadcrumb.tsx`) — Navigation breadcrumbs

#### Page-Specific UX Improvements
- **Login Page** — Professional SVG logo, password visibility toggle, collapsible demo section
- **Admin Dashboard** — Hero stat card for Total Qty, date display, dynamic reminders with actionable links, quick action grid
- **Member Table** — Search bar, status filters (Semua/Aktif/Nonaktif), labeled buttons (Portal/PIN/QR/Edit), mobile card layout
- **QR Card Page** — Back button, search, checkbox selection, individual print, batch print

### New QR Card System with WhatsApp Integration

#### QR Code Management
- **QR Card Page** (`/qr-card`) — Full QR code management interface
  - Progress tracking (X / Y members have QR)
  - Search and filter members
  - Bulk selection with select all
  - Generate QR for individual, selected, or all members
  - Print single, selected, or all QR cards
- **Print Page** (`/qr-card/print`) — Print-optimized QR card layout
  - Auto print on page load
  - 4-column grid layout
  - KUD branding header
  - Print instructions panel

#### Database Changes
- **Member.qrCodeData** — New field to store Base64 QR code image
- QR codes generated once and cached until regenerated

#### API Routes
- `POST /api/members/qr/generate` — Generate and save QR codes
- `GET /api/members/qr/generate` — Get QR generation status
- `POST /api/notifications/reminder` — Send WhatsApp reminders with QR attached

#### WhatsApp Auto-Reminder (Fonnte)
- **Dashboard "Belum Setor" Section**
  - Individual "Kirim WA" button per member → auto-sends via Fonnte
  - "Kirim WA Semua" bulk button → sends to all not-deposited members
  - Sent status tracking (shows ✓ after sent)
  - Loading spinner during sending
- **Reminder Message Format:**
  ```
  🥛 Pengingat: Belum Setor

  Halo Pak/Bu [Nama],

  📢 Kami belum menerima setoran susu Anda hari ini.

  Segera antar susu ke KUD sebelum pukul [current_time].

  📱 Portal: [url]
  [QR CODE IMAGE ATTACHED]

  Terima kasih 🙏
  ```
- **QR Attachment** — Fonnte supports image attachment via FormData
  - Converts Base64 QR from database to blob
  - Sends with reminder message
- **Member Portal Dashboard** — Today's deposit status banner, gradient header, improved bottom nav (Kembali instead of dead Pengaturan)

