# Glossary - KUD Transparansi

## Istilah Umum

### A

**Admin**
> Pengguna sistem dengan akses untuk input data, mengelola anggota, dan konfigurasi sistem.

**Audit Log**
> Catatan otomatis semua perubahan data, siapa yang mengubah, kapan, dan alasan perubahan.

---

### B

**Bulk Input**
> Metode input data banyak anggota sekaligus dalam satu tampilan tabel.

---

### C

**Cron Job**
> Tugas otomatis yang berjalan pada jadwal tertentu (misal: cek expired setiap jam).

---

### D

**Dashboard**
> Halaman utama yang menampilkan ringkasan data dan statistik.

---

### G

**Grade A**
> Kualitas terbaik untuk produk yang ди setorkan.

**Grade B**
> Kualitas biasa untuk produk yang ди setorkan.

---

### K

**KUD**
> singkatan dari **Koperasi Unit Desa**, yaitu organisasi ekonomi rakyat yang bergerak di bidang usaha bersama.

**Konfigurasi**
> Pengaturan sistem yang bisa diubah oleh admin.

---

### L

**Locked**
> Status dimana data setoran tidak bisa diedit lagi karena sudah melewati jam batas.

---

### M

**Member / Anggota**
> Anggota KUD yang menyetor produk dan bisa akses portal.

---

### P

**PDF**
> Format file dokumen digital yang bisa di-download dan dicetak.

**PIN**
> Kode 6 digit untuk login di portal anggota.

**Portal**
> Halaman web khusus anggota untuk melihat riwayat setoran.

**PRD**
> Product Requirements Document, dokumen spesifikasi produk.

---

### Q

**QR Code**
> Kode barcode 2 dimensi yang mengandung link unik untuk setiap anggota.

---

### R

**Reset**
> Mengembalikan ke pengaturan awal atau membuat ulang sesuatu.

---

### S

**Session**
> Periode aktif login sebelum harus login ulang.

**Setoran**
> Produk yang ди setorkan oleh anggota ke KUD.

**Settlement**
> Pembayaran hasil penjualan produk anggota.

**Shelf Life**
> Masa simpan produk sebelum expired.

**Status Stok**
> Kondisi produk berdasarkan jarak ke tanggal expired:
- **Baik** (>3 hari)
- **Peringatan** (2-3 hari)
- **Kritis** (1 hari)
- **Kedaluwarsa** (sudah expired)

---

### T

**Token**
> Kode unik yang digunakan untuk mengakses portal anggota.

---

### W

**WA / WhatsApp**
> Aplikasi pesan instan untuk mengirim notifikasi.

---

## Singkatan

| Singkatan | Kepanjangan |
|-----------|-------------|
| KUD | Kopi Unit Desa |
| WA | WhatsApp |
| QR | Quick Response |
| PDF | Portable Document Format |
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| PIN | Personal Identification Number |

---

## Flowchart Sederhana

### Input Setoran
```
Admin Login → Setoran → Bulk Input → Simpan → Notifikasi WA
```

### Akses Portal Anggota
```
Buka Link/Scan QR → Masukkan PIN → Dashboard → Lihat Riwayat
```

### Workflow Settlement
```
Menunggu → Parsial (bayar sebagian) → Lunas (lunas)
```

---

*Dokumen ini terakhir diperbarui: Juli 2026*
