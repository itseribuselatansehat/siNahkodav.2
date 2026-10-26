import React from 'react';
import { Ship, HeartPulse, Compass, Anchor, Info, ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onEnterApp: () => void;
  onOpenAdminLogin?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onEnterApp,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/50 to-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* Top Brand Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
              SI NAKHODA
            </div>
            <div className="text-xs font-semibold text-blue-600">
              Puskesmas Kec. Kepulauan Seribu Selatan
            </div>
          </div>
        </div>

        {/* Status Sistem Aktif Terintegrasi */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Sistem Aktif & Terintegrasi</span>
          <span className="sm:hidden">Online</span>
        </div>
      </div>

      {/* Main Hero & Philosophy Section */}
      <div className="max-w-4xl mx-auto w-full py-6 md:py-10 text-center space-y-6 md:space-y-8 my-auto">
        {/* Emblem Icons */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Ship className="w-9 h-9" />
          </div>
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <HeartPulse className="w-8 h-8" />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            Platform Monitoring Kepegawaian & Posisi Terintegrasi
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            SI NAKHODA
          </h1>
          <h2 className="text-base sm:text-lg font-bold text-slate-700 max-w-xl mx-auto">
            Sistem Informasi Navigasi Kinerja dan Optimalisasi Data Pegawai
          </h2>
          <p className="text-sm md:text-base italic text-blue-600 font-semibold">
            &ldquo;Satu Navigasi, Satu Komitmen, Satu Pelayanan.&rdquo;
          </p>
        </div>

        {/* Philosophy Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl text-left space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filosofi Nama */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Anchor className="w-4 h-4 text-blue-600" />
                <span>Filosofi Nama SI NAKHODA</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                SI NAKHODA merupakan platform yang berfungsi sebagai alat navigasi dalam memantau dan mengelola kinerja serta posisi pegawai secara terintegrasi. Sebagaimana seorang nahkoda mengarahkan kapal menuju tujuan, aplikasi ini menjadi panduan dalam mengoptimalkan data pegawai, meningkatkan kesiapsiagaan nakes di setiap unit, serta mendukung pelayanan kesehatan yang efektif dan akuntabel di Puskesmas Kepulauan Seribu Selatan.
              </p>
            </div>

            {/* Makna Tagline */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Makna Tagline</span>
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span><strong>Satu Navigasi:</strong> Seluruh informasi posisi, kehadiran, dan monitoring pegawai berada dalam satu sistem terintegrasi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span><strong>Satu Komitmen:</strong> Mendorong kesamaan tujuan, loyalitas, dan tanggung jawab seluruh pegawai.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span><strong>Satu Pelayanan:</strong> Bermuara pada peningkatan mutu dan keselamatan pelayanan kesehatan masyarakat kepulauan.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Platform monitoring posisi pegawai dirancang khusus untuk memenuhi tantangan geografis kepulauan: mengetahui kondisi dokter, perawat, bidan, dan staf di setiap ruangan, pustu pulau, maupun kapal ambulans secara realtime demi keselamatan pasien.
            </p>
          </div>
        </div>

        {/* CTA: Tombol LAPOR Si Nahkoda */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:via-indigo-700 hover:to-cyan-700 text-white font-black text-base shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Ship className="w-6 h-6 group-hover:rotate-6 transition-transform" />
            <span className="tracking-wide">LAPOR Si Nahkoda</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-xs text-slate-500 font-medium">
            Klik tombol di atas untuk membuka dashboard monitoring & presensi pegawai
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 py-3 border-t border-slate-200/60 gap-2">
        <div>
          © 2026 Puskesmas Kecamatan Kepulauan Seribu Selatan • Dinas Kesehatan DKI Jakarta
        </div>
        <div className="text-slate-400 font-medium">
          SI NAKHODA v2.4 • Navigasi Kinerja Terintegrasi
        </div>
      </div>
    </div>
  );
};
