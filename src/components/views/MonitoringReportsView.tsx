import React, { useState } from 'react';
import { Pegawai, UnitPelayanan, LaporDiriRecord, TempatKerja } from '../../types';
import { TEMPAT_KERJA_LIST, UNIT_PELAYANAN_LIST } from '../../data/initialData';
import { 
  getKondisiBadge, 
  exportMonitoringPDF, 
  exportRekapitulasiPDF, 
  exportToCSV, 
  exportLaporKegiatanPDF 
} from '../../utils/helpers';
import { GOOGLE_DRIVE_FOLDER_ID, GOOGLE_DRIVE_FOLDER_URL } from '../../utils/gasConfigService';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock, 
  Phone, 
  MessageSquare,
  Building2,
  FileSpreadsheet,
  DoorOpen,
  CalendarCheck,
  Ship,
  Users,
  Printer,
  Send,
  ExternalLink,
  Eye,
  Camera,
  MapPin,
  Sparkles,
  ShieldCheck,
  CloudUpload,
  X
} from 'lucide-react';

interface MonitoringReportsViewProps {
  pegawaiList: Pegawai[];
  units: UnitPelayanan[];
  laporDiriList: LaporDiriRecord[];
}

export const MonitoringReportsView: React.FC<MonitoringReportsViewProps> = ({
  pegawaiList,
  units = UNIT_PELAYANAN_LIST,
  laporDiriList = []
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'keterisian_ruangan' | 'belum_masuk_ruangan' | 'belum_lapor_kegiatan' | 'seluruh_pegawai'>(
    'belum_lapor_kegiatan'
  );

  // Common Filters
  const [selectedTempatKerja, setSelectedTempatKerja] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tab 1 (Keterisian Ruangan) Filter
  const [filterStatusRuangan, setFilterStatusRuangan] = useState<'semua' | 'terisi' | 'kosong'>('semua');

  // Tab 3 (Laporan Kegiatan / Lapor Diri) Filters & State
  const [selectedKegiatan, setSelectedKegiatan] = useState<string>('Semua');
  const [filterBulan, setFilterBulan] = useState<string>('Semua'); // 'Semua', '01' - '12'
  const [filterTanggal, setFilterTanggal] = useState<string>(''); // 'YYYY-MM-DD'
  const [kegiatanSubTab, setKegiatanSubTab] = useState<'sudah_melapor' | 'belum_melapor'>('sudah_melapor');
  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<LaporDiriRecord | null>(null);

  // Tab 4 (Rekapitulasi Lengkap) Filter
  const [filterRekapStatus, setFilterRekapStatus] = useState<'semua' | 'belum_checkin' | 'sudah_checkin'>('semua');

  // Month list in Indonesian
  const MONTH_OPTIONS = [
    { value: 'Semua', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  // --- TAB 1: KETERISIAN RUANGAN DATA ---
  const roomsWithOccupancy = units
    .filter((u) => selectedTempatKerja === 'Semua' || u.tempatKerja === selectedTempatKerja)
    .map((unit) => {
      const occupants = pegawaiList.filter(
        (p) => p.currentUnitId === unit.id && p.status === 'hadir'
      );
      const isKosong = occupants.length === 0;
      return {
        ...unit,
        occupants,
        isKosong,
        statusLabel: isKosong ? 'KOSONG / BELUM LOGIN' : 'TERISI',
        occupantsNames: occupants.map((o) => o.nama).join(', ') || 'Belum ada nakes'
      };
    })
    .filter((room) => {
      if (filterStatusRuangan === 'terisi' && room.isKosong) return false;
      if (filterStatusRuangan === 'kosong' && !room.isKosong) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRoom = room.name.toLowerCase().includes(q);
        const matchLantai = room.lantai.toLowerCase().includes(q);
        const matchOcc = room.occupantsNames.toLowerCase().includes(q);
        if (!matchRoom && !matchLantai && !matchOcc) return false;
      }
      return true;
    });

  const totalRuanganCount = units.filter((u) => selectedTempatKerja === 'Semua' || u.tempatKerja === selectedTempatKerja).length;
  const ruanganTerisiCount = units
    .filter((u) => selectedTempatKerja === 'Semua' || u.tempatKerja === selectedTempatKerja)
    .filter((u) => pegawaiList.some((p) => p.currentUnitId === u.id && p.status === 'hadir')).length;
  const ruanganKosongCount = totalRuanganCount - ruanganTerisiCount;
  const percentTerisi = totalRuanganCount > 0 ? Math.round((ruanganTerisiCount / totalRuanganCount) * 100) : 0;

  // --- TAB 2: PEGAWAI BELUM CHECKIN / BELUM MASUK RUANGAN ---
  const pegawaiBelumMasukRuangan = pegawaiList.filter((p) => {
    const isBelum = p.status === 'belum_hadir' || !p.currentUnitId;
    if (!isBelum) return false;
    if (selectedTempatKerja !== 'Semua' && (p.currentTempatKerja || p.tempatTugas) !== selectedTempatKerja) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.nama.toLowerCase().includes(q);
      const matchNip = p.nip.toLowerCase().includes(q);
      const matchJabatan = p.jabatan.toLowerCase().includes(q);
      if (!matchName && !matchNip && !matchJabatan) return false;
    }
    return true;
  });

  // --- TAB 3: MONITORING LAPOR DIRI KEGIATAN (DINAS LUAR, APEL, UPACARA, RUJUKAN, DLL.) ---
  const activeStaffByTempat = pegawaiList.filter(
    (p) => selectedTempatKerja === 'Semua' || (p.currentTempatKerja || p.tempatTugas) === selectedTempatKerja
  );

  // Filter daftar lapor diri yang masuk berdasarkan jenis kegiatan, tempat kerja, bulan, tanggal, dan search query
  const filteredLaporDiriList = laporDiriList.filter((lap) => {
    if (selectedTempatKerja !== 'Semua' && lap.tempatTugas !== selectedTempatKerja) return false;
    if (selectedKegiatan !== 'Semua' && lap.kegiatan !== selectedKegiatan) return false;

    // Filter tanggal spesifik (YYYY-MM-DD)
    if (filterTanggal) {
      const recordIso = lap.isoDate || (lap.date === 'Hari ini' ? new Date().toISOString().slice(0, 10) : '');
      if (recordIso && recordIso !== filterTanggal) return false;
    }

    // Filter bulan ('01' - '12')
    if (filterBulan !== 'Semua') {
      const recordIso = lap.isoDate || (lap.date === 'Hari ini' ? new Date().toISOString().slice(0, 10) : '2026-10-23');
      const monthPart = recordIso.slice(5, 7);
      if (monthPart !== filterBulan) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lap.pegawaiNama.toLowerCase().includes(q);
      const matchNip = lap.nip.toLowerCase().includes(q);
      const matchDetail = lap.detail.toLowerCase().includes(q);
      const matchLokasi = lap.lokasi.toLowerCase().includes(q);
      const matchKegiatan = lap.kegiatan.toLowerCase().includes(q);
      const matchAlamat = lap.alamatLokasi ? lap.alamatLokasi.toLowerCase().includes(q) : false;
      if (!matchName && !matchNip && !matchDetail && !matchLokasi && !matchKegiatan && !matchAlamat) return false;
    }
    return true;
  });

  const pegawaiSudahLapor = activeStaffByTempat.filter((p) => {
    return laporDiriList.some((lap) => {
      const matchPerson = lap.pegawaiId === p.id || lap.nip === p.nip;
      const matchKeg = selectedKegiatan === 'Semua' || lap.kegiatan === selectedKegiatan;
      return matchPerson && matchKeg;
    });
  });

  const pegawaiBelumLapor = activeStaffByTempat.filter((p) => {
    const isReported = laporDiriList.some((lap) => {
      const matchPerson = lap.pegawaiId === p.id || lap.nip === p.nip;
      const matchKeg = selectedKegiatan === 'Semua' || lap.kegiatan === selectedKegiatan;
      return matchPerson && matchKeg;
    });
    return !isReported;
  });

  // --- PDF EXPORT HANDLERS ---
  // 1. Export PDF Keterisian Ruangan
  const handleExportPDFKeterisianRuangan = () => {
    const headers = ['No', 'Nama Ruangan', 'Lantai', 'Fasilitas Tempat Kerja', 'Status Ruangan', 'Nama Nakes di Dalam'];
    const rows = roomsWithOccupancy.map((r, idx) => [
      String(idx + 1),
      r.name,
      r.lantai,
      r.tempatKerja,
      r.isKosong ? 'KOSONG (BELUM LOGIN)' : 'TERISI',
      r.occupantsNames
    ]);

    exportMonitoringPDF({
      title: 'Laporan Monitoring Keterisian Ruangan Fasilitas Kesehatan',
      subtitle: `Total Ruangan: ${totalRuanganCount} | Terisi: ${ruanganTerisiCount} (${percentTerisi}%) | Kosong: ${ruanganKosongCount}`,
      tempatKerja: selectedTempatKerja,
      headers,
      rows,
      fileName: `Laporan_Keterisian_Ruangan_${Date.now()}.pdf`,
      headerColor: [37, 99, 235], // Blue
      colWidths: [10, 45, 25, 45, 30, 27],
      colX: [14, 24, 69, 94, 139, 169]
    });
  };

  // 2. Export PDF Pegawai Belum Masuk Ruangan
  const handleExportPDFBelumMasukRuangan = () => {
    const headers = ['No', 'NIP', 'Nama Pegawai', 'Profesi & Jabatan', 'Tempat Tugas', 'Status Kehadiran'];
    const rows = pegawaiBelumMasukRuangan.map((p, idx) => [
      String(idx + 1),
      p.nip,
      p.nama,
      `${p.profesi} - ${p.jabatan}`,
      p.tempatTugas,
      'BELUM CHECK-IN MASUK RUANGAN'
    ]);

    exportMonitoringPDF({
      title: 'Laporan Monitoring Pegawai Belum Check-In Masuk Ruangan',
      subtitle: `Daftar ${pegawaiBelumMasukRuangan.length} Personil Yang Belum Melaporkan Masuk Ruangan`,
      tempatKerja: selectedTempatKerja,
      headers,
      rows,
      fileName: `Laporan_Pegawai_Belum_Masuk_Ruangan_${Date.now()}.pdf`,
      headerColor: [220, 38, 38], // RED Danger Header
      colWidths: [10, 35, 45, 40, 30, 22],
      colX: [14, 24, 59, 104, 144, 174]
    });
  };

  // 3. Export PDF Laporan Kegiatan / Lapor Diri (Dinas Luar Awal, Dinas Luar Akhir, Apel, dsb.)
  const handleExportPDFLaporKegiatan = () => {
    const selectedMonthLabel = MONTH_OPTIONS.find((m) => m.value === filterBulan)?.label || filterBulan;
    exportLaporKegiatanPDF({
      title: selectedKegiatan === 'Semua' ? 'Laporan Seluruh Lapor Diri & Presensi Kegiatan' : `Laporan Pelaksanaan Kegiatan: ${selectedKegiatan}`,
      subtitle: `Rekapitulasi Pelaporan Nakes Terverifikasi Foto Google Drive & Koordinat GPS`,
      tempatKerja: selectedTempatKerja,
      kegiatanFilter: selectedKegiatan,
      bulanFilter: selectedMonthLabel,
      tanggalFilter: filterTanggal,
      records: filteredLaporDiriList,
      fileName: `Laporan_Kegiatan_${selectedKegiatan.replace(/ /g, '_')}_${Date.now()}.pdf`
    });
  };

  // 4. Export PDF Pegawai BELUM Melapor Kegiatan
  const handleExportPDFBelumLaporKegiatan = () => {
    const headers = ['No', 'NIP', 'Nama Pegawai', 'Profesi', 'Tempat Tugas Pokok', 'Keterangan Lapor Kegiatan'];
    const rows = pegawaiBelumLapor.map((p, idx) => [
      String(idx + 1),
      p.nip,
      p.nama,
      p.profesi,
      p.tempatTugas,
      `BELUM MELAPOR: ${selectedKegiatan.toUpperCase()}`
    ]);

    exportMonitoringPDF({
      title: `Laporan Pegawai BELUM Melapor Kegiatan: ${selectedKegiatan}`,
      subtitle: `Jumlah Pegawai Belum Melapor: ${pegawaiBelumLapor.length} dari ${activeStaffByTempat.length} Pegawai`,
      tempatKerja: selectedTempatKerja,
      headers,
      rows,
      fileName: `Laporan_BELUM_Lapor_${selectedKegiatan.replace(/ /g, '_')}_${Date.now()}.pdf`,
      headerColor: [220, 38, 38], // Prominent Red
      colWidths: [10, 36, 45, 30, 35, 26],
      colX: [14, 24, 60, 105, 135, 170]
    });
  };

  // 5. Export PDF Rekapitulasi Lengkap Semua Nakes (Mengetahui yang belum check-in)
  const handleExportPDFRekapitulasi = () => {
    exportRekapitulasiPDF({
      pegawaiList,
      tempatKerjaFilter: selectedTempatKerja,
      fileName: `Rekapitulasi_Kehadiran_Nakes_${selectedTempatKerja.replace(/ /g, '_')}_${Date.now()}.pdf`
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">
                Pusat Laporan & Monitoring Kepegawaian
              </h1>
              <p className="text-xs text-slate-500">
                Monitoring keterisian ruangan, deteksi nakes belum masuk unit, dan rekapitulasi kehadiran lengkap.
              </p>
            </div>
          </div>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'keterisian_ruangan' && (
            <button
              onClick={handleExportPDFKeterisianRuangan}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF Keterisian Ruangan</span>
            </button>
          )}

          {activeTab === 'belum_masuk_ruangan' && (
            <button
              onClick={handleExportPDFBelumMasukRuangan}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cetak PDF Pegawai Belum Masuk</span>
            </button>
          )}

          {activeTab === 'belum_lapor_kegiatan' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportPDFLaporKegiatan}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                title="Cetak PDF Laporan Kegiatan yang sedang terfilter"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak PDF Laporan Kegiatan ({filteredLaporDiriList.length})</span>
              </button>

              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                title="Buka Folder Penyimpanan Foto di Google Drive"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Buka Google Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {kegiatanSubTab === 'belum_melapor' && (
                <button
                  onClick={handleExportPDFBelumLaporKegiatan}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Cetak PDF Belum Lapor ({pegawaiBelumLapor.length})</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'seluruh_pegawai' && (
            <button
              onClick={handleExportPDFRekapitulasi}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 ring-2 ring-blue-500/30"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download PDF Rekapitulasi & Belum Check-in</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('keterisian_ruangan')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'keterisian_ruangan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>1. Monitoring Keterisian Ruangan</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'keterisian_ruangan' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {ruanganTerisiCount}/{totalRuanganCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('belum_masuk_ruangan')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'belum_masuk_ruangan'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>2. Pegawai Belum Masuk Ruangan</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold">
              {pegawaiBelumMasukRuangan.length} Orang
            </span>
          </button>

          <button
            onClick={() => setActiveTab('belum_lapor_kegiatan')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'belum_lapor_kegiatan'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>3. Laporan Kegiatan & Dinas Luar</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 text-indigo-900 font-bold">
              {filteredLaporDiriList.length} Laporan
            </span>
          </button>

          <button
            onClick={() => setActiveTab('seluruh_pegawai')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'seluruh_pegawai'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>4. Rekapitulasi Lengkap Semua Nakes</span>
          </button>
        </div>
      </div>

      {/* 3. Common Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tempat Kerja Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi:</span>
            <select
              value={selectedTempatKerja}
              onChange={(e) => setSelectedTempatKerja(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800"
            >
              <option value="Semua">Semua Lokasi Fasilitas</option>
              {TEMPAT_KERJA_LIST.map((tk) => (
                <option key={tk.id} value={tk.id}>
                  {tk.label}
                </option>
              ))}
            </select>
          </div>

          {/* Special filter for Tab 1 (Status Ruangan) */}
          {activeTab === 'keterisian_ruangan' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterStatusRuangan('semua')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  filterStatusRuangan === 'semua' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Semua ({totalRuanganCount})
              </button>
              <button
                onClick={() => setFilterStatusRuangan('terisi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  filterStatusRuangan === 'terisi' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Terisi ({ruanganTerisiCount})
              </button>
              <button
                onClick={() => setFilterStatusRuangan('kosong')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  filterStatusRuangan === 'kosong' ? 'bg-red-600 text-white shadow-2xs' : 'text-red-700'
                }`}
              >
                Kosong / Belum Login ({ruanganKosongCount})
              </button>
            </div>
          )}

          {/* Special filter for Tab 3 (Pilihan Kegiatan & Filter Tanggal/Bulan) */}
          {activeTab === 'belum_lapor_kegiatan' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kegiatan:</span>
                <select
                  value={selectedKegiatan}
                  onChange={(e) => setSelectedKegiatan(e.target.value)}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-900 outline-none"
                >
                  <option value="Semua">Semua Kegiatan</option>
                  <option value="Upacara">🎖️ Upacara Resmi</option>
                  <option value="Apel Pagi">🌅 Apel Pagi</option>
                  <option value="Dinas Luar Awal">🚢 Dinas Luar Awal</option>
                  <option value="Dinas Luar Akhir">🏁 Dinas Luar Akhir</option>
                  <option value="Rabu Transportasi">🚲 Rabu Transportasi</option>
                  <option value="Rujukan Pasien Laut">🚑 Rujukan Pasien Laut</option>
                  <option value="Posyandu Keliling">🏥 Posyandu Keliling</option>
                  <option value="Izin Pimpinan">📋 Izin Pimpinan</option>
                </select>
              </div>

              {/* Filter Bulan */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bulan:</span>
                <select
                  value={filterBulan}
                  onChange={(e) => setFilterBulan(e.target.value)}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-white text-slate-800 outline-none"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Tanggal */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal:</span>
                <input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="text-xs font-semibold px-2 py-1 rounded-xl border border-indigo-200 bg-white text-slate-800 outline-none"
                />
              </div>

              {(filterBulan !== 'Semua' || filterTanggal) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterBulan('Semua');
                    setFilterTanggal('');
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold transition flex items-center gap-1"
                  title="Reset Filter Tanggal & Bulan"
                >
                  <X className="w-3 h-3 text-red-500" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari data..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KETERISIAN RUANGAN (DENGAN WARNA MERAH UNTUK RUANGAN KOSONG) */}
      {/* ========================================================================= */}
      {activeTab === 'keterisian_ruangan' && (
        <div className="space-y-4">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500">Total Ruangan Unit</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalRuanganCount} <span className="text-xs font-normal text-slate-400">Unit</span></div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-emerald-700">Ruangan Terisi Nakes</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">{ruanganTerisiCount} <span className="text-xs font-normal text-emerald-600">Unit</span></div>
            </div>
            {/* Prominent Red for Empty Rooms */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-500 shadow-xs ring-1 ring-red-400/50">
              <div className="text-[11px] font-bold text-red-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Ruangan Belum Ada yang Login
              </div>
              <div className="text-2xl font-black text-red-900 mt-1">{ruanganKosongCount} <span className="text-xs font-bold text-red-600">Kosong</span></div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-blue-700">Persentase Keterisian</div>
              <div className="text-2xl font-black text-blue-900 mt-1">{percentTerisi}%</div>
            </div>
          </div>

          {/* Table of Rooms */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold">
                Tabel Keterisian Ruangan & Nakes Bertugas ({roomsWithOccupancy.length} Ruangan)
              </span>
              <span className="text-[11px] font-bold text-red-600">
                *Baris berwarna merah menandakan ruangan belum ada pegawai yang login/check-in
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12">No</th>
                    <th className="py-3 px-4">Nama Ruangan Unit</th>
                    <th className="py-3 px-4">Lantai / Area</th>
                    <th className="py-3 px-4">Fasilitas Tempat Kerja</th>
                    <th className="py-3 px-4 text-center">Status Keterisian</th>
                    <th className="py-3 px-4">Tenaga Kesehatan di Dalam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roomsWithOccupancy.map((room, idx) => (
                    <tr
                      key={room.id}
                      className={`transition-colors ${
                        room.isKosong
                          ? 'bg-red-50/70 hover:bg-red-100/60 border-l-4 border-l-red-600'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-bold ${room.isKosong ? 'text-red-950 font-extrabold' : 'text-slate-900'}`}>
                          {room.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {room.deskripsi || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {room.lantai}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {room.tempatKerja}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {room.isKosong ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-600 text-white shadow-2xs animate-pulse">
                            <XCircle className="w-3 h-3" />
                            KOSONG / BELUM LOGIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            TERISI ({room.occupants.length} Nakes)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {room.isKosong ? (
                          <span className="text-red-600 font-semibold text-[11px] italic">
                            Belum ada pegawai yang menempati
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {room.occupants.map((occ) => (
                              <div key={occ.id} className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{occ.nama}</span>
                                <span className="text-[10px] text-slate-400 font-normal">({occ.profesi})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PEGAWAI BELUM CHECK-IN MASUK KE RUANGAN MASING-MASING */}
      {/* ========================================================================= */}
      {activeTab === 'belum_masuk_ruangan' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-red-900">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">
                  Daftar Pegawai Belum Melaporkan Masuk Ruangan
                </h4>
                <p className="text-xs text-red-700">
                  Berikut adalah personil yang terdaftar belum melakukan check-in ruangan kerja pada sistem SI NAKHODA hari ini.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportPDFBelumMasukRuangan}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cetak PDF ({pegawaiBelumMasukRuangan.length})</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-red-50 text-red-900 font-bold uppercase text-[10px] tracking-wider border-b border-red-200">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Pegawai & NIP</th>
                    <th className="py-3 px-4">Profesi & Jabatan</th>
                    <th className="py-3 px-4">Fasilitas Tempat Tugas</th>
                    <th className="py-3 px-4">Status & Keterangan</th>
                    <th className="py-3 px-4 text-center">Hubungi Pegawai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pegawaiBelumMasukRuangan.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-emerald-600 font-bold text-xs">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                        Seluruh pegawai di lokasi ini telah berhasil check-in dan masuk ke ruangan masing-masing!
                      </td>
                    </tr>
                  ) : (
                    pegawaiBelumMasukRuangan.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-red-50/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NIP: {p.nip}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{p.profesi}</div>
                          <div className="text-[10px] text-slate-500">{p.jabatan}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {p.tempatTugas}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            BELUM CHECK-IN
                          </span>
                          {p.kondisiCatatan && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5">
                              "{p.kondisiCatatan}"
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={`tel:${p.telepon}`}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Panggil Telepon"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/62${p.telepon.replace(/^0/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition flex items-center gap-1"
                              title="Kirim Pesan WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Hubungi WA</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LAPORAN KEGIATAN & DINAS LUAR (FILTER KEGIATAN & AKSI VIEW FOTO) */}
      {/* ========================================================================= */}
      {activeTab === 'belum_lapor_kegiatan' && (
        <div className="space-y-4">
          {/* Action Callout & PDF Export Header */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-blue-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border border-indigo-800/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center text-cyan-300">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-base text-white">
                  Laporan Pelaksanaan Kegiatan & Lapor Diri: {selectedKegiatan}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-400 text-slate-950 shadow-2xs">
                  {filteredLaporDiriList.length} Laporan Masuk
                </span>
              </div>
              <p className="text-xs text-indigo-200 leading-relaxed max-w-2xl">
                Filter kegiatan dinas luar awal, dinas luar akhir, apel, upacara, dsb. Admin dapat melihat bukti foto pegawai dari database Google Drive sebelum mencetak laporan ke PDF.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto shrink-0">
              <button
                onClick={handleExportPDFLaporKegiatan}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 active:scale-95"
                title="Cetak dokumen PDF resmi laporan kegiatan terfilter"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak PDF Laporan Ini</span>
              </button>

              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                title="Buka Folder Google Drive tempat foto disimpan"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Buka Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Activity Pills Quick Filter */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Filter Berdasarkan Jenis Kegiatan:</span>
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                  Pilih kegiatan untuk filter instan
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'Semua', label: 'Semua Kegiatan', count: laporDiriList.length, icon: '📋' },
                  { id: 'Upacara', label: '🎖️ UPACARA', count: laporDiriList.filter(l => l.kegiatan === 'Upacara').length, icon: '🎖️' },
                  { id: 'Apel Pagi', label: '🌅 Apel Pagi', count: laporDiriList.filter(l => l.kegiatan === 'Apel Pagi').length, icon: '🌅' },
                  { id: 'Dinas Luar Awal', label: '🚢 DL Awal', count: laporDiriList.filter(l => l.kegiatan === 'Dinas Luar Awal').length, icon: '🚢' },
                  { id: 'Dinas Luar Akhir', label: '🏁 DL Akhir', count: laporDiriList.filter(l => l.kegiatan === 'Dinas Luar Akhir').length, icon: '🏁' },
                  { id: 'Rabu Transportasi', label: '🚲 Transportasi', count: laporDiriList.filter(l => l.kegiatan === 'Rabu Transportasi').length, icon: '🚲' },
                  { id: 'Rujukan Pasien Laut', label: '🚑 Rujukan Laut', count: laporDiriList.filter(l => l.kegiatan === 'Rujukan Pasien Laut').length, icon: '🚑' },
                  { id: 'Posyandu Keliling', label: '🏥 Posyandu Keliling', count: laporDiriList.filter(l => l.kegiatan === 'Posyandu Keliling').length, icon: '🏥' },
                  { id: 'Izin Pimpinan', label: '📄 Izin Pimpinan', count: laporDiriList.filter(l => l.kegiatan === 'Izin Pimpinan').length, icon: '📄' }
                ].map((act) => {
                  const isActive = selectedKegiatan === act.id;
                  const isUpacara = act.id === 'Upacara';
                  return (
                    <button
                      key={act.id}
                      onClick={() => setSelectedKegiatan(act.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isActive
                          ? isUpacara
                            ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400 scale-102'
                            : 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40 scale-102'
                          : isUpacara
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{act.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isActive
                            ? isUpacara ? 'bg-slate-900 text-amber-300' : 'bg-white/25 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {act.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Panel: Filter Bulan dan Tanggal */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Filter Bulan Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Filter Bulan:</span>
                  </span>
                  <select
                    value={filterBulan}
                    onChange={(e) => setFilterBulan(e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Tanggal Input */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Filter Tanggal:</span>
                  </span>
                  <input
                    type="date"
                    value={filterTanggal}
                    onChange={(e) => setFilterTanggal(e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {/* Tombol Reset Filter Tanggal & Bulan */}
                {(filterBulan !== 'Semua' || filterTanggal) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterBulan('Semua');
                      setFilterTanggal('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition shadow-2xs"
                    title="Hapus filter bulan dan tanggal"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset Filter Waktu</span>
                  </button>
                )}
              </div>

              {/* Status Info Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {filterTanggal ? `Tanggal: ${filterTanggal}` : (filterBulan !== 'Semua' ? `Bulan: ${MONTH_OPTIONS.find(m => m.value === filterBulan)?.label}` : 'Seluruh Waktu')}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 font-black text-xs">
                  {filteredLaporDiriList.length} Laporan Ditemukan
                </span>
              </div>
            </div>
          </div>

          {/* Sub-View Switcher (Sudah Melapor dengan Foto vs Belum Melapor) */}
          <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setKegiatanSubTab('sudah_melapor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                kegiatanSubTab === 'sudah_melapor'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Daftar Laporan Masuk & Bukti Foto ({filteredLaporDiriList.length})</span>
            </button>

            <button
              onClick={() => setKegiatanSubTab('belum_melapor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                kegiatanSubTab === 'belum_melapor'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Pegawai Belum Melapor ({pegawaiBelumLapor.length})</span>
            </button>
          </div>

          {/* SUB-VIEW 1: DAFTAR LAPORAN MASUK DENGAN BUKTI FOTO & TOMBOL AKSI VIEW */}
          {kegiatanSubTab === 'sudah_melapor' && (
            <div className="space-y-3">
              {/* Notice Banner to Admin */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Verifikasi Bukti Foto Sebelum Cetak PDF:</span>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                    Klik tombol <strong>View Foto</strong> pada kolom <strong>Aksi</strong> di bawah untuk membuka popup foto asli nakes dari Google Drive. Pastikan keabsahan foto, jam, dan titik lokasi koordinat GPS sebelum mencetak laporan ke PDF.
                  </p>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>
                      Menampilkan {filteredLaporDiriList.length} Laporan Kegiatan ({selectedKegiatan})
                    </span>
                  </span>

                  <span className="text-[11px] text-slate-500 font-medium">
                    Google Drive Folder: <code className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{GOOGLE_DRIVE_FOLDER_ID.slice(0, 10)}...</code>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">Waktu & Tgl</th>
                        <th className="py-3 px-4">Pegawai</th>
                        <th className="py-3 px-4">Tempat Tugas</th>
                        <th className="py-3 px-4">Jenis Kegiatan</th>
                        <th className="py-3 px-4">Detail Uraian</th>
                        <th className="py-3 px-4">Lokasi & GPS</th>
                        <th className="py-3 px-4 text-center">Status Foto</th>
                        <th className="py-3 px-4 text-center font-black text-indigo-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLaporDiriList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <CalendarCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-600 dark:text-slate-400">
                              Tidak ada laporan ditemukan untuk filter ini.
                            </p>
                            <button
                              onClick={() => {
                                setSelectedKegiatan('Semua');
                                setSelectedTempatKerja('Semua');
                              }}
                              className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
                            >
                              Tampilkan Semua Kegiatan
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredLaporDiriList.map((record, idx) => {
                          const isDinasLuarAwal = record.kegiatan === 'Dinas Luar Awal';
                          const isDinasLuarAkhir = record.kegiatan === 'Dinas Luar Akhir';

                          let badgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
                          if (isDinasLuarAwal) {
                            badgeColor = 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800';
                          } else if (isDinasLuarAkhir) {
                            badgeColor = 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-800';
                          } else if (record.kegiatan === 'Apel Pagi') {
                            badgeColor = 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-800';
                          } else if (record.kegiatan === 'Upacara') {
                            badgeColor = 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800';
                          } else if (record.kegiatan === 'Rabu Transportasi') {
                            badgeColor = 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-800';
                          } else if (record.kegiatan === 'Rujukan Pasien Laut') {
                            badgeColor = 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800';
                          } else if (record.kegiatan === 'Posyandu Keliling') {
                            badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800';
                          }

                          return (
                            <tr
                              key={record.id}
                              className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition"
                            >
                              <td className="py-3 px-4 font-mono font-bold text-slate-500">
                                {idx + 1}
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-bold font-mono text-slate-900 dark:text-slate-100">
                                  {record.timestamp} WIB
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {record.date}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  {record.pegawaiNama}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  NIP: {record.nip}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {record.jabatan}
                                </div>
                              </td>

                              <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                {record.tempatTugas}
                              </td>

                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${badgeColor}`}>
                                  {isDinasLuarAwal && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                                  {isDinasLuarAkhir && <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
                                  <span>{record.kegiatan}</span>
                                </span>
                              </td>

                              <td className="py-3 px-4 max-w-[220px]">
                                <p className="text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                                  {record.detail}
                                </p>
                              </td>

                              <td className="py-3 px-4 max-w-[240px]">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {record.lokasi}
                                </div>
                                {record.alamatLokasi && (
                                  <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-start gap-1 mt-0.5 leading-tight">
                                    <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{record.alamatLokasi}</span>
                                  </div>
                                )}
                                {record.coordinates && (
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                    <span>{record.coordinates.lat.toFixed(5)}, {record.coordinates.lng.toFixed(5)}</span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                  <CloudUpload className="w-3 h-3 text-emerald-600" />
                                  <span>Drive OK</span>
                                </div>
                              </td>

                              {/* TOMBOL AKSI: VIEW FOTO PEGAWAI */}
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhotoRecord(record)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-[11px] shadow-sm shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                                  title="Lihat foto selfie dan bukti kehadiran dari database Google Drive"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-200" />
                                  <span>View Foto</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: DAFTAR PEGAWAI BELUM MELAPOR */}
          {kegiatanSubTab === 'belum_melapor' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Panel Belum Melapor */}
              <div className="bg-white rounded-3xl border-2 border-red-500 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-extrabold text-xs text-red-900 uppercase tracking-wider">
                      BELUM MELAPOR: {selectedKegiatan} ({pegawaiBelumLapor.length} Pegawai)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                    Perlu Tindak Lanjut
                  </span>
                </div>

                <div className="p-4 max-h-[420px] overflow-y-auto space-y-2.5">
                  {pegawaiBelumLapor.length === 0 ? (
                    <div className="text-center py-10 text-emerald-600 font-bold text-xs">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                      Luar biasa! Seluruh pegawai telah melaporkan kegiatan {selectedKegiatan}.
                    </div>
                  ) : (
                    pegawaiBelumLapor.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-red-50/40 border border-red-200/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.avatar}
                            alt={p.nama}
                            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-red-300"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate">{p.nama}</div>
                            <div className="text-[10px] text-slate-500 font-mono">NIP: {p.nip} • {p.profesi}</div>
                            <div className="text-[10px] text-red-700 font-semibold">{p.tempatTugas}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`https://wa.me/62${p.telepon.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition flex items-center gap-1 shadow-2xs"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Tegur WA</span>
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-red-50/70 border-t border-red-200 text-center">
                  <button
                    onClick={handleExportPDFBelumLaporKegiatan}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Dokumen PDF Resmi Pegawai Belum Lapor</span>
                  </button>
                </div>
              </div>

              {/* Panel Sudah Melapor Ringkasan */}
              <div className="bg-white rounded-3xl border border-emerald-300 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-extrabold text-xs text-emerald-900 uppercase tracking-wider">
                      SUDAH MELAPOR ({pegawaiSudahLapor.length} Pegawai)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                    Lengkap
                  </span>
                </div>

                <div className="p-4 max-h-[420px] overflow-y-auto space-y-2.5">
                  {pegawaiSudahLapor.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Belum ada pegawai yang mengirimkan lapor diri untuk kegiatan ini.
                    </div>
                  ) : (
                    pegawaiSudahLapor.map((p) => {
                      const record = laporDiriList.find(
                        (l) => (l.pegawaiId === p.id || l.nip === p.nip) && (selectedKegiatan === 'Semua' || l.kegiatan === selectedKegiatan)
                      );
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={p.avatar}
                              alt={p.nama}
                              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-emerald-300"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">{p.nama}</div>
                              <div className="text-[10px] text-slate-500">{record ? record.detail : selectedKegiatan}</div>
                              <div className="text-[10px] text-emerald-700 font-medium">{record ? `Lokasi: ${record.lokasi}` : p.tempatTugas}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {record && (
                              <button
                                type="button"
                                onClick={() => setSelectedPhotoRecord(record)}
                                className="px-2 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-bold flex items-center gap-1 transition"
                              >
                                <Eye className="w-3 h-3 text-indigo-600" />
                                <span>Foto</span>
                              </button>
                            )}
                            <span className="text-[10px] font-mono text-emerald-800 font-bold px-2 py-0.5 rounded bg-emerald-100">
                              {record ? record.timestamp : '07:15'} WIB
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium">
                  Seluruh data diverifikasi dengan koordinat GPS dan tersimpan di Google Drive
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REKAPITULASI SELURUH PEGAWAI (TABEL LENGKAP & DETEKSI BELUM CHECKIN) */}
      {/* ========================================================================= */}
      {activeTab === 'seluruh_pegawai' && (() => {
        const staffInScope = pegawaiList.filter(
          (p) => selectedTempatKerja === 'Semua' || (p.currentTempatKerja || p.tempatTugas) === selectedTempatKerja
        );
        const sudahList = staffInScope.filter((p) => p.status === 'hadir' && p.currentUnitId);
        const belumList = staffInScope.filter((p) => p.status !== 'hadir' || !p.currentUnitId);
        const percentSudah = staffInScope.length > 0 ? Math.round((sudahList.length / staffInScope.length) * 100) : 0;
        const percentBelum = staffInScope.length > 0 ? Math.round((belumList.length / staffInScope.length) * 100) : 0;

        const displayedStaff = staffInScope.filter((p) => {
          const isBelum = p.status !== 'hadir' || !p.currentUnitId;
          if (filterRekapStatus === 'belum_checkin' && !isBelum) return false;
          if (filterRekapStatus === 'sudah_checkin' && isBelum) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchName = p.nama.toLowerCase().includes(q);
            const matchNip = p.nip.toLowerCase().includes(q);
            const matchJabatan = p.jabatan.toLowerCase().includes(q);
            const matchProfesi = p.profesi.toLowerCase().includes(q);
            if (!matchName && !matchNip && !matchJabatan && !matchProfesi) return false;
          }
          return true;
        });

        // WhatsApp Broadcast to un-checked-in employees
        const handleBroadcastWA = () => {
          if (belumList.length === 0) {
            alert('Luar biasa! Seluruh tenaga kesehatan sudah melakukan check-in ruangan.');
            return;
          }
          const confirmMsg = `Kirim pengingat WhatsApp ke ${belumList.length} personil yang belum check-in ruangan hari ini?`;
          if (window.confirm(confirmMsg)) {
            const firstStaff = belumList[0];
            const cleanPhone = (firstStaff.telepon || '081234567890').replace(/[^0-9]/g, '');
            const waTarget = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
            const message = encodeURIComponent(
              `Halo Rekan Nakes ${firstStaff.nama}, kami mendeteksi Anda belum melakukan Check-in Ruangan di SI NAKHODA (${firstStaff.tempatTugas}) hari ini. Mohon segera lapor diri / check-in unit kerja Anda.`
            );
            window.open(`https://wa.me/${waTarget}?text=${message}`, '_blank');
          }
        };

        return (
          <div className="space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Personil</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{staffInScope.length} Nakes</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Lokasi: {selectedTempatKerja}</div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Sudah Check-In Ruangan</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{sudahList.length} Orang</div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-500 font-semibold mt-0.5">{percentSudah}% Tingkat Keterisian</div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-red-200/80 dark:border-red-900/40 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Belum Check-In Ruangan</div>
                  <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">{belumList.length} Orang</div>
                  <div className="text-[11px] text-red-700 dark:text-red-500 font-semibold mt-0.5">{percentBelum}% Perlu Konfirmasi</div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Action Bar & Quick Filter */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilterRekapStatus('semua')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    filterRekapStatus === 'semua'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Semua ({staffInScope.length})
                </button>
                <button
                  onClick={() => setFilterRekapStatus('belum_checkin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    filterRekapStatus === 'belum_checkin'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Hanya Belum Check-in ({belumList.length})</span>
                </button>
                <button
                  onClick={() => setFilterRekapStatus('sudah_checkin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    filterRekapStatus === 'sudah_checkin'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sudah Masuk ({sudahList.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportPDFRekapitulasi}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                  title="Unduh laporan PDF resmi yang menyoroti pegawai belum check-in"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Rekapitulasi PDF</span>
                </button>

                <button
                  onClick={handleBroadcastWA}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                  title="Kirim pengingat WhatsApp kepada personil yang belum check-in"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Pengingat WA ({belumList.length})</span>
                </button>

                <button
                  onClick={() => {
                    const headers = ['No', 'NIP', 'Nama Pegawai', 'Profesi', 'Jabatan', 'Tempat Tugas', 'Ruangan Terisi', 'Status Kehadiran', 'Kondisi'];
                    const rows = staffInScope.map((p, i) => [
                      i + 1,
                      p.nip,
                      p.nama,
                      p.profesi,
                      p.jabatan,
                      p.tempatTugas,
                      p.currentUnitName || 'BELUM CHECK-IN',
                      p.status === 'hadir' ? 'Sudah Masuk Ruangan' : 'Belum Check-in Ruangan',
                      p.kondisi
                    ]);
                    exportToCSV(`Rekapitulasi_Kehadiran_Nakes_${Date.now()}.csv`, headers, rows);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>
                    Daftar {displayedStaff.length} Nakes Terfilter ({belumList.length} Belum Check-in)
                  </span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Data otomatis ter-reset setiap tengah malam
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Pegawai</th>
                      <th className="py-3 px-4">Profesi & Jabatan</th>
                      <th className="py-3 px-4">Tempat Tugas</th>
                      <th className="py-3 px-4">Posisi Ruangan</th>
                      <th className="py-3 px-4">Status Kondisi</th>
                      <th className="py-3 px-4 text-center">Waktu Update</th>
                      <th className="py-3 px-4 text-center">Aksi / Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedStaff.map((p) => {
                      const badge = getKondisiBadge(p.kondisi);
                      const isBelumCheckin = p.status !== 'hadir' || !p.currentUnitId;

                      return (
                        <tr
                          key={p.id}
                          className={`transition ${
                            isBelumCheckin
                              ? 'bg-red-50/50 hover:bg-red-50/80 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.avatar}
                                alt={p.nama}
                                className={`w-8 h-8 rounded-full object-cover shrink-0 ring-2 ${
                                  isBelumCheckin ? 'ring-red-400' : 'ring-emerald-400'
                                }`}
                              />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">{p.nama}</div>
                                <div className="text-[10px] text-slate-400 font-mono">NIP: {p.nip}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{p.profesi}</div>
                            <div className="text-[10px] text-slate-500">{p.jabatan}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            {p.tempatTugas}
                          </td>
                          <td className="py-3 px-4">
                            {p.currentUnitName && p.status === 'hadir' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {p.currentUnitName} ({p.currentLantai || 'Lt. 1'})
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="text-red-600 dark:text-red-400 font-bold text-[11px] bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                                  BELUM CHECK-IN RUANGAN
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.badgeClass}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                            {p.lastUpdateTime || p.lastCheckinTime || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isBelumCheckin ? (
                              <a
                                href={`https://wa.me/${(p.telepon || '081234567890').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(
                                  `Halo ${p.nama}, Anda belum melakukan Check-in Ruangan di SI NAKHODA untuk penugasan ${p.tempatTugas}. Mohon segera check-in ruangan.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] transition"
                                title="Kirim peringatan via WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>Ingatkan WA</span>
                              </a>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                ✓ Terisi
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
      {/* ========================================================================= */}
      {/* POPUP MODAL: VIEW FOTO PEGAWAI TERVERIFIKASI GOOGLE DRIVE & GPS */}
      {/* ========================================================================= */}
      {selectedPhotoRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white truncate">
                      Bukti Foto: {selectedPhotoRecord.pegawaiNama}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950 shrink-0 uppercase">
                      {selectedPhotoRecord.kegiatan}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    NIP: {selectedPhotoRecord.nip} • {selectedPhotoRecord.tempatTugas}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPhotoRecord(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Tutup Popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Main Photo Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-[4/3] max-h-[360px] flex items-center justify-center border border-slate-800 shadow-inner group">
                <img
                  src={selectedPhotoRecord.fotoUrl}
                  alt={`Foto ${selectedPhotoRecord.pegawaiNama}`}
                  className="w-full h-full object-contain"
                />
                
                {/* Watermark badge on photo */}
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 text-white text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-sky-300">
                    <span>PRESENSI RESMI: {selectedPhotoRecord.kegiatan.toUpperCase()}</span>
                    <span>{selectedPhotoRecord.timestamp} WIB</span>
                  </div>
                  <div className="text-slate-200 text-[10px] font-semibold truncate">
                    {selectedPhotoRecord.pegawaiNama} (NIP: {selectedPhotoRecord.nip})
                  </div>
                  {selectedPhotoRecord.alamatLokasi && (
                    <div className="text-amber-300 font-semibold text-[9.5px] truncate flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                      <span>Alamat: {selectedPhotoRecord.alamatLokasi}</span>
                    </div>
                  )}
                  {selectedPhotoRecord.coordinates && (
                    <div className="text-slate-400 font-mono text-[9px] flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-sky-400" />
                      <span>GPS: {selectedPhotoRecord.coordinates.lat.toFixed(5)}, {selectedPhotoRecord.coordinates.lng.toFixed(5)} • {selectedPhotoRecord.lokasi}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Drive Database Status Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CloudUpload className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Tersimpan Otomatis di Google Drive</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      Folder ID: {GOOGLE_DRIVE_FOLDER_ID}
                    </div>
                  </div>
                </div>

                <a
                  href={GOOGLE_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition"
                >
                  <span>Buka di Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Alamat Jalan Lengkap & Titik Lokasi Realtime */}
              {selectedPhotoRecord.alamatLokasi && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-1">
                  <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Alamat Jalan & Titik Lokasi Realtime Device</span>
                  </div>
                  <div className="font-extrabold text-xs text-amber-950 dark:text-amber-100 leading-snug">
                    {selectedPhotoRecord.alamatLokasi}
                  </div>
                </div>
              )}

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lokasi & GPS */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    <span>Lokasi Pelaksanaan & GPS</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {selectedPhotoRecord.lokasi}
                  </div>
                  {selectedPhotoRecord.coordinates ? (
                    <a
                      href={`https://www.google.com/maps?q=${selectedPhotoRecord.coordinates.lat},${selectedPhotoRecord.coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-mono hover:underline"
                    >
                      <span>{selectedPhotoRecord.coordinates.lat.toFixed(5)}, {selectedPhotoRecord.coordinates.lng.toFixed(5)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <div className="text-[11px] text-slate-500">Koordinat standar unit kerja</div>
                  )}
                </div>

                {/* Waktu & Tanggal */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>Waktu Pelaporan</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 font-mono">
                    {selectedPhotoRecord.timestamp} WIB
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tanggal: {selectedPhotoRecord.date}
                  </div>
                </div>
              </div>

              {/* Uraian Detail Kegiatan */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo-500" />
                  <span>Detail / Uraian Pelaksanaan Kegiatan</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {selectedPhotoRecord.detail}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs text-slate-500">
                Foto terverifikasi siap dicetak ke laporan PDF.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    exportLaporKegiatanPDF({
                      title: `Laporan Kegiatan: ${selectedPhotoRecord.kegiatan}`,
                      subtitle: `Verifikasi Laporan ${selectedPhotoRecord.pegawaiNama} (${selectedPhotoRecord.jabatan})`,
                      tempatKerja: selectedPhotoRecord.tempatTugas,
                      kegiatanFilter: selectedPhotoRecord.kegiatan,
                      records: [selectedPhotoRecord],
                      fileName: `Laporan_${selectedPhotoRecord.kegiatan.replace(/ /g, '_')}_${selectedPhotoRecord.pegawaiNama.replace(/ /g, '_')}_${Date.now()}.pdf`
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak PDF Pegawai Ini</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPhotoRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
                >
                  Tutup Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

