import React, { useState } from 'react';
import { PackagingMaterial } from '../../types';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  Package
} from 'lucide-react';

interface RndPackagingTabProps {
  packagingMaterials: PackagingMaterial[];
  onSavePM: (pm: PackagingMaterial) => void;
  onDeletePM: (id: string) => void;
}

export const RndPackagingTab: React.FC<RndPackagingTabProps> = ({
  packagingMaterials,
  onSavePM,
  onDeletePM,
}) => {
  const [searchPM, setSearchPM] = useState('');
  const [isAddingPM, setIsAddingPM] = useState(false);
  const [editingPM, setEditingPM] = useState<PackagingMaterial | null>(null);

  // Form states PM
  const [pmCode, setPmCode] = useState('');
  const [pmName, setPmName] = useState('');
  const [pmType, setPmType] = useState<'primary' | 'secondary' | 'tertiary'>('primary');
  const [pmCapacity, setPmCapacity] = useState(20);
  const [pmSpec, setPmSpec] = useState('Acrylic Pot Gold Double Wall');
  const [pmArtwork, setPmArtwork] = useState('v1.0 (BPOM Approved)');

  const filteredPM = packagingMaterials.filter(
    (pm) =>
      pm.name.toLowerCase().includes(searchPM.toLowerCase()) ||
      pm.code.toLowerCase().includes(searchPM.toLowerCase()) ||
      pm.materialSpec.toLowerCase().includes(searchPM.toLowerCase())
  );

  const handleEditPMClick = (pm: PackagingMaterial) => {
    setEditingPM(pm);
    setIsAddingPM(false);
    setPmCode(pm.code);
    setPmName(pm.name);
    setPmType(pm.type);
    setPmCapacity(pm.unitCapacityGrams || 0);
    setPmSpec(pm.materialSpec);
    setPmArtwork(pm.artworkVersion);
  };

  const handleSavePM = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrUpdatedPM: PackagingMaterial = {
      id: editingPM ? editingPM.id : `pm-${Date.now()}`,
      code: pmCode,
      name: pmName,
      type: pmType,
      unitCapacityGrams: pmType === 'primary' ? pmCapacity : undefined,
      materialSpec: pmSpec,
      artworkVersion: pmArtwork,
      leadTimeDays: 21,
    };
    onSavePM(newOrUpdatedPM);
    setIsAddingPM(false);
    setEditingPM(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kemasan..."
              value={searchPM}
              onChange={(e) => setSearchPM(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-xs"
            />
          </div>
          {!isAddingPM && (
            <button
              onClick={() => {
                setIsAddingPM(true);
                setEditingPM(null);
                setPmCode(`K${String(packagingMaterials.length + 1).padStart(4, '0')}`);
                setPmName('');
              }}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan Kemas (K0001)</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Kode PM</th>
                  <th className="py-3 px-4">Nama Kemasan / Deskripsi</th>
                  <th className="py-3 px-4">Tipe Kemasan</th>
                  <th className="py-3 px-4">Kapasitas</th>
                  <th className="py-3 px-4">Spesifikasi Material & Artwork</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredPM.map((pm) => (
                  <tr key={pm.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{pm.code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{pm.name}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                          pm.type === 'primary'
                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                            : pm.type === 'secondary'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {pm.type === 'primary'
                          ? 'Primer (Wadah)'
                          : pm.type === 'secondary'
                          ? 'Sekunder (Box)'
                          : 'Tersier (Karton)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-slate-700">
                      {pm.type === 'primary' ? `${pm.unitCapacityGrams} gram` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">{pm.materialSpec}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Artwork: {pm.artworkVersion}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditPMClick(pm)}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-600 transition-colors cursor-pointer"
                          title="Edit kemasan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePM(pm.id)}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer"
                          title="Hapus kemasan"
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

      {/* Form Section PM */}
      <div className="lg:col-span-1">
        {isAddingPM || editingPM ? (
          <form onSubmit={handleSavePM} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {editingPM ? 'Edit Kemasan' : 'Tambah Kemasan'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddingPM(false);
                  setEditingPM(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kode PM</label>
                <input
                  type="text"
                  required
                  value={pmCode}
                  onChange={(e) => setPmCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Tipe Kemasan</label>
                <select
                  value={pmType}
                  onChange={(e) => setPmType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-semibold"
                >
                  <option value="primary">Primer (Wadah Langsung)</option>
                  <option value="secondary">Sekunder (Dus/Inner Box)</option>
                  <option value="tertiary">Tersier (Master Carton)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nama Dagang Kemasan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Luxury Acrylic Gold Jar"
                value={pmName}
                onChange={(e) => setPmName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            {pmType === 'primary' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kapasitas Bersih (g/mL)</label>
                <input
                  type="number"
                  required
                  value={pmCapacity}
                  onChange={(e) => setPmCapacity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono font-bold"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Spesifikasi Material</label>
              <textarea
                required
                rows={2}
                placeholder="Contoh: PMMA Double-walled, Gold Inner Paint, Silk Screen Printing"
                value={pmSpec}
                onChange={(e) => setPmSpec(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Versi Artwork Desain</label>
              <input
                type="text"
                required
                value={pmArtwork}
                onChange={(e) => setPmArtwork(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>Simpan Spesifikasi PM</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs py-12">
            <Layers className="w-10 h-10 text-purple-500 mx-auto opacity-70" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Master Kemasan CPKB</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Semua kemasan primer yang bersentuhan langsung dengan kosmetik harus terdaftar dengan versi artwork yang tepat demi kesesuaian izin BPOM.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
