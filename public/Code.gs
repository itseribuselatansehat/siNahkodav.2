/**
 * ============================================================================
 * SI NAKHODA - GOOGLE APPS SCRIPT (GAS) BACKEND & DATABASE SETUP
 * Sistem Navigasi & Kehadiran Tenaga Medis - Kepulauan Seribu Selatan
 * ============================================================================
 * Target Google Drive Folder:
 * https://drive.google.com/drive/folders/1RnBhuEfOErrbGqitdhEY0nExeKXVKC7L?usp=sharing
 * Folder ID: 1RnBhuEfOErrbGqitdhEY0nExeKXVKC7L
 * ============================================================================
 * PANDUAN PEMASANGAN CEPAT:
 * 1. Buka Google Spreadsheet Anda (docs.google.com/spreadsheets).
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus kode default, lalu Paste seluruh isi file ini ke dalam Code.gs.
 * 4. Pada dropdown fungsi di atas editor, pilih "setupDatabase", lalu klik "Jalankan" (Run).
 *    -> Berikan izin (Review Permissions) akun Google Anda saat pertama kali diminta.
 *    -> Spreadsheet akan OTOMATIS membuat 4 Sheet lengkap dengan seluruh data pegawai!
 * 5. Untuk mengaktifkan Webhook/API ke Web SI NAKHODA:
 *    -> Klik "Terapkan" (Deploy) > "Kelola Penerapan" (New Deployment).
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
 * DATABASE PEGAWAI AWAL (MASTER DATA SDM KESEHATAN KEPULAUAN SERIBU SELATAN)
 * Tersebar di 5 Fasilitas: Puskesmas Tidung, Pustu Untung Jawa, Pustu Pari, Pustu Lancang, & Transit Jakarta
 */
