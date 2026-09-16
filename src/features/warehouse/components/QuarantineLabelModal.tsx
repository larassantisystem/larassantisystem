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
    window.print();
  };

  const containerList =
    containerRange === 'all'
      ? Array.from({ length: totalContainers }, (_, i) => i + 1)
      : [selectedContainerNum];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Cetak Label Karantina CPKB
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                  Status: Karantina Masuk
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Label fisik wajib ditempelkan pada setiap wadah/koli sebelum disampling oleh tim QC.
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
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
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
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
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
              <span>Cetak Sekarang (Print)</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Label Preview */}
        <div className="p-6 overflow-y-auto bg-slate-100/70 space-y-6 flex-1">
          {/* Printable Container Target for Window Print */}
          <div id="quarantine-label-printable" className="space-y-6">
            {containerList.map((containerIndex) => (
              <div
                key={containerIndex}
                className="bg-white rounded-2xl border-4 border-amber-400 p-5 shadow-md max-w-xl mx-auto break-inside-avoid print:shadow-none print:max-w-none print:border-4 print:border-amber-400 print:my-4 print:p-6"
              >
                {/* Header CPKB */}
                <div className="border-b-2 border-amber-300 pb-3 mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-white rounded-xl border border-amber-200 shrink-0 shadow-2xs flex items-center justify-center">
                      <img
                        src="/logo.png"
                        alt="Logo Larassanti"
                        className="h-10 w-auto max-w-[90px] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h1 className="font-black text-slate-900 text-sm tracking-tight leading-none">
                        PT. LARASSANTI MAKMUR SEJAHTERA
                      </h1>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                        SISTEM PENANDAAN KARANTINA BAHAN MASUK (CPKB)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-700 block">L-DQC-002-01</span>
                  </div>
                </div>

                {/* BIG WARNING BANNER */}
                <div className="bg-amber-400 text-slate-950 py-2.5 px-4 rounded-xl text-center font-black tracking-wider uppercase mb-4 shadow-xs">
                  <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
                    <AlertTriangle className="w-5 h-5 shrink-0 fill-current" />
                    <span>STATUS: KARANTINA (QUARANTINE)</span>
                  </div>
                  <p className="text-[10px] font-bold tracking-normal text-slate-900 mt-0.5 opacity-90 normal-case">
                    * DILARANG DIGUNAKAN / DIOLAH SEBELUM DILULUSKAN OLEH QC *
                  </p>
                </div>

                {/* Primary Data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-800">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">No. GRN</span>
                    <span className="font-mono font-black text-slate-950 text-xs block mt-0.5">
                      {record.grnNumber}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Tgl Kedatangan</span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {record.receivedDate}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase block">Nomor Koli / Wadah</span>
                    <span className="font-black text-amber-950 text-xs block mt-0.5">
                      Wadah ke <span className="underline decoration-2">{containerIndex}</span> dari {totalContainers}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                        {record.materialType === 'raw' ? 'Bahan Baku (Raw Material)' : 'Bahan Kemas (Packaging)'}
                      </span>
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {record.materialCode}
                      </span>
                    </div>
                    <span className="font-black text-slate-900 text-sm block mt-1">
                      {record.materialName}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">No. Batch / Lot Produsen</span>
                    <span className="font-mono font-bold text-slate-900 block mt-0.5 truncate">
                      {record.batchNumber || '-'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Tgl Kedaluwarsa</span>
                    <span className={`font-bold block mt-0.5 ${record.expiryDate ? 'text-rose-700' : 'text-slate-500'}`}>
                      {record.expiryDate || 'Non-Exp (Bahan Kemas)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Kuantitas</span>
                    <span className="font-mono font-black text-slate-950 text-xs block mt-0.5">
                      {formattedQty} {record.unit}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Produsen / Pemasok</span>
                    <span className="font-medium text-slate-900 block mt-0.5 truncate text-[11px]">
                      {record.manufacturer} <span className="text-slate-400 font-normal">({record.distributor})</span>
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Jenis Kemasan</span>
                    <span className="font-medium text-slate-800 block mt-0.5 truncate text-[11px]">
                      {record.containerType}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Kondisi Simpan:</span>
                    <span className="font-bold text-slate-800">
                      {record.storageConditions || 'Suhu Ruang Terkendali (15-30°C), Kering & Terlindung Cahaya'}
                    </span>
                  </div>
                </div>

                {/* Footer Signatures & Large Scannable QR Code */}
                <div className="mt-4 pt-3 border-t-2 border-dashed border-amber-300 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full grid grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-xl p-2.5 text-center bg-slate-50">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Petugas Penerima Gudang</span>
                      <div className="h-10 flex items-center justify-center font-serif text-slate-700 font-bold italic text-xs">
                        {record.receivedBy || 'Staf Gudang'}
                      </div>
                      <span className="text-[9px] text-slate-400 block border-t border-slate-200 pt-1">
                        Paraf & Tanggal Terima
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-2.5 text-center bg-slate-50">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Pengambilan Contoh (QC)</span>
                      <div className="h-10 flex items-center justify-center font-sans text-amber-700 font-bold text-[10px]">
                        [ Menunggu Sampling ]
                      </div>
                      <span className="text-[9px] text-slate-400 block border-t border-slate-200 pt-1">
                        Paraf & Tanggal Sampling
                      </span>
                    </div>

                    <div className="col-span-2 text-[10px] text-slate-500 bg-amber-50/60 border border-amber-200/80 rounded-lg p-2 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Scan QR Code di samping menggunakan HP/Scanner untuk konfirmasi pengambilan contoh (Sampling CPKB).</span>
                    </div>
                  </div>

                  {/* High-visibility large QR Code for fast mobile camera scanning */}
                  <div className="shrink-0 flex flex-col items-center justify-center p-2.5 bg-white border-2 border-amber-400 rounded-2xl shadow-xs">
                    <QrCodeBadge
                      value={`GRN|NO:${record.grnNumber}|W:${containerIndex}/${totalContainers}|CODE:${record.materialCode}|BATCH:${record.batchNumber || '-'}`}
                      size={110}
                      className="rounded-lg"
                    />
                    <span className="font-mono text-[10px] text-slate-900 mt-1.5 font-black tracking-tight">
                      {record.grnNumber}-W{containerIndex}
                    </span>
                    <span className="text-[8px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-sm mt-0.5 uppercase tracking-wider">
                      Wadah #{containerIndex} / {totalContainers}
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
            *Setelah label dicetak dan ditempelkan pada fisik wadah, barang siap diinspeksi & disampling oleh QC.
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
              <span>Cetak Label ({containerList.length} Lembar)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
