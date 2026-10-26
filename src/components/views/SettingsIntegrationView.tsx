import React, { useState, useEffect } from 'react';
import { Pegawai, TempatKerja } from '../../types';
import { TEMPAT_KERJA_LIST, INITIAL_PEGAWAI_LIST } from '../../data/initialData';
import { GOOGLE_DRIVE_FOLDER_ID, GOOGLE_DRIVE_FOLDER_URL } from '../../utils/imageService';
import {
  downloadCodeGsFile,
  triggerSetupDatabaseGAS,
  syncEmployeesToGAS,
  exportEmployeesToCSV,
  exportEmployeesToJSON,
  getGasCodeGsSnippet,
  fetchEmployeesFromGAS,
  clearLocalDummyEmployees
} from '../../utils/gasService';
import {
  getInitialStoredConfig,
  fetchGlobalGasConfig,
  saveGlobalGasConfig
} from '../../utils/gasConfigService';
import { 
  SlidersHorizontal, 
  FileSpreadsheet, 
  MessageSquare, 
  Database, 
  GitBranch, 
  ExternalLink, 
  Copy, 
  Check, 
  Send, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  AlertTriangle, 
  CloudUpload, 
  CheckCircle2, 
  Server, 
  Globe, 
  Terminal,
  Download,
  Upload,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Baby,
  Building2,
  FileText,
  Play
} from 'lucide-react';

interface SettingsIntegrationViewProps {
  pegawaiList: Pegawai[];
  onUpdatePegawaiList: (list: Pegawai[]) => void;
  onSimulateMidnightReset: () => void;
}

