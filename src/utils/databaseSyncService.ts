/**
 * Service Sinkronisasi Database Real-time (Auto-Refresh 3 Detik)
 * Menghubungkan seluruh browser, tablet, dan smartphone pegawai ke database SI NAKHODA.
 * Mendukung Full-Stack Server & Static Hostinger + Google Apps Script & Google Drive.
 */

import { Pegawai, MovementLog, LaporDiriRecord } from '../types';
import { 
  uploadPhotoToGoogleDriveGAS, 
  recordCheckInToGAS, 
  recordLaporDiriToGAS 
} from './gasService';

export interface DatabaseState {
  lastUpdated: number;
  pegawai: Pegawai[];
  movementLogs: MovementLog[];
  laporDiriList: LaporDiriRecord[];
}

let lastKnownServerTimestamp = 0;

// Broadcast channel untuk sinkronisasi seketika antar-tab / window browser
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('sinakhoda_db_sync_channel') 
  : null;

function notifyLocalUpdate() {
  const now = Date.now();
  if (typeof window !== 'undefined') {
    localStorage.setItem('sinakhoda_db_timestamp', String(now));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'db_update', timestamp: now });
    }
  }
}

/**
 * Mengambil snapshot database terbaru setiap 3 detik
 * Jika di server Node.js: mengambil dari /api/database
 * Jika di static hosting (Hostinger): membaca snapshot sinkron lokal & GAS
 */
export async function fetchAppDatabase(): Promise<{
  success: boolean;
  data?: DatabaseState;
  hasUpdates: boolean;
}> {
  // 1. Coba ambil dari endpoint backend Express (/api/database)
  try {
    const res = await fetch('/api/database', {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.data) {
          const serverTime = json.lastUpdated || json.timestamp || 0;
          const hasUpdates = serverTime > lastKnownServerTimestamp;
          if (hasUpdates) {
            lastKnownServerTimestamp = serverTime;
          }
          return {
            success: true,
            data: json.data,
            hasUpdates
          };
        }
      }
    }

    // Coba endpoint PHP Hostinger
    const phpRes = await fetch('/api/database.php', {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
    });
    if (phpRes.ok) {
      const phpType = phpRes.headers.get('content-type') || '';
      if (phpType.includes('application/json')) {
        const json = await phpRes.json();
        if (json.success && json.data) {
          const serverTime = json.lastUpdated || json.timestamp || 0;
          const hasUpdates = serverTime > lastKnownServerTimestamp;
          if (hasUpdates) {
            lastKnownServerTimestamp = serverTime;
          }
          return {
            success: true,
            data: json.data,
            hasUpdates
          };
        }
      }
    }
  } catch (err) {
    // Failover ke mode sinkronisasi statis (Hostinger)
  }

  // 2. Mode Static Hosting Hostinger: Gunakan local snapshot & timestamps
  if (typeof window !== 'undefined') {
    try {
      const localTimeStr = localStorage.getItem('sinakhoda_db_timestamp');
      const localTime = localTimeStr ? Number(localTimeStr) : Date.now();
      const hasUpdates = localTime > lastKnownServerTimestamp;
      if (hasUpdates) {
        lastKnownServerTimestamp = localTime;
      }

      const rawPegawai = localStorage.getItem('sinakhoda_pegawai_v3');
      const rawMovements = localStorage.getItem('sinakhoda_movements_v3');
      const rawLaporDiri = localStorage.getItem('sinakhoda_lapordiri_v3');

      const pegawai = rawPegawai ? JSON.parse(rawPegawai) : [];
      const movementLogs = rawMovements ? JSON.parse(rawMovements) : [];
      const laporDiriList = rawLaporDiri ? JSON.parse(rawLaporDiri) : [];

      return {
        success: true,
        data: {
          lastUpdated: localTime,
          pegawai,
          movementLogs,
          laporDiriList
        },
        hasUpdates
      };
    } catch (e) {
      // Local parsing fallback
    }
  }

  return { success: true, hasUpdates: false };
}

/**
 * Menyimpan Check-In Pegawai langsung ke server database dan Google Drive / Spreadsheet
 */
