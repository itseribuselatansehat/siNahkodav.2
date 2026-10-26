import React, { useState } from 'react';
import { Pegawai } from '../types';
import { Lock, ShieldCheck, X, ArrowRight, UserCheck, KeyRound, AlertCircle, LogOut } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  onAdminLogin: (adminUser: Pegawai) => void;
  onAdminLogout: () => void;
  adminUser: Pegawai;
  pegawaiList: Pegawai[];
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  isAdminLoggedIn,
  onAdminLogin,
  onAdminLogout,
  adminUser,
  pegawaiList
}) => {
  const [nip, setNip] = useState('12345');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const admin = pegawaiList.find((p) => p.nip === nip || (nip === '12345' && p.role === 'admin')) || pegawaiList[0];
    if (nip === '12345' || nip === admin.nip || password === 'admin') {
      onAdminLogin(admin);
      onClose();
    } else {
      setError('NIP atau Password pengelola salah. Gunakan NIP: 12345 dan Password: admin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-cyan-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight tracking-tight">
                Akses Tersembunyi Pengelola & Pimpinan
              </h3>
              <p className="text-[11px] text-cyan-200">
                Puskesmas Kec. Kepulauan Seribu Selatan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isAdminLoggedIn ? (
            /* Mode Saat Sudah Login Pengelola */
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Mode Pengelola Sedang Aktif
                </span>
                <h4 className="font-extrabold text-base text-slate-900 mt-2">
                  {adminUser.nama}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  NIP: {adminUser.nip} • {adminUser.jabatan}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
                <div className="font-bold text-slate-700">Hak Akses Terbuka:</div>
                <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                  <li>Melihat seluruh log keterisian ruangan secara real-time</li>
                  <li>Mencetak laporan PDF pegawai belum absen masuk unit</li>
                  <li>Mencetak laporan PDF pegawai belum melapor kegiatan dinas</li>
                  <li>Mengubah konfigurasi fasilitas dan unit kerja</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAdminLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Mode Pengelola</span>
              </button>
            </div>
          ) : (
            /* Form Login Tersembunyi */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                <span className="font-bold">Info:</span> Menu ini khusus untuk Kepala Puskesmas, Kasubag TU, atau Tim Manajemen Kepegawaian untuk monitoring penuh.
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  NIP / Username Pengelola
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Masukkan NIP (Demo: 12345)"
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi Pengelola
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password (Demo: admin)"
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="p-2 bg-slate-50 rounded-xl text-[11px] text-slate-500 text-center font-mono">
                *Demo Cepat: NIP = <strong>12345</strong> | Sandi = <strong>admin</strong>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <span>Masuk sebagai Pengelola</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
