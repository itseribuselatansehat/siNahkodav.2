# 🚢 PANDUAN LENGKAP & SOLUSI INSTAN DEPLOYMENT HOSTINGER
**Domain:** `https://sinahkoda.puskesmasseribuselatan.com/`

Aplikasi **SI NAKHODA** telah siap 100% untuk sinkronisasi GitHub dan deploy langsung di **Hostinger**.

---

## 🔍 PENYEBAB & PERBAIKAN TAMPILAN "MEMUAT SISTEM..." (SELESAI)

### 1. Masalah Tersangkut di Splash Screen "Memuat Sistem Navigasi & Posisi Pegawai..."
- **Penyebab**: Script dinamis di versi sebelumnya memicu pengecekan CORS/MIME type oleh server web LiteSpeed Hostinger dan aturan rewrite `.htaccess` yang sempat memantulkan file `.js` kembali ke `index.html`.
- **Perbaikan yang Diterapkan**:
  1. `dist/index.html` kini menggunakan **Static Production Bundle** murni (`<script type="module" crossorigin src="./assets/app.js"></script>` dan `<link rel="stylesheet" crossorigin href="./assets/app.css">`) tanpa injeksi JavaScript dinamis.
  2. File `.htaccess` diperbarui dengan aturan `RewriteCond %{REQUEST_FILENAME} -f [OR] RewriteCond %{REQUEST_FILENAME} -d -> RewriteRule ^ - [L]`, sehingga file fisik JavaScript, CSS, dan PHP langsung disajikan oleh server tanpa interupsi rewrite.
  3. Header CORS `Access-Control-Allow-Origin: *` dan MIME type `application/javascript` diaktifkan secara global di `.htaccess`.

### 2. Penghapusan Seluruh Akun Demo & Perlindungan Login
- **Demo Akun Dihapus**: NIP demo `12345` / `123456` telah dihapus sepenuhnya dari sistem dan database.
- **Kredensial Resmi Pengelola**:
  - **NIP / Username Pengelola**: `198911` (atau `admin`)
  - **Kata Sandi**: `admin`
- Tidak ada lagi petunjuk / bocoran sandi demo di seluruh antarmuka aplikasi.
- NIP yang tidak terdaftar di database GAS kini ditolak dengan pesan error yang jelas.

### 3. Tombol Simpan Pengaturan GAS Global (Semua Browser)
- Di menu **Pengaturan & Integrasi (GAS)**, telah disediakan tombol utama:
  **`💾 SIMPAN PENGATURAN GAS & DRIVE (Semua Browser)`**
- Ketika tombol ini ditekan:
  1. URL Webhook GAS, URL Spreadsheet, dan Google Drive Folder ID (`1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6`) disimpan langsung ke server Hostinger (`api/system-config.php`).
  2. Seluruh browser dan perangkat pegawai (Android, iPhone, Chrome PC) otomatis terhubung ke konfigurasi yang sama tanpa perlu koneksi ulang.
  3. Sistem langsung menarik dan menyinkronkan seluruh daftar pegawai resmi dari Google Apps Script Spreadsheet.

### 4. Auto-Refresh Realtime Tiap 3 Detik
- Selama web aplikasi aktif, sistem mengeksekusi heartbeat sinkronisasi setiap **3 detik** (`/api/database.php` & background GAS pull) agar posisi nakes, keterisian ruangan, dan lapor kegiatan selalu terupdate otomatis.

---

## 🚀 LANGKAH DEPLOYMENT KE HOSTINGER (HANYA 2 LANGKAH):

### Langkah 1: Sinkronkan ke GitHub
1. Klik tombol **Sync to GitHub** di AI Studio untuk mengirimkan commit terbaru ke repository GitHub Anda.
2. File yang otomatis ter-update dan siap saji di repository:
   - `dist/index.html` (Bundel produksi bersih)
   - `dist/assets/app.js` & `dist/assets/app.css`
   - `assets/app.js` & `assets/app.css`
   - `.htaccess` (Konfigurasi LiteSpeed anti-loop & CORS)
   - `api/system-config.php` & `api/database.php` (Bridge shared hosting)
   - `Code.gs` (Google Apps Script terbaru)

### Langkah 2: Deploy / Pull di Hostinger
1. Masuk ke **hPanel Hostinger** (`hpanel.hostinger.com`).
2. Masuk ke menu **Git** pada domain `sinahkoda.puskesmasseribuselatan.com`.
3. Klik tombol **Deploy** atau **Pull** pada branch `main`.
4. Selesai! Hostinger akan memperbarui seluruh file web Anda secara instan.

### Langkah 3: Buka & Bersihkan Cache Browser
1. Akses `https://sinahkoda.puskesmasseribuselatan.com/` (atau `https://sinahkoda.puskesmasseribuselatan.com/dist/`).
2. Tekan **`Ctrl + F5`** (Windows) atau **`Cmd + Shift + R`** (Mac) untuk membuang file cache lama di browser.
3. Halaman pembuka SI NAKHODA dengan tombol **"LAPOR Si Nahkoda"** akan langsung tampil sempurna!
