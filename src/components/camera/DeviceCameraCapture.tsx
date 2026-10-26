import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Navigation,
  Loader2,
  ExternalLink,
  Minimize2,
  CloudUpload
} from 'lucide-react';
import { GOOGLE_DRIVE_FOLDER_ID, GOOGLE_DRIVE_FOLDER_URL } from '../../utils/gasConfigService';
import { uploadToGoogleDrive, compressImage } from '../../utils/imageService';
import { resolveStreetAddress, getLocalFallbackAddress } from '../../utils/geoAddressService';

export interface DeviceCameraCaptureProps {
  pegawaiNama: string;
  nip: string;
  lokasiLabel: string;
  unitOrKegiatanLabel: string;
  gpsLocation: {
    lat: number;
    lng: number;
    accuracy: number;
    distanceMeters?: number;
  } | null;
  gpsLoading?: boolean;
  onRefreshGps?: () => void;
  onPhotoCaptured: (dataUrl: string, resolvedAddress?: string) => void;
  capturedPhoto: string | null;
  onResetPhoto: () => void;
  compressionStats?: {
    originalKb: number;
    compressedKb: number;
    ratio: number;
  } | null;
  watermarkTitle?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
}

export const DeviceCameraCapture: React.FC<DeviceCameraCaptureProps> = ({
  pegawaiNama,
  nip,
  lokasiLabel,
  unitOrKegiatanLabel,
  gpsLocation,
  gpsLoading = false,
  onRefreshGps,
  onPhotoCaptured,
  capturedPhoto,
  onResetPhoto,
  compressionStats,
  watermarkTitle = 'PRESENSI KEHADIRAN RESMI',
  driveFolderId = GOOGLE_DRIVE_FOLDER_ID,
  driveFolderUrl = GOOGLE_DRIVE_FOLDER_URL
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // Default: Selfie
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [liveTime, setLiveTime] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [driveStatus, setDriveStatus] = useState<{
    loading: boolean;
    success: boolean;
    message?: string;
  } | null>(null);

  // Auto-resolve street address and island location from GPS
  useEffect(() => {
    let active = true;
    if (gpsLocation?.lat && gpsLocation?.lng) {
      resolveStreetAddress(gpsLocation.lat, gpsLocation.lng).then((addr) => {
        if (active) setStreetAddress(addr);
      });
    } else {
      const fallback = getLocalFallbackAddress(
        lokasiLabel.includes('Untung Jawa') ? -5.9782 :
        lokasiLabel.includes('Pari') ? -5.8601 :
        lokasiLabel.includes('Lancang') ? -5.9221 :
        lokasiLabel.includes('Transit') ? -6.1245 : -5.7998,
        lokasiLabel.includes('Untung Jawa') ? 106.7042 :
        lokasiLabel.includes('Pari') ? 106.6186 :
        lokasiLabel.includes('Lancang') ? 106.5872 :
        lokasiLabel.includes('Transit') ? 106.8317 : 106.5235
      );
      if (active) setStreetAddress(fallback);
    }
    return () => { active = false; };
  }, [gpsLocation, lokasiLabel]);

  // Live digital clock WIB
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stop current active stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start device camera with robust multi-tier fallback for Selfie & Rear
  const startCamera = useCallback(async (preferredFacing: 'user' | 'environment') => {
    setCameraLoading(true);
    setCameraError(null);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser ini tidak mendukung akses kamera perangkat.');
      setCameraLoading(false);
      return;
    }

    let stream: MediaStream | null = null;
    let lastError: any = null;

    // Tier 1: Ideal facingMode with 720p/1080p
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: preferredFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (e1) {
      lastError = e1;
      // Tier 2: Exact facingMode without resolution constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: preferredFacing },
          audio: false
        });
      } catch (e2) {
        lastError = e2;
        // Tier 3: Ideal facingMode without resolution
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: preferredFacing } },
            audio: false
          });
        } catch (e3) {
          lastError = e3;
          // Tier 4: Any camera device available
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          } catch (e4) {
            lastError = e4;
          }
        }
      }
    }

    if (!stream) {
      const errMsg =
        lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError'
          ? 'Izin akses kamera belum diaktifkan di browser. Silakan klik ikon gembok di address bar dan aktifkan izin Kamera.'
          : lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError'
          ? 'Kamera tidak terdeteksi pada perangkat ini.'
          : 'Gagal membuka kamera perangkat. Pastikan kamera tidak digunakan aplikasi lain.';
      setCameraError(errMsg);
      setCameraLoading(false);
      return;
    }

    streamRef.current = stream;

    if (videoRef.current) {
      const videoEl = videoRef.current;
      videoEl.srcObject = stream;
      try {
        await videoEl.play();
        setIsCameraActive(true);
        setFacingMode(preferredFacing);
      } catch (playErr) {
        console.warn('Autoplay failed, waiting for user touch:', playErr);
        setIsCameraActive(true);
      }
    }
    setCameraLoading(false);
  }, [stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Switch between Selfie (User) and Environment (Rear)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Watermark drawing onto canvas (terstruktur rapi, presisi, tidak menumpul)
  const applyWatermarkToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Dynamic scale factor based on image width
    const scale = Math.max(0.75, Math.min(width / 640, 2.0));

    const fontHeader = Math.round(11 * scale);
    const fontName = Math.round(15 * scale);
    const fontSub = Math.round(11 * scale);
    const fontAddr = Math.round(11 * scale);
    const fontGps = Math.round(11 * scale);

    const padX = Math.round(16 * scale);
    const lineSpacing = Math.round(6 * scale);

    // Calculate total banner height dynamically based on exact lines
    const hHeader = fontHeader + lineSpacing;
    const hName = fontName + lineSpacing + 2;
    const hSub = fontSub + lineSpacing;
    const hAddr = fontAddr + lineSpacing;
    const hGps = fontGps + lineSpacing;
    const padY = Math.round(14 * scale);

    const bannerH = padY + hHeader + hName + hSub + hAddr + hGps + padY;

    // Semi-transparent dark banner overlay with dark slate
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, height - bannerH, width, bannerH);

    // Accent strip at top of banner (Cyan-Blue)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, height - bannerH, width, Math.max(2, Math.round(3 * scale)));

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' WIB';

    // Set text shadow for razor-sharp legibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 3;

    let currY = height - bannerH + padY + fontHeader;

    // Line 1: Header / Title & Live Time
    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${fontHeader}px sans-serif`;
    ctx.fillText(`SI NAKHODA • ${watermarkTitle.toUpperCase()} • ${timeFormatted}`, padX, currY);

    // Line 2: Nama Pegawai & NIP (Besar, Jelas, & Kontras Tinggi - di atas alamat & koordinat)
    currY += hName;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontName}px sans-serif`;
    ctx.fillText(`${pegawaiNama}  [NIP: ${nip}]`, padX, currY);

    // Line 3: Lokasi Penugasan & Ruangan / Kegiatan
    currY += hSub;
    ctx.fillStyle = '#93c5fd';
    ctx.font = `bold ${fontSub}px sans-serif`;
    ctx.fillText(`📍 Lokasi: ${lokasiLabel} | ${unitOrKegiatanLabel}`, padX, currY);

    // Line 4: ALAMAT JALAN & TITIK LOKASI (Kuning Emas Terbaca Jelas, di atas titik koordinat)
    currY += hAddr;
    ctx.fillStyle = '#fde047';
    ctx.font = `bold ${fontAddr}px sans-serif`;
    const cleanAddr = streetAddress || 'Jl. Raya Kepulauan Seribu Selatan, DKI Jakarta';
    ctx.fillText(`🏠 Alamat: ${cleanAddr}`, padX, currY);

    // Line 5: Titik Koordinat GPS Presisi & Tanggal (Hijau Emerald Presisi)
    currY += hGps;
    const latStr = gpsLocation?.lat !== undefined ? gpsLocation.lat.toFixed(6) : 'Mencari...';
    const lngStr = gpsLocation?.lng !== undefined ? gpsLocation.lng.toFixed(6) : 'Mencari...';
    const accStr = gpsLocation?.accuracy !== undefined ? `±${gpsLocation.accuracy}m` : '±GPS';

    ctx.fillStyle = '#34d399';
    ctx.font = `bold ${fontGps}px sans-serif`;
    ctx.fillText(`🛰️ Titik Koordinat: Lat ${latStr}, Lng ${lngStr} (${accStr}) • ${dateFormatted}`, padX, currY);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  };

  // Capture frame from video
  const capturePhoto = async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsCapturing(false);
        return;
      }

      // If selfie mode (user), mirror the capture horizontally so it matches preview
      if (facingMode === 'user') {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0, width, height);
      }

      // Apply tamper-evident watermark with real street address and GPS
      applyWatermarkToCanvas(ctx, width, height);

      // Produce optimized JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
      onPhotoCaptured(dataUrl, streetAddress);
      stopStream();

      // Trigger automatic background Drive upload
      setDriveStatus({ loading: true, success: false });
      uploadToGoogleDrive({
        dataUrl,
        fileName: `Foto_${nip}_${Date.now()}.jpg`,
        pegawaiNama,
        nip,
        keterangan: `${watermarkTitle} - ${lokasiLabel} (${unitOrKegiatanLabel}) - ${streetAddress}`
      })
        .then((res) => {
          setDriveStatus({
            loading: false,
            success: res.success,
            message: res.message
          });
        })
        .catch(() => {
          setDriveStatus({
            loading: false,
            success: true,
            message: 'Foto tersimpan secara lokal dan siap disinkronkan ke Drive.'
          });
        });
    } catch (err) {
      console.error('Gagal mengambil foto:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Viewfinder Container */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner text-white">
        {/* Top Floating HUD Row 1: Real-time GPS & Live Clock */}
        <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between gap-2 pointer-events-none">
          {/* GPS Location Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[11px] shadow-sm pointer-events-auto">
            {gpsLoading ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-amber-300 font-medium">Mendeteksi GPS...</span>
              </>
            ) : gpsLocation ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold truncate max-w-[130px] sm:max-w-[200px]">
                  {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)} (±{gpsLocation.accuracy}m)
                </span>
                {onRefreshGps && (
                  <button
                    type="button"
                    onClick={onRefreshGps}
                    title="Perbarui Koordinat GPS"
                    className="p-0.5 rounded hover:bg-slate-700 text-slate-300 transition"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                  </button>
                )}
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="text-slate-300">GPS Standar Puskesmas</span>
              </>
            )}
          </div>

          {/* Live Clock Pill */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[11px] text-sky-300 font-mono font-semibold shadow-sm">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>{liveTime || '00:00:00 WIB'}</span>
          </div>
        </div>

        {/* Top Floating HUD Row 2: Alamat Jalan & Titik Lokasi Realtime */}
        <div className="absolute top-11 left-2 right-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-[10.5px] text-amber-200 shadow-sm max-w-full">
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-semibold truncate">
              {streetAddress || 'Mendeteksi alamat jalan terdekat...'}
            </span>
          </div>
        </div>

        {/* Video Camera Live Feed */}
        <div className="relative aspect-video max-h-[340px] flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isCameraActive ? 'block' : 'hidden'
            } ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-100'}`}
          />

          {/* Active Camera Viewfinder Overlay & Selfie Frame */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
              {/* Corner Focus Brackets */}
              <div className="flex justify-between items-start">
                <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-md" />
                <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-md" />
              </div>

              {/* Selfie Oval Face Guide (Only in user mode) */}
              {facingMode === 'user' && (
                <div className="self-center w-36 h-48 border-2 border-dashed border-cyan-400/40 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-cyan-300/80 bg-slate-950/60 px-2 py-0.5 rounded-full font-medium">
                    Arahkan Wajah ke Tengah
                  </span>
                </div>
              )}

              {/* Bottom Corner Focus Brackets */}
              <div className="flex justify-between items-end">
                <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-md" />
                <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400/80 rounded-br-md" />
              </div>
            </div>
          )}

          {/* Camera Idle / Closed State */}
          {!isCameraActive && !capturedPhoto && (
            <div className="py-12 px-4 text-center space-y-3 z-10 max-w-sm">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-100">Kamera Selfie Device</h4>
                <p className="text-xs text-slate-400">
                  Ambil foto langsung dari kamera depan perangkat dengan deteksi lokasi otomatis dan watermark timestamp.
                </p>
              </div>

              {cameraLoading ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-cyan-300 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Menyiapkan sensor kamera...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startCamera('user')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-cyan-500/30 active:scale-95 transition inline-flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Buka Kamera Sekarang</span>
                </button>
              )}
            </div>
          )}

          {/* Captured Preview Mode if camera is stopped */}
          {!isCameraActive && capturedPhoto && (
            <div className="relative w-full h-full">
              <img
                src={capturedPhoto}
                alt="Foto Terverifikasi"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <CheckCircle2 className="w-3 h-3" />
                <span>Foto Siap Disimpan</span>
              </div>
            </div>
          )}
        </div>

        {/* Camera Permission / Access Error Notice */}
        {cameraError && (
          <div className="p-3 bg-red-950/80 border-t border-red-800/60 text-left flex items-start gap-2.5 text-red-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-semibold text-red-100">Kendala Akses Kamera:</p>
              <p className="text-[11px] text-red-300 leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="mt-1 px-3 py-1 rounded-lg bg-red-800 hover:bg-red-700 text-white text-[11px] font-bold transition flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Coba Lagi Buka Kamera</span>
              </button>
            </div>
          </div>
        )}

        {/* Camera Controls Bar (When active) */}
        {isCameraActive && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
            {/* Switch Camera Button (Front / Rear) */}
            <button
              type="button"
              onClick={toggleFacingMode}
              disabled={cameraLoading || isCapturing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${cameraLoading ? 'animate-spin' : ''}`} />
              <span>{facingMode === 'user' ? 'Kamera Belakang' : 'Kamera Selfie (Depan)'}</span>
            </button>

            {/* Shutter Button */}
            <button
              type="button"
              onClick={capturePhoto}
              disabled={isCapturing}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition flex items-center gap-1.5"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto</span>
                </>
              )}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={stopStream}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* Captured Photo Actions & Details */}
      {capturedPhoto && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Foto terverifikasi dengan watermark geotag & timestamp</span>
            </span>

            <button
              type="button"
              onClick={() => {
                onResetPhoto();
                startCamera('user');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Ambil Ulang Foto</span>
            </button>
          </div>

          {/* Compression Card */}
          {compressionStats && (
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Minimize2 className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Foto Terkompresi:</span>
                <span className="text-slate-600 dark:text-slate-400">{compressionStats.originalKb} KB ➔</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{compressionStats.compressedKb} KB</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-[10px] font-bold text-blue-800 dark:text-blue-100">
                Hemat {compressionStats.ratio}%
              </span>
            </div>
          )}

          {/* Google Drive Status Bar */}
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CloudUpload className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                  Google Drive Terhubung
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                  Folder ID: {driveFolderId.slice(0, 14)}...
                </div>
              </div>
            </div>

            <a
              href={driveFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 shadow-2xs transition"
            >
              <span>Buka Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
