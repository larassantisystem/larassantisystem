import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Printer,
  Search,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Award,
  Building2,
  Lock,
} from 'lucide-react';
import { qualityService } from '../qualityService';
import { QcInspectionReport } from '../types/qcTypes';
import { QcInspectionReportPdfModal } from './QcInspectionReportPdfModal';
import { normalizeLotNumber } from '../utils/qcNumbering';

interface PublicCoaVerificationPageProps {
  lotQuery: string;
  onExit: () => void;
}

export const PublicCoaVerificationPage: React.FC<PublicCoaVerificationPageProps> = ({
  lotQuery,
  onExit,
}) => {
  const [searchTerm, setSearchTerm] = useState(lotQuery || '');
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<QcInspectionReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<QcInspectionReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Fetch reports from Supabase database
  const loadData = async (targetTerm?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const allReports = await qualityService.getReports();
      setReports(allReports);

      const queryToFind = (targetTerm !== undefined ? targetTerm : searchTerm).trim().toLowerCase();
      if (queryToFind) {
        let cleanQuery = queryToFind;
        if (cleanQuery.includes('lot:')) {
          const parts = cleanQuery.split('|');
          const lotPart = parts.find((p) => p.startsWith('lot:'));
          if (lotPart) {
            cleanQuery = lotPart.replace('lot:', '').trim();
          }
        }

        const matched = allReports.find((r) => {
          const lot = (r.lotInternalNumber || '').toLowerCase();
          const grn = (r.grnNumber || '').toLowerCase();
          const repNum = (r.reportNumber || '').toLowerCase();
          const id = (r.id || '').toLowerCase();
          const batch = (r.batchNumber || '').toLowerCase();

          return (
            id === cleanQuery ||
            lot === cleanQuery ||
            grn === cleanQuery ||
            repNum === cleanQuery ||
            batch === cleanQuery ||
            (lot && cleanQuery.includes(lot)) ||
            (grn && cleanQuery.includes(grn)) ||
            (repNum && cleanQuery.includes(repNum))
          );
        });

        if (matched) {
          setSelectedReport(matched);
        } else {
          setSelectedReport(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to load CoA verification data:', err);
      setErrorMsg('Gagal memuat data dari database Supabase. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(lotQuery);
  }, [lotQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      loadData(searchTerm.trim());
    }
  };

  const isPassed =
    selectedReport?.status === 'PASSED' || selectedReport?.status === 'PASSED_WITH_DEVIATION';
  const isRejected = selectedReport?.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="PT. Larassanti Makmur Sejahtera"
              className="h-9 w-auto object-contain bg-white rounded-lg p-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white uppercase">
                  PT. LARASSANTI MAKMUR SEJAHTERA
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CPKB GOLONGAN A
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Portal Resmi Verifikasi Sertifikat Analisis Mutu (CoA) Digital
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="Masuk ke Sistem ERP Operasional"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Masuk Sistem ERP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col gap-6">
        {/* Verification Status Banner */}
        {selectedReport ? (
          <div
            className={`rounded-2xl border-2 p-4 sm:p-5 shadow-sm transition-all ${
              isPassed
                ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950'
                : isRejected
                ? 'bg-rose-50/90 border-rose-500 text-rose-950'
                : 'bg-amber-50/90 border-amber-500 text-amber-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-3 rounded-2xl shrink-0 shadow-sm ${
                    isPassed
                      ? 'bg-emerald-600 text-white'
                      : isRejected
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {isPassed ? (
                    <ShieldCheck className="w-7 h-7" />
                  ) : isRejected ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <Award className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black uppercase px-2 py-0.5 rounded bg-white/80 border border-black/10">
                      LOT: {normalizeLotNumber(selectedReport.lotInternalNumber || selectedReport.grnNumber)}
                    </span>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isPassed
                          ? 'bg-emerald-200 text-emerald-950 border border-emerald-400'
                          : isRejected
                          ? 'bg-rose-200 text-rose-950 border border-rose-400'
                          : 'bg-amber-200 text-amber-950 border border-amber-400'
                      }`}
                    >
                      {isPassed
                        ? 'STATUS: DILULUSKAN / RELEASE (MEMENUHI SYARAT)'
                        : isRejected
                        ? 'STATUS: DITOLAK (REJECTED)'
                        : 'STATUS: DALAM PENGUJIAN KARANTINA'}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1 uppercase">
                    {selectedReport.materialName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Dokumen ini terdaftar secara resmi pada pangkalan data pengawasan mutu PT. Larassanti Makmur Sejahtera.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Buka Dokumen Cetak A4 / PDF</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center gap-4 my-8">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <div>
              <h3 className="font-bold text-slate-800 text-base">Memverifikasi Data CoA...</h3>
              <p className="text-xs text-slate-500 mt-1">
                Menghubungkan langsung ke pangkalan data Supabase untuk validasi nomor lot #{lotQuery}
              </p>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {!isLoading && !selectedReport && (
          <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center gap-4 my-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
              <Search className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-slate-900">
                Sertifikat Analisis Belum Ditemukan
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Nomor lot atau kode identitas <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-bold">{searchTerm || lotQuery}</code> tidak ditemukan dalam arsip pengujian, atau data sedang dalam proses sinkronisasi laboratorium.
              </p>
            </div>

            {/* Quick Search Box */}
            <form onSubmit={handleSearchSubmit} className="w-full max-w-md flex items-center gap-2 mt-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Masukkan Nomor Lot (contoh: LBB2610001)..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Cari
              </button>
            </form>

            <button
              onClick={() => loadData()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mt-2 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" /> Muat Ulang Data
            </button>
          </div>
        )}

        {/* Report Overview Sheet */}
        {selectedReport && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            {/* Sheet Title Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="font-bold text-sm uppercase tracking-wide">
                    {selectedReport.materialType === 'raw'
                      ? 'Laporan Pemeriksaan Bahan Baku (Internal CoA)'
                      : 'Laporan Pemeriksaan Bahan Kemas (Packaging CoA)'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Standar Dokumentasi CPKB • Formulir No. {selectedReport.materialType === 'raw' ? 'L-DQC-006-01' : 'L-DQC-007-01'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
                  {selectedReport.reportNumber || selectedReport.lotInternalNumber || selectedReport.grnNumber}
                </span>
              </div>
            </div>

            {/* Quick Metadata Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-b border-slate-100 bg-slate-50/50 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Nama Bahan / Material:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedReport.materialName}</span>
                <span className="font-mono text-[11px] text-slate-500 block">Kode: {selectedReport.materialCode}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">No. Batch / Lot Vendor:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReport.batchNumber || '-'}</span>
                <span className="text-slate-500 text-[11px] block">No. GRN: {selectedReport.grnNumber}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Tanggal Kedaluwarsa:</span>
                <span className="font-bold text-slate-900">{selectedReport.expiryDate || 'Non-Exp (Kemasan)'}</span>
                <span className="text-slate-500 text-[11px] block">
                  Otorisasi QC: {selectedReport.updatedAt ? selectedReport.updatedAt.slice(0, 10) : '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Kuantitas Masuk:</span>
                <span className="font-mono font-bold text-slate-900">
                  {Number(selectedReport.quantityReceived || 0).toLocaleString('id-ID')} {selectedReport.unit}
                </span>
                <span className="text-slate-500 text-[11px] block">
                  {selectedReport.containerCount} Wadah ({selectedReport.containerType})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Kondisi Penyimpanan:</span>
                <span className="font-medium text-slate-800">
                  {selectedReport.storageConditions || 'Suhu Ruang Terkendali (15-25°C)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Disposisi Mutu:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedReport.status === 'PASSED'
                    ? 'LULUS (RELEASE)'
                    : selectedReport.status === 'PASSED_WITH_DEVIATION'
                    ? 'DILULUSKAN DENGAN DEVIASI'
                    : 'DITOLAK'}
                </span>
              </div>
            </div>

            {/* Test Parameters Table */}
            <div className="p-6">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                <span>Hasil Pengujian Laboratorium Kontrol Mutu ({selectedReport.parameters?.length || 0} Parameter):</span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="py-2.5 px-3 w-12 text-center">No</th>
                      <th className="py-2.5 px-3">Parameter Uji</th>
                      <th className="py-2.5 px-3">Metode / Acuan</th>
                      <th className="py-2.5 px-3">Spesifikasi CPKB</th>
                      <th className="py-2.5 px-3">Hasil Pengujian</th>
                      <th className="py-2.5 px-3 w-24 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedReport.parameters || []).map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{p.parameterName}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          {p.testMethod || 'Farmakope / Organoleptis'}
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">
                          {p.standardSpecification || '-'}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 text-[11px]">
                          {p.actualResult || '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              p.isPassed !== false
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {p.isPassed !== false ? 'MS' : 'TMS'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Electronic Signatures Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Diperiksa & Diuji Oleh:
                </span>
                <div className="font-bold text-slate-900">
                  {selectedReport.staffSignature?.signerName || 'Analis Laboratorium QC'}
                </div>
                <div className="text-[10px] text-slate-500">
                  Tanggal:{' '}
                  {selectedReport.staffSignature?.signedAt
                    ? selectedReport.staffSignature.signedAt.slice(0, 10)
                    : selectedReport.updatedAt?.slice(0, 10) || '-'}
                </div>
                <span className="inline-block px-2 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200 mt-1">
                  ✓ Paraf Analis Terverifikasi
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Disetujui & Diotorisasi Oleh:
                </span>
                <div className="font-bold text-slate-900">
                  {selectedReport.qmSignature?.signerName || 'Quality Manager (Michael)'}
                </div>
                <div className="text-[10px] text-slate-500">
                  NIK: {selectedReport.qmSignature?.signerNik || 'LMS20003'} • Disposisi: RELEASE
                </div>
                <span className="inline-block px-2 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200 mt-1">
                  ✓ Otorisasi Elektronik CPKB Sah
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Official CoA PDF Modal */}
      {selectedReport && showPdfModal && (
        <QcInspectionReportPdfModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          report={selectedReport}
        />
      )}
    </div>
  );
};
