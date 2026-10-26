import React, { useState, useEffect } from 'react';
import { 
  Pegawai, 
  UnitPelayanan, 
  MovementLog, 
  LaporDiriRecord, 
  TempatKerja, 
  LantaiArea, 
  KondisiPegawai 
} from './types';
import { 
  INITIAL_PEGAWAI_LIST, 
  UNIT_PELAYANAN_LIST, 
  INITIAL_MOVEMENT_LOGS, 
  INITIAL_LAPOR_DIRI 
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { QuickStatusModal } from './components/QuickStatusModal';
import { AdminLoginModal } from './components/AdminLoginModal';

// Views
import { LandingView } from './components/views/LandingView';
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { SpatialMapView } from './components/views/SpatialMapView';
import { CheckInView } from './components/views/CheckInView';
import { LaporDiriView } from './components/views/LaporDiriView';
import { MonitoringReportsView } from './components/views/MonitoringReportsView';
import { PegawaiDirectoryView } from './components/views/PegawaiDirectoryView';
import { RiwayatView } from './components/views/RiwayatView';
import { ProfileView } from './components/views/ProfileView';
import { SettingsIntegrationView } from './components/views/SettingsIntegrationView';
import { fetchGlobalGasConfig, saveGlobalGasConfig } from './utils/gasConfigService';
import { 
  fetchEmployeesFromGAS, 
  clearLocalDummyEmployees 
} from './utils/gasService';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { 
  fetchAppDatabase, 
  saveCheckInToDatabase, 
  saveLaporDiriToDatabase, 
  saveQuickStatusToDatabase, 
  saveResetToDatabase 
} from './utils/databaseSyncService';

// Flag untuk memastikan pembersihan total data dami di browser lokal
const DUMMY_PURGE_FLAG = 'sinakhoda_dummy_purged_gas_v5';

function purgeBrowserDummyStorage() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(DUMMY_PURGE_FLAG) !== 'true') {
    localStorage.removeItem('sinakhoda_pegawai_v3');
    localStorage.removeItem('sinakhoda_movements_v3');
    localStorage.removeItem('sinakhoda_lapordiri_v3');
    localStorage.setItem(DUMMY_PURGE_FLAG, 'true');
  }
}

const DEFAULT_FALLBACK_USER: Pegawai = {
  id: 'peg-admin',
  nip: '198207152006041002',
  nama: 'Admin SI NAKHODA',
  profesi: 'Dokter Gigi',
  jabatan: 'Koordinator Puskesmas',
  tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
  role: 'admin',
  status: 'belum_hadir',
  kondisi: 'siap_melayani',
  telepon: '081299887766',
  avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
};

