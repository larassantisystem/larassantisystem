import React, { useState } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Package,
  Calendar,
  Layers,
  MapPin,
  Building2,
  FileText,
  Boxes,
  Tag,
} from 'lucide-react';
import { QcInspectionReport } from '../types/qcTypes';

interface QcStatusLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: QcInspectionReport | null;
}

export const QcStatusLabelModal: React.FC<QcStatusLabelModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [containerRange, setContainerRange] = useState<'single' | 'all'>('all');
  const [selectedContainerNum, setSelectedContainerNum] = useState<number>(1);

  if (!isOpen || !report) return null;

  const totalContainers = report.containerCount || 1;
  const formattedQty = Number(report.quantityReceived || 0).toLocaleString('id-ID', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  const isPassed = report.status === 'PASSED';
  const isDeviation = report.status === 'PASSED_WITH_DEVIATION';
  const isRejected = report.status === 'REJECTED';

  // Dynamic Theme Config based on QC Status
  const theme = isPassed
    ? {
        borderOuter: 'border-emerald-500',
        bgBanner: 'bg-emerald-500',
        textBanner: 'text-white',
        borderAccent: 'border-emerald-300',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        containerBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        btnBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
        icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
        title: 'STATUS: DILULUSKAN (RELEASE)',
        subtitle: '* TELAH DIUJI & MEMENUHI SPESIFIKASI MUTU CPKB - SIAP DIGUNAKAN *',
        formCode: 'FORM/QC/CPKB-LBL-02 (RELEASE)',
      }
    : isDeviation
    ? {
        borderOuter: 'border-teal-600',
        bgBanner: 'bg-teal-600',
        textBanner: 'text-white',
        borderAccent: 'border-teal-300',
        badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
        containerBg: 'bg-teal-50 border-teal-200 text-teal-900',
        btnBg: 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20',
        icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
        title: 'STATUS: DILULUSKAN BERSYARAT (RELEASE BY DEVIATION)',
        subtitle: '* DILULUSKAN DENGAN CATATAN DEVIASI RESMI QUALITY MANAGER *',
        formCode: 'FORM/QC/CPKB-LBL-02-DEV',
      }
    : {
        borderOuter: 'border-rose-600',
        bgBanner: 'bg-rose-600',
        textBanner: 'text-white',
        borderAccent: 'border-rose-300',
        badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
        containerBg: 'bg-rose-50 border-rose-200 text-rose-900',
        btnBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
        icon: <AlertOctagon className="w-5 h-5 shrink-0" />,
        title: 'STATUS: DITOLAK (REJECTED)',
        subtitle: '* TIDAK MEMENUHI SPESIFIKASI MUTU - DILARANG DIGUNAKAN / RETUR *',
        formCode: 'FORM/QC/CPKB-LBL-03 (REJECT)',
      };

  const handlePrint = () => {
    window.print();
  };

  const containerList =
    containerRange === 'all'
      ? Array.from({ length: totalContainers }, (_, i) => i + 1)
      : [selectedContainerNum];

  const authorizationDateFormatted = report.qmSignature?.signedAt
    ? new Date(report.qmSignature.signedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${theme.bgBanner} text-white flex items-center justify-center shadow-md`}>
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Cetak Label Status QC CPKB
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${theme.badgeBg}`}>
                  {isPassed ? 'Status: RELEASE' : isDeviation ? 'Status: RELEASE (Deviasi)' : 'Status: REJECT'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Label fisik kelulusan mutu resmi ditempelkan pada seluruh wadah bahan sebelum proses timbang/produksi.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Options */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Mode Cetak Label:</span>
            <div className="inline-flex bg-white rounded-xl border border-slate-200 p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setContainerRange('single')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  containerRange === 'single'
                    ? `${theme.bgBanner} text-white shadow-2xs`
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satu Wadah (Spesifik)
              </button>
              <button
                type="button"
                onClick={() => setContainerRange('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  containerRange === 'all'
                    ? `${theme.bgBanner} text-white shadow-2xs`
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Wadah (1 - {totalContainers})
              </button>
            </div>

            {containerRange === 'single' && totalContainers > 1 && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-500">Wadah ke:</span>
                <select
                  value={selectedContainerNum}
                  onChange={(e) => setSelectedContainerNum(Number(e.target.value))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  {Array.from({ length: totalContainers }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Wadah {num} / {totalContainers}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className={`px-4 py-2 ${theme.btnBg} text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer`}
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Label Preview */}
        <div className="p-6 overflow-y-auto bg-slate-100/70 space-y-6 flex-1">
          <div id="qc-status-label-printable" className="space-y-6">
            {containerList.map((containerIndex) => (
              <div
                key={containerIndex}
                className={`bg-white rounded-2xl border-4 ${theme.borderOuter} p-5 shadow-md max-w-xl mx-auto break-inside-avoid print:shadow-none print:max-w-none print:border-4 print:my-4 print:p-6`}
              >
                {/* Header CPKB */}
                <div className={`border-b-2 ${theme.borderAccent} pb-3 mb-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${theme.bgBanner} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs`}>
                      CPKB
                    </div>
                    <div>
                      <h1 className="font-black text-slate-900 text-sm tracking-tight leading-none">
                        PT. LARASSANTI MAKMUR SEJAHTERA
                      </h1>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                        SISTEM PENANDAAN STATUS MUTU BAHAN (CPKB)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-slate-400 block">{theme.formCode}</span>
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold mt-0.5">
                      REV. 02
                    </span>
                  </div>
                </div>

                {/* BIG STATUS BANNER */}
                <div className={`${theme.bgBanner} ${theme.textBanner} py-2.5 px-4 rounded-xl text-center font-black tracking-wider uppercase mb-4 shadow-xs`}>
                  <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
                    {theme.icon}
                    <span>{theme.title}</span>
                  </div>
                  <p className="text-[10px] font-bold tracking-normal text-white/90 mt-0.5 normal-case">
                    {theme.subtitle}
                  </p>
                </div>

                {/* Primary Data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-800">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">No. Lot Internal</span>
                    <span className="font-mono font-black text-slate-950 text-xs block mt-0.5">
                      {report.lotInternalNumber || report.grnNumber}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Tgl Otorisasi QC</span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {authorizationDateFormatted}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${theme.containerBg}`}>
                    <span className="text-[10px] font-extrabold opacity-80 uppercase block">Nomor Koli / Wadah</span>
                    <span className="font-black text-xs block mt-0.5">
                      Wadah ke <span className="underline decoration-2">{containerIndex}</span> dari {totalContainers}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                        {report.materialType === 'raw' ? 'Bahan Baku (Raw Material)' : 'Bahan Kemas (Packaging)'}
                      </span>
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {report.materialCode}
                      </span>
                    </div>
                    <span className="font-black text-slate-900 text-sm block mt-1">
                      {report.materialName}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Batch Produsen</span>
                    <span className="font-mono font-bold text-indigo-950 block mt-0.5 truncate">
                      {report.batchNumberVendor || '-'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Tgl Kedaluwarsa</span>
                    <span className={`font-bold block mt-0.5 ${report.expiryDate ? 'text-rose-700' : 'text-slate-500'}`}>
                      {report.expiryDate || 'Non-Exp (Bahan Kemas)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Kuantitas</span>
                    <span className="font-mono font-black text-slate-950 text-xs block mt-0.5">
                      {formattedQty} {report.unit}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Produsen / Pemasok</span>
                    <span className="font-medium text-slate-900 block mt-0.5 truncate text-[11px]">
                      {report.manufacturer} <span className="text-slate-400 font-normal">({report.distributor || report.supplierName})</span>
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">No. GRN Gudang</span>
                    <span className="font-mono font-bold text-slate-800 block mt-0.5 truncate text-[11px]">
                      {report.grnNumber}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Lokasi & Kondisi Simpan:</span>
                      <span className="font-bold text-slate-900">{report.storageLocation || 'Gudang Rilis CPKB'}</span>
                    </div>
                    <div className="text-slate-500">
                      Suhu: <span className="font-semibold text-slate-700">{report.storageConditions || 'Suhu Ruang (15-30°C)'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Signatures & Barcode */}
                <div className={`mt-4 pt-3 border-t-2 border-dashed ${theme.borderAccent} grid grid-cols-3 gap-3 items-end`}>
                  <div className="border border-slate-200 rounded-xl p-2 text-center bg-slate-50">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Petugas Analis QC</span>
                    <div className="h-9 flex items-center justify-center font-serif text-slate-700 font-bold italic text-xs">
                      {report.inspectedBy?.name || 'Staf Analis QC'}
                    </div>
                    <span className="text-[9px] text-slate-400 block border-t border-slate-200 pt-0.5">
                      Paraf & Tanggal Uji
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-2 text-center bg-slate-50">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Quality Manager (Otorisasi)</span>
                    <div className="h-9 flex items-center justify-center font-serif text-emerald-800 font-bold italic text-xs">
                      {report.qmSignature?.signerName || 'Quality Manager'}
                    </div>
                    <span className="text-[9px] text-slate-400 block border-t border-slate-200 pt-0.5">
                      Tanda Tangan & Cap Sah
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    {/* Simulated SVG Barcode */}
                    <div className="w-full flex items-center justify-center gap-0.5 h-7">
                      {[1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2].map((w, i) => (
                        <div
                          key={i}
                          className="bg-slate-900 h-full"
                          style={{ width: `${w * 1.5}px` }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[9px] text-slate-500 mt-1 font-bold">
                      *{report.lotInternalNumber || report.grnNumber}-W{containerIndex}*
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <p className="text-xs text-slate-400">
            *Label status mutu resmi dicetak sesuai standar CPKB dan wajib ditempelkan pada fisik kemasan.
          </p>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className={`px-5 py-2 ${theme.btnBg} text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer`}
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Label ({containerList.length} Lembar)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

