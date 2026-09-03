import React, { useState } from 'react';
import { RawMaterial, QCParameter } from '../../types';
import {
  FlaskConical,
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  PlusCircle,
  Eye
} from 'lucide-react';

interface RndMaterialsTabProps {
  rawMaterials: RawMaterial[];
  onSaveRM: (rm: RawMaterial) => void;
  onDeleteRM: (id: string) => void;
}

export const RndMaterialsTab: React.FC<RndMaterialsTabProps> = ({
  rawMaterials,
  onSaveRM,
  onDeleteRM,
}) => {
  const [searchRM, setSearchRM] = useState('');
  
  // Modals visibility states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingRM, setEditingRM] = useState<RawMaterial | null>(null);
  const [selectedRMForDetails, setSelectedRMForDetails] = useState<RawMaterial | null>(null);

  // Form states (Bagian A)
  const [rmCode, setRmCode] = useState('');
  const [rmName, setRmName] = useState('');
  const [rmChemName, setRmChemName] = useState('');
  const [rmCategory, setRmCategory] = useState<'active' | 'excipient' | 'preservative' | 'emulsifier' | 'solvent'>('active');
  const [rmStorage, setRmStorage] = useState('Suhu ruang (15-25°C), kedap udara');
  const [rmSds, setRmSds] = useState('SDS-LMS-2026-01');
  const [rmManufacturer, setRmManufacturer] = useState('');
  const [rmSubstitutes, setRmSubstitutes] = useState<string[]>([]);
  const [rmLeadTime, setRmLeadTime] = useState<number>(14);

  // Form states (Bagian B - QC Parameters)
  const [rmQcParams, setRmQcParams] = useState<QCParameter[]>([]);

  // Import Excel states
  const [pasteData, setPasteData] = useState('');
  const [importPreview, setImportPreview] = useState<RawMaterial[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  const filteredRM = rawMaterials.filter(
    (rm) =>
      rm.name.toLowerCase().includes(searchRM.toLowerCase()) ||
      rm.code.toLowerCase().includes(searchRM.toLowerCase()) ||
      rm.chemicalName.toLowerCase().includes(searchRM.toLowerCase()) ||
      (rm.manufacturer && rm.manufacturer.toLowerCase().includes(searchRM.toLowerCase()))
  );

  // Initialize form with default parameters
  const openAddRMModal = () => {
    setEditingRM(null);
    setRmCode(`B${String(rawMaterials.length + 1).padStart(4, '0')}`);
    setRmName('');
    setRmChemName('');
    setRmCategory('active');
    setRmStorage('Suhu ruang (15-25°C), kering & wadah rapat');
    setRmSds(`SDS-LMS-B${String(rawMaterials.length + 1).padStart(4, '0')}`);
    setRmManufacturer('');
    setRmSubstitutes([]);
    setRmLeadTime(14);
    
    // Otomatis terisi 7 parameter utama (Bentuk, Warna, Bau, pH, Kelarutan, Densitas, Viskositas)
    setRmQcParams([
      { name: 'Bentuk', specification: 'Bubuk' },
      { name: 'Warna', specification: 'Putih' },
      { name: 'Bau', specification: 'Tidak berbau' },
      { name: 'pH', specification: '5.5 - 7.5' },
      { name: 'Kelarutan', specification: 'Mudah larut dalam air' },
      { name: 'Densitas', specification: '1.2 g/cm³' },
      { name: 'Viskositas', specification: 'N/A' }
    ]);

    setShowFormModal(true);
  };

  const handleEditRMClick = (rm: RawMaterial) => {
    setEditingRM(rm);
    setRmCode(rm.code);
    setRmName(rm.name);
    setRmChemName(rm.chemicalName);
    setRmCategory(rm.category);
    setRmStorage(rm.storageConditions);
    setRmSds(rm.sdsDocNumber);
    setRmManufacturer(rm.manufacturer || '');
    setRmSubstitutes(rm.approvedSubstitutes || []);
    setRmLeadTime(rm.supplierLeadTimeDays || 14);
    
    // Jika data lama tidak memiliki qcParameters, sediakan parameter default
    setRmQcParams(rm.qcParameters && rm.qcParameters.length > 0 
      ? [...rm.qcParameters]
      : [
          { name: 'Bentuk', specification: 'Bubuk' },
          { name: 'Warna', specification: 'Putih' },
          { name: 'Bau', specification: 'Tidak berbau' },
          { name: 'pH', specification: '5.5 - 7.5' },
          { name: 'Kelarutan', specification: 'Mudah larut dalam air' },
          { name: 'Densitas', specification: '1.2 g/cm³' },
          { name: 'Viskositas', specification: 'N/A' }
        ]
    );

    setShowFormModal(true);
  };

  const handleAddQcParam = () => {
    setRmQcParams([...rmQcParams, { name: '', specification: '' }]);
  };

  const handleRemoveQcParam = (index: number) => {
    setRmQcParams(rmQcParams.filter((_, i) => i !== index));
  };

  const handleQcParamChange = (index: number, field: keyof QCParameter, value: string) => {
    const updated = [...rmQcParams];
    updated[index] = { ...updated[index], [field]: value };
    setRmQcParams(updated);
  };

  const toggleRmSubstitute = (code: string) => {
    if (rmSubstitutes.includes(code)) {
      setRmSubstitutes(rmSubstitutes.filter((c) => c !== code));
    } else {
      setRmSubstitutes([...rmSubstitutes, code]);
    }
  };

  const handleSaveRM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmCode || !rmName || !rmChemName) return;

    // Filter out qc parameters that are completely empty
    const cleanQcParams = rmQcParams.filter(p => p.name.trim() !== '');

    const newOrUpdatedRM: RawMaterial = {
      id: editingRM ? editingRM.id : `rm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      code: rmCode,
      name: rmName,
      chemicalName: rmChemName,
      category: rmCategory,
      storageConditions: rmStorage,
      sdsDocNumber: rmSds,
      approvedSubstitutes: rmSubstitutes,
      manufacturer: rmManufacturer,
      qcParameters: cleanQcParams,
      supplierLeadTimeDays: Number(rmLeadTime) || 14,
    };

    onSaveRM(newOrUpdatedRM);
    setShowFormModal(false);
    setEditingRM(null);
  };

  // --- PARSE COPY-PASTE FROM EXCEL ---
  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPasteData(text);
    if (!text.trim()) {
      setImportPreview([]);
      setImportError(null);
      return;
    }

    try {
      const rows = text.split('\n');
      const parsedMaterials: RawMaterial[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;

        const cols = row.split('\t'); // Excel outputs TAB separated values
        if (cols.length < 3) {
          // Fallback to comma if they copy CSV format
          const commaCols = row.split(',');
          if (commaCols.length >= 3) {
            parseRow(commaCols, i + 1, parsedMaterials);
          }
          continue;
        }
        parseRow(cols, i + 1, parsedMaterials);
      }

      setImportPreview(parsedMaterials);
      setImportError(null);
    } catch (err: any) {
      setImportError(`Gagal menganalisis baris data: ${err.message}`);
    }
  };

  const parseRow = (cols: string[], rowIndex: number, list: RawMaterial[]) => {
    const code = cols[0]?.trim() || `B${String(rawMaterials.length + list.length + 1).padStart(4, '0')}`;
    const name = cols[1]?.trim();
    const chemicalName = cols[2]?.trim() || '';
    
    if (!name) {
      throw new Error(`Nama bahan pada baris ke-${rowIndex} tidak boleh kosong.`);
    }

    // Category mapping & normalization
    let category: any = 'active';
    const rawCat = cols[3]?.trim().toLowerCase() || 'active';
    if (rawCat.includes('excipient') || rawCat.includes('pengisi')) category = 'excipient';
    else if (rawCat.includes('preservative') || rawCat.includes('pengawet')) category = 'preservative';
    else if (rawCat.includes('emulsifier') || rawCat.includes('pengemulsi')) category = 'emulsifier';
    else if (rawCat.includes('solvent') || rawCat.includes('pelarut')) category = 'solvent';

    const manufacturer = cols[4]?.trim() || 'General Manufacturer';
    const storageConditions = cols[5]?.trim() || 'Suhu ruang (15-25°C), kedap udara';
    const sdsDocNumber = cols[6]?.trim() || `SDS-LMS-${code}`;
    
    // Substitutes (comma separated) in column 8 (Index 7)
    const rawSubstitutes = cols[7]?.trim();
    const approvedSubstitutes = rawSubstitutes 
      ? rawSubstitutes.split(',').map(s => s.trim()).filter(Boolean) 
      : [];

    // QC parameters start from index 8 onwards in pairs: Parameter 1, Syarat 1, Parameter 2, Syarat 2, ...
    const qcParameters: QCParameter[] = [];
    
    // Default parameters list if no columns are provided for parameters
    if (cols.length <= 8) {
      qcParameters.push(
        { name: 'Bentuk', specification: 'Bubuk' },
        { name: 'Warna', specification: 'Putih' },
        { name: 'Bau', specification: 'Tidak berbau' },
        { name: 'pH', specification: '5.5 - 7.5' },
        { name: 'Kelarutan', specification: 'Larut dalam air' },
        { name: 'Densitas', specification: '1.2 g/cm³' },
        { name: 'Viskositas', specification: 'N/A' }
      );
    } else {
      // Loop over columns starting from index 8 in pairs
      for (let j = 8; j < cols.length; j += 2) {
        const pName = cols[j]?.trim();
        const pSpec = cols[j+1]?.trim() || '-';
        if (pName) {
          qcParameters.push({ name: pName, specification: pSpec });
        }
      }
    }

    list.push({
      id: `rm-bulk-${Date.now()}-${rowIndex}-${Math.random().toString(36).substr(2, 4)}`,
      code,
      name,
      chemicalName,
      category,
      storageConditions,
      sdsDocNumber,
      approvedSubstitutes,
      manufacturer,
      qcParameters,
      supplierLeadTimeDays: 14
    });
  };

  const handleExecuteImport = () => {
    if (importPreview.length === 0) return;

    // Save all to database
    importPreview.forEach(rm => {
      onSaveRM(rm);
    });

    setShowImportModal(false);
    setPasteData('');
    setImportPreview([]);
    setImportError(null);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode, nama, pabrikan, atau rumus kimia..."
            value={searchRM}
            onChange={(e) => setSearchRM(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-2xs"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Tombol Import Excel */}
          <button
            onClick={() => {
              setPasteData('');
              setImportPreview([]);
              setImportError(null);
              setShowImportModal(true);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Import bahan baku dari Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel / Salin Data</span>
          </button>

          {/* Tombol Tambah Bahan Baru */}
          <button
            onClick={openAddRMModal}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan Baku</span>
          </button>
        </div>
      </div>

      {/* Main Table List (Lebar Penuh & Clean) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Kode RM</th>
                <th className="py-3 px-4">Nama Dagang Bahan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Pabrikan (Manufacturer)</th>
                <th className="py-3 px-4">Kondisi Penyimpanan & SDS</th>
                <th className="py-3 px-4">Parameter Acuan QC (RnD)</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRM.length > 0 ? (
                filteredRM.map((rm) => (
                  <tr 
                    key={rm.id} 
                    className="hover:bg-purple-50/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedRMForDetails(rm)}
                  >
                    {/* Kode */}
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{rm.code}</td>
                    
                    {/* Nama */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-800 break-words">{rm.name}</div>
                    </td>
                    
                    {/* Kategori */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 border border-purple-200 text-purple-700 uppercase">
                        {rm.category}
                      </span>
                    </td>
                    
                    {/* Pabrikan */}
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">
                      {rm.manufacturer || <span className="text-slate-400 italic font-normal">Tidak diisi</span>}
                    </td>
                    
                    {/* Penyimpanan & SDS */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 leading-tight font-medium max-w-[200px] truncate" title={rm.storageConditions}>
                        {rm.storageConditions}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">SDS: {rm.sdsDocNumber}</div>
                    </td>
                    
                    {/* QC Parameters Count Only */}
                    <td className="py-3.5 px-4 font-bold text-slate-600">
                      {rm.qcParameters && rm.qcParameters.length > 0 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold font-mono">
                          {rm.qcParameters.length} Parameter
                        </span>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          0 Parameter
                        </span>
                      )}
                    </td>
                    
                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditRMClick(rm)}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-600 transition-colors cursor-pointer"
                          title="Edit bahan baku & parameter"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRM(rm.id)}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer"
                          title="Hapus bahan baku"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data bahan baku yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================= */}
      {/* MODAL DIALOG: TAMBAH / EDIT BAHAN BAKU  */}
      {/* ======================================= */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setShowFormModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-slate-100 pb-4 mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    {editingRM ? `Edit Spesifikasi: ${editingRM.code}` : 'Tambah Bahan Baku Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Definisikan identitas fisik bahan baku beserta standar mutu parameter QC Laboratorium
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRM} className="flex-1 overflow-y-auto pr-1 space-y-6">
              {/* BAGIAN A: INFORMASI UTAMA BAHAN BAKU */}
              <div>
                <h4 className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-700"></span>
                  Bagian A: Informasi Utama Bahan Baku
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Kode RM */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kode RM</label>
                    <input
                      type="text"
                      required
                      value={rmCode}
                      onChange={(e) => setRmCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono font-bold"
                      placeholder="B0001"
                    />
                  </div>

                  {/* Nama Dagang */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nama Dagang Bahan</label>
                    <input
                      type="text"
                      required
                      value={rmName}
                      onChange={(e) => setRmName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                      placeholder="Contoh: Niacinamide PC (Vitamin B3)"
                    />
                  </div>

                  {/* Nama INCI */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nama Kimia / INCI</label>
                    <input
                      type="text"
                      required
                      value={rmChemName}
                      onChange={(e) => setRmChemName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                      placeholder="Contoh: Niacinamide"
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kategori</label>
                    <select
                      value={rmCategory}
                      onChange={(e) => setRmCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                    >
                      <option value="active">Active (Bahan Aktif)</option>
                      <option value="excipient">Excipient (Bahan Pembantu)</option>
                      <option value="preservative">Preservative (Pengawet)</option>
                      <option value="emulsifier">Emulsifier (Pengemulsi)</option>
                      <option value="solvent">Solvent (Pelarut)</option>
                    </select>
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Produsen (Manufacturer)</label>
                    <input
                      type="text"
                      value={rmManufacturer}
                      onChange={(e) => setRmManufacturer(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                      placeholder="Contoh: DSM Nutritional Products"
                    />
                  </div>

                  {/* SDS Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nomor Dokumen SDS</label>
                    <input
                      type="text"
                      required
                      value={rmSds}
                      onChange={(e) => setRmSds(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono"
                      placeholder="SDS-LMS-B0001"
                    />
                  </div>

                  {/* Lead Time Supplier */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Lead Time Supplier (Hari)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={rmLeadTime}
                      onChange={(e) => setRmLeadTime(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono"
                      placeholder="14"
                    />
                  </div>

                  {/* Kondisi Penyimpanan */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kondisi Penyimpanan</label>
                    <input
                      type="text"
                      required
                      value={rmStorage}
                      onChange={(e) => setRmStorage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                      placeholder="Contoh: Wadah tertutup rapat, terlindung cahaya pada suhu dingin (2-8°C)"
                    />
                  </div>
                </div>

                {/* Dropdown Multi-Select Substitusi (Hanya Kategori yang Sama) */}
                <div className="mt-4">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Bahan Pengganti Resmi yang Disetujui (Substitutes)
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-24 overflow-y-auto space-y-1">
                    {rawMaterials
                      .filter((rm) => rm.code !== rmCode && rm.category === rmCategory)
                      .map((rm) => (
                        <button
                          type="button"
                          key={rm.id}
                          onClick={() => toggleRmSubstitute(rm.code)}
                          className="w-full flex items-center justify-between text-left text-xs p-1.5 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                        >
                          <span className="text-slate-700">
                            <strong className="font-mono text-purple-700">{rm.code}</strong> - {rm.name}
                          </span>
                          {rmSubstitutes.includes(rm.code) && <Check className="w-4 h-4 text-emerald-600" />}
                        </button>
                      ))}
                    {rawMaterials.filter((rm) => rm.code !== rmCode && rm.category === rmCategory).length === 0 && (
                      <p className="text-[10px] text-slate-400 italic">Belum ada bahan lain dengan kategori yang sama ({rmCategory})</p>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 leading-tight">
                    *Hanya menampilkan bahan baku lain dalam kategori <strong className="uppercase">{rmCategory}</strong> yang sama demi menjaga integritas formula.
                  </p>
                </div>
              </div>

              {/* BAGIAN B: PARAMETER & SPESIFIKASI ANALISA QC */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-700"></span>
                    Bagian B: Spesifikasi Mutu Analisa QC
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQcParam}
                    className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Parameter Baru</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  Daftar di bawah ini akan diisi secara otomatis sebagai parameter standar. Anda dapat menghapus, mengubah, atau menambahkan kriteria uji spesifik acuan Laboratorium QC.
                </p>

                {/* Column Headers for Parameters */}
                {rmQcParams.length > 0 && (
                  <div className="flex gap-2.5 mb-2 px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <div className="flex-1">Parameter</div>
                    <div className="flex-1">Syarat</div>
                    <div className="w-10"></div> {/* Spacer to balance delete button */}
                  </div>
                )}

                {/* Dynamic Parameter Grid */}
                <div className="space-y-2.5">
                  {rmQcParams.map((param, index) => (
                    <div key={index} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 p-2 rounded-xl">
                      {/* Nama Parameter */}
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={param.name}
                          onChange={(e) => handleQcParamChange(index, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-600 font-bold"
                          placeholder="Nama Parameter (misal: Kadar Air)"
                        />
                      </div>
                      {/* Syarat Spesifikasi */}
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={param.specification}
                          onChange={(e) => handleQcParamChange(index, 'specification', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                          placeholder="Syarat / Acuan (misal: Max 0.5%)"
                        />
                      </div>
                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => handleRemoveQcParam(index)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all cursor-pointer shrink-0"
                        title="Hapus parameter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {rmQcParams.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-400">
                      Tidak ada parameter mutu QC. Klik "Tambah Parameter Baru" di atas untuk membuat acuan uji.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Submit */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Master Bahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DIALOG: BULK IMPORT EXCEL (COPY-PASTE / TABULAR)    */}
      {/* ======================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setShowImportModal(false)}
          ></div>

          <div className="relative bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Import Master Bahan Baku dari Excel</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Salin & tempel tabel Excel Anda untuk memasukkan puluhan bahan beserta spesifikasi QC-nya secara instan
                  </p>
                </div>
              </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* Petunjuk Format */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-extrabold text-slate-800 uppercase block mb-1">📋 Petunjuk Urutan Kolom di Excel:</span>
                Susun kolom di lembar Excel Anda berurutan sebagai berikut, lalu salin (<kbd className="font-sans bg-white px-1.5 py-0.5 border rounded shadow-2xs font-bold text-slate-800">Ctrl+C</kbd>) baris datanya:
                <div className="mt-2 font-mono text-[10px] bg-white border border-slate-100 rounded-lg p-2.5 overflow-x-auto whitespace-nowrap text-purple-700">
                  Kode RM <span className="text-slate-400">➔</span> Nama Dagang <span className="text-slate-400">➔</span> Nama INCI <span className="text-slate-400">➔</span> Kategori <span className="text-slate-400">➔</span> Produsen <span className="text-slate-400">➔</span> Penyimpanan <span className="text-slate-400">➔</span> No. SDS <span className="text-slate-400">➔</span> Substitusi (koma) <span className="text-slate-400">➔</span> Param 1 <span className="text-slate-400">➔</span> Syarat 1 <span className="text-slate-400">➔</span> Param 2 <span className="text-slate-400">➔</span> Syarat 2...
                </div>
                <p className="mt-1.5 text-slate-400">
                  *Kategori diisi dengan kata kunci: <code className="text-purple-600 font-bold font-mono">active</code> (Bahan Aktif), <code className="text-purple-600 font-bold font-mono">excipient</code> (Pengisi), <code className="text-purple-600 font-bold font-mono">preservative</code> (Pengawet), <code className="text-purple-600 font-bold font-mono">emulsifier</code> (Pengemulsi), <code className="text-purple-600 font-bold font-mono">solvent</code> (Pelarut).
                </p>
              </div>

              {/* Paste Textarea */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Tempel (Paste) Data di Sini:</label>
                <textarea
                  value={pasteData}
                  onChange={handlePasteChange}
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-mono focus:outline-none focus:bg-white focus:border-purple-600 placeholder-slate-400"
                  placeholder="B0001	Niacinamide PC	Niacinamide	active	DSM Products	Suhu ruang	SDS-101	B0002,B0003	Bentuk	Bubuk	Warna	Putih	pH	5.5 - 7.5"
                ></textarea>
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Parsing */}
              {importPreview.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    🔍 Pratinjau Hasil Parsing ({importPreview.length} Bahan Baku):
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                        <tr className="text-slate-600 font-bold uppercase">
                          <th className="p-2 pl-3">Kode</th>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2">Produsen</th>
                          <th className="p-2">Penyimpanan</th>
                          <th className="p-2">Substitusi</th>
                          <th className="p-2 pr-3">Parameter QC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 bg-white font-medium">
                        {importPreview.map((rm, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2 pl-3 font-mono font-bold text-purple-700">{rm.code}</td>
                            <td className="p-2 font-bold text-slate-800">{rm.name}</td>
                            <td className="p-2 uppercase text-[9px] font-bold text-purple-600">{rm.category}</td>
                            <td className="p-2">{rm.manufacturer}</td>
                            <td className="p-2 truncate max-w-[120px]">{rm.storageConditions}</td>
                            <td className="p-2 font-mono">
                              {rm.approvedSubstitutes.length > 0 ? rm.approvedSubstitutes.join(', ') : '-'}
                            </td>
                            <td className="p-2 pr-3">
                              <div className="flex flex-wrap gap-1 max-w-[160px]">
                                {rm.qcParameters.map((p, pIdx) => (
                                  <span key={pIdx} className="bg-slate-100 border border-slate-200 px-1 rounded text-[8px] whitespace-nowrap">
                                    {p.name}: {p.specification}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importPreview.length === 0}
                onClick={handleExecuteImport}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  importPreview.length > 0 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Import Banyak Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL DIALOG: DETAIL BAHAN BAKU        */}
      {/* ======================================= */}
      {selectedRMForDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setSelectedRMForDetails(null)}
          ></div>

          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedRMForDetails(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-slate-100 pb-4 mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedRMForDetails.category}
                    </span>
                    <span className="font-mono font-bold text-xs text-purple-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {selectedRMForDetails.code}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 mt-1">
                    {selectedRMForDetails.name}
                  </h3>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              {/* Bagian A */}
              <div>
                <h4 className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-700"></span>
                  Bagian A: Spesifikasi Teknis & Identitas
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Nama Kimia / INCI Name</span>
                    <span className="font-bold text-slate-800 italic mt-0.5 block break-words">
                      {selectedRMForDetails.chemicalName || <span className="text-slate-400 font-normal">Tidak ada</span>}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Pabrikan (Manufacturer)</span>
                    <span className="font-bold text-slate-800 mt-0.5 block break-words">
                      {selectedRMForDetails.manufacturer || <span className="text-slate-400 font-normal">Tidak diisi</span>}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Nomor Dokumen SDS</span>
                    <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                      {selectedRMForDetails.sdsDocNumber}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Lead Time Suplier</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {selectedRMForDetails.supplierLeadTimeDays || 14} Hari
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Kondisi Penyimpanan</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">
                      {selectedRMForDetails.storageConditions}
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bahan Substitusi yang Disetujui</span>
                    {selectedRMForDetails.approvedSubstitutes && selectedRMForDetails.approvedSubstitutes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedRMForDetails.approvedSubstitutes.map((subCode) => {
                          const subRM = rawMaterials.find(r => r.code === subCode);
                          return (
                            <span key={subCode} className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-purple-700 text-[10px]">
                              {subCode} {subRM ? `- ${subRM.name}` : ''}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Tidak ada bahan substitusi yang disetujui</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bagian B */}
              <div>
                <h4 className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-700"></span>
                  Bagian B: Spesifikasi Mutu Laboratorium QC ({selectedRMForDetails.qcParameters?.length || 0} Kriteria)
                </h4>

                {selectedRMForDetails.qcParameters && selectedRMForDetails.qcParameters.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                          <th className="py-2.5 px-4 w-1/2">Parameter Analisa</th>
                          <th className="py-2.5 px-4 w-1/2">Syarat / Batas Penerimaan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white font-medium">
                        {selectedRMForDetails.qcParameters.map((param, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40">
                            <td className="py-2.5 px-4 font-bold text-slate-800">{param.name}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">{param.specification}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-xs text-slate-400">
                    Bahan baku ini tidak memiliki kriteria QC.
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRMForDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
