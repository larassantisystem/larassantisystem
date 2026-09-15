import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  Download,
  X,
  Cloud,
  CheckCircle2,
  Upload,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  googleDriveSignIn,
  uploadCoaFileToDrive,
  getDriveAccessToken,
} from '../../../core/googleDrive/googleDriveService';

interface CoaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  driveFileId?: string;
  driveViewLink?: string;
  materialName?: string;
  materialCode?: string;
  batchNumber?: string;
  grnNumber?: string;
  onDriveUploaded?: (result: { fileId: string; viewLink: string }) => void;
}

export const CoaViewerModal: React.FC<CoaViewerModalProps> = ({
  isOpen,
  onClose,
  fileName,
  driveFileId,
  driveViewLink,
  materialName = 'Material Bahan',
  materialCode = '-',
  batchNumber = '-',
  grnNumber = '-',
  onDriveUploaded,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const effectiveViewUrl =
    driveViewLink ||
    (driveFileId ? `https://drive.google.com/file/d/${driveFileId}/view` : null);

  const embedPreviewUrl = driveFileId
    ? `https://drive.google.com/file/d/${driveFileId}/preview`
    : null;

  const handleManualUploadToDrive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadCoaFileToDrive(file, {
        grnNumber,
        materialName,
        batchNumber,
      });

      if (onDriveUploaded) {
        onDriveUploaded({
          fileId: result.fileId,
          viewLink: result.webViewLink,
        });
      }
    } catch (err: any) {
      if (err.isCancelled || err.code === 'auth/popup-closed-by-user') {
        setUploadError('Login Google Drive dibatalkan oleh pengguna.');
        setTimeout(() => setUploadError(null), 3500);
      } else {
        console.warn('Notice uploading CoA to Drive:', err?.message || err);
        setUploadError(err.message || 'Gagal mengunggah dokumen ke Google Drive.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">
                  Pratinjau Dokumen Certificate of Analysis (CoA)
                </h3>
                {driveFileId ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                    <Cloud className="w-3 h-3 text-blue-600" />
                    Google Drive Terhubung
                  </span>
                ) : (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    Lampiran Lokal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {fileName || 'Dokumen CoA Mutu'} • {materialName} ({materialCode}) • Batch: {batchNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {effectiveViewUrl && (
              <a
                href={effectiveViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Buka dokumen di tab Google Drive baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buka di Google Drive</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col items-center justify-center">
          {embedPreviewUrl ? (
            <div className="w-full h-full flex flex-col">
              <iframe
                src={embedPreviewUrl}
                className="w-full flex-1 border-0"
                title="Pratinjau Dokumen CoA Google Drive"
                allow="autoplay"
              />
              <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  Menampilkan file Google Drive:{' '}
                  <strong className="text-slate-800 font-mono">{fileName}</strong>
                </span>
                <a
                  href={effectiveViewUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Tampilan Penuh
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 max-w-lg text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
                <Cloud className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  Dokumen Tercatat: {fileName || 'Sertifikat Analisis (CoA)'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  File ini terdaftar pada bukti kedatangan barang fisik gudang untuk material{' '}
                  <strong className="text-slate-800">{materialName}</strong> ({materialCode}) No. Batch{' '}
                  <strong className="text-slate-800 font-mono">{batchNumber}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left text-xs space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-100">
                  <span>Nomor Bukti GRN:</span>
                  <span className="font-mono font-bold text-slate-900">{grnNumber}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-100">
                  <span>Nama File CoA:</span>
                  <span className="font-mono font-semibold text-emerald-700">{fileName || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Integrasi Cloud:</span>
                  <span className="font-bold text-blue-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Google Drive Siap
                  </span>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleManualUploadToDrive}
                />

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah ke Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Unggah File Dokumen ke Google Drive</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Sistem Dokumentasi Mutu CPKB • Google Drive Terintegrasi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
