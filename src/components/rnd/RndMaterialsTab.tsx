import React, { useState } from 'react';
import { RawMaterial } from '../../types';
import {
  FlaskConical,
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  AlertCircle
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
  const [isAddingRM, setIsAddingRM] = useState(false);
  const [editingRM, setEditingRM] = useState<RawMaterial | null>(null);

  // Form states
  const [rmCode, setRmCode] = useState('');
  const [rmName, setRmName] = useState('');
  const [rmChemName, setRmChemName] = useState('');
  const [rmCategory, setRmCategory] = useState<'active' | 'excipient' | 'preservative' | 'emulsifier' | 'solvent'>('active');
  const [rmPhMin, setRmPhMin] = useState(5.0);
  const [rmPhMax, setRmPhMax] = useState(7.0);
  const [rmStorage, setRmStorage] = useState('Suhu ruang (15-25°C), kedap udara');
  const [rmSds, setRmSds] = useState('SDS-LMS-2026-01');
  const [rmGrade, setRmGrade] = useState('Cosmetic Grade (USP/Ph. Eur)');
  const [rmSubstitutes, setRmSubstitutes] = useState<string[]>([]);

  const filteredRM = rawMaterials.filter(
    (rm) =>
      rm.name.toLowerCase().includes(searchRM.toLowerCase()) ||
      rm.code.toLowerCase().includes(searchRM.toLowerCase()) ||
      rm.chemicalName.toLowerCase().includes(searchRM.toLowerCase())
  );

  const handleEditRMClick = (rm: RawMaterial) => {
    setEditingRM(rm);
    setIsAddingRM(false);
    setRmCode(rm.code);
    setRmName(rm.name);
    setRmChemName(rm.chemicalName);
    setRmCategory(rm.category);
    setRmPhMin(rm.phMin);
    setRmPhMax(rm.phMax);
    setRmStorage(rm.storageConditions);
    setRmSds(rm.sdsDocNumber);
    setRmGrade(rm.specGrade);
    setRmSubstitutes(rm.approvedSubstitutes);
  };

  const handleSaveRM = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrUpdatedRM: RawMaterial = {
      id: editingRM ? editingRM.id : `rm-${Date.now()}`,
      code: rmCode,
      name: rmName,
      chemicalName: rmChemName,
      category: rmCategory,
      phMin: rmPhMin,
      phMax: rmPhMax,
      storageConditions: rmStorage,
      sdsDocNumber: rmSds,
      specGrade: rmGrade,
      approvedSubstitutes: rmSubstitutes,
      supplierLeadTimeDays: 14,
    };
    onSaveRM(newOrUpdatedRM);
    setIsAddingRM(false);
    setEditingRM(null);
  };

  const toggleRmSubstitute = (code: string) => {
    if (rmSubstitutes.includes(code)) {
      setRmSubstitutes(rmSubstitutes.filter((c) => c !== code));
    } else {
      setRmSubstitutes([...rmSubstitutes, code]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* List Section */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama, atau rumus kimia..."
              value={searchRM}
              onChange={(e) => setSearchRM(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-xs"
            />
          </div>
          {!isAddingRM && (
            <button
              onClick={() => {
                setIsAddingRM(true);
                setEditingRM(null);
                setRmCode(`RM-${rawMaterials.length + 101}`);
                setRmName('');
                setRmChemName('');
                setRmSubstitutes([]);
              }}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Raw Material</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Kode RM</th>
                  <th className="py-3 px-4">Nama Bahan Baku</th>
                  <th className="py-3 px-4">Kategori & Grade</th>
                  <th className="py-3 px-4">Spesifikasi pH</th>
                  <th className="py-3 px-4">Substitusi Resmi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRM.map((rm) => (
                  <tr key={rm.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{rm.code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{rm.name}</div>
                      <div className="text-[10px] text-slate-400 italic">{rm.chemicalName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 border border-purple-200 text-purple-700 uppercase">
                        {rm.category}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">{rm.specGrade}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-slate-700">
                      pH {rm.phMin.toFixed(1)} - {rm.phMax.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-4">
                      {rm.approvedSubstitutes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rm.approvedSubstitutes.map((subCode) => (
                            <span
                              key={subCode}
                              className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[9px] font-bold"
                            >
                              {subCode}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Tidak ada</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditRMClick(rm)}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-600 transition-colors cursor-pointer"
                          title="Edit material"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRM(rm.id)}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer"
                          title="Hapus material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form / Detail Section */}
      <div className="lg:col-span-1">
        {isAddingRM || editingRM ? (
          <form onSubmit={handleSaveRM} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {editingRM ? 'Edit Raw Material' : 'Tambah Raw Material'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddingRM(false);
                  setEditingRM(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kode RM</label>
                <input
                  type="text"
                  required
                  value={rmCode}
                  onChange={(e) => setRmCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Grade Spesifikasi</label>
                <input
                  type="text"
                  required
                  value={rmGrade}
                  onChange={(e) => setRmGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nama Dagang Bahan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Niacinamide (Vitamin B3)"
                value={rmName}
                onChange={(e) => setRmName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nama Kimia / INCI</label>
              <input
                type="text"
                required
                placeholder="Contoh: Pyridine-3-carboxamide"
                value={rmChemName}
                onChange={(e) => setRmChemName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kategori</label>
                <select
                  value={rmCategory}
                  onChange={(e) => setRmCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                >
                  <option value="active">Active (Bahan Aktif)</option>
                  <option value="excipient">Excipient (Pengisi)</option>
                  <option value="preservative">Preservative (Pengawet)</option>
                  <option value="emulsifier">Emulsifier (Pengemulsi)</option>
                  <option value="solvent">Solvent (Pelarut)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nomor Dokumen SDS</label>
                <input
                  type="text"
                  required
                  value={rmSds}
                  onChange={(e) => setRmSds(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Batas pH Min</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={rmPhMin}
                  onChange={(e) => setRmPhMin(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Batas pH Max</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={rmPhMax}
                  onChange={(e) => setRmPhMax(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kondisi Penyimpanan</label>
              <input
                type="text"
                required
                value={rmStorage}
                onChange={(e) => setRmStorage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                Bahan Pengganti yang Disetujui (Substitutes)
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 max-h-28 overflow-y-auto space-y-1">
                {rawMaterials
                  .filter((rm) => rm.code !== rmCode)
                  .map((rm) => (
                    <button
                      type="button"
                      key={rm.id}
                      onClick={() => toggleRmSubstitute(rm.code)}
                      className="w-full flex items-center justify-between text-left text-xs p-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <span className="text-slate-700">
                        <strong className="font-mono text-purple-700">{rm.code}</strong> - {rm.name}
                      </span>
                      {rmSubstitutes.includes(rm.code) && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Bahan alternatif yang boleh digunakan jika terjadi dispensing deviation di lini produksi.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>Simpan Spesifikasi RM</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs py-12">
            <FlaskConical className="w-10 h-10 text-purple-500 mx-auto opacity-70" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Detail Spesifikasi</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Pilih salah satu raw material di samping untuk melihat atau mengedit spesifikasi detail penyimpanan, nomor SDS, dan formula substitusi darurat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
