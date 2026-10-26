import { KondisiPegawai, TempatKerja, Pegawai, LaporDiriRecord } from '../types';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export function getKondisiBadge(kondisi: KondisiPegawai): {
  label: string;
  badgeClass: string;
  dotClass: string;
  borderClass: string;
  bgLightClass: string;
  textClass: string;
  icon: string;
} {
  switch (kondisi) {
    case 'siap_melayani':
      return {
        label: 'Siap & Melayani',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotClass: 'bg-emerald-500 animate-pulse',
        borderClass: 'border-emerald-200',
        bgLightClass: 'bg-emerald-50/60',
        textClass: 'text-emerald-700',
        icon: 'CheckCircle2'
      };
    case 'tindakan_pasien':
      return {
        label: 'Sedang Tindakan',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        dotClass: 'bg-amber-500 animate-ping',
        borderClass: 'border-amber-300',
        bgLightClass: 'bg-amber-50/80',
        textClass: 'text-amber-800',
        icon: 'Activity'
      };
    case 'istirahat':
      return {
        label: 'Istirahat / Ishoma',
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        dotClass: 'bg-yellow-500',
        borderClass: 'border-yellow-200',
        bgLightClass: 'bg-yellow-50/60',
        textClass: 'text-yellow-700',
        icon: 'Coffee'
      };
    case 'dinas_luar':
      return {
        label: 'Dinas Luar / Rujukan',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        dotClass: 'bg-blue-500',
        borderClass: 'border-blue-200',
        bgLightClass: 'bg-blue-50/60',
        textClass: 'text-blue-700',
        icon: 'Ship'
      };
    case 'piket_siaga':
      return {
        label: 'Piket On-Call',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        dotClass: 'bg-purple-500',
        borderClass: 'border-purple-200',
        bgLightClass: 'bg-purple-50/60',
        textClass: 'text-purple-700',
        icon: 'Moon'
      };
    case 'belum_hadir':
    default:
      return {
        label: 'Belum Check-In',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
        dotClass: 'bg-slate-400',
        borderClass: 'border-slate-200',
        bgLightClass: 'bg-slate-50',
        textClass: 'text-slate-600',
        icon: 'Clock'
      };
  }
}

export function playEmergencyBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio feedback failed', e);
  }
}

