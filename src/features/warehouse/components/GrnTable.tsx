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
  Lock,
  RotateCcw,
  X,
} from 'lucide-react';
import { GrnRecord, GrnMaterialType, GrnQcStatus } from '../types/grnTypes';
import { Pagination } from '../../../core/ui-components/Pagination';
import { QuarantineLabelModal } from './QuarantineLabelModal';
import { GrnEditModal } from './GrnEditModal';
import { useAuth } from '../../../core/auth/AuthContext';
import { authService } from '../../../core/auth/authService';

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
  const { user } = useAuth();

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

  // Delete Authorization Modal State
  const [recordToDelete, setRecordToDelete] = useState<GrnRecord | null>(null);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'PASSED' || statusFilter === 'RELEASED') {
            if (rec.qcStatus !== 'PASSED' && rec.qcStatus !== 'RELEASED' && rec.qcStatus !== 'PASSED_WITH_DEVIATION') {
              return false;
            }
          } else if (rec.qcStatus !== statusFilter) {
            return false;
          }
        }

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
      case 'QUALITY_CONTROL_PROCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            SEDANG UJI
          </span>
        );
      case 'AWAITING_QM_AUTHORIZATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            MENUNGGU OTORISASI
          </span>
        );
      case 'PASSED':
      case 'RELEASED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            RILIS
          </span>
        );
      case 'PASSED_WITH_DEVIATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            RILIS (DEVIASI)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            DITOLAK
          </span>
        );
      case 'REVERTED_TO_WAREHOUSE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
            DIKEMBALIKAN QC
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
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
                ? 'Cari Bahan Baku (No. GRN, Kode B..., Nama, Produsen)...'
                : 'Cari Bahan Kemas (No. GRN, Kode K..., Nama, Produsen)...'
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
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-2xs cursor-pointer"
          >
            <option value="ALL">Semua Status QC</option>
            <option value="QUARANTINE">Karantina CPKB</option>
            <option value="QUALITY_CONTROL_PROCESS">Sedang Uji (QC Analisa)</option>
            <option value="AWAITING_QM_AUTHORIZATION">Menunggu Otorisasi QM</option>
            <option value="PASSED">Rilis (Lolos QC)</option>
            <option value="REJECTED">Ditolak (Rejected)</option>
            <option value="REVERTED_TO_WAREHOUSE">Dikembalikan QC</option>
          </select>
        </div>
      </div>

      {/* Main Table Container: Kolom No., No Grn, Material & Produsen, QTY (3 desimal), Status, Aksi */}
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
                <th className={`${isCompactMode ? 'py-2 px-3 min-w-[200px]' : 'py-3.5 px-4 min-w-[240px]'}`}>Material & Produsen</th>
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

                  const isReverted = rec.qcStatus === 'REVERTED_TO_WAREHOUSE';
                  const isDeletable = rec.qcStatus === 'QUARANTINE' || rec.qcStatus === 'REVERTED_TO_WAREHOUSE';

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className={`cursor-pointer transition-colors group ${
                        isReverted
                          ? 'bg-orange-50/70 hover:bg-orange-100/70 border-l-4 border-l-orange-500'
                          : 'hover:bg-amber-50/40'
                      }`}
                      title={
                        isReverted
                          ? 'Penerimaan dikembalikan oleh QC untuk verifikasi data (Klik untuk detail)'
                          : 'Klik baris untuk melihat detail view'
                      }
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
                        {rec.deliveryNoteNumber && rec.deliveryNoteNumber !== '-' && (
                          <div className={`${isCompactMode ? 'text-[9px]' : 'text-[10px]'} text-slate-400 mt-0.5`}>
                            SJ: <span className="font-mono text-slate-600">{rec.deliveryNoteNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* 3. Material & Produsen */}
                      <td className={isCompactMode ? 'py-1.5 px-3' : 'py-3 px-4'}>
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                        {isReverted && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded border border-orange-300">
                            <RotateCcw className="w-3 h-3 text-orange-600 shrink-0" />
                            <span className="truncate max-w-[240px]">
                              Dikembalikan QC: {rec.notes || 'Periksa fisik dokumen'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. QTY (format 3 angka dibelakang koma) */}
                      <td className={isCompactMode ? 'py-1.5 px-3' : 'py-3 px-4'}>
                        <div className="font-mono font-bold text-slate-900">
                          {formattedQty} <span className="text-slate-500 font-sans font-normal text-[10px]">{rec.unit}</span>
                        </div>
                        <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400 mt-0.5`}>
                          {rec.containerCount} koli ({rec.containerType.split(' ')[0]})
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className={`${isCompactMode ? 'py-1.5 px-2' : 'py-3 px-4'} text-center`}>
                        {renderStatusBadge(rec.qcStatus)}
                      </td>

                      {/* 6. Aksi */}
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
                            className={`${isCompactMode ? 'p-1' : 'p-1.5'} rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer`}
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
                            className={`${isCompactMode ? 'p-1' : 'p-1.5'} rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer`}
                            title={
                              rec.qcStatus === 'PASSED' || rec.qcStatus === 'RELEASED' || rec.qcStatus === 'REJECTED'
                                ? 'Lihat Data Penerimaan (Terkunci CPKB)'
                                : isReverted
                                ? 'Koreksi Data Penerimaan yang Dikembalikan QC'
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
                            className={`${isCompactMode ? 'p-1' : 'p-1.5'} rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer`}
                            title="Lihat Detail Penerimaan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Record - Protected by CPKB Data Integrity */}
                          {isDeletable ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRecordToDelete(rec);
                                setDeletePassword('');
                                setDeletePasswordError(null);
                              }}
                              className={`${isCompactMode ? 'p-1' : 'p-1.5'} rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer`}
                              title={
                                isReverted
                                  ? 'Hapus Penerimaan yang Dibatalkan/Dikembalikan QC (Otorisasi Password)'
                                  : 'Hapus Catatan Karantina (Memerlukan Kata Sandi)'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const label =
                                  rec.qcStatus === 'QUALITY_CONTROL_PROCESS'
                                    ? 'Sedang Uji'
                                    : rec.qcStatus === 'AWAITING_QM_AUTHORIZATION'
                                    ? 'Menunggu Otorisasi QM'
                                    : rec.qcStatus === 'PASSED' || rec.qcStatus === 'RELEASED'
                                    ? 'Rilis'
                                    : rec.qcStatus === 'PASSED_WITH_DEVIATION'
                                    ? 'Rilis dengan Deviasi'
                                    : 'Ditolak';
                                alert(
                                  `[Terkunci CPKB / GMP]\n\nPenerimaan ${rec.grnNumber} tidak dapat dihapus karena sudah dalam tahap "${label}".\n\nUntuk menjaga integritas data pengujian laboratorium, gudang tidak dapat menghapus data yang sudah diproses QC. Silakan hubungi tim QC untuk melakukan pembatalan (Revert) pengujian terlebih dahulu jika diperlukan perbaikan.`
                                );
                              }}
                              className={`${isCompactMode ? 'p-1' : 'p-1.5'} rounded-lg text-slate-300 bg-slate-100/70 border border-slate-200/80 cursor-not-allowed`}
                              title={`Terkunci CPKB: Tidak dapat dihapus karena status sudah ${rec.qcStatus}. Hubungi QC jika perlu pembatalan pengujian.`}
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
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
              {selectedRecord.qcStatus === 'REVERTED_TO_WAREHOUSE' && (
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-orange-800 font-bold text-xs">
                      <RotateCcw className="w-4 h-4 text-orange-600" />
                      <span>CATATAN PENGEMBALIAN DARI QUALITY CONTROL (REVERT)</span>
                    </div>
                    <span className="text-[10px] font-bold bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full">
                      Perlu Tindakan Gudang
                    </span>
                  </div>
                  <p className="text-xs text-orange-900 font-medium pl-6">
                    "{selectedRecord.notes || 'Pengujian dibatalkan/dikembalikan oleh QC untuk verifikasi data penerimaan fisik.'}"
                  </p>
                  <p className="text-[10.5px] text-orange-700 pl-6 pt-0.5">
                    Status penerimaan telah dibuka kembali. Tim gudang dapat mengedit data (nomor batch/surat jalan/kemasan) atau membatalkan penerimaan.
                  </p>
                </div>
              )}

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
                    {selectedRecord.qcParametersCount ?? 0} Parameter Uji Terdaftar
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

      {/* Delete GRN Authorization Modal with Password */}
      {recordToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Otorisasi Hapus Penerimaan (GRN)
                  </h4>
                  <span className="text-[10px] text-slate-400">Verifikasi Kata Sandi Elektronik</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 text-xs text-rose-950 space-y-1.5">
              <div className="flex justify-between font-mono font-bold text-[11px]">
                <span>No. GRN: {recordToDelete.grnNumber}</span>
                <span className="text-rose-700">{recordToDelete.qcStatus}</span>
              </div>
              <p className="font-bold text-slate-900">
                {recordToDelete.materialCode} - {recordToDelete.materialName}
              </p>
              <p className="text-[11px] text-slate-600">
                Jumlah: {recordToDelete.quantityReceived.toLocaleString()} {recordToDelete.unit} ({recordToDelete.containerCount} {recordToDelete.containerType})
              </p>
              <p className="text-[10.5px] text-rose-700 font-semibold pt-1">
                Peringatan: Menghapus catatan GRN ini juga akan otomatis membatalkan laporan pengujian QC di antrean karantina.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!recordToDelete) return;
                if (!deletePassword.trim()) {
                  setDeletePasswordError('Kata sandi wajib diisi.');
                  return;
                }
                setIsDeleting(true);
                setDeletePasswordError(null);
                try {
                  const actorNik = user?.nik || 'admin';
                  const verify = await authService.verifyPassword(actorNik, deletePassword);
                  if (!verify.valid) {
                    setDeletePasswordError(verify.error || 'Kata sandi tidak valid. Otorisasi hapus ditolak.');
                    return;
                  }
                  onDeleteRecord(recordToDelete.id);
                  setRecordToDelete(null);
                  setDeletePassword('');
                } catch (err: any) {
                  setDeletePasswordError(err.message || 'Gagal menghapus catatan.');
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Kata Sandi Akun Pengguna Aktif <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {user?.name || 'User'} ({user?.nik || 'NIK'})
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Masukkan password akun Anda..."
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 font-semibold"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              {deletePasswordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{deletePasswordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Menghapus...' : 'Otorisasi & Hapus GRN'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
