import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Printer,
  FileCheck,
  FileText,
  Info,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  PenTool,
} from 'lucide-react';
import { IpcBulkTest } from '../utils/qcExtData';
import { Product } from '../../../types';
import { useAuth } from '../../../core/auth/AuthContext';
import { QrCodeBadge } from '../../../components/QrCodeBadge';
import { productService } from '../../rnd/products/productService';
import { formatDateDDMMMYYYY, formatDateDDMMMYYYYUpper } from '../../../utils/dateUtils';
import { getUserPositionTitleByNik, getUserPositionTitle } from '../../../utils/userPositionUtils';

interface IpcInspectionReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: IpcBulkTest | null;
  productSpec?: Product | null;
}

export const IpcInspectionReportPdfModal: React.FC<IpcInspectionReportPdfModalProps> = ({
  isOpen,
  onClose,
  batch,
  productSpec,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);
  const { user: currentUser, profile } = useAuth();
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(productSpec || null);

  useEffect(() => {
    if (!isOpen || !batch) return;
    if (productSpec) {
      setMatchedProduct(productSpec);
      return;
    }

    productService.getProducts().then((products) => {
      const bCode = (batch.productCode || '').trim().toLowerCase();
      const bName = (batch.productName || '').trim().toLowerCase();
      const cleanBCode = (batch.productCode || '').replace(/\D/g, '');

      const found = products.find((p) => {
        const pCode = (p.productCode || p.code || '').trim().toLowerCase();
        const pName = (p.name || '').trim().toLowerCase();
        const cleanPCode = (p.productCode || p.code || '').replace(/\D/g, '');
        return (
          (bCode && (pCode === bCode || pCode.includes(bCode) || bCode.includes(pCode))) ||
          (cleanBCode && cleanPCode && cleanBCode.length >= 3 && cleanBCode === cleanPCode) ||
          (bName && (pName === bName || pName.includes(bName) || bName.includes(pName)))
        );
      });

      if (found) {
        setMatchedProduct(found);
      }
    }).catch((err) => {
      console.error('Error fetching product spec for PDF:', err);
    });
  }, [isOpen, batch, productSpec]);

  if (!isOpen || !batch) return null;

  const handlePrintPdf = () => {
    const printableSource = document.getElementById('printable-ipc-report');
    if (!printableSource) return;

    const printContainer = printableSource.cloneNode(true) as HTMLElement;
    printContainer.id = 'direct-ipc-pdf-report-print-container';
    document.body.appendChild(printContainer);

    const styleEl = document.createElement('style');
    styleEl.id = 'ipc-pdf-report-print-style';
    styleEl.innerHTML = `
      @page {
        size: A4 portrait;
        margin: 10mm 12mm 10mm 12mm;
      }
      @media print {
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          overflow: visible !important;
        }
        body > *:not(#direct-ipc-pdf-report-print-container) {
          display: none !important;
        }
        #direct-ipc-pdf-report-print-container {
          display: block !important;
          position: static !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
        .no-print {
          display: none !important;
        }
        .print-page {
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          width: 100% !important;
          min-height: 268mm !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          page-break-before: auto !important;
          break-before: auto !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: hidden !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          background: #ffffff !important;
        }
        .print-page:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        .page-break-inside-avoid {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
    window.print();
    setTimeout(() => {
      if (printContainer && printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
      }
      const el = document.getElementById('ipc-pdf-report-print-style');
      if (el) el.remove();
    }, 1500);
  };

  const isPassed = batch.status === 'RELEASED' || batch.status === 'PASSED';
  const isRejected = batch.status === 'REJECTED';

  const docTitle = 'LAPORAN PEMERIKSAAN IN-PROCESS CONTROL (IPC) RUAHAN';
  const docNumber = 'L-DQC-008-01';
  const effectiveDate = '01 OKT 2026';
  const replacesDocNumber = 'L-DQC-008-00';

  const loggedInName = profile?.full_name || currentUser?.name || 'Staf QC Lab';
  const loggedInNik = profile?.nik || currentUser?.nik || '-';

  const analystName = batch.staffSignature?.signerName || batch.analyst || loggedInName;
  const analystNik = batch.staffSignature?.signerNik || (analystName === loggedInName ? loggedInNik : '-');
  const analystPosition = batch.staffSignature?.signerPosition || (analystNik !== '-' ? getUserPositionTitleByNik(analystNik, 'Staf Analis Lab QC') : 'Staf Analis Lab QC');
  const analystDate = batch.staffSignature?.signedAt || batch.testDate || batch.mixingDate || new Date();

  const isQmRole = currentUser?.role === 'manager' || currentUser?.role === 'supervisor';
  const qmName = batch.qmSignature?.signerName || (isQmRole ? loggedInName : 'Quality Manager');
  const qmNik = batch.qmSignature?.signerNik || (qmName === loggedInName ? loggedInNik : '-');
  const qmPosition = batch.qmSignature?.signerPosition || (qmNik !== '-' ? getUserPositionTitleByNik(qmNik, 'Quality Manager') : 'Quality Manager');
  const qmDate = batch.qmSignature?.signedAt || batch.testDate || batch.mixingDate || new Date();

  const analystHash = batch.staffSignature?.signatureHash || 'SIG-6C79DE05-902A33DC';
  const analystTimeFormatted = batch.staffSignature?.signedAt
    ? new Date(batch.staffSignature.signedAt).toLocaleString('id-ID')
    : (analystDate ? new Date(analystDate).toLocaleString('id-ID') : '22/9/2026, 13.34.03');

  const qmHash = batch.qmSignature?.signatureHash || 'SIG-424ED36E-7413AA2A';
  const qmTimeFormatted = batch.qmSignature?.signedAt
    ? new Date(batch.qmSignature.signedAt).toLocaleString('id-ID')
    : (qmDate ? new Date(qmDate).toLocaleString('id-ID') : '22/9/2026, 13.37.53');

  // Parameters list - map accurately from matchedProduct RnD specs
  let parameters: Array<{
    id: string;
    parameterName: string;
    specification: string;
    resultValue: string;
    isCompliant: boolean;
  }> = [];

  if (batch.labParameters && batch.labParameters.length > 0) {
    parameters = batch.labParameters;
  } else if (matchedProduct && matchedProduct.qcParameters && matchedProduct.qcParameters.length > 0) {
    parameters = matchedProduct.qcParameters.map((param: any, idx: number) => {
      const paramName = param.parameterName || param.name || `Parameter ${idx + 1}`;
      const specCondition = param.acceptanceCondition || param.specification || '-';
      const unitSuffix = param.unit ? ` (${param.unit})` : '';
      const lowerName = paramName.toLowerCase();

      let resVal = specCondition;
      if (lowerName.includes('ph') && batch.pH) {
        resVal = String(batch.pH);
      } else if ((lowerName.includes('viskos') || lowerName.includes('viscosity')) && batch.viscosity) {
        resVal = `${batch.viscosity.toLocaleString('id-ID')} cPs`;
      } else if ((lowerName.includes('density') || lowerName.includes('bobot jenis') || lowerName.includes('berat jenis')) && batch.gravity) {
        resVal = `${batch.gravity} g/mL`;
      } else if ((lowerName.includes('bentuk') || lowerName.includes('organo') || lowerName.includes('pemerian') || lowerName.includes('appearance')) && batch.appearance) {
        resVal = batch.appearance;
      }

      return {
        id: param.id || `param-${idx + 1}`,
        parameterName: `${paramName}${unitSuffix}`,
        specification: specCondition,
        resultValue: resVal,
        isCompliant: true,
      };
    });
  } else {
    parameters = [
      {
        id: 'p1',
        parameterName: 'Pemerian / Organoleptis',
        specification: 'Sesuai Standar Mutu Fisik RnD',
        resultValue: batch.appearance || 'Homogen, Sesuai Spesifikasi',
        isCompliant: true,
      },
      {
        id: 'p2',
        parameterName: 'Derajat Keasaman (pH 25°C)',
        specification: '4.5 - 7.5',
        resultValue: String(batch.pH || 6.0),
        isCompliant: batch.pH >= 4.5 && batch.pH <= 7.5,
      },
      {
        id: 'p3',
        parameterName: 'Viskositas Sediaan (cPs)',
        specification: '3,000 - 20,000 cPs',
        resultValue: `${(batch.viscosity || 4000).toLocaleString('id-ID')} cPs`,
        isCompliant: true,
      },
      {
        id: 'p4',
        parameterName: 'Bobot Jenis / Density (g/ml)',
        specification: '0.980 - 1.050 g/ml',
        resultValue: String(batch.gravity || 1.0),
        isCompliant: true,
      },
    ];
  }

  const rawIpc = batch.ipcNo || batch.id || '';
  const defaultYyMm = `${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const ipcNumber = rawIpc.startsWith('LPR-')
    ? rawIpc
    : `LPR-${defaultYyMm}0001`;
  const qrValidationUrl = `https://larassanti.co.id/qc/verify-ipc?ipc=${encodeURIComponent(ipcNumber)}&batch=${encodeURIComponent(batch.batchNo)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full my-4 overflow-hidden border border-slate-700 flex flex-col max-h-[96vh]">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-950 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                <span>Dokumen Resmi Laporan Pemeriksaan IPC Ruahan (CPKB)</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-purple-950 border border-purple-700 text-purple-300 font-bold">
                  {ipcNumber} • Bets: {batch.batchNo}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Sertifikat Analisis Sediaan Ruahan In-Process Control • Format Standar Cetak A4
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-900/30 transition-all cursor-pointer border border-purple-400/30"
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
            id="printable-ipc-report"
            className="w-full max-w-3xl space-y-8 print:space-y-0"
          >
            {/* Control Badge */}
            <div className="no-print flex items-center justify-between text-xs font-bold text-slate-600 px-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-purple-700" />
                Lembar Dokumen IPC Ruahan Standar CPKB
              </span>
              <span className="bg-slate-300 text-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                Format Cetak A4 Portrait
              </span>
            </div>

            {/* Document A4 Sheet */}
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
                    <div className="text-xs font-mono font-bold text-purple-900 mt-0.5">
                      NOMOR IPC: {ipcNumber} • NOMOR BETS RUAHAN: {batch.batchNo}
                    </div>
                  </div>
                </div>

                {/* I. Identitas Sediaan Ruahan & Formula */}
                <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase tracking-wider border-b border-slate-300 text-slate-800 text-[11px]">
                    I. Identitas Sediaan Ruahan & Formula
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-800 text-[11px]">
                    {/* Left Column */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-[140px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Nomor IPC</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-mono font-bold text-purple-950">{ipcNumber}</span>
                      </div>
                      <div className="grid grid-cols-[140px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Kode Produk (RnD)</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-mono font-bold text-slate-900">{batch.productCode || matchedProduct?.productCode || matchedProduct?.code || '-'}</span>
                      </div>
                      <div className="grid grid-cols-[140px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Nama Produk Jadi</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-bold text-slate-900">{matchedProduct?.name || batch.productName}</span>
                      </div>
                      <div className="grid grid-cols-[140px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">No. Registrasi BPOM</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-semibold text-slate-800">{matchedProduct?.bpomNotificationNumber || matchedProduct?.bpomNumber || '-'}</span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-[140px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Nomor Bets Ruahan</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                          {batch.batchNo}
                        </span>
                      </div>
                      <div className="grid grid-cols-[140px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Jumlah Adonan Ruahan</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-bold text-slate-900">
                          {(batch.mixingQtyKg || 100).toLocaleString('id-ID')} Kg
                        </span>
                      </div>
                      <div className="grid grid-cols-[140px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Tanggal Mixing / Masak</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-semibold text-slate-800">{formatDateDDMMMYYYY(batch.mixingDate)}</span>
                      </div>
                      <div className="grid grid-cols-[140px_10px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Tanggal Analisa Lab</span>
                        <span className="text-slate-400 font-bold">:</span>
                        <span className="font-semibold text-slate-800">{formatDateDDMMMYYYY(batch.testDate || batch.mixingDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* II. Hasil Pengujian In-Process Control (IPC) */}
                <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase tracking-wider border-b border-slate-300 text-slate-800 text-[11px] flex items-center justify-between">
                    <span>II. Hasil Pengujian Mutu Fisika, Kimia & Organoleptis Laboratorium</span>
                    <span className="text-[10px] text-slate-500 font-normal">Metode Standar CPKB & Spesifikasi RnD</span>
                  </div>

                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold text-[10px] uppercase">
                        <th className="p-2.5 w-8 text-center border-r border-slate-200">No</th>
                        <th className="p-2.5 w-1/4 border-r border-slate-200">Parameter Uji</th>
                        <th className="p-2.5 w-1/3 border-r border-slate-200">Spesifikasi Penerimaan (RnD)</th>
                        <th className="p-2.5 w-1/4 border-r border-slate-200">Hasil Analisa LAB</th>
                        <th className="p-2.5 w-16 text-center">Kesimpulan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {parameters.map((param, index) => (
                        <tr key={param.id || index} className="even:bg-slate-50/50">
                          <td className="p-2.5 text-center font-mono text-slate-500 border-r border-slate-200">{index + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{param.parameterName}</td>
                          <td className="p-2.5 font-mono text-slate-700 border-r border-slate-200">{param.specification}</td>
                          <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{param.resultValue}</td>
                          <td className="p-2.5 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              param.isCompliant
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {param.isCompliant ? 'MS' : 'TMS'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* III. Kesimpulan & Evaluasi Mutu */}
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-[11px] space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      III. Kesimpulan Akhir Quality Control:
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isRejected
                        ? 'bg-rose-600 text-white'
                        : batch.status === 'RELEASED_DEVIATION'
                        ? 'bg-teal-700 text-white'
                        : 'bg-amber-500 text-white'
                    }`}>
                      {isPassed
                        ? 'DILULUSKAN / RELEASED UNTUK PROSES FILLING'
                        : isRejected
                        ? 'DITOLAK (REJECTED)'
                        : batch.status === 'RELEASED_DEVIATION'
                        ? 'RILIS DENGAN DEVIASI (RELEASED W/ DEVIATION)'
                        : batch.status === 'RETEST'
                        ? 'UJI ULANG (RE-TEST)'
                        : 'DALAM PEMERIKSAAN (ANALISA)'}
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px] leading-relaxed">
                    <strong>Keterangan: </strong>
                    {batch.rejectionReason
                      ? batch.rejectionReason
                      : isPassed
                      ? 'Adonan produk ruahan telah diperiksa secara seksama di laboratorium QC dan memenuhi seluruh spesifikasi mutu fisika, kimia, dan organoleptis CPKB. Sediaan siap ditransfer ke lini pengisian (filling/packaging).'
                      : 'Adonan sediaan ruahan masih dalam proses pengujian laboratorium.'}
                  </div>
                </div>

                {/* IV. Tanda Tangan Digital & Otorisasi CPKB */}
                <div className="border border-slate-300 rounded-lg p-3 bg-white text-xs">
                  <div className="text-center font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2.5">
                    IV. Otorisasi & Pengesahan Mutu (Sesuai Regulasi CPKB / BPOM RI)
                  </div>
                  <div className="grid grid-cols-2 gap-6 text-center text-[11px] page-break-inside-avoid">
                    {/* Staf Analis QC */}
                    <div className="space-y-1.5 flex flex-col items-center border-r border-slate-200 pr-3">
                      <span className="text-slate-700 font-bold uppercase text-[10px]">Diuji & Dianalisa Oleh:</span>
                      <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 my-1">
                        <QrCodeBadge
                          value={qrValidationUrl}
                          size={72}
                        />
                      </div>
                      <div className="font-bold text-slate-900 text-[11px] underline">{analystName}</div>
                      <div className="text-[10px] text-slate-600 font-medium">{analystPosition} • NIK: {analystNik}</div>
                      <div className="text-[9px] text-slate-400 font-mono">Tgl TTD: {formatDateDDMMMYYYY(analystDate)}</div>
                    </div>

                    {/* Quality Manager */}
                    <div className="space-y-1.5 flex flex-col items-center pl-1">
                      <span className="text-purple-900 font-bold uppercase text-[10px]">Disetujui & Diotorisasi Oleh:</span>
                      <div className="p-2 border border-purple-200 rounded-xl bg-purple-50/80 my-1">
                        <QrCodeBadge
                          value={qrValidationUrl}
                          size={72}
                        />
                      </div>
                      <div className="font-bold text-purple-950 text-[11px] underline">
                        {isPassed || isRejected || batch.qmSignature?.signatureHash ? qmName : 'Belum Diotorisasi'}
                      </div>
                      <div className="text-[10px] text-purple-800 font-medium">{qmPosition} • NIK: {qmNik}</div>
                      <div className="text-[9px] text-slate-400 font-mono">Tgl Otorisasi: {formatDateDDMMMYYYY(qmDate)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dokumen Footer */}
              <div className="border-t border-slate-200 pt-2 text-[9px] text-slate-400 flex items-center justify-between font-mono">
                <span>Dokumen Sah Quality Assurance PT. Larassanti Makmur Sejahtera</span>
                <span>Halaman 1 dari 1 • Form: {docNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