export function triggerSuccessConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  } catch (e) {
    console.log(e);
  }
}

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function exportMonitoringPDF({
  title,
  subtitle,
  tempatKerja,
  headers,
  rows,
  fileName,
  headerColor = [37, 99, 235], // default Blue, or [220, 38, 38] for Red (Belum Lapor)
  colWidths = [10, 32, 45, 35, 38, 36],
  colX = [14, 24, 56, 101, 136, 174]
}: {
  title: string;
  subtitle: string;
  tempatKerja: string;
  headers: string[];
  rows: string[][];
  fileName: string;
  headerColor?: [number, number, number];
  colWidths?: number[];
  colX?: number[];
}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Kop Surat Pemerintah Provinsi DKI Jakarta / Dinas Kesehatan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA', 105, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text('DINAS KESEHATAN - PUSKESMAS KECAMATAN KEPULAUAN SERIBU SELATAN', 105, 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl. Raya Pulau Tidung RT 02/RW 02, Kepulauan Seribu Selatan, DKI Jakarta 14520', 105, 23, { align: 'center' });
  doc.text('Telp/Pusat Bantuan: (021) 788-9900 | Email: puskesmaskepseribuselatan@jakarta.go.id', 105, 27, { align: 'center' });

  // Garis Pembatas Kop
  doc.setDrawColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.setLineWidth(0.8);
  doc.line(14, 30, 196, 30);
  doc.setLineWidth(0.2);
  doc.line(14, 31, 196, 31);

  // Judul Laporan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text(title.toUpperCase(), 14, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Keterangan / Status      : ${subtitle}`, 14, 43);
  doc.text(`Lokasi / Tempat Tugas    : ${tempatKerja}`, 14, 47);
  doc.text(`Waktu Pengambilan Data   : ${dateStr}, Jam ${timeStr} WIB`, 14, 51);

  // Render Table
  let startY = 56;

  // Table Header Background
  doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.rect(14, startY, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  const numCols = Math.min(headers.length, colWidths.length);
  for (let i = 0; i < numCols; i++) {
    doc.text(headers[i], colX[i] + 1, startY + 5);
  }

  startY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  rows.forEach((row, rowIndex) => {
    if (startY > 270) {
      doc.addPage();
      startY = 20;
      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.rect(14, startY, 182, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      for (let i = 0; i < numCols; i++) {
        doc.text(headers[i], colX[i] + 1, startY + 5);
      }
      startY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
    }

    // Zebra striping
    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, 182, 6.5, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(14, startY + 6.5, 196, startY + 6.5);

    for (let c = 0; c < numCols; c++) {
      const text = doc.splitTextToSize(row[c] || '-', colWidths[c] - 2);
      doc.text(text[0] || '-', colX[c] + 1, startY + 4.5);
    }

    startY += 6.5;
  });

  // Tanda Tangan Footer
  if (startY > 240) {
    doc.addPage();
    startY = 20;
  } else {
    startY += 10;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Kepulauan Seribu, ${dateStr}`, 145, startY);
  doc.text('Mengetahui,', 145, startY + 4);
  doc.text('Kepala Puskesmas Kec. Kepulauan Seribu Selatan', 145, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('drg. Ahmad Fauzi', 145, startY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 198207152006041002', 145, startY + 32);

  doc.save(fileName);
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(cell => {
          const str = String(cell ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    )
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportRekapitulasiPDF({
  pegawaiList,
  tempatKerjaFilter = 'Semua Lokasi',
  fileName
}: {
  pegawaiList: Pegawai[];
  tempatKerjaFilter?: string;
  fileName?: string;
}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Filter pegawai by tempat tugas if filtered
  const filtered = tempatKerjaFilter === 'Semua' || tempatKerjaFilter === 'Semua Lokasi'
    ? pegawaiList
    : pegawaiList.filter((p) => (p.currentTempatKerja || p.tempatTugas) === tempatKerjaFilter);

  const total = filtered.length;
  const sudahCheckin = filtered.filter((p) => p.status === 'hadir' && p.currentUnitId);
  const belumCheckin = filtered.filter((p) => p.status !== 'hadir' || !p.currentUnitId);
  const percentSudah = total > 0 ? Math.round((sudahCheckin.length / total) * 100) : 0;
  const percentBelum = total > 0 ? Math.round((belumCheckin.length / total) * 100) : 0;

  // 1. Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA', 105, 13, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text('DINAS KESEHATAN - PUSKESMAS KECAMATAN KEPULAUAN SERIBU SELATAN', 105, 17.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl. Raya Pulau Tidung RT 02/RW 02, Kepulauan Seribu Selatan, DKI Jakarta 14520', 105, 21.5, { align: 'center' });
  doc.text('Sistem Informasi Manajemen Posisi & Radar Keberadaan Tenaga Kesehatan (SI NAKHODA)', 105, 25, { align: 'center' });

  // Garis Pembatas Kop
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(14, 28, 196, 28);
  doc.setLineWidth(0.2);
  doc.line(14, 29, 196, 29);

  // 2. Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN REKAPITULASI KEHADIRAN & KETERISIAN RUANGAN TENAGA KESEHATAN', 14, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Lokasi Wilayah Kerja  : ${tempatKerjaFilter}`, 14, 39.5);
  doc.text(`Waktu Pengambilan Data: ${dateStr}, Jam ${timeStr} WIB`, 14, 43.5);

  // 3. Ringkasan KPI Box
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 46, 182, 14, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 46, 182, 14, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`TOTAL PEGAWAI: ${total} ORANG`, 20, 52);
  
  doc.setTextColor(22, 101, 52); // Green
  doc.text(`SUDAH CHECK-IN: ${sudahCheckin.length} Orang (${percentSudah}%)`, 78, 52);

  doc.setTextColor(185, 28, 28); // Red
  doc.text(`BELUM CHECK-IN RUANGAN: ${belumCheckin.length} Orang (${percentBelum}%)`, 134, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Status diperbarui real-time via GPS dan verifikasi foto selfie terkompresi SI NAKHODA', 20, 57);

  let startY = 64;

  // 4. BAGIAN 1: DAFTAR KHUSUS PEGAWAI BELUM CHECK-IN (ALERT SECTION)
  if (belumCheckin.length > 0) {
    doc.setFillColor(254, 242, 242); // Red tint
    doc.rect(14, startY, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text(`[PERHATIAN] DAFTAR PEGAWAI YANG BELUM CHECK-IN RUANGAN (${belumCheckin.length} ORANG)`, 18, startY + 4.2);

    startY += 7.5;

    // Header Tabel Belum Check-in
    doc.setFillColor(220, 38, 38); // Red
    doc.rect(14, startY, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('No', 16, startY + 4.2);
    doc.text('NIP', 26, startY + 4.2);
    doc.text('Nama Pegawai', 58, startY + 4.2);
    doc.text('Profesi & Jabatan', 106, startY + 4.2);
    doc.text('Tempat Tugas', 148, startY + 4.2);
    doc.text('Status', 178, startY + 4.2);

    startY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    belumCheckin.forEach((p, idx) => {
      if (startY > 270) {
        doc.addPage();
        startY = 18;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(254, 242, 242);
        doc.rect(14, startY, 182, 5.5, 'F');
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(14, startY + 5.5, 196, startY + 5.5);

      doc.setTextColor(30, 41, 59);
      doc.text(String(idx + 1), 16, startY + 4);
      doc.text(p.nip, 26, startY + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(doc.splitTextToSize(p.nama, 46)[0] || '-', 58, startY + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(`${p.profesi} - ${p.jabatan}`, 40)[0] || '-', 106, startY + 4);
      doc.text(doc.splitTextToSize(p.tempatTugas, 28)[0] || '-', 148, startY + 4);
      
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text('BELUM MASUK', 178, startY + 4);
      doc.setFont('helvetica', 'normal');

      startY += 5.5;
    });

    startY += 6;
  }

  // 5. BAGIAN 2: TABEL REKAPITULASI LENGKAP SELURUH PEGAWAI
  if (startY > 250) {
    doc.addPage();
    startY = 18;
  }

  doc.setFillColor(30, 41, 59);
  doc.rect(14, startY, 182, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`TABEL REKAPITULASI STATUS LENGKAP SELURUH PEGAWAI (${filtered.length} PERSONIL)`, 18, startY + 4.2);

  startY += 6.5;

  // Header Sub Tabel
  doc.setFillColor(71, 85, 105);
  doc.rect(14, startY, 182, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 16, startY + 4.2);
  doc.text('Nama Pegawai', 25, startY + 4.2);
  doc.text('Profesi / Tugas', 72, startY + 4.2);
  doc.text('Posisi Ruangan Terkini', 115, startY + 4.2);
  doc.text('Kondisi Nakes', 158, startY + 4.2);
  doc.text('Jam', 186, startY + 4.2);

  startY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);

  filtered.forEach((p, idx) => {
    if (startY > 270) {
      doc.addPage();
      startY = 18;
      // Header Sub Tabel repeat
      doc.setFillColor(71, 85, 105);
      doc.rect(14, startY, 182, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('No', 16, startY + 4.2);
      doc.text('Nama Pegawai', 25, startY + 4.2);
      doc.text('Profesi / Tugas', 72, startY + 4.2);
      doc.text('Posisi Ruangan Terkini', 115, startY + 4.2);
      doc.text('Kondisi Nakes', 158, startY + 4.2);
      doc.text('Jam', 186, startY + 4.2);
      startY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, 182, 5.2, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, startY + 5.2, 196, startY + 5.2);

    doc.setTextColor(30, 41, 59);
    doc.text(String(idx + 1), 16, startY + 3.8);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(p.nama, 45)[0] || '-', 25, startY + 3.8);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(`${p.profesi} (${p.tempatTugas})`, 41)[0] || '-', 72, startY + 3.8);

    // Posisi Ruangan
    if (p.currentUnitName && p.status === 'hadir') {
      doc.setTextColor(15, 23, 42);
      doc.text(doc.splitTextToSize(`${p.currentUnitName} (${p.currentLantai || 'Lt. 1'})`, 41)[0] || '-', 115, startY + 3.8);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text('BELUM CHECK-IN', 115, startY + 3.8);
      doc.setFont('helvetica', 'normal');
    }

    // Kondisi
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(p.kondisi.replace(/_/g, ' '), 26)[0] || '-', 158, startY + 3.8);

    // Jam
    doc.text(p.lastUpdateTime || p.lastCheckinTime || '-', 186, startY + 3.8);

    startY += 5.2;
  });

  // Tanda Tangan Footer
  if (startY > 240) {
    doc.addPage();
    startY = 20;
  } else {
    startY += 10;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Kepulauan Seribu, ${dateStr}`, 142, startY);
  doc.text('Mengetahui,', 142, startY + 4);
  doc.text('Kepala Puskesmas Kec. Kepulauan Seribu Selatan', 142, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('drg. Ahmad Fauzi', 142, startY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 198207152006041002', 142, startY + 32);

  doc.save(fileName || `Rekapitulasi_Kehadiran_Ruangan_${Date.now()}.pdf`);
}

export function exportLaporKegiatanPDF({
  title = 'Laporan Pelaksanaan Lapor Diri & Presensi Kegiatan',
  subtitle = 'Dinas Luar, Apel Pagi, Upacara & Kegiatan Nakes Terverifikasi',
  tempatKerja = 'Semua Lokasi',
  kegiatanFilter = 'Semua Kegiatan',
  bulanFilter = 'Semua Bulan',
  tanggalFilter = '',
  records = [],
  fileName
}: {
  title?: string;
  subtitle?: string;
  tempatKerja?: string;
  kegiatanFilter?: string;
  bulanFilter?: string;
  tanggalFilter?: string;
  records: LaporDiriRecord[];
  fileName?: string;
}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Kop Surat Resmi DKI Jakarta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA', 105, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text('DINAS KESEHATAN - PUSKESMAS KECAMATAN KEPULAUAN SERIBU SELATAN', 105, 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl. Raya Pulau Tidung RT 02/RW 02, Kepulauan Seribu Selatan, DKI Jakarta 14520', 105, 23, { align: 'center' });
  doc.text('Pusat Bantuan: (021) 788-9900 | Integrasi Google Drive ID: 1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6', 105, 27, { align: 'center' });

  // Garis Pembatas Kop (Indigo theme)
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.8);
  doc.line(14, 30, 196, 30);
  doc.setLineWidth(0.2);
  doc.line(14, 31, 196, 31);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text(title.toUpperCase(), 14, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Keterangan Kegiatan     : ${subtitle}`, 14, 43);
  doc.text(`Filter Jenis Kegiatan   : ${kegiatanFilter} | Lokasi: ${tempatKerja}`, 14, 47);
  const filterDateLabel = tanggalFilter ? `Tanggal: ${tanggalFilter}` : (bulanFilter !== 'Semua Bulan' && bulanFilter !== 'Semua' ? `Bulan: ${bulanFilter}` : 'Semua Periode');
  doc.text(`Filter Periode Waktu    : ${filterDateLabel} | Data: ${records.length} Laporan`, 14, 51);
  doc.text(`Waktu Pengambilan Data  : ${dateStr}, Jam ${timeStr} WIB`, 14, 55);

  // Table Setup
  let startY = 60;
  const colWidths = [8, 16, 38, 28, 44, 32, 16];
  const colX = [14, 22, 38, 76, 104, 148, 180];
  const headers = ['No', 'Jam', 'Nama & NIP', 'Kegiatan', 'Detail / Uraian', 'Lokasi & Alamat', 'Bukti Foto'];

  // Header Box
  doc.setFillColor(79, 70, 229);
  doc.rect(14, startY, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], colX[i] + 1, startY + 4.8);
  }

  startY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);

  records.forEach((r, idx) => {
    if (startY > 265) {
      doc.addPage();
      startY = 20;
      doc.setFillColor(79, 70, 229);
      doc.rect(14, startY, 182, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], colX[i] + 1, startY + 4.8);
      }
      startY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(245, 247, 255);
      doc.rect(14, startY, 182, 7, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(14, startY + 7, 196, startY + 7);

    // No
    doc.text(String(idx + 1), colX[0] + 1, startY + 4.5);
    // Jam
    doc.text(`${r.timestamp} WIB`, colX[1] + 1, startY + 4.5);
    // Nama Pegawai
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(r.pegawaiNama, colWidths[2] - 2)[0] || '-', colX[2] + 1, startY + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(`NIP: ${r.nip}`, colWidths[2] - 2)[0] || '-', colX[2] + 1, startY + 6.2);

    // Kegiatan
    doc.text(doc.splitTextToSize(r.kegiatan, colWidths[3] - 2)[0] || '-', colX[3] + 1, startY + 4.5);

    // Detail
    doc.text(doc.splitTextToSize(r.detail || '-', colWidths[4] - 2)[0] || '-', colX[4] + 1, startY + 4.5);

    // Lokasi & Alamat Jalan
    const locText = r.alamatLokasi
      ? `${r.lokasi} - ${r.alamatLokasi}`
      : (r.coordinates ? `${r.lokasi} (${r.coordinates.lat.toFixed(3)}, ${r.coordinates.lng.toFixed(3)})` : r.lokasi);
    doc.text(doc.splitTextToSize(locText, colWidths[5] - 2)[0] || '-', colX[5] + 1, startY + 4.5);

    // Bukti Foto / Drive status
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text('Drive OK', colX[6] + 1, startY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    startY += 7;
  });

  // Tanda Tangan Footer
  if (startY > 240) {
    doc.addPage();
    startY = 20;
  } else {
    startY += 10;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Kepulauan Seribu, ${dateStr}`, 142, startY);
  doc.text('Mengetahui,', 142, startY + 4);
  doc.text('Kepala Puskesmas Kec. Kepulauan Seribu Selatan', 142, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('drg. Ahmad Fauzi', 142, startY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 198207152006041002', 142, startY + 32);

  const cleanName = fileName || `Laporan_Lapor_Diri_${kegiatanFilter.replace(/ /g, '_')}_${Date.now()}.pdf`;
  doc.save(cleanName);
}


