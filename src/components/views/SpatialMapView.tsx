import React, { useState } from 'react';
import { Pegawai, UnitPelayanan, TempatKerja, LantaiArea } from '../../types';
import { TEMPAT_KERJA_LIST, UNIT_PELAYANAN_LIST } from '../../data/initialData';
import { getKondisiBadge } from '../../utils/helpers';
import { 
  MapPin, 
  Layers, 
  Compass, 
  Ship, 
  Building2, 
  Phone, 
  MessageSquare, 
  UserCheck, 
  AlertTriangle, 
  Activity,
  Maximize2
} from 'lucide-react';

interface SpatialMapViewProps {
  pegawaiList: Pegawai[];
  units: UnitPelayanan[];
  onOpenQuickStatus: () => void;
}

export const SpatialMapView: React.FC<SpatialMapViewProps> = ({
  pegawaiList,
  units,
  onOpenQuickStatus
}) => {
  const [activeTab, setActiveTab] = useState<'peta_pulau' | 'denah_lantai'>('denah_lantai');
  const [selectedTempatKerja, setSelectedTempatKerja] = useState<TempatKerja>(
    'Puskesmas Kepulauan Seribu Selatan'
  );
  const [selectedLantai, setSelectedLantai] = useState<LantaiArea>('Lantai 1');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // Filter units for floorplan
  const currentUnits = units.filter(
    (u) => u.tempatKerja === selectedTempatKerja && u.lantai === selectedLantai
  );

  // Active room data
  const activeRoom = units.find((u) => u.id === activeRoomId);
  const occupantsInActiveRoom = activeRoom
    ? pegawaiList.filter((p) => p.currentUnitId === activeRoom.id && p.status === 'hadir')
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Toggle */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900">
              Denah Ruangan & Peta Geografis Posisi Pegawai
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi spasial keberadaan dan kondisi tenaga kesehatan di setiap ruangan fasilitas kesehatan kepulauan.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('denah_lantai')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'denah_lantai'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Denah Tata Ruang / Lantai</span>
          </button>
          <button
            onClick={() => setActiveTab('peta_pulau')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'peta_pulau'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Radar Geografis Kepulauan</span>
          </button>
        </div>
      </div>

      {activeTab === 'denah_lantai' ? (
        /* --- MODE 1: DENAH TATA RUANG (FLOORPLAN VIEW) --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Architectural Layout (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              {/* Tempat Kerja Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {TEMPAT_KERJA_LIST.map((tk) => (
                  <button
                    key={tk.id}
                    onClick={() => {
                      setSelectedTempatKerja(tk.id);
                      setSelectedLantai('Lantai 1');
                      setActiveRoomId(null);
                    }}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition border ${
                      selectedTempatKerja === tk.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {tk.id === 'Kantor Transit Jakarta' ? 'Kantor Transit Jakarta' : tk.pulau}
                  </button>
                ))}
              </div>

              {/* Lantai Selector */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pilih Lantai:
                  </span>
                  {['Lantai 1', 'Lantai 2', 'Lantai 3'].map((l) => {
                    if (selectedTempatKerja === 'Kantor Transit Jakarta' && l !== 'Lantai 1') {
                      return null; // Kantor Transit Jakarta hanya 1 lantai
                    }
                    if (selectedTempatKerja !== 'Puskesmas Kepulauan Seribu Selatan' && l === 'Lantai 3') {
                      return null; // Pustu hanya 2 lantai
                    }
                    return (
                      <button
                        key={l}
                        onClick={() => {
                          setSelectedLantai(l as LantaiArea);
                          setActiveRoomId(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          selectedLantai === l
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Klik ruangan untuk melihat nakes di dalam
                </div>
              </div>

              {/* Graphical Floorplan Architectural Schema */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-white relative overflow-hidden shadow-inner min-h-[420px] flex flex-col justify-between">
                {/* Blueprint Grid Watermark */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                />

                {/* Blueprint Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
                      DENAH SPASIAL: {selectedTempatKerja.toUpperCase()} - {selectedLantai.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    LIVE SENSOR POSISI
                  </span>
                </div>

                {/* Interactive Rooms Grid Blueprint */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3.5 my-4">
                  {currentUnits.map((room) => {
                    const occupants = pegawaiList.filter(
                      (p) => p.currentUnitId === room.id && p.status === 'hadir'
                    );
                    const isSelected = activeRoomId === room.id;
                    const hasTindakan = occupants.some((o) => o.kondisi === 'tindakan_pasien');
                    const hasIstirahat = occupants.some((o) => o.kondisi === 'istirahat');
                    const isKosong = occupants.length === 0;

                    let roomBg = 'bg-gradient-to-br from-red-950/90 via-rose-950/70 to-slate-900 border-2 border-red-500 text-red-100 shadow-sm ring-1 ring-red-500/60';
                    let statusLabel = '🔴 KOSONG (BELUM LOGIN)';
                    let statusColor = 'text-red-400 font-black';

                    if (hasTindakan) {
                      roomBg = 'bg-amber-950/80 border-amber-500 text-amber-200';
                      statusLabel = 'Sedang Tindakan';
                      statusColor = 'text-amber-400';
                    } else if (hasIstirahat) {
                      roomBg = 'bg-slate-800/80 border-slate-600 text-slate-200';
                      statusLabel = '☕ Istirahat';
                      statusColor = 'text-slate-400';
                    } else if (!isKosong) {
                      roomBg = 'bg-emerald-950/70 border-emerald-500 text-emerald-100';
                      statusLabel = `${occupants.length} Nakes Aktif`;
                      statusColor = 'text-emerald-400';
                    }

                    return (
                      <div
                        key={room.id}
                        onClick={() => setActiveRoomId(room.id)}
                        className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between min-h-[105px] group ${roomBg} ${
                          isSelected ? 'ring-2 ring-cyan-400 shadow-lg scale-[1.02]' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-xs leading-snug line-clamp-2">
                              {room.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              #{room.id.slice(-4)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {room.deskripsi || 'Ruangan'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-bold ${statusColor}`}>
                            {statusLabel}
                          </span>
                          {occupants.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {occupants.slice(0, 3).map((occ) => (
                                <img
                                  key={occ.id}
                                  src={occ.avatar}
                                  alt={occ.nama}
                                  title={`${occ.nama} (${occ.kondisi})`}
                                  className="inline-block h-5 w-5 rounded-full ring-1 ring-slate-900 object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Blueprint Footer Legend */}
                <div className="relative z-10 border-t border-slate-800 pt-2 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Terisi / Siap
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Tindakan Pasien
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> SOS Alert
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-500" /> Ruangan Kosong
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    Sistem Denah SI NAKHODA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Room Details & Personnel (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4 sticky top-20">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Inspeksi Ruangan
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">
                  {activeRoom ? activeRoom.name : 'Pilih Ruangan di Denah'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeRoom ? `${activeRoom.tempatKerja} - ${activeRoom.lantai}` : 'Klik salah satu kotak ruangan di denah lantai sebelah kiri.'}
                </p>
              </div>

              {activeRoom ? (
                <div className="space-y-4">
                  {/* Occupants list */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                      <span>Nakes di Dalam Ruangan:</span>
                      <span className="text-blue-600 font-extrabold">{occupantsInActiveRoom.length} Orang</span>
                    </div>

                    {occupantsInActiveRoom.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-400 border border-slate-100">
                        Ruangan saat ini kosong, belum ada tenaga medis yang check-in di sini.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {occupantsInActiveRoom.map((occ) => {
                          const badge = getKondisiBadge(occ.kondisi);
                          return (
                            <div
                              key={occ.id}
                              className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={occ.avatar}
                                    alt={occ.nama}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                                  />
                                  <div>
                                    <div className="font-bold text-xs text-slate-900">{occ.nama}</div>
                                    <div className="text-[10px] text-slate-500">{occ.profesi}</div>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${badge.badgeClass}`}>
                                  {badge.label}
                                </span>
                              </div>

                              {occ.kondisiCatatan && (
                                <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100">
                                  "{occ.kondisiCatatan}"
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-1 text-[11px]">
                                <span className="text-slate-400 font-mono">
                                  Jam: {occ.lastUpdateTime || occ.lastCheckinTime} WIB
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={`tel:${occ.telepon}`}
                                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                                    title="Telepon Cepat"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`https://wa.me/62${occ.telepon.replace(/^0/, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition"
                                    title="WhatsApp Cepat"
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

                  {/* Room Details info */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="font-bold text-slate-700">Informasi Ruangan:</div>
                    <div className="text-slate-500">{activeRoom.deskripsi || '-'}</div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Kapasitas Standar: {activeRoom.kapasitasIdeal} Personil
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 text-center text-slate-400 text-xs">
                  <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  Silakan klik salah satu unit di gambar denah untuk melihat informasi lengkap tenaga medis di dalamnya.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* --- MODE 2: RADAR GEOGRAFIS KEPULAUAN SERIBU --- */
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <span>Peta Maritim Kepulauan Seribu Selatan</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pemantauan sebaran pulau (Tidung, Untung Jawa, Pari, Lancang) serta armada Ambulans Laut Bahtera Sehat.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Teluk Jakarta & Laut Jawa
            </div>
          </div>

          {/* Interactive Geographic Marine Map Canvas */}
          <div className="relative rounded-3xl bg-gradient-to-b from-sky-950 via-slate-900 to-blue-950 p-6 text-white min-h-[460px] flex flex-col justify-between overflow-hidden shadow-xl border border-slate-800">
            {/* Water Waves Effect */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#38bdf8 1.5px, transparent 1.5px)',
                backgroundSize: '32px 32px'
              }}
            />

            {/* Latitude / Longitude Radar Grid Lines */}
            <div className="absolute inset-x-0 top-1/3 border-b border-cyan-500/20 pointer-events-none" />
            <div className="absolute inset-x-0 top-2/3 border-b border-cyan-500/20 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/3 border-r border-cyan-500/20 pointer-events-none" />
            <div className="absolute inset-y-0 left-2/3 border-r border-cyan-500/20 pointer-events-none" />

            {/* Islands Markers Layout */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              {TEMPAT_KERJA_LIST.map((tk) => {
                const staffHere = pegawaiList.filter(
                  (p) => (p.currentTempatKerja || p.tempatTugas) === tk.id && p.status === 'hadir'
                );

                return (
                  <div
                    key={tk.id}
                    className="rounded-2xl p-4 border backdrop-blur-md transition-all hover:scale-105 cursor-pointer bg-slate-800/80 border-slate-700 hover:border-cyan-400"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-sm text-white">{tk.pulau}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {staffHere.length} Nakes
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mb-3">
                      Koord: {tk.coords.lat}, {tk.coords.lng}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      {staffHere.slice(0, 2).map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-xs text-slate-300">
                          <span className="truncate max-w-[130px]">{s.nama}</span>
                          <span className="text-[10px] text-cyan-300">{s.profesi}</span>
                        </div>
                      ))}
                      {staffHere.length > 2 && (
                        <div className="text-[10px] text-slate-400 italic">
                          +{staffHere.length - 2} tenaga kesehatan lainnya
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Radar Coordinates Footer */}
            <div className="relative z-10 flex items-center justify-between text-xs font-mono text-cyan-400/80 border-t border-slate-800 pt-3">
              <span>PUSAT NAVIGASI KEPULAUAN SERIBU SELATAN</span>
              <span className="hidden sm:inline">PEMANTAUAN POSISI GPS TERINTEGRASI</span>
              <span>STATUS RADAR: ONLINE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
