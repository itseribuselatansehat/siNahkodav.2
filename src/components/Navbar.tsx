import React from 'react';
import { Pegawai } from '../types';
import { getKondisiBadge } from '../utils/helpers';
import { PWAInstallNavbarButton } from './PWAInstallBanner';
import { 
  Menu, 
  Compass, 
  Activity, 
  ChevronDown, 
  Lock, 
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  currentUser: Pegawai;
  isAdminLoggedIn: boolean;
  onOpenQuickStatus: () => void;
  onOpenAdminLogin: () => void;
  onToggleSidebar: () => void;
  onSelectView: (view: string) => void;
  onSwitchUser: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  dbSyncTime?: string;
  isDbConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isAdminLoggedIn,
  onOpenQuickStatus,
  onOpenAdminLogin,
  onToggleSidebar,
  onSelectView,
  onSwitchUser,
  darkMode = false,
  onToggleDarkMode,
  dbSyncTime,
  isDbConnected = true
}) => {
  const [secretNavClicks, setSecretNavClicks] = React.useState(0);
  const kondisiInfo = getKondisiBadge(currentUser.kondisi);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Page Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none transition-colors"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => {
              setSecretNavClicks((prev) => {
                const next = prev + 1;
                if (next >= 3) {
                  onOpenAdminLogin();
                  return 0;
                }
                setTimeout(() => setSecretNavClicks(0), 2000);
                return next;
              });
            }}
            className="flex items-center gap-2 cursor-pointer select-none group"
            title="Puskesmas Kec. Kepulauan Seribu Selatan"
          >
            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm md:text-base tracking-tight">SI NAKHODA</span>
                <span 
                  title={`Database Auto-Refresh langsung ke database setiap 3 detik. Waktu: ${dbSyncTime || 'Aktif'}`}
                  className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  <span>DB 3s Live</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-xs md:max-w-md">
                Puskesmas Kec. Kepulauan Seribu Selatan
              </p>
            </div>
          </div>
        </div>

        {/* Right: Darkmode Toggle, Quick Status, Admin Mode Badge (only if logged in), & User Badge */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Dark Mode Toggle Button */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-slate-800"
              title={darkMode ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 hover:-rotate-12 transition-transform" />
              )}
            </button>
          )}

          {/* PWA Desktop Install Button */}
          <PWAInstallNavbarButton />

          {/* Admin Mode Badge & Login Button */}
          {isAdminLoggedIn ? (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
              title="Mode Pengelola Aktif - Klik untuk kelola atau keluar"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Mode Pengelola</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
              title="Akses Login Admin / Pengelola (NIP: 12345, Password: admin)"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Login Admin</span>
            </button>
          )}

          {/* Quick Update Status & Room Button */}
          <button
            onClick={onOpenQuickStatus}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-95 ${kondisiInfo.badgeClass}`}
            title="Klik untuk perbarui posisi ruangan atau kondisi Anda"
          >
            <span className={`w-2 h-2 rounded-full ${kondisiInfo.dotClass}`} />
            <span className="hidden sm:inline font-medium opacity-90">Kondisi:</span>
            <span className="font-semibold">{kondisiInfo.label}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5" />
          </button>

          {/* User Profile Info - Only visible when Admin is logged in */}
          {isAdminLoggedIn && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={onSwitchUser}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                title="Profil pengelola"
              >
                <div className="relative">
                  <img
                    src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.nama || 'User')}&background=0284c7&color=fff&bold=true`}
                    alt={currentUser?.nama || 'User'}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-500 transition-all"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.nama || 'User')}&background=0284c7&color=fff&bold=true`;
                    }}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <div className="hidden md:block leading-tight">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    {currentUser.nama}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[130px]">
                    Admin Pengelola
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
