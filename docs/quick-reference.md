# Quick Reference - KUD Transparansi

## Login Admin

| Peran | Email | Password |
|-------|-------|----------|
| Admin | admin@kud.id | admin123 |
| Ketua | ketua@kud.id | chairman123 |

## Login Anggota

- Buka link portal atau scan QR Code
- Masukkan **6-digit PIN**: `123456`

---

## Menu Admin

| Menu | Fungsi |
|------|--------|
| Dashboard | Overview harian |
| Setoran | Input setoran harian (bulk) |
| Anggota | Kelola data anggota |
| Stok | Kelola stok barang |
| Laporan | Export laporan bulanan |
| Settlement | Kelola pen settlement |
| QR Card | Generate & print QR card |
| Pengaturan | Konfigurasi sistem |
| Audit Log | Riwayat edit |

---

## Input Setoran Bulk

1. Menu **Setoran**
2. Pilih tanggal (default: hari ini)
3. Input qty per anggota
4. Pilih Grade (A/B)
5. Klik **Simpan Semua**
6. Notifikasi WA otomatis

---

## Workflow Settlement

```
Menunggu → Parsial → Lunas
```

- **Parsial:** Bayar sebagian
- **Lunas:** Sisa = 0

---

## Status Stok

| Status | Warna | Keterangan |
|--------|-------|------------|
| Baik | Hijau | >3 hari sebelum expired |
| Peringatan | Orange | 2-3 hari sebelum expired |
| Kritis | Merah | 1 hari sebelum expired |
| Kedaluwarsa | Merah | Sudah expired |

---

## Kode Grade

| Grade | Keterangan |
|-------|------------|
| A | Kualitas terbaik |
| B | Kualitas biasa |

---

## QR Code Portal

- QR Card berisi link unik untuk setiap anggota
- Scan QR → Buka portal → Login dengan PIN
- Link portal: `/portal/[token-unik]`

---

## Format Angka

| Input | Interpretasi |
|-------|--------------|
| 1.000.000 | Satu juta |
| 12.5 | 12,5 liter/kg |

---

## Waktu Lock

- Default: 20:00 (8 malam)
- Setelah locked → perlu akses Ketua untuk edit
- Alasan edit wajib diisi

---

## Durasi Sesi Portal

- Session berlaku **7 hari**
- Setelah itu perlu login ulang

---

*Dokumen ini terakhir diperbarui: Juli 2026*
