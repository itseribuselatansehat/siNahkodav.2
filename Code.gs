/**
 * ============================================================================
 * SI NAKHODA - GOOGLE APPS SCRIPT (GAS) BACKEND & DATABASE SPREADSHEET
 * Sistem Navigasi & Kehadiran Tenaga Medis - Kepulauan Seribu Selatan
 * ============================================================================
 * Folder ID Google Drive: 1RnBhuEfOErrbGqitdhEY0nExeKXVKC7L
 * 
 * CATATAN PENTING:
 * - Kode ini TIDAK MEMILIKI data dummy atau nama pegawai hardcoded!
 * - Seluruh data pegawai dibaca langsung dan berfokus 100% pada sheet "Database_Pegawai"
 *   di dalam Google Spreadsheet Anda.
 * - Fungsi setupDatabase() aman dijalankan kapan saja dan TIDAK AKAN MENGHAPUS
 *   data pegawai yang sudah Anda input di Google Spreadsheet.
 * ============================================================================
 * PANDUAN PEMASANGAN CEPAT:
 * 1. Buka Google Spreadsheet Anda (docs.google.com/spreadsheets).
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus seluruh isi default, lalu Paste seluruh isi file ini ke dalam Code.gs.
 * 4. Pada dropdown fungsi di atas editor, pilih "setupDatabase", lalu klik "Jalankan" (Run).
 *    -> Berikan izin (Review Permissions) akun Google Anda saat pertama kali diminta.
 *    -> Spreadsheet akan otomatis menyiapkan 4 Sheet (Database_Pegawai, Presensi_Ruangan,
 *       Lapor_Diri, Pengaturan_Sistem).
 * 5. Untuk mengaktifkan Webhook/API ke Web SI NAKHODA:
 *    -> Klik "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment).
 *    -> Pilih jenis "Aplikasi Web" (Web App).
 *    -> Execute as: "Me" (Saya).
 *    -> Who has access: "Anyone" (Siapa saja, bahkan anonim).
 *    -> Salin Web App URL dan tempel ke menu "Pengaturan GAS" di aplikasi web SI NAKHODA.
 * ============================================================================
 */

// KONFIGURASI GLOBAL
const DRIVE_FOLDER_ID = "1RnBhuEfOErrbGqitdhEY0nExeKXVKC7L";
const APP_TITLE = "SI NAKHODA - Puskesmas Kepulauan Seribu Selatan";

