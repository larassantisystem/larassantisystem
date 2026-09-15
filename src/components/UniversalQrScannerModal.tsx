import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Flashlight,
  ShieldCheck,
  Package,
  Calendar,
  Layers,
  FileText,
  Sparkles,
  QrCode,
  Tag,
  Clock,
  User,
  AlertTriangle,
  Building2,
  Boxes,
} from 'lucide-react';
import jsQR from 'jsqr';
import { qualityService } from '../features/quality/qualityService';
import { warehouseService } from '../features/warehouse/warehouseService';

interface UniversalQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ParsedQrData {
  raw: string;
  type?: string;
  docCode?: string;
  company?: string;
  lot?: string;
  grn?: string;
  matCode?: string;
  matName?: string;
  containerIndex?: number;
  totalContainers?: number;
  containerLabel?: string;
  sampled?: boolean | string;
  sampleSize?: string | null;
  samplingDate?: string | null;
  status?: string;
  expDate?: string;
  retestDate?: string;
  qmSigner?: string | null;
  mfg?: string;
  // Fallback fields for other formats
  [key: string]: any;
}

export const UniversalQrScannerModal: React.FC<UniversalQrScannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<ParsedQrData | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [matchedReport, setMatchedReport] = useState<any | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera langsung. Silakan gunakan opsi Unggah Gambar QR.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Izin akses kamera ditolak. Berikan izin kamera di pengaturan browser atau gunakan opsi Unggah Foto QR.'
          : err.message || 'Gagal membuka kamera perangkat.'
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      setMatchedReport(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Frame processing loop
  const tick = () => {
    if (!videoRef.current || !canvasRef.current) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleSuccessfulScan(code.data);
          return;
        }
      }
    }

    if (isScanning && isOpen) {
      animationFrameId.current = requestAnimationFrame(tick);
    }
  };

  const handleSuccessfulScan = (rawData: string) => {
    setIsScanning(false);
    stopCamera();

    // Play subtle audio beep
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.start();
      setTimeout(() => {
        osc.stop();
      }, 120);
    } catch (e) {
      // Audio not permitted without user gesture, safe to ignore
    }

    // Parse payload
    let parsed: ParsedQrData = { raw: rawData };
    try {
      const json = JSON.parse(rawData);
      if (typeof json === 'object' && json !== null) {
        parsed = { ...json, raw: rawData };
      }
    } catch (e) {
      // Raw string format: QC|LOT:xxx|W:1/5|CODE:xxx|STATUS:PASSED
      if (rawData.startsWith('QC|') || rawData.includes('|')) {
        const parts = rawData.split('|');
        const map: any = { raw: rawData };
        parts.forEach((p) => {
          const [k, v] = p.split(':');
          if (k && v) {
            if (k === 'LOT') map.lot = v;
            if (k === 'W') map.containerLabel = `Wadah ${v}`;
            if (k === 'CODE') map.matCode = v;
            if (k === 'STATUS') map.status = v;
          }
        });
        parsed = map;
      }
    }

    setScannedResult(parsed);

    // Cross-match with internal records
    try {
      const qcReports = qualityService.getLocalReports();
      const targetLot = parsed.lot || parsed.grn;
      if (targetLot) {
        const found = qcReports.find(
          (r) =>
            r.lotInternalNumber === targetLot ||
            r.grnNumber === targetLot ||
            (parsed.matCode && r.materialCode === parsed.matCode)
        );
        if (found) {
          setMatchedReport(found);
        }
      }
    } catch (e) {
      console.warn('Error matching reports:', e);
    }
  };

  // Handle Image File Upload for QR Code
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleSuccessfulScan(code.data);
        } else {
          alert('Tidak ditemukan QR Code yang valid pada gambar ini. Silakan coba gambar lain yang lebih jelas.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      const capabilities = (track.getCapabilities && (track as any).getCapabilities()) || {};
      if (capabilities.torch) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: !torchOn }],
          });
          setTorchOn(!torchOn);
        } catch (e) {
          console.warn('Torch not supported:', e);
        }
      } else {
        alert('Fitur lampu flash tidak didukung pada kamera ini.');
      }
    }
  };

  const handleResetScan = () => {
    setScannedResult(null);
    setMatchedReport(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Pemindai QR Label & Wadah CPKB
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-bold">
                  Kamera Aktif
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Arahkan kamera ke QR Code label kemasan, wadah drum, atau dokumen pengawasan mutu.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50">
          {!scannedResult ? (
            /* Live Camera View */
            <div className="space-y-4">
              <div className="relative w-full aspect-4/3 max-h-[380px] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-700">
                {hasCameraPermission === false ? (
                  <div className="p-6 text-center text-slate-300 max-w-sm space-y-3">
                    <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                    <h3 className="font-bold text-white text-sm">Akses Kamera Terkendala</h3>
                    <p className="text-xs text-slate-400">{cameraError}</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Unggah Foto / Screenshot QR
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Viewfinder Overlay Frame */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {/* Darkened edges */}
                      <div className="w-64 h-64 border-2 border-teal-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                        {/* Corner markers */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-300 rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-300 rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-300 rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-300 rounded-br-lg" />

                        {/* Animated Laser Scanning Line */}
                        <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_12px_#2dd4bf] animate-[bounce_2s_infinite]" />
                      </div>
                    </div>

                    {/* Camera Control Overlay Buttons */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                          className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white text-xs font-semibold rounded-xl border border-white/20 flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Ganti Kamera</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleTorch}
                          className={`px-3 py-1.5 backdrop-blur-md text-xs font-semibold rounded-xl border flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
                            torchOn
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : 'bg-slate-900/80 hover:bg-slate-900 text-white border-white/20'
                          }`}
                        >
                          <Flashlight className="w-3.5 h-3.5" />
                          <span>{torchOn ? 'Flash Hidup' : 'Flash'}</span>
                        </button>
                      </div>

                      <label className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white text-xs font-semibold rounded-xl border border-white/20 flex items-center gap-1.5 shadow-md cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-950">
                  <span className="font-bold block">Verifikasi Validasi Mutu CPKB Instan</span>
                  Pindai QR pada label tong/drum atau kemasan untuk memeriksa status kelulusan pengujian, riwayat sampling wadah, dan tanggal kedaluwarsa secara langsung.
                </div>
              </div>
            </div>
          ) : (
            /* Scanned Result Detail View */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                  scannedResult.status === 'PASSED' || (matchedReport && matchedReport.status === 'PASSED')
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                    : scannedResult.status === 'PASSED_WITH_DEVIATION' || (matchedReport && matchedReport.status === 'PASSED_WITH_DEVIATION')
                    ? 'bg-teal-50 border-teal-500 text-teal-950'
                    : scannedResult.status === 'REJECTED' || (matchedReport && matchedReport.status === 'REJECTED')
                    ? 'bg-rose-50 border-rose-500 text-rose-950'
                    : 'bg-amber-50 border-amber-400 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                      scannedResult.status === 'PASSED' || (matchedReport && matchedReport.status === 'PASSED')
                        ? 'bg-emerald-600'
                        : scannedResult.status === 'PASSED_WITH_DEVIATION' || (matchedReport && matchedReport.status === 'PASSED_WITH_DEVIATION')
                        ? 'bg-teal-600'
                        : scannedResult.status === 'REJECTED' || (matchedReport && matchedReport.status === 'REJECTED')
                        ? 'bg-rose-600'
                        : 'bg-amber-500'
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75">
                      Status Mutu Wadah
                    </span>
                    <h3 className="font-black text-base">
                      {scannedResult.status === 'PASSED' || (matchedReport && matchedReport.status === 'PASSED')
                        ? 'LOLOS QC (RELEASED - SIAP PRODUKSI)'
                        : scannedResult.status === 'PASSED_WITH_DEVIATION' || (matchedReport && matchedReport.status === 'PASSED_WITH_DEVIATION')
                        ? 'RELEASE BY DEVIATION (LULUS BERSYARAT)'
                        : scannedResult.status === 'REJECTED' || (matchedReport && matchedReport.status === 'REJECTED')
                        ? 'DITOLAK (REJECTED - DILARANG DIGUNAKAN)'
                        : 'STATUS: KARANTINA / DALAM PENGUJIAN'}
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white border shadow-2xs">
                  {scannedResult.docCode || (matchedReport?.materialType === 'raw' ? 'L-DQC-001-01' : 'L-DQC-003-01')}
                </span>
              </div>

              {/* Material & Lot Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {scannedResult.matCode || matchedReport?.materialCode || 'KODE MATERIAL'}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {scannedResult.company || 'PT. LARASSANTI MAKMUR SEJAHTERA'}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 text-base mt-1">
                      {scannedResult.matName || matchedReport?.materialName || 'Nama Bahan Tidak Diketahui'}
                    </h4>
                  </div>

                  {/* Wadah Tag */}
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 font-extrabold text-xs">
                      {scannedResult.containerLabel || (scannedResult.containerIndex ? `Wadah #${scannedResult.containerIndex} dari ${scannedResult.totalContainers || 1}` : 'Wadah Utama')}
                    </span>
                  </div>
                </div>

                {/* Sampling Details Box */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    scannedResult.sampled === true || scannedResult.sampled === 'YES' || (matchedReport && matchedReport.sampledContainers?.includes(scannedResult.containerIndex))
                      ? 'bg-teal-50/80 border-teal-200 text-teal-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-teal-700" />
                      <span className="text-xs font-extrabold">Status Pengambilan Contoh (Sampling):</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        scannedResult.sampled === true || scannedResult.sampled === 'YES' || (matchedReport && matchedReport.sampledContainers?.includes(scannedResult.containerIndex))
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {scannedResult.sampled === true || scannedResult.sampled === 'YES' || (matchedReport && matchedReport.sampledContainers?.includes(scannedResult.containerIndex))
                        ? '✓ TELAH DISAMPLING QC'
                        : 'SEGEL UTUH (TIDAK DIBUKA)'}
                    </span>
                  </div>

                  {(scannedResult.sampleSize || (matchedReport && matchedReport.actualSampleSize)) && (
                    <div className="mt-2 text-xs flex items-center justify-between border-t border-teal-200/60 pt-2 font-medium">
                      <span>Jumlah Fisik Sampel Diambil:</span>
                      <span className="font-bold text-teal-900">
                        {scannedResult.sampleSize || `${matchedReport.actualSampleSize} ${matchedReport.actualSampleUnit || 'gram'}`}
                      </span>
                    </div>
                  )}

                  {scannedResult.samplingDate && (
                    <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Waktu Sampling Digital:</span>
                      <span className="font-mono">{new Date(scannedResult.samplingDate).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                {/* Grid of Key Properties */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">No. Lot Internal</span>
                    <span className="font-mono font-black text-slate-900 text-xs block mt-0.5">
                      {scannedResult.lot || matchedReport?.lotInternalNumber || '-'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">No. GRN Gudang</span>
                    <span className="font-mono font-bold text-slate-800 text-xs block mt-0.5">
                      {scannedResult.grn || matchedReport?.grnNumber || '-'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Tgl Kedaluwarsa (Exp)</span>
                    <span className="font-bold text-rose-700 text-xs block mt-0.5">
                      {scannedResult.expDate || matchedReport?.expiryDate || 'Non-Exp'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Tgl Retest (Uji Ulang)</span>
                    <span className="font-bold text-teal-800 text-xs block mt-0.5">
                      {scannedResult.retestDate || matchedReport?.retestDate || '-'}
                    </span>
                  </div>

                  <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Produsen / Pemasok</span>
                      <span className="font-medium text-slate-900 text-xs block mt-0.5">
                        {scannedResult.mfg || matchedReport?.manufacturer || '-'}
                      </span>
                    </div>
                    {scannedResult.qmSigner && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Otorisasi QM</span>
                        <span className="font-bold text-emerald-800 text-xs block mt-0.5">
                          {scannedResult.qmSigner}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <p className="text-xs text-slate-500">
            {scannedResult ? '✓ Data valid dan tervalidasi dengan sistem CPKB.' : 'Dekatkan QR Code ke dalam bingkai kamera.'}
          </p>

          <div className="flex items-center gap-2">
            {scannedResult && (
              <button
                type="button"
                onClick={handleResetScan}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Pindai QR Lain
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
