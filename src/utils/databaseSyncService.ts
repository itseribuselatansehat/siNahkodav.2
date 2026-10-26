/**
 * Service Sinkronisasi Database Real-time (Auto-Refresh 3 Detik)
 * Menghubungkan seluruh browser, tablet, dan smartphone pegawai ke server database SI NAKHODA.
 */

import { Pegawai, MovementLog, LaporDiriRecord } from '../types';

export interface DatabaseState {
  lastUpdated: number;
  pegawai: Pegawai[];
  movementLogs: MovementLog[];
  laporDiriList: LaporDiriRecord[];
}

let lastKnownServerTimestamp = 0;

/**
 * Mengambil snapshot database terbaru dari server
 */
export async function fetchAppDatabase(): Promise<{
  success: boolean;
  data?: DatabaseState;
  hasUpdates: boolean;
}> {
  try {
    const res = await fetch('/api/database', {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    });

    if (!res.ok) {
      return { success: false, hasUpdates: false };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { success: false, hasUpdates: false };
    }

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
  } catch (err) {
    // Silent failover, browser stays operational offline
  }
  return { success: false, hasUpdates: false };
}

/**
 * Menyimpan Check-In Pegawai langsung ke server database
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
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'checkin',
        payload
      })
    });
    const json = await res.json();
    if (json.success) {
      lastKnownServerTimestamp = json.lastUpdated || Date.now();
      return true;
    }
  } catch (e) {
    console.warn('Gagal sinkron check-in ke server database:', e);
  }
  return false;
}

/**
 * Menyimpan Lapor Diri Pegawai langsung ke server database
 */
export async function saveLaporDiriToDatabase(record: LaporDiriRecord): Promise<boolean> {
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'lapordiri',
        payload: record
      })
    });
    const json = await res.json();
    if (json.success) {
      lastKnownServerTimestamp = json.lastUpdated || Date.now();
      return true;
    }
  } catch (e) {
    console.warn('Gagal sinkron lapor diri ke server database:', e);
  }
  return false;
}

/**
 * Menyimpan status cepat kondisi pegawai langsung ke server database
 */
export async function saveQuickStatusToDatabase(payload: {
  pegawaiId: string;
  kondisi: string;
  catatan: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'quick_status',
        payload
      })
    });
    const json = await res.json();
    if (json.success) {
      lastKnownServerTimestamp = json.lastUpdated || Date.now();
      return true;
    }
  } catch (e) {
    console.warn('Gagal sinkron status cepat ke server database:', e);
  }
  return false;
}

/**
 * Menyimpan reset ruangan harian ke server database
 */
export async function saveResetToDatabase(): Promise<boolean> {
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset'
      })
    });
    const json = await res.json();
    if (json.success) {
      lastKnownServerTimestamp = json.lastUpdated || Date.now();
      return true;
    }
  } catch (e) {
    console.warn('Gagal sinkron reset ke server database:', e);
  }
  return false;
}

/**
 * Sinkronisasi penuh semua state lokal ke server database
 */
export async function syncFullDatabaseToServer(data: {
  pegawai: Pegawai[];
  movementLogs: MovementLog[];
  laporDiriList: LaporDiriRecord[];
}): Promise<boolean> {
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_all',
        ...data
      })
    });
    const json = await res.json();
    if (json.success) {
      lastKnownServerTimestamp = json.lastUpdated || Date.now();
      return true;
    }
  } catch (e) {
    console.warn('Gagal sinkron penuh ke server database:', e);
  }
  return false;
}
