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
  const [nip, setNip] = useState<string>('12345');
  const [password, setPassword] = useState<string>('admin');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setLoading(false);
      // Find matching employee by NIP or id
      const matched = pegawaiList.find(
        (p) => p.nip === nip || (nip === '12345' && p.role === 'admin') || (nip === '67890' && p.nip === '67890')
      );

      const fallbackUser: Pegawai = pegawaiList[0] || {
        id: 'peg-admin',
        nip: '198207152006041002',
        nama: 'Admin SI NAKHODA',
        profesi: 'Tenaga Medis',
        jabatan: 'Koordinator Puskesmas',
        tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
        role: 'admin',
        status: 'belum_hadir',
        kondisi: 'siap_melayani',
        telepon: '081299887766'
      };

      if (matched) {
        onLoginSuccess(matched);
      } else {
        onLoginSuccess(fallbackUser);
      }
    }, 600);
  };

  const handleQuickDemo = (demoNip: string) => {
    setNip(demoNip);
    setPassword('demo');
    const matched = pegawaiList.find(
      (p) => p.nip === demoNip || (demoNip === '12345' && p.role === 'admin')
    ) || pegawaiList[0] || {
      id: 'peg-admin',
      nip: '198207152006041002',
      nama: 'Admin SI NAKHODA',
      profesi: 'Tenaga Medis',
      jabatan: 'Koordinator Puskesmas',
      tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
      role: 'admin',
      status: 'belum_hadir',
      kondisi: 'siap_melayani',
      telepon: '081299887766'
    };
    onLoginSuccess(matched);
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
              Puskesmas Kec. Kepulauan Seribu Selatan
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

          {/* Quick Demo Logins */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
              Akses Cepat Demo Persona
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('12345')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-800 text-left transition"
              >
                <div className="font-bold text-[11px]">drg. Ahmad Fauzi</div>
                <div className="text-[10px] text-blue-600">Admin / Kapus (NIP: 12345)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('67890')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 text-left transition"
              >
                <div className="font-bold text-[11px]">Suster Ani</div>
                <div className="text-[10px] text-emerald-600">Perawat PTM (NIP: 67890)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
