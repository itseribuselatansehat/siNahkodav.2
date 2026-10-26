/**
 * Global System & GAS Configuration Service
 * Menjamin konfigurasi Google Apps Script, Spreadsheet, dan Google Drive
 * tersimpan secara GLOBAL di server sehingga otomatis aktif di SEMUA browser & perangkat.
 */

export const GOOGLE_DRIVE_FOLDER_ID = '1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6';
export const GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6?usp=sharing';

export interface SystemGasConfig {
  webhookUrl: string;
  spreadsheetUrl: string;
  folderId: string;
  folderUrl?: string;
  whatsappApiKey?: string;
  whatsappSender?: string;
  autoResetHour?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_SYSTEM_CONFIG: SystemGasConfig = {
  webhookUrl: '',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
  folderId: GOOGLE_DRIVE_FOLDER_ID,
  folderUrl: GOOGLE_DRIVE_FOLDER_URL,
  whatsappApiKey: '',
  whatsappSender: '081299887766',
  autoResetHour: '00:00',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Sistem'
};

const LOCAL_STORAGE_KEY = 'sinakhoda_gas_config';
const BROADCAST_CHANNEL_NAME = 'sinakhoda_config_channel';

// In-memory cache
let currentCachedConfig: SystemGasConfig = { ...DEFAULT_SYSTEM_CONFIG };

/**
 * Inisialisasi awal membaca dari localStorage jika ada
 */
export function getInitialStoredConfig(): SystemGasConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      currentCachedConfig = {
        ...DEFAULT_SYSTEM_CONFIG,
        ...parsed
      };
      return currentCachedConfig;
    }
  } catch (e) {
    console.warn('Gagal membaca cache lokal sinakhoda_gas_config:', e);
  }
  return currentCachedConfig;
}

/**
 * Mengambil konfigurasi GLOBAL dari server (/api/system-config)
 * Memastikan semua browser mendapatkan URL Webhook & Spreadsheet yang sama
 */
export async function fetchGlobalGasConfig(): Promise<SystemGasConfig> {
  try {
    const res = await fetch('/api/system-config', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return getInitialStoredConfig();
      }
      const data = await res.json();
      if (data && data.success && data.config) {
        const remoteConfig: SystemGasConfig = {
          ...DEFAULT_SYSTEM_CONFIG,
          ...data.config
        };
        currentCachedConfig = remoteConfig;
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteConfig));
        } catch (err) {}
        notifyConfigChange(remoteConfig);
        return remoteConfig;
      }
    }
  } catch (err) {
    console.warn('Tidak dapat menghubungi /api/system-config, menggunakan cache lokal:', err);
  }

  return getInitialStoredConfig();
}

/**
 * Menyimpan konfigurasi ke SERVER (/api/system-config) agar berlaku untuk SEMUA browser,
 * sekaligus mengupdate localStorage & menyinkronkan ke Google Apps Script Spreadsheet.
 */
export async function saveGlobalGasConfig(
  newConfig: Partial<SystemGasConfig>,
  adminName = 'Admin'
): Promise<{ success: boolean; message: string; config: SystemGasConfig }> {
  const merged: SystemGasConfig = {
    ...currentCachedConfig,
    ...newConfig,
    updatedAt: new Date().toISOString(),
    updatedBy: adminName
  };

  let serverSaved = false;

  // 1. Simpan ke Backend Server (Berlaku untuk SEMUA browser di jaringan)
  try {
    const res = await fetch('/api/system-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(merged)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.config) {
        merged.updatedAt = data.config.updatedAt;
      }
      serverSaved = true;
    }
  } catch (err) {
    console.warn('Gagal POST ke /api/system-config server:', err);
  }

  // 2. Simpan ke Local Storage untuk offline / instant cache
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {}

  currentCachedConfig = merged;

  // 3. Notifikasi broadcast ke tab lain di browser ini
  notifyConfigChange(merged);

  // 4. Jika ada Webhook URL Google Apps Script, sinkronkan juga ke Sheet Pengaturan_Sistem
  if (merged.webhookUrl && merged.webhookUrl.startsWith('http')) {
    try {
      fetch(merged.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveSystemConfig',
          config: merged,
          timestamp: new Date().toISOString()
        })
      }).catch((e) => console.warn('Background sync ke spreadsheet gagal:', e));
    } catch (e) {}
  }

  return {
    success: true,
    message: serverSaved
      ? '✅ Pengaturan GAS tersimpan di SERVER & otomatis berlaku di SEMUA BROWSER!'
      : '⚠️ Pengaturan tersimpan di browser ini & dicadangkan di memori aplikasi.',
    config: merged
  };
}

/**
 * Listener untuk memantau perubahan konfigurasi lintas tab/komponen
 */
const listeners: Array<(config: SystemGasConfig) => void> = [];

export function subscribeToGasConfig(callback: (config: SystemGasConfig) => void): () => void {
  listeners.push(callback);
  // Jalankan segera dengan nilai saat ini
  callback(currentCachedConfig);

  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  };
}

function notifyConfigChange(config: SystemGasConfig) {
  listeners.forEach((cb) => {
    try {
      cb(config);
    } catch (e) {}
  });

  // Broadcast ke tab browser lain jika didukung
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage(config);
      bc.close();
    }
  } catch (e) {}
}

// Inisialisasi listener antar tab
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data) {
        currentCachedConfig = {
          ...DEFAULT_SYSTEM_CONFIG,
          ...event.data
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentCachedConfig));
        } catch (e) {}
        listeners.forEach((cb) => cb(currentCachedConfig));
      }
    };
  } catch (e) {}
}