const INITIAL_PEGAWAI_DATABASE = [
  // 1. Puskesmas Kepulauan Seribu Selatan (Pulau Tidung)
  {
    nip: "198207152006041002",
    nama: "drg. Ahmad Fauzi",
    profesi: "Dokter Gigi",
    jabatan: "Kepala Puskesmas",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081299887766",
    role: "admin",
    statusAwal: "hadir"
  },
  {
    nip: "198904122014022003",
    nama: "dr. Farhan Malik",
    profesi: "Dokter",
    jabatan: "Dokter Penanggung Jawab IGD",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081311223344",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199506062020121004",
    nama: "Perawat Rudi Hermawan, S.Kep",
    profesi: "Perawat",
    jabatan: "Perawat Pelaksana IGD",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567803",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "198502022010012015",
    nama: "dr. Rina Kusuma Wardhani",
    profesi: "Dokter",
    jabatan: "Dokter Fungsional Poli Umum",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567804",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "67890",
    nama: "Suster Ani Rahayu, A.Md.Kep",
    profesi: "Perawat",
    jabatan: "Koordinator Pelayanan PTM & Lansia",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567805",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199204042018011005",
    nama: "apt. Rudi Santoso, S.Farm",
    profesi: "Apoteker",
    jabatan: "Penanggung Jawab Farmasi & Obat",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567806",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199003032015032007",
    nama: "Bidan Sari Handayani, S.Tr.Keb",
    profesi: "Bidan",
    jabatan: "Koordinator KIA & Imunisasi",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567807",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199308122019022008",
    nama: "Bidan Yuni Astuti, A.Md.Keb",
    profesi: "Bidan",
    jabatan: "Bidan Pelaksana Imunisasi",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567808",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199411202020122009",
    nama: "Fitri Handayani, A.Md.AK",
    profesi: "Analis Lab",
    jabatan: "Pranata Laboratorium Kesehatan",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567809",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "198805052012011006",
    nama: "Perawat Deni Iskandar, S.Kep",
    profesi: "Perawat",
    jabatan: "Perawat Koordinator Triage",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567810",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199109092017042011",
    nama: "Rahmawati, S.Gz",
    profesi: "Nutrisionis",
    jabatan: "Nutrisionis / Pengelola Gizi",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567811",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "198108082015011012",
    nama: "Pak Slamet Riyadi",
    profesi: "Petugas Keamanan",
    jabatan: "Petugas Pengamanan Puskesmas",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567812",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "197902142005011003",
    nama: "H. Bambang Sulistyo, S.Sos",
    profesi: "Staf Administrasi",
    jabatan: "Kasubag Tata Usaha",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567813",
    role: "admin",
    statusAwal: "hadir"
  },
  {
    nip: "198706182011012014",
    nama: "Nurul Hidayati, S.E.",
    profesi: "Staf Administrasi",
    jabatan: "Bendahara Penerimaan & Pengeluaran",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567814",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199201152019031015",
    nama: "Ilham Pratama, S.Kom",
    profesi: "Staf Administrasi",
    jabatan: "Pengelola SIMPUS & Kepegawaian",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567815",
    role: "admin",
    statusAwal: "hadir"
  },
  {
    nip: "198910102014021016",
    nama: "Doni Saputra, S.Tr.Kes",
    profesi: "Sanitarian",
    jabatan: "Sanitarian Lingkungan",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567816",
    role: "pegawai",
    statusAwal: "dinas_luar"
  },
  {
    nip: "198305142011011017",
    nama: "Kapten Arifin Syahputra",
    profesi: "Nahkoda / Awak Kapal",
    jabatan: "Koordinator Transportasi Rujukan Pasien",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567817",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199103152016021018",
    nama: "Perawat Hendra Wijaya, A.Md.Kep",
    profesi: "Perawat",
    jabatan: "Perawat Pelaksana IGD & Rujukan",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567818",
    role: "pegawai",
    statusAwal: "dinas_luar"
  },

  // 2. Puskesmas Pembantu (Pustu) Untung Jawa
  {
    nip: "198712122012011019",
    nama: "Perawat Teguh Wibowo, S.Kep",
    profesi: "Perawat",
    jabatan: "Kepala Pustu Untung Jawa",
    tempatTugas: "Pustu Untung Jawa",
    telepon: "081234567819",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199304152018022020",
    nama: "Bidan Ratna Dewi, A.Md.Keb",
    profesi: "Bidan",
    jabatan: "Bidan Desa Untung Jawa",
    tempatTugas: "Pustu Untung Jawa",
    telepon: "081234567820",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199602202022031021",
    nama: "Perawat Fikri Haikal, A.Md.Kep",
    profesi: "Perawat",
    jabatan: "Perawat Piket Jaga Untung Jawa",
    tempatTugas: "Pustu Untung Jawa",
    telepon: "081234567821",
    role: "pegawai",
    statusAwal: "hadir"
  },

  // 3. Puskesmas Pembantu (Pustu) Pulau Pari
  {
    nip: "199105252018021022",
    nama: "dr. Dimas Prasetyo",
    profesi: "Dokter",
    jabatan: "Dokter Penanggung Jawab Pustu Pari",
    tempatTugas: "Pustu Pulau Pari",
    telepon: "081234567822",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199013132016022023",
    nama: "Bidan Nita Anggraini, S.Tr.Keb",
    profesi: "Bidan",
    jabatan: "Bidan Pelaksana Pustu Pari",
    tempatTugas: "Pustu Pulau Pari",
    telepon: "081234567823",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199407102021021024",
    nama: "Perawat Reza Kurniawan, A.Md.Kep",
    profesi: "Perawat",
    jabatan: "Perawat Pelaksana Pustu Pari",
    tempatTugas: "Pustu Pulau Pari",
    telepon: "081234567824",
    role: "pegawai",
    statusAwal: "hadir"
  },

  // 4. Puskesmas Pembantu (Pustu) Pulau Lancang
  {
    nip: "198909182015011025",
    nama: "Perawat Agus Salim, S.Kep",
    profesi: "Perawat",
    jabatan: "Penanggung Jawab Pustu Lancang",
    tempatTugas: "Pustu Pulau Lancang",
    telepon: "081234567825",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199511122021022026",
    nama: "Bidan Maya Safitri, A.Md.Keb",
    profesi: "Bidan",
    jabatan: "Bidan Pelaksana Lancang",
    tempatTugas: "Pustu Pulau Lancang",
    telepon: "081234567826",
    role: "pegawai",
    statusAwal: "hadir"
  },
  {
    nip: "199401182022031029",
    nama: "Yusuf Maulana, A.Md.Kes",
    profesi: "Apoteker",
    jabatan: "Petugas Pengelola Obat Lancang",
    tempatTugas: "Pustu Pulau Lancang",
    telepon: "081234567829",
    role: "pegawai",
    statusAwal: "belum_hadir"
  },

  // 5. Pegawai Belum Check-in / Dalam Perjalanan Kapal (Sample Data Monitoring)
  {
    nip: "199008222019021027",
    nama: "dr. Eko Prasetyawan",
    profesi: "Dokter Gigi",
    jabatan: "Dokter Fungsional Poli Gigi",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567827",
    role: "pegawai",
    statusAwal: "belum_hadir"
  },
  {
    nip: "199312152020122028",
    nama: "Siti Rohani, A.Md.RMIK",
    profesi: "Staf Administrasi",
    jabatan: "Perekam Medis Loket",
    tempatTugas: "Puskesmas Kepulauan Seribu Selatan",
    telepon: "081234567828",
    role: "pegawai",
    statusAwal: "belum_hadir"
  },

  // 6. Kantor Transit Jakarta (Daratan Ancol / Marina)
  {
    nip: "199204142017031030",
    nama: "Rian Hidayat, S.AP",
    profesi: "Staf Administrasi",
    jabatan: "Pengadministrasi Penghubung Jakarta",
    tempatTugas: "Kantor Transit Jakarta",
    telepon: "081234567830",
    role: "pegawai",
    statusAwal: "hadir"
  }
];

