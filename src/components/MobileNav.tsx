import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Camera, 
  ClipboardCheck, 
  FileText 
} from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenQuickStatus: () => void;
  isAdminLoggedIn?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onSelectView,
  isAdminLoggedIn = false
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 lg:hidden flex items-center justify-around shadow-lg">
      <button
        onClick={() => onSelectView('dashboard')}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
          currentView === 'dashboard' 
            ? 'text-blue-600 dark:text-blue-400 font-semibold' 
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Dashboard</span>
      </button>

      <button
        onClick={() => onSelectView('spatial-map')}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
          currentView === 'spatial-map' 
            ? 'text-blue-600 dark:text-blue-400 font-semibold' 
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <MapPin className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Peta & Denah</span>
      </button>

      {/* Primary Center Action: Check-in / Pindah */}
      <button
        onClick={() => onSelectView('checkin')}
        className="flex flex-col items-center -mt-5 group"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-white dark:border-slate-900 group-active:scale-95 transition-transform">
          <Camera className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">Check-In</span>
      </button>

      <button
        onClick={() => onSelectView('lapordiri')}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
          currentView === 'lapordiri' 
            ? 'text-blue-600 dark:text-blue-400 font-semibold' 
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <ClipboardCheck className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Lapor Diri</span>
      </button>

      {isAdminLoggedIn && (
        <button
          onClick={() => onSelectView('monitoring-reports')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
            currentView === 'monitoring-reports' 
              ? 'text-blue-600 dark:text-blue-400 font-semibold' 
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Laporan</span>
        </button>
      )}
    </nav>
  );
};