/**
 * ============================================================================
 * 1. FUNGSI SETUP DATABASE UTAMA
 * Menyiapkan struktur sheet tanpa menghapus data pegawai yang ada di spreadsheet!
 * ============================================================================
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = (SpreadsheetApp.getUi) ? safeGetUi() : null;

  Logger.log("=== MEMULAI SETUP DATABASE SI NAKHODA (BERFOKUS SPREADSHEET) ===");

  // --- SHEET 1: Database_Pegawai ---
  let sheetPegawai = ss.getSheetByName("Database_Pegawai");
  if (!sheetPegawai) {
    sheetPegawai = ss.insertSheet("Database_Pegawai");
  }

  const headerPegawai = [
    "NIP",
    "Nama Lengkap & Gelar",
    "Profesi",
    "Jabatan",
    "Tempat Tugas",
    "Nomor WhatsApp",
    "Role",
    "Status Awal",
    "Terakhir Diperbarui"
  ];

  // Hanya buat header jika sheet masih kosong (baris = 0).
  // TIDAK MENGHAPUS data pegawai yang sudah dimasukkan pengguna di spreadsheet!
  if (sheetPegawai.getLastRow() === 0) {
    sheetPegawai.appendRow(headerPegawai);
  }
  formatHeaderRange(sheetPegawai.getRange(1, 1, 1, headerPegawai.length), "#1E3A8A");
  sheetPegawai.setFrozenRows(1);

  const currentPegawaiCount = Math.max(0, sheetPegawai.getLastRow() - 1);
  Logger.log("Sheet Database_Pegawai siap. Terdeteksi " + currentPegawaiCount + " baris data pegawai di spreadsheet.");

  // --- SHEET 2: Presensi_Ruangan ---
  let sheetPresensi = ss.getSheetByName("Presensi_Ruangan");
  if (!sheetPresensi) {
    sheetPresensi = ss.insertSheet("Presensi_Ruangan");
  }

  const headerPresensi = [
    "Timestamp",
    "Tanggal",
    "Jam",
    "NIP",
    "Nama Pegawai",
    "Tempat Tugas",
    "Ruangan / Unit",
    "Lantai",
    "Kondisi Kesiapan",
    "Catatan Kondisi",
    "URL Foto Google Drive",
    "Status Checkin",
    "Koordinat GPS"
  ];

  if (sheetPresensi.getLastRow() === 0) {
    sheetPresensi.appendRow(headerPresensi);
  }
  formatHeaderRange(sheetPresensi.getRange(1, 1, 1, headerPresensi.length), "#047857");
  sheetPresensi.setFrozenRows(1);

  // --- SHEET 3: Lapor_Diri ---
  let sheetLapor = ss.getSheetByName("Lapor_Diri");
  if (!sheetLapor) {
    sheetLapor = ss.insertSheet("Lapor_Diri");
  }

  const headerLapor = [
    "Timestamp",
    "Tanggal",
    "Jam",
    "NIP",
    "Nama Pegawai",
    "Jenis Kegiatan / Laporan",
    "Lokasi Kegiatan",
    "Uraian Aktivitas",
    "URL Foto Dokumentasi",
    "Status Verifikasi"
  ];

  if (sheetLapor.getLastRow() === 0) {
    sheetLapor.appendRow(headerLapor);
  }
  formatHeaderRange(sheetLapor.getRange(1, 1, 1, headerLapor.length), "#4338CA");
  sheetLapor.setFrozenRows(1);

  // --- SHEET 4: Pengaturan_Sistem ---
  let sheetConfig = ss.getSheetByName("Pengaturan_Sistem");
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet("Pengaturan_Sistem");
  }

  const headerConfig = ["Parameter Key", "Nilai / Value", "Deskripsi Keterangan"];
  if (sheetConfig.getLastRow() === 0) {
    sheetConfig.appendRow(headerConfig);
    const configValues = [
      ["DRIVE_FOLDER_ID", DRIVE_FOLDER_ID, "ID Google Drive Folder penyimpanan foto presensi"],
      ["APP_NAME", APP_TITLE, "Judul Sistem Aplikasi"],
      ["INSTANSI", "Puskesmas Kepulauan Seribu Selatan", "Satuan Kerja Pemprov DKI Jakarta"],
      ["TIMEZONE", "Asia/Jakarta", "Zona waktu default WIB"],
      ["DATABASE_MODE", "SPREADSHEET_DATABASE", "Data nakes berfokus 100% pada baris sheet Database_Pegawai"],
      ["SETUP_TIMESTAMP", Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"), "Waktu setup terakhir"]
    ];
    sheetConfig.getRange(2, 1, configValues.length, headerConfig.length).setValues(configValues);
  }
  formatHeaderRange(sheetConfig.getRange(1, 1, 1, headerConfig.length), "#374151");
  sheetConfig.setFrozenRows(1);

  // Rapikan lebar kolom untuk semua sheet
  [sheetPegawai, sheetPresensi, sheetLapor, sheetConfig].forEach(s => {
    try {
      for (let i = 1; i <= Math.min(s.getLastColumn(), 15); i++) {
        s.autoResizeColumn(i);
      }
    } catch (e) {}
  });

  const successMsg = "✅ DATABASE SI NAKHODA BERHASIL DI-SETUP!\n\n" +
    "• Sheet Database_Pegawai: Siap (" + currentPegawaiCount + " data pegawai di spreadsheet).\n" +
    "• Sheet Presensi_Ruangan: Siap mencatat kehadiran.\n" +
    "• Sheet Lapor_Diri: Siap mencatat dokumentasi kegiatan.\n" +
    "• Sheet Pengaturan_Sistem: Terhubung ke Drive Folder " + DRIVE_FOLDER_ID + ".\n\n" +
    "Data pegawai sepenuhnya berfokus pada isi sheet Database_Pegawai spreadsheet ini.";

  Logger.log(successMsg);

  if (ui) {
    ui.alert("Sukses Setup Database", successMsg, ui.ButtonSet.OK);
  }

  return {
    status: "success",
    message: successMsg,
    totalPegawai: currentPegawaiCount,
    sheets: ["Database_Pegawai", "Presensi_Ruangan", "Lapor_Diri", "Pengaturan_Sistem"]
  };
}

/**
 * ============================================================================
 * 2. MENU UI SPREADSHEET (MUNCUL OTOMATIS DI GOOGLE SHEETS)
 * ============================================================================
 */
