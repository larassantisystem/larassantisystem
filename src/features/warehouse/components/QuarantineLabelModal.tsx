import React, { useState } from 'react';
import {
  Printer,
  X,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Package,
  Calendar,
  Layers,
  Building2,
  FileText,
} from 'lucide-react';
import { GrnRecord } from '../types/grnTypes';
import { QrCodeBadge } from '../../../components/QrCodeBadge';

interface QuarantineLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: GrnRecord | null;
}

export const QuarantineLabelModal: React.FC<QuarantineLabelModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [containerRange, setContainerRange] = useState<'single' | 'all'>('single');
  const [selectedContainerNum, setSelectedContainerNum] = useState<number>(1);

  if (!isOpen || !record) return null;

  const totalContainers = record.containerCount || 1;
  const formattedQty = Number(record.quantityReceived || 0).toLocaleString('id-ID', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  const handlePrint = () => {
    const printableElement = document.getElementById('quarantine-label-printable');
    if (!printableElement) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (!printWindow) {
      alert('Pop-up terblokir oleh browser. Harap izinkan pop-up untuk mencetak label.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Label Karantina CPKB (100x100mm)</title>
          <style>
            @page {
              size: 100mm 100mm;
              margin: 0mm !important;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              width: 100mm !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              font-family: sans-serif;
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
              background-color: #FEF08A !important;
              border: 1.5px solid #000000 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }
          </style>
        </head>
        <body>
          ${printableElement.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const containerList =
    containerRange === 'all'
      ? Array.from({ length: totalContainers }, (_, i) => i + 1)
      : [selectedContainerNum];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Cetak Label Karantina CPKB (Thermal 100×100 mm)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                  Status: Karantina Masuk
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
        <div className="bg-amber-100 border-b border-amber-300 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-600 inline-block shadow-xs shrink-0" />
            <span>
              <strong>Kertas Label Thermal:</strong> Gunakan <strong>Roll KUNING (Yellow Paper)</strong> • Ukuran <strong>100 × 100 mm</strong>
            </span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-200/90 border border-amber-400 text-amber-950">
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
                    ? 'bg-amber-500 text-white shadow-2xs'
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
                    ? 'bg-amber-500 text-white shadow-2xs'
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
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Thermal ({containerList.length} Label 100×100)</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Label Preview */}
        <div className="p-6 overflow-y-auto bg-slate-200/70 space-y-6 flex-1 flex flex-col items-center">
          <div className="text-xs text-slate-600 font-medium">
            Pratinjau fisik label stiker roll kuning (Skala 100mm × 100mm):
          </div>

          {/* Printable Container Target for Window Print */}
          <div id="quarantine-label-printable" className="space-y-6 w-full flex flex-col items-center">
            {containerList.map((containerIndex) => (
              <div key={containerIndex} className="print-page-wrapper">
                <div
                  className="thermal-label-page w-[100mm] h-[100mm] min-w-[100mm] min-h-[100mm] max-w-[100mm] max-h-[100mm] bg-[#FEF08A] text-black border-2 border-black rounded-lg p-[3mm] shadow-lg flex flex-col justify-between overflow-hidden select-none print:shadow-none print:rounded-none print:border print:border-black print:bg-transparent"
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
                        SISTEM PENANDAAN KARANTINA BAHAN MASUK (CPKB)
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[8.5px] font-black border-1.5 border-black px-1.5 py-0.5 rounded-xs shrink-0 whitespace-nowrap inline-block bg-white/90 text-black shadow-2xs">
                      L-DQC-002-01
                    </span>
                  </div>
                </div>

                {/* 2. Status Banner (Inverted High-Contrast Black Bar) */}
                <div className="bg-black text-white px-2.5 py-1 rounded-xs flex items-center justify-between my-1">
                  <span className="font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <span>⚠</span>
                    <span>STATUS: KARANTINA (QUARANTINE)</span>
                  </span>
                  <span className="text-[7.5px] font-bold tracking-normal italic">
                    * DILARANG DIGUNAKAN / DIOLAH SEBELUM DILULUSKAN QC *
                  </span>
                </div>

                {/* 3. Material Identity Box */}
                <div className="border border-black/40 rounded-xs p-1.5 bg-white/30">
                  <div className="font-black text-[12px] leading-tight uppercase text-black line-clamp-1">
                    {record.materialName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-black/90 mt-1">
                    <span className="font-mono bg-black text-white px-1.5 py-0.2 rounded-xs">
                      {record.materialCode}
                    </span>
                    <span className="border border-black/60 px-1 py-0.2 rounded-xs">
                      {record.materialType === 'raw' ? 'Bahan Baku' : 'Bahan Kemas'}
                    </span>
                    <span className="truncate max-w-[140px] text-black/80">
                      Produsen: {record.manufacturer}
                    </span>
                  </div>
                </div>

                {/* 4. Middle Section: Specs Grid (Left) + Large QR Code (Right) */}
                <div className="flex items-stretch gap-2 my-1 flex-1 min-h-0">
                  {/* Left Column: Data Grid */}
                  <div className="flex-1 flex flex-col justify-between text-[8px]">
                    <div className="space-y-1">
                      <div className="flex justify-between border-b border-black/20 pb-0.5">
                        <span className="font-bold text-black/70">No. GRN:</span>
                        <span className="font-mono font-black text-[9px] text-black">{record.grnNumber}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/20 pb-0.5">
                        <span className="font-bold text-black/70">Tgl Kedatangan:</span>
                        <span className="font-bold text-black">{record.receivedDate}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/20 pb-0.5">
                        <span className="font-bold text-black/70">Batch / Lot Vendor:</span>
                        <span className="font-mono font-bold text-black truncate max-w-[110px]">{record.batchNumber || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/20 pb-0.5">
                        <span className="font-bold text-black/70">Tgl Kedaluwarsa:</span>
                        <span className="font-bold text-black">{record.expiryDate || 'Non-Exp (Bahan Kemas)'}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/20 pb-0.5">
                        <span className="font-bold text-black/70">Total Kuantitas:</span>
                        <span className="font-mono font-black text-[9.5px] text-black">{formattedQty} {record.unit}</span>
                      </div>
                    </div>

                    <div className="text-[7.5px] text-black/80 pt-0.5">
                      <span className="font-bold">Simpan: </span>
                      <span>{record.storageConditions || '15-30°C Ruang Terkendali, Kering & Terlindung Cahaya'}</span>
                    </div>
                  </div>

                  {/* Right Column: High-Visibility Large QR Code */}
                  <div className="w-[32mm] shrink-0 border-l border-black/40 pl-2 flex flex-col items-center justify-center">
                    <div className="p-1 bg-white border border-black rounded-xs">
                      <QrCodeBadge
                        value={`GRN|NO:${record.grnNumber}|W:${containerIndex}/${totalContainers}|CODE:${record.materialCode}|BATCH:${record.batchNumber || '-'}`}
                        size={92}
                        className="rounded-none"
                      />
                    </div>
                    <span className="font-mono text-[8px] font-black tracking-tight text-center mt-1 block leading-none text-black">
                      {record.grnNumber}-W{containerIndex}
                    </span>
                    <span className="text-[7px] font-bold uppercase tracking-wider text-center block mt-0.5 text-black/80 leading-none">
                      SCAN UNTUK SAMPLING
                    </span>
                  </div>
                </div>

                {/* 5. Koli / Wadah Highlight Bar */}
                <div className="bg-black text-white px-2.5 py-1 rounded-xs flex items-center justify-between mb-1">
                  <span className="font-black text-[9.5px] tracking-wider uppercase">
                    WADAH KE [ {containerIndex} ] DARI {totalContainers} WADAH/KOLI
                  </span>
                  <span className="font-mono font-bold text-[9px]">
                    KEMASAN: {record.containerType}
                  </span>
                </div>

                {/* 6. Footer Signatures Row */}
                <div className="border-t-2 border-black pt-1 grid grid-cols-3 gap-1.5 text-center">
                  <div className="border border-black/60 rounded-xs py-1 px-1 bg-white/40">
                    <span className="block text-[7px] text-black/70 font-bold uppercase leading-none">
                      Penerima Gudang
                    </span>
                    <span className="font-serif italic font-bold text-[9px] truncate block leading-tight text-black mt-1">
                      {record.receivedBy || 'Staf Gudang'}
                    </span>
                    <span className="block text-[6.5px] text-black/60 border-t border-black/20 pt-0.5 mt-0.5">
                      Paraf & Tanggal Terima
                    </span>
                  </div>

                  <div className="border border-black/60 rounded-xs py-1 px-1 bg-white/40">
                    <span className="block text-[7px] text-black/70 font-bold uppercase leading-none">
                      Pengambilan Contoh (QC)
                    </span>
                    <span className="font-bold text-[8.5px] block leading-tight text-black mt-1">
                      [ Menunggu Sampling ]
                    </span>
                    <span className="block text-[6.5px] text-black/60 border-t border-black/20 pt-0.5 mt-0.5">
                      Paraf & Tanggal Uji
                    </span>
                  </div>

                  <div className="border border-black/60 rounded-xs py-1 px-1 bg-white/40 flex flex-col justify-between">
                    <span className="block text-[7px] text-black/70 font-bold uppercase leading-none">
                      Verifikasi Fisik
                    </span>
                    <span className="font-bold text-[8px] truncate block leading-tight text-black mt-1">
                      Segel Utuh & Bersih
                    </span>
                    <span className="block text-[6.5px] text-black/60 border-t border-black/20 pt-0.5 mt-0.5">
                      Sesuai Prosedur CPKB
                    </span>
                  </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <p className="text-xs text-slate-500">
            *Tempelkan stiker kuning 100×100 mm ini pada setiap koli/wadah saat barang tiba di area karantina gudang.
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
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
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
