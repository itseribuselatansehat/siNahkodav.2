import { Pegawai, UnitPelayanan, MovementLog, LaporDiriRecord, TempatKerja } from '../types';

export const TEMPAT_KERJA_LIST: { id: TempatKerja; label: string; pulau: string; coords: { lat: number; lng: number } }[] = [
  {
    id: 'Puskesmas Kepulauan Seribu Selatan',
    label: 'Puskesmas Kepulauan Seribu Selatan',
    pulau: 'Puskesmas Kepulauan Seribu Selatan',
    coords: { lat: -5.7998, lng: 106.5235 }
  },
  {
    id: 'Puskesmas Pembantu Pulau Untung Jawa',
    label: 'Puskesmas Pembantu Pulau Untung Jawa',
    pulau: 'Puskesmas Pembantu Pulau Untung Jawa',
    coords: { lat: -5.9782, lng: 106.7058 }
  },
  {
    id: 'Puskesmas Pembantu Pulau Pari',
    label: 'Puskesmas Pembantu Pulau Pari',
    pulau: 'Puskesmas Pembantu Pulau Pari',
    coords: { lat: -5.8601, lng: 106.6186 }
  },
  {
    id: 'Puskesmas Pembantu Pulau Lancang',
    label: 'Puskesmas Pembantu Pulau Lancang',
    pulau: 'Puskesmas Pembantu Pulau Lancang',
    coords: { lat: -5.9221, lng: 106.5872 }
  },
  {
    id: 'Kantor Transit Jakarta',
    label: 'Kantor Transit Jakarta',
    pulau: 'Kantor Transit Jakarta',
    coords: { lat: -6.1245, lng: 106.8317 }
  }
];

