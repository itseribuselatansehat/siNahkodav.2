import React, { useState } from 'react';
import { Pegawai, KondisiPegawai, TempatKerja, LantaiArea, UnitPelayanan } from '../types';
import { TEMPAT_KERJA_LIST, UNIT_PELAYANAN_LIST } from '../data/initialData';
import { getKondisiBadge, triggerSuccessConfetti } from '../utils/helpers';
import { 
  X, 
  MapPin, 
  Activity, 
  CheckCircle2, 
  Coffee, 
  Ship, 
  Moon, 
  ArrowRight,
  MessageSquare
} from 'lucide-react';

interface QuickStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Pegawai;
  onUpdateStatus: (data: {
    tempatKerja: TempatKerja;
    lantai: LantaiArea;
    unitId: string;
    unitName: string;
    kondisi: KondisiPegawai;
    catatan: string;
  }) => void;
}

export const QuickStatusModal: React.FC<QuickStatusModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateStatus
}) => {
  if (!isOpen) return null;

  const [tempatKerja, setTempatKerja] = useState<TempatKerja>(
    currentUser.currentTempatKerja || currentUser.tempatTugas
  );
  const [lantai, setLantai] = useState<LantaiArea>(
    currentUser.currentLantai || 'Lantai 1'
  );
  
  // Available units based on selected workplace and floor
  const availableUnits = UNIT_PELAYANAN_LIST.filter(
    (u) => u.tempatKerja === tempatKerja && u.lantai === lantai
  );

  const [unitId, setUnitId] = useState<string>(
    currentUser.currentUnitId || (availableUnits[0]?.id || '')
  );
  const [kondisi, setKondisi] = useState<KondisiPegawai>(currentUser.kondisi);
  const [catatan, setCatatan] = useState<string>(currentUser.kondisiCatatan || '');

  // Handle Tempat Kerja Change
  const handleTempatKerjaChange = (tk: TempatKerja) => {
    setTempatKerja(tk);
    const defaultLantai: LantaiArea = 'Lantai 1';
    setLantai(defaultLantai);
    const units = UNIT_PELAYANAN_LIST.filter(
      (u) => u.tempatKerja === tk && u.lantai === defaultLantai
    );
    setUnitId(units[0]?.id || '');
  };

  // Handle Lantai Change
  const handleLantaiChange = (l: LantaiArea) => {
    setLantai(l);
    const units = UNIT_PELAYANAN_LIST.filter(
      (u) => u.tempatKerja === tempatKerja && u.lantai === l
    );
    setUnitId(units[0]?.id || '');
  };

  const handleSave = () => {
    const selectedUnit = UNIT_PELAYANAN_LIST.find((u) => u.id === unitId);
    const unitName = selectedUnit ? selectedUnit.name : 'Unit Pelayanan';

    triggerSuccessConfetti();

    onUpdateStatus({
      tempatKerja,
      lantai,
      unitId,
      unitName,
      kondisi,
      catatan
    });

    onClose();
  };

  const kondisiOptions: {
    type: KondisiPegawai;
    title: string;
    desc: string;
    icon: React.ElementType;
    color: string;
    borderActive: string;
    bgActive: string;
  }[] = [
    {
      type: 'siap_melayani',
      title: 'Siap & Aktif Melayani',
      desc: 'Standby di ruangan, kondisi sehat siap layani pasien',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-400',
      bgActive: 'bg-emerald-50'
    },
    {
      type: 'tindakan_pasien',
      title: 'Sedang Tindakan Pasien',
      desc: 'Melakukan tindakan medis / resusitasi / partus / jahit luka',
      icon: Activity,
      color: 'text-amber-600',
      borderActive: 'border-amber-500 ring-2 ring-amber-400',
      bgActive: 'bg-amber-50'
    },
    {
      type: 'istirahat',
      title: 'Istirahat / Ishoma',
      desc: 'Makan siang / sholat / jeda istirahat dinas',
      icon: Coffee,
      color: 'text-yellow-600',
      borderActive: 'border-yellow-500 ring-2 ring-yellow-400',
      bgActive: 'bg-yellow-50'
    },
    {
      type: 'dinas_luar',
      title: 'Dinas Luar / Rujukan',
      desc: 'Kegiatan luar gedung / pendamping rujukan pasien',
      icon: Ship,
      color: 'text-blue-600',
      borderActive: 'border-blue-500 ring-2 ring-blue-400',
      bgActive: 'bg-blue-50'
    },
    {
      type: 'piket_siaga',
      title: 'Piket Siaga / On-Call',
      desc: 'Jadwal siaga malam / standby panggilan',
      icon: Moon,
      color: 'text-purple-600',
      borderActive: 'border-purple-500 ring-2 ring-purple-400',
      bgActive: 'bg-purple-50'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-6">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Perbarui Posisi & Kondisi Anda</h3>
              <p className="text-xs text-blue-100">{currentUser.nama} ({currentUser.jabatan})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Pilih Tempat Kerja */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Tempat Kerja / Fasilitas
            </label>
            <select
              value={tempatKerja}
              onChange={(e) => handleTempatKerjaChange(e.target.value as TempatKerja)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            >
              {TEMPAT_KERJA_LIST.map((tk) => (
                <option key={tk.id} value={tk.id}>
                  {tk.label} ({tk.pulau})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Pilih Lantai & Ruangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Lantai / Area
              </label>
              <select
                value={lantai}
                onChange={(e) => handleLantaiChange(e.target.value as LantaiArea)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
              >
                {tempatKerja === 'Puskesmas Kepulauan Seribu Selatan' ? (
                  <>
                    <option value="Lantai 1">Lantai 1 (Poli & IGD)</option>
                    <option value="Lantai 2">Lantai 2 (Gigi, KIA, Rawat)</option>
                    <option value="Lantai 3">Lantai 3 (Kantor & Aula)</option>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Ruangan / Unit
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
              >
                {availableUnits.length === 0 ? (
                  <option value="">(Tidak ada unit di lantai ini)</option>
                ) : (
                  availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 3. Pilih Kondisi Pegawai */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              4. Kondisi Anda Saat Ini
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {kondisiOptions.map((opt) => {
                const isSelected = kondisi === opt.type;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setKondisi(opt.type)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? `${opt.borderActive} ${opt.bgActive} shadow-xs`
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${opt.color}`} />
                    <div>
                      <div className={`text-xs font-bold ${opt.color}`}>
                        {opt.title}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Catatan Aktivitas / Detail Kondisi</span>
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Menangani pasien rawat jalan / Konsultasi nakes"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>Simpan & Perbarui Posisi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
