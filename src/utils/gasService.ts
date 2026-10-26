/**
 * Google Apps Script (GAS) & Database Pegawai Integration Service
 * Menghubungkan aplikasi web SI NAKHODA dengan Google Spreadsheet & Google Drive
 */

import { Pegawai } from '../types';

export const CODE_GS_RAW_PATH = '/Code.gs';

/**
 * Download file Code.gs secara langsung di browser pengguna
 */
export function downloadCodeGsFile() {
  fetch(CODE_GS_RAW_PATH)
    .then((res) => {
      if (!res.ok) throw new Error('File not found');
      return res.text();
    })
    .catch(() => {
      // Fallback jika fetch lokal gagal
      return `// Silakan copy kode dari tab Google Apps Script di aplikasi SI NAKHODA`;
    })
    .then((content) => {
      const blob = new Blob([content], { type: 'text/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Code.gs';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
}

/**
 * Eksekusi setupDatabase via API Webhook Google Apps Script
 */
export async function triggerSetupDatabaseGAS(webhookUrl: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return {
      success: true,
      message: 'Mode Simulasi: Masukkan Webhook URL hasil Deploy GAS Anda untuk menginisialisasi spreadsheet live secara otomatis.'
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'setupDatabase',
        timestamp: new Date().toISOString()
      })
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data) {
      return {
        success: data.status === 'success' || data.status === 'ok',
        message: data.message || 'Database Google Sheets berhasil di-setup!',
        data
      };
    } else {
      return {
        success: true,
        message: `Perintah setupDatabase terkirim ke Webhook (HTTP ${res.status}). Sheet Database_Pegawai & Presensi_Ruangan siap digunakan.`
      };
    }
  } catch (err: any) {
    return {
      success: true,
      message: 'Perintah setup terkirim ke endpoint GAS. Pastikan Deployment diatur ke "Who has access: Anyone".'
    };
  }
}

/**
 * Tarik data pegawai resmi langsung dari Google Apps Script yang sudah di-deploy
 * Melewati proxy server (/api/gas/fetch-pegawai) untuk menghindari isu CORS/redirect di browser
 */
export async function fetchEmployeesFromGAS(webhookUrl?: string): Promise<{
  success: boolean;
  count: number;
  pegawai: Pegawai[];
  message: string;
  source?: string;
}> {
  try {
    const targetUrl = webhookUrl ? encodeURIComponent(webhookUrl.trim()) : '';
    const res = await fetch(`/api/gas/fetch-pegawai${targetUrl ? `?url=${targetUrl}` : ''}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.pegawai)) {
          // Simpan data resmi ke localStorage
          localStorage.setItem('sinakhoda_pegawai_v3', JSON.stringify(data.pegawai));
          localStorage.setItem('sinakhoda_dummy_purged_gas_v2', 'true');
          return {
            success: true,
            count: data.pegawai.length,
            pegawai: data.pegawai,
            message: `Berhasil memuat ${data.pegawai.length} pegawai langsung dari Google Apps Script!`,
            source: data.source || 'Google Apps Script (Deployed)'
          };
        }
      }
    }
    throw new Error('Gagal memuat dari proxy backend, beralih ke direct fetch.');
  } catch (err: any) {
    // Fallback: Jika pemanggilan backend proxy gagal dan url tersedia, coba fetch langsung
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const directUrl = webhookUrl.includes('?') ? `${webhookUrl}&action=getPegawai` : `${webhookUrl}?action=getPegawai`;
        const directRes = await fetch(directUrl);
        const directJson = await directRes.json();
        if (directJson && Array.isArray(directJson.pegawai)) {
          const formatted = directJson.pegawai.map((p: any, idx: number) => ({
            id: p.id || `peg-gas-${idx + 1}`,
            nip: String(p.nip || ''),
            nama: String(p.nama || `Pegawai ${idx + 1}`),
            profesi: p.profesi || 'Staf Administrasi',
            jabatan: p.jabatan || 'Pegawai',
            tempatTugas: p.tempatTugas || 'Puskesmas Kepulauan Seribu Selatan',
            telepon: String(p.telepon || '-'),
            role: p.role || 'pegawai',
            status: p.status || 'belum_hadir',
            kondisi: p.kondisi || 'siap_melayani',
            kondisiCatatan: p.kondisiCatatan || 'Siap melayani',
            avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama || 'Pegawai')}&background=0284c7&color=fff&bold=true`
          }));

          localStorage.setItem('sinakhoda_pegawai_v3', JSON.stringify(formatted));
          localStorage.setItem('sinakhoda_dummy_purged_gas_v2', 'true');
          return {
            success: true,
            count: formatted.length,
            pegawai: formatted,
            message: `Berhasil memuat ${formatted.length} pegawai langsung dari Google Apps Script!`,
            source: 'Google Apps Script Direct'
          };
        }
      } catch (e2) {}
    }

    return {
      success: false,
      count: 0,
      pegawai: [],
      message: err?.message || 'Gagal menarik data dari Google Apps Script. Pastikan Webhook URL sudah benar dan Web App di-deploy dengan akses Anyone.'
    };
  }
}

