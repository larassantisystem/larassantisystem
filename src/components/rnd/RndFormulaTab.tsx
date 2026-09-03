import React, { useState } from 'react';
import { BulkFormulation, RawMaterial } from '../../types';
import { useAuth } from '../../core/auth/AuthContext';
import { canWriteModule } from '../../core/auth/permissionGuard';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface RndFormulaTabProps {
  formulations: BulkFormulation[];
  rawMaterials: RawMaterial[];
  selectedFormulation: BulkFormulation | null;
  onSelectFormulation: (f: BulkFormulation) => void;
  onSaveFormula: (f: BulkFormulation) => void;
}

export const RndFormulaTab: React.FC<RndFormulaTabProps> = ({
  formulations,
  rawMaterials,
  selectedFormulation,
  onSelectFormulation,
  onSaveFormula,
}) => {
  const { user } = useAuth();
  const canWrite = canWriteModule(user, 'rnd');

  const [isAddingFormula, setIsAddingFormula] = useState(false);

  // Form states for formula
  const [fCode, setFCode] = useState('');
  const [fName, setFName] = useState('');
  const [fPh, setFPh] = useState(5.5);
  const [fPhTol, setFPhTol] = useState(0.3);
  const [fViscosity, setFViscosity] = useState('35,000 - 45,000 cPs');
  const [fGravity, setFGravity] = useState(1.025);
  const [fInstructions, setFInstructions] = useState('');
  const [fIngredients, setFIngredients] = useState<{ rawMaterialCode: string; percentage: number }[]>([
    { rawMaterialCode: 'RM-106', percentage: 100 },
  ]);

  const handleAddIngredientRow = () => {
    setFIngredients([...fIngredients, { rawMaterialCode: rawMaterials[0]?.code || 'RM-101', percentage: 0 }]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setFIngredients(fIngredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredientRow = (index: number, field: 'rawMaterialCode' | 'percentage', value: any) => {
    const updated = [...fIngredients];
    if (field === 'percentage') {
      updated[index].percentage = Number(value);
    } else {
      updated[index].rawMaterialCode = value;
    }
    setFIngredients(updated);
  };

  const handleSaveFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFormula: BulkFormulation = {
      id: `form-${Date.now()}`,
      code: fCode,
      name: fName,
      bulkQuantityKg: 100,
      targetPh: fPh,
      phTolerance: fPhTol,
      targetViscosity: fViscosity,
      gravityTarget: fGravity,
      mixingInstructions: fInstructions,
      ingredients: fIngredients,
    };
    onSaveFormula(newFormula);
    setIsAddingFormula(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {!canWrite && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-800">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Mode Akses Terbatas (Read-Only):</span> Anda memiliki hak akses baca khusus R&D. Formulir penambahan dan pengubahan resep formula bulk dinonaktifkan.
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900 uppercase">
            Hanya Lihat
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Formulasi */}
        <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Daftar Formulasi Bulk</h3>
          {!isAddingFormula && canWrite && (
            <button
              onClick={() => {
                setIsAddingFormula(true);
                setFCode(`FORM-0${formulations.length + 1}`);
                setFName('');
                setFIngredients([{ rawMaterialCode: rawMaterials[0]?.code || 'RM-101', percentage: 100 }]);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-[10px] font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Formula</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {formulations.map((f, fIdx) => (
            <button
              key={f.id}
              onClick={() => {
                onSelectFormulation(f);
                setIsAddingFormula(false);
              }}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 relative overflow-hidden group cursor-pointer ${
                selectedFormulation?.id === f.id
                  ? 'bg-purple-50/80 border-purple-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-purple-50/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-slate-400">#{fIdx + 1}</span>
                  <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100/50 px-1.5 py-0.5 rounded">{f.code}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Batch: {f.bulkQuantityKg} Kg</span>
              </div>
              <div className="font-bold text-xs text-slate-800 group-hover:text-purple-900 transition-colors leading-relaxed">
                {f.name}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                <span>pH Target: {f.targetPh}</span>
                <span>{f.ingredients.length} Bahan Baku</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detailed View / Form Formula */}
      <div className="lg:col-span-2">
        {isAddingFormula ? (
          <form onSubmit={handleSaveFormulaSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Formulir Resep Bulk Baru</h4>
              <button
                type="button"
                onClick={() => setIsAddingFormula(false)}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kode Formula</label>
                <input
                  type="text"
                  required
                  value={fCode}
                  onChange={(e) => setFCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nama Formulasi Bulk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Brightening Emulsion Serum Gold"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                />
              </div>
            </div>

            {/* Ingredients list editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Komposisi Bahan Baku (%)</label>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="text-xs text-purple-700 hover:text-purple-800 flex items-center gap-1 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Bahan</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {fIngredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="w-6 text-center font-mono font-bold text-xs text-slate-400 shrink-0">
                      #{idx + 1}
                    </span>
                    <select
                      value={ing.rawMaterialCode}
                      onChange={(e) => handleUpdateIngredientRow(idx, 'rawMaterialCode', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                    >
                      {rawMaterials.map((rm) => (
                        <option key={rm.id} value={rm.code}>
                          {rm.code} - {rm.name}
                        </option>
                      ))}
                    </select>
                    <div className="w-28 relative rounded-lg shadow-xs">
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0.01"
                        max="100"
                        placeholder="Persen"
                        value={ing.percentage || ''}
                        onChange={(e) => handleUpdateIngredientRow(idx, 'percentage', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 text-right pr-6 focus:outline-none font-mono font-bold"
                      />
                      <span className="absolute inset-y-0 right-2 flex items-center text-xs text-slate-400 font-bold">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Total Formulasi:</span>
                <span
                  className={`font-mono font-bold ${
                    Math.abs(fIngredients.reduce((s, i) => s + i.percentage, 0) - 100) < 0.01
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {fIngredients.reduce((s, i) => s + i.percentage, 0).toFixed(2)} % / 100%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">pH Target</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={fPh}
                  onChange={(e) => setFPh(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Toleransi pH (±)</label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={fPhTol}
                  onChange={(e) => setFPhTol(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Viskositas Target</label>
                <input
                  type="text"
                  required
                  value={fViscosity}
                  onChange={(e) => setFViscosity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Berat Jenis (g/mL)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={fGravity}
                  onChange={(e) => setFGravity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Instruksi Pencampuran (Mixing SOP)</label>
              <textarea
                rows={4}
                placeholder="Tuliskan langkah-langkah pencampuran homogenisasi..."
                value={fInstructions}
                onChange={(e) => setFInstructions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 font-sans leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>Simpan & Rilis Formula</span>
              </button>
            </div>
          </form>
        ) : selectedFormulation ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  {selectedFormulation.code}
                </span>
                <h2 className="text-base font-extrabold text-slate-800 mt-1.5">{selectedFormulation.name}</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Rilis Sistem QA</span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ISO 22716 / CPKB Rilis</span>
                </span>
              </div>
            </div>

            {/* Formulation breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ingredients Breakdown */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Komposisi Bahan Baku</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {selectedFormulation.ingredients.map((ing, i) => {
                    const rm = rawMaterials.find((r) => r.code === ing.rawMaterialCode);
                    return (
                      <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-purple-50/40 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 text-center font-mono font-bold text-[11px] text-slate-400">
                            #{i + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800">{rm ? rm.name : ing.rawMaterialCode}</div>
                            <div className="text-[10px] text-purple-700 font-mono">
                              {ing.rawMaterialCode} • {rm ? rm.category : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-purple-950 text-sm">{ing.percentage.toFixed(2)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Physical & Technical Specifications */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spesifikasi Fisiko-Kimia</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase">pH Target</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block font-mono">
                      {selectedFormulation.targetPh} <span className="text-xs text-purple-700">± {selectedFormulation.phTolerance}</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase">Berat Jenis</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block font-mono">
                      {selectedFormulation.gravityTarget.toFixed(3)} <span className="text-[10px] text-purple-700">g/mL</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center col-span-2">
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase">Viskositas (Kekentalan)</span>
                    <span className="text-xs font-bold text-purple-800 mt-1 block font-mono">
                      {selectedFormulation.targetViscosity}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1.5">
                  <div className="text-[10px] font-bold text-purple-800 uppercase">Keterangan Deviasi Diizinkan</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Jika terjadi penyimpangan pH &ge; 0.5 unit saat proses mixing, penyesuaian harus disetujui QA & Manager Produksi via modul deviasi CPKB. Bahan pengganti (substitute) resmi diperbolehkan terdaftar pada spesifikasi RM.
                  </p>
                </div>
              </div>
            </div>

            {/* Mixing instructions SOP */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SOP Instruksi Mixer Adonan</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-line">
                {selectedFormulation.mixingInstructions}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 py-16 shadow-xs">
            <Sliders className="w-10 h-10 text-purple-500 mx-auto opacity-70" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Detail Formulasi</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Pilih salah satu formulasi di samping untuk menilik komposisi persentase bahan, instruksi pencampuran, serta parameter lab.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