export const UNIT_PELAYANAN_LIST: UnitPelayanan[] = [
  // Puskesmas Kepulauan Seribu Selatan - Lantai 1
  { id: 'pus-l1-loket', name: 'Loket & Rekam Medis', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Ticket', deskripsi: 'Pendaftaran & admisi pasien', kapasitasIdeal: 2 },
  { id: 'pus-l1-umum', name: 'Poli Pelayanan Umum', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Stethoscope', deskripsi: 'Pemeriksaan dokter umum', kapasitasIdeal: 2 },
  { id: 'pus-l1-igd', name: 'Instalasi Gawat Darurat (IGD 24 Jam)', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Ambulance', deskripsi: 'Penanganan kegawatdaruratan', kapasitasIdeal: 3 },
  { id: 'pus-l1-kia', name: 'Poli KIA & KB', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Baby', deskripsi: 'Kesehatan ibu & anak', kapasitasIdeal: 2 },
  { id: 'pus-l1-farmasi', name: 'Apotek & Farmasi', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 1', category: 'penunjang', icon: 'Pill', deskripsi: 'Peracikan & penyerahan obat', kapasitasIdeal: 2 },
  { id: 'pus-l1-lab', name: 'Laboratorium Klinik', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 1', category: 'penunjang', icon: 'FlaskConical', deskripsi: 'Pemeriksaan darah, urine & mikroskopis', kapasitasIdeal: 2 },
  { id: 'pus-l1-triage', name: 'Pelayanan Awal (Triage / Skrining)', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Activity', deskripsi: 'Pemeriksaan tanda vital awal', kapasitasIdeal: 2 },
  { id: 'pus-l1-sekuriti', name: 'Pos Sekuriti & Informasi', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 1', category: 'umum', icon: 'Shield', deskripsi: 'Keamanan & orientasi pengunjung', kapasitasIdeal: 1 },
  { id: 'pus-l1-lorong', name: 'Lorong & Ruang Tunggu Lt. 1', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 1', category: 'umum', icon: 'Footprints', deskripsi: 'Ruang tunggu pasien', kapasitasIdeal: 2 },

  // Puskesmas Kepulauan Seribu Selatan - Lantai 2
  { id: 'pus-l2-gigi', name: 'Poli Kesehatan Gigi & Mulut', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 2', category: 'pelayanan', icon: 'Smile', deskripsi: 'Pemeriksaan & tindakan gigi', kapasitasIdeal: 2 },
  { id: 'pus-l2-ptm', name: 'Poli PTM & Lansia', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 2', category: 'pelayanan', icon: 'HeartPulse', deskripsi: 'Penyakit tidak menular & prolanis', kapasitasIdeal: 2 },
  { id: 'pus-l2-imunisasi', name: 'Ruang Imunisasi & Tumbuh Kembang', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 2', category: 'pelayanan', icon: 'Syringe', deskripsi: 'Vaksinasi bayi & balita', kapasitasIdeal: 2 },
  { id: 'pus-l2-anak', name: 'Poli MTBS & Anak', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 2', category: 'pelayanan', icon: 'HeartHandshake', deskripsi: 'Pelayanan balita sakit', kapasitasIdeal: 2 },
  { id: 'pus-l2-rawat', name: 'Ruang Rawat Inap & Observasi', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 2', category: 'pelayanan', icon: 'Bed', deskripsi: 'Perawatan sementara sebelum rujukan', kapasitasIdeal: 3 },
  { id: 'pus-l2-gizi', name: 'Dapur Gizi & Konsultasi Diet', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 2', category: 'penunjang', icon: 'Utensils', deskripsi: 'Pemberian makanan pasien & konseling gizi', kapasitasIdeal: 2 },
  { id: 'pus-l2-gudang-obat', name: 'Gudang Logistik Farmasi', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 2', category: 'penunjang', icon: 'Boxes', deskripsi: 'Penyimpanan stok obat & vaksin', kapasitasIdeal: 1 },
  { id: 'pus-l2-ukm', name: 'Ruang Kerja UKM (Kesehatan Masyarakat)', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 2', category: 'manajemen', icon: 'Users', deskripsi: 'Program promkes, kesling & surveilans', kapasitasIdeal: 4 },
  { id: 'pus-l2-lorong', name: 'Lorong & Selasar Lt. 2', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 2', category: 'umum', icon: 'Footprints', deskripsi: 'Akses penghubung lantai 2', kapasitasIdeal: 1 },

  // Puskesmas Kepulauan Seribu Selatan - Lantai 3
  { id: 'pus-l3-kapus', name: 'Ruang Pimpinan / Kepala Puskesmas', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 3', category: 'manajemen', icon: 'Award', deskripsi: 'Kantor Kepala Puskesmas', kapasitasIdeal: 1 },
  { id: 'pus-l3-kasubag', name: 'Ruang Kasubag Tata Usaha', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 3', category: 'manajemen', icon: 'Briefcase', deskripsi: 'Administrasi kepegawaian & umum', kapasitasIdeal: 2 },
  { id: 'pus-l3-kepegawaian', name: 'Ruang Kepegawaian & Diklat', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 3', category: 'manajemen', icon: 'UserCheck', deskripsi: 'Pengelolaan SDM & absensi', kapasitasIdeal: 3 },
  { id: 'pus-l3-keuangan', name: 'Ruang Keuangan & SPJ', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 3', category: 'manajemen', icon: 'Wallet', deskripsi: 'Bendahara & pembukuan', kapasitasIdeal: 2 },
  { id: 'pus-l3-rapat', name: 'Ruang Rapat Mini / Koordinasi', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 3', category: 'manajemen', icon: 'UsersRound', deskripsi: 'Rapat koordinasi pimpinan', kapasitasIdeal: 8 },
  { id: 'pus-l3-aula', name: 'Aula Serbaguna Nakhoda Sehat', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 3', category: 'umum', icon: 'Building2', deskripsi: 'Pertemuan pleno, pembinaan & seminar', kapasitasIdeal: 30 },
  { id: 'pus-l3-server', name: 'Ruang Server IT & Arsip', tempatKerja: 'Puskesmas Kepulauan Seribu Selatan', lantai: 'Lantai 3', category: 'penunjang', icon: 'Server', deskripsi: 'Data center & monitoring CCTV', kapasitasIdeal: 1 },

  // Puskesmas Pembantu Pulau Untung Jawa - Lantai 1
  { id: 'uj-l1-loket', name: 'Ruang Loket', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Ticket', deskripsi: 'Pendaftaran & admisi pasien', kapasitasIdeal: 2 },
  { id: 'uj-l1-farmasi', name: 'Ruang Farmasi', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 1', category: 'penunjang', icon: 'Pill', deskripsi: 'Peracikan obat & farmasi', kapasitasIdeal: 2 },
  { id: 'uj-l1-triage', name: 'Ruang Pelayanan Awal', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Activity', deskripsi: 'Skrining & tanda vital awal', kapasitasIdeal: 2 },
  { id: 'uj-l1-kia', name: 'Ruangan KIA', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Baby', deskripsi: 'Kesehatan ibu, anak & imunisasi', kapasitasIdeal: 2 },
  { id: 'uj-l1-umum', name: 'Ruangan Pelayanan Umum', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Stethoscope', deskripsi: 'Pemeriksaan dokter umum & nakes', kapasitasIdeal: 2 },
  { id: 'uj-l1-lorong', name: 'Ruang Selasar Lorong Lantai 1', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 1', category: 'umum', icon: 'Footprints', deskripsi: 'Selasar tunggu pasien Lt. 1', kapasitasIdeal: 3 },

  // Puskesmas Pembantu Pulau Untung Jawa - Lantai 2
  { id: 'uj-l2-lab', name: 'Ruang LAB', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 2', category: 'penunjang', icon: 'FlaskConical', deskripsi: 'Pemeriksaan laboratorium sederhana', kapasitasIdeal: 2 },
  { id: 'uj-l2-gigi', name: 'Ruangan Gigi', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 2', category: 'pelayanan', icon: 'Smile', deskripsi: 'Pemeriksaan & perawatan gigi', kapasitasIdeal: 2 },
  { id: 'uj-l2-admin', name: 'Ruangan Administrasi', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 2', category: 'manajemen', icon: 'Briefcase', deskripsi: 'Administrasi & pelaporan Pustu', kapasitasIdeal: 2 },
  { id: 'uj-l2-lorong', name: 'Ruangan Selasar Lorong Lantai 2', tempatKerja: 'Puskesmas Pembantu Pulau Untung Jawa', lantai: 'Lantai 2', category: 'umum', icon: 'Footprints', deskripsi: 'Selasar & koridor Lt. 2', kapasitasIdeal: 2 },

  // Puskesmas Pembantu Pulau Pari
  { id: 'pari-l1-umum', name: 'Poli Pelayanan Terpadu Lt. 1', tempatKerja: 'Puskesmas Pembantu Pulau Pari', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Stethoscope', deskripsi: 'Layanan kesehatan warga Pulau Pari & wisatawan', kapasitasIdeal: 2 },
  { id: 'pari-l1-tindakan', name: 'Ruang Tindakan Gawat Darurat', tempatKerja: 'Puskesmas Pembantu Pulau Pari', lantai: 'Lantai 1', category: 'pelayanan', icon: 'HeartPulse', deskripsi: 'Tindakan darurat sengatan laut & kecelakaan', kapasitasIdeal: 2 },
  { id: 'pari-l2-jaga', name: 'Ruang Jaga Medis & Istirahat Lt. 2', tempatKerja: 'Puskesmas Pembantu Pulau Pari', lantai: 'Lantai 2', category: 'penunjang', icon: 'Home', deskripsi: 'Pos siaga tenaga medis menginap', kapasitasIdeal: 2 },

  // Puskesmas Pembantu Pulau Lancang - Lantai 1
  { id: 'lancang-l1-farmasi', name: 'Ruang Farmasi', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 1', category: 'penunjang', icon: 'Pill', deskripsi: 'Penyediaan obat & peracikan', kapasitasIdeal: 2 },
  { id: 'lancang-l1-umum', name: 'Ruang Pelayanan Umum', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Stethoscope', deskripsi: 'Pemeriksaan medis umum', kapasitasIdeal: 2 },
  { id: 'lancang-l1-loket', name: 'Ruangan Loket', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Ticket', deskripsi: 'Pendaftaran & data rekam medis', kapasitasIdeal: 2 },
  { id: 'lancang-l1-triage', name: 'Ruang Pelayanan Awal', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Activity', deskripsi: 'Triage & pemeriksaan tanda vital', kapasitasIdeal: 2 },
  { id: 'lancang-l1-kia', name: 'Ruang KIA', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 1', category: 'pelayanan', icon: 'Baby', deskripsi: 'Kesehatan ibu, balita & KB', kapasitasIdeal: 2 },
  { id: 'lancang-l1-lorong', name: 'Ruang Lorong Selasar Lantai 1', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 1', category: 'umum', icon: 'Footprints', deskripsi: 'Lorong tunggu pasien Lt. 1', kapasitasIdeal: 3 },

  // Puskesmas Pembantu Pulau Lancang - Lantai 2
  { id: 'lancang-l2-lab', name: 'Ruang LAB', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 2', category: 'penunjang', icon: 'FlaskConical', deskripsi: 'Laboratorium klinik & tes cepat', kapasitasIdeal: 2 },
  { id: 'lancang-l2-admin', name: 'Ruang Administrasi', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 2', category: 'manajemen', icon: 'Briefcase', deskripsi: 'Kantor administrasi & arsip', kapasitasIdeal: 2 },
  { id: 'lancang-l2-gigi', name: 'Ruang Gigi', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 2', category: 'pelayanan', icon: 'Smile', deskripsi: 'Pelayanan kesehatan gigi & mulut', kapasitasIdeal: 2 },
  { id: 'lancang-l2-lorong', name: 'Ruang Selasar Lorong', tempatKerja: 'Puskesmas Pembantu Pulau Lancang', lantai: 'Lantai 2', category: 'umum', icon: 'Footprints', deskripsi: 'Selasar akses lantai 2', kapasitasIdeal: 2 },

  // Kantor Transit Jakarta
  { id: 'ktj-l1-posko', name: 'Ruang Transit & Koordinasi Pegawai', tempatKerja: 'Kantor Transit Jakarta', lantai: 'Lantai 1', category: 'manajemen', icon: 'Building2', deskripsi: 'Posko perwakilan & koordinasi dinas luar daratan Jakarta', kapasitasIdeal: 4 },
  { id: 'ktj-l1-rapat', name: 'Ruang Rapat & Administrasi Penghubung', tempatKerja: 'Kantor Transit Jakarta', lantai: 'Lantai 1', category: 'manajemen', icon: 'UsersRound', deskripsi: 'Rapat koordinasi lintas dinas & RS rujukan DKI Jakarta', kapasitasIdeal: 6 },
  { id: 'ktj-l1-istirahat', name: 'Kamar Singgah / Transit Medis', tempatKerja: 'Kantor Transit Jakarta', lantai: 'Lantai 1', category: 'penunjang', icon: 'Bed', deskripsi: 'Ruang istirahat nakes rujukan / transit sebelum kembali ke pulau', kapasitasIdeal: 2 }
];

export const INITIAL_PEGAWAI_LIST: Pegawai[] = [];

export const INITIAL_MOVEMENT_LOGS: MovementLog[] = [];

export const INITIAL_LAPOR_DIRI: LaporDiriRecord[] = [];