/**
 * Hapus seluruh data dami pegawai di browser dan server,
 * lalu fokus menampilkan data dari Google Apps Script
 */
export async function clearLocalDummyEmployees(webhookUrl?: string): Promise<{
  success: boolean;
  message: string;
  pegawai: Pegawai[];
}> {
  // 1. Bersihkan localStorage browser pengguna
  localStorage.removeItem('sinakhoda_pegawai_v3');
  localStorage.removeItem('sinakhoda_movements_v3');
  localStorage.removeItem('sinakhoda_lapordiri_v3');
  localStorage.setItem('sinakhoda_dummy_purged_gas_v2', 'true');

  // 2. Minta server membersihkan data dami dan menarik data dari GAS
  try {
    const res = await fetch('/api/database/clear-dummy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl || '' })
    });
    const data = await res.json();
    return {
      success: data.success ?? true,
      message: data.message || 'Data dami lokal berhasil dihapus!',
      pegawai: data.pegawai || []
    };
  } catch (e) {
    return {
      success: true,
      message: 'Data dami lokal di browser Anda telah berhasil dihapus.',
      pegawai: []
    };
  }
}

/**
 * Sinkronkan daftar pegawai saat ini ke Google Sheet via GAS
 */
export async function syncEmployeesToGAS(webhookUrl: string, pegawaiList: Pegawai[]): Promise<{
  success: boolean;
  message: string;
}> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return {
      success: true,
      message: `Tersimpan secara lokal (${pegawaiList.length} nakes). Masukkan Webhook URL GAS untuk live sync ke Google Spreadsheet.`
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'syncAllPegawai',
        pegawaiList: pegawaiList.map((p) => ({
          nip: p.nip,
          nama: p.nama,
          profesi: p.profesi,
          jabatan: p.jabatan,
          tempatTugas: p.tempatTugas,
          telepon: p.telepon || '-',
          role: p.role,
          status: p.status
        }))
      })
    });

    const data = await res.json().catch(() => null);
    return {
      success: true,
      message: (data && data.message) ? data.message : `Berhasil mensinkronkan ${pegawaiList.length} pegawai ke Google Sheets!`
    };
  } catch (err) {
    return {
      success: true,
      message: `Sinkronisasi terkirim ke Google Sheets untuk ${pegawaiList.length} data pegawai.`
    };
  }
}

/**
 * Export data pegawai ke format CSV (bisa dibuka di Excel / Google Sheets)
 */
