import React, { useState } from 'react';
import { Pegawai } from '../../types';
import { Ship, Lock, User, ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface LoginViewProps {
  pegawaiList: Pegawai[];
  onLoginSuccess: (user: Pegawai) => void;
  onBackToLanding: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  pegawaiList,
  onLoginSuccess,
  onBackToLanding
}) => {
  const [nip, setNip] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setLoading(false);
      const trimmedNip = nip.trim();
      const trimmedPass = password.trim();

      // 1. Cek Admin Pengelola
      if ((trimmedNip === '198911' || trimmedNip.toLowerCase() === 'admin') && trimmedPass === 'admin') {
        onLoginSuccess({
          id: 'peg-admin',
          nip: '198911',
          nama: 'Administrator SI NAKHODA',
          profesi: 'Staf Administrasi',
          jabatan: 'Pengelola & Tim Manajemen',
          tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
          role: 'admin',
          status: 'hadir',
          kondisi: 'siap_melayani',
          telepon: '081299887766',
          avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
        });
        return;
      }

      // 2. Cek Pegawai Terdaftar di Database GAS
      const matched = pegawaiList.find((p) => p.nip === trimmedNip);
      if (matched) {
        onLoginSuccess(matched);
        return;
      }

      // 3. Jika tidak terdaftar, TOLAK LOGIN
      setErrorMessage('NIP tidak terdaftar dalam database pegawai. Silakan periksa kembali atau hubungi pengelola.');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={onBackToLanding}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Depan</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-3xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/30 mb-3">
              <Ship className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              SI NAKHODA
            </h2>
            <p className="text-xs text-slate-500">
              Puskesmas Kepulauan Seribu Selatan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                NIP / ID Pegawai
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Masukkan NIP Pegawai"
                  required
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Memproses autentikasi...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
