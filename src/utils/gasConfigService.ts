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
 * Mengambil konfigurasi GLOBAL dari server (/api/system-config, /api/system-config.php, atau /system_config.json)
 * Memastikan semua browser mendapatkan URL Webhook & Spreadsheet yang sama
 */
export async function fetchGlobalGasConfig(): Promise<SystemGasConfig> {
  const endpoints = [
    '/api/system-config',
    '/api/system-config.php',
    '/system_config.json',
    '/data/system_config.json'
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json') || url.endsWith('.json')) {
          const data = await res.json().catch(() => null);
          if (data) {
            const rawConfig = data.config || (data.webhookUrl !== undefined ? data : null);
            if (rawConfig) {
              const remoteConfig: SystemGasConfig = {
                ...DEFAULT_SYSTEM_CONFIG,
                ...rawConfig
              };
              currentCachedConfig = remoteConfig;
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteConfig));
              } catch (err) {}
              notifyConfigChange(remoteConfig);
              return remoteConfig;
            }
          }
        }
      }
    } catch (err) {
      // Coba endpoint berikutnya
    }
  }

  return getInitialStoredConfig();
}

/**
 * Menyimpan konfigurasi ke SERVER (/api/system-config & /api/system-config.php) agar berlaku untuk SEMUA browser,
 * sekaligus mengupdate localStorage & menyinkronkan ke Google Apps Script Spreadsheet.
 */
export async function saveGlobalGasConfig(
  newConfig: Partial<SystemGasConfig>,
  adminName = 'Administrator'
): Promise<{ success: boolean; message: string; config: SystemGasConfig }> {
  const merged: SystemGasConfig = {
    ...currentCachedConfig,
    ...newConfig,
    updatedAt: new Date().toISOString(),
    updatedBy: adminName
  };

  let serverSaved = false;

  // 1. Simpan ke Backend Server Express (/api/system-config)
  try {
    const res = await fetch('/api/system-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged)
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          serverSaved = true;
        }
      }
    }
  } catch (err) {}

  // 2. Simpan ke Backend Server Hostinger PHP (/api/system-config.php)
  if (!serverSaved) {
    try {
      const phpRes = await fetch('/api/system-config.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      });
      if (phpRes.ok) {
        const data = await phpRes.json().catch(() => null);
        if (data && data.success) {
          serverSaved = true;
        }
      }
    } catch (err) {}
  }

  // 3. Simpan ke Local Storage untuk instant offline cache
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {}

  currentCachedConfig = merged;

  // 4. Notifikasi broadcast ke tab lain di browser ini
  notifyConfigChange(merged);

  // 5. Jika ada Webhook URL Google Apps Script, sinkronkan juga ke Sheet Pengaturan_Sistem
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
      ? '✅ Pengaturan GAS berhasil tersimpan di SERVER & otomatis aktif di SEMUA BROWSER!'
      : '✅ Pengaturan GAS tersimpan di memori browser & spreadsheet Google Apps Script.',
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