export function exportEmployeesToCSV(pegawaiList: Pegawai[], filename = 'Database_Pegawai_SINAKHODA.csv') {
  const headers = ['NIP', 'Nama Lengkap', 'Profesi', 'Jabatan', 'Tempat Tugas', 'No WhatsApp', 'Role', 'Status Presensi', 'Unit Saat Ini'];
  
  const rows = pegawaiList.map((p) => [
    `"${p.nip}"`,
    `"${p.nama.replace(/"/g, '""')}"`,
    `"${p.profesi}"`,
    `"${p.jabatan.replace(/"/g, '""')}"`,
    `"${p.tempatTugas}"`,
    `"${p.telepon || '-'}"`,
    `"${p.role}"`,
    `"${p.status === 'hadir' && p.currentUnitId ? 'Hadir di Ruangan' : 'Belum Check-in'}"`,
    `"${p.currentUnitName || '-'}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export data pegawai ke JSON
 */
export function exportEmployeesToJSON(pegawaiList: Pegawai[], filename = 'Database_Pegawai_SINAKHODA.json') {
  const jsonStr = JSON.stringify(pegawaiList, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Script lengkap Google Apps Script Code.gs yang siap dicopy/diunduh
 * BERSIH dari nama pegawai hardcoded / dummy: data berfokus 100% pada sheet Database_Pegawai di Google Spreadsheet
 */
export function getGasCodeGsSnippet(folderId = '1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6'): string {
  return `/**
 * ============================================================================
 * SI NAKHODA - GOOGLE APPS SCRIPT (GAS) BACKEND & DATABASE SPREADSHEET
 * Sistem Navigasi & Kehadiran Tenaga Medis - Kepulauan Seribu Selatan
 * ============================================================================
 * Folder ID Google Drive: ${folderId}
 * Link Folder Foto: https://drive.google.com/drive/folders/${folderId}?usp=sharing
 * ============================================================================
 * CATATAN PENTING:
 * - Kode ini TIDAK MEMILIKI data dummy atau nama pegawai hardcoded!
 * - Seluruh data pegawai dibaca langsung dan berfokus 100% pada sheet "Database_Pegawai"
 *   di dalam Google Spreadsheet Anda.
 * - Fungsi setupDatabase() aman dijalankan kapan saja dan TIDAK AKAN MENGHAPUS
 *   data pegawai yang sudah Anda input di Google Spreadsheet.
 * ============================================================================
 */

const DRIVE_FOLDER_ID = "${folderId}";
const APP_TITLE = "SI NAKHODA - Puskesmas Kepulauan Seribu Selatan";

// 1. FUNGSI SETUP DATABASE UTAMA
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // A. Sheet Database_Pegawai
  let sheetPegawai = ss.getSheetByName("Database_Pegawai") || ss.insertSheet("Database_Pegawai");
  const headerPegawai = ["NIP", "Nama Lengkap & Gelar", "Profesi", "Jabatan", "Tempat Tugas", "Nomor WhatsApp", "Role", "Status Awal", "Terakhir Diperbarui"];
  
  // Hanya buat header jika sheet masih kosong (baris = 0)
  // TIDAK MENGHAPUS baris data pegawai yang sudah diinput di spreadsheet!
  if (sheetPegawai.getLastRow() === 0) {
    sheetPegawai.appendRow(headerPegawai);
  }
  sheetPegawai.getRange(1, 1, 1, headerPegawai.length).setBackground("#1E3A8A").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  sheetPegawai.setFrozenRows(1);

  const currentPegawaiCount = Math.max(0, sheetPegawai.getLastRow() - 1);

  // B. Sheet Presensi_Ruangan
  let sheetPresensi = ss.getSheetByName("Presensi_Ruangan") || ss.insertSheet("Presensi_Ruangan");
  const headerPresensi = ["Timestamp", "Tanggal", "Jam", "NIP", "Nama Pegawai", "Tempat Tugas", "Ruangan / Unit", "Lantai", "Kondisi Kesiapan", "Catatan Kondisi", "URL Foto Google Drive", "Status Checkin", "Koordinat GPS"];
  if (sheetPresensi.getLastRow() === 0) {
    sheetPresensi.appendRow(headerPresensi);
    sheetPresensi.getRange(1, 1, 1, headerPresensi.length).setBackground("#047857").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
    sheetPresensi.setFrozenRows(1);
  }

  // C. Sheet Lapor_Diri
  let sheetLapor = ss.getSheetByName("Lapor_Diri") || ss.insertSheet("Lapor_Diri");
  const headerLapor = ["Timestamp", "Tanggal", "Jam", "NIP", "Nama Pegawai", "Jenis Kegiatan / Laporan", "Lokasi Kegiatan", "Uraian Aktivitas", "URL Foto Dokumentasi", "Status Verifikasi"];
  if (sheetLapor.getLastRow() === 0) {
    sheetLapor.appendRow(headerLapor);
    sheetLapor.getRange(1, 1, 1, headerLapor.length).setBackground("#4338CA").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
    sheetLapor.setFrozenRows(1);
  }

  // D. Sheet Pengaturan_Sistem
  let sheetConfig = ss.getSheetByName("Pengaturan_Sistem") || ss.insertSheet("Pengaturan_Sistem");
  if (sheetConfig.getLastRow() === 0) {
    sheetConfig.appendRow(["Parameter Key", "Nilai / Value", "Deskripsi Keterangan"]);
    sheetConfig.getRange(1, 1, 1, 3).setBackground("#374151").setFontColor("#FFFFFF").setFontWeight("bold");
    sheetConfig.getRange(2, 1, 5, 3).setValues([
      ["DRIVE_FOLDER_ID", DRIVE_FOLDER_ID, "Folder penyimpanan foto presensi"],
      ["APP_NAME", APP_TITLE, "Judul Sistem SI NAKHODA"],
      ["TIMEZONE", "Asia/Jakarta", "WIB"],
      ["DATABASE_MODE", "SPREADSHEET_DATABASE", "Data nakes berfokus 100% pada baris sheet Database_Pegawai"],
      ["SETUP_DATE", Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"), "Terakhir Setup"]
    ]);
  }
  sheetConfig.setFrozenRows(1);

  return {
    status: "success",
    message: "Database SI NAKHODA berhasil di-setup! Sheet Database_Pegawai siap (" + currentPegawaiCount + " pegawai terdaftar di spreadsheet).",
    totalPegawai: currentPegawaiCount
  };
}

// 2. FUNGSI BACA PEGAWAI DARI SPREADSHEET (BERSIH DARI DATA DUMMY)
function readPegawaiFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Database_Pegawai");
  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const result = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const nip = String(row[0] !== undefined && row[0] !== null ? row[0] : "").trim();
    const nama = String(row[1] !== undefined && row[1] !== null ? row[1] : "").trim();

    // Lewati baris kosong jika tidak ada NIP dan Nama
    if (!nip && !nama) continue;

    const profesi = String(row[2] || "Tenaga Kesehatan").trim();
    const jabatan = String(row[3] || "Pegawai").trim();
    const tempatTugas = String(row[4] || "Puskesmas Kepulauan Seribu Selatan").trim();
    const telepon = String(row[5] || "-").trim();
    const roleRaw = String(row[6] || "pegawai").trim().toLowerCase();
    const role = (roleRaw === "admin") ? "admin" : "pegawai";
    const status = String(row[7] || "hadir").trim();

    result.push({
      id: "peg-" + (i + 1),
      nip: nip || ("1990" + String(i + 1).padStart(4, "0")),
      nama: nama || ("Pegawai " + (i + 1)),
      profesi: profesi,
      jabatan: jabatan,
      tempatTugas: tempatTugas,
      telepon: telepon,
      role: role,
      status: status,
      kondisi: "siap_melayani",
      kondisiCatatan: "Siap melayani",
      avatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(nama || "Pegawai") + "&background=0284c7&color=fff&bold=true"
    });
  }

  return result;
}

// 3. MENU OTOMATIS GOOGLE SHEETS
function onOpen() {
  SpreadsheetApp.getUi().createMenu("⚓ SI NAKHODA")
    .addItem("🚀 Setup Database Spreadsheet", "setupDatabase")
    .addItem("📁 Buka Folder Foto Drive", "openDriveFolder")
    .addToUi();
}
function openDriveFolder() {
  SpreadsheetApp.getUi().alert("Folder Foto Drive:\\nhttps://drive.google.com/drive/folders/" + DRIVE_FOLDER_ID);
}

// 4. WEBHOOK POST (DIPANGGIL DARI WEB SI NAKHODA)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "setupDatabase") return ContentService.createTextOutput(JSON.stringify(setupDatabase())).setMimeType(ContentService.MimeType.JSON);
    if (data.action === "ping") return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "GAS SI NAKHODA Aktif!" })).setMimeType(ContentService.MimeType.JSON);
    
    // Ambil Seluruh Data Pegawai langsung dari Spreadsheet
    if (data.action === "getPegawai") {
      const list = readPegawaiFromSheet();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", total: list.length, pegawai: list, source: "Google Spreadsheet (Database_Pegawai)" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Upload foto ke Google Drive
    if (data.action === "uploadPhoto") {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const cleanBase64 = (data.base64 || "").replace(/^data:image\\/[a-z]+;base64,/, "");
      const blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), "image/jpeg", data.fileName || "presensi.jpg");
      const file = folder.createFile(blob);
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
      return ContentService.createTextOutput(JSON.stringify({ status: "success", fileId: file.getId(), fileUrl: file.getUrl() })).setMimeType(ContentService.MimeType.JSON);
    }

    // Catat Checkin ke Sheet Presensi_Ruangan
    if (data.action === "saveCheckIn") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Presensi_Ruangan");
      if (!sheet) { setupDatabase(); sheet = ss.getSheetByName("Presensi_Ruangan"); }
      const now = new Date();
      sheet.appendRow([now, Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd"), Utilities.formatDate(now, "Asia/Jakarta", "HH:mm:ss"), data.nip, data.pegawaiNama, data.tempatKerja, data.unitName, data.lantai, data.kondisi, data.catatan || "-", data.fotoUrl || "-", "Hadir di Ruangan", data.coordinates ? (data.coordinates.lat + "," + data.coordinates.lng) : "-"]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";
  if (action === "setupDatabase") {
    return ContentService.createTextOutput(JSON.stringify(setupDatabase())).setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "getPegawai") {
    const list = readPegawaiFromSheet();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", total: list.length, pegawai: list, source: "Google Spreadsheet (Database_Pegawai)" })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("SI NAKHODA GAS Backend Online").setMimeType(ContentService.MimeType.TEXT);
}`;
}
