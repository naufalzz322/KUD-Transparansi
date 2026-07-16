# Panduan Pengguna - KUD Transparansi

Dokumen ini berisi panduan penggunaan sistem KUD Transparansi untuk **Admin/Pengurus** dan **Anggota KUD**.

---

## Daftar Isi

1. [Panduan Admin](#panduan-admin)
   - [Login](#login-admin)
   - [Dashboard](#dashboard-admin)
   - [Input Setoran Harian](#input-setoran-harian)
   - [Kelola Anggota](#kelola-anggota)
   - [Kelola Stok](#kelola-stok)
   - [Laporan](#laporan)
   - [Pen Settlement](#settlement)
   - [Pengaturan](#pengaturan)
   - [QR Card](#qr-card)

2. [Panduan Anggota](#panduan-anggota)
   - [Akses Portal](#akses-portal)
   - [Login dengan PIN](#login-dengan-pin)
   - [Lihat Dashboard](#dashboard-anggota)
   - [Lihat Riwayat Setoran](#riwayat-setoran)
   - [Download PDF](#download-pdf)
   - [Logout](#logout)

---

# Panduan Admin

<a name="login-admin"></a>
## Login Admin

### Cara Login
1. Buka browser dan kunjungi URL sistem KUD
2. Masukkan **Email** dan **Password**
3. Klik tombol **Masuk**

### Kredensial Default
| Peran | Email | Password |
|-------|-------|----------|
| Admin | admin@kud.id | admin123 |
| Ketua | ketua@kud.id | chairman123 |

> ⚠️ **Penting:** Segera ubah password setelah login pertama kali.

---

<a name="dashboard-admin"></a>
## Dashboard

Dashboard menampilkan gambaran umum aktivitas harian:

### Tab "Hari Ini"
- Menampilkan setoran hari ini
- Daftar anggota yang sudah dan belum menyetor
- Urutkan berdasarkan jumlah (qty) terbesar

### Tab "Semua Produk"
- Status stok semua produk
- Jumlah setoran hari ini per produk
- Breakdown Grade A dan Grade B

### Bagian Peringatan
- **Akan Expired:** Daftar produk yang akan expired dalam 3 hari
- **Status Kritis:** Peringatan untuk produk yang perlu perhatian segera

---

<a name="input-setoran-harian"></a>
## Input Setoran Harian

### Mode Bulk (Rekomendasi)
1. Klik menu **Setoran**
2. Pilih tanggal setoran (default: hari ini)
3. Tabel menampilkan semua anggota aktif
4. Untuk setiap anggota:
   - Masukkan jumlah (qty) di kolom yang sesuai
   - Pilih Grade (A atau B) jika diperlukan
   - Catatan tambahan opsional
5. Klik **Simpan Semua** di bagian bawah
6. Sistem akan mengirim notifikasi WhatsApp otomatis

### Input Tunggal
1. Klik tombol **+ Tambah** atau klik baris anggota
2. Isi form setoran
3. Klik **Simpan**

### Fitur Tambahan
- **Auto-save draft:** Data tersimpan otomatis
- **Penguncian otomatis:** Setoran hari ini bisa diedit hingga pukul 20:00 (dapat dikonfigurasi)
- **Edit setelah terkunci:** Membutuhkan akses tingkat Ketua dan wajib isi alasan

---

<a name="kelola-anggota"></a>
## Kelola Anggota

### Lihat Daftar Anggota
1. Klik menu **Anggota**
2. Daftar anggota ditampilkan dalam tabel
3. Gunakan **Search** untuk mencari anggota
4. Filter berdasarkan status (Aktif/Nonaktif)

### Tambah Anggota Baru
1. Klik tombol **+ Tambah Anggota**
2. Isi formulir:
   - Nama lengkap
   - Nomor anggota (auto-generate atau manual)
   - Nomor WhatsApp
   - Produk yang ди setorkan
   - Tanggal bergabung
3. Klik **Simpan**

### Edit Anggota
1. Klik tombol **Edit** pada baris anggota
2. Ubah data yang diperlukan
3. Klik **Simpan**

### Nonaktifkan Anggota
1. Klik tombol **Edit** pada baris anggota
2. Matikan toggle **Status Aktif**
3. Klik **Simpan**

> Anggota yang dinonaktifkan tidak muncul di input setoran harian.

### Generate Portal & QR Card
1. Klik tombol **Portal** pada baris anggota
2. Sistem akan menghasilkan link portal unik
3. Klik **Print QR Card** untuk mencetak kartu QR

---

<a name="kelola-stok"></a>
## Kelola Stok

### Lihat Stok
1. Klik menu **Stok**
2. Filter berdasarkan status:
   - **Baik** (>3 hari sebelum expired)
   - **Peringatan** (2-3 hari sebelum expired)
   - **Kritis** (1 hari sebelum expired)
   - **Kedaluwarsa** (sudah expired)

### Tambah Stok Baru
1. Klik tombol **+ Tambah Stok**
2. Isi formulir:
   - Nama produk
   - Jumlah (qty)
   - Unit (kg/liter/pcs)
   - Tanggal masuk
   - Masa simpan (shelf life) dalam hari
3. Sistem akan menghitung otomatis tanggal expired
4. Klik **Simpan**

### Edit Stok
1. Klik tombol **Edit** pada baris stok
2. Ubah data yang diperlukan
3. Klik **Simpan**

---

<a name="laporan"></a>
## Laporan

### Laporan Bulanan
1. Klik menu **Laporan**
2. Pilih **Bulan** dan **Tahun**
3. Pilih **Produk** atau lihat semua produk

### Informasi yang Ditampilkan
- Total setoran bulan ini
- Rata-rata per hari
- Breakdown Grade A dan Grade B
- Grafik setoran harian
- Perbandingan antar produk

### Export Laporan
1. Pilih periode dan produk
2. Pilih format: **PDF** atau **CSV**
3. Klik **Export**

---

<a name="settlement"></a>
## Settlement (Pen Settlement)

### Lihat Daftar Settlement
1. Klik menu **Settlement**
2. Daftar bulan settlement ditampilkan
3. Klik bulan untuk melihat detail

### Workflow Settlement
```
Menunggu → Parsial → Lunas
```

### Bayar Settlement
1. Pilih anggota yang akan dibayar
2. Klik tombol **Bayar**
3. Masukkan jumlah pembayaran
4. Sistem akan menghitung:
   - Jika jumlah = sisa → Status: **Lunas**
   - Jika jumlah < sisa → Status: **Parsial**
5. Klik **Konfirmasi**

### Format Input
- Gunakan titik sebagai pemisah ribuan (contoh: 1.000.000)

---

<a name="pengaturan"></a>
## Pengaturan

### Konfigurasi Sistem
1. Klik menu **Pengaturan**
2. Ubah pengaturan yang diperlukan:

| Pengaturan | Deskripsi |
|------------|-----------|
| Nama Kopi | Nama resmi KUD |
| WA Admin | Nomor WhatsApp untuk notifikasi |
| Waktu Lock | Jam penguncian setoran harian |
| Pesan WA | Template pesan notifikasi |
| Reminder WA | Pesan pengingat setoran |

### Simpan Perubahan
1. Ubah pengaturan
2. Klik **Simpan**
3. Perubahan langsung berlaku

---

<a name="qr-card"></a>
## QR Card

### Generate QR Card
1. Klik menu **QR Card**
2. Pilih anggota dari dropdown
3. QR Code akan digenerate otomatis

### Print QR Card
1. Pilih anggota
2. Klik **Print**
3. Akan terbuka dialog print browser
4. Pilih printer dan klik Print

### Isi QR Card
- Nama anggota
- Nomor anggota
- QR Code (mengandung link portal unik)
- Link portal bisa dicopy manual

---

# Panduan Anggota

<a name="akses-portal"></a>
## Akses Portal

### Via QR Code
1. Buka aplikasi kamera HP
2. Scan QR Code yang tertera di kartu anggota
3. Browser akan membuka link portal

### Via Link
1. Buka link portal yang diberikan admin
2. Link format: `https://[domain]/portal/[token]`

---

<a name="login-dengan-pin"></a>
## Login dengan PIN

### Cara Login
1. Setelah membuka link portal, masukkan **6-digit PIN**
2. Klik tombol **Masuk**
3. Jika PIN benar, Anda akan masuk ke dashboard

### Lupa PIN
Hubungi admin untuk reset PIN.

> 🔐 **Keamanan:** PIN bersifat rahasia. Jangan bagikan PIN kepada siapapun.

---

<a name="dashboard-anggota"></a>
## Dashboard Anggota

### Informasi di Dashboard
- **Status Hari Ini:** Sudah setor atau belum
- **Total Setoran:** Jumlah total bulan ini
- **Ringkasan:** Statistik setoran berdasarkan filter

### Filter Waktu
Pilih periode查看数据:
- **Hari ini:** Setoran hari ini saja
- **Minggu Ini:** Setoran minggu ini
- **Bulan Ini:** Semua setoran bulan berjalan

### Tab Produk
Lihat breakdown setoran berdasarkan produk yang ди setorkan.

---

<a name="riwayat-setoran"></a>
## Riwayat Setoran

### Lihat Riwayat
1. Pilih **Bulan** dan **Tahun**
2. Klik **Terapkan**
3. Daftar setoran ditampilkan

### Informasi per Setoran
- **Tanggal:** Tanggal setoran
- **Produk:** Jenis produk yang ди setorkan
- **Jumlah:** Volume setoran
- **Grade:** Grade A atau B
- **Status:** Setor/Libur

---

<a name="download-pdf"></a>
## Download PDF

### Download Riwayat Bulanan
1. Pilih bulan yang ingin di-download
2. Klik tombol **Download PDF**
3. File PDF akan ter-download otomatis

### Isi PDF
- Header KUD Transparansi
- Nama dan nomor anggota
- Tabel riwayat setoran:
  - Tanggal
  - Produk
  - Jumlah
  - Grade
  - Status
- Tanggal cetak

---

<a name="logout"></a>
## Logout

### Cara Logout
1. Klik menu **Profil** di bagian bawah
2. Klik tombol **Logout**
3. Anda akan keluar dari portal

> ⏱️ **Sesi:** Sesi portal berlaku selama 7 hari. Setelah itu, perlu login ulang dengan PIN.

---

## Tips & Troubleshooting

### Admin

| Masalah | Solusi |
|---------|--------|
| Tidak bisa save setoran | Pastikan jam masih dalam periode unlocked |
| WA tidak terkirim | Cek konfigurasi API Fonnte di Pengaturan |
| QR tidak muncul | Refresh halaman atau clear cache browser |

### Anggota

| Masalah | Solusi |
|---------|--------|
| PIN tidakAccepted | Pastikan memasukkan 6 digit dengan benar |
| Data tidak muncul | Pilih bulan yang benar |
| PDF tidak ter-download | Pastikan pop-up tidak diblokir browser |

---

## Kontak Bantuan

Untuk masalah teknis, hubungi:
- **Admin:** Melalui WhatsApp atau datang langsung ke kantor KUD
- **Teknis:** support@pytagotech.com

---

*Dokumen ini terakhir diperbarui: Juli 2026*