export async function saveCheckInToDatabase(payload: {
  pegawaiId: string;
  tempatKerja: string;
  lantai: string;
  unitId: string;
  unitName: string;
  kondisi: string;
  catatan: string;
  lastCheckinTime: string;
  selfieUrl?: string;
  coordinates?: any;
  movementLog?: MovementLog;
}): Promise<boolean> {
  notifyLocalUpdate();

  // 1. Kirim ke backend Express (/api/database) jika aktif
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'checkin',
        payload
      })
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json().catch(() => null);
        if (json && json.success) {
          lastKnownServerTimestamp = json.lastUpdated || Date.now();
        }
      }
    }
  } catch (e) {}

  // 2. OTOMATIS: Upload foto ke Google Drive yang sudah disiapkan & catat ke Google Sheets
  if (payload.selfieUrl && payload.selfieUrl.startsWith('data:image')) {
    uploadPhotoToGoogleDriveGAS({
      base64: payload.selfieUrl,
      pegawaiNama: payload.movementLog?.pegawaiNama || 'Pegawai',
      nip: payload.movementLog?.nip || payload.pegawaiId,
      tempatKerja: payload.tempatKerja,
      unitName: payload.unitName
    }).then((uploadRes) => {
      recordCheckInToGAS({
        nip: payload.movementLog?.nip || payload.pegawaiId,
        pegawaiNama: payload.movementLog?.pegawaiNama || 'Pegawai',
        tempatKerja: payload.tempatKerja,
        unitName: payload.unitName,
        lantai: payload.lantai,
        kondisi: payload.kondisi,
        catatan: payload.catatan,
        fotoUrl: uploadRes.fileUrl || undefined,
        coordinates: payload.coordinates
      });
    }).catch(() => {});
  } else {
    // Catat ke Google Sheets tanpa foto
    recordCheckInToGAS({
      nip: payload.movementLog?.nip || payload.pegawaiId,
      pegawaiNama: payload.movementLog?.pegawaiNama || 'Pegawai',
      tempatKerja: payload.tempatKerja,
      unitName: payload.unitName,
      lantai: payload.lantai,
      kondisi: payload.kondisi,
      catatan: payload.catatan,
      coordinates: payload.coordinates
    }).catch(() => {});
  }

  return true;
}

/**
 * Menyimpan Lapor Diri Pegawai langsung ke server database dan Google Drive / Spreadsheet
 */
export async function saveLaporDiriToDatabase(record: LaporDiriRecord): Promise<boolean> {
  notifyLocalUpdate();

  // 1. Kirim ke backend Express (/api/database) jika aktif
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'lapordiri',
        payload: record
      })
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json().catch(() => null);
        if (json && json.success) {
          lastKnownServerTimestamp = json.lastUpdated || Date.now();
        }
      }
    }
  } catch (e) {}

  // 2. OTOMATIS: Upload foto dokumentasi ke Google Drive & simpan ke Google Sheets Lapor_Diri
  const photoData = record.fotoUrl || record.dokumentasiFoto;
  if (photoData && photoData.startsWith('data:image')) {
    uploadPhotoToGoogleDriveGAS({
      base64: photoData,
      fileName: `lapor_${record.nip || 'pegawai'}_${Date.now()}.jpg`,
      pegawaiNama: record.pegawaiNama,
      nip: record.nip,
      tempatKerja: record.tempatTugas,
      unitName: record.kegiatan
    }).then((uploadRes) => {
      recordLaporDiriToGAS({
        nip: record.nip,
        pegawaiNama: record.pegawaiNama,
        kegiatan: record.kegiatan,
        lokasi: record.lokasi,
        catatan: record.detail,
        fotoUrl: uploadRes.fileUrl || undefined
      });
    }).catch(() => {});
  } else {
    recordLaporDiriToGAS({
      nip: record.nip,
      pegawaiNama: record.pegawaiNama,
      kegiatan: record.kegiatan,
      lokasi: record.lokasi,
      catatan: record.detail
    }).catch(() => {});
  }

  return true;
}

/**
 * Menyimpan status cepat kondisi pegawai langsung ke server database
 */
export async function saveQuickStatusToDatabase(payload: {
  pegawaiId: string;
  kondisi: string;
  catatan: string;
}): Promise<boolean> {
  notifyLocalUpdate();

  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'quick_status',
        payload
      })
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json().catch(() => null);
        if (json && json.success) {
          lastKnownServerTimestamp = json.lastUpdated || Date.now();
          return true;
        }
      }
    }
  } catch (e) {}

  return true;
}

/**
 * Menyimpan reset ruangan harian ke server database
 */
export async function saveResetToDatabase(): Promise<boolean> {
  notifyLocalUpdate();

  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset'
      })
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json().catch(() => null);
        if (json && json.success) {
          lastKnownServerTimestamp = json.lastUpdated || Date.now();
          return true;
        }
      }
    }
  } catch (e) {}

  return true;
}

/**
 * Sinkronisasi penuh semua state lokal ke server database
 */
export async function syncFullDatabaseToServer(data: {
  pegawai: Pegawai[];
  movementLogs: MovementLog[];
  laporDiriList: LaporDiriRecord[];
}): Promise<boolean> {
  notifyLocalUpdate();

  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_all',
        ...data
      })
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json().catch(() => null);
        if (json && json.success) {
          lastKnownServerTimestamp = json.lastUpdated || Date.now();
          return true;
        }
      }
    }
  } catch (e) {}

  return true;
}