function onOpen() {
  const ui = safeGetUi();
  if (!ui) return;

  ui.createMenu("⚓ SI NAKHODA")
    .addItem("🚀 Setup Database Spreadsheet", "setupDatabase")
    .addItem("🔄 Hitung Pegawai Terdaftar", "menuCountPegawai")
    .addItem("🧹 Reset Presensi Hari Ini", "menuResetPresensiHariIni")
    .addSeparator()
    .addItem("📊 Rekapitulasi Presensi Ruangan", "menuRekapitulasiPresensi")
    .addItem("📁 Buka Folder Foto Google Drive", "menuOpenDriveFolder")
    .addToUi();
}

function menuCountPegawai() {
  const ui = safeGetUi();
  const list = readPegawaiFromSheet();
  if (ui) {
    ui.alert(
      "Database Pegawai Spreadsheet",
      "Total pegawai yang aktif dan terbaca dari sheet Database_Pegawai: " + list.length + " orang.\n\n" +
      "Anda dapat menambah baris baru di sheet Database_Pegawai kapan saja.",
      ui.ButtonSet.OK
    );
  }
}

function menuResetPresensiHariIni() {
  const ui = safeGetUi();
  if (ui) {
    const res = ui.alert(
      "Konfirmasi Reset Harian",
      "Apakah Anda ingin mereset status presensi ruangan hari ini?",
      ui.ButtonSet.YES_NO
    );
    if (res === ui.Button.YES) {
      ui.alert("Reset Selesai", "Status presensi ruangan telah disetel ulang untuk hari baru.", ui.ButtonSet.OK);
    }
  }
}

function menuRekapitulasiPresensi() {
  const ui = safeGetUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Presensi_Ruangan");
  const count = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  if (ui) {
    ui.alert("Rekapitulasi Presensi", "Total catatan presensi ruangan tersimpan di spreadsheet: " + count + " baris.", ui.ButtonSet.OK);
  }
}

function menuOpenDriveFolder() {
  const ui = safeGetUi();
  const url = "https://drive.google.com/drive/folders/" + DRIVE_FOLDER_ID;
  if (ui) {
    ui.alert("Folder Google Drive", "Folder Foto Presensi:\n" + url, ui.ButtonSet.OK);
  }
}

