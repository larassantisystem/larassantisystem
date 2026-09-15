import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileCheck,
  QrCode,
} from 'lucide-react';
import { QcInspectionReport } from '../types/qcTypes';

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

  const docTitle =
    report.materialType === 'raw'
      ? 'LAPORAN PEMERIKSAAN BAHAN BAKU (INTERNAL COA)'
      : 'LAPORAN PEMERIKSAAN BAHAN KEMAS (PACKAGING COA)';

  const formattedQty = report.quantityReceived.toLocaleString('id-ID', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-300 flex flex-col max-h-[95vh]">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg text-teal-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                <span>Dokumen Resmi Laporan Pemeriksaan Mutu (CPKB)</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-teal-800 text-teal-200">
                  {report.lotInternalNumber || report.grnNumber}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Sertifikat Analisis & Otorisasi Mutu Rilis Pabrik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 active:scale-98 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Generate PDF / Cetak Laporan
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div className="p-6 md:p-8 overflow-y-auto grow bg-slate-100 flex justify-center">
          <div
            ref={printContentRef}
            id="printable-qc-report"
            className="bg-white p-8 md:p-10 shadow-lg rounded-xl border border-slate-200 max-w-3xl w-full text-slate-900 space-y-5 print:p-0 print:shadow-none print:border-none"
            style={{ minHeight: '1050px' }}
          >
            {/* Header Perusahaan PT. LARASSANTI MAKMUR SEJAHTERA */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-1 bg-white rounded-xl border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="Logo Larassanti"
                      className="h-14 w-auto max-w-[130px] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      PT. LARASSANTI MAKMUR SEJAHTERA
                    </h1>
                    <p className="text-xs text-slate-700 font-medium">
                      Industri Kosmetika & Personal Care • Sertifikasi CPKB Golongan A
                    </p>
                    <p className="text-[11px] text-slate-600 max-w-lg leading-tight mt-0.5">
                      Jl. Pembangunan 3 No.38 A, RT.005/RW.004, Batusari, Kec. Batuceper, Kota Tangerang, Banten 15121
                    </p>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-600 border border-slate-300 rounded-lg p-2.5 bg-slate-50 shrink-0">
                  <div className="font-mono font-bold text-slate-900">FORM-QC-LPP-01</div>
                  <div>Rev: 02 / Sept 2026</div>
                  <div className="font-semibold text-teal-800">Status: TEROTORISASI</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  {docTitle}
                </h2>
                <div className="text-xs font-mono font-bold text-teal-900 mt-0.5">
                  NO. LOT / LAPORAN: {report.lotInternalNumber || report.grnNumber}
                </div>
              </div>
            </div>

            {/* Identitas Material & Kedatangan (GRN) with Neat Alignment */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase tracking-wider border-b border-slate-300 text-slate-700">
                I. Identitas Bahan & Penerimaan (GRN)
              </div>
              <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-slate-800">
                {/* Column Left */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">Kode Material</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="font-mono font-bold text-slate-900">{report.materialCode}</span>
                  </div>
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">Nama Lengkap Bahan</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="font-bold text-slate-900">{report.materialName}</span>
                  </div>
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">Produsen Pembuat</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="font-semibold text-slate-800">{report.manufacturer}</span>
                  </div>
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">Pemasok / Distributor</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="text-slate-800">{report.distributor || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">No. Batch Produsen</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="font-mono font-bold text-slate-900">{report.batchNumberVendor}</span>
                  </div>
                </div>

                {/* Column Right */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">No. Bukti Terima (GRN)</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="font-mono font-bold text-slate-900">{report.grnNumber}</span>
                  </div>
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">Tanggal Penerimaan</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="text-slate-800">{report.receivedDate}</span>
                  </div>
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">Tanggal Kedaluwarsa (ED)</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="font-semibold text-slate-800">{report.expiryDate || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">Kuantitas Diterima</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="font-bold text-slate-900">{formattedQty} {report.unit}</span>
                  </div>
                  <div className="grid grid-cols-[140px_12px_1fr] items-baseline">
                    <span className="text-slate-500 font-medium">Jumlah Kemasan / Koli</span>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="text-slate-800">{report.containerCount} {report.containerType}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rincian Sampling */}
            <div className="border border-slate-300 rounded-lg p-3 text-xs bg-slate-50/50 space-y-1.5">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                <span className="font-bold uppercase tracking-wider text-slate-700">
                  II. Metode & Pengambilan Contoh (Sampling)
                </span>
                <span className="font-mono font-bold text-teal-800">
                  {report.samplingInfo.samplingStandard}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500 block">Rencana Sampling (n):</span>
                  <span className="font-bold text-slate-900">
                    {report.samplingInfo.sampleSizeQuantity} {report.samplingInfo.sampleUnit}
                    {report.samplingInfo.sampleSizeCodeLetter && ` (Code: ${report.samplingInfo.sampleSizeCodeLetter})`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jumlah Sampel Diuji:</span>
                  <span className="font-bold text-teal-900">
                    {report.actualSampleSize !== undefined && report.actualSampleSize !== null
                      ? `${report.actualSampleSize} ${report.actualSampleUnit || (report.materialType === 'raw' ? 'gram' : 'pcs')}`
                      : `${report.samplingInfo.sampleSizeQuantity} ${report.samplingInfo.sampleUnit}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Keterangan Pengambilan:</span>
                  <span className="text-[11px] text-slate-600">{report.samplingInfo.samplingDescription}</span>
                </div>
              </div>
            </div>

            {/* Tabel Hasil Analisa Laboratorium (Metode removed, parameter + spesifikasi + hasil) */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase tracking-wider border-b border-slate-300 text-slate-700">
                III. Hasil Pemeriksaan & Analisis Laboratorium QC
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="p-2.5 w-8 text-center border-r border-slate-200">No</th>
                    <th className="p-2.5 w-1/3 border-r border-slate-200">Parameter Uji</th>
                    <th className="p-2.5 w-1/3 border-r border-slate-200">Spesifikasi</th>
                    <th className="p-2.5 w-1/4 border-r border-slate-200">Hasil Analisa Lab</th>
                    <th className="p-2.5 w-16 text-center">Hasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {report.parameters.map((param, idx) => (
                    <tr key={param.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-center font-mono text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800 border-r border-slate-200">
                        {param.parameterName}
                      </td>
                      <td className="p-2.5 text-slate-700 border-r border-slate-200">
                        {param.specification}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                        {param.resultValue || '-'}
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            param.isCompliant
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
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

            {/* Kesimpulan & Disposisi Mutu */}
            <div
              className={`border-2 rounded-xl p-4 text-xs ${
                isRejected
                  ? 'border-red-400 bg-red-50/60'
                  : hasDeviation
                  ? 'border-amber-400 bg-amber-50/60'
                  : 'border-emerald-400 bg-emerald-50/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    IV. KESIMPULAN & DISPOSISI KELULUSAN MUTU
                  </div>
                  <div
                    className={`text-base font-black mt-1 ${
                      isRejected
                        ? 'text-red-700'
                        : hasDeviation
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                    }`}
                  >
                    STATUS DISPOSISI:{' '}
                    {isRejected
                      ? 'DITOLAK / REJECTED (TIDAK MEMENUHI SYARAT)'
                      : hasDeviation
                      ? `DILULUSKAN DENGAN DEVIASI (NO: ${report.qmDeviationNumber || '-'})`
                      : 'DILULUSKAN / RELEASE (MEMENUHI SYARAT CPKB)'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 font-semibold">TANGGAL OTORISASI</div>
                  <div className="font-bold font-mono text-slate-800">
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

            {/* Blok Dual Digital Signature (Staf Analis & Quality Manager) */}
            <div className="border border-slate-300 rounded-xl p-4 grid grid-cols-2 gap-6 text-xs text-slate-800">
              {/* Analis QC */}
              <div className="space-y-2 border-r border-slate-200 pr-4">
                <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Diperiksa & Dianalisa Oleh:
                </div>
                <div className="h-20 flex flex-col justify-center">
                  <div className="font-mono font-bold text-teal-800 text-[11px]">
                    DIGITALLY SIGNED ELECTRONICALLY
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Hash: {report.staffSignature?.signatureHash || 'SIG-STF-VERIFIED'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Waktu: {report.staffSignature?.signedAt ? new Date(report.staffSignature.signedAt).toLocaleString('id-ID') : '-'}
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900">
                    {report.staffSignature?.signerName || 'Staf Analis QC'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    NIK: {report.staffSignature?.signerNik || '-'} • QC Analyst
                  </div>
                </div>
              </div>

              {/* Quality Manager */}
              <div className="space-y-2 pl-2">
                <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Disetujui & Diotorisasi Oleh:
                </div>
                <div className="h-20 flex flex-col justify-center">
                  <div className="font-mono font-bold text-blue-900 text-[11px]">
                    OFFICIALLY AUTHORIZED BY QUALITY MANAGER
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Hash: {report.qmSignature?.signatureHash || 'SIG-QM-AUTHORIZED'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Waktu: {report.qmSignature?.signedAt ? new Date(report.qmSignature.signedAt).toLocaleString('id-ID') : '-'}
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900">
                    {report.qmSignature?.signerName || 'apt. Quality Manager, S.Farm.'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Apoteker Penanggung Jawab Mutu / QA-QC Head
                  </div>
                </div>
              </div>
            </div>

            {/* Footer QR Verification */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200">
              <div>
                Dokumen ini digenerate secara elektronik melalui Sistem Terpadu Pengawasan Mutu CPKB PT. Larassanti Makmur Sejahtera.
              </div>
              <div className="font-mono font-semibold text-slate-600 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />
                VERIFIED LOT #{report.lotInternalNumber || report.grnNumber}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
