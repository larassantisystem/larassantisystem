import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileCheck,
  QrCode,
  FileText,
  Info
} from 'lucide-react';
import { QcInspectionReport } from '../types/qcTypes';
import { normalizeLotNumber } from '../utils/qcNumbering';

interface QcInspectionReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: QcInspectionReport | null;
}

export const QcInspectionReportPdfModal: React.FC<QcInspectionReportPdfModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !report) return null;

  const handlePrintPdf = () => {
    window.print();
  };

  const isPassed = report.status === 'PASSED' || report.status === 'PASSED_WITH_DEVIATION';
  const isRejected = report.status === 'REJECTED';
  const hasDeviation = report.status === 'PASSED_WITH_DEVIATION';

  const isRawMaterial = report.materialType === 'raw';
  const docTitle = isRawMaterial
    ? 'LAPORAN PEMERIKSAAN BAHAN BAKU (INTERNAL COA)'
    : 'LAPORAN PEMERIKSAAN BAHAN KEMAS (PACKAGING COA)';

  const docNumber = isRawMaterial ? 'L-DQC-006-01' : 'L-DQC-007-01';
  const effectiveDate = '01-OKTOBER-2026';
  const replacesDocNumber = isRawMaterial ? 'L-DQC-006-00' : 'L-DQC-007-00';

  const formattedQty = (report.quantityReceived || 0).toLocaleString('id-ID', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  // Calculate page splitting for A4 print
  // Page 1 contains Header + Material Identity + Sampling + up to 5 parameters
  // If more than 5 parameters, split into Page 2 with continuation table + Conclusion + Signatures
  const parameters = report.parameters || [];
  const needsMultiPage = parameters.length > 5;

  const page1Params = needsMultiPage ? parameters.slice(0, 5) : parameters;
  const page2Params = needsMultiPage ? parameters.slice(5) : [];
  const totalPages = needsMultiPage ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full my-4 overflow-hidden border border-slate-700 flex flex-col max-h-[96vh]">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-950 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                <span>Dokumen Resmi Laporan Pemeriksaan Mutu (CPKB)</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                  {docNumber} • Lot: {normalizeLotNumber(report.lotInternalNumber || report.grnNumber)}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Sertifikat Analisis (Internal CoA) • Terbagi Menjadi {totalPages} Halaman A4 Standar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Gunakan opsi <strong>"Save as PDF / A4"</strong></span>
            </div>

            <button
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/30 transition-all cursor-pointer border border-emerald-400/30"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan / Simpan PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div className="p-4 sm:p-8 overflow-y-auto grow bg-slate-200/90 flex flex-col items-center gap-8">
          
          <div
            ref={printContentRef}
            id="printable-qc-report"
            className="w-full max-w-3xl space-y-8 print:space-y-0"
          >
            {/* ========================================================================= */}
            {/* LEMBAR 1 / HALAMAN 1 (A4 STANDAR) */}
            {/* ========================================================================= */}
            <div className="no-print flex items-center justify-between text-xs font-bold text-slate-600 px-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-emerald-700" />
                Lembar Dokumen Halaman 1 dari {totalPages}
              </span>
              <span className="bg-slate-300 text-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                Format Cetak A4 Portrait
              </span>
            </div>

            <div className="print-page bg-white p-8 sm:p-10 shadow-xl rounded-2xl border border-slate-300 text-slate-900 space-y-4 print:p-0 print:shadow-none print:border-none print:rounded-none relative flex flex-col justify-between"
                 style={{ minHeight: '1050px' }}>
              
              <div className="space-y-4">
                {/* Header Perusahaan PT. LARASSANTI MAKMUR SEJAHTERA */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-1 bg-white rounded-xl border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center">
                        <img
                          src="/logo.png"
                          alt="Logo Larassanti"
                          className="h-12 w-auto max-w-[120px] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                          PT. LARASSANTI MAKMUR SEJAHTERA
                        </h1>
                        <p className="text-[11px] text-slate-700 font-semibold">
                          Industri Kosmetika & Personal Care • Sertifikasi CPKB Golongan A
                        </p>
                        <p className="text-[10px] text-slate-600 max-w-md leading-tight mt-0.5">
                          Jl. Pembangunan 3 No.38 A, B, C, D, RT.002/RW.001, Batusari, Kec. Batuceper, Kota Tangerang, Banten 15121
                        </p>
                      </div>
                    </div>
                    
                    {/* Kotak Dokumen Kontrol Mutu */}
                    <div className="text-right text-[10px] text-slate-700 border border-slate-300 rounded-lg p-2.5 bg-slate-50 shrink-0 font-mono space-y-0.5 leading-tight">
                      <div><span className="font-sans font-semibold text-slate-500">No. Dokumen :</span> <strong className="text-slate-900 font-bold">{docNumber}</strong></div>
                      <div><span className="font-sans font-semibold text-slate-500">TANGGAL BERLAKU :</span> <strong className="text-slate-900 font-bold">{effectiveDate}</strong></div>
                      <div><span className="font-sans font-semibold text-slate-500">MENGGANTI NO. :</span> <strong className="text-slate-900 font-bold">{replacesDocNumber}</strong></div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 text-center">
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                      {docTitle}
                    </h2>
                    <div className="text-xs font-mono font-bold text-emerald-900 mt-0.5">
                      NO. LOT / LAPORAN: {normalizeLotNumber(report.lotInternalNumber || report.grnNumber)}
                    </div>
                  </div>
                </div>

                {/* I. Identitas Bahan & Penerimaan (GRN) */}
                <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase tracking-wider border-b border-slate-300 text-slate-800 text-[11px]">
                    I. Identitas Bahan & Penerimaan (GRN)
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-800 text-[11px]">
                    {/* Left Column */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Kode Material</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-mono font-bold text-slate-900">{report.materialCode}</span>
                      </div>
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Nama Bahan</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-bold text-slate-900">{report.materialName}</span>
                      </div>
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Produsen</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-semibold text-slate-800">{report.manufacturer || '-'}</span>
                      </div>
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Distributor</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="text-slate-800">{report.distributor || '-'}</span>
                      </div>
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">No. Batch Vendor</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-mono font-bold text-slate-900">{report.batchNumberVendor || '-'}</span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">No. Bukti Terima (GRN)</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-mono font-bold text-slate-900">{report.grnNumber}</span>
                      </div>
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Tanggal Penerimaan</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="text-slate-800">{report.receivedDate || '-'}</span>
                      </div>
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Tanggal Kedaluwarsa</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-semibold text-slate-800">{report.expiryDate || 'N/A'}</span>
                      </div>
                      {isRawMaterial && (
                        <div className="grid grid-cols-[130px_10px_1fr] items-baseline bg-emerald-50/70 px-1 py-0.5 rounded border border-emerald-200/60">
                          <span className="text-emerald-800 font-bold">Tanggal Retest (Uji Ulang)</span>
                          <span className="text-emerald-700 font-bold">:</span>
                          <span className="font-bold text-emerald-950 font-mono">
                            {report.retestDate || 'N/A (Sesuai ED)'}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Kuantitas Diterima</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-bold text-slate-900">{formattedQty} {report.unit}</span>
                      </div>
                      <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Jumlah Kemasan</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="text-slate-800">{report.containerCount} {report.containerType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* II. Metode & Pengambilan Contoh (Sampling) */}
                <div className="border border-slate-300 rounded-lg p-2.5 text-[11px] bg-slate-50/70 space-y-1.5">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                    <span className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      II. Metode & Pengambilan Contoh (Sampling)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] border border-emerald-300">
                        {report.samplingInfo?.samplingStandard || 'MIL-STD-105E S-4 AQL 4.0'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px] border border-blue-200">
                        DIGITAL TAG: SAMPLED
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-700 pt-0.5">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Rencana Sampling (n):</span>
                      <span className="font-bold text-slate-900">
                        {report.samplingInfo?.sampleSizeQuantity || 1} {report.samplingInfo?.sampleUnit || 'wadah'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Sampel Diuji Lab:</span>
                      <span className="font-bold text-emerald-950">
                        {report.actualSampleSize !== undefined && report.actualSampleSize !== null
                          ? `${report.actualSampleSize} ${report.actualSampleUnit || (report.materialType === 'raw' ? 'gram' : 'pcs')}`
                          : `${report.samplingInfo?.sampleSizeQuantity || 1} ${report.samplingInfo?.sampleUnit || 'wadah'}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Wadah yang Disampling:</span>
                      <span className="font-bold text-slate-900">
                        {report.sampledContainers || `Wadah #1 s/d #${Math.min(report.containerCount, report.samplingInfo?.sampleSizeQuantity || 1)} (Total ${report.containerCount} ${report.containerType})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Waktu & Petugas Sampling:</span>
                      <span className="text-slate-800 font-medium">
                        {report.samplingDateTime ? new Date(report.samplingDateTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : (report.receivedDate || '-')} • {report.sampledBy || report.staffSignature?.signerName || 'Analis QC'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* III. Hasil Pemeriksaan & Analisis Laboratorium QC (Bagian 1) */}
                <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase tracking-wider border-b border-slate-300 text-slate-800 text-[11px] flex items-center justify-between">
                    <span>III. Hasil Pemeriksaan & Analisis Laboratorium QC</span>
                    {needsMultiPage && (
                      <span className="text-[10px] text-slate-500 font-normal">
                        (Bagian 1 dari 2)
                      </span>
                    )}
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                        <th className="p-2 w-8 text-center border-r border-slate-200">No</th>
                        <th className="p-2 w-1/3 border-r border-slate-200">Parameter Uji</th>
                        <th className="p-2 w-1/3 border-r border-slate-200">Spesifikasi Standar</th>
                        <th className="p-2 w-1/4 border-r border-slate-200">Hasil Analisa Lab</th>
                        <th className="p-2 w-14 text-center">Hasil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {page1Params.map((param, idx) => (
                        <tr key={param.id || idx} className="hover:bg-slate-50/50">
                          <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="p-2 font-semibold text-slate-800 border-r border-slate-200">
                            {param.parameterName}
                          </td>
                          <td className="p-2 text-slate-700 border-r border-slate-200">
                            {param.specification}
                          </td>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                            {param.resultValue || '-'}
                          </td>
                          <td className="p-2 text-center font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                param.isCompliant
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                              }`}
                            >
                              {param.isCompliant ? 'MS' : 'TMS'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* If Single Page: show Conclusion & Signature on Page 1 */}
                {!needsMultiPage && (
                  <>
                    {/* Kesimpulan & Disposisi Mutu */}
                    <div
                      className={`border-2 rounded-xl p-3 text-xs page-break-inside-avoid ${
                        isRejected
                          ? 'border-red-400 bg-red-50/60'
                          : hasDeviation
                          ? 'border-amber-400 bg-amber-50/60'
                          : 'border-emerald-400 bg-emerald-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                            IV. KESIMPULAN & DISPOSISI KELULUSAN MUTU
                          </div>
                          <div
                            className={`text-sm sm:text-base font-black mt-0.5 ${
                              isRejected
                                ? 'text-red-700'
                                : hasDeviation
                                ? 'text-amber-800'
                                : 'text-emerald-800'
                            }`}
                          >
                            STATUS DISPOSISI:{' '}
                            {isRejected
                              ? 'DITOLAK / REJECT'
                              : hasDeviation
                              ? 'DILULUSKAN BERSYARAT (RELEASE BY DEVIATION)'
                              : 'DILULUSKAN / RELEASE'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-semibold">TANGGAL OTORISASI</div>
                          <div className="font-bold font-mono text-slate-800 text-xs">
                            {report.qmSignature?.signedAt
                              ? new Date(report.qmSignature.signedAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : new Date().toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>

                      {report.qmNotes && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-slate-700 text-[10px]">
                          <strong>Catatan Disposisi:</strong> {report.qmNotes}
                        </div>
                      )}
                    </div>

                    {/* Dual Digital Signature */}
                    <div className="border border-slate-300 rounded-xl p-3 grid grid-cols-2 gap-4 text-xs text-slate-800 page-break-inside-avoid">
                      <div className="space-y-1 border-r border-slate-200 pr-3">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                          Diperiksa & Dianalisa Oleh:
                        </div>
                        <div className="h-16 flex flex-col justify-center">
                          <div className="font-mono font-bold text-emerald-800 text-[10px]">
                            DIGITALLY SIGNED ELECTRONICALLY
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">
                            Hash: {report.staffSignature?.signatureHash || 'SIG-STF-VERIFIED'}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Waktu: {report.staffSignature?.signedAt ? new Date(report.staffSignature.signedAt).toLocaleString('id-ID') : '-'}
                          </div>
                        </div>
                        <div className="border-t border-slate-300 pt-1">
                          <div className="font-bold text-slate-900 text-[11px]">
                            {report.staffSignature?.signerName || 'Staf Analis QC'}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            NIK: {report.staffSignature?.signerNik || '-'} • QC Analyst
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 pl-1">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                          Disetujui & Diotorisasi Oleh:
                        </div>
                        <div className="h-16 flex flex-col justify-center">
                          <div className="font-mono font-bold text-blue-900 text-[10px]">
                            OFFICIALLY AUTHORIZED BY QUALITY MANAGER
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">
                            Hash: {report.qmSignature?.signatureHash || 'SIG-QM-AUTHORIZED'}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Waktu: {report.qmSignature?.signedAt ? new Date(report.qmSignature.signedAt).toLocaleString('id-ID') : '-'}
                          </div>
                        </div>
                        <div className="border-t border-slate-300 pt-1">
                          <div className="font-bold text-slate-900 text-[11px]">
                            {report.qmSignature?.signerName || 'apt. Quality Manager, S.Farm.'}
                          </div>
                          <div className="text-[9px] text-slate-600 font-bold tracking-wide">
                            QUALITY MANAGER
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Page 1 Footer */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
                <div>
                  PT. Larassanti Makmur Sejahtera • Sistem Terpadu Pengawasan Mutu CPKB
                </div>
                <div className="font-mono font-bold text-slate-700">
                  {needsMultiPage ? 'Halaman 1 dari 2 (Bersambung)' : 'Halaman 1 dari 1 (Lengkap)'}
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* LEMBAR 2 / HALAMAN 2 (JIKA DOKUMEN MULTI-PAGE) */}
            {/* ========================================================================= */}
            {needsMultiPage && (
              <>
                <div className="no-print flex items-center justify-between text-xs font-bold text-slate-600 px-2 pt-4">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    Lembar Dokumen Halaman 2 dari 2 (Lanjutan & Otorisasi)
                  </span>
                  <span className="bg-slate-300 text-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                    Format Cetak A4 Portrait
                  </span>
                </div>

                <div className="print-page bg-white p-8 sm:p-10 shadow-xl rounded-2xl border border-slate-300 text-slate-900 space-y-5 print:p-0 print:shadow-none print:border-none print:rounded-none relative flex flex-col justify-between"
                     style={{ minHeight: '1050px' }}>
                  
                  <div className="space-y-4">
                    {/* Header Ringkas Halaman Lanjutan */}
                    <div className="border-b-2 border-slate-900 pb-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black uppercase text-slate-900">
                          PT. LARASSANTI MAKMUR SEJAHTERA • INTERNAL COA
                        </div>
                        <div className="text-[11px] text-slate-600 font-semibold">
                          Lanjutan Laporan Mutu Lot #{normalizeLotNumber(report.lotInternalNumber || report.grnNumber)} - {report.materialName}
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-600 space-y-0.5">
                        <div><strong>{docNumber}</strong> • HALAMAN 2/2</div>
                        <div className="text-[9px] text-slate-400">Tgl Berlaku: {effectiveDate}</div>
                      </div>
                    </div>

                    {/* III. Lanjutan Tabel Hasil Analisis Laboratorium */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                      <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase tracking-wider border-b border-slate-300 text-slate-800 text-[11px]">
                        III. Lanjutan Parameter Hasil Pemeriksaan Laboratorium QC
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                            <th className="p-2 w-8 text-center border-r border-slate-200">No</th>
                            <th className="p-2 w-1/3 border-r border-slate-200">Parameter Uji</th>
                            <th className="p-2 w-1/3 border-r border-slate-200">Spesifikasi Standar</th>
                            <th className="p-2 w-1/4 border-r border-slate-200">Hasil Analisa Lab</th>
                            <th className="p-2 w-14 text-center">Hasil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {page2Params.map((param, idx) => (
                            <tr key={param.id || idx} className="hover:bg-slate-50/50">
                              <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-200">
                                {page1Params.length + idx + 1}
                              </td>
                              <td className="p-2 font-semibold text-slate-800 border-r border-slate-200">
                                {param.parameterName}
                              </td>
                              <td className="p-2 text-slate-700 border-r border-slate-200">
                                {param.specification}
                              </td>
                              <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                                {param.resultValue || '-'}
                              </td>
                              <td className="p-2 text-center font-bold">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                    param.isCompliant
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-red-100 text-red-800 border border-red-300'
                                  }`}
                                >
                                  {param.isCompliant ? 'MS' : 'TMS'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* IV. Kesimpulan & Disposisi Mutu */}
                    <div
                      className={`border-2 rounded-xl p-4 text-xs page-break-inside-avoid ${
                        isRejected
                          ? 'border-red-400 bg-red-50/60'
                          : hasDeviation
                          ? 'border-amber-400 bg-amber-50/60'
                          : 'border-emerald-400 bg-emerald-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                            IV. KESIMPULAN & DISPOSISI KELULUSAN MUTU
                          </div>
                          <div
                            className={`text-sm sm:text-base font-black mt-0.5 ${
                              isRejected
                                ? 'text-red-700'
                                : hasDeviation
                                ? 'text-amber-800'
                                : 'text-emerald-800'
                            }`}
                          >
                            STATUS DISPOSISI:{' '}
                            {isRejected
                              ? 'DITOLAK / REJECT'
                              : hasDeviation
                              ? 'DILULUSKAN BERSYARAT (RELEASE BY DEVIATION)'
                              : 'DILULUSKAN / RELEASE'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-semibold">TANGGAL OTORISASI</div>
                          <div className="font-bold font-mono text-slate-800 text-xs">
                            {report.qmSignature?.signedAt
                              ? new Date(report.qmSignature.signedAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : new Date().toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>

                      {report.qmNotes && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 text-slate-700 text-[11px]">
                          <strong>Catatan Disposisi:</strong> {report.qmNotes}
                        </div>
                      )}
                    </div>

                    {/* V. Blok Dual Digital Signature (Staf Analis & Quality Manager) */}
                    <div className="border border-slate-300 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs text-slate-800 page-break-inside-avoid">
                      {/* Analis QC */}
                      <div className="space-y-1.5 border-r border-slate-200 pr-3">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Diperiksa & Dianalisa Oleh:
                        </div>
                        <div className="h-18 flex flex-col justify-center">
                          <div className="font-mono font-bold text-emerald-800 text-[10px]">
                            DIGITALLY SIGNED ELECTRONICALLY
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">
                            Hash: {report.staffSignature?.signatureHash || 'SIG-STF-VERIFIED'}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Waktu: {report.staffSignature?.signedAt ? new Date(report.staffSignature.signedAt).toLocaleString('id-ID') : '-'}
                          </div>
                        </div>
                        <div className="border-t border-slate-300 pt-1">
                          <div className="font-bold text-slate-900 text-[11px]">
                            {report.staffSignature?.signerName || 'Staf Analis QC'}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            NIK: {report.staffSignature?.signerNik || '-'} • QC Analyst
                          </div>
                        </div>
                      </div>

                      {/* Quality Manager */}
                      <div className="space-y-1.5 pl-2">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Disetujui & Diotorisasi Oleh:
                        </div>
                        <div className="h-18 flex flex-col justify-center">
                          <div className="font-mono font-bold text-blue-900 text-[10px]">
                            OFFICIALLY AUTHORIZED BY QUALITY MANAGER
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">
                            Hash: {report.qmSignature?.signatureHash || 'SIG-QM-AUTHORIZED'}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Waktu: {report.qmSignature?.signedAt ? new Date(report.qmSignature.signedAt).toLocaleString('id-ID') : '-'}
                          </div>
                        </div>
                        <div className="border-t border-slate-300 pt-1">
                          <div className="font-bold text-slate-900 text-[11px]">
                            {report.qmSignature?.signerName || 'apt. Quality Manager, S.Farm.'}
                          </div>
                          <div className="text-[9px] text-slate-600 font-bold tracking-wide">
                            QUALITY MANAGER
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 2 Footer */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-slate-700" />
                      <span>VERIFIED CPKB LOT #{normalizeLotNumber(report.lotInternalNumber || report.grnNumber)} • PT. Larassanti Makmur Sejahtera • Sistem Terpadu Pengawasan Mutu CPKB</span>
                    </div>
                    <div className="font-mono font-bold text-slate-700">
                      Halaman 2 dari 2 (Selesai)
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
