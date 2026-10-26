import React, { useState } from 'react';
import { Pegawai, TempatKerja } from '../../types';
import { TEMPAT_KERJA_LIST } from '../../data/initialData';
import { getKondisiBadge } from '../../utils/helpers';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Building2, 
  UserCheck, 
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

interface PegawaiDirectoryViewProps {
  pegawaiList: Pegawai[];
}

export const PegawaiDirectoryView: React.FC<PegawaiDirectoryViewProps> = ({
  pegawaiList
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProfesi, setSelectedProfesi] = useState<string>('Semua');
  const [selectedTempat, setSelectedTempat] = useState<string>('Semua');

  const profesiList = Array.from(new Set(pegawaiList.map((p) => p.profesi)));

  const filtered = pegawaiList.filter((p) => {
    if (selectedProfesi !== 'Semua' && p.profesi !== selectedProfesi) return false;
    if (selectedTempat !== 'Semua' && (p.currentTempatKerja || p.tempatTugas) !== selectedTempat) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.nama.toLowerCase().includes(q);
      const matchNip = p.nip.toLowerCase().includes(q);
      const matchJabatan = p.jabatan.toLowerCase().includes(q);
      if (!matchName && !matchNip && !matchJabatan) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900">
              Direktori Tenaga Kesehatan & Pegawai
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar personil kesehatan di Puskesmas Kepulauan Seribu Selatan bersumber langsung dari database Google Apps Script Spreadsheet.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
          {filtered.length} Personil Aktif
        </span>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Cari Pegawai
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nama, NIP, atau jabatan..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Profesi / Bidang
          </label>
          <select
            value={selectedProfesi}
            onChange={(e) => setSelectedProfesi(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
          >
            <option value="Semua">Semua Profesi</option>
            {profesiList.map((prof) => (
              <option key={prof} value={prof}>
                {prof}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Lokasi Tempat Tugas
          </label>
          <select
            value={selectedTempat}
            onChange={(e) => setSelectedTempat(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
          >
            <option value="Semua">Semua Pulau / Fasilitas</option>
            {TEMPAT_KERJA_LIST.map((tk) => (
              <option key={tk.id} value={tk.id}>
                {tk.pulau}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Data Pegawai</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {pegawaiList.length === 0
              ? 'Data dami lokal telah dibersihkan. Silakan gunakan tombol "Tarik dari GAS" pada banner di atas untuk mengambil data resmi dari Google Apps Script.'
              : 'Tidak ada personil yang sesuai dengan filter pencarian.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pegawai) => {
            const badge = getKondisiBadge(pegawai.kondisi);

            return (
              <div
                key={pegawai.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={pegawai.avatar}
                      alt={pegawai.nama}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {pegawai.nama}
                      </h4>
                      <div className="text-[10px] text-slate-400 font-mono">
                        NIP: {pegawai.nip}
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {pegawai.profesi}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${badge.badgeClass}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Jabatan & Tempat Tugas */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                  <div className="text-slate-600 font-medium">
                    {pegawai.jabatan}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{pegawai.currentTempatKerja || pegawai.tempatTugas}</span>
                  </div>
                  {pegawai.currentUnitName && (
                    <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 pt-1">
                      <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>{pegawai.currentUnitName} ({pegawai.currentLantai || '-'})</span>
                    </div>
                  )}
                  {pegawai.kondisiCatatan && (
                    <div className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-xl mt-1 border border-slate-100 line-clamp-2">
                      💬 "{pegawai.kondisiCatatan}"
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Contact Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {pegawai.telepon}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${pegawai.telepon}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Panggil Telepon"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/62${pegawai.telepon.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition"
                    title="Kirim WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat WA</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
};
