import React, { useState, useEffect } from 'react';
import {
  Package,
  PackagePlus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  FlaskConical,
  Boxes,
  Truck,
  MinusCircle,
  Scale,
} from 'lucide-react';
import { RawMaterial, PackagingMaterial } from '../../../types';
import { materialService } from '../../rnd/materials/materialService';
import { packagingService } from '../../rnd/materials/packagingService';
import { warehouseService } from '../warehouseService';
import { stockService } from '../stockService';
import { GrnRecord, GrnStats } from '../types/grnTypes';
import { GrnFormModal } from './GrnFormModal';
import { GrnTable } from './GrnTable';
import { QuarantineLabelModal } from './QuarantineLabelModal';
import { StockRawMaterialPage } from './StockRawMaterialPage';
import { StockPackagingPage } from './StockPackagingPage';
import { LocationRelocationPage } from './LocationRelocationPage';
import { useAuth } from '../../../core/auth/AuthContext';
import { MapPin, ArrowRightLeft } from 'lucide-react';

interface WarehouseModuleProps {
  activeSubTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const WarehouseModule: React.FC<WarehouseModuleProps> = ({
  activeSubTab = 'inbound',
  onSelectSubTab,
}) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'inbound');

  // Master Data from RnD
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // GRN records
  const [grnRecords, setGrnRecords] = useState<GrnRecord[]>([]);
  const [isLoadingGrn, setIsLoadingGrn] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quarantineRecordToPrint, setQuarantineRecordToPrint] = useState<GrnRecord | null>(null);

  // Sync subTab prop
  useEffect(() => {
    if (activeSubTab) setCurrentTab(activeSubTab);
  }, [activeSubTab]);

  const loadData = async () => {
    setIsLoadingMaster(true);
    setIsLoadingGrn(true);
    try {
      const [rms, pms, grns] = await Promise.all([
        materialService.getMaterials(),
        packagingService.getPackagingMaterials(),
        warehouseService.getGrnRecords(),
      ]);
      setRawMaterials(rms);
      setPackagingMaterials(pms);
      setGrnRecords(grns);
    } catch (err) {
      console.error('Error loading warehouse data:', err);
    } finally {
      setIsLoadingMaster(false);
      setIsLoadingGrn(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats: GrnStats = warehouseService.calculateStats(grnRecords);

  const handleSaveGrn = async (recordData: Omit<GrnRecord, 'id' | 'createdAt' | 'grnNumber'>) => {
    const saved = await warehouseService.saveGrnRecord(recordData);
    setGrnRecords((prev) => [saved, ...prev]);
    // Synchronize stock lots
    await stockService.getStockLots();
    // Buka dialog cetak label karantina otomatis
    setQuarantineRecordToPrint(saved);
  };

  const handleUpdateGrn = async (id: string, updatedData: Partial<GrnRecord>) => {
    const updated = await warehouseService.updateGrnRecord(id, updatedData);
    setGrnRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    await stockService.getStockLots();
  };

  const handleDeleteGrn = async (id: string) => {
    await warehouseService.deleteGrnRecord(id);
    setGrnRecords((prev) => prev.filter((r) => r.id !== id));
    await stockService.getStockLots();
  };

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    if (onSelectSubTab) onSelectSubTab(tabId);
  };

  return (
    <div className="space-y-6">
      {/* Module Header with Quick Actions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/20 shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900">
                  Warehouse & Logistik CPKB
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Sistem GRN & Stok Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Penerimaan barang, pemisahan stok bahan baku & bahan kemas, kartu stok FEFO, dan rekonsiliasi opname.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              title="Muat ulang data"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Penerimaan Barang Baru (GRN)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Total Kedatangan</span>
              <Truck className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {stats.totalIncoming} <span className="text-xs font-semibold text-slate-400">Penerimaan</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
              <span>Dalam Karantina</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-black text-amber-900 mt-1">
              {stats.inQuarantine} <span className="text-xs font-semibold text-amber-600">Menunggu QC</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
              <span>Bahan Baku (B)</span>
              <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-xl font-black text-teal-900 mt-1">
              {rawMaterials.length} <span className="text-xs font-semibold text-teal-600">Master BB</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-800">
              <span>Bahan Kemas (K)</span>
              <Layers className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-xl font-black text-purple-900 mt-1">
              {packagingMaterials.length} <span className="text-xs font-semibold text-purple-600">Master BK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {currentTab === 'inbound' && (
        <GrnTable
          records={grnRecords}
          onDeleteRecord={handleDeleteGrn}
          onUpdateRecord={handleUpdateGrn}
          onPrintLabel={(rec) => setQuarantineRecordToPrint(rec)}
        />
      )}

      {currentTab === 'stock-raw' && (
        <StockRawMaterialPage
          onSwitchToPackaging={() => handleTabChange('stock-packaging')}
          packagingCount={packagingMaterials.length}
        />
      )}

      {currentTab === 'stock-packaging' && (
        <StockPackagingPage
          onSwitchToRaw={() => handleTabChange('stock-raw')}
          rawCount={rawMaterials.length}
        />
      )}

      {currentTab === 'relocation' && (
        <LocationRelocationPage />
      )}

      {currentTab === 'weighing' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
          <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Ruang Timbang FEFO Bersih CPKB</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hanya material dengan status Lolos QC (Rilis) yang dapat dialokasikan untuk penimbangan batch produksi sesuai First-Expired, First-Out.
          </p>
        </div>
      )}

      {currentTab === 'finished-goods' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
          <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Gudang Produk Jadi (PJ0001+)</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Penyimpanan produk ruahan yang telah dikemas dalam varian ukuran (PJ-V1, PJ-V2) siap kirim ke distributor.
          </p>
        </div>
      )}

      {/* GRN Form Modal Popup */}
      <GrnFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rawMaterials={rawMaterials}
        packagingMaterials={packagingMaterials}
        onSave={handleSaveGrn}
        userName={user?.name || 'Staf Gudang Logistik'}
      />

      {/* Quarantine Label Print Modal */}
      <QuarantineLabelModal
        isOpen={!!quarantineRecordToPrint}
        onClose={() => setQuarantineRecordToPrint(null)}
        record={quarantineRecordToPrint}
      />
    </div>
  );
};