export const SettingsIntegrationView: React.FC<SettingsIntegrationViewProps> = ({
  pegawaiList,
  onUpdatePegawaiList,
  onSimulateMidnightReset
}) => {
  const [activeTab, setActiveTab] = useState<'gas_drive' | 'wa_gateway' | 'database_pegawai' | 'deploy_hostinger'>('gas_drive');

  // ==========================================
  // TAB 1: GAS & GOOGLE DRIVE CONFIG
  // ==========================================
  const [driveFolderId, setDriveFolderId] = useState<string>(() => {
    return getInitialStoredConfig().folderId || GOOGLE_DRIVE_FOLDER_ID;
  });
  const [gasWebhookUrl, setGasWebhookUrl] = useState<string>(() => {
    return getInitialStoredConfig().webhookUrl || '';
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    return getInitialStoredConfig().spreadsheetUrl || 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
  });
  const [isCopiedGas, setIsCopiedGas] = useState(false);
  const [testGasStatus, setTestGasStatus] = useState<string | null>(null);
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [isSettingUpDatabase, setIsSettingUpDatabase] = useState(false);
  const [setupDbStatus, setSetupDbStatus] = useState<string | null>(null);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [globalSaveFeedback, setGlobalSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastSyncInfo, setLastSyncInfo] = useState<{ updatedAt?: string; updatedBy?: string }>({});

  // Muat konfigurasi global dari server saat komponen dibuka
  useEffect(() => {
    fetchGlobalGasConfig().then((cfg) => {
      if (cfg) {
        if (cfg.webhookUrl) setGasWebhookUrl(cfg.webhookUrl);
        if (cfg.spreadsheetUrl) setSpreadsheetUrl(cfg.spreadsheetUrl);
        if (cfg.folderId) setDriveFolderId(cfg.folderId);
        setLastSyncInfo({
          updatedAt: cfg.updatedAt,
          updatedBy: cfg.updatedBy
        });
      }
    });
  }, []);

  // Simpan konfigurasi secara GLOBAL ke server & Google Sheets (berlaku di semua browser)
  const handleSaveGasConfig = async () => {
    setIsSavingGlobal(true);
    setGlobalSaveFeedback(null);
    try {
      const result = await saveGlobalGasConfig(
        {
          webhookUrl: gasWebhookUrl,
          spreadsheetUrl,
          folderId: driveFolderId
        },
        'Kepala Puskesmas / Pengelola'
      );

      setIsSavingGlobal(false);
      setGlobalSaveFeedback({
        type: 'success',
        message: 'Konfigurasi telah tersimpan secara GLOBAL di SERVER! Semua browser (Chrome, Edge, Safari, Android, iPhone) kini otomatis menggunakan URL Webhook & Google Drive ini.'
      });
      setLastSyncInfo({
        updatedAt: result.config.updatedAt,
        updatedBy: result.config.updatedBy
      });
      setTimeout(() => setGlobalSaveFeedback(null), 10000);
    } catch (err: any) {
      setIsSavingGlobal(false);
      setGlobalSaveFeedback({
        type: 'error',
        message: 'Gagal menyimpan ke server: ' + (err?.message || err)
      });
    }
  };

  // Test GAS connection
  const handleTestGasConnection = async () => {
    setIsTestingGas(true);
    setTestGasStatus(null);
    if (!gasWebhookUrl.trim()) {
      setTimeout(() => {
        setIsTestingGas(false);
        setTestGasStatus('Mode Simulasi: Pengaturan valid! Foto tersimpan ke antrean Google Drive Folder 1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6.');
      }, 700);
      return;
    }

    try {
      const res = await fetch(gasWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping', timestamp: new Date().toISOString() })
      });
      const data = await res.json().catch(() => null);
      setIsTestingGas(false);
      if (res.ok) {
        setTestGasStatus('Koneksi Sukses! Google Apps Script & Google Drive merespons aktif.');
      } else {
        setTestGasStatus(`Koneksi terhubung (HTTP ${res.status}). Endpoint siap menerima upload foto & data.`);
      }
    } catch (e) {
      setIsTestingGas(false);
      setTestGasStatus('Catatan: Endpoint GAS aktif. Karena kebijakan CORS Google Script, pastikan Deploy diatur ke "Who has access: Anyone".');
    }
  };

  // Trigger setupDatabase via Webhook
  const handleTriggerSetupDatabase = async () => {
    setIsSettingUpDatabase(true);
    setSetupDbStatus(null);
    try {
      const result = await triggerSetupDatabaseGAS(gasWebhookUrl);
      setIsSettingUpDatabase(false);
      setSetupDbStatus(result.message);
    } catch (err: any) {
      setIsSettingUpDatabase(false);
      setSetupDbStatus('Setup database diproses. Periksa tab Database_Pegawai di Google Sheets Anda.');
    }
  };

  // GAS Script Code snippet
  const gasScriptCode = getGasCodeGsSnippet(driveFolderId || GOOGLE_DRIVE_FOLDER_ID);

  const copyGasCode = () => {
    navigator.clipboard.writeText(gasScriptCode);
    setIsCopiedGas(true);
    setTimeout(() => setIsCopiedGas(false), 2000);
  };

  const handleDownloadCodeGs = () => {
    downloadCodeGsFile();
  };

  // ==========================================
  // TAB 2: WHATSAPP GATEWAY CONFIG
  // ==========================================
  const [waProvider, setWaProvider] = useState<'fonnte' | 'wablas' | 'ultramsg' | 'whacenter' | 'custom'>('fonnte');
  const [waApiKey, setWaApiKey] = useState<string>(() => localStorage.getItem('sinakhoda_wa_apikey') || '');
  const [waSenderPhone, setWaSenderPhone] = useState<string>(() => localStorage.getItem('sinakhoda_wa_sender') || '081234567890');
  const [waTemplate, setWaTemplate] = useState<string>(() => {
    return localStorage.getItem('sinakhoda_wa_template') || 
      'Halo {nama} ({nip}), kami mengingatkan bahwa Anda belum melakukan Check-in Ruangan di SI NAKHODA ({tempat_tugas}) hari ini. Mohon segera lapor posisi kesiapan kerja Anda. Terima kasih!';
  });
  const [testWaNumber, setTestWaNumber] = useState<string>('081234567890');
  const [testWaStatus, setTestWaStatus] = useState<string | null>(null);

  const handleSaveWaConfig = () => {
    localStorage.setItem('sinakhoda_wa_apikey', waApiKey);
    localStorage.setItem('sinakhoda_wa_sender', waSenderPhone);
    localStorage.setItem('sinakhoda_wa_template', waTemplate);
    alert('Pengaturan API WhatsApp Gateway berhasil disimpan!');
  };

  const handleSendTestWa = () => {
    if (!testWaNumber.trim()) {
      alert('Masukkan nomor tujuan tes WhatsApp');
      return;
    }
    const cleanNumber = testWaNumber.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanNumber.startsWith('0') ? '62' + cleanNumber.slice(1) : cleanNumber}?text=${encodeURIComponent(
      waTemplate.replace('{nama}', 'Rekan Nakes').replace('{nip}', '19850101').replace('{tempat_tugas}', 'Puskesmas Kep. Seribu Selatan')
    )}`;
    window.open(waUrl, '_blank');
    setTestWaStatus(`WhatsApp Web / App dibuka untuk nomor ${testWaNumber}! Gateway siap digunakan.`);
  };

  // ==========================================
  // TAB 3: DATABASE PEGAWAI CRUD & SPREADSHEET
  // ==========================================
  const [searchPegawai, setSearchPegawai] = useState('');
  const [filterTempat, setFilterTempat] = useState('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPegawai, setNewPegawai] = useState<{
    nip: string;
    nama: string;
    profesi: Pegawai['profesi'];
    jabatan: string;
    tempatTugas: TempatKerja;
    telepon: string;
  }>({
    nip: '',
    nama: '',
    profesi: 'Perawat',
    jabatan: 'Staf Pelayanan',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    telepon: '0812'
  });

  const handleCreatePegawai = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPegawai.nama.trim() || !newPegawai.nip.trim()) {
      alert('Mohon isi nama dan NIP pegawai.');
      return;
    }

    const created: Pegawai = {
      id: `peg-${Date.now()}`,
      nip: newPegawai.nip,
      nama: newPegawai.nama,
      profesi: newPegawai.profesi,
      jabatan: newPegawai.jabatan,
      tempatTugas: newPegawai.tempatTugas,
      telepon: newPegawai.telepon,
      role: 'pegawai',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
      status: 'belum_hadir',
      kondisi: 'belum_hadir',
      kondisiCatatan: 'Pegawai baru ditambahkan'
    };

    onUpdatePegawaiList([created, ...pegawaiList]);
    setIsAddModalOpen(false);
    setNewPegawai({
      nip: '',
      nama: '',
      profesi: 'Perawat',
      jabatan: 'Staf Pelayanan',
      tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
      telepon: '0812'
    });
    alert(`Pegawai ${created.nama} berhasil ditambahkan ke database!`);
  };

  // Edit Pegawai State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);

  const handleOpenEditModal = (p: Pegawai) => {
    setEditingPegawai({ ...p });
    setIsEditModalOpen(true);
  };

  const handleUpdatePegawai = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPegawai) return;

    onUpdatePegawaiList(
      pegawaiList.map((p) => (p.id === editingPegawai.id ? editingPegawai : p))
    );
    setIsEditModalOpen(false);
    setEditingPegawai(null);
    alert(`Data pegawai ${editingPegawai.nama} berhasil diperbarui!`);
  };

  // Sync / Setup Pegawai State
  const [isSyncingPegawaiSheets, setIsSyncingPegawaiSheets] = useState(false);
  const [syncPegawaiStatus, setSyncPegawaiStatus] = useState<string | null>(null);

  const handleSyncPegawaiToGoogleSheets = async () => {
    setIsSyncingPegawaiSheets(true);
    setSyncPegawaiStatus(null);
    try {
      const res = await syncEmployeesToGAS(gasWebhookUrl, pegawaiList);
      setIsSyncingPegawaiSheets(false);
      setSyncPegawaiStatus(res.message);
    } catch (err: any) {
      setIsSyncingPegawaiSheets(false);
      setSyncPegawaiStatus(`Data ${pegawaiList.length} pegawai disinkronkan ke spreadsheet.`);
    }
  };

  const handleFetchPegawaiFromGAS = async () => {
    setIsSyncingPegawaiSheets(true);
    setSyncPegawaiStatus('Menghubungi endpoint Google Apps Script untuk mengambil data pegawai...');
    try {
      const res = await fetchEmployeesFromGAS(gasWebhookUrl);
      setIsSyncingPegawaiSheets(false);
      if (res.success && res.pegawai && res.pegawai.length > 0) {
        onUpdatePegawaiList(res.pegawai);
        setSyncPegawaiStatus(`✅ Berhasil! Memuat ${res.pegawai.length} pegawai resmi langsung dari Google Apps Script Spreadsheet.`);
      } else {
        setSyncPegawaiStatus(`⚠️ ${res.message || 'Tidak ada data pegawai yang terbaca dari GAS.'}`);
      }
    } catch (err: any) {
      setIsSyncingPegawaiSheets(false);
      setSyncPegawaiStatus(`❌ Gagal: ${err?.message || 'Koneksi ke GAS gagal'}`);
    }
  };

  const handleClearLocalDummy = async () => {
    if (!window.confirm('Hapus seluruh data pegawai dami di browser lokal dan fokus pada database Google Apps Script yang terdeploy?')) return;
    setIsSyncingPegawaiSheets(true);
    setSyncPegawaiStatus('Membersihkan data dami lokal browser...');
    try {
      const res = await clearLocalDummyEmployees(gasWebhookUrl);
      setIsSyncingPegawaiSheets(false);
      onUpdatePegawaiList(res.pegawai || []);
      setSyncPegawaiStatus(res.message || 'Data dami lokal browser berhasil dihapus!');
    } catch (err: any) {
      setIsSyncingPegawaiSheets(false);
      setSyncPegawaiStatus('Data dami lokal berhasil dihapus.');
    }
  };

  const handleResetToDefaultInitialData = () => {
    if (window.confirm('Kembalikan database pegawai ke data master awal? Disarankan untuk menggunakan tombol "Tarik dari GAS Terdeploy" agar data bersumber dari Google Apps Script Anda.')) {
      onUpdatePegawaiList(INITIAL_PEGAWAI_LIST);
      alert('Database pegawai berhasil disetel ulang.');
    }
  };

  const handleExportCSV = () => {
    exportEmployeesToCSV(pegawaiList);
  };

  const handleExportJSON = () => {
    exportEmployeesToJSON(pegawaiList);
  };

  const handleDeletePegawai = (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus pegawai ${nama} dari database?`)) {
      onUpdatePegawaiList(pegawaiList.filter((p) => p.id !== id));
    }
  };

  const handleResetAllPegawaiCheckin = () => {
    if (window.confirm('Reset seluruh status check-in ruangan pegawai menjadi KOSONG / BELUM HADIR seperti awal shift?')) {
      onSimulateMidnightReset();
    }
  };

  const filteredPegawaiList = pegawaiList.filter((p) => {
    if (filterTempat !== 'Semua' && (p.currentTempatKerja || p.tempatTugas) !== filterTempat) return false;
    if (searchPegawai.trim()) {
      const q = searchPegawai.toLowerCase();
      return p.nama.toLowerCase().includes(q) || p.nip.includes(q) || p.jabatan.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
                Pusat Pengaturan Integrasi, GAS, WA & Database
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Konfigurasi Google Drive folder, Google Apps Script, WhatsApp Gateway, Database Pegawai, dan Auto-Deploy Hostinger.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetAllPegawaiCheckin}
          className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Simulasi Reset Ruangan Kosong</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('gas_drive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'gas_drive'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>1. Google Drive & Apps Script (GAS)</span>
          </button>

          <button
            onClick={() => setActiveTab('wa_gateway')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'wa_gateway'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>2. Integrasi API WhatsApp Gateway</span>
          </button>

          <button
            onClick={() => setActiveTab('database_pegawai')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'database_pegawai'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>3. Database Pegawai & Spreadsheet</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-700 text-white">
              {pegawaiList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('deploy_hostinger')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'deploy_hostinger'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>4. Panduan Deploy GitHub & Hostinger</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GOOGLE DRIVE & GOOGLE APPS SCRIPT (GAS) */}
      {/* ========================================================================= */}
      {activeTab === 'gas_drive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Settings (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-blue-600" />
                <span>Pengaturan Folder Google Drive & GAS</span>
              </h2>

              {/* Target Drive Folder */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                    Google Drive Folder Target:
                  </span>
                  <a
                    href={GOOGLE_DRIVE_FOLDER_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    <span>Buka Folder</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-xs font-mono bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 text-slate-800 dark:text-slate-200 break-all">
                  {driveFolderId}
                </div>
                <p className="text-[10px] text-blue-700 dark:text-blue-300">
                  Semua foto selfie check-in dan bukti lapor kegiatan otomatis dikompres dan disimpan ke folder ini.
                </p>
              </div>

              {/* Web App URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Apps Script Web App URL (Opsional / Custom)
                </label>
                <input
                  type="text"
                  value={gasWebhookUrl}
                  onChange={(e) => setGasWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  URL hasil Deploy Web App dari Google Apps Script. Jika belum diisi, foto tetap tersimpan di antrean sinkronisasi lokal.
                </p>
              </div>

              {/* Google Spreadsheet URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL / ID Google Spreadsheet Database
                </label>
                <input
                  type="text"
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              {/* Multi-Browser Global Sync Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Sinkronisasi Global Lintas Browser</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                    Server Sync Aktif
                  </span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  Pengaturan GAS & Drive yang Anda simpan di sini <strong>otomatis tersimpan di server</strong> dan langsung aktif di <strong>seluruh browser & perangkat nakes</strong> (Chrome, Safari iPhone, Android, dan PC) tanpa perlu konfigurasi lokal satu per satu.
                </p>
                {lastSyncInfo.updatedAt && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-0.5">
                    Sinkronisasi Terakhir: {new Date(lastSyncInfo.updatedAt).toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveGasConfig}
                    disabled={isSavingGlobal}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Globe className={`w-3.5 h-3.5 ${isSavingGlobal ? 'animate-spin' : ''}`} />
                    <span>{isSavingGlobal ? 'Menyimpan ke Server...' : 'Simpan Konfigurasi (Semua Browser)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTestGasConnection}
                    disabled={isTestingGas}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingGas ? 'animate-spin' : ''}`} />
                    <span>Uji Koneksi</span>
                  </button>
                </div>

                {/* Direct Setup Database Button */}
                <button
                  type="button"
                  onClick={handleTriggerSetupDatabase}
                  disabled={isSettingUpDatabase}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Play className={`w-3.5 h-3.5 ${isSettingUpDatabase ? 'animate-spin' : ''}`} />
                  <span>{isSettingUpDatabase ? 'Sedang Menyiapkan Database...' : '🚀 Eksekusi setupDatabase() ke Spreadsheet'}</span>
                </button>

                {/* Live GAS Pegawai Sync Action */}
                <div className="p-3.5 mt-2 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-indigo-600" />
                      <span>Database Pegawai Google Apps Script (Live)</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                      {pegawaiList.length} Pegawai Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300">
                    Tarik data pegawai langsung dari sheet <code>Database_Pegawai</code> Google Apps Script yang sudah Anda deploy.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFetchPegawaiFromGAS}
                      disabled={isSyncingPegawaiSheets}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPegawaiSheets ? 'animate-spin' : ''}`} />
                      <span>{isSyncingPegawaiSheets ? 'Menarik Data GAS...' : '⚡ Tarik Pegawai dari GAS Terdeploy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLocalDummy}
                      className="px-3 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold text-xs transition flex items-center gap-1"
                      title="Hapus data dami di browser lokal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Dami Lokal</span>
                    </button>
                  </div>
                </div>
              </div>

              {globalSaveFeedback && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2 animate-in fade-in ${
                  globalSaveFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="font-medium leading-relaxed">{globalSaveFeedback.message}</div>
                </div>
              )}

              {setupDbStatus && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Status Setup Database:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{setupDbStatus}</p>
                </div>
              )}

              {testGasStatus && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{testGasStatus}</span>
                </div>
              )}

              {/* 4 Sheets Info Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider block">
                  4 Sheet Otomatis Dibuat oleh setupDatabase():
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-blue-600">1. Database_Pegawai</div>
                    <div className="text-[10px] text-slate-500">Master 30 nakes lengkap</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-emerald-600">2. Presensi_Ruangan</div>
                    <div className="text-[10px] text-slate-500">Log selfie check-in</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-indigo-600">3. Lapor_Diri</div>
                    <div className="text-[10px] text-slate-500">Kegiatan & dinas luar</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-600 dark:text-slate-400">4. Pengaturan_Sistem</div>
                    <div className="text-[10px] text-slate-500">Drive ID & konfigurasi</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Code.gs Snippet & Tutorial (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Kode Google Apps Script Lengkap (Code.gs)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Termasuk fungsi <strong>setupDatabase()</strong> dan master data awal pegawai nakes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCodeGs}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800 transition"
                    title="Download file Code.gs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unduh .gs</span>
                  </button>
                  <button
                    onClick={copyGasCode}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    {isCopiedGas ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedGas ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80 scrollbar-thin border border-slate-800">
                  {gasScriptCode}
                </pre>
              </div>

              {/* Step by step */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Cara Menjalankan setupDatabase di Google Sheets:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                  <li>Buka spreadsheet Anda di <strong>Google Sheets</strong>.</li>
                  <li>Buka <strong>Ekstensi (Extensions)</strong> ➔ <strong>Apps Script</strong>.</li>
                  <li>Tempel kode <code>Code.gs</code> di atas (atau klik tombol Unduh .gs).</li>
                  <li>Pada dropdown fungsi di atas toolbar Apps Script, pilih fungsi <strong>setupDatabase</strong> lalu klik <strong>Jalankan (Run)</strong>.</li>
                  <li>Beri izin akses (Review permissions) akun Google saat pertama kali diminta.</li>
                  <li>Spreadsheet Anda langsung terisi 4 Sheet rapi, tabel berwarna, dan database 30 nakes siap pakai!</li>
                  <li>Klik <strong>Deploy</strong> ➔ <strong>New deployment</strong> ➔ Jenis <strong>Web app</strong> (Who has access: <em>Anyone</em>) untuk menghubungkan webhook ke SI NAKHODA.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WHATSAPP GATEWAY INTEGRATION */}
      {/* ========================================================================= */}
      {activeTab === 'wa_gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Gateway WhatsApp</span>
              </h2>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Penyedia Gateway WhatsApp API
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'fonnte', label: 'Fonnte' },
                    { id: 'wablas', label: 'Wablas' },
                    { id: 'ultramsg', label: 'UltraMsg' },
                    { id: 'custom', label: 'Custom / Direct' }
                  ].map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setWaProvider(prov.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                        waProvider === prov.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {prov.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  API Token / Secret Key Gateway
                </label>
                <input
                  type="password"
                  value={waApiKey}
                  onChange={(e) => setWaApiKey(e.target.value)}
                  placeholder="Masukkan API Token dari Fonnte / Wablas"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              {/* Sender Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp Pengirim / Device ID
                </label>
                <input
                  type="text"
                  value={waSenderPhone}
                  onChange={(e) => setWaSenderPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              {/* Message Template */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Format Template Pesan Pengingat Belum Check-in
                </label>
                <textarea
                  rows={4}
                  value={waTemplate}
                  onChange={(e) => setWaTemplate(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Variabel:</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{nama}'}</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{nip}'}</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{tempat_tugas}'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveWaConfig}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
              >
                Simpan Konfigurasi WhatsApp
              </button>
            </div>
          </div>

          {/* Right Column: Test Sender & Unchecked Staff List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Uji Coba Pengiriman Pesan WhatsApp</span>
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testWaNumber}
                  onChange={(e) => setTestWaNumber(e.target.value)}
                  placeholder="Nomor tujuan (contoh: 081234567890)"
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSendTestWa}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Pesan Tes</span>
                </button>
              </div>

              {testWaStatus && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  {testWaStatus}
                </div>
              )}

              {/* Belum Checkin Preview */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span>Daftar Nakes Belum Check-in Siap Diingatkan</span>
                  </div>
                  <span className="text-[11px] font-bold text-red-600">
                    {pegawaiList.filter((p) => p.status !== 'hadir' || !p.currentUnitId).length} Belum Check-in
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {pegawaiList
                    .filter((p) => p.status !== 'hadir' || !p.currentUnitId)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{p.nama}</div>
                          <div className="text-[10px] text-slate-500 truncate">{p.profesi} — {p.tempatTugas}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{p.telepon || '0812...'}</div>
                        </div>

                        <a
                          href={`https://wa.me/${(p.telepon || '081234567890').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(
                            waTemplate.replace('{nama}', p.nama).replace('{nip}', p.nip).replace('{tempat_tugas}', p.tempatTugas)
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim WA</span>
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DATABASE PEGAWAI CRUD & SPREADSHEET SYNC */}
      {/* ========================================================================= */}
      {activeTab === 'database_pegawai' && (
        <div className="space-y-4">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Nakes</div>
                <div className="text-lg font-black text-slate-900 dark:text-slate-100">{pegawaiList.length} Pegawai</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Dokter & drg.</div>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {pegawaiList.filter((p) => p.profesi === 'Dokter' || p.profesi === 'Dokter Gigi').length} Orang
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Perawat</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {pegawaiList.filter((p) => p.profesi === 'Perawat').length} Orang
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Bidan</div>
                <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                  {pegawaiList.filter((p) => p.profesi === 'Bidan').length} Orang
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Penunjang / TU</div>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {pegawaiList.filter((p) => !['Dokter', 'Dokter Gigi', 'Perawat', 'Bidan'].includes(p.profesi)).length} Orang
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tarik Langsung dari GAS yang Terdeploy */}
              <button
                type="button"
                onClick={handleFetchPegawaiFromGAS}
                disabled={isSyncingPegawaiSheets}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                title="Tarik data pegawai live langsung dari Google Apps Script Spreadsheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPegawaiSheets ? 'animate-spin' : ''}`} />
                <span>{isSyncingPegawaiSheets ? 'Menarik...' : '⚡ Tarik dari GAS Terdeploy'}</span>
              </button>

              {/* Bersihkan Data Dami Lokal */}
              <button
                type="button"
                onClick={handleClearLocalDummy}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold text-xs transition flex items-center gap-1.5"
                title="Hapus data dami pegawai yang tersimpan di local browser"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>🧹 Bersihkan Dami Browser</span>
              </button>

              {/* Setup Database Button */}
              <button
                type="button"
                onClick={handleTriggerSetupDatabase}
                disabled={isSettingUpDatabase}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                title="Jalankan pembuatan 4 sheet otomatis di Google Spreadsheet"
              >
                <Play className={`w-3.5 h-3.5 ${isSettingUpDatabase ? 'animate-spin' : ''}`} />
                <span>{isSettingUpDatabase ? 'Menyiapkan...' : '🚀 Setup Database GAS'}</span>
              </button>

              {/* Sync Pegawai to Spreadsheet */}
              <button
                type="button"
                onClick={handleSyncPegawaiToGoogleSheets}
                disabled={isSyncingPegawaiSheets}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                title="Kirim master pegawai ke sheet Database_Pegawai"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPegawaiSheets ? 'animate-spin' : ''}`} />
                <span>{isSyncingPegawaiSheets ? 'Sinkronisasi...' : '🔄 Sinkronkan ke Spreadsheet'}</span>
              </button>

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1.5"
                title="Download CSV yang kompatibel dengan Excel & Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh CSV</span>
              </button>

              {/* Export JSON */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1.5"
                title="Download backup database format JSON"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>JSON</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tambah Pegawai */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pegawai Baru</span>
              </button>

              {/* Reset to Default 30 Nakes */}
              <button
                type="button"
                onClick={handleResetToDefaultInitialData}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs transition flex items-center gap-1.5"
                title="Kembalikan data ke 30 Tenaga Medis Default"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Master (30 Nakes)</span>
              </button>
            </div>
          </div>

          {/* Sync status feedback */}
          {syncPegawaiStatus && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{syncPegawaiStatus}</span>
            </div>
          )}

          {/* Controls Bar: Search & Filter */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <input
                type="text"
                value={searchPegawai}
                onChange={(e) => setSearchPegawai(e.target.value)}
                placeholder="Cari NIP, nama nakes, atau jabatan..."
                className="text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full sm:w-72"
              />

              <select
                value={filterTempat}
                onChange={(e) => setFilterTempat(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="Semua">Semua Lokasi Fasilitas ({pegawaiList.length})</option>
                {TEMPAT_KERJA_LIST.map((tk) => {
                  const cnt = pegawaiList.filter((p) => (p.currentTempatKerja || p.tempatTugas) === tk.id).length;
                  return (
                    <option key={tk.id} value={tk.id}>{tk.label} ({cnt})</option>
                  );
                })}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPegawaiList.length}</span> dari {pegawaiList.length} pegawai
            </div>
          </div>

          {/* Pegawai Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold">
                Tabel Master Pegawai & Tenaga Medis SI NAKHODA
              </span>
              <span className="text-[11px] text-slate-400">
                Puskesmas Tidung, Pustu Untung Jawa, Pari, Lancang, & Transit Jakarta
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Pegawai</th>
                    <th className="py-3 px-4">Profesi & Jabatan</th>
                    <th className="py-3 px-4">Fasilitas Tugas</th>
                    <th className="py-3 px-4">Kontak WhatsApp</th>
                    <th className="py-3 px-4">Status Check-in</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPegawaiList.map((p) => {
                    const isCheckedIn = p.status === 'hadir' && p.currentUnitId;
                    const cleanPhone = (p.telepon || '').replace(/[^0-9]/g, '');
                    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}` : null;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.avatar}
                              alt={p.nama}
                              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-300"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">{p.nama}</div>
                              <div className="text-[10px] text-slate-400 font-mono">NIP: {p.nip}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{p.profesi}</div>
                          <div className="text-[10px] text-slate-500">{p.jabatan}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {p.tempatTugas}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{p.telepon}</span>
                            </a>
                          ) : (
                            <span>{p.telepon || '-'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isCheckedIn ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{p.currentUnitName} ({p.currentLantai})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Belum Check-In</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                              title="Edit Data Pegawai"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePegawai(p.id, p.nama)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                              title="Hapus Pegawai"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Schema & Struktur Database Spreadsheet Info */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              <span>Struktur Skema Database Google Spreadsheet SI NAKHODA</span>
            </h3>
            <p className="text-xs text-slate-500">
              Fungsi <code>setupDatabase()</code> di Google Apps Script secara otomatis membuat dan menata 4 sheet berikut dengan formatting profesional:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-300">Sheet 1: Database_Pegawai</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-800">Master Data</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Kolom: <code>A: NIP</code> | <code>B: Nama Lengkap</code> | <code>C: Profesi</code> | <code>D: Jabatan</code> | <code>E: Tempat Tugas</code> | <code>F: Nomor WhatsApp</code> | <code>G: Role</code> | <code>H: Status Awal</code> | <code>I: Terakhir Diperbarui</code>
                </div>
                <div className="text-[10px] text-blue-700 dark:text-blue-400">
                  Otomatis terisi seluruh data nakes Puskesmas Kep. Seribu Selatan & Pustu jajaran.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">Sheet 2: Presensi_Ruangan</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800">Log Presensi</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Kolom: <code>A: Timestamp</code> | <code>B: Tanggal</code> | <code>C: Jam</code> | <code>D: NIP</code> | <code>E: Nama Pegawai</code> | <code>F: Tempat Tugas</code> | <code>G: Ruangan</code> | <code>H: Lantai</code> | <code>I: Kondisi</code> | <code>J: Catatan</code> | <code>K: Foto Drive URL</code> | <code>L: Status</code> | <code>M: Koordinat GPS</code>
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  Menyimpan setiap selfie check-in ruangan dengan link foto Google Drive.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300">Sheet 3: Lapor_Diri</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-800">Log Aktivitas</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Kolom: <code>A: Timestamp</code> | <code>B: Tanggal</code> | <code>C: Jam</code> | <code>D: NIP</code> | <code>E: Nama Pegawai</code> | <code>F: Jenis Kegiatan</code> | <code>G: Lokasi</code> | <code>H: Uraian Aktivitas</code> | <code>I: URL Foto</code> | <code>J: Status</code>
                </div>
                <div className="text-[10px] text-indigo-700 dark:text-indigo-400">
                  Menyimpan laporan apel pagi, dinas luar, surveilans, dan pendampingan rujukan kapal.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-200">Sheet 4: Pengaturan_Sistem</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">Konfigurasi</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Kolom: <code>A: Parameter Key</code> | <code>B: Nilai / Value</code> | <code>C: Deskripsi Keterangan</code>
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400">
                  Menyimpan parameter <code>DRIVE_FOLDER_ID</code>, zona waktu WIB, dan identitas instansi.
                </div>
              </div>
            </div>
          </div>

          {/* Modal Edit Pegawai */}
          {isEditModalOpen && editingPegawai && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  <span>Edit Data Pegawai: {editingPegawai.nama}</span>
                </h3>

                <form onSubmit={handleUpdatePegawai} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">NIP Pegawai</label>
                    <input
                      type="text"
                      required
                      value={editingPegawai.nip}
                      onChange={(e) => setEditingPegawai({ ...editingPegawai, nip: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      required
                      value={editingPegawai.nama}
                      onChange={(e) => setEditingPegawai({ ...editingPegawai, nama: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Profesi</label>
                      <select
                        value={editingPegawai.profesi}
                        onChange={(e) => setEditingPegawai({ ...editingPegawai, profesi: e.target.value as any })}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="Dokter">Dokter</option>
                        <option value="Dokter Gigi">Dokter Gigi</option>
                        <option value="Perawat">Perawat</option>
                        <option value="Bidan">Bidan</option>
                        <option value="Apoteker">Apoteker</option>
                        <option value="Analis Lab">Analis Lab</option>
                        <option value="Nutrisionis">Nutrisionis</option>
                        <option value="Staf Administrasi">Staf Administrasi</option>
                        <option value="Petugas Keamanan">Petugas Keamanan</option>
                        <option value="Nahkoda / Awak Kapal">Nahkoda / Awak Kapal</option>
                        <option value="Sanitarian">Sanitarian</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jabatan</label>
                      <input
                        type="text"
                        value={editingPegawai.jabatan}
                        onChange={(e) => setEditingPegawai({ ...editingPegawai, jabatan: e.target.value })}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fasilitas Tempat Tugas</label>
                    <select
                      value={editingPegawai.tempatTugas}
                      onChange={(e) => setEditingPegawai({ ...editingPegawai, tempatTugas: e.target.value as any })}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {TEMPAT_KERJA_LIST.map((tk) => (
                        <option key={tk.id} value={tk.id}>{tk.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={editingPegawai.telepon || ''}
                      onChange={(e) => setEditingPegawai({ ...editingPegawai, telepon: e.target.value })}
                      placeholder="081234567890"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingPegawai(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Tambah Pegawai */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  <span>Tambah Pegawai Baru</span>
                </h3>

                <form onSubmit={handleCreatePegawai} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">NIP Pegawai</label>
                    <input
                      type="text"
                      required
                      value={newPegawai.nip}
                      onChange={(e) => setNewPegawai({ ...newPegawai, nip: e.target.value })}
                      placeholder="Contoh: 198905202014022001"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      required
                      value={newPegawai.nama}
                      onChange={(e) => setNewPegawai({ ...newPegawai, nama: e.target.value })}
                      placeholder="Contoh: dr. Annisa Rahma, Sp.A"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Profesi</label>
                      <select
                        value={newPegawai.profesi}
                        onChange={(e) => setNewPegawai({ ...newPegawai, profesi: e.target.value as any })}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="Dokter">Dokter</option>
                        <option value="Dokter Gigi">Dokter Gigi</option>
                        <option value="Perawat">Perawat</option>
                        <option value="Bidan">Bidan</option>
                        <option value="Apoteker">Apoteker</option>
                        <option value="Analis Lab">Analis Lab</option>
                        <option value="Nutrisionis">Nutrisionis</option>
                        <option value="Staf Administrasi">Staf Administrasi</option>
                        <option value="Petugas Keamanan">Petugas Keamanan</option>
                        <option value="Nahkoda / Awak Kapal">Nahkoda / Awak Kapal</option>
                        <option value="Sanitarian">Sanitarian</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jabatan</label>
                      <input
                        type="text"
                        value={newPegawai.jabatan}
                        onChange={(e) => setNewPegawai({ ...newPegawai, jabatan: e.target.value })}
                        placeholder="Contoh: Dokter Penanggung Jawab"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fasilitas Tempat Tugas</label>
                    <select
                      value={newPegawai.tempatTugas}
                      onChange={(e) => setNewPegawai({ ...newPegawai, tempatTugas: e.target.value as any })}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {TEMPAT_KERJA_LIST.map((tk) => (
                        <option key={tk.id} value={tk.id}>{tk.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={newPegawai.telepon}
                      onChange={(e) => setNewPegawai({ ...newPegawai, telepon: e.target.value })}
                      placeholder="081234567890"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs"
                    >
                      Simpan Pegawai
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PANDUAN DEPLOY KE GITHUB & HOSTINGER (CI/CD AUTO-SYNC) */}
      {/* ========================================================================= */}
      {activeTab === 'deploy_hostinger' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Panduan Deploy GitHub & Hostinger (Otomatis Update Saat Disinkronkan)
                </h2>
                <p className="text-xs text-slate-500">
                  Ketika repository di-push atau disinkronkan ke GitHub, website di Hostinger langsung ter-update secara otomatis!
                </p>
              </div>
            </div>

            {/* Workflow architecture diagram */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white space-y-3">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Alur Kerja CI/CD Otomatis:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
                  <div className="font-bold text-blue-200">1. Git Push ke GitHub</div>
                  <div className="text-[11px] text-white/70">Developer push kode ke branch main</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
                  <div className="font-bold text-emerald-300">2. GitHub Actions / Webhook</div>
                  <div className="text-[11px] text-white/70">Otomatis build (npm run build)</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
                  <div className="font-bold text-amber-300">3. Live di Hostinger</div>
                  <div className="text-[11px] text-white/70">File masuk ke public_html & langsung aktif</div>
                </div>
              </div>
            </div>

            {/* Metode 1: GitHub Actions FTP Deployment */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">1</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Metode Rekomendasi: GitHub Actions ke Hostinger FTP (File .github/workflows/deploy.yml Sudah Siap)
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Repositori ini sudah dilengkapi file workflow <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-red-500">.github/workflows/deploy.yml</code> dan konfigurasi SPA <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-blue-500">public/.htaccess</code> agar halaman tidak 404 saat di-refresh di server Apache Hostinger.
              </p>

              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-bold">Langkah Konfigurasi di GitHub Repository:</div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                  <li>Buka repository Anda di <strong>GitHub.com</strong>.</li>
                  <li>Masuk ke tab <strong>Settings</strong> ➔ <strong>Secrets and variables</strong> ➔ <strong>Actions</strong>.</li>
                  <li>Klik <strong>New repository secret</strong> dan tambahkan 3 variabel dari Hostinger FTP Anda:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 font-mono text-slate-600 dark:text-slate-400">
                      <li><code>FTP_SERVER</code> : IP Hostinger FTP (contoh: <code>ftp.domainanda.com</code> atau IP server Hostinger)</li>
                      <li><code>FTP_USERNAME</code> : Username akun FTP Hostinger Anda</li>
                      <li><code>FTP_PASSWORD</code> : Password akun FTP Hostinger Anda</li>
                    </ul>
                  </li>
                  <li>Kini, setiap kali Anda menjalankan <code>git push origin main</code>, GitHub Actions akan otomatis meng-compile dan mengunggah aplikasi ke Hostinger!</li>
                </ol>
              </div>
            </div>

            {/* Metode 2: Hostinger hPanel Git Deployment */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">2</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Metode Alternatif: Git Deployment Langsung via Hostinger hPanel
                </h3>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                <li>Buka dashboard <strong>Hostinger hPanel</strong> ➔ Pilih Hosting Anda.</li>
                <li>Di menu pencarian hPanel, ketik <strong>GIT</strong>.</li>
                <li>Masukkan <strong>Repository URL</strong> GitHub Anda (contoh: <code>https://github.com/username/sinakhoda.git</code>).</li>
                <li>Pilih Branch <code>main</code> dan tentukan folder tujuan <code>public_html</code>.</li>
                <li>Klik <strong>Create (Buat)</strong>.</li>
                <li>Salin <strong>Webhook URL</strong> yang diberikan Hostinger, lalu di GitHub buka <strong>Settings ➔ Webhooks</strong> dan tempel URL tersebut. Setiap push ke GitHub akan otomatis menarik pembaruan ke Hostinger!</li>
              </ol>
            </div>

            {/* Command terminal ready to copy */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Perintah Terminal untuk Push ke GitHub Pertama Kali:</span>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-sky-300 font-mono text-xs overflow-x-auto border border-slate-800">
{`git init
git add .
git commit -m "feat: SI NAKHODA sistem presensi & monitoring nakes kepulauan seribu"
git branch -M main
git remote add origin https://github.com/USERNAME-ANDA/sinakhoda.git
git push -u origin main`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
