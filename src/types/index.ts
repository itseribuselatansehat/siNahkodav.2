export type TempatKerja = 
  | 'Puskesmas Kepulauan Seribu Selatan'
  | 'Pustu Untung Jawa'
  | 'Pustu Pulau Pari'
  | 'Pustu Pulau Lancang'
  | 'Kantor Transit Jakarta';

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
  coordinates?: {
    lat: number;
    lng: number;
  };
}
