import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { INITIAL_PEGAWAI_LIST, INITIAL_MOVEMENT_LOGS, INITIAL_LAPOR_DIRI } from './src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  const configFilePath = path.join(__dirname, 'src', 'data', 'system_config.json');
  const databaseFilePath = path.join(__dirname, 'src', 'data', 'app_database.json');

  // Helper untuk membaca file konfigurasi server
  function readServerConfig() {
    try {
      if (fs.existsSync(configFilePath)) {
        const raw = fs.readFileSync(configFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Gagal membaca file konfigurasi server:', e);
    }
    return {
      webhookUrl: '',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      folderId: '1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6',
      folderUrl: 'https://drive.google.com/drive/folders/1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6?usp=sharing',
      whatsappApiKey: '',
      whatsappSender: '081299887766',
      autoResetHour: '00:00',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Sistem'
    };
  }

  // Helper untuk menyimpan konfigurasi ke file server
  function writeServerConfig(data: any) {
    const current = readServerConfig();
    const updated = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    };
    try {
      const dir = path.dirname(configFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(configFilePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (e) {
      console.error('Gagal menulis file konfigurasi server:', e);
    }
    return updated;
  }

  // Helper untuk membaca database aplikasi (Pegawai, MovementLogs, LaporDiri)
  function readAppDatabase() {
    try {
      if (fs.existsSync(databaseFilePath)) {
        const raw = fs.readFileSync(databaseFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.pegawai)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Gagal membaca file database server:', e);
    }

    // Default Seed (Kosongkan data dami agar fokus pada database Google Apps Script)
    const defaultDb = {
      lastUpdated: Date.now(),
      pegawai: [],
      movementLogs: [],
      laporDiriList: []
    };
    try {
      const dir = path.dirname(databaseFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(databaseFilePath, JSON.stringify(defaultDb, null, 2), 'utf-8');
    } catch (e) {}
    return defaultDb;
  }

  // Helper untuk menyimpan database aplikasi
  function writeAppDatabase(updates: any) {
    const current = readAppDatabase();
    const newDb = {
      ...current,
      ...updates,
      lastUpdated: Date.now()
    };
    try {
      const dir = path.dirname(databaseFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(databaseFilePath, JSON.stringify(newDb, null, 2), 'utf-8');
    } catch (e) {
      console.error('Gagal menulis file database server:', e);
    }
    return newDb;
  }

  // ============================================================================
  // REST API ENDPOINTS
  // ============================================================================

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'SI NAKHODA Full-Stack Server',
      timestamp: new Date().toISOString()
    });
  });

  // GET: Ambil Konfigurasi Sistem (Dipanggil oleh semua browser saat dibuka)
  app.get('/api/system-config', (_req: Request, res: Response) => {
    const config = readServerConfig();
    res.json({
      success: true,
      config
    });
  });

  // POST: Simpan Konfigurasi Sistem (Berlaku untuk seluruh browser secara realtime)
  app.post('/api/system-config', async (req: Request, res: Response) => {
    try {
      const newConfig = req.body;
      const updated = writeServerConfig(newConfig);

      // Asinkron: Jika ada webhook GAS, teruskan ke Google Apps Script / Spreadsheet
      if (updated.webhookUrl && updated.webhookUrl.startsWith('http')) {
        fetch(updated.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveSystemConfig',
            config: updated,
            timestamp: new Date().toISOString()
          })
        }).catch((err) => {
          console.warn('Gagal background sync GAS dari server:', err?.message || err);
        });

        // Otomatis tarik data pegawai resmi dari GAS yang baru saja di-deploy
        fetchPegawaiFromGASWebhook(updated.webhookUrl)
          .then((res) => console.log(`✅ Berhasil menarik ${res.count} pegawai resmi dari GAS!`))
          .catch((err) => console.warn('Peringatan tarik pegawai GAS otomatis:', err?.message || err));
      }

      res.json({
        success: true,
        message: 'Konfigurasi GAS berhasil disimpan di server dan sinkron ke seluruh browser!',
        config: updated
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Gagal menyimpan konfigurasi'
      });
    }
  });

  // Helper untuk menarik data pegawai langsung dari Google Apps Script Webhook
  async function fetchPegawaiFromGASWebhook(targetUrl?: string) {
    const config = readServerConfig();
    const webhook = (targetUrl || config.webhookUrl || '').trim();
    if (!webhook || !webhook.startsWith('http')) {
      throw new Error('URL Webhook Google Apps Script belum dikonfigurasi. Silakan masukkan URL Web App GAS Anda.');
    }

    let remotePegawai: any[] = [];

    // 1. Coba via GET ?action=getPegawai
    try {
      const getUrl = webhook.includes('?') ? `${webhook}&action=getPegawai` : `${webhook}?action=getPegawai`;
      const res = await fetch(getUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow'
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && Array.isArray(json.pegawai) && json.pegawai.length > 0) {
          remotePegawai = json.pegawai;
        }
      }
    } catch (e: any) {
      console.warn('GET getPegawai ke GAS gagal, mencoba metode POST:', e?.message || e);
    }

    // 2. Coba via POST { action: 'getPegawai' }
    if (!remotePegawai || remotePegawai.length === 0) {
      try {
        const postRes = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'getPegawai' }),
          redirect: 'follow'
        });
        if (postRes.ok) {
          const json = await postRes.json().catch(() => null);
          if (json && Array.isArray(json.pegawai) && json.pegawai.length > 0) {
            remotePegawai = json.pegawai;
          }
        }
      } catch (e: any) {
        console.warn('POST getPegawai ke GAS gagal:', e?.message || e);
      }
    }

    if (!remotePegawai || remotePegawai.length === 0) {
      throw new Error('Tidak ada data pegawai yang dapat dibaca dari Google Apps Script Spreadsheet. Pastikan script GAS telah di-deploy dengan opsi "Who has access: Anyone".');
    }

    // Format & sanitasi data pegawai dari Google Apps Script
    const formattedPegawai = remotePegawai.map((p: any, idx: number) => ({
      id: p.id || `peg-gas-${idx + 1}`,
      nip: String(p.nip || `1990${String(idx + 1).padStart(4, '0')}`),
      nama: String(p.nama || `Pegawai ${idx + 1}`),
      profesi: p.profesi || 'Staf Administrasi',
      jabatan: p.jabatan || 'Pegawai',
      tempatTugas: p.tempatTugas || 'Puskesmas Kepulauan Seribu Selatan',
      telepon: String(p.telepon || '-'),
      role: p.role || 'pegawai',
      status: p.status || p.statusAwal || 'belum_hadir',
      kondisi: p.kondisi || 'siap_melayani',
      kondisiCatatan: p.kondisiCatatan || 'Siap melayani',
      avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama || 'Pegawai')}&background=0284c7&color=fff&bold=true`
    }));

    // Simpan ke database server dan update lastUpdated
    const currentDb = readAppDatabase();
    const updatedDb = {
      ...currentDb,
      pegawai: formattedPegawai,
      lastUpdated: Date.now()
    };
    writeAppDatabase(updatedDb);

    return {
      success: true,
      count: formattedPegawai.length,
      pegawai: formattedPegawai,
      source: 'Google Apps Script (Deployed)'
    };
  }

  // API Endpoint: Tarik data pegawai langsung dari GAS yang telah di-deploy
  app.all('/api/gas/fetch-pegawai', async (req: Request, res: Response) => {
    try {
      const url = (req.query.url as string) || req.body?.url;
      const result = await fetchPegawaiFromGASWebhook(url);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Gagal memuat data dari Google Apps Script'
      });
    }
  });

  // API Endpoint: Hapus data dami di server & reset ke database GAS
  app.post('/api/database/clear-dummy', async (req: Request, res: Response) => {
    try {
      const config = readServerConfig();
      const webhook = (req.body?.url || config.webhookUrl || '').trim();

      if (webhook && webhook.startsWith('http')) {
        const result = await fetchPegawaiFromGASWebhook(webhook);
        return res.json({
          ...result,
          message: `Data dami dibersihkan! Berhasil memuat ${result.count} data pegawai resmi langsung dari Google Apps Script.`
        });
      }

      // Jika belum ada URL GAS, kosongkan data dami agar siap menerima input GAS
      const emptyDb = {
        lastUpdated: Date.now(),
        pegawai: [],
        movementLogs: [],
        laporDiriList: []
      };
      writeAppDatabase(emptyDb);

      res.json({
        success: true,
        message: 'Data dami lokal berhasil dihapus! Silakan hubungkan Webhook GAS Anda untuk memuat data pegawai resmi.',
        pegawai: []
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Gagal membersihkan data dami'
      });
    }
  });

  // GET: Database Full Sync (Dipanggil setiap 3 detik oleh semua browser untuk autorefresh live)
  app.get('/api/database', (_req: Request, res: Response) => {
    const db = readAppDatabase();
    res.json({
      success: true,
      timestamp: Date.now(),
      lastUpdated: db.lastUpdated,
      data: db
    });
  });

  // POST: Simpan / Perbarui Data ke Database Server (Tersinkronisasi otomatis ke semua perangkat)
  app.post('/api/database', (req: Request, res: Response) => {
    try {
      const { action, pegawai, movementLogs, laporDiriList, payload } = req.body;
      const currentDb = readAppDatabase();

      let updatedDb = { ...currentDb };

      if (action === 'checkin' && payload) {
        // payload: { pegawaiId, tempatKerja, lantai, unitId, unitName, kondisi, catatan, lastCheckinTime, selfieUrl, coordinates, movementLog }
        const { pegawaiId, tempatKerja, lantai, unitId, unitName, kondisi, catatan, lastCheckinTime, selfieUrl, coordinates, movementLog } = payload;
        
        updatedDb.pegawai = updatedDb.pegawai.map((p: any) => {
          if (p.id === pegawaiId) {
            return {
              ...p,
              status: 'hadir',
              kondisi: kondisi || 'siap_melayani',
              kondisiCatatan: catatan || 'Siap melayani',
              currentTempatKerja: tempatKerja,
              currentLantai: lantai,
              currentUnitId: unitId,
              currentUnitName: unitName,
              lastCheckinTime: lastCheckinTime || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              selfieUrl: selfieUrl || p.selfieUrl,
              coordinates: coordinates || p.coordinates
            };
          }
          return p;
        });

        if (movementLog) {
          updatedDb.movementLogs = [movementLog, ...(updatedDb.movementLogs || [])].slice(0, 200);
        }
      } else if (action === 'lapordiri' && payload) {
        // payload: LaporDiriRecord
        updatedDb.laporDiriList = [payload, ...(updatedDb.laporDiriList || [])].slice(0, 300);
      } else if (action === 'quick_status' && payload) {
        // payload: { pegawaiId, kondisi, catatan }
        const { pegawaiId, kondisi, catatan } = payload;
        updatedDb.pegawai = updatedDb.pegawai.map((p: any) => {
          if (p.id === pegawaiId) {
            return {
              ...p,
              kondisi,
              kondisiCatatan: catatan
            };
          }
          return p;
        });
      } else if (action === 'reset') {
        // Reset all rooms
        updatedDb.pegawai = updatedDb.pegawai.map((p: any) => ({
          ...p,
          status: 'belum_hadir',
          kondisi: 'belum_hadir',
          kondisiCatatan: 'Belum check-in hari ini',
          currentTempatKerja: undefined,
          currentLantai: undefined,
          currentUnitId: undefined,
          currentUnitName: undefined,
          lastCheckinTime: undefined
        }));
      } else {
        // Direct merge
        if (Array.isArray(pegawai)) {
          updatedDb.pegawai = pegawai;
        }
        if (Array.isArray(movementLogs)) {
          updatedDb.movementLogs = movementLogs;
        }
        if (Array.isArray(laporDiriList)) {
          updatedDb.laporDiriList = laporDiriList;
        }
      }

      const saved = writeAppDatabase(updatedDb);

      res.json({
        success: true,
        message: 'Database berhasil diperbarui dan disinkronkan ke seluruh browser!',
        timestamp: Date.now(),
        lastUpdated: saved.lastUpdated,
        data: saved
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Gagal menyimpan perubahan database'
      });
    }
  });

  // GET: Database Full Sync (Dipanggil setiap 3 detik oleh semua browser untuk autorefresh live)
  app.get('/api/database', (_req: Request, res: Response) => {
    const db = readAppDatabase();
    res.json({
      success: true,
      timestamp: Date.now(),
      lastUpdated: db.lastUpdated,
      data: db
    });
  });

  // POST: Simpan / Perbarui Data ke Database Server (Tersinkronisasi otomatis ke semua perangkat)
  app.post('/api/database', (req: Request, res: Response) => {
    try {
      const { action, pegawai, movementLogs, laporDiriList, payload } = req.body;
      const currentDb = readAppDatabase();

      let updatedDb = { ...currentDb };

      if (action === 'checkin' && payload) {
        // payload: { pegawaiId, tempatKerja, lantai, unitId, unitName, kondisi, catatan, lastCheckinTime, selfieUrl, coordinates, movementLog }
        const { pegawaiId, tempatKerja, lantai, unitId, unitName, kondisi, catatan, lastCheckinTime, selfieUrl, coordinates, movementLog } = payload;
        
        updatedDb.pegawai = updatedDb.pegawai.map((p: any) => {
          if (p.id === pegawaiId) {
            return {
              ...p,
              status: 'hadir',
              kondisi: kondisi || 'siap_melayani',
              kondisiCatatan: catatan || 'Siap melayani',
              currentTempatKerja: tempatKerja,
              currentLantai: lantai,
              currentUnitId: unitId,
              currentUnitName: unitName,
              lastCheckinTime: lastCheckinTime || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              selfieUrl: selfieUrl || p.selfieUrl,
              coordinates: coordinates || p.coordinates
            };
          }
          return p;
        });

        if (movementLog) {
          updatedDb.movementLogs = [movementLog, ...(updatedDb.movementLogs || [])].slice(0, 200);
        }
      } else if (action === 'lapordiri' && payload) {
        // payload: LaporDiriRecord
        updatedDb.laporDiriList = [payload, ...(updatedDb.laporDiriList || [])].slice(0, 300);
      } else if (action === 'quick_status' && payload) {
        // payload: { pegawaiId, kondisi, catatan }
        const { pegawaiId, kondisi, catatan } = payload;
        updatedDb.pegawai = updatedDb.pegawai.map((p: any) => {
          if (p.id === pegawaiId) {
            return {
              ...p,
              kondisi,
              kondisiCatatan: catatan
            };
          }
          return p;
        });
      } else if (action === 'reset') {
        // Reset all rooms
        updatedDb.pegawai = updatedDb.pegawai.map((p: any) => ({
          ...p,
          status: 'belum_hadir',
          kondisi: 'belum_hadir',
          kondisiCatatan: 'Belum check-in hari ini',
          currentTempatKerja: undefined,
          currentLantai: undefined,
          currentUnitId: undefined,
          currentUnitName: undefined,
          lastCheckinTime: undefined
        }));
      } else {
        // Direct merge
        if (Array.isArray(pegawai)) {
          updatedDb.pegawai = pegawai;
        }
        if (Array.isArray(movementLogs)) {
          updatedDb.movementLogs = movementLogs;
        }
        if (Array.isArray(laporDiriList)) {
          updatedDb.laporDiriList = laporDiriList;
        }
      }

      const saved = writeAppDatabase(updatedDb);

      res.json({
        success: true,
        message: 'Database berhasil diperbarui dan disinkronkan ke seluruh browser!',
        timestamp: Date.now(),
        lastUpdated: saved.lastUpdated,
        data: saved
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Gagal menyimpan perubahan database'
      });
    }
  });

  // ============================================================================
  // VITE DEV SERVER (Dev) / STATIC ASSETS (Prod)
  // ============================================================================
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SI NAKHODA Server aktif di http://0.0.0.0:${PORT}`);
  });
}

startServer();
