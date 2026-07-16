# Pertanyaan Umum (FAQ) - KUD Transparansi

---

## Pertanyaan Admin

### Q: Bagaimana cara input setoran untuk banyak anggota sekaligus?
**A:** Gunakan mode **Bulk** di menu Setoran:
1. Buka menu Setoran
2. Semua anggota aktif ditampilkan dalam satu tabel
3. Masukkan qty dan grade untuk setiap anggota
4. Klik "Simpan Semua"

---

### Q: Jam berapa setoran harian terkunci?
**A:** Default terkunci pukul 20:00 (8 malam). Jam ini bisa diubah di menu **Pengaturan**.

---

### Q: Apakah bisa edit setoran setelah terkunci?
**A:** Bisa, tapi perlu:
1. Akses level **Ketua**
2. Wajib isi alasan edit
3. Semua perubahan tercatat di **Audit Log**

---

### Q: Kenapa notifikasi WA tidak terkirim?
**A:** Periksa:
1. **Token Fonnte** sudah di-set di `.env`
2. **Nomor WA Admin** sudah diisi di Pengaturan
3. Nomor anggota valid dan benar
4. Koneksi internet stabil

---

### Q: Bagaimana cara generate QR Card untuk anggota?
**A:** 
1. Menu **QR Card**
2. Pilih anggota dari dropdown
3. QR Code otomatis generate
4. Klik **Print** untuk mencetak

---

### Q: Berapa lama session admin berlaku?
**A:** Session admin berlaku hingga logout atau browser ditutup.

---

### Q: Bagaimana cara reset password anggota?
**A:** Anggota tidak memiliki password. Mereka login dengan **6-digit PIN**. Hubungi admin untuk reset PIN.

---

### Q: Apakah bisa export laporan ke PDF?
**A:** Ya! Di menu **Laporan**:
1. Pilih bulan dan produk
2. Klik **Export PDF** atau **Export CSV**

---

### Q: Bagaimana workflow settlement?
**A:** 
```
Menunggu → Parsial → Lunas
```
- **Menunggu:** Belum ada pembayaran
- **Parsial:** Sudah bayar sebagian
- **Lunas:** Sisa = 0

---

### Q: Stok apa saja yang di-track?
**A:** Sistem mendukung tracking:
- Produk segar (susu, sayur, buah)
- Produk dengan masa simpan (shelf life)
- Alert otomatis saat hampir expired

---

## Pertanyaan Anggota

### Q: Bagaimana cara akses portal setoran saya?
**A:** 
1. **Scan QR Code** di kartu anggota
2. Atau buka **link portal** yang diberikan admin
3. Masukkan **6-digit PIN**
4. Klik **Masuk**

---

### Q: PIN saya tidak bisa login, kenapa?
**A:** Periksa:
1. Sudah masukkan 6 digit dengan benar?
2. Tidak ada spasi atau karakter tambahan?
3. Pastikan keyboard numpad aktif

---

### Q: Saya lupa PIN, apa yang harus dilakukan?
**A:** Hubungi **admin KUD** untuk reset PIN. PIN baru akan diberikan.

---

### Q: Apakah saya bisa edit setoran saya sendiri?
**A:** **Tidak.** Portal anggota bersifat **read-only**. Hanya admin yang bisa input/edit setoran. Jika ada kesalahan, hubungi admin.

---

### Q: Kenapa data setoran saya tidak muncul?
**A:** Periksa:
1. Sudah pilih **bulan yang benar**?
2. Filter waktu sudah sesuai?
3. Apakah setoran sudah diinput oleh admin?

---

### Q: Bagaimana cara download riwayat setoran?
**A:**
1. Login ke portal
2. Pilih **bulan** yang diinginkan
3. Klik tombol **Download PDF**
4. File PDF akan ter-download otomatis

---

### Q: Berapa lama session portal berlaku?
**A:** Session portal berlaku selama **7 hari**. Setelah itu perlu login ulang dengan PIN.

---

### Q: Apakah saya bisa login di banyak HP?
**A:** Ya, portal bisa diakses dari device manapun. Session tidak terbatas pada satu device.

---

### Q: Kenapa ada tanggal "Libur" di riwayat saya?
**A:** "Libur" berarti pada tanggal tersebut Anda tidak menyetor. Data tetap ditampilkan agar histori lengkap.

---

### Q: Data setoran saya salah, bagaimana cara perbaikan?
**A:** Hubungi admin KUD. Admin akan memperbaiki dan perubahan akan tercatat di sistem.

---

### Q: Apakah saya bisa lihat setoran bulan lalu?
**A:** Ya! Gunakan **selector bulan** di portal:
1. Klik pada dropdown bulan
2. Pilih bulan dan tahun yang diinginkan
3. Data akan tampil sesuai periode

---

## Pertanyaan Teknis

### Q: Browser apa yang didukung?
**A:** Sistem mendukung:
- Google Chrome (direkomendasikan)
- Mozilla Firefox
- Microsoft Edge
- Safari

---

### Q: Apakah bisa diakses dari HP?
**A:** Ya! Portal anggota dirancang **mobile-first** dan responsif.

---

### Q: Apakah ada aplikasi mobile?
**A:** Saat ini belum ada aplikasi mobile. Akses melalui **browser** (Chrome, dll).

---

### Q: Kenapa halaman lambat loading?
**A:** Kemungkinan penyebab:
1. Koneksi internet lemah
2. Banyak data yang dimuat
3. Server sedang sibuk

Solusi: Refresh halaman atau coba lagi beberapa saat.

---

### Q: Apakah data aman?
**A:** Ya! Sistem menggunakan:
- Enkripsi data
- Akses berbasis role (admin/ketua)
- Session management
- Audit log untuk traceability

---

*Dokumen ini terakhir diperbarui: Juli 2026*
