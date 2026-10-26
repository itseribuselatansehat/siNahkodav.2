import React from 'react';
import { Pegawai } from '../types';
import { 
  LayoutDashboard, 
  MapPin, 
  Camera, 
  ClipboardCheck, 
  FileText, 
  Users, 
  History, 
  UserCircle, 
  LogOut, 
  Ship, 
  Lock,
  ShieldCheck,
  Sun,
  Moon,
  SlidersHorizontal
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  currentUser: Pegawai;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  sublabel?: string;
  badge?: string;
  highlight?: boolean;
  adminOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  currentUser,
  isAdminLoggedIn,
  onOpenAdminLogin,
  isOpenMobile,
  onCloseMobile,
  onLogout,
  darkMode = false,
  onToggleDarkMode
}) => {
  const [secretClicks, setSecretClicks] = React.useState(0);
  const handleSecretTrigger = () => {
    setSecretClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        onOpenAdminLogin();
        return 0;
      }
      setTimeout(() => setSecretClicks(0), 2000);
      return next;
    });
  };

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Monitoring',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      id: 'spatial-map',
      label: 'Denah & Radar Posisi',
      icon: MapPin,
      sublabel: 'Peta Kepulauan & Lantai'
    },
    {
      id: 'checkin',
      label: 'Check-In Ruangan',
      icon: Camera,
      highlight: true,
      sublabel: 'Kamera Device & Lokasi'
    },
    {
      id: 'lapordiri',
      label: 'Lapor Diri Kegiatan',
      icon: ClipboardCheck,
      sublabel: 'Kamera Selfie & Geotag'
    },
    {
      id: 'monitoring-reports',
      label: 'Laporan Monitoring',
      icon: FileText,
      sublabel: 'Keterisian & Belum Lapor',
      adminOnly: true
    },
    {
      id: 'pegawai-directory',
      label: 'Direktori Pegawai',
      icon: Users,
      badge: '42',
      adminOnly: true
    },
    {
      id: 'riwayat',
      label: 'Riwayat Perpindahan',
      icon: History,
      adminOnly: true
    },
    {
      id: 'profil',
      label: 'Profil Pegawai',
      icon: UserCircle,
      adminOnly: true
    },
    {
      id: 'settings-integration',
      label: 'Pengaturan GAS, WA & DB',
      icon: SlidersHorizontal,
      sublabel: 'Drive, API WA, Hostinger',
      adminOnly: true
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header with Secret Trigger */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div 
            onClick={handleSecretTrigger} 
            className="flex items-center gap-3 cursor-pointer select-none group"
            title="Puskesmas Kec. Kepulauan Seribu Selatan"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white text-base leading-tight tracking-tight">
                SI NAKHODA
              </div>
              <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                Puskesmas Kep. Seribu Selatan
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Menu Navigasi
          </div>

          {navItems.map((item) => {
            if (item.adminOnly && !isAdminLoggedIn) {
              return null;
            }

            const isActive = currentView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}
                  />
                  <div className="text-left">
                    <span className="block leading-tight">{item.label}</span>
                    {item.sublabel && (
                      <span
                        className={`text-[10px] block ${
                          isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

        </div>

        {/* User Footer with Dark Mode, Profile, Secret Trigger & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          {/* Dark Mode Quick Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <span className="flex items-center gap-2">
                {darkMode ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                <span>Mode Tampilan</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                {darkMode ? '🌙 Gelap' : '☀️ Terang'}
              </span>
            </button>
          )}

          {/* Admin Mode Status or Login Admin Button */}
          {isAdminLoggedIn ? (
            <button
              onClick={() => {
                onOpenAdminLogin();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Mode Pengelola Aktif</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 underline font-medium">Keluar</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onOpenAdminLogin();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
              title="Klik untuk membuka Login Pengelola / Admin (NIP: 12345, Password: admin)"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Login Admin / Pengelola</span>
            </button>
          )}

          {/* Tombol Kembali ke Halaman Utama / Tentang SI NAKHODA */}
          <button
            onClick={() => {
              onLogout();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <Ship className="w-3.5 h-3.5 text-blue-500" />
            <span>Halaman Depan SI NAKHODA</span>
          </button>


          {/* Subtle footer with discreet trigger for admin */}
          <div
            onClick={handleSecretTrigger}
            className="text-center text-[10px] text-slate-400 dark:text-slate-600 cursor-pointer select-none py-0.5 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
            title="Puskesmas Kec. Kepulauan Seribu Selatan"
          >
            SI NAKHODA v2.6 • Kep. Seribu Selatan
          </div>
        </div>
      </aside>
    </>
  );
};
