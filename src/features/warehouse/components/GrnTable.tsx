import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  Tag,
  Boxes,
  Printer,
  Sparkles,
  ArrowUpDown,
  Pencil,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { GrnRecord, GrnMaterialType, GrnQcStatus } from '../types/grnTypes';
import { Pagination } from '../../../core/ui-components/Pagination';
import { QuarantineLabelModal } from './QuarantineLabelModal';
import { GrnEditModal } from './GrnEditModal';

interface GrnTableProps {
  records: GrnRecord[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecord?: (id: string, updatedData: Partial<GrnRecord>) => Promise<void>;
  onPrintLabel?: (record: GrnRecord) => void;
}

export const GrnTable: React.FC<GrnTableProps> = ({
  records,
  onDeleteRecord,
  onUpdateRecord,
  onPrintLabel,
}) => {
  // Category separation: 'raw' or 'packaging'
  const [activeCategory, setActiveCategory] = useState<'raw' | 'packaging'>('raw');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GrnQcStatus>('ALL');
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState<GrnRecord | null>(null);

  // Edit Modal State
  const [editRecordToUpdate, setEditRecordToUpdate] = useState<GrnRecord | null>(null);

  // Print Label Modal State
  const [labelRecordToPrint, setLabelRecordToPrint] = useState<GrnRecord | null>(null);

  // Category counts
  const rawCount = useMemo(
    () => records.filter((r) => r.materialType === 'raw').length,
    [records]
  );
  const packagingCount = useMemo(
    () => records.filter((r) => r.materialType === 'packaging').length,
    [records]
  );

  // Filter and sort records: Urutkan dari yang terlama ke yang baru (Oldest to Newest)
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        // Separate category
        if (rec.materialType !== activeCategory) return false;
        // Status filter
        if (statusFilter !== 'ALL' && rec.qcStatus !== statusFilter) return false;

        // Query search
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          rec.grnNumber.toLowerCase().includes(q) ||
          rec.materialCode.toLowerCase().includes(q) ||
          rec.materialName.toLowerCase().includes(q) ||
          rec.distributor.toLowerCase().includes(q) ||
          rec.manufacturer.toLowerCase().includes(q) ||
          rec.deliveryNoteNumber.toLowerCase().includes(q) ||
          (rec.poNumber && rec.poNumber.toLowerCase().includes(q)) ||
          (rec.batchNumber && rec.batchNumber.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        // Urutan kronologis: dari yang terlama ke yang baru (Oldest date first)
        const dateA = new Date(a.receivedDate).getTime();
        const dateB = new Date(b.receivedDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [records, activeCategory, statusFilter, searchQuery]);

  // Pagination calculations
  const totalItems = filteredRecords.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  const renderStatusBadge = (status: GrnQcStatus) => {
    switch (status) {
      case 'QUARANTINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            KARANTINA
          </span>
        );
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            LOLOS QC
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            REJECTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs: Pisahkan Tabel Kedatangan Bahan Baku dan Bahan Kemas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('raw');
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeCategory === 'raw'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>🧪 Kedatangan Bahan Baku</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeCategory === 'raw'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {rawCount} Lot
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('packaging');
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeCategory === 'packaging'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>📦 Kedatangan Bahan Kemas</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeCategory === 'packaging'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {packagingCount} Lot
            </span>
          </button>
        </div>

        {/* Info Urutan */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>Urutan: <strong>Terlama ke Baru (Ascending)</strong></span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              activeCategory === 'raw'
                ? 'Cari Bahan Baku (No. GRN, Kode B..., Nama, Pemasok)...'
                : 'Cari Bahan Kemas (No. GRN, Kode K..., Nama, Pemasok)...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Compact Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsCompactMode(!isCompactMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isCompactMode
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Kurangi padding dan font untuk melihat lebih banyak data per layar"
          >
            {isCompactMode ? <Minimize2 className="w-3.5 h-3.5 text-teal-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>Mode Ringkas {isCompactMode ? '(Aktif)' : ''}</span>
          </button>

          {/* QC Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-2xs"
          >
            <option value="ALL">Semua Status QC</option>
            <option value="QUARANTINE">Karantina CPKB</option>
            <option value="PASSED">Lolos QC (Rilis)</option>
            <option value="REJECTED">Ditolak (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Main Table Container: Kolom No., No Grn, Material & Produsen, Pemasok, QTY (3 desimal), Status, Aksi */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b border-slate-200 bg-slate-50/80 font-black text-slate-600 uppercase tracking-wider ${
                  isCompactMode ? 'text-[10px]' : 'text-[11px]'
                }`}
              >
                <th className={`${isCompactMode ? 'py-2 px-2.5 w-10' : 'py-3.5 px-3.5 w-12'} text-center`}>No.</th>
                <th className={`${isCompactMode ? 'py-2 px-3 min-w-[130px]' : 'py-3.5 px-4 min-w-[150px]'}`}>No Grn</th>
                <th className={`${isCompactMode ? 'py-2 px-3 min-w-[180px]' : 'py-3.5 px-4 min-w-[200px]'}`}>Material & Produsen</th>
                <th className={`${isCompactMode ? 'py-2 px-3 min-w-[150px]' : 'py-3.5 px-4 min-w-[170px]'}`}>Pemasok</th>
                <th className={`${isCompactMode ? 'py-2 px-3 min-w-[120px]' : 'py-3.5 px-4 min-w-[140px]'}`}>QTY</th>
                <th className={`${isCompactMode ? 'py-2 px-2 text-center min-w-[110px]' : 'py-3.5 px-4 text-center min-w-[120px]'}`}>Status</th>
                <th className={`${isCompactMode ? 'py-2 px-3 text-right min-w-[120px]' : 'py-3.5 px-4 text-right min-w-[130px]'}`}>Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 text-slate-700 ${isCompactMode ? 'text-[11px]' : 'text-xs'}`}>
              {currentItems.length > 0 ? (
                currentItems.map((rec, index) => {
                  const rowNumber = indexOfFirstItem + index + 1;
                  const formattedQty = Number(rec.quantityReceived || 0).toLocaleString('id-ID', {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  });

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className="hover:bg-amber-50/40 cursor-pointer transition-colors group"
                      title="Klik baris untuk melihat detail view"
                    >
                      {/* 1. No. */}
                      <td className={`${isCompactMode ? 'py-1.5 px-2.5' : 'py-3 px-3.5'} text-center font-bold text-slate-400 group-hover:text-slate-900`}>
                        {rowNumber}
                      </td>

                      {/* 2. No Grn */}
                      <td className={isCompactMode ? 'py-1.5 px-3' : 'py-3 px-4'}>
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{rec.grnNumber}</span>
                        </div>
                        <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400 flex items-center gap-1 mt-0.5`}>
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{rec.receivedDate}</span>
                        </div>
                      </td>

                      {/* 3. Material & Produsen */}
                      <td className={isCompactMode ? 'py-1.5 px-3' : 'py-3 px-4'}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold rounded-md ${
                              isCompactMode ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
                            } ${
                              rec.materialType === 'raw'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {rec.materialCode}
                          </span>
                          <span className={`font-bold text-slate-900 group-hover:text-amber-800 transition-colors ${isCompactMode ? 'text-xs truncate max-w-[200px]' : ''}`}>
                            {rec.materialName}
                          </span>
                        </div>
                        <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400 mt-0.5 truncate max-w-[220px]`}>
                          Produsen: <span className="text-slate-600 font-medium">{rec.manufacturer}</span>
                        </div>
                      </td>

                      {/* 4. Pemasok */}
                      <td className={isCompactMode ? 'py-1.5 px-3' : 'py-3 px-4'}>
                        <div className="font-medium text-slate-800 truncate max-w-[180px]">
                          {rec.distributor}
                        </div>
                        <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400 flex items-center gap-1.5 mt-0.5`}>
                          {rec.deliveryNoteNumber && rec.deliveryNoteNumber !== '-' && (
                            <span>SJ: <span className="font-mono text-slate-600">{rec.deliveryNoteNumber}</span></span>
                          )}
                          {rec.poNumber && rec.poNumber !== '-' && (
                            <span>• PO: <span className="font-mono text-slate-600">{rec.poNumber}</span></span>
                          )}
                        </div>
                      </td>

                      {/* 5. QTY (format 3 angka dibelakang koma) */}
                      <td className={isCompactMode ? 'py-1.5 px-3' : 'py-3 px-4'}>
                        <div className="font-mono font-bold text-slate-900">
                          {formattedQty} <span className="text-slate-500 font-sans font-normal text-[10px]">{rec.unit}</span>
                        </div>
                        <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400 mt-0.5`}>
                          {rec.containerCount} koli ({rec.containerType.split(' ')[0]})
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td className={`${isCompactMode ? 'py-1.5 px-2' : 'py-3 px-4'} text-center`}>
                        {renderStatusBadge(rec.qcStatus)}
                      </td>

                      {/* 7. Aksi */}
                      <td className={`${isCompactMode ? 'py-1.5 px-3' : 'py-3 px-4'} text-right`}>
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Print Label Karantina */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onPrintLabel) {
                                onPrintLabel(rec);
                              } else {
                                setLabelRecordToPrint(rec);
                              }
                            }}
                            className={`${isCompactMode ? 'p-1' : 'p-1.5'} rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors`}
                            title="Print Label Karantina CPKB"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Data Penerimaan */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditRecordToUpdate(rec);
                            }}
                            className={`${isCompactMode ? 'p-1' : 'p-1.5'} rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors`}
                            title={
                              rec.qcStatus === 'PASSED' || rec.qcStatus === 'REJECTED'
                                ? 'Lihat Data Penerimaan (Terkunci CPKB)'
                                : 'Edit Data Penerimaan Barang'
                            }
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Detail View */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(rec);
                            }}
                            className={`${isCompactMode ? 'p-1' : 'p-1.5'} rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors`}
                            title="Lihat Detail Penerimaan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Record */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Hapus catatan kedatangan ${rec.grnNumber}?`)) {
                                onDeleteRecord(rec.id);
                              }
                            }}
                            className={`${isCompactMode ? 'p-1' : 'p-1.5'} rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors`}
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">
                        {activeCategory === 'raw'
                          ? 'Belum ada kedatangan Bahan Baku'
                          : 'Belum ada kedatangan Bahan Kemas'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Klik tombol "Penerimaan Barang Baru (GRN)" untuk mencatat kedatangan barang.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {filteredRecords.length > 0 && (
          <div className="px-4 pb-2">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(items) => {
                setItemsPerPage(items);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Quarantine Label Print Modal (Triggered via Table Action) */}
      <QuarantineLabelModal
        isOpen={!!labelRecordToPrint}
        onClose={() => setLabelRecordToPrint(null)}
        record={labelRecordToPrint}
      />

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Detail Bukti Penerimaan Barang (GRN)
                  </h3>
                  <span className="font-mono text-xs text-slate-500 font-bold">
                    {selectedRecord.grnNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status Karantina CPKB
                  </span>
                  <div className="mt-1">{renderStatusBadge(selectedRecord.qcStatus)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Parameter Pengujian QC
                  </span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">
                    {selectedRecord.qcParametersCount || 3} Parameter Uji Terdaftar
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Material</span>
                  <p className="font-bold text-slate-900 text-sm mt-1">{selectedRecord.materialName}</p>
                  <p className="font-mono text-slate-500 mt-0.5">Kode: {selectedRecord.materialCode}</p>
                  <p className="text-slate-500 mt-0.5">Produsen: {selectedRecord.manufacturer}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemasok & Pengiriman</span>
                  <p className="font-bold text-slate-900 mt-1">{selectedRecord.distributor}</p>
                  <p className="text-slate-500 mt-0.5">Surat Jalan: <span className="font-mono font-semibold text-slate-800">{selectedRecord.deliveryNoteNumber}</span></p>
                  <p className="text-slate-500 mt-0.5">PO: <span className="font-mono">{selectedRecord.poNumber}</span></p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {selectedRecord.materialType === 'raw' ? 'Wadah / Keterangan' : 'Keterangan'} & Kuantitas
                  </span>
                  <p className="font-black text-slate-900 text-base mt-1">
                    {selectedRecord.quantityReceived.toLocaleString()} {selectedRecord.unit}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {selectedRecord.containerCount} koli • {selectedRecord.containerType}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyimpanan & Suhu</span>
                  <p className="font-bold text-slate-900 mt-1">{selectedRecord.storageLocation}</p>
                  <p className="text-slate-500 mt-0.5">{selectedRecord.storageConditions}</p>
                </div>
              </div>

              {(selectedRecord.sealCondition || selectedRecord.packagingCondition || selectedRecord.coaAttachment || selectedRecord.notes) && (
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Kondisi Fisik & Dokumen Mutu
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {selectedRecord.sealCondition && (
                      <div>
                        <span className="text-slate-400">Segel: </span>
                        <span className="font-semibold text-slate-700">{selectedRecord.sealCondition}</span>
                      </div>
                    )}
                    {selectedRecord.packagingCondition && (
                      <div>
                        <span className="text-slate-400">Kemasan: </span>
                        <span className="font-semibold text-slate-700">{selectedRecord.packagingCondition}</span>
                      </div>
                    )}
                    {selectedRecord.coaAttachment && (
                      <div className="col-span-2">
                        <span className="text-slate-400">Dokumen CoA: </span>
                        <span className="font-semibold text-emerald-700 font-mono">✓ {selectedRecord.coaAttachment}</span>
                      </div>
                    )}
                    {selectedRecord.notes && (
                      <div className="col-span-2">
                        <span className="text-slate-400">Catatan: </span>
                        <span className="text-slate-700 italic">{selectedRecord.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                <span>Diterima oleh: <strong className="text-slate-700">{selectedRecord.receivedBy}</strong></span>
                <span>Waktu Catat: {new Date(selectedRecord.createdAt).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit GRN Modal */}
      {editRecordToUpdate && (
        <GrnEditModal
          isOpen={!!editRecordToUpdate}
          onClose={() => setEditRecordToUpdate(null)}
          record={editRecordToUpdate}
          onSave={async (id, data) => {
            if (onUpdateRecord) {
              await onUpdateRecord(id, data);
            }
          }}
        />
      )}
    </div>
  );
};
