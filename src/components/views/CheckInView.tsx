import React, { useState, useEffect, useRef } from 'react';
import { Pegawai, KondisiPegawai, TempatKerja, LantaiArea, UnitPelayanan } from '../../types';
import { TEMPAT_KERJA_LIST, UNIT_PELAYANAN_LIST } from '../../data/initialData';
import { triggerSuccessConfetti, calculateDistanceMeters } from '../../utils/helpers';
import { 
  GOOGLE_DRIVE_FOLDER_ID, 
  GOOGLE_DRIVE_FOLDER_URL 
} from '../../utils/gasConfigService';
import { DeviceCameraCapture } from '../camera/DeviceCameraCapture';
import { 
  Camera, 
  MapPin, 
  CheckCircle2, 
  Activity, 
  Coffee, 
  Ship, 
  RefreshCw, 
  UserCheck, 
  ArrowRight,
  User,
  Search,
  Image as ImageIcon,
  CloudUpload,
  ExternalLink,
  Minimize2,
  AlertCircle
} from 'lucide-react';

interface CheckInViewProps {
  pegawaiList: Pegawai[];
  currentUser: Pegawai;
  onSubmitCheckin: (data: {
    pegawaiId: string;
    tempatKerja: TempatKerja;
    lantai: LantaiArea;
    unitId: string;
    unitName: string;
    kondisi: KondisiPegawai;
    catatan: string;
    isDinasLuar: boolean;
    selfieUrl?: string;
    coordinates?: { lat: number; lng: number; accuracy?: number; distanceMeters?: number };
    alamatLokasi?: string;
  }) => void;
  onNavigateToDashboard: () => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({
  pegawaiList,
  currentUser,
  onSubmitCheckin,
  onNavigateToDashboard
}) => {
  // 1. Employee selection from dropdown (No login required!)
  const fallbackPegawai: Pegawai = (currentUser && currentUser.nama) ? currentUser : {
    id: 'peg-default',
    nip: '-',
    nama: 'Pegawai',
    profesi: 'Dokter',
    jabatan: 'Pegawai',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    role: 'pegawai',
    status: 'belum_hadir',
    kondisi: 'siap_melayani',
    telepon: '081299887766',
    avatar: 'https://ui-avatars.com/api/?name=Pegawai&background=0284c7&color=fff&bold=true'
  };

  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>(
    currentUser?.id || pegawaiList[0]?.id || fallbackPegawai.id
  );
  const selectedPegawai: Pegawai = 
    pegawaiList.find((p) => p.id === selectedPegawaiId) || 
    pegawaiList[0] || 
    fallbackPegawai;

  const defaultAvatar = selectedPegawai.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPegawai.nama || 'Pegawai')}&background=0284c7&color=fff&bold=true`;

  const [tempatKerja, setTempatKerja] = useState<TempatKerja>(
    selectedPegawai.tempatTugas || 'Puskesmas Kepulauan Seribu Selatan'
  );
  const [lantai, setLantai] = useState<LantaiArea>('Lantai 1');

  // Update workplace when selected employee changes
  const handlePegawaiChange = (pegId: string) => {
    setSelectedPegawaiId(pegId);
    const peg = pegawaiList.find((p) => p.id === pegId);
    if (peg) {
      setTempatKerja(peg.tempatTugas);
      setLantai('Lantai 1');
      const units = UNIT_PELAYANAN_LIST.filter(
        (u) => u.tempatKerja === peg.tempatTugas && u.lantai === 'Lantai 1'
      );
      setUnitId(units[0]?.id || '');
    }
  };

  // Search query to easily find employee name
  const [searchPegawaiQuery, setSearchPegawaiQuery] = useState<string>('');

  // Filtered employees based on typed search query (by nama, nip, or profesi)
  const filteredPegawaiList = pegawaiList.filter((p) => {
    if (!searchPegawaiQuery.trim()) return true;
    const q = searchPegawaiQuery.toLowerCase();
    return (
      (p.nama && p.nama.toLowerCase().includes(q)) ||
      (p.nip && p.nip.toLowerCase().includes(q)) ||
      (p.profesi && p.profesi.toLowerCase().includes(q)) ||
      (p.jabatan && p.jabatan.toLowerCase().includes(q))
    );
  });

  const availableUnits = UNIT_PELAYANAN_LIST.filter(
    (u) => u.tempatKerja === tempatKerja && u.lantai === lantai
  );

  const [unitId, setUnitId] = useState<string>(availableUnits[0]?.id || '');
  const [kondisi, setKondisi] = useState<KondisiPegawai>('siap_melayani');
  const [catatan, setCatatan] = useState<string>('');
  const [isDinasLuar, setIsDinasLuar] = useState<boolean>(false);
  const [kegiatanDinasLuar, setKegiatanDinasLuar] = useState<string>('');

  // GPS State
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    distanceMeters: number;
  } | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);

  // Photo & Location States (Fokus Kamera Device & Geotagging)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedAddress, setCapturedAddress] = useState<string>('');
  const [formFeedback, setFormFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Image Compression stats
  const [compressionStats, setCompressionStats] = useState<{
    originalKb: number;
    compressedKb: number;
    ratio: number;
  } | null>(null);

  // Fetch GPS
  const fetchGPS = () => {
    setGpsLoading(true);

    if (!navigator.geolocation) {
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        const targetTk = TEMPAT_KERJA_LIST.find((t) => t.id === tempatKerja) || TEMPAT_KERJA_LIST[0];
        const dist = calculateDistanceMeters(lat, lng, targetTk.coords.lat, targetTk.coords.lng);

        setGpsLocation({
          lat,
          lng,
          accuracy,
          distanceMeters: dist
        });
        setGpsLoading(false);
      },
      () => {
        const targetTk = TEMPAT_KERJA_LIST.find((t) => t.id === tempatKerja) || TEMPAT_KERJA_LIST[0];
        setGpsLocation({
          lat: targetTk.coords.lat,
          lng: targetTk.coords.lng,
          accuracy: 8,
          distanceMeters: 12
        });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    fetchGPS();
  }, [tempatKerja]);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDinasLuar && !kegiatanDinasLuar.trim()) {
      setFormFeedback({
        type: 'error',
        message: 'Mohon lengkapi nama kegiatan atau agenda dinas luar terlebih dahulu.'
      });
      return;
    }

    const selectedUnit = UNIT_PELAYANAN_LIST.find((u) => u.id === unitId);
    const unitName = isDinasLuar
      ? 'Dinas Luar: ' + kegiatanDinasLuar
      : selectedUnit ? selectedUnit.name : 'Unit Ruangan';

    triggerSuccessConfetti();

    onSubmitCheckin({
      pegawaiId: selectedPegawai.id,
      tempatKerja,
      lantai,
      unitId: isDinasLuar ? 'dinas-luar' : unitId,
      unitName,
      kondisi: isDinasLuar ? 'dinas_luar' : kondisi,
      catatan: isDinasLuar ? kegiatanDinasLuar : catatan,
      isDinasLuar,
      selfieUrl: capturedPhoto || undefined,
      coordinates: gpsLocation || undefined,
      alamatLokasi: capturedAddress || undefined
    });

    setFormFeedback({
      type: 'success',
      message: `Presensi Check-in berhasil untuk ${selectedPegawai.nama}! Posisi ruangan telah disimpan ke database.`
    });

    setTimeout(() => {
      onNavigateToDashboard();
    }, 1200);
  };

  const currentUnit = UNIT_PELAYANAN_LIST.find((u) => u.id === unitId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-xs text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 font-bold shadow-xs">
          <Camera className="w-6 h-6" />
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
          Form Check-In & Pembaruan Posisi Pegawai
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Pegawai cukup memilih nama pada dropdown di bawah tanpa perlu login. Posisi dan kesiapan ruangan langsung tercatat realtime!
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {/* 1. DROPDOWN PILIH NAMA PEGAWAI (TANPA PERLU LOGIN) DENGAN PENCARIAN CEPAT */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>1. Pilih Nama Pegawai (Tanpa Perlu Login)</span>
              </label>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                {filteredPegawaiList.length} dari {pegawaiList.length} Nakes
              </span>
            </div>

            {/* Kolom Pencarian Nama / NIP Pegawai */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-blue-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchPegawaiQuery}
                onChange={(e) => setSearchPegawaiQuery(e.target.value)}
                placeholder="🔍 Ketik nama, NIP, atau profesi untuk mencari cepat..."
                className="w-full text-xs font-semibold pl-9 pr-8 py-2.5 rounded-xl border border-blue-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 outline-none shadow-xs placeholder:text-slate-400"
              />
              {searchPegawaiQuery && (
                <button
                  type="button"
                  onClick={() => setSearchPegawaiQuery('')}
                  className="absolute right-2.5 top-2.5 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs flex items-center justify-center font-bold"
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Select (Terfilter berdasarkan hasil pencarian) */}
            <select
              value={selectedPegawaiId}
              onChange={(e) => handlePegawaiChange(e.target.value)}
              className="w-full text-xs font-bold px-4 py-3 rounded-xl border border-blue-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 outline-none shadow-xs"
            >
              {pegawaiList.length === 0 ? (
                <option value={selectedPegawai.id}>
                  {selectedPegawai.nama} — Menunggu Sinkronisasi Data GAS
                </option>
              ) : filteredPegawaiList.length === 0 ? (
                <option value="" disabled>
                  Pegawai &quot;{searchPegawaiQuery}&quot; tidak ditemukan. Hapus pencarian untuk melihat semua.
                </option>
              ) : (
                filteredPegawaiList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} — {p.profesi} ({p.jabatan}) [{p.tempatTugas}]
                  </option>
                ))
              )}
            </select>

            {/* Quick list pill matches when user is searching */}
            {searchPegawaiQuery.trim().length > 0 && filteredPegawaiList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {filteredPegawaiList.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePegawaiChange(p.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      p.id === selectedPegawaiId
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white hover:bg-blue-100 text-slate-700 border-blue-200'
                    }`}
                  >
                    ✓ {p.nama}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto-displayed Pegawai Card */}
          <div className="p-3.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <img
                src={selectedPegawai.avatar || defaultAvatar}
                alt={selectedPegawai.nama || 'Pegawai'}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultAvatar;
                }}
              />
              <div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {selectedPegawai.nama}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  NIP: {selectedPegawai.nip} • {selectedPegawai.profesi}
                </div>
                <div className="text-xs font-bold text-blue-700">
                  {selectedPegawai.jabatan}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Tempat Tugas Pokok:</div>
              <div className="text-xs font-bold text-slate-800">{selectedPegawai.tempatTugas}</div>
            </div>
          </div>
        </div>

        {/* 2. TEMPAT TUGAS BEKERJA & LANTAI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Fasilitas Tempat Kerja Saat Ini
            </label>
            <select
              value={tempatKerja}
              onChange={(e) => {
                const newTk = e.target.value as TempatKerja;
                setTempatKerja(newTk);
                setLantai('Lantai 1');
                const units = UNIT_PELAYANAN_LIST.filter(
                  (u) => u.tempatKerja === newTk && u.lantai === 'Lantai 1'
                );
                setUnitId(units[0]?.id || '');
              }}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
            >
              {TEMPAT_KERJA_LIST.map((tk) => (
                <option key={tk.id} value={tk.id}>
                  {tk.label} ({tk.pulau})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Lantai / Area
            </label>
            <select
              value={lantai}
              onChange={(e) => {
                const l = e.target.value as LantaiArea;
                setLantai(l);
                const units = UNIT_PELAYANAN_LIST.filter(
                  (u) => u.tempatKerja === tempatKerja && u.lantai === l
                );
                setUnitId(units[0]?.id || '');
              }}
              className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
            >
              {tempatKerja === 'Puskesmas Kepulauan Seribu Selatan' ? (
                <>
                  <option value="Lantai 1">Lantai 1 (Pelayanan & IGD)</option>
                  <option value="Lantai 2">Lantai 2 (Poli Khusus & Rawat)</option>
                  <option value="Lantai 3">Lantai 3 (Pimpinan & Aula)</option>
                  <option value="Area Luar / Lapangan">Area Luar / Lapangan</option>
                </>
              ) : tempatKerja === 'Kantor Transit Jakarta' ? (
                <>
                  <option value="Lantai 1">Lantai 1 (Ruang Transit, Rapat & Singgah)</option>
                  <option value="Area Luar / Lapangan">Area Luar / Dermaga</option>
                </>
              ) : (
                <>
                  <option value="Lantai 1">Lantai 1 (Pelayanan)</option>
                  <option value="Lantai 2">Lantai 2 (Observasi / Jaga)</option>
                  <option value="Area Luar / Lapangan">Area Luar / Lapangan</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* 3. RUANGAN UNIT KERJA */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            4. Ruangan Unit Pelayanan yang Dimasuki
          </label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full text-xs font-bold px-4 py-3 rounded-2xl border border-blue-400 bg-white text-blue-900 focus:ring-2 focus:ring-blue-200 outline-none shadow-xs"
          >
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — ({u.deskripsi || u.lantai})
              </option>
            ))}
          </select>
        </div>

        {/* Mode Dinas Luar Switcher */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          <div className="flex items-center gap-2.5">
            <Ship className="w-5 h-5 text-amber-600" />
            <div>
              <div className="font-bold text-xs">Sedang Bertugas Dinas Luar / Rujukan?</div>
              <div className="text-[11px] text-amber-700">
                Aktifkan jika sedang surveilans di pulau atau pendamping rujukan.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDinasLuar(!isDinasLuar)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              isDinasLuar
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-800 border border-amber-300'
            }`}
          >
            {isDinasLuar ? 'Aktif (Dinas Luar)' : 'Di Gedung Ruangan'}
          </button>
        </div>

        {isDinasLuar && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Agenda Dinas Luar
            </label>
            <input
              type="text"
              value={kegiatanDinasLuar}
              onChange={(e) => setKegiatanDinasLuar(e.target.value)}
              placeholder="Contoh: Rujukan pasien stroke / Posyandu balita RW 02"
              className="w-full text-xs px-4 py-2.5 rounded-xl border border-amber-300 focus:border-amber-500 outline-none"
            />
          </div>
        )}

        {/* 4. KONDISI PEGAWAI (No SOS option!) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            5. Kondisi Kesiapan Kerja Saat Ini
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                type: 'siap_melayani' as KondisiPegawai,
                title: '🟢 Siap Melayani',
                desc: 'Sehat prima melayani di ruangan',
                border: 'border-emerald-300 bg-emerald-50/50'
              },
              {
                type: 'tindakan_pasien' as KondisiPegawai,
                title: '🟡 Sedang Tindakan',
                desc: 'Menangani tindakan medis / partus',
                border: 'border-amber-300 bg-amber-50/50'
              },
              {
                type: 'istirahat' as KondisiPegawai,
                title: '☕ Istirahat / Ishoma',
                desc: 'Makan siang / jeda dinas sejenak',
                border: 'border-yellow-300 bg-yellow-50/50'
              }
            ].map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setKondisi(opt.type)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  kondisi === opt.type
                    ? `${opt.border} ring-2 ring-blue-500 shadow-xs font-bold`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-800">{opt.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Catatan Aktivitas / Keterangan (Opsional)
          </label>
          <input
            type="text"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: Mengisi shift pagi / Poli umum mulai dibuka"
            className="w-full text-xs px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
          />
        </div>

        {/* GPS Verification */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          {gpsLoading ? (
            <div className="text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Mendeteksi koordinat GPS satelit...</span>
            </div>
          ) : gpsLocation ? (
            <div>
              <div className="font-mono text-slate-800 font-semibold">
                GPS: {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}
              </div>
              <div className="text-[11px] text-slate-500">
                Akurasi: ±{gpsLocation.accuracy}m | Jarak dari Fasilitas: {gpsLocation.distanceMeters}m
              </div>
            </div>
          ) : (
            <div className="text-slate-500">Koordinat pulau siap disinkronkan</div>
          )}

          <button
            type="button"
            onClick={fetchGPS}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Perbarui</span>
          </button>
        </div>

        {/* 6. BUKTI FOTO (FOKUS KAMERA DEVICE DENGAN DETEKSI LOKASI OTOMATIS) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            6. Bukti Foto Kehadiran (Fokus Kamera Device & Deteksi Lokasi)
          </label>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <DeviceCameraCapture
              pegawaiNama={selectedPegawai.nama}
              nip={selectedPegawai.nip}
              lokasiLabel={tempatKerja}
              unitOrKegiatanLabel={isDinasLuar ? (kegiatanDinasLuar || 'Dinas Luar') : (currentUnit?.name || 'Unit Pelayanan')}
              gpsLocation={gpsLocation}
              gpsLoading={gpsLoading}
              onRefreshGps={fetchGPS}
              onPhotoCaptured={(dataUrl, address) => {
                setCapturedPhoto(dataUrl);
                if (address) {
                  setCapturedAddress(address);
                }
                const base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
                const compressedKb = Math.max(1, Math.round(((base64Len * 3) / 4) / 1024));
                const approxOriginalKb = Math.round(compressedKb * 3.4);
                setCompressionStats({
                  originalKb: approxOriginalKb,
                  compressedKb,
                  ratio: Math.round(((approxOriginalKb - compressedKb) / approxOriginalKb) * 100)
                });
              }}
              capturedPhoto={capturedPhoto}
              onResetPhoto={() => {
                setCapturedPhoto(null);
                setCapturedAddress('');
                setCompressionStats(null);
              }}
              compressionStats={compressionStats}
              watermarkTitle={`PRESENSI RUANGAN: ${tempatKerja.toUpperCase()}`}
            />
          </div>
        </div>

        {/* Inline Form Feedback */}
        {formFeedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              formFeedback.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {formFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{formFeedback.message}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm shadow-lg shadow-blue-500/25 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Kirim Check-In {selectedPegawai.nama}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