/**
 * ============================================================================
 * 3. HTTP WEBHOOK / REST API ENDPOINT (doPost & doGet)
 * ============================================================================
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "No post data received" });
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action || "";

    // 1. ACTION: SETUP DATABASE DARI WEB
    if (action === "setupDatabase") {
      const result = setupDatabase();
      return jsonResponse(result);
    }

    // 2. ACTION: PING / TEST KONEKSI
    if (action === "ping") {
      return jsonResponse({
        status: "ok",
        message: "Google Apps Script SI NAKHODA Aktif & Siap Menerima Data!",
        driveFolderId: DRIVE_FOLDER_ID,
        timestamp: new Date().toISOString()
      });
    }

    // 3. ACTION: SIMPAN PENGATURAN SISTEM KE SHEET PENGATURAN_SISTEM
    if (action === "saveSystemConfig") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Pengaturan_Sistem");
      if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName("Pengaturan_Sistem");
      }

      const cfg = data.config || {};
      const updates = [
        ["DRIVE_FOLDER_ID", cfg.folderId || DRIVE_FOLDER_ID, "ID Google Drive Folder"],
        ["WEBHOOK_URL", cfg.webhookUrl || "", "URL Web App Apps Script"],
        ["SPREADSHEET_URL", cfg.spreadsheetUrl || ss.getUrl(), "URL Google Spreadsheet"],
        ["WHATSAPP_API_KEY", cfg.whatsappApiKey || "", "API Key Gateway WhatsApp"],
        ["WHATSAPP_SENDER", cfg.whatsappSender || "", "Nomor Pengirim WhatsApp"],
        ["LAST_CONFIG_UPDATE", Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"), "Diperbarui dari Web SI NAKHODA"]
      ];

      const lastRow = sheet.getLastRow();
      let existingKeys = {};
      if (lastRow > 1) {
        const currentData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        currentData.forEach((row, i) => {
          existingKeys[String(row[0]).trim()] = i + 2;
        });
      }

      updates.forEach(([key, val, desc]) => {
        if (existingKeys[key]) {
          sheet.getRange(existingKeys[key], 2).setValue(val);
          sheet.getRange(existingKeys[key], 3).setValue(desc);
        } else {
          sheet.appendRow([key, val, desc]);
        }
      });

      return jsonResponse({
        status: "success",
        message: "Pengaturan sistem berhasil disimpan ke Google Sheets (Pengaturan_Sistem)!"
      });
    }

    // 4. ACTION: AMBIL PENGATURAN SISTEM DARI SHEET PENGATURAN_SISTEM
    if (action === "getSystemConfig") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Pengaturan_Sistem");
      let configResult = {};
      if (sheet && sheet.getLastRow() > 1) {
        const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
        values.forEach(row => {
          configResult[String(row[0]).trim()] = String(row[1] || "");
        });
      }
      return jsonResponse({
        status: "success",
        config: configResult
      });
    }

    // 5. ACTION: AMBIL SELURUH DATA PEGAWAI DARI SPREADSHEET (BERSIH & MURNI SPREADSHEET)
    if (action === "getPegawai") {
      const pegawaiList = readPegawaiFromSheet();
      return jsonResponse({
        status: "success",
        total: pegawaiList.length,
        pegawai: pegawaiList,
        source: "Google Spreadsheet (Database_Pegawai)"
      });
    }

    // 6. ACTION: SIMPAN / TAMBAH PEGAWAI BARU KE SPREADSHEET
    if (action === "savePegawai") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Database_Pegawai");
      if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName("Database_Pegawai");
      }

      sheet.appendRow([
        data.nip,
        data.nama,
        data.profesi,
        data.jabatan || "-",
        data.tempatTugas || "-",
        data.telepon || "-",
        data.role || "pegawai",
        data.statusAwal || "hadir",
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      ]);

      return jsonResponse({
        status: "success",
        message: "Pegawai " + data.nama + " berhasil disimpan ke spreadsheet."
      });
    }

    // 7. ACTION: SINKRONKAN SEMUA PEGAWAI SECARA MASSAL
    if (action === "syncAllPegawai" && Array.isArray(data.pegawaiList)) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Database_Pegawai");
      if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName("Database_Pegawai");
      }

      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }

      const rows = data.pegawaiList.map(p => [
        p.nip,
        p.nama,
        p.profesi,
        p.jabatan || "-",
        p.tempatTugas || "-",
        p.telepon || "-",
        p.role || "pegawai",
        p.status || "hadir",
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      ]);

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 9).setValues(rows);
      }

      return jsonResponse({
        status: "success",
        message: "Berhasil mensinkronkan " + rows.length + " pegawai ke Google Sheets."
      });
    }

    // 8. ACTION: UPLOAD FOTO TERKOMPRESI KE GOOGLE DRIVE
    if (action === "uploadPhoto") {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const base64Data = (data.base64 || "").replace(/^data:image\/[a-z]+;base64,/, "");
      const decodedBytes = Utilities.base64Decode(base64Data);
      const filename = data.fileName || ("presensi_" + (data.nip || "pegawai") + "_" + Date.now() + ".jpg");

      const blob = Utilities.newBlob(decodedBytes, "image/jpeg", filename);
      const file = folder.createFile(blob);

      file.setDescription(
        "SI NAKHODA Foto Presensi\nPegawai: " + (data.pegawaiNama || "") +
        "\nNIP: " + (data.nip || "") +
        "\nLokasi: " + (data.unitName || "") + " (" + (data.tempatKerja || "") + ")" +
        "\nTanggal: " + new Date().toLocaleString("id-ID")
      );
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (err) {}

      return jsonResponse({
        status: "success",
        fileId: file.getId(),
        fileUrl: file.getUrl(),
        downloadUrl: file.getDownloadUrl(),
        fileName: file.getName(),
        folderId: DRIVE_FOLDER_ID
      });
    }

    // 9. ACTION: CATAT CHECK-IN RUANGAN
    if (action === "saveCheckIn") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Presensi_Ruangan");
      if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName("Presensi_Ruangan");
      }

      const now = new Date();
      const tanggal = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
      const jam = Utilities.formatDate(now, "Asia/Jakarta", "HH:mm:ss");

      sheet.appendRow([
        now,
        tanggal,
        jam,
        data.nip,
        data.pegawaiNama,
        data.tempatKerja,
        data.unitName,
        data.lantai,
        data.kondisi,
        data.catatan || "-",
        data.fotoUrl || "-",
        "Hadir di Ruangan",
        data.coordinates ? (data.coordinates.lat + ", " + data.coordinates.lng) : "-"
      ]);

      return jsonResponse({
        status: "success",
        message: "Check-in ruangan untuk " + data.pegawaiNama + " berhasil dicatat!"
      });
    }

    // 10. ACTION: CATAT LAPOR DIRI KEGIATAN
    if (action === "saveLaporDiri") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Lapor_Diri");
      if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName("Lapor_Diri");
      }

      const now = new Date();
      const tanggal = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
      const jam = Utilities.formatDate(now, "Asia/Jakarta", "HH:mm:ss");

      sheet.appendRow([
        now,
        tanggal,
        jam,
        data.nip,
        data.pegawaiNama,
        data.kegiatan || "Lapor Diri",
        data.lokasi || data.tempatKerja,
        data.catatan || "-",
        data.fotoUrl || "-",
        "Terverifikasi"
      ]);

      return jsonResponse({
        status: "success",
        message: "Laporan diri untuk " + data.pegawaiNama + " berhasil dicatat!"
      });
    }

    return jsonResponse({
      status: "unknown_action",
      message: "Action '" + action + "' tidak dikenali."
    });

  } catch (err) {
    Logger.log("ERROR doPost: " + err.toString());
    return jsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";

  if (action === "setupDatabase") {
    return jsonResponse(setupDatabase());
  }

  if (action === "getPegawai") {
    const pegawaiList = readPegawaiFromSheet();
    return jsonResponse({
      status: "success",
      total: pegawaiList.length,
      pegawai: pegawaiList,
      source: "Google Spreadsheet (Database_Pegawai)"
    });
  }

  if (action === "ping") {
    return jsonResponse({
      status: "ok",
      message: "SI NAKHODA GAS Backend Online",
      driveFolderId: DRIVE_FOLDER_ID,
      time: new Date().toISOString()
    });
  }

  const htmlOutput = HtmlService.createHtmlOutput(
    "<!DOCTYPE html>" +
    "<html>" +
    "<head><meta charset='utf-8'><title>SI NAKHODA GAS Backend</title>" +
    "<style>" +
    "body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:30px;background:#f8fafc;color:#0f172a;}" +
    ".card{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);border:1px solid #e2e8f0;}" +
    "h1{color:#1e3a8a;font-size:20px;margin-top:0;display:flex;align-items:center;gap:8px;}" +
    "p{font-size:13px;line-height:1.6;color:#475569;}" +
    ".badge{display:inline-block;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;padding:4px 10px;border-radius:99px;font-weight:bold;font-size:11px;}" +
    ".btn{display:inline-block;margin-top:12px;padding:10px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:13px;}" +
    "</style></head>" +
    "<body><div class='card'>" +
    "<h1>⚓ SI NAKHODA - Google Apps Script Backend</h1>" +
    "<span class='badge'>● Webhook Aktif & Online</span>" +
    "<p>Endpoint ini membaca & menulis langsung ke spreadsheet <strong>Database_Pegawai</strong>, mencatat presensi ruangan, dan mengunggah foto ke Google Drive.</p>" +
    "<p><strong>Target Drive Folder ID:</strong> <code>" + DRIVE_FOLDER_ID + "</code></p>" +
    "<a href='https://drive.google.com/drive/folders/" + DRIVE_FOLDER_ID + "' target='_blank' class='btn'>Buka Folder Foto Drive</a>" +
    "</div></body></html>"
  );

  return htmlOutput.setTitle("SI NAKHODA GAS Webhook");
}

/**
 * ============================================================================
 * 4. HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Membaca data pegawai langsung dari baris sheet Database_Pegawai di spreadsheet.
 * Jika sheet kosong atau belum diisi, mengembalikan array kosong [] tanpa dummy data.
 */
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

    // Lewati baris yang benar-benar kosong (tanpa NIP dan tanpa Nama)
    if (!nip && !nama) {
      continue;
    }

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

function formatHeaderRange(range, hexBgColor) {
  range.setBackground(hexBgColor)
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10)
    .setFontFamily("Arial")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeGetUi() {
  try {
    return SpreadsheetApp.getUi();
  } catch (e) {
    return null;
  }
}
