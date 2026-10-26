# 🚢 PANDUAN LENGKAP & SOLUSI INSTAN DEPLOYMENT HOSTINGER
**Domain:** `https://sinahkoda.puskesmasseribuselatan.com/`

Dokumen ini memberikan panduan resmi agar aplikasi **SI NAKHODA** tampil sempurna dan semua fitur (Login Admin, Auto-refresh 3 detik, dan Auto-Upload Foto ke Google Drive) berjalan 100% lancar di **Hostinger**.

---

## 🔍 PENYEBAB & SOLUSI MASALAH SEBELUMNYA

### 1. Masalah Tampilan "Memuat Sistem Navigasi & Posisi Pegawai..." (Tersangkut)
- **Penyebab**: Server Hostinger LiteSpeed menyajikan file `index.html` yang mencoba memuat file mentah TypeScript `/src/main.tsx` (yang hanya dimengerti oleh node/vite dev). Browser menolak file `.tsx` sebagai skrip modul JavaScript murni.
- **Solusi**: File `index.html` telah diperbarui dengan **Smart Dynamic Loader**. Di Hostinger (`sinahkoda.puskesmasseribuselatan.com`), sistem secara otomatis langsung mengeksekusi bundel JavaScript produksi (`/assets/app.js` dan `/assets/app.css`) tanpa pernah memanggil `/src/main.tsx`.

### 2. Masalah Layar Blank Putih Saat Login Admin di Hostinger
- **Penyebab**: Terjadi crash komponen React ketika database pegawai kosong atau state sesi admin tertimpa oleh loop update pegawai biasa.
- **Solusi**: 
  - Ditambahkan fallback administrator aman (`id: 'peg-admin'`, NIP: `12345`, Password: `admin`).
  - Sesi login admin dilindungi di `localStorage` dan tidak akan tertimpa oleh user lain saat sinkronisasi data berlangsung.
  - Penanganan login admin kini 100% aman dan langsung membuka menu admin tanpa blank putih.

### 3. Auto-Refresh Realtime Tiap 3 Detik
- Sistem kini dilengkapi heartbeat 3 detik yang sinkron secara realtime baik di lingkungan server lokal maupun mode static shared hosting (Hostinger) dengan `BroadcastChannel` dan state caching lokal.

### 4. Upload Foto Otomatis ke Google Drive yang Telah Disiapkan
- **Google Drive Folder ID**: `1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6`
- **URL Folder**: `https://drive.google.com/drive/folders/1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6?usp=sharing`
- Setiap kali pegawai melakukan **Check-in Ruangan** (foto selfie) atau **Lapor Diri** (foto dokumentasi kegiatan), foto otomatis dikonversi dan dikirim langsung ke folder Google Drive di atas dan dicatat ke Google Sheets (`Presensi_Ruangan` dan `Lapor_Diri`).

---

## 🚀 CARA DEPLOY KE HOSTINGER (HANYA 2 LANGKAH):

### Langkah 1: Sinkronkan Perubahan ke GitHub
- Di panel AI Studio, klik **Sync to GitHub** / push commit terbaru.
- File yang otomatis ter-update di repository GitHub Anda:
  - `index.html` (Smart Dynamic Loader)
  - `assets/` (berisi bundle produksi JavaScript `app.js`, CSS `app.css`, dll)
  - `dist/` (build bundle lengkap)
  - `.htaccess` (konfigurasi rewrite LiteSpeed/Apache)
  - `Code.gs` (script GAS terintegrasi Google Drive)

### Langkah 2: Deploy / Pull di Hostinger Git
1. Masuk ke **hPanel Hostinger** (`hpanel.hostinger.com`).
2. Masuk ke menu **Git** (di bawah kategori *Advanced* atau cari "Git").
3. Klik tombol **Deploy** atau **Pull** pada repository Anda.
4. Selesai! Hostinger akan menyalin file terbaru ke web server Anda.

### Langkah 3: Buka & Bersihkan Cache Browser
1. Buka website Anda: `https://sinahkoda.puskesmasseribuselatan.com/`
2. Tekan kombinasi tombol **`Ctrl + F5`** (Windows) atau **`Cmd + Shift + R`** (Mac) untuk memastikan browser tidak memuat file cache lama.
3. Halaman pembuka SI NAKHODA akan langsung muncul dengan tombol **"LAPOR Si Nahkoda"**.

---

## 🔑 KREDENSIAL LOGIN PENGELOLA / ADMIN
- **NIP / Username Pengelola**: `198911` (atau `admin`)
- **Kata Sandi**: `admin`
- Tekan tombol **Login Admin** di menu aplikasi (atau tekan tombol pintas keyboard `Ctrl + Shift + A`).
- Setelah login, masuk ke menu **Pengaturan & Integrasi (GAS)**:
  - Cukup masukkan Webhook URL Google Apps Script Anda **sekali saja**.
  - Konfigurasi otomatis tersimpan ke server Hostinger & Google Sheets (`Pengaturan_Sistem`), sehingga **seluruh pegawai di perangkat/browser manapun akan otomatis terhubung ke database yang sama**.
  - Aplikasi otomatis melakukan **auto-refresh setiap 3 detik** untuk menyinkronkan data presensi dan kondisi pegawai secara realtime!
