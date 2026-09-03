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
} from 'lucide-react';
import { GrnRecord, GrnMaterialType, GrnQcStatus } from '../types/grnTypes';
import { Pagination } from '../../../core/ui-components/Pagination';

interface GrnTableProps {
  records: GrnRecord[];
  onDeleteRecord: (id: string) => void;
}

export const GrnTable: React.FC<GrnTableProps> = ({ records, onDeleteRecord }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | GrnMaterialType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GrnQcStatus>('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState<GrnRecord | null>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Type filter
      if (typeFilter !== 'ALL' && rec.materialType !== typeFilter) return false;
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
    });
  }, [records, searchQuery, typeFilter, statusFilter]);

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
            KARANTINA CPKB
          </span>
        );
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            LOLOS QC (RILIS)
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
            placeholder="Cari No. GRN, Kode, Nama Material, Pemasok, atau Surat Jalan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Material Type Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs border border-slate-200/70">
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                setTypeFilter('raw');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                typeFilter === 'raw' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bahan Baku (B)
            </button>
            <button
              onClick={() => {
                setTypeFilter('packaging');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                typeFilter === 'packaging' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bahan Kemas (K)
            </button>
          </div>

          {/* QC Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="ALL">Semua Status QC</option>
            <option value="QUARANTINE">Karantina CPKB</option>
            <option value="PASSED">Lolos QC</option>
            <option value="REJECTED">Ditolak QC</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">No. GRN & Tanggal</th>
                <th className="py-3.5 px-4">Material</th>
                <th className="py-3.5 px-4">Pemasok & Pengiriman</th>
                <th className="py-3.5 px-4">No. Batch / Exp</th>
                <th className="py-3.5 px-4">Kuantitas Masuk</th>
                <th className="py-3.5 px-4">Lokasi Karantina</th>
                <th className="py-3.5 px-4 text-center">Status CPKB</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {currentItems.length > 0 ? (
                currentItems.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* GRN & Date */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{rec.grnNumber}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{rec.receivedDate}</span>
                      </div>
                    </td>

                    {/* Material Code & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-md ${
                            rec.materialType === 'raw'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {rec.materialCode}
                        </span>
                        <span className="font-bold text-slate-900 truncate max-w-[180px]">
                          {rec.materialName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                        Produsen: {rec.manufacturer}
                      </p>
                    </td>

                    {/* Supplier & Delivery Note */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 truncate max-w-[180px]">
                        {rec.distributor}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>SJ: <span className="font-mono font-semibold">{rec.deliveryNoteNumber}</span></span>
                        {rec.poNumber && <span>• PO: <span className="font-mono">{rec.poNumber}</span></span>}
                      </div>
                    </td>

                    {/* Batch & Exp */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-800 text-[11px]">
                        {rec.batchNumber || '-'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {rec.expiryDate ? `Exp: ${rec.expiryDate}` : 'Non-exp (Kemasan)'}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {rec.quantityReceived.toLocaleString()} <span className="text-slate-500 font-normal">{rec.unit}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {rec.containerCount} {rec.containerType.split(' ')[0]}
                      </div>
                    </td>

                    {/* Storage Location */}
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-800 truncate max-w-[170px]">
                        {rec.storageLocation}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[170px] mt-0.5">
                        {rec.storageConditions}
                      </div>
                    </td>

                    {/* QC Status */}
                    <td className="py-3 px-4 text-center">
                      {renderStatusBadge(rec.qcStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Lihat Detail Penerimaan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus catatan kedatangan ${rec.grnNumber}?`)) {
                              onDeleteRecord(rec.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">Belum ada barang masuk yang tercatat</p>
                      <p className="text-[11px] text-slate-400">
                        Klik tombol "Penerimaan Barang Baru (GRN)" di atas untuk mencatat kedatangan bahan baku atau kemas.
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kuantitas & Wadah</span>
                  <p className="font-black text-slate-900 text-base mt-1">
                    {selectedRecord.quantityReceived.toLocaleString()} {selectedRecord.unit}
                  </p>
                  <p className="text-slate-500 mt-0.5">Wadah: {selectedRecord.containerCount} kemasan ({selectedRecord.containerType})</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyimpanan & Suhu</span>
                  <p className="font-bold text-slate-900 mt-1">{selectedRecord.storageLocation}</p>
                  <p className="text-slate-500 mt-0.5">{selectedRecord.storageConditions}</p>
                </div>
              </div>

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
    </div>
  );
};
