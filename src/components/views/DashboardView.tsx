import React, { useState } from 'react';
import { Pegawai, UnitPelayanan, MovementLog, TempatKerja, LantaiArea, KondisiPegawai } from '../../types';
import { TEMPAT_KERJA_LIST, UNIT_PELAYANAN_LIST } from '../../data/initialData';
import { getKondisiBadge } from '../../utils/helpers';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Coffee, 
  Ship, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Search, 
  Filter, 
  Building2, 
  ChevronRight,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  Moon
} from 'lucide-react';

interface DashboardViewProps {
  pegawaiList: Pegawai[];
  units: UnitPelayanan[];
  movementLogs: MovementLog[];
  currentUser: Pegawai;
  onOpenQuickStatus: () => void;
  onNavigateToMap: () => void;
  onNavigateToCheckin: () => void;
  onSimulateMidnightReset?: () => void;
  isAdminLoggedIn?: boolean;
  onNavigateToSettings?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  pegawaiList,
  units,
  movementLogs,
  currentUser,
  onOpenQuickStatus,
  onNavigateToMap,
  onNavigateToCheckin,
  onSimulateMidnightReset,
  isAdminLoggedIn,
  onNavigateToSettings
}) => {
  const [selectedTempatKerja, setSelectedTempatKerja] = useState<TempatKerja>(
    'Puskesmas Kepulauan Seribu Selatan'
  );
  const [selectedLantai, setSelectedLantai] = useState<string>('Semua');
  const [selectedKondisiFilter, setSelectedKondisiFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUnitDetail, setSelectedUnitDetail] = useState<UnitPelayanan | null>(null);

  // Stats calculation
  const totalPegawai = pegawaiList.length;
  const sudahCheckin = pegawaiList.filter((p) => p.status === 'hadir').length;
  const belumCheckin = pegawaiList.filter((p) => p.status === 'belum_hadir').length;
  const dinasLuar = pegawaiList.filter((p) => p.status === 'dinas_luar' || p.kondisi === 'dinas_luar').length;
  const sedangTindakan = pegawaiList.filter((p) => p.kondisi === 'tindakan_pasien').length;
  const sedangIstirahat = pegawaiList.filter((p) => p.kondisi === 'istirahat').length;

  // Filter units
  const filteredUnits = units.filter((unit) => {
    if (unit.tempatKerja !== selectedTempatKerja) return false;
    if (selectedLantai !== 'Semua' && unit.lantai !== selectedLantai) return false;
    
    // Check search in unit name
    if (searchQuery.trim()) {
      const matchUnit = unit.name.toLowerCase().includes(searchQuery.toLowerCase());
      // also check if occupants match search
      const occupants = pegawaiList.filter((p) => p.currentUnitId === unit.id);
      const matchOccupant = occupants.some((o) => o.nama.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchUnit && !matchOccupant) return false;
    }

    // Filter kondisi
    if (selectedKondisiFilter !== 'Semua') {
      const occupants = pegawaiList.filter((p) => p.currentUnitId === unit.id);
      if (selectedKondisiFilter === 'kosong') {
        if (occupants.length > 0) return false;
      } else {
        const hasMatchingCondition = occupants.some((o) => o.kondisi === selectedKondisiFilter);
        if (!hasMatchingCondition) return false;
      }
    }

    return true;
  });

  // Unique floors for current workplace
  const availableFloors = Array.from(
    new Set(units.filter((u) => u.tempatKerja === selectedTempatKerja).map((u) => u.lantai))
  );

  return (
    <div className="space-y-6">
      {/* Banner Khusus: Database Pegawai GAS (Hanya tampil bagi Pengelola/Admin) */}
      {isAdminLoggedIn && pegawaiList.length === 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                Data Dami Lokal Telah Dihapus — Menunggu Sinkronisasi Google Apps Script
              </h3>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300 mt-0.5">
                Aplikasi SI NAKHODA kini fokus menampilkan data master resmi dari sheet <code>Database_Pegawai</code> Google Apps Script yang Anda deploy.
              </p>
            </div>
          </div>
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <span>Buka Pengaturan GAS</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 1. Header Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-8 -bottom-10 opacity-10 hidden sm:block pointer-events-none">
          <Compass className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Sistem Pemantauan Terintegrasi Kepulauan
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Monitoring Posisi & Kondisi Pegawai
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
              Memantau persebaran posisi, kesiapan pelayanan, serta respon kondisi darurat tenaga kesehatan di Puskesmas Kecamatan dan seluruh Pustu Kepulauan Seribu Selatan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {isAdminLoggedIn && onSimulateMidnightReset && (
              <button
                onClick={onSimulateMidnightReset}
                className="px-3.5 py-2.5 rounded-2xl bg-indigo-950/70 hover:bg-indigo-950 text-indigo-200 hover:text-white font-semibold text-xs border border-indigo-400/30 transition-all flex items-center gap-1.5 shadow-sm"
                title="Simulasi otomatis tengah malam (00:00) yang mereset semua ruangan menjadi kosong agar pegawai dapat check-in kembali"
              >
                <Moon className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Reset Malam (Auto 00:00)</span>
                <span className="sm:hidden">Reset Malam</span>
              </button>
            )}
            <button
              onClick={onOpenQuickStatus}
              className="px-4 py-2.5 rounded-2xl bg-white text-blue-900 font-bold text-xs shadow-lg hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Update Kondisi Anda</span>
            </button>
            <button
              onClick={onNavigateToMap}
              className="px-4 py-2.5 rounded-2xl bg-blue-600/40 hover:bg-blue-600/60 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              <span>Buka Peta & Denah</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Pegawai */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Total Nakes</div>
            <div className="text-xl font-extrabold text-slate-900 leading-none mt-1">
              {totalPegawai} <span className="text-xs font-normal text-slate-400">Orang</span>
            </div>
          </div>
        </div>

        {/* Hadir / Check-In */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Hadir di Unit</div>
            <div className="text-xl font-extrabold text-slate-900 leading-none mt-1">
              {sudahCheckin} <span className="text-xs font-normal text-slate-400">Orang</span>
            </div>
          </div>
        </div>

        {/* Sedang Tindakan Medis Kritis */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Tindakan Medis</div>
            <div className="text-xl font-extrabold text-amber-700 leading-none mt-1">
              {sedangTindakan} <span className="text-xs font-normal text-slate-400">Kasus</span>
            </div>
          </div>
        </div>

        {/* Dinas Luar / Rujukan Laut */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Dinas / Rujukan</div>
            <div className="text-xl font-extrabold text-blue-700 leading-none mt-1">
              {dinasLuar} <span className="text-xs font-normal text-slate-400">Orang</span>
            </div>
          </div>
        </div>

        {/* Istirahat */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Istirahat</div>
            <div className="text-xl font-extrabold text-slate-900 leading-none mt-1">
              {sedangIstirahat} <span className="text-xs font-normal text-slate-400">Orang</span>
            </div>
          </div>
        </div>

        {/* Belum Check-in */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Belum Check-In</div>
            <div className="text-xl font-extrabold text-slate-900 leading-none mt-1">
              {belumCheckin} <span className="text-xs font-normal text-slate-400">Orang</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Workplace Selector (Puskesmas Tidung vs Pustu Kepulauan) */}
      <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Tab Buttons for Workplaces */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Lokasi Fasilitas Kerja
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {TEMPAT_KERJA_LIST.map((tk) => {
              const isSelected = selectedTempatKerja === tk.id;
              const staffInLocation = pegawaiList.filter(
                (p) => (p.currentTempatKerja || p.tempatTugas) === tk.id && p.status === 'hadir'
              ).length;

              return (
                <button
                  key={tk.id}
                  onClick={() => {
                    setSelectedTempatKerja(tk.id);
                    setSelectedLantai('Semua');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tk.id === 'Kantor Transit Jakarta' ? 'Kantor Transit Jakarta' : tk.pulau}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {staffInLocation} Nakes
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls: Floor, Condition, Search */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Floor Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setSelectedLantai('Semua')}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                  selectedLantai === 'Semua' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Lantai
              </button>
              {availableFloors.map((fl) => (
                <button
                  key={fl}
                  onClick={() => setSelectedLantai(fl)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                    selectedLantai === fl ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {fl}
                </button>
              ))}
            </div>

            {/* Condition Filter */}
            <select
              value={selectedKondisiFilter}
              onChange={(e) => setSelectedKondisiFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium outline-none focus:border-blue-500"
            >
              <option value="Semua">Semua Kondisi</option>
              <option value="siap_melayani">🟢 Siap Melayani</option>
              <option value="tindakan_pasien">🟡 Sedang Tindakan</option>
              <option value="butuh_bantuan">🚨 Butuh Bantuan / SOS</option>
              <option value="istirahat">☕ Istirahat</option>
              <option value="dinas_luar">🚤 Dinas Luar</option>
              <option value="kosong">⚪ Ruangan Kosong</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ruangan atau nakes..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* 4. Main Content: Unit Grid (Left) + Activity Stream & Island Status (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Units Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">
                Kondisi Ruangan & Unit Pelayanan
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                {filteredUnits.length} Unit
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-3 hidden sm:flex">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Terisi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Tindakan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Kosong
              </span>
            </div>
          </div>

          {filteredUnits.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">Tidak ada unit yang sesuai dengan filter.</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan pilihan lantai, kondisi, atau kata kunci pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredUnits.map((unit) => {
                // Find occupants in this unit
                const occupants = pegawaiList.filter(
                  (p) => p.currentUnitId === unit.id && p.status === 'hadir'
                );
                const hasTindakan = occupants.some((o) => o.kondisi === 'tindakan_pasien');
                const isKosong = occupants.length === 0;

                return (
                  <div
                    key={unit.id}
                    onClick={() => setSelectedUnitDetail(unit)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 relative flex flex-col justify-between ${
                      hasTindakan
                        ? 'bg-amber-50/70 border-amber-300'
                        : !isKosong
                        ? 'bg-white border-emerald-200/90 shadow-2xs'
                        : 'bg-gradient-to-br from-red-50 via-rose-50/90 to-red-100/60 border-2 border-red-500 shadow-sm ring-1 ring-red-300/60'
                    }`}
                  >
                    {/* Top: Name & Floor Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-2">
                        <div className={`font-bold text-xs leading-snug line-clamp-2 ${isKosong ? 'text-red-950' : 'text-slate-900'}`}>
                          {unit.name}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isKosong && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-red-600 text-white tracking-wide shadow-2xs">
                              Kosong
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500">
                            {unit.lantai}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className={`text-[10px] line-clamp-1 mb-3 ${isKosong ? 'text-red-700/80 font-medium' : 'text-slate-400'}`}>
                        {unit.deskripsi || 'Layanan fasilitas puskesmas'}
                      </p>
                    </div>

                    {/* Bottom: Occupants info */}
                    <div className={`pt-2 border-t ${isKosong ? 'border-red-200' : 'border-slate-100/80'}`}>
                      {isKosong ? (
                        <div className="flex items-center justify-between text-xs py-1">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-700">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Belum ada yang login
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white shadow-2xs">
                            KOSONG
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {occupants.map((occ) => {
                            const badge = getKondisiBadge(occ.kondisi);
                            return (
                              <div key={occ.id} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={occ.avatar}
                                    alt={occ.nama}
                                    className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-slate-800 truncate">
                                      {occ.nama}
                                    </div>
                                    <div className="text-[9px] text-slate-500 truncate">
                                      {occ.profesi} • {occ.lastUpdateTime || occ.lastCheckinTime} WIB
                                    </div>
                                  </div>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${badge.badgeClass}`}>
                                  {badge.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Movement Feed & Island Radar Overview (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Island Summary Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Sebaran Personil Kepulauan</span>
              </h3>
              <button
                onClick={onNavigateToMap}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
              >
                <span>Peta</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {TEMPAT_KERJA_LIST.map((tk) => {
                const count = pegawaiList.filter(
                  (p) => (p.currentTempatKerja || p.tempatTugas) === tk.id && p.status === 'hadir'
                ).length;
                const percent = Math.min(100, Math.round((count / totalPegawai) * 100));

                return (
                  <div key={tk.id} className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800">{tk.pulau}</span>
                      <span className="font-bold text-blue-600">{count} Personil</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Realtime Movement & Activity Feed */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Log Perpindahan & Kondisi</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
                Live Stream
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {movementLogs.slice(0, 7).map((log) => {
                const badge = getKondisiBadge(log.kondisi);
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100 text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-slate-900 truncate">
                        {log.pegawaiNama}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {log.timestamp} WIB
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="font-medium text-slate-800">{log.keUnit}</span>
                      <span className="text-slate-400">({log.lantai})</span>
                    </div>

                    {log.catatan && (
                      <p className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded-lg border border-slate-200/60 line-clamp-2">
                        "{log.catatan}"
                      </p>
                    )}

                    <div className="pt-0.5 flex justify-end">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${badge.badgeClass}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Modal Detail Ruangan / Unit Pelayanan */}
      {selectedUnitDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/20 font-semibold uppercase">
                  {selectedUnitDetail.lantai}
                </span>
                <h3 className="font-bold text-base mt-1">{selectedUnitDetail.name}</h3>
                <p className="text-xs text-blue-100">{selectedUnitDetail.tempatKerja}</p>
              </div>
              <button
                onClick={() => setSelectedUnitDetail(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Petugas Sedang Berada di Ruangan Ini
                </div>

                {pegawaiList.filter((p) => p.currentUnitId === selectedUnitDetail.id && p.status === 'hadir').length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 text-center text-slate-500 text-xs border border-dashed border-slate-200">
                    Saat ini belum ada tenaga kesehatan yang terdaftar check-in di ruangan ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pegawaiList
                      .filter((p) => p.currentUnitId === selectedUnitDetail.id && p.status === 'hadir')
                      .map((p) => {
                        const badge = getKondisiBadge(p.kondisi);
                        return (
                          <div
                            key={p.id}
                            className="p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={p.avatar}
                                  alt={p.nama}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
                                />
                                <div>
                                  <div className="font-bold text-xs text-slate-900">{p.nama}</div>
                                  <div className="text-[10px] text-slate-500">{p.jabatan}</div>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.badgeClass}`}>
                                {badge.label}
                              </span>
                            </div>

                            {p.kondisiCatatan && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                💬 "{p.kondisiCatatan}"
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                              <span>Check-in: {p.lastCheckinTime || '-'} WIB</span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`tel:${p.telepon}`}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                  title="Hubungi Telepon"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/62${p.telepon.replace(/^0/, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                                  title="Chat WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Deskripsi Unit */}
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700">
                <span className="font-bold text-blue-900">Deskripsi Unit:</span>{' '}
                {selectedUnitDetail.deskripsi || 'Unit pelayanan kesehatan masyarakat.'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedUnitDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
