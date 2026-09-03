import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  X,
  Check,
  CheckCircle2,
  Building2,
  Lock,
  Calendar,
  Info,
  Layers,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { RawMaterial, PackagingMaterial } from '../../../types';
import { GrnMaterialType, GrnRecord } from '../types/grnTypes';
import { MaterialSearchDropdown } from './MaterialSearchDropdown';

interface GrnFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: RawMaterial[];
  packagingMaterials: PackagingMaterial[];
  onSave: (record: Omit<GrnRecord, 'id' | 'createdAt' | 'grnNumber'>) => Promise<void>;
  userName?: string;
}

export const GrnFormModal: React.FC<GrnFormModalProps> = ({
  isOpen,
  onClose,
  rawMaterials,
  packagingMaterials,
  onSave,
  userName = 'Staf Gudang Logistik',
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultExpDate = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +2 years

  const [materialType, setMaterialType] = useState<GrnMaterialType>('raw');
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);

  // Form Fields
  const [distributor, setDistributor] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [receivedDate, setReceivedDate] = useState(todayStr);
  const [expiryDate, setExpiryDate] = useState(defaultExpDate);

  const [quantityReceived, setQuantityReceived] = useState<number | ''>('');
  const [unit, setUnit] = useState('kg');
  const [containerCount, setContainerCount] = useState<number | ''>(1);
  const [containerType, setContainerType] = useState('Drum Fiber (Sealed)');
  const [storageLocation, setStorageLocation] = useState('Warehouse Karantina Bahan Baku (Rak K-01)');
  const [storageConditions, setStorageConditions] = useState('Suhu Ruang Terkendali (15 - 25°C)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-switch defaults when material type changes
  useEffect(() => {
    setSelectedMaterial(null);
    if (materialType === 'raw') {
      setUnit('kg');
      setContainerType('Drum Fiber (Sealed)');
      setStorageLocation('Warehouse Karantina Bahan Baku (Rak K-01)');
      setStorageConditions('Suhu Ruang Terkendali (15 - 25°C)');
      setDistributor('');
    } else {
      setUnit('pcs');
      setContainerType('Karton Box (Double Plastic Wrap)');
      setStorageLocation('Warehouse Karantina Bahan Kemas (Area BK-01)');
      setStorageConditions('Suhu Ruang Terkendali (15 - 25°C)');
      setDistributor('');
    }
  }, [materialType]);

  // Handle selection from dropdown search
  const handleSelectMaterial = (item: any) => {
    setSelectedMaterial(item);
    setFormError(null);
    if (item.unit) setUnit(item.unit);
    if (item.storageConditions) setStorageConditions(item.storageConditions);
    if (materialType === 'packaging' && item.manufacturer) {
      setDistributor(item.manufacturer);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedMaterial) {
      setFormError('Harap pilih salah satu item master material dari daftar pencarian.');
      return;
    }
    if (!distributor.trim()) {
      setFormError('Nama pemasok / distributor wajib diisi.');
      return;
    }
    if (!deliveryNoteNumber.trim()) {
      setFormError('Nomor surat jalan (Delivery Note) wajib diisi.');
      return;
    }
    if (!quantityReceived || Number(quantityReceived) <= 0) {
      setFormError('Jumlah kuantitas yang diterima harus lebih besar dari 0.');
      return;
    }

    const resolvedManufacturer =
      materialType === 'raw'
        ? selectedMaterial.manufacturer || 'PT. Petrona Pacific Chemical'
        : distributor.trim();

    try {
      setIsSubmitting(true);
      await onSave({
        materialType,
        materialId: selectedMaterial.id,
        materialCode: selectedMaterial.code,
        materialName: selectedMaterial.name,
        manufacturer: resolvedManufacturer,
        distributor: distributor.trim(),
        poNumber: poNumber.trim() || `PO-${todayStr.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
        deliveryNoteNumber: deliveryNoteNumber.trim(),
        batchNumber: batchNumber.trim() || `BN-${todayStr.replace(/-/g, '')}-01`,
        receivedDate,
        expiryDate: materialType === 'raw' ? expiryDate : undefined,
        quantityReceived: Number(quantityReceived),
        unit,
        containerCount: Number(containerCount) || 1,
        containerType,
        storageLocation,
        storageConditions,
        qcStatus: 'QUARANTINE',
        qcParametersCount: selectedMaterial.qcParametersCount || 3,
        receivedBy: userName,
      });

      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan penerimaan barang ke sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Form Penerimaan Barang Baru (Werehouse)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {materialType === 'raw'
                  ? 'Pencatatan Kedatangan Bahan Baku & Registrasi Karantina CPKB'
                  : 'Pencatatan Kedatangan Bahan Kemas & Registrasi Karantina CPKB'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: IDENTITAS JENIS & MASTER MATERIAL */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. IDENTITAS JENIS & MASTER MATERIAL :
              </h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold w-fit">
                <Check className="w-3.5 h-3.5" />
                Otomatis Terhubung Master Data
              </span>
            </div>

            {/* Material Type Toggle Switch */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMaterialType('raw')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  materialType === 'raw'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    materialType === 'raw' ? 'bg-emerald-200' : 'bg-emerald-500'
                  }`}
                />
                Bahan Baku (Format B0001)
              </button>

              <button
                type="button"
                onClick={() => setMaterialType('packaging')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  materialType === 'packaging'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    materialType === 'packaging' ? 'bg-blue-200' : 'bg-blue-500'
                  }`}
                />
                Bahan Kemas (Format K0001)
              </button>
            </div>

            {/* Interactive Material Dropdown Search Component */}
            <MaterialSearchDropdown
              type={materialType}
              rawMaterials={rawMaterials}
              packagingMaterials={packagingMaterials}
              selectedCode={selectedMaterial?.code}
              onSelect={handleSelectMaterial}
            />
          </div>

          {/* Section 2: IDENTITAS PRODUSEN, PEMASOK & PENGIRIMAN */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  materialType === 'raw' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
              />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. IDENTITAS PRODUSEN, PEMASOK & PENGIRIMAN
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manufacturer / Produsen */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Nama Produsen / Manufacturer</label>
                  {materialType === 'raw' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold">
                      <Lock className="w-3 h-3" />
                      Non-editable (Dari Master)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold">
                      <Lock className="w-3 h-3" />
                      Sama dengan Pemasok
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value={
                      materialType === 'raw'
                        ? selectedMaterial?.manufacturer || 'Pilih bahan terlebih dahulu'
                        : distributor
                        ? distributor
                        : 'Otomatis mengikuti Nama Pemasok'
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {materialType === 'raw'
                    ? 'Nama pabrik produsen otomatis diambil dari Master Data Bahan Baku.'
                    : 'Untuk kemasan, nama produsen terkunci sama dengan nama pemasok/distributor.'}
                </p>
              </div>

              {/* Distributor / Pemasok */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nama Pemasok / Distributor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={distributor}
                  onChange={(e) => setDistributor(e.target.value)}
                  placeholder={
                    materialType === 'raw'
                      ? 'Contoh: PT Kimia Farma Trading / PT BASF Distribusi'
                      : 'Contoh: PT Mulia Packaging / PT Multi Plastik'
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Pihak distributor/supplier yang mengirimkan barang ke gudang.
                </p>
              </div>
            </div>

            {/* PO, Delivery Note, and Batch Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  No. Purchase Order (PO)
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="PO-2026-0881"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  No. Surat Jalan (Delivery Note) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={deliveryNoteNumber}
                  onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  placeholder="SJ-88912"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  No. Batch / Lot Produsen <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="Contoh: BN-2026-X81 (Opsional)"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Tanggal Diterima di Werehouse <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Min: Hari Ini ({todayStr})
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  *Tanggal kedatangan tidak boleh lebih kecil dari hari ini.
                </p>
              </div>

              {materialType === 'raw' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tanggal Kedaluwarsa (Expired Date) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Diperhitungkan dari masa simpan standar (24 bulan).
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-blue-900 block">Tidak Perlu Tanggal Kedaluwarsa</span>
                    <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                      Penerimaan Bahan Kemas (Packaging) tidak memerlukan pencatatan Expired Date.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: KUANTITAS, KEMASAN & SUHU PENYIMPANAN WEREHOUSE */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                3. KUANTITAS, KEMASAN & SUHU PENYIMPANAN WEREHOUSE
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Quantity Received */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Jumlah Total Diterima <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={quantityReceived}
                  onChange={(e) => setQuantityReceived(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 100"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Unit Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Satuan Ukur</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="kg">kg (Kilogram)</option>
                  <option value="gram">gram (g)</option>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="liter">liter (L)</option>
                  <option value="drum">drum</option>
                  <option value="sak">sak</option>
                </select>
              </div>

              {/* Containers Count */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Jumlah Wadah / Koli</label>
                <input
                  type="number"
                  value={containerCount}
                  onChange={(e) => setContainerCount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 5"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Container Type */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Jenis Wadah Luar</label>
                <select
                  value={containerType}
                  onChange={(e) => setContainerType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="Drum Fiber (Sealed)">Drum Fiber (Sealed)</option>
                  <option value="Karton Box (Double Plastic Wrap)">Karton Box (Double Plastic Wrap)</option>
                  <option value="Jerigen HDPE">Jerigen HDPE</option>
                  <option value="Sak Kertas Kraft">Sak Kertas Kraft</option>
                  <option value="Palletized Shrink Wrap">Palletized Shrink Wrap</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Storage Location */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Lokasi Peletakan Karantina Werehouse
                </label>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Suhu Penyimpanan Werehouse
                </label>
                <div className="relative">
                  <Thermometer className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={storageConditions}
                    onChange={(e) => setStorageConditions(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                materialType === 'raw'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              } disabled:opacity-50`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Registrasi Karantina CPKB'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