export default function App() {
  // 1. Initial State from localStorage (data dami telah dihapus, siap menerima database GAS)
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(() => {
    purgeBrowserDummyStorage();
    const saved = localStorage.getItem('sinakhoda_pegawai_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [movementLogs, setMovementLogs] = useState<MovementLog[]>(() => {
    const saved = localStorage.getItem('sinakhoda_movements_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [laporDiriList, setLaporDiriList] = useState<LaporDiriRecord[]>(() => {
    const saved = localStorage.getItem('sinakhoda_lapordiri_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<Pegawai>(() => {
    const savedUser = localStorage.getItem('sinakhoda_current_user_v3');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.nama) {
          return {
            ...DEFAULT_FALLBACK_USER,
            ...parsed,
            avatar: parsed.avatar || DEFAULT_FALLBACK_USER.avatar
          };
        }
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_FALLBACK_USER;
  });

  // GAS Sync & Connection state
  const [gasWebhookInput, setGasWebhookInput] = useState<string>('');
  const [isFetchingGas, setIsFetchingGas] = useState<boolean>(false);
  const [gasFeedback, setGasFeedback] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; message: string } | null>(null);

  // Saat pegawaiList berhasil ditarik dari GAS, set currentUser ke pegawai pertama
  useEffect(() => {
    if (pegawaiList.length > 0) {
      const exists = pegawaiList.some((p) => p.id === currentUser.id || p.nip === currentUser.nip);
      if (!exists || currentUser.id === 'peg-admin') {
        setCurrentUser(pegawaiList[0]);
      }
    }
  }, [pegawaiList]);

  // Tampilkan single page tentang SI NAKHODA terlebih dahulu sebelum masuk ke aplikasi
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Hidden admin/pengelola mode
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('sinakhoda_admin_logged_v3') === 'true';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Darkmode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sinakhoda_dark_mode_v3');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
  });

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isQuickStatusOpen, setIsQuickStatusOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Reset notice banner
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('sinakhoda_dark_mode_v3', darkMode ? 'true' : 'false');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Restrict admin-only views if not logged in as admin
  useEffect(() => {
    const adminOnlyViews = [
      'monitoring-reports',
      'pegawai-directory',
      'riwayat',
      'profil',
      'settings-integration'
    ];
    if (!isAdminLoggedIn && adminOnlyViews.includes(currentView)) {
      setCurrentView('dashboard');
    }
  }, [isAdminLoggedIn, currentView]);

  // Global secret shortcut for Admin Login: Ctrl+Shift+A or Alt+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.altKey && e.key.toLowerCase() === 'a')
      ) {
        e.preventDefault();
        setIsAdminModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time Database Auto-Refresh status
  const [dbSyncTime, setDbSyncTime] = useState<string>('Live');
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);

  // Fetch global GAS & system config from server so all devices/browsers share identical settings
  useEffect(() => {
    fetchGlobalGasConfig().then((cfg) => {
      if (cfg && cfg.webhookUrl) {
        setGasWebhookInput(cfg.webhookUrl);
        // Jika data pegawai di browser kosong, otomatis tarik langsung dari GAS
        const currentSaved = localStorage.getItem('sinakhoda_pegawai_v3');
        const hasSaved = currentSaved ? JSON.parse(currentSaved).length > 0 : false;
        if (!hasSaved) {
          fetchEmployeesFromGAS(cfg.webhookUrl)
            .then((res) => {
              if (res.success && res.pegawai && res.pegawai.length > 0) {
                setPegawaiList(res.pegawai);
                setGasFeedback({
                  type: 'success',
                  message: `Berhasil memuat ${res.pegawai.length} data pegawai resmi langsung dari Google Apps Script Spreadsheet!`
                });
                setTimeout(() => setGasFeedback(null), 6000);
              }
            })
            .catch(() => {});
        }
      }
    });
  }, []);

  const handleFetchFromGAS = async (customUrl?: string) => {
    const targetUrl = (customUrl || gasWebhookInput).trim();
    setIsFetchingGas(true);
    setGasFeedback(null);
    try {
      if (targetUrl) {
        saveGlobalGasConfig({ webhookUrl: targetUrl }).catch(() => {});
      }
      const res = await fetchEmployeesFromGAS(targetUrl);
      setIsFetchingGas(false);
      if (res.success && res.pegawai && res.pegawai.length > 0) {
        setPegawaiList(res.pegawai);
        setGasFeedback({
          type: 'success',
          message: `Berhasil memuat ${res.pegawai.length} data pegawai resmi langsung dari Google Apps Script Spreadsheet!`
        });
      } else {
        setGasFeedback({
          type: 'warning',
          message: res.message || 'Tidak ada data pegawai yang terbaca dari Google Apps Script. Pastikan sheet Database_Pegawai terisi dan Web App di-deploy dengan opsi Anyone.'
        });
      }
    } catch (err: any) {
      setIsFetchingGas(false);
      setGasFeedback({
        type: 'error',
        message: err.message || 'Gagal terhubung ke Google Apps Script'
      });
    }
    setTimeout(() => setGasFeedback(null), 8000);
  };

  const handleClearBrowserDummyData = async () => {
    if (!window.confirm('Hapus seluruh data pegawai dami di browser dan fokus memuat data resmi dari Google Apps Script?')) return;
    setIsFetchingGas(true);
    setGasFeedback(null);
    try {
      const res = await clearLocalDummyEmployees(gasWebhookInput);
      setIsFetchingGas(false);
      setPegawaiList(res.pegawai || []);
      setMovementLogs([]);
      setLaporDiriList([]);
      setGasFeedback({
        type: 'success',
        message: res.message || 'Data dami lokal browser berhasil dihapus!'
      });
    } catch (err: any) {
      setIsFetchingGas(false);
      setGasFeedback({
        type: 'info',
        message: 'Data dami lokal browser berhasil dibersihkan.'
      });
    }
    setTimeout(() => setGasFeedback(null), 8000);
  };

  // AUTO-REFRESH LANGSUNG KE DATABASE SERVER SETIAP 3 DETIK (3000ms)
  useEffect(() => {
    let isMounted = true;

    // 1. Initial immediate fetch dari database server
    fetchAppDatabase().then((res) => {
      if (res.success && res.data && isMounted) {
        if (Array.isArray(res.data.pegawai) && res.data.pegawai.length > 0) {
          setPegawaiList(res.data.pegawai);
        }
        if (Array.isArray(res.data.movementLogs)) {
          setMovementLogs(res.data.movementLogs);
        }
        if (Array.isArray(res.data.laporDiriList)) {
          setLaporDiriList(res.data.laporDiriList);
        }
        setIsDbConnected(true);
        setDbSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    });

    // 2. Interval polling 3 detik ke database server
    const dbPollInterval = setInterval(async () => {
      try {
        const res = await fetchAppDatabase();
        if (res.success && res.data && isMounted) {
          setIsDbConnected(true);
          setDbSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

          if (res.hasUpdates) {
            if (Array.isArray(res.data.pegawai)) {
              setPegawaiList(res.data.pegawai);
            }
            if (Array.isArray(res.data.movementLogs)) {
              setMovementLogs(res.data.movementLogs);
            }
            if (Array.isArray(res.data.laporDiriList)) {
              setLaporDiriList(res.data.laporDiriList);
            }
          }
        }
      } catch (err) {
        if (isMounted) setIsDbConnected(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(dbPollInterval);
    };
  }, []);

  // Execute Midnight Reset of all rooms
  const executeMidnightReset = (isManualSimulation = false) => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('sinakhoda_last_reset_date', today);

    // Empty all room check-ins across pegawai
    setPegawaiList((prev) =>
      prev.map((p) => ({
        ...p,
        status: 'belum_hadir',
        kondisi: 'belum_hadir',
        kondisiCatatan: 'Belum check-in hari ini',
        currentTempatKerja: undefined,
        currentLantai: undefined,
        currentUnitId: undefined,
        currentUnitName: undefined,
        lastCheckinTime: undefined
      }))
    );

    // Reset current user room position
    setCurrentUser((prev) => ({
      ...prev,
      status: 'belum_hadir',
      kondisi: 'belum_hadir',
      kondisiCatatan: 'Belum check-in hari ini',
      currentTempatKerja: undefined,
      currentLantai: undefined,
      currentUnitId: undefined,
      currentUnitName: undefined,
      lastCheckinTime: undefined
    }));

    saveResetToDatabase();

    const message = isManualSimulation
      ? '🌙 Simulasi Reset Malam Berhasil: Seluruh ruangan telah di-reset kosong (warna merah). Pegawai sekarang dapat Check-In untuk mengisi ruangan dan Lapor Diri kegiatan.'
      : '🌙 Reset Otomatis Tengah Malam: Seluruh ruangan telah dikosongkan untuk hari baru. Pegawai dipersilakan melakukan Check-In Ruangan & Lapor Diri kegiatan.';
    setResetNotice(message);

    setTimeout(() => {
      setResetNotice(null);
    }, 8000);
  };

  // 1. Check on app mount for date rollover
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastReset = localStorage.getItem('sinakhoda_last_reset_date');
    if (lastReset && lastReset !== today) {
      executeMidnightReset(false);
    } else if (!lastReset) {
      localStorage.setItem('sinakhoda_last_reset_date', today);
    }
  }, []);

  // 2. Continuous interval checking for midnight crossing
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      const lastReset = localStorage.getItem('sinakhoda_last_reset_date');
      if (lastReset && lastReset !== today) {
        executeMidnightReset(false);
      }
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sinakhoda_pegawai_v3', JSON.stringify(pegawaiList));
  }, [pegawaiList]);

  useEffect(() => {
    localStorage.setItem('sinakhoda_movements_v3', JSON.stringify(movementLogs));
  }, [movementLogs]);

  useEffect(() => {
    localStorage.setItem('sinakhoda_lapordiri_v3', JSON.stringify(laporDiriList));
  }, [laporDiriList]);

  useEffect(() => {
    localStorage.setItem('sinakhoda_current_user_v3', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sinakhoda_is_logged_v3', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('sinakhoda_admin_logged_v3', isAdminLoggedIn ? 'true' : 'false');
  }, [isAdminLoggedIn]);

  // Handlers
  const handleUpdateStatusAndPosition = (data: {
    tempatKerja: TempatKerja;
    lantai: LantaiArea;
    unitId: string;
    unitName: string;
    kondisi: KondisiPegawai;
    catatan: string;
  }) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Update in pegawai list
    setPegawaiList((prev) =>
      prev.map((p) => {
        if (p.id === currentUser.id) {
          return {
            ...p,
            status: 'hadir',
            currentTempatKerja: data.tempatKerja,
            currentLantai: data.lantai,
            currentUnitId: data.unitId,
            currentUnitName: data.unitName,
            kondisi: data.kondisi,
            kondisiCatatan: data.catatan,
            lastUpdateTime: timeStr
          };
        }
        return p;
      })
    );

    // 2. Update currentUser state
    const updatedUser: Pegawai = {
      ...currentUser,
      status: 'hadir',
      currentTempatKerja: data.tempatKerja,
      currentLantai: data.lantai,
      currentUnitId: data.unitId,
      currentUnitName: data.unitName,
      kondisi: data.kondisi,
      kondisiCatatan: data.catatan,
      lastUpdateTime: timeStr
    };
    setCurrentUser(updatedUser);

    // 3. Add to Movement Logs
    const newLog: MovementLog = {
      id: `mov-${Date.now()}`,
      timestamp: timeStr,
      date: 'Hari ini',
      pegawaiId: currentUser.id,
      pegawaiNama: currentUser.nama,
      nip: currentUser.nip,
      tempatKerja: data.tempatKerja,
      lantai: data.lantai,
      dariUnit: currentUser.currentUnitName,
      keUnit: data.unitName,
      kondisi: data.kondisi,
      catatan: data.catatan
    };
    setMovementLogs((prev) => [newLog, ...prev]);

    // 4. Sinkronisasi instan ke server database
    saveQuickStatusToDatabase({
      pegawaiId: currentUser.id,
      kondisi: data.kondisi,
      catatan: data.catatan
    });
  };

  const handleSubmitCheckin = (data: {
    pegawaiId: string;
    tempatKerja: TempatKerja;
    lantai: LantaiArea;
    unitId: string;
    unitName: string;
    kondisi: KondisiPegawai;
    catatan: string;
    isDinasLuar: boolean;
    selfieUrl?: string;
    coordinates?: { lat: number; lng: number; accuracy?: number; distanceMeters?: number };
    alamatLokasi?: string;
  }) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isoDateStr = now.toISOString().slice(0, 10);
    const targetPegawai = pegawaiList.find((p) => p.id === data.pegawaiId) || currentUser;

    // Update in list
    setPegawaiList((prev) =>
      prev.map((p) => {
        if (p.id === data.pegawaiId) {
          return {
            ...p,
            status: data.isDinasLuar ? 'dinas_luar' : 'hadir',
            currentTempatKerja: data.tempatKerja,
            currentLantai: data.lantai,
            currentUnitId: data.unitId,
            currentUnitName: data.unitName,
            kondisi: data.kondisi,
            kondisiCatatan: data.catatan,
            lastCheckinTime: timeStr,
            lastUpdateTime: timeStr,
            selfieUrl: data.selfieUrl,
            coordinates: data.coordinates
          };
        }
        return p;
      })
    );

    // Update current user if matching
    if (currentUser.id === data.pegawaiId) {
      const updatedUser: Pegawai = {
        ...currentUser,
        status: data.isDinasLuar ? 'dinas_luar' : 'hadir',
        currentTempatKerja: data.tempatKerja,
        currentLantai: data.lantai,
        currentUnitId: data.unitId,
        currentUnitName: data.unitName,
        kondisi: data.kondisi,
        kondisiCatatan: data.catatan,
        lastCheckinTime: timeStr,
        lastUpdateTime: timeStr,
        selfieUrl: data.selfieUrl,
        coordinates: data.coordinates
      };
      setCurrentUser(updatedUser);
    }

    // Add log
    const newLog: MovementLog = {
      id: `mov-${Date.now()}`,
      timestamp: timeStr,
      date: 'Hari ini',
      isoDate: isoDateStr,
      pegawaiId: targetPegawai.id,
      pegawaiNama: targetPegawai.nama,
      nip: targetPegawai.nip,
      tempatKerja: data.tempatKerja,
      lantai: data.lantai,
      keUnit: data.unitName,
      kondisi: data.kondisi,
      catatan: data.catatan,
      selfieUrl: data.selfieUrl,
      coordinates: data.coordinates,
      alamatLokasi: data.alamatLokasi
    };
    setMovementLogs((prev) => [newLog, ...prev]);

    // Sinkronisasi instan ke server database (otomatis di-refresh semua browser dlm 3 detik)
    saveCheckInToDatabase({
      pegawaiId: data.pegawaiId,
      tempatKerja: data.tempatKerja,
      lantai: data.lantai,
      unitId: data.isDinasLuar ? 'dinas-luar' : data.unitId,
      unitName: data.unitName,
      kondisi: data.kondisi,
      catatan: data.catatan,
      lastCheckinTime: timeStr,
      selfieUrl: data.selfieUrl,
      coordinates: data.coordinates,
      movementLog: newLog
    });
  };

  const handleSubmitLaporDiri = (record: Omit<LaporDiriRecord, 'id' | 'timestamp' | 'date'>) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isoDateStr = now.toISOString().slice(0, 10);
    const newRecord: LaporDiriRecord = {
      ...record,
      id: `lap-${Date.now()}`,
      timestamp: timeStr,
      date: 'Hari ini',
      isoDate: isoDateStr
    };
    setLaporDiriList((prev) => [newRecord, ...prev]);

    // Sinkronisasi instan ke server database
    saveLaporDiriToDatabase(newRecord);
  };

  const handleSelectUser = (user: Pegawai) => {
    setCurrentUser(user);
    setResetNotice(`Beralih profil ke: ${user.nama} (${user.jabatan})`);
    setTimeout(() => setResetNotice(null), 3000);
  };

  const handleLoginSuccess = (user: Pegawai) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role === 'admin') {
      setIsAdminLoggedIn(true);
    }
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('landing');
  };

  // 2. Conditional Rendering for Auth / Landing views
  if (!isLoggedIn) {
    if (currentView === 'login') {
      return (
        <LoginView
          pegawaiList={pegawaiList}
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => setCurrentView('landing')}
        />
      );
    }
    return (
      <>
        <LandingView
          onEnterApp={() => {
            setIsLoggedIn(true);
            setCurrentView('dashboard');
          }}
          onOpenAdminLogin={() => setIsAdminModalOpen(true)}
        />
        <AdminLoginModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          isAdminLoggedIn={isAdminLoggedIn}
          onAdminLogin={(admin) => {
            setIsAdminLoggedIn(true);
            setIsLoggedIn(true);
            setCurrentUser(admin);
            setCurrentView('dashboard');
          }}
          onAdminLogout={() => {
            setIsAdminLoggedIn(false);
          }}
          adminUser={currentUser}
          pegawaiList={pegawaiList}
        />
      </>
    );
  }

  // 3. Main Application Layout (Frictionless for employees, with hidden Pengelola access)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="flex-1 flex w-full">
        {/* Desktop & Mobile Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          currentUser={currentUser}
          isAdminLoggedIn={isAdminLoggedIn}
          onOpenAdminLogin={() => setIsAdminModalOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-6">
          {/* PWA Desktop & Mobile Install Notification Banner */}
          <PWAInstallBanner />

          {/* Top Navbar */}
          <Navbar
            currentUser={currentUser}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenQuickStatus={() => setIsQuickStatusOpen(true)}
            onOpenAdminLogin={() => setIsAdminModalOpen(true)}
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
            onSelectView={setCurrentView}
            onSwitchUser={() => setCurrentView('profil')}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            dbSyncTime={dbSyncTime}
            isDbConnected={isDbConnected}
          />

          {/* Midnight Reset Notification Banner */}
          {resetNotice && (
            <div className="mx-3.5 sm:mx-5 md:mx-6 lg:mx-8 mt-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 to-blue-900 text-white border border-indigo-700/60 shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
                <span className="text-base sm:text-lg">🌙</span>
                <span>{resetNotice}</span>
              </div>
              <button
                onClick={() => setResetNotice(null)}
                className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] font-bold text-white shrink-0"
              >
                Tutup ✕
              </button>
            </div>
          )}

          {/* Feedback Notifikasi Sinkronisasi GAS */}
          {gasFeedback && (
            <div className={`mx-3.5 sm:mx-5 md:mx-6 lg:mx-8 mt-3.5 p-3.5 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in ${
              gasFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : gasFeedback.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                {gasFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{gasFeedback.message}</span>
              </div>
              <button
                onClick={() => setGasFeedback(null)}
                className="text-xs font-bold px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10"
              >
                ✕
              </button>
            </div>
          )}

          {/* Bar Status & Tarik Data Google Apps Script Live - Hanya tampil saat login Pengelola/Admin */}
          {isAdminLoggedIn && (
            <div className="mx-3.5 sm:mx-5 md:mx-6 lg:mx-8 mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Database Google Apps Script (Spreadsheet)
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      pegawaiList.length > 0 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}>
                      {pegawaiList.length > 0 ? `🟢 ${pegawaiList.length} Pegawai Live` : '⚠️ Data Dami Dihapus (Menunggu GAS)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {pegawaiList.length > 0 
                      ? 'Data pegawai tersinkronisasi langsung dari sheet Database_Pegawai Google Apps Script terdeploy.'
                      : 'Data dami lokal browser telah dibersihkan. Tempel Webhook URL GAS atau klik "Tarik Data dari GAS" untuk memuat database real.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  value={gasWebhookInput}
                  onChange={(e) => setGasWebhookInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono w-full sm:w-64 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  onClick={() => handleFetchFromGAS()}
                  disabled={isFetchingGas}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
                  title="Tarik data pegawai live langsung dari Google Apps Script"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGas ? 'animate-spin' : ''}`} />
                  <span>{isFetchingGas ? 'Menarik...' : '⚡ Tarik dari GAS'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearBrowserDummyData}
                  disabled={isFetchingGas}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:text-slate-300 dark:hover:text-red-300 border border-slate-200 dark:border-slate-700 font-bold text-xs transition flex items-center justify-center gap-1 shrink-0"
                  title="Hapus data dami yang tersimpan di local browser"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hapus Dami</span>
                </button>
              </div>
            </div>
          )}

          <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {/* View Switcher */}
            {currentView === 'dashboard' && (
              <DashboardView
                pegawaiList={pegawaiList}
                units={UNIT_PELAYANAN_LIST}
                movementLogs={movementLogs}
                currentUser={currentUser}
                onOpenQuickStatus={() => setIsQuickStatusOpen(true)}
                onNavigateToMap={() => setCurrentView('spatial-map')}
                onNavigateToCheckin={() => setCurrentView('checkin')}
                onSimulateMidnightReset={() => executeMidnightReset(true)}
                isAdminLoggedIn={isAdminLoggedIn}
                onNavigateToSettings={() => setCurrentView('settings-integration')}
              />
            )}

            {currentView === 'spatial-map' && (
              <SpatialMapView
                pegawaiList={pegawaiList}
                units={UNIT_PELAYANAN_LIST}
                onOpenQuickStatus={() => setIsQuickStatusOpen(true)}
              />
            )}

            {currentView === 'checkin' && (
              <CheckInView
                pegawaiList={pegawaiList}
                currentUser={currentUser}
                onSubmitCheckin={handleSubmitCheckin}
                onNavigateToDashboard={() => setCurrentView('dashboard')}
              />
            )}

            {currentView === 'lapordiri' && (
              <LaporDiriView
                currentUser={currentUser}
                laporDiriList={laporDiriList}
                pegawaiList={pegawaiList}
                onSubmitLaporDiri={handleSubmitLaporDiri}
              />
            )}

            {currentView === 'monitoring-reports' && (
              <MonitoringReportsView
                pegawaiList={pegawaiList}
                units={UNIT_PELAYANAN_LIST}
                laporDiriList={laporDiriList}
              />
            )}

            {currentView === 'pegawai-directory' && (
              <PegawaiDirectoryView pegawaiList={pegawaiList} />
            )}

            {currentView === 'riwayat' && (
              <RiwayatView movementLogs={movementLogs} />
            )}

            {currentView === 'profil' && (
              <ProfileView
                currentUser={currentUser}
                pegawaiList={pegawaiList}
                onSelectUser={handleSelectUser}
                onOpenQuickStatus={() => setIsQuickStatusOpen(true)}
              />
            )}

            {currentView === 'settings-integration' && (
              <SettingsIntegrationView
                pegawaiList={pegawaiList}
                onUpdatePegawaiList={setPegawaiList}
                onSimulateMidnightReset={() => executeMidnightReset(true)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Floating Bottom Menu for Mobile Screens */}
      <MobileNav
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenQuickStatus={() => setIsQuickStatusOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Quick Status Update Modal */}
      <QuickStatusModal
        isOpen={isQuickStatusOpen}
        onClose={() => setIsQuickStatusOpen(false)}
        currentUser={currentUser}
        onUpdateStatus={handleUpdateStatusAndPosition}
      />

      {/* Hidden Pengelola Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogin={(admin) => {
          setIsAdminLoggedIn(true);
          setCurrentUser(admin);
        }}
        onAdminLogout={() => {
          setIsAdminLoggedIn(false);
        }}
        adminUser={currentUser.role === 'admin' ? currentUser : (pegawaiList.find((p) => p.role === 'admin') || pegawaiList[0])}
        pegawaiList={pegawaiList}
      />
    </div>
  );
}
