import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Laptop, 
  Smartphone, 
  Download, 
  X, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  ShieldCheck, 
  Wifi, 
  Monitor,
  BellRing
} from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isDesktop, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed or dismissed, don't show the prominent banner
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Banner Notifikasi Install Desktop & Mobile */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-3 border-b border-blue-500/30 shadow-md transition-all animate-in fade-in">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-cyan-300 shadow-inner">
              {isDesktop ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight">
                  {isDesktop ? '🖥️ Pasang Aplikasi Dekstop SI NAKHODA' : '📱 Install Aplikasi SI NAKHODA Mobile'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PWA Ready
                </span>
              </div>
              <p className="text-[11px] text-blue-200 mt-0.5 line-clamp-1 sm:line-clamp-none">
                {isDesktop
                  ? 'Buka langsung dari desktop laptop tanpa tab browser, notifikasi respon darurat realtime, dan akses cepat offline!'
                  : 'Tambahkan ke layar utama smartphone untuk pengalaman seperti aplikasi native.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDesktop ? 'Install di Laptop / PC' : 'Install Aplikasi'}</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-xl text-blue-300 hover:text-white hover:bg-white/10 transition"
              title="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Guide Modal if browser doesn't expose native beforeinstallprompt (e.g. Safari or manual Chrome) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-cyan-300" />
                <h3 className="font-bold text-sm">Petunjuk Instalasi Aplikasi</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              {isDesktop ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
                    <p className="font-bold text-xs">Cara Pasang di Laptop / Komputer Desktop:</p>
                    <ol className="list-decimal pl-4 mt-2 space-y-1.5 text-[11px]">
                      <li>
                        Perhatikan <strong>ujung kanan Address Bar</strong> browser (Google Chrome, Microsoft Edge, atau Brave).
                      </li>
                      <li>
                        Klik ikon <strong>Install / Pasang Aplikasi</strong> (berupa ikon monitor bertanda panah ke bawah).
                      </li>
                      <li>
                        Klik <strong>"Install / Pasang"</strong> pada jendela konfirmasi.
                      </li>
                      <li>
                        SI NAKHODA kini akan terbuka sebagai jendela aplikasi desktop tersendiri dan muncul di Start Menu / Desktop!
                      </li>
                    </ol>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dapat diakses langsung kapan saja tanpa perlu membuka browser manual.</span>
                  </div>
                </div>
              ) : isIOS ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
                    <p className="font-bold text-xs">Cara Pasang di iPhone / iPad (Safari):</p>
                    <ol className="list-decimal pl-4 mt-2 space-y-1.5 text-[11px]">
                      <li>Tekan tombol <strong>Bagikan / Share</strong> (ikon kotak bertanda panah atas) di toolbar Safari.</li>
                      <li>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</li>
                      <li>Tekan <strong>"Tambah" (Add)</strong> di pojok kanan atas.</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
                    <p className="font-bold text-xs">Cara Pasang di Android (Chrome):</p>
                    <ol className="list-decimal pl-4 mt-2 space-y-1.5 text-[11px]">
                      <li>Tekan tombol menu titik tiga <strong>(⋮)</strong> di pojok kanan atas Chrome.</li>
                      <li>Pilih menu <strong>"Install Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                      <li>Konfirmasi instalasi.</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Dukungan Offline Cache</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Alert SOS Seketika</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const PWAInstallNavbarButton: React.FC = () => {
  const { isInstallable, isInstalled, isDesktop, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuide(true);
          }
        }}
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 text-xs font-bold transition-all"
        title="Pasang aplikasi di desktop laptop"
      >
        <Laptop className="w-3.5 h-3.5 text-blue-600" />
        <span>Install di Laptop</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              <span>Instalasi Desktop SI NAKHODA</span>
            </h4>
            <p className="text-slate-600">
              Untuk menginstal di laptop Anda, klik tombol <strong>Install</strong> pada menu browser atau ikon pasang di sisi kanan address bar browser Chrome/Edge.
            </p>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
