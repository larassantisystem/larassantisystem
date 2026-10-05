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
  Building2,
  FileText,
  Boxes,
  Tag,
} from 'lucide-react';
import { QcInspectionReport } from '../types/qcTypes';
import { QrCodeBadge } from '../../../components/QrCodeBadge';
import { getQrTargetUrl } from '../../../core/utils/qrUrlHelper';
import { normalizeLotNumber } from '../utils/qcNumbering';

interface QcStatusLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: QcInspectionReport | null;
  onViewCoa?: (report: QcInspectionReport) => void;
}

export const QcStatusLabelModal: React.FC<QcStatusLabelModalProps> = ({
  isOpen,
  onClose,
  report,
  onViewCoa,
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

  // Dynamic Theme Config based on QC Status & Thermal Roll Color
  const isReleasedState = isPassed || isDeviation;
  const theme = isReleasedState
    ? {
        paperColor: 'HIJAU (Green Paper)',
        paperBadge: 'bg-emerald-100 border-emerald-400 text-emerald-950',
        paperDot: 'bg-emerald-500 border-emerald-700',
        screenBg: 'bg-[#BBF7D0]',
        bgBanner: 'bg-emerald-600',
        btnBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
        iconSymbol: '✔',
        title: isDeviation ? 'STATUS: DILULUSKAN BER-DEVIASI' : 'STATUS: DILULUSKAN (RELEASED)',
        subtitle: isDeviation ? '* DILULUSKAN DENGAN DEVIASI RESMI QM *' : '* MEMENUHI SPESIFIKASI MUTU CPKB *',
        formCode: 'L-DQC-001-01',
      }
    : {
        paperColor: 'MERAH (Red Paper)',
        paperBadge: 'bg-rose-100 border-rose-400 text-rose-950',
        paperDot: 'bg-rose-500 border-rose-700',
        screenBg: 'bg-[#FECDD3]',
        bgBanner: 'bg-rose-600',
        btnBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
        iconSymbol: '✖',
        title: 'STATUS: DITOLAK (REJECTED)',
        subtitle: '* TIDAK MEMENUHI MUTU - RETUR/MUSNAH *',
        formCode: 'L-DQC-003-01',
      };

  const handlePrint = () => {
    const styleEl = document.createElement('style');
    styleEl.id = 'thermal-label-print-style';
    styleEl.innerHTML = `
      @page {
        size: 100mm 100mm;
        margin: 0mm !important;
      }
      @media print {
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          width: 100mm !important;
          height: auto !important;
          min-height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          overflow: visible !important;
        }
        body * {
          visibility: hidden !important;
        }
        #qc-status-label-printable,
        #qc-status-label-printable * {
          visibility: visible !important;
        }
        #qc-status-label-printable {
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          overflow: visible !important;
        }
        .print-page-wrapper {
          display: block !important;
          width: 100mm !important;
          height: 100mm !important;
          min-width: 100mm !important;
          min-height: 100mm !important;
          max-width: 100mm !important;
          max-height: 100mm !important;
          margin: 0 !important;
          padding: 0 !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: hidden !important;
        }
        .print-page-wrapper:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        .thermal-label-page {
          width: 100mm !important;
          height: 100mm !important;
          min-width: 100mm !important;
          min-height: 100mm !important;
          max-width: 100mm !important;
          max-height: 100mm !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          margin: 0 !important;
          padding: 3mm !important;
          overflow: hidden !important;
          background-color: ${isReleasedState ? '#BBF7D0' : '#FECDD3'} !important;
          border: 1.5px solid #000000 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('thermal-label-print-style');
      if (el) el.remove();
    }, 1500);
  };

  const containerList =
    containerRange === 'all'
      ? Array.from({ length: totalContainers }, (_, i) => i + 1)
      : [selectedContainerNum];

  const authorizationDateFormatted = report.qmSignature?.signedAt
    ? new Date(report.qmSignature.signedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });

  const analystName =
    report.staffSignature?.signerName && report.staffSignature.signerName !== 'Staf Analis QC'
      ? report.staffSignature.signerName
      : report.sampledBy && report.sampledBy !== 'Staf Analis QC'
      ? report.sampledBy
      : 'Ayu';

  const qmName =
    report.qmSignature?.signerName &&
    report.qmSignature.signerName !== 'Quality Manager (Apoteker PJ)' &&
    report.qmSignature.signerName !== 'apt. Quality Manager, S.Farm.'
      ? report.qmSignature.signerName
      : 'Michael';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${theme.bgBanner} text-white flex items-center justify-center shadow-md`}>
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Cetak Label Status QC CPKB (Thermal 100×100 mm)
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${theme.paperBadge}`}>
                  {isPassed ? 'Status: RELEASE (LULUS)' : isDeviation ? 'Status: RELEASE (DEVIASI)' : 'Status: REJECT (DITOLAK)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Format presisi untuk Printer Thermal Roll Label 100×100 mm (Tinta Hitam Monokrom).
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

        {/* Paper Roll Indicator Banner */}
        <div className={`${isReleasedState ? 'bg-emerald-100 border-emerald-300 text-emerald-950' : 'bg-rose-100 border-rose-300 text-rose-950'} border-b px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0`}>
          <div className="flex items-center gap-2 font-medium">
            <span className={`w-3.5 h-3.5 rounded-full ${theme.paperDot} border inline-block shadow-xs shrink-0`} />
            <span>
              <strong>Kertas Label Thermal:</strong> Gunakan <strong>Roll {theme.paperColor}</strong> • Ukuran <strong>100 × 100 mm</strong>
            </span>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${theme.paperBadge}`}>
            Tinta Cetak: Hitam Pekat (Monochrome Thermal)
          </span>
        </div>

        {/* Toolbar & Options */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Mode Wadah:</span>
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
              <span>Cetak Thermal ({containerList.length} Label 100×100)</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Label Preview */}
        <div className="p-6 overflow-y-auto bg-slate-200/70 space-y-6 flex-1 flex flex-col items-center">
          <div className="text-xs text-slate-600 font-medium">
            Pratinjau fisik label stiker roll {isReleasedState ? 'hijau' : 'merah'} (Skala 100mm × 100mm):
          </div>

          <div id="qc-status-label-printable" className="space-y-6 w-full flex flex-col items-center">
            {containerList.map((containerIndex) => {
              const isSampled = report.sampledContainers && report.sampledContainers.includes(containerIndex);
              const lotDisplay = normalizeLotNumber(report.lotInternalNumber || report.grnNumber);

              return (
                <div key={containerIndex} className="print-page-wrapper">
                  <div
                    className={`thermal-label-page w-[100mm] h-[100mm] min-w-[100mm] min-h-[100mm] max-w-[100mm] max-h-[100mm] ${theme.screenBg} text-black border-2 border-black rounded-lg p-[3mm] shadow-lg flex flex-col justify-between overflow-hidden select-none print:shadow-none print:rounded-none print:border print:border-black print:bg-transparent`}
                    style={{ boxSizing: 'border-box' }}
                  >
                  {/* 1. Header CPKB (Perusahaan & Kode Form) */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-1">
                    <div className="flex items-center gap-2">
                      <img
                        src="/logo.png"
                        alt="Logo PT. Larassanti Makmur Sejahtera"
                        className="h-7 w-auto max-w-[42px] object-contain filter brightness-0 shrink-0 select-none print:brightness-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h1 className="font-black text-[11px] tracking-tight uppercase leading-none text-black">
                          PT. LARASSANTI MAKMUR SEJAHTERA
                        </h1>
                        <p className="text-[8px] font-bold tracking-wider uppercase text-black/85 mt-0.5 leading-tight">
                          SISTEM PENANDAAN STATUS MUTU BAHAN (CPKB)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[8.5px] font-bold border border-black px-1.5 py-0.5 rounded-xs">
                        {theme.formCode}
                      </span>
                    </div>
                  </div>

                  {/* 2. Status Banner (Inverted High-Contrast Black Bar) */}
                  <div className="bg-black text-white px-2.5 py-1 rounded-xs flex items-center justify-between my-1">
                    <span className="font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                      <span>{theme.iconSymbol}</span>
                      <span>{theme.title}</span>
                    </span>
                    <span className="text-[7.5px] font-bold tracking-normal italic">
                      {theme.subtitle}
                    </span>
                  </div>

                  {/* 3. Material Identity Box */}
                  <div className="border border-black/40 rounded-xs p-1.5 bg-white/30">
                    <div className="font-black text-[12px] leading-tight uppercase text-black line-clamp-1">
                      {report.materialName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-black/90 mt-1">
                      <span className="font-mono bg-black text-white px-1.5 py-0.2 rounded-xs">
                        {report.materialCode}
                      </span>
                      <span className="border border-black/60 px-1 py-0.2 rounded-xs">
                        {report.materialType === 'raw' ? 'Bahan Baku' : 'Bahan Kemas'}
                      </span>
                      <span className="truncate max-w-[140px] text-black/80">
                        Produsen: {report.manufacturer}
                      </span>
                    </div>
                  </div>

                  {/* 4. Middle Section: Specs Grid (Left) + Large QR Code (Right) */}
                  <div className="flex items-stretch gap-2 my-1 flex-1 min-h-0">
                    {/* Left Column: Data Grid */}
                    <div className="flex-1 flex flex-col justify-between text-[8px]">
                      <div className="space-y-1">
                        <div className="flex justify-between border-b border-black/20 pb-0.5">
                          <span className="font-bold text-black/70">No. Lot Internal:</span>
                          <span className="font-mono font-black text-[9.5px] text-black">{lotDisplay}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/20 pb-0.5">
                          <span className="font-bold text-black/70">No. GRN Gudang:</span>
                          <span className="font-mono font-bold text-black">{report.grnNumber}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/20 pb-0.5">
                          <span className="font-bold text-black/70">Tgl Otorisasi QC:</span>
                          <span className="font-bold text-black">{authorizationDateFormatted}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/20 pb-0.5">
                          <span className="font-bold text-black/70">Batch Produsen:</span>
                          <span className="font-mono font-bold text-black truncate max-w-[110px]">{report.batchNumberVendor || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/20 pb-0.5">
                          <span className="font-bold text-black/70">Kedaluwarsa:</span>
                          <span className="font-bold text-black">
                            {report.expiryDate || 'Non-Exp (Bahan Kemas)'}
                            {report.retestDate ? ` (R: ${report.retestDate})` : ''}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-black/20 pb-0.5">
                          <span className="font-bold text-black/70">Total Kuantitas:</span>
                          <span className="font-mono font-black text-[9.5px] text-black">{formattedQty} {report.unit}</span>
                        </div>
                      </div>

                      <div className="text-[7.5px] text-black/80 pt-0.5">
                        <span className="font-bold">Simpan: </span>
                        <span>{report.storageConditions || '15-30°C Ruang Terkendali, Kering & Terlindung Cahaya'}</span>
                      </div>
                    </div>

                    {/* Right Column: High-Visibility Large QR Code linking to CoA */}
                    <div
                      onClick={() => onViewCoa && onViewCoa(report)}
                      className="w-[32mm] shrink-0 border-l border-black/40 pl-2 flex flex-col items-center justify-center cursor-pointer"
                      title="Pindai QR untuk membuka Dokumen CoA Resmi"
                    >
                      <div className="p-1 bg-white border border-black rounded-xs">
                        <QrCodeBadge
                          value={getQrTargetUrl(
                            lotDisplay,
                            report.status,
                            `${containerIndex}/${totalContainers}`
                          )}
                          size={92}
                          className="rounded-none"
                        />
                      </div>
                      <span className="font-mono text-[8px] font-black tracking-tight text-center mt-1 block leading-none text-black">
                        {lotDisplay}-W{containerIndex}
                      </span>
                      <span className="text-[7px] font-bold uppercase tracking-wider text-center block mt-0.5 text-black/80 leading-none">
                        SCAN ➔ BUKA COA
                      </span>
                    </div>
                  </div>

                  {/* 5. Koli / Wadah & Sampling Status Highlight Bar */}
                  <div className="bg-black text-white px-2.5 py-1 rounded-xs flex items-center justify-between mb-1">
                    <span className="font-black text-[9.5px] tracking-wider uppercase">
                      WADAH KE [ {containerIndex} ] DARI {totalContainers} WADAH
                    </span>
                    <span className="font-bold text-[8.5px] uppercase">
                      {isSampled ? '✓ CONTOH UJI DIAMBIL (QC)' : 'SEGEL FISIK UTUH'}
                    </span>
                  </div>

                  {/* 6. Footer Signatures Row */}
                  <div className="border-t-2 border-black pt-1 grid grid-cols-3 gap-1.5 text-center">
                    <div className="border border-black/60 rounded-xs py-1 px-1 bg-white/40">
                      <span className="block text-[7px] text-black/70 font-bold uppercase leading-none">
                        Analis QC
                      </span>
                      <span className="font-serif italic font-bold text-[9px] truncate block leading-tight text-black mt-1">
                        {analystName}
                      </span>
                      <span className="block text-[6.5px] text-black/60 border-t border-black/20 pt-0.5 mt-0.5">
                        Paraf & Tanggal Uji
                      </span>
                    </div>

                    <div className="border border-black/60 rounded-xs py-1 px-1 bg-white/40">
                      <span className="block text-[7px] text-black/70 font-bold uppercase leading-none">
                        Quality Manager
                      </span>
                      <span className="font-serif italic font-bold text-[9px] truncate block leading-tight text-black mt-1">
                        {qmName}
                      </span>
                      <span className="block text-[6.5px] text-black/60 border-t border-black/20 pt-0.5 mt-0.5">
                        Tanda Tangan & Cap Otorisasi
                      </span>
                    </div>

                    <div className="border border-black/60 rounded-xs py-1 px-1 bg-white/40 flex flex-col justify-between">
                      <span className="block text-[7px] text-black/70 font-bold uppercase leading-none">
                        Status Mutu CPKB
                      </span>
                      <span className="font-bold text-[8px] truncate block leading-tight text-black mt-1">
                        {isPassed ? 'Sesuai Spesifikasi' : isDeviation ? 'Lulus Deviasi' : 'Ditolak (Reject)'}
                      </span>
                      <span className="block text-[6.5px] text-black/60 border-t border-black/20 pt-0.5 mt-0.5">
                        Simpan: 15-30°C
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <p className="text-xs text-slate-500">
            *Tempelkan stiker {isReleasedState ? 'hijau' : 'merah'} 100×100 mm ini menimpa/di samping label karantina setelah otorisasi mutu CPKB.
          </p>

          <div className="flex items-center gap-2.5">
            {onViewCoa && (
              <button
                onClick={() => onViewCoa(report)}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Lihat CoA Internal</span>
              </button>
            )}
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
              <span>Cetak Thermal ({containerList.length} Label 100×100)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