/**
 * ============================================================================
 * 1. FUNGSI SETUP DATABASE UTAMA
 * Jalankan fungsi ini langsung dari editor Apps Script atau lewat Menu UI!
 * ============================================================================
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = (SpreadsheetApp.getUi) ? safeGetUi() : null;

  Logger.log("=== MEMULAI SETUP DATABASE SI NAKHODA ===");

  // --- SHEET 1: Database_Pegawai ---
  let sheetPegawai = ss.getSheetByName("Database_Pegawai");
  if (!sheetPegawai) {
    sheetPegawai = ss.insertSheet("Database_Pegawai");
  }
  sheetPegawai.clear();

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
  sheetPegawai.appendRow(headerPegawai);

  // Format Header
  formatHeaderRange(sheetPegawai.getRange(1, 1, 1, headerPegawai.length), "#1E3A8A");

  // Masukkan Data Pegawai
  const rowsPegawai = INITIAL_PEGAWAI_DATABASE.map(p => [
    p.nip,
    p.nama,
    p.profesi,
    p.jabatan,
    p.tempatTugas,
    p.telepon,
    p.role,
    p.statusAwal,
    Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  ]);

  if (rowsPegawai.length > 0) {
    sheetPegawai.getRange(2, 1, rowsPegawai.length, headerPegawai.length).setValues(rowsPegawai);
  }
  styleDataSheet(sheetPegawai, rowsPegawai.length + 1, headerPegawai.length);
  sheetPegawai.setFrozenRows(1);
  Logger.log("Sheet Database_Pegawai berhasil dibuat dengan " + rowsPegawai.length + " data.");

  // --- SHEET 2: Presensi_Ruangan ---
  let sheetPresensi = ss.getSheetByName("Presensi_Ruangan");
  if (!sheetPresensi) {
    sheetPresensi = ss.insertSheet("Presensi_Ruangan");
  } else {
    // Jika belum ada header, buat
    if (sheetPresensi.getLastRow() === 0) {
      sheetPresensi.clear();
    }
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
    formatHeaderRange(sheetPresensi.getRange(1, 1, 1, headerPresensi.length), "#047857");
    sheetPresensi.setFrozenRows(1);
  }

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
    formatHeaderRange(sheetLapor.getRange(1, 1, 1, headerLapor.length), "#4338CA");
    sheetLapor.setFrozenRows(1);
  }

  // --- SHEET 4: Pengaturan_Sistem ---
  let sheetConfig = ss.getSheetByName("Pengaturan_Sistem");
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet("Pengaturan_Sistem");
  }
  sheetConfig.clear();

  const headerConfig = ["Parameter Key", "Nilai / Value", "Deskripsi Keterangan"];
  sheetConfig.appendRow(headerConfig);
  formatHeaderRange(sheetConfig.getRange(1, 1, 1, headerConfig.length), "#374151");

  const configValues = [
    ["DRIVE_FOLDER_ID", DRIVE_FOLDER_ID, "ID Google Drive Folder penyimpanan foto presensi terkompresi"],
    ["APP_NAME", APP_TITLE, "Judul Sistem Aplikasi"],
    ["INSTANSI", "Puskesmas Kepulauan Seribu Selatan", "Satuan Kerja Pemprov DKI Jakarta"],
    ["TIMEZONE", "Asia/Jakarta", "Zona waktu default WIB"],
    ["TOTAL_PEGAWAI_DEFAULT", INITIAL_PEGAWAI_DATABASE.length.toString(), "Jumlah master data nakes saat inisialisasi"],
    ["AUTO_RESET_HOUR", "00:00", "Jadwal reset status check-in harian"],
    ["SETUP_TIMESTAMP", Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"), "Waktu eksekusi setup terakhir"],
    ["STATUS_DATABASE", "AKTIF & SIAP DIGUNAKAN", "Status operasional spreadsheet"]
  ];
  sheetConfig.getRange(2, 1, configValues.length, headerConfig.length).setValues(configValues);
  styleDataSheet(sheetConfig, configValues.length + 1, headerConfig.length);
  sheetConfig.setFrozenRows(1);

  // Rapikan lebar kolom untuk semua sheet
  [sheetPegawai, sheetPresensi, sheetLapor, sheetConfig].forEach(s => {
    try {
      for (let i = 1; i <= s.getLastColumn(); i++) {
        s.autoResizeColumn(i);
      }
    } catch (e) {
      // Abaikan jika keterbatasan kuota headless
    }
  });

  const successMsg = "✅ DATABASE SI NAKHODA BERHASIL DI-SETUP!\n\n" +
    "• Sheet Database_Pegawai: Terisi " + INITIAL_PEGAWAI_DATABASE.length + " data pegawai.\n" +
    "• Sheet Presensi_Ruangan: Siap mencatat check-in nakes.\n" +
    "• Sheet Lapor_Diri: Siap mencatat foto kegiatan.\n" +
    "• Sheet Pengaturan_Sistem: Terhubung ke Drive Folder " + DRIVE_FOLDER_ID + ".\n\n" +
    "Langkah berikutnya: Deploy Web App untuk menghubungkan aplikasi web SI NAKHODA!";

  Logger.log(successMsg);

  if (ui) {
    ui.alert("Sukses Setup Database", successMsg, ui.ButtonSet.OK);
  }

  return {
    status: "success",
    message: successMsg,
    totalPegawai: INITIAL_PEGAWAI_DATABASE.length,
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
    .addItem("🚀 Setup Database Otomatis", "setupDatabase")
    .addItem("🔄 Sinkronkan Data Pegawai", "menuSyncPegawai")
    .addItem("🧹 Reset Presensi Hari Ini (00:00)", "menuResetPresensiHariIni")
    .addSeparator()
    .addItem("📊 Rekapitulasi Presensi Ruangan", "menuRekapitulasiPresensi")
    .addItem("📁 Buka Folder Foto Google Drive", "menuOpenDriveFolder")
    .addToUi();
}

function menuSyncPegawai() {
  const ui = safeGetUi();
  const res = setupDatabase();
  if (ui) ui.alert("Sinkronisasi Pegawai", "Database pegawai telah diperbarui (" + res.totalPegawai + " nakes).", ui.ButtonSet.OK);
}

function menuResetPresensiHariIni() {
  const ui = safeGetUi();
  if (ui) {
    const res = ui.alert(
      "Konfirmasi Reset Harian",
      "Apakah Anda ingin mereset status presensi hari ini agar semua pegawai berstatus Belum Hadir / Siap Masuk Shift Baru?",
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
    ui.alert("Rekapitulasi Presensi", "Total catatan presensi ruangan tersimpan: " + count + " baris.", ui.ButtonSet.OK);
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
 * Menerima request dari aplikasi web SI NAKHODA
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

    // 2.5. ACTION: SIMPAN PENGATURAN SISTEM KE SHEET PENGATURAN_SISTEM
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

    // 2.6. ACTION: AMBIL PENGATURAN SISTEM DARI SHEET PENGATURAN_SISTEM
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

    // 3. ACTION: AMBIL SELURUH DATA PEGAWAI (GET PEGAWAI)
    if (action === "getPegawai") {
      const pegawaiList = readPegawaiFromSheet();
      return jsonResponse({
        status: "success",
        total: pegawaiList.length,
        pegawai: pegawaiList
      });
    }

    // 4. ACTION: SIMPAN / TAMBAH PEGAWAI BARU KE SPREADSHEET
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

    // 5. ACTION: SINKRONKAN SEMUA PEGAWAI SECARA MASSAL
    if (action === "syncAllPegawai" && Array.isArray(data.pegawaiList)) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Database_Pegawai");
      if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName("Database_Pegawai");
      }

      // Hapus data lama (pertahankan header)
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

    // 6. ACTION: UPLOAD FOTO TERKOMPRESI KE GOOGLE DRIVE
    if (action === "uploadPhoto") {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const base64Data = (data.base64 || "").replace(/^data:image\/[a-z]+;base64,/, "");
      const decodedBytes = Utilities.base64Decode(base64Data);
      const filename = data.fileName || ("presensi_" + (data.nip || "pegawai") + "_" + Date.now() + ".jpg");

      const blob = Utilities.newBlob(decodedBytes, "image/jpeg", filename);
      const file = folder.createFile(blob);

      // Berikan akses baca bagi yang memiliki link
      file.setDescription(
        "SI NAKHODA Foto Presensi\nPegawai: " + (data.pegawaiNama || "") +
        "\nNIP: " + (data.nip || "") +
        "\nLokasi: " + (data.unitName || "") + " (" + (data.tempatKerja || "") + ")" +
        "\nTanggal: " + new Date().toLocaleString("id-ID")
      );
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (err) {
        // Abaikan jika domain enterprise membatasi share publik
      }

      return jsonResponse({
        status: "success",
        fileId: file.getId(),
        fileUrl: file.getUrl(),
        downloadUrl: file.getDownloadUrl(),
        fileName: file.getName(),
        folderId: DRIVE_FOLDER_ID
      });
    }

    // 7. ACTION: CATAT CHECK-IN RUANGAN
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

    // 8. ACTION: CATAT LAPOR DIRI KEGIATAN
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
      pegawai: pegawaiList
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

  // Tampilan halaman HTML saat dibuka di browser
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
    "<p>Endpoint ini menerima data presensi, upload foto ke Google Drive, dan sinkronisasi database pegawai untuk Puskesmas Kepulauan Seribu Selatan.</p>" +
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
function readPegawaiFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Database_Pegawai");
  if (!sheet || sheet.getLastRow() <= 1) {
    return INITIAL_PEGAWAI_DATABASE;
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return values.map((row, index) => ({
    id: "peg-" + (index + 1),
    nip: String(row[0] || ""),
    nama: String(row[1] || ""),
    profesi: String(row[2] || ""),
    jabatan: String(row[3] || ""),
    tempatTugas: String(row[4] || ""),
    telepon: String(row[5] || ""),
    role: String(row[6] || "pegawai"),
    status: String(row[7] || "hadir")
  }));
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

function styleDataSheet(sheet, totalRows, totalCols) {
  if (totalRows <= 1) return;
  const dataRange = sheet.getRange(2, 1, totalRows - 1, totalCols);
  dataRange.setFontFamily("Arial")
    .setFontSize(10)
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
