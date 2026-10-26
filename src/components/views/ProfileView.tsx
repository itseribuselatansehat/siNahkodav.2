import React from 'react';
import { Pegawai } from '../../types';
import { getKondisiBadge } from '../../utils/helpers';
import { 
  UserCircle, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Phone, 
  Clock, 
  Activity, 
  ArrowRightLeft,
  KeyRound
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: Pegawai;
  pegawaiList: Pegawai[];
  onSelectUser: (user: Pegawai) => void;
  onOpenQuickStatus: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  pegawaiList,
  onSelectUser,
  onOpenQuickStatus
}) => {
  const badge = getKondisiBadge(currentUser.kondisi);



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative">
            <img
              src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.nama || 'User')}&background=0284c7&color=fff&bold=true`}
              alt={currentUser?.nama || 'User'}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-blue-500/20 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.nama || 'User')}&background=0284c7&color=fff&bold=true`;
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
              ✓
            </span>
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
                  {currentUser.nama}
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  NIP: {currentUser.nip}
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold self-center sm:self-auto ${badge.badgeClass}`}>
                {badge.label}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                {currentUser.jabatan}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                {currentUser.profesi}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold">
                Hak Akses: {currentUser.role === 'admin' ? 'Administrator' : 'Pegawai Operasional'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-slate-400 font-medium">Tempat Tugas Pokok:</div>
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{currentUser.tempatTugas}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-slate-400 font-medium">Posisi Ruangan Saat Ini:</div>
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{currentUser.currentUnitName || 'Belum Check-In di Ruangan'}</span>
              <span className="text-slate-400">({currentUser.currentLantai || '-'})</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-slate-400 font-medium">Nomor Kontak / WhatsApp:</div>
            <div className="font-bold text-slate-800 flex items-center gap-1.5 font-mono">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>{currentUser.telepon}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-slate-400 font-medium">Waktu Update Terakhir:</div>
            <div className="font-bold text-slate-800 flex items-center gap-1.5 font-mono">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{currentUser.lastUpdateTime || currentUser.lastCheckinTime || '-'} WIB</span>
            </div>
          </div>
        </div>

        {/* Quick Update Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onOpenQuickStatus}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            <span>Perbarui Posisi & Kondisi Anda Sekarang</span>
          </button>
        </div>
      </div>

      {/* Daftar Akun Pegawai Terdaftar */}
      {pegawaiList.length > 1 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Pilih Profil Pegawai
              </h3>
              <p className="text-xs text-slate-500">
                Pilih profil Anda dari daftar pegawai yang terdaftar di Google Spreadsheet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pegawaiList.slice(0, 12).map((peg) => {
              const isCurrent = peg.id === currentUser.id || peg.nip === currentUser.nip;

              return (
                <button
                  key={peg.id || peg.nip}
                  onClick={() => onSelectUser(peg)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2.5 ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={peg.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(peg.nama || 'User')}&background=0284c7&color=fff&bold=true`}
                      alt={peg.nama}
                      className="w-9 h-9 rounded-xl object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(peg.nama || 'User')}&background=0284c7&color=fff&bold=true`;
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {peg.nama}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {peg.jabatan || peg.profesi}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCurrent ? 'Aktif' : 'Pilih'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
