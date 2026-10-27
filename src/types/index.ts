export type TempatKerja = 
  | 'Puskesmas Kepulauan Seribu Selatan'
  | 'Puskesmas Pembantu Pulau Untung Jawa'
  | 'Puskesmas Pembantu Pulau Lancang'
  | 'Puskesmas Pembantu Pulau Pari'
  | 'Kantor Transit Jakarta'
  // Legacy compatibility
  | 'Pustu Untung Jawa'
  | 'Pustu Pulau Pari'
  | 'Pustu Pulau Lancang'
  | 'Pulau Tidung'
  | 'Pulau Untung Jawa'
  | 'Pulau Lancang'
  | 'Pulau Pari';

/**
 * Normalizer untuk memetakan setiap variasi nama dari Google Sheets / database
 * ke 5 fasilitas kerja resmi.
 */
export function normalizeTempatKerja(val?: string): TempatKerja {
  if (!val) return 'Puskesmas Kepulauan Seribu Selatan';
  const s = val.toLowerCase().trim();
  if (s.includes('untung')) return 'Puskesmas Pembantu Pulau Untung Jawa';
  if (s.includes('lancang')) return 'Puskesmas Pembantu Pulau Lancang';
  if (s.includes('pari')) return 'Puskesmas Pembantu Pulau Pari';
  if (s.includes('transit') || s.includes('jakarta') || s.includes('marina')) return 'Kantor Transit Jakarta';
  if (s.includes('tidung') || s.includes('selatan') || s.includes('puskesmas')) return 'Puskesmas Kepulauan Seribu Selatan';
  return 'Puskesmas Kepulauan Seribu Selatan';
}

export type LantaiArea = 'Lantai 1' | 'Lantai 2' | 'Lantai 3' | 'Area Luar / Lapangan';

export type KondisiPegawai = 
  | 'siap_melayani'      // 🟢 Sehat & Aktif Melayani
  | 'tindakan_pasien'   // 🟡 Sedang Tindakan Pasien / Kasus Kritis
  | 'istirahat'         // ☕ Istirahat / Ishoma
  | 'dinas_luar'        // 🚤 Dinas Luar / Rujukan
  | 'piket_siaga'       // 🌙 Piket Siaga / On-Call
  | 'belum_hadir';      // ⚪ Belum Check-in / Belum di Tempat

export type Role = 'admin' | 'pegawai';

export interface UnitPelayanan {
  id: string;
  name: string;
  tempatKerja: TempatKerja;
  lantai: LantaiArea;
  category: 'pelayanan' | 'penunjang' | 'manajemen' | 'umum';
  icon: string;
  deskripsi?: string;
  kapasitasIdeal: number;
}

export interface Pegawai {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  profesi: 'Dokter' | 'Dokter Gigi' | 'Perawat' | 'Bidan' | 'Apoteker' | 'Analis Lab' | 'Nutrisionis' | 'Sanitarian' | 'Staf Administrasi' | 'Petugas Keamanan' | 'Nahkoda / Awak Kapal';
  tempatTugas: TempatKerja;
  role: Role;
  telepon: string;
  avatar: string;
  
  // Posisi & Kondisi saat ini
  status: 'hadir' | 'belum_hadir' | 'dinas_luar' | 'checkout';
  kondisi: KondisiPegawai;
  kondisiCatatan?: string;
  
  currentTempatKerja?: TempatKerja;
  currentLantai?: LantaiArea;
  currentUnitId?: string;
  currentUnitName?: string;
  
  lastCheckinTime?: string;
  lastUpdateTime?: string;
  selfieUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
    accuracy?: number;
    distanceMeters?: number;
  };
}

export interface MovementLog {
  id: string;
  timestamp: string;
  date: string;
  isoDate?: string;
  pegawaiId: string;
  pegawaiNama: string;
  nip: string;
  tempatKerja: TempatKerja;
  lantai: LantaiArea;
  dariUnit?: string;
  keUnit: string;
  kondisi: KondisiPegawai;
  catatan?: string;
  selfieUrl?: string;
  alamatLokasi?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface LaporDiriRecord {
  id: string;
  timestamp: string;
  date: string;
  isoDate?: string;
  pegawaiId: string;
  pegawaiNama: string;
  nip: string;
  jabatan: string;
  tempatTugas: TempatKerja;
  kegiatan: 'DLP (Dinas Luar Penuh)' | 'Upacara' | 'Apel Pagi' | 'Dinas Luar Awal' | 'Dinas Luar Akhir' | 'Rujukan Pasien Laut' | 'Rabu Transportasi' | 'Posyandu Keliling' | 'Izin Pimpinan' | string;
  detail: string;
  lokasi: string;
  alamatLokasi?: string;
  fotoUrl: string;
  dokumentasiFoto?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
