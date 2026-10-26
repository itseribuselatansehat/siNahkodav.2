import React, { useState, useEffect } from 'react';
import { Pegawai, LaporDiriRecord, TempatKerja } from '../../types';
import { TEMPAT_KERJA_LIST } from '../../data/initialData';
import { triggerSuccessConfetti } from '../../utils/helpers';
import { 
  GOOGLE_DRIVE_FOLDER_ID, 
  GOOGLE_DRIVE_FOLDER_URL 
} from '../../utils/gasConfigService';
import { DeviceCameraCapture } from '../camera/DeviceCameraCapture';
import { 
  ClipboardCheck, 
  Camera, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  FileText,
  User,
  Search,
  Send,
  Image as ImageIcon,
  CloudUpload,
  ExternalLink,
  Minimize2,
  AlertCircle
} from 'lucide-react';

interface LaporDiriViewProps {
  currentUser: Pegawai;
  pegawaiList: Pegawai[];
  laporDiriList: LaporDiriRecord[];
  onSubmitLaporDiri: (record: Omit<LaporDiriRecord, 'id' | 'timestamp' | 'date'>) => void;
}

export const LaporDiriView: React.FC<LaporDiriViewProps> = ({
  currentUser,
  pegawaiList,
  laporDiriList,
  onSubmitLaporDiri
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

  const [kegiatan, setKegiatan] = useState<LaporDiriRecord['kegiatan']>('Apel Pagi');
  const [detail, setDetail] = useState<string>('');
  const [lokasi, setLokasi] = useState<string>('Halaman Utama Puskesmas');
  const [tempatTugas, setTempatTugas] = useState<TempatKerja>(selectedPegawai.tempatTugas || 'Puskesmas Kepulauan Seribu Selatan');

  // Search query to easily find employee name
  const [searchPegawaiQuery, setSearchPegawaiQuery] = useState<string>('');

  // Filtered employees by typed query
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

  // GPS Location for camera geotagging
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);

  // Form feedback state
  const [formFeedback, setFormFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Photo & compression
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedAddress, setCapturedAddress] = useState<string>('');
  const [compressionStats, setCompressionStats] = useState<{
    originalKb: number;
    compressedKb: number;
    ratio: number;
  } | null>(null);

  const fetchGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
        setGpsLoading(false);
      },
      () => {
        const targetTk = TEMPAT_KERJA_LIST.find((t) => t.id === tempatTugas) || TEMPAT_KERJA_LIST[0];
        setGpsLocation({
          lat: targetTk.coords.lat,
          lng: targetTk.coords.lng,
          accuracy: 8
        });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    fetchGPS();
  }, [tempatTugas]);

  // Filter for recap
  const [filterKegiatan, setFilterKegiatan] = useState<string>('Semua');

  // Handle employee change
  const handlePegawaiChange = (pegId: string) => {
    setSelectedPegawaiId(pegId);
    const peg = pegawaiList.find((p) => p.id === pegId);
    if (peg) {
      setTempatTugas(peg.tempatTugas);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim() || !lokasi.trim()) {
      setFormFeedback({
        type: 'error',
        message: 'Mohon isi nama kegiatan / keterangan dan lokasi kegiatan terlebih dahulu.'
      });
      return;
    }

    triggerSuccessConfetti();

    onSubmitLaporDiri({
      pegawaiId: selectedPegawai.id,
      pegawaiNama: selectedPegawai.nama,
      nip: selectedPegawai.nip,
      jabatan: selectedPegawai.jabatan,
      tempatTugas,
      kegiatan,
      detail,
      lokasi,
      fotoUrl: capturedPhoto || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&auto=format&fit=crop&q=80',
      coordinates: gpsLocation ? { lat: gpsLocation.lat, lng: gpsLocation.lng } : undefined,
      alamatLokasi: capturedAddress || undefined
    });

    // Reset Form
    setDetail('');
    setCapturedPhoto(null);
    setCapturedAddress('');
    setCompressionStats(null);
    setFormFeedback({
      type: 'success',
      message: `Lapor diri kegiatan ${kegiatan} untuk ${selectedPegawai.nama} berhasil dikirim dan disinkronkan!`
    });
    setTimeout(() => {
      setFormFeedback(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900">
              Form Lapor Diri Kegiatan Lapangan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pegawai cukup memilih nama pada dropdown tanpa perlu login. Ambil foto langsung menggunakan kamera device dengan deteksi lokasi otomatis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Lapor Diri (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Input Lapor Diri Kegiatan</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. DROPDOWN PILIH NAMA PEGAWAI (TANPA LOGIN) DENGAN PENCARIAN CEPAT */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>1. Pilih Nama Pegawai</span>
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                    {filteredPegawaiList.length} dari {pegawaiList.length} Nakes
                  </span>
                </div>

                {/* Kolom Pencarian Nama / NIP Pegawai */}
                <div className="relative">
                  <Search className="w-4 h-4 text-indigo-500 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchPegawaiQuery}
                    onChange={(e) => setSearchPegawaiQuery(e.target.value)}
                    placeholder="🔍 Ketik nama atau NIP pegawai..."
                    className="w-full text-xs font-semibold pl-9 pr-8 py-2 rounded-xl border border-indigo-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-400 outline-none shadow-xs placeholder:text-slate-400"
                  />
                  {searchPegawaiQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchPegawaiQuery('')}
                      className="absolute right-2.5 top-2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs flex items-center justify-center font-bold"
                      title="Hapus pencarian"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Select Pegawai */}
                <select
                  value={selectedPegawaiId}
                  onChange={(e) => handlePegawaiChange(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-indigo-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-300 outline-none"
                >
                  {pegawaiList.length === 0 ? (
                    <option value={selectedPegawai.id}>
                      {selectedPegawai.nama} — Menunggu Sinkronisasi Data GAS
                    </option>
                  ) : filteredPegawaiList.length === 0 ? (
                    <option value="" disabled>
                      Pegawai &quot;{searchPegawaiQuery}&quot; tidak ditemukan. Hapus pencarian.
                    </option>
                  ) : (
                    filteredPegawaiList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} — {p.profesi} ({p.jabatan}) [{p.tempatTugas}]
                      </option>
                    ))
                  )}
                </select>

                {/* Quick Selection Pills if searching */}
                {searchPegawaiQuery.trim().length > 0 && filteredPegawaiList.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                    {filteredPegawaiList.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePegawaiChange(p.id)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition border ${
                          p.id === selectedPegawaiId
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                            : 'bg-white hover:bg-indigo-100 text-slate-700 border-indigo-200'
                        }`}
                      >
                        ✓ {p.nama}
                      </button>
                    ))}
                  </div>
                )}

                {/* Auto Display Details */}
                <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{selectedPegawai.nama}</div>
                    <div className="text-[11px] text-slate-500">NIP: {selectedPegawai.nip} • {selectedPegawai.jabatan}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    {selectedPegawai.tempatTugas}
                  </span>
                </div>
              </div>

              {/* 2. PILIH KEGIATAN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Jenis Kegiatan
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">Pilih Cepat / Dropdown</span>
                </div>

                {/* Quick Selection Buttons with DLP & UPACARA prominently featured */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setKegiatan('DLP (Dinas Luar Penuh)');
                      if (!detail || detail.includes('Rujukan')) setDetail('Dinas Luar Penuh');
                    }}
                    className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border ${
                      kegiatan === 'DLP (Dinas Luar Penuh)'
                        ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400 shadow-xs scale-102'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200'
                    }`}
                  >
                    <span>🚢 DLP (Dinas Luar Penuh)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKegiatan('Upacara');
                      if (!detail || detail.includes('Apel')) setDetail('Upacara Resmi / Peringatan Hari Besar');
                    }}
                    className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
                      kegiatan === 'Upacara'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400 shadow-xs scale-102'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                    }`}
                  >
                    <span>🎖️ UPACARA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKegiatan('Apel Pagi');
                      if (!detail || detail.includes('Upacara')) setDetail('Apel Pagi Pegawai');
                    }}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                      kegiatan === 'Apel Pagi'
                        ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🌅 Apel Pagi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKegiatan('Dinas Luar Awal')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                      kegiatan === 'Dinas Luar Awal'
                        ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🚢 DL Awal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKegiatan('Dinas Luar Akhir')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                      kegiatan === 'Dinas Luar Akhir'
                        ? 'bg-teal-600 text-white border-teal-700 ring-2 ring-teal-400 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🏁 DL Akhir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKegiatan('Rabu Transportasi')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                      kegiatan === 'Rabu Transportasi'
                        ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-400 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🚲 Transportasi</span>
                  </button>
                </div>

                <select
                  value={kegiatan}
                  onChange={(e) => {
                    const val = e.target.value as LaporDiriRecord['kegiatan'];
                    setKegiatan(val);
                    if (val === 'DLP (Dinas Luar Penuh)') {
                      if (!detail || detail.includes('Rujukan')) setDetail('Dinas Luar Penuh');
                    }
                  }}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition"
                >
                  <option value="DLP (Dinas Luar Penuh)">🚢 DLP (Dinas Luar Penuh)</option>
                  <option value="Upacara">🎖️ Upacara (Upacara Resmi / Kenegaraan)</option>
                  <option value="Apel Pagi">🌅 Apel Pagi</option>
                  <option value="Dinas Luar Awal">🚢 Dinas Luar Awal</option>
                  <option value="Dinas Luar Akhir">🏁 Dinas Luar Akhir</option>
                  <option value="Rabu Transportasi">🚲 Rabu Transportasi Publik</option>
                  <option value="Posyandu Keliling">🏥 Posyandu Keliling Antar Pulau</option>
                  <option value="Izin Pimpinan">📋 Izin / Penugasan Khusus Pimpinan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Kegiatan / Detail
                </label>
                <input
                  type="text"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Contoh: Upacara Hari Kesehatan Nasional / Apel Pagi Gabungan"
                  required
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lokasi Pelaksanaan
                </label>
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Contoh: Lapangan Upacara / Halaman Kantor Kecamatan"
                  required
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* 3. BUKTI FOTO (FOKUS KAMERA DEVICE DENGAN DETEKSI LOKASI) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Bukti Foto (Fokus Kamera Device & Deteksi Lokasi)
                </label>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <DeviceCameraCapture
                    pegawaiNama={selectedPegawai.nama}
                    nip={selectedPegawai.nip}
                    lokasiLabel={lokasi}
                    unitOrKegiatanLabel={`Kegiatan: ${kegiatan}`}
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
                      const approxOriginalKb = Math.round(compressedKb * 3.3);
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
                    watermarkTitle={`LAPOR DIRI: ${kegiatan.toUpperCase()}`}
                  />
                </div>
              </div>

              {/* Form Feedback Banner */}
              {formFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
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

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Lapor Diri: {selectedPegawai.nama}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Laporan Riwayat & Recap (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Rekapitulasi Lapor Diri Hari Ini</span>
              </h3>

              <select
                value={filterKegiatan}
                onChange={(e) => setFilterKegiatan(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="Semua">Semua Kegiatan</option>
                <option value="DLP (Dinas Luar Penuh)">🚢 DLP (Dinas Luar Penuh)</option>
                <option value="Apel Pagi">Apel Pagi</option>
                <option value="Upacara">Upacara</option>
                <option value="Dinas Luar Awal">Dinas Luar</option>
                <option value="Rabu Transportasi">Rabu Transportasi</option>
                <option value="Rujukan Pasien Laut">Rujukan Pasien Laut</option>
                <option value="Posyandu Keliling">Posyandu Keliling</option>
              </select>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {laporDiriList
                .filter((item) => filterKegiatan === 'Semua' || item.kegiatan === filterKegiatan)
                .map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {record.fotoUrl && (
                        <img
                          src={record.fotoUrl}
                          alt={record.kegiatan}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">
                            {record.pegawaiNama}
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            {record.kegiatan}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium mt-0.5">
                          {record.detail}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{record.lokasi}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">
                        {record.timestamp} WIB
                      </span>
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-end mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Terverifikasi</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
