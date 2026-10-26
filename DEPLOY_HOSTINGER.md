# 🚢 PANDUAN LENGKAP & SOLUSI INSTAN DEPLOYMENT HOSTINGER
**Domain:** `https://sinahkoda.puskesmasseribuselatan.com/`

Dokumen ini memberikan solusi langsung agar aplikasi **SI NAKHODA** tampil sempurna saat disinkronisasi dari **GitHub ke Hostinger**.

---

## 🔍 PENYEBAB MASALAH DI HOSTINGER

Ketika Anda melakukan sinkronisasi Git di Hostinger:
1. Hostinger Git menarik isi repository GitHub langsung ke folder `public_html/`.
2. Di web hosting Hostinger biasa, server **TIDAK menjalankan Node.js atau perintah `npm run build`**.
3. Sebelumnya, file `index.html` memanggil file mentah TypeScript `/src/main.tsx`. Browser tidak dapat menjalankan TypeScript sehingga muncul tulisan *"Memuat Sistem Navigasi & Posisi Pegawai..."* tanpa memunculkan aplikasi.

---

## 🛠️ APA YANG TELAH KAMI LAKUKAN (SOLUSI UNIVERSAL AUTO-DEPLOY):

1. **Memasukkan Bundle Produksi Langsung ke Root (`/assets/app.js` & `/assets/app.css`):**
   - Kami telah mengkompilasi aplikasi ke file JavaScript murni (`assets/app.js`) dan CSS murni (`assets/app.css`) serta menyimpannya langsung di folder `/assets/` repository.
   - File ini akan otomatis ikut ter-push ke GitHub dan ditarik oleh Hostinger Git.
2. **Universal Smart Loader di `index.html`:**
   - File `index.html` kini memiliki detektor cerdas:
     - Jika dibuka di lingkungan dev AI Studio: menjalankan mode development.
     - Jika dibuka di domain resmi **`sinahkoda.puskesmasseribuselatan.com`**: otomatis langsung mengeksekusi file JavaScript produksi `./assets/app.js` dan CSS `./assets/app.css`.
3. **MIME Types & Routing SPA di `.htaccess`:**
   - Memastikan server Hostinger LiteSpeed menyajikan file `.js` dengan tipe `application/javascript` dan rute SPA tidak menghasilkan 404.

---

## 🚀 LANGKAH SINKRONISASI KE GITHUB & HOSTINGER:

### Langkah 1: Sinkronkan Perubahan ke GitHub
- Tekan tombol **Sync to GitHub** / **Export** di AI Studio untuk memperbarui repository GitHub Anda.
- Repository GitHub kini telah berisi:
  - `index.html` (dengan Smart Loader)
  - folder `assets/` (berisi file `app.js`, `app.css`, dll)
  - file `.htaccess`

### Langkah 2: Tarik di Hostinger Git
1. Masuk ke **hPanel Hostinger** (`hpanel.hostinger.com`).
2. Masuk ke menu **Git** (di bawah menu *Advanced*).
3. Klik tombol **Deploy** / **Pull** pada repository Anda.
4. Hostinger akan otomatis menyalin `index.html` dan folder `assets/` ke `public_html/`.

### Langkah 3: Buka Website Anda
1. Buka `https://sinahkoda.puskesmasseribuselatan.com/`.
2. Tekan `Ctrl + F5` (atau `Cmd + Shift + R` di Mac) untuk membersihkan cache browser lama.
3. **Aplikasi SI NAKHODA langsung tampil sempurna!**

---

## 🌐 MENGHUBUNGKAN GOOGLE APPS SCRIPT (GAS)
Setelah halaman tampil:
1. Klik tombol **"LAPOR Si Nahkoda"**.
2. Klik tombol **Login Admin** (atau tekan shortcut `Ctrl + Shift + A`):
   - NIP: `12345`
   - Password: `admin`
3. Masuk ke tab **Integrasi Database** ➔ Masukkan URL Web App Google Apps Script Anda.
4. Klik **"Tarik Data Pegawai dari Spreadsheet"** ➔ Data langsung tersinkronisasi realtime!
